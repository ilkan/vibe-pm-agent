/**
 * Agent Capability Matching and Discovery System
 * 
 * Intelligent capability-based agent selection, dynamic agent discovery,
 * task decomposition, and citation validation workflow integration.
 */

import {
    AgentCapability,
    EnhancedBedrockAgent,
    AgentTask,
    TaskType,
    Priority,
    AgentSelectionCriteria,
    CitationContext,
    CitationResponse
} from '../../interfaces/nvidia-nim-core';
import {
    BEDROCK_AGENTS_CONFIG,
    createTaskId,
    createConversationId,
    generateId
} from '../../models/nvidia-nim';
import { NIMErrorHandler, NIMErrorCode } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Capability System Interfaces
// ============================================================================

export interface CapabilityMatcher {
    findMatchingAgents(requirements: CapabilityRequirement[]): Promise<AgentMatch[]>;
    scoreAgentCapability(agent: EnhancedBedrockAgent, requirement: CapabilityRequirement): number;
    validateCapabilityMatch(agent: EnhancedBedrockAgent, requirements: CapabilityRequirement[]): boolean;
    getCapabilityCompatibility(cap1: AgentCapability, cap2: AgentCapability): number;
}

export interface AgentDiscovery {
    discoverAgents(criteria: DiscoveryCriteria): Promise<EnhancedBedrockAgent[]>;
    registerAgent(agent: EnhancedBedrockAgent): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    updateAgentCapabilities(agentId: string, capabilities: AgentCapability[]): Promise<void>;
    getAgentsByCapability(capabilityName: string): Promise<EnhancedBedrockAgent[]>;
    getAvailableCapabilities(): Promise<string[]>;
}

export interface TaskDecomposer {
    decomposeTask(task: AgentTask): Promise<SubTask[]>;
    createExecutionPlan(subTasks: SubTask[]): Promise<ExecutionPlan>;
    validateExecutionPlan(plan: ExecutionPlan): Promise<ValidationResult>;
    optimizeTaskDistribution(plan: ExecutionPlan): Promise<ExecutionPlan>;
}

export interface CapabilityRequirement {
    name: string;
    required: boolean;
    minConfidence: number;
    nimEnhanced?: boolean;
    retrievalEnabled?: boolean;
    priority: Priority;
    constraints?: CapabilityConstraint[];
}

export interface CapabilityConstraint {
    type: 'performance' | 'resource' | 'compatibility';
    condition: string;
    value: any;
}

export interface AgentMatch {
    agent: EnhancedBedrockAgent;
    score: number;
    matchedCapabilities: string[];
    missingCapabilities: string[];
    confidence: number;
    reasoning: string;
}

export interface DiscoveryCriteria {
    capabilities?: string[];
    nimEnhanced?: boolean;
    retrievalEnabled?: boolean;
    minConfidence?: number;
    excludeAgents?: string[];
    maxResults?: number;
}

export interface SubTask {
    id: string;
    parentTaskId: string;
    type: TaskType;
    payload: any;
    requiredCapabilities: string[];
    priority: Priority;
    dependencies: string[];
    estimatedDuration: number;
    assignedAgent?: string;
}

export interface ExecutionPlan {
    id: string;
    originalTask: AgentTask;
    subTasks: SubTask[];
    executionOrder: string[];
    parallelGroups: string[][];
    estimatedTotalDuration: number;
    requiredAgents: string[];
    riskAssessment: RiskAssessment;
}

export interface RiskAssessment {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: RiskFactor[];
    mitigationStrategies: string[];
}

export interface RiskFactor {
    type: 'capability_gap' | 'resource_contention' | 'dependency_chain' | 'performance';
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
}

export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    recommendations: string[];
    confidence: number;
}

export interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    type: string;
    message: string;
    affectedComponents: string[];
}

// ============================================================================
// Capability Matcher Implementation
// ============================================================================

/**
 * Intelligent capability matching system
 */
export class IntelligentCapabilityMatcher implements CapabilityMatcher {
    private agents: Map<string, EnhancedBedrockAgent> = new Map();
    private capabilityIndex: Map<string, Set<string>> = new Map(); // capability -> agent IDs
    private performanceHistory: Map<string, PerformanceMetrics> = new Map();

    constructor() {
        console.log('Intelligent Capability Matcher initialized');
    }

    /**
     * Register agent for capability matching
     */
    registerAgent(agent: EnhancedBedrockAgent): void {
        this.agents.set(agent.agentId, agent);

        // Update capability index
        for (const capability of agent.capabilities) {
            const agentSet = this.capabilityIndex.get(capability.name) || new Set();
            agentSet.add(agent.agentId);
            this.capabilityIndex.set(capability.name, agentSet);
        }

        // Initialize performance metrics
        this.performanceHistory.set(agent.agentId, {
            averageResponseTime: 1000,
            successRate: 0.95,
            taskCount: 0,
            lastUpdated: new Date()
        });

        console.log(`Agent registered for capability matching: ${agent.agentName}`);
    }

