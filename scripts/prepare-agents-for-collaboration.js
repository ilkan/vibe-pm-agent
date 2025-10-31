#!/usr/bin/env node

/**
 * Prepare Agents for Multi-Agent Collaboration
 * This script prepares agents and creates proper aliases for collaboration
 */

const { 
  BedrockAgentClient, 
  PrepareAgentCommand,
  CreateAgentAliasCommand,
  ListAgentAliasesCommand,
  GetAgentCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AGENT_CONFIGS, AWS_REGION } = require('./update-bedrock-agents');

async function prepareAgentForCollaboration(agentId, agentName) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`\n🔧 Preparing ${agentId} (${agentName}) for collaboration...`);
    
    // Step 1: Get current agent status
    const getAgentCommand = new GetAgentCommand({ agentId });
    const agentResult = await client.send(getAgentCommand);
    
    console.log(`   Current status: ${agentResult.agent.agentStatus}`);
    
    // Step 2: Prepare the agent (this creates a new version)
    console.log(`   Preparing agent...`);
    const prepareCommand = new PrepareAgentCommand({ agentId });
    const prepareResult = await client.send(prepareCommand);
    
    console.log(`   ✅ Agent prepared successfully`);
    console.log(`   New version: ${prepareResult.agentVersion}`);
    console.log(`   Status: ${prepareResult.agentStatus}`);
    
    // Step 3: Create a collaboration alias pointing to the prepared version
    const aliasName = `${agentName.replace(/[^a-zA-Z0-9]/g, '')}-Collaboration`;
    
    console.log(`   Creating collaboration alias: ${aliasName}...`);
    
    const createAliasCommand = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: `Collaboration alias for ${agentName}`,
      routingConfiguration: [
        {
          agentVersion: prepareResult.agentVersion
        }
      ]
    });
    
    const aliasResult = await client.send(createAliasCommand);
    
    console.log(`   ✅ Collaboration alias created: ${aliasResult.agentAlias.agentAliasId}`);
    
    return {
      agentId,
      agentName,
      success: true,
      agentVersion: prepareResult.agentVersion,
      aliasId: aliasResult.agentAlias.agentAliasId,
      aliasName: aliasName
    };
    
  } catch (error) {
    console.error(`   ❌ Failed to prepare ${agentId}:`, error.message);
    
    // Try to find existing prepared alias
    try {
      console.log(`   Checking for existing collaboration aliases...`);
      const listCommand = new ListAgentAliasesCommand({ agentId });
      const listResult = await client.send(listCommand);
      
      const collaborationAlias = listResult.agentAliasSummaries?.find(
        alias => alias.agentAliasName?.includes('Collaboration') && 
                 alias.agentAliasStatus === 'PREPARED'
      );
      
      if (collaborationAlias) {
        console.log(`   ✅ Found existing collaboration alias: ${collaborationAlias.agentAliasId}`);
        return {
          agentId,
          agentName,
          success: true,
          aliasId: collaborationAlias.agentAliasId,
          aliasName: collaborationAlias.agentAliasName,
          existing: true
        };
      }
    } catch (listError) {
      console.error(`   ❌ Failed to check existing aliases:`, listError.message);
    }
    
    return {
      agentId,
      agentName,
      success: false,
      error: error.message
    };
  }
}

async function prepareAllAgentsForCollaboration() {
  console.log('🚀 Preparing All Agents for Multi-Agent Collaboration...');
  console.log('======================================================');
  
  const results = [];
  
  // Prepare all agents except supervisor first
  const collaboratorAgents = Object.entries(AGENT_CONFIGS).filter(([id]) => id !== 'ULX1RJGKCR');
  
  for (const [agentId, config] of collaboratorAgents) {
    const result = await prepareAgentForCollaboration(agentId, config.agentName);
    results.push(result);
  }
  
  // Prepare supervisor agent last (after collaborators are ready)
  const supervisorConfig = AGENT_CONFIGS['ULX1RJGKCR'];
  if (supervisorConfig) {
    console.log(`\n🎯 Preparing Supervisor Agent...`);
    const result = await prepareAgentForCollaboration('ULX1RJGKCR', supervisorConfig.agentName);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Preparation Summary:');
  console.log('=======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully prepared: ${successful.length}/${results.length} agents`);
  
  if (successful.length > 0) {
    console.log('\n🎯 Ready for Collaboration:');
    successful.forEach(result => {
      const status = result.existing ? '(existing)' : '(new)';
      console.log(`   ${result.agentId}: ${result.aliasId} ${status}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to prepare:');
    failed.forEach(result => {
      console.log(`   ${result.agentId}: ${result.error}`);
    });
  }
  
  if (successful.length === results.length) {
    console.log('\n🎉 All agents are now prepared for multi-agent collaboration!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Wait a few minutes for all aliases to be fully prepared');
    console.log('   2. Run: node scripts/update-bedrock-agents.js');
    console.log('   3. Test multi-agent workflows in AWS Console');
  } else {
    console.log('\n⚠️  Some agents failed to prepare. Please resolve the issues above.');
  }
  
  return { successful, failed, results };
}

// Run the preparation
if (require.main === module) {
  prepareAllAgentsForCollaboration().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { prepareAgentForCollaboration, prepareAllAgentsForCollaboration };