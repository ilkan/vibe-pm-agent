/**
 * Demonstration of the ConfidenceScoringEngine
 * 
 * This example shows how to use the confidence scoring system
 * to evaluate claims and generate confidence reports.
 */

import { ConfidenceScoringEngine } from '../src/components/confidence-scoring-engine';
import { Citation, CitationSourceType, CitationConfidence } from '../src/models/citations';

// Example usage of the ConfidenceScoringEngine
async function demonstrateConfidenceScoring() {
  console.log('🎯 Confidence Scoring Engine Demo\n');

  // Initialize the engine
  const engine = new ConfidenceScoringEngine();

  // Example sources with varying quality
  const highQualitySources: Citation[] = [
    {
      id: '1',
      title: 'Global Market Analysis 2024',
      url: 'https://mckinsey.com/industries/technology/our-insights/global-market-analysis-2024',
      domain: 'mckinsey.com',
      published_at: '2024-01-15',
      source_type: CitationSourceType.CONSULTING_STUDY,
      confidence: CitationConfidence.HIGH,
      key_finding: 'AI market expected to grow 35% annually through 2027',
      methodology: 'Comprehensive survey of 1,200 technology executives across 15 countries, supplemented by financial analysis of 500 public companies',
      sample_size: 1200,
      geographic_scope: 'Global',
      organization: 'McKinsey & Company',
    },
    {
      id: '2',
      title: 'Artificial Intelligence Market Research Report',
      url: 'https://gartner.com/en/research/ai-market-2024',
      domain: 'gartner.com',
      published_at: '2024-02-01',
      source_type: CitationSourceType.INDUSTRY_REPORT,
      confidence: CitationConfidence.HIGH,
      key_finding: 'Enterprise AI adoption reached 38% in 2024, with 34% growth in market size',
      methodology: 'Primary research including surveys, interviews, and market analysis',
      sample_size: 800,
      geographic_scope: 'North America, Europe, Asia-Pacific',
      organization: 'Gartner Inc.',
    },
    {
      id: '3',
      title: 'AI Investment Trends: Academic Perspective',
      url: 'https://stanford.edu/research/ai-investment-trends-2024',
      domain: 'stanford.edu',
      published_at: '2024-01-30',
      source_type: CitationSourceType.ACADEMIC_PAPER,
      confidence: CitationConfidence.HIGH,
      key_finding: 'Venture capital investment in AI startups increased 42% year-over-year',
      methodology: 'Longitudinal analysis of investment data from 2019-2024, peer-reviewed methodology',
      sample_size: 2500,
      geographic_scope: 'Global',
      organization: 'Stanford AI Lab',
    }
  ];

  const mediumQualitySources: Citation[] = [
    {
      id: '4',
      title: 'Tech Industry Blog: AI Trends',
      url: 'https://techcrunch.com/ai-trends-2024',
      domain: 'techcrunch.com',
      published_at: '2023-11-15',
      source_type: CitationSourceType.COMPANY_BLOG,
      confidence: CitationConfidence.MEDIUM,
      key_finding: 'AI market showing strong growth signals',
      // Limited methodology documentation
    }
  ];

  // Test different claim scenarios
  console.log('📊 Testing High-Quality Claim:');
  const highQualityClaim = 'AI market is experiencing rapid growth with 35% annual expansion';
  const highQualityResult = engine.calculateClaimConfidence(highQualityClaim, highQualitySources);
  
  console.log(`Claim: "${highQualityClaim}"`);
  console.log(`Overall Confidence: ${highQualityResult.overall}%`);
  console.log('Breakdown:');
  console.log(`  - Source Quality: ${Math.round(highQualityResult.breakdown.sourceQuality)}%`);
  console.log(`  - Evidence Strength: ${Math.round(highQualityResult.breakdown.evidenceStrength)}%`);
  console.log(`  - Methodology Clarity: ${Math.round(highQualityResult.breakdown.methodologyClarity)}%`);
  console.log(`  - Sample Size Adequacy: ${Math.round(highQualityResult.breakdown.sampleSizeAdequacy)}%`);
  console.log(`  - Recency Factor: ${Math.round(highQualityResult.breakdown.recencyFactor)}%`);
  console.log(`Confidence Interval: ${Math.round(highQualityResult.confidenceInterval.lower)}% - ${Math.round(highQualityResult.confidenceInterval.upper)}% (${highQualityResult.confidenceInterval.level}% confidence)`);
  
  if (highQualityResult.uncertaintyFactors.length > 0) {
    console.log('Uncertainty Factors:');
    highQualityResult.uncertaintyFactors.forEach(factor => console.log(`  - ${factor}`));
  }
  console.log();

  console.log('📊 Testing Medium-Quality Claim:');
  const mediumQualityClaim = 'AI trends are positive according to industry observers';
  const mediumQualityResult = engine.calculateClaimConfidence(mediumQualityClaim, mediumQualitySources);
  
  console.log(`Claim: "${mediumQualityClaim}"`);
  console.log(`Overall Confidence: ${mediumQualityResult.overall}%`);
  console.log('Uncertainty Factors:');
  mediumQualityResult.uncertaintyFactors.forEach(factor => console.log(`  - ${factor}`));
  console.log();

  // Test document-level confidence aggregation
  console.log('📋 Testing Document-Level Confidence:');
  const documentConfidence = engine.aggregateDocumentConfidence([
    highQualityResult,
    mediumQualityResult
  ]);
  
  console.log(`Document Overall Confidence: ${documentConfidence.overallConfidence}%`);
  console.log(`Recommendation Reliability: ${documentConfidence.recommendationReliability}`);
  console.log('Weakest Claims:');
  documentConfidence.weakestClaims.forEach(claim => 
    console.log(`  - ${claim.claim}: ${claim.confidence}%`)
  );
  console.log('Strongest Claims:');
  documentConfidence.strongestClaims.forEach(claim => 
    console.log(`  - ${claim.claim}: ${claim.confidence}%`)
  );
  console.log();

  // Test confidence factors tracking
  console.log('🔍 Confidence Factors Analysis:');
  const confidenceFactors = engine.trackConfidenceFactors(highQualitySources);
  confidenceFactors.forEach(factor => {
    console.log(`${factor.name}: ${Math.round(factor.score)}% (${factor.impact} impact)`);
    console.log(`  ${factor.description}`);
  });
  console.log();

  // Generate comprehensive report
  console.log('📄 Generating Comprehensive Confidence Report:');
  const claims = [
    { claim: highQualityClaim, sources: highQualitySources },
    { claim: mediumQualityClaim, sources: mediumQualitySources }
  ];
  
  const report = engine.generateConfidenceReport('AI Market Analysis Document', claims);
  
  console.log(`Document ID: ${report.documentId}`);
  console.log(`Overall Document Confidence: ${report.overallConfidence.overallConfidence}%`);
  console.log(`Generated: ${report.generatedAt.toISOString()}`);
  console.log();
  
  console.log('Claim Analysis:');
  report.claimAnalysis.forEach((analysis, index) => {
    console.log(`  ${index + 1}. "${analysis.claim}"`);
    console.log(`     Confidence: ${analysis.confidence.overall}%`);
    console.log(`     Supporting Sources: ${analysis.supportingSources.length}`);
    if (analysis.recommendations.length > 0) {
      console.log(`     Recommendations:`);
      analysis.recommendations.forEach(rec => console.log(`       - ${rec}`));
    }
  });
  console.log();

  console.log('Methodology Transparency:');
  console.log(`  Scoring Method: ${report.methodologyTransparency.scoringMethod}`);
  console.log(`  Key Assumptions:`);
  report.methodologyTransparency.assumptions.forEach(assumption => 
    console.log(`    - ${assumption}`)
  );
  console.log(`  Limitations:`);
  report.methodologyTransparency.limitations.forEach(limitation => 
    console.log(`    - ${limitation}`)
  );

  console.log('\n✅ Confidence Scoring Demo Complete!');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateConfidenceScoring().catch(console.error);
}

export { demonstrateConfidenceScoring };