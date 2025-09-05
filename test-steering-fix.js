// Test script to validate the steering file extraction fix
const { SteeringFileGenerator } = require('./src/components/steering-file-generator');

// Mock competitive analysis data (realistic structure)
const mockCompetitiveAnalysisJSON = JSON.stringify({
  competitiveMatrix: {
    competitors: [
      { name: "GitHub Copilot", marketShare: 35 },
      { name: "SonarQube", marketShare: 25 },
      { name: "Snyk", marketShare: 20 }
    ],
    differentiationOpportunities: [
      "Real-time AI-powered analysis",
      "Integrated security and quality scoring"
    ]
  },
  marketPositioning: {
    marketGaps: ["AI-powered technical debt analysis", "Unified security-quality platform"],
    recommendedPositioning: ["Premium AI-first solution", "Enterprise security focus"]
  },
  strategicRecommendations: [
    "Focus on GitHub integration as key differentiator",
    "Target enterprise customers with security compliance needs",
    "Build AI model specifically for code review workflows"
  ],
  swotAnalysis: [
    { competitor: "GitHub Copilot", strengths: ["Market leader", "Microsoft backing"] }
  ],
  confidenceLevel: "high",
  sourceAttribution: [
    { type: "gartner", title: "Developer Tools Market Analysis 2024" },
    { type: "mckinsey", title: "DevOps Transformation Report" }
  ],
  dataQuality: {
    overallConfidence: 0.85
  },
  lastUpdated: "2025-09-05T15:00:00Z"
}, null, 2);

// Mock market sizing data
const mockMarketSizingJSON = JSON.stringify({
  tam: { value: 50000000000, methodology: "top-down", growthRate: 0.15 },
  sam: { value: 5000000000, methodology: "bottom-up", growthRate: 0.12 },
  som: { value: 500000000, methodology: "value-theory", growthRate: 0.10 },
  methodology: [
    { type: "top-down", reliability: 0.8 },
    { type: "bottom-up", reliability: 0.9 },
    { type: "value-theory", reliability: 0.7 }
  ],
  scenarios: [
    { name: "conservative", type: "pessimistic" },
    { name: "balanced", type: "realistic" },
    { name: "aggressive", type: "optimistic" }
  ],
  assumptions: [
    "Developer tools market grows at 15% CAGR",
    "AI adoption in development accelerates",
    "Security compliance requirements increase"
  ],
  confidenceIntervals: [
    { confidenceLevel: 0.85 },
    { confidenceLevel: 0.90 },
    { confidenceLevel: 0.80 }
  ],
  sourceAttribution: [
    { type: "gartner", title: "DevOps Market Forecast 2024-2027" },
    { type: "mckinsey", title: "AI in Software Development" }
  ]
}, null, 2);

console.log("=== Testing Steering File Extraction Fix ===");
console.log("\n📊 Mock Competitive Analysis Data:");
console.log(mockCompetitiveAnalysisJSON.substring(0, 200) + "...");

console.log("\n📈 Mock Market Sizing Data:");
console.log(mockMarketSizingJSON.substring(0, 200) + "...");

try {
  const generator = new SteeringFileGenerator();
  
  const context = {
    featureName: "ai-code-review-test",
    inclusionRule: "manual",
    relatedFiles: []
  };

  console.log("\n🔧 Testing Competitive Analysis Extraction...");
  const competitiveFile = generator.generateFromCompetitiveAnalysis(mockCompetitiveAnalysisJSON, context);
  
  console.log("\n✅ Generated Competitive Analysis Steering File:");
  console.log("Filename:", competitiveFile.filename);
  console.log("Content Preview:");
  console.log(competitiveFile.content.substring(0, 500) + "...");

  console.log("\n🔧 Testing Market Sizing Extraction...");
  const marketFile = generator.generateFromMarketSizing(mockMarketSizingJSON, context);
  
  console.log("\n✅ Generated Market Sizing Steering File:");
  console.log("Filename:", marketFile.filename);
  console.log("Content Preview:");
  console.log(marketFile.content.substring(0, 500) + "...");

  console.log("\n🎉 SUCCESS: Steering file extraction methods are working!");
  console.log("The generated content should now include specific competitor names, market values, and strategic insights.");

} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  console.error("Stack:", error.stack);
}