// Bedrock Agent Service for React Chat Integration
import { authService } from './auth';

class BedrockAgentService {
  constructor() {
    // Get API Gateway URL from environment
    this.apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
    if (!this.apiUrl) {
      console.warn('VITE_API_GATEWAY_URL not set. Please deploy the Lambda function first.');
    }
  }

  /**
   * Get authenticated JWT token from Cognito
   */
  async getAuthToken() {
    try {
      const token = await authService.getIdToken();
      if (!token) {
        throw new Error('No ID token available');
      }
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Call Bedrock Agent with user input
   * @param {string} text - User input text
   * @param {string} sessionId - Optional session ID for conversation continuity
   * @param {boolean} enableTrace - Enable trace for debugging
   * @returns {Promise<Object>} Agent response
   */
  async invokeAgent(text, sessionId = null, enableTrace = false) {
    if (!this.apiUrl) {
      throw new Error('API Gateway URL not configured. Please set VITE_API_GATEWAY_URL');
    }

    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.apiUrl}/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          sessionId: sessionId || `web-${Date.now()}`,
          enableTrace
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Bedrock Agent invocation failed:', error);
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
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      apiUrl: this.apiUrl,
      environment: import.meta.env.VITE_ENVIRONMENT || 'dev'
    };
  }
}

// Export singleton instance
export const bedrockAgentService = new BedrockAgentService();
export default bedrockAgentService;