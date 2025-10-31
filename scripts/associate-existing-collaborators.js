#!/usr/bin/env node

/**
 * Associate Collaborators with Existing Supervisor
 * Works with the existing ULX1RJGKCR supervisor agent
 */

const { 
  BedrockAgentClient, 
  AssociateAgentCollaboratorCommand,
  ListAgentCollaboratorsCommand,
  GetAgentCommand
} = require('@aws-sdk/client-bedrock-agent');

const { AWS_REGION, AWS_ACCOUNT_ID } = require('./update-bedrock-agents');

// Use the existing supervisor agent
const SUPERVISOR_AGENT_ID = 'ULX1RJGKCR';

// Collaborator agents configuration
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

async function checkExistingCollaborators() {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`🔍 Checking existing collaborators for supervisor ${SUPERVISOR_AGENT_ID}...\n`);
    
    const command = new ListAgentCollaboratorsCommand({
      agentId: SUPERVISOR_AGENT_ID,
      agentVersion: 'DRAFT'
    });
    
    const result = await client.send(command);
    
    if (result.agentCollaboratorSummaries && result.agentCollaboratorSummaries.length > 0) {
      console.log(`Found ${result.agentCollaboratorSummaries.length} existing collaborators:`);
      result.agentCollaboratorSummaries.forEach(collab => {
        console.log(`   - ${collab.collaboratorName} (${collab.agentDescriptor.aliasArn})`);
      });
      return result.agentCollaboratorSummaries;
    } else {
      console.log('No existing collaborators found.');
      return [];
    }
  } catch (error) {
    console.error(`❌ Failed to check existing collaborators: ${error.message}`);
    return [];
  }
}

async function associateCollaborator(agentId, config) {
  const client = new BedrockAgentClient({ region: AWS_REGION });
  
  try {
    console.log(`   Associating ${agentId} (${config.name})...`);
    
    // Create different alias ARNs to try
    const aliasOptions = [
      `arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:agent-alias/${agentId}/TSTALIASID`,
      `arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:agent/${agentId}` // Try direct agent ARN
    ];
    
    let lastError = null;
    
    for (const aliasArn of aliasOptions) {
      try {
        console.log(`     Trying alias: ${aliasArn.split('/').pop()}`);
        
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
        console.log(`   ✅ Associated successfully with ${aliasArn.split('/').pop()}`);
        
        return { agentId, success: true, aliasUsed: aliasArn };
      } catch (error) {
        lastError = error;
        console.log(`     Failed with ${aliasArn.split('/').pop()}: ${error.message}`);
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error(`   ❌ Failed to associate ${agentId}: ${error.message}`);
    return { agentId, success: false, error: error.message };
  }
}

async function associateAllCollaborators() {
  console.log('🚀 Associating Collaborators with Existing Supervisor');
  console.log('====================================================\n');
  
  try {
    // Step 1: Check supervisor agent status
    const client = new BedrockAgentClient({ region: AWS_REGION });
    const getAgentCommand = new GetAgentCommand({ agentId: SUPERVISOR_AGENT_ID });
    const supervisorResult = await client.send(getAgentCommand);
    
    console.log(`🎯 Supervisor Agent Status:`);
    console.log(`   ID: ${SUPERVISOR_AGENT_ID}`);
    console.log(`   Name: ${supervisorResult.agent.agentName}`);
    console.log(`   Status: ${supervisorResult.agent.agentStatus}`);
    console.log(`   Collaboration: ${supervisorResult.agent.agentCollaboration || 'Not set'}\n`);
    
    // Step 2: Check existing collaborators
    const existingCollaborators = await checkExistingCollaborators();
    
    // Step 3: Associate new collaborators
    console.log('\n🤝 Associating Collaborator Agents...\n');
    
    const results = [];
    
    for (const [agentId, config] of Object.entries(COLLABORATOR_AGENTS)) {
      // Check if already associated
      const alreadyAssociated = existingCollaborators.some(
        collab => collab.agentDescriptor.aliasArn.includes(agentId)
      );
      
      if (alreadyAssociated) {
        console.log(`   ⏭️  ${agentId} (${config.name}) already associated`);
        results.push({ agentId, success: true, existing: true });
      } else {
        const result = await associateCollaborator(agentId, config);
        results.push(result);
      }
    }
    
    // Summary
    console.log('\n📊 Association Summary:');
    console.log('========================');
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`✅ Successfully associated: ${successful}/${total} collaborators`);
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const message = result.success 
        ? (result.existing ? 'Already associated' : 'Newly associated')
        : `Failed: ${result.error}`;
      console.log(`${status} ${result.agentId}: ${message}`);
    });
    
    if (successful === total) {
      console.log('\n🎉 Multi-Agent Collaboration is Ready!');
      console.log('\n🧪 Testing Instructions:');
      console.log('1. Go to AWS Bedrock Console → Agents');
      console.log(`2. Find and select agent: ${SUPERVISOR_AGENT_ID} (Multi-Agent-Supervisor)`);
      console.log('3. Click "Test" to open the test interface');
      console.log('4. Try this comprehensive test prompt:');
      console.log('\n📝 Test Prompt:');
      console.log('   "I need a comprehensive analysis for launching an AI-powered code review tool for enterprise development teams. Please coordinate with your specialist agents to provide:');
      console.log('   1. Market opportunity and competitive analysis');
      console.log('   2. Technical requirements and product specifications');
      console.log('   3. Implementation strategy and coaching guidance');
      console.log('   Synthesize all insights into an executive summary with actionable recommendations."');
      
      console.log('\n🎯 Expected Behavior:');
      console.log('   - Supervisor should route tasks to Business Strategy, Product Development, and Case Study Coaching specialists');
      console.log('   - Each specialist should provide domain-specific insights');
      console.log('   - Supervisor should synthesize responses into a comprehensive analysis');
      
    } else {
      console.log('\n⚠️  Some associations failed. The system may still work partially.');
      console.log('   Try testing with the successfully associated agents.');
    }
    
    return { successful, total, results, supervisorId: SUPERVISOR_AGENT_ID };
    
  } catch (error) {
    console.error(`💥 Association failed: ${error.message}`);
    throw error;
  }
}

// Run the association
if (require.main === module) {
  associateAllCollaborators().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { associateAllCollaborators, checkExistingCollaborators };