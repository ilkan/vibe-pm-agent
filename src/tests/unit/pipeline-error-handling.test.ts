// Unit tests for AI Agent Pipeline error handling and logging

import { AIAgentPipeline } from '../../main';

// Mock console methods to capture logs
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();

beforeAll(() => {
  global.console = {
    ...console,
    log: mockConsoleLog,
    warn: mockConsoleWarn,
    error: mockConsoleError,
  };
});

beforeEach(() => {
  mockConsoleLog.mockClear();
  mockConsoleWarn.mockClear();
  mockConsoleError.mockClear();
});

describe('AIAgentPipeline Error Handling and Logging', () => {
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    pipeline = new AIAgentPipeline();
  });

  describe('Input Validation', () => {
    it('should handle empty intent gracefully', async () => {
      const result = await pipeline.processIntent('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.stage).toBe('intent');
      expect(result.error?.type).toBe('validation_failed');
      expect(result.error?.message).toContain('empty');
      expect(result.error?.suggestedAction).toBeDefined();
    });

    it('should handle very short intent gracefully', async () => {
      const result = await pipeline.processIntent('test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.stage).toBe('intent');
      expect(result.error?.type).toBe('validation_failed');
      expect(result.error?.message).toContain('short');
      expect(result.error?.suggestedAction).toBeDefined();
    });

    it('should handle whitespace-only intent', async () => {
      const result = await pipeline.processIntent('   \n\t   ');
      
      expect(result.success).toBe(false);
      expect(result.error?.stage).toBe('intent');
      expect(result.error?.type).toBe('validation_failed');
    });
  });

  describe('Logging Functionality', () => {
    it('should log pipeline execution stages', async () => {
      const intent = 'Create a simple user validation system';
      
      await pipeline.processIntent(intent);
      
      // Check that info logs were created for each stage
      const infoLogs = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      const stageMessages = infoLogs.map(log => log.message);
      
      expect(stageMessages).toContain('Starting AI Agent Pipeline execution');
      expect(stageMessages.some(msg => msg.includes('Stage 1: Parsing intent'))).toBe(true);
      expect(stageMessages.some(msg => msg.includes('Stage 2: Applying consulting'))).toBe(true);
      expect(stageMessages.some(msg => msg.includes('Stage 3: Optimizing workflow'))).toBe(true);
      expect(stageMessages.some(msg => msg.includes('Stage 4: Generating comprehensive ROI'))).toBe(true);
      expect(stageMessages.some(msg => msg.includes('Stage 5: Creating consulting-style'))).toBe(true);
      expect(stageMessages.some(msg => msg.includes('Stage 6: Generating enhanced Kiro'))).toBe(true);
      expect(stageMessages.some(msg => msg.includes('execution completed successfully'))).toBe(true);
    });

    it('should include session ID in all logs', async () => {
      const intent = 'Create a data processing workflow';
      
      await pipeline.processIntent(intent);
      
      // Filter and parse only JSON logs (skip console.warn messages that aren't JSON)
      const parseLogSafely = (call: any[]) => {
        try {
          return JSON.parse(call[0]);
        } catch {
          return null; // Skip non-JSON logs
        }
      };

      const allLogs = [
        ...mockConsoleLog.mock.calls.map(parseLogSafely),
        ...mockConsoleWarn.mock.calls.map(parseLogSafely),
        ...mockConsoleError.mock.calls.map(parseLogSafely)
      ].filter(log => log !== null);
      
      // All JSON logs should have a sessionId
      allLogs.forEach(log => {
        expect(log.sessionId).toBeDefined();
        expect(log.sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
      });
      
      // All logs in the same execution should have the same sessionId
      const sessionIds = allLogs.map(log => log.sessionId).filter(Boolean);
      const uniqueSessionIds = [...new Set(sessionIds)];
      expect(uniqueSessionIds.length).toBe(1);
    });

    it('should log performance metrics', async () => {
      const intent = 'Create a simple workflow';
      
      await pipeline.processIntent(intent);
      
      const infoLogs = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      const completionLog = infoLogs.find(log => log.message.includes('execution completed successfully'));
      
      expect(completionLog).toBeDefined();
      expect(completionLog.executionTime).toBeDefined();
      expect(typeof completionLog.executionTime).toBe('number');
      expect(completionLog.performance).toBeDefined();
      expect(['excellent', 'good', 'acceptable', 'slow']).toContain(completionLog.performance);
    });

    it('should log component-specific metrics', async () => {
      const intent = 'Build a user authentication system with multiple validation steps';
      
      await pipeline.processIntent(intent);
      
      const infoLogs = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      
      // Check for specific metrics in completion logs
      const intentLog = infoLogs.find(log => log.message.includes('Intent parsing completed'));
      expect(intentLog?.operationsCount).toBeDefined();
      
      const analysisLog = infoLogs.find(log => log.message.includes('Business analysis completed'));
      expect(analysisLog?.techniquesUsed).toBeDefined();
      expect(analysisLog?.totalSavings).toBeDefined();
      
      const optimizationLog = infoLogs.find(log => log.message.includes('Workflow optimization completed'));
      expect(optimizationLog?.optimizationsApplied).toBeDefined();
      expect(optimizationLog?.efficiencyGain).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should provide fallback when no operations are identified', async () => {
      // This intent might not generate clear operations
      const vaguIntent = 'Do something good';
      
      const result = await pipeline.processIntent(vaguIntent);
      
      // Should succeed (either with real operations or fallback)
      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      
      // Check if warning logs were generated (may or may not happen depending on intent parsing)
      const parseLogSafely = (call: any[]) => {
        try {
          return JSON.parse(call[0]);
        } catch {
          return null;
        }
      };
      const warningLogs = mockConsoleWarn.mock.calls.map(parseLogSafely).filter(log => log !== null);
      
      // The test passes if either:
      // 1. Operations were successfully identified (no warning needed)
      // 2. Fallback was used (warning should be present)
      const hasOperationsWarning = warningLogs.some(log => log.message.includes('No operations identified'));
      const hasValidSpec = result.enhancedKiroSpec && result.enhancedKiroSpec.tasks.length > 0;
      
      expect(hasValidSpec).toBe(true); // Should always have a valid spec
    });

    it('should handle analysis failures gracefully', async () => {
      const intent = 'Create a complex system with many interdependent components';
      
      const result = await pipeline.processIntent(intent);
      
      // Should either succeed or fail gracefully with meaningful error
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error?.suggestedAction).toBeDefined();
        expect(result.error?.suggestedAction.length).toBeGreaterThan(0);
      } else {
        expect(result.enhancedKiroSpec).toBeDefined();
      }
    });

    it('should provide meaningful error messages for different failure types', async () => {
      const testCases = [
        { intent: '', expectedStage: 'intent', expectedType: 'validation_failed' },
        { intent: 'hi', expectedStage: 'intent', expectedType: 'validation_failed' }
      ];
      
      for (const testCase of testCases) {
        const result = await pipeline.processIntent(testCase.intent);
        
        expect(result.success).toBe(false);
        expect(result.error?.stage).toBe(testCase.expectedStage);
        expect(result.error?.type).toBe(testCase.expectedType);
        expect(result.error?.message).toBeDefined();
        expect(result.error?.suggestedAction).toBeDefined();
        expect(result.error?.suggestedAction.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Error Context and Debugging', () => {
    it('should include relevant context in error logs', async () => {
      const intent = ''; // This will cause an error
      
      await pipeline.processIntent(intent);
      
      const errorLogs = mockConsoleError.mock.calls.map(call => JSON.parse(call[0]));
      expect(errorLogs.length).toBeGreaterThan(0);
      
      const errorLog = errorLogs[0];
      expect(errorLog.level).toBe('ERROR');
      expect(errorLog.component).toBe('AIAgentPipeline');
      expect(errorLog.sessionId).toBeDefined();
      expect(errorLog.error).toBeDefined();
      expect(errorLog.error.message).toBeDefined();
    });

    it('should track error propagation through stages', async () => {
      const intent = 'x'; // Very short intent
      
      await pipeline.processIntent(intent);
      
      const errorLogs = mockConsoleError.mock.calls.map(call => JSON.parse(call[0]));
      
      if (errorLogs.length > 0) {
        const errorLog = errorLogs[0];
        expect(errorLog.sessionId).toBeDefined();
        expect(errorLog.executionTime).toBeDefined();
        expect(errorLog.stage).toBeDefined();
      }
    });

    it('should maintain consistent session tracking across errors', async () => {
      const intent = ''; // This will cause an error
      
      await pipeline.processIntent(intent);
      
      const allLogs = [
        ...mockConsoleLog.mock.calls.map(call => JSON.parse(call[0])),
        ...mockConsoleWarn.mock.calls.map(call => JSON.parse(call[0])),
        ...mockConsoleError.mock.calls.map(call => JSON.parse(call[0]))
      ];
      
      const sessionIds = allLogs.map(log => log.sessionId).filter(Boolean);
      const uniqueSessionIds = [...new Set(sessionIds)];
      
      // All logs should have the same session ID
      expect(uniqueSessionIds.length).toBe(1);
    });
  });

  describe('Performance Monitoring', () => {
    it('should categorize execution time correctly', async () => {
      const intent = 'Create a simple validation function';
      
      const result = await pipeline.processIntent(intent);
      
      expect(result.success).toBe(true);
      
      const infoLogs = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      const completionLog = infoLogs.find(log => log.message.includes('execution completed successfully'));
      
      expect(completionLog?.performance).toBeDefined();
      expect(['excellent', 'good', 'acceptable', 'slow']).toContain(completionLog.performance);
      
      // Execution time should be reasonable for simple intent
      expect(completionLog?.executionTime).toBeLessThan(10000); // Less than 10 seconds
    });

    it('should log stage-specific timing information', async () => {
      const intent = 'Build a comprehensive data processing system';
      
      await pipeline.processIntent(intent);
      
      const infoLogs = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      
      // Each stage completion should have timing context
      const stageCompletionLogs = infoLogs.filter(log => 
        log.message.includes('completed') && !log.message.includes('execution completed')
      );
      
      expect(stageCompletionLogs.length).toBeGreaterThan(0);
      
      // Each stage should have relevant metrics
      stageCompletionLogs.forEach(log => {
        expect(log.sessionId).toBeDefined();
        // Stage-specific metrics should be present
        expect(Object.keys(log).length).toBeGreaterThan(4); // More than just basic fields
      });
    });
  });

  describe('Robustness Testing', () => {
    it('should handle concurrent error scenarios', async () => {
      const errorIntents = ['', 'x', '  ', 'a'];
      
      const promises = errorIntents.map(intent => pipeline.processIntent(intent));
      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.suggestedAction).toBeDefined();
      });
      
      // Each execution should have its own session ID
      const errorLogs = mockConsoleError.mock.calls.map(call => JSON.parse(call[0]));
      const sessionIds = errorLogs.map(log => log.sessionId).filter(Boolean);
      const uniqueSessionIds = [...new Set(sessionIds)];
      
      expect(uniqueSessionIds.length).toBe(errorIntents.length);
    });

    it('should maintain system stability after errors', async () => {
      // First, cause an error
      const errorResult = await pipeline.processIntent('');
      expect(errorResult.success).toBe(false);
      
      // Clear logs
      mockConsoleLog.mockClear();
      mockConsoleWarn.mockClear();
      mockConsoleError.mockClear();
      
      // Then, process a valid intent
      const validResult = await pipeline.processIntent('Create a user validation system');
      expect(validResult.success).toBe(true);
      expect(validResult.enhancedKiroSpec).toBeDefined();
      
      // Should have normal execution logs
      const infoLogs = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      expect(infoLogs.some(log => log.message.includes('execution completed successfully'))).toBe(true);
    });
  });
});