#!/usr/bin/env node

/**
 * Check Agent Aliases and Configurations
 * Inspects the current state of all agents and their aliases
 */

const { 
  BedrockAgentClient, 
  GetAgentCommand,
  ListAgentAliasesCommand,
  ListAgentVersionsCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AWS_REGION } = require('./update-bedrock-agents');

const AGENT_IDS = ['IBQRX8MZJJ', 'CEW45LTT2P', 'PDZPQTNLYH', 'NBHVX22U0X'];

async function checkAgentDetails(agentId) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`\n🔍 Checking Agent ${agentId}:`);
    console.log('================================');
    
    // Get agent details
    const getAgentCommand = new GetAgentCommand({ agentId });
    const agentResult = await client.send(getAgentCommand);
    
    console.log(`📋 Agent Details:`);
    console.log(`   Name: ${agentResult.agent.agentName}`);
    console.log(`   Status: ${agentResult.agent.agentStatus}`);
    console.log(`   Collaboration: ${agentResult.agent.agentCollaboration || 'DISABLED'}`);
    console.log(`   Model: ${agentResult.agent.foundationModel}`);
    
    // Get agent versions
    try {
      const listVersionsCommand = new ListAgentVersionsCommand({ agentId });
      const versionsResult = await client.send(listVersionsCommand);
      
      console.log(`\n📦 Agent Versions:`);
      if (versionsResult.agentVersionSummaries && versionsResult.agentVersionSummaries.length > 0) {
        versionsResult.agentVersionSummaries.forEach(version => {
          console.log(`   Version ${version.agentVersion}: ${version.agentStatus} (${version.creationDateTime?.toISOString().split('T')[0]})`);
        });
      } else {
        console.log(`   No versions found`);
      }
    } catch (versionError) {
      console.log(`   ❌ Failed to get versions: ${versionError.message}`);
    }
    
    // Get agent aliases
    try {
      const listAliasesCommand = new ListAgentAliasesCommand({ agentId });
      const aliasesResult = await client.send(listAliasesCommand);
      
      console.log(`\n🏷️  Agent Aliases:`);
      if (aliasesResult.agentAliasSummaries && aliasesResult.agentAliasSummaries.length > 0) {
        aliasesResult.agentAliasSummaries.forEach(alias => {
          console.log(`   ${alias.agentAliasId}: ${alias.agentAliasName || 'Unnamed'} (${alias.agentAliasStatus})`);
          if (alias.routingConfiguration && alias.routingConfiguration.length > 0) {
            alias.routingConfiguration.forEach(route => {
              console.log(`     → Points to version: ${route.agentVersion}`);
            });
          }
        });
      } else {
        console.log(`   No aliases found`);
      }
    } catch (aliasError) {
      console.log(`   ❌ Failed to get aliases: ${aliasError.message}`);
    }
    
    return {
      agentId,
      name: agentResult.agent.agentName,
      status: agentResult.agent.agentStatus,
      collaboration: agentResult.agent.agentCollaboration,
      hasAliases: true // We'll update this based on actual results
    };
    
  } catch (error) {
    console.error(`❌ Failed to check agent ${agentId}: ${error.message}`);
    return {
      agentId,
      error: error.message,
      hasAliases: false
    };
  }
}

async function checkAllAgents() {
  console.log('🔍 Checking All Agent Configurations');
  console.log('=====================================');
  
  const results = [];
  
  for (const agentId of AGENT_IDS) {
    const result = await checkAgentDetails(agentId);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('============');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.agentId}: ${result.error}`);
    } else {
      console.log(`✅ ${result.agentId}: ${result.name} (${result.status}) - Collaboration: ${result.collaboration || 'DISABLED'}`);
    }
  });
  
  console.log('\n🎯 Multi-Agent Setup Status:');
  const supervisorAgent = results.find(r => r.collaboration === 'SUPERVISOR');
  const collaboratorAgents = results.filter(r => r.collaboration !== 'SUPERVISOR' && !r.error);
  
  if (supervisorAgent) {
    console.log(`   Supervisor: ${supervisorAgent.agentId} (${supervisorAgent.name})`);
  } else {
    console.log(`   ⚠️  No supervisor agent found`);
  }
  
  console.log(`   Potential Collaborators: ${collaboratorAgents.length}`);
  collaboratorAgents.forEach(agent => {
    console.log(`     - ${agent.agentId}: ${agent.name}`);
  });
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Each collaborator agent needs a unique alias (not TSTALIASID)');
  console.log('   2. Aliases must point to a prepared agent version');
  console.log('   3. Associate collaborator aliases with the supervisor agent');
  
  return results;
}

// Run the check
if (require.main === module) {
  checkAllAgents().catch(error => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkAllAgents, checkAgentDetails };