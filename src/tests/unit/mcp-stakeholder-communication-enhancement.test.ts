/**
 * Unit tests for enhanced stakeholder communication with competitive insights
 * Tests the integration of competitive analysis into executive communications
 */

import { SimplePMAgentMCPServer } from '../../mcp/simple-server';

describe('Enhanced Stakeholder Communication', () => {
  let server: SimplePMAgentMCPServer;

  beforeEach(() => {
    server = new SimplePMAgentMCPServer();
  });

  describe('generateExecutiveOnePager with competitive insights', () => {
    test('should include competitive positioning section when business case contains competitive analysis', () => {
      const businessCaseWithCompetitive = `
        Business Case Analysis:
        - Market opportunity: $500M addressable market
        - Competitive landscape: 3 key competitors with pricing weaknesses
        - Market position: Differentiated solution addressing key gaps
        - Strategic advantage: Superior technology and customer focus
      `;

      const result = (server as any).generateExecutiveOnePager(businessCaseWithCompetitive, 'executives');

      expect(result).toContain('## Competitive Positioning');
      expect(result).toContain('Market Position');
      expect(result).toContain('Competitive Advantage');
      expect(result).toContain('Market Opportunity');
      expect(result).toContain('Strategic Differentiation');
      expect(result).toContain('competitive positioning');
    });

    test('should not include competitive positioning section when business case lacks competitive analysis', () => {
      const businessCaseWithoutCompetitive = `
        Business Case Analysis:
        - Market opportunity: Significant revenue potential
        - Technical feasibility: Proven architecture
        - Resource requirements: Standard development team
      `;

      const result = (server as any).generateExecutiveOnePager(businessCaseWithoutCompetitive, 'executives');

      expect(result).not.toContain('## Competitive Positioning');
      expect(result).toContain('## Strategic Value');
      expect(result).toContain('competitive advantage'); // Still mentions competitive advantage in general terms
    });

    test('should detect competitive keywords in business case', () => {
      const testCases = [
        'Analysis shows competitor weaknesses in pricing',
        'Competitive analysis reveals market gaps',
        'Market position assessment indicates opportunity'
      ];

      testCases.forEach(businessCase => {
        const result = (server as any).generateExecutiveOnePager(businessCase, 'executives');
        expect(result).toContain('## Competitive Positioning');
      });
    });
  });

  describe('generatePRFAQ with competitive insights', () => {
    test('should include competitive FAQ questions when business case contains competitive analysis', () => {
      const businessCaseWithCompetitive = `
        Business Case with Competitive Analysis:
        - Competitor A: Strong brand but high pricing
        - Competitor B: Innovation focus but limited resources
        - Market position: Differentiated through superior technology
        - Competitive advantage: Customer-focused design
      `;

      const result = (server as any).generatePRFAQ(businessCaseWithCompetitive, 'executives');

      expect(result).toContain('How does this compare to competitive alternatives?');
      expect(result).toContain('What is our competitive differentiation strategy?');
      expect(result).toContain('competitive advantages');
      expect(result).toContain('market gaps');
      expect(result).toContain('competitive differentiation');
    });

    test('should enhance headline with market-leading innovation when competitive analysis present', () => {
      const businessCaseWithCompetitive = `
        Competitive landscape analysis shows opportunity for market leadership
        through innovative approach and superior customer experience.
      `;

      const result = (server as any).generatePRFAQ(businessCaseWithCompetitive, 'executives');

      expect(result).toContain('Market-Leading Innovation');
      expect(result).toContain('competitive differentiation');
      expect(result).toContain('market share objectives');
    });

    test('should not include competitive FAQ when business case lacks competitive analysis', () => {
      const businessCaseWithoutCompetitive = `
        Standard business case focusing on customer needs,
        technical implementation, and financial projections.
      `;

      const result = (server as any).generatePRFAQ(businessCaseWithoutCompetitive, 'executives');

      expect(result).not.toContain('How does this compare to competitive alternatives?');
      expect(result).not.toContain('competitive differentiation strategy');
      expect(result).toContain('strategic competitive advantages'); // General mention
    });

    test('should detect various competitive keywords', () => {
      const competitiveKeywords = ['competitor', 'competitive', 'market position'];
      
      competitiveKeywords.forEach(keyword => {
        const businessCase = `Business analysis reveals ${keyword} insights`;
        const result = (server as any).generatePRFAQ(businessCase, 'executives');
        expect(result).toContain('competitive alternatives');
      });
    });
  });

  describe('handleStakeholderCommunication integration', () => {
    test('should pass competitive insights through to communication generation', async () => {
      const args = {
        business_case: `
          Comprehensive competitive analysis shows:
          - Market opportunity with limited competition
          - Key differentiators in technology and user experience
          - Strategic positioning advantages
        `,
        communication_type: 'executive_onepager',
        audience: 'executives'
      };

      const result = await (server as any).handleStakeholderCommunication(args);

      expect(result.content[0].text).toContain('## Competitive Positioning');
      expect(result.content[0].text).toContain('competitive differentiation');
    });

    test('should handle PR-FAQ generation with competitive insights', async () => {
      const args = {
        business_case: `
          Market analysis reveals competitive landscape with opportunities
          for differentiation through superior technology and customer focus.
        `,
        communication_type: 'pr_faq',
        audience: 'board'
      };

      const result = await (server as any).handleStakeholderCommunication(args);

      expect(result.content[0].text).toContain('competitive alternatives');
      expect(result.content[0].text).toContain('differentiation strategy');
    });

    test('should work with all communication types', async () => {
      const businessCaseWithCompetitive = 'Competitive analysis shows market opportunity';
      const communicationTypes = ['executive_onepager', 'pr_faq', 'board_presentation', 'team_announcement'];

      for (const type of communicationTypes) {
        const args = {
          business_case: businessCaseWithCompetitive,
          communication_type: type,
          audience: 'executives'
        };

        const result = await (server as any).handleStakeholderCommunication(args);
        expect(result.content[0].text).toBeDefined();
        expect(result.content[0].text.length).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle empty business case gracefully', async () => {
      const args = {
        business_case: '',
        communication_type: 'executive_onepager',
        audience: 'executives'
      };

      const result = await (server as any).handleStakeholderCommunication(args);
      expect(result.content[0].text).toBeDefined();
      expect(result.content[0].text).toContain('Strategic Value');
    });

    test('should handle null business case', async () => {
      const args = {
        business_case: null,
        communication_type: 'pr_faq',
        audience: 'board'
      };

      const result = await (server as any).handleStakeholderCommunication(args);
      expect(result.content[0].text).toBeDefined();
      expect(result.content[0].text).toContain('Press Release');
    });

    test('should handle case-insensitive competitive keyword detection', () => {
      const testCases = [
        'COMPETITIVE analysis shows opportunity',
        'Competitor research indicates gaps',
        'MARKET POSITION assessment reveals advantages'
      ];

      testCases.forEach(businessCase => {
        const result = (server as any).generateExecutiveOnePager(businessCase, 'executives');
        expect(result).toContain('## Competitive Positioning');
      });
    });

    test('should handle business case with partial competitive information', () => {
      const partialCompetitive = 'Some competitor information but limited analysis';
      
      const onePager = (server as any).generateExecutiveOnePager(partialCompetitive, 'executives');
      const prfaq = (server as any).generatePRFAQ(partialCompetitive, 'executives');

      expect(onePager).toContain('## Competitive Positioning');
      expect(prfaq).toContain('competitive alternatives');
    });
  });

  describe('content quality and consistency', () => {
    test('should maintain consistent messaging across communication types', () => {
      const businessCase = `
        Competitive analysis reveals significant market opportunity
        with differentiated positioning and strategic advantages.
      `;

      const onePager = (server as any).generateExecutiveOnePager(businessCase, 'executives');
      const prfaq = (server as any).generatePRFAQ(businessCase, 'executives');

      // Both should mention competitive aspects
      expect(onePager).toContain('competitive');
      expect(prfaq).toContain('competitive');
      
      // Both should maintain professional tone
      expect(onePager).toContain('strategic');
      expect(prfaq).toContain('strategic');
    });

    test('should provide actionable next steps in executive one-pager', () => {
      const businessCase = 'Competitive landscape analysis complete';
      const result = (server as any).generateExecutiveOnePager(businessCase, 'executives');

      expect(result).toContain('## Next Steps');
      expect(result).toContain('competitive positioning');
      expect(result).toMatch(/\d+\./); // Should have numbered steps
    });

    test('should include proper FAQ structure in PR-FAQ', () => {
      const businessCase = 'Market position analysis with competitive insights';
      const result = (server as any).generatePRFAQ(businessCase, 'executives');

      expect(result).toContain('## Press Release');
      expect(result).toContain('## FAQ');
      expect(result).toMatch(/\*\*Q:/); // Should have Q: format
      expect(result).toMatch(/A:/); // Should have A: format
    });
  });
});