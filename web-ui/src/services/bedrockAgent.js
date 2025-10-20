// Bedrock Agent Service for React Chat Integration
import { authService } from './auth';

class BedrockAgentService {
  constructor() {
    // Get API Gateway URL from environment
    this.apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
    
    // Rate limiting state
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.isProcessing = false;
    
    // Model configuration
    this.currentModel = 'haiku'; // Switch to Claude 3.5 Haiku for better rate limits
    this.enableCrossRegion = true;
    this.useDirectModel = true; // Use direct model calls for better control
    
    if (!this.apiUrl) {
      console.warn('VITE_API_GATEWAY_URL not set. Please deploy the Lambda function first.');
    } else {
      console.log('🚀 Vibe PM Agent initialized with API Gateway:', this.apiUrl);
      console.log('📋 Available Bedrock Agents:');
      console.log('  - vibe-pm-business-strategy-agent (IBQRX8MZJJ)');
      console.log('  - vibe-pm-executive-communications-agent (ULX1RJGKCR)');
      console.log('  - vibe-pm-interview-coaching-agent (PDZPQTNLYH)');
      console.log('  - vibe-pm-product-development-agent (CEW45LTT2P)');
      console.log(`🤖 Current model: Claude 3.5 ${this.currentModel.toUpperCase()} (10x better rate limits!)`);
      console.log(`🌍 Cross-region inference: ${this.enableCrossRegion ? 'ENABLED' : 'DISABLED'}`);
      console.log(`⚡ Direct model calls: ${this.useDirectModel ? 'ENABLED' : 'DISABLED'}`);
    }
  }

