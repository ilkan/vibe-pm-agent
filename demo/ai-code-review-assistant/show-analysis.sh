#!/bin/bash

# AI Code Review Assistant - Analysis Results Viewer
# This script displays all generated PM analysis documents

echo "🎯 AI Code Review Assistant - Complete PM Analysis Results"
echo "=========================================================="
echo ""

# Check if outputs directory exists
if [ ! -d "outputs" ]; then
    echo "❌ No outputs directory found. Run the demo first:"
    echo "   node run-complete-workflow.js"
    exit 1
fi

# Function to display file with header
show_file() {
    local file=$1
    local title=$2
    
    if [ -f "outputs/$file" ]; then
        echo "📄 $title"
        echo "$(printf '=%.0s' {1..60})"
        if [[ $file == *.md ]]; then
            cat "outputs/$file"
        else
            echo "📊 Key Metrics from $file:"
            if command -v jq &> /dev/null; then
                # Use jq for pretty JSON formatting if available
                case $file in
                    "workflow-summary.json")
                        echo "Business Recommendation: $(jq -r '.key_findings.business_opportunity.recommendation' outputs/$file)"
                        echo "ROI (Balanced): $(jq -r '.key_findings.financial_case.roi_balanced' outputs/$file)"
                        echo "Strategic Alignment: $(jq -r '.key_findings.strategic_alignment.overall_score' outputs/$file)/100"
                        echo "Market Timing: $(jq -r '.key_findings.market_timing.recommendation' outputs/$file)"
                        echo "Average Confidence: $(jq -r '.average_confidence' outputs/$file)%"
                        echo "Total Citations: $(jq -r '.total_citations' outputs/$file)"
                        ;;
                    "strategic-alignment.json")
                        echo "Overall Alignment Score: $(jq -r '.alignment_assessment.overall_score' outputs/$file)/100"
                        echo "Mission Alignment: $(jq -r '.alignment_assessment.mission_alignment.score' outputs/$file)/100"
                        echo "Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                        ;;
                    "market-timing.json")
                        echo "Recommendation: $(jq -r '.timing_assessment.overall_recommendation' outputs/$file)"
                        echo "Competitive Window: $(jq -r '.timing_assessment.competitive_window.first_mover_advantage' outputs/$file)"
                        echo "Confidence: $(jq -r '.timing_assessment.confidence_score' outputs/$file)%"
                        ;;
                    "resource-optimization.json")
                        echo "Recommended Team Size: $(jq -r '.optimization_analysis.recommended_team_structure.total_team_size' outputs/$file)"
                        echo "Optimized Cost: $(jq -r '.optimization_analysis.resource_constraints.budget_optimization.optimized_estimate' outputs/$file)"
                        echo "Confidence: $(jq -r '.evidence.confidence_score' outputs/$file)%"
                        ;;
                esac
            else
                # Fallback to basic grep if jq not available
                echo "📋 Summary data (install 'jq' for better formatting):"
                grep -E '"(recommendation|confidence_score|overall_score)"' "outputs/$file" | head -5
            fi
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
if [ -f "outputs/workflow-summary.json" ]; then
    if command -v jq &> /dev/null; then
        echo "📊 Key Findings:"
        echo "   • Business Decision: $(jq -r '.key_findings.business_opportunity.recommendation' outputs/workflow-summary.json)"
        echo "   • ROI (Balanced): $(jq -r '.key_findings.financial_case.roi_balanced' outputs/workflow-summary.json)"
        echo "   • Payback Period: $(jq -r '.key_findings.financial_case.payback_period' outputs/workflow-summary.json)"
        echo "   • Strategic Alignment: $(jq -r '.key_findings.strategic_alignment.overall_score' outputs/workflow-summary.json)/100"
        echo "   • Market Timing: $(jq -r '.key_findings.market_timing.recommendation' outputs/workflow-summary.json)"
        echo "   • Average Confidence: $(jq -r '.average_confidence' outputs/workflow-summary.json)%"
        echo "   • Total Citations: $(jq -r '.total_citations' outputs/workflow-summary.json)"
        echo ""
    fi
fi

# Show main documents
show_file "business-opportunity-analysis.md" "1. BUSINESS OPPORTUNITY ANALYSIS"
show_file "business-case.md" "2. COMPREHENSIVE BUSINESS CASE"
show_file "executive-onepager.md" "3. EXECUTIVE ONE-PAGER"

# Show supporting analysis
show_file "strategic-alignment.json" "4. STRATEGIC ALIGNMENT ASSESSMENT"
show_file "market-timing.json" "5. MARKET TIMING VALIDATION"
show_file "resource-optimization.json" "6. RESOURCE OPTIMIZATION ANALYSIS"

# Show workflow summary
show_file "workflow-summary.json" "7. WORKFLOW SUMMARY & METRICS"

echo "🎯 CITATION ANALYSIS"
echo "==================="
echo "📚 Evidence Quality Assessment:"

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
echo "🔍 CONFIDENCE SCORING"
echo "===================="
echo "📊 Analysis Confidence Levels:"

if command -v jq &> /dev/null; then
    for file in outputs/*.json; do
        if [ -f "$file" ]; then
            confidence=$(jq -r 'try .evidence.confidence_score // try .timing_assessment.confidence_score // try .alignment_assessment.overall_score // "N/A"' "$file" 2>/dev/null)
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
echo "📄 Markdown Documents (Human-Readable):"
ls -la outputs/*.md 2>/dev/null | awk '{print "   • " $9 " (" $5 " bytes)"}' || echo "   No markdown files found"

echo ""
echo "📊 JSON Data Files (Machine-Readable):"
ls -la outputs/*.json 2>/dev/null | awk '{print "   • " $9 " (" $5 " bytes)"}' || echo "   No JSON files found"

echo ""
echo "✅ Analysis Complete!"
echo ""
echo "💡 Next Steps:"
echo "   1. Review executive-onepager.md for management presentation"
echo "   2. Use business-case.md for detailed financial analysis"
echo "   3. Reference strategic-alignment.json for OKR mapping"
echo "   4. Check market-timing.json for competitive positioning"
echo ""
echo "🔧 Technical Details:"
echo "   • Run 'cat outputs/workflow-summary.json | jq' for full metrics"
echo "   • All outputs include confidence scores and citations"
echo "   • Documents follow professional PM frameworks (MECE, Pyramid Principle)"