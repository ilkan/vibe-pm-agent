/**
 * Vibe PM Agent - Multi-Agent Orchestrator
 * Coordinates interactions between specialized Bedrock agents
 * Handles agent selection, cross-agent communication, and workflow management
 */

import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { Logger } from '../lambda-functions/shared/utils';

export interface AgentConfig {
  agentId: string;
  agentName: string;
  specialization: string;
  tools: string[];
}

export interface OrchestrationRequest {
  userIntent: string;
  context?: Record<string, any>;
  preferredAgent?: string;
  requiresMultiAgent?: boolean;
}

export interface OrchestrationResponse {
  success: boolean;
  result: any;
  agentsUsed: string[];
  executionTime: number;
  confidence: number;
}

export class AgentOrchestrator {
  private bedrockClient: BedrockAgentRuntimeClient;
  private agents: Map<string, AgentConfig>;
  private logger: Logger;

  constructor(region: string = 'us-east-1') {
    this.bedrockClient = new BedrockAgentRuntimeClient({ region });
    this.agents = new Map();
    this.logger = new Logger({ logLevel: 'info' });
    this.initializeAgents();
  }

  /**
   * Initialize agent configurations
   */
  private initializeAgents(): void {
    const agentConfigs: AgentConfig[] = [
      {
        agentId: 'BUSINESS_STRATEGY_AGENT_ID', // Replace with actual agent ID
        agentName: 'vibe-pm-business-strategy-agent',
        specialization: 'business_analysis',
        tools: [
          'analyze_business_opportunity',
          'generate_business_case',
          'assess_strategic_alignment',
          'validate_market_timing',
          'validate_idea_quick',
          'analyze_competitor_landscape',
          'calculate_market_sizing',
          'monitor_market_conditions'
        ]
      },
      {
        agentId: 'PRODUCT_DEVELOPMENT_AGENT_ID', // Replace with actual agent ID
        agentName: 'vibe-pm-product-development-agent',
        specialization: 'product_development',
        tools: [
          'generate_requirements',
          'generate_design_options',
          'generate_task_plan',
          'optimize_resource_allocation',
          'optimize_intent',
          'analyze_workflow',
          'enhance_citations',
          'validate_and_audit_citations'
        ]
      },
      {
        agentId: 'EXECUTIVE_COMMUNICATIONS_AGENT_ID', // Replace with actual agent ID
        agentName: 'vibe-pm-executive-communications-agent',
        specialization: 'executive_communications',
        tools: [
          'create_stakeholder_communication',
          'generate_management_onepager',
          'generate_pr_faq',
          'get_consulting_summary',
          'generate_roi_analysis',
          'get_company_interview_insights',
          'customize_preparation_for_company',
          'get_company_case_scenarios'
        ]
      },
      {
        agentId: 'INTERVIEW_COACHING_AGENT_ID', // Replace with actual agent ID
        agentName: 'vibe-pm-interview-coaching-agent',
        specialization: 'interview_coaching',
        tools: [
          'start_interview_preparation',
          'generate_interview_question',
          'evaluate_interview_response',
          'get_interview_feedback',
          'start_case_study',
          'get_case_guidance',
          'evaluate_case_approach',
          'complete_case_study'
        ]
      }
    ];

    agentConfigs.forEach(config => {
      this.agents.set(config.agentName, config);
    });

    this.logger.info('Agent orchestrator initialized', {
      agentCount: this.agents.size,
      agents: Array.from(this.agents.keys())
    });
  }

