#!/usr/bin/env python3

import boto3
import json
import uuid
from botocore.exceptions import ClientError

def test_agent(agent_id, agent_alias_id, prompt, session_id):
    """Test a Bedrock agent with a given prompt"""
    
    client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    try:
        print(f"🤖 Testing Agent ID: {agent_id}")
        print(f"📝 Prompt: {prompt}")
        print("=" * 50)
        
        response = client.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            enableTrace=True,
            sessionId=session_id,
            inputText=prompt
        )
        
        completion = ""
        for event in response.get("completion"):
            if 'chunk' in event:
                chunk = event["chunk"]
                completion += chunk["bytes"].decode()
            
            # Log trace output for debugging
            if 'trace' in event:
                trace_event = event.get("trace")
                trace = trace_event['trace']
                print(f"🔍 Trace: {trace}")
        
        print(f"✅ Response: {completion}")
        print("=" * 50)
        return completion
        
    except ClientError as e:
        print(f"❌ Error invoking agent {agent_id}: {e}")
        return None

def main():
    """Test all four agents with appropriate prompts"""
    
    # Agent configurations from our deployment
    agents = {
        "business-strategy": {
            "id": "IBQRX8MZJJ",
            "alias": "TSTALIASID",
            "prompt": "Analyze the market opportunity for AI-powered project management tools"
        },
        "product-development": {
            "id": "CEW45LTT2P", 
            "alias": "TSTALIASID",
            "prompt": "Generate requirements for a real-time collaboration feature in a project management app"
        },
        "executive-communications": {
            "id": "ULX1RJGKCR",
            "alias": "TSTALIASID", 
            "prompt": "Create an executive one-pager for a new AI analytics dashboard project"
        },
        "interview-coaching": {
            "id": "PDZPQTNLYH",
            "alias": "TSTALIASID",
            "prompt": "Generate a product sense interview question for a Senior PM role"
        }
    }
    
    print("🚀 Testing Vibe PM Agent Multi-Agent Architecture")
    print("=" * 60)
    
    session_id = str(uuid.uuid4())
    
    for agent_name, config in agents.items():
        print(f"\n🎯 Testing {agent_name.replace('-', ' ').title()} Agent")
        result = test_agent(
            config["id"], 
            config["alias"], 
            config["prompt"], 
            session_id
        )
        
        if result:
            print(f"✅ {agent_name} agent working correctly")
        else:
            print(f"❌ {agent_name} agent failed")
        
        print("\n" + "=" * 60)
    
    print("\n🎉 Agent testing complete!")

if __name__ == "__main__":
    main()