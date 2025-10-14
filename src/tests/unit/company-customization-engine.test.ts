/**
 * Unit tests for Company Customization Engine Component
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import CompanyCustomizationEngine from '../../components/company-customization-engine';
import { CustomizationContext, UserProfile } from '../../components/company-customization-engine';
import { ResponseEvaluation, PMFramework } from '../../models/interview';

describe('CompanyCustomizationEngine', () => {
  let engine: CompanyCustomizationEngine;

  beforeEach(() => {
    engine = new CompanyCustomizationEngine();
  });

  describe('initialization', () => {
    it('should initialize with company database and culture integrator', () => {
      expect(engine).toBeDefined();
    });
  });

  describe('generateCustomizedPreparation', () => {
    it('should generate customized preparation for Google', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM',
        weaknessAreas: ['analytical'],
        preparationGoals: ['improve product sense']
      };

      const preparation = engine.generateCustomizedPreparation(context);

      expect(preparation).toBeDefined();
      expect(preparation.focusAreas).toBeDefined();
      expect(preparation.questionSelection).toBeDefined();
      expect(preparation.feedbackCustomization).toBeDefined();
      expect(preparation.preparationPlan).toBeDefined();
      expect(preparation.companyInsights).toBeDefined();
    });

    it('should generate customized preparation for Amazon', () => {
      const context: CustomizationContext = {
        companyId: 'amazon',
        roleLevel: 'Senior PM',
        weaknessAreas: ['behavioral'],
        preparationGoals: ['leadership principles mastery']
      };

      const preparation = engine.generateCustomizedPreparation(context);

      expect(preparation).toBeDefined();
      expect(preparation.focusAreas.length).toBeGreaterThan(0);
      
      // Should include behavioral focus for Amazon
      const behavioralFocus = preparation.focusAreas.find(area => 
        area.area.toLowerCase().includes('behavioral') || 
        area.area.toLowerCase().includes('leadership')
      );
      expect(behavioralFocus).toBeDefined();
    });

    it('should throw error for non-existent company', () => {
      const context: CustomizationContext = {
        companyId: 'nonexistent',
        roleLevel: 'PM'
      };

      expect(() => engine.generateCustomizedPreparation(context)).toThrow();
    });

    it('should adapt focus areas based on user weaknesses', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM',
        weaknessAreas: ['product_sense', 'analytical']
      };

      const preparation = engine.generateCustomizedPreparation(context);
      
      const weaknessFocusAreas = preparation.focusAreas.filter(area =>
        context.weaknessAreas!.includes(area.area.toLowerCase())
      );
      
      expect(weaknessFocusAreas.length).toBeGreaterThan(0);
    });
  });

  describe('customizeFeedback', () => {
    let mockEvaluation: ResponseEvaluation;

    beforeEach(() => {
      mockEvaluation = {
        overallScore: 3.5,
        strengths: ['Clear communication', 'Structured thinking'],
        improvements: ['Need more data focus', 'Weak user empathy'],
        frameworkAnalysis: [
          {
            framework: 'CIRCLES' as PMFramework,
            usage: 'good',
            score: 0.7,
            feedback: 'Good framework application'
          }
        ],
        nextSteps: ['Practice more product design cases'],
        confidence: 0.8
      };
    });

    it('should customize feedback for Google culture', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
      };

      // Get company profile first
      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      expect(companyProfile).toBeDefined();

      const customizedFeedback = engine.customizeFeedback(
        mockEvaluation,
        companyProfile,
        context
      );

      expect(customizedFeedback).toBeDefined();
      expect(customizedFeedback.companyId).toBe('google');
      expect(customizedFeedback.companyCustomization).toBeDefined();
      expect(customizedFeedback.companyCustomization.cultureAlignment).toBeDefined();
      expect(customizedFeedback.companyCustomization.valueAlignment).toBeDefined();
      expect(customizedFeedback.improvementSuggestions).toBeDefined();
      expect(customizedFeedback.companySpecificTips).toBeDefined();
    });

    it('should customize feedback for Amazon Leadership Principles', () => {
      const context: CustomizationContext = {
        companyId: 'amazon',
        roleLevel: 'PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('amazon');
      expect(companyProfile).toBeDefined();

      const customizedFeedback = engine.customizeFeedback(
        mockEvaluation,
        companyProfile,
        context
      );

      expect(customizedFeedback).toBeDefined();
      expect(customizedFeedback.companyCustomization.leadershipStyle).toBeDefined();
      
      // Should include Amazon-specific tips
      const amazonTips = customizedFeedback.companySpecificTips.filter(tip =>
        tip.toLowerCase().includes('customer') || tip.toLowerCase().includes('star')
      );
      expect(amazonTips.length).toBeGreaterThan(0);
    });

    it('should include company-specific improvement suggestions', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'Senior PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const customizedFeedback = engine.customizeFeedback(
        mockEvaluation,
        companyProfile,
        context
      );

      expect(customizedFeedback.improvementSuggestions.length).toBeGreaterThan(0);
      
      // Should include company-specific suggestions
      const companySpecificSuggestions = customizedFeedback.improvementSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes('google')
      );
      expect(companySpecificSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getCustomizedQuestionWeighting', () => {
    it('should return base weights for Google', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const weights = engine.getCustomizedQuestionWeighting(companyProfile, context);

      expect(weights).toBeDefined();
      expect(typeof weights.behavioral).toBe('number');
      expect(typeof weights.product_sense).toBe('number');
      expect(typeof weights.analytical).toBe('number');
      
      // Weights should sum to approximately 1
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1.0, 1);
    });

    it('should adjust weights based on user weaknesses', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM',
        weaknessAreas: ['analytical']
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const baseWeights = { ...companyProfile.questionWeighting };
      const adjustedWeights = engine.getCustomizedQuestionWeighting(companyProfile, context);

      // Analytical weight should be increased (after normalization)
      expect(adjustedWeights.analytical).toBeGreaterThanOrEqual(baseWeights.analytical);
    });

    it('should adjust weights for Senior PM role', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'Senior PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const weights = engine.getCustomizedQuestionWeighting(companyProfile, context);

      // Behavioral should be emphasized for Senior PM (leadership through behavioral)
      expect(weights.behavioral).toBeGreaterThan(0);
    });

    it('should adjust weights for APM role', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'APM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const baseWeights = { ...companyProfile.questionWeighting };
      const adjustedWeights = engine.getCustomizedQuestionWeighting(companyProfile, context);

      // Product sense and analytical should be emphasized for APM
      expect(adjustedWeights.product_sense).toBeGreaterThanOrEqual(baseWeights.productSense);
      expect(adjustedWeights.analytical).toBeGreaterThanOrEqual(baseWeights.analytical);
    });
  });

  describe('generateCompanyInsights', () => {
    it('should generate insights for Google', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const insights = engine.generateCompanyInsights(companyProfile, context);

      expect(insights).toBeDefined();
      expect(insights.interviewTips).toBeDefined();
      expect(insights.commonPitfalls).toBeDefined();
      expect(insights.successStories).toBeDefined();
      expect(insights.recentChanges).toBeDefined();
      expect(insights.competitiveContext).toBeDefined();
      expect(insights.industryTrends).toBeDefined();
    });

    it('should include company-specific pitfalls', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const insights = engine.generateCompanyInsights(companyProfile, context);

      expect(insights.commonPitfalls.length).toBeGreaterThan(0);
      
      // Should include Google-specific pitfalls
      const googlePitfalls = insights.commonPitfalls.filter(pitfall =>
        pitfall.toLowerCase().includes('feature') || 
        pitfall.toLowerCase().includes('scale')
      );
      expect(googlePitfalls.length).toBeGreaterThan(0);
    });

    it('should generate role-specific interview tips', () => {
      const context: CustomizationContext = {
        companyId: 'amazon',
        roleLevel: 'Senior PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('amazon');
      const insights = engine.generateCompanyInsights(companyProfile, context);

      expect(insights.interviewTips.length).toBeGreaterThan(0);
      
      // Should include high importance tips
      const highImportanceTips = insights.interviewTips.filter(tip =>
        tip.importance === 'high'
      );
      expect(highImportanceTips.length).toBeGreaterThan(0);
    });
  });

  describe('createQuestionSelectionStrategy', () => {
    it('should create strategy with proper difficulty progression', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM',
        userProfile: {
          experienceLevel: 'mid',
          industryBackground: ['Technology'],
          skillStrengths: ['product_sense'],
          skillWeaknesses: ['analytical']
        }
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const strategy = engine.createQuestionSelectionStrategy(companyProfile, context);

      expect(strategy).toBeDefined();
      expect(strategy.categoryWeights).toBeDefined();
      expect(strategy.difficultyProgression).toBeDefined();
      expect(strategy.difficultyProgression.startingDifficulty).toBeGreaterThan(0);
      expect(strategy.difficultyProgression.targetDifficulty).toBeGreaterThan(strategy.difficultyProgression.startingDifficulty);
      expect(strategy.adaptiveAdjustments).toBeDefined();
      expect(strategy.adaptiveAdjustments.length).toBeGreaterThan(0);
    });

    it('should set appropriate starting difficulty for entry level', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'APM',
        userProfile: {
          experienceLevel: 'entry',
          industryBackground: [],
          skillStrengths: [],
          skillWeaknesses: []
        }
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const strategy = engine.createQuestionSelectionStrategy(companyProfile, context);

      expect(strategy.difficultyProgression.startingDifficulty).toBe(2);
    });

    it('should set appropriate target difficulty for Senior PM', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'Senior PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const strategy = engine.createQuestionSelectionStrategy(companyProfile, context);

      expect(strategy.difficultyProgression.targetDifficulty).toBe(5);
    });

    it('should include adaptive adjustments', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
      };

      const companyProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const strategy = engine.createQuestionSelectionStrategy(companyProfile, context);

      expect(strategy.adaptiveAdjustments.length).toBeGreaterThan(0);
      
      const lowScoreAdjustment = strategy.adaptiveAdjustments.find(adj => 
        adj.trigger === 'low_score'
      );
      expect(lowScoreAdjustment).toBeDefined();
      expect(lowScoreAdjustment?.adjustment).toBe('decrease_difficulty');
      
      const highScoreAdjustment = strategy.adaptiveAdjustments.find(adj => 
        adj.trigger === 'high_score'
      );
      expect(highScoreAdjustment).toBeDefined();
      expect(highScoreAdjustment?.adjustment).toBe('increase_difficulty');
    });
  });

  describe('error handling', () => {
    it('should handle invalid company IDs gracefully', () => {
      const context: CustomizationContext = {
        companyId: 'invalid-company',
        roleLevel: 'PM'
      };

      expect(() => engine.generateCustomizedPreparation(context)).toThrow('Company profile not found: invalid-company');
    });

    it('should handle missing user profile gracefully', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
        // No userProfile provided
      };

      expect(() => engine.generateCustomizedPreparation(context)).not.toThrow();
    });

    it('should handle empty weakness areas', () => {
      const context: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM',
        weaknessAreas: []
      };

      const preparation = engine.generateCustomizedPreparation(context);
      expect(preparation).toBeDefined();
    });
  });

  describe('integration with company database', () => {
    it('should work with all available companies', () => {
      const companyDatabase = (engine as any).companyDatabase;
      const allCompanies = companyDatabase.getAllCompanies();

      allCompanies.forEach(company => {
        const context: CustomizationContext = {
          companyId: company.id,
          roleLevel: 'PM'
        };

        expect(() => engine.generateCustomizedPreparation(context)).not.toThrow();
      });
    });

    it('should use company-specific question weighting', () => {
      const googleContext: CustomizationContext = {
        companyId: 'google',
        roleLevel: 'PM'
      };

      const amazonContext: CustomizationContext = {
        companyId: 'amazon',
        roleLevel: 'PM'
      };

      const googleProfile = (engine as any).companyDatabase.getCompanyProfile('google');
      const amazonProfile = (engine as any).companyDatabase.getCompanyProfile('amazon');

      const googleWeights = engine.getCustomizedQuestionWeighting(googleProfile, googleContext);
      const amazonWeights = engine.getCustomizedQuestionWeighting(amazonProfile, amazonContext);

      // Amazon should emphasize behavioral more than Google
      expect(amazonWeights.behavioral).toBeGreaterThan(googleWeights.behavioral);
      
      // Google should emphasize product sense more than Amazon
      expect(googleWeights.product_sense).toBeGreaterThan(amazonWeights.product_sense);
    });
  });
});