  /**
   * Get API key for external access
   */
  getApiKey() {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured. Please set VITE_API_KEY in environment');
    }
    return apiKey;
  }

  /**
   * Determine the best tool and endpoint for the user's query
   */
  determineToolForQuery(text) {
    const lowerText = text.toLowerCase();
    
    // Interview preparation queries
    if (lowerText.includes('interview') || lowerText.includes('pm interview') || lowerText.includes('product manager interview')) {
      return {
        endpoint: '/interview-prep/start-session',
        toolName: 'start_interview_preparation',
        toolArgs: {
          role_level: 'PM',
          preparation_timeline: '2 weeks'
        }
      };
    }
    
    // Business case or ROI queries
    if (lowerText.includes('business case') || lowerText.includes('roi') || lowerText.includes('return on investment')) {
      return {
        endpoint: '/business-analysis/generate-case',
        toolName: 'generate_business_case',
        toolArgs: {
          opportunity_analysis: text
        }
      };
    }
    
    // Market analysis queries
    if (lowerText.includes('market') || lowerText.includes('competition') || lowerText.includes('competitor')) {
      return {
        endpoint: '/business-analysis/competitor-analysis',
        toolName: 'analyze_competitor_landscape',
        toolArgs: {
          market_segment: text
        }
      };
    }
    
    // Default to idea validation for general queries
    return {
      endpoint: '/business-analysis/validate-idea',
      toolName: 'validate_idea_quick',
      toolArgs: {
        idea: text,
        criteria: ['market_viability', 'technical_feasibility', 'business_potential']
      }
    };
  }

  /**
   * Call Bedrock Agent with user input - Now with REAL Claude 3.5 v2 conversation!
   * @param {string} text - User input text
   * @param {string} sessionId - Optional session ID for conversation continuity
   * @param {boolean} enableTrace - Enable trace for debugging
   * @returns {Promise<Object>} Agent response
   */
  async invokeAgent(text, sessionId = null, enableTrace = false) {
    console.log(`🤖 Starting conversation with Claude 3.5 v2 via Bedrock Agent`);
    console.log(`💬 User: "${text}"`);
    
    // Try real Bedrock Agent first, fallback to mock API if needed
    try {
      const realResponse = await this.invokeRealBedrockAgent(text, sessionId, enableTrace);
      if (realResponse) {
        return realResponse;
      }
    } catch (error) {
      console.warn('⚠️ Real Bedrock Agent failed, falling back to mock API:', error.message);
    }
    
    // Fallback to mock API Gateway
    return await this.invokeMockAPI(text, sessionId, enableTrace);
  }

  /**
   * Invoke real Bedrock with Claude 3.5 Haiku and rate limiting
   */
  async invokeRealBedrockAgent(text, sessionId = null, enableTrace = false) {
    const finalSessionId = sessionId || `web-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 Invoking Claude 3.5 ${this.currentModel.toUpperCase()} with rate limiting`);
    console.log(`🔗 Session: ${finalSessionId}`);
    console.log(`🌍 Cross-region: ${this.enableCrossRegion}`);

    // Check rate limit status first
    await this.checkRateLimit();

    // Call through our local proxy server
    const proxyUrl = import.meta.env.VITE_BEDROCK_PROXY_URL || 'http://localhost:3001';
    
    const requestBody = {
      text,
      sessionId: finalSessionId,
      enableTrace,
      useDirectModel: this.useDirectModel
    };
    
    // Add agent info if not using direct model
    if (!this.useDirectModel) {
      requestBody.agentId = 'IBQRX8MZJJ'; // vibe-pm-business-strategy-agent
      requestBody.agentAliasId = 'TSTALIASID';
    }

    const response = await fetch(`${proxyUrl}/api/bedrock-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle rate limiting gracefully
      if (response.status === 429) {
        const waitTime = this.extractWaitTime(errorData.error);
        throw new Error(`Rate limited: Please wait ${waitTime}s before trying again. Using Claude 3.5 ${this.currentModel.toUpperCase()}.`);
      }
      
      throw new Error(`Bedrock API failed: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ Claude 3.5 ${this.currentModel.toUpperCase()} response: ${result.response?.substring(0, 200)}...`);
    
    return {
      response: result.response,
      sessionId: result.sessionId,
      model: result.model || this.currentModel,
      usage: result.usage,
      trace: enableTrace ? result.traces : undefined
    };
  }

  /**
   * Check current rate limit status
   */
  async checkRateLimit() {
    try {
      const proxyUrl = import.meta.env.VITE_BEDROCK_PROXY_URL || 'http://localhost:3001';
      const response = await fetch(`${proxyUrl}/api/bedrock-status`);
      
      if (response.ok) {
        const status = await response.json();
        
        if (status.nextRequestInSeconds > 0) {
          console.log(`⏳ Rate limit: waiting ${status.nextRequestInSeconds}s (${status.requestsPerMinute} req/min limit)`);
          
          // Show user-friendly message
          if (status.nextRequestInSeconds > 5) {
            throw new Error(`Rate limited: Please wait ${status.nextRequestInSeconds} seconds. Claude 3.5 ${this.currentModel.toUpperCase()} allows ${status.requestsPerMinute} requests per minute.`);
          }
        }
      }
    } catch (error) {
      // Don't fail the request if status check fails
      console.warn('Rate limit status check failed:', error.message);
    }
  }

  /**
   * Extract wait time from error message
   */
  extractWaitTime(errorMessage) {
    const match = errorMessage?.match(/wait (\d+)s/);
    return match ? match[1] : '60';
  }

  /**
   * Fallback to mock API Gateway (current system)
   */
  async invokeMockAPI(text, sessionId = null, enableTrace = false) {
    if (!this.apiUrl) {
      throw new Error('API Gateway URL not configured. Please set VITE_API_GATEWAY_URL');
    }

    try {
      const apiKey = this.getApiKey();
      
      // Determine the best tool for this query
      const toolConfig = this.determineToolForQuery(text);
      
      console.log(`🔧 Fallback: Routing to mock tool: ${toolConfig.toolName}`);
      
      const response = await fetch(`${this.apiUrl}${toolConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolName: toolConfig.toolName,
          toolArgs: toolConfig.toolArgs
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extract the actual text response from the nested structure
      let responseText = this.formatResponse(result);
      
      if (!responseText || responseText === 'Analysis completed successfully') {
        // Fallback formatting
        if (result.data && typeof result.data === 'object') {
          responseText = `**📊 Analysis Results** *(using mock data - Claude 3.5 v2 is temporarily rate-limited)*\n\n${JSON.stringify(result.data, null, 2)}`;
        } else if (result.result && typeof result.result === 'object') {
          responseText = `**📋 Results** *(using mock data - Claude 3.5 v2 is temporarily rate-limited)*\n\n${JSON.stringify(result.result, null, 2)}`;
        } else {
          responseText = '⚠️ Claude 3.5 v2 is temporarily rate-limited. Using mock analysis. Please try again in a few minutes for real conversational AI.';
        }
      } else {
        // Add a note that this is mock data
        responseText = `⚠️ *Note: Claude 3.5 v2 is temporarily rate-limited. This is mock analysis data.*\n\n${responseText}`;
      }
      
      // Transform the response to match expected format
      return {
        response: responseText,
        sessionId: sessionId || `web-${Date.now()}`,
        trace: enableTrace ? result : undefined
      };
    } catch (error) {
      console.error('❌ Mock API also failed:', error);
      throw error;
    }
  }

  /**
   * Stream responses from Bedrock Agent (for future implementation)
   * @param {string} text - User input text
   * @param {string} sessionId - Session ID
   * @param {Function} onChunk - Callback for each response chunk
   */
  async streamAgent(text, sessionId, onChunk) {
    // TODO: Implement streaming when needed
    // For now, use regular invoke and call onChunk with full response
    try {
      const result = await this.invokeAgent(text, sessionId);
      onChunk(result.response);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    return !!this.apiUrl;
  }

  /**
   * Format the API response into readable text
   */
  formatResponse(result) {
    try {
      // Handle idea validation responses
      if (result.data && result.data.result && result.data.result.ideaValidation) {
        const validation = result.data.result.ideaValidation;
        return `# Business Idea Analysis

**Concept:** ${validation.concept}

**Overall Score:** ${validation.overall_score}

**Assessment:**
- Market Viability: ${validation.assessment.market_viability.score}/10 - ${validation.assessment.market_viability.assessment}
- Technical Feasibility: ${validation.assessment.technical_feasibility.score}/10 - ${validation.assessment.technical_feasibility.assessment}
- Business Value: ${validation.assessment.business_value.score}/10 - ${validation.assessment.business_value.assessment}

**Key Strengths:**
${validation.key_strengths.map(strength => `- ${strength}`).join('\n')}

**Areas for Improvement:**
${validation.areas_for_improvement.map(area => `- ${area}`).join('\n')}

**Decision:** ${validation.decision}

**Next Steps:**
${validation.next_steps.map(step => `- ${step}`).join('\n')}`;
      }
      
      // Handle business case responses
      if (result.data && result.data.result && result.data.result.businessCase) {
        const businessCase = result.data.result.businessCase;
        return `# 💼 Business Case Analysis

## Executive Summary
${businessCase.summary || 'Business case analysis completed'}

## 💰 Financial Projections
- **Development Cost:** $${businessCase.financialProjections?.development_cost?.toLocaleString() || 'TBD'}
- **Operational Cost:** $${businessCase.financialProjections?.operational_cost?.toLocaleString() || 'TBD'}
- **Expected Revenue:** $${businessCase.financialProjections?.expected_revenue?.toLocaleString() || 'TBD'}
- **Time to Market:** ${businessCase.financialProjections?.time_to_market || 'TBD'} months
- **ROI:** ${businessCase.financialProjections?.roi || 'TBD'}
- **Payback Period:** ${businessCase.financialProjections?.payback_period || 'TBD'}
- **NPV:** ${businessCase.financialProjections?.npv || 'TBD'}

## ⚠️ Risk Assessment
- **Market Risk:** ${businessCase.riskAssessment?.market_risk || 'TBD'}
- **Technical Risk:** ${businessCase.riskAssessment?.technical_risk || 'TBD'}
- **Financial Risk:** ${businessCase.riskAssessment?.financial_risk || 'TBD'}

## 🎯 Recommendation
**${businessCase.recommendation || 'Analysis complete'}**`;
      }
      
      // Handle competitor analysis responses
      if (result.data && result.data.result && result.data.result.competitorAnalysis) {
        const analysis = result.data.result.competitorAnalysis;
        return `# 🏆 Competitive Landscape Analysis

**Market Segment:** ${analysis.market_segment}

## 🥇 Market Leaders
${analysis.competitive_positioning?.market_leaders?.map(leader => `
**${leader.type}**
- Position: ${leader.position}
- Strengths: ${leader.strengths.join(', ')}
- Weaknesses: ${leader.weaknesses.join(', ')}
`).join('\n') || 'Analysis in progress...'}

## 🚀 Emerging Competitors
${analysis.competitive_positioning?.emerging_competitors?.map(competitor => `
**${competitor.type}**
- Position: ${competitor.position}
- Strengths: ${competitor.strengths.join(', ')}
- Weaknesses: ${competitor.weaknesses.join(', ')}
`).join('\n') || 'Analysis in progress...'}

## 🎯 Market Opportunities
${analysis.market_opportunities?.map(opp => `- ${opp}`).join('\n') || 'Identifying opportunities...'}

## 💡 Strategic Recommendations
${analysis.strategic_recommendations?.map(rec => `- ${rec}`).join('\n') || 'Developing recommendations...'}`;
      }
      
      // Handle interview preparation responses
      if (result.data && result.data.result && result.data.result.interviewPreparation) {
        const prep = result.data.result.interviewPreparation;
        return `# 🎯 PM Interview Preparation Plan

**Session ID:** ${prep.sessionId}
**Target Role:** ${prep.roleLevel} at ${prep.targetCompany}
**Timeline:** ${prep.preparationTimeline}

## 📅 Your Preparation Schedule

**Overall Plan:**
- Duration: ${prep.preparationPlan.overall.duration}
- Sessions per week: ${prep.preparationPlan.overall.sessionsPerWeek}
- Daily commitment: ${prep.preparationPlan.overall.dailyTimeCommitment}

## 📚 Weekly Breakdown

${prep.preparationPlan.weeklySchedule.map((week, index) => `
**Week ${index + 1}: ${week.focus}**
${week.activities.map(activity => `- ${activity}`).join('\n')}
`).join('\n')}

## 🎯 Focus Areas
${prep.preparationPlan.focusAreas.map(area => `- ${area}`).join('\n')}

## ⚠️ Areas to Strengthen
${prep.preparationPlan.weakAreas.map(area => `- ${area}`).join('\n')}

## 📖 Recommended Resources
${prep.preparationPlan.recommendedResources.map(resource => `- ${resource}`).join('\n')}

## 🏆 Success Metrics
${prep.successMetrics.map(metric => `- ${metric}`).join('\n')}

## 🚀 Next Steps
${prep.nextSteps.map(step => `- ${step}`).join('\n')}

**Start Date:** ${new Date(prep.sessionStartDate).toLocaleDateString()}
**Target Completion:** ${new Date(prep.estimatedCompletionDate).toLocaleDateString()}

Ready to begin your PM interview preparation journey! What would you like to focus on first?`;
      }
      
      // Handle string responses
      if (result.data && typeof result.data === 'string') {
        return result.data;
      }
      
      if (result.result && typeof result.result === 'string') {
        return result.result;
      }
      
      if (typeof result === 'string') {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error formatting response:', error);
      return null;
    }
  }

  /**
   * Switch between Claude models
   */
  switchModel(modelName) {
    const validModels = ['haiku', 'sonnet-v2'];
    if (!validModels.includes(modelName)) {
      throw new Error(`Invalid model: ${modelName}. Valid options: ${validModels.join(', ')}`);
    }
    
    const oldModel = this.currentModel;
    this.currentModel = modelName;
    
    console.log(`🔄 Switched from Claude 3.5 ${oldModel.toUpperCase()} to Claude 3.5 ${modelName.toUpperCase()}`);
    
    if (modelName === 'sonnet-v2') {
      console.warn('⚠️ Claude 3.5 Sonnet v2 has very strict rate limits (1 req/min). Consider using Haiku for better performance.');
    } else {
      console.log('✅ Claude 3.5 Haiku has much better rate limits (10 req/min)!');
    }
    
    return this.currentModel;
  }

  /**
   * Enable/disable cross-region inference
   */
  setCrossRegion(enabled) {
    this.enableCrossRegion = enabled;
    console.log(`🌍 Cross-region inference: ${enabled ? 'ENABLED (2x rate limit)' : 'DISABLED'}`);
    return this.enableCrossRegion;
  }

  /**
   * Enable/disable direct model calls vs agent calls
   */
  setDirectModel(enabled) {
    this.useDirectModel = enabled;
    console.log(`⚡ Direct model calls: ${enabled ? 'ENABLED (better control)' : 'DISABLED (using agents)'}`);
    return this.useDirectModel;
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      currentModel: this.currentModel,
      enableCrossRegion: this.enableCrossRegion,
      useDirectModel: this.useDirectModel,
      rateLimits: this.getRateLimits()
    };
  }

  /**
   * Get rate limits for current configuration
   */
  getRateLimits() {
    const limits = {
      'haiku': { base: 10, crossRegion: 20 },
      'sonnet-v2': { base: 1, crossRegion: 2 }
    };
    
    const modelLimits = limits[this.currentModel];
    const currentLimit = this.enableCrossRegion ? modelLimits.crossRegion : modelLimits.base;
    
    return {
      model: this.currentModel,
      requestsPerMinute: currentLimit,
      secondsBetweenRequests: Math.ceil(60 / currentLimit),
      crossRegionEnabled: this.enableCrossRegion
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      apiUrl: this.apiUrl,
      environment: import.meta.env.VITE_ENVIRONMENT || 'dev',
      model: this.getConfiguration(),
      rateLimits: this.getRateLimits()
    };
  }
}

// Export singleton instance
export const bedrockAgentService = new BedrockAgentService();
export default bedrockAgentService;