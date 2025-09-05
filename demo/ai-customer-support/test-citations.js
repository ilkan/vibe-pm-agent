#!/usr/bin/env node

// Test script for citation integration functionality
// This demonstrates the new citation features without requiring full MCP server setup

const fs = require('fs');
const path = require('path');

// Mock the citation service functionality for demo purposes
class MockCitationService {
  constructor() {
    this.citations = this.loadCitations();
  }

  loadCitations() {
    try {
      const citationsPath = path.join(__dirname, '../../docs/citations.json');
      const citationsData = fs.readFileSync(citationsPath, 'utf8');
      return JSON.parse(citationsData);
    } catch (error) {
      console.error('Error loading citations:', error.message);
      return [];
    }
  }

  findRelevantCitations(keywords, industry = '', minCitations = 3) {
    const relevantCitations = this.citations.filter(citation => {
      // Check if keywords match title or key finding
      const keywordMatch = keywords.some(keyword => 
        citation.title.toLowerCase().includes(keyword.toLowerCase()) ||
        citation.key_finding.toLowerCase().includes(keyword.toLowerCase()) ||
        (citation.industry_focus && citation.industry_focus.some(ind => 
          ind.toLowerCase().includes(keyword.toLowerCase())
        ))
      );

      // Check industry relevance
      const industryMatch = !industry || 
        (citation.industry_focus && citation.industry_focus.some(ind => 
          ind.toLowerCase().includes(industry.toLowerCase())
        ));

      return keywordMatch && industryMatch;
    });

    // Sort by confidence and recency
    relevantCitations.sort((a, b) => {
      const confidenceOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confidenceDiff !== 0) return confidenceDiff;
      
      return new Date(b.published_at) - new Date(a.published_at);
    });

    return relevantCitations.slice(0, Math.max(minCitations, relevantCitations.length));
  }

  formatCitation(citation, style = 'business') {
    const year = new Date(citation.published_at).getFullYear();
    
    switch (style) {
      case 'business':
        return {
          inline: `[${citation.id}]`,
          bibliography: `[${citation.id}] ${citation.title}. ${citation.organization} (${year}). ${citation.key_finding}. Available: ${citation.url}`
        };
      case 'apa':
        const authors = citation.organization || citation.domain;
        return {
          inline: `(${authors}, ${year})`,
          bibliography: `${authors} (${year}). ${citation.title}. Retrieved from ${citation.url}`
        };
      default:
        return {
          inline: `[${citation.id}]`,
          bibliography: `[${citation.id}] ${citation.title} (${year}). ${citation.organization}. ${citation.url}`
        };
    }
  }

  enhanceContentWithCitations(content, citations, style = 'business') {
    let enhancedContent = content;
    let bibliography = '\n\n## References\n\n';

    citations.forEach((citation, index) => {
      const formatted = this.formatCitation(citation, style);
      
      // Add inline citation to relevant sentences
      const keyFinding = citation.key_finding.substring(0, 30);
      const insertionPoint = enhancedContent.toLowerCase().indexOf(keyFinding.toLowerCase());
      
      if (insertionPoint !== -1) {
        const sentenceEnd = enhancedContent.indexOf('.', insertionPoint);
        if (sentenceEnd !== -1) {
          enhancedContent = enhancedContent.substring(0, sentenceEnd) + 
            ` ${formatted.inline}` + 
            enhancedContent.substring(sentenceEnd);
        }
      } else {
        // Add citation at end of first paragraph if no specific match
        const firstParagraphEnd = enhancedContent.indexOf('\n\n');
        if (firstParagraphEnd !== -1 && index < 2) {
          enhancedContent = enhancedContent.substring(0, firstParagraphEnd) + 
            ` ${formatted.inline}` + 
            enhancedContent.substring(firstParagraphEnd);
        }
      }

      bibliography += formatted.bibliography + '\n\n';
    });

    return enhancedContent + bibliography;
  }

  calculateQualityMetrics(citations) {
    const confidenceScores = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const avgConfidence = citations.reduce((sum, c) => sum + confidenceScores[c.confidence], 0) / citations.length;
    
    // Calculate recency score
    const now = new Date();
    const recencyScores = citations.map(c => {
      const monthsOld = (now - new Date(c.published_at)) / (1000 * 60 * 60 * 24 * 30);
      return Math.max(0, 100 - (monthsOld * 2));
    });
    const avgRecency = recencyScores.reduce((sum, score) => sum + score, 0) / recencyScores.length;

    // Source diversity
    const uniqueDomains = new Set(citations.map(c => c.domain)).size;
    const diversityScore = Math.min(100, (uniqueDomains / citations.length) * 100);

    return {
      total_citations: citations.length,
      credibility_score: Math.round(avgConfidence * 33.33),
      recency_score: Math.round(avgRecency),
      diversity_score: Math.round(diversityScore),
      unique_sources: uniqueDomains
    };
  }
}

