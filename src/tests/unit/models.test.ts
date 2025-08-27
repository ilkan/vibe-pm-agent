// Unit tests for data models and interfaces

import { 
  ParsedIntent, 
  TechnicalRequirement, 
  Workflow, 
  QuotaForecast,
  OptionalParams 
} from '../../models';

describe('Data Models', () => {
  describe('ParsedIntent', () => {
    it('should have required properties', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Test objective',
        technicalRequirements: [],
        dataSourcesNeeded: [],
        operationsRequired: [],
        potentialRisks: []
      };

      expect(intent.businessObjective).toBeDefined();
      expect(Array.isArray(intent.technicalRequirements)).toBe(true);
      expect(Array.isArray(intent.dataSourcesNeeded)).toBe(true);
      expect(Array.isArray(intent.operationsRequired)).toBe(true);
      expect(Array.isArray(intent.potentialRisks)).toBe(true);
    });
  });

  describe('TechnicalRequirement', () => {
    it('should have valid types', () => {
      const requirement: TechnicalRequirement = {
        type: 'data_retrieval',
        description: 'Test requirement',
        complexity: 'medium',
        quotaImpact: 'moderate'
      };

      expect(['data_retrieval', 'processing', 'analysis', 'output']).toContain(requirement.type);
      expect(['low', 'medium', 'high']).toContain(requirement.complexity);
      expect(['minimal', 'moderate', 'significant']).toContain(requirement.quotaImpact);
    });
  });

  describe('OptionalParams', () => {
    it('should accept valid optional parameters', () => {
      const params: OptionalParams = {
        expectedUserVolume: 100,
        costConstraints: {
          maxVibes: 50,
          maxSpecs: 10,
          maxCostDollars: 25.00
        },
        performanceSensitivity: 'high'
      };

      expect(params.expectedUserVolume).toBe(100);
      expect(params.costConstraints?.maxVibes).toBe(50);
      expect(params.performanceSensitivity).toBe('high');
    });
  });
});