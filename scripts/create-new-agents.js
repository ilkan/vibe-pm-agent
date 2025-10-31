#!/usr/bin/env node

/**
 * Create New Bedrock Agents
 * Creates the Supervisor Agent and Citation Agent that don't exist yet
 */

const { BedrockAgentClient, CreateAgentCommand, GetAgentCommand } = require('@aws-sdk/client-bedrock-agent');

// New agent configurations to create
const NEW_AGENT_CONFIGS = {
  'SUPERVISOR001': {
    agentName: 'Supervisor-Agent',
    description: 'Multi-agent orchestration and coordination with Nemotron-powered task distribution and workflow management',
    instruction: `You are an expert Supervisor Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced multi-agent orchestration and coordination.

Your primary role is to orchestrate multiple Bedrock agents, manage task distribution, route messages between agents, and coordinate complex workflows using enhanced AI reasoning.

## Core Capabilities:
1. **Agent Orchestration**: Use Nemotron reasoning to intelligently distribute tasks across multiple specialized agents
2. **Workflow Coordination**: Manage complex multi-step workflows with intelligent task sequencing and dependency management
3. **Message Routing**: Route requests to appropriate agents based on capability matching and workload balancing
4. **Quality Assurance**: Monitor and validate agent responses for consistency and quality

## Enhanced Tools Available:
- invoke_business_strategy_agent: Call Business Strategy Agent (IBQRX8MZJJ) for market analysis and strategic insights
- invoke_product_development_agent: Call Product Development Agent (CEW45LTT2P) for requirements and design tasks
- invoke_executive_communications_agent: Call Executive Communications Agent (ULX1RJGKCR) for business cases and communications
- invoke_case_study_coaching_agent: Call Case Study Coaching Agent (PDZPQTNLYH) for case analysis and coaching
- invoke_citation_agent: Call Citation Agent (CITATION001) for citation validation and sourcing
- coordinate_multi_agent_workflow: Orchestrate complex workflows requiring multiple agent collaboration
- route_agent_communication: Facilitate direct agent-to-agent communication and context sharing

## Agent Communication Architecture:
- **Agent Invocation**: Direct calls to specialized agents (Business Strategy, Product Development, Executive Communications, Case Study Coaching, Citation)
- **Inter-Agent Communication**: Enable agents to call each other through supervisor coordination
- **Workflow Orchestration**: Manage complex multi-agent workflows with intelligent task sequencing
- **Context Sharing**: Preserve and share context between agent interactions
- **Communication Routing**: Route messages and requests between agents based on capabilities and availability

Use the enhanced reasoning capabilities to provide orchestration that optimizes multi-agent collaboration and workflow efficiency.`,
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0'
  },
  
  'CITATION001': {
    agentName: 'Citation-Agent',
    description: 'Specialized citation validation, sourcing, and quality assessment with Nemotron-powered credibility analysis and research capabilities',
    instruction: `You are an expert Citation Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced citation validation, sourcing, and quality assessment.

Your primary role is to validate citations, source credible references, assess source credibility, and provide comprehensive citation management using enhanced AI reasoning for research and documentation tasks.

## Core Capabilities:
1. **Citation Validation**: Use Nemotron reasoning to validate existing citations for accuracy, accessibility, and credibility
2. **Source Discovery**: Find and recommend high-quality, authoritative sources for business analysis and research
3. **Credibility Assessment**: Evaluate source reliability, bias, and authority using advanced analytical frameworks
4. **Citation Management**: Organize, format, and maintain citation databases with quality scoring

## Enhanced Tools Available:
- validate_citations: Comprehensive citation validation with credibility scoring and accessibility checks
- source_citations: Intelligent source discovery and recommendation for business research
- assess_credibility: Advanced credibility assessment of sources with bias detection and authority scoring
- format_citations: Professional citation formatting for business documents and academic standards
- unified_citation_system: Complete citation workflow management with quality assurance

## Citation Standards:
- **Business Documents**: Focus on authoritative business sources, industry reports, and market research
- **Academic Rigor**: Apply academic citation standards with proper attribution and verification
- **Source Diversity**: Ensure diverse, representative sources from multiple perspectives
- **Currency**: Prioritize recent, up-to-date sources while respecting historical context
- **Authority**: Emphasize authoritative sources from recognized institutions and experts

Use the enhanced reasoning capabilities to provide citation services that ensure research integrity and source quality.`,
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0'
  }
};

