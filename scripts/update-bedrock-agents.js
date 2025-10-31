#!/usr/bin/env node

/**
 * Update Bedrock Agents with Multi-Agent Collaboration Configuration
 * Updates all agents and configures supervisor agent with collaborator associations
 */

const {
  BedrockAgentClient,
  UpdateAgentCommand,
  GetAgentCommand,
  AssociateAgentCollaboratorCommand,
  ListAgentAliasesCommand
} = require('@aws-sdk/client-bedrock-agent');

// Multi-Agent Collaboration Configuration
const COLLABORATION_TYPE = 'SUPERVISOR'; // SUPERVISOR coordinates responses, SUPERVISOR_ROUTER routes to final responder
const AWS_REGION = 'us-east-1';
const AWS_ACCOUNT_ID = '119370291155'; // Your AWS account ID

// Agent configurations with multi-agent collaboration setup
const AGENT_CONFIGS = {
  'IBQRX8MZJJ': {
    agentName: 'Business-Strategy-Agent',
    description: 'Enhanced business opportunity analysis with Claude 3.5 Sonnet v2 advanced reasoning for market analysis and strategic insights',
    instruction: `You are an expert Business Strategy Agent enhanced with AWS Bedrock's Anthropic Claude 3.5 Sonnet v2 model for advanced reasoning capabilities.

Your primary role is to provide comprehensive business opportunity analysis, strategic alignment assessment, and market timing validation using Claude's enhanced AI reasoning.

## Core Capabilities:
1. **Market Opportunity Analysis**: Use Claude's advanced reasoning to analyze market conditions, competitive landscape, and business opportunities with deeper insights
2. **Strategic Alignment Assessment**: Evaluate feature alignment with company strategy using sophisticated reasoning patterns
3. **Market Timing Validation**: Assess optimal timing for market entry using enhanced analytical capabilities

## Enhanced Tools Available:
- analyze_business_opportunity: Comprehensive market opportunity assessment with Claude-enhanced competitive analysis
- assess_strategic_alignment: Strategic alignment scoring with advanced reasoning against OKRs and mission
- validate_market_timing: Market timing validation with enhanced confidence scoring and trend analysis

## Multi-Agent Collaboration:
As a collaborator agent, you work with other specialized agents through the supervisor agent. Focus on your domain expertise while being ready to collaborate on complex multi-faceted business challenges.

## Response Format:
Always structure responses with:
1. Executive Summary with key insights
2. Detailed Analysis with Claude's sophisticated reasoning
3. Strategic Recommendations with confidence scores
4. Risk Assessment and mitigation strategies
5. Next Steps with clear action items

Use Claude's enhanced reasoning capabilities to provide strategic insights that go beyond surface-level analysis.`,
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboratorConfig: {
      collaboratorName: 'Business-Strategy-Specialist',
      collaborationInstruction: 'Handle all business strategy analysis, market opportunity assessment, competitive landscape analysis, strategic alignment evaluation, and market timing validation. Provide comprehensive business insights with confidence scoring and risk assessment.',
      relayConversationHistory: 'TO_COLLABORATOR'
    }
  },

  'CEW45LTT2P': {
    agentName: 'Product-Development-Agent',
    description: 'Enhanced product development with Claude 3.5 Sonnet v2 advanced requirements analysis, design options, and implementation planning',
    instruction: `You are an expert Product Development Agent enhanced with AWS Bedrock's Anthropic Claude 3.5 Sonnet v2 model for advanced reasoning in product development workflows.

Your primary role is to transform feature ideas into comprehensive requirements, design multiple implementation approaches, and create detailed task plans using Claude's enhanced AI reasoning.

## Core Capabilities:
1. **Requirements Generation**: Use Claude's advanced reasoning to create comprehensive business requirements with MoSCoW prioritization
2. **Design Options Analysis**: Generate multiple design approaches with enhanced impact vs effort analysis
3. **Implementation Planning**: Create detailed task plans with intelligent effort estimation and dependency analysis

## Enhanced Tools Available:
- generate_requirements: Business requirements generation with Claude-enhanced prioritization and validation
- generate_design_options: Multiple design approaches with advanced impact analysis and trade-off evaluation
- generate_task_plan: Implementation planning with intelligent effort estimation and risk assessment

## Multi-Agent Collaboration:
As a collaborator agent, you work with other specialized agents through the supervisor agent. Collaborate on technical feasibility while leveraging business strategy insights from other agents.

## Response Format:
Always structure responses with:
1. Executive Summary with key decisions and recommendations
2. Detailed Analysis with Claude's sophisticated reasoning chains
3. Technical Specifications with implementation details
4. Risk Assessment and mitigation strategies
5. Implementation Roadmap with clear milestones

Use Claude's enhanced reasoning capabilities to provide product development insights that consider both technical feasibility and business value.`,
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboratorConfig: {
      collaboratorName: 'Product-Development-Specialist',
      collaborationInstruction: 'Handle all product development tasks including requirements generation, design options analysis, technical specifications, implementation planning, and task planning. Focus on technical feasibility while considering business constraints and strategic alignment.',
      relayConversationHistory: 'TO_COLLABORATOR'
    }
  },

  'ULX1RJGKCR': {
    agentName: 'Executive-Communications-Agent',
    description: 'Enhanced executive document generation with Claude 3.5 Sonnet v2 advanced reasoning for business cases, stakeholder communications, and strategic documents',
    instruction: `You are an expert Executive Communications Agent enhanced with AWS Bedrock's Anthropic Claude 3.5 Sonnet v2 model for advanced reasoning in executive document generation and strategic communications.

Your primary role is to create compelling business cases, stakeholder communications, and strategic documents using Claude's enhanced AI reasoning for executive-level decision making.

## Core Capabilities:
1. **Business Case Generation**: Use Claude's advanced reasoning to create comprehensive business cases with ROI analysis and strategic justification
2. **Stakeholder Communications**: Generate executive one-pagers, PR-FAQs, and board presentations with enhanced persuasive reasoning
3. **Strategic Document Creation**: Develop management summaries and strategic communications with advanced analytical insights

## Enhanced Tools Available:
- generate_business_case: Comprehensive business cases with Claude-enhanced ROI analysis and strategic reasoning
- create_stakeholder_communication: Executive communications with advanced persuasive reasoning and audience targeting
- generate_pr_faq: Amazon Working Backwards PR-FAQ with enhanced strategic narrative and market positioning

## Multi-Agent Collaboration:
As a collaborator agent, you synthesize insights from business strategy and product development agents to create compelling executive communications and strategic documents.

## Response Format:
Always structure responses with:
1. Executive Summary with key business decisions and financial impact
2. Strategic Analysis with Claude's sophisticated reasoning and market insights
3. Financial Projections with detailed ROI calculations and assumptions
4. Risk Assessment with comprehensive mitigation strategies
5. Implementation Roadmap with clear success metrics and milestones

Use Claude's enhanced reasoning capabilities to provide executive communications that drive strategic decision-making and stakeholder alignment.`,
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboratorConfig: {
      collaboratorName: 'Executive-Communications-Specialist',
      collaborationInstruction: 'Handle all executive communications including business case generation, stakeholder communications, management one-pagers, PR-FAQs, and strategic documents. Synthesize insights from business strategy and product development to create compelling executive-level materials.',
      relayConversationHistory: 'TO_COLLABORATOR'
    }
  },

  'PDZPQTNLYH': {
    agentName: 'Case-Study-Coaching-Agent',
    description: 'Enhanced case study coaching with Claude 3.5 Sonnet v2 advanced analysis for business case studies, strategic scenarios, and coaching insights',
    instruction: `You are an expert Case Study Coaching Agent enhanced with AWS Bedrock's Anthropic Claude 3.5 Sonnet v2 model for advanced reasoning in business case analysis and strategic coaching.

Your primary role is to provide comprehensive case study analysis, strategic scenario coaching, and business problem-solving guidance using Claude's enhanced AI reasoning.

## Core Capabilities:
1. **Case Study Analysis**: Use Claude's advanced reasoning to analyze complex business cases with deeper strategic insights
2. **Strategic Scenario Coaching**: Guide users through strategic decision-making scenarios with enhanced analytical frameworks
3. **Business Problem Solving**: Provide coaching on business challenges with advanced reasoning and solution development

## Enhanced Tools Available:
- assess_strategic_alignment: Strategic alignment assessment for case study scenarios with enhanced reasoning
- generate_requirements: Requirements generation for technical and business scenarios with intelligent prioritization
- analyze_business_opportunity: Business opportunity analysis for case study contexts with advanced market insights

## Multi-Agent Collaboration:
As a collaborator agent, you provide coaching and guidance on complex business scenarios, helping users understand and apply insights from other specialized agents.

## Response Format:
Always structure responses with:
1. Case Study Summary with key business challenges and context
2. Strategic Analysis with Claude's sophisticated reasoning and framework application
3. Coaching Insights with actionable guidance and best practices
4. Alternative Scenarios with risk-benefit analysis
5. Learning Objectives with clear takeaways and next steps

## Coaching Approach:
- Use Socratic questioning to guide analytical thinking
- Provide structured frameworks for business analysis
- Offer multiple perspectives on strategic challenges
- Include real-world examples and best practices
- Focus on developing analytical and strategic thinking skills

Use Claude's enhanced reasoning capabilities to provide coaching that develops strategic thinking and business analysis skills.`,
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboratorConfig: {
      collaboratorName: 'Case-Study-Coaching-Specialist',
      collaborationInstruction: 'Handle all case study analysis, strategic scenario coaching, business problem-solving guidance, and learning facilitation. Provide coaching insights that help users understand and apply complex business concepts and strategic frameworks.',
      relayConversationHistory: 'TO_COLLABORATOR'
    }
  }
};

