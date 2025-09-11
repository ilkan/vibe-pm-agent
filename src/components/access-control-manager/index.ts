/**
 * Access Control Manager
 *
 * Provides role-based access control for audit trails, compliance reports,
 * and sensitive citation system operations.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: AccessCondition[];
}

export interface AccessCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  context: AccessContext;
  timestamp: Date;
}

export interface AccessContext {
  documentId?: string;
  auditTrailId?: string;
  complianceReportId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface AccessResult {
  granted: boolean;
  reason: string;
  conditions?: string[];
  expiresAt?: Date;
}

export interface AccessLog {
  id: string;
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
  reason: string;
  context: AccessContext;
  timestamp: Date;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  isActive: boolean;
  priority: number;
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require_approval';
  message: string;
}

export class AccessControlManager extends EventEmitter {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private accessLogs: AccessLog[] = [];
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private sessionTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor() {
    super();
    this.initializeDefaultRoles();
    this.initializeDefaultPolicies();
  }

  /**
   * Check if user has access to perform action on resource
   */
  async checkAccess(request: AccessRequest): Promise<AccessResult> {
    const startTime = Date.now();

    try {
      // Get user
      const user = this.users.get(request.userId);
      if (!user || !user.isActive) {
        return this.logAccessResult(request, {
          granted: false,
          reason: 'User not found or inactive',
        });
      }

      // Check security policies first
      const policyResult = await this.evaluateSecurityPolicies(request, user);
      if (!policyResult.granted) {
        return this.logAccessResult(request, policyResult);
      }

      // Check role-based permissions
      const hasPermission = await this.hasPermission(
        user,
        request.resource,
        request.action,
        request.context
      );
      if (!hasPermission) {
        return this.logAccessResult(request, {
          granted: false,
          reason: 'Insufficient permissions',
        });
      }

      // Check resource-specific conditions
      const conditionResult = await this.evaluateAccessConditions(user, request);
      if (!conditionResult.granted) {
        return this.logAccessResult(request, conditionResult);
      }

      // Access granted
      return this.logAccessResult(request, {
        granted: true,
        reason: 'Access granted',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    } catch (error) {
      return this.logAccessResult(request, {
        granted: false,
        reason: `Access check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Create user session token
   */
  async createSession(userId: string, expirationHours: number = 24): Promise<string> {
    const user = this.users.get(userId);
    if (!user || !user.isActive) {
      throw new Error('Invalid user or user inactive');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    this.sessionTokens.set(token, { userId, expiresAt });

    // Update user last login
    user.lastLogin = new Date();
    user.updatedAt = new Date();

    this.emit('sessionCreated', { userId, token, expiresAt });
    return token;
  }

  /**
   * Validate session token
   */
  validateSession(token: string): { valid: boolean; userId?: string } {
    const session = this.sessionTokens.get(token);
    if (!session) {
      return { valid: false };
    }

    if (session.expiresAt < new Date()) {
      this.sessionTokens.delete(token);
      return { valid: false };
    }

    return { valid: true, userId: session.userId };
  }

  /**
   * Revoke session token
   */
  revokeSession(token: string): boolean {
    const session = this.sessionTokens.get(token);
    if (session) {
      this.sessionTokens.delete(token);
      this.emit('sessionRevoked', { token, userId: session.userId });
      return true;
    }
    return false;
  }

  /**
   * Add or update user
   */
  async addUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    this.emit('userAdded', user);
    return user;
  }

  /**
   * Update user roles and permissions
   */
  async updateUserAccess(userId: string, roles: string[], permissions: string[]): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update roles
    user.roles = roles.map(roleId => {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }
      return role;
    });

    // Update permissions
    user.permissions = permissions.map(permId => {
      const permission = this.permissions.get(permId);
      if (!permission) {
        throw new Error(`Permission not found: ${permId}`);
      }
      return permission;
    });

    user.updatedAt = new Date();
    this.emit('userAccessUpdated', { userId, roles, permissions });
  }

  /**
   * Get audit trail access logs
   */
  getAccessLogs(filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    granted?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }): AccessLog[] {
    let logs = [...this.accessLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.granted !== undefined) {
        logs = logs.filter(log => log.granted === filters.granted);
      }
      if (filters.fromDate) {
        logs = logs.filter(log => log.timestamp >= filters.fromDate!);
      }
      if (filters.toDate) {
        logs = logs.filter(log => log.timestamp <= filters.toDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if user has specific permission
   */
  private async hasPermission(
    user: User,
    resource: string,
    action: string,
    context: AccessContext
  ): Promise<boolean> {
    // Check direct permissions
    const directPermission = user.permissions.find(
      p => p.resource === resource && p.action === action
    );
    if (directPermission) {
      return this.evaluatePermissionConditions(directPermission, context);
    }

    // Check role-based permissions
    for (const role of user.roles) {
      const rolePermission = role.permissions.find(
        p => p.resource === resource && p.action === action
      );
      if (rolePermission) {
        const hasAccess = await this.evaluatePermissionConditions(rolePermission, context);
        if (hasAccess) return true;
      }
    }

    return false;
  }

  /**
   * Evaluate permission conditions
   */
  private async evaluatePermissionConditions(
    permission: Permission,
    context: AccessContext
  ): Promise<boolean> {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true;
    }

    return permission.conditions.every(condition => {
      const contextValue = this.getContextValue(context, condition.field);
      return this.evaluateCondition(contextValue, condition.operator, condition.value);
    });
  }

  /**
   * Evaluate security policies
   */
  private async evaluateSecurityPolicies(
    request: AccessRequest,
    user: User
  ): Promise<AccessResult> {
    const activePolicies = Array.from(this.securityPolicies.values())
      .filter(policy => policy.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of activePolicies) {
      for (const rule of policy.rules) {
        if (this.evaluateSecurityRule(rule, request, user)) {
          if (rule.action === 'deny') {
            return {
              granted: false,
              reason: `Denied by security policy: ${policy.name} - ${rule.message}`,
            };
          } else if (rule.action === 'require_approval') {
            return {
              granted: false,
              reason: `Requires approval: ${policy.name} - ${rule.message}`,
            };
          }
        }
      }
    }

    return { granted: true, reason: 'Passed security policy checks' };
  }

  /**
   * Evaluate access conditions
   */
  private async evaluateAccessConditions(
    user: User,
    request: AccessRequest
  ): Promise<AccessResult> {
    // Resource-specific access conditions
    if (request.resource === 'audit_trail') {
      return this.evaluateAuditTrailAccess(user, request);
    } else if (request.resource === 'compliance_report') {
      return this.evaluateComplianceReportAccess(user, request);
    } else if (request.resource === 'citation_data') {
      return this.evaluateCitationDataAccess(user, request);
    }

    return { granted: true, reason: 'No specific conditions to evaluate' };
  }

  /**
   * Evaluate audit trail access
   */
  private async evaluateAuditTrailAccess(
    user: User,
    request: AccessRequest
  ): Promise<AccessResult> {
    // Only admin and audit roles can access audit trails
    const hasAuditRole = user.roles.some(role => role.name === 'admin' || role.name === 'auditor');

    if (!hasAuditRole) {
      return {
        granted: false,
        reason: 'Audit trail access requires admin or auditor role',
      };
    }

    // Additional conditions for sensitive audit data
    if (request.action === 'delete' || request.action === 'modify') {
      const hasAdminRole = user.roles.some(role => role.name === 'admin');
      if (!hasAdminRole) {
        return {
          granted: false,
          reason: 'Audit trail modification requires admin role',
        };
      }
    }

    return { granted: true, reason: 'Audit trail access granted' };
  }

  /**
   * Evaluate compliance report access
   */
  private async evaluateComplianceReportAccess(
    user: User,
    request: AccessRequest
  ): Promise<AccessResult> {
    // Compliance reports require compliance officer or admin role
    const hasComplianceRole = user.roles.some(
      role => role.name === 'admin' || role.name === 'compliance_officer' || role.name === 'auditor'
    );

    if (!hasComplianceRole) {
      return {
        granted: false,
        reason: 'Compliance report access requires appropriate role',
      };
    }

    return { granted: true, reason: 'Compliance report access granted' };
  }

  /**
   * Evaluate citation data access
   */
  private async evaluateCitationDataAccess(
    user: User,
    request: AccessRequest
  ): Promise<AccessResult> {
    // Most users can read citation data, but modifications require elevated permissions
    if (request.action === 'read') {
      return { granted: true, reason: 'Citation data read access granted' };
    }

    const hasEditRole = user.roles.some(
      role => role.name === 'admin' || role.name === 'editor' || role.name === 'researcher'
    );

    if (!hasEditRole) {
      return {
        granted: false,
        reason: 'Citation data modification requires editor role or higher',
      };
    }

    return { granted: true, reason: 'Citation data modification access granted' };
  }

  /**
   * Log access result
   */
  private logAccessResult(request: AccessRequest, result: AccessResult): AccessResult {
    const logEntry: AccessLog = {
      id: crypto.randomUUID(),
      userId: request.userId,
      resource: request.resource,
      action: request.action,
      granted: result.granted,
      reason: result.reason,
      context: request.context,
      timestamp: request.timestamp,
    };

    this.accessLogs.push(logEntry);
    this.emit('accessLogged', logEntry);

    // Clean up old logs (keep last 10000 entries)
    if (this.accessLogs.length > 10000) {
      this.accessLogs = this.accessLogs.slice(-10000);
    }

    return result;
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'admin',
        name: 'admin',
        description: 'Full system access',
        permissions: [],
        isSystemRole: true,
      },
      {
        id: 'auditor',
        name: 'auditor',
        description: 'Audit trail and compliance access',
        permissions: [],
        isSystemRole: true,
      },
      {
        id: 'compliance_officer',
        name: 'compliance_officer',
        description: 'Compliance reporting access',
        permissions: [],
        isSystemRole: true,
      },
      {
        id: 'editor',
        name: 'editor',
        description: 'Content editing permissions',
        permissions: [],
        isSystemRole: true,
      },
      {
        id: 'researcher',
        name: 'researcher',
        description: 'Research and citation access',
        permissions: [],
        isSystemRole: true,
      },
      {
        id: 'viewer',
        name: 'viewer',
        description: 'Read-only access',
        permissions: [],
        isSystemRole: true,
      },
    ];

    defaultRoles.forEach(role => this.roles.set(role.id, role));
  }

  /**
   * Initialize default security policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'audit_protection',
        name: 'Audit Trail Protection',
        description: 'Protect audit trails from unauthorized access',
        rules: [
          {
            id: 'audit_delete_deny',
            condition: 'resource === "audit_trail" && action === "delete"',
            action: 'require_approval',
            message: 'Audit trail deletion requires approval',
          },
        ],
        isActive: true,
        priority: 100,
      },
      {
        id: 'compliance_access',
        name: 'Compliance Access Control',
        description: 'Control access to compliance reports',
        rules: [
          {
            id: 'compliance_read_restrict',
            condition: 'resource === "compliance_report" && action === "read"',
            action: 'allow',
            message: 'Compliance report access allowed for authorized roles',
          },
        ],
        isActive: true,
        priority: 90,
      },
    ];

    defaultPolicies.forEach(policy => this.securityPolicies.set(policy.id, policy));
  }

  // Helper methods
  private getContextValue(context: AccessContext, field: string): any {
    return (context as any)[field] || context.additionalData?.[field];
  }

  private evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expectedValue;
      case 'not_equals':
        return value !== expectedValue;
      case 'contains':
        return String(value).includes(String(expectedValue));
      case 'not_contains':
        return !String(value).includes(String(expectedValue));
      case 'greater_than':
        return Number(value) > Number(expectedValue);
      case 'less_than':
        return Number(value) < Number(expectedValue);
      default:
        return false;
    }
  }

  private evaluateSecurityRule(rule: SecurityRule, request: AccessRequest, user: User): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    try {
      const condition = rule.condition
        .replace(/resource/g, `"${request.resource}"`)
        .replace(/action/g, `"${request.action}"`)
        .replace(/userId/g, `"${request.userId}"`);

      return eval(condition);
    } catch (error) {
      return false;
    }
  }
}
