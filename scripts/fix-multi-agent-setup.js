#!/usr/bin/env node

/**
 * Fix Multi-Agent Setup
 * Creates aliases for all agents and associates them with the supervisor
 */

const { 
  BedrockAgentClient, 
  CreateAgentAliasCommand,
  ListAgentAliasesCommand,
  AssociateAgentCollaboratorCommand,
  PrepareAgentCommand,
  GetAgentCommand,
  ListAgentVersionsCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AWS_REGION, AWS_ACCOUNT_ID } = require('./update-bedrock-agents');

// Your supervisor agent ID from the console
const SUPERVISOR_AGENT_ID = 'NBHVX22U0X';

// Collaborator agents that need aliases and association
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

async function getAgentLatestVersion(agentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    // First try to get agent versions
    const listVersionsCommand = new ListAgentVersionsCommand({ agentId });
    const versionsResult = await client.send(listVersionsCommand);
    
    // Find the latest prepared version (not DRAFT)
    const preparedVersions = versionsResult.agentVersionSummaries
      ?.filter(v => v.agentStatus === 'PREPARED' && v.agentVersion !== 'DRAFT')
      ?.sort((a, b) => parseInt(b.agentVersion) - parseInt(a.agentVersion));
    
    if (preparedVersions && preparedVersions.length > 0) {
      console.log(`   Found prepared version: ${preparedVersions[0].agentVersion}`);
      return preparedVersions[0].agentVersion;
    }
    
    // If no prepared versions, prepare the agent first
    console.log(`   No prepared versions found, preparing agent...`);
    const prepareCommand = new PrepareAgentCommand({ agentId });
    const prepareResult = await client.send(prepareCommand);
    
    // Wait for preparation to complete
    console.log(`   Waiting for agent preparation...`);
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    // Check again for versions
    const newVersionsResult = await client.send(listVersionsCommand);
    const newPreparedVersions = newVersionsResult.agentVersionSummaries
      ?.filter(v => v.agentStatus === 'PREPARED' && v.agentVersion !== 'DRAFT')
      ?.sort((a, b) => parseInt(b.agentVersion) - parseInt(a.agentVersion));
    
    if (newPreparedVersions && newPreparedVersions.length > 0) {
      console.log(`   Agent prepared, version: ${newPreparedVersions[0].agentVersion}`);
      return newPreparedVersions[0].agentVersion;
    }
    
    // Fallback to version "1"
    console.log(`   Using fallback version: 1`);
    return '1';
    
  } catch (error) {
    console.error(`   Error getting version for ${agentId}: ${error.message}`);
    return '1'; // Fallback
  }
}

async function createAliasForAgent(agentId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`\n🏷️  Creating alias for ${agentId} (${config.agentName})...`);
    
    // Check if alias already exists
    const listCommand = new ListAgentAliasesCommand({ agentId });
    const listResult = await client.send(listCommand);
    
    // Look for existing collaboration alias
    const existingAlias = listResult.agentAliasSummaries?.find(
      alias => alias.agentAliasName?.includes('Collaboration') && 
               alias.agentAliasStatus === 'PREPARED'
    );
    
    if (existingAlias) {
      console.log(`   ✅ Found existing alias: ${existingAlias.agentAliasId}`);
      return existingAlias.agentAliasId;
    }
    
    // Get the latest agent version
    const agentVersion = await getAgentLatestVersion(agentId);
    
    // Create new alias
    const aliasName = `${config.agentName.replace(/[^a-zA-Z0-9]/g, '')}-Collaboration-${Date.now().toString().slice(-6)}`;
    
    console.log(`   Creating alias: ${aliasName} (version ${agentVersion})`);
    
    const createCommand = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: `Collaboration alias for ${config.agentName}`,
      routingConfiguration: [
        {
          agentVersion: agentVersion
        }
      ]
    });
    
    const result = await client.send(createCommand);
    console.log(`   ✅ Created alias: ${result.agentAlias.agentAliasId}`);
    
    return result.agentAlias.agentAliasId;
    
  } catch (error) {
    console.error(`   ❌ Failed to create alias for ${agentId}: ${error.message}`);
    
    // Try to find any existing prepared alias as fallback
    try {
      const listCommand = new ListAgentAliasesCommand({ agentId });
      const listResult = await client.send(listCommand);
      
      const fallbackAlias = listResult.agentAliasSummaries?.find(
        alias => alias.agentAliasStatus === 'PREPARED'
      );
      
      if (fallbackAlias) {
        console.log(`   ⚠️  Using fallback alias: ${fallbackAlias.agentAliasId}`);
        return fallbackAlias.agentAliasId;
      }
    } catch (fallbackError) {
      console.error(`   ❌ No fallback alias available: ${fallbackError.message}`);
    }
    
    throw error;
  }
}

