#!/usr/bin/env node

/**
 * Customer Support Automation - Multi-Scenario Business Case Demo
 * 
 * This script demonstrates comprehensive business case development:
 * 1. Multi-Scenario Financial Analysis (Conservative/Balanced/Bold)
 * 2. Risk Assessment and Mitigation Strategies
 * 3. Stakeholder Communication Generation
 * 4. Evidence-Backed Decision Making
 */

const fs = require('fs').promises;
const path = require('path');

// Mock MCP client with business case focus
class BusinessCaseMCPClient {
  constructor() {
    this.tools = {
      generate_business_case: this.generateBusinessCase.bind(this),
      create_stakeholder_communication: this.createStakeholderCommunication.bind(this),
      analyze_business_opportunity: this.analyzeBusinessOpportunity.bind(this),
      assess_strategic_alignment: this.assessStrategicAlignment.bind(this)
    };
  }

  async generateBusinessCase(params) {
    return {
      executive_summary: {
        investment_ask: "$650,000 implementation + $180,000 annual operations",
        expected_return: "$2.9M savings over 3 years (340% ROI)",
        payback_period: "10 months",
        strategic_value: "Scalable customer experience excellence with AI-powered efficiency",
        confidence_score: 85
      },
      financial_projections: {
        scenarios: {
          conservative: {
            roi_percentage: 220,
            total_savings: "$1.8M",
            annual_savings: "$600K",
            assumptions: "30% ticket automation, 20% response time improvement, 70% success rate",
            payback_months: 14,
            risk_factors: ["Lower AI accuracy", "Slower adoption", "Integration challenges"]
          },
          balanced: {
            roi_percentage: 340,
            total_savings: "$2.9M",
            annual_savings: "$970K",
            assumptions: "50% ticket automation, 40% response time improvement, 85% success rate",
            payback_months: 10,
            risk_factors: ["Standard implementation risks", "Market conditions"]
          },
          bold: {
            roi_percentage: 480,
            total_savings: "$4.2M",
            annual_savings: "$1.4M",
            assumptions: "70% ticket automation, 60% response time improvement, 95% success rate",
            payback_months: 8,
            risk_factors: ["Requires perfect execution", "High customer adoption"]
          }
        },
        cost_breakdown: {
          ai_platform_development: "$400,000",
          integration_setup: "$150,000",
          training_change_management: "$100,000",
          annual_operations: "$180,000/year",
          total_3_year_investment: "$1.19M"
        },
        savings_sources: [
          {
            category: "Agent Productivity",
            conservative: "$500K/year",
            balanced: "$800K/year", 
            bold: "$1.2M/year",
            description: "Reduced manual work through automation"
          },
          {
            category: "Faster Resolution",
            conservative: "$200K/year",
            balanced: "$350K/year",
            bold: "$500K/year", 
            description: "Customer retention through improved experience"
          },
          {
            category: "24/7 Availability",
            conservative: "$150K/year",
            balanced: "$250K/year",
            bold: "$400K/year",
            description: "Off-hours support without additional staffing"
          },
          {
            category: "Quality Consistency",
            conservative: "$100K/year",
            balanced: "$200K/year",
            bold: "$300K/year",
            description: "Reduced escalations and rework"
          }
        ]
      },
      risk_analysis: {
        technical_risks: {
          ai_accuracy_below_target: {
            probability: "Medium (30%)",
            impact: "High",
            financial_impact: "$300K annual savings reduction",
            mitigation: "Gradual rollout with human oversight, continuous model training, fallback procedures",
            contingency_cost: "$50K additional training budget"
          },
          integration_complexity: {
            probability: "Medium (25%)",
            impact: "Medium", 
            financial_impact: "$100K additional development cost",
            mitigation: "Phased integration approach, API-first design, extensive testing",
            contingency_cost: "$75K additional development time"
          },
          performance_scalability: {
            probability: "Low (15%)",
            impact: "High",
            financial_impact: "$200K infrastructure upgrade",
            mitigation: "Load testing, cloud-native architecture, performance monitoring",
            contingency_cost: "$100K infrastructure reserve"
          }
        },
        business_risks: {
          customer_satisfaction_drop: {
            probability: "Medium (35%)",
            impact: "Very High",
            financial_impact: "$500K revenue impact from churn",
            mitigation: "A/B testing, continuous feedback loops, human escalation paths",
            contingency_cost: "$25K additional monitoring tools"
          },
          agent_resistance: {
            probability: "High (60%)",
            impact: "Medium",
            financial_impact: "$150K productivity loss during transition",
            mitigation: "Comprehensive change management, training programs, job redefinition",
            contingency_cost: "$50K additional training and communication"
          },
          competitive_response: {
            probability: "High (70%)",
            impact: "Low",
            financial_impact: "$50K market share pressure",
            mitigation: "Fast execution, continuous innovation, customer experience focus",
            contingency_cost: "$30K competitive intelligence"
          }
        },
        operational_risks: {
          data_privacy_compliance: {
            probability: "Low (10%)",
            impact: "Very High",
            financial_impact: "$1M+ regulatory penalties",
            mitigation: "Compliance framework, security audits, data encryption",
            contingency_cost: "$75K compliance consulting"
          },
          vendor_dependency: {
            probability: "Medium (40%)",
            impact: "Medium",
            financial_impact: "$200K switching costs",
            mitigation: "Multi-vendor strategy, in-house AI capabilities, contract terms",
            contingency_cost: "$100K vendor diversification"
          }
        },
        overall_risk_rating: "Medium",
        risk_adjusted_roi: {
          conservative: "180% (risk-adjusted from 220%)",
          balanced: "290% (risk-adjusted from 340%)",
          bold: "400% (risk-adjusted from 480%)"
        }
      },
      implementation_timeline: {
        phase_1: {
          duration: "Months 1-3: Foundation",
          deliverables: ["AI platform setup", "Data integration", "Pilot testing with 100 tickets/day"],
          success_criteria: "80% automation accuracy, positive agent feedback",
          investment: "$300K"
        },
        phase_2: {
          duration: "Months 4-6: Expansion", 
          deliverables: ["Full deployment", "Advanced features", "Agent training"],
          success_criteria: "50% automation rate, maintained CSAT scores",
          investment: "$200K"
        },
        phase_3: {
          duration: "Months 7-9: Optimization",
          deliverables: ["Performance tuning", "Advanced analytics", "Integration expansion"],
          success_criteria: "60% automation rate, improved customer metrics",
          investment: "$150K"
        },
        phase_4: {
          duration: "Months 10-12: Innovation",
          deliverables: ["Proactive support", "Self-service enhancement", "Voice integration"],
          success_criteria: "Industry-leading metrics, competitive differentiation",
          investment: "$100K"
        }
      },
      success_metrics: {
        customer_experience: [
          "First Response Time: <30 minutes (from 4 hours)",
          "Resolution Time: 40% improvement",
          "Customer Satisfaction (CSAT): Maintain >4.2/5",
          "Net Promoter Score (NPS): Improve from 45 to 55+"
        ],
        operational_efficiency: [
          "Ticket Automation Rate: 50% fully automated",
          "Agent Productivity: 35% increase in tickets handled",
          "Escalation Rate: <15% of automated tickets",
          "24/7 Coverage: 100% availability with AI-first response"
        ],
        financial_performance: [
          "Cost per Ticket: 40% reduction",
          "Support Cost as % of Revenue: 3.2% to 2.1%",
          "Customer Lifetime Value: 15% increase",
          "Churn Reduction: 20% reduction in support-related churn"
        ]
      },
      competitive_benchmarking: {
        industry_standards: {
          average_automation_rate: "35%",
          typical_roi: "180-250%",
          implementation_time: "12-18 months",
          customer_satisfaction_impact: "Neutral to +5%"
        },
        our_projections: {
          automation_rate: "50%",
          projected_roi: "340%",
          implementation_time: "9 months", 
          customer_satisfaction_impact: "+10%"
        },
        best_in_class: [
          "Zendesk: 45% automation, 300% ROI",
          "Salesforce Service Cloud: 40% automation, 280% ROI",
          "Intercom: 55% automation, 350% ROI"
        ]
      },
      evidence: {
        confidence_score: 85,
        evidence_quality: "High",
        methodology: "Industry benchmarking, comparable company analysis, financial modeling",
        citations: [
          {
            id: "forrester_customer_service_ai_2024",
            source: "Forrester Research",
            title: "The State of AI in Customer Service 2024",
            url: "https://www.forrester.com/report/the-state-of-ai-in-customer-service-2024/RES179234",
            publication_date: "2024-04-15",
            credibility_rating: "A",
            relevance_score: 0.94,
            key_finding: "AI automation delivers average 340% ROI with 50% ticket automation rates"
          },
          {
            id: "gartner_customer_service_automation",
            source: "Gartner Research", 
            title: "Market Guide for Customer Service Automation Platforms",
            url: "https://www.gartner.com/en/documents/4018456",
            publication_date: "2024-02-20",
            credibility_rating: "A",
            relevance_score: 0.91,
            key_finding: "85% of customer service leaders plan AI automation by 2025"
          },
          {
            id: "mckinsey_customer_experience_ai",
            source: "McKinsey & Company",
            title: "The Future of Customer Experience with AI",
            url: "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-future-of-customer-experience-with-ai",
            publication_date: "2024-01-30",
            credibility_rating: "A",
            relevance_score: 0.89,
            key_finding: "AI-powered customer service reduces costs by 30-50% while improving satisfaction"
          },
          {
            id: "zendesk_automation_benchmark",
            source: "Zendesk",
            title: "Customer Experience Trends Report 2024",
            url: "https://www.zendesk.com/customer-experience-trends/",
            publication_date: "2024-03-10",
            credibility_rating: "B+",
            relevance_score: 0.87,
            key_finding: "Companies with 40%+ automation see 25% higher customer satisfaction"
          },
          {
            id: "pwc_ai_roi_analysis",
            source: "PwC",
            title: "AI ROI Analysis: Customer Service Applications",
            credibility_rating: "A",
            relevance_score: 0.92,
            key_finding: "Median ROI of 290% for customer service AI implementations"
          }
        ]
      }
    };
  }

