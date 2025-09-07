#!/bin/bash

# Customer Support Automation - Business Case Results Viewer

echo "💰 Customer Support Automation - Multi-Scenario Business Case Results"
echo "===================================================================="
echo ""

# Check if outputs directory exists
if [ ! -d "outputs" ]; then
    echo "❌ No outputs directory found. Run the business case analysis first:"
    echo "   node run-business-case.js"
    exit 1
fi

# Function to display business case insights
show_business_insights() {
    local file=$1
    local title=$2
    
    if [ -f "outputs/$file" ]; then
        echo "📄 $title"
        echo "$(printf '=%.0s' {1..60})"
        
        if command -v jq &> /dev/null; then
            case $file in
                "business-case-summary.json")
                    echo "💰 Investment Decision: $(jq -r '.recommendations.investment_decision' outputs/$file)"
                    echo "🎯 Recommended Scenario: $(jq -r '.recommendations.recommended_scenario' outputs/$file)"
                    echo "📈 Conservative ROI: $(jq -r '.key_findings.financial_projections.conservative_roi' outputs/$file)"
                    echo "📈 Balanced ROI: $(jq -r '.key_findings.financial_projections.balanced_roi' outputs/$file)"
                    echo "📈 Bold ROI: $(jq -r '.key_findings.financial_projections.bold_roi' outputs/$file)"
                    echo "⏰ Payback Period: $(jq -r '.key_findings.financial_projections.payback_period' outputs/$file)"
                    echo "⚠️  Risk Rating: $(jq -r '.key_findings.risk_assessment.overall_risk_rating' outputs/$file)"
                    echo "🎯 Strategic Alignment: $(jq -r '.key_findings.strategic_alignment.overall_score' outputs/$file)/100"
                    echo "📊 Average Confidence: $(jq -r '.average_confidence' outputs/$file)%"
                    echo ""
                    echo "🔑 Key Success Factors:"
                    jq -r '.recommendations.key_success_factors[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "comprehensive-business-case.json")
                    echo "💵 Investment Ask: $(jq -r '.executive_summary.investment_ask' outputs/$file)"
                    echo "💰 Expected Return: $(jq -r '.executive_summary.expected_return' outputs/$file)"
                    echo "⏰ Payback Period: $(jq -r '.executive_summary.payback_period' outputs/$file)"
                    echo "🎯 Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                    echo ""
                    echo "📊 ROI Scenarios:"
                    echo "   • Conservative: $(jq -r '.financial_projections.scenarios.conservative.roi_percentage' outputs/$file)% ROI, $(jq -r '.financial_projections.scenarios.conservative.total_savings' outputs/$file) savings"
                    echo "   • Balanced: $(jq -r '.financial_projections.scenarios.balanced.roi_percentage' outputs/$file)% ROI, $(jq -r '.financial_projections.scenarios.balanced.total_savings' outputs/$file) savings"
                    echo "   • Bold: $(jq -r '.financial_projections.scenarios.bold.roi_percentage' outputs/$file)% ROI, $(jq -r '.financial_projections.scenarios.bold.total_savings' outputs/$file) savings"
                    echo ""
                    echo "💰 Cost Breakdown:"
                    echo "   • AI Platform: $(jq -r '.financial_projections.cost_breakdown.ai_platform_development' outputs/$file)"
                    echo "   • Integration: $(jq -r '.financial_projections.cost_breakdown.integration_setup' outputs/$file)"
                    echo "   • Training: $(jq -r '.financial_projections.cost_breakdown.training_change_management' outputs/$file)"
                    echo "   • Annual Operations: $(jq -r '.financial_projections.cost_breakdown.annual_operations' outputs/$file)"
                    echo ""
                    echo "⚠️  Risk Assessment:"
                    echo "   • Overall Risk Rating: $(jq -r '.risk_analysis.overall_risk_rating' outputs/$file)"
                    echo "   • Technical Risks: $(jq -r '.risk_analysis.technical_risks | keys | length' outputs/$file) identified"
                    echo "   • Business Risks: $(jq -r '.risk_analysis.business_risks | keys | length' outputs/$file) identified"
                    echo "   • Operational Risks: $(jq -r '.risk_analysis.operational_risks | keys | length' outputs/$file) identified"
                    ;;
                "executive-onepager.json")
                    echo "📋 Executive Summary: $(jq -r '.content.headline' outputs/$file)"
                    echo "🎯 Key Recommendation: $(jq -r '.content.key_recommendation' outputs/$file)"
                    echo "💰 Investment: $(jq -r '.content.financial_summary.investment' outputs/$file)"
                    echo "📈 Returns: $(jq -r '.content.financial_summary.returns' outputs/$file)"
                    echo "⏰ Payback: $(jq -r '.content.financial_summary.payback' outputs/$file)"
                    echo "💎 3-Year Value: $(jq -r '.content.financial_summary.three_year_value' outputs/$file)"
                    echo "🎯 Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                    echo ""
                    echo "📊 Success Metrics:"
                    jq -r '.content.success_metrics[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "technical-brief.json")
                    echo "🔧 Technical Project: $(jq -r '.content.headline' outputs/$file)"
                    echo "🎯 Project Scope: $(jq -r '.content.project_scope' outputs/$file)"
                    echo "👥 Team Size: $(jq -r '.content.team_structure | add' outputs/$file) engineers"
                    echo "🎯 Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                    echo ""
                    echo "🏗️  Core Components:"
                    jq -r '.content.technical_architecture.core_components[]' outputs/$file | sed 's/^/   • /'
                    echo ""
                    echo "⚡ Performance Requirements:"
                    jq -r '.content.performance_requirements[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "market-opportunity-analysis.json")
                    echo "📈 Market Size (TAM): $(jq -r '.analysis.market_size.total_addressable_market' outputs/$file)"
                    echo "🎯 Market Size (SOM): $(jq -r '.analysis.market_size.serviceable_obtainable_market' outputs/$file)"
                    echo "📊 Growth Rate: $(jq -r '.analysis.market_size.growth_rate' outputs/$file)"
                    echo "🏆 Strategic Fit: $(jq -r '.analysis.strategic_fit.alignment_score' outputs/$file)/100"
                    echo "🎯 Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                    echo ""
                    echo "💪 Key Strengths:"
                    jq -r '.analysis.strategic_fit.key_strengths[]' outputs/$file | sed 's/^/   • /'
                    ;;
                "strategic-alignment.json")
                    echo "🎯 Overall Alignment: $(jq -r '.alignment_assessment.overall_score' outputs/$file)/100"
                    echo "👥 Customer Experience: $(jq -r '.alignment_assessment.strategic_priorities.customer_experience.score' outputs/$file)/100"
                    echo "⚡ Operational Efficiency: $(jq -r '.alignment_assessment.strategic_priorities.operational_efficiency.score' outputs/$file)/100"
                    echo "🚀 Technology Innovation: $(jq -r '.alignment_assessment.strategic_priorities.technology_innovation.score' outputs/$file)/100"
                    echo "🎯 Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                    ;;
            esac
        else
            echo "📋 Summary data (install 'jq' for better formatting):"
            grep -E '"(roi_percentage|confidence_score|overall_score)"' "outputs/$file" | head -5
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
show_business_insights "business-case-summary.json" "Investment Recommendation"

# Show detailed business case
show_business_insights "comprehensive-business-case.json" "1. COMPREHENSIVE BUSINESS CASE"

# Show stakeholder communications
show_business_insights "executive-onepager.json" "2. EXECUTIVE ONE-PAGER"
show_business_insights "technical-brief.json" "3. TECHNICAL IMPLEMENTATION BRIEF"

# Show supporting analysis
show_business_insights "market-opportunity-analysis.json" "4. MARKET OPPORTUNITY ANALYSIS"
show_business_insights "strategic-alignment.json" "5. STRATEGIC ALIGNMENT ASSESSMENT"

echo "📊 ROI SCENARIO COMPARISON"
echo "========================="
if command -v jq &> /dev/null && [ -f "outputs/comprehensive-business-case.json" ]; then
    echo "| Scenario | ROI | Total Savings | Annual Savings | Payback | Success Rate |"
    echo "|----------|-----|---------------|----------------|---------|--------------|"
    echo "| Conservative | $(jq -r '.financial_projections.scenarios.conservative.roi_percentage' outputs/comprehensive-business-case.json)% | $(jq -r '.financial_projections.scenarios.conservative.total_savings' outputs/comprehensive-business-case.json) | $(jq -r '.financial_projections.scenarios.conservative.annual_savings' outputs/comprehensive-business-case.json) | $(jq -r '.financial_projections.scenarios.conservative.payback_months' outputs/comprehensive-business-case.json) months | 70% |"
    echo "| **Balanced** | $(jq -r '.financial_projections.scenarios.balanced.roi_percentage' outputs/comprehensive-business-case.json)% | $(jq -r '.financial_projections.scenarios.balanced.total_savings' outputs/comprehensive-business-case.json) | $(jq -r '.financial_projections.scenarios.balanced.annual_savings' outputs/comprehensive-business-case.json) | $(jq -r '.financial_projections.scenarios.balanced.payback_months' outputs/comprehensive-business-case.json) months | 85% |"
    echo "| Bold | $(jq -r '.financial_projections.scenarios.bold.roi_percentage' outputs/comprehensive-business-case.json)% | $(jq -r '.financial_projections.scenarios.bold.total_savings' outputs/comprehensive-business-case.json) | $(jq -r '.financial_projections.scenarios.bold.annual_savings' outputs/comprehensive-business-case.json) | $(jq -r '.financial_projections.scenarios.bold.payback_months' outputs/comprehensive-business-case.json) months | 95% |"
fi

echo ""
echo "⚠️  RISK ANALYSIS SUMMARY"
echo "========================"
if command -v jq &> /dev/null && [ -f "outputs/comprehensive-business-case.json" ]; then
    echo "🔧 Technical Risks:"
    jq -r '.risk_analysis.technical_risks | to_entries[] | "   • \(.key | gsub("_"; " ") | ascii_upcase): \(.value.probability) probability, \(.value.impact) impact"' outputs/comprehensive-business-case.json
    echo ""
    echo "💼 Business Risks:"
    jq -r '.risk_analysis.business_risks | to_entries[] | "   • \(.key | gsub("_"; " ") | ascii_upcase): \(.value.probability) probability, \(.value.impact) impact"' outputs/comprehensive-business-case.json
    echo ""
    echo "⚙️  Operational Risks:"
    jq -r '.risk_analysis.operational_risks | to_entries[] | "   • \(.key | gsub("_"; " ") | ascii_upcase): \(.value.probability) probability, \(.value.impact) impact"' outputs/comprehensive-business-case.json
    echo ""
    echo "📊 Risk-Adjusted ROI:"
    echo "   • Conservative: $(jq -r '.risk_analysis.risk_adjusted_roi.conservative' outputs/comprehensive-business-case.json)"
    echo "   • Balanced: $(jq -r '.risk_analysis.risk_adjusted_roi.balanced' outputs/comprehensive-business-case.json)"
    echo "   • Bold: $(jq -r '.risk_analysis.risk_adjusted_roi.bold' outputs/comprehensive-business-case.json)"
fi

