#!/usr/bin/env node

// Test MCP server citation generation
const { spawn } = require('child_process');

const testRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "analyze_business_opportunity",
        arguments: {
            idea: "CrossFit coaching mobile app that analyzes user movements in real-time and provides instant feedback using Flutter. The app would use computer vision/AI to track form and technique during CrossFit workouts.",
            market_context: {
                industry: "fitness_technology",
                competition: "Mirror, Tonal, Peloton, MyFitnessPal, Nike Training Club",
                budget_range: "medium",
                timeline: "12-18 months for MVP"
            },
            steering_options: {
                feature_name: "crossfit_movement_analyzer",
                create_steering_files: false,
                inclusion_rule: "manual"
            }
        }
    }
};

console.log('Testing MCP server citation generation...');

const mcpServer = spawn('node', ['bin/simple-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

mcpServer.stdout.on('data', (data) => {
    output += data.toString();
});

mcpServer.stderr.on('data', (data) => {
    console.error('MCP Server Error:', data.toString());
});

mcpServer.on('close', (code) => {
    console.log('MCP Server closed with code:', code);

    try {
        const response = JSON.parse(output);
        const content = response.result?.content?.[0]?.text || 'No content found';

        console.log('\n=== ANALYSIS OUTPUT ===');
        console.log(content);

        // Check for citations
        if (content.includes('## References') || content.includes('[1]')) {
            console.log('\n✅ SUCCESS: Citations found in output!');
        } else {
            console.log('\n❌ FAILED: No citations found in output');
        }

    } catch (error) {
        console.error('Failed to parse response:', error.message);
        console.log('Raw output:', output);
    }
});

// Send the test request
mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');
mcpServer.stdin.end();