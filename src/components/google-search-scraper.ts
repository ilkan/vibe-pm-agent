/**
 * Google Search Scraper - Gets REAL web search results
 * Scrapes Google search results pages to find actual websites with market data
 */

import https from 'https';
import { URL } from 'url';

export interface GoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
  scrapedContent?: string;
  marketData?: string[];
}

export class GoogleSearchScraper {
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Search Google and scrape the actual result pages for real market data
   */
  async searchAndScrapeReal(query: string): Promise<GoogleSearchResult[]> {
    try {
      // Step 1: Get Google search results
      const searchResults = await this.searchGoogle(query);

      if (searchResults.length === 0) {
        throw new Error('No Google search results found');
      }

      // Step 2: Scrape the actual websites from search results
      const scrapedResults: GoogleSearchResult[] = [];

      for (const result of searchResults.slice(0, 5)) {
        try {
          const scrapedContent = await this.scrapeWebsite(result.url);
          if (scrapedContent) {
            const marketData = this.extractMarketData(scrapedContent);
            scrapedResults.push({
              ...result,
              scrapedContent: scrapedContent.substring(0, 500),
              marketData,
            });
          }
        } catch (error) {
          // Skip failed URLs but continue with others
          continue;
        }
      }

      return scrapedResults;
    } catch (error) {
      throw new Error(
        `Google search and scrape failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Scrape Google search results page
   */
  private async searchGoogle(query: string): Promise<GoogleSearchResult[]> {
    return new Promise((resolve, reject) => {
      // Use Google search URL
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;

      const options = {
        hostname: 'www.google.com',
        path: `/search?q=${encodeURIComponent(query)}&num=10`,
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
          Connection: 'close',
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, res => {
        let html = '';

        res.on('data', chunk => {
          html += chunk;
        });

        res.on('end', () => {
          try {
            const results = this.parseGoogleResults(html);
            resolve(results);
          } catch (error) {
            reject(new Error(`Failed to parse Google results: ${error}`));
          }
        });
      });

      req.on('error', error => {
        reject(new Error(`Google search request failed: ${error.message}`));
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Google search timeout'));
      });

      req.end();
    });
  }

  /**
   * Parse Google search results HTML to extract URLs and snippets
   */
  private parseGoogleResults(html: string): GoogleSearchResult[] {
    const results: GoogleSearchResult[] = [];

    // Extract search result divs (Google's structure changes, but this pattern is common)
    const resultPattern = /<div[^>]*class="[^"]*g[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const matches = html.match(resultPattern) || [];

    for (const match of matches.slice(0, 10)) {
      try {
        // Extract title
        const titleMatch = match.match(/<h3[^>]*>[\s\S]*?<\/h3>/i);
        let title = '';
        if (titleMatch) {
          title = titleMatch[0].replace(/<[^>]+>/g, '').trim();
        }

        // Extract URL
        const urlMatch = match.match(/href="([^"]+)"/);
        let url = '';
        if (urlMatch && urlMatch[1]) {
          url = urlMatch[1];
          // Clean up Google redirect URLs
          if (url.startsWith('/url?q=')) {
            const urlParam = new URLSearchParams(url.substring(6));
            url = urlParam.get('q') || url;
          }
        }

        // Extract snippet
        const snippetMatch = match.match(/<span[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/span>/gi);
        let snippet = '';
        if (snippetMatch) {
          snippet = snippetMatch
            .map(s => s.replace(/<[^>]+>/g, ''))
            .join(' ')
            .trim()
            .substring(0, 200);
        }

        // Only add if we have valid data
        if (title && url && url.startsWith('http') && !url.includes('google.com')) {
          results.push({
            title: title.substring(0, 100),
            url: url,
            snippet: snippet,
          });
        }
      } catch (error) {
        // Skip malformed results
        continue;
      }
    }

    return results;
  }

  /**
   * Scrape a website for actual content
   */
  private async scrapeWebsite(url: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(url);

        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          rejectUnauthorized: false,
          timeout: 10000,
        };

        const req = https.request(options, res => {
          // Handle redirects
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            resolve(this.scrapeWebsite(res.headers.location));
            return;
          }

          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }

          let html = '';

          res.on('data', chunk => {
            html += chunk;
          });

          res.on('end', () => {
            // Extract text content from HTML
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            resolve(textContent);
          });
        });

        req.on('error', error => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Scrape timeout'));
        });

        req.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract real market data from scraped content
   */
  private extractMarketData(content: string): string[] {
    const marketData: string[] = [];

    // Patterns for market data
    const patterns = [
      /\$[\d,.]+ (?:billion|million|trillion|bn|mn)/gi,
      /[\d.]+% (?:growth|CAGR|increase|annually|year-over-year)/gi,
      /market size[^.]*\$[\d,.]+[^.]*/gi,
      /revenue[^.]*\$[\d,.]+[^.]*/gi,
      /valued at[^.]*\$[\d,.]+[^.]*/gi,
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        marketData.push(...matches.slice(0, 3));
      }
    });

    return [...new Set(marketData)]; // Remove duplicates
  }

  /**
   * Generate citations from real scraped data
   */
  generateRealCitations(results: GoogleSearchResult[]): string {
    if (results.length === 0) {
      return `
## No Real Market Data Found

Google search did not return scrapeable results for this query.
This could be due to:
- Search query needs refinement
- Websites blocking automated access
- Network connectivity issues

*No mock data provided - only real scraped data is reported.*`;
    }

    const citations = results.map((result, index) => {
      const marketDataText =
        result.marketData && result.marketData.length > 0
          ? `\n    Market Data: ${result.marketData.join(', ')}`
          : '';

      return `[${index + 1}] ${result.title}
    URL: ${result.url}
    Snippet: ${result.snippet}${marketDataText}
    Scraped: ${new Date().toISOString().split('T')[0]}`;
    });

    // Collect all market data
    const allMarketData = results.flatMap(r => r.marketData || []);
    let marketDataSection = '';

    if (allMarketData.length > 0) {
      marketDataSection = `
## Real Market Data (Scraped from Google Results)

${allMarketData.map(data => `• ${data}`).join('\n')}
`;
    }

    return `${marketDataSection}
## Real Sources (Google Search + Scraping)

${citations.join('\n\n')}

*All data above was scraped from real websites found via Google search on ${new Date().toISOString().split('T')[0]}*
*No mock, estimated, or template data included*`;
  }
}
