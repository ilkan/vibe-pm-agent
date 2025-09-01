// Integration tests for MCP quick validation tool

import { PMAgentMCPServer } from '../../mcp/server';
import { ValidateIdeaQuickArgs, MCPToolContext } from '../../models/mcp';

describe('MCP Quick Validation Integration', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer({ enableLogging: false });
    
    mockContext = {
      toolName: 'validate_idea_quick',
      sessionId: 'integration-test-session',
      timestamp: Date.now(),
      requestId: 'req-integration-123',
      traceId: 'trace-integration-123'
    };
  });

  afterEach(async () => {
    // Clean up server resources to prevent hanging tests
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('End-to-End Quick Validation', () => {
    it('should validate a clear, well-defined idea as PASS', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I want to create a simple dashboard that shows our daily sales metrics from our existing database, with basic charts for revenue, orders, and top products',
        context: {
          urgency: 'medium',
          budget_range: 'medium',
          team_size: 2
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** PASS');
      expect(result.content[0].text).toContain('Clear objective with manageable complexity');
      expect(result.content[0].text).toContain('Option A:');
      expect(result.content[0].text).toContain('Option B:');
      expect(result.content[0].text).toContain('Option C:');
      expect(result.metadata?.quotaUsed).toBe(1);
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
    });

    it('should validate a vague idea as FAIL', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Make things better',
        context: {
          urgency: 'high',
          budget_range: 'small',
          team_size: 1
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** FAIL');
      expect(result.content[0].text).toContain('Missing clear business objective');
      expect(result.content[0].text).toContain('Simplify & Retry');
      expect(result.content[0].text).toContain('Add Context');
      expect(result.content[0].text).toContain('Research First');
    });

    it('should validate a complex, quota-intensive idea as FAIL due to context constraints', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I want to build a comprehensive real-time machine learning system that continuously monitors all our data streams, processes big data analytics for each customer, and generates personalized recommendations using complex algorithms',
        context: {
          urgency: 'high',
          budget_range: 'small',
          team_size: 2
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** FAIL');
      expect(result.content[0].text).toContain('High urgency conflicts with broad scope');
      expect(result.content[0].text).toContain('narrow focus needed');
    });

    it('should validate a complex, quota-intensive idea as FAIL due to complexity and quota risks', async () => {
      // Arrange - no context constraints to trigger the complexity + quota risk check
      const args: ValidateIdeaQuickArgs = {
        idea: 'I want to build a real-time machine learning system that processes all customer data using complex algorithms and generates multiple reports for each user',
        context: {
          urgency: 'medium',
          budget_range: 'medium',
          team_size: 3
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** FAIL');
      expect(result.content[0].text).toContain('High complexity + quota risks');
      expect(result.content[0].text).toContain('simplification');
    });

    it('should validate an idea with quota risks but adequate budget as PASS', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I need to process all customer records and generate reports for each one, iterating through our entire database to analyze patterns',
        context: {
          urgency: 'low',
          budget_range: 'large',
          team_size: 5
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** PASS');
      expect(result.content[0].text).toContain('manageable complexity');
    });

    it('should handle validation without context gracefully', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I want to automate our invoice processing workflow to reduce manual data entry and improve accuracy'
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** PASS');
      expect(result.content[0].text).toContain('Clear objective');
      expect(result.content[0].text).toContain('Next Steps');
    });

    it('should provide appropriate options for successful validation', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Create a notification system that alerts managers when inventory levels drop below threshold',
        context: {
          urgency: 'medium',
          budget_range: 'medium',
          team_size: 3
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      const responseText = result.content[0].text!;
      
      // Should contain all three options
      expect(responseText).toContain('Option A:');
      expect(responseText).toContain('Option B:');
      expect(responseText).toContain('Option C:');
      
      // Should contain trade-offs for each option
      expect(responseText).toContain('**Trade-offs:**');
      
      // Should contain next steps for each option
      expect(responseText).toContain('**Next Step:**');
      
      // Should contain separators between options
      expect(responseText).toContain('---');
    });

    it('should handle edge case with minimum viable idea', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I need help with user login',
        context: {
          urgency: 'high',
          budget_range: 'small',
          team_size: 1
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // This should likely fail due to being too vague
      const responseText = result.content[0].text!;
      expect(responseText).toContain('**Verdict:**');
      expect(responseText).toContain('**Reasoning:**');
      expect(responseText).toContain('Option A:');
      expect(responseText).toContain('Option B:');
      expect(responseText).toContain('Option C:');
    });

    it('should complete validation within reasonable time', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Build a customer feedback collection system with email notifications and basic analytics dashboard',
        context: {
          urgency: 'medium',
          budget_range: 'medium',
          team_size: 4
        }
      };

      const startTime = Date.now();

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.executionTime).toBeLessThan(1000);
    });
  });

  describe('Response Format Validation', () => {
    it('should format response with proper markdown structure', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Create a simple task management tool for our team',
        context: {
          urgency: 'low',
          budget_range: 'medium',
          team_size: 3
        }
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      const responseText = result.content[0].text!;
      
      // Check markdown structure
      expect(responseText).toMatch(/^# Quick Validation Result/);
      expect(responseText).toContain('**Verdict:**');
      expect(responseText).toContain('**Reasoning:**');
      expect(responseText).toContain('## Next Steps (Choose One)');
      expect(responseText).toMatch(/### Option [ABC]:/);
      expect(responseText).toContain('**Trade-offs:**');
      expect(responseText).toContain('**Next Step:**');
      
      // Check that options are properly separated
      const optionMatches = responseText.match(/### Option [ABC]:/g);
      expect(optionMatches).toHaveLength(3);
    });

    it('should include all required fields in response', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Implement automated testing for our web application'
      };

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.executionTime).toBeGreaterThan(0);
      expect(result.metadata!.quotaUsed).toBe(1);
      expect(result.isError).toBeFalsy();
    });
  });
});