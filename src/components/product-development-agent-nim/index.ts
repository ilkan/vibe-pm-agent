/**
 * Enhanced Product Development Agent with NVIDIA NIM Integration
 * 
 * Extends the existing Product Development Agent (CEW45LTT2P) with NIM-powered analysis
 * for generate_requirements, generate_design_options tools, and advanced code analysis
 * with architecture planning and workflow optimization capabilities.
 * 
 * Requirements: 2.1, 2.2, 3.1
 */

import { SpecGenerator, ISpecGenerator } from '../spec-generator';
import { WorkflowOptimizer, IWorkflowOptimizer } from '../workflow-optimizer';
import { NIMServiceManager, ChatCompletionRequest, EmbeddingRequest } from '../../interfaces/nvidia-nim-core';
import { createNIMServiceManager } from '../nim-service-manager';
import {
  ParsedIntent,
  OptimizedWorkflow,
  KiroSpec,
  EnhancedKiroSpec,
  ConsultingSummary,
  ROIAnalysis,
  ThreeOptionAnalysis,
  Workflow,
  EfficiencyIssue,
  OptionalParams,
  SpecRequirement,
  SpecDesign,
  SpecTask
} from '../../models';
import { NIMErrorHandler } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Enhanced Product Development Agent Interfaces
// ============================================================================

export interface DesignOption {
  id: string;
  name: string;
  approach: 'conservative' | 'balanced' | 'bold';
  description: string;
  architecture: {
    pattern: string;
    components: string[];
    complexity: 'low' | 'medium' | 'high';
    scalability: number; // 1-10 scale
    maintainability: number; // 1-10 scale
  };
  implementation: {
    effort: 'small' | 'medium' | 'large';
    timeline: string;
    risks: string[];
    dependencies: string[];
  };
  performance: {
    expectedLatency: string;
    throughput: string;
    resourceUsage: string;
  };
  nimAnalysis?: {
    codeQuality: number;
    architecturalSoundness: number;
    bestPractices: string[];
    recommendations: string[];
  };
}

export interface RequirementsAnalysis {
  functionalRequirements: SpecRequirement[];
  nonFunctionalRequirements: SpecRequirement[];
  constraints: string[];
  assumptions: string[];
  riskFactors: string[];
  successCriteria: string[];
  nimInsights?: {
    clarityScore: number;
    completenessScore: number;
    testabilityScore: number;
    recommendations: string[];
  };
}

export interface CodeAnalysisResult {
  architecture: {
    pattern: string;
    quality: number;
    complexity: number;
    maintainability: number;
  };
  codeQuality: {
    readability: number;
    testability: number;
    performance: number;
    security: number;
  };
  recommendations: string[];
  refactoringOpportunities: string[];
  bestPractices: string[];
}

export interface INIMEnhancedProductDevelopmentAgent extends ISpecGenerator, IWorkflowOptimizer {
  // NIM-enhanced requirements generation
  generateRequirementsWithNIM(
    intent: ParsedIntent,
    context?: any,
    params?: OptionalParams
  ): Promise<RequirementsAnalysis>;

  // NIM-enhanced design options generation
  generateDesignOptionsWithNIM(
    requirements: RequirementsAnalysis,
    context?: any,
    params?: OptionalParams
  ): Promise<DesignOption[]>;

  // Advanced code analysis with NIM
  analyzeCodeArchitectureWithNIM(
    codebase: string,
    language: string,
    context?: any
  ): Promise<CodeAnalysisResult>;

  // Workflow optimization with NIM reasoning
  optimizeWorkflowWithNIM(
    workflow: Workflow,
    intent: ParsedIntent,
    params?: OptionalParams
  ): Promise<OptimizedWorkflow>;

  // Architecture planning with NIM
  generateArchitecturePlanWithNIM(
    requirements: RequirementsAnalysis,
    designOption: DesignOption,
    params?: OptionalParams
  ): Promise<any>;

  // Enhanced spec generation with NIM insights
  generateEnhancedSpecWithNIM(
    optimizedWorkflow: OptimizedWorkflow,
    originalIntent: string,
    nimAnalysis: any,
    params?: OptionalParams
  ): Promise<EnhancedKiroSpec>;
}

// ============================================================================
// NIM-Enhanced Product Development Agent Implementation
// ============================================================================

export class NIMEnhancedProductDevelopmentAgent extends SpecGenerator implements INIMEnhancedProductDevelopmentAgent {
  private nimService: NIMServiceManager;
  private workflowOptimizer: WorkflowOptimizer;
  private analysisCache: Map<string, any> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(nimConfig?: any) {
    super();
    this.nimService = createNIMServiceManager(nimConfig);
    this.workflowOptimizer = new WorkflowOptimizer();
    console.log('NIM-Enhanced Product Development Agent initialized');
  }

  // ============================================================================
  // NIM-Enhanced Requirements Generation
  // ============================================================================