  async createStakeholderCommunication(params) {
    const { audience, communication_type } = params;
    
    if (audience === "executives" && communication_type === "executive_onepager") {
      return {
        document_type: "executive_onepager",
        content: {
          headline: "AI-Powered Customer Support: $2.9M Opportunity with 340% ROI",
          key_recommendation: "Invest $650K in AI customer support automation to achieve $2.9M savings over 3 years with 10-month payback",
          supporting_arguments: [
            {
              point: "Proven ROI with Industry Benchmarks",
              evidence: "Forrester research shows 340% average ROI for AI customer service automation",
              impact: "Conservative projection: 220% ROI, Balanced: 340% ROI, Bold: 480% ROI"
            },
            {
              point: "Critical Scalability Solution",
              evidence: "Support tickets growing 25% quarterly, costs outpacing revenue growth",
              impact: "50% ticket automation reduces cost per ticket by 40%, enables growth without proportional staffing"
            },
            {
              point: "Competitive Customer Experience Advantage",
              evidence: "Response time improvement from 4 hours to <30 minutes, 24/7 availability",
              impact: "15% increase in customer lifetime value, 20% reduction in support-related churn"
            }
          ],
          financial_summary: {
            investment: "$650K implementation + $180K annual operations",
            returns: "$970K annual savings (balanced scenario)",
            payback: "10 months",
            three_year_value: "$2.9M net savings"
          },
          implementation_plan: {
            timeline: "9 months to full deployment",
            approach: "Phased rollout with continuous optimization",
            milestones: [
              "Month 3: Pilot with 80% automation accuracy",
              "Month 6: Full deployment with 50% automation rate",
              "Month 9: Optimization with 60% automation rate",
              "Month 12: Advanced features and competitive differentiation"
            ]
          },
          risk_mitigation: {
            customer_experience: "A/B testing and human escalation paths maintain service quality",
            technical: "Gradual rollout with continuous monitoring and model improvement",
            operational: "Comprehensive change management and agent training programs"
          },
          success_metrics: [
            "50% ticket automation rate within 6 months",
            "Response time <30 minutes (from 4 hours)",
            "Maintain >4.2/5 customer satisfaction score",
            "40% reduction in cost per ticket"
          ],
          call_to_action: "Approve $650K investment to capture competitive advantage and achieve 340% ROI within 10 months"
        },
        evidence: {
          confidence_score: 88,
          pyramid_principle_structure: true,
          executive_readiness: "Board-ready",
          citations_count: 15
        }
      };
    }
    
    if (audience === "engineering_team" && communication_type === "team_announcement") {
      return {
        document_type: "technical_brief",
        content: {
          headline: "AI Customer Support Platform: Technical Implementation Overview",
          project_scope: "Build scalable AI-powered customer support automation with 50% ticket automation target",
          technical_architecture: {
            core_components: [
              "Natural Language Processing Engine (OpenAI GPT-4 + custom fine-tuning)",
              "Ticket Classification and Routing System",
              "Knowledge Base Integration and Search",
              "Response Generation and Quality Assurance",
              "Analytics and Performance Monitoring Dashboard"
            ],
            technology_stack: [
              "Backend: Node.js with TypeScript, GraphQL API",
              "AI/ML: Python with TensorFlow/PyTorch, OpenAI API",
              "Database: PostgreSQL for structured data, Elasticsearch for search",
              "Frontend: React with TypeScript, real-time WebSocket connections",
              "Infrastructure: AWS with Docker containers, Kubernetes orchestration"
            ],
            integration_requirements: [
              "Existing support platform APIs (Zendesk/Freshdesk)",
              "CRM system integration (Salesforce/HubSpot)",
              "E-commerce platform connection (Shopify/Magento)",
              "Communication channels (Email, Chat, Social Media)"
            ]
          },
          development_phases: {
            phase_1: "Core NLP engine and ticket classification (Months 1-3)",
            phase_2: "Response generation and knowledge base integration (Months 4-6)",
            phase_3: "Advanced analytics and optimization features (Months 7-9)",
            phase_4: "Voice integration and predictive capabilities (Months 10-12)"
          },
          performance_requirements: [
            "Response time: <2 seconds for ticket classification",
            "Throughput: 1000+ tickets per minute processing capacity",
            "Accuracy: >85% for automated responses, >95% for classification",
            "Availability: 99.9% uptime with automatic failover"
          ],
          team_structure: {
            ml_engineers: 2,
            backend_engineers: 2,
            frontend_engineers: 1,
            devops_engineer: 1,
            qa_engineer: 1
          }
        },
        evidence: {
          confidence_score: 82,
          technical_feasibility: "High",
          implementation_complexity: "Medium-High"
        }
      };
    }

    // Default response for other combinations
    return {
      document_type: communication_type,
      content: {
        headline: `Customer Support Automation - ${audience} Communication`,
        summary: "AI-powered customer support automation implementation plan",
        key_points: [
          "340% ROI opportunity with $2.9M savings over 3 years",
          "50% ticket automation target with maintained service quality",
          "9-month implementation timeline with phased rollout"
        ]
      },
      evidence: {
        confidence_score: 80,
        audience_alignment: "High"
      }
    };
  }

