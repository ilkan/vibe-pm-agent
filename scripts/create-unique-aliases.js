#!/usr/bin/env node

/**
 * Create Unique Aliases for Multi-Agent Collaboration
 * Each agent needs a unique alias for collaboration
 */

const { 
  BedrockAgentClient, 
  CreateAgentAliasCommand,
  ListAgentAliasesCommand,
  PrepareAgentCommand,
  ListAgentVersionsCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AGENT_CONFIGS, AWS_REGION } = require('./update-bedrock-agents');

async function getAgentVersions(agentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    const command = new ListAgentVersionsCommand({ agentId });
    const result = await client.send(command);
    
    // Find a prepared version (not DRAFT)
    const preparedVersion = result.agentVersionSummaries?.find(
      version => version.agentStatus === 'PREPARED' && version.agentVersion !== 'DRAFT'
    );
    
    return preparedVersion?.agentVersion || '1'; // Default to version 1
  } catch (error) {
    console.log(`   ℹ️  Using default version 1 for agent ${agentId}`);
    return '1';
  }
}

async function createUniqueAlias(agentId, agentName, skipSupervisor = false) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`Creating unique alias for ${agentId} (${agentName})...`);
    
    // Check existing aliases first
    const listCommand = new ListAgentAliasesCommand({ agentId });
    const listResult = await client.send(listCommand);
    
    // Find a non-TSTALIASID alias that's already prepared
    const uniqueAlias = listResult.agentAliasSummaries?.find(
      alias => alias.agentAliasId !== 'TSTALIASID' && 
               alias.agentAliasStatus === 'PREPARED' &&
               alias.agentAliasName?.includes('Collaboration')
    );
    
    if (uniqueAlias) {
      console.log(`   ✅ Found existing collaboration alias: ${uniqueAlias.agentAliasId}`);
      return {
        agentId,
        aliasId: uniqueAlias.agentAliasId,
        aliasName: uniqueAlias.agentAliasName,
        success: true,
        existing: true
      };
    }
    
    // If supervisor agent, skip creation for now due to circular dependency
    if (skipSupervisor && agentId === 'ULX1RJGKCR') {
      console.log(`   ⏭️  Skipping supervisor agent alias creation (will use existing)`);
      
      // Use the TSTALIASID for supervisor since it can't collaborate with itself
      const supervisorAlias = listResult.agentAliasSummaries?.find(
        alias => alias.agentAliasStatus === 'PREPARED'
      );
      
      if (supervisorAlias) {
        return {
          agentId,
          aliasId: supervisorAlias.agentAliasId,
          aliasName: supervisorAlias.agentAliasName || 'Supervisor-Alias',
          success: true,
          existing: true,
          isSupervisor: true
        };
      }
    }
    
    // Get a prepared agent version
    const agentVersion = await getAgentVersions(agentId);
    
    // Create a unique alias name
    const aliasName = `${agentName.replace(/[^a-zA-Z0-9]/g, '-')}-Collab-${Date.now().toString().slice(-6)}`;
    const aliasDescription = `Collaboration alias for ${agentName} in multi-agent workflows`;
    
    const createAliasCommand = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: aliasDescription,
      routingConfiguration: [
        {
          agentVersion: agentVersion
        }
      ]
    });
    
    const result = await client.send(createAliasCommand);
    console.log(`   ✅ Created alias: ${result.agentAlias.agentAliasId} (${aliasName})`);
    
    return {
      agentId,
      aliasId: result.agentAlias.agentAliasId,
      aliasName: aliasName,
      success: true
    };
  } catch (error) {
    console.error(`   ❌ Failed to create alias for ${agentId}:`, error.message);
    
    // Try to find any existing prepared alias as fallback
    try {
      const listCommand = new ListAgentAliasesCommand({ agentId });
      const listResult = await client.send(listCommand);
      
      const fallbackAlias = listResult.agentAliasSummaries?.find(
        alias => alias.agentAliasStatus === 'PREPARED'
      );
      
      if (fallbackAlias) {
        console.log(`   ⚠️  Using fallback alias: ${fallbackAlias.agentAliasId}`);
        return {
          agentId,
          aliasId: fallbackAlias.agentAliasId,
          aliasName: fallbackAlias.agentAliasName || 'Fallback-Alias',
          success: true,
          existing: true,
          fallback: true
        };
      }
    } catch (listError) {
      console.error(`   ❌ Failed to find fallback alias:`, listError.message);
    }
    
    return {
      agentId,
      success: false,
      error: error.message
    };
  }
}

async function createAllUniqueAliases() {
  console.log('🔧 Creating Unique Aliases for Multi-Agent Collaboration...\n');
  
  const results = [];
  
  // First, handle non-supervisor agents
  for (const [agentId, config] of Object.entries(AGENT_CONFIGS)) {
    if (agentId !== 'ULX1RJGKCR') { // Skip supervisor for now
      const result = await createUniqueAlias(agentId, config.agentName, false);
      results.push(result);
    }
  }
  
  // Then handle supervisor agent
  const supervisorConfig = AGENT_CONFIGS['ULX1RJGKCR'];
  if (supervisorConfig) {
    const result = await createUniqueAlias('ULX1RJGKCR', supervisorConfig.agentName, true);
    results.push(result);
  }
  
  console.log('\n📊 Alias Creation Summary:');
  console.log('===========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created/found unique aliases: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 Available Unique Aliases:');
    successful.forEach(result => {
      const status = result.existing ? '(existing)' : '(new)';
      console.log(`   ${result.agentId}: ${result.aliasId} ${status}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to create aliases:');
    failed.forEach(result => {
      console.log(`   ${result.agentId}: ${result.error}`);
    });
  }
  
  if (successful.length === results.length) {
    console.log('\n🎉 All agents now have unique aliases for collaboration!');
    console.log('   You can now run: node scripts/update-bedrock-agents.js');
  } else {
    console.log('\n⚠️  Some aliases failed to create. Please resolve the issues above.');
  }
  
  return { successful, failed, results };
}

// Run the alias creation
if (require.main === module) {
  createAllUniqueAliases().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createUniqueAlias, createAllUniqueAliases };