    /**
     * Find agents matching capability requirements
     */
    async findMatchingAgents(requirements: CapabilityRequirement[]): Promise<AgentMatch[]> {
        const matches: AgentMatch[] = [];

        for (const [agentId, agent] of this.agents.entries()) {
            const match = await this.evaluateAgentMatch(agent, requirements);
            if (match.score > 0) {
                matches.push(match);
            }
        }

        // Sort by score (highest first)
        matches.sort((a, b) => b.score - a.score);

        console.log(`Found ${matches.length} matching agents for ${requirements.length} requirements`);
        return matches;
    }

    /**
     * Evaluate how well an agent matches requirements
     */
    private async evaluateAgentMatch(
        agent: EnhancedBedrockAgent,
        requirements: CapabilityRequirement[]
    ): Promise<AgentMatch> {
        const matchedCapabilities: string[] = [];
        const missingCapabilities: string[] = [];
        let totalScore = 0;
        let totalWeight = 0;

        for (const requirement of requirements) {
            const capability = agent.capabilities.find(c => c.name === requirement.name);

            if (capability) {
                const capabilityScore = this.scoreAgentCapability(agent, requirement);
                const weight = requirement.required ? 2.0 : 1.0;

                totalScore += capabilityScore * weight;
                totalWeight += weight;
                matchedCapabilities.push(requirement.name);
            } else if (requirement.required) {
                missingCapabilities.push(requirement.name);
                // Heavy penalty for missing required capabilities
                totalScore -= 0.5;
                totalWeight += 2.0;
            } else {
                missingCapabilities.push(requirement.name);
            }
        }

        // Calculate final score
        const baseScore = totalWeight > 0 ? totalScore / totalWeight : 0;

        // Apply performance bonus/penalty
        const performance = this.performanceHistory.get(agent.agentId);
        const performanceMultiplier = performance ?
            (performance.successRate * 0.5 + (1000 / Math.max(performance.averageResponseTime, 100)) * 0.5) : 1.0;

        const finalScore = Math.max(0, baseScore * performanceMultiplier);

        // Calculate confidence
        const confidence = this.calculateMatchConfidence(agent, requirements, matchedCapabilities, missingCapabilities);

        // Generate reasoning
        const reasoning = this.generateMatchReasoning(agent, requirements, matchedCapabilities, missingCapabilities, finalScore);

        return {
            agent,
            score: finalScore,
            matchedCapabilities,
            missingCapabilities,
            confidence,
            reasoning
        };
    }

    /**
     * Score individual capability match
     */
    scoreAgentCapability(agent: EnhancedBedrockAgent, requirement: CapabilityRequirement): number {
        const capability = agent.capabilities.find(c => c.name === requirement.name);
        if (!capability) return 0;

        let score = 0;

        // Base confidence score
        if (capability.confidenceThreshold >= requirement.minConfidence) {
            score += capability.confidenceThreshold;
        } else {
            score += capability.confidenceThreshold * 0.5; // Penalty for low confidence
        }

        // NIM enhancement bonus
        if (requirement.nimEnhanced && capability.nimEnhanced) {
            score += 0.2;
        } else if (requirement.nimEnhanced && !capability.nimEnhanced) {
            score -= 0.1;
        }

        // Retrieval capability bonus
        if (requirement.retrievalEnabled && capability.retrievalEnabled) {
            score += 0.1;
        }

        // Priority weighting
        const priorityWeight = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.2,
            'urgent': 1.5
        }[requirement.priority] || 1.0;

