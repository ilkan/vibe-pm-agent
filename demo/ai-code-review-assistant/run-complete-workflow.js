#!/usr/bin/env node

/**
 * Complete PM Workflow Demo - AI Code Review Assistant
 * 
 * This script demonstrates the full Vibe PM Agent workflow:
 * 1. Business Opportunity Analysis
 * 2. Business Case Generation  
 * 3. Executive Communication
 * 4. Strategic Alignment Assessment
 * 5. Market Timing Validation
 * 6. Resource Optimization Analysis
 */

const fs = require('fs').promises;
const path = require('path');

// Mock MCP client for demo purposes
class MockMCPClient {
  constructor() {
    this.tools = {
      analyze_business_opportunity: this.analyzeBusinessOpportunity.bind(this),
      generate_business_case: this.generateBusinessCase.bind(this),
      create_stakeholder_communication: this.createStakeholderCommunication.bind(this),
      assess_strategic_alignment: this.assessStrategicAlignment.bind(this),
      validate_market_timing: this.validateMarketTiming.bind(this),
      optimize_resource_allocation: this.optimizeResourceAllocation.bind(this)
    };
  }

  async analyzeBusinessOpportunity(params) {
    return {
      analysis: {
        market_size: {
          total_addressable_market: "$12.8B",
          serviceable_addressable_market: "$3.2B", 
          serviceable_obtainable_market: "$180M",
          growth_rate: "15.2% CAGR",
          confidence_score: 89
        },
        strategic_fit: {
          alignment_score: 92,
          key_strengths: [
            "Addresses critical developer productivity pain point",
            "Leverages existing AI/ML capabilities", 
            "Aligns with digital transformation initiatives",
            "Scalable across multiple development teams"
          ],
          market_validation: "Strong demand validated through developer surveys and competitive analysis"
        },
        competitive_landscape: {
          direct_competitors: ["GitHub Copilot", "SonarQube", "CodeClimate", "DeepCode"],
          competitive_advantage: "AI-powered contextual suggestions with team-specific learning",
          market_gap: "Lack of integrated review workflow automation with AI insights",
          differentiation_score: 84
        },
        risk_assessment: {
          technical_risks: ["AI model accuracy", "Integration complexity", "Scalability challenges"],
          market_risks: ["Competitive response", "Developer adoption", "Technology shifts"],
          mitigation_strategies: ["Phased rollout", "Continuous feedback", "Partnership approach"],
          overall_risk_level: "Medium"
        }
      },
      evidence: {
        confidence_score: 89,
        evidence_quality: "High",
        methodology: "Market research analysis, competitive intelligence, developer surveys",
        citations: [
          {
            id: "gartner_2024_ai_coding",
            source: "Gartner Research",
            title: "Market Guide for AI-Augmented Software Engineering",
            url: "https://www.gartner.com/en/documents/4015490",
            publication_date: "2024-03-15",
            credibility_rating: "A",
            relevance_score: 0.92,
            key_finding: "75% of enterprises will use AI coding assistants by 2028"
          },
          {
            id: "stackoverflow_2024_survey",
            source: "Stack Overflow",
            title: "2024 Developer Survey Results",
            url: "https://survey.stackoverflow.co/2024/",
            publication_date: "2024-05-20",
            credibility_rating: "A",
            relevance_score: 0.88,
            key_finding: "78% of developers use AI tools, 65% want better code review automation"
          },
          {
            id: "mckinsey_developer_velocity",
            source: "McKinsey & Company", 
            title: "Developer Velocity: How software excellence fuels business performance",
            url: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/developer-velocity-how-software-excellence-fuels-business-performance",
            publication_date: "2024-01-10",
            credibility_rating: "A",
            relevance_score: 0.94,
            key_finding: "Top-quartile companies deliver 5x faster with 20% better code quality"
          },
          {
            id: "github_octoverse_2024",
            source: "GitHub",
            title: "The State of the Octoverse 2024",
            url: "https://github.blog/2024-11-06-the-state-of-the-octoverse-2024/",
            publication_date: "2024-11-06", 
            credibility_rating: "B+",
            relevance_score: 0.85,
            key_finding: "Code review cycle time is top productivity bottleneck for 67% of teams"
          },
          {
            id: "forrester_ai_development",
            source: "Forrester Research",
            title: "The AI-Augmented Development Lifecycle",
            url: "https://www.forrester.com/report/the-ai-augmented-development-lifecycle/RES178941",
            publication_date: "2024-02-28",
            credibility_rating: "A",
            relevance_score: 0.90,
            key_finding: "AI-assisted code review reduces defects by 35% and review time by 45%"
          }
        ]
      },
      recommendation: {
        go_no_go: "GO",
        priority_level: "High",
        rationale: "Strong market opportunity with clear competitive advantage and manageable risks",
        next_steps: [
          "Develop detailed business case with ROI projections",
          "Create proof-of-concept with pilot team",
          "Secure executive sponsorship and budget approval",
          "Assemble cross-functional development team"
        ]
      }
    };
  }

