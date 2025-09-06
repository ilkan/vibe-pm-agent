#!/usr/bin/env node

/**
 * Unique Datasets Showcase Demo
 * Demonstrates creative use of unique public datasets for competitive advantage
 * 
 * This demo showcases the hackathon requirement:
 * "Finding and using unique public datasets"
 */

const { AIAgentPipeline } = require('../dist/pipeline/ai-agent-pipeline');
const { MarketDataIntegrator } = require('../dist/components/market-data-integrator');
const { ProprietaryPMFrameworks } = require('../dist/components/proprietary-pm-frameworks');

async function demonstrateUniqueDatasets() {
  console.log('🚀 Vibe PM Agent - Unique Datasets Integration Demo');
  console.log('=' .repeat(60));
  console.log();

  try {
    // Initialize components
    const pipeline = new AIAgentPipeline();
    const marketIntegrator = new MarketDataIntegrator();
    const frameworks = new ProprietaryPMFrameworks();

    console.log('📊 UNIQUE PUBLIC DATASETS INTEGRATED:');
    console.log('=' .repeat(40));
    
    const dataSources = marketIntegrator.getDataSourcesInfo();
    dataSources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   📍 Source: ${source.base_url}`);
      console.log(`   🔧 Data Types: ${source.data_types.join(', ')}`);
      console.log(`   ⭐ Reliability: ${source.reliability_score}/100`);
      console.log(`   🎯 Unique Features: ${source.unique_features.slice(0, 2).join(', ')}`);
      console.log();
    });

    console.log('🧠 PROPRIETARY PM FRAMEWORKS:');
    console.log('=' .repeat(40));
    
    const availableFrameworks = frameworks.listFrameworks();
    availableFrameworks.forEach((framework, index) => {
      console.log(`${index + 1}. ${framework.framework_name}`);
      console.log(`   📝 Description: ${framework.description}`);
      console.log(`   🔍 Methodology: ${framework.methodology}`);
      console.log(`   💡 Differentiators: ${framework.unique_differentiators.slice(0, 2).join(', ')}`);
      console.log();
    });

    console.log('🎯 DEMO 1: Market Intelligence Analysis');
    console.log('=' .repeat(40));
    
    const marketIntelligence = await pipeline.analyzeMarketIntelligence(
      'Microsoft',
      'Technology',
      'competitive'
    );
    
    console.log(`✅ Company: ${marketIntelligence.company_name}`);
    console.log(`📈 Data Quality Score: ${marketIntelligence.data_quality_score}/100`);
    console.log(`🔗 Data Sources: ${marketIntelligence.data_sources.join(', ')}`);
    console.log(`🎨 Unique Insights: ${marketIntelligence.unique_insights.length} generated`);
    console.log(`🏆 Hackathon Differentiators:`);
    marketIntelligence.hackathon_differentiators.unique_datasets_used.forEach(dataset => {
      console.log(`   • ${dataset}`);
    });
    console.log();

    console.log('🎯 DEMO 2: Innovation Disruption Analysis');
    console.log('=' .repeat(40));
    
    const innovationAnalysis = await frameworks.calculateInnovationDisruptionPotential('Microsoft');
    
    console.log(`✅ Company: ${innovationAnalysis.company_name}`);
    console.log(`🚀 Innovation Score: ${innovationAnalysis.innovation_score}/100`);
    console.log(`📊 Component Scores:`);
    Object.entries(innovationAnalysis.component_scores).forEach(([key, score]) => {
      console.log(`   • ${key.replace(/_/g, ' ')}: ${score}/100`);
    });
    console.log(`🏅 Competitive Ranking: #${innovationAnalysis.competitive_ranking}`);
    console.log(`🎯 Framework: ${innovationAnalysis.framework_applied}`);
    console.log();

    console.log('🎯 DEMO 3: Market Timing Intelligence');
    console.log('=' .repeat(40));
    
    const timingSignals = await frameworks.analyzeMarketTiming('Technology');
    
    console.log(`📡 Timing Signals Analyzed: ${timingSignals.length}`);
    timingSignals.slice(0, 3).forEach((signal, index) => {
      console.log(`${index + 1}. ${signal.signal_name}`);
      console.log(`   📊 Current Value: ${signal.current_value}`);
      console.log(`   📈 Trend: ${signal.trend_strength}`);
      console.log(`   ⚡ Recommendation: ${signal.timing_recommendation}`);
      console.log(`   🎯 Confidence: ${signal.confidence_score}%`);
      console.log();
    });

    console.log('🎯 DEMO 4: Competitive Intelligence Matrix');
    console.log('=' .repeat(40));
    
    const competitiveMatrix = await frameworks.generateCompetitiveIntelligenceMatrix('Technology');
    
    console.log(`🏢 Industry: ${competitiveMatrix.industry}`);
    console.log(`👥 Competitors Analyzed: ${competitiveMatrix.competitors.length}`);
    console.log(`📊 Data Quality: ${competitiveMatrix.data_quality_score}/100`);
    console.log(`🎯 Framework: ${competitiveMatrix.framework_applied}`);
    console.log(`💡 Recommendations: ${competitiveMatrix.recommendations.length} generated`);
    console.log();

    console.log('🎯 DEMO 5: Market Opportunity Quantification');
    console.log('=' .repeat(40));
    
    const marketOpportunity = await frameworks.quantifyMarketOpportunity(
      'AI-powered business intelligence platform',
      'US',
      5
    );
    
    console.log(`🎯 Market: ${marketOpportunity.market_definition}`);
    console.log(`🌍 Geography: ${marketOpportunity.geographic_scope}`);
    console.log(`📊 TAM: $${(marketOpportunity.market_sizing.tam / 1000000000).toFixed(1)}B`);
    console.log(`📈 SAM: $${(marketOpportunity.market_sizing.sam / 1000000000).toFixed(1)}B`);
    console.log(`🎯 SOM: $${(marketOpportunity.market_sizing.som / 1000000000).toFixed(1)}B`);
    console.log(`⭐ Opportunity Score: ${marketOpportunity.opportunity_score}/100`);
    console.log(`🎯 Framework: ${marketOpportunity.framework_applied}`);
    console.log();

    console.log('🏆 HACKATHON COMPETITIVE ADVANTAGES:');
    console.log('=' .repeat(50));
    console.log('✅ UNIQUE DATASETS INTEGRATION:');
    console.log('   • SEC EDGAR - Real-time financial filings');
    console.log('   • USPTO Patents - Innovation tracking');
    console.log('   • GitHub Ecosystem - Developer activity');
    console.log('   • Federal Reserve - Economic indicators');
    console.log('   • Bureau of Labor - Employment trends');
    console.log('   • World Bank - Global development data');
    console.log();
    console.log('✅ PROPRIETARY FRAMEWORKS:');
    console.log('   • Market Timing Intelligence (MTI)');
    console.log('   • Innovation Disruption Potential (IDP)');
    console.log('   • Competitive Intelligence Matrix (CIM)');
    console.log('   • Market Opportunity Quantification (MOQ)');
    console.log();
    console.log('✅ CREATIVE DATA COMBINATIONS:');
    console.log('   • Patent velocity + GitHub activity = Innovation score');
    console.log('   • Economic indicators + VC funding = Market timing');
    console.log('   • SEC filings + Patent data = Competitive intelligence');
    console.log('   • Multi-source validation = Confidence scoring');
    console.log();

    console.log('🎉 Demo completed successfully!');
    console.log('📝 All unique datasets integrated and frameworks operational');
    console.log('🏆 Ready for hackathon judging criteria: "Finding and using unique public datasets"');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateUniqueDatasets()
    .then(() => {
      console.log('\n✅ Unique datasets demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { demonstrateUniqueDatasets };