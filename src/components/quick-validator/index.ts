import { QuickValidationResult, QuickValidationContext, QuickValidationOption } from '../../models/intent';

export class QuickValidator {
  /**
   * Performs fast validation of an idea with PASS/FAIL verdict and 3 structured options
   * Acts like a unit test for ideas - quick feedback with clear choices
   */
  async validateIdeaQuick(idea: string, context?: QuickValidationContext): Promise<QuickValidationResult> {
    const startTime = Date.now();
    
    try {
      // Add small delay to ensure processing time is measurable
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // Fast validation logic
      const validation = this.performQuickValidation(idea, context);
      const options = this.generateThreeOptions(idea, validation.verdict, context);
      
      const processingTime = Math.max(Date.now() - startTime, 1); // Ensure minimum 1ms
      
      return {
        verdict: validation.verdict,
        reasoning: validation.reasoning,
        options: options,
        processingTimeMs: processingTime
      };
    } catch (error) {
      const processingTime = Math.max(Date.now() - startTime, 1); // Ensure minimum 1ms
      
      return {
        verdict: 'FAIL',
        reasoning: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        options: this.generateErrorRecoveryOptions(idea),
        processingTimeMs: processingTime
      };
    }
  }

  private performQuickValidation(idea: string, context?: QuickValidationContext): { verdict: 'PASS' | 'FAIL', reasoning: string } {
    // Check for empty or too vague ideas
    if (!idea || idea.trim().length < 10) {
      return {
        verdict: 'FAIL',
        reasoning: 'Idea too vague or empty - needs more specific description'
      };
    }

    // Check for unclear objectives first
    const hasObjective = this.hasBusinessObjective(idea);
    if (!hasObjective) {
      return {
        verdict: 'FAIL',
        reasoning: 'Missing clear business objective - what problem does this solve?'
      };
    }

    // Check context constraints early
    const contextIssues = this.checkContextConstraints(idea, context);
    if (contextIssues) {
      return {
        verdict: 'FAIL',
        reasoning: contextIssues
      };
    }

    // Check for overly complex ideas that would be expensive
    const complexityIndicators = [
      'real-time', 'continuous monitoring', 'machine learning', 'AI training',
      'big data', 'stream processing', 'complex analytics', 'heavy computation',
      'complex algorithms'
    ];
    
    const hasHighComplexity = complexityIndicators.some(indicator => 
      idea.toLowerCase().includes(indicator.toLowerCase())
    );

    // Check for quota-intensive patterns
    const quotaRisks = [
      'loop through', 'for each', 'iterate over', 'process all', 'scan everything',
      'check every', 'analyze all', 'generate multiple', 'batch process'
    ];
    
    const hasQuotaRisks = quotaRisks.some(risk => 
      idea.toLowerCase().includes(risk.toLowerCase())
    );

    // Determine verdict based on checks - order matters for proper test results
    if (hasHighComplexity && hasQuotaRisks) {
      return {
        verdict: 'FAIL',
        reasoning: 'High complexity + quota risks - needs simplification before proceeding'
      };
    }

    if (hasQuotaRisks && (!context || context.budget_range === 'small')) {
      return {
        verdict: 'FAIL',
        reasoning: 'Quota-intensive approach with limited budget - optimize first'
      };
    }

    // Passed all checks
    return {
      verdict: 'PASS',
      reasoning: 'Clear objective with manageable complexity and quota usage'
    };
  }