  async generateBusinessCase(params) {
    return {
      executive_summary: {
        investment_ask: "$850,000 development + $200,000 annual operations",
        expected_return: "$3.4M savings over 3 years (280% ROI)",
        payback_period: "10 months",
        strategic_value: "Accelerates developer productivity and code quality initiatives",
        confidence_score: 82
      },
      financial_projections: {
        scenarios: {
          conservative: {
            roi_percentage: 180,
            total_savings: "$2.1M",
            annual_savings: "$700K",
            assumptions: "25% review time reduction, 15% bug reduction, 70% adoption"
          },
          balanced: {
            roi_percentage: 280, 
            total_savings: "$3.4M",
            annual_savings: "$1.2M",
            assumptions: "40% review time reduction, 25% bug reduction, 85% adoption"
          },
          bold: {
            roi_percentage: 420,
            total_savings: "$5.2M", 
            annual_savings: "$1.8M",
            assumptions: "55% review time reduction, 35% bug reduction, 95% adoption"
          }
        },
        cost_breakdown: {
          development: "$850,000",
          infrastructure: "$120,000",
          operations: "$200,000/year",
          training: "$50,000",
          contingency: "$100,000"
        },
        savings_sources: [
          "Reduced code review time: $800K/year",
          "Fewer production bugs: $300K/year", 
          "Faster feature delivery: $400K/year",
          "Improved developer satisfaction: $200K/year"
        ]
      },
      risk_analysis: {
        technical_risks: {
          ai_accuracy: {
            probability: "Medium",
            impact: "High", 
            mitigation: "Continuous model training, human oversight, gradual rollout"
          },
          integration_complexity: {
            probability: "Medium",
            impact: "Medium",
            mitigation: "Phased integration, API-first design, extensive testing"
          },
          scalability: {
            probability: "Low",
            impact: "High",
            mitigation: "Cloud-native architecture, performance monitoring, load testing"
          }
        },
        market_risks: {
          competitive_response: {
            probability: "High",
            impact: "Medium", 
            mitigation: "Fast execution, patent protection, continuous innovation"
          },
          adoption_resistance: {
            probability: "Medium",
            impact: "High",
            mitigation: "Change management, training programs, pilot success stories"
          }
        },
        overall_risk_rating: "Medium-Low"
      },
      implementation_timeline: {
        phase_1: "Months 1-3: MVP development and pilot testing",
        phase_2: "Months 4-6: Integration and beta rollout", 
        phase_3: "Months 7-9: Full deployment and optimization",
        phase_4: "Months 10-12: Advanced features and scaling"
      },
      success_metrics: [
        "40% reduction in code review cycle time",
        "25% decrease in production bugs",
        "85% developer adoption rate",
        "15% improvement in development velocity",
        "Positive ROI within 12 months"
      ],
      evidence: {
        confidence_score: 82,
        evidence_quality: "High",
        citations: [
          {
            id: "bcg_ai_productivity_2024",
            source: "Boston Consulting Group",
            title: "The AI Advantage in Software Development",
            credibility_rating: "A",
            key_finding: "AI-assisted development increases productivity by 35-50%"
          },
          {
            id: "pwc_roi_analysis_2024", 
            source: "PwC",
            title: "ROI of AI in Enterprise Software Development",
            credibility_rating: "A",
            key_finding: "Median ROI of 240% for AI development tools within 18 months"
          }
        ]
      }
    };
  }

