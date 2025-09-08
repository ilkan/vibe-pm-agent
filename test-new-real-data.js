#!/usr/bin/env node

// Test the NEW real data implementation
const { spawn } = require('child_process');

const testRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "analyze_business_opportunity",
        arguments: {
            idea: "AI personal finance app with spending analysis",
            market_context: {
                industry: "fintech",
                competition: "Mint, YNAB, Personal Capital",
                budget_range: "medium",
                timeline: "12 months"
            },
            steering_options: {
                feature_name: "ai_finance_real_test",
                create_steering_files: false,
                inclusion_rule: "manual"
            }
        }
    }
};

console.log('🔍 Testing NEW implementation with REAL market data...\n');

const mcpServer = spawn('node', ['bin/simple-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

mcpServer.stdout.on('data', (data) => {
    output += data.toString();
});

mcpServer.stderr.on('data', (data) => {
    console.log('Debug:', data.toString().trim());
});

mcpServer.on('close', (code) => {
    console.log('\n=== NEW IMPLEMENTATION RESULTS ===');

    try {
        const response = JSON.parse(output);
        const content = response.result?.content?.[0]?.text || 'No content found';

        console.log(content);

        // Check for real data indicators
        const hasRealMarketData = content.includes('Real Market Analysis');
        const hasDataSources = content.includes('Market Data Sources');
        const hasCurrentMetrics = content.includes('Current Market Metrics');
        const hasRealCitations = content.includes('Real Data Sources & Citations');
        const hasOldTemplate = content.includes('$50M estimated') || content.includes('15-25% revenue increase');

        console.log('\n=== REAL DATA CHECK ===');
        console.log(`✓ Real Market Analysis section: ${hasRealMarketData ? '✅ YES' : '❌ NO'}`);
        console.log(`✓ Data Sources listed: ${hasDataSources ? '✅ YES' : '❌ NO'}`);
        console.log(`✓ Current Market Metrics: ${hasCurrentMetrics ? '✅ YES' : '❌ NO'}`);
        console.log(`✓ Real Citations: ${hasRealCitations ? '✅ YES' : '❌ NO'}`);
        console.log(`✓ Old template data removed: ${!hasOldTemplate ? '✅ YES' : '❌ NO - STILL PRESENT'}`);

        if (hasRealMarketData && hasDataSources && !hasOldTemplate) {
            console.log('\n🎉 SUCCESS: New implementation with real data is working!');
        } else if (hasOldTemplate) {
            console.log('\n❌ FAILED: Still showing old template data');
        } else {
            console.log('\n⚠️  PARTIAL: Some real data features missing');
        }

    } catch (error) {
        console.error('❌ Failed to parse response:', error.message);
    }
});

setTimeout(() => {
    console.log('⏱️  Timeout after 30 seconds');
    mcpServer.kill();
}, 30000);

mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');
mcpServer.stdin.end();