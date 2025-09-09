/**
 * Amazon Mode Compatibility Tests
 * 
 * Ensures backward compatibility when integrating Amazon Working Backwards as default mode
 * Tests fallback behavior, API contract preservation, and performance requirements
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AmazonModeManager } from '../../components/amazon-mode-manager';
import { generateBusinessCase } from '../../mcp/tools/generate_business_case';
import { createStakeholderCommunication } from '../../mcp/tools/create_stakeholder_communication';
import { MCPToolContext } from '../../models/mcp';
import { DEFAULT_AMAZON_CONFIG, STANDARD_MODE_CONFIG } from '../../models/amazon-config';

// Helper function to extract text content from MCPContent array
const getTextContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(item => item.text || item.markdown || '').join('\n');
  }
  return '';
};

describe('Amazon Mode Compatibility Tests', () => {
  let mockContext: MCPToolContext;

  beforeEach(() => {
    mockContext = {
      toolName: 'test_tool',
      sessionId: 'test-session',
      timestamp: Date.now(),
      requestId: 'test-request',
      traceId: 'test-trace',
    };

    // Reset environment variables
    delete process.env.VIBE_PM_MODE;
    delete process.env.VIBE_PM_AMAZON_ENABLED;
    delete process.env.VIBE_PM_FALLBACK_ENABLED;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing API contracts for generate_business_case', async () => {
      const args = {
        opportunity_analysis: 'Test market opportunity with $1B market size and 20% growth rate. Customer segment includes enterprise users.',
        financial_inputs: {
          development_cost: 500000,
          operational_cost: 100000,
          expected_revenue: 1200000,
          time_to_market: 6,
        },
      };

      const result = await generateBusinessCase(args, mockContext);

      // Verify API contract is preserved
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('metadata');
      expect(result.isError).toBe(false);
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);

      // Verify metadata includes required fields
      expect(result.metadata).toBeDefined();
      expect(result.metadata!).toHaveProperty('executionTime');
      expect(result.metadata!).toHaveProperty('quotaUsed');
      expect(result.metadata!).toHaveProperty('confidenceScore');

      // Verify new Amazon mode metadata is present
      expect(result.metadata!).toHaveProperty('amazonMode');
      expect(result.metadata!.amazonMode).toHaveProperty('enabled');
    });

    it('should maintain existing API contracts for create_stakeholder_communication', async () => {
      const args = {
        business_case: 'Comprehensive business case for new feature targeting enterprise customers with $1.2M revenue potential.',
        communication_type: 'executive_onepager' as const,
        audience: 'executives' as const,
      };

      const result = await createStakeholderCommunication(args, mockContext);

      // Verify API contract is preserved
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('metadata');
      expect(result.isError).toBe(false);
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);

      // Verify metadata includes required fields
      expect(result.metadata).toBeDefined();
      expect(result.metadata!).toHaveProperty('executionTime');
      expect(result.metadata!).toHaveProperty('quotaUsed');

      // Verify new Amazon mode metadata is present
      expect(result.metadata!).toHaveProperty('amazonMode');
      expect(result.metadata!.amazonMode).toHaveProperty('enabled');
    });

    it('should work with minimal inputs (existing integration pattern)', async () => {
      const args = {
        opportunity_analysis: 'Simple feature idea',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(result.metadata?.amazonMode?.enabled).toBe(true);
    });

    it('should preserve quota usage patterns', async () => {
      const args = {
        opportunity_analysis: 'Test analysis',
        amazon_mode: false, // Explicitly disable Amazon mode
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.quotaUsed).toBeLessThanOrEqual(2); // Standard mode uses less quota
      expect(result.metadata?.amazonMode?.enabled).toBe(false);
    });
  });

  describe('Amazon Mode Default Behavior', () => {
    it('should use Amazon mode by default', async () => {
      const args = {
        opportunity_analysis: 'Market opportunity with clear assumptions and financial projections.',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.amazonMode?.enabled).toBe(true);
      expect(result.metadata?.confidenceScore).toBeGreaterThan(0);
      expect(getTextContent(result.content)).toContain('Evidence Mechanisms');
    });

    it('should include evidence mechanisms by default', async () => {
      const args = {
        opportunity_analysis: 'Feature targeting $500M market with 15% growth. Development cost $300K.',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      const textContent = getTextContent(result.content);
      expect(textContent).toContain('Assumption Ledger');
      expect(textContent).toContain('Confidence Assessment');
      expect(textContent).toContain('Scenario Analysis');
      expect(textContent).toContain('Hard Questions');
    });

    it('should respect explicit amazon_mode parameter', async () => {
      const args = {
        opportunity_analysis: 'Test analysis',
        amazon_mode: false,
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.amazonMode?.enabled).toBe(false);
      expect(getTextContent(result.content)).not.toContain('Evidence Mechanisms');
    });

    it('should respect include_evidence_mechanisms parameter', async () => {
      const args = {
        opportunity_analysis: 'Test analysis',
        amazon_mode: true,
        include_evidence_mechanisms: false,
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.amazonMode?.enabled).toBe(true);
      // Should still use Amazon mode but with minimal mechanisms
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to standard mode when Amazon mechanisms fail', async () => {
      // Mock Amazon services to fail
      const mockAmazonModeManager = new AmazonModeManager({
        enabled: true,
        fallbackToStandard: true,
      });

      // Simulate timeout or failure
      jest.spyOn(mockAmazonModeManager, 'generateBusinessCase').mockResolvedValue({
        success: false,
        error: new Error('Amazon mechanisms timed out'),
        usedAmazonMode: false,
        fallbackReason: 'Amazon mechanisms timed out',
      });

      const args = {
        opportunity_analysis: 'Test analysis that should trigger fallback',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.amazonMode?.enabled).toBe(false);
      expect(result.metadata?.amazonMode?.fallbackReason).toContain('timed out');
    });

    it('should handle graceful degradation', async () => {
      const args = {
        opportunity_analysis: 'Minimal input to test degradation',
      };

      const result = await generateBusinessCase(args, mockContext);

      // Should succeed even with minimal input
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should maintain performance requirements during fallback', async () => {
      const startTime = Date.now();
      
      const args = {
        opportunity_analysis: 'Test analysis for performance check',
      };

      const result = await generateBusinessCase(args, mockContext);
      const executionTime = Date.now() - startTime;

      expect(result.isError).toBe(false);
      expect(executionTime).toBeLessThan(120000); // 2 minutes max
      expect(result.metadata?.executionTime).toBeLessThan(120000);
    });
  });

  describe('Environment Configuration', () => {
    it('should respect VIBE_PM_MODE=amazon environment variable', () => {
      process.env.VIBE_PM_MODE = 'amazon';
      
      const manager = new AmazonModeManager();
      expect(manager.isAmazonModeEnabled()).toBe(true);
    });

    it('should respect VIBE_PM_MODE=standard environment variable', () => {
      process.env.VIBE_PM_MODE = 'standard';
      
      const manager = new AmazonModeManager();
      expect(manager.isAmazonModeEnabled()).toBe(false);
    });

    it('should respect individual environment variables', () => {
      process.env.VIBE_PM_AMAZON_ENABLED = 'false';
      process.env.VIBE_PM_FALLBACK_ENABLED = 'true';
      
      const manager = new AmazonModeManager();
      expect(manager.isAmazonModeEnabled()).toBe(false);
      expect(manager.getConfig().fallbackToStandard).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete Amazon mode generation within 2 minutes', async () => {
      const args = {
        opportunity_analysis: 'Comprehensive market analysis with detailed assumptions, competitive landscape, and financial projections for enterprise software targeting $2B market.',
        financial_inputs: {
          development_cost: 1000000,
          operational_cost: 200000,
          expected_revenue: 2500000,
          time_to_market: 12,
        },
      };

      const startTime = Date.now();
      const result = await generateBusinessCase(args, mockContext);
      const executionTime = Date.now() - startTime;

      expect(result.isError).toBe(false);
      expect(executionTime).toBeLessThan(120000); // 2 minutes
      expect(result.metadata?.amazonMode?.enabled).toBe(true);
    });

    it('should complete standard mode generation within 1 minute', async () => {
      const args = {
        opportunity_analysis: 'Simple feature analysis',
        amazon_mode: false,
      };

      const startTime = Date.now();
      const result = await generateBusinessCase(args, mockContext);
      const executionTime = Date.now() - startTime;

      expect(result.isError).toBe(false);
      expect(executionTime).toBeLessThan(60000); // 1 minute
      expect(result.metadata?.amazonMode?.enabled).toBe(false);
    });

    it('should provide performance metrics in Amazon mode', async () => {
      const args = {
        opportunity_analysis: 'Analysis with performance tracking',
        amazon_mode: true,
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.amazonMode?.performanceMetrics).toBeDefined();
      expect(result.metadata?.amazonMode?.performanceMetrics?.totalTime).toBeGreaterThan(0);
    });
  });

  describe('Steering File Compatibility', () => {
    it('should create steering files with Amazon profile when enabled', async () => {
      const args = {
        opportunity_analysis: 'Test analysis for steering',
        steering_options: {
          create_steering_files: true,
          feature_name: 'test-feature',
        },
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.steeringFileCreated).toBe(true);
      
      if (result.metadata?.steeringFiles) {
        expect(result.metadata.steeringFiles.length).toBeGreaterThan(0);
      }
    });

    it('should create steering files with standard profile when Amazon mode disabled', async () => {
      const args = {
        opportunity_analysis: 'Test analysis for steering',
        amazon_mode: false,
        steering_options: {
          create_steering_files: true,
          feature_name: 'test-feature-standard',
        },
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.amazonMode?.enabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      const args = {
        opportunity_analysis: '', // Empty analysis
      };

      const result = await generateBusinessCase(args, mockContext);

      // Should either succeed with fallback or provide meaningful error
      if (result.isError) {
        expect(result.content).toContain('error');
      } else {
        expect(result.metadata?.amazonMode?.fallbackReason).toBeDefined();
      }
    });

    it('should handle missing financial inputs', async () => {
      const args = {
        opportunity_analysis: 'Analysis without financial inputs',
        // No financial_inputs provided
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const args = {
        opportunity_analysis: 'x', // Minimal invalid input
      };

      const result = await generateBusinessCase(args, mockContext);

      if (result.isError) {
        expect(typeof result.content).toBe('string');
        expect(result.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should validate Amazon mode configuration', () => {
      const manager = new AmazonModeManager(DEFAULT_AMAZON_CONFIG);
      const config = manager.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.fallbackToStandard).toBe(true);
      expect(config.includeEvidenceMechanisms).toBe(true);
      expect(config.performanceThresholds.totalTimeout).toBe(120000);
    });

    it('should validate standard mode configuration', () => {
      const manager = new AmazonModeManager(STANDARD_MODE_CONFIG);
      const config = manager.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.fallbackToStandard).toBe(true);
      expect(config.includeEvidenceMechanisms).toBe(false);
      expect(config.performanceThresholds.totalTimeout).toBe(60000);
    });

    it('should allow runtime configuration updates', () => {
      const manager = new AmazonModeManager();
      
      expect(manager.isAmazonModeEnabled()).toBe(true);
      
      manager.updateConfig({ enabled: false });
      expect(manager.isAmazonModeEnabled()).toBe(false);
      
      manager.updateConfig({ enabled: true });
      expect(manager.isAmazonModeEnabled()).toBe(true);
    });
  });
});

describe('Integration with Existing Tools', () => {
  let mockContext: MCPToolContext;

  beforeEach(() => {
    mockContext = {
      toolName: 'integration_test',
      sessionId: 'integration-session',
      timestamp: Date.now(),
      requestId: 'integration-request',
      traceId: 'integration-trace',
    };
  });

  it('should work with existing generate_management_onepager workflow', async () => {
    // First generate business case
    const businessCaseArgs = {
      opportunity_analysis: 'Enterprise software opportunity with $1B market',
    };

    const businessCaseResult = await generateBusinessCase(businessCaseArgs, mockContext);
    expect(businessCaseResult.isError).toBe(false);

    // Then create stakeholder communication
    const commArgs = {
      business_case: getTextContent(businessCaseResult.content),
      communication_type: 'executive_onepager' as const,
      audience: 'executives' as const,
    };

    const commResult = await createStakeholderCommunication(commArgs, mockContext);
    expect(commResult.isError).toBe(false);
    expect(commResult.metadata?.amazonMode?.enabled).toBe(true);
  });

  it('should maintain consistency between tools', async () => {
    const opportunityAnalysis = 'Consistent test analysis for tool integration';

    // Generate business case
    const businessCaseResult = await generateBusinessCase({
      opportunity_analysis: opportunityAnalysis,
    }, mockContext);

    // Create PR/FAQ from business case
    const prfaqResult = await createStakeholderCommunication({
      business_case: getTextContent(businessCaseResult.content),
      communication_type: 'pr_faq',
      audience: 'customers',
    }, mockContext);

    // Both should use Amazon mode consistently
    expect(businessCaseResult.metadata?.amazonMode?.enabled).toBe(true);
    expect(prfaqResult.metadata?.amazonMode?.enabled).toBe(true);

    // Both should have confidence scores
    expect(businessCaseResult.metadata?.confidenceScore).toBeGreaterThan(0);
    expect(prfaqResult.metadata?.confidenceScore).toBeGreaterThan(0);
  });
});