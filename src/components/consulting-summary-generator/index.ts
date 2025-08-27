import {
  ConsultingSummary,
  ConsultingTechnique,
  TechniqueInsight,
  StructuredRecommendation,
  Evidence,
  MECEAnalysis,
  ValueDriverAnalysis,
  ZeroBasedSolution,
  ThreeOptionAnalysis,
  PrioritizedOptimizations,
  ValueProposition
} from '../../models/consulting';
import { ConsultingAnalysis } from '../business-analyzer';



export interface AnalysisFindings {
  primaryFindings: string[];
  supportingData: any[];
  recommendations: string[];
  evidence: Evidence[];
}

export interface ExecutiveSummary {
  overview: string;
  keyRecommendation: string;
  expectedImpact: string;
  nextSteps: string[];
}

/**
 * Consulting Summary Generator component that creates professional consulting-style
 * analysis and recommendations using the Pyramid Principle structure.
 */
export class ConsultingSummaryGenerator {
  
  /**
   * Generates a comprehensive consulting summary from analysis results
   * using the Pyramid Principle structure (answer first, then reasons, then evidence)
   */
  generateConsultingSummary(
    analysis: ConsultingAnalysis, 
    techniques: ConsultingTechnique[]
  ): ConsultingSummary {
    // Apply Pyramid Principle to structure the findings
    const findings = this.extractAnalysisFindings(analysis);
    const structuredRecommendations = this.applyPyramidPrinciple(findings);
    
    // Format technique-specific insights
    const techniqueInsights = techniques.map(technique => 
      this.formatTechniqueInsights(technique, analysis)
    );
    
    // Create executive summary
    const executiveSummary = this.createExecutiveSummary(analysis, structuredRecommendations);
    
    // Compile supporting evidence
    const supportingEvidence = this.compileSupportingEvidence(analysis, findings);
    
    return {
      executiveSummary: executiveSummary.overview,
      keyFindings: findings.primaryFindings,
      recommendations: structuredRecommendations,
      techniquesApplied: techniqueInsights,
      supportingEvidence
    };
  }

  /**
   * Applies the Pyramid Principle to structure recommendations
   * (answer first, then reasons, then evidence)
   */
  applyPyramidPrinciple(findings: AnalysisFindings): StructuredRecommendation[] {
    return findings.recommendations.map((recommendation, index) => {
      // Main recommendation (the "answer")
      const mainRecommendation = recommendation;
      
      // Supporting reasons (the "why")
      const supportingReasons = this.extractSupportingReasons(
        recommendation, 
        findings.primaryFindings
      );
      
      // Evidence (the "proof")
      const evidence = findings.evidence.filter(e => 
        e.description.toLowerCase().includes(recommendation.toLowerCase().split(' ')[0])
      );
      
      // Expected outcome
      const expectedOutcome = this.generateExpectedOutcome(recommendation, findings.supportingData[index]);
      
      return {
        mainRecommendation,
        supportingReasons,
        evidence,
        expectedOutcome
      };
    });
  }

