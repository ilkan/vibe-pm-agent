#!/bin/bash

# Real-time Collaboration Platform - Strategic Analysis Results Viewer

echo "🎯 Real-time Collaboration Platform - Strategic Analysis Results"
echo "=============================================================="
echo ""

# Check if outputs directory exists
if [ ! -d "outputs" ]; then
    echo "❌ No outputs directory found. Run the analysis first:"
    echo "   node run-analysis.js"
    exit 1
fi

# Function to display JSON insights
show_insights() {
    local file=$1
    local title=$2
    
    if [ -f "outputs/$file" ]; then
        echo "📄 $title"
        echo "$(printf '=%.0s' {1..60})"
        
        if command -v jq &> /dev/null; then
            case $file in
                "strategic-summary.json")
                    echo "🎯 Strategic Recommendation: $(jq -r '.strategic_recommendations.go_no_go' outputs/$file)"
                    echo "📈 Market Approach: $(jq -r '.strategic_recommendations.market_approach' outputs/$file)"
                    echo "💰 Funding Needed: $(jq -r '.key_findings.strategic_fit.startup_readiness' outputs/$file)"
                    echo "👥 Team Size: $(jq -r '.key_findings.resource_optimization.team_size' outputs/$file) people"
                    echo "🚀 MVP Cost: $(jq -r '.key_findings.resource_optimization.mvp_cost' outputs/$file)"
                    echo "📊 Market Opportunity: $(jq -r '.key_findings.market_opportunity.market_size' outputs/$file) SOM"
                    echo "🎯 Average Confidence: $(jq -r '.average_confidence' outputs/$file)%"
                    echo ""
                    echo "🔑 Key Success Factors:"
                    jq -r '.strategic_recommendations.success_factors[]' outputs/$file | sed 's/^/   • /'
                    echo ""
                    echo "⚠️  Key Risks:"
                    jq -r '.strategic_recommendations.key_risks[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "market-timing-analysis.json")
                    echo "⏰ Timing Recommendation: $(jq -r '.timing_assessment.overall_recommendation' outputs/$file)"
                    echo "🎯 Confidence: $(jq -r '.timing_assessment.confidence_score' outputs/$file)%"
                    echo "⏳ Competitive Window: $(jq -r '.timing_assessment.competitive_window.opportunity_duration' outputs/$file)"
                    echo "🏆 Strategy: $(jq -r '.timing_assessment.competitive_window.recommended_strategy' outputs/$file)"
                    echo ""
                    echo "✅ Positive Market Signals:"
                    jq -r '.timing_assessment.market_signals.positive_indicators[]' outputs/$file | sed 's/^/   • /'
                    echo ""
                    echo "⚠️  Warning Signals:"
                    jq -r '.timing_assessment.market_signals.warning_signals[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "strategic-alignment-analysis.json")
                    echo "🎯 Overall Alignment: $(jq -r '.alignment_assessment.overall_score' outputs/$file)/100"
                    echo "💰 Seed Round: $(jq -r '.startup_specific_analysis.funding_requirements.seed_round' outputs/$file)"
                    echo "👥 Target Team: $(jq -r '.startup_specific_analysis.team_structure.target_team' outputs/$file) people"
                    echo "🎯 Target Segment: $(jq -r '.alignment_assessment.market_positioning.target_segment' outputs/$file)"
                    echo "💡 Value Proposition: $(jq -r '.alignment_assessment.market_positioning.value_proposition' outputs/$file)"
                    echo ""
                    echo "💪 Key Strengths:"
                    jq -r '.alignment_assessment.strategic_fit.key_strengths[]' outputs/$file | sed 's/^/   • /'
                    echo ""
                    echo "⚠️  Potential Weaknesses:"
                    jq -r '.alignment_assessment.strategic_fit.potential_weaknesses[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "resource-optimization-analysis.json")
                    echo "👥 Recommended Team Size: $(jq -r '.optimization_analysis.recommended_team_structure.total_team_size' outputs/$file)"
                    echo "💰 Annual Team Cost: $(jq -r '.optimization_analysis.recommended_team_structure.total_annual_cost' outputs/$file)"
                    echo "🚀 MVP Duration: $(jq -r '.optimization_analysis.development_phases.mvp_phase.duration' outputs/$file)"
                    echo "💵 MVP Cost: $(jq -r '.optimization_analysis.development_phases.mvp_phase.cost' outputs/$file)"
                    echo ""
                    echo "🎯 Success Thresholds:"
                    jq -r '.startup_metrics.success_thresholds | to_entries[] | "   • \(.key): \(.value)"' outputs/$file
                    echo ""
                    echo "📊 Key Performance Indicators:"
                    jq -r '.startup_metrics.key_performance_indicators[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "business-opportunity-analysis.json")
                    echo "📈 Market Size (TAM): $(jq -r '.analysis.market_size.total_addressable_market' outputs/$file)"
                    echo "🎯 Market Size (SOM): $(jq -r '.analysis.market_size.serviceable_obtainable_market' outputs/$file)"
                    echo "📊 Growth Rate: $(jq -r '.analysis.market_size.growth_rate' outputs/$file)"
                    echo "🏆 Niche Opportunity Score: $(jq -r '.analysis.opportunity_assessment.niche_opportunity_score' outputs/$file)/100"
                    echo ""
                    echo "🏢 Market Leaders:"
                    jq -r '.analysis.competitive_intelligence.market_leaders[] | "   • \(.name): \(.market_share) market share"' outputs/$file
                    echo ""
                    echo "🔍 Market Gaps:"
                    jq -r '.analysis.competitive_intelligence.market_gaps[]' outputs/$file | sed 's/^/   • /'
                    ;;
            esac
        else
            echo "📋 Summary data (install 'jq' for better formatting):"
            grep -E '"(recommendation|confidence_score|overall_score)"' "outputs/$file" | head -5
        fi
        echo ""
        echo ""
    else
        echo "⚠️  $file not found"
        echo ""
    fi
}

