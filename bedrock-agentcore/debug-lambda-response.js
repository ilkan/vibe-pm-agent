#!/usr/bin/env node

/**
 * Debug Lambda response format for Bedrock agents
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({ region: 'us-east-1' });

async function testBedrockAgentPayload() {
    console.log('🔍 Testing Lambda with Bedrock Agent payload format...');
    
    // This mimics what Bedrock sends to Lambda
    const bedrockPayload = {
        messageVersion: '1.0',
        agent: {
            name: 'vibe-pm-interview-coaching-agent',
            version: 'DRAFT',
            id: 'PDZPQTNLYH',
            alias: 'TSTALIASID'
        },
        inputText: 'Generate a practice interview question for a Senior PM role',
        sessionId: 'test-session-' + Date.now(),
        actionGroup: 'interview-coaching-tools',
        function: 'generate_interview_question',
        parameters: [
            {
                name: 'role_level',
                type: 'string',
                value: 'Senior PM'
            },
            {
                name: 'question_category',
                type: 'string',
                value: 'product_sense'
            }
        ]
    };
    
    try {
        console.log('📤 Sending payload:', JSON.stringify(bedrockPayload, null, 2));
        
        const command = new InvokeCommand({
            FunctionName: 'vibe-pm-agent-dev',
            Payload: JSON.stringify(bedrockPayload)
        });
        
        const response = await client.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.Payload));
        
        console.log('\n📥 Lambda Response:');
        console.log(JSON.stringify(result, null, 2));
        
        // Check if response format is correct for Bedrock
        console.log('\n🔍 Response Analysis:');
        if (result.messageVersion) {
            console.log('✅ Has messageVersion');
        } else {
            console.log('❌ Missing messageVersion');
        }
        
        if (result.response) {
            console.log('✅ Has response object');
            if (result.response.actionGroup) {
                console.log('✅ Has actionGroup in response');
            } else {
                console.log('❌ Missing actionGroup in response');
            }
            if (result.response.function) {
                console.log('✅ Has function in response');
            } else {
                console.log('❌ Missing function in response');
            }
        } else {
            console.log('❌ Missing response object');
        }
        
        return result;
    } catch (error) {
        console.log('❌ Lambda invocation failed:', error.message);
        return null;
    }
}

async function testSimplePayload() {
    console.log('\n🔍 Testing Lambda with simple MCP payload...');
    
    const mcpPayload = {
        toolName: 'generate_interview_question',
        toolArgs: {
            role_level: 'Senior PM',
            question_category: 'product_sense'
        }
    };
    
    try {
        console.log('📤 Sending MCP payload:', JSON.stringify(mcpPayload, null, 2));
        
        const command = new InvokeCommand({
            FunctionName: 'vibe-pm-agent-dev',
            Payload: JSON.stringify(mcpPayload)
        });
        
        const response = await client.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.Payload));
        
        console.log('\n📥 MCP Response:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } catch (error) {
        console.log('❌ MCP invocation failed:', error.message);
        return null;
    }
}

async function runDiagnostics() {
    console.log('🚀 Starting Lambda Response Diagnostics...\n');
    
    const bedrockResult = await testBedrockAgentPayload();
    const mcpResult = await testSimplePayload();
    
    console.log('\n📋 Diagnostic Summary:');
    console.log(`Bedrock Agent Format: ${bedrockResult ? '✅ Responded' : '❌ Failed'}`);
    console.log(`MCP Format: ${mcpResult ? '✅ Responded' : '❌ Failed'}`);
    
    if (bedrockResult && !bedrockResult.messageVersion) {
        console.log('\n🔧 Recommended Fix:');
        console.log('Lambda function needs to return Bedrock-compatible response format:');
        console.log(`{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "interview-coaching-tools",
    "function": "generate_interview_question",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "Your response content here"
        }
      }
    }
  }
}`);
    }
}

if (require.main === module) {
    runDiagnostics().catch(console.error);
}