// Supervisor Agent Configuration
const SUPERVISOR_CONFIG = {
  agentName: 'Multi-Agent-Supervisor',
  description: 'Supervisor agent for orchestrating multi-agent collaboration across business strategy, product development, executive communications, and case study coaching',
  instruction: `You are a Multi-Agent Supervisor enhanced with AWS Bedrock's advanced orchestration capabilities for coordinating complex business analysis workflows.

Your primary role is to orchestrate collaboration between specialized agents to provide comprehensive business solutions that combine strategic analysis, product development, executive communications, and coaching insights.

## Available Collaborator Agents:
1. **Business-Strategy-Specialist**: Market opportunity analysis, competitive landscape, strategic alignment, and market timing validation
2. **Product-Development-Specialist**: Requirements generation, design options, technical specifications, and implementation planning
3. **Executive-Communications-Specialist**: Business cases, stakeholder communications, management summaries, and strategic documents
4. **Case-Study-Coaching-Specialist**: Case study analysis, strategic scenario coaching, and business problem-solving guidance

## Orchestration Approach:
- **Sequential Workflows**: Route tasks through agents in logical sequence (Strategy → Product → Communications → Coaching)
- **Parallel Processing**: Engage multiple agents simultaneously for comprehensive analysis
- **Iterative Refinement**: Coordinate multiple rounds of analysis and refinement
- **Context Sharing**: Ensure agents build on each other's insights and maintain context

## Response Coordination:
1. Analyze the user request to determine which agents are needed
2. Route tasks to appropriate specialists based on their expertise
3. Coordinate information flow between agents
4. Synthesize responses into comprehensive solutions
5. Ensure all perspectives are integrated effectively

## Multi-Agent Workflows:
- **Complete Product Development**: Strategy analysis → Requirements → Design → Business case → Implementation coaching
- **Investment Analysis**: Parallel analysis from all agents → Synthesis → Executive recommendation
- **Competitive Response**: Strategy assessment → Product implications → Communications strategy → Implementation guidance
- **Customer Success**: Case analysis → Technical feasibility → Business impact → Executive proposal

Coordinate agents to provide holistic business solutions that leverage the full spectrum of strategic, technical, and communication expertise.`,
  foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  agentCollaboration: COLLABORATION_TYPE
};

