/**
 * Company Culture Integrator Component
 * 
 * Integrates company values and culture into interview feedback customization
 * and preparation recommendations.
 */

import {
  CompanyProfile,
  CultureValues,
  CompanySpecificFeedback,
  CompanyCustomizationConfig,
  EvaluationCriterion
} from '../../models/company-profiles';
import { ResponseEvaluation, PMFramework } from '../../models/interview';

export interface CultureAlignment {
  valueAlignment: number; // 0-1 scale
  culturalFit: number; // 0-1 scale
  leadershipAlignment?: number; // 0-1 scale for companies with leadership principles
  communicationStyle: number; // 0-1 scale
  overallAlignment: number; // 0-1 scale
  recommendations: string[];
  concerns: string[];
}

export interface CultureBasedFeedback {
  standardFeedback: string;
  cultureSpecificFeedback: string;
  valueAlignmentFeedback: string;
  improvementSuggestions: string[];
  culturalTips: string[];
  leadershipFeedback?: string; // For companies with leadership principles
}

export class CompanyCultureIntegrator {
  constructor() {}

  /**
   * Analyze how well a candidate's response aligns with company culture
   */
  analyzeCultureAlignment(
    response: string,
    evaluation: ResponseEvaluation,
    companyProfile: CompanyProfile
  ): CultureAlignment {
    const cultureValues = companyProfile.cultureValues;
    
    // Analyze value alignment
    const valueAlignment = this.analyzeValueAlignment(response, cultureValues);
    
    // Analyze cultural fit based on communication style and approach
    const culturalFit = this.analyzeCulturalFit(response, evaluation, cultureValues);
    
    // Analyze leadership alignment if applicable
    const leadershipAlignment = cultureValues.leadershipPrinciples 
      ? this.analyzeLeadershipAlignment(response, cultureValues.leadershipPrinciples)
      : undefined;
    
    // Analyze communication style alignment
    const communicationStyle = this.analyzeCommunicationStyle(response, cultureValues);
    
    // Calculate overall alignment
    const weights = {
      value: 0.35,
      cultural: 0.25,
      leadership: 0.25,
      communication: 0.15
    };
    
    const overallAlignment = 
      (valueAlignment * weights.value) +
      (culturalFit * weights.cultural) +
      ((leadershipAlignment || 0) * weights.leadership) +
      (communicationStyle * weights.communication);
    
    // Generate recommendations and concerns
    const recommendations = this.generateCultureRecommendations(
      valueAlignment,
      culturalFit,
      leadershipAlignment,
      communicationStyle,
      companyProfile
    );
    
    const concerns = this.identifyCulturalConcerns(
      valueAlignment,
      culturalFit,
      leadershipAlignment,
      communicationStyle,
      companyProfile
    );

    return {
      valueAlignment,
      culturalFit,
      leadershipAlignment,
      communicationStyle,
      overallAlignment,
      recommendations,
      concerns
    };
  }

  /**
   * Generate company-specific feedback based on culture analysis
   */
  generateCultureBasedFeedback(
    standardEvaluation: ResponseEvaluation,
    cultureAlignment: CultureAlignment,
    companyProfile: CompanyProfile
  ): CultureBasedFeedback {
    const cultureSpecificFeedback = this.generateCultureSpecificFeedback(
      cultureAlignment,
      companyProfile
    );
    
    const valueAlignmentFeedback = this.generateValueAlignmentFeedback(
      cultureAlignment.valueAlignment,
      companyProfile.cultureValues
    );
    
    const improvementSuggestions = this.generateCultureImprovementSuggestions(
      cultureAlignment,
      companyProfile
    );
    
    const culturalTips = this.generateCulturalTips(companyProfile);
    
    const leadershipFeedback = companyProfile.cultureValues.leadershipPrinciples
      ? this.generateLeadershipFeedback(cultureAlignment.leadershipAlignment || 0, companyProfile)
      : undefined;

    return {
      standardFeedback: standardEvaluation.improvements.join('. '),
      cultureSpecificFeedback,
      valueAlignmentFeedback,
      improvementSuggestions,
      culturalTips,
      leadershipFeedback
    };
  }

