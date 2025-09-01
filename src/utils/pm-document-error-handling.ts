// PM Document error handling and fallback utilities

import { PMDocumentValidationError } from './pm-document-validation';
import {
  ManagementOnePager,
  PRFAQ,
  PMRequirements,
  DesignOptions,
  TaskPlan,
  ROIInputs,
  RequirementsContext,
  TaskLimits,
  RiskMitigation,
  OptionSummary,
  ROITable,
  FAQItem,
  ChecklistItem,
  PriorityItem,
  DesignOption,
  ImpactEffortMatrix,
  Task,
  GuardrailsTask
} from '../components/pm-document-generator';

/**
 * Error types for PM document generation
 */
export class PMDocumentGenerationError extends Error {
  constructor(
    message: string,
    public documentType: string,
    public originalError?: Error,
    public fallbackUsed?: boolean
  ) {
    super(message);
    this.name = 'PMDocumentGenerationError';
  }
}

/**
 * Fallback strategies for PM document generation
 */
export class PMDocumentFallbackProvider {
  /**
   * Generate fallback management one-pager when primary generation fails
   */
  static generateFallbackManagementOnePager(
    requirements?: string,
    design?: string,
    error?: Error
  ): ManagementOnePager {
    console.warn('Using fallback management one-pager generation due to error:', error?.message);

    return {
      answer: 'Proceed with cautious implementation approach given limited analysis capability',
      because: [
        'Core business need identified despite analysis limitations',
        'Technical feasibility appears reasonable based on available information',
        'Risk-managed approach allows for iterative development and learning'
      ],
      whatScopeToday: [
        'Minimum viable implementation of core functionality',
        'Basic user interface and essential features',
        'Initial testing and validation framework'
      ],
      risksAndMitigations: [
        {
          risk: 'Incomplete analysis may miss critical requirements or constraints',
          mitigation: 'Implement comprehensive discovery phase with stakeholder interviews'
        },
        {
          risk: 'Technical complexity may be underestimated without full design analysis',
          mitigation: 'Start with proof-of-concept and iterative development approach'
        },
        {
          risk: 'Resource requirements may be inaccurate due to limited input analysis',
          mitigation: 'Establish regular checkpoints and budget review processes'
        }
      ],
      options: {
        conservative: {
          name: 'Conservative',
          summary: 'Minimal implementation with extensive validation and risk mitigation'
        },
        balanced: {
          name: 'Balanced',
          summary: 'Phased approach balancing speed with thorough analysis and validation',
          recommended: true
        },
        bold: {
          name: 'Bold',
          summary: 'Accelerated development with parallel analysis and rapid iteration'
        }
      },
      roiSnapshot: {
        options: {
          conservative: {
            effort: 'Low',
            impact: 'Med',
            estimatedCost: '$75K',
            timing: 'Now'
          },
          balanced: {
            effort: 'Med',
            impact: 'High',
            estimatedCost: '$200K',
            timing: 'Now'
          },
          bold: {
            effort: 'High',
            impact: 'High',
            estimatedCost: '$400K',
            timing: 'Later'
          }
        }
      },
      rightTimeRecommendation: 'Given analysis limitations, a balanced approach is recommended to validate assumptions while making progress. Start with discovery and proof-of-concept to build confidence before full commitment. The conservative timeline allows for course correction as more information becomes available.'
    };
  }

