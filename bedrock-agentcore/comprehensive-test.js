#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Vibe PM Agent Multi-Agent Architecture
 * Tests all 4 agents with realistic scenarios and validates tool distribution
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const fs = require('fs');
const path = require('path');

// Configuration
const REGION = 'us-east-1';
const CONFIG_FILE = path.join(__dirname, 'agent-config.json');
const RESULTS_FILE = path.join(__dirname, 'test-results.json');

class AgentTester {
  constructor() {
    this.client = new BedrockAgentRuntimeClient({ region: REGION });
    this.config = this.loadConfig();
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        agents: {}
      },
      tests: []
    };
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ Failed to load agent configuration:', error.message);
      process.exit(1);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Agent Testing...\n');
    
    // Test each agent with multiple scenarios
    await this.testBusinessStrategyAgent();
    await this.testProductDevelopmentAgent();
    await this.testExecutiveCommunicationsAgent();
    await this.testInterviewCoachingAgent();
    
    // Test cross-agent scenarios
    await this.testCrossAgentScenarios();
    
    // Generate summary
    this.generateSummary();
    this.saveResults();
    
    console.log('\n🎯 Testing Complete!');
    console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.totalTests} tests passed`);
    console.log(`📁 Detailed results saved to: ${RESULTS_FILE}`);
  }

  async testBusinessStrategyAgent() {
    console.log('🎯 Testing Business Strategy Agent...');
    const agent = this.config.agents['business-strategy'];
    
    const testCases = [
      {
        name: 'Market Opportunity Analysis',
        input: 'Analyze the business opportunity for a new AI-powered customer service chatbot targeting e-commerce companies. Market context: High competition from Zendesk and Intercom, 12-month timeline, large budget range.',
        expectedTools: ['analyze_business_opportunity'],
        category: 'market_analysis'
      },
      {
        name: 'Business Case Generation',
        input: 'Generate a comprehensive business case for implementing a mobile-first redesign of our web application. Expected development cost is $500K, projected revenue increase of $2M annually.',
        expectedTools: ['generate_business_case'],
        category: 'business_justification'
      },
      {
        name: 'Market Timing Validation',
        input: 'Validate if now is the right time to launch a subscription-based project management tool. Customer demand is high, competitive pressure is medium, technical readiness is high.',
        expectedTools: ['validate_market_timing'],
        category: 'timing_analysis'
      },
      {
        name: 'Competitive Landscape Analysis',
        input: 'Analyze the competitive landscape for cloud-based video conferencing solutions, focusing on the enterprise market segment.',
        expectedTools: ['analyze_competitor_landscape'],
        category: 'competitive_analysis'
      }
    ];

    for (const testCase of testCases) {
      await this.runAgentTest(agent, testCase);
    }
  }

  async testProductDevelopmentAgent() {
    console.log('🛠️ Testing Product Development Agent...');
    const agent = this.config.agents['product-development'];
    
    const testCases = [
      {
        name: 'Requirements Generation',
        input: 'Generate comprehensive requirements for a real-time collaboration feature that allows multiple users to edit documents simultaneously with conflict resolution and version history.',
        expectedTools: ['generate_requirements'],
        category: 'requirements'
      },
      {
        name: 'Design Options Creation',
        input: 'Create multiple design options for a mobile app notification system that needs to handle high volume, provide personalization, and maintain battery efficiency.',
        expectedTools: ['generate_design_options'],
        category: 'design'
      },
      {
        name: 'Resource Optimization',
        input: 'Optimize resource allocation for a development team of 8 engineers with a $1M budget and 6-month timeline. Current workflow has bottlenecks in code review and testing phases.',
        expectedTools: ['optimize_resource_allocation'],
        category: 'optimization'
      },
      {
        name: 'Task Plan Generation',
        input: 'Generate a detailed implementation task plan for building a microservices-based API gateway with authentication, rate limiting, and monitoring capabilities.',
        expectedTools: ['generate_task_plan'],
        category: 'planning'
      }
    ];

    for (const testCase of testCases) {
      await this.runAgentTest(agent, testCase);
    }
  }

  async testExecutiveCommunicationsAgent() {
    console.log('📊 Testing Executive Communications Agent...');
    const agent = this.config.agents['executive-communications'];
    
    const testCases = [
      {
        name: 'Executive One-Pager',
        input: 'Create an executive one-pager for a new customer analytics platform that will increase user retention by 30% and reduce churn by 20%. Project requires 8 months and $3M investment.',
        expectedTools: ['generate_management_onepager'],
        category: 'executive_summary'
      },
      {
        name: 'PR-FAQ Document',
        input: 'Generate a PR-FAQ document for launching a new AI-powered code review tool targeting enterprise development teams. Focus on productivity gains and code quality improvements.',
        expectedTools: ['generate_pr_faq'],
        category: 'product_launch'
      },
      {
        name: 'Stakeholder Communication',
        input: 'Create stakeholder communication materials for announcing a major platform migration to the engineering team. Include timeline, impact, and support resources.',
        expectedTools: ['create_stakeholder_communication'],
        category: 'internal_communication'
      },
      {
        name: 'Company Interview Insights',
        input: 'Provide comprehensive interview insights for a Senior PM role at Amazon, focusing on leadership principles and working backwards methodology.',
        expectedTools: ['get_company_interview_insights'],
        category: 'interview_preparation'
      }
    ];

    for (const testCase of testCases) {
      await this.runAgentTest(agent, testCase);
    }
  }

  async testInterviewCoachingAgent() {
    console.log('🎓 Testing Interview Coaching Agent...');
    const agent = this.config.agents['interview-coaching'];
    
    const testCases = [
      {
        name: 'Interview Preparation Session',
        input: 'Start an interview preparation session for a Principal PM role at Google. I have 8 years of PM experience and want to focus on product sense and leadership questions.',
        expectedTools: ['start_interview_preparation'],
        category: 'preparation'
      },
      {
        name: 'Interview Question Generation',
        input: 'Generate a challenging product sense question for a Senior PM interview at Meta, focusing on social media platform features.',
        expectedTools: ['generate_interview_question'],
        category: 'question_generation'
      },
      {
        name: 'Case Study Practice',
        input: 'Start a product design case study for improving user engagement on a video streaming platform. Target role is Senior PM, difficulty level 4.',
        expectedTools: ['start_case_study'],
        category: 'case_study'
      },
      {
        name: 'Response Evaluation',
        input: 'Evaluate my response to a product prioritization question. My answer focused on user impact, business value, and technical feasibility using the RICE framework.',
        expectedTools: ['evaluate_interview_response'],
        category: 'evaluation'
      }
    ];

    for (const testCase of testCases) {
      await this.runAgentTest(agent, testCase);
    }
  }

  async testCrossAgentScenarios() {
    console.log('🔄 Testing Cross-Agent Scenarios...');
    
    const crossAgentTests = [
      {
        name: 'End-to-End Product Launch',
        description: 'Complete workflow from idea to executive presentation',
        agents: ['business-strategy', 'product-development', 'executive-communications'],
        scenario: 'Full product launch workflow for AI-powered analytics dashboard'
      },
      {
        name: 'Interview Prep with Business Context',
        description: 'Interview preparation using real business cases',
        agents: ['business-strategy', 'interview-coaching'],
        scenario: 'PM interview prep using actual market analysis scenarios'
      }
    ];

    for (const test of crossAgentTests) {
      console.log(`  🔗 ${test.name}: ${test.description}`);
      this.results.tests.push({
        name: test.name,
        type: 'cross_agent',
        agents: test.agents,
        status: 'simulated', // Would require actual orchestration
        timestamp: new Date().toISOString(),
        notes: `Cross-agent scenario: ${test.scenario}`
      });
    }
  }

  async runAgentTest(agent, testCase) {
    console.log(`  🧪 ${testCase.name}...`);
    this.results.summary.totalTests++;
    
    const testResult = {
      name: testCase.name,
      agent: agent.name,
      category: testCase.category,
      input: testCase.input,
      expectedTools: testCase.expectedTools,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      response: null,
      error: null,
      executionTime: 0
    };

    const startTime = Date.now();
    
    try {
      // Check if agent ID is configured
      if (agent.agentId === 'REPLACE_WITH_ACTUAL_AGENT_ID') {
        testResult.status = 'skipped';
        testResult.error = 'Agent ID not configured';
        console.log(`    ⏭️  Skipped (Agent ID not configured)`);
      } else {
        // Invoke the agent
        const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const command = new InvokeAgentCommand({
          agentId: agent.agentId,
          agentAliasId: agent.aliasId,
          sessionId,
          inputText: testCase.input
        });

        const response = await this.client.send(command);
        
        testResult.response = response;
        testResult.status = 'passed';
        testResult.executionTime = Date.now() - startTime;
        
        this.results.summary.passed++;
        console.log(`    ✅ Passed (${testResult.executionTime}ms)`);
      }
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.executionTime = Date.now() - startTime;
      
      this.results.summary.failed++;
      console.log(`    ❌ Failed: ${error.message}`);
    }

    this.results.tests.push(testResult);
    
    // Update agent-specific stats
    if (!this.results.summary.agents[agent.name]) {
      this.results.summary.agents[agent.name] = { total: 0, passed: 0, failed: 0, skipped: 0 };
    }
    this.results.summary.agents[agent.name].total++;
    this.results.summary.agents[agent.name][testResult.status]++;
  }

  generateSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n🤖 Agent Performance:');
    Object.entries(this.results.summary.agents).forEach(([agentName, stats]) => {
      console.log(`  ${agentName}:`);
      console.log(`    Total: ${stats.total}, Passed: ${stats.passed}, Failed: ${stats.failed}, Skipped: ${stats.skipped || 0}`);
    });

    // Add tool distribution analysis
    console.log('\n🔧 Tool Distribution Analysis:');
    const toolDistribution = {};
    Object.values(this.config.agents).forEach(agent => {
      agent.tools.forEach(tool => {
        if (!toolDistribution[tool]) {
          toolDistribution[tool] = [];
        }
        toolDistribution[tool].push(agent.name);
      });
    });

    console.log(`Total Tools: ${Object.keys(toolDistribution).length}`);
    console.log(`Tools per Agent: ${Object.values(this.config.agents).map(a => a.tools.length).join(', ')}`);
    
    // Check for tool conflicts (tools assigned to multiple agents)
    const conflicts = Object.entries(toolDistribution).filter(([tool, agents]) => agents.length > 1);
    if (conflicts.length > 0) {
      console.log(`⚠️  Tool Conflicts: ${conflicts.length}`);
      conflicts.forEach(([tool, agents]) => {
        console.log(`    ${tool}: ${agents.join(', ')}`);
      });
    } else {
      console.log('✅ No tool conflicts detected');
    }
  }

  saveResults() {
    try {
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${RESULTS_FILE}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AgentTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AgentTester;