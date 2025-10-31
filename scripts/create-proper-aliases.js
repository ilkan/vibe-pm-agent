#!/usr/bin/env node

/**
 * Create Proper Unique Aliases for Multi-Agent Collaboration
 * This script creates numbered versions and unique aliases for each agent
 */

const { 
  BedrockAgentClient, 
  PrepareAgentCommand,
  CreateAgentAliasCommand,
  ListAgentAliasesCommand,
  AssociateAgentCollaboratorCommand,
  GetAgentCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AWS_REGION, AWS_ACCOUNT_ID } = require('./update-bedrock-agents');

const SUPERVISOR_AGENT_ID = 'NBHVX22U0X';

const COLLABORATOR_AGENTS = {
  'IBQRX8MZJJ': {
    name: 'Business-Strategy-Specialist',
    agentName: 'Business-Strategy-Agent',
    instruction: 'Handle all business strategy analysis, market opportunity assessment, competitive landscape analysis, strategic alignment evaluation, and market timing validation. Provide comprehensive business insights with confidence scoring and risk assessment.'
  },
  'CEW45LTT2P': {
    name: 'Product-Development-Specialist',
    agentName: 'Product-Development-Agent', 
    instruction: 'Handle all product development tasks including requirements generation, design options analysis, technical specifications, implementation planning, and task planning. Focus on technical feasibility while considering business constraints and strategic alignment.'
  },
  'PDZPQTNLYH': {
    name: 'Case-Study-Coaching-Specialist',
    agentName: 'Case-Study-Coaching-Agent',
    instruction: 'Handle all case study analysis, strategic scenario coaching, business problem-solving guidance, and learning facilitation. Provide coaching insights that help users understand and apply complex business concepts and strategic frameworks.'
  }
};

async function waitForAgentReady(agentId, maxWaitTime = 120000) { // 2 minutes max
  const client = new BedrockAgentClient({ region: AWS_REGION });
  const startTime = Date.now();
  
  console.log(`   Waiting for agent ${agentId} to be ready...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const command = new GetAgentCommand({ agentId });
      const result = await client.send(command);
      
      if (result.agent.agentStatus === 'PREPARED') {
        console.log(`   ✅ Agent ${agentId} is ready`);
        return true;
      }
      
      console.log(`   ⏳ Agent ${agentId} status: ${result.agent.agentStatus}`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    } catch (error) {
      console.error(`   ❌ Error checking agent status: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log(`   ⚠️  Timeout waiting for agent ${agentId} to be ready`);
  return false;
}

async function createNumberedVersionAndAlias(agentId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`\n🔧 Creating numbered version and unique alias for ${agentId}...`);
    
    // Step 1: Check if we already have a unique alias
    const listAliasesCommand = new ListAgentAliasesCommand({ agentId });
    const aliasesResult = await client.send(listAliasesCommand);
    
    const uniqueAlias = aliasesResult.agentAliasSummaries?.find(
      alias => alias.agentAliasId !== 'TSTALIASID' && 
               alias.agentAliasStatus === 'PREPARED' &&
               alias.agentAliasName?.includes('Collaboration')
    );
    
    if (uniqueAlias) {
      console.log(`   ✅ Found existing unique alias: ${uniqueAlias.agentAliasId}`);
      return uniqueAlias.agentAliasId;
    }
    
    // Step 2: Prepare the agent to create a numbered version
    console.log(`   📦 Preparing agent to create numbered version...`);
    const prepareCommand = new PrepareAgentCommand({ agentId });
    const prepareResult = await client.send(prepareCommand);
    
    console.log(`   📦 Preparation initiated, new version will be: ${prepareResult.agentVersion}`);
    
    // Step 3: Wait for the agent to be ready
    const isReady = await waitForAgentReady(agentId);
    if (!isReady) {
      throw new Error(`Agent ${agentId} did not become ready in time`);
    }
    
    // Step 4: Create unique alias pointing to the new numbered version
    const aliasName = `${config.agentName.replace(/[^a-zA-Z0-9]/g, '')}-Collab-${Date.now().toString().slice(-6)}`;
    
    console.log(`   🏷️  Creating unique alias: ${aliasName} → version ${prepareResult.agentVersion}`);
    
    const createAliasCommand = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: `Unique collaboration alias for ${config.agentName}`,
      routingConfiguration: [
        {
          agentVersion: prepareResult.agentVersion
        }
      ]
    });
    
    const aliasResult = await client.send(createAliasCommand);
    console.log(`   ✅ Created unique alias: ${aliasResult.agentAlias.agentAliasId}`);
    
    return aliasResult.agentAlias.agentAliasId;
    
  } catch (error) {
    console.error(`   ❌ Failed to create version/alias for ${agentId}: ${error.message}`);
    throw error;
  }
}