  /**
   * Formats insights from specific consulting techniques
   */
  formatTechniqueInsights(technique: ConsultingTechnique, analysis: ConsultingAnalysis): TechniqueInsight {
    let keyInsight = '';
    let supportingData: any = {};
    let actionableRecommendation = '';

    switch (technique.name) {
      case 'MECE':
        if (analysis.meceAnalysis) {
          keyInsight = `Identified ${analysis.meceAnalysis.categories.length} mutually exclusive quota driver categories with ${analysis.meceAnalysis.totalCoverage}% coverage`;
          supportingData = analysis.meceAnalysis;
          actionableRecommendation = `Focus optimization efforts on the ${analysis.meceAnalysis.categories
            .sort((a, b) => b.optimizationPotential - a.optimizationPotential)[0]?.name} category for maximum impact`;
        }
        break;
        
      case 'ValueDriverTree':
        if (analysis.valueDriverAnalysis) {
          const topDriver = analysis.valueDriverAnalysis.primaryDrivers
            .sort((a, b) => b.savingsPotential - a.savingsPotential)[0];
          keyInsight = `Primary value driver "${topDriver?.name}" offers ${topDriver?.savingsPotential}% savings potential`;
          supportingData = analysis.valueDriverAnalysis;
          actionableRecommendation = `Prioritize optimizing ${topDriver?.name} to achieve ${topDriver?.savingsPotential}% quota reduction`;
        }
        break;
        
      case 'ZeroBased':
        if (analysis.zeroBasedSolution) {
          keyInsight = `Zero-based redesign challenges ${analysis.zeroBasedSolution.assumptionsChallenged.length} assumptions and offers ${analysis.zeroBasedSolution.potentialSavings}% savings`;
          supportingData = analysis.zeroBasedSolution;
          actionableRecommendation = `Consider implementing the radical approach: "${analysis.zeroBasedSolution.radicalApproach}" despite ${analysis.zeroBasedSolution.implementationRisk} implementation risk`;
        }
        break;
        
      case 'OptionFraming':
        if (analysis.threeOptionAnalysis) {
          keyInsight = `Three-option analysis reveals Conservative (${analysis.threeOptionAnalysis.conservative.quotaSavings}%), Balanced (${analysis.threeOptionAnalysis.balanced.quotaSavings}%), and Bold (${analysis.threeOptionAnalysis.bold.quotaSavings}%) approaches`;
          supportingData = analysis.threeOptionAnalysis;
          actionableRecommendation = `Recommend ${this.selectBestOption(analysis.threeOptionAnalysis)} approach based on risk-reward profile`;
        }
        break;
        
      case 'ImpactEffort':
        if (analysis.prioritizedOptimizations) {
          const quickWins = analysis.prioritizedOptimizations.highImpactLowEffort.length;
          keyInsight = `Impact-Effort analysis identified ${quickWins} high-impact, low-effort quick wins`;
          supportingData = analysis.prioritizedOptimizations;
          actionableRecommendation = `Start with ${quickWins} quick wins to build momentum before tackling high-effort optimizations`;
        }
        break;
        
      case 'ValueProp':
        if (analysis.valueProposition) {
          keyInsight = `Value proposition addresses ${analysis.valueProposition.painPoints.length} pain points and creates ${analysis.valueProposition.gainCreators.length} value drivers`;
          supportingData = analysis.valueProposition;
          actionableRecommendation = `Focus on pain relievers: ${analysis.valueProposition.painRelievers.slice(0, 2).join(', ')} for immediate user value`;
        }
        break;
        
      default:
        keyInsight = `Applied ${technique.name} technique with ${technique.relevanceScore} relevance score`;
        supportingData = { relevanceScore: technique.relevanceScore };
        actionableRecommendation = 'Review technique-specific recommendations in detailed analysis';
    }

    return {
      techniqueName: technique.name,
      keyInsight,
      supportingData,
      actionableRecommendation
    };
  }

  /**
   * Creates an executive summary providing high-level overview
   */
  createExecutiveSummary(
    analysis: ConsultingAnalysis, 
    recommendations: StructuredRecommendation[]
  ): ExecutiveSummary {
    const primaryRecommendation = recommendations[0]?.mainRecommendation || 'No specific recommendations available';
    
    const overview = `Analysis using ${analysis.techniquesUsed.length} consulting techniques (${analysis.techniquesUsed.map(t => t.name).join(', ')}) reveals significant optimization opportunities with ${analysis.totalQuotaSavings}% potential quota savings.`;
    
    const expectedImpact = `Implementation of recommended optimizations will reduce quota consumption by ${analysis.totalQuotaSavings}% while maintaining full functionality. ${analysis.implementationComplexity === 'low' ? 'Low implementation complexity ensures rapid deployment.' : analysis.implementationComplexity === 'medium' ? 'Moderate implementation complexity requires careful planning.' : 'High implementation complexity demands phased rollout approach.'}`;
    
    const nextSteps = [
      'Review detailed technique-specific insights',
      'Prioritize recommendations based on impact-effort analysis',
      'Begin implementation with highest-ROI optimizations',
      'Monitor quota consumption improvements',
      'Iterate based on performance metrics'
    ];

    return {
      overview,
      keyRecommendation: primaryRecommendation,
      expectedImpact,
      nextSteps
    };
  }

  /**
   * Extracts analysis findings from the consulting analysis
   */
  private extractAnalysisFindings(analysis: ConsultingAnalysis): AnalysisFindings {
    const primaryFindings = analysis.keyFindings;
    
    const supportingData = [
      analysis.meceAnalysis,
      analysis.valueDriverAnalysis,
      analysis.zeroBasedSolution,
      analysis.threeOptionAnalysis,
      analysis.prioritizedOptimizations,
      analysis.valueProposition
    ].filter(Boolean);
    
    const recommendations = this.generateRecommendationsFromAnalysis(analysis);
    
    const evidence = this.generateEvidenceFromAnalysis(analysis);
    
    return {
      primaryFindings,
      supportingData,
      recommendations,
      evidence
    };
  }