        return score * priorityWeight;
    }

    /**
     * Validate if agent meets minimum requirements
     */
    validateCapabilityMatch(agent: EnhancedBedrockAgent, requirements: CapabilityRequirement[]): boolean {
        const requiredCapabilities = requirements.filter(r => r.required);

        for (const requirement of requiredCapabilities) {
            const capability = agent.capabilities.find(c => c.name === requirement.name);
            if (!capability || capability.confidenceThreshold < requirement.minConfidence) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get compatibility score between two capabilities
     */
    getCapabilityCompatibility(cap1: AgentCapability, cap2: AgentCapability): number {
        let compatibility = 0;

        // Same capability type
        if (cap1.name === cap2.name) {
            compatibility += 1.0;
        }

        // NIM enhancement compatibility
        if (cap1.nimEnhanced === cap2.nimEnhanced) {
            compatibility += 0.2;
        }

        // Retrieval capability compatibility
        if (cap1.retrievalEnabled === cap2.retrievalEnabled) {
            compatibility += 0.1;
        }

        // Confidence threshold similarity
        const confidenceDiff = Math.abs(cap1.confidenceThreshold - cap2.confidenceThreshold);
        compatibility += (1 - confidenceDiff) * 0.3;

        return Math.min(compatibility, 1.0);
    }

    /**
     * Calculate match confidence
     */
    private calculateMatchConfidence(
        agent: EnhancedBedrockAgent,
        requirements: CapabilityRequirement[],
        matched: string[],
        missing: string[]
    ): number {
        const requiredCount = requirements.filter(r => r.required).length;
        const matchedRequired = requirements.filter(r => r.required && matched.includes(r.name)).length;

        if (requiredCount === 0) return 0.8; // Default confidence if no required capabilities

        const requiredMatch = matchedRequired / requiredCount;
        const totalMatch = matched.length / requirements.length;

        // Weight required capabilities more heavily
        return requiredMatch * 0.7 + totalMatch * 0.3;
    }

    /**
     * Generate human-readable reasoning for match
     */
    private generateMatchReasoning(
        agent: EnhancedBedrockAgent,
        requirements: CapabilityRequirement[],
        matched: string[],
        missing: string[],
        score: number
    ): string {
        const reasons: string[] = [];

        reasons.push(`Agent ${agent.agentName} scored ${score.toFixed(2)}`);

        if (matched.length > 0) {
            reasons.push(`Matched capabilities: ${matched.join(', ')}`);
        }

        if (missing.length > 0) {
            const requiredMissing = requirements.filter(r => r.required && missing.includes(r.name));
            if (requiredMissing.length > 0) {
                reasons.push(`Missing required capabilities: ${requiredMissing.map(r => r.name).join(', ')}`);
            } else {
                reasons.push(`Missing optional capabilities: ${missing.join(', ')}`);
            }
        }

        const nimCapabilities = agent.capabilities.filter(c => c.nimEnhanced).length;
        if (nimCapabilities > 0) {
            reasons.push(`${nimCapabilities} NIM-enhanced capabilities`);
        }

        return reasons.join('. ');
    }

    /**
     * Update agent performance metrics
     */
    updatePerformanceMetrics(agentId: string, responseTime: number, success: boolean): void {
        const metrics = this.performanceHistory.get(agentId);
        if (!metrics) return;

        metrics.taskCount++;
        metrics.averageResponseTime = (metrics.averageResponseTime * (metrics.taskCount - 1) + responseTime) / metrics.taskCount;
        metrics.successRate = (metrics.successRate * (metrics.taskCount - 1) + (success ? 1 : 0)) / metrics.taskCount;
        metrics.lastUpdated = new Date();
    }
}

// ============================================================================
// Agent Discovery Implementation
// ============================================================================

/**
 * Dynamic agent discovery system
 */
export class DynamicAgentDiscovery implements AgentDiscovery {
    private agents: Map<string, EnhancedBedrockAgent> = new Map();
    private capabilityRegistry: Map<string, Set<string>> = new Map();

    constructor() {
        // Initialize with default Bedrock agents
        this.initializeDefaultAgents();
        console.log('Dynamic Agent Discovery initialized');
    }

    /**
     * Initialize with pre-configured Bedrock agents
     */
    private initializeDefaultAgents(): void {
        for (const [agentKey, config] of Object.entries(BEDROCK_AGENTS_CONFIG)) {
            const agent: EnhancedBedrockAgent = {
                agentId: config.agentId,
                agentName: config.agentName,
                capabilities: config.capabilities,
                processWithNIM: async () => ({ content: '', confidence: 0.8, tokensUsed: 0, processingTime: 0 }),
                enhanceWithRetrieval: async () => ({ enhancedContent: '', retrievedDocuments: [], confidence: 0.8, processingTime: 0 }),
                communicateWithSupervisor: async () => { },
                registerCapabilities: async () => { },
                updateCapability: async () => { }
            };

            this.registerAgent(agent);
        }
    }

    /**
     * Discover agents based on criteria
     */
    async discoverAgents(criteria: DiscoveryCriteria): Promise<EnhancedBedrockAgent[]> {
        const results: EnhancedBedrockAgent[] = [];

        for (const agent of this.agents.values()) {
            if (this.matchesCriteria(agent, criteria)) {
                results.push(agent);
            }
        }

        // Sort by relevance
        results.sort((a, b) => this.calculateRelevanceScore(b, criteria) - this.calculateRelevanceScore(a, criteria));

        // Apply max results limit
        const maxResults = criteria.maxResults || results.length;
        const finalResults = results.slice(0, maxResults);

        console.log(`Discovered ${finalResults.length} agents matching criteria`);
        return finalResults;
    }

    /**
     * Register new agent
     */
    async registerAgent(agent: EnhancedBedrockAgent): Promise<void> {
        this.agents.set(agent.agentId, agent);

        // Update capability registry
        for (const capability of agent.capabilities) {
            const agentSet = this.capabilityRegistry.get(capability.name) || new Set();
            agentSet.add(agent.agentId);
            this.capabilityRegistry.set(capability.name, agentSet);
        }

        console.log(`Agent registered: ${agent.agentName} with ${agent.capabilities.length} capabilities`);
    }

    /**
     * Unregister agent
     */
    async unregisterAgent(agentId: string): Promise<void> {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        // Remove from capability registry
        for (const capability of agent.capabilities) {
            const agentSet = this.capabilityRegistry.get(capability.name);
            if (agentSet) {
                agentSet.delete(agentId);
                if (agentSet.size === 0) {
                    this.capabilityRegistry.delete(capability.name);
                }
            }
        }

        this.agents.delete(agentId);
        console.log(`Agent unregistered: ${agentId}`);
    }

    /**
     * Update agent capabilities
     */
    async updateAgentCapabilities(agentId: string, capabilities: AgentCapability[]): Promise<void> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw NIMErrorHandler.createAgentError('Agent not found', agentId);
        }

        // Remove old capabilities from registry
        for (const oldCapability of agent.capabilities) {
            const agentSet = this.capabilityRegistry.get(oldCapability.name);
            if (agentSet) {
                agentSet.delete(agentId);
                if (agentSet.size === 0) {
                    this.capabilityRegistry.delete(oldCapability.name);
                }
            }
        }

        // Update agent capabilities
        agent.capabilities = capabilities;

        // Add new capabilities to registry
        for (const capability of capabilities) {
            const agentSet = this.capabilityRegistry.get(capability.name) || new Set();
            agentSet.add(agentId);
            this.capabilityRegistry.set(capability.name, agentSet);
        }

        console.log(`Updated capabilities for agent: ${agentId}`);
    }

    /**
     * Get agents by specific capability
     */
    async getAgentsByCapability(capabilityName: string): Promise<EnhancedBedrockAgent[]> {
        const agentIds = this.capabilityRegistry.get(capabilityName) || new Set();
        const agents: EnhancedBedrockAgent[] = [];

        for (const agentId of agentIds) {
            const agent = this.agents.get(agentId);
            if (agent) {
                agents.push(agent);
            }
        }

        return agents;
    }

    /**
     * Get all available capabilities
     */
    async getAvailableCapabilities(): Promise<string[]> {
        return Array.from(this.capabilityRegistry.keys());
    }

    /**
     * Check if agent matches discovery criteria
     */
    private matchesCriteria(agent: EnhancedBedrockAgent, criteria: DiscoveryCriteria): boolean {
        // Check excluded agents
        if (criteria.excludeAgents?.includes(agent.agentId)) {
            return false;
        }

        // Check required capabilities
        if (criteria.capabilities) {
            const hasAllCapabilities = criteria.capabilities.every(reqCap =>
                agent.capabilities.some(agentCap => agentCap.name === reqCap)
            );
            if (!hasAllCapabilities) return false;
        }

        // Check NIM enhancement requirement
        if (criteria.nimEnhanced !== undefined) {
            const hasNIMCapabilities = agent.capabilities.some(cap => cap.nimEnhanced);
            if (criteria.nimEnhanced && !hasNIMCapabilities) return false;
            if (!criteria.nimEnhanced && hasNIMCapabilities) return false;
        }

        // Check retrieval capability requirement
        if (criteria.retrievalEnabled !== undefined) {
            const hasRetrievalCapabilities = agent.capabilities.some(cap => cap.retrievalEnabled);
            if (criteria.retrievalEnabled && !hasRetrievalCapabilities) return false;
            if (!criteria.retrievalEnabled && hasRetrievalCapabilities) return false;
        }

        // Check minimum confidence
        if (criteria.minConfidence !== undefined) {
            const meetsConfidence = agent.capabilities.some(cap =>
                cap.confidenceThreshold >= criteria.minConfidence!
            );
            if (!meetsConfidence) return false;
        }

        return true;
    }

    /**
     * Calculate relevance score for sorting
     */
    private calculateRelevanceScore(agent: EnhancedBedrockAgent, criteria: DiscoveryCriteria): number {
        let score = 0;

        // Capability match score
        if (criteria.capabilities) {
            const matchedCapabilities = criteria.capabilities.filter(reqCap =>
                agent.capabilities.some(agentCap => agentCap.name === reqCap)
            );
            score += (matchedCapabilities.length / criteria.capabilities.length) * 0.5;
        }

        // NIM enhancement bonus
        const nimCapabilities = agent.capabilities.filter(cap => cap.nimEnhanced).length;
        score += (nimCapabilities / agent.capabilities.length) * 0.2;

        // Retrieval capability bonus
        const retrievalCapabilities = agent.capabilities.filter(cap => cap.retrievalEnabled).length;
        score += (retrievalCapabilities / agent.capabilities.length) * 0.1;

        // Average confidence score
        const avgConfidence = agent.capabilities.reduce((sum, cap) => sum + cap.confidenceThreshold, 0) / agent.capabilities.length;
        score += avgConfidence * 0.2;

        return score;
    }
}