  /**
   * Generate fallback PR-FAQ when primary generation fails
   */
  static generateFallbackPRFAQ(
    requirements?: string,
    design?: string,
    targetDate?: string,
    error?: Error
  ): PRFAQ {
    console.warn('Using fallback PR-FAQ generation due to error:', error?.message);

    const launchDate = targetDate || this.getDefaultLaunchDate();

    return {
      pressRelease: {
        date: launchDate,
        headline: 'New Product Initiative Addresses Key Market Need',
        subHeadline: 'Innovative solution delivers value through systematic approach to identified challenges',
        body: 'Today we announced a new product initiative designed to address important market needs and deliver measurable value to our customers. This solution represents our commitment to innovation and customer success. The product will be available to customers starting with a limited release, followed by broader availability based on market feedback and operational readiness.'
      },
      faq: [
        {
          question: 'Who is the customer?',
          answer: 'Primary customers are organizations seeking to improve efficiency and reduce operational complexity through innovative solutions.'
        },
        {
          question: 'What problem are we solving now?',
          answer: 'We are addressing the challenge of inefficient processes that consume excessive resources and limit organizational productivity.'
        },
        {
          question: 'Why now and why not later?',
          answer: 'Market conditions are favorable and customer demand is strong. Delaying would mean missing the current opportunity window.'
        },
        {
          question: 'What is the smallest lovable version?',
          answer: 'Core functionality that delivers immediate value with essential features and basic user interface.'
        },
        {
          question: 'How will we measure success (3 metrics)?',
          answer: 'Customer adoption rate, operational efficiency improvement, and user satisfaction scores.'
        },
        {
          question: 'What are the top 3 risks and mitigations?',
          answer: 'Technical complexity (mitigated by phased approach), market timing (mitigated by customer validation), resource constraints (mitigated by prioritization).'
        },
        {
          question: 'What is not included?',
          answer: 'Advanced features, enterprise integrations, and specialized customizations will be considered for future releases.'
        },
        {
          question: 'How does this compare to alternatives?',
          answer: 'Our solution offers unique value through integrated approach and focus on user experience compared to existing alternatives.'
        },
        {
          question: 'What\'s the estimated cost/quota footprint?',
          answer: 'Estimated development cost of $200K with operational costs scaling based on usage and adoption.'
        },
        {
          question: 'What are the next 2 releases after v1?',
          answer: 'v2 will add advanced analytics and reporting. v3 will include enterprise features and third-party integrations.'
        }
      ],
      launchChecklist: [
        {
          task: 'Complete technical architecture review',
          owner: 'Engineering Team',
          dueDate: this.getDateOffset(launchDate, -60)
        },
        {
          task: 'Finalize go-to-market strategy',
          owner: 'Product Marketing',
          dueDate: this.getDateOffset(launchDate, -45)
        },
        {
          task: 'Complete user acceptance testing',
          owner: 'QA Team',
          dueDate: this.getDateOffset(launchDate, -30)
        },
        {
          task: 'Prepare customer support materials',
          owner: 'Customer Success',
          dueDate: this.getDateOffset(launchDate, -14)
        },
        {
          task: 'Execute launch communications',
          owner: 'Marketing Team',
          dueDate: launchDate
        }
      ]
    };
  }