  /**
   * Orchestrate request across multiple agents
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting orchestration', {
        userIntent: request.userIntent,
        preferredAgent: request.preferredAgent,
        requiresMultiAgent: request.requiresMultiAgent
      });

      // Determine which agent(s) to use
      const selectedAgents = await this.selectAgents(request);
      
      if (selectedAgents.length === 0) {
        throw new Error('No suitable agents found for the request');
      }

      // Execute single or multi-agent workflow
      let result: any;
      if (selectedAgents.length === 1 || !request.requiresMultiAgent) {
        result = await this.executeSingleAgent(selectedAgents[0], request);
      } else {
        result = await this.executeMultiAgent(selectedAgents, request);
      }

      const executionTime = Date.now() - startTime;
      
      this.logger.info('Orchestration completed', {
        agentsUsed: selectedAgents.map(a => a.agentName),
        executionTime,
        success: true
      });

      return {
        success: true,
        result,
        agentsUsed: selectedAgents.map(a => a.agentName),
        executionTime,
        confidence: this.calculateConfidence(selectedAgents, request)
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Orchestration failed', error as Error, {
        userIntent: request.userIntent,
        executionTime
      });

      return {
        success: false,
        result: { error: (error as Error).message },
        agentsUsed: [],
        executionTime,
        confidence: 0
      };
    }
  }

  /**
   * Select appropriate agents based on request
   */
  private async selectAgents(request: OrchestrationRequest): Promise<AgentConfig[]> {
    // If preferred agent is specified, use it
    if (request.preferredAgent) {
      const agent = this.agents.get(request.preferredAgent);
      return agent ? [agent] : [];
    }

    // Analyze user intent to determine best agent(s)
    const intentAnalysis = this.analyzeIntent(request.userIntent);
    const selectedAgents: AgentConfig[] = [];

    // Primary agent selection based on intent
    const primaryAgent = this.selectPrimaryAgent(intentAnalysis);
    if (primaryAgent) {
      selectedAgents.push(primaryAgent);
    }

    // Secondary agents for multi-agent workflows
    if (request.requiresMultiAgent || intentAnalysis.requiresMultipleSpecializations) {
      const secondaryAgents = this.selectSecondaryAgents(intentAnalysis, primaryAgent);
      selectedAgents.push(...secondaryAgents);
    }

    return selectedAgents;
  }