# Display executive summary first
echo "🎯 EXECUTIVE SUMMARY"
echo "==================="
show_insights "strategic-summary.json" "Strategic Recommendations"

# Show detailed analysis
show_insights "market-timing-analysis.json" "1. MARKET TIMING VALIDATION"
show_insights "strategic-alignment-analysis.json" "2. STRATEGIC ALIGNMENT ASSESSMENT"
show_insights "resource-optimization-analysis.json" "3. RESOURCE OPTIMIZATION ANALYSIS"
show_insights "business-opportunity-analysis.json" "4. BUSINESS OPPORTUNITY ANALYSIS"

echo "🏆 COMPETITIVE POSITIONING"
echo "========================="
echo "📊 Competitive Analysis Matrix:"

if command -v jq &> /dev/null && [ -f "outputs/business-opportunity-analysis.json" ]; then
    echo "| Platform | Market Share | Strengths | Weaknesses | Threat Level |"
    echo "|----------|--------------|-----------|------------|--------------|"
    jq -r '.analysis.competitive_intelligence.market_leaders[] | "| \(.name) | \(.market_share) | \(.strengths[0]) | \(.weaknesses[0]) | \(.threat_level) |"' outputs/business-opportunity-analysis.json
    echo "| **Our Platform** | 0% | Developer Focus | No Network Effects | New Entrant |"
fi

echo ""
echo "🎯 DIFFERENTIATION STRATEGY"
echo "=========================="
if command -v jq &> /dev/null && [ -f "outputs/strategic-alignment-analysis.json" ]; then
    echo "🎯 Target Market: $(jq -r '.alignment_assessment.market_positioning.target_segment' outputs/strategic-alignment-analysis.json)"
    echo "💡 Value Proposition: $(jq -r '.alignment_assessment.market_positioning.value_proposition' outputs/strategic-alignment-analysis.json)"
    echo "🏆 Differentiation: $(jq -r '.alignment_assessment.market_positioning.differentiation_strategy' outputs/strategic-alignment-analysis.json)"
    echo "🛡️  Competitive Moat: $(jq -r '.alignment_assessment.market_positioning.competitive_moat' outputs/strategic-alignment-analysis.json)"
fi

echo ""
echo "💰 FUNDING & MILESTONES"
echo "======================="
if command -v jq &> /dev/null && [ -f "outputs/strategic-alignment-analysis.json" ]; then
    echo "💵 Seed Round: $(jq -r '.startup_specific_analysis.funding_requirements.seed_round' outputs/strategic-alignment-analysis.json)"
    echo ""
    echo "📊 Use of Funds:"
    jq -r '.startup_specific_analysis.funding_requirements.use_of_funds | to_entries[] | "   • \(.key): \(.value)"' outputs/strategic-alignment-analysis.json
    echo ""
    echo "🎯 Key Milestones:"
    jq -r '.startup_specific_analysis.milestone_planning | to_entries[] | "   • \(.key): \(.value)"' outputs/strategic-alignment-analysis.json
fi

echo ""
echo "📊 CONFIDENCE ANALYSIS"
echo "====================="
echo "📈 Analysis Confidence Levels:"

if command -v jq &> /dev/null; then
    for file in outputs/*.json; do
        if [ -f "$file" ]; then
            confidence=$(jq -r 'try .timing_assessment.confidence_score // try .evidence.confidence_score // try .alignment_assessment.overall_score // "N/A"' "$file" 2>/dev/null)
            if [ "$confidence" != "null" ] && [ "$confidence" != "N/A" ]; then
                filename=$(basename "$file" .json)
                echo "   • $filename: $confidence%"
            fi
        fi
    done
fi

echo ""
echo "📁 FILES GENERATED"
echo "=================="
echo "📊 Analysis Files:"
ls -la outputs/*.json 2>/dev/null | awk '{print "   • " $9 " (" $5 " bytes)"}' || echo "   No analysis files found"

echo ""
echo "✅ Strategic Analysis Complete!"
echo ""
echo "💡 Key Takeaways:"
echo "   1. Competitive market requires niche focus on developer teams"
echo "   2. AI integration and deep tool connections provide differentiation"
echo "   3. Product-led growth strategy essential for developer adoption"
echo "   4. 6-12 month window to establish market position"
echo ""
echo "🚀 Next Steps:"
echo "   1. Validate assumptions with 50+ developer team interviews"
echo "   2. Build MVP focusing on core real-time features + one AI capability"
echo "   3. Establish partnerships with key developer tool providers"
echo "   4. Raise $2M seed round for 18-month runway"
echo ""
echo "🔧 Technical Details:"
echo "   • Run 'cat outputs/strategic-summary.json | jq' for full analysis"
echo "   • All outputs include confidence scores and market intelligence"
echo "   • Analysis optimized for competitive market entry strategy"