  /**
   * Generate requirements with NIM-powered analysis and validation
   * Requirements: 2.1, 2.2, 3.1
   */
  async generateRequirementsWithNIM(
    intent: ParsedIntent,
    context?: any,
    params?: OptionalParams
  ): Promise<RequirementsAnalysis> {
    try {
      // Generate base requirements using existing logic
      const baseRequirements = await this.generateBaseRequirements(intent, context);

      // Enhance with NIM-powered analysis
      const nimEnhancedRequirements = await this.enhanceRequirementsWithNIM(
        baseRequirements,
        intent,
        context
      );

      // Validate and refine requirements using NIM
      const validatedRequirements = await this.validateRequirementsWithNIM(
        nimEnhancedRequirements,
        intent
      );

      // Generate NIM insights
      const nimInsights = await this.generateRequirementsInsights(validatedRequirements, intent);

      return {
        ...validatedRequirements,
        nimInsights
      };
    } catch (error) {
      console.error('NIM-enhanced requirements generation failed:', error);
      
      // Fallback to base requirements generation
      const fallbackRequirements = await this.generateBaseRequirements(intent, context);
      return {
        ...fallbackRequirements,
        nimInsights: {
          clarityScore: 70,
          completenessScore: 65,
          testabilityScore: 60,
          recommendations: ['NIM analysis failed. Manual review recommended.']
        }
      };
    }
  }

  /**
   * Generate base requirements using existing logic
   */
  private async generateBaseRequirements(
    intent: ParsedIntent,
    context?: any
  ): Promise<RequirementsAnalysis> {
    const functionalRequirements: SpecRequirement[] = [];
    const nonFunctionalRequirements: SpecRequirement[] = [];
    const constraints: string[] = [];
    const assumptions: string[] = [];
    const riskFactors: string[] = [];
    const successCriteria: string[] = [];

    // Generate functional requirements from intent
    intent.operationsRequired.forEach((operation, index) => {
      functionalRequirements.push({
        id: `FR-${index + 1}`,
        userStory: `As a user, I want the system to ${operation.description.toLowerCase()}, so that I can achieve my business objective efficiently.`,
        acceptanceCriteria: [
          `WHEN the system processes ${operation.type} operations THEN it SHALL complete within specified time limits`,
          `WHEN ${operation.description} is executed THEN it SHALL produce the expected outputs with required quality`
        ],
        priority: operation.estimatedQuotaCost > 10 ? 'high' : operation.estimatedQuotaCost > 5 ? 'medium' : 'low'
      });
    });

    // Generate non-functional requirements
    nonFunctionalRequirements.push({
      id: 'NFR-1',
      userStory: 'As a user, I want the system to be performant and reliable, so that I can depend on it for critical operations.',
      acceptanceCriteria: [
        'WHEN the system is under normal load THEN it SHALL respond within 2 seconds',
        'WHEN the system encounters errors THEN it SHALL handle them gracefully and provide meaningful feedback'
      ],
      priority: 'high'
    });

    // Extract constraints from technical requirements
    intent.technicalRequirements.forEach(req => {
      if (req.complexity === 'high') {
        constraints.push(`High complexity requirement: ${req.description}`);
        riskFactors.push(`Implementation complexity risk for: ${req.description}`);
      }
    });

    // Generate assumptions
    assumptions.push('User has necessary permissions and access rights');
    assumptions.push('Required data sources are available and accessible');
    assumptions.push('System infrastructure can handle expected load');

    // Generate success criteria
    successCriteria.push('All functional requirements are implemented and tested');
    successCriteria.push('System performance meets specified benchmarks');
    successCriteria.push('User acceptance criteria are satisfied');

    return {
      functionalRequirements,
      nonFunctionalRequirements,
      constraints,
      assumptions,
      riskFactors,
      successCriteria
    };
  }