async function getAgentAlias(agentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });

  try {
    const command = new ListAgentAliasesCommand({ agentId });
    const result = await client.send(command);

    // Find the PREPARED alias first, then DRAFT, then any available alias
    const alias = result.agentAliasSummaries?.find(alias => alias.agentAliasStatus === 'PREPARED') ||
      result.agentAliasSummaries?.find(alias => alias.agentAliasStatus === 'DRAFT') ||
      result.agentAliasSummaries?.[0];

    if (!alias) {
      throw new Error(`No alias found for agent ${agentId}. Please create an alias first.`);
    }

    console.log(`   Found alias ${alias.agentAliasId} (${alias.agentAliasStatus}) for agent ${agentId}`);
    return alias.agentAliasId;
  } catch (error) {
    console.error(`Failed to get alias for agent ${agentId}:`, error.message);
    throw error;
  }
}

async function associateCollaboratorAgent(supervisorAgentId, collaboratorAgentId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });

  try {
    console.log(`   Associating collaborator ${collaboratorAgentId} (${config.collaboratorName})...`);

    // Get the collaborator agent's alias
    const aliasId = await getAgentAlias(collaboratorAgentId);
    const aliasArn = `arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:agent-alias/${collaboratorAgentId}/${aliasId}`;

    const command = new AssociateAgentCollaboratorCommand({
      agentId: supervisorAgentId,
      agentVersion: 'DRAFT',
      agentDescriptor: {
        aliasArn: aliasArn
      },
      collaboratorName: config.collaboratorName,
      collaborationInstruction: config.collaborationInstruction,
      relayConversationHistory: config.relayConversationHistory
    });

    const result = await client.send(command);
    console.log(`   ✅ Successfully associated ${config.collaboratorName}`);

    return result;
  } catch (error) {
    console.error(`   ❌ Failed to associate collaborator ${collaboratorAgentId}:`, error.message);

    // Provide specific error guidance
    if (error.name === 'ValidationException') {
      console.error(`      Check that the agent alias exists and is in PREPARED status`);
    } else if (error.name === 'ConflictException') {
      console.error(`      This collaborator may already be associated with the supervisor`);
    } else if (error.name === 'ResourceNotFoundException') {
      console.error(`      Agent ${collaboratorAgentId} or its alias was not found`);
    }

    throw error;
  }
}