  /**
   * Generate fallback requirements when primary generation fails
   */
  static generateFallbackRequirements(
    rawIntent?: string,
    context?: RequirementsContext,
    error?: Error
  ): PMRequirements {
    console.warn('Using fallback requirements generation due to error:', error?.message);

    return {
      businessGoal: 'Deliver measurable value through systematic solution to identified business challenges and user needs',
      userNeeds: {
        jobs: [
          'Accomplish tasks more efficiently with less manual effort',
          'Make better decisions with improved information and insights',
          'Reduce complexity and streamline workflows'
        ],
        pains: [
          'Current processes are time-consuming and error-prone',
          'Limited visibility into performance and optimization opportunities',
          'Manual work that doesn\'t scale with business growth'
        ],
        gains: [
          'Significant time savings through automation and optimization',
          'Improved accuracy and consistency in outcomes',
          'Better scalability and reduced operational overhead'
        ]
      },
      functionalRequirements: [
        'System shall provide core functionality to address primary user needs',
        'System shall include user interface for essential interactions',
        'System shall support basic data processing and analysis',
        'System shall provide feedback and status information to users',
        'System shall maintain data integrity and security standards'
      ],
      constraintsRisks: [
        'Technical complexity may impact development timeline',
        'Resource constraints may limit scope of initial implementation',
        'User adoption may require change management and training',
        'Integration with existing systems may present challenges'
      ],
      priority: {
        must: [
          {
            requirement: 'Core functionality that addresses primary user need',
            justification: 'Essential for minimum viable product and user value'
          },
          {
            requirement: 'Basic user interface for essential interactions',
            justification: 'Required for user adoption and system usability'
          }
        ],
        should: [
          {
            requirement: 'Data processing and analysis capabilities',
            justification: 'Important for delivering insights and value to users'
          },
          {
            requirement: 'User feedback and status information',
            justification: 'Enhances user experience and system transparency'
          }
        ],
        could: [
          {
            requirement: 'Advanced analytics and reporting features',
            justification: 'Valuable for power users but not essential for initial release'
          },
          {
            requirement: 'Integration with third-party systems',
            justification: 'Useful for workflow optimization but can be added later'
          }
        ],
        wont: [
          {
            requirement: 'Enterprise-grade customization options',
            justification: 'Complex to implement and not needed for initial market validation'
          },
          {
            requirement: 'Advanced security and compliance features',
            justification: 'Important but can be addressed in subsequent releases'
          }
        ]
      },
      rightTimeVerdict: {
        decision: 'do_now',
        reasoning: 'Despite analysis limitations, core business need is clear and market opportunity exists. Starting with conservative approach allows for learning and iteration while making progress toward value delivery.'
      }
    };
  }

  /**
   * Generate fallback design options when primary generation fails
   */
  static generateFallbackDesignOptions(
    requirements?: string,
    error?: Error
  ): DesignOptions {
    console.warn('Using fallback design options generation due to error:', error?.message);

    const conservative: DesignOption = {
      name: 'Conservative',
      summary: 'Minimal viable implementation with proven technologies and low-risk approach',
      keyTradeoffs: ['Lower risk but limited functionality', 'Longer time to full value realization', 'May require future rework for scalability'],
      impact: 'Medium',
      effort: 'Low',
      majorRisks: ['May not fully address user needs', 'Limited competitive differentiation']
    };

    const balanced: DesignOption = {
      name: 'Balanced',
      summary: 'Phased approach balancing functionality with manageable complexity and risk',
      keyTradeoffs: ['Moderate complexity with good value delivery', 'Reasonable timeline with iterative improvement', 'Balanced risk-reward profile'],
      impact: 'High',
      effort: 'Medium',
      majorRisks: ['Coordination complexity across phases', 'Potential scope creep during development']
    };

    const bold: DesignOption = {
      name: 'Bold',
      summary: 'Comprehensive solution with advanced features and innovative approach',
      keyTradeoffs: ['High value potential but significant complexity', 'Longer development timeline', 'Higher risk but greater competitive advantage'],
      impact: 'High',
      effort: 'High',
      majorRisks: ['Technical complexity may cause delays', 'Resource requirements may exceed capacity']
    };

    return {
      problemFraming: 'Current analysis capabilities are limited, requiring a systematic approach to solution design that balances risk with value delivery. The challenge is to make progress despite incomplete information while building capability for future optimization.',
      options: {
        conservative,
        balanced,
        bold
      },
      impactEffortMatrix: {
        highImpactLowEffort: [],
        highImpactHighEffort: [balanced, bold],
        lowImpactLowEffort: [],
        lowImpactHighEffort: [conservative]
      },
      rightTimeRecommendation: 'Given analysis limitations, the balanced approach is recommended as it provides good value delivery while managing risk. This allows for learning and iteration while making meaningful progress toward the solution.'
    };
  }