// ============================================================================
// Task Decomposer Implementation
// ============================================================================

/**
 * Intelligent task decomposition system
 */
export class IntelligentTaskDecomposer implements TaskDecomposer {
    private capabilityMatcher: CapabilityMatcher;
    private agentDiscovery: AgentDiscovery;

    constructor(capabilityMatcher: CapabilityMatcher, agentDiscovery: AgentDiscovery) {
        this.capabilityMatcher = capabilityMatcher;
        this.agentDiscovery = agentDiscovery;
        console.log('Intelligent Task Decomposer initialized');
    }

    /**
     * Decompose complex task into subtasks
     */
    async decomposeTask(task: AgentTask): Promise<SubTask[]> {
        const subTasks: SubTask[] = [];

        // Decompose based on task type
        switch (task.type) {
            case 'business_analysis':
                subTasks.push(...await this.decomposeBusinessAnalysisTask(task));
                break;
            case 'product_development':
                subTasks.push(...await this.decomposeProductDevelopmentTask(task));
                break;
            case 'executive_communication':
                subTasks.push(...await this.decomposeExecutiveCommunicationTask(task));
                break;
            case 'citation_validation':
                subTasks.push(...await this.decomposeCitationValidationTask(task));
                break;
            default:
                // Create single subtask for unknown types
                subTasks.push(this.createSubTask(task, task.type, task.payload, task.requiredCapabilities));
        }

        console.log(`Decomposed task ${task.id} into ${subTasks.length} subtasks`);
        return subTasks;
    }

