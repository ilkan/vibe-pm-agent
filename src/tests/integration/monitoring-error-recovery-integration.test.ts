/**
 * Integration tests for monitoring and error recovery systems
 */

import { MonitoringOrchestrator } from '../../components/monitoring-orchestrator';
import { ErrorRecoveryManager } from '../../components/error-recovery-manager';
import { CloudWatchMonitor } from '../../components/cloudwatch-monitor';
import { XRayTracer } from '../../components/xray-tracer';
import { HealthMonitor } from '../../components/health-monitor';
import { MonitoringConfig } from '../../interfaces/nvidia-nim-core';

describe('Monitoring and Error Recovery Integration', () => {
  let monitoringOrchestrator: MonitoringOrchestrator;
  let errorRecoveryManager: ErrorRecoveryManager;

  const mockConfig = {
    monitoring: {
      cloudWatchEnabled: false, // Disable for testing
      xrayTracingEnabled: false, // Disable for testing
      customMetrics: [],
      alertingConfig: {
        alertThresholds: [],
        autoResolve: true
      },
      loggingConfig: {
        logLevel: 'info' as const,
        logGroups: [],
        retentionDays: 7,
        structuredLogging: true
      }
    } as MonitoringConfig,
    region: 'us-east-1',
    enableHealthChecks: false, // Disable for testing
    enableErrorRecovery: true,
    alertSnsTopicArn: undefined
  };

  beforeEach(() => {
    monitoringOrchestrator = new MonitoringOrchestrator(mockConfig);
    errorRecoveryManager = new ErrorRecoveryManager();
  });

  afterEach(async () => {
    await monitoringOrchestrator.shutdown();
  });

  describe('Monitored Operation Execution', () => {
    it('should execute operation with monitoring and error recovery', async () => {
      let callCount = 0;
      const mockOperation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      // Setup error recovery
      errorRecoveryManager.registerRetryHandler('test-service', {
        maxAttempts: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        jitterEnabled: false,
        retryableErrors: ['Temporary failure']
      });

      const result = await monitoringOrchestrator.executeMonitoredOperation(
        'test-service',
        'test-operation',
        () => errorRecoveryManager.executeWithRecovery(
          'test-service',
          mockOperation,
          'test-operation'
        ),
        {
          enableRetry: true,
          customMetrics: { testMetric: 1 }
        }
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should handle circuit breaker integration', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      // Setup circuit breaker
      errorRecoveryManager.registerCircuitBreaker('test-service', {
        failureThreshold: 2,
        recoveryTimeoutMs: 1000,
        monitoringPeriodMs: 100,
        halfOpenMaxCalls: 1,
        minimumThroughput: 1
      });

      // First few calls should fail and trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await monitoringOrchestrator.executeMonitoredOperation(
            'test-service',
            'test-operation',
            () => errorRecoveryManager.executeWithRecovery(
              'test-service',
              mockOperation,
              'test-operation'
            ),
            { enableCircuitBreaker: true }
          );
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit breaker should now be open
      const metrics = errorRecoveryManager.getRecoveryMetrics();
      const circuitBreakerStatus = metrics.get('test-service_circuit_breaker');
      expect(circuitBreakerStatus?.state).toBe('OPEN');
    });

    it('should collect system metrics correctly', async () => {
      await monitoringOrchestrator.initialize();

      const systemMetrics = await monitoringOrchestrator.getSystemMetrics();

      expect(systemMetrics).toHaveProperty('timestamp');
      expect(systemMetrics).toHaveProperty('services');
      expect(systemMetrics).toHaveProperty('overallHealth');
      expect(systemMetrics).toHaveProperty('activeAlerts');
      expect(systemMetrics).toHaveProperty('totalRequests');
      expect(systemMetrics).toHaveProperty('errorCount');
      expect(systemMetrics).toHaveProperty('averageLatency');

      expect(Array.isArray(systemMetrics.services)).toBe(true);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(systemMetrics.overallHealth);
    });

    it('should perform comprehensive health check', async () => {
      await monitoringOrchestrator.initialize();

      const healthCheck = await monitoringOrchestrator.performSystemHealthCheck();

      expect(healthCheck).toHaveProperty('healthy');
      expect(healthCheck).toHaveProperty('details');
      expect(healthCheck).toHaveProperty('recommendations');

      expect(typeof healthCheck.healthy).toBe('boolean');
      expect(Array.isArray(healthCheck.recommendations)).toBe(true);
      expect(healthCheck.details).toHaveProperty('systemMetrics');
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should setup default recovery strategies', () => {
      errorRecoveryManager.setupDefaultRecoveryStrategies();

      const metrics = errorRecoveryManager.getRecoveryMetrics();
      
      // Should have circuit breakers for default services
      expect(metrics.has('nvidia-nim-service_circuit_breaker')).toBe(true);
      expect(metrics.has('bedrock-agents_circuit_breaker')).toBe(true);
      expect(metrics.has('lambda-functions_circuit_breaker')).toBe(true);
    });

    it('should reset all circuit breakers', () => {
      errorRecoveryManager.setupDefaultRecoveryStrategies();
      
      // Reset all circuit breakers
      errorRecoveryManager.resetAllCircuitBreakers();

      const metrics = errorRecoveryManager.getRecoveryMetrics();
      
      // All circuit breakers should be in CLOSED state
      for (const [key, value] of metrics) {
        if (key.includes('circuit_breaker')) {
          expect(value.state).toBe('CLOSED');
          expect(value.failureCount).toBe(0);
        }
      }
    });

    it('should clear all caches', () => {
      errorRecoveryManager.setupDefaultRecoveryStrategies();
      
      // This should not throw an error
      expect(() => {
        errorRecoveryManager.clearAllCaches();
      }).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should get and update monitoring configuration', () => {
      const originalConfig = monitoringOrchestrator.getConfig();
      expect(originalConfig).toEqual(mockConfig);

      const newConfig = {
        ...mockConfig,
        enableHealthChecks: true
      };

      monitoringOrchestrator.updateConfig(newConfig);
      const updatedConfig = monitoringOrchestrator.getConfig();
      expect(updatedConfig.enableHealthChecks).toBe(true);
    });

    it('should provide access to individual components', () => {
      const components = monitoringOrchestrator.getComponents();

      expect(components).toHaveProperty('cloudWatchMonitor');
      expect(components).toHaveProperty('xrayTracer');
      expect(components).toHaveProperty('healthMonitor');
      expect(components).toHaveProperty('errorRecoveryManager');

      expect(components.cloudWatchMonitor).toBeInstanceOf(CloudWatchMonitor);
      expect(components.xrayTracer).toBeInstanceOf(XRayTracer);
      expect(components.healthMonitor).toBeInstanceOf(HealthMonitor);
      expect(components.errorRecoveryManager).toBeInstanceOf(ErrorRecoveryManager);
    });
  });

  describe('Error Handling', () => {
    it('should handle monitoring initialization errors gracefully', async () => {
      const invalidConfig = {
        ...mockConfig,
        region: 'invalid-region'
      };

      const orchestrator = new MonitoringOrchestrator(invalidConfig);

      // Should not throw during initialization
      await expect(orchestrator.initialize()).resolves.not.toThrow();
      
      await orchestrator.shutdown();
    });

    it('should handle operation execution errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(
        monitoringOrchestrator.executeMonitoredOperation(
          'test-service',
          'test-operation',
          mockOperation
        )
      ).rejects.toThrow('Operation failed');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metrics Collection', () => {
    it('should record operation metrics for successful operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await monitoringOrchestrator.executeMonitoredOperation(
        'test-service',
        'test-operation',
        mockOperation,
        {
          customMetrics: {
            customCounter: 5,
            customGauge: 10.5
          }
        }
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should record operation metrics for failed operations', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        monitoringOrchestrator.executeMonitoredOperation(
          'test-service',
          'test-operation',
          mockOperation
        )
      ).rejects.toThrow('Test error');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });
});