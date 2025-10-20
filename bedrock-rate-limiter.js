/**
 * Bedrock Rate Limiter with Claude 3.5 Haiku Support
 * Implements strict rate limiting and cross-region inference
 */

class BedrockRateLimiter {
  constructor() {
    // Rate limiting state
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.isProcessing = false;
    
    // Model configurations with their limits
    this.modelConfigs = {
      'claude-3-5-sonnet-v2': {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        requestsPerMinute: 1,
        tokensPerMinute: 400000,
        crossRegionRequestsPerMinute: 2,
        crossRegionTokensPerMinute: 800000
      },
      'claude-3-5-haiku': {
        modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        requestsPerMinute: 10,
        tokensPerMinute: 2000000,
        crossRegionRequestsPerMinute: 20,
        crossRegionTokensPerMinute: 4000000
      }
    };
    
    // Default to Claude 3.5 Haiku for better rate limits
    this.currentModel = 'claude-3-5-haiku';
    this.enableCrossRegion = true;
    
    console.log('🚀 Bedrock Rate Limiter initialized');
    console.log(`📊 Current model: ${this.currentModel}`);
    console.log(`🌍 Cross-region enabled: ${this.enableCrossRegion}`);
    this.logCurrentLimits();
  }
  
  /**
   * Get current rate limits based on model and cross-region settings
   */
  getCurrentLimits() {
    const config = this.modelConfigs[this.currentModel];
    if (!config) {
      throw new Error(`Unknown model: ${this.currentModel}`);
    }
    
    return {
      requestsPerMinute: this.enableCrossRegion ? 
        config.crossRegionRequestsPerMinute : config.requestsPerMinute,
      tokensPerMinute: this.enableCrossRegion ? 
        config.crossRegionTokensPerMinute : config.tokensPerMinute,
      minIntervalMs: this.enableCrossRegion ? 
        (60000 / config.crossRegionRequestsPerMinute) : (60000 / config.requestsPerMinute)
    };
  }
  
  /**
   * Log current rate limits
   */
  logCurrentLimits() {
    const limits = this.getCurrentLimits();
    console.log(`📈 Rate Limits:`);
    console.log(`  • Requests/minute: ${limits.requestsPerMinute}`);
    console.log(`  • Tokens/minute: ${limits.tokensPerMinute.toLocaleString()}`);
    console.log(`  • Min interval: ${Math.ceil(limits.minIntervalMs / 1000)}s between requests`);
  }
  
  /**
   * Switch to a different model
   */
  switchModel(modelName) {
    if (!this.modelConfigs[modelName]) {
      throw new Error(`Unknown model: ${modelName}. Available: ${Object.keys(this.modelConfigs).join(', ')}`);
    }
    
    const oldModel = this.currentModel;
    this.currentModel = modelName;
    
    console.log(`🔄 Switched from ${oldModel} to ${modelName}`);
    this.logCurrentLimits();
    
    return this.modelConfigs[modelName].modelId;
  }
  
  /**
   * Enable or disable cross-region inference
   */
  setCrossRegion(enabled) {
    this.enableCrossRegion = enabled;
    console.log(`🌍 Cross-region inference: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    this.logCurrentLimits();
  }
  
  /**
   * Calculate time to wait before next request
   */
  getWaitTime() {
    const limits = this.getCurrentLimits();
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const requiredWait = limits.minIntervalMs;
    
    return Math.max(0, requiredWait - timeSinceLastRequest);
  }
  
  /**
   * Wait for rate limit compliance
   */
  async waitForRateLimit() {
    const waitTime = this.getWaitTime();
    
    if (waitTime > 0) {
      console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime / 1000)}s before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Queue a request with rate limiting
   */
  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }
  
  /**
   * Process the request queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      try {
        // Wait for rate limit compliance
        await this.waitForRateLimit();
        
        // Execute the request
        console.log(`🚀 Executing request with ${this.currentModel}`);
        const result = await requestFn();
        resolve(result);
        
      } catch (error) {
        console.error(`❌ Request failed:`, error.message);
        
        // Handle throttling errors with exponential backoff
        if (error.name === 'ThrottlingException' || error.message.includes('rate limit')) {
          console.log(`🔄 Throttling detected, implementing exponential backoff`);
          const backoffTime = Math.min(60000, 5000 * Math.pow(2, Math.random()));
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        reject(error);
      }
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Get current model ID for Bedrock calls
   */
  getCurrentModelId() {
    return this.modelConfigs[this.currentModel].modelId;
  }
  
  /**
   * Get inference configuration for cross-region support
   */
  getInferenceConfig() {
    const config = {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9
    };
    
    if (this.enableCrossRegion) {
      config.crossRegionInferenceEnabled = true;
    }
    
    return config;
  }
  
  /**
   * Get current status
   */
  getStatus() {
    const limits = this.getCurrentLimits();
    const waitTime = this.getWaitTime();
    
    return {
      currentModel: this.currentModel,
      modelId: this.getCurrentModelId(),
      crossRegionEnabled: this.enableCrossRegion,
      limits,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      nextRequestIn: Math.ceil(waitTime / 1000),
      lastRequestTime: new Date(this.lastRequestTime).toISOString()
    };
  }
}

// Export singleton instance
const rateLimiter = new BedrockRateLimiter();

module.exports = {
  BedrockRateLimiter,
  rateLimiter
};