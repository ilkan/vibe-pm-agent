#!/bin/bash

# 🎬 Vibe PM Agent Demo Runner
# Demonstrates PM Mode analysis on realistic scenarios

set -e

echo "🚀 Vibe PM Agent Demo Runner"
echo "================================"
echo ""

# Check if MCP server exists
if [ ! -f "../bin/mcp-server.js" ]; then
    echo "❌ MCP server not found. Please build the project first:"
    echo "   npm install && npm run build"
    exit 1
fi

# Function to run demo analysis
run_demo() {
    local scenario=$1
    local tool=$2
    local description=$3
    
    echo "📊 Running: $description"
    echo "Scenario: $scenario"
    echo "Tool: $tool"
    echo ""
    
    if [ -f "$scenario/input.json" ]; then
        echo "Input:"
        cat "$scenario/input.json" | jq -r '.raw_developer_intent' | head -c 200
        echo "..."
        echo ""
        
        echo "🔄 Processing with PM Mode..."
        # Simulate MCP tool call (replace with actual implementation)
        echo "✅ Analysis complete! Check outputs in $scenario/"
        echo ""
    else
        echo "❌ Input file not found: $scenario/input.json"
    fi
}

# Demo menu
echo "Select a demo scenario:"
echo ""
echo "1) 🎯 SaaS Churn Prevention (churn-prediction/)"
echo "   Market timing + ROI analysis + executive communication"
echo ""
echo "2) 🛒 E-commerce Personalization (ecommerce-personalization/)"  
echo "   Competitive analysis + resource optimization + phased rollout"
echo ""
echo "3) 🏦 FinTech Compliance (fintech-compliance/)"
echo "   Risk assessment + regulatory timing + executive communication"
echo ""
echo "4) 🔧 DevTools Integration (devtools-integration/)"
echo "   Technical ROI + developer productivity + build-vs-buy"
echo ""
echo "5) 🎪 Run All Demos"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        run_demo "churn-prediction" "analyze_business_opportunity" "SaaS Churn Prevention Analysis"
        echo "📋 Generated artifacts:"
        echo "   • Market timing validation: churn-prediction/analysis/market-timing-validation.md"
        echo "   • Business case: churn-prediction/analysis/business-case-analysis.md"  
        echo "   • Executive one-pager: churn-prediction/outputs/executive-onepager.md"
        echo "   • PR-FAQ: churn-prediction/outputs/pr-faq.md"
        echo "   • Kiro integration: churn-prediction/kiro-integration/steering-files.md"
        ;;
    2)
        run_demo "ecommerce-personalization" "validate_market_timing" "E-commerce Personalization Analysis"
        echo "📋 Generated artifacts:"
        echo "   • Quick validation: ecommerce-personalization/analysis/quick-validation.md"
        echo "   • Management one-pager: ecommerce-personalization/outputs/management-onepager.md"
        ;;
    3)
        echo "🚧 FinTech Compliance demo coming soon..."
        ;;
    4)
        echo "🚧 DevTools Integration demo coming soon..."
        ;;
    5)
        echo "🎪 Running all available demos..."
        run_demo "churn-prediction" "analyze_business_opportunity" "SaaS Churn Prevention"
        run_demo "ecommerce-personalization" "validate_market_timing" "E-commerce Personalization"
        echo "✅ All demos complete!"
        ;;
    *)
        echo "❌ Invalid choice. Please select 1-5."
        exit 1
        ;;
esac

echo ""
echo "🎯 Demo Complete!"
echo ""
echo "💡 Key Takeaways:"
echo "   • PM Mode provides strategic WHY context before WHAT/HOW development"
echo "   • Business cases include ROI analysis with Conservative/Balanced/Bold scenarios"
echo "   • Executive communications ready for leadership alignment"
echo "   • Kiro integration creates persistent strategic context for future development"
echo ""
echo "🔄 Next Steps:"
echo "   1. Review generated analysis in the scenario folders"
echo "   2. See how PM Mode integrates with Spec Mode (kiro-integration/ folders)"
echo "   3. Try the MCP tools with your own scenarios"
echo ""
echo "📚 Learn More:"
echo "   • Full documentation: ../docs/"
echo "   • MCP tools reference: ../docs/mcp-tools-documentation.md"
echo "   • Implementation roadmap: ../tasks/backlog.json"