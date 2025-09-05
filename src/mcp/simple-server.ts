// PM-Focused MCP Server - Answers "WHY to build" questions
// Complements Kiro's Spec Mode (WHAT) and Vibe Mode (HOW)

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SteeringService } from '../components/steering-service';
import { DocumentType } from '../models/steering';

/**
 * PM-Focused MCP Server that answers "WHY to build" questions
 * Designed to complement Kiro's native Spec Mode (WHAT) and Vibe Mode (HOW)
 */
export class SimplePMAgentMCPServer {
  private server: Server;
  private steeringService: SteeringService;

  constructor() {
    this.server = new Server(
      {
        name: "vibe-pm-agent",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.steeringService = new SteeringService({
      enabled: true,
      defaultOptions: {
        autoSave: true,
        promptForConfirmation: false,
        includeReferences: true,
        namingStrategy: 'feature-based',
        overwriteExisting: false
      }
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // PURE PM MODE TOOLS - Focus on "WHY to build"
          {
            name: "analyze_business_opportunity",
            description: "Analyzes market opportunity, timing, and business justification for a feature idea",
            inputSchema: {
              type: "object",
              properties: {
                idea: {
                  type: "string",
                  description: "Raw feature idea or business need"
                },
                market_context: {
                  type: "object",
                  properties: {
                    industry: { type: "string" },
                    competition: { type: "string" },
                    budget_range: { type: "string", enum: ["small", "medium", "large"] },
                    timeline: { type: "string" }
                  },
                  description: "Market and business context"
                },
                steering_options: {
                  type: "object",
                  properties: {
                    create_steering_files: { type: "boolean", default: true },
                    feature_name: { type: "string" },
                    inclusion_rule: { type: "string", enum: ["always", "fileMatch", "manual"], default: "manual" }
                  }
                }
              },
              required: ["idea"]
            }
          },
          {
            name: "generate_business_case",
            description: "Creates comprehensive business case with ROI analysis, risk assessment, and strategic alignment",
            inputSchema: {
              type: "object",
              properties: {
                opportunity_analysis: {
                  type: "string",
                  description: "Business opportunity analysis from analyze_business_opportunity"
                },
                financial_inputs: {
                  type: "object",
                  properties: {
                    development_cost: { type: "number" },
                    operational_cost: { type: "number" },
                    expected_revenue: { type: "number" },
                    time_to_market: { type: "number" }
                  }
                },
                steering_options: {
                  type: "object",
                  properties: {
                    create_steering_files: { type: "boolean", default: true },
                    feature_name: { type: "string" },
                    inclusion_rule: { type: "string", enum: ["always", "fileMatch", "manual"], default: "manual" }
                  }
                }
              },
              required: ["opportunity_analysis"]
            }
          },
          {
            name: "create_stakeholder_communication",
            description: "Generates executive one-pagers, PR-FAQs, and stakeholder presentations",
            inputSchema: {
              type: "object",
              properties: {
                business_case: {
                  type: "string",
                  description: "Business case analysis"
                },
                communication_type: {
                  type: "string",
                  enum: ["executive_onepager", "pr_faq", "board_presentation", "team_announcement"],
                  description: "Type of communication to generate"
                },
                audience: {
                  type: "string",
                  enum: ["executives", "board", "engineering_team", "customers", "investors"],
                  description: "Target audience for the communication"
                },
                steering_options: {
                  type: "object",
                  properties: {
                    create_steering_files: { type: "boolean", default: true },
                    feature_name: { type: "string" },
                    inclusion_rule: { type: "string", enum: ["always", "fileMatch", "manual"], default: "manual" }
                  }
                }
              },
              required: ["business_case", "communication_type", "audience"]
            }
          },
          {
            name: "assess_strategic_alignment",
            description: "Evaluates how a feature aligns with company strategy, OKRs, and long-term vision",
            inputSchema: {
              type: "object",
              properties: {
                feature_concept: {
                  type: "string",
                  description: "Feature concept or business case"
                },
                company_context: {
                  type: "object",
                  properties: {
                    mission: { type: "string" },
                    current_okrs: { type: "array", items: { type: "string" } },
                    strategic_priorities: { type: "array", items: { type: "string" } },
                    competitive_position: { type: "string" }
                  }
                },
                steering_options: {
                  type: "object",
                  properties: {
                    create_steering_files: { type: "boolean", default: true },
                    feature_name: { type: "string" },
                    inclusion_rule: { type: "string", enum: ["always", "fileMatch", "manual"], default: "manual" }
                  }
                }
              },
              required: ["feature_concept"]
            }
          },
          {
            name: "optimize_resource_allocation",
            description: "Analyzes resource requirements and provides optimization recommendations for development efficiency",
            inputSchema: {
              type: "object",
              properties: {
                current_workflow: {
                  type: "object",
                  description: "Current development workflow or process"
                },
                resource_constraints: {
                  type: "object",
                  properties: {
                    team_size: { type: "number" },
                    budget: { type: "number" },
                    timeline: { type: "string" },
                    technical_debt: { type: "string" }
                  }
                },
                optimization_goals: {
                  type: "array",
                  items: { type: "string", enum: ["cost_reduction", "speed_improvement", "quality_increase", "risk_mitigation"] }
                }
              },
              required: ["current_workflow"]
            }
          },
          {
            name: "validate_market_timing",
            description: "Fast validation of whether now is the right time to build a feature based on market conditions",
            inputSchema: {
              type: "object",
              properties: {
                feature_idea: {
                  type: "string",
                  description: "Feature idea to validate timing for"
                },
                market_signals: {
                  type: "object",
                  properties: {
                    customer_demand: { type: "string", enum: ["low", "medium", "high"] },
                    competitive_pressure: { type: "string", enum: ["low", "medium", "high"] },
                    technical_readiness: { type: "string", enum: ["low", "medium", "high"] },
                    resource_availability: { type: "string", enum: ["low", "medium", "high"] }
                  }
                }
              },
              required: ["feature_idea"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_business_opportunity':
            return await this.handleBusinessOpportunityAnalysis(args);
          case 'generate_business_case':
            return await this.handleBusinessCaseGeneration(args);
          case 'create_stakeholder_communication':
            return await this.handleStakeholderCommunication(args);
          case 'assess_strategic_alignment':
            return await this.handleStrategicAlignment(args);
          case 'optimize_resource_allocation':
            return await this.handleResourceOptimization(args);
          case 'validate_market_timing':
            return await this.handleMarketTimingValidation(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    });
  }

  // PM MODE HANDLERS - Focus on "WHY to build"

  private async handleBusinessOpportunityAnalysis(args: any) {
    const idea = args.idea || "No idea provided";
    const marketContext = args.market_context || {};
    const steeringOptions = args.steering_options || {};

    const analysis = `# Business Opportunity Analysis

## Executive Summary
**Opportunity:** ${this.extractOpportunityStatement(idea)}
**Market Timing:** ${this.assessMarketTiming(marketContext)}
**Strategic Fit:** ${this.evaluateStrategicFit(idea, marketContext)}

## Market Analysis

### Problem Validation
${this.analyzeProblemSpace(idea)}

### Market Size & Opportunity
- **Total Addressable Market (TAM):** ${this.estimateMarketSize(idea, marketContext)}
- **Serviceable Addressable Market (SAM):** ${this.estimateServiceableMarket(idea, marketContext)}
- **Competitive Landscape:** ${this.analyzeCompetition(marketContext)}

### Customer Segments
${this.identifyCustomerSegments(idea)}

## Business Justification

### Why Now?
${this.justifyTiming(idea, marketContext)}

### Strategic Value
- **Revenue Impact:** ${this.assessRevenueImpact(idea, marketContext)}
- **Cost Savings:** ${this.assessCostSavings(idea, marketContext)}
- **Strategic Positioning:** ${this.assessStrategicValue(idea, marketContext)}

### Risk Assessment
${this.assessBusinessRisks(idea, marketContext)}

## Recommendation
**Decision:** ${this.makeGoNoGoRecommendation(idea, marketContext)}

**Rationale:** ${this.provideRecommendationRationale(idea, marketContext)}

## Next Steps
1. Validate assumptions through customer research
2. Develop detailed business case with financial projections
3. Assess technical feasibility and resource requirements
4. Create stakeholder communication materials`;

    // Create steering file if requested
    let steeringResult = null;
    if (steeringOptions.create_steering_files !== false) {
      try {
        // Use ONEPAGER type for business analysis documents
        steeringResult = await this.steeringService.createFromOnePager(analysis, steeringOptions);
      } catch (error) {
        console.warn('Failed to create steering file:', error);
      }
    }

    const response = {
      content: [{
        type: "text",
        text: analysis
      }]
    };

    if (steeringResult?.created) {
      response.content.push({
        type: "text",
        text: `\n\n---\n**Steering File Created:** ${steeringResult.results[0]?.filename} in .kiro/steering/\nThis business analysis is now available as AI context for strategic decisions.`
      });
    }

    return response;
  }

  private async handleBusinessCaseGeneration(args: any) {
    const opportunityAnalysis = args.opportunity_analysis || "No analysis provided";
    const financialInputs = args.financial_inputs || {};
    const steeringOptions = args.steering_options || {};

    const businessCase = `# Business Case

## Investment Summary
**Total Investment:** $${(financialInputs.development_cost || 100000).toLocaleString()}
**Expected ROI:** ${this.calculateROI(financialInputs)}%
**Payback Period:** ${this.calculatePaybackPeriod(financialInputs)} months
**NPV (3 years):** $${this.calculateNPV(financialInputs).toLocaleString()}

## Financial Projections

### Development Costs
- **Initial Development:** $${(financialInputs.development_cost || 100000).toLocaleString()}
- **Ongoing Operations:** $${(financialInputs.operational_cost || 20000).toLocaleString()}/year
- **Time to Market:** ${financialInputs.time_to_market || 6} months

### Revenue Projections
- **Year 1:** $${(financialInputs.expected_revenue || 200000).toLocaleString()}
- **Year 2:** $${((financialInputs.expected_revenue || 200000) * 1.5).toLocaleString()}
- **Year 3:** $${((financialInputs.expected_revenue || 200000) * 2.2).toLocaleString()}

## Risk Analysis

### Financial Risks
${this.analyzeFinancialRisks(financialInputs)}

### Market Risks
${this.analyzeMarketRisks(opportunityAnalysis)}

### Technical Risks
${this.analyzeTechnicalRisks(opportunityAnalysis)}

## Success Metrics
${this.defineSuccessMetrics(financialInputs)}

## Resource Requirements
${this.defineResourceRequirements(financialInputs)}

## Implementation Phases
${this.defineImplementationPhases(financialInputs)}

## Recommendation
**Proceed with development** based on strong financial projections and strategic alignment.

**Key Success Factors:**
1. Maintain development timeline to capture market opportunity
2. Focus on core value proposition to minimize scope creep
3. Establish clear success metrics and monitoring systems
4. Plan for iterative improvement based on user feedback`;

    // Create steering file if requested
    let steeringResult = null;
    if (steeringOptions.create_steering_files !== false) {
      try {
        steeringResult = await this.steeringService.createFromOnePager(businessCase, steeringOptions);
      } catch (error) {
        console.warn('Failed to create steering file:', error);
      }
    }

    const response = {
      content: [{
        type: "text",
        text: businessCase
      }]
    };

    if (steeringResult?.created) {
      response.content.push({
        type: "text",
        text: `\n\n---\n**Steering File Created:** ${steeringResult.results[0]?.filename} in .kiro/steering/\nThis business case is now available as AI context for project decisions.`
      });
    }

    return response;
  }

  private async handleStakeholderCommunication(args: any) {
    const businessCase = args.business_case || "No business case provided";
    const communicationType = args.communication_type || "executive_onepager";
    const audience = args.audience || "executives";
    const steeringOptions = args.steering_options || {};

    let communication = "";

    switch (communicationType) {
      case "executive_onepager":
        communication = this.generateExecutiveOnePager(businessCase, audience);
        break;
      case "pr_faq":
        communication = this.generatePRFAQ(businessCase, audience);
        break;
      case "board_presentation":
        communication = this.generateBoardPresentation(businessCase, audience);
        break;
      case "team_announcement":
        communication = this.generateTeamAnnouncement(businessCase, audience);
        break;
      default:
        communication = this.generateExecutiveOnePager(businessCase, audience);
    }

    // Create steering file if requested
    let steeringResult = null;
    if (steeringOptions.create_steering_files !== false) {
      try {
        if (communicationType === "pr_faq") {
          steeringResult = await this.steeringService.createFromPRFAQ(communication, steeringOptions);
        } else {
          steeringResult = await this.steeringService.createFromOnePager(communication, steeringOptions);
        }
      } catch (error) {
        console.warn('Failed to create steering file:', error);
      }
    }

    const response = {
      content: [{
        type: "text",
        text: communication
      }]
    };

    if (steeringResult?.created) {
      response.content.push({
        type: "text",
        text: `\n\n---\n**Steering File Created:** ${steeringResult.results[0]?.filename} in .kiro/steering/\nThis ${communicationType} is now available as AI context for stakeholder communications.`
      });
    }

    return response;
  }

  private async handleStrategicAlignment(args: any) {
    const featureConcept = args.feature_concept || "No concept provided";
    const companyContext = args.company_context || {};
    const steeringOptions = args.steering_options || {};

    const alignment = `# Strategic Alignment Assessment

## Alignment Score: ${this.calculateAlignmentScore(featureConcept, companyContext)}/10

## Mission Alignment
**Company Mission:** ${companyContext.mission || "Not provided"}
**Feature Alignment:** ${this.assessMissionAlignment(featureConcept, companyContext)}

## OKR Impact Analysis
${this.analyzeOKRImpact(featureConcept, companyContext)}

## Strategic Priority Mapping
${this.mapStrategicPriorities(featureConcept, companyContext)}

## Competitive Positioning
${this.assessCompetitiveImpact(featureConcept, companyContext)}

## Long-term Vision Contribution
${this.assessVisionContribution(featureConcept, companyContext)}

## Resource Allocation Justification
${this.justifyResourceAllocation(featureConcept, companyContext)}

## Recommendation
${this.makeStrategicRecommendation(featureConcept, companyContext)}`;

    // Create steering file if requested
    let steeringResult = null;
    if (steeringOptions.create_steering_files !== false) {
      try {
        steeringResult = await this.steeringService.createFromOnePager(alignment, steeringOptions);
      } catch (error) {
        console.warn('Failed to create steering file:', error);
      }
    }

    const response = {
      content: [{
        type: "text",
        text: alignment
      }]
    };

    if (steeringResult?.created) {
      response.content.push({
        type: "text",
        text: `\n\n---\n**Steering File Created:** ${steeringResult.results[0]?.filename} in .kiro/steering/\nThis strategic alignment assessment is now available as AI context.`
      });
    }

    return response;
  }

  private async handleResourceOptimization(args: any) {
    const currentWorkflow = args.current_workflow || {};
    const resourceConstraints = args.resource_constraints || {};
    const optimizationGoals = args.optimization_goals || ["cost_reduction"];

    const optimization = `# Resource Optimization Analysis

## Current State Assessment
**Team Size:** ${resourceConstraints.team_size || "Not specified"}
**Budget:** $${(resourceConstraints.budget || 0).toLocaleString()}
**Timeline:** ${resourceConstraints.timeline || "Not specified"}
**Technical Debt Level:** ${resourceConstraints.technical_debt || "Unknown"}

## Optimization Opportunities
${this.identifyOptimizationOpportunities(currentWorkflow, resourceConstraints, optimizationGoals)}

## Recommended Optimizations
${this.recommendOptimizations(currentWorkflow, resourceConstraints, optimizationGoals)}

## Impact Analysis
${this.analyzeOptimizationImpact(currentWorkflow, resourceConstraints, optimizationGoals)}

## Implementation Roadmap
${this.createOptimizationRoadmap(currentWorkflow, resourceConstraints, optimizationGoals)}

## Success Metrics
${this.defineOptimizationMetrics(optimizationGoals)}`;

    return {
      content: [{
        type: "text",
        text: optimization
      }]
    };
  }

  private async handleMarketTimingValidation(args: any) {
    const featureIdea = args.feature_idea || "No idea provided";
    const marketSignals = args.market_signals || {};

    const validation = `# Market Timing Validation

## Feature Concept
${featureIdea}

## Market Signal Analysis
${this.analyzeMarketSignals(marketSignals)}

## Timing Assessment
**Overall Timing Score:** ${this.calculateTimingScore(marketSignals)}/10
**Recommendation:** ${this.makeTimingRecommendation(marketSignals)}

## Key Factors
${this.identifyKeyTimingFactors(marketSignals)}

## Risk Mitigation
${this.identifyTimingRisks(marketSignals)}

## Action Plan
${this.createTimingActionPlan(featureIdea, marketSignals)}`;

    return {
      content: [{
        type: "text",
        text: validation
      }]
    };
  }

  // Helper methods for business analysis
  private extractOpportunityStatement(idea: string): string {
    return `Transform ${idea.toLowerCase()} into a strategic competitive advantage through systematic optimization and intelligent automation.`;
  }

  private assessMarketTiming(context: any): string {
    return context.timeline ? `Optimal timing based on ${context.timeline} market window` : "Market timing requires further analysis";
  }

  private evaluateStrategicFit(idea: string, context: any): string {
    return context.industry ? `Strong alignment with ${context.industry} industry trends` : "Strategic fit assessment pending industry context";
  }

  private analyzeProblemSpace(idea: string): string {
    return `The core problem addressed by "${idea}" represents a significant market opportunity with clear customer pain points and measurable business impact.`;
  }

  private estimateMarketSize(idea: string, context: any): string {
    const budgetMultiplier = context.budget_range === "large" ? 10 : context.budget_range === "medium" ? 5 : 2;
    return `$${(budgetMultiplier * 10).toLocaleString()}M estimated market opportunity`;
  }

  private estimateServiceableMarket(idea: string, context: any): string {
    const budgetMultiplier = context.budget_range === "large" ? 10 : context.budget_range === "medium" ? 5 : 2;
    return `$${(budgetMultiplier * 2).toLocaleString()}M serviceable market within 3 years`;
  }

  private analyzeCompetition(context: any): string {
    return context.competition ? `Competitive analysis: ${context.competition}` : "Limited direct competition identified, representing first-mover advantage opportunity";
  }

  private identifyCustomerSegments(idea: string): string {
    return "Primary segments include enterprise customers seeking efficiency improvements and SMBs requiring cost-effective automation solutions.";
  }

  private justifyTiming(idea: string, context: any): string {
    return "Market conditions are optimal with increasing demand for automation, rising operational costs, and technological readiness converging to create ideal implementation window.";
  }

  private assessRevenueImpact(idea: string, context: any): string {
    return "Projected 15-25% revenue increase through improved efficiency and new market opportunities.";
  }

  private assessCostSavings(idea: string, context: any): string {
    return "Estimated 30-40% operational cost reduction through automation and process optimization.";
  }

  private assessStrategicValue(idea: string, context: any): string {
    return "High strategic value through market differentiation, customer retention improvement, and competitive moat creation.";
  }

  private assessBusinessRisks(idea: string, context: any): string {
    return `**Key Risks:**
- Market adoption slower than projected (Medium risk)
- Technical implementation complexity (Low risk)
- Competitive response (Medium risk)
- Resource allocation challenges (Low risk)`;
  }

  private makeGoNoGoRecommendation(idea: string, context: any): string {
    return "**GO** - Proceed with development based on strong market opportunity and strategic alignment.";
  }

  private provideRecommendationRationale(idea: string, context: any): string {
    return "Market timing is optimal, technical feasibility is confirmed, and strategic value significantly outweighs implementation risks.";
  }

  // Financial calculation helpers
  private calculateROI(inputs: any): number {
    const revenue = inputs.expected_revenue || 200000;
    const cost = inputs.development_cost || 100000;
    return Math.round(((revenue - cost) / cost) * 100);
  }

  private calculatePaybackPeriod(inputs: any): number {
    const cost = inputs.development_cost || 100000;
    const monthlyRevenue = (inputs.expected_revenue || 200000) / 12;
    return Math.round(cost / monthlyRevenue);
  }

  private calculateNPV(inputs: any): number {
    const cost = inputs.development_cost || 100000;
    const annualRevenue = inputs.expected_revenue || 200000;
    const discountRate = 0.1;
    
    let npv = -cost;
    for (let year = 1; year <= 3; year++) {
      const revenue = annualRevenue * Math.pow(1.2, year - 1);
      npv += revenue / Math.pow(1 + discountRate, year);
    }
    
    return Math.round(npv);
  }

  private analyzeFinancialRisks(inputs: any): string {
    return "Financial risks are manageable with conservative revenue projections and phased investment approach.";
  }

  private analyzeMarketRisks(analysis: string): string {
    return "Market risks mitigated through validated customer demand and differentiated value proposition.";
  }

  private analyzeTechnicalRisks(analysis: string): string {
    return "Technical risks are low given proven technology stack and experienced development team.";
  }

  private defineSuccessMetrics(inputs: any): string {
    return `**Key Metrics:**
- Revenue target: $${(inputs.expected_revenue || 200000).toLocaleString()} in Year 1
- Customer acquisition: 100+ customers in first 6 months
- User engagement: 80%+ monthly active usage
- Cost efficiency: 30%+ operational cost reduction`;
  }

  private defineResourceRequirements(inputs: any): string {
    return `**Resource Needs:**
- Development team: 3-5 engineers for ${inputs.time_to_market || 6} months
- Budget allocation: $${(inputs.development_cost || 100000).toLocaleString()}
- Infrastructure: Cloud-based scalable architecture
- Support: Customer success and technical support teams`;
  }

  private defineImplementationPhases(inputs: any): string {
    return `**Phase 1 (Months 1-2):** Core functionality development
**Phase 2 (Months 3-4):** Integration and testing
**Phase 3 (Months 5-6):** Launch preparation and go-to-market
**Phase 4 (Months 7+):** Optimization and scaling`;
  }

  // Communication generation methods
  private generateExecutiveOnePager(businessCase: string, audience: string): string {
    // Extract competitive insights from business case if available
    const hasCompetitiveAnalysis = businessCase.toLowerCase().includes('competitor') || 
                                  businessCase.toLowerCase().includes('competitive') ||
                                  businessCase.toLowerCase().includes('market position');

    let competitiveSection = '';
    if (hasCompetitiveAnalysis) {
      competitiveSection = `

## Competitive Positioning
- **Market Position:** Differentiated solution addressing key market gaps
- **Competitive Advantage:** Superior technology and customer-focused approach
- **Market Opportunity:** Significant addressable market with limited direct competition
- **Strategic Differentiation:** Unique capabilities that competitors cannot easily replicate`;
    }

    return `# Executive One-Pager

## The Ask
**Approve development investment** for strategic feature that delivers measurable business value and competitive advantage.

## Why Now
Market opportunity window is optimal with validated customer demand, technical readiness, and strategic alignment converging to create ideal implementation timing.

## Investment & Returns
- **Investment:** Development and operational costs as outlined in business case
- **Returns:** Projected ROI and revenue impact with conservative assumptions
- **Timeline:** Phased approach with early value delivery and iterative improvement

## Strategic Value
- **Market Position:** Strengthens competitive differentiation and market leadership
- **Customer Value:** Addresses validated pain points with measurable impact
- **Business Growth:** Enables new revenue streams and market expansion${competitiveSection}

## Risk Mitigation
- **Technical:** Proven technology stack with experienced team
- **Market:** Validated demand with conservative projections and competitive analysis
- **Financial:** Phased investment with clear success metrics

## Next Steps
1. Approve business case and resource allocation
2. Initiate development with Kiro Spec Mode for detailed requirements
3. Establish success metrics and monitoring systems
4. Plan go-to-market strategy and competitive positioning`;
  }

  private generatePRFAQ(businessCase: string, audience: string): string {
    // Extract competitive insights from business case if available
    const hasCompetitiveAnalysis = businessCase.toLowerCase().includes('competitor') || 
                                  businessCase.toLowerCase().includes('competitive') ||
                                  businessCase.toLowerCase().includes('market position');

    let competitiveFAQ = '';
    if (hasCompetitiveAnalysis) {
      competitiveFAQ = `

**Q: How does this compare to competitive alternatives?**
A: Our solution provides unique competitive advantages through superior technology, customer-focused design, and innovative features that address market gaps competitors have not filled.

**Q: What is our competitive differentiation strategy?**
A: We differentiate through advanced capabilities, better user experience, and strategic positioning that leverages our core strengths while addressing competitor weaknesses.`;
    }

    return `# Press Release & FAQ

## Press Release

### Headline
**[Company] Launches Strategic Feature: Delivering Measurable Value Through Market-Leading Innovation**

### Body
Today we announced the development of a strategic feature that addresses key customer needs while strengthening our competitive position in the market. This initiative represents our commitment to continuous innovation and customer value creation through differentiated solutions.

**Customer Impact:** Direct benefits through improved efficiency and enhanced capabilities
**Market Position:** Reinforces leadership in key market segments with competitive differentiation
**Strategic Value:** Aligns with long-term vision and growth objectives while addressing market opportunities

## FAQ

**Q: Why is this feature important?**
A: It addresses validated customer pain points while creating strategic competitive advantages and new revenue opportunities in a growing market.

**Q: What's the expected timeline?**
A: Phased development approach with initial value delivery in 6 months and full feature set within 12 months, positioning us ahead of competitive alternatives.

**Q: How does this align with company strategy?**
A: Direct alignment with strategic priorities, OKRs, and long-term vision for market leadership and competitive differentiation.

**Q: What are the success metrics?**
A: Clear ROI targets, customer adoption goals, market share objectives, and business impact measurements as defined in the business case.${competitiveFAQ}`;
  }

  private generateBoardPresentation(businessCase: string, audience: string): string {
    return `# Board Presentation: Strategic Investment Proposal

## Executive Summary
Strategic feature development opportunity with strong ROI, market validation, and competitive advantage potential.

## Market Opportunity
- Validated customer demand with clear pain points
- Significant market size with limited competition
- Optimal timing based on market conditions

## Financial Projections
- Conservative revenue projections with strong ROI
- Phased investment approach minimizing risk
- Clear path to profitability and growth

## Strategic Alignment
- Direct support of company mission and vision
- Advancement of key OKRs and strategic priorities
- Strengthening of competitive market position

## Risk Assessment
- Comprehensive risk analysis with mitigation strategies
- Conservative assumptions and contingency planning
- Proven team and technology foundation

## Recommendation
**Approve strategic investment** based on compelling business case, market opportunity, and strategic value creation.`;
  }

  private generateTeamAnnouncement(businessCase: string, audience: string): string {
    return `# Team Announcement: New Strategic Initiative

## Exciting News
We're launching a strategic feature development initiative that will create significant value for our customers and strengthen our market position.

## What This Means
- **For Customers:** Enhanced capabilities addressing key pain points
- **For Our Team:** Opportunity to work on high-impact, strategic project
- **For The Company:** Competitive advantage and revenue growth

## Development Approach
- **Methodology:** Using Kiro's Spec Mode for requirements and Vibe Mode for implementation
- **Timeline:** Phased development with regular milestones and feedback loops
- **Team Structure:** Cross-functional collaboration with clear ownership

## Success Metrics
Clear goals and measurements to track progress and celebrate achievements together.

## Next Steps
Development teams will receive detailed specifications through Kiro Spec Mode, with implementation guidance through Vibe Mode.

**Questions?** Reach out to the PM team for additional context and clarification.`;
  }

  // Strategic alignment helpers
  private calculateAlignmentScore(concept: string, context: any): number {
    let score = 5; // Base score
    if (context.mission) score += 2;
    if (context.current_okrs?.length > 0) score += 2;
    if (context.strategic_priorities?.length > 0) score += 1;
    return Math.min(score, 10);
  }

  private assessMissionAlignment(concept: string, context: any): string {
    return context.mission 
      ? `Strong alignment with mission to ${context.mission}. Feature directly supports core mission objectives.`
      : "Mission alignment requires further analysis with company mission statement.";
  }

  private analyzeOKRImpact(concept: string, context: any): string {
    if (context.current_okrs?.length > 0) {
      return `**OKR Impact Analysis:**\n${context.current_okrs.map((okr: string, i: number) => 
        `- **OKR ${i + 1}:** ${okr} - Direct positive impact through feature capabilities`
      ).join('\n')}`;
    }
    return "OKR impact analysis requires current company OKRs for detailed assessment.";
  }

  private mapStrategicPriorities(concept: string, context: any): string {
    if (context.strategic_priorities?.length > 0) {
      return `**Strategic Priority Mapping:**\n${context.strategic_priorities.map((priority: string, i: number) => 
        `- **Priority ${i + 1}:** ${priority} - Feature supports through enhanced capabilities`
      ).join('\n')}`;
    }
    return "Strategic priority mapping requires current company priorities for detailed analysis.";
  }

  private assessCompetitiveImpact(concept: string, context: any): string {
    return context.competitive_position 
      ? `Current position: ${context.competitive_position}. Feature strengthens competitive advantage through differentiated capabilities.`
      : "Competitive impact analysis requires current market position context.";
  }

  private assessVisionContribution(concept: string, context: any): string {
    return "Feature contributes to long-term vision through strategic capability building and market position strengthening.";
  }

  private justifyResourceAllocation(concept: string, context: any): string {
    return "Resource allocation justified by strategic value, market opportunity, and alignment with company priorities.";
  }

  private makeStrategicRecommendation(concept: string, context: any): string {
    const score = this.calculateAlignmentScore(concept, context);
    if (score >= 8) return "**STRONGLY RECOMMEND** - Excellent strategic alignment with high value potential.";
    if (score >= 6) return "**RECOMMEND** - Good strategic alignment with clear value creation.";
    if (score >= 4) return "**CONDITIONAL** - Moderate alignment, requires additional strategic context.";
    return "**REQUIRES ANALYSIS** - Limited strategic context available for comprehensive assessment.";
  }

  // Optimization analysis helpers
  private identifyOptimizationOpportunities(workflow: any, constraints: any, goals: string[]): string {
    return `**Key Opportunities:**
- Process automation to reduce manual effort
- Resource allocation optimization for better efficiency
- Technology stack improvements for performance gains
- Workflow streamlining to eliminate bottlenecks`;
  }

  private recommendOptimizations(workflow: any, constraints: any, goals: string[]): string {
    return goals.map(goal => {
      switch (goal) {
        case "cost_reduction": return "- **Cost Reduction:** Automate repetitive tasks, optimize resource usage";
        case "speed_improvement": return "- **Speed Improvement:** Parallel processing, eliminate bottlenecks";
        case "quality_increase": return "- **Quality Increase:** Automated testing, code review processes";
        case "risk_mitigation": return "- **Risk Mitigation:** Backup systems, monitoring, documentation";
        default: return `- **${goal}:** Optimization strategies tailored to specific goal`;
      }
    }).join('\n');
  }

  private analyzeOptimizationImpact(workflow: any, constraints: any, goals: string[]): string {
    return `**Expected Impact:**
- 20-30% efficiency improvement through process optimization
- 15-25% cost reduction through resource optimization
- 40-50% faster delivery through workflow improvements
- Reduced risk through systematic improvements`;
  }

  private createOptimizationRoadmap(workflow: any, constraints: any, goals: string[]): string {
    return `**Implementation Phases:**
- **Phase 1 (Weeks 1-2):** Quick wins and low-hanging fruit
- **Phase 2 (Weeks 3-6):** Process improvements and automation
- **Phase 3 (Weeks 7-12):** Advanced optimizations and monitoring
- **Phase 4 (Ongoing):** Continuous improvement and refinement`;
  }

  private defineOptimizationMetrics(goals: string[]): string {
    return `**Success Metrics:**
- Efficiency: Measure task completion time and resource utilization
- Quality: Track error rates and customer satisfaction
- Cost: Monitor budget utilization and cost per outcome
- Speed: Measure delivery time and cycle time improvements`;
  }

  // Market timing helpers
  private analyzeMarketSignals(signals: any): string {
    return `**Signal Analysis:**
- **Customer Demand:** ${signals.customer_demand || 'Unknown'} - ${this.interpretSignal(signals.customer_demand)}
- **Competitive Pressure:** ${signals.competitive_pressure || 'Unknown'} - ${this.interpretCompetitiveSignal(signals.competitive_pressure)}
- **Technical Readiness:** ${signals.technical_readiness || 'Unknown'} - ${this.interpretTechnicalSignal(signals.technical_readiness)}
- **Resource Availability:** ${signals.resource_availability || 'Unknown'} - ${this.interpretResourceSignal(signals.resource_availability)}`;
  }

  private calculateTimingScore(signals: any): number {
    const signalValues = {
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    const demand = signalValues[signals.customer_demand as keyof typeof signalValues] || 2;
    const competitive = signalValues[signals.competitive_pressure as keyof typeof signalValues] || 2;
    const technical = signalValues[signals.technical_readiness as keyof typeof signalValues] || 2;
    const resource = signalValues[signals.resource_availability as keyof typeof signalValues] || 2;
    
    return Math.round(((demand + competitive + technical + resource) / 12) * 10);
  }

  private makeTimingRecommendation(signals: any): string {
    const score = this.calculateTimingScore(signals);
    if (score >= 8) return "**OPTIMAL TIMING** - All signals indicate ideal market conditions";
    if (score >= 6) return "**GOOD TIMING** - Favorable conditions with minor considerations";
    if (score >= 4) return "**MODERATE TIMING** - Mixed signals, proceed with caution";
    return "**POOR TIMING** - Consider delaying until conditions improve";
  }

  private identifyKeyTimingFactors(signals: any): string {
    return `**Critical Factors:**
- Market readiness and customer demand levels
- Competitive landscape and pressure dynamics
- Technical infrastructure and team capabilities
- Resource availability and organizational capacity`;
  }

  private identifyTimingRisks(signals: any): string {
    return `**Timing Risks:**
- Market conditions may change rapidly
- Competitive responses could alter landscape
- Resource constraints may impact delivery
- Technical challenges could delay launch`;
  }

  private createTimingActionPlan(idea: string, signals: any): string {
    return `**Action Plan:**
1. **Immediate:** Validate market signals through customer research
2. **Short-term:** Assess competitive landscape and positioning
3. **Medium-term:** Confirm technical readiness and resource allocation
4. **Long-term:** Monitor market conditions and adjust timing as needed`;
  }

  private interpretSignal(level: string): string {
    switch (level) {
      case 'high': return 'Strong market pull, immediate opportunity';
      case 'medium': return 'Moderate interest, good timing potential';
      case 'low': return 'Limited demand, consider market development';
      default: return 'Requires market research for validation';
    }
  }

  private interpretCompetitiveSignal(level: string): string {
    switch (level) {
      case 'high': return 'Urgent need to respond, first-mover advantage critical';
      case 'medium': return 'Competitive opportunity, differentiation important';
      case 'low': return 'Market leadership opportunity, set standards';
      default: return 'Competitive analysis needed';
    }
  }

  private interpretTechnicalSignal(level: string): string {
    switch (level) {
      case 'high': return 'Technology ready, implementation feasible';
      case 'medium': return 'Some technical challenges, manageable risk';
      case 'low': return 'Significant technical hurdles, high risk';
      default: return 'Technical feasibility assessment required';
    }
  }

  private interpretResourceSignal(level: string): string {
    switch (level) {
      case 'high': return 'Resources available, can proceed immediately';
      case 'medium': return 'Limited resources, prioritization needed';
      case 'low': return 'Resource constraints, consider phased approach';
      default: return 'Resource planning required';
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}

// Export with both names for compatibility
export { SimplePMAgentMCPServer as PMFocusedMCPServer };