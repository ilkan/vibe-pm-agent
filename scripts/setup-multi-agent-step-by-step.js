#!/usr/bin/env node

/**
 * Step-by-Step Multi-Agent Setup
 * Handles the complex dependencies and requirements for multi-agent collaboration
 */

const { 
  BedrockAgentClient, 
  UpdateAgentCommand,
  PrepareAgentCommand,
  CreateAgentAliasCommand,
  ListAgentAliasesCommand,
  ListAgentVersionsCommand,
  AssociateAgentCollaboratorCommand,
  GetAgentCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AGENT_CONFIGS, AWS_REGION, AWS_ACCOUNT_ID } = require('./update-bedrock-agents');

async function waitForAgentReady(agentId, maxWaitTime = 300000) { // 5 minutes max
  const client = new BedrockAgentClient({ region: AWS_REGION });
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const command = new GetAgentCommand({ agentId });
      const result = await client.send(command);
      
      if (result.agent.agentStatus === 'PREPARED') {
        return true;
      }
      
      console.log(`   Waiting for agent ${agentId} to be ready... (${result.agent.agentStatus})`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    } catch (error) {
      console.error(`   Error checking agent status: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  return false;
}

async function getLatestPreparedVersion(agentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    const command = new ListAgentVersionsCommand({ agentId });
    const result = await client.send(command);
    
    // Find the highest numbered version that's prepared
    const preparedVersions = result.agentVersionSummaries
      ?.filter(v => v.agentStatus === 'PREPARED' && v.agentVersion !== 'DRAFT')
      ?.sort((a, b) => parseInt(b.agentVersion) - parseInt(a.agentVersion));
    
    return preparedVersions?.[0]?.agentVersion || null;
  } catch (error) {
    console.error(`   Failed to get versions for ${agentId}: ${error.message}`);
    return null;
  }
}

async function createCollaborationAlias(agentId, agentName) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`   Creating collaboration alias for ${agentId}...`);
    
    // Get the latest prepared version
    const version = await getLatestPreparedVersion(agentId);
    if (!version) {
      throw new Error(`No prepared version found for agent ${agentId}`);
    }
    
    console.log(`   Using agent version: ${version}`);
    
    // Check if collaboration alias already exists
    const listCommand = new ListAgentAliasesCommand({ agentId });
    const listResult = await client.send(listCommand);
    
    const existingAlias = listResult.agentAliasSummaries?.find(
      alias => alias.agentAliasName?.includes('Collaboration') && 
               alias.agentAliasStatus === 'PREPARED'
    );
    
    if (existingAlias) {
      console.log(`   ✅ Found existing collaboration alias: ${existingAlias.agentAliasId}`);
      return existingAlias.agentAliasId;
    }
    
    // Create new collaboration alias
    const aliasName = `${agentName.replace(/[^a-zA-Z0-9]/g, '')}-Collaboration-${Date.now().toString().slice(-6)}`;
    
    const createCommand = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: `Collaboration alias for ${agentName}`,
      routingConfiguration: [
        {
          agentVersion: version
        }
      ]
    });
    
    const result = await client.send(createCommand);
    console.log(`   ✅ Created collaboration alias: ${result.agentAlias.agentAliasId}`);
    
    return result.agentAlias.agentAliasId;
  } catch (error) {
    console.error(`   ❌ Failed to create collaboration alias for ${agentId}: ${error.message}`);
    throw error;
  }
}

async function setupMultiAgentCollaboration() {
  console.log('🚀 Setting Up Multi-Agent Collaboration (Step-by-Step)');
  console.log('======================================================\n');
  
  const client = new BedrockAgentClient({ region: AWS_REGION });
  const results = {
    agentUpdates: [],
    aliasCreation: [],
    supervisorSetup: null,
    collaboratorAssociation: []
  };
  
  try {
    // Step 1: Update all agents (without supervisor configuration)
    console.log('📝 Step 1: Updating Individual Agents...\n');
    
    for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
      try {
        console.log(`Updating ${agentId} (${config.agentName})...`);
        
        // Update without supervisor configuration
        const updateCommand = new UpdateAgentCommand({
          agentId,
          agentName: config.agentName,
          description: config.description,
          instruction: config.instruction,
          foundationModel: config.foundationModel,
          agentResourceRoleArn: `arn:aws:iam::${AWS_ACCOUNT_ID}:role/AmazonBedrockExecutionRoleForAgents_vibe-pm`
        });
        
        await client.send(updateCommand);
        console.log(`   ✅ Updated successfully`);
        
        results.agentUpdates.push({ agentId, success: true });
      } catch (error) {
        console.error(`   ❌ Failed to update ${agentId}: ${error.message}`);
        results.agentUpdates.push({ agentId, success: false, error: error.message });
      }
    }
    
    // Step 2: Prepare all agents and wait for them to be ready
    console.log('\n📝 Step 2: Preparing Agents...\n');
    
    for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
      try {
        console.log(`Preparing ${agentId} (${config.agentName})...`);
        
        const prepareCommand = new PrepareAgentCommand({ agentId });
        await client.send(prepareCommand);
        
        console.log(`   Waiting for agent to be ready...`);
        const isReady = await waitForAgentReady(agentId);
        
        if (isReady) {
          console.log(`   ✅ Agent prepared successfully`);
        } else {
          console.log(`   ⚠️  Agent preparation timed out, but continuing...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to prepare ${agentId}: ${error.message}`);
      }
    }
    
    // Step 3: Create collaboration aliases for all agents
    console.log('\n📝 Step 3: Creating Collaboration Aliases...\n');
    
    const aliasMap = {};
    
    for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
      try {
        const aliasId = await createCollaborationAlias(agentId, config.agentName);
        aliasMap[agentId] = aliasId;
        results.aliasCreation.push({ agentId, success: true, aliasId });
      } catch (error) {
        console.error(`Failed to create alias for ${agentId}: ${error.message}`);
        results.aliasCreation.push({ agentId, success: false, error: error.message });
      }
    }
    
    // Step 4: Configure supervisor agent
    console.log('\n📝 Step 4: Configuring Supervisor Agent...\n');
    
    const supervisorAgentId = 'ULX1RJGKCR';
    const supervisorConfig = AGENT_CONFIGS[supervisorAgentId];
    
    try {
      console.log(`Configuring supervisor agent ${supervisorAgentId}...`);
      
      const supervisorInstruction = `You are a Multi-Agent Supervisor enhanced with AWS Bedrock's advanced orchestration capabilities for coordinating complex business analysis workflows.

Your primary role is to orchestrate collaboration between specialized agents to provide comprehensive business solutions that combine strategic analysis, product development, executive communications, and coaching insights.

## Available Collaborator Agents:
1. **Business-Strategy-Specialist**: Market opportunity analysis, competitive landscape, strategic alignment, and market timing validation
2. **Product-Development-Specialist**: Requirements generation, design options, technical specifications, and implementation planning  
3. **Case-Study-Coaching-Specialist**: Case study analysis, strategic scenario coaching, and business problem-solving guidance

## Orchestration Approach:
- **Sequential Workflows**: Route tasks through agents in logical sequence (Strategy → Product → Communications → Coaching)
- **Parallel Processing**: Engage multiple agents simultaneously for comprehensive analysis
- **Iterative Refinement**: Coordinate multiple rounds of analysis and refinement
- **Context Sharing**: Ensure agents build on each other's insights and maintain context

Coordinate agents to provide holistic business solutions that leverage the full spectrum of strategic, technical, and communication expertise.`;
      
      const updateCommand = new UpdateAgentCommand({
        agentId: supervisorAgentId,
        agentName: 'Multi-Agent-Supervisor',
        description: 'Supervisor agent for orchestrating multi-agent collaboration across business strategy, product development, and case study coaching',
        instruction: supervisorInstruction,
        foundationModel: supervisorConfig.foundationModel,
        agentResourceRoleArn: `arn:aws:iam::${AWS_ACCOUNT_ID}:role/AmazonBedrockExecutionRoleForAgents_vibe-pm`,
        agentCollaboration: 'SUPERVISOR'
      });
      
      await client.send(updateCommand);
      console.log(`   ✅ Supervisor configured successfully`);
      
      results.supervisorSetup = { success: true };
    } catch (error) {
      console.error(`   ❌ Failed to configure supervisor: ${error.message}`);
      results.supervisorSetup = { success: false, error: error.message };
    }
    
    // Step 5: Associate collaborator agents
    console.log('\n📝 Step 5: Associating Collaborator Agents...\n');
    
    const collaboratorAgents = Object.entries(AGENT_CONFIGS).filter(([id]) => id !== supervisorAgentId);
    
    for (const [agentId, config] of collaboratorAgents) {
      try {
        if (!aliasMap[agentId]) {
          console.log(`   ⚠️  Skipping ${agentId} - no collaboration alias available`);
          continue;
        }
        
        console.log(`   Associating ${agentId} (${config.collaboratorConfig.collaboratorName})...`);
        
        const aliasArn = `arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:agent-alias/${agentId}/${aliasMap[agentId]}`;
        
        const associateCommand = new AssociateAgentCollaboratorCommand({
          agentId: supervisorAgentId,
          agentVersion: 'DRAFT',
          agentDescriptor: {
            aliasArn: aliasArn
          },
          collaboratorName: config.collaboratorConfig.collaboratorName,
          collaborationInstruction: config.collaboratorConfig.collaborationInstruction,
          relayConversationHistory: config.collaboratorConfig.relayConversationHistory
        });
        
        await client.send(associateCommand);
        console.log(`   ✅ Associated successfully`);
        
        results.collaboratorAssociation.push({ agentId, success: true });
      } catch (error) {
        console.error(`   ❌ Failed to associate ${agentId}: ${error.message}`);
        results.collaboratorAssociation.push({ agentId, success: false, error: error.message });
      }
    }
    
    // Step 6: Final preparation of supervisor
    console.log('\n📝 Step 6: Final Supervisor Preparation...\n');
    
    try {
      console.log(`Preparing supervisor agent for deployment...`);
      const prepareCommand = new PrepareAgentCommand({ agentId: supervisorAgentId });
      await client.send(prepareCommand);
      
      console.log(`   Waiting for supervisor to be ready...`);
      const isReady = await waitForAgentReady(supervisorAgentId);
      
      if (isReady) {
        console.log(`   ✅ Supervisor prepared successfully`);
      } else {
        console.log(`   ⚠️  Supervisor preparation timed out, but may still work`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to prepare supervisor: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`💥 Fatal error during setup: ${error.message}`);
    throw error;
  }
  
  // Final Summary
  console.log('\n📊 Multi-Agent Setup Summary:');
  console.log('==============================');
  
  const agentUpdateSuccess = results.agentUpdates.filter(r => r.success).length;
  const aliasCreationSuccess = results.aliasCreation.filter(r => r.success).length;
  const collaboratorAssociationSuccess = results.collaboratorAssociation.filter(r => r.success).length;
  
  console.log(`🔧 Agent Updates: ${agentUpdateSuccess}/${results.agentUpdates.length} successful`);
  console.log(`🏷️  Alias Creation: ${aliasCreationSuccess}/${results.aliasCreation.length} successful`);
  console.log(`🎯 Supervisor Setup: ${results.supervisorSetup?.success ? 'Success' : 'Failed'}`);
  console.log(`🤝 Collaborator Associations: ${collaboratorAssociationSuccess}/${results.collaboratorAssociation.length} successful`);
  
  const totalOperations = results.agentUpdates.length + results.aliasCreation.length + 1 + results.collaboratorAssociation.length;
  const totalSuccess = agentUpdateSuccess + aliasCreationSuccess + (results.supervisorSetup?.success ? 1 : 0) + collaboratorAssociationSuccess;
  
  console.log(`\n🎯 Overall Success Rate: ${totalSuccess}/${totalOperations} operations completed successfully`);
  
  if (totalSuccess === totalOperations) {
    console.log('\n🎉 Multi-Agent Collaboration Setup Complete!');
    console.log('\n🚀 Your agents are now ready for collaboration:');
    console.log(`   Supervisor Agent: ${supervisorAgentId} (Multi-Agent-Supervisor)`);
    console.log(`   Collaborator Agents: ${Object.keys(AGENT_CONFIGS).filter(id => id !== supervisorAgentId).join(', ')}`);
    console.log('\n🧪 Next Steps:');
    console.log('   1. Test individual agents in AWS Console');
    console.log('   2. Test multi-agent workflows through the supervisor');
    console.log('   3. Monitor performance and refine collaboration instructions');
  } else {
    console.log('\n⚠️  Setup completed with some issues. Check the details above.');
    console.log('   The system may still work partially - test individual components.');
  }
  
  return results;
}

// Run the setup
if (require.main === module) {
  setupMultiAgentCollaboration().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupMultiAgentCollaboration };