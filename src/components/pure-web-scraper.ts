/**
 * Pure Web Scraper - ZERO MOCK DATA
 * Only returns data actually scraped from real websites
 * If scraping fails, returns empty results - NO FAKE DATA
 */

import https from 'https';
import { URL } from 'url';

export interface RealScrapedResult {
  title: string;
  url: string;
  actualContent: string;
  extractedNumbers: string[];
  scrapedTimestamp: string;
  sourceHost: string;
}

export class PureWebScraper {
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  /**
   * Search DuckDuckGo and scrape the actual results - NO MOCK DATA
   */
  async searchAndScrape(query: string): Promise<RealScrapedResult[]> {
    try {
      // Step 1: Search DuckDuckGo for real URLs
      const searchUrls = await this.searchDuckDuckGo(query);
      
      if (searchUrls.length === 0) {
        return []; // NO MOCK DATA - return empty if no real results
      }

      // Step 2: Actually scrape the found URLs
      const results: RealScrapedResult[] = [];
      
      for (const url of searchUrls.slice(0, 5)) { // Limit to 5 URLs
        try {
          const scraped = await this.scrapeRealUrl(url);
          if (scraped) {
            results.push(scraped);
          }
        } catch (error) {
          // Skip failed URLs - don't add mock data
          continue;
        }
      }

      return results; // Return only real scraped data
      
    } catch (error) {
      return []; // NO MOCK DATA - return empty on failure
    }
  }

  /**
   * Search DuckDuckGo API for real URLs
   */
  private async searchDuckDuckGo(query: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' market size revenue')}&format=json&no_html=1`;
      
      const url = new URL(searchUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const urls: string[] = [];

            // Extract URLs from DuckDuckGo response
            if (response.AbstractURL) {
              urls.push(response.AbstractURL);
            }

            if (response.RelatedTopics) {
              response.RelatedTopics.forEach((topic: any) => {
                if (topic.FirstURL) {
                  urls.push(topic.FirstURL);
                }
              });
            }

            if (response.Results) {
              response.Results.forEach((result: any) => {
                if (result.FirstURL) {
                  urls.push(result.FirstURL);
                }
              });
            }

            resolve(urls);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Search timeout'));
      });

      req.end();
    });
  }

  /**
   * Actually scrape a real URL - NO MOCK DATA
   */
  private async scrapeRealUrl(url: string): Promise<RealScrapedResult | null> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      };

      const req = https.request(options, (res) => {
        // Handle redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(this.scrapeRealUrl(res.headers.location));
          return;
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let html = '';
        
        res.on('data', (chunk) => {
          html += chunk;
        });

        res.on('end', () => {
          try {
            const result = this.extractRealDataFromHtml(html, url);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Scrape timeout'));
      });

      req.end();
    });
  }

  /**
   * Extract real data from HTML - NO FAKE NUMBERS
   */
  private extractRealDataFromHtml(html: string, url: string): RealScrapedResult | null {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Clean HTML to get text
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract actual numbers from the real content
    const numberPatterns = [
      /\$[\d,.]+ (?:billion|million|trillion|bn|mn)/gi,
      /[\d.]+% (?:growth|CAGR|increase|annually)/gi,
      /[\d,.]+ (?:billion|million|trillion) (?:dollars|USD|\$)/gi,
    ];

    const extractedNumbers: string[] = [];
    numberPatterns.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) {
        extractedNumbers.push(...matches.slice(0, 3)); // Limit to 3 per pattern
      }
    });

    // Only return if we found actual content and numbers
    if (textContent.length > 200 && (extractedNumbers.length > 0 || title.length > 10)) {
      return {
        title: title.substring(0, 100),
        url: url,
        actualContent: textContent.substring(0, 500),
        extractedNumbers: extractedNumbers,
        scrapedTimestamp: new Date().toISOString(),
        sourceHost: new URL(url).hostname,
      };
    }

    return null; // Return null if no meaningful data found - NO MOCK DATA
  }

  /**
   * Generate citations from ONLY real scraped data
   */
  generateRealCitations(results: RealScrapedResult[]): string {
    if (results.length === 0) {
      return `
## No Real Data Available

Unable to retrieve current market data from web sources at this time.
Please conduct manual research or try again later.

*No mock or estimated data provided - only real scraped data is reported.*`;
    }

    const citations = results.map((result, index) => 
      `[${index + 1}] ${result.title}
    URL: ${result.url}
    Source: ${result.sourceHost}
    Scraped: ${result.scrapedTimestamp.split('T')[0]}
    Data Found: ${result.extractedNumbers.join(', ') || 'General market information'}`
    );

    const allNumbers = results.flatMap(r => r.extractedNumbers);
    let marketDataSection = '';
    
    if (allNumbers.length > 0) {
      marketDataSection = `
## Real Market Data (Scraped)

${allNumbers.map(num => `• ${num}`).join('\n')}
`;
    }

    return `${marketDataSection}
## Real Sources (Actually Scraped)

${citations.join('\n\n')}

## Content Summary
${results.map(r => `• ${r.actualContent.substring(0, 100)}... (${r.sourceHost})`).join('\n')}

*All data above was actually scraped from real websites on ${new Date().toISOString().split('T')[0]}*
*No mock, estimated, or placeholder data included*`;
  }
}