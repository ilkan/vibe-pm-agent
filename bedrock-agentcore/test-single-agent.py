#!/usr/bin/env python3

import boto3
import json
import time

def test_interview_agent():
    """Test the Interview Coaching Agent"""
    
    client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    print("🎓 Testing Interview Coaching Agent...")
    print("Agent ID: PDZPQTNLYH")
    print("Query: Generate a product sense interview question for a Senior PM role")
    
    try:
        response = client.invoke_agent(
            agentId='PDZPQTNLYH',
            agentAliasId='TSTALIASID',
            sessionId=f"test-session-{int(time.time())}",
            inputText='Generate a product sense interview question for a Senior PM role'
        )
        
        # Collect response
        full_response = ""
        for chunk in response['completion']:
            if 'chunk' in chunk:
                if 'bytes' in chunk['chunk']:
                    full_response += chunk['chunk']['bytes'].decode('utf-8')
        
        if full_response:
            print(f"✅ SUCCESS - Response length: {len(full_response)} chars")
            print(f"📝 Preview: {full_response[:300]}...")
            return True
        else:
            print("⚠️  Empty response received")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_interview_agent()
    if success:
        print("\n🎉 Interview Coaching Agent is working!")
    else:
        print("\n❌ Interview Coaching Agent failed")