// Communications Lambda Function
// Handles 4 stakeholder communication tools

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import {
  LambdaRequest,
  LambdaResponse,
  CommunicationsArgs,
  ToolNotFoundError,
  ToolExecutionError
} from '../shared/types';
import {
  validateLambdaRequest,
  formatSuccessResponse,
  formatErrorResponse,
  formatApiGatewayResponse,
  executeTool,
  loadEnvironmentConfig,
  Logger,
  PerformanceTimer
} from '../shared/utils';

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const config = loadEnvironmentConfig();
  const logger = new Logger(config);
  const timer = new PerformanceTimer();

  try {
    logger.info('Communications Lambda invoked', {
      requestId: context.awsRequestId,
      functionName: context.functionName
    });

    // Parse and validate request
    let requestBody: any;
    try {
      requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return formatApiGatewayResponse(400, {
        success: false,
        error: 'Invalid JSON in request body'
      });
    }

    const request = validateLambdaRequest(requestBody);

    // Route to appropriate tool handler
    const result = await routeToTool(request.toolName, request.toolArgs, logger);

    const executionTime = timer.measure();
    logger.info('Communications Lambda completed', {
      requestId: context.awsRequestId,
      toolName: request.toolName,
      executionTime,
      success: result.success
    });

    const response = formatSuccessResponse(
      result,
      context.awsRequestId,
      request.toolName,
      executionTime
    );

    return formatApiGatewayResponse(200, response);

  } catch (error) {
    const executionTime = timer.measure();
    logger.error('Communications Lambda error', error as Error, {
      requestId: context.awsRequestId,
      executionTime
    });

    const response = formatErrorResponse(error as Error, context.awsRequestId);
    const statusCode = (error as any)?.statusCode || 500;

    return formatApiGatewayResponse(statusCode, response);
  }
};

// Tool routing and execution
async function routeToTool(toolName: string, toolArgs: Record<string, any>, logger: Logger): Promise<any> {
  const toolHandlers: Record<string, Function> = {
    'create_stakeholder_communication': handleStakeholderCommunication,
    'generate_management_onepager': handleGenerateManagementOnePager,
    'generate_pr_faq': handleGeneratePRFAQ,
    'get_consulting_summary': handleGetConsultingSummary
  };

  const handler = toolHandlers[toolName];
  if (!handler) {
    throw new ToolNotFoundError(toolName);
  }

  return await executeTool(toolName, toolArgs, handler);
}

export async function handleStakeholderCommunication(args: CommunicationsArgs): Promise<any> {
  const { business_case, communication_type, audience } = args;

  let communication = '';

  switch (communication_type) {
    case 'executive_onepager':
      communication = generateExecutiveOnePager(business_case || 'Business case', audience || 'executives');
      break;
    case 'pr_faq':
      communication = generatePRFAQ(business_case || 'Product information', audience || 'customers');
      break;
    case 'board_presentation':
      communication = generateBoardPresentation(business_case || 'Business case', audience || 'board');
      break;
    case 'team_announcement':
      communication = generateTeamAnnouncement(business_case || 'Business case', audience || 'engineering_team');
      break;
    default:
      communication = generateExecutiveOnePager(business_case || 'Business case', audience || 'executives');
  }

  return {
    communication: {
      type: communication_type || 'executive_onepager',
      audience: audience || 'executives',
      content: communication,
      generated_at: new Date().toISOString(),
      version: '1.0'
    }
  };
}

export async function handleGenerateManagementOnePager(args: CommunicationsArgs): Promise<any> {
  const { project_info, audience } = args;

  const onePager = `# Executive One-Pager

## Project Overview
${project_info || 'Strategic project initiative'}

## Business Impact
- **Revenue Opportunity:** Significant market opportunity with strong ROI potential
- **Strategic Value:** Aligns with company objectives and competitive positioning
- **Risk Mitigation:** Comprehensive risk assessment with mitigation strategies

## Key Metrics
- **Investment:** Development and operational costs
- **Returns:** Revenue projections and cost savings
- **Timeline:** Phased delivery with key milestones
- **Success Criteria:** Measurable outcomes and KPIs

## Resource Requirements
- **Team:** Cross-functional development team
- **Budget:** Investment allocation across development phases
- **Timeline:** Delivery schedule with key milestones

## Decision Required
**Recommendation:** Approve project initiation based on strong business case and strategic alignment.

**Next Steps:**
1. Finalize resource allocation and team assignments
2. Initiate detailed planning and design phase
3. Establish project governance and reporting structure`;

  return {
    managementOnePager: {
      title: 'Executive Summary',
      audience: audience || 'executives',
      content: onePager,
      generated_at: new Date().toISOString(),
      key_sections: [
        'Project Overview',
        'Business Impact',
        'Key Metrics',
        'Resource Requirements',
        'Decision Required'
      ]
    }
  };
}