    /**
     * Create execution plan from subtasks
     */
    async createExecutionPlan(subTasks: SubTask[]): Promise<ExecutionPlan> {
        // Analyze dependencies
        const dependencyGraph = this.buildDependencyGraph(subTasks);

        // Determine execution order
        const executionOrder = this.topologicalSort(dependencyGraph);

        // Identify parallel groups
        const parallelGroups = this.identifyParallelGroups(subTasks, dependencyGraph);

        // Estimate total duration
        const estimatedTotalDuration = this.estimateTotalDuration(subTasks, parallelGroups);

        // Identify required agents
        const requiredAgents = await this.identifyRequiredAgents(subTasks);

        // Assess risks
        const riskAssessment = await this.assessRisks(subTasks, requiredAgents);

        const plan: ExecutionPlan = {
            id: generateId('execution_plan'),
            originalTask: subTasks[0]?.parentTaskId ?
                { id: subTasks[0].parentTaskId } as AgentTask :
                {} as AgentTask,
            subTasks,
            executionOrder,
            parallelGroups,
            estimatedTotalDuration,
            requiredAgents,
            riskAssessment
        };

        console.log(`Created execution plan with ${subTasks.length} tasks, estimated duration: ${estimatedTotalDuration}ms`);
        return plan;
    }

    /**
     * Validate execution plan
     */
    async validateExecutionPlan(plan: ExecutionPlan): Promise<ValidationResult> {
        const issues: ValidationIssue[] = [];
        const recommendations: string[] = [];

        // Check for circular dependencies
        if (this.hasCircularDependencies(plan.subTasks)) {
            issues.push({
                severity: 'error',
                type: 'circular_dependency',
                message: 'Circular dependencies detected in execution plan',
                affectedComponents: plan.subTasks.map(t => t.id)
            });
        }

        // Check agent availability
        for (const agentId of plan.requiredAgents) {
            const agents = await this.agentDiscovery.discoverAgents({ excludeAgents: [agentId] });
            if (agents.length === 0) {
                issues.push({
                    severity: 'warning',
                    type: 'agent_availability',
                    message: `Agent ${agentId} may not be available`,
                    affectedComponents: [agentId]
                });
            }
        }

        // Check capability coverage
        for (const subTask of plan.subTasks) {
            const requirements: CapabilityRequirement[] = subTask.requiredCapabilities.map(cap => ({
                name: cap,
                required: true,
                minConfidence: 0.7,
                priority: subTask.priority
            }));

            const matches = await this.capabilityMatcher.findMatchingAgents(requirements);
            if (matches.length === 0) {
                issues.push({
                    severity: 'error',
                    type: 'capability_gap',
                    message: `No agents found for subtask ${subTask.id} capabilities: ${subTask.requiredCapabilities.join(', ')}`,
                    affectedComponents: [subTask.id]
                });
            }
        }

        // Generate recommendations
        if (plan.riskAssessment.overallRisk === 'high') {
            recommendations.push('Consider breaking down high-risk tasks further');
        }

        if (plan.estimatedTotalDuration > 300000) { // 5 minutes
            recommendations.push('Long execution time detected - consider parallel execution optimization');
        }

        const confidence = issues.filter(i => i.severity === 'error').length === 0 ? 0.8 : 0.3;

        return {
            valid: issues.filter(i => i.severity === 'error').length === 0,
            issues,
            recommendations,
            confidence
        };
    }