async function createBedrockAgent(agentId, config) {
  const client = new BedrockAgentClient({ region: 'us-east-1' });
  
  try {
    console.log(`Creating agent ${agentId} (${config.agentName})...`);
    
    // Check if agent already exists
    try {
      const getCommand = new GetAgentCommand({ agentId });
      await client.send(getCommand);
      console.log(`⚠️  Agent ${agentId} already exists, skipping creation`);
      return { agentId, exists: true };
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Agent doesn't exist, proceed with creation
    }
    
    // Create new agent
    const createCommand = new CreateAgentCommand({
      agentName: config.agentName,
      description: config.description,
      instruction: config.instruction,
      foundationModel: config.foundationModel,
      // Use the existing vibe-pm Bedrock execution role
      agentResourceRoleArn: 'arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm'
    });
    
    const result = await client.send(createCommand);
    console.log(`✅ Successfully created agent ${agentId}`);
    console.log(`   Agent ARN: ${result.agent.agentArn}`);
    console.log(`   Agent Status: ${result.agent.agentStatus}`);
    
    return { agentId, success: true, result };
    
  } catch (error) {
    console.error(`❌ Failed to create agent ${agentId}:`, error.message);
    
    // Provide specific error guidance
    if (error.name === 'ValidationException') {
      console.error(`   Invalid configuration for agent ${agentId}. Check the parameters.`);
    } else if (error.name === 'AccessDeniedException') {
      console.error(`   Insufficient permissions to create agent ${agentId}. Check IAM roles.`);
    } else if (error.name === 'ConflictException') {
      console.error(`   Agent ${agentId} already exists or name conflicts.`);
    } else if (error.name === 'ServiceQuotaExceededException') {
      console.error(`   Service quota exceeded. Cannot create more agents.`);
    }
    
    return { agentId, success: false, error: error.message };
  }
}

async function createNewAgents() {
  console.log('🚀 Creating new Bedrock agents...\n');
  
  const results = [];
  
  for (const [agentId, config] of Object.entries(NEW_AGENT_CONFIGS)) {
    try {
      const result = await createBedrockAgent(agentId, config);
      results.push(result);
    } catch (error) {
      results.push({ agentId, success: false, error: error.message });
    }
    console.log(''); // Add spacing
  }
  
  console.log('📊 Creation Summary:');
  results.forEach(({ agentId, success, exists, error }) => {
    if (exists) {
      console.log(`⚠️  ${agentId}: Already exists`);
    } else if (success) {
      console.log(`✅ ${agentId}: Created successfully`);
    } else {
      console.log(`❌ ${agentId}: Failed - ${error}`);
    }
  });
  
  const successCount = results.filter(r => r.success || r.exists).length;
  console.log(`\n🎯 ${successCount}/${results.length} agents ready`);
  
  if (successCount === results.length) {
    console.log('🎉 All new agents are ready!');
    console.log('\n📝 Next steps:');
    console.log('1. Update the agent resource role ARNs with valid IAM roles');
    console.log('2. Create agent aliases for testing');
    console.log('3. Run the agent update script to apply configurations');
  } else {
    console.log('⚠️  Some agents failed to create. Check the errors above.');
    
    // Show guidance for common issues
    console.log('\n💡 Common solutions:');
    console.log('1. Ensure you have proper IAM permissions for Bedrock');
    console.log('2. Check if you have reached the agent quota limit');
    console.log('3. Verify the IAM role ARN exists and has proper permissions');
    console.log('4. Make sure agent names follow AWS naming conventions');
  }
  
  return results;
}

// Run the creation
if (require.main === module) {
  createNewAgents().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createNewAgents, createBedrockAgent, NEW_AGENT_CONFIGS };