  /**
   * Create customization configuration for company-specific preparation
   */
  createCustomizationConfig(
    companyProfile: CompanyProfile,
    roleLevel: string,
    userWeaknesses?: string[]
  ): CompanyCustomizationConfig {
    // Determine focus areas based on company evaluation criteria
    const focusAreas = this.determineFocusAreas(companyProfile, userWeaknesses);
    
    // Get company-specific question weighting
    const questionWeighting = companyProfile.questionWeighting;
    
    // Determine feedback style
    const feedbackStyle = companyProfile.evaluationCriteria.feedbackStyle;
    
    // Identify cultural emphasis areas
    const culturalEmphasis = this.identifyCulturalEmphasis(companyProfile);
    
    // Generate preparation recommendations
    const preparationRecommendations = this.generatePreparationRecommendations(
      companyProfile,
      roleLevel,
      focusAreas
    );

    return {
      companyId: companyProfile.id,
      roleLevel,
      focusAreas,
      questionWeighting,
      feedbackStyle,
      culturalEmphasis,
      preparationRecommendations
    };
  }

  /**
   * Integrate company values into interview question selection
   */
  getValueBasedQuestionTags(companyProfile: CompanyProfile): string[] {
    const tags: string[] = [];
    
    // Add tags based on core values
    companyProfile.cultureValues.coreValues.forEach(value => {
      if (value.toLowerCase().includes('customer')) {
        tags.push('customer_obsession', 'user_focus');
      }
      if (value.toLowerCase().includes('innovation')) {
        tags.push('innovation', 'creativity');
      }
      if (value.toLowerCase().includes('data')) {
        tags.push('analytical', 'data_driven');
      }
      if (value.toLowerCase().includes('team') || value.toLowerCase().includes('collaboration')) {
        tags.push('teamwork', 'collaboration');
      }
    });
    
    // Add tags based on work style
    switch (companyProfile.cultureValues.workStyle) {
      case 'collaborative':
        tags.push('collaboration', 'teamwork');
        break;
      case 'autonomous':
        tags.push('ownership', 'independence');
        break;
      case 'hierarchical':
        tags.push('leadership', 'authority');
        break;
    }
    
    // Add tags based on decision making style
    switch (companyProfile.cultureValues.decisionMaking) {
      case 'data_driven':
        tags.push('analytical', 'metrics');
        break;
      case 'consensus':
        tags.push('collaboration', 'influence');
        break;
      case 'fast_iteration':
        tags.push('agility', 'experimentation');
        break;
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Private helper methods
  private analyzeValueAlignment(response: string, cultureValues: CultureValues): number {
    let alignment = 0.5; // Base score
    const responseText = response.toLowerCase();
    
    // Check for mentions of core values
    cultureValues.coreValues.forEach(value => {
      const keywords = this.extractKeywordsFromValue(value);
      keywords.forEach(keyword => {
        if (responseText.includes(keyword.toLowerCase())) {
          alignment += 0.1;
        }
      });
    });
    
    // Check for cultural traits
    cultureValues.culturalTraits.forEach(trait => {
      const keywords = this.extractKeywordsFromValue(trait);
      keywords.forEach(keyword => {
        if (responseText.includes(keyword.toLowerCase())) {
          alignment += 0.05;
        }
      });
    });
    
    return Math.min(alignment, 1.0);
  }

  private analyzeCulturalFit(
    response: string,
    evaluation: ResponseEvaluation,
    cultureValues: CultureValues
  ): number {
    let fit = 0.5; // Base score
    
    // Analyze based on work style
    switch (cultureValues.workStyle) {
      case 'collaborative':
        if (response.toLowerCase().includes('team') || response.toLowerCase().includes('collaborate')) {
          fit += 0.2;
        }
        break;
      case 'autonomous':
        if (response.toLowerCase().includes('ownership') || response.toLowerCase().includes('independent')) {
          fit += 0.2;
        }
        break;
    }
    
    // Analyze based on decision making style
    switch (cultureValues.decisionMaking) {
      case 'data_driven':
        if (evaluation.frameworkAnalysis.some(f => f.framework === 'RICE' || f.usage === 'excellent')) {
          fit += 0.2;
        }
        break;
    }
    
    return Math.min(fit, 1.0);
  }

  private analyzeLeadershipAlignment(response: string, leadershipPrinciples: string[]): number {
    let alignment = 0.3; // Base score
    const responseText = response.toLowerCase();
    
    leadershipPrinciples.forEach(principle => {
      const keywords = this.extractKeywordsFromValue(principle);
      keywords.forEach(keyword => {
        if (responseText.includes(keyword.toLowerCase())) {
          alignment += 0.1;
        }
      });
    });
    
    return Math.min(alignment, 1.0);
  }

  private analyzeCommunicationStyle(response: string, cultureValues: CultureValues): number {
    // Analyze communication clarity, structure, and style
    let score = 0.5;
    
    // Check for structured thinking
    if (response.includes('First') || response.includes('Second') || response.includes('Finally')) {
      score += 0.2;
    }
    
    // Check for data mentions
    if (cultureValues.decisionMaking === 'data_driven' && 
        (response.toLowerCase().includes('data') || response.toLowerCase().includes('metric'))) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private generateCultureRecommendations(
    valueAlignment: number,
    culturalFit: number,
    leadershipAlignment: number | undefined,
    communicationStyle: number,
    companyProfile: CompanyProfile
  ): string[] {
    const recommendations: string[] = [];
    
    if (valueAlignment < 0.7) {
      recommendations.push(`Study ${companyProfile.name}'s core values and incorporate them into your responses`);
    }
    
    if (culturalFit < 0.7) {
      recommendations.push(`Align your examples with ${companyProfile.name}'s work style and decision-making approach`);
    }
    
    if (leadershipAlignment && leadershipAlignment < 0.7) {
      recommendations.push(`Practice examples that demonstrate the company's leadership principles`);
    }
    
    if (communicationStyle < 0.7) {
      recommendations.push('Structure your responses more clearly and include relevant data points');
    }
    
    return recommendations;
  }

  private identifyCulturalConcerns(
    valueAlignment: number,
    culturalFit: number,
    leadershipAlignment: number | undefined,
    communicationStyle: number,
    companyProfile: CompanyProfile
  ): string[] {
    const concerns: string[] = [];
    
    if (valueAlignment < 0.5) {
      concerns.push('Limited demonstration of company values');
    }
    
    if (culturalFit < 0.5) {
      concerns.push('Approach may not align with company culture');
    }
    
    if (leadershipAlignment && leadershipAlignment < 0.5) {
      concerns.push('Weak leadership principle demonstration');
    }
    
    return concerns;
  }

  private generateCultureSpecificFeedback(
    cultureAlignment: CultureAlignment,
    companyProfile: CompanyProfile
  ): string {
    const companyName = companyProfile.name;
    
    if (cultureAlignment.overallAlignment >= 0.8) {
      return `Excellent alignment with ${companyName}'s culture and values. Your response demonstrates strong understanding of what the company values.`;
    } else if (cultureAlignment.overallAlignment >= 0.6) {
      return `Good cultural alignment with ${companyName}. Consider strengthening your examples to better reflect the company's core values.`;
    } else {
      return `Your response could better align with ${companyName}'s culture. Focus on incorporating their values and work style into your examples.`;
    }
  }

  private generateValueAlignmentFeedback(
    valueAlignment: number,
    cultureValues: CultureValues
  ): string {
    if (valueAlignment >= 0.8) {
      return 'Strong demonstration of company values in your response.';
    } else if (valueAlignment >= 0.6) {
      return 'Some alignment with company values shown. Consider being more explicit about how your approach reflects these values.';
    } else {
      return `Limited reflection of company values. Focus on: ${cultureValues.coreValues.slice(0, 3).join(', ')}.`;
    }
  }

  private generateCultureImprovementSuggestions(
    cultureAlignment: CultureAlignment,
    companyProfile: CompanyProfile
  ): string[] {
    const suggestions: string[] = [];
    
    if (cultureAlignment.valueAlignment < 0.7) {
      suggestions.push(`Explicitly mention how your approach aligns with ${companyProfile.name}'s values`);
    }
    
    if (cultureAlignment.culturalFit < 0.7) {
      suggestions.push(`Adapt your communication style to match ${companyProfile.name}'s culture`);
    }
    
    return suggestions;
  }

  private generateCulturalTips(companyProfile: CompanyProfile): string[] {
    const tips: string[] = [];
    
    // Add company-specific tips based on culture
    switch (companyProfile.id) {
      case 'google':
        tips.push('Focus on user impact and technical innovation');
        tips.push('Demonstrate "Googleyness" through collaborative examples');
        break;
      case 'amazon':
        tips.push('Start every answer with customer impact');
        tips.push('Use specific examples that demonstrate Leadership Principles');
        break;
      case 'meta':
        tips.push('Emphasize connecting people and building community');
        tips.push('Show comfort with rapid iteration and experimentation');
        break;
    }
    
    return tips;
  }

  private generateLeadershipFeedback(
    leadershipAlignment: number,
    companyProfile: CompanyProfile
  ): string {
    if (companyProfile.id === 'amazon') {
      if (leadershipAlignment >= 0.8) {
        return 'Excellent demonstration of Amazon Leadership Principles.';
      } else if (leadershipAlignment >= 0.6) {
        return 'Good use of Leadership Principles. Consider being more specific about which principles you\'re demonstrating.';
      } else {
        return 'Strengthen your examples to clearly demonstrate Amazon\'s Leadership Principles using the STAR method.';
      }
    }
    
    return 'Consider how your examples demonstrate leadership qualities valued by this company.';
  }

  private determineFocusAreas(
    companyProfile: CompanyProfile,
    userWeaknesses?: string[]
  ): string[] {
    const focusAreas: string[] = [];
    
    // Add areas based on company's primary evaluation criteria
    companyProfile.evaluationCriteria.primaryCriteria.forEach(criterion => {
      if (criterion.weight > 0.2) {
        focusAreas.push(criterion.name.toLowerCase().replace(' ', '_'));
      }
    });
    
    // Add user-specific weaknesses if provided
    if (userWeaknesses) {
      focusAreas.push(...userWeaknesses);
    }
    
    return [...new Set(focusAreas)];
  }

  private identifyCulturalEmphasis(companyProfile: CompanyProfile): string[] {
    const emphasis: string[] = [];
    
    // Add emphasis based on core values
    companyProfile.cultureValues.coreValues.forEach(value => {
      if (value.toLowerCase().includes('customer')) {
        emphasis.push('customer_focus');
      }
      if (value.toLowerCase().includes('innovation')) {
        emphasis.push('innovation');
      }
      if (value.toLowerCase().includes('data')) {
        emphasis.push('data_driven');
      }
    });
    
    return [...new Set(emphasis)];
  }

  private generatePreparationRecommendations(
    companyProfile: CompanyProfile,
    roleLevel: string,
    focusAreas: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Add company-specific recommendations
    recommendations.push(`Study ${companyProfile.name}'s recent product launches and strategic initiatives`);
    recommendations.push(`Practice examples that demonstrate ${companyProfile.name}'s core values`);
    
    // Add role-specific recommendations
    if (roleLevel.includes('Senior')) {
      recommendations.push('Prepare leadership and strategic thinking examples');
    }
    
    // Add focus area recommendations
    focusAreas.forEach(area => {
      recommendations.push(`Focus on strengthening ${area.replace('_', ' ')} skills`);
    });
    
    return recommendations;
  }

  private extractKeywordsFromValue(value: string): string[] {
    // Extract meaningful keywords from value statements
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return value.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
  }
}

export default CompanyCultureIntegrator;