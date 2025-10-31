#!/usr/bin/env node

/**
 * Simple Multi-Agent Setup
 * Uses existing aliases and creates a working multi-agent configuration
 */

const { 
  BedrockAgentClient, 
  UpdateAgentCommand,
  CreateAgentCommand,
  AssociateAgentCollaboratorCommand,
  PrepareAgentCommand,
  CreateAgentAliasCommand,
  GetAgentCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AWS_REGION, AWS_ACCOUNT_ID } = require('./update-bedrock-agents');

// Simplified agent configurations
const COLLABORATOR_AGENTS = {
  'IBQRX8MZJJ': {
    name: 'Business-Strategy-Specialist',
    instruction: 'Handle all business strategy analysis, market opportunity assessment, competitive landscape analysis, strategic alignment evaluation, and market timing validation. Provide comprehensive business insights with confidence scoring and risk assessment.'
  },
  'CEW45LTT2P': {
    name: 'Product-Development-Specialist', 
    instruction: 'Handle all product development tasks including requirements generation, design options analysis, technical specifications, implementation planning, and task planning. Focus on technical feasibility while considering business constraints and strategic alignment.'
  },
  'PDZPQTNLYH': {
    name: 'Case-Study-Coaching-Specialist',
    instruction: 'Handle all case study analysis, strategic scenario coaching, business problem-solving guidance, and learning facilitation. Provide coaching insights that help users understand and apply complex business concepts and strategic frameworks.'
  }
};

async function createNewSupervisorAgent() {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log('🎯 Creating New Supervisor Agent...\n');
    
    const supervisorInstruction = `You are a Multi-Agent Supervisor enhanced with AWS Bedrock's advanced orchestration capabilities for coordinating complex business analysis workflows.

Your primary role is to orchestrate collaboration between specialized agents to provide comprehensive business solutions that combine strategic analysis, product development, and coaching insights.

## Available Collaborator Agents:
1. **Business-Strategy-Specialist**: Market opportunity analysis, competitive landscape, strategic alignment, and market timing validation
2. **Product-Development-Specialist**: Requirements generation, design options, technical specifications, and implementation planning  
3. **Case-Study-Coaching-Specialist**: Case study analysis, strategic scenario coaching, and business problem-solving guidance

## Orchestration Approach:
- **Sequential Workflows**: Route tasks through agents in logical sequence (Strategy → Product → Coaching)
- **Parallel Processing**: Engage multiple agents simultaneously for comprehensive analysis
- **Iterative Refinement**: Coordinate multiple rounds of analysis and refinement
- **Context Sharing**: Ensure agents build on each other's insights and maintain context

## Multi-Agent Workflows:
- **Complete Product Development**: Strategy analysis → Requirements → Design → Implementation coaching
- **Investment Analysis**: Parallel analysis from all agents → Synthesis → Executive recommendation
- **Competitive Response**: Strategy assessment → Product implications → Implementation guidance
- **Customer Success**: Case analysis → Technical feasibility → Business impact → Executive proposal

Coordinate agents to provide holistic business solutions that leverage the full spectrum of strategic, technical, and communication expertise.`;

    const createCommand = new CreateAgentCommand({
      agentName: 'Multi-Agent-Supervisor',
      description: 'Supervisor agent for orchestrating multi-agent collaboration across business strategy, product development, and case study coaching',
      instruction: supervisorInstruction,
      foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      agentResourceRoleArn: `arn:aws:iam::${AWS_ACCOUNT_ID}:role/AmazonBedrockExecutionRoleForAgents_vibe-pm`,
      agentCollaboration: 'SUPERVISOR'
    });
    
    const result = await client.send(createCommand);
    console.log(`✅ Created supervisor agent: ${result.agent.agentId}`);
    console.log(`   Name: ${result.agent.agentName}`);
    console.log(`   Status: ${result.agent.agentStatus}`);
    
    return result.agent.agentId;
  } catch (error) {
    console.error(`❌ Failed to create supervisor agent: ${error.message}`);
    throw error;
  }
}