  async analyzeBusinessOpportunity(params) {
    return {
      analysis: {
        market_size: {
          total_addressable_market: "$24.8B",
          serviceable_addressable_market: "$4.2B",
          serviceable_obtainable_market: "$85M",
          growth_rate: "18.5% CAGR",
          confidence_score: 87
        },
        strategic_fit: {
          alignment_score: 91,
          key_strengths: [
            "Addresses critical operational pain point with clear ROI",
            "Leverages proven AI technologies with established vendors",
            "Aligns with customer experience and operational efficiency goals",
            "Scalable solution that grows with business volume"
          ],
          market_validation: "Strong demand validated through industry research and competitive analysis"
        },
        competitive_landscape: {
          direct_competitors: ["Zendesk Answer Bot", "Salesforce Einstein", "Intercom Resolution Bot"],
          competitive_advantage: "Integrated e-commerce workflow automation with predictive capabilities",
          market_gap: "Limited AI solutions optimized for e-commerce customer support workflows",
          differentiation_score: 78
        }
      },
      evidence: {
        confidence_score: 87,
        citations: [
          {
            id: "customer_service_ai_market_2024",
            source: "Grand View Research",
            title: "Customer Service AI Market Size & Growth Report 2024",
            credibility_rating: "B+",
            key_finding: "Customer service AI market growing 18.5% CAGR, reaching $24.8B by 2028"
          }
        ]
      }
    };
  }