    /**
     * Optimize task distribution for better performance
     */
    async optimizeTaskDistribution(plan: ExecutionPlan): Promise<ExecutionPlan> {
        const optimizedPlan = { ...plan };

        // Assign optimal agents to subtasks
        for (const subTask of optimizedPlan.subTasks) {
            if (!subTask.assignedAgent) {
                const requirements: CapabilityRequirement[] = subTask.requiredCapabilities.map(cap => ({
                    name: cap,
                    required: true,
                    minConfidence: 0.7,
                    priority: subTask.priority
                }));

                const matches = await this.capabilityMatcher.findMatchingAgents(requirements);
                if (matches.length > 0) {
                    subTask.assignedAgent = matches[0].agent.agentId;
                }
            }
        }

        // Re-optimize parallel groups based on agent assignments
        optimizedPlan.parallelGroups = this.optimizeParallelGroups(optimizedPlan.subTasks);

        // Recalculate duration
        optimizedPlan.estimatedTotalDuration = this.estimateTotalDuration(
            optimizedPlan.subTasks,
            optimizedPlan.parallelGroups
        );

        console.log(`Optimized execution plan - new duration: ${optimizedPlan.estimatedTotalDuration}ms`);
        return optimizedPlan;
    }

    // ============================================================================
    // Task Decomposition Methods
    // ============================================================================

    /**
     * Decompose business analysis task
     */
    private async decomposeBusinessAnalysisTask(task: AgentTask): Promise<SubTask[]> {
        const subTasks: SubTask[] = [];

        // Market analysis subtask
        subTasks.push(this.createSubTask(
            task,
            'market_analysis',
            { ...task.payload, focus: 'market' },
            ['analyze_business_opportunity', 'market_sizing'],
            [],
            5000
        ));

        // Competitive analysis subtask
        subTasks.push(this.createSubTask(
            task,
            'competitive_intelligence',
            { ...task.payload, focus: 'competition' },
            ['competitive_analysis'],
            [],
            4000
        ));

        // Citation validation subtask (depends on analysis)
        subTasks.push(this.createSubTask(
            task,
            'citation_validation',
            { query: 'business analysis citations', context: task.payload },
            ['validate_citations'],
            [subTasks[0].id, subTasks[1].id],
            2000
        ));

        return subTasks;
    }

    /**
     * Decompose product development task
     */
    private async decomposeProductDevelopmentTask(task: AgentTask): Promise<SubTask[]> {
        const subTasks: SubTask[] = [];

        // Requirements generation
        subTasks.push(this.createSubTask(
            task,
            'product_development',
            { ...task.payload, phase: 'requirements' },
            ['generate_requirements'],
            [],
            3000
        ));

        // Design options generation (depends on requirements)
        subTasks.push(this.createSubTask(
            task,
            'product_development',
            { ...task.payload, phase: 'design' },
            ['generate_design_options'],
            [subTasks[0].id],
            4000
        ));

        return subTasks;
    }

    /**
     * Decompose executive communication task
     */
    private async decomposeExecutiveCommunicationTask(task: AgentTask): Promise<SubTask[]> {
        const subTasks: SubTask[] = [];

        // Document generation
        subTasks.push(this.createSubTask(
            task,
            'executive_communication',
            { ...task.payload, type: 'document' },
            ['generate_management_onepager', 'generate_pr_faq'],
            [],
            3500
        ));

        // Citation validation for executive documents
        subTasks.push(this.createSubTask(
            task,
            'citation_validation',
            { query: 'executive document citations', context: task.payload },
            ['validate_citations'],
            [subTasks[0].id],
            1500
        ));

        return subTasks;
    }

    /**
     * Decompose citation validation task
     */
    private async decomposeCitationValidationTask(task: AgentTask): Promise<SubTask[]> {
        const subTasks: SubTask[] = [];

        // Source validation
        subTasks.push(this.createSubTask(
            task,
            'citation_validation',
            { ...task.payload, phase: 'validation' },
            ['validate_citations'],
            [],
            2000
        ));

        // Additional sourcing if needed
        subTasks.push(this.createSubTask(
            task,
            'citation_validation',
            { ...task.payload, phase: 'sourcing' },
            ['source_citations'],
            [subTasks[0].id],
            3000
        ));

        return subTasks;
    }