async function associateCollaboratorWithSupervisor(agentId, aliasId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`   Associating ${agentId} with supervisor...`);
    
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
    console.error(`   ❌ Failed to associate: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function fixMultiAgentSetup() {
  console.log('🔧 Fixing Multi-Agent Setup');
  console.log('============================\n');
  
  try {
    // Step 1: Verify supervisor agent
    const client = new BedrockAgentClient({ region: AWS_REGION });
    console.log(`🎯 Checking supervisor agent ${SUPERVISOR_AGENT_ID}...`);
    
    const getAgentCommand = new GetAgentCommand({ agentId: SUPERVISOR_AGENT_ID });
    const supervisorResult = await client.send(getAgentCommand);
    
    console.log(`   Name: ${supervisorResult.agent.agentName}`);
    console.log(`   Status: ${supervisorResult.agent.agentStatus}`);
    console.log(`   Collaboration: ${supervisorResult.agent.agentCollaboration || 'Not set'}`);
    
    // Step 2: Create aliases for all collaborator agents
    console.log('\n📝 Step 1: Creating Aliases for Collaborator Agents...');
    
    const aliasResults = {};
    const aliasCreationResults = [];
    
    for (const [agentId, config] of Object.entries(COLLABORATOR_AGENTS)) {
      try {
        const aliasId = await createAliasForAgent(agentId, config);
        aliasResults[agentId] = aliasId;
        aliasCreationResults.push({ agentId, success: true, aliasId });
      } catch (error) {
        console.error(`Failed to create alias for ${agentId}: ${error.message}`);
        aliasCreationResults.push({ agentId, success: false, error: error.message });
      }
    }
    
    // Step 3: Associate collaborators with supervisor
    console.log('\n📝 Step 2: Associating Collaborators with Supervisor...');
    
    const associationResults = [];
    
    for (const [agentId, config] of Object.entries(COLLABORATOR_AGENTS)) {
      if (aliasResults[agentId]) {
        const result = await associateCollaboratorWithSupervisor(
          agentId, 
          aliasResults[agentId], 
          config
        );
        associationResults.push({ agentId, ...result });
      } else {
        console.log(`   ⏭️  Skipping ${agentId} - no alias available`);
        associationResults.push({ agentId, success: false, error: 'No alias available' });
      }
    }
    
    // Step 4: Prepare supervisor for testing
    console.log('\n📝 Step 3: Preparing Supervisor for Testing...');
    
    try {
      console.log(`   Preparing supervisor agent...`);
      const prepareCommand = new PrepareAgentCommand({ agentId: SUPERVISOR_AGENT_ID });
      await client.send(prepareCommand);
      console.log(`   ✅ Supervisor prepared successfully`);
    } catch (error) {
      console.error(`   ❌ Failed to prepare supervisor: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 Fix Summary:');
    console.log('================');
    
    const aliasSuccessCount = aliasCreationResults.filter(r => r.success).length;
    const associationSuccessCount = associationResults.filter(r => r.success).length;
    
    console.log(`🏷️  Alias Creation: ${aliasSuccessCount}/${aliasCreationResults.length} successful`);
    console.log(`🤝 Collaborator Association: ${associationSuccessCount}/${associationResults.length} successful`);
    
    console.log('\n📋 Detailed Results:');
    
    console.log('\n🏷️  Alias Creation:');
    aliasCreationResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const message = result.success ? `Alias: ${result.aliasId}` : `Error: ${result.error}`;
      console.log(`${status} ${result.agentId}: ${message}`);
    });
    
    console.log('\n🤝 Collaborator Association:');
    associationResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const message = result.success ? 'Associated successfully' : `Error: ${result.error}`;
      console.log(`${status} ${result.agentId}: ${message}`);
    });
    
    if (aliasSuccessCount === aliasCreationResults.length && 
        associationSuccessCount === associationResults.length) {
      
      console.log('\n🎉 Multi-Agent Setup Fixed Successfully!');
      console.log('\n🧪 Testing Instructions:');
      console.log('1. Go to AWS Bedrock Console → Agents');
      console.log(`2. Find and select supervisor agent: ${SUPERVISOR_AGENT_ID}`);
      console.log('3. Click "Test" to open the test interface');
      console.log('4. Try this test prompt:');
      console.log('\n📝 Test Prompt:');
      console.log('   "I need a comprehensive analysis for launching an AI-powered code review tool.');
      console.log('   Please coordinate with your specialist agents to provide:');
      console.log('   1. Market opportunity and competitive analysis');
      console.log('   2. Technical requirements and product specifications');
      console.log('   3. Implementation strategy and coaching guidance');
      console.log('   Synthesize all insights into an executive summary."');
      
      console.log('\n🎯 Expected Behavior:');
      console.log('   - Supervisor should route tasks to Business Strategy, Product Development, and Case Study specialists');
      console.log('   - Each specialist should provide domain-specific insights');
      console.log('   - Supervisor should synthesize responses into a comprehensive analysis');
      
    } else {
      console.log('\n⚠️  Setup completed with some issues.');
      console.log('   Check the detailed results above and resolve any failures.');
      console.log('   The system may still work partially with successfully configured agents.');
    }
    
    return {
      supervisorId: SUPERVISOR_AGENT_ID,
      aliasResults: aliasCreationResults,
      associationResults: associationResults,
      success: aliasSuccessCount === aliasCreationResults.length && 
               associationSuccessCount === associationResults.length
    };
    
  } catch (error) {
    console.error(`💥 Fix failed: ${error.message}`);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixMultiAgentSetup().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fixMultiAgentSetup };