// MCP Server startup and configuration tests

import { PMAgentMCPServer } from '../../mcp/server';
import { MCPLogger } from '../../utils/mcp-error-handling';
import { LogLevel } from '../../models/mcp';

describe('MCP Server Startup Tests', () => {
  let server: PMAgentMCPServer | undefined;

  afterEach(async () => {
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
      server = undefined;
    }
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Force exit to prevent hanging
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize with default configuration', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      expect(status.status).toBe('healthy');
      expect(status.toolsRegistered).toBeGreaterThan(0);
      expect(status.performance.totalRequests).toBe(0);
      expect(status.performance.errorRate).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      server = new PMAgentMCPServer({
        enableLogging: false,
        enableMetrics: false,
        logLevel: LogLevel.ERROR
      });
      
      const status = server.getStatus();
      expect(status.status).toBe('healthy');
      expect(status.toolsRegistered).toBeGreaterThan(0);
    });

    it('should register all required MCP tools', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      // Should register all 10 MCP tools
      expect(status.toolsRegistered).toBe(10);
    });
  });

  describe('Configuration Options', () => {
    it('should support logging configuration', () => {
      // Test with logging enabled
      server = new PMAgentMCPServer({ enableLogging: true, logLevel: LogLevel.DEBUG });
      expect(server.getStatus().status).toBe('healthy');
      
      // Test with logging disabled
      const serverNoLog = new PMAgentMCPServer({ enableLogging: false });
      expect(serverNoLog.getStatus().status).toBe('healthy');
    });

    it('should support metrics configuration', () => {
      // Test with metrics enabled
      server = new PMAgentMCPServer({ enableMetrics: true });
      const status = server.getStatus();
      expect(status.performance).toBeDefined();
      expect(status.performance.totalRequests).toBe(0);
      
      // Test with metrics disabled
      const serverNoMetrics = new PMAgentMCPServer({ enableMetrics: false });
      expect(serverNoMetrics.getStatus().status).toBe('healthy');
    });

    it('should handle different log levels', () => {
      const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
      
      logLevels.forEach(level => {
        const testServer = new PMAgentMCPServer({ logLevel: level });
        expect(testServer.getStatus().status).toBe('healthy');
      });
    });
  });

  describe('Server Status and Health', () => {
    it('should provide accurate status information', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('toolsRegistered');
      expect(status).toHaveProperty('performance');
      
      expect(status.performance).toHaveProperty('averageResponseTime');
      expect(status.performance).toHaveProperty('totalRequests');
      expect(status.performance).toHaveProperty('errorRate');
    });

    it('should track uptime correctly', async () => {
      server = new PMAgentMCPServer();
      const initialStatus = server.getStatus();
      const initialUptime = initialStatus.uptime;
      
      // Wait a bit and check uptime increased
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedStatus = server.getStatus();
      expect(updatedStatus.uptime).toBeGreaterThan(initialUptime);
    });

    it('should initialize performance metrics', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      expect(status.performance.averageResponseTime).toBe(0);
      expect(status.performance.totalRequests).toBe(0);
      expect(status.performance.errorRate).toBe(0);
    });
  });

  describe('Tool Registration', () => {
    it('should register all PM document generation tools', () => {
      server = new PMAgentMCPServer();
      
      // The server should register these tools:
      // 1. optimize_intent
      // 2. analyze_workflow
      // 3. generate_roi_analysis
      // 4. get_consulting_summary
      // 5. generate_management_onepager
      // 6. generate_pr_faq
      // 7. generate_requirements
      // 8. generate_design_options
      // 9. generate_task_plan
      // 10. validate_idea_quick
      
      const status = server.getStatus();
      expect(status.toolsRegistered).toBe(10);
    });

    it('should handle tool registration errors gracefully', () => {
      // This test ensures the server can handle tool registration issues
      expect(() => {
        server = new PMAgentMCPServer();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Test that server can be created even with potential issues
      expect(() => {
        server = new PMAgentMCPServer({
          enableLogging: true,
          enableMetrics: true,
          logLevel: LogLevel.DEBUG
        });
      }).not.toThrow();
    });

    it('should maintain healthy status after initialization', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      expect(status.status).toBe('healthy');
      expect(status.lastError).toBeUndefined();
    });
  });

  describe('Logging Integration', () => {
    it('should initialize logging system correctly', () => {
      // Test that logging doesn't throw errors during initialization
      expect(() => {
        server = new PMAgentMCPServer({ enableLogging: true, logLevel: LogLevel.INFO });
      }).not.toThrow();
    });

    it('should handle logging configuration changes', () => {
      server = new PMAgentMCPServer({ enableLogging: false });
      expect(server.getStatus().status).toBe('healthy');
      
      // Change logging level (simulated)
      MCPLogger.setLogLevel(LogLevel.DEBUG);
      expect(server.getStatus().status).toBe('healthy');
    });
  });

  describe('Quick Validation Tool Integration', () => {
    it('should include quick validation tool in registration', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      // Should include validate_idea_quick tool
      expect(status.toolsRegistered).toBeGreaterThanOrEqual(10);
    });

    it('should handle quick validation tool configuration', () => {
      expect(() => {
        server = new PMAgentMCPServer({
          enableLogging: true,
          logLevel: LogLevel.DEBUG
        });
      }).not.toThrow();
      
      if (server) {
        const status = server.getStatus();
        expect(status.status).toBe('healthy');
      }
    });
  });

  describe('PM Document Tools Integration', () => {
    it('should register all PM document generation tools', () => {
      server = new PMAgentMCPServer();
      const status = server.getStatus();
      
      // Should register management one-pager, PR-FAQ, requirements, design options, and task plan tools
      expect(status.toolsRegistered).toBe(10);
    });

    it('should handle PM document tool configuration', () => {
      expect(() => {
        server = new PMAgentMCPServer({
          enableLogging: true,
          enableMetrics: true
        });
      }).not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should initialize performance tracking', () => {
      server = new PMAgentMCPServer({ enableMetrics: true });
      const status = server.getStatus();
      
      expect(status.performance).toBeDefined();
      expect(typeof status.performance.averageResponseTime).toBe('number');
      expect(typeof status.performance.totalRequests).toBe('number');
      expect(typeof status.performance.errorRate).toBe('number');
    });

    it('should handle metrics collection configuration', () => {
      // Test with metrics enabled
      const serverWithMetrics = new PMAgentMCPServer({ enableMetrics: true });
      expect(serverWithMetrics.getStatus().performance).toBeDefined();
      
      // Test with metrics disabled
      const serverNoMetrics = new PMAgentMCPServer({ enableMetrics: false });
      expect(serverNoMetrics.getStatus().performance).toBeDefined(); // Should still have basic structure
    });
  });
});