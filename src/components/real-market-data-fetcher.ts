/**
 * Real Market Data Fetcher
 * Fetches actual market data from reliable public sources
 * No mock data - only real information from accessible APIs and feeds
 */

import https from 'https';
import { URL } from 'url';

export interface MarketDataSource {
  title: string;
  url: string;
  content: string;
  marketMetrics: string[];
  source: string;
  fetchedAt: string;
}

export class RealMarketDataFetcher {
  private readonly userAgent = 'Mozilla/5.0 (compatible; MarketResearchBot/1.0)';

  /**
   * Fetch real market data from multiple reliable sources
   */
  async fetchRealMarketData(topic: string, industry?: string): Promise<MarketDataSource[]> {
    const sources = this.getReliableDataSources(topic, industry);
    const results: MarketDataSource[] = [];

    for (const source of sources) {
      try {
        const data = await this.fetchFromSource(source);
        if (data) {
          results.push(data);
        }
      } catch (error) {
        // Continue with other sources if one fails
        continue;
      }
    }

    return results;
  }

  /**
   * Get reliable data sources based on topic
   */
  private getReliableDataSources(
    topic: string,
    industry?: string
  ): Array<{ url: string; name: string }> {
    const sources: Array<{ url: string; name: string }> = [];

    // Always try these reliable financial/business sources
    sources.push(
      { url: 'https://finance.yahoo.com/rss/', name: 'Yahoo Finance' },
      { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business' },
      { url: 'https://www.sec.gov/rss/investor/alerts', name: 'SEC Investor Alerts' }
    );

    // Add fintech-specific sources
    if (
      topic.toLowerCase().includes('fintech') ||
      topic.toLowerCase().includes('finance') ||
      industry?.toLowerCase().includes('fintech')
    ) {
      sources.push(
        { url: 'https://www.finextra.com/rss/headlines.aspx', name: 'Finextra' },
        { url: 'https://www.pymnts.com/feed/', name: 'PYMNTS' }
      );
    }

    // Add tech sources for app-related queries
    if (
      topic.toLowerCase().includes('app') ||
      topic.toLowerCase().includes('mobile') ||
      topic.toLowerCase().includes('ai')
    ) {
      sources.push(
        { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
        { url: 'https://venturebeat.com/feed/', name: 'VentureBeat' }
      );
    }

    return sources.slice(0, 6); // Limit to 6 sources
  }

  /**
   * Fetch data from a specific source
   */
  private async fetchFromSource(source: {
    url: string;
    name: string;
  }): Promise<MarketDataSource | null> {
    return new Promise((resolve, reject) => {
      const url = new URL(source.url);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/rss+xml, application/xml, text/xml, text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        rejectUnauthorized: false,
        timeout: 15000,
      };

      const req = https.request(options, res => {
        // Handle redirects
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          resolve(this.fetchFromSource({ url: res.headers.location, name: source.name }));
          return;
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} from ${source.name}`));
          return;
        }

        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const extracted = this.extractMarketData(data, source);
            resolve(extracted);
          } catch (error) {
            reject(new Error(`Failed to extract data from ${source.name}: ${error}`));
          }
        });
      });

      req.on('error', error => {
        reject(new Error(`Request to ${source.name} failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout fetching from ${source.name}`));
      });

      req.end();
    });
  }

  /**
   * Extract market data from RSS/XML/HTML content
   */
  private extractMarketData(
    content: string,
    source: { url: string; name: string }
  ): MarketDataSource | null {
    // Clean content and extract text
    const textContent = content
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract market metrics
    const marketMetrics: string[] = [];

    // Patterns for financial data
    const patterns = [
      /\$[\d,.]+ (?:billion|million|trillion|bn|mn)/gi,
      /[\d.]+% (?:growth|increase|rise|up|CAGR)/gi,
      /market (?:cap|size|value)[^.]*\$[\d,.]+/gi,
      /revenue[^.]*\$[\d,.]+/gi,
      /funding[^.]*\$[\d,.]+/gi,
      /valuation[^.]*\$[\d,.]+/gi,
    ];

    patterns.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) {
        marketMetrics.push(...matches.slice(0, 2)); // Limit per pattern
      }
    });

    // Extract relevant sentences
    const sentences = textContent
      .split(/[.!?]+/)
      .filter(
        s =>
          s.length > 30 &&
          (s.toLowerCase().includes('market') ||
            s.toLowerCase().includes('revenue') ||
            s.toLowerCase().includes('billion') ||
            s.toLowerCase().includes('million') ||
            s.toLowerCase().includes('growth'))
      );

    const relevantContent = sentences.slice(0, 3).join('. ').substring(0, 400);

    // Only return if we found meaningful data
    if (relevantContent.length > 50 || marketMetrics.length > 0) {
      return {
        title: `Market Data from ${source.name}`,
        url: source.url,
        content: relevantContent,
        marketMetrics: [...new Set(marketMetrics)], // Remove duplicates
        source: source.name,
        fetchedAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Generate citations from real fetched data
   */
  generateRealCitations(results: MarketDataSource[]): string {
    if (results.length === 0) {
      return `
## No Current Market Data Available

Unable to fetch current market data from reliable financial sources.
This could be due to:
- Network connectivity issues
- Source websites temporarily unavailable
- Content access restrictions

*No mock or estimated data provided - only real market data is reported.*`;
    }

    const citations = results.map((result, index) => {
      const metricsText =
        result.marketMetrics.length > 0
          ? `\n    Market Metrics: ${result.marketMetrics.join(', ')}`
          : '';

      return `[${index + 1}] ${result.title}
    Source: ${result.source}
    URL: ${result.url}
    Fetched: ${result.fetchedAt.split('T')[0]}${metricsText}
    Content: ${result.content.substring(0, 150)}...`;
    });

    // Collect all market metrics
    const allMetrics = results.flatMap(r => r.marketMetrics);
    let marketDataSection = '';

    if (allMetrics.length > 0) {
      marketDataSection = `
## Real Market Metrics (From Financial Sources)

${allMetrics.map(metric => `• ${metric}`).join('\n')}
`;
    }

    return `${marketDataSection}
## Real Financial Sources

${citations.join('\n\n')}

## Data Summary
${results.map(r => `• ${r.source}: ${r.marketMetrics.length} metrics found`).join('\n')}

*All data above was fetched from real financial and business news sources on ${new Date().toISOString().split('T')[0]}*
*No mock, template, or estimated data included*`;
  }
}