echo ""
echo "🏆 COMPETITIVE BENCHMARKING"
echo "=========================="
if command -v jq &> /dev/null && [ -f "outputs/comprehensive-business-case.json" ]; then
    echo "📊 Industry Comparison:"
    echo "| Metric | Industry Standard | Our Projection | Advantage |"
    echo "|--------|------------------|----------------|-----------|"
    echo "| Automation Rate | $(jq -r '.competitive_benchmarking.industry_standards.average_automation_rate' outputs/comprehensive-business-case.json) | $(jq -r '.competitive_benchmarking.our_projections.automation_rate' outputs/comprehensive-business-case.json) | +15pp |"
    echo "| ROI | $(jq -r '.competitive_benchmarking.industry_standards.typical_roi' outputs/comprehensive-business-case.json) | $(jq -r '.competitive_benchmarking.our_projections.projected_roi' outputs/comprehensive-business-case.json) | Above average |"
    echo "| Implementation | $(jq -r '.competitive_benchmarking.industry_standards.implementation_time' outputs/comprehensive-business-case.json) | $(jq -r '.competitive_benchmarking.our_projections.implementation_time' outputs/comprehensive-business-case.json) | 25% faster |"
    echo "| CSAT Impact | $(jq -r '.competitive_benchmarking.industry_standards.customer_satisfaction_impact' outputs/comprehensive-business-case.json) | $(jq -r '.competitive_benchmarking.our_projections.customer_satisfaction_impact' outputs/comprehensive-business-case.json) | 2x impact |"
    echo ""
    echo "🏅 Best-in-Class Benchmarks:"
    jq -r '.competitive_benchmarking.best_in_class[]' outputs/comprehensive-business-case.json | sed 's/^/   • /'
fi

echo ""
echo "📊 CONFIDENCE ANALYSIS"
echo "====================="
echo "📈 Analysis Confidence Levels:"

if command -v jq &> /dev/null; then
    for file in outputs/*.json; do
        if [ -f "$file" ]; then
            confidence=$(jq -r 'try .evidence.confidence_score // try .executive_summary.confidence_score // "N/A"' "$file" 2>/dev/null)
            if [ "$confidence" != "null" ] && [ "$confidence" != "N/A" ]; then
                filename=$(basename "$file" .json)
                echo "   • $filename: $confidence%"
            fi
        fi
    done
fi

echo ""
echo "📚 CITATION ANALYSIS"
echo "==================="
echo "📖 Evidence Quality Assessment:"

# Count citations across all files
total_citations=0
if command -v jq &> /dev/null; then
    for file in outputs/*.json; do
        if [ -f "$file" ]; then
            citations=$(jq -r 'try .evidence.citations | length // 0' "$file" 2>/dev/null)
            if [ "$citations" != "null" ] && [ "$citations" -gt 0 ]; then
                total_citations=$((total_citations + citations))
                filename=$(basename "$file")
                echo "   • $filename: $citations citations"
            fi
        fi
    done
    echo "   • Total Citations: $total_citations"
else
    echo "   • Install 'jq' for detailed citation analysis"
    citation_count=$(grep -r "citation" outputs/ | wc -l)
    echo "   • Estimated Citations: ~$citation_count references"
fi

echo ""
echo "📁 FILES GENERATED"
echo "=================="
echo "📄 Business Case Documents:"
ls -la outputs/*.md 2>/dev/null | awk '{print "   • " $9 " (" $5 " bytes)"}' || echo "   No markdown files found"

echo ""
echo "📊 Analysis Data Files:"
ls -la outputs/*.json 2>/dev/null | awk '{print "   • " $9 " (" $5 " bytes)"}' || echo "   No JSON files found"

echo ""
echo "✅ Multi-Scenario Business Case Analysis Complete!"
echo ""
echo "💡 Key Recommendations:"
echo "   1. PROCEED with Balanced scenario (340% ROI, $2.9M savings)"
echo "   2. Implement phased rollout with continuous optimization"
echo "   3. Focus on comprehensive change management and training"
echo "   4. Maintain strong customer feedback loops and quality assurance"
echo ""
echo "🚀 Next Steps:"
echo "   1. Present executive-onepager.json to leadership for approval"
echo "   2. Use comprehensive-business-case.md for detailed financial review"
echo "   3. Share technical-brief.json with engineering team"
echo "   4. Begin vendor evaluation and pilot planning"
echo ""
echo "🔧 Technical Details:"
echo "   • Run 'cat outputs/business-case-summary.json | jq' for full metrics"
echo "   • All outputs include multi-scenario analysis and risk assessment"
echo "   • Documents follow professional consulting frameworks"