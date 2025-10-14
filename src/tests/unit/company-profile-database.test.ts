/**
 * Unit tests for Company Profile Database Component
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import CompanyProfileDatabaseImpl from '../../components/company-profile-database';
import { CompanyProfile, CompanyTier } from '../../models/company-profiles';

describe('CompanyProfileDatabase', () => {
  let database: CompanyProfileDatabaseImpl;

  beforeEach(() => {
    database = new CompanyProfileDatabaseImpl();
  });

  describe('initialization', () => {
    it('should initialize with default tech company profiles', () => {
      const stats = database.getCompanyStats();
      expect(stats.totalCompanies).toBeGreaterThan(0);
      expect(stats.byTier.FAANG).toBeGreaterThan(0);
    });

    it('should have Google profile with comprehensive data', () => {
      const google = database.getCompanyProfile('google');
      expect(google).toBeDefined();
      expect(google?.name).toBe('Google');
      expect(google?.tier).toBe('FAANG');
      expect(google?.interviewProcess.totalRounds).toBe(5);
      expect(google?.cultureValues.coreValues).toContain('Focus on the user and all else will follow');
    });

    it('should have Amazon profile with Leadership Principles', () => {
      const amazon = database.getCompanyProfile('amazon');
      expect(amazon).toBeDefined();
      expect(amazon?.name).toBe('Amazon');
      expect(amazon?.cultureValues.leadershipPrinciples).toContain('Customer Obsession');
      expect(amazon?.questionWeighting.behavioral).toBe(0.40);
    });
  });

  describe('profile retrieval', () => {
    it('should retrieve company by ID (case insensitive)', () => {
      const google1 = database.getCompanyProfile('google');
      const google2 = database.getCompanyProfile('GOOGLE');
      const google3 = database.getCompanyProfile('Google');
      
      expect(google1).toBeDefined();
      expect(google2).toBeDefined();
      expect(google3).toBeDefined();
      expect(google1?.id).toBe(google2?.id);
      expect(google2?.id).toBe(google3?.id);
    });

    it('should retrieve company by name (case insensitive)', () => {
      const google1 = database.getCompanyByName('Google');
      const google2 = database.getCompanyByName('google');
      const google3 = database.getCompanyByName('GOOGLE');
      
      expect(google1).toBeDefined();
      expect(google2).toBeDefined();
      expect(google3).toBeDefined();
      expect(google1?.name).toBe('Google');
    });

    it('should return undefined for non-existent company', () => {
      const nonExistent = database.getCompanyProfile('nonexistent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('filtering and search', () => {
    it('should filter companies by tier', () => {
      const faangCompanies = database.getCompaniesByTier('FAANG');
      expect(faangCompanies.length).toBeGreaterThan(0);
      faangCompanies.forEach(company => {
        expect(company.tier).toBe('FAANG');
      });
    });

    it('should filter companies by industry', () => {
      const searchCompanies = database.getCompaniesByIndustry('Search');
      expect(searchCompanies.length).toBeGreaterThan(0);
      
      const aiCompanies = database.getCompaniesByIndustry('AI/ML');
      expect(aiCompanies.length).toBeGreaterThan(0);
    });

    it('should search companies by query', () => {
      const googleResults = database.searchCompanies('Google');
      expect(googleResults.length).toBeGreaterThan(0);
      expect(googleResults[0].name).toBe('Google');
      
      const searchResults = database.searchCompanies('search');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should return all companies', () => {
      const allCompanies = database.getAllCompanies();
      expect(allCompanies.length).toBeGreaterThan(0);
      
      const stats = database.getCompanyStats();
      expect(allCompanies.length).toBe(stats.totalCompanies);
    });
  });

  describe('profile management', () => {
    it('should add new company profile', () => {
      const newCompany: CompanyProfile = {
        id: 'test-company',
        name: 'Test Company',
        tier: 'Startup',
        size: 'small',
        industry: ['Technology'],
        headquarters: 'San Francisco, CA',
        founded: 2020,
        interviewProcess: {
          totalRounds: 3,
          rounds: [],
          averageDuration: 7,
          commonFeedback: [],
          uniqueAspects: []
        },
        cultureValues: {
          coreValues: ['Innovation', 'Collaboration'],
          culturalTraits: ['Fast-paced', 'Entrepreneurial'],
          workStyle: 'collaborative',
          decisionMaking: 'fast_iteration',
          riskTolerance: 'aggressive',
          innovationApproach: 'disruptive'
        },
        productPhilosophy: {
          productPrinciples: ['User-first', 'Move fast'],
          designPhilosophy: ['Simple', 'Intuitive'],
          developmentMethodology: 'agile',
          customerFocus: 'b2c',
          productStrategy: ['Mobile-first'],
          keyMetrics: ['User growth'],
          competitiveAdvantages: ['Speed']
        },
        recentLaunches: [],
        interviewPatterns: [],
        questionWeighting: {
          behavioral: 0.30,
          productSense: 0.30,
          analytical: 0.20,
          technical: 0.15,
          leadership: 0.03,
          strategy: 0.01,
          execution: 0.01,
          culture: 0.00
        },
        evaluationCriteria: {
          primaryCriteria: [],
          secondaryCriteria: [],
          dealBreakers: [],
          differentiators: [],
          feedbackStyle: 'conversational'
        },
        lastUpdated: new Date(),
        dataFreshness: 1.0,
        sources: ['Test data']
      };

      database.addCompanyProfile(newCompany);
      
      const retrieved = database.getCompanyProfile('test-company');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Company');
      
      const byName = database.getCompanyByName('Test Company');
      expect(byName).toBeDefined();
      expect(byName?.id).toBe('test-company');
    });

    it('should update existing company profile', () => {
      const updates = {
        employeeCount: 200000,
        dataFreshness: 0.95
      };

      database.updateCompanyProfile('google', updates);
      
      const updated = database.getCompanyProfile('google');
      expect(updated?.employeeCount).toBe(200000);
      expect(updated?.dataFreshness).toBe(0.95);
      expect(updated?.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('statistics', () => {
    it('should provide accurate company statistics', () => {
      const stats = database.getCompanyStats();
      
      expect(stats.totalCompanies).toBeGreaterThan(0);
      expect(typeof stats.byTier).toBe('object');
      expect(typeof stats.byIndustry).toBe('object');
      expect(typeof stats.bySize).toBe('object');
      
      // Verify tier counts
      const allCompanies = database.getAllCompanies();
      const faangCount = allCompanies.filter(c => c.tier === 'FAANG').length;
      expect(stats.byTier.FAANG).toBe(faangCount);
    });

    it('should track industry distribution', () => {
      const stats = database.getCompanyStats();
      
      // Should have companies in various industries
      expect(Object.keys(stats.byIndustry).length).toBeGreaterThan(0);
      
      // Verify industry counts
      const searchCompanies = database.getCompaniesByIndustry('Search');
      if (searchCompanies.length > 0) {
        expect(stats.byIndustry['Search']).toBeGreaterThan(0);
      }
    });
  });

  describe('Google profile validation', () => {
    let google: CompanyProfile;

    beforeEach(() => {
      google = database.getCompanyProfile('google')!;
    });

    it('should have complete interview process', () => {
      expect(google.interviewProcess.totalRounds).toBe(5);
      expect(google.interviewProcess.rounds).toHaveLength(5);
      expect(google.interviewProcess.averageDuration).toBe(21);
      expect(google.interviewProcess.passRate).toBe(0.15);
    });

    it('should have proper question weighting', () => {
      const weights = google.questionWeighting;
      expect(weights.productSense).toBe(0.30);
      expect(weights.analytical).toBe(0.25);
      expect(weights.behavioral).toBe(0.20);
      
      // Weights should sum to approximately 1.0
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1.0, 2);
    });

    it('should have evaluation criteria', () => {
      const criteria = google.evaluationCriteria;
      expect(criteria.primaryCriteria.length).toBeGreaterThan(0);
      expect(criteria.feedbackStyle).toBe('structured');
      expect(criteria.dealBreakers.length).toBeGreaterThan(0);
    });

    it('should have product philosophy', () => {
      const philosophy = google.productPhilosophy;
      expect(philosophy.productPrinciples.length).toBeGreaterThan(0);
      expect(philosophy.developmentMethodology).toBe('agile');
      expect(philosophy.customerFocus).toBe('b2c');
    });

    it('should have culture values', () => {
      const culture = google.cultureValues;
      expect(culture.coreValues.length).toBeGreaterThan(0);
      expect(culture.workStyle).toBe('collaborative');
      expect(culture.decisionMaking).toBe('data_driven');
    });
  });

  describe('Amazon profile validation', () => {
    let amazon: CompanyProfile;

    beforeEach(() => {
      amazon = database.getCompanyProfile('amazon')!;
    });

    it('should have Leadership Principles', () => {
      expect(amazon.cultureValues.leadershipPrinciples).toBeDefined();
      expect(amazon.cultureValues.leadershipPrinciples!.length).toBe(14);
      expect(amazon.cultureValues.leadershipPrinciples).toContain('Customer Obsession');
      expect(amazon.cultureValues.leadershipPrinciples).toContain('Ownership');
    });

    it('should emphasize behavioral interviews', () => {
      expect(amazon.questionWeighting.behavioral).toBe(0.40);
      expect(amazon.questionWeighting.behavioral).toBeGreaterThan(amazon.questionWeighting.productSense);
    });

    it('should have Working Backwards methodology references', () => {
      expect(amazon.interviewProcess.uniqueAspects).toContain('Working Backwards document creation');
      expect(amazon.productPhilosophy.productStrategy).toContain('Working Backwards methodology');
    });
  });

  describe('error handling', () => {
    it('should handle invalid company IDs gracefully', () => {
      expect(() => database.getCompanyProfile('')).not.toThrow();
      expect(() => database.getCompanyProfile('   ')).not.toThrow();
      expect(() => database.updateCompanyProfile('nonexistent', {})).not.toThrow();
    });

    it('should handle empty search queries', () => {
      const results = database.searchCompanies('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle case sensitivity consistently', () => {
      const lower = database.getCompanyProfile('google');
      const upper = database.getCompanyProfile('GOOGLE');
      const mixed = database.getCompanyProfile('GoOgLe');
      
      expect(lower?.id).toBe(upper?.id);
      expect(upper?.id).toBe(mixed?.id);
    });
  });
});