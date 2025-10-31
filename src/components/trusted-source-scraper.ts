/**
 * Trusted Source Scraper
 *
 * Collects high-confidence citations by scraping authoritative domains.
 * Prioritizes .gov, .edu, and elite business research institutions (McKinsey, HBR, Gartner, Statista, etc.)
 * while respecting basic scraping protections (robots.txt, rate limiting, user-agent rotation).
 */

import https from 'https';
import { URL } from 'url';
import { GoogleSearchScraper, GoogleSearchResult } from './google-search-scraper';
import { PureWebScraper, RealScrapedResult } from './pure-web-scraper';
import { RealMarketDataFetcher, MarketDataSource } from './real-market-data-fetcher';
import {
  Citation,
  CitationConfidence,
  CitationSourceType,
} from '../models/citations';

export interface TrustedSourceScraperOptions {
  industry?: string;
  maxResults?: number;
  minConfidence?: CitationConfidence;
  includeMarketFeeds?: boolean;
}

export interface TrustedSourceEvidence {
  citationId: string;
  snippet: string;
  keyFacts: string[];
  domainTrustScore: number; // 0-100
  robotsAllowed: boolean;
  sourceCategory: 'government' | 'education' | 'consulting' | 'business' | 'media';
}

export interface TrustedCitationResult {
  citations: Citation[];
  evidences: TrustedSourceEvidence[];
  rejectedSources: Array<{ url: string; reason: string }>;
  metadata: {
    totalCandidates: number;
    trustedCandidates: number;
    query: string;
    generatedAt: string;
  };
}

/**
 * Adaptive scraper with user-agent rotation and basic rate limiting.
 */
class AdaptiveScraper {
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; rv:122.0) Gecko/20100101 Firefox/122.0',
  ];

  private domainLastRequest: Map<string, number> = new Map();
  private robotsCache: Map<string, { allowed: boolean; fetchedAt: number }> = new Map();
  private minDelayMs = 1200;

  async scrape(url: string): Promise<{ cleanText: string; html: string; robotsAllowed: boolean }> {
    const urlObj = new URL(url);
    const robotsAllowed = await this.isAllowedByRobots(urlObj);

    if (!robotsAllowed) {
      return { cleanText: '', html: '', robotsAllowed: false };
    }

    await this.respectRateLimit(urlObj.hostname);

    for (let attempt = 0; attempt < 3; attempt++) {
      const userAgent = this.userAgents[(attempt + Math.floor(Math.random() * this.userAgents.length)) % this.userAgents.length];

      try {
        const html = await this.makeRequest(urlObj, userAgent, attempt);
        const cleanText = this.cleanHtml(html);
        return { cleanText, html, robotsAllowed: true };
      } catch (error) {
        if (attempt === this.userAgents.length - 1) {
          throw error;
        }
        await this.delay(500 * (attempt + 1));
      }
    }

    return { cleanText: '', html: '', robotsAllowed: true };
  }

  private async respectRateLimit(hostname: string): Promise<void> {
    const lastRequest = this.domainLastRequest.get(hostname) ?? 0;
    const elapsed = Date.now() - lastRequest;
    if (elapsed < this.minDelayMs) {
      await this.delay(this.minDelayMs - elapsed);
    }
    this.domainLastRequest.set(hostname, Date.now());
  }

  private async isAllowedByRobots(url: URL): Promise<boolean> {
    const cached = this.robotsCache.get(url.hostname);
    if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) {
      return cached.allowed;
    }

    const robotsUrl = `${url.protocol}//${url.hostname}/robots.txt`;
    try {
      const robotsContent = await this.makeRequest(new URL(robotsUrl), this.userAgents[0], 0, true);
      const allowed = this.parseRobotsPermission(robotsContent, url.pathname);
      this.robotsCache.set(url.hostname, { allowed, fetchedAt: Date.now() });
      return allowed;
    } catch {
      this.robotsCache.set(url.hostname, { allowed: true, fetchedAt: Date.now() });
      return true;
    }
  }

  private parseRobotsPermission(robotsContent: string, path: string): boolean {
    const lines = robotsContent.split('\n');
    let applies = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      if (/^User-agent:\s*\*/i.test(line)) {
        applies = true;
        continue;
      }
      if (/^User-agent:/i.test(line)) {
        applies = false;
        continue;
      }

      if (applies && /^Disallow:/i.test(line)) {
        const disallowedPath = line.split(':')[1]?.trim() || '/';
        if (disallowedPath === '/') {
          return false;
        }
        if (path.startsWith(disallowedPath)) {
          return false;
        }
      }
    }
    return true;
  }

  private makeRequest(urlObj: URL, userAgent: string, attempt: number, isRobots = false): Promise<string> {
    const options: https.RequestOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: isRobots
          ? 'text/plain'
          : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        Connection: 'keep-alive',
      },
      timeout: 12000 + attempt * 2000,
      rejectUnauthorized: false,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          resolve(this.makeRequest(new URL(res.headers.location), userAgent, attempt + 1, isRobots));
          return;
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

