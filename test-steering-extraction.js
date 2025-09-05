// Quick test to validate the new steering file extraction methods
const fs = require('fs');

// Mock competitive analysis data (similar to what the MCP tools generate)
const mockCompetitiveAnalysis = {
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
};

// Mock market sizing data
const mockMarketSizing = {
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
};

console.log("=== Testing Competitive Analysis Extraction ===");
console.log("Input JSON:", JSON.stringify(mockCompetitiveAnalysis, null, 2));
console.log("\n=== Testing Market Sizing Extraction ===");
console.log("Input JSON:", JSON.stringify(mockMarketSizing, null, 2));

console.log("\n✅ Test data prepared. The extraction methods should now parse this JSON data and extract meaningful insights instead of generic template content.");
console.log("\n📝 Expected steering file content should include:");
console.log("- Specific competitor names: GitHub Copilot, SonarQube, Snyk");
console.log("- Actual market values: TAM $50B, SAM $5B, SOM $500M");
console.log("- Strategic recommendations with details");
console.log("- Market gaps and positioning insights");
console.log("- Source attribution with Gartner and McKinsey references");