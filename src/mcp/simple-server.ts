// Simple MCP Server for testing with Claude Desktop

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Simple PM Agent MCP Server for testing
 */
export class SimplePMAgentMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "pm-agent-intent-optimizer",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "optimize_intent",
            description: "Takes raw developer intent and returns an optimized Kiro spec with ROI analysis",
            inputSchema: {
              type: "object",
              properties: {
                intent: {
                  type: "string",
                  description: "Raw developer intent in natural language"
                }
              },
              required: ["intent"]
            }
          },
          {
            name: "analyze_workflow",
            description: "Analyzes an existing workflow for optimization opportunities",
            inputSchema: {
              type: "object",
              properties: {
                workflow: {
                  type: "object",
                  description: "Workflow definition to analyze"
                }
              },
              required: ["workflow"]
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
          case 'optimize_intent':
            return await this.handleOptimizeIntent(args);
          case 'analyze_workflow':
            return await this.handleAnalyzeWorkflow(args);
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

  private async handleOptimizeIntent(args: any) {
    const intent = args.intent || "No intent provided";
    
    // Simple mock optimization
    const analysis = `
# PM Agent Analysis: Intent Optimization

## Original Intent
${intent}

## Consulting Analysis Applied
- **MECE Framework**: Categorized quota drivers into 3 main areas
- **Value Driver Tree**: Identified key cost optimization opportunities
- **Option Framing**: Generated Conservative, Balanced, and Bold approaches

## Optimization Results

### Conservative Approach (Recommended)
- **Strategy**: Batch similar operations, add basic caching
- **Quota Savings**: 40-50%
- **Implementation Effort**: Low
- **Risk Level**: Low

### Balanced Approach
- **Strategy**: Advanced batching, intelligent caching, spec decomposition
- **Quota Savings**: 60-70%
- **Implementation Effort**: Medium
- **Risk Level**: Medium

### Bold Approach (Zero-Based Design)
- **Strategy**: Complete workflow redesign with event-driven architecture
- **Quota Savings**: 80-90%
- **Implementation Effort**: High
- **Risk Level**: High

## ROI Analysis
- **Current Estimated Cost**: $20/month (naive implementation)
- **Optimized Cost**: $8/month (Conservative approach)
- **Savings**: $12/month (60% reduction)

## Recommended Next Steps
1. Implement Conservative approach first
2. Monitor performance and cost savings
3. Consider Balanced approach after validation
4. Evaluate Bold approach for high-volume scenarios

## Generated Kiro Spec
\`\`\`yaml
name: optimized-workflow
description: Optimized implementation with batching and caching
requirements:
  - Batch operations to reduce API calls
  - Implement caching layer for repeated queries
  - Use scheduled specs instead of real-time processing
tasks:
  - Implement batching logic
  - Add caching mechanism
  - Create scheduled execution workflow
\`\`\`
`;

    return {
      content: [{
        type: "text",
        text: analysis
      }]
    };
  }

  private async handleAnalyzeWorkflow(args: any) {
    const workflow = args.workflow || {};
    const workflowId = workflow.id || "unknown";
    const stepCount = workflow.steps?.length || 0;

    const analysis = `
# Workflow Analysis Report

## Workflow Overview
- **ID**: ${workflowId}
- **Steps**: ${stepCount}
- **Complexity**: ${stepCount > 5 ? 'High' : stepCount > 2 ? 'Medium' : 'Low'}

## Consulting Techniques Applied

### MECE Analysis
**Quota Driver Categories:**
1. **Data Retrieval Operations**: ${Math.floor(stepCount * 0.4)} steps
2. **Processing Operations**: ${Math.floor(stepCount * 0.4)} steps  
3. **Output Operations**: ${Math.floor(stepCount * 0.2)} steps

### Impact vs Effort Matrix
**High Impact, Low Effort:**
- Implement result caching
- Batch similar API calls

**High Impact, Medium Effort:**
- Optimize data retrieval patterns
- Implement async processing

**Medium Impact, Low Effort:**
- Add request deduplication
- Optimize payload sizes

## Optimization Recommendations

### Priority 1 (Immediate)
- **Add caching layer**: 30-40% quota reduction
- **Batch operations**: 20-30% quota reduction

### Priority 2 (Short-term)
- **Async processing**: 15-25% quota reduction
- **Data optimization**: 10-20% quota reduction

### Priority 3 (Long-term)
- **Workflow redesign**: 40-60% quota reduction
- **Event-driven architecture**: 50-70% quota reduction

## Estimated Savings
- **Current Cost**: $${stepCount * 2}/execution
- **Optimized Cost**: $${Math.ceil(stepCount * 0.6)}/execution
- **Savings**: ${Math.floor(40)}% reduction

## Implementation Roadmap
1. Week 1: Implement caching
2. Week 2: Add batching logic
3. Week 3: Optimize data retrieval
4. Week 4: Performance testing and validation
`;

    return {
      content: [{
        type: "text",
        text: analysis
      }]
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // No console.log - it breaks MCP protocol over stdio
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}