  /**
   * Generates recommendations based on analysis results
   */
  private generateRecommendationsFromAnalysis(analysis: ConsultingAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Add MECE-based recommendations
    if (analysis.meceAnalysis) {
      const topCategory = analysis.meceAnalysis.categories
        .sort((a, b) => b.optimizationPotential - a.optimizationPotential)[0];
      if (topCategory) {
        recommendations.push(`Optimize ${topCategory.name} category to achieve ${topCategory.optimizationPotential}% quota reduction`);
      }
    }
    
    // Add Value Driver recommendations
    if (analysis.valueDriverAnalysis) {
      const topDriver = analysis.valueDriverAnalysis.primaryDrivers
        .sort((a, b) => b.savingsPotential - a.savingsPotential)[0];
      if (topDriver) {
        recommendations.push(`Focus on ${topDriver.name} optimization for ${topDriver.savingsPotential}% savings`);
      }
    }
    
    // Add Zero-Based recommendations
    if (analysis.zeroBasedSolution) {
      recommendations.push(`Consider radical redesign: ${analysis.zeroBasedSolution.radicalApproach}`);
    }
    
    // Add general optimization recommendation
    recommendations.push(`Implement comprehensive optimization strategy to achieve ${analysis.totalQuotaSavings}% quota savings`);
    
    return recommendations;
  }

  /**
   * Generates evidence from analysis results
   */
  private generateEvidenceFromAnalysis(analysis: ConsultingAnalysis): Evidence[] {
    const evidence: Evidence[] = [];
    
    // Quantitative evidence from quota savings
    evidence.push({
      type: 'quantitative',
      description: `Total quota savings potential: ${analysis.totalQuotaSavings}%`,
      source: 'Quota forecasting analysis',
      confidence: 'high'
    });
    
    // Evidence from techniques used
    analysis.techniquesUsed.forEach(technique => {
      evidence.push({
        type: 'qualitative',
        description: `${technique.name} technique applied with ${technique.relevanceScore} relevance score`,
        source: 'Business analysis framework',
        confidence: technique.relevanceScore > 0.7 ? 'high' : technique.relevanceScore > 0.4 ? 'medium' : 'low'
      });
    });
    
    // Evidence from MECE analysis
    if (analysis.meceAnalysis) {
      evidence.push({
        type: 'quantitative',
        description: `MECE analysis achieved ${analysis.meceAnalysis.totalCoverage}% coverage across ${analysis.meceAnalysis.categories.length} categories`,
        source: 'MECE framework analysis',
        confidence: analysis.meceAnalysis.totalCoverage > 90 ? 'high' : 'medium'
      });
    }
    
    return evidence;
  }

  /**
   * Extracts supporting reasons for a recommendation
   */
  private extractSupportingReasons(recommendation: string, findings: string[]): string[] {
    // Simple heuristic to match findings to recommendations
    const reasons = findings.filter(finding => {
      const recommendationWords = recommendation.toLowerCase().split(' ');
      const findingWords = finding.toLowerCase().split(' ');
      return recommendationWords.some(word => findingWords.includes(word));
    });
    
    // If no direct matches, provide general supporting reasons
    if (reasons.length === 0) {
      return [
        'Analysis indicates significant optimization potential',
        'Current approach shows inefficiencies in quota usage',
        'Recommended changes align with best practices'
      ];
    }
    
    return reasons;
  }

  /**
   * Generates expected outcome for a recommendation
   */
  private generateExpectedOutcome(recommendation: string, supportingData: any): string {
    if (!supportingData) {
      return 'Expected to improve quota efficiency and reduce costs';
    }
    
    // Extract specific outcomes based on data type
    if (supportingData.potentialSavings) {
      return `Expected to achieve ${supportingData.potentialSavings}% quota savings`;
    }
    
    if (supportingData.quotaSavings) {
      return `Projected ${supportingData.quotaSavings}% reduction in quota consumption`;
    }
    
    return 'Expected to significantly improve workflow efficiency and reduce quota usage';
  }

  /**
   * Compiles supporting evidence from analysis
   */
  private compileSupportingEvidence(analysis: ConsultingAnalysis, findings: AnalysisFindings): Evidence[] {
    return findings.evidence;
  }

  /**
   * Selects the best option from three-option analysis
   */
  private selectBestOption(threeOptions: ThreeOptionAnalysis): string {
    const options = [
      { name: 'Conservative', option: threeOptions.conservative },
      { name: 'Balanced', option: threeOptions.balanced },
      { name: 'Bold', option: threeOptions.bold }
    ];
    
    // Simple scoring: balance savings vs risk
    const scored = options.map(({ name, option }) => ({
      name,
      score: option.quotaSavings * (option.riskLevel === 'low' ? 1.2 : option.riskLevel === 'medium' ? 1.0 : 0.8)
    }));
    
    return scored.sort((a, b) => b.score - a.score)[0].name;
  }
}