const TRUSTED_DOMAIN_SET = new Set([
  'mckinsey.com',
  'www.mckinsey.com',
  'hbr.org',
  'www.hbr.org',
  'gartner.com',
  'www.gartner.com',
  'statista.com',
  'www.statista.com',
  'bcg.com',
  'www.bcg.com',
  'bain.com',
  'www.bain.com',
  'deloitte.com',
  'www2.deloitte.com',
  'pwc.com',
  'www.pwc.com',
  'ey.com',
  'www.ey.com',
  'accenture.com',
  'www.accenture.com',
  'weforum.org',
  'www.weforum.org',
  'worldbank.org',
  'www.worldbank.org',
  'imf.org',
  'www.imf.org',
  'who.int',
  'www.who.int',
  'cdc.gov',
  'www.cdc.gov',
  'data.gov',
  'www.data.gov',
  'census.gov',
  'www.census.gov',
  'sec.gov',
  'www.sec.gov',
  'oecd.org',
  'www.oecd.org',
  'europa.eu',
  'www.europa.eu',
]);

const CONSULTING_DOMAINS = new Set([
  'mckinsey.com',
  'bcg.com',
  'bain.com',
  'gartner.com',
  'statista.com',
  'deloitte.com',
  'pwc.com',
  'ey.com',
  'accenture.com',
  'hbr.org',
  'weforum.org',
]);

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
}

function hasHighTrustTld(domain: string): boolean {
  return domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil');
}

function determineSourceCategory(domain: string): TrustedSourceEvidence['sourceCategory'] {
  if (domain.endsWith('.gov')) {
    return 'government';
  }
  if (domain.endsWith('.edu')) {
    return 'education';
  }
  if (CONSULTING_DOMAINS.has(trimDomain(domain))) {
    return 'consulting';
  }
  if (TRUSTED_DOMAIN_SET.has(trimDomain(domain))) {
    return 'business';
  }
  return 'media';
}

function trimDomain(domain: string): string {
  return domain.replace(/^www\./, '');
}

function resolveSourceType(domain: string): CitationSourceType {
  if (domain.endsWith('.gov')) {
    return CitationSourceType.GOVERNMENT_DATA;
  }
  if (domain.endsWith('.edu')) {
    return CitationSourceType.ACADEMIC_PAPER;
  }
  if (CONSULTING_DOMAINS.has(trimDomain(domain))) {
    return CitationSourceType.CONSULTING_STUDY;
  }
  if (TRUSTED_DOMAIN_SET.has(trimDomain(domain))) {
    return CitationSourceType.INDUSTRY_REPORT;
  }
  return CitationSourceType.RESEARCH_PUBLICATION;
}

function resolveConfidence(domain: string): CitationConfidence {
  if (hasHighTrustTld(domain) || TRUSTED_DOMAIN_SET.has(trimDomain(domain))) {
    return CitationConfidence.HIGH;
  }
  if (CONSULTING_DOMAINS.has(trimDomain(domain))) {
    return CitationConfidence.HIGH;
  }
  return CitationConfidence.MEDIUM;
}