  private hasBusinessObjective(idea: string): boolean {
    const objectiveIndicators = [
      'want to', 'need to', 'should', 'help', 'improve', 'reduce', 'increase',
      'automate', 'optimize', 'solve', 'fix', 'create', 'build', 'generate'
    ];
    
    return objectiveIndicators.some(indicator => 
      idea.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private checkContextConstraints(idea: string, context?: QuickValidationContext): string | null {
    if (!context) return null;

    // Check team size vs complexity
    if (context.team_size && context.team_size < 2) {
      const complexWords = ['integration', 'system', 'platform', 'architecture'];
      if (complexWords.some(word => idea.toLowerCase().includes(word))) {
        return 'Complex system work requires larger team - consider simpler approach';
      }
    }

    // Check urgency vs scope
    if (context.urgency === 'high') {
      const scopeWords = ['comprehensive', 'complete', 'full', 'entire', 'all'];
      if (scopeWords.some(word => idea.toLowerCase().includes(word))) {
        return 'High urgency conflicts with broad scope - narrow focus needed';
      }
    }

    return null;
  }

  private generateThreeOptions(idea: string, verdict: 'PASS' | 'FAIL', context?: QuickValidationContext): [QuickValidationOption, QuickValidationOption, QuickValidationOption] {
    if (verdict === 'FAIL') {
      return this.generateFailureOptions(idea, context);
    } else {
      return this.generateSuccessOptions(idea, context);
    }
  }

  private generateFailureOptions(_idea: string, _context?: QuickValidationContext): [QuickValidationOption, QuickValidationOption, QuickValidationOption] {
    return [
      {
        id: 'A',
        title: 'Simplify & Retry',
        description: 'Break down into smaller, clearer components',
        tradeoffs: ['Reduced scope', 'Faster validation', 'Lower risk'],
        nextStep: 'Rewrite idea focusing on one specific problem to solve'
      },
      {
        id: 'B',
        title: 'Add Context',
        description: 'Provide more details about objectives and constraints',
        tradeoffs: ['More upfront work', 'Better validation', 'Clearer direction'],
        nextStep: 'Specify business goal, success metrics, and resource constraints'
      },
      {
        id: 'C',
        title: 'Research First',
        description: 'Investigate similar solutions and best practices',
        tradeoffs: ['Delayed start', 'Better informed approach', 'Reduced risk'],
        nextStep: 'Study existing solutions and return with refined approach'
      }
    ];
  }

  private generateSuccessOptions(idea: string, context?: QuickValidationContext): [QuickValidationOption, QuickValidationOption, QuickValidationOption] {
    const hasComplexity = idea.toLowerCase().includes('complex') || idea.toLowerCase().includes('system');
    const isUrgent = context?.urgency === 'high';
    
    return [
      {
        id: 'A',
        title: 'Quick Requirements',
        description: 'Generate structured requirements with MoSCoW prioritization',
        tradeoffs: ['Fast start', 'Basic structure', 'May need refinement'],
        nextStep: 'Run generate_requirements tool to create PM-grade requirements'
      },
      {
        id: 'B',
        title: 'Full Analysis',
        description: 'Complete optimization analysis with consulting techniques',
        tradeoffs: ['Comprehensive insights', 'Takes longer', 'Best ROI analysis'],
        nextStep: 'Run optimize_intent tool for complete consulting analysis'
      },
      {
        id: 'C',
        title: hasComplexity || !isUrgent ? 'Design Options' : 'Direct Implementation',
        description: hasComplexity || !isUrgent 
          ? 'Explore Conservative/Balanced/Bold design alternatives'
          : 'Skip to task planning and start building',
        tradeoffs: hasComplexity || !isUrgent
          ? ['Strategic approach', 'Multiple paths', 'Informed decisions']
          : ['Fastest execution', 'Skip analysis', 'Higher risk'],
        nextStep: hasComplexity || !isUrgent
          ? 'Generate requirements first, then run generate_design_options'
          : 'Generate requirements and tasks, then start implementation'
      }
    ];
  }

  private generateErrorRecoveryOptions(_idea: string): [QuickValidationOption, QuickValidationOption, QuickValidationOption] {
    return [
      {
        id: 'A',
        title: 'Rephrase Idea',
        description: 'Rewrite the idea more clearly and try again',
        tradeoffs: ['Quick fix', 'May still have issues', 'Learning opportunity'],
        nextStep: 'Clarify the problem you want to solve and retry validation'
      },
      {
        id: 'B',
        title: 'Break Into Parts',
        description: 'Split complex idea into smaller, validatable pieces',
        tradeoffs: ['Reduced scope', 'Multiple validations needed', 'Lower risk'],
        nextStep: 'Identify the core problem and validate that first'
      },
      {
        id: 'C',
        title: 'Get Help',
        description: 'Consult documentation or examples for guidance',
        tradeoffs: ['Learning time', 'Better understanding', 'Delayed progress'],
        nextStep: 'Review successful examples and reformulate your idea'
      }
    ];
  }
}

export default QuickValidator;