    /**
     * Create subtask helper
     */
    private createSubTask(
        parentTask: AgentTask,
        type: TaskType,
        payload: any,
        capabilities: string[],
        dependencies: string[] = [],
        estimatedDuration: number = 3000
    ): SubTask {
        return {
            id: createTaskId(type),
            parentTaskId: parentTask.id,
            type,
            payload,
            requiredCapabilities: capabilities,
            priority: parentTask.priority,
            dependencies,
            estimatedDuration
        };
    }

    // ============================================================================
    // Execution Planning Helpers
    // ============================================================================

    /**
     * Build dependency graph
     */
    private buildDependencyGraph(subTasks: SubTask[]): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        for (const task of subTasks) {
            graph.set(task.id, task.dependencies);
        }

        return graph;
    }

    /**
     * Topological sort for execution order
     */
    private topologicalSort(dependencyGraph: Map<string, string[]>): string[] {
        const visited = new Set<string>();
        const result: string[] = [];

        const visit = (taskId: string) => {
            if (visited.has(taskId)) return;
            visited.add(taskId);

            const dependencies = dependencyGraph.get(taskId) || [];
            for (const dep of dependencies) {
                visit(dep);
            }

            result.push(taskId);
        };

        for (const taskId of dependencyGraph.keys()) {
            visit(taskId);
        }

        return result;
    }

    /**
     * Identify tasks that can run in parallel
     */
    private identifyParallelGroups(subTasks: SubTask[], dependencyGraph: Map<string, string[]>): string[][] {
        const groups: string[][] = [];
        const processed = new Set<string>();

        // Group tasks by dependency level
        const levels = new Map<number, string[]>();

        for (const task of subTasks) {
            const level = this.calculateDependencyLevel(task.id, dependencyGraph);
            const levelTasks = levels.get(level) || [];
            levelTasks.push(task.id);
            levels.set(level, levelTasks);
        }

        // Each level can potentially run in parallel
        for (const levelTasks of levels.values()) {
            if (levelTasks.length > 1) {
                groups.push(levelTasks);
            }
        }

        return groups;
    }

    /**
     * Calculate dependency level for a task
     */
    private calculateDependencyLevel(taskId: string, dependencyGraph: Map<string, string[]>): number {
        const dependencies = dependencyGraph.get(taskId) || [];
        if (dependencies.length === 0) return 0;

        let maxLevel = 0;
        for (const dep of dependencies) {
            const depLevel = this.calculateDependencyLevel(dep, dependencyGraph);
            maxLevel = Math.max(maxLevel, depLevel + 1);
        }

        return maxLevel;
    }

    /**
     * Estimate total execution duration
     */
    private estimateTotalDuration(subTasks: SubTask[], parallelGroups: string[][]): number {
        const taskDurations = new Map<string, number>();
        subTasks.forEach(task => taskDurations.set(task.id, task.estimatedDuration));

        let totalDuration = 0;
        const processedTasks = new Set<string>();

        // Calculate duration considering parallel execution
        for (const group of parallelGroups) {
            const groupDuration = Math.max(...group.map(taskId => taskDurations.get(taskId) || 0));
            totalDuration += groupDuration;
            group.forEach(taskId => processedTasks.add(taskId));
        }

        // Add duration for non-parallel tasks
        for (const task of subTasks) {
            if (!processedTasks.has(task.id)) {
                totalDuration += task.estimatedDuration;
            }
        }

        return totalDuration;
    }

    /**
     * Identify required agents for execution
     */
    private async identifyRequiredAgents(subTasks: SubTask[]): Promise<string[]> {
        const requiredAgents = new Set<string>();

        for (const subTask of subTasks) {
            const requirements: CapabilityRequirement[] = subTask.requiredCapabilities.map(cap => ({
                name: cap,
                required: true,
                minConfidence: 0.7,
                priority: subTask.priority
            }));

            const matches = await this.capabilityMatcher.findMatchingAgents(requirements);
            if (matches.length > 0) {
                requiredAgents.add(matches[0].agent.agentId);
            }
        }

        return Array.from(requiredAgents);
    }

    /**
     * Assess execution risks
     */
    private async assessRisks(subTasks: SubTask[], requiredAgents: string[]): Promise<RiskAssessment> {
        const riskFactors: RiskFactor[] = [];

        // Check for capability gaps
        for (const subTask of subTasks) {
            const requirements: CapabilityRequirement[] = subTask.requiredCapabilities.map(cap => ({
                name: cap,
                required: true,
                minConfidence: 0.7,
                priority: subTask.priority
            }));

            const matches = await this.capabilityMatcher.findMatchingAgents(requirements);
            if (matches.length === 0) {
                riskFactors.push({
                    type: 'capability_gap',
                    severity: 'high',
                    description: `No agents available for subtask ${subTask.id}`,
                    impact: 'Task execution will fail'
                });
            } else if (matches[0].confidence < 0.7) {
                riskFactors.push({
                    type: 'capability_gap',
                    severity: 'medium',
                    description: `Low confidence match for subtask ${subTask.id}`,
                    impact: 'Task may not complete successfully'
                });
            }
        }

        // Check for resource contention
        if (requiredAgents.length < subTasks.length / 2) {
            riskFactors.push({
                type: 'resource_contention',
                severity: 'medium',
                description: 'High agent utilization expected',
                impact: 'Increased execution time due to queuing'
            });
        }

        // Assess overall risk
        const highRiskCount = riskFactors.filter(r => r.severity === 'high').length;
        const mediumRiskCount = riskFactors.filter(r => r.severity === 'medium').length;

        let overallRisk: 'low' | 'medium' | 'high';
        if (highRiskCount > 0) {
            overallRisk = 'high';
        } else if (mediumRiskCount > 2) {
            overallRisk = 'medium';
        } else {
            overallRisk = 'low';
        }

        // Generate mitigation strategies
        const mitigationStrategies: string[] = [];
        if (riskFactors.some(r => r.type === 'capability_gap')) {
            mitigationStrategies.push('Consider registering additional agents with required capabilities');
        }
        if (riskFactors.some(r => r.type === 'resource_contention')) {
            mitigationStrategies.push('Implement task queuing and priority management');
        }

        return {
            overallRisk,
            riskFactors,
            mitigationStrategies
        };
    }

    /**
     * Check for circular dependencies
     */
    private hasCircularDependencies(subTasks: SubTask[]): boolean {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycle = (taskId: string, taskMap: Map<string, SubTask>): boolean => {
            if (recursionStack.has(taskId)) return true;
            if (visited.has(taskId)) return false;

            visited.add(taskId);
            recursionStack.add(taskId);

            const task = taskMap.get(taskId);
            if (task) {
                for (const dep of task.dependencies) {
                    if (hasCycle(dep, taskMap)) return true;
                }
            }

            recursionStack.delete(taskId);
            return false;
        };

        const taskMap = new Map(subTasks.map(t => [t.id, t]));

        for (const task of subTasks) {
            if (hasCycle(task.id, taskMap)) return true;
        }

        return false;
    }

    /**
     * Optimize parallel groups based on agent assignments
     */
    private optimizeParallelGroups(subTasks: SubTask[]): string[][] {
        const groups: string[][] = [];
        const agentTasks = new Map<string, string[]>();

        // Group tasks by assigned agent
        for (const task of subTasks) {
            if (task.assignedAgent) {
                const tasks = agentTasks.get(task.assignedAgent) || [];
                tasks.push(task.id);
                agentTasks.set(task.assignedAgent, tasks);
            }
        }

        // Tasks assigned to different agents can potentially run in parallel
        const agentGroups = Array.from(agentTasks.values());
        if (agentGroups.length > 1) {
            // Find tasks that can run in parallel (no dependencies between different agents)
            const parallelCandidates: string[] = [];
            for (const group of agentGroups) {
                parallelCandidates.push(group[0]); // First task from each agent
            }

            if (parallelCandidates.length > 1) {
                groups.push(parallelCandidates);
            }
        }

        return groups;
    }
}

// ============================================================================
// Performance Metrics Interface
// ============================================================================

interface PerformanceMetrics {
    averageResponseTime: number;
    successRate: number;
    taskCount: number;
    lastUpdated: Date;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create capability matcher
 */
export function createCapabilityMatcher(): CapabilityMatcher {
    return new IntelligentCapabilityMatcher();
}

/**
 * Create agent discovery system
 */
export function createAgentDiscovery(): AgentDiscovery {
    return new DynamicAgentDiscovery();
}

/**
 * Create task decomposer
 */
export function createTaskDecomposer(
    capabilityMatcher?: CapabilityMatcher,
    agentDiscovery?: AgentDiscovery
): TaskDecomposer {
    return new IntelligentTaskDecomposer(
        capabilityMatcher || createCapabilityMatcher(),
        agentDiscovery || createAgentDiscovery()
    );
}

/**
 * Create complete capability system
 */
export function createCapabilitySystem(): {
    matcher: CapabilityMatcher;
    discovery: AgentDiscovery;
    decomposer: TaskDecomposer;
} {
    const matcher = createCapabilityMatcher();
    const discovery = createAgentDiscovery();
    const decomposer = createTaskDecomposer(matcher, discovery);

    return { matcher, discovery, decomposer };
}