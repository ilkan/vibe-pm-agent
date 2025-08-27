// Intent Interpreter component interface and implementation

import { ParsedIntent, TechnicalRequirement, OptionalParams, Operation, Risk } from '../../models';
import { validateRawIntent, validateOptionalParams, validateParsedIntent, ValidationError } from '../../utils/validation';
import { ErrorHandler, IntentParsingError } from '../../utils/error-handling';

export interface IIntentInterpreter {
  parseIntent(rawText: string, params?: OptionalParams): Promise<ParsedIntent>;
  extractBusinessObjective(intent: ParsedIntent): string;
  identifyTechnicalRequirements(intent: ParsedIntent): TechnicalRequirement[];
  identifyRisks(intent: ParsedIntent): Risk[];
}

export class IntentInterpreter implements IIntentInterpreter {
  private readonly businessObjectivePatterns = [
    /(?:i want to|i need to|create|build|develop|implement)\s+(.+?)(?:\s+(?:with|that|for|using)|\.|$)/i,
    /(?:help me|assist me|guide me)\s+(?:to\s+)?(.+?)(?:\s+(?:with|that|for|using)|\.|$)/i,
    /(?:make|generate|produce)\s+(?:a|an)?\s*(.+?)(?:\s+(?:with|that|for|using)|\.|$)/i
  ];

  private readonly featureKeywords = [
    'authentication', 'login', 'register', 'signup', 'password', 'user management',
    'crud', 'create', 'read', 'update', 'delete', 'database', 'api', 'rest',
    'dashboard', 'admin', 'report', 'analytics', 'search', 'filter', 'sort',
    'notification', 'email', 'sms', 'payment', 'billing', 'subscription',
    'file upload', 'image', 'document', 'export', 'import', 'integration'
  ];

  async parseIntent(rawText: string, params?: OptionalParams): Promise<ParsedIntent> {
    // Validate inputs
    try {
      validateRawIntent(rawText);
      if (params) {
        validateOptionalParams(params);
      }
    } catch (error) {
      ErrorHandler.handleIntentParsingFailure(error, rawText);
    }

    const businessObjective = this.extractBusinessObjectiveFromText(rawText);
    const operations = this.extractOperations(rawText, params);
    const dataSources = this.extractDataSources(rawText);
    const technicalRequirements = this.identifyTechnicalRequirementsFromText(rawText, params);
    const risks = this.identifyRisksFromText(rawText, params);

    const parsedIntent = {
      businessObjective,
      technicalRequirements,
      dataSourcesNeeded: dataSources,
      operationsRequired: operations,
      potentialRisks: risks
    };

    // Validate the parsed result
    try {
      validateParsedIntent(parsedIntent);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new IntentParsingError(
          `Intent parsing validation failed: ${error.message}`,
          'Please ensure your intent contains clear, actionable requirements',
          error
        );
      }
      throw error;
    }