export async function handleGeneratePRFAQ(args: CommunicationsArgs): Promise<any> {
  const { product_info, target_audience } = args;

  const prFaq = `# Press Release FAQ

## Press Release

**FOR IMMEDIATE RELEASE**

### Company Announces Strategic Initiative

${product_info || 'Strategic product initiative'}

This new capability represents a significant advancement in our product offering, delivering enhanced value to our customers and strengthening our market position.

## Frequently Asked Questions

### Q: What is this new initiative?
A: ${product_info || 'Strategic initiative'} - a comprehensive solution designed to address key customer needs and market opportunities.

### Q: Who is the target audience?
A: This initiative is designed for ${target_audience || 'our customers'}, providing them with enhanced capabilities and improved experience.

### Q: When will this be available?
A: We plan to launch this initiative in phases, with initial availability expected within the next quarter.

### Q: How does this benefit customers?
A: Customers will experience improved efficiency, enhanced capabilities, and better outcomes through this new initiative.

### Q: What makes this different from competitors?
A: Our unique approach combines innovative technology with deep customer understanding to deliver superior value.

### Q: What's the development timeline?
A: Development is proceeding on schedule with regular milestones and customer feedback integration.

## Internal FAQ

### Q: What are the key success metrics?
A: User adoption, customer satisfaction, revenue impact, and competitive positioning.

### Q: What are the main risks?
A: Technical complexity, market timing, competitive response, and resource allocation.

### Q: How does this align with company strategy?
A: This initiative directly supports our strategic objectives and long-term vision.`;

  return {
    prFaq: {
      title: 'Press Release & FAQ',
      target_audience: target_audience || 'general public',
      press_release: extractPressReleaseSection(prFaq),
      faq: extractFAQSection(prFaq),
      internal_faq: extractInternalFAQSection(prFaq),
      generated_at: new Date().toISOString()
    }
  };
}

export async function handleGetConsultingSummary(args: CommunicationsArgs): Promise<any> {
  const { analysis_data, summary_type } = args;

  const summary = `# Consulting Summary

## Executive Summary
Based on comprehensive analysis, key findings and recommendations have been identified to drive strategic value and operational excellence.

## Key Findings
1. **Strategic Opportunity:** Significant potential with strong positioning
2. **Operational Efficiency:** Multiple optimization opportunities identified
3. **Risk Management:** Manageable risk profile with clear mitigation strategies
4. **Resource Optimization:** Efficient resource allocation can maximize ROI

## Strategic Recommendations

### Immediate Actions (0-30 days)
- Initiate high-impact, low-effort improvements
- Establish project governance and success metrics
- Begin stakeholder alignment and communication

### Short-term Initiatives (1-6 months)
- Implement core strategic initiatives
- Optimize operational processes and workflows
- Develop competitive advantages and market positioning

### Long-term Strategy (6-18 months)
- Build sustainable competitive advantages
- Scale successful initiatives across organization
- Establish market leadership position

## Financial Impact
- **Investment Required:** Moderate investment with strong ROI potential
- **Expected Returns:** Significant value creation and cost savings
- **Payback Period:** Attractive payback within acceptable timeframe
- **Risk-Adjusted Value:** Strong value creation after risk adjustment

## Implementation Roadmap
1. **Planning Phase:** Detailed planning and resource allocation
2. **Execution Phase:** Systematic implementation with regular monitoring
3. **Optimization Phase:** Continuous improvement and scaling
4. **Sustainment Phase:** Long-term value capture and maintenance

## Success Metrics
- Strategic objective achievement
- Operational efficiency improvements
- Financial performance targets
- Stakeholder satisfaction levels

## Next Steps
1. Secure executive sponsorship and resource commitment
2. Establish project team and governance structure
3. Begin detailed implementation planning
4. Initiate stakeholder communication and change management`;

  return {
    consultingSummary: {
      type: summary_type || 'executive',
      content: summary,
      analysis_data: analysis_data || 'Analysis data summary',
      key_sections: [
        'Executive Summary',
        'Key Findings',
        'Strategic Recommendations',
        'Financial Impact',
        'Implementation Roadmap',
        'Success Metrics',
        'Next Steps'
      ],
      generated_at: new Date().toISOString()
    }
  };
}

// Helper functions for content generation