function resolveOrganization(domain: string): string | undefined {
  const trimmed = trimDomain(domain);
  const mapping: Record<string, string> = {
    'mckinsey.com': 'McKinsey & Company',
    'hbr.org': 'Harvard Business Review',
    'gartner.com': 'Gartner Inc.',
    'statista.com': 'Statista',
    'bcg.com': 'Boston Consulting Group',
    'bain.com': 'Bain & Company',
    'deloitte.com': 'Deloitte Insights',
    'www2.deloitte.com': 'Deloitte Insights',
    'pwc.com': 'PwC Research',
    'ey.com': 'EY Research',
    'accenture.com': 'Accenture Insights',
    'weforum.org': 'World Economic Forum',
    'worldbank.org': 'World Bank',
    'imf.org': 'International Monetary Fund',
    'who.int': 'World Health Organization',
    'cdc.gov': 'Centers for Disease Control and Prevention',
    'data.gov': 'Data.gov',
    'census.gov': 'U.S. Census Bureau',
    'sec.gov': 'U.S. Securities and Exchange Commission',
    'oecd.org': 'Organisation for Economic Co-operation and Development',
    'europa.eu': 'European Union',
  };
  return mapping[trimmed];
}

function extractPublishedDate(content: string): string | undefined {
  const isoMatch = content.match(/\b(20\d{2}|19\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return isoMatch[0];
  }

  const longFormMatch = content.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i
  );
  if (longFormMatch) {
    const date = new Date(longFormMatch[0]);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return undefined;
}

function extractKeyFacts(content: string, maxFacts = 3): string[] {
  const sentences = content.match(/[^.!?]*[.!?]/g) || [];
  const facts = sentences
    .map(sentence => sentence.trim())
    .filter(sentence => /\d/.test(sentence))
    .slice(0, maxFacts);

  if (facts.length === 0 && sentences.length > 0) {
    facts.push(sentences[0].trim());
  }

  return facts;
}

function generateCitationId(domain: string, index: number): string {
  const sanitized = trimDomain(domain).replace(/[^a-z0-9]/gi, '_');
  return `trusted_${sanitized}_${Date.now()}_${index}`;
}

function computeTrustScore(domain: string): number {
  if (domain.endsWith('.gov')) {
    return 98;
  }
  if (domain.endsWith('.edu')) {
    return 95;
  }
  if (TRUSTED_DOMAIN_SET.has(trimDomain(domain))) {
    return 92;
  }
  if (CONSULTING_DOMAINS.has(trimDomain(domain))) {
    return 88;
  }
  return 70;
}

function compareConfidence(
  confidence: CitationConfidence,
  threshold: CitationConfidence
): boolean {
  const ranking: Record<CitationConfidence, number> = {
    [CitationConfidence.HIGH]: 3,
    [CitationConfidence.MEDIUM]: 2,
    [CitationConfidence.LOW]: 1,
  };
  return ranking[confidence] >= ranking[threshold];
}

/**
 * Main TrustedSourceScraper orchestrating search and scraping across trusted domains.
 */
export class TrustedSourceScraper {
  private googleScraper: GoogleSearchScraper;
  private fallbackScraper: PureWebScraper;
  private marketDataFetcher: RealMarketDataFetcher;
  private adaptiveScraper: AdaptiveScraper;

  constructor() {
    this.googleScraper = new GoogleSearchScraper();
    this.fallbackScraper = new PureWebScraper();
    this.marketDataFetcher = new RealMarketDataFetcher();
    this.adaptiveScraper = new AdaptiveScraper();
  }

  async collectTrustedCitations(
    query: string,
    options: TrustedSourceScraperOptions = {}
  ): Promise<TrustedCitationResult> {
    const maxResults = Math.min(Math.max(options.maxResults ?? 6, 3), 12);
    const minConfidence = options.minConfidence ?? CitationConfidence.MEDIUM;

    const candidateMap = new Map<
      string,
      { title: string; snippet: string; source: 'google' | 'duckduckgo' | 'feed' }
    >();

    const rejectedSources: Array<{ url: string; reason: string }> = [];

    // Step 1: Google search results
    const primaryQuery = this.buildQuery(query, options.industry);
    let googleResults: GoogleSearchResult[] = [];
    try {
      googleResults = await this.googleScraper.searchAndScrapeReal(primaryQuery);
    } catch {
      // Continue even if Google scraping fails
    }

    for (const result of googleResults) {
      const domain = extractDomain(result.url);
      if (!this.isTrustedDomain(domain)) {
        rejectedSources.push({ url: result.url, reason: 'Domain not on trusted list' });
        continue;
      }
      candidateMap.set(result.url, {
        title: result.title,
        snippet: result.snippet,
        source: 'google',
      });
    }

    // Step 2: DuckDuckGo fallback
    if (candidateMap.size < maxResults) {
      try {
        const fallbackResults = await this.fallbackScraper.searchAndScrape(primaryQuery);
        fallbackResults.forEach((result: RealScrapedResult) => {
          const domain = extractDomain(result.url);
          if (!this.isTrustedDomain(domain)) {
            rejectedSources.push({ url: result.url, reason: 'Domain not on trusted list' });
            return;
          }
          if (!candidateMap.has(result.url)) {
            candidateMap.set(result.url, {
              title: result.title || domain,
              snippet: result.actualContent.substring(0, 240),
              source: 'duckduckgo',
            });
          }
        });
      } catch {
        // ignore fallback failures
      }
    }

    // Step 3: Market feeds for authoritative sources
    if (options.includeMarketFeeds && candidateMap.size < maxResults) {
      try {
        const feeds = await this.marketDataFetcher.fetchRealMarketData(query, options.industry);
        feeds.forEach((feed: MarketDataSource) => {
          const domain = extractDomain(feed.url);
          if (!this.isTrustedDomain(domain)) {
            rejectedSources.push({ url: feed.url, reason: 'Domain not on trusted list' });
            return;
          }
          if (!candidateMap.has(feed.url)) {
            candidateMap.set(feed.url, {
              title: feed.title,
              snippet: feed.content.substring(0, 240),
              source: 'feed',
            });
          }
        });
      } catch {
        // ignore feed failures
      }
    }

    const citations: Citation[] = [];
    const evidences: TrustedSourceEvidence[] = [];

    const candidates = Array.from(candidateMap.entries()).slice(0, maxResults);

    for (let index = 0; index < candidates.length; index++) {
      const [url, meta] = candidates[index];
      const domain = extractDomain(url);
      const confidence = resolveConfidence(domain);

      if (!compareConfidence(confidence, minConfidence)) {
        rejectedSources.push({ url, reason: `Confidence ${confidence} below threshold` });
        continue;
      }

      try {
        const scraped = await this.adaptiveScraper.scrape(url);
        if (!scraped.robotsAllowed) {
          rejectedSources.push({ url, reason: 'Blocked by robots.txt' });
          continue;
        }
        if (!scraped.cleanText) {
          rejectedSources.push({ url, reason: 'Empty content' });
          continue;
        }

        const keyFacts = extractKeyFacts(scraped.cleanText);
        const citationId = generateCitationId(domain, index);
        const published = extractPublishedDate(scraped.cleanText) ?? new Date().toISOString().split('T')[0];

        const citation: Citation = {
          id: citationId,
          title: meta.title,
          url,
          domain,
          published_at: published,
          source_type: resolveSourceType(domain),
          confidence,
          key_finding: keyFacts[0] || meta.snippet || `Key evidence extracted from ${domain}`,
          organization: resolveOrganization(domain),
          methodology: hasHighTrustTld(domain)
            ? 'Government or academic source with public methodology'
            : 'Consulting-grade research methodology inferred from source',
          sample_size: undefined,
          geographic_scope: options.industry ? options.industry : 'Global',
          industry_focus: options.industry ? [options.industry] : undefined,
          last_accessed: new Date().toISOString(),
        };

        citations.push(citation);
        evidences.push({
          citationId,
          snippet: meta.snippet || keyFacts[0] || '',
          keyFacts,
          domainTrustScore: computeTrustScore(domain),
          robotsAllowed: scraped.robotsAllowed,
          sourceCategory: determineSourceCategory(domain),
        });
      } catch (error) {
        rejectedSources.push({
          url,
          reason: error instanceof Error ? error.message : 'Unknown scraping error',
        });
      }
    }

    return {
      citations,
      evidences,
      rejectedSources,
      metadata: {
        totalCandidates: candidateMap.size,
        trustedCandidates: citations.length,
        query: primaryQuery,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private buildQuery(query: string, industry?: string): string {
    const trimmedQuery = query.trim();
    if (industry) {
      return `${trimmedQuery} ${industry} site:.gov OR site:.edu OR mckinsey OR gartner OR statista`;
    }
    return `${trimmedQuery} market report site:.gov OR site:.edu OR mckinsey OR gartner OR statista`;
  }

  private isTrustedDomain(domain: string): boolean {
    const trimmed = trimDomain(domain);
    return hasHighTrustTld(trimmed) || TRUSTED_DOMAIN_SET.has(trimmed) || CONSULTING_DOMAINS.has(trimmed);
  }
}
