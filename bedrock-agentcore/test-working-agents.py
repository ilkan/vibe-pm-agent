#!/usr/bin/env python3

import boto3
import json
import time

def test_working_agents():
    """Test the agents that showed success in previous tests"""
    
    client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Test cases for working agents
    test_cases = [
        {
            'name': 'Product Development Agent',
            'agent_id': 'CEW45LTT2P',
            'alias_id': 'TSTALIASID',
            'query': 'Analyze our current development workflow and suggest optimizations for faster delivery.'
        },
        {
            'name': 'Executive Communications Agent', 
            'agent_id': 'ULX1RJGKCR',
            'alias_id': 'TSTALIASID',
            'query': 'Create an executive one-pager for our new AI assistant product launch.'
        }
    ]
    
    print("🧪 Testing Working Agents...")
    print("=" * 60)
    
    for test_case in test_cases:
        print(f"\n🎯 Testing {test_case['name']}...")
        print(f"Query: {test_case['query'][:60]}...")
        
        try:
            response = client.invoke_agent(
                agentId=test_case['agent_id'],
                agentAliasId=test_case['alias_id'],
                sessionId=f"test-session-{int(time.time())}",
                inputText=test_case['query']
            )
            
            # Collect response
            full_response = ""
            for chunk in response['completion']:
                if 'chunk' in chunk:
                    if 'bytes' in chunk['chunk']:
                        full_response += chunk['chunk']['bytes'].decode('utf-8')
            
            if full_response:
                print(f"✅ SUCCESS - Response length: {len(full_response)} chars")
                print(f"📝 Preview: {full_response[:200]}...")
            else:
                print("⚠️  Empty response received")
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
        
        time.sleep(2)  # Rate limiting
    
    print(f"\n🎉 Working agents test completed!")

if __name__ == "__main__":
    test_working_agents()