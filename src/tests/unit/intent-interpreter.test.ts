// Unit tests for Intent Interpreter component

import { IntentInterpreter } from '../../components/intent-interpreter';
import { ParsedIntent, OptionalParams } from '../../models';

describe('IntentInterpreter', () => {
  let interpreter: IntentInterpreter;

  beforeEach(() => {
    interpreter = new IntentInterpreter();
  });

  describe('parseIntent', () => {
    it('should parse a basic user authentication intent', async () => {
      const rawText = 'I want to create a user authentication system with login and registration';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.businessObjective).toContain('user authentication');
      expect(result.operationsRequired.length).toBeGreaterThanOrEqual(2); // login + registration + create
      expect(result.dataSourcesNeeded).toContain('user_data');
      expect(result.technicalRequirements.length).toBeGreaterThan(0);
    });

    it('should parse a CRUD application intent', async () => {
      const rawText = 'Build a todo list app with create, read, update, and delete operations';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.businessObjective).toContain('todo list');
      expect(result.operationsRequired).toHaveLength(4); // CRUD operations
      expect(result.dataSourcesNeeded).toContain('application_data');
    });

    it('should identify search functionality risks', async () => {
      const rawText = 'Create a search system that finds all matching records';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.potentialRisks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'redundant_query',
            severity: 'medium'
          })
        ])
      );
    });

    it('should handle complex intents with multiple features', async () => {
      const rawText = 'I need a user management system with authentication, user profiles, search functionality, and analytics dashboard';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.businessObjective).toContain('user management');
      expect(result.operationsRequired.length).toBeGreaterThanOrEqual(4); // auth, profiles, search, analytics
      expect(result.dataSourcesNeeded).toContain('user_data');
      expect(result.technicalRequirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'analysis',
            complexity: 'high'
          })
        ])
      );
    });

    it('should work with optional parameters', async () => {
      const rawText = 'Create a simple blog application';
      const params: OptionalParams = {
        expectedUserVolume: 1000,
        performanceSensitivity: 'high'
      };
      
      const result = await interpreter.parseIntent(rawText, params);
      
      expect(result).toBeDefined();
      expect(result.businessObjective).toContain('blog');
    });

    it('should adjust operation costs based on user volume parameters', async () => {
      const rawText = 'Create a user authentication system';
      
      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 5000,
        performanceSensitivity: 'medium'
      };
      
      const lowVolumeParams: OptionalParams = {
        expectedUserVolume: 5,
        performanceSensitivity: 'medium'
      };
      
      const highVolumeResult = await interpreter.parseIntent(rawText, highVolumeParams);
      const lowVolumeResult = await interpreter.parseIntent(rawText, lowVolumeParams);
      
      const highVolumeTotalCost = highVolumeResult.operationsRequired.reduce((sum, op) => sum + op.estimatedQuotaCost, 0);
      const lowVolumeTotalCost = lowVolumeResult.operationsRequired.reduce((sum, op) => sum + op.estimatedQuotaCost, 0);
      
      expect(highVolumeTotalCost).toBeGreaterThan(lowVolumeTotalCost);
    });

    it('should adjust operation costs based on performance sensitivity', async () => {
      const rawText = 'Create a data processing system';
      
      const highPerfParams: OptionalParams = {
        performanceSensitivity: 'high'
      };
      
      const lowPerfParams: OptionalParams = {
        performanceSensitivity: 'low'
      };
      
      const highPerfResult = await interpreter.parseIntent(rawText, highPerfParams);
      const lowPerfResult = await interpreter.parseIntent(rawText, lowPerfParams);
      
      const highPerfTotalCost = highPerfResult.operationsRequired.reduce((sum, op) => sum + op.estimatedQuotaCost, 0);
      const lowPerfTotalCost = lowPerfResult.operationsRequired.reduce((sum, op) => sum + op.estimatedQuotaCost, 0);
      
      expect(highPerfTotalCost).toBeGreaterThan(lowPerfTotalCost);
    });

    it('should adjust technical requirements based on cost constraints', async () => {
      const rawText = 'Create a complex analytics dashboard';
      
      const tightConstraintsParams: OptionalParams = {
        costConstraints: {
          maxVibes: 10,
          maxSpecs: 2,
          maxCostDollars: 5
        }
      };
      
      const result = await interpreter.parseIntent(rawText, tightConstraintsParams);
      
      // Should try to reduce quota impact when constraints are tight
      const hasReducedImpact = result.technicalRequirements.some(req => 
        req.quotaImpact === 'minimal' || req.quotaImpact === 'moderate'
      );
      expect(hasReducedImpact).toBe(true);
    });

    it('should add volume-related risks for high user volume', async () => {
      const rawText = 'Create a user management system';
      
      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 10000
      };
      
      const result = await interpreter.parseIntent(rawText, highVolumeParams);
      
      const hasVolumeRisk = result.potentialRisks.some(risk => 
        risk.description.includes('High user volume')
      );
      expect(hasVolumeRisk).toBe(true);
    });

    it('should add cost constraint risks for tight budgets', async () => {
      const rawText = 'Create a data processing system';
      
      const tightBudgetParams: OptionalParams = {
        costConstraints: {
          maxVibes: 5,
          maxCostDollars: 3
        }
      };
      
      const result = await interpreter.parseIntent(rawText, tightBudgetParams);
      
      const hasCostRisk = result.potentialRisks.some(risk => 
        risk.description.includes('Tight cost constraints')
      );
      expect(hasCostRisk).toBe(true);
    });

    it('should adjust risk likelihood based on performance sensitivity', async () => {
      const rawText = 'Create a search system with complex queries';
      
      const highPerfParams: OptionalParams = {
        performanceSensitivity: 'high'
      };
      
      const lowPerfParams: OptionalParams = {
        performanceSensitivity: 'low'
      };
      
      const highPerfResult = await interpreter.parseIntent(rawText, highPerfParams);
      const lowPerfResult = await interpreter.parseIntent(rawText, lowPerfParams);
      
      const highPerfAvgLikelihood = highPerfResult.potentialRisks.reduce((sum, risk) => sum + risk.likelihood, 0) / highPerfResult.potentialRisks.length;
      const lowPerfAvgLikelihood = lowPerfResult.potentialRisks.reduce((sum, risk) => sum + risk.likelihood, 0) / lowPerfResult.potentialRisks.length;
      
      expect(highPerfAvgLikelihood).toBeGreaterThan(lowPerfAvgLikelihood);
    });
  });

  describe('extractBusinessObjective', () => {
    it('should extract business objective from parsed intent', async () => {
      const rawText = 'I want to build an e-commerce platform';
      const intent = await interpreter.parseIntent(rawText);
      
      const objective = interpreter.extractBusinessObjective(intent);
      
      expect(objective).toContain('e-commerce');
    });
  });

  describe('identifyTechnicalRequirements', () => {
    it('should return technical requirements from parsed intent', async () => {
      const rawText = 'Create a reporting dashboard with analytics';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      expect(requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'analysis',
            complexity: 'high',
            quotaImpact: 'significant'
          })
        ])
      );
    });

    it('should categorize data retrieval requirements accurately', async () => {
      const rawText = 'Build a system to display user profiles and search through user data';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const dataRetrievalReq = requirements.find(req => req.type === 'data_retrieval');
      expect(dataRetrievalReq).toBeDefined();
      expect(dataRetrievalReq?.description).toContain('user information');
      expect(dataRetrievalReq?.complexity).toBe('high'); // Due to search functionality
      expect(dataRetrievalReq?.quotaImpact).toBe('moderate');
    });

    it('should categorize processing requirements with correct complexity', async () => {
      const rawText = 'Create a user authentication system with login, registration, and password reset';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const processingReq = requirements.find(req => req.type === 'processing');
      expect(processingReq).toBeDefined();
      expect(processingReq?.description).toContain('authentication');
      expect(processingReq?.complexity).toBe('high'); // Auth is high complexity
      expect(processingReq?.quotaImpact).toBe('significant'); // Auth has significant impact
    });

    it('should identify output requirements for export functionality', async () => {
      const rawText = 'Build a report generator that exports data to PDF and Excel formats';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const outputReq = requirements.find(req => req.type === 'output');
      expect(outputReq).toBeDefined();
      expect(outputReq?.description).toContain('report');
      expect(outputReq?.complexity).toBe('high'); // Report generation is complex
      expect(outputReq?.quotaImpact).toBe('significant');
    });

    it('should handle multiple data sources with appropriate complexity', async () => {
      const rawText = 'Create a dashboard that pulls data from our database, external APIs, and file storage';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const dataRetrievalReq = requirements.find(req => req.type === 'data_retrieval');
      expect(dataRetrievalReq).toBeDefined();
      expect(dataRetrievalReq?.complexity).toBe('high'); // Multiple data sources
      expect(dataRetrievalReq?.quotaImpact).toBe('significant'); // External API increases impact
      expect(dataRetrievalReq?.description).toContain('database records');
      expect(dataRetrievalReq?.description).toContain('external API data');
    });

    it('should categorize CRUD operations with medium complexity', async () => {
      const rawText = 'Build a simple todo app with create, read, update, and delete operations';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const processingReq = requirements.find(req => req.type === 'processing');
      expect(processingReq).toBeDefined();
      expect(processingReq?.description).toContain('CRUD');
      expect(processingReq?.complexity).toBe('medium'); // CRUD is medium complexity
      expect(processingReq?.quotaImpact).toBe('moderate');
    });

    it('should merge duplicate requirements and take higher complexity', async () => {
      const rawText = 'Create a complex user management system with authentication, user profiles, advanced search, and data export';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      // Should not have duplicate types with same descriptions
      const processingReqs = requirements.filter(req => req.type === 'processing');
      expect(processingReqs.length).toBe(1); // Should merge processing requirements
      
      const processingReq = processingReqs[0];
      expect(processingReq.complexity).toBe('high'); // Should take highest complexity
      expect(processingReq.quotaImpact).toBe('significant'); // Should take highest impact
    });

    it('should provide default requirement when no specific operations detected', async () => {
      const rawText = 'Make something useful';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements[0]).toEqual(
        expect.objectContaining({
          type: 'processing',
          description: 'Basic application functionality',
          complexity: 'medium',
          quotaImpact: 'moderate'
        })
      );
    });

    it('should accurately assess quota impact based on operation costs', async () => {
      const rawText = 'Create a simple data viewer that just displays a list of items';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const dataRetrievalReq = requirements.find(req => req.type === 'data_retrieval');
      expect(dataRetrievalReq).toBeDefined();
      expect(dataRetrievalReq?.quotaImpact).toBe('minimal'); // Simple display should be minimal impact
      expect(dataRetrievalReq?.complexity).toBe('low'); // Simple retrieval is low complexity
    });

    it('should handle analysis requirements for dashboard and reporting', async () => {
      const rawText = 'Build an analytics dashboard with insights, charts, and trend analysis';
      const intent = await interpreter.parseIntent(rawText);
      
      const requirements = interpreter.identifyTechnicalRequirements(intent);
      
      const analysisReq = requirements.find(req => req.type === 'analysis');
      expect(analysisReq).toBeDefined();
      expect(analysisReq?.description).toContain('dashboard');
      expect(analysisReq?.complexity).toBe('high');
      expect(analysisReq?.quotaImpact).toBe('significant');
    });
  });

  describe('identifyRisks', () => {
    it('should return risks from parsed intent', async () => {
      const rawText = 'Process all user records and generate reports for each';
      const intent = await interpreter.parseIntent(rawText);
      
      const risks = interpreter.identifyRisks(intent);
      
      expect(risks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'excessive_loops',
            severity: 'high'
          })
        ])
      );
    });
  });

  describe('edge cases', () => {
    it('should handle vague intents gracefully', async () => {
      const rawText = 'Make something useful';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.businessObjective).toBeDefined();
      expect(result.operationsRequired.length).toBeGreaterThan(0);
      expect(result.dataSourcesNeeded.length).toBeGreaterThan(0);
    });

    it('should handle technical jargon', async () => {
      const rawText = 'Implement a RESTful API with CRUD endpoints and JWT authentication';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.businessObjective).toContain('restful api');
      expect(result.dataSourcesNeeded).toContain('external_api');
      // Should have at least API operation + auth operation
      expect(result.operationsRequired.length).toBeGreaterThanOrEqual(2);
    });

    it('should identify file-related operations', async () => {
      const rawText = 'Build a file upload system with image processing';
      
      const result = await interpreter.parseIntent(rawText);
      
      expect(result.dataSourcesNeeded).toContain('file_storage');
      expect(result.technicalRequirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'processing'
          })
        ])
      );
    });
  });
});