async function associateCollaborators(supervisorAgentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  console.log('\n🤝 Associating Collaborator Agents...\n');
  
  const results = [];
  
  for (const [agentId, config] of Object.entries(COLLABORATOR_AGENTS)) {
    try {
      console.log(`   Associating ${agentId} (${config.name})...`);
      
      // Use the existing TSTALIASID alias - this should work for collaboration
      const aliasArn = `arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:agent-alias/${agentId}/TSTALIASID`;
      
      const associateCommand = new AssociateAgentCollaboratorCommand({
        agentId: supervisorAgentId,
        agentVersion: 'DRAFT',
        agentDescriptor: {
          aliasArn: aliasArn
        },
        collaboratorName: config.name,
        collaborationInstruction: config.instruction,
        relayConversationHistory: 'TO_COLLABORATOR'
      });
      
      await client.send(associateCommand);
      console.log(`   ✅ Associated successfully`);
      
      results.push({ agentId, success: true });
    } catch (error) {
      console.error(`   ❌ Failed to associate ${agentId}: ${error.message}`);
      results.push({ agentId, success: false, error: error.message });
    }
  }
  
  return results;
}

async function createSupervisorAlias(supervisorAgentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log('\n🏷️  Creating Supervisor Alias...\n');
    
    // First prepare the supervisor agent
    console.log('   Preparing supervisor agent...');
    const prepareCommand = new PrepareAgentCommand({ agentId: supervisorAgentId });
    await client.send(prepareCommand);
    
    // Wait a bit for preparation
    console.log('   Waiting for preparation to complete...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    // Create alias
    console.log('   Creating supervisor alias...');
    const createAliasCommand = new CreateAgentAliasCommand({
      agentId: supervisorAgentId,
      agentAliasName: 'Supervisor-Production-Alias',
      description: 'Production alias for multi-agent supervisor',
      routingConfiguration: [
        {
          agentVersion: 'DRAFT'
        }
      ]
    });
    
    const result = await client.send(createAliasCommand);
    console.log(`   ✅ Created supervisor alias: ${result.agentAlias.agentAliasId}`);
    
    return result.agentAlias.agentAliasId;
  } catch (error) {
    console.error(`   ❌ Failed to create supervisor alias: ${error.message}`);
    // This is not critical - the agent can still work without an alias for testing
    return null;
  }
}

async function simpleMultiAgentSetup() {
  console.log('🚀 Simple Multi-Agent Setup');
  console.log('============================\n');
  
  try {
    // Step 1: Create new supervisor agent
    const supervisorAgentId = await createNewSupervisorAgent();
    
    // Step 2: Associate collaborator agents
    const associationResults = await associateCollaborators(supervisorAgentId);
    
    // Step 3: Create supervisor alias (optional)
    const supervisorAliasId = await createSupervisorAlias(supervisorAgentId);
    
    // Summary
    console.log('\n📊 Setup Summary:');
    console.log('==================');
    
    const successfulAssociations = associationResults.filter(r => r.success).length;
    const totalAssociations = associationResults.length;
    
    console.log(`✅ Supervisor Agent Created: ${supervisorAgentId}`);
    console.log(`🤝 Collaborator Associations: ${successfulAssociations}/${totalAssociations} successful`);
    
    if (supervisorAliasId) {
      console.log(`🏷️  Supervisor Alias: ${supervisorAliasId}`);
    }
    
    if (successfulAssociations === totalAssociations) {
      console.log('\n🎉 Multi-Agent Setup Complete!');
      console.log('\n🚀 Your multi-agent system is ready:');
      console.log(`   Supervisor Agent ID: ${supervisorAgentId}`);
      console.log(`   Collaborator Agents: ${Object.keys(COLLABORATOR_AGENTS).join(', ')}`);
      
      console.log('\n🧪 Testing Instructions:');
      console.log('1. Go to AWS Bedrock Console → Agents');
      console.log(`2. Find and select agent: ${supervisorAgentId}`);
      console.log('3. Click "Test" to open the test interface');
      console.log('4. Try this test prompt:');
      console.log('   "Analyze the market opportunity for an AI-powered code review tool. Include business strategy, product requirements, and implementation coaching."');
      console.log('\n   The supervisor should coordinate with all three collaborator agents to provide a comprehensive response.');
      
    } else {
      console.log('\n⚠️  Setup completed with some issues:');
      associationResults.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.agentId}: ${result.error}`);
      });
    }
    
    return {
      supervisorAgentId,
      associationResults,
      supervisorAliasId,
      success: successfulAssociations === totalAssociations
    };
    
  } catch (error) {
    console.error(`💥 Setup failed: ${error.message}`);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  simpleMultiAgentSetup().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { simpleMultiAgentSetup };