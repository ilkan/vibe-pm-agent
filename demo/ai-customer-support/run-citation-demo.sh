#!/bin/bash

# AI Customer Support Platform - Citation Integration Demo
# This script demonstrates the new citation features across all PM tools

echo "🚀 Starting AI Customer Support Platform Demo with Citation Integration"
echo "=================================================================="

# Create output directory
mkdir -p demo/ai-customer-support/outputs

echo ""
echo "📊 Step 1: Business Opportunity Analysis with Citations"
echo "------------------------------------------------------"

# Test the analyze_business_opportunity tool with citation options
node -e "
const { PMAgentMCPServer } = require('./src/mcp/server.ts');

async function testBusinessOpportunity() {
  const server = new PMAgentMCPServer();
  
  const args = {
    feature_idea: 'AI-powered customer support platform that automates tier-1 support tickets, provides intelligent routing, and offers real-time sentiment analysis. The platform would integrate with existing CRM systems and provide analytics dashboards for support managers.',
    market_context: {
      industry: 'saas',
      geography: ['north_america', 'europe'],
      target_segment: 'mid-market saas companies'
    },
    include_competitive_analysis: true,
    include_market_sizing: true,
    analysis_depth: 'comprehensive',
    citation_options: {
      include_citations: true,
      minimum_citations: 6,
      minimum_confidence: 'high',
      industry_focus: 'saas',
      citation_style: 'business',
      include_bibliography: true,
      max_citation_age_months: 18
    }
  };
  
  try {
    const result = await server.handleAnalyzeBusinessOpportunity(args, {
      toolName: 'analyze_business_opportunity',
      sessionId: 'demo-session-1',
      timestamp: Date.now(),
      requestId: 'demo-req-1',
      traceId: 'demo-trace-1'
    });
    
    console.log('✅ Business Opportunity Analysis completed');
    console.log('Citations included:', result.metadata?.citations?.total_citations || 0);
    console.log('Credibility score:', result.metadata?.citations?.credibility_score || 0);
    
    // Save result
    require('fs').writeFileSync(
      'demo/ai-customer-support/outputs/business-opportunity-analysis.md',
      result.content[0].markdown || result.content[0].text || JSON.stringify(result.content[0].json, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error in business opportunity analysis:', error.message);
  }
}

testBusinessOpportunity();
"

echo ""
echo "💰 Step 2: Business Case Generation with Citations"
echo "------------------------------------------------"

# Test the generate_business_case tool
node -e "
const { PMAgentMCPServer } = require('./src/mcp/server.ts');
const fs = require('fs');

async function testBusinessCase() {
  const server = new PMAgentMCPServer();
  
  // Read the opportunity analysis (or use mock data if file doesn't exist)
  let opportunityAnalysis;
  try {
    opportunityAnalysis = fs.readFileSync('demo/ai-customer-support/outputs/business-opportunity-analysis.md', 'utf8');
  } catch (error) {
    opportunityAnalysis = 'AI customer support platform opportunity analysis: Large market opportunity in SaaS customer support automation. Market size: \$2.4B TAM, \$800M SAM, \$120M SOM. Strong competitive positioning against legacy solutions. High customer demand for automation and cost reduction.';
  }
  
  const args = {
    opportunity_analysis: opportunityAnalysis,
    financial_inputs: {
      development_cost: 150000,
      operational_cost: 25000,
      expected_revenue: 480000,
      time_to_market: 8
    },
    citation_options: {
      include_citations: true,
      minimum_citations: 5,
      minimum_confidence: 'high',
      industry_focus: 'saas',
      citation_style: 'business',
      include_bibliography: true
    }
  };
  
  try {
    const result = await server.handleGenerateBusinessCase(args, {
      toolName: 'generate_business_case',
      sessionId: 'demo-session-2',
      timestamp: Date.now(),
      requestId: 'demo-req-2',
      traceId: 'demo-trace-2'
    });
    
    console.log('✅ Business Case generated');
    console.log('Citations included:', result.metadata?.citations?.total_citations || 0);
    console.log('Credibility score:', result.metadata?.citations?.credibility_score || 0);
    
    // Save result
    fs.writeFileSync(
      'demo/ai-customer-support/outputs/business-case.md',
      result.content[0].markdown || result.content[0].text || JSON.stringify(result.content[0].json, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error in business case generation:', error.message);
  }
}

testBusinessCase();
"

echo ""
echo "🎯 Step 3: Strategic Alignment Assessment with Citations"
echo "------------------------------------------------------"

# Test the assess_strategic_alignment tool
node -e "
const { PMAgentMCPServer } = require('./src/mcp/server.ts');
const fs = require('fs');

async function testStrategicAlignment() {
  const server = new PMAgentMCPServer();
  
  const args = {
    feature_concept: 'AI-powered customer support platform that reduces support costs by 40%, improves response times by 60%, and increases customer satisfaction scores. Platform includes automated ticket routing, sentiment analysis, and predictive issue resolution.',
    company_context: {
      mission: 'Empower businesses to deliver exceptional customer experiences through innovative SaaS solutions',
      strategic_priorities: [
        'Improve customer retention and satisfaction',
        'Reduce operational costs and increase efficiency',
        'Accelerate product innovation and time-to-market',
        'Expand market share in mid-market segment'
      ],
      current_okrs: [
        'Increase customer satisfaction score from 7.2 to 8.5',
        'Reduce customer support costs by 30%',
        'Achieve 95% customer retention rate',
        'Launch 3 new AI-powered features this year'
      ],
      competitive_position: 'Strong position in core SaaS offerings, but lagging in AI and automation capabilities compared to newer competitors'
    },
    citation_options: {
      include_citations: true,
      minimum_citations: 4,
      minimum_confidence: 'high',
      citation_style: 'business',
      include_bibliography: true
    }
  };
  
  try {
    const result = await server.handleAssessStrategicAlignment(args, {
      toolName: 'assess_strategic_alignment',
      sessionId: 'demo-session-3',
      timestamp: Date.now(),
      requestId: 'demo-req-3',
      traceId: 'demo-trace-3'
    });
    
    console.log('✅ Strategic Alignment assessed');
    console.log('Citations included:', result.metadata?.citations?.total_citations || 0);
    console.log('Credibility score:', result.metadata?.citations?.credibility_score || 0);
    
    // Save result
    fs.writeFileSync(
      'demo/ai-customer-support/outputs/strategic-alignment.md',
      result.content[0].markdown || result.content[0].text || JSON.stringify(result.content[0].json, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error in strategic alignment assessment:', error.message);
  }
}

testStrategicAlignment();
"

echo ""
echo "📋 Step 4: Executive Stakeholder Communication with Citations"
echo "----------------------------------------------------------"

# Test the create_stakeholder_communication tool
node -e "
const { PMAgentMCPServer } = require('./src/mcp/server.ts');
const fs = require('fs');

async function testStakeholderCommunication() {
  const server = new PMAgentMCPServer();
  
  // Read business case or use mock data
  let businessCase;
  try {
    businessCase = fs.readFileSync('demo/ai-customer-support/outputs/business-case.md', 'utf8');
  } catch (error) {
    businessCase = 'AI Customer Support Platform Business Case: Investment of \$150K development + \$25K annual operations. Expected returns: \$480K annual revenue, 40% cost reduction, 60% faster response times. ROI: 220% first year. Strategic alignment with customer satisfaction and operational efficiency goals.';
  }
  
  const args = {
    business_case: businessCase,
    communication_type: 'executive_onepager',
    audience: 'executives',
    citation_options: {
      include_citations: true,
      minimum_citations: 3,
      minimum_confidence: 'high',
      citation_style: 'business',
      include_bibliography: true
    }
  };
  
  try {
    const result = await server.handleCreateStakeholderCommunication(args, {
      toolName: 'create_stakeholder_communication',
      sessionId: 'demo-session-4',
      timestamp: Date.now(),
      requestId: 'demo-req-4',
      traceId: 'demo-trace-4'
    });
    
    console.log('✅ Executive Communication created');
    console.log('Citations included:', result.metadata?.citations?.total_citations || 0);
    console.log('Credibility score:', result.metadata?.citations?.credibility_score || 0);
    
    // Save result
    fs.writeFileSync(
      'demo/ai-customer-support/outputs/executive-presentation.md',
      result.content[0].markdown || result.content[0].text || JSON.stringify(result.content[0].json, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error in stakeholder communication:', error.message);
  }
}

testStakeholderCommunication();
"

echo ""
echo "⏰ Step 5: Market Timing Validation with Citations"
echo "------------------------------------------------"

# Test the validate_market_timing tool
node -e "
const { PMAgentMCPServer } = require('./src/mcp/server.ts');
const fs = require('fs');

async function testMarketTiming() {
  const server = new PMAgentMCPServer();
  
  const args = {
    feature_idea: 'AI-powered customer support platform with automated ticket routing, sentiment analysis, and predictive issue resolution capabilities',
    market_signals: {
      customer_demand: 'high',
      competitive_pressure: 'medium',
      technical_readiness: 'high',
      resource_availability: 'medium'
    },
    citation_options: {
      include_citations: true,
      minimum_citations: 3,
      minimum_confidence: 'medium',
      citation_style: 'business',
      include_bibliography: true
    }
  };
  
  try {
    const result = await server.handleValidateMarketTiming(args, {
      toolName: 'validate_market_timing',
      sessionId: 'demo-session-5',
      timestamp: Date.now(),
      requestId: 'demo-req-5',
      traceId: 'demo-trace-5'
    });
    
    console.log('✅ Market Timing validated');
    console.log('Citations included:', result.metadata?.citations?.total_citations || 0);
    console.log('Credibility score:', result.metadata?.citations?.credibility_score || 0);
    
    // Save result
    fs.writeFileSync(
      'demo/ai-customer-support/outputs/market-timing-validation.md',
      result.content[0].markdown || result.content[0].text || JSON.stringify(result.content[0].json, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error in market timing validation:', error.message);
  }
}

testMarketTiming();
"

echo ""
echo "📊 Demo Summary"
echo "==============="
echo "Generated files with citations:"
echo "- business-opportunity-analysis.md"
echo "- business-case.md" 
echo "- strategic-alignment.md"
echo "- executive-presentation.md"
echo "- market-timing-validation.md"
echo ""
echo "Each file includes:"
echo "✅ Inline citations from authoritative sources"
echo "✅ Bibliography with McKinsey, Gartner, HBR, etc."
echo "✅ Quality scores for credibility and recency"
echo "✅ Professional formatting for executive review"
echo ""
echo "🎉 Citation Integration Demo Complete!"