  async createStakeholderCommunication(params) {
    return {
      document_type: "executive_onepager",
      content: {
        headline: "AI Code Review Assistant: Accelerating Development Excellence",
        key_recommendation: "Invest $850K to build AI-powered code review assistant, delivering $3.4M in productivity gains over 3 years",
        supporting_arguments: [
          {
            point: "Addresses Critical Productivity Bottleneck",
            evidence: "Code reviews consume 2.5 hours per developer daily; 67% cite as top productivity barrier",
            impact: "40% reduction in review time = 500+ hours saved weekly across engineering"
          },
          {
            point: "Proven ROI with Comparable Companies",
            evidence: "Similar implementations show 240% median ROI within 18 months",
            impact: "Conservative projection: 180% ROI, Balanced: 280% ROI, Bold: 420% ROI"
          },
          {
            point: "Strategic Competitive Advantage",
            evidence: "12-18 month window before market saturation, 75% of enterprises adopting by 2028",
            impact: "First-mover advantage in AI-assisted development workflows"
          }
        ],
        financial_summary: {
          investment: "$850K development + $200K annual operations",
          returns: "$1.2M annual savings (balanced scenario)",
          payback: "10 months",
          three_year_value: "$3.4M net present value"
        },
        implementation_plan: {
          timeline: "9 months development + 3 months rollout",
          team: "6 engineers (2 ML, 2 backend, 2 frontend) + 1 PM",
          milestones: [
            "Month 3: MVP with core AI analysis",
            "Month 6: Beta deployment to 50 developers", 
            "Month 9: Full company rollout",
            "Month 12: Advanced features and optimization"
          ]
        },
        risk_mitigation: {
          technical: "Phased rollout with continuous feedback and model improvement",
          adoption: "Change management program with training and success stories",
          competitive: "Fast execution with patent protection and continuous innovation"
        },
        success_metrics: [
          "85% developer adoption within 6 months",
          "40% faster code review cycles",
          "25% fewer production bugs", 
          "15% improvement in development velocity"
        ],
        call_to_action: "Approve $850K investment to begin development immediately and capture 12-18 month competitive window"
      },
      evidence: {
        confidence_score: 91,
        pyramid_principle_structure: true,
        executive_readiness: "Board-ready",
        citations_count: 12
      }
    };
  }

  async assessStrategicAlignment(params) {
    return {
      alignment_assessment: {
        overall_score: 92,
        mission_alignment: {
          score: 94,
          rationale: "Directly supports 'accelerate innovation through developer excellence' mission",
          key_connections: [
            "Enhances developer productivity and satisfaction",
            "Improves code quality and reduces technical debt",
            "Enables faster feature delivery and innovation cycles"
          ]
        },
        okr_mapping: {
          engineering_okrs: {
            "Reduce development cycle time by 20%": {
              alignment: "Direct",
              contribution: "40% faster code reviews directly impacts cycle time",
              score: 95
            },
            "Improve code quality metrics by 15%": {
              alignment: "Direct", 
              contribution: "AI-powered analysis catches 25% more issues",
              score: 90
            },
            "Increase developer satisfaction to 4.5/5": {
              alignment: "Strong",
              contribution: "Reduces manual review burden, faster feedback",
              score: 88
            },
            "Scale engineering team to 1000+ developers": {
              alignment: "Moderate",
              contribution: "Enables efficient review processes at scale",
              score: 75
            }
          },
          product_okrs: {
            "Accelerate feature delivery by 25%": {
              alignment: "Strong",
              contribution: "Faster reviews enable quicker feature iterations",
              score: 85
            }
          }
        },
        strategic_priorities: {
          developer_experience: {
            priority_level: "High",
            alignment_score: 96,
            impact: "Directly improves daily developer workflow and satisfaction"
          },
          ai_transformation: {
            priority_level: "High", 
            alignment_score: 94,
            impact: "Demonstrates practical AI application in core business processes"
          },
          operational_excellence: {
            priority_level: "Medium",
            alignment_score: 88,
            impact: "Improves code quality and reduces operational incidents"
          }
        },
        competitive_positioning: {
          current_position: "Follower in AI-assisted development",
          target_position: "Leader in AI-powered code review automation",
          differentiation_opportunity: "Integrated workflow automation with contextual AI insights",
          market_timing: "Optimal - 12-18 month competitive window"
        }
      },
      recommendations: {
        strategic_fit: "Excellent - High alignment across all key dimensions",
        priority_ranking: "Top 3 engineering initiatives for 2025",
        resource_allocation: "Justify dedicated team and executive sponsorship",
        success_factors: [
          "Executive championship from CTO/VP Engineering",
          "Integration with existing developer tools and workflows", 
          "Continuous feedback loop with development teams",
          "Measurement and communication of productivity gains"
        ]
      },
      evidence: {
        confidence_score: 95,
        alignment_methodology: "OKR mapping, strategic priority assessment, competitive analysis",
        citations: [
          {
            id: "harvard_business_review_strategy",
            source: "Harvard Business Review",
            title: "How to Align AI Initiatives with Business Strategy",
            credibility_rating: "A",
            key_finding: "Companies with strong AI-strategy alignment achieve 3x better outcomes"
          }
        ]
      }
    };
  }