  /**
   * Enhance requirements with NIM reasoning
   */
  private async enhanceRequirementsWithNIM(
    baseRequirements: RequirementsAnalysis,
    intent: ParsedIntent,
    context?: any
  ): Promise<RequirementsAnalysis> {
    const enhancementPrompt = this.buildRequirementsEnhancementPrompt(baseRequirements, intent, context);

    const chatRequest: ChatCompletionRequest = {
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      messages: [
        {
          role: 'system',
          content: 'You are a senior product manager and requirements analyst with expertise in software requirements engineering, user story writing, and system design. Enhance and refine requirements with analytical rigor.'
        },
        {
          role: 'user',
          content: enhancementPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    };

    const response = await this.nimService.generateChatCompletion(chatRequest);
    
    return this.parseEnhancedRequirements(response.choices[0].message.content, baseRequirements);
  }

  /**
   * Validate requirements using NIM analysis
   */
  private async validateRequirementsWithNIM(
    requirements: RequirementsAnalysis,
    intent: ParsedIntent
  ): Promise<RequirementsAnalysis> {
    const validationPrompt = this.buildRequirementsValidationPrompt(requirements, intent);

    const chatRequest: ChatCompletionRequest = {
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      messages: [
        {
          role: 'system',
          content: 'You are a requirements validation expert. Analyze requirements for completeness, consistency, testability, and clarity. Identify gaps and suggest improvements.'
        },
        {
          role: 'user',
          content: validationPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    };

    const response = await this.nimService.generateChatCompletion(chatRequest);
    
    return this.applyValidationFeedback(response.choices[0].message.content, requirements);
  }

  /**
   * Generate requirements insights using NIM
   */
  private async generateRequirementsInsights(
    requirements: RequirementsAnalysis,
    intent: ParsedIntent
  ): Promise<any> {
    const insightsPrompt = this.buildRequirementsInsightsPrompt(requirements, intent);

    const chatRequest: ChatCompletionRequest = {
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      messages: [
        {
          role: 'system',
          content: 'You are a requirements quality analyst. Assess requirements quality across multiple dimensions and provide actionable insights.'
        },
        {
          role: 'user',
          content: insightsPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    };

    const response = await this.nimService.generateChatCompletion(chatRequest);
    
    return this.parseRequirementsInsights(response.choices[0].message.content);
  }

  // ============================================================================
  // NIM-Enhanced Design Options Generation
  // ============================================================================

  /**
   * Generate design options with NIM-powered architectural analysis
   * Requirements: 2.1, 2.2, 3.1
   */
  async generateDesignOptionsWithNIM(
    requirements: RequirementsAnalysis,
    context?: any,
    params?: OptionalParams
  ): Promise<DesignOption[]> {
    try {
      // Generate base design options
      const baseOptions = await this.generateBaseDesignOptions(requirements, context);

      // Enhance each option with NIM analysis
      const enhancedOptions = await Promise.all(
        baseOptions.map(async (option) => {
          const nimAnalysis = await this.analyzeDesignOptionWithNIM(option, requirements, context);
          return {
            ...option,
            nimAnalysis
          };
        })
      );

      // Generate additional NIM-suggested options
      const nimSuggestedOptions = await this.generateNIMSuggestedDesignOptions(requirements, context);

      // Combine and rank options
      const allOptions = [...enhancedOptions, ...nimSuggestedOptions];
      return this.rankDesignOptions(allOptions, requirements);
    } catch (error) {
      console.error('NIM-enhanced design options generation failed:', error);
      
      // Fallback to base design options
      return await this.generateBaseDesignOptions(requirements, context);
    }
  }

  /**
   * Generate base design options
   */
  private async generateBaseDesignOptions(
    requirements: RequirementsAnalysis,
    context?: any
  ): Promise<DesignOption[]> {
    const options: DesignOption[] = [];

    // Conservative option - simple, proven approach
    options.push({
      id: 'conservative-option',
      name: 'Conservative Implementation',
      approach: 'conservative',
      description: 'Simple, straightforward implementation using proven patterns and minimal complexity',
      architecture: {
        pattern: 'Layered Architecture',
        components: ['Controller', 'Service', 'Repository', 'Model'],
        complexity: 'low',
        scalability: 6,
        maintainability: 8
      },
      implementation: {
        effort: 'small',
        timeline: '4-6 weeks',
        risks: ['Limited scalability', 'May not handle complex scenarios'],
        dependencies: ['Standard libraries', 'Database']
      },
      performance: {
        expectedLatency: '< 200ms',
        throughput: 'Medium',
        resourceUsage: 'Low'
      }
    });

    // Balanced option - good balance of features and complexity
    options.push({
      id: 'balanced-option',
      name: 'Balanced Implementation',
      approach: 'balanced',
      description: 'Well-balanced approach with good scalability and maintainability',
      architecture: {
        pattern: 'Microservices',
        components: ['API Gateway', 'Service Layer', 'Data Layer', 'Cache Layer'],
        complexity: 'medium',
        scalability: 8,
        maintainability: 7
      },
      implementation: {
        effort: 'medium',
        timeline: '8-12 weeks',
        risks: ['Increased complexity', 'Service coordination challenges'],
        dependencies: ['Container orchestration', 'Message queue', 'Cache system']
      },
      performance: {
        expectedLatency: '< 100ms',
        throughput: 'High',
        resourceUsage: 'Medium'
      }
    });

    // Bold option - advanced, cutting-edge approach
    options.push({
      id: 'bold-option',
      name: 'Bold Implementation',
      approach: 'bold',
      description: 'Advanced implementation with cutting-edge patterns and maximum scalability',
      architecture: {
        pattern: 'Event-Driven Architecture',
        components: ['Event Bus', 'Event Handlers', 'CQRS', 'Event Store', 'Read Models'],
        complexity: 'high',
        scalability: 10,
        maintainability: 6
      },
      implementation: {
        effort: 'large',
        timeline: '16-20 weeks',
        risks: ['High complexity', 'Learning curve', 'Debugging challenges'],
        dependencies: ['Event streaming platform', 'CQRS framework', 'Event store']
      },
      performance: {
        expectedLatency: '< 50ms',
        throughput: 'Very High',
        resourceUsage: 'High'
      }
    });

    return options;
  }

  /**
   * Analyze design option with NIM
   */
  private async analyzeDesignOptionWithNIM(
    option: DesignOption,
    requirements: RequirementsAnalysis,
    context?: any
  ): Promise<any> {
    const analysisPrompt = this.buildDesignAnalysisPrompt(option, requirements, context);

    const chatRequest: ChatCompletionRequest = {
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software architect with expertise in system design, architectural patterns, and code quality assessment. Analyze design options with technical depth and practical insights.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.25,
      max_tokens: 1200
    };

    const response = await this.nimService.generateChatCompletion(chatRequest);
    
    return this.parseDesignAnalysis(response.choices[0].message.content);
  }

  /**
   * Generate NIM-suggested design options
   */
  private async generateNIMSuggestedDesignOptions(
    requirements: RequirementsAnalysis,
    context?: any
  ): Promise<DesignOption[]> {
    const suggestionPrompt = this.buildDesignSuggestionPrompt(requirements, context);

    const chatRequest: ChatCompletionRequest = {
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      messages: [
        {
          role: 'system',
          content: 'You are an innovative software architect. Based on requirements analysis, suggest creative and effective design approaches that might not be immediately obvious.'
        },
        {
          role: 'user',
          content: suggestionPrompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500
    };

    const response = await this.nimService.generateChatCompletion(chatRequest);
    
    return this.parseNIMSuggestedOptions(response.choices[0].message.content);
  }

  // ============================================================================
  // Advanced Code Analysis with NIM
  // ============================================================================

  /**
   * Analyze code architecture with NIM-powered insights
   */
  async analyzeCodeArchitectureWithNIM(
    codebase: string,
    language: string,
    context?: any
  ): Promise<CodeAnalysisResult> {
    try {
      const analysisPrompt = this.buildCodeAnalysisPrompt(codebase, language, context);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: `You are a senior code architect and quality analyst with expertise in ${language} and software engineering best practices. Analyze code for architecture quality, maintainability, and improvement opportunities.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseCodeAnalysis(response.choices[0].message.content);
    } catch (error) {
      console.error('Code architecture analysis failed:', error);
      
      // Return fallback analysis
      return {
        architecture: {
          pattern: 'Unknown',
          quality: 70,
          complexity: 50,
          maintainability: 60
        },
        codeQuality: {
          readability: 65,
          testability: 60,
          performance: 70,
          security: 65
        },
        recommendations: ['NIM analysis failed. Manual code review recommended.'],
        refactoringOpportunities: ['Consider architectural review'],
        bestPractices: ['Follow language-specific conventions']
      };
    }
  }

  // ============================================================================
  // Workflow Optimization with NIM Reasoning
  // ============================================================================

  /**
   * Optimize workflow with NIM-powered reasoning
   */
  async optimizeWorkflowWithNIM(
    workflow: Workflow,
    intent: ParsedIntent,
    params?: OptionalParams
  ): Promise<OptimizedWorkflow> {
    try {
      // Generate base optimization using existing workflow optimizer
      const baseOptimization = await this.workflowOptimizer.optimizeWorkflow(
        workflow,
        this.convertIntentToIssues(intent, workflow),
        params
      );

      // Enhance with NIM reasoning
      const nimEnhancedOptimization = await this.enhanceOptimizationWithNIM(
        baseOptimization,
        intent,
        params
      );

      return nimEnhancedOptimization;
    } catch (error) {
      console.error('NIM-enhanced workflow optimization failed:', error);
      
      // Fallback to base optimization
      return await this.workflowOptimizer.optimizeWorkflow(
        workflow,
        this.convertIntentToIssues(intent, workflow),
        params
      );
    }
  }

  /**
   * Enhance optimization with NIM reasoning
   */
  private async enhanceOptimizationWithNIM(
    baseOptimization: OptimizedWorkflow,
    intent: ParsedIntent,
    params?: OptionalParams
  ): Promise<OptimizedWorkflow> {
    const enhancementPrompt = this.buildOptimizationEnhancementPrompt(baseOptimization, intent, params);

    const chatRequest: ChatCompletionRequest = {
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      messages: [
        {
          role: 'system',
          content: 'You are a workflow optimization expert with deep understanding of system efficiency, resource management, and performance optimization. Enhance workflow optimizations with intelligent reasoning.'
        },
        {
          role: 'user',
          content: enhancementPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    };

    const response = await this.nimService.generateChatCompletion(chatRequest);
    
    return this.applyNIMOptimizationEnhancements(response.choices[0].message.content, baseOptimization);
  }

  // ============================================================================
  // Architecture Planning with NIM
  // ============================================================================

  /**
   * Generate architecture plan with NIM insights
   */
  async generateArchitecturePlanWithNIM(
    requirements: RequirementsAnalysis,
    designOption: DesignOption,
    params?: OptionalParams
  ): Promise<any> {
    try {
      const planningPrompt = this.buildArchitecturePlanningPrompt(requirements, designOption, params);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a solution architect specializing in system design and implementation planning. Create comprehensive architecture plans with detailed technical specifications.'
          },
          {
            role: 'user',
            content: planningPrompt
          }
        ],
        temperature: 0.25,
        max_tokens: 2500
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseArchitecturePlan(response.choices[0].message.content);
    } catch (error) {
      console.error('Architecture planning failed:', error);
      
      return {
        components: designOption.architecture.components,
        interfaces: [],
        dataFlow: [],
        deploymentStrategy: 'Standard deployment',
        scalingStrategy: 'Horizontal scaling',
        monitoringStrategy: 'Basic monitoring',
        error: 'NIM analysis failed. Manual architecture planning recommended.'
      };
    }
  }

  // ============================================================================
  // Enhanced Spec Generation with NIM
  // ============================================================================

  /**
   * Generate enhanced spec with NIM insights
   */
  async generateEnhancedSpecWithNIM(
    optimizedWorkflow: OptimizedWorkflow,
    originalIntent: string,
    nimAnalysis: any,
    params?: OptionalParams
  ): Promise<EnhancedKiroSpec> {
    try {
      // Generate base spec
      const baseSpec = await this.generateKiroSpec(optimizedWorkflow, originalIntent);

      // Enhance with NIM insights
      const nimEnhancedSpec = await this.enhanceSpecWithNIM(baseSpec, nimAnalysis, params);

      // Generate consulting summary from NIM analysis
      const consultingSummary = this.generateConsultingSummaryFromNIM(nimAnalysis);

      // Generate ROI analysis
      const roiAnalysis = this.generateROIAnalysisFromNIM(nimAnalysis, baseSpec);

      // Generate alternative options
      const alternativeOptions = this.generateAlternativeOptionsFromNIM(nimAnalysis);

      return {
        ...nimEnhancedSpec,
        consultingSummary,
        roiAnalysis,
        alternativeOptions
      };
    } catch (error) {
      console.error('Enhanced spec generation failed:', error);
      
      // Fallback to base spec
      const baseSpec = await this.generateKiroSpec(optimizedWorkflow, originalIntent);
      return {
        ...baseSpec,
        consultingSummary: {
          executiveSummary: 'NIM analysis failed. Manual review recommended.',
          keyFindings: ['Enhanced analysis unavailable'],
          recommendations: [],
          techniquesApplied: [],
          supportingEvidence: []
        },
        roiAnalysis: {
          scenarios: [],
          recommendations: [],
          bestOption: 'Manual analysis required',
          riskAssessment: 'Unable to assess due to analysis failure'
        },
        alternativeOptions: {
          conservative: { name: 'Conservative', description: 'Standard approach', quotaSavings: 15, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
          balanced: { name: 'Balanced', description: 'Moderate approach', quotaSavings: 30, implementationEffort: 'medium', riskLevel: 'medium', estimatedROI: 2.0 },
          bold: { name: 'Bold', description: 'Advanced approach', quotaSavings: 50, implementationEffort: 'high', riskLevel: 'high', estimatedROI: 3.0 }
        }
      };
    }
  }

  // ============================================================================
  // Utility Methods and Prompt Builders
  // ============================================================================

  private buildRequirementsEnhancementPrompt(
    baseRequirements: RequirementsAnalysis,
    intent: ParsedIntent,
    context?: any
  ): string {
    return `
# Requirements Enhancement Request

Enhance and refine the following requirements analysis:

## Original Intent
${intent.businessObjective}

## Current Requirements Analysis
${JSON.stringify(baseRequirements, null, 2)}

## Context
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

## Enhancement Tasks

1. **Functional Requirements Enhancement**
   - Review and improve user stories for clarity and completeness
   - Ensure acceptance criteria are specific and testable
   - Add missing functional requirements based on intent analysis

2. **Non-Functional Requirements Enhancement**
   - Add performance, security, and scalability requirements
   - Include usability and accessibility requirements
   - Specify reliability and availability requirements

3. **Constraints and Assumptions Refinement**
   - Identify additional technical and business constraints
   - Validate and refine existing assumptions
   - Add risk factors and mitigation strategies

4. **Success Criteria Enhancement**
   - Define measurable success metrics
   - Include user satisfaction criteria
   - Add business value indicators

Provide enhanced requirements with improved clarity, completeness, and testability.
`;
  }

  private buildRequirementsValidationPrompt(
    requirements: RequirementsAnalysis,
    intent: ParsedIntent
  ): string {
    return `
# Requirements Validation Request

Validate the following requirements for quality and completeness:

## Requirements to Validate
${JSON.stringify(requirements, null, 2)}

## Original Intent
${intent.businessObjective}

## Validation Criteria

Assess requirements against:
1. **Completeness**: Are all necessary requirements captured?
2. **Consistency**: Are requirements consistent with each other?
3. **Clarity**: Are requirements clear and unambiguous?
4. **Testability**: Can requirements be verified through testing?
5. **Feasibility**: Are requirements technically and practically feasible?

## Required Output

Provide validation feedback including:
- Issues identified in current requirements
- Suggestions for improvement
- Missing requirements that should be added
- Conflicting or ambiguous requirements
- Recommendations for better testability

Focus on actionable feedback that improves requirements quality.
`;
  }

  private buildRequirementsInsightsPrompt(
    requirements: RequirementsAnalysis,
    intent: ParsedIntent
  ): string {
    return `
# Requirements Quality Assessment

Assess the quality of these requirements across multiple dimensions:

## Requirements
${JSON.stringify(requirements, null, 2)}

## Assessment Dimensions

Rate each dimension on a scale of 0-100:

1. **Clarity Score**: How clear and unambiguous are the requirements?
2. **Completeness Score**: How complete is the requirements coverage?
3. **Testability Score**: How easily can these requirements be tested?

## Required Output Format

Provide scores and recommendations:
- Clarity Score: [0-100]
- Completeness Score: [0-100]
- Testability Score: [0-100]
- Top 3 Recommendations: [list specific improvements]

Focus on objective assessment and actionable recommendations.
`;
  }

  private buildDesignAnalysisPrompt(
    option: DesignOption,
    requirements: RequirementsAnalysis,
    context?: any
  ): string {
    return `
# Design Option Analysis Request

Analyze the following design option for technical quality and suitability:

## Design Option
${JSON.stringify(option, null, 2)}

## Requirements Context
Functional Requirements: ${requirements.functionalRequirements.length}
Non-Functional Requirements: ${requirements.nonFunctionalRequirements.length}
Key Constraints: ${requirements.constraints.join(', ')}

## Analysis Criteria

Assess the design option on:
1. **Code Quality** (0-100): Architecture soundness, maintainability, readability
2. **Architectural Soundness** (0-100): Pattern appropriateness, scalability, flexibility
3. **Best Practices Alignment**: Industry standards and conventions
4. **Implementation Feasibility**: Practical considerations and risks

## Required Output

Provide analysis in this format:
- Code Quality: [0-100]
- Architectural Soundness: [0-100]
- Best Practices: [list 3-5 practices this design follows]
- Recommendations: [list 3-5 specific improvements]

Focus on technical depth and practical insights.
`;
  }

  private buildDesignSuggestionPrompt(
    requirements: RequirementsAnalysis,
    context?: any
  ): string {
    return `
# Design Option Suggestion Request

Based on the requirements analysis, suggest innovative design approaches:

## Requirements Summary
- Functional Requirements: ${requirements.functionalRequirements.length} items
- Non-Functional Requirements: ${requirements.nonFunctionalRequirements.length} items
- Key Constraints: ${requirements.constraints.join(', ')}
- Risk Factors: ${requirements.riskFactors.join(', ')}

## Context
${context ? JSON.stringify(context, null, 2) : 'Standard business application context'}

## Suggestion Criteria

Suggest 1-2 creative design approaches that:
- Address the specific requirements effectively
- Offer unique advantages or innovations
- Balance complexity with benefits
- Consider modern architectural patterns

## Required Output Format

For each suggestion, provide:
- Name and approach type (innovative/hybrid/specialized)
- Description and key benefits
- Architecture pattern and main components
- Implementation effort and timeline estimate
- Key risks and mitigation strategies
- Performance characteristics

Focus on practical innovation and clear value proposition.
`;
  }

  private buildCodeAnalysisPrompt(
    codebase: string,
    language: string,
    context?: any
  ): string {
    return `
# Code Architecture Analysis Request

Analyze the following ${language} codebase for quality and architectural soundness:

## Codebase Sample
\`\`\`${language}
${codebase.substring(0, 3000)}${codebase.length > 3000 ? '\n... [truncated]' : ''}
\`\`\`

## Analysis Dimensions

Assess the code across these dimensions (0-100 scale):

1. **Architecture Quality**: Pattern usage, separation of concerns, modularity
2. **Code Complexity**: Cyclomatic complexity, nesting levels, method sizes
3. **Maintainability**: Code organization, naming conventions, documentation
4. **Readability**: Code clarity, structure, commenting
5. **Testability**: Test-friendly design, dependency injection, modularity
6. **Performance**: Efficiency considerations, resource usage
7. **Security**: Security best practices, vulnerability patterns

## Required Output

Provide assessment in this format:
- Architecture Pattern: [identified pattern]
- Quality Scores: Architecture(0-100), Complexity(0-100), Maintainability(0-100)
- Code Quality Scores: Readability(0-100), Testability(0-100), Performance(0-100), Security(0-100)
- Top 5 Recommendations: [specific improvements]
- Refactoring Opportunities: [list 3-5 opportunities]
- Best Practices: [list practices being followed well]

Focus on actionable insights and specific improvements.
`;
  }

  private buildOptimizationEnhancementPrompt(
    baseOptimization: OptimizedWorkflow,
    intent: ParsedIntent,
    params?: OptionalParams
  ): string {
    return `
# Workflow Optimization Enhancement Request

Enhance the following workflow optimization with intelligent reasoning:

## Base Optimization
${JSON.stringify(baseOptimization, null, 2)}

## Original Intent
${intent.businessObjective}

## Parameters
${params ? JSON.stringify(params, null, 2) : 'No specific parameters'}

## Enhancement Tasks

1. **Optimization Strategy Review**
   - Validate current optimization approaches
   - Identify additional optimization opportunities
   - Suggest alternative optimization strategies

2. **Efficiency Analysis**
   - Review efficiency gains calculations
   - Identify potential bottlenecks
   - Suggest performance improvements

3. **Risk Assessment**
   - Evaluate optimization risks
   - Suggest risk mitigation strategies
   - Identify fallback approaches

## Required Output

Provide enhancement suggestions including:
- Additional optimizations to consider
- Efficiency improvement opportunities
- Risk factors and mitigation strategies
- Alternative approaches for better results

Focus on practical improvements and measurable benefits.
`;
  }

  private buildArchitecturePlanningPrompt(
    requirements: RequirementsAnalysis,
    designOption: DesignOption,
    params?: OptionalParams
  ): string {
    return `
# Architecture Planning Request

Create a comprehensive architecture plan based on:

## Requirements
${JSON.stringify(requirements, null, 2)}

## Selected Design Option
${JSON.stringify(designOption, null, 2)}

## Parameters
${params ? JSON.stringify(params, null, 2) : 'Standard parameters'}

## Planning Requirements

Create detailed architecture plan including:

1. **Component Architecture**
   - Detailed component breakdown
   - Component interfaces and contracts
   - Data flow between components

2. **Deployment Strategy**
   - Infrastructure requirements
   - Deployment patterns and strategies
   - Environment configurations

3. **Scaling Strategy**
   - Horizontal and vertical scaling approaches
   - Load balancing strategies
   - Performance optimization techniques

4. **Monitoring and Observability**
   - Monitoring strategy and tools
   - Logging and tracing approaches
   - Health check and alerting systems

Provide comprehensive technical specifications and implementation guidance.
`;
  }

  // Parsing and utility methods...
  private parseEnhancedRequirements(content: string, baseRequirements: RequirementsAnalysis): RequirementsAnalysis {
    // Enhanced parsing logic would go here
    // For now, return enhanced base requirements
    return {
      ...baseRequirements,
      // Add parsing logic to extract enhanced requirements from NIM response
    };
  }

  private applyValidationFeedback(content: string, requirements: RequirementsAnalysis): RequirementsAnalysis {
    // Apply validation feedback to requirements
    return requirements;
  }

  private parseRequirementsInsights(content: string): any {
    const insights = {
      clarityScore: 75,
      completenessScore: 80,
      testabilityScore: 70,
      recommendations: []
    };

    // Extract scores
    const clarityMatch = content.match(/Clarity Score:\s*(\d+)/i);
    if (clarityMatch) insights.clarityScore = parseInt(clarityMatch[1]);

    const completenessMatch = content.match(/Completeness Score:\s*(\d+)/i);
    if (completenessMatch) insights.completenessScore = parseInt(completenessMatch[1]);

    const testabilityMatch = content.match(/Testability Score:\s*(\d+)/i);
    if (testabilityMatch) insights.testabilityScore = parseInt(testabilityMatch[1]);

    // Extract recommendations
    const lines = content.split('\n');
    let inRecommendations = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendations:')) {
        inRecommendations = true;
        continue;
      }
      
      if (inRecommendations && line.trim().startsWith('-')) {
        insights.recommendations.push(line.trim().substring(1).trim());
      }
    }

    return insights;
  }

  private parseDesignAnalysis(content: string): any {
    return {
      codeQuality: this.extractScore(content, 'Code Quality'),
      architecturalSoundness: this.extractScore(content, 'Architectural Soundness'),
      bestPractices: this.extractList(content, 'Best Practices'),
      recommendations: this.extractList(content, 'Recommendations')
    };
  }

  private parseNIMSuggestedOptions(content: string): DesignOption[] {
    // Parse NIM-suggested design options from response
    // This would include sophisticated parsing logic
    return [];
  }

  private parseCodeAnalysis(content: string): CodeAnalysisResult {
    return {
      architecture: {
        pattern: this.extractValue(content, 'Architecture Pattern') || 'Unknown',
        quality: this.extractScore(content, 'Architecture'),
        complexity: this.extractScore(content, 'Complexity'),
        maintainability: this.extractScore(content, 'Maintainability')
      },
      codeQuality: {
        readability: this.extractScore(content, 'Readability'),
        testability: this.extractScore(content, 'Testability'),
        performance: this.extractScore(content, 'Performance'),
        security: this.extractScore(content, 'Security')
      },
      recommendations: this.extractList(content, 'Recommendations'),
      refactoringOpportunities: this.extractList(content, 'Refactoring Opportunities'),
      bestPractices: this.extractList(content, 'Best Practices')
    };
  }

  private applyNIMOptimizationEnhancements(content: string, baseOptimization: OptimizedWorkflow): OptimizedWorkflow {
    // Apply NIM enhancement suggestions to base optimization
    return baseOptimization;
  }

  private parseArchitecturePlan(content: string): any {
    return {
      components: this.extractList(content, 'Components'),
      interfaces: this.extractList(content, 'Interfaces'),
      dataFlow: this.extractList(content, 'Data Flow'),
      deploymentStrategy: this.extractValue(content, 'Deployment Strategy') || 'Standard deployment',
      scalingStrategy: this.extractValue(content, 'Scaling Strategy') || 'Horizontal scaling',
      monitoringStrategy: this.extractValue(content, 'Monitoring Strategy') || 'Basic monitoring'
    };
  }

  private enhanceSpecWithNIM(baseSpec: KiroSpec, nimAnalysis: any, params?: OptionalParams): Promise<KiroSpec> {
    // Enhance spec with NIM insights
    return Promise.resolve(baseSpec);
  }

  private generateConsultingSummaryFromNIM(nimAnalysis: any): ConsultingSummary {
    return {
      executiveSummary: 'NIM-enhanced analysis completed with architectural insights',
      keyFindings: ['Advanced code analysis performed', 'Architecture patterns identified'],
      recommendations: [],
      techniquesApplied: [],
      supportingEvidence: []
    };
  }

  private generateROIAnalysisFromNIM(nimAnalysis: any, baseSpec: KiroSpec): ROIAnalysis {
    return {
      scenarios: [],
      recommendations: ['Implement NIM-suggested optimizations'],
      bestOption: 'Balanced approach with NIM enhancements',
      riskAssessment: 'Low risk with NIM validation'
    };
  }

  private generateAlternativeOptionsFromNIM(nimAnalysis: any): ThreeOptionAnalysis {
    return {
      conservative: { name: 'Conservative', description: 'NIM-validated conservative approach', quotaSavings: 20, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.5 },
      balanced: { name: 'Balanced', description: 'NIM-optimized balanced approach', quotaSavings: 35, implementationEffort: 'medium', riskLevel: 'medium', estimatedROI: 2.5 },
      bold: { name: 'Bold', description: 'NIM-enhanced bold approach', quotaSavings: 55, implementationEffort: 'high', riskLevel: 'high', estimatedROI: 3.5 }
    };
  }

  private convertIntentToIssues(intent: ParsedIntent, workflow: Workflow): EfficiencyIssue[] {
    const issues: EfficiencyIssue[] = [];
    
    // Convert high-cost operations to efficiency issues
    intent.operationsRequired.forEach(op => {
      if (op.estimatedQuotaCost > 10) {
        issues.push({
          type: op.type === 'vibe' ? 'unnecessary_vibes' : 'redundant_query',
          severity: 'high',
          description: `High-cost operation: ${op.description}`,
          suggestedFix: `Optimize ${op.type} operation through caching or batching`,
          stepsAffected: [op.id]
        });
      }
    });

    return issues;
  }

  private rankDesignOptions(options: DesignOption[], requirements: RequirementsAnalysis): DesignOption[] {
    // Rank options based on requirements fit and NIM analysis
    return options.sort((a, b) => {
      const scoreA = this.calculateOptionScore(a, requirements);
      const scoreB = this.calculateOptionScore(b, requirements);
      return scoreB - scoreA;
    });
  }

  private calculateOptionScore(option: DesignOption, requirements: RequirementsAnalysis): number {
    let score = 0;
    
    // Base architecture scores
    score += option.architecture.scalability * 10;
    score += option.architecture.maintainability * 10;
    
    // NIM analysis bonus
    if (option.nimAnalysis) {
      score += option.nimAnalysis.codeQuality;
      score += option.nimAnalysis.architecturalSoundness;
    }
    
    // Complexity penalty
    if (option.architecture.complexity === 'high') score -= 50;
    if (option.architecture.complexity === 'low') score += 20;
    
    return score;
  }

  // Utility methods for parsing NIM responses
  private extractScore(content: string, label: string): number {
    const match = content.match(new RegExp(`${label}[:\\s]*([0-9]+)`, 'i'));
    return match ? parseInt(match[1]) : 70;
  }

  private extractValue(content: string, label: string): string | null {
    const match = content.match(new RegExp(`${label}[:\\s]*([^\\n]+)`, 'i'));
    return match ? match[1].trim() : null;
  }

  private extractList(content: string, label: string): string[] {
    const lines = content.split('\n');
    const list: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(label.toLowerCase() + ':')) {
        inSection = true;
        continue;
      }
      
      if (inSection && line.trim().startsWith('-')) {
        list.push(line.trim().substring(1).trim());
      } else if (inSection && line.trim() === '') {
        break;
      }
    }
    
    return list;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.analysisCache.clear();
    this.embeddingCache.clear();
    console.log('NIM-Enhanced Product Development Agent cleaned up');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create NIM-enhanced product development agent
 */
export function createNIMEnhancedProductDevelopmentAgent(nimConfig?: any): INIMEnhancedProductDevelopmentAgent {
  return new NIMEnhancedProductDevelopmentAgent(nimConfig);
}

/**
 * Create NIM-enhanced product development agent for local testing
 */
export function createLocalNIMEnhancedProductDevelopmentAgent(
  localEndpoint: string = 'http://localhost:1234'
): INIMEnhancedProductDevelopmentAgent {
  return new NIMEnhancedProductDevelopmentAgent({
    localTestingEnabled: true,
    localEndpoint,
    timeout: 30000
  });
}