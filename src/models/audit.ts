// Audit trail and compliance models for citation tracking

/**
 * Types of audit events that can be tracked
 */
export enum AuditEventType {
  CITATION_CREATED = 'citation_created',
  CITATION_MODIFIED = 'citation_modified',
  CITATION_DELETED = 'citation_deleted',
  CITATION_VALIDATED = 'citation_validated',
  DOCUMENT_GENERATED = 'document_generated',
  QUALITY_ASSESSED = 'quality_assessed',
  COMPLIANCE_CHECKED = 'compliance_checked',
  SOURCE_ACCESSED = 'source_accessed',
  BATCH_OPERATION = 'batch_operation',
}

/**
 * Severity levels for audit events
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * User information for audit attribution
 */
export interface AuditUser {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
  sessionId?: string;
}

/**
 * Individual audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  user: AuditUser;
  
  // Event details
  resourceId: string; // Citation ID, Document ID, etc.
  resourceType: 'citation' | 'document' | 'validation' | 'assessment';
  action: string; // Specific action performed
  
  // Change tracking
  previousState?: any;
  newState?: any;
  changeDescription: string;
  
  // Context information
  documentId?: string;
  documentType?: string;
  toolUsed?: string;
  requestId?: string;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  additionalMetadata?: Record<string, any>;
}

/**
 * Compliance standards and requirements
 */
export interface ComplianceStandard {
  id: string;
  name: string;
  version: string;
  description: string;
  requirements: ComplianceRequirement[];
  applicableIndustries: string[];
  mandatoryFields: string[];
  retentionPeriodMonths: number;
}

/**
 * Individual compliance requirement
 */
export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: 'data_retention' | 'source_validation' | 'audit_trail' | 'access_control' | 'documentation';
  severity: 'mandatory' | 'recommended' | 'optional';
  validationRules: ValidationRule[];
  evidenceRequired: string[];
}

/**
 * Validation rules for compliance checking
 */
export interface ValidationRule {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists' | 'min_length' | 'max_age';
  value: any;
  errorMessage: string;
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  standardId: string;
  isCompliant: boolean;
  overallScore: number; // 0-100
  checkedAt: Date;
  
  requirementResults: ComplianceRequirementResult[];
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  
  // Evidence and documentation
  evidenceCollected: EvidenceItem[];
  auditTrailComplete: boolean;
  documentationComplete: boolean;
}

/**
 * Result for individual compliance requirement
 */
export interface ComplianceRequirementResult {
  requirementId: string;
  isCompliant: boolean;
  score: number;
  evidence: EvidenceItem[];
  issues: string[];
  recommendations: string[];
}

/**
 * Compliance violation details
 */
export interface ComplianceViolation {
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedResources: string[];
  remediation: string[];
  deadline?: Date;
}

/**
 * Compliance improvement recommendation
 */
export interface ComplianceRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  actionItems: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  expectedBenefit: string;
}

/**
 * Evidence item for compliance documentation
 */
export interface EvidenceItem {
  id: string;
  type: 'audit_log' | 'validation_report' | 'quality_assessment' | 'user_action' | 'system_log';
  description: string;
  timestamp: Date;
  source: string;
  data: any;
  hash?: string; // For integrity verification
}

/**
 * Audit trail query parameters
 */
export interface AuditTrailQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  userIds?: string[];
  resourceIds?: string[];
  resourceTypes?: string[];
  documentIds?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit trail summary statistics
 */
export interface AuditTrailSummary {
  totalEvents: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  eventTypeDistribution: Record<AuditEventType, number>;
  severityDistribution: Record<AuditSeverity, number>;
  topUsers: Array<{
    userId: string;
    eventCount: number;
  }>;
  topResources: Array<{
    resourceId: string;
    resourceType: string;
    eventCount: number;
  }>;
  complianceStatus: {
    overallScore: number;
    standardsChecked: number;
    violationsCount: number;
    lastChecked: Date;
  };
}

/**
 * Audit report configuration
 */
export interface AuditReportConfig {
  reportType: 'summary' | 'detailed' | 'compliance' | 'user_activity' | 'resource_changes';
  timeRange: {
    start: Date;
    end: Date;
  };
  includeDetails: boolean;
  includeEvidence: boolean;
  includeRecommendations: boolean;
  format: 'json' | 'pdf' | 'csv' | 'html';
  filters?: AuditTrailQuery;
  complianceStandards?: string[];
}

/**
 * Generated audit report
 */
export interface AuditReport {
  id: string;
  config: AuditReportConfig;
  generatedAt: Date;
  generatedBy: AuditUser;
  
  summary: AuditTrailSummary;
  entries: AuditLogEntry[];
  complianceResults?: ComplianceCheckResult[];
  
  // Report metadata
  totalPages?: number;
  exportPath?: string;
  hash?: string; // For integrity verification
}

/**
 * Audit trail retention policy
 */
export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  
  // Retention rules
  defaultRetentionMonths: number;
  eventTypeRetention: Record<AuditEventType, number>;
  severityRetention: Record<AuditSeverity, number>;
  
  // Archive and deletion rules
  archiveAfterMonths: number;
  deleteAfterMonths: number;
  complianceOverride: boolean; // Don't delete if compliance requires retention
  
  // Notification settings
  notifyBeforeArchive: boolean;
  notifyBeforeDelete: boolean;
  notificationDays: number;
}

/**
 * Data integrity verification
 */
export interface IntegrityVerification {
  resourceId: string;
  resourceType: string;
  timestamp: Date;
  hash: string;
  algorithm: 'sha256' | 'sha512';
  verified: boolean;
  verificationDate?: Date;
  issues?: string[];
}

/**
 * Audit trail configuration
 */
export interface AuditTrailConfig {
  enabled: boolean;
  logLevel: AuditSeverity;
  retentionPolicy: RetentionPolicy;
  complianceStandards: ComplianceStandard[];
  
  // Storage settings
  storageType: 'database' | 'file' | 'cloud';
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  
  // Performance settings
  batchSize: number;
  flushIntervalSeconds: number;
  maxMemoryMB: number;
  
  // Notification settings
  alertOnViolations: boolean;
  alertOnErrors: boolean;
  notificationEndpoints: string[];
}