function generateExecutiveOnePager(businessCase: string, audience: string): string {
  return `# Executive One-Pager

## The Ask
**Approve development investment** for strategic initiative that delivers measurable business value and competitive advantage.

## Why Now
Market opportunity window is optimal with validated customer demand, technical readiness, and strategic alignment converging to create ideal implementation timing.

## Investment & Returns
- **Investment:** Development and operational costs as outlined in business case
- **Returns:** Projected ROI and revenue impact with conservative assumptions
- **Timeline:** Phased approach with early value delivery and iterative improvement

## Strategic Value
- **Market Position:** Strengthens competitive differentiation and market leadership
- **Customer Value:** Addresses validated pain points with measurable impact
- **Business Growth:** Enables new revenue streams and market expansion

## Risk Mitigation
- **Technical:** Proven technology stack with experienced team
- **Market:** Validated demand with conservative projections
- **Financial:** Phased investment with clear success metrics

## Next Steps
1. Approve business case and resource allocation
2. Initiate development with detailed requirements
3. Establish success metrics and monitoring systems
4. Plan go-to-market strategy and competitive positioning`;
}

function generatePRFAQ(businessCase: string, audience: string): string {
  return `# Press Release & FAQ

## Press Release

### Headline
**Company Launches Strategic Initiative: Delivering Measurable Value Through Market-Leading Innovation**

### Body
Today we announced the development of a strategic initiative that addresses key customer needs while strengthening our competitive position in the market. This initiative represents our commitment to continuous innovation and customer value creation through differentiated solutions.

**Customer Impact:** Direct benefits through improved efficiency and enhanced capabilities
**Market Position:** Reinforces leadership in key market segments with competitive differentiation
**Strategic Value:** Aligns with long-term vision and growth objectives while addressing market opportunities

## FAQ

**Q: Why is this initiative important?**
A: It addresses validated customer pain points while creating strategic competitive advantages and new revenue opportunities in a growing market.

**Q: What's the expected timeline?**
A: Phased development approach with initial value delivery in 6 months and full feature set within 12 months, positioning us ahead of competitive alternatives.

**Q: How does this align with company strategy?**
A: Direct alignment with strategic priorities, OKRs, and long-term vision for market leadership and competitive differentiation.

**Q: What are the success metrics?**
A: Clear ROI targets, customer adoption goals, market share objectives, and business impact measurements as defined in the business case.`;
}

function generateBoardPresentation(businessCase: string, audience: string): string {
  return `# Board Presentation: Strategic Investment Proposal

## Executive Summary
Strategic initiative development opportunity with strong ROI, market validation, and competitive advantage potential.

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

function generateTeamAnnouncement(businessCase: string, audience: string): string {
  return `# Team Announcement: New Strategic Initiative

## Exciting News
We're launching a strategic initiative development that will create significant value for our customers and strengthen our market position.

## What This Means
- **For Customers:** Enhanced capabilities addressing key pain points
- **For Our Team:** Opportunity to work on high-impact, strategic project
- **For The Company:** Competitive advantage and revenue growth

## Development Approach
- **Methodology:** Structured development with clear milestones
- **Timeline:** Phased development with regular feedback loops
- **Team Structure:** Cross-functional collaboration with clear ownership

## Success Metrics
Clear goals and measurements to track progress and celebrate achievements together.

## Next Steps
Development teams will receive detailed specifications and implementation guidance.

**Questions?** Reach out to the project team for additional context and clarification.`;
}

// Helper functions for PR FAQ parsing
function extractPressReleaseSection(content: string): string {
  const lines = content.split('\n');
  const pressReleaseStart = lines.findIndex(line => line.includes('Press Release'));
  const faqStart = lines.findIndex(line => line.includes('FAQ'));

  if (pressReleaseStart === -1) return '';

  const pressReleaseLines = pressReleaseStart === -1 || faqStart === -1
    ? lines.slice(pressReleaseStart)
    : lines.slice(pressReleaseStart, faqStart);

  return pressReleaseLines.join('\n').trim();
}

function extractFAQSection(content: string): string {
  const lines = content.split('\n');
  const faqStart = lines.findIndex(line => line.includes('FAQ'));

  if (faqStart === -1) return '';

  const faqLines = lines.slice(faqStart);
  const internalFaqStart = faqLines.findIndex(line => line.includes('Internal FAQ'));

  return internalFaqStart === -1
    ? faqLines.join('\n').trim()
    : faqLines.slice(0, internalFaqStart).join('\n').trim();
}

function extractInternalFAQSection(content: string): string {
  const lines = content.split('\n');
  const internalFaqStart = lines.findIndex(line => line.includes('Internal FAQ'));

  if (internalFaqStart === -1) return '';

  return lines.slice(internalFaqStart).join('\n').trim();
}