// Demo scenarios
async function runCitationDemo() {
  console.log('🚀 AI Customer Support Platform - Citation Integration Demo');
  console.log('===========================================================\n');

  const citationService = new MockCitationService();
  
  // Create output directory
  const outputDir = path.join(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Demo 1: Business Opportunity Analysis
  console.log('📊 Demo 1: Business Opportunity Analysis with Citations');
  console.log('------------------------------------------------------');
  
  const businessOpportunityContent = `# AI Customer Support Platform - Business Opportunity Analysis

## Executive Summary
The AI-powered customer support platform represents a significant market opportunity in the rapidly growing customer service automation sector. With businesses increasingly seeking to reduce operational costs while improving customer satisfaction, automated support solutions are becoming essential.

## Market Opportunity
The global customer service automation market is experiencing unprecedented growth, driven by the need for operational efficiency and improved customer experiences. Companies are investing heavily in AI technologies to transform their support operations.

## Competitive Landscape
The market features both established players and innovative startups, with significant opportunities for differentiation through advanced AI capabilities and superior user experience.

## Strategic Recommendations
1. Focus on mid-market SaaS companies as primary target segment
2. Emphasize ROI and efficiency gains in positioning
3. Develop strong integration capabilities with existing CRM systems
4. Build comprehensive analytics and reporting features`;

  const businessKeywords = ['customer service', 'automation', 'ai', 'operational efficiency', 'customer satisfaction'];
  const businessCitations = citationService.findRelevantCitations(businessKeywords, 'saas', 5);
  const enhancedBusinessContent = citationService.enhanceContentWithCitations(
    businessOpportunityContent, 
    businessCitations, 
    'business'
  );
  const businessMetrics = citationService.calculateQualityMetrics(businessCitations);

  fs.writeFileSync(path.join(outputDir, 'business-opportunity-analysis.md'), enhancedBusinessContent);
  
  console.log(`✅ Generated business opportunity analysis`);
  console.log(`   Citations: ${businessMetrics.total_citations}`);
  console.log(`   Credibility Score: ${businessMetrics.credibility_score}/100`);
  console.log(`   Recency Score: ${businessMetrics.recency_score}/100`);
  console.log(`   Sources: ${businessCitations.map(c => c.organization).join(', ')}\n`);

  // Demo 2: Business Case with ROI Analysis
  console.log('💰 Demo 2: Business Case Generation with Citations');
  console.log('------------------------------------------------');

  const businessCaseContent = `# AI Customer Support Platform - Business Case

## Investment Summary
**Total Investment**: $175,000 (Development: $150,000 + Operations: $25,000/year)
**Expected Annual Returns**: $480,000
**ROI**: 174% first year
**Payback Period**: 4.4 months

## Problem Statement
Current customer support operations face significant challenges with rising costs, slow response times, and declining customer satisfaction. Manual processes are inefficient and don't scale with business growth.

## Solution Overview
AI-powered customer support platform that automates tier-1 support tickets, provides intelligent routing, and offers real-time sentiment analysis. The platform integrates with existing CRM systems and provides comprehensive analytics.

## Financial Analysis
### Cost-Benefit Analysis
- **Cost Reduction**: 40% reduction in support operational costs
- **Efficiency Gains**: 60% faster response times
- **Revenue Impact**: Improved customer retention and satisfaction
- **Scalability**: Platform scales with business growth without proportional cost increases

### Risk Assessment
- **Technical Risk**: Medium - AI technology is mature but requires proper implementation
- **Market Risk**: Low - Strong market demand for automation solutions
- **Operational Risk**: Low - Gradual rollout minimizes disruption

## Recommendation
Proceed with development immediately. The business case is compelling with strong ROI, manageable risks, and clear strategic alignment with company objectives.`;

  const businessCaseKeywords = ['roi', 'cost reduction', 'efficiency', 'digital transformation', 'automation'];
  const businessCaseCitations = citationService.findRelevantCitations(businessCaseKeywords, 'technology', 4);
  const enhancedBusinessCaseContent = citationService.enhanceContentWithCitations(
    businessCaseContent, 
    businessCaseCitations, 
    'business'
  );
  const businessCaseMetrics = citationService.calculateQualityMetrics(businessCaseCitations);

  fs.writeFileSync(path.join(outputDir, 'business-case.md'), enhancedBusinessCaseContent);
  
  console.log(`✅ Generated business case analysis`);
  console.log(`   Citations: ${businessCaseMetrics.total_citations}`);
  console.log(`   Credibility Score: ${businessCaseMetrics.credibility_score}/100`);
  console.log(`   Recency Score: ${businessCaseMetrics.recency_score}/100`);
  console.log(`   Sources: ${businessCaseCitations.map(c => c.organization).join(', ')}\n`);

  // Demo 3: Strategic Alignment Assessment
  console.log('🎯 Demo 3: Strategic Alignment Assessment with Citations');
  console.log('------------------------------------------------------');

  const strategicAlignmentContent = `# AI Customer Support Platform - Strategic Alignment Assessment

## Strategic Fit Analysis
The AI customer support platform aligns strongly with our company's strategic priorities and long-term vision for operational excellence and customer-centricity.

## Alignment with Company Mission
Our mission to "empower businesses to deliver exceptional customer experiences" is directly supported by this initiative. The platform enables superior customer service delivery through intelligent automation.

## OKR Alignment Assessment
### Q1 2024 OKRs Alignment:
1. **Increase customer satisfaction score from 7.2 to 8.5** ✅ STRONG ALIGNMENT
   - AI platform directly improves response times and resolution quality
   - Sentiment analysis ensures proactive issue management

2. **Reduce customer support costs by 30%** ✅ STRONG ALIGNMENT  
   - Automation reduces manual workload by 40%
   - Intelligent routing optimizes resource allocation

3. **Achieve 95% customer retention rate** ✅ STRONG ALIGNMENT
   - Faster resolution times improve customer satisfaction
   - Proactive issue detection prevents churn

4. **Launch 3 new AI-powered features this year** ✅ STRONG ALIGNMENT
   - Platform represents major AI capability advancement
   - Demonstrates innovation leadership in market

## Competitive Positioning Impact
The platform strengthens our competitive position by addressing a key weakness in our automation capabilities while leveraging our strengths in customer relationship management.

## Strategic Recommendation
**PROCEED** - This initiative represents optimal strategic alignment with company objectives, OKRs, and long-term vision. The timing is ideal for market entry and competitive differentiation.`;

  const strategicKeywords = ['strategic alignment', 'okr', 'competitive positioning', 'digital transformation'];
  const strategicCitations = citationService.findRelevantCitations(strategicKeywords, '', 3);
  const enhancedStrategicContent = citationService.enhanceContentWithCitations(
    strategicAlignmentContent, 
    strategicCitations, 
    'business'
  );
  const strategicMetrics = citationService.calculateQualityMetrics(strategicCitations);

  fs.writeFileSync(path.join(outputDir, 'strategic-alignment.md'), enhancedStrategicContent);
  
  console.log(`✅ Generated strategic alignment assessment`);
  console.log(`   Citations: ${strategicMetrics.total_citations}`);
  console.log(`   Credibility Score: ${strategicMetrics.credibility_score}/100`);
  console.log(`   Recency Score: ${strategicMetrics.recency_score}/100`);
  console.log(`   Sources: ${strategicCitations.map(c => c.organization).join(', ')}\n`);

  // Demo Summary
  console.log('📋 Citation Integration Demo Summary');
  console.log('===================================');
  console.log(`Total documents generated: 3`);
  console.log(`Total citations used: ${businessMetrics.total_citations + businessCaseMetrics.total_citations + strategicMetrics.total_citations}`);
  console.log(`Average credibility score: ${Math.round((businessMetrics.credibility_score + businessCaseMetrics.credibility_score + strategicMetrics.credibility_score) / 3)}/100`);
  console.log(`\nAuthoritative sources included:`);
  
  const allCitations = [...businessCitations, ...businessCaseCitations, ...strategicCitations];
  const uniqueOrganizations = [...new Set(allCitations.map(c => c.organization))];
  uniqueOrganizations.forEach(org => console.log(`  • ${org}`));
  
  console.log(`\nGenerated files:`);
  console.log(`  • business-opportunity-analysis.md`);
  console.log(`  • business-case.md`);
  console.log(`  • strategic-alignment.md`);
  
  console.log(`\n🎉 Citation Integration Demo Complete!`);
  console.log(`\nKey Features Demonstrated:`);
  console.log(`✅ Automatic citation finding based on content keywords`);
  console.log(`✅ Quality scoring with credibility and recency metrics`);
  console.log(`✅ Professional bibliography generation`);
  console.log(`✅ Inline citations with proper formatting`);
  console.log(`✅ Authoritative sources from McKinsey, Gartner, BCG, etc.`);
}

// Run the demo
runCitationDemo().catch(console.error);