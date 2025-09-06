#!/bin/bash

# Show Analysis Results - AI Code Review Assistant Demo
# Displays the generated PM analysis documents in a readable format

set -e

echo "🎯 AI Code Review Assistant - PM Analysis Results"
echo "=================================================="
echo ""

# Check if outputs directory exists
if [ ! -d "outputs" ]; then
    echo "❌ No outputs directory found. Please run the demo first:"
    echo "   node run-complete-workflow.js"
    exit 1
fi

# Function to display file with header
show_file() {
    local file=$1
    local title=$2
    
    if [ -f "outputs/$file" ]; then
        echo "📊 $title"
        echo "$(printf '=%.0s' {1..50})"
        echo ""
        head -30 "outputs/$file"
        echo ""
        echo "... (showing first 30 lines)"
        echo ""
        echo "📄 Full document: outputs/$file"
        echo ""
    else
        echo "❌ File not found: outputs/$file"
        echo ""
    fi
}

# Display executive summary first
if [ -f "outputs/executive-summary.md" ]; then
    echo "🎯 EXECUTIVE SUMMARY"
    echo "$(printf '=%.0s' {1..60})"
    echo ""
    cat "outputs/executive-summary.md"
    echo ""
    echo "$(printf '=%.0s' {1..60})"
    echo ""
fi

# Show individual analyses
show_file "opportunity-analysis.md" "Business Opportunity Analysis"
show_file "business-case-analysis.md" "Business Case & ROI Analysis" 
show_file "communication-analysis.md" "Executive Communication"
show_file "timing-analysis.md" "Market Timing Validation"
show_file "alignment-analysis.md" "Strategic Alignment Assessment"
show_file "optimization-analysis.md" "Resource Optimization"

# Show file statistics
echo "📈 Analysis Statistics"
echo "====================="
echo ""
echo "Generated Documents:"
ls -la outputs/ | grep -E '\.(md|txt)$' | wc -l | xargs echo "  • Total files:"
echo ""

echo "Document Sizes:"
for file in outputs/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        lines=$(wc -l < "$file")
        words=$(wc -w < "$file")
        echo "  • $filename: $lines lines, $words words"
    fi
done
echo ""

echo "Key Metrics Summary:"
if [ -f "outputs/executive-summary.md" ]; then
    echo "  • ROI: $(grep -o '[0-9]\+%' outputs/executive-summary.md | head -1 || echo 'N/A')"
    echo "  • Payback Period: $(grep -o '[0-9]\+ months' outputs/executive-summary.md | head -1 || echo 'N/A')"
    echo "  • Market Timing Score: $(grep -o '[0-9]\+/10' outputs/executive-summary.md | head -1 || echo 'N/A')"
    echo "  • Strategic Alignment: $(grep -o '[0-9]\+/10' outputs/executive-summary.md | tail -1 || echo 'N/A')"
fi
echo ""

echo "💡 Key Insights:"
echo "  • Complete PM workflow from opportunity to execution plan"
echo "  • All analyses backed by authoritative sources (McKinsey, Gartner, BCG)"
echo "  • Executive-ready documents suitable for board presentations"
echo "  • Strong business case with quantified ROI and risk mitigation"
echo "  • Optimal market timing with strategic alignment validation"
echo ""

echo "🔄 Next Steps:"
echo "  1. Review detailed analyses in outputs/ directory"
echo "  2. Use executive-summary.md for stakeholder presentations"
echo "  3. Proceed to Kiro Spec Mode for technical requirements"
echo "  4. Use Kiro Vibe Mode for implementation"
echo ""

echo "📚 PM Mode Benefits Demonstrated:"
echo "  • Strategic WHY analysis before technical WHAT/HOW"
echo "  • Professional consulting-grade business documentation"
echo "  • Risk-assessed investment recommendations"
echo "  • Market-validated timing and competitive positioning"
echo "  • Resource-optimized implementation planning"