  /**
   * Analyze user intent to determine specialization needs
   */
  private analyzeIntent(userIntent: string): {
    primarySpecialization: string;
    secondarySpecializations: string[];
    requiresMultipleSpecializations: boolean;
    keywords: string[];
  } {
    const intent = userIntent.toLowerCase();
    const keywords = intent.split(/\s+/);

    // Define keyword mappings for each specialization
    const specializationKeywords = {
      business_analysis: ['market', 'opportunity', 'business case', 'roi', 'competition', 'strategy', 'timing', 'validation'],
      product_development: ['requirements', 'design', 'development', 'technical', 'implementation', 'workflow', 'optimization'],
      executive_communications: ['executive', 'presentation', 'stakeholder', 'communication', 'one-pager', 'pr-faq', 'summary'],
      interview_coaching: ['interview', 'preparation', 'coaching', 'case study', 'feedback', 'practice', 'question']
    };

    // Score each specialization
    const scores = Object.entries(specializationKeywords).map(([spec, specKeywords]) => ({
      specialization: spec,
      score: specKeywords.reduce((score, keyword) => 
        intent.includes(keyword) ? score + 1 : score, 0
      )
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    const primarySpecialization = scores[0].specialization;
    const secondarySpecializations = scores
      .slice(1)
      .filter(s => s.score > 0)
      .map(s => s.specialization);

    return {
      primarySpecialization,
      secondarySpecializations,
      requiresMultipleSpecializations: secondarySpecializations.length > 0,
      keywords
    };
  }

  /**
   * Select primary agent based on intent analysis
   */
  private selectPrimaryAgent(intentAnalysis: any): AgentConfig | null {
    for (const [agentName, agent] of this.agents) {
      if (agent.specialization === intentAnalysis.primarySpecialization) {
        return agent;
      }
    }
    return null;
  }

  /**
   * Select secondary agents for multi-agent workflows
   */
  private selectSecondaryAgents(intentAnalysis: any, primaryAgent: AgentConfig | null): AgentConfig[] {
    const secondaryAgents: AgentConfig[] = [];

    for (const specialization of intentAnalysis.secondarySpecializations) {
      for (const [agentName, agent] of this.agents) {
        if (agent.specialization === specialization && agent !== primaryAgent) {
          secondaryAgents.push(agent);
          break;
        }
      }
    }

    return secondaryAgents;
  }

  /**
   * Execute single agent workflow
   */
  private async executeSingleAgent(agent: AgentConfig, request: OrchestrationRequest): Promise<any> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const command = new InvokeAgentCommand({
      agentId: agent.agentId,
      agentAliasId: 'TSTALIASID', // Use appropriate alias
      sessionId,
      inputText: request.userIntent
    });

    this.logger.info('Invoking single agent', {
      agentName: agent.agentName,
      agentId: agent.agentId,
      sessionId
    });

    const response = await this.bedrockClient.send(command);
    return this.processAgentResponse(response);
  }

  /**
   * Execute multi-agent workflow
   */
  private async executeMultiAgent(agents: AgentConfig[], request: OrchestrationRequest): Promise<any> {
    const results: Record<string, any> = {};
    
    // Execute agents in sequence (can be parallelized for independent tasks)
    for (const agent of agents) {
      try {
        const agentResult = await this.executeSingleAgent(agent, {
          ...request,
          context: { ...request.context, previousResults: results }
        });
        
        results[agent.agentName] = agentResult;
        
        this.logger.info('Agent completed in multi-agent workflow', {
          agentName: agent.agentName,
          success: true
        });
        
      } catch (error) {
        this.logger.error('Agent failed in multi-agent workflow', error as Error, {
          agentName: agent.agentName
        });
        
        results[agent.agentName] = { error: (error as Error).message };
      }
    }

    // Synthesize results from multiple agents
    return this.synthesizeMultiAgentResults(results, request);
  }

  /**
   * Process agent response
   */
  private processAgentResponse(response: any): any {
    // Extract completion from Bedrock agent response
    if (response.completion) {
      try {
        return JSON.parse(response.completion);
      } catch {
        return { content: response.completion };
      }
    }
    
    return response;
  }

  /**
   * Synthesize results from multiple agents
   */
  private synthesizeMultiAgentResults(results: Record<string, any>, request: OrchestrationRequest): any {
    const synthesis = {
      multiAgentResults: results,
      synthesis: {
        summary: 'Multi-agent analysis completed',
        keyInsights: [],
        recommendations: [],
        confidence: this.calculateMultiAgentConfidence(results)
      }
    };

    // Extract key insights from each agent
    Object.entries(results).forEach(([agentName, result]) => {
      if (result && !result.error) {
        if (result.insights) {
          synthesis.synthesis.keyInsights.push(...result.insights);
        }
        if (result.recommendations) {
          synthesis.synthesis.recommendations.push(...result.recommendations);
        }
      }
    });

    return synthesis;
  }

  /**
   * Calculate confidence score for agent selection
   */
  private calculateConfidence(agents: AgentConfig[], request: OrchestrationRequest): number {
    // Base confidence on agent specialization match and number of agents
    const baseConfidence = agents.length > 0 ? 0.8 : 0.0;
    const multiAgentBonus = agents.length > 1 ? 0.1 : 0.0;
    
    return Math.min(baseConfidence + multiAgentBonus, 1.0);
  }

  /**
   * Calculate confidence for multi-agent results
   */
  private calculateMultiAgentConfidence(results: Record<string, any>): number {
    const totalAgents = Object.keys(results).length;
    const successfulAgents = Object.values(results).filter(r => r && !r.error).length;
    
    return totalAgents > 0 ? successfulAgents / totalAgents : 0;
  }

  /**
   * Get agent by tool name
   */
  getAgentByTool(toolName: string): AgentConfig | null {
    for (const [agentName, agent] of this.agents) {
      if (agent.tools.includes(toolName)) {
        return agent;
      }
    }
    return null;
  }

  /**
   * List all available agents
   */
  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): Record<string, any> {
    return {
      totalAgents: this.agents.size,
      totalTools: Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.tools.length, 0),
      agentsBySpecialization: Array.from(this.agents.values()).reduce((acc, agent) => {
        acc[agent.specialization] = (acc[agent.specialization] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

/**
 * Factory function to create agent orchestrator
 */
export function createAgentOrchestrator(region?: string): AgentOrchestrator {
  return new AgentOrchestrator(region);
}

/**
 * Utility function to route tool requests to appropriate agents
 */
export async function routeToolToAgent(
  toolName: string,
  toolArgs: Record<string, any>,
  orchestrator: AgentOrchestrator
): Promise<OrchestrationResponse> {
  const agent = orchestrator.getAgentByTool(toolName);
  
  if (!agent) {
    throw new Error(`No agent found for tool: ${toolName}`);
  }

  return orchestrator.orchestrate({
    userIntent: `Execute ${toolName} with the provided arguments`,
    context: { toolName, toolArgs },
    preferredAgent: agent.agentName,
    requiresMultiAgent: false
  });
}