async function associateWithSupervisor(agentId, aliasId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`   🤝 Associating ${agentId} with supervisor...`);
    
    const aliasArn = `arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:agent-alias/${agentId}/${aliasId}`;
    
    const associateCommand = new AssociateAgentCollaboratorCommand({
      agentId: SUPERVISOR_AGENT_ID,
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
    
    return { success: true };
  } catch (error) {
    console.error(`   ❌ Association failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createProperAliases() {
  console.log('🚀 Creating Proper Unique Aliases for Multi-Agent Collaboration');
  console.log('================================================================\n');
  
  const results = {
    aliasCreation: [],
    associations: []
  };
  
  try {
    // Step 1: Create numbered versions and unique aliases for each collaborator
    console.log('📝 Step 1: Creating Numbered Versions and Unique Aliases...');
    
    const aliasMap = {};
    
    for (const [agentId, config] of Object.entries(COLLABORATOR_AGENTS)) {
      try {
        const aliasId = await createNumberedVersionAndAlias(agentId, config);
        aliasMap[agentId] = aliasId;
        results.aliasCreation.push({ agentId, success: true, aliasId });
      } catch (error) {
        console.error(`Failed to create alias for ${agentId}: ${error.message}`);
        results.aliasCreation.push({ agentId, success: false, error: error.message });
      }
    }
    
    // Step 2: Associate all collaborators with supervisor
    console.log('\n📝 Step 2: Associating Collaborators with Supervisor...');
    
    for (const [agentId, config] of Object.entries(COLLABORATOR_AGENTS)) {
      if (aliasMap[agentId]) {
        const result = await associateWithSupervisor(agentId, aliasMap[agentId], config);
        results.associations.push({ agentId, ...result });
      } else {
        console.log(`   ⏭️  Skipping ${agentId} - no unique alias available`);
        results.associations.push({ agentId, success: false, error: 'No unique alias available' });
      }
    }
    
    // Step 3: Prepare supervisor for testing
    console.log('\n📝 Step 3: Preparing Supervisor for Testing...');
    
    try {
      const client = new BedrockAgentClient({ region: AWS_REGION });
      console.log(`   🎯 Preparing supervisor agent ${SUPERVISOR_AGENT_ID}...`);
      
      const prepareCommand = new PrepareAgentCommand({ agentId: SUPERVISOR_AGENT_ID });
      await client.send(prepareCommand);
      
      console.log(`   ✅ Supervisor preparation initiated`);
      
      // Wait for supervisor to be ready
      const isReady = await waitForAgentReady(SUPERVISOR_AGENT_ID);
      if (isReady) {
        console.log(`   ✅ Supervisor is ready for testing`);
      } else {
        console.log(`   ⚠️  Supervisor preparation timed out, but may still work`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to prepare supervisor: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`💥 Process failed: ${error.message}`);
    throw error;
  }
  
  // Final Summary
  console.log('\n📊 Final Summary:');
  console.log('==================');
  
  const aliasSuccessCount = results.aliasCreation.filter(r => r.success).length;
  const associationSuccessCount = results.associations.filter(r => r.success).length;
  
  console.log(`🏷️  Unique Aliases Created: ${aliasSuccessCount}/${results.aliasCreation.length}`);
  console.log(`🤝 Collaborator Associations: ${associationSuccessCount}/${results.associations.length}`);
  
  console.log('\n📋 Detailed Results:');
  
  console.log('\n🏷️  Alias Creation:');
  results.aliasCreation.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const message = result.success ? `Unique Alias: ${result.aliasId}` : `Error: ${result.error}`;
    console.log(`${status} ${result.agentId}: ${message}`);
  });
  
  console.log('\n🤝 Collaborator Associations:');
  results.associations.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const message = result.success ? 'Associated successfully' : `Error: ${result.error}`;
    console.log(`${status} ${result.agentId}: ${message}`);
  });
  
  if (aliasSuccessCount === results.aliasCreation.length && 
      associationSuccessCount === results.associations.length) {
    
    console.log('\n🎉 Multi-Agent Collaboration Setup Complete!');
    console.log('\n🧪 Testing Instructions:');
    console.log('1. Go to AWS Bedrock Console → Agents');
    console.log(`2. Find and select supervisor agent: ${SUPERVISOR_AGENT_ID} (Supervisor-Agent)`);
    console.log('3. Click "Test" to open the test interface');
    console.log('4. Try this comprehensive test prompt:');
    console.log('\n📝 Test Prompt:');
    console.log('   "I need a comprehensive analysis for launching an AI-powered code review tool for enterprise development teams.');
    console.log('   Please coordinate with your specialist agents to provide:');
    console.log('   1. Market opportunity and competitive analysis');
    console.log('   2. Technical requirements and product specifications');
    console.log('   3. Implementation strategy and coaching guidance');
    console.log('   Synthesize all insights into an executive summary with actionable recommendations."');
    
    console.log('\n🎯 Expected Multi-Agent Behavior:');
    console.log('   - Supervisor routes tasks to Business Strategy, Product Development, and Case Study specialists');
    console.log('   - Each specialist provides domain-specific insights');
    console.log('   - Supervisor synthesizes responses into comprehensive analysis');
    console.log('   - You should see evidence of agent-to-agent communication in the response');
    
  } else {
    console.log('\n⚠️  Setup completed with some issues.');
    console.log('   Check the detailed results above and resolve any failures.');
    console.log('   The system may still work partially with successfully configured agents.');
  }
  
  return results;
}

// Run the creation process
if (require.main === module) {
  createProperAliases().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createProperAliases };