  async assessStrategicAlignment(params) {
    return {
      alignment_assessment: {
        overall_score: 89,
        strategic_priorities: {
          customer_experience: {
            alignment: "Very High",
            score: 94,
            impact: "Directly improves response times and service quality"
          },
          operational_efficiency: {
            alignment: "Very High", 
            score: 92,
            impact: "Reduces costs while scaling support capabilities"
          },
          technology_innovation: {
            alignment: "High",
            score: 85,
            impact: "Establishes AI capabilities and competitive differentiation"
          }
        }
      },
      evidence: {
        confidence_score: 89
      }
    };
  }

  async callTool(toolName, params) {
    if (!this.tools[toolName]) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return await this.tools[toolName](params);
  }
}

// Demo execution functions
async function ensureOutputDirectory() {
  const outputDir = path.join(__dirname, 'outputs');
  try {
    await fs.access(outputDir);
  } catch {
    await fs.mkdir(outputDir, { recursive: true });
  }
  return outputDir;
}

async function saveOutput(filename, content) {
  const outputDir = await ensureOutputDirectory();
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, JSON.stringify(content, null, 2));
  console.log(`✅ Saved: ${filename}`);
}

async function saveMarkdownOutput(filename, content) {
  const outputDir = await ensureOutputDirectory();
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, content);
  console.log(`✅ Saved: ${filename}`);
}

function formatBusinessCaseMarkdown(businessCase) {
  return `# Customer Support Automation - Comprehensive Business Case

## Executive Summary
**Investment Ask**: ${businessCase.executive_summary.investment_ask}  
**Expected Return**: ${businessCase.executive_summary.expected_return}  
**Payback Period**: ${businessCase.executive_summary.payback_period}  
**Strategic Value**: ${businessCase.executive_summary.strategic_value}  
**Confidence**: ${businessCase.evidence.confidence_score}% (${businessCase.evidence.evidence_quality} evidence quality)

## Financial Projections - Multi-Scenario Analysis

### ROI Scenarios Comparison
| Scenario | ROI | Total Savings | Annual Savings | Payback Period | Success Rate |
|----------|-----|---------------|----------------|----------------|--------------|
| Conservative | ${businessCase.financial_projections.scenarios.conservative.roi_percentage}% | ${businessCase.financial_projections.scenarios.conservative.total_savings} | ${businessCase.financial_projections.scenarios.conservative.annual_savings} | ${businessCase.financial_projections.scenarios.conservative.payback_months} months | 70% |
| Balanced | ${businessCase.financial_projections.scenarios.balanced.roi_percentage}% | ${businessCase.financial_projections.scenarios.balanced.total_savings} | ${businessCase.financial_projections.scenarios.balanced.annual_savings} | ${businessCase.financial_projections.scenarios.balanced.payback_months} months | 85% |
| Bold | ${businessCase.financial_projections.scenarios.bold.roi_percentage}% | ${businessCase.financial_projections.scenarios.bold.total_savings} | ${businessCase.financial_projections.scenarios.bold.annual_savings} | ${businessCase.financial_projections.scenarios.bold.payback_months} months | 95% |

### Investment Breakdown
- **AI Platform Development**: ${businessCase.financial_projections.cost_breakdown.ai_platform_development}
- **Integration & Setup**: ${businessCase.financial_projections.cost_breakdown.integration_setup}
- **Training & Change Management**: ${businessCase.financial_projections.cost_breakdown.training_change_management}
- **Annual Operations**: ${businessCase.financial_projections.cost_breakdown.annual_operations}
- **Total 3-Year Investment**: ${businessCase.financial_projections.cost_breakdown.total_3_year_investment}

### Savings Sources Analysis
${businessCase.financial_projections.savings_sources.map(source => 
  `**${source.category}**  
  Conservative: ${source.conservative} | Balanced: ${source.balanced} | Bold: ${source.bold}  
  *${source.description}*`
).join('\n\n')}

## Comprehensive Risk Analysis

### Technical Risks
${Object.entries(businessCase.risk_analysis.technical_risks).map(([risk, details]) => 
  `**${risk.replace(/_/g, ' ').toUpperCase()}**  
  Probability: ${details.probability} | Impact: ${details.impact}  
  Financial Impact: ${details.financial_impact}  
  Mitigation: ${details.mitigation}  
  Contingency Cost: ${details.contingency_cost}`
).join('\n\n')}

### Business Risks
${Object.entries(businessCase.risk_analysis.business_risks).map(([risk, details]) => 
  `**${risk.replace(/_/g, ' ').toUpperCase()}**  
  Probability: ${details.probability} | Impact: ${details.impact}  
  Financial Impact: ${details.financial_impact}  
  Mitigation: ${details.mitigation}  
  Contingency Cost: ${details.contingency_cost}`
).join('\n\n')}

### Operational Risks
${Object.entries(businessCase.risk_analysis.operational_risks).map(([risk, details]) => 
  `**${risk.replace(/_/g, ' ').toUpperCase()}**  
  Probability: ${details.probability} | Impact: ${details.impact}  
  Financial Impact: ${details.financial_impact}  
  Mitigation: ${details.mitigation}  
  Contingency Cost: ${details.contingency_cost}`
).join('\n\n')}

**Overall Risk Rating**: ${businessCase.risk_analysis.overall_risk_rating}

### Risk-Adjusted ROI
- **Conservative**: ${businessCase.risk_analysis.risk_adjusted_roi.conservative}
- **Balanced**: ${businessCase.risk_analysis.risk_adjusted_roi.balanced}
- **Bold**: ${businessCase.risk_analysis.risk_adjusted_roi.bold}

## Implementation Timeline

${Object.entries(businessCase.implementation_timeline).map(([phase, details]) => 
  `### ${phase.replace('_', ' ').toUpperCase()}
  **Duration**: ${details.duration}  
  **Deliverables**: ${details.deliverables.join(', ')}  
  **Success Criteria**: ${details.success_criteria}  
  **Investment**: ${details.investment}`
).join('\n\n')}

## Success Metrics & KPIs

### Customer Experience Metrics
${businessCase.success_metrics.customer_experience.map(m => `- ${m}`).join('\n')}

### Operational Efficiency Metrics
${businessCase.success_metrics.operational_efficiency.map(m => `- ${m}`).join('\n')}

### Financial Performance Metrics
${businessCase.success_metrics.financial_performance.map(m => `- ${m}`).join('\n')}

## Competitive Benchmarking

### Industry Standards vs Our Projections
| Metric | Industry Standard | Our Projection | Competitive Advantage |
|--------|------------------|----------------|----------------------|
| Automation Rate | ${businessCase.competitive_benchmarking.industry_standards.average_automation_rate} | ${businessCase.competitive_benchmarking.our_projections.automation_rate} | +15 percentage points |
| ROI | ${businessCase.competitive_benchmarking.industry_standards.typical_roi} | ${businessCase.competitive_benchmarking.our_projections.projected_roi} | Above industry average |
| Implementation Time | ${businessCase.competitive_benchmarking.industry_standards.implementation_time} | ${businessCase.competitive_benchmarking.our_projections.implementation_time} | 25% faster |
| Customer Satisfaction Impact | ${businessCase.competitive_benchmarking.industry_standards.customer_satisfaction_impact} | ${businessCase.competitive_benchmarking.our_projections.customer_satisfaction_impact} | 2x industry impact |

### Best-in-Class Benchmarks
${businessCase.competitive_benchmarking.best_in_class.map(b => `- ${b}`).join('\n')}

## Evidence & Citations
**Methodology**: ${businessCase.evidence.methodology}

### Key Sources
${businessCase.evidence.citations.map(c => 
  `**${c.source}** (${c.credibility_rating}): ${c.title}  
  *${c.key_finding}*  
  Relevance: ${Math.round(c.relevance_score * 100)}%`
).join('\n\n')}

---
*Generated by Vibe PM Agent | Confidence: ${businessCase.evidence.confidence_score}% | Citations: ${businessCase.evidence.citations.length} | Multi-Scenario Analysis*`;
}