  /**
   * Generate fallback task plan when primary generation fails
   */
  static generateFallbackTaskPlan(
    design?: string,
    limits?: TaskLimits,
    error?: Error
  ): TaskPlan {
    console.warn('Using fallback task plan generation due to error:', error?.message);

    const guardrailsCheck: GuardrailsTask = {
      id: '0',
      name: 'Guardrails Check',
      description: 'Validate that project constraints and limits are within acceptable bounds',
      acceptanceCriteria: [
        'Resource requirements are within available capacity',
        'Timeline expectations are realistic given scope',
        'Technical complexity is manageable with current capabilities',
        'Risk factors are identified and mitigation strategies are in place'
      ],
      effort: 'S',
      impact: 'High',
      priority: 'Must',
      limits: limits || {
        maxVibes: 10000,
        maxSpecs: 1000,
        budgetUSD: 500000
      },
      checkCriteria: [
        'Budget requirements do not exceed available funding',
        'Technical requirements are within team capabilities',
        'Timeline allows for proper development and testing',
        'Dependencies are identified and manageable'
      ]
    };

    const immediateWins: Task[] = [
      {
        id: '1',
        name: 'Project Setup and Planning',
        description: 'Establish project structure, team roles, and initial planning',
        acceptanceCriteria: [
          'Project repository and development environment are set up',
          'Team roles and responsibilities are defined',
          'Initial project plan and milestones are established'
        ],
        effort: 'S',
        impact: 'Med',
        priority: 'Must'
      },
      {
        id: '2',
        name: 'Requirements Validation',
        description: 'Validate and refine requirements through stakeholder engagement',
        acceptanceCriteria: [
          'Key stakeholders have reviewed and approved requirements',
          'Success criteria and acceptance criteria are clearly defined',
          'Scope boundaries are established and communicated'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Must'
      }
    ];

    const shortTerm: Task[] = [
      {
        id: '3',
        name: 'Technical Architecture Design',
        description: 'Design system architecture and technical approach',
        acceptanceCriteria: [
          'System architecture is documented and reviewed',
          'Technology stack is selected and justified',
          'Integration points and dependencies are identified'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Must'
      },
      {
        id: '4',
        name: 'Proof of Concept Development',
        description: 'Build proof of concept to validate technical approach',
        acceptanceCriteria: [
          'Core functionality is demonstrated in working prototype',
          'Technical feasibility is validated',
          'Performance characteristics are understood'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Should'
      },
      {
        id: '5',
        name: 'User Experience Design',
        description: 'Design user interface and interaction patterns',
        acceptanceCriteria: [
          'User workflows are designed and documented',
          'Interface mockups are created and reviewed',
          'Usability considerations are addressed'
        ],
        effort: 'M',
        impact: 'Med',
        priority: 'Should'
      }
    ];

    const longTerm: Task[] = [
      {
        id: '6',
        name: 'Core Implementation',
        description: 'Implement core system functionality',
        acceptanceCriteria: [
          'Core features are implemented and tested',
          'System meets functional requirements',
          'Code quality standards are maintained'
        ],
        effort: 'L',
        impact: 'High',
        priority: 'Must'
      },
      {
        id: '7',
        name: 'Integration and Testing',
        description: 'Integrate components and conduct comprehensive testing',
        acceptanceCriteria: [
          'All components are integrated and working together',
          'Comprehensive test suite is implemented and passing',
          'Performance and security testing is completed'
        ],
        effort: 'L',
        impact: 'High',
        priority: 'Must'
      },
      {
        id: '8',
        name: 'Deployment and Launch Preparation',
        description: 'Prepare for production deployment and user launch',
        acceptanceCriteria: [
          'Production environment is configured and tested',
          'Deployment procedures are documented and validated',
          'Launch plan and rollback procedures are prepared'
        ],
        effort: 'M',
        impact: 'Med',
        priority: 'Should'
      }
    ];

    return {
      guardrailsCheck,
      immediateWins,
      shortTerm,
      longTerm
    };
  }

  /**
   * Get default launch date (3 months from now)
   */
  private static getDefaultLaunchDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date offset from a base date
   */
  private static getDateOffset(baseDate: string, offsetDays: number): string {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Error recovery utilities for PM document generation
 */
export class PMDocumentErrorRecovery {
  /**
   * Attempt to recover from document generation error with graceful degradation
   */
  static async recoverFromError<T>(
    operation: () => Promise<T>,
    fallbackProvider: () => T,
    context: {
      documentType: string;
      operation: string;
      inputs?: any;
    }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Error in ${context.documentType} ${context.operation}:`, error);
      
      // Log error details for debugging
      if (error instanceof PMDocumentValidationError) {
        console.error('Validation error details:', {
          field: error.field,
          documentType: error.documentType,
          message: error.message
        });
      }

      // Attempt fallback
      try {
        const fallbackResult = fallbackProvider();
        console.warn(`Using fallback for ${context.documentType} ${context.operation}`);
        return fallbackResult;
      } catch (fallbackError) {
        console.error(`Fallback also failed for ${context.documentType}:`, fallbackError);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new PMDocumentGenerationError(
          `Failed to generate ${context.documentType}: ${errorMessage}. Fallback also failed: ${fallbackErrorMessage}`,
          context.documentType,
          error instanceof Error ? error : new Error(String(error)),
          false
        );
      }
    }
  }

  /**
   * Validate and sanitize inputs with error recovery
   */
  static sanitizeInput(input: string, fieldName: string, maxLength: number = 50000): string {
    if (!input || typeof input !== 'string') {
      console.warn(`Invalid ${fieldName} input, using placeholder`);
      return `[${fieldName} content not available - using fallback analysis]`;
    }

    // Truncate if too long
    if (input.length > maxLength) {
      console.warn(`${fieldName} input truncated from ${input.length} to ${maxLength} characters`);
      return input.substring(0, maxLength) + '... [truncated]';
    }

    // Clean up common issues
    let sanitized = input.trim();
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Ensure minimum content
    if (sanitized.length < 10) {
      console.warn(`${fieldName} input too short, using placeholder`);
      return `[${fieldName} content insufficient - using fallback analysis]`;
    }

    return sanitized;
  }

  /**
   * Extract meaningful content from potentially malformed input
   */
  static extractMeaningfulContent(input: string, minLength: number = 50): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove markdown formatting for content analysis
    let content = input
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .trim();

    // Extract sentences that contain meaningful content
    const sentences = content.split(/[.!?]+/).filter(sentence => {
      const cleaned = sentence.trim();
      return cleaned.length >= 10 && 
             !cleaned.match(/^(test|example|sample|todo|fixme)$/i) &&
             cleaned.split(' ').length >= 3;
    });

    const meaningfulContent = sentences.join('. ').trim();
    
    if (meaningfulContent.length < minLength) {
      return ''; // Not enough meaningful content
    }

    return meaningfulContent;
  }

  /**
   * Provide contextual error messages for different failure scenarios
   */
  static getContextualErrorMessage(
    error: Error,
    documentType: string,
    operation: string
  ): string {
    if (error instanceof PMDocumentValidationError) {
      return `Input validation failed for ${documentType} ${operation}: ${error.message}. Please check the ${error.field || 'input'} and try again.`;
    }

    if (error.message.includes('timeout')) {
      return `${documentType} ${operation} timed out. This may be due to complex input or system load. Try with simpler input or retry later.`;
    }

    if (error.message.includes('memory') || error.message.includes('heap')) {
      return `${documentType} ${operation} failed due to memory constraints. Try with shorter input documents or break into smaller sections.`;
    }

    if (error.message.includes('network') || error.message.includes('connection')) {
      return `${documentType} ${operation} failed due to network issues. Please check connectivity and retry.`;
    }

    return `${documentType} ${operation} failed: ${error.message}. Using fallback generation with limited analysis capability.`;
  }
}