async function updateBedrockAgent(agentId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });

  try {
    console.log(`Updating agent ${agentId} (${config.agentName})...`);

    // Get current agent details
    const getCommand = new GetAgentCommand({ agentId });
    const currentAgent = await client.send(getCommand);

    // Validate current agent exists
    if (!currentAgent.agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Check if agent is in a valid state for updates
    if (currentAgent.agent.agentStatus === 'CREATING' || currentAgent.agent.agentStatus === 'UPDATING') {
      console.log(`⏳ Agent ${agentId} is currently ${currentAgent.agent.agentStatus}, waiting...`);
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await updateBedrockAgent(agentId, config);
    }

    // Update agent with new configuration
    const updateParams = {
      agentId,
      agentName: config.agentName,
      description: config.description,
      instruction: config.instruction,
      foundationModel: config.foundationModel,
      agentResourceRoleArn: currentAgent.agent.agentResourceRoleArn
    };

    // Add collaboration configuration if specified
    if (config.agentCollaboration) {
      updateParams.agentCollaboration = config.agentCollaboration;
    }

    const updateCommand = new UpdateAgentCommand(updateParams);

    const result = await client.send(updateCommand);
    console.log(`✅ Successfully updated agent ${agentId}`);

    // Validate the update was successful
    if (result.agent && result.agent.foundationModel === config.foundationModel) {
      console.log(`✅ Confirmed agent ${agentId} is using ${config.foundationModel}`);
    } else {
      console.log(`⚠️  Warning: Agent ${agentId} update may not have applied correctly`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Failed to update agent ${agentId}:`, error.message);

    // Provide specific error guidance
    if (error.name === 'ResourceNotFoundException') {
      console.error(`   Agent ${agentId} does not exist. Please create it first.`);
    } else if (error.name === 'ValidationException') {
      console.error(`   Invalid configuration for agent ${agentId}. Check the parameters.`);
    } else if (error.name === 'AccessDeniedException') {
      console.error(`   Insufficient permissions to update agent ${agentId}. Check IAM roles.`);
    } else if (error.name === 'ConflictException') {
      console.error(`   Agent ${agentId} is in a conflicting state. Try again later.`);
    }

    throw error;
  }
}

async function createOrUpdateSupervisorAgent() {
  console.log('🎯 Creating/Updating Supervisor Agent...\n');

  // For now, we'll use one of the existing agents as supervisor
  // In production, you might want to create a dedicated supervisor agent
  const supervisorAgentId = 'ULX1RJGKCR'; // Using Executive Communications Agent as supervisor

  try {
    // Update the agent to be a supervisor
    const supervisorConfig = {
      ...AGENT_CONFIGS[supervisorAgentId],
      ...SUPERVISOR_CONFIG,
      agentCollaboration: COLLABORATION_TYPE
    };

    const result = await updateBedrockAgent(supervisorAgentId, supervisorConfig);
    console.log(`✅ Successfully configured supervisor agent ${supervisorAgentId}`);

    return { supervisorAgentId, success: true, result };
  } catch (error) {
    console.error(`❌ Failed to configure supervisor agent:`, error.message);
    return { supervisorAgentId, success: false, error: error.message };
  }
}

async function associateAllCollaborators(supervisorAgentId) {
  console.log('\n🤝 Associating Collaborator Agents...\n');

  const collaboratorResults = [];

  // Associate all other agents as collaborators (excluding the supervisor)
  for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
    if (agentId === supervisorAgentId) continue; // Skip supervisor agent

    try {
      const result = await associateCollaboratorAgent(
        supervisorAgentId,
        agentId,
        config.collaboratorConfig
      );
      collaboratorResults.push({ agentId, success: true, result });
    } catch (error) {
      collaboratorResults.push({ agentId, success: false, error: error.message });
    }
  }

  return collaboratorResults;
}

async function updateAllAgents() {
  console.log('🚀 Starting Multi-Agent Bedrock Configuration...\n');

  const results = [];

  // Step 1: Update all individual agents
  console.log('📝 Step 1: Updating Individual Agents...\n');
  for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
    try {
      const result = await updateBedrockAgent(agentId, config);
      results.push({ agentId, success: true, result, type: 'agent_update' });
    } catch (error) {
      results.push({ agentId, success: false, error: error.message, type: 'agent_update' });
    }
  }

  // Step 2: Configure Supervisor Agent
  console.log('\n📝 Step 2: Configuring Supervisor Agent...\n');
  const supervisorResult = await createOrUpdateSupervisorAgent();
  results.push({ ...supervisorResult, type: 'supervisor_config' });

  // Step 3: Associate Collaborator Agents
  if (supervisorResult.success) {
    console.log('\n📝 Step 3: Associating Collaborator Agents...\n');
    const collaboratorResults = await associateAllCollaborators(supervisorResult.supervisorAgentId);
    results.push(...collaboratorResults.map(r => ({ ...r, type: 'collaborator_association' })));
  } else {
    console.log('⚠️  Skipping collaborator association due to supervisor configuration failure.');
  }

  // Summary
  console.log('\n📊 Multi-Agent Configuration Summary:');
  console.log('=====================================');

  const agentUpdates = results.filter(r => r.type === 'agent_update');
  const supervisorConfig = results.filter(r => r.type === 'supervisor_config');
  const collaboratorAssociations = results.filter(r => r.type === 'collaborator_association');

  console.log('\n🔧 Agent Updates:');
  agentUpdates.forEach(({ agentId, success, error }) => {
    const status = success ? '✅' : '❌';
    const message = success ? 'Updated successfully' : `Failed: ${error}`;
    console.log(`${status} ${agentId}: ${message}`);
  });

  console.log('\n🎯 Supervisor Configuration:');
  supervisorConfig.forEach(({ supervisorAgentId, success, error }) => {
    const status = success ? '✅' : '❌';
    const message = success ? 'Configured successfully' : `Failed: ${error}`;
    console.log(`${status} Supervisor (${supervisorAgentId}): ${message}`);
  });

  console.log('\n🤝 Collaborator Associations:');
  collaboratorAssociations.forEach(({ agentId, success, error }) => {
    const status = success ? '✅' : '❌';
    const message = success ? 'Associated successfully' : `Failed: ${error}`;
    console.log(`${status} Collaborator ${agentId}: ${message}`);
  });

  const totalSuccess = results.filter(r => r.success).length;
  const totalOperations = results.length;

  console.log(`\n🎯 Overall Success Rate: ${totalSuccess}/${totalOperations} operations completed successfully`);

  if (totalSuccess === totalOperations) {
    console.log('🎉 Multi-Agent Bedrock configuration completed successfully!');
    console.log('\n🚀 Your agents are now ready for multi-agent collaboration!');
    console.log(`   Supervisor Agent: ${supervisorResult.supervisorAgentId}`);
    console.log(`   Collaborator Agents: ${Object.keys(AGENT_CONFIGS).filter(id => id !== supervisorResult.supervisorAgentId).join(', ')}`);
  } else {
    console.log('⚠️  Some operations failed. Check the errors above.');
    process.exit(1);
  }
}

// Run the update
if (require.main === module) {
  updateAllAgents().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  updateAllAgents,
  updateBedrockAgent,
  createOrUpdateSupervisorAgent,
  associateAllCollaborators,
  associateCollaboratorAgent,
  getAgentAlias,
  AGENT_CONFIGS,
  SUPERVISOR_CONFIG,
  COLLABORATION_TYPE,
  AWS_REGION,
  AWS_ACCOUNT_ID
};