  async validateMarketTiming(params) {
    return {
      timing_assessment: {
        overall_recommendation: "GO - Optimal timing window",
        confidence_score: 91,
        timing_factors: {
          market_readiness: {
            score: 88,
            indicators: [
              "78% of developers already using AI tools",
              "65% express need for better code review automation",
              "Enterprise AI adoption accelerating (45% increase YoY)"
            ]
          },
          competitive_landscape: {
            score: 85,
            window: "12-18 months before market saturation",
            competitive_pressure: "Medium - GitHub Copilot focused on code generation, not review workflow"
          },
          technical_readiness: {
            score: 92,
            factors: [
              "LLM APIs mature and accessible",
              "Code analysis tools well-established",
              "Integration patterns proven with existing tools"
            ]
          },
          organizational_readiness: {
            score: 89,
            factors: [
              "Engineering team experienced with AI tools",
              "Existing developer productivity initiatives",
              "Budget availability for innovation projects"
            ]
          }
        },
        market_signals: {
          positive_indicators: [
            "Gartner predicts 75% enterprise adoption by 2028",
            "Stack Overflow survey shows 65% want review automation",
            "Venture funding in dev tools up 40% in 2024",
            "Major tech companies investing heavily in AI coding tools"
          ],
          risk_indicators: [
            "Potential economic slowdown affecting IT budgets",
            "Regulatory uncertainty around AI in enterprise",
            "Developer fatigue with new tool adoption"
          ]
        },
        competitive_window: {
          first_mover_advantage: "12-18 months",
          market_entry_barriers: "Low to Medium",
          differentiation_opportunity: "High - workflow integration focus",
          recommended_timeline: "Begin development immediately to capture window"
        }
      },
      action_plan: {
        immediate_actions: [
          "Secure executive approval and budget within 30 days",
          "Assemble development team within 60 days", 
          "Begin MVP development within 90 days"
        ],
        market_monitoring: [
          "Track competitor product announcements",
          "Monitor developer adoption trends",
          "Watch for regulatory developments"
        ],
        contingency_planning: [
          "Accelerated development timeline if competitive pressure increases",
          "Partnership opportunities if market shifts",
          "Pivot options if adoption slower than expected"
        ]
      },
      evidence: {
        confidence_score: 91,
        market_analysis_methodology: "Trend analysis, competitive intelligence, developer surveys",
        citations: [
          {
            id: "gartner_timing_2024",
            source: "Gartner Research",
            title: "Timing AI Investments for Maximum Impact",
            credibility_rating: "A",
            key_finding: "Optimal AI investment window is 12-24 months before mainstream adoption"
          }
        ]
      }
    };
  }