    return parsedIntent;
  }

  extractBusinessObjective(intent: ParsedIntent): string {
    return intent.businessObjective;
  }

  identifyTechnicalRequirements(intent: ParsedIntent): TechnicalRequirement[] {
    // Re-analyze technical requirements based on the parsed intent data
    // This allows for more sophisticated analysis using the structured data
    const enhancedRequirements = this.categorizeOperationsIntoRequirements(
      intent.operationsRequired,
      intent.dataSourcesNeeded,
      intent.businessObjective
    );
    
    // Merge with original requirements, preferring enhanced analysis
    const requirementMap = new Map<string, TechnicalRequirement>();
    
    // Add enhanced requirements first
    for (const req of enhancedRequirements) {
      const key = req.type; // Use just type for merging similar requirements
      if (!requirementMap.has(key)) {
        requirementMap.set(key, req);
      } else {
        // Merge requirements of the same type
        const existing = requirementMap.get(key)!;
        existing.complexity = this.getHigherComplexity(existing.complexity, req.complexity);
        existing.quotaImpact = this.getHigherQuotaImpact(existing.quotaImpact, req.quotaImpact);
        // Combine descriptions if different
        if (!existing.description.includes(req.description) && !req.description.includes(existing.description)) {
          existing.description = `${existing.description} and ${req.description.toLowerCase()}`;
        }
      }
    }
    
    // Add original requirements if not already covered by type
    for (const req of intent.technicalRequirements) {
      const key = req.type;
      if (!requirementMap.has(key)) {
        requirementMap.set(key, req);
      } else {
        // Merge with existing
        const existing = requirementMap.get(key)!;
        existing.complexity = this.getHigherComplexity(existing.complexity, req.complexity);
        existing.quotaImpact = this.getHigherQuotaImpact(existing.quotaImpact, req.quotaImpact);
      }
    }
    
    return Array.from(requirementMap.values());
  }

  identifyRisks(intent: ParsedIntent): Risk[] {
    return intent.potentialRisks;
  }

  private extractBusinessObjectiveFromText(rawText: string): string {
    const text = rawText.toLowerCase().trim();
    
    // Try to match common patterns for business objectives
    for (const pattern of this.businessObjectivePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanObjective(match[1]);
      }
    }

    // Fallback: extract the main concept from the text
    const words = text.split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['want', 'need', 'create', 'build', 'with', 'that', 'have', 'make'].includes(word)
    );

    if (importantWords.length > 0) {
      return importantWords.slice(0, 5).join(' ');
    }

    return 'Build a custom application';
  }

  private cleanObjective(objective: string): string {
    return objective
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/\s+(system|application|app|tool|platform|service)$/i, ' system')
      .trim();
  }

  private extractOperations(rawText: string, params?: OptionalParams): Operation[] {
    const text = rawText.toLowerCase();
    const operations: Operation[] = [];
    let operationId = 1;

    // Authentication operations (check first to avoid conflicts)
    if (text.includes('login') || text.includes('signin') || text.includes('authenticate')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'processing',
        description: 'User authentication',
        estimatedQuotaCost: 3
      });
    }

    if (text.includes('register') || text.includes('signup') || text.includes('registration')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'processing',
        description: 'User registration',
        estimatedQuotaCost: 3
      });
    }

    // CRUD operations (check for explicit CRUD mention first)
    if (text.includes('crud')) {
      operations.push(
        {
          id: `op_${operationId++}`,
          type: 'processing',
          description: 'Create new records',
          estimatedQuotaCost: 2
        },
        {
          id: `op_${operationId++}`,
          type: 'data_retrieval',
          description: 'Read/Retrieve data',
          estimatedQuotaCost: 1
        },
        {
          id: `op_${operationId++}`,
          type: 'processing',
          description: 'Update existing records',
          estimatedQuotaCost: 2
        },
        {
          id: `op_${operationId++}`,
          type: 'processing',
          description: 'Delete records',
          estimatedQuotaCost: 1
        }
      );
    } else {
      // Individual CRUD operations
      if (text.includes('create') || text.includes('add') || text.includes('insert') || text.includes('new')) {
        operations.push({
          id: `op_${operationId++}`,
          type: 'processing',
          description: 'Create/Add new records',
          estimatedQuotaCost: 2
        });
      }

      if (text.includes('read') || text.includes('view') || text.includes('display') || text.includes('show') || text.includes('list') || text.includes('get')) {
        operations.push({
          id: `op_${operationId++}`,
          type: 'data_retrieval',
          description: 'Read/Display data',
          estimatedQuotaCost: 1
        });
      }

      if (text.includes('update') || text.includes('edit') || text.includes('modify') || text.includes('change')) {
        operations.push({
          id: `op_${operationId++}`,
          type: 'processing',
          description: 'Update existing records',
          estimatedQuotaCost: 2
        });
      }

      if (text.includes('delete') || text.includes('remove') || text.includes('destroy')) {
        operations.push({
          id: `op_${operationId++}`,
          type: 'processing',
          description: 'Delete records',
          estimatedQuotaCost: 1
        });
      }
    }

    // Search and filter operations
    if (text.includes('search') || text.includes('find') || text.includes('query')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'data_retrieval',
        description: 'Search functionality',
        estimatedQuotaCost: 2
      });
    }

    if (text.includes('filter') || text.includes('sort')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'processing',
        description: 'Filter and sort data',
        estimatedQuotaCost: 1
      });
    }

    // Analytics and reporting
    if (text.includes('analytics') || text.includes('report') || text.includes('dashboard')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'analysis',
        description: 'Generate analytics and reports',
        estimatedQuotaCost: 4
      });
    }

    // User management operations
    if (text.includes('user') && (text.includes('manage') || text.includes('profile'))) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'processing',
        description: 'User profile management',
        estimatedQuotaCost: 2
      });
    }

    // API operations
    if (text.includes('api') || text.includes('endpoint') || text.includes('restful')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'processing',
        description: 'API endpoint handling',
        estimatedQuotaCost: 2
      });
    }

    // File operations
    if (text.includes('upload') || text.includes('file') || text.includes('image')) {
      operations.push({
        id: `op_${operationId++}`,
        type: 'processing',
        description: 'File upload and processing',
        estimatedQuotaCost: 3
      });
    }

    // Default operation if none found
    if (operations.length === 0) {
      operations.push({
        id: `op_${operationId}`,
        type: 'processing',
        description: 'Basic application functionality',
        estimatedQuotaCost: 2
      });
    }

    // Adjust operation costs based on optional parameters
    if (params) {
      return this.adjustOperationCostsForParameters(operations, params);
    }

    return operations;
  }

  private extractDataSources(rawText: string): string[] {
    const text = rawText.toLowerCase();
    const dataSources: string[] = [];

    // User-related data (check first as it's common)
    if (text.includes('user') || text.includes('account') || text.includes('profile') || text.includes('auth')) {
      dataSources.push('user_data');
    }

    // Database-related keywords
    if (text.includes('database') || text.includes('db') || text.includes('store') || text.includes('persist') || text.includes('crud')) {
      dataSources.push('database');
    }

    // File-related data
    if (text.includes('file') || text.includes('upload') || text.includes('document') || text.includes('image')) {
      dataSources.push('file_storage');
    }

    // API-related data
    if (text.includes('api') || text.includes('external') || text.includes('third-party') || text.includes('integration') || text.includes('restful')) {
      dataSources.push('external_api');
    }

    // Configuration data
    if (text.includes('config') || text.includes('setting') || text.includes('preference')) {
      dataSources.push('configuration');
    }

    // Analytics data
    if (text.includes('analytics') || text.includes('report') || text.includes('dashboard') || text.includes('metrics')) {
      dataSources.push('analytics_data');
    }

    // Default data source if none found
    if (dataSources.length === 0) {
      dataSources.push('application_data');
    }

    return dataSources;
  }

  private identifyTechnicalRequirementsFromText(rawText: string, params?: OptionalParams): TechnicalRequirement[] {
    const text = rawText.toLowerCase();
    const requirements: TechnicalRequirement[] = [];
    const operations = this.extractOperations(rawText);
    const dataSources = this.extractDataSources(rawText);

    // Categorize requirements based on operations and data sources
    const requirementMap = this.categorizeOperationsIntoRequirements(operations, dataSources, text);
    
    // Convert map to array and deduplicate
    const uniqueRequirements = new Map<string, TechnicalRequirement>();
    
    for (const requirement of requirementMap) {
      const key = `${requirement.type}-${requirement.description}`;
      if (!uniqueRequirements.has(key)) {
        uniqueRequirements.set(key, requirement);
      } else {
        // Merge complexity and quota impact (take the higher one)
        const existing = uniqueRequirements.get(key)!;
        existing.complexity = this.getHigherComplexity(existing.complexity, requirement.complexity);
        existing.quotaImpact = this.getHigherQuotaImpact(existing.quotaImpact, requirement.quotaImpact);
      }
    }

    let finalRequirements = Array.from(uniqueRequirements.values());

    // Adjust requirements based on optional parameters
    if (params) {
      finalRequirements = this.adjustRequirementsForParameters(finalRequirements, params);
    }

    return finalRequirements;
  }

  private categorizeOperationsIntoRequirements(
    operations: Operation[], 
    dataSources: string[], 
    rawText: string
  ): TechnicalRequirement[] {
    const requirements: TechnicalRequirement[] = [];
    const text = rawText.toLowerCase();

    // Analyze operations to determine technical requirements
    const hasDataRetrieval = operations.some(op => op.type === 'data_retrieval');
    const hasProcessing = operations.some(op => op.type === 'processing');
    const hasAnalysis = operations.some(op => op.type === 'analysis');

    // Data retrieval requirements based on operations and data sources
    if (hasDataRetrieval || text.includes('display') || text.includes('show') || text.includes('list') || text.includes('view') || text.includes('read') || text.includes('get') || text.includes('dashboard') || text.includes('pull')) {
      const complexity = this.determineDataRetrievalComplexity(dataSources, text);
      const quotaImpact = this.determineDataRetrievalQuotaImpact(dataSources, operations);
      
      requirements.push({
        type: 'data_retrieval',
        description: this.generateDataRetrievalDescription(dataSources, text),
        complexity,
        quotaImpact
      });
    }

    // Processing requirements based on operations
    if (hasProcessing || text.includes('create') || text.includes('update') || text.includes('delete') || text.includes('process') || text.includes('transform')) {
      const complexity = this.determineProcessingComplexity(operations, text);
      const quotaImpact = this.determineProcessingQuotaImpact(operations, text);
      
      requirements.push({
        type: 'processing',
        description: this.generateProcessingDescription(operations, text),
        complexity,
        quotaImpact
      });
    }

    // Analysis requirements for complex operations
    if (hasAnalysis || text.includes('report') || text.includes('analytics') || text.includes('dashboard') || text.includes('insights') || text.includes('analyze')) {
      requirements.push({
        type: 'analysis',
        description: this.generateAnalysisDescription(text),
        complexity: 'high',
        quotaImpact: 'significant'
      });
    }

    // Output requirements based on export/generation needs
    if (text.includes('export') || text.includes('download') || text.includes('generate') || text.includes('output') || text.includes('file')) {
      const complexity = this.determineOutputComplexity(text);
      const quotaImpact = this.determineOutputQuotaImpact(text);
      
      requirements.push({
        type: 'output',
        description: this.generateOutputDescription(text),
        complexity,
        quotaImpact
      });
    }

    // Ensure we have at least one requirement
    if (requirements.length === 0) {
      // Check if this is a very vague intent
      if (text.includes('useful') || text.includes('something') || text.length < 20) {
        requirements.push({
          type: 'processing',
          description: 'Basic application functionality',
          complexity: 'medium',
          quotaImpact: 'moderate'
        });
      } else {
        requirements.push({
          type: 'processing',
          description: 'Process and transform application data',
          complexity: 'low',
          quotaImpact: 'minimal'
        });
      }
    }

    return requirements;
  }

  private determineDataRetrievalComplexity(dataSources: string[], text: string): 'low' | 'medium' | 'high' {
    // Complex if multiple data sources or advanced querying
    if (dataSources.length > 2 || text.includes('search') || text.includes('filter') || text.includes('join') || text.includes('aggregate')) {
      return 'high';
    }
    if (dataSources.includes('external_api') || text.includes('complex') || text.includes('advanced')) {
      return 'medium';
    }
    return 'low';
  }

  private determineDataRetrievalQuotaImpact(dataSources: string[], operations: Operation[]): 'minimal' | 'moderate' | 'significant' {
    const retrievalOps = operations.filter(op => op.type === 'data_retrieval');
    const totalCost = retrievalOps.reduce((sum, op) => sum + op.estimatedQuotaCost, 0);
    
    if (totalCost > 5 || dataSources.includes('external_api')) {
      return 'significant';
    }
    if (totalCost > 2 || dataSources.length > 1) {
      return 'moderate';
    }
    return 'minimal';
  }

  private determineProcessingComplexity(operations: Operation[], text: string): 'low' | 'medium' | 'high' {
    const processingOps = operations.filter(op => op.type === 'processing');
    
    // Check if we have the default operation
    const hasDefaultOperation = operations.some(op => op.description === 'Basic application functionality');
    if (hasDefaultOperation && operations.length === 1) {
      return 'medium'; // Default complexity for vague intents
    }
    
    // High complexity for authentication, complex business logic, or many operations
    if (text.includes('auth') || text.includes('security') || text.includes('permission') || 
        text.includes('workflow') || text.includes('business logic') || processingOps.length > 4) {
      return 'high';
    }
    
    // Medium complexity for CRUD operations or moderate processing
    if (text.includes('crud') || text.includes('validation') || text.includes('transform') || processingOps.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  private determineProcessingQuotaImpact(operations: Operation[], text: string): 'minimal' | 'moderate' | 'significant' {
    const processingOps = operations.filter(op => op.type === 'processing');
    const totalCost = processingOps.reduce((sum, op) => sum + op.estimatedQuotaCost, 0);
    
    // Check if we have the default operation
    const hasDefaultOperation = operations.some(op => op.description === 'Basic application functionality');
    if (hasDefaultOperation && operations.length === 1) {
      return 'moderate'; // Default quota impact for vague intents
    }
    
    // High impact for authentication, complex workflows, or high-cost operations
    if (text.includes('auth') || text.includes('complex') || text.includes('workflow') || totalCost > 8) {
      return 'significant';
    }
    
    if (totalCost > 4 || processingOps.length > 2) {
      return 'moderate';
    }
    
    return 'minimal';
  }

  private determineOutputComplexity(text: string): 'low' | 'medium' | 'high' {
    if (text.includes('report') || text.includes('dashboard') || text.includes('chart') || text.includes('visualization')) {
      return 'high';
    }
    if (text.includes('format') || text.includes('template') || text.includes('pdf') || text.includes('excel')) {
      return 'medium';
    }
    return 'low';
  }

  private determineOutputQuotaImpact(text: string): 'minimal' | 'moderate' | 'significant' {
    if (text.includes('report') || text.includes('dashboard') || text.includes('analytics') || text.includes('visualization')) {
      return 'significant';
    }
    if (text.includes('export') || text.includes('format') || text.includes('generate')) {
      return 'moderate';
    }
    return 'minimal';
  }

  private generateDataRetrievalDescription(dataSources: string[], text: string): string {
    const sourceDescriptions = dataSources.map(source => {
      switch (source) {
        case 'user_data': return 'user information';
        case 'database': return 'database records';
        case 'file_storage': return 'file data';
        case 'external_api': return 'external API data';
        case 'analytics_data': return 'analytics information';
        case 'configuration': return 'configuration settings';
        default: return 'application data';
      }
    });

    if (text.includes('search') || text.includes('filter')) {
      return `Search and retrieve ${sourceDescriptions.join(', ')}`;
    }
    
    return `Retrieve and access ${sourceDescriptions.join(', ')}`;
  }

  private generateProcessingDescription(operations: Operation[], text: string): string {
    const processingTypes = new Set<string>();
    
    // Check if we have the default operation
    const hasDefaultOperation = operations.some(op => op.description === 'Basic application functionality');
    if (hasDefaultOperation) {
      return 'Basic application functionality';
    }
    
    operations.forEach(op => {
      if (op.description.includes('Create') || op.description.includes('Add')) {
        processingTypes.add('create');
      }
      if (op.description.includes('Update') || op.description.includes('edit')) {
        processingTypes.add('update');
      }
      if (op.description.includes('Delete') || op.description.includes('remove')) {
        processingTypes.add('delete');
      }
      if (op.description.includes('authentication') || op.description.includes('auth')) {
        processingTypes.add('authentication');
      }
    });

    if (text.includes('auth') || processingTypes.has('authentication')) {
      return 'Handle user authentication and authorization';
    }
    
    if (processingTypes.size > 2) {
      return 'Process and manage data operations (CRUD)';
    }
    
    const types = Array.from(processingTypes);
    if (types.length > 0) {
      return `Process data operations: ${types.join(', ')}`;
    }
    
    return 'Process and transform application data';
  }

  private generateAnalysisDescription(text: string): string {
    if (text.includes('dashboard')) {
      return 'Generate interactive dashboards and visualizations';
    }
    if (text.includes('report')) {
      return 'Create detailed reports and summaries';
    }
    if (text.includes('analytics')) {
      return 'Perform data analysis and generate insights';
    }
    return 'Analyze data and generate insights';
  }

  private generateOutputDescription(text: string): string {
    if (text.includes('report')) {
      return 'Generate formatted reports and documents';
    }
    if (text.includes('export')) {
      return 'Export data in various formats';
    }
    if (text.includes('file')) {
      return 'Generate and manage output files';
    }
    return 'Generate and format output data';
  }

  private getHigherComplexity(a: 'low' | 'medium' | 'high', b: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const order = { low: 0, medium: 1, high: 2 };
    return order[a] > order[b] ? a : b;
  }

  private getHigherQuotaImpact(a: 'minimal' | 'moderate' | 'significant', b: 'minimal' | 'moderate' | 'significant'): 'minimal' | 'moderate' | 'significant' {
    const order = { minimal: 0, moderate: 1, significant: 2 };
    return order[a] > order[b] ? a : b;
  }

  private identifyRisksFromText(rawText: string, params?: OptionalParams): Risk[] {
    const text = rawText.toLowerCase();
    const risks: Risk[] = [];

    // Loop-related risks
    if (text.includes('all') || text.includes('every') || text.includes('each') || text.includes('batch')) {
      risks.push({
        type: 'excessive_loops',
        severity: 'high',
        description: 'Potential for excessive loops when processing multiple items',
        likelihood: 0.7
      });
    }

    // Query-related risks
    if (text.includes('search') || text.includes('find') || text.includes('query') || text.includes('filter')) {
      risks.push({
        type: 'redundant_query',
        severity: 'medium',
        description: 'Risk of redundant database queries without proper caching',
        likelihood: 0.6
      });
    }

    // Vibe overuse risks
    if (text.includes('generate') || text.includes('create') || text.includes('analyze') || text.includes('intelligent')) {
      risks.push({
        type: 'unnecessary_vibes',
        severity: 'medium',
        description: 'Potential overuse of vibes for tasks that could use structured specs',
        likelihood: 0.5
      });
    }

    // Caching risks
    if (text.includes('frequent') || text.includes('often') || text.includes('regular') || text.includes('repeated')) {
      risks.push({
        type: 'missing_cache',
        severity: 'medium',
        description: 'Missing caching opportunities for frequently accessed data',
        likelihood: 0.6
      });
    }

    // Adjust risks based on optional parameters
    if (params) {
      return this.adjustRisksForParameters(risks, params);
    }

    return risks;
  }

  private adjustOperationCostsForParameters(operations: Operation[], params: OptionalParams): Operation[] {
    return operations.map(operation => {
      let adjustedCost = operation.estimatedQuotaCost;

      // Adjust based on expected user volume
      if (params.expectedUserVolume !== undefined) {
        if (params.expectedUserVolume > 1000) {
          // High volume scenarios may need more robust operations
          adjustedCost = Math.ceil(adjustedCost * 1.2);
        } else if (params.expectedUserVolume < 10) {
          // Low volume scenarios can use simpler operations
          adjustedCost = Math.max(1, Math.floor(adjustedCost * 0.8));
        }
      }

      // Adjust based on performance sensitivity
      if (params.performanceSensitivity === 'high') {
        // High performance needs may require more efficient but costly operations
        adjustedCost = Math.ceil(adjustedCost * 1.1);
      } else if (params.performanceSensitivity === 'low') {
        // Low performance sensitivity allows for more cost-effective operations
        adjustedCost = Math.max(1, Math.floor(adjustedCost * 0.9));
      }

      return {
        ...operation,
        estimatedQuotaCost: adjustedCost
      };
    });
  }

  private adjustRequirementsForParameters(requirements: TechnicalRequirement[], params: OptionalParams): TechnicalRequirement[] {
    return requirements.map(requirement => {
      let adjustedComplexity = requirement.complexity;
      let adjustedQuotaImpact = requirement.quotaImpact;

      // Adjust based on expected user volume
      if (params.expectedUserVolume !== undefined) {
        if (params.expectedUserVolume > 1000) {
          // High volume may increase complexity and quota impact
          adjustedComplexity = this.getHigherComplexity(adjustedComplexity, 'medium');
          adjustedQuotaImpact = this.getHigherQuotaImpact(adjustedQuotaImpact, 'moderate');
        }
      }

      // Adjust based on cost constraints
      if (params.costConstraints) {
        const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
        
        // If there are tight cost constraints, try to reduce quota impact
        if ((maxVibes !== undefined && maxVibes < 20) || 
            (maxSpecs !== undefined && maxSpecs < 5) ||
            (maxCostDollars !== undefined && maxCostDollars < 10)) {
          
          // Try to reduce quota impact for cost-sensitive scenarios
          if (adjustedQuotaImpact === 'significant') {
            adjustedQuotaImpact = 'moderate';
          } else if (adjustedQuotaImpact === 'moderate') {
            adjustedQuotaImpact = 'minimal';
          }
        }
      }

      // Adjust based on performance sensitivity
      if (params.performanceSensitivity === 'high') {
        // High performance sensitivity may require more complex solutions
        adjustedComplexity = this.getHigherComplexity(adjustedComplexity, 'medium');
      }

      return {
        ...requirement,
        complexity: adjustedComplexity,
        quotaImpact: adjustedQuotaImpact
      };
    });
  }

  private adjustRisksForParameters(risks: Risk[], params: OptionalParams): Risk[] {
    const adjustedRisks = [...risks];

    // Add volume-related risks
    if (params.expectedUserVolume !== undefined) {
      if (params.expectedUserVolume > 1000) {
        adjustedRisks.push({
          type: 'excessive_loops',
          severity: 'high',
          description: 'High user volume may lead to excessive quota consumption during peak usage',
          likelihood: 0.8
        });
      }
    }

    // Add cost constraint risks
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
      
      if ((maxVibes !== undefined && maxVibes < 10) || 
          (maxSpecs !== undefined && maxSpecs < 3) ||
          (maxCostDollars !== undefined && maxCostDollars < 5)) {
        
        adjustedRisks.push({
          type: 'unnecessary_vibes',
          severity: 'high',
          description: 'Tight cost constraints may require aggressive optimization to stay within budget',
          likelihood: 0.9
        });
      }
    }

    // Adjust existing risk likelihoods based on performance sensitivity
    if (params.performanceSensitivity === 'high') {
      return adjustedRisks.map(risk => ({
        ...risk,
        likelihood: Math.min(1.0, risk.likelihood * 1.2) // Increase likelihood for high performance sensitivity
      }));
    } else if (params.performanceSensitivity === 'low') {
      return adjustedRisks.map(risk => ({
        ...risk,
        likelihood: Math.max(0.1, risk.likelihood * 0.8) // Decrease likelihood for low performance sensitivity
      }));
    }

    return adjustedRisks;
  }
}