async function runBusinessCaseDemo() {
  console.log('🚀 Starting Multi-Scenario Business Case Demo - Customer Support Automation\n');
  
  const client = new BusinessCaseMCPClient();
  
  try {
    // Step 1: Comprehensive Business Case Generation
    console.log('💰 Step 1: Generating Multi-Scenario Business Case...');
    const businessCaseParams = {
      opportunity_analysis: "AI-powered customer support automation for e-commerce company with 10,000+ daily orders",
      financial_inputs: {
        development_cost: 650000,
        operational_cost: 180000,
        expected_revenue: 970000,
        time_to_market: 9
      }
    };
    
    const businessCase = await client.callTool('generate_business_case', businessCaseParams);
    await saveOutput('comprehensive-business-case.json', businessCase);
    await saveMarkdownOutput('comprehensive-business-case.md', formatBusinessCaseMarkdown(businessCase));
    
    // Step 2: Executive Stakeholder Communication
    console.log('📋 Step 2: Creating Executive One-Pager...');
    const executiveCommunicationParams = {
      business_case: JSON.stringify(businessCase),
      communication_type: "executive_onepager",
      audience: "executives"
    };
    
    const executiveCommunication = await client.callTool('create_stakeholder_communication', executiveCommunicationParams);
    await saveOutput('executive-onepager.json', executiveCommunication);
    
    // Step 3: Technical Team Communication
    console.log('🔧 Step 3: Creating Technical Brief...');
    const technicalCommunicationParams = {
      business_case: JSON.stringify(businessCase),
      communication_type: "team_announcement",
      audience: "engineering_team"
    };
    
    const technicalCommunication = await client.callTool('create_stakeholder_communication', technicalCommunicationParams);
    await saveOutput('technical-brief.json', technicalCommunication);
    
    // Step 4: Business Opportunity Analysis
    console.log('📊 Step 4: Analyzing Market Opportunity...');
    const opportunityParams = {
      idea: "AI-powered customer support automation platform with e-commerce workflow integration and predictive capabilities",
      market_context: {
        industry: "Customer Service AI",
        competition: "Zendesk, Salesforce Einstein, Intercom, Freshworks",
        budget_range: "medium",
        timeline: "9 months implementation"
      }
    };
    
    const businessOpportunity = await client.callTool('analyze_business_opportunity', opportunityParams);
    await saveOutput('market-opportunity-analysis.json', businessOpportunity);
    
    // Step 5: Strategic Alignment Assessment
    console.log('🎯 Step 5: Assessing Strategic Alignment...');
    const alignmentParams = {
      feature_concept: JSON.stringify(businessCase),
      company_context: {
        mission: "Deliver exceptional customer experiences while scaling efficiently",
        strategic_priorities: [
          "Customer Experience Excellence",
          "Operational Efficiency",
          "Technology Innovation",
          "Sustainable Growth"
        ],
        current_okrs: [
          "Improve customer satisfaction score to >4.5/5",
          "Reduce support cost per ticket by 30%",
          "Scale support operations without proportional headcount growth",
          "Implement AI capabilities across customer touchpoints"
        ],
        competitive_position: "Strong in e-commerce, emerging in AI-powered customer experience"
      }
    };
    
    const strategicAlignment = await client.callTool('assess_strategic_alignment', alignmentParams);
    await saveOutput('strategic-alignment.json', strategicAlignment);
    
    // Generate Business Case Summary
    console.log('📄 Generating Business Case Summary...');
    const businessCaseSummary = {
      analysis_type: "Multi-Scenario Business Case",
      execution_time: new Date().toISOString(),
      key_findings: {
        financial_projections: {
          conservative_roi: businessCase.financial_projections.scenarios.conservative.roi_percentage + "%",
          balanced_roi: businessCase.financial_projections.scenarios.balanced.roi_percentage + "%",
          bold_roi: businessCase.financial_projections.scenarios.bold.roi_percentage + "%",
          recommended_scenario: "Balanced",
          payback_period: businessCase.executive_summary.payback_period,
          confidence: businessCase.evidence.confidence_score
        },
        risk_assessment: {
          overall_risk_rating: businessCase.risk_analysis.overall_risk_rating,
          key_technical_risks: Object.keys(businessCase.risk_analysis.technical_risks).length,
          key_business_risks: Object.keys(businessCase.risk_analysis.business_risks).length,
          risk_adjusted_roi: businessCase.risk_analysis.risk_adjusted_roi.balanced
        },
        strategic_alignment: {
          overall_score: strategicAlignment.alignment_assessment.overall_score,
          customer_experience_alignment: strategicAlignment.alignment_assessment.strategic_priorities.customer_experience.score,
          operational_efficiency_alignment: strategicAlignment.alignment_assessment.strategic_priorities.operational_efficiency.score,
          confidence: strategicAlignment.evidence.confidence_score
        },
        market_opportunity: {
          market_size: businessOpportunity.analysis.market_size.serviceable_obtainable_market,
          growth_rate: businessOpportunity.analysis.market_size.growth_rate,
          strategic_fit: businessOpportunity.analysis.strategic_fit.alignment_score,
          confidence: businessOpportunity.evidence.confidence_score
        }
      },
      recommendations: {
        investment_decision: "PROCEED - Strong business case with manageable risks",
        recommended_scenario: "Balanced scenario (340% ROI, $2.9M savings)",
        implementation_approach: "Phased rollout with continuous optimization",
        key_success_factors: [
          "Comprehensive change management and agent training",
          "Continuous monitoring and model improvement",
          "Strong customer feedback loops and quality assurance",
          "Phased automation with human oversight"
        ]
      },
      documents_generated: [
        "comprehensive-business-case.md",
        "executive-onepager.json",
        "technical-brief.json",
        "market-opportunity-analysis.json",
        "strategic-alignment.json"
      ],
      total_citations: 22,
      average_confidence: 86
    };
    
    await saveOutput('business-case-summary.json', businessCaseSummary);
    
    console.log('\n✅ Multi-Scenario Business Case Demo Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Investment Decision: ${businessCaseSummary.recommendations.investment_decision}`);
    console.log(`   • Recommended Scenario: ${businessCaseSummary.recommendations.recommended_scenario}`);
    console.log(`   • Conservative ROI: ${businessCaseSummary.key_findings.financial_projections.conservative_roi}`);
    console.log(`   • Balanced ROI: ${businessCaseSummary.key_findings.financial_projections.balanced_roi}`);
    console.log(`   • Bold ROI: ${businessCaseSummary.key_findings.financial_projections.bold_roi}`);
    console.log(`   • Payback Period: ${businessCaseSummary.key_findings.financial_projections.payback_period}`);
    console.log(`   • Risk Rating: ${businessCaseSummary.key_findings.risk_assessment.overall_risk_rating}`);
    console.log(`   • Strategic Alignment: ${businessCaseSummary.key_findings.strategic_alignment.overall_score}/100`);
    console.log(`   • Average Confidence: ${businessCaseSummary.average_confidence}%`);
    console.log(`   • Total Citations: ${businessCaseSummary.total_citations}`);
    
    console.log('\n📁 View outputs in the ./outputs/ directory');
    console.log('   Run: ./show-business-case.sh to view all results');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runBusinessCaseDemo();
}

module.exports = { runBusinessCaseDemo };