  async optimizeResourceAllocation(params) {
    return {
      optimization_analysis: {
        recommended_team_structure: {
          total_team_size: 8,
          roles: [
            {
              role: "ML Engineer (Senior)",
              count: 2,
              responsibilities: ["AI model development", "Training pipeline", "Performance optimization"],
              estimated_cost: "$180K/year each"
            },
            {
              role: "Backend Engineer (Senior)",
              count: 2, 
              responsibilities: ["API development", "Integration layer", "Scalability"],
              estimated_cost: "$160K/year each"
            },
            {
              role: "Frontend Engineer (Mid-Senior)",
              count: 2,
              responsibilities: ["UI/UX development", "Developer tools integration", "Analytics dashboard"],
              estimated_cost: "$140K/year each"
            },
            {
              role: "Product Manager",
              count: 1,
              responsibilities: ["Requirements", "Stakeholder management", "Go-to-market"],
              estimated_cost: "$150K/year"
            },
            {
              role: "DevOps Engineer",
              count: 1,
              responsibilities: ["Infrastructure", "CI/CD", "Monitoring"],
              estimated_cost: "$155K/year"
            }
          ],
          total_annual_cost: "$1.31M"
        },
        development_phases: {
          phase_1: {
            duration: "3 months",
            team_size: 6,
            deliverables: ["Core AI analysis engine", "Basic GitHub integration", "MVP UI"],
            cost: "$327K"
          },
          phase_2: {
            duration: "3 months", 
            team_size: 8,
            deliverables: ["Advanced AI features", "Multi-platform integration", "Analytics"],
            cost: "$436K"
          },
          phase_3: {
            duration: "3 months",
            team_size: 6,
            deliverables: ["Enterprise features", "Scalability improvements", "Documentation"],
            cost: "$327K"
          }
        },
        efficiency_optimizations: {
          ai_assisted_development: {
            productivity_gain: "35%",
            time_savings: "2.8 hours/developer/week",
            cost_savings: "$150K over development period"
          },
          automated_testing: {
            quality_improvement: "40% fewer bugs",
            time_savings: "1.5 hours/developer/week", 
            cost_savings: "$95K over development period"
          },
          reusable_components: {
            development_acceleration: "25%",
            maintenance_reduction: "30%",
            cost_savings: "$120K over development period"
          }
        },
        resource_constraints: {
          budget_optimization: {
            original_estimate: "$1.2M",
            optimized_estimate: "$850K",
            savings_achieved: "$350K (29%)",
            optimization_methods: [
              "Phased hiring approach",
              "Open source component usage",
              "Cloud-native architecture",
              "Automated testing and deployment"
            ]
          },
          timeline_optimization: {
            original_timeline: "12 months",
            optimized_timeline: "9 months", 
            acceleration_methods: [
              "Parallel development streams",
              "AI-assisted code generation",
              "Pre-built integration libraries",
              "Agile methodology with 2-week sprints"
            ]
          }
        },
        risk_mitigation: {
          talent_acquisition: {
            risk: "Difficulty hiring ML engineers",
            mitigation: "Contract with specialized AI consulting firm for initial development",
            backup_plan: "Remote hiring from global talent pool"
          },
          technical_complexity: {
            risk: "AI model accuracy below expectations",
            mitigation: "Iterative development with continuous feedback and model improvement",
            backup_plan: "Hybrid approach with rule-based fallbacks"
          },
          scope_creep: {
            risk: "Feature requests expanding beyond MVP",
            mitigation: "Strict scope management with phased feature releases",
            backup_plan: "Time-boxed development with feature prioritization"
          }
        }
      },
      recommendations: {
        optimal_approach: "Phased development with cross-functional team",
        key_success_factors: [
          "Strong product management to maintain focus",
          "Continuous stakeholder feedback and iteration",
          "Investment in automated testing and CI/CD",
          "Regular performance monitoring and optimization"
        ],
        cost_optimization_opportunities: [
          "Use existing cloud infrastructure and services",
          "Leverage open source ML frameworks and libraries",
          "Implement automated deployment and scaling",
          "Establish partnerships with AI/ML service providers"
        ]
      },
      evidence: {
        confidence_score: 86,
        optimization_methodology: "Resource planning analysis, comparable project benchmarking, efficiency modeling",
        citations: [
          {
            id: "mckinsey_resource_optimization",
            source: "McKinsey & Company",
            title: "Optimizing Resource Allocation for AI Projects",
            credibility_rating: "A", 
            key_finding: "Phased approach reduces costs by 25-35% while maintaining quality"
          }
        ]
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

function formatBusinessOpportunityMarkdown(analysis) {
  return `# Business Opportunity Analysis - AI Code Review Assistant

## Executive Summary
**Market Size**: ${analysis.analysis.market_size.total_addressable_market} TAM, ${analysis.analysis.market_size.growth_rate}  
**Strategic Fit**: ${analysis.analysis.strategic_fit.alignment_score}/100  
**Recommendation**: ${analysis.recommendation.go_no_go} - ${analysis.recommendation.priority_level} Priority  
**Confidence**: ${analysis.evidence.confidence_score}% (${analysis.evidence.evidence_quality} evidence quality)

## Market Analysis

### Market Opportunity
- **Total Addressable Market**: ${analysis.analysis.market_size.total_addressable_market}
- **Serviceable Addressable Market**: ${analysis.analysis.market_size.serviceable_addressable_market}
- **Serviceable Obtainable Market**: ${analysis.analysis.market_size.serviceable_obtainable_market}
- **Growth Rate**: ${analysis.analysis.market_size.growth_rate}

### Strategic Fit Assessment
**Alignment Score**: ${analysis.analysis.strategic_fit.alignment_score}/100

**Key Strengths**:
${analysis.analysis.strategic_fit.key_strengths.map(s => `- ${s}`).join('\n')}

**Market Validation**: ${analysis.analysis.strategic_fit.market_validation}

### Competitive Landscape
**Differentiation Score**: ${analysis.analysis.competitive_landscape.differentiation_score}/100

**Direct Competitors**: ${analysis.analysis.competitive_landscape.direct_competitors.join(', ')}

**Competitive Advantage**: ${analysis.analysis.competitive_landscape.competitive_advantage}

**Market Gap**: ${analysis.analysis.competitive_landscape.market_gap}

## Risk Assessment
**Overall Risk Level**: ${analysis.analysis.risk_assessment.overall_risk_level}

**Technical Risks**: ${analysis.analysis.risk_assessment.technical_risks.join(', ')}
**Market Risks**: ${analysis.analysis.risk_assessment.market_risks.join(', ')}
**Mitigation Strategies**: ${analysis.analysis.risk_assessment.mitigation_strategies.join(', ')}

## Evidence & Citations

### Methodology
${analysis.evidence.methodology}

### Key Sources
${analysis.evidence.citations.map(c => 
  `**${c.source}** (${c.credibility_rating}): ${c.title}  
  *${c.key_finding}*  
  Relevance: ${Math.round(c.relevance_score * 100)}% | [Source](${c.url})`
).join('\n\n')}

## Recommendation
**Decision**: ${analysis.recommendation.go_no_go}  
**Priority**: ${analysis.recommendation.priority_level}  
**Rationale**: ${analysis.recommendation.rationale}

### Next Steps
${analysis.recommendation.next_steps.map(s => `1. ${s}`).join('\n')}

---
*Generated by Vibe PM Agent | Confidence: ${analysis.evidence.confidence_score}% | Citations: ${analysis.evidence.citations.length}*`;
}

function formatBusinessCaseMarkdown(businessCase) {
  return `# Business Case - AI Code Review Assistant

## Executive Summary
**Investment Ask**: ${businessCase.executive_summary.investment_ask}  
**Expected Return**: ${businessCase.executive_summary.expected_return}  
**Payback Period**: ${businessCase.executive_summary.payback_period}  
**Strategic Value**: ${businessCase.executive_summary.strategic_value}  
**Confidence**: ${businessCase.evidence.confidence_score}% (${businessCase.evidence.evidence_quality} evidence quality)

## Financial Projections

### ROI Scenarios
| Scenario | ROI | Total Savings | Annual Savings | Key Assumptions |
|----------|-----|---------------|----------------|-----------------|
| Conservative | ${businessCase.financial_projections.scenarios.conservative.roi_percentage}% | ${businessCase.financial_projections.scenarios.conservative.total_savings} | ${businessCase.financial_projections.scenarios.conservative.annual_savings} | ${businessCase.financial_projections.scenarios.conservative.assumptions} |
| Balanced | ${businessCase.financial_projections.scenarios.balanced.roi_percentage}% | ${businessCase.financial_projections.scenarios.balanced.total_savings} | ${businessCase.financial_projections.scenarios.balanced.annual_savings} | ${businessCase.financial_projections.scenarios.balanced.assumptions} |
| Bold | ${businessCase.financial_projections.scenarios.bold.roi_percentage}% | ${businessCase.financial_projections.scenarios.bold.total_savings} | ${businessCase.financial_projections.scenarios.bold.annual_savings} | ${businessCase.financial_projections.scenarios.bold.assumptions} |

### Cost Breakdown
- **Development**: ${businessCase.financial_projections.cost_breakdown.development}
- **Infrastructure**: ${businessCase.financial_projections.cost_breakdown.infrastructure}
- **Operations**: ${businessCase.financial_projections.cost_breakdown.operations}
- **Training**: ${businessCase.financial_projections.cost_breakdown.training}
- **Contingency**: ${businessCase.financial_projections.cost_breakdown.contingency}

### Savings Sources
${businessCase.financial_projections.savings_sources.map(s => `- ${s}`).join('\n')}

## Risk Analysis
**Overall Risk Rating**: ${businessCase.risk_analysis.overall_risk_rating}

### Technical Risks
${Object.entries(businessCase.risk_analysis.technical_risks).map(([risk, details]) => 
  `**${risk.replace('_', ' ').toUpperCase()}**  
  Probability: ${details.probability} | Impact: ${details.impact}  
  Mitigation: ${details.mitigation}`
).join('\n\n')}

### Market Risks
${Object.entries(businessCase.risk_analysis.market_risks).map(([risk, details]) => 
  `**${risk.replace('_', ' ').toUpperCase()}**  
  Probability: ${details.probability} | Impact: ${details.impact}  
  Mitigation: ${details.mitigation}`
).join('\n\n')}

## Implementation Timeline
- **${businessCase.implementation_timeline.phase_1}**
- **${businessCase.implementation_timeline.phase_2}**
- **${businessCase.implementation_timeline.phase_3}**
- **${businessCase.implementation_timeline.phase_4}**

## Success Metrics
${businessCase.success_metrics.map(m => `- ${m}`).join('\n')}

## Evidence & Citations
${businessCase.evidence.citations.map(c => 
  `**${c.source}**: ${c.title}  
  *${c.key_finding}*  
  Credibility: ${c.credibility_rating}`
).join('\n\n')}

---
*Generated by Vibe PM Agent | Confidence: ${businessCase.evidence.confidence_score}% | Citations: ${businessCase.evidence.citations.length}*`;
}

function formatExecutiveOnePagerMarkdown(communication) {
  const content = communication.content;
  return `# ${content.headline}

## Key Recommendation
${content.key_recommendation}

## Supporting Arguments

${content.supporting_arguments.map((arg, i) => 
  `### ${i + 1}. ${arg.point}
**Evidence**: ${arg.evidence}  
**Impact**: ${arg.impact}`
).join('\n\n')}

## Financial Summary
- **Investment**: ${content.financial_summary.investment}
- **Returns**: ${content.financial_summary.returns}
- **Payback**: ${content.financial_summary.payback}
- **3-Year Value**: ${content.financial_summary.three_year_value}

## Implementation Plan
**Timeline**: ${content.implementation_plan.timeline}  
**Team**: ${content.implementation_plan.team}

### Key Milestones
${content.implementation_plan.milestones.map(m => `- ${m}`).join('\n')}

## Risk Mitigation
- **Technical**: ${content.risk_mitigation.technical}
- **Adoption**: ${content.risk_mitigation.adoption}
- **Competitive**: ${content.risk_mitigation.competitive}

## Success Metrics
${content.success_metrics.map(m => `- ${m}`).join('\n')}

## Call to Action
${content.call_to_action}

---
*Executive One-Pager | Confidence: ${communication.evidence.confidence_score}% | ${communication.evidence.executive_readiness} | Citations: ${communication.evidence.citations_count}*`;
}

async function runCompleteWorkflow() {
  console.log('🚀 Starting Complete PM Workflow Demo - AI Code Review Assistant\n');
  
  const client = new MockMCPClient();
  
  try {
    // Step 1: Business Opportunity Analysis
    console.log('📊 Step 1: Analyzing Business Opportunity...');
    const opportunityParams = {
      idea: "AI-powered code review assistant that automatically analyzes code changes, suggests improvements, and streamlines the review process for development teams",
      market_context: {
        industry: "Software Development Tools",
        competition: "GitHub Copilot, SonarQube, CodeClimate, DeepCode",
        budget_range: "large",
        timeline: "9-12 months development"
      }
    };
    
    const opportunityAnalysis = await client.callTool('analyze_business_opportunity', opportunityParams);
    await saveOutput('business-opportunity-analysis.json', opportunityAnalysis);
    await saveMarkdownOutput('business-opportunity-analysis.md', formatBusinessOpportunityMarkdown(opportunityAnalysis));
    
    // Step 2: Generate Business Case
    console.log('💰 Step 2: Generating Business Case...');
    const businessCaseParams = {
      opportunity_analysis: JSON.stringify(opportunityAnalysis),
      financial_inputs: {
        development_cost: 850000,
        operational_cost: 200000,
        expected_revenue: 1200000,
        time_to_market: 9
      }
    };
    
    const businessCase = await client.callTool('generate_business_case', businessCaseParams);
    await saveOutput('business-case.json', businessCase);
    await saveMarkdownOutput('business-case.md', formatBusinessCaseMarkdown(businessCase));
    
    // Step 3: Create Executive Communication
    console.log('📋 Step 3: Creating Executive One-Pager...');
    const communicationParams = {
      business_case: JSON.stringify(businessCase),
      communication_type: "executive_onepager",
      audience: "executives"
    };
    
    const executiveCommunication = await client.callTool('create_stakeholder_communication', communicationParams);
    await saveOutput('executive-communication.json', executiveCommunication);
    await saveMarkdownOutput('executive-onepager.md', formatExecutiveOnePagerMarkdown(executiveCommunication));
    
    // Step 4: Assess Strategic Alignment
    console.log('🎯 Step 4: Assessing Strategic Alignment...');
    const alignmentParams = {
      feature_concept: JSON.stringify(businessCase),
      company_context: {
        mission: "Accelerate innovation through developer excellence and productivity",
        strategic_priorities: [
          "Developer Experience Enhancement",
          "AI Transformation Initiative", 
          "Operational Excellence",
          "Competitive Differentiation"
        ],
        current_okrs: [
          "Reduce development cycle time by 20%",
          "Improve code quality metrics by 15%",
          "Increase developer satisfaction to 4.5/5",
          "Scale engineering team to 1000+ developers"
        ],
        competitive_position: "Strong in core products, emerging in AI-assisted development"
      }
    };
    
    const strategicAlignment = await client.callTool('assess_strategic_alignment', alignmentParams);
    await saveOutput('strategic-alignment.json', strategicAlignment);
    
    // Step 5: Validate Market Timing
    console.log('⏰ Step 5: Validating Market Timing...');
    const timingParams = {
      feature_idea: "AI-powered code review assistant with workflow automation",
      market_signals: {
        customer_demand: "high",
        competitive_pressure: "medium",
        technical_readiness: "high",
        resource_availability: "high"
      }
    };
    
    const marketTiming = await client.callTool('validate_market_timing', timingParams);
    await saveOutput('market-timing.json', marketTiming);
    
    // Step 6: Optimize Resource Allocation
    console.log('⚡ Step 6: Optimizing Resource Allocation...');
    const resourceParams = {
      current_workflow: {
        team_size: 500,
        development_process: "Agile with 2-week sprints",
        review_process: "Manual peer review with GitHub",
        quality_gates: "Automated testing + manual QA",
        deployment_frequency: "Daily to staging, weekly to production"
      },
      resource_constraints: {
        budget: 850000,
        timeline: "9 months",
        team_size: 8,
        technical_debt: "Medium - some legacy systems to integrate"
      },
      optimization_goals: ["cost_reduction", "speed_improvement", "quality_increase"]
    };
    
    const resourceOptimization = await client.callTool('optimize_resource_allocation', resourceParams);
    await saveOutput('resource-optimization.json', resourceOptimization);
    
    // Generate Summary Report
    console.log('📄 Generating Summary Report...');
    const summaryReport = {
      workflow_completion: "SUCCESS",
      execution_time: new Date().toISOString(),
      key_findings: {
        business_opportunity: {
          recommendation: opportunityAnalysis.recommendation.go_no_go,
          confidence: opportunityAnalysis.evidence.confidence_score,
          market_size: opportunityAnalysis.analysis.market_size.total_addressable_market
        },
        financial_case: {
          roi_balanced: businessCase.financial_projections.scenarios.balanced.roi_percentage + "%",
          payback_period: businessCase.executive_summary.payback_period,
          confidence: businessCase.evidence.confidence_score
        },
        strategic_alignment: {
          overall_score: strategicAlignment.alignment_assessment.overall_score,
          mission_alignment: strategicAlignment.alignment_assessment.mission_alignment.score,
          confidence: strategicAlignment.evidence.confidence_score
        },
        market_timing: {
          recommendation: marketTiming.timing_assessment.overall_recommendation,
          competitive_window: marketTiming.timing_assessment.competitive_window.first_mover_advantage,
          confidence: marketTiming.timing_assessment.confidence_score
        },
        resource_optimization: {
          team_size: resourceOptimization.optimization_analysis.recommended_team_structure.total_team_size,
          optimized_cost: resourceOptimization.optimization_analysis.resource_constraints.budget_optimization.optimized_estimate,
          confidence: resourceOptimization.evidence.confidence_score
        }
      },
      documents_generated: [
        "business-opportunity-analysis.md",
        "business-case.md", 
        "executive-onepager.md",
        "strategic-alignment.json",
        "market-timing.json",
        "resource-optimization.json"
      ],
      total_citations: 25,
      average_confidence: 88
    };
    
    await saveOutput('workflow-summary.json', summaryReport);
    
    console.log('\n✅ Complete PM Workflow Demo Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Business Recommendation: ${summaryReport.key_findings.business_opportunity.recommendation}`);
    console.log(`   • ROI (Balanced Scenario): ${summaryReport.key_findings.financial_case.roi_balanced}`);
    console.log(`   • Strategic Alignment: ${summaryReport.key_findings.strategic_alignment.overall_score}/100`);
    console.log(`   • Market Timing: ${summaryReport.key_findings.market_timing.recommendation}`);
    console.log(`   • Average Confidence: ${summaryReport.average_confidence}%`);
    console.log(`   • Total Citations: ${summaryReport.total_citations}`);
    console.log(`   • Documents Generated: ${summaryReport.documents_generated.length}`);
    
    console.log('\n📁 View outputs in the ./outputs/ directory');
    console.log('   Run: ./show-analysis.sh to view all results');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runCompleteWorkflow();
}

module.exports = { runCompleteWorkflow };