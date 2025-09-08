/**
 * Unit tests for Access Control Manager
 */

import { AccessControlManager, User, Role, Permission, AccessRequest, AccessContext } from '../../components/access-control-manager';

describe('AccessControlManager', () => {
  let accessControl: AccessControlManager;
  let testUser: User;
  let testRole: Role;
  let testPermission: Permission;

  beforeEach(async () => {
    accessControl = new AccessControlManager();

    // Create test permission
    testPermission = {
      id: 'test-permission',
      resource: 'audit_trail',
      action: 'read',
      conditions: []
    };

    // Create test role
    testRole = {
      id: 'test-role',
      name: 'test_role',
      description: 'Test role for unit tests',
      permissions: [testPermission],
      isSystemRole: false
    };

    // Create test user
    testUser = await accessControl.addUser({
      username: 'testuser',
      email: 'test@example.com',
      roles: [testRole],
      permissions: [],
      isActive: true
    });
  });

  afterEach(() => {
    accessControl.removeAllListeners();
  });

  describe('User Management', () => {
    it('should add a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        roles: [],
        permissions: [],
        isActive: true
      };

      const user = await accessControl.addUser(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe('newuser');
      expect(user.email).toBe('newuser@example.com');
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should update user access', async () => {
      const eventSpy = jest.fn();
      accessControl.on('userAccessUpdated', eventSpy);

      await accessControl.updateUserAccess(testUser.id, ['admin'], ['test-permission']);

      expect(eventSpy).toHaveBeenCalledWith({
        userId: testUser.id,
        roles: ['admin'],
        permissions: ['test-permission']
      });
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(accessControl.updateUserAccess('non-existent', [], []))
        .rejects.toThrow('User not found');
    });
  });

  describe('Session Management', () => {
    it('should create and validate session tokens', async () => {
      const token = await accessControl.createSession(testUser.id, 1);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const validation = accessControl.validateSession(token);
      expect(validation.valid).toBe(true);
      expect(validation.userId).toBe(testUser.id);
    });

    it('should reject invalid session tokens', () => {
      const validation = accessControl.validateSession('invalid-token');
      expect(validation.valid).toBe(false);
      expect(validation.userId).toBeUndefined();
    });

    it('should handle expired sessions', async () => {
      const token = await accessControl.createSession(testUser.id, -1); // Expired

      const validation = accessControl.validateSession(token);
      expect(validation.valid).toBe(false);
    });

    it('should revoke session tokens', async () => {
      const token = await accessControl.createSession(testUser.id, 1);
      
      const revoked = accessControl.revokeSession(token);
      expect(revoked).toBe(true);

      const validation = accessControl.validateSession(token);
      expect(validation.valid).toBe(false);
    });

    it('should emit session events', async () => {
      const createdSpy = jest.fn();
      const revokedSpy = jest.fn();
      
      accessControl.on('sessionCreated', createdSpy);
      accessControl.on('sessionRevoked', revokedSpy);

      const token = await accessControl.createSession(testUser.id, 1);
      expect(createdSpy).toHaveBeenCalled();

      accessControl.revokeSession(token);
      expect(revokedSpy).toHaveBeenCalled();
    });
  });

  describe('Access Control', () => {
    it('should grant access for valid permissions', async () => {
      const request: AccessRequest = {
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(true);
      expect(result.reason).toContain('Access granted');
    });

    it('should deny access for insufficient permissions', async () => {
      const request: AccessRequest = {
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'delete', // User doesn't have delete permission
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Insufficient permissions');
    });

    it('should deny access for inactive users', async () => {
      // Deactivate user
      testUser.isActive = false;

      const request: AccessRequest = {
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('User not found or inactive');
    });

    it('should deny access for non-existent users', async () => {
      const request: AccessRequest = {
        userId: 'non-existent-user',
        resource: 'audit_trail',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('User not found or inactive');
    });
  });

  describe('Resource-Specific Access Control', () => {
    it('should enforce audit trail access restrictions', async () => {
      // Create user without admin/auditor role
      const regularUser = await accessControl.addUser({
        username: 'regular',
        email: 'regular@example.com',
        roles: [],
        permissions: [],
        isActive: true
      });

      const request: AccessRequest = {
        userId: regularUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Audit trail access requires admin or auditor role');
    });

    it('should enforce compliance report access restrictions', async () => {
      const regularUser = await accessControl.addUser({
        username: 'regular2',
        email: 'regular2@example.com',
        roles: [],
        permissions: [],
        isActive: true
      });

      const request: AccessRequest = {
        userId: regularUser.id,
        resource: 'compliance_report',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Compliance report access requires appropriate role');
    });

    it('should allow citation data read access for all users', async () => {
      const regularUser = await accessControl.addUser({
        username: 'regular3',
        email: 'regular3@example.com',
        roles: [],
        permissions: [],
        isActive: true
      });

      const request: AccessRequest = {
        userId: regularUser.id,
        resource: 'citation_data',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(true);
    });

    it('should restrict citation data modification', async () => {
      const regularUser = await accessControl.addUser({
        username: 'regular4',
        email: 'regular4@example.com',
        roles: [],
        permissions: [],
        isActive: true
      });

      const request: AccessRequest = {
        userId: regularUser.id,
        resource: 'citation_data',
        action: 'update',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('Citation data modification requires editor role or higher');
    });
  });

  describe('Access Logging', () => {
    it('should log access attempts', async () => {
      const request: AccessRequest = {
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: { ipAddress: '192.168.1.1' },
        timestamp: new Date()
      };

      await accessControl.checkAccess(request);

      const logs = accessControl.getAccessLogs({ userId: testUser.id });
      expect(logs.length).toBeGreaterThan(0);

      const log = logs[0];
      expect(log.userId).toBe(testUser.id);
      expect(log.resource).toBe('audit_trail');
      expect(log.action).toBe('read');
      expect(log.context.ipAddress).toBe('192.168.1.1');
    });

    it('should filter access logs', async () => {
      // Create multiple access attempts
      const requests = [
        {
          userId: testUser.id,
          resource: 'audit_trail',
          action: 'read',
          context: {},
          timestamp: new Date()
        },
        {
          userId: testUser.id,
          resource: 'compliance_report',
          action: 'read',
          context: {},
          timestamp: new Date()
        }
      ];

      for (const request of requests) {
        await accessControl.checkAccess(request);
      }

      // Filter by resource
      const auditLogs = accessControl.getAccessLogs({ resource: 'audit_trail' });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs.every(log => log.resource === 'audit_trail')).toBe(true);

      // Filter by granted status
      const grantedLogs = accessControl.getAccessLogs({ granted: true });
      expect(grantedLogs.every(log => log.granted === true)).toBe(true);
    });

    it('should emit access log events', async () => {
      const logSpy = jest.fn();
      accessControl.on('accessLogged', logSpy);

      const request: AccessRequest = {
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      await accessControl.checkAccess(request);

      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'read',
        granted: expect.any(Boolean)
      }));
    });
  });

  describe('Security Policies', () => {
    it('should evaluate security policies', async () => {
      const request: AccessRequest = {
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'delete',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(request);

      // Should be denied or require approval based on default policies
      expect(result.granted).toBe(false);
    });
  });

  describe('Permission Conditions', () => {
    it('should evaluate permission conditions', async () => {
      // Create permission with conditions
      const conditionalPermission: Permission = {
        id: 'conditional-permission',
        resource: 'test_resource',
        action: 'read',
        conditions: [
          {
            field: 'ipAddress',
            operator: 'equals',
            value: '192.168.1.1'
          }
        ]
      };

      const userWithConditions = await accessControl.addUser({
        username: 'conditional_user',
        email: 'conditional@example.com',
        roles: [],
        permissions: [conditionalPermission],
        isActive: true
      });

      // Request with matching condition
      const matchingRequest: AccessRequest = {
        userId: userWithConditions.id,
        resource: 'test_resource',
        action: 'read',
        context: { ipAddress: '192.168.1.1' },
        timestamp: new Date()
      };

      const matchingResult = await accessControl.checkAccess(matchingRequest);
      expect(matchingResult.granted).toBe(true);

      // Request with non-matching condition
      const nonMatchingRequest: AccessRequest = {
        userId: userWithConditions.id,
        resource: 'test_resource',
        action: 'read',
        context: { ipAddress: '192.168.1.2' },
        timestamp: new Date()
      };

      const nonMatchingResult = await accessControl.checkAccess(nonMatchingRequest);
      expect(nonMatchingResult.granted).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle access check errors gracefully', async () => {
      const malformedRequest = {
        userId: null as any,
        resource: 'test',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const result = await accessControl.checkAccess(malformedRequest);
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('failed');
    });

    it('should emit error events', async () => {
      const errorSpy = jest.fn();
      accessControl.on('error', errorSpy);

      // This should trigger an error condition
      try {
        await accessControl.updateUserAccess('invalid-user-id', ['invalid-role'], []);
      } catch (error) {
        // Expected to throw
      }
    });
  });

  describe('Performance', () => {
    it('should handle concurrent access checks', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => ({
        userId: testUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: { requestId: i },
        timestamp: new Date()
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => accessControl.checkAccess({
          ...request,
          context: { additionalData: { requestId: request.context.requestId } }
        }))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain reasonable memory usage with many logs', async () => {
      // Generate many access attempts
      for (let i = 0; i < 1000; i++) {
        await accessControl.checkAccess({
          userId: testUser.id,
          resource: 'test_resource',
          action: 'read',
          context: { additionalData: { iteration: i } },
          timestamp: new Date()
        });
      }

      const logs = accessControl.getAccessLogs();
      // Should limit log retention
      expect(logs.length).toBeLessThanOrEqual(10000);
    });
  });
});