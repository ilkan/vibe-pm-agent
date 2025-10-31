/**
 * Agent Communication Protocol
 * 
 * Comprehensive communication protocol for inter-agent messaging, context management,
 * and citation request/response handling with synchronous and asynchronous patterns.
 */

import {
  AgentMessage,
  AgentProtocol,
  MessageFormat,
  MessageMetadata,
  MessageType,
  Priority,
  ConversationContext,
  CitationContext,
  CitationResponse,
  AuthMethod
} from '../../interfaces/nvidia-nim-core';
import { 
  createMessageId, 
  createConversationId, 
  DEFAULT_AGENT_PROTOCOL 
} from '../../models/nvidia-nim';
import { NIMErrorHandler, NIMErrorCode } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Communication Protocol Interfaces
// ============================================================================

export interface CommunicationManager {
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(messageId: string): Promise<AgentMessage | null>;
  broadcastMessage(message: Omit<AgentMessage, 'to'>, recipients: string[]): Promise<void>;
  subscribeToMessages(agentId: string, callback: MessageCallback): void;
  unsubscribeFromMessages(agentId: string): void;
  getMessageHistory(conversationId: string, limit?: number): Promise<AgentMessage[]>;
  createConversation(participants: string[]): Promise<string>;
  joinConversation(conversationId: string, agentId: string): Promise<void>;
  leaveConversation(conversationId: string, agentId: string): Promise<void>;
}

export interface MessageCallback {
  (message: AgentMessage): Promise<void>;
}

export interface MessageQueue {
  pending: Map<string, QueuedMessage>;
  processing: Map<string, ProcessingMessage>;
  completed: Map<string, CompletedMessage>;
}

export interface QueuedMessage {
  message: AgentMessage;
  queuedAt: Date;
  retryCount: number;
  priority: Priority;
}

export interface ProcessingMessage {
  message: AgentMessage;
  startedAt: Date;
  timeout: NodeJS.Timeout;
}

export interface CompletedMessage {
  message: AgentMessage;
  completedAt: Date;
  status: 'delivered' | 'failed';
  error?: string;
}

export interface MessageRouter {
  routeMessage(message: AgentMessage): Promise<string>; // Returns route path
  registerRoute(pattern: string, handler: RouteHandler): void;
  unregisterRoute(pattern: string): void;
  getRoutes(): Map<string, RouteHandler>;
}

export interface RouteHandler {
  (message: AgentMessage): Promise<AgentMessage | null>;
}

export interface ContextManager {
  createContext(conversationId: string, participants: string[]): Promise<ConversationContext>;
  updateContext(conversationId: string, updates: Partial<ConversationContext>): Promise<void>;
  getContext(conversationId: string): Promise<ConversationContext | null>;
  deleteContext(conversationId: string): Promise<void>;
  cleanupExpiredContexts(): Promise<number>;
}

// ============================================================================
// Message Builder and Validator
// ============================================================================

/**
 * Message builder for creating well-formed agent messages
 */
export class AgentMessageBuilder {
  private message: Partial<AgentMessage>;

  constructor() {
    this.message = {
      timestamp: new Date(),
      messageType: 'task_request'
    };
  }

  setFrom(from: string): this {
    this.message.from = from;
    return this;
  }

  setTo(to: string): this {
    this.message.to = to;
    return this;
  }

  setContent(content: any): this {
    this.message.content = content;
    return this;
  }

  setConversationId(conversationId: string): this {
    this.message.conversationId = conversationId;
    return this;
  }

  setMessageType(messageType: MessageType): this {
    this.message.messageType = messageType;
    return this;
  }

  setMetadata(metadata: Record<string, any>): this {
    this.message.metadata = { ...this.message.metadata, ...metadata };
    return this;
  }

  setPriority(priority: Priority): this {
    if (!this.message.metadata) {
      this.message.metadata = {};
    }
    this.message.metadata.priority = priority;
    return this;
  }

  setTTL(ttlMs: number): this {
    if (!this.message.metadata) {
      this.message.metadata = {};
    }
    this.message.metadata.ttl = ttlMs;
    return this;
  }

  setCorrelationId(correlationId: string): this {
    if (!this.message.metadata) {
      this.message.metadata = {};
    }
    this.message.metadata.correlationId = correlationId;
    return this;
  }

  build(): AgentMessage {
    // Validate required fields
    if (!this.message.from || !this.message.to || !this.message.conversationId) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Message must have from, to, and conversationId'
      );
    }

    // Generate message ID if not set
    if (!this.message.metadata?.messageId) {
      if (!this.message.metadata) {
        this.message.metadata = {};
      }
      this.message.metadata.messageId = createMessageId();
    }

    return this.message as AgentMessage;
  }
}

/**
 * Message validator for protocol compliance
 */
export class MessageValidator {
  private protocol: AgentProtocol;

  constructor(protocol: AgentProtocol = DEFAULT_AGENT_PROTOCOL) {
    this.protocol = protocol;
  }

  /**
   * Validate message format and content
   */
  validateMessage(message: AgentMessage): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!message.from) errors.push('Missing required field: from');
    if (!message.to) errors.push('Missing required field: to');
    if (!message.conversationId) errors.push('Missing required field: conversationId');
    if (!message.messageType) errors.push('Missing required field: messageType');
    if (!message.timestamp) errors.push('Missing required field: timestamp');

    // Message type validation
    const validMessageTypes: MessageType[] = [
      'task_request', 'task_response', 'citation_request', 
      'citation_response', 'context_update', 'error_notification'
    ];
    if (message.messageType && !validMessageTypes.includes(message.messageType)) {
      errors.push(`Invalid message type: ${message.messageType}`);
    }

    // Metadata validation
    if (message.metadata) {
      if (message.metadata.ttl && message.metadata.ttl <= 0) {
        errors.push('TTL must be positive');
      }
      if (message.metadata.priority && !['low', 'medium', 'high', 'urgent'].includes(message.metadata.priority)) {
        errors.push(`Invalid priority: ${message.metadata.priority}`);
      }
    }

    // Content validation based on message type
    this.validateMessageContent(message, errors);

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate message content based on type
   */
  private validateMessageContent(message: AgentMessage, errors: string[]): void {
    switch (message.messageType) {
      case 'task_request':
        if (!message.content || typeof message.content !== 'object') {
          errors.push('Task request must have object content');
        } else if (!message.content.taskId || !message.content.taskType) {
          errors.push('Task request must have taskId and taskType');
        }
        break;

      case 'task_response':
        if (!message.content || typeof message.content !== 'object') {
          errors.push('Task response must have object content');
        } else if (!message.content.taskId || !message.content.status) {
          errors.push('Task response must have taskId and status');
        }
        break;

      case 'citation_request':
        if (!message.content || typeof message.content !== 'object') {
          errors.push('Citation request must have object content');
        } else if (!message.content.query) {
          errors.push('Citation request must have query');
        }
        break;

      case 'citation_response':
        if (!message.content || typeof message.content !== 'object') {
          errors.push('Citation response must have object content');
        } else if (!message.content.citations || !Array.isArray(message.content.citations)) {
          errors.push('Citation response must have citations array');
        }
        break;
    }
  }

  /**
   * Check if message has expired
   */
  isMessageExpired(message: AgentMessage): boolean {
    if (!message.metadata?.ttl) return false;
    
    const expiryTime = message.timestamp.getTime() + message.metadata.ttl;
    return Date.now() > expiryTime;
  }
}

// ============================================================================
// Communication Manager Implementation
// ============================================================================

/**
 * Core communication manager for agent messaging
 */
export class AgentCommunicationManager implements CommunicationManager {
  private protocol: AgentProtocol;
  private messageQueue: MessageQueue;
  private messageCallbacks: Map<string, MessageCallback>;
  private messageHistory: Map<string, AgentMessage[]>;
  private conversations: Map<string, ConversationContext>;
  private validator: MessageValidator;
  private router: MessageRouter;

  constructor(protocol: AgentProtocol = DEFAULT_AGENT_PROTOCOL) {
    this.protocol = protocol;
    this.validator = new MessageValidator(protocol);
    this.router = new SimpleMessageRouter();

    this.messageQueue = {
      pending: new Map(),
      processing: new Map(),
      completed: new Map()
    };

    this.messageCallbacks = new Map();
    this.messageHistory = new Map();
    this.conversations = new Map();

    // Setup default routes
    this.setupDefaultRoutes();

    console.log('Agent Communication Manager initialized', {
      version: protocol.version,
      authMethod: protocol.authenticationMethod,
      encryptionEnabled: protocol.encryptionEnabled
    });
  }

  // ============================================================================
  // Message Sending and Receiving
  // ============================================================================

  /**
   * Send message to another agent
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    try {
      // Validate message
      const validation = this.validator.validateMessage(message);
      if (!validation.valid) {
        throw NIMErrorHandler.createError(
          NIMErrorCode.INVALID_REQUEST,
          `Invalid message: ${validation.errors.join(', ')}`
        );
      }

      // Check if message has expired
      if (this.validator.isMessageExpired(message)) {
        throw NIMErrorHandler.createError(
          NIMErrorCode.TIMEOUT,
          'Message has expired'
        );
      }

      console.log(`Sending message: ${message.metadata?.messageId} from ${message.from} to ${message.to}`);

      // Add to message history
      this.addToMessageHistory(message);

      // Route message
      const routePath = await this.router.routeMessage(message);
      console.log(`Message routed via: ${routePath}`);

      // Queue for processing
      await this.queueMessage(message);

      // Process message
      await this.processMessage(message);

    } catch (error) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.MESSAGE_ROUTING_FAILED,
        `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
        { message }
      );
    }
  }

  /**
   * Receive message by ID
   */
  async receiveMessage(messageId: string): Promise<AgentMessage | null> {
    try {
      // Check completed messages first
      const completed = this.messageQueue.completed.get(messageId);
      if (completed && completed.status === 'delivered') {
        return completed.message;
      }

      // Check processing messages
      const processing = this.messageQueue.processing.get(messageId);
      if (processing) {
        return processing.message;
      }

      // Check pending messages
      const pending = this.messageQueue.pending.get(messageId);
      if (pending) {
        return pending.message;
      }

      return null;
    } catch (error) {
      console.error(`Failed to receive message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Broadcast message to multiple recipients
   */
  async broadcastMessage(message: Omit<AgentMessage, 'to'>, recipients: string[]): Promise<void> {
    const promises = recipients.map(async (recipient) => {
      const fullMessage: AgentMessage = {
        ...message,
        to: recipient,
        metadata: {
          ...message.metadata,
          messageId: createMessageId() // Each recipient gets unique message ID
        }
      };
      
      return this.sendMessage(fullMessage);
    });

    await Promise.all(promises);
    console.log(`Broadcast message sent to ${recipients.length} recipients`);
  }

  /**
   * Subscribe to messages for an agent
   */
  subscribeToMessages(agentId: string, callback: MessageCallback): void {
    this.messageCallbacks.set(agentId, callback);
    console.log(`Agent ${agentId} subscribed to messages`);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribeFromMessages(agentId: string): void {
    this.messageCallbacks.delete(agentId);
    console.log(`Agent ${agentId} unsubscribed from messages`);
  }

  // ============================================================================
  // Message History and Conversation Management
  // ============================================================================

  /**
   * Get message history for a conversation
   */
  async getMessageHistory(conversationId: string, limit: number = 100): Promise<AgentMessage[]> {
    const messages = this.messageHistory.get(conversationId) || [];
    return messages.slice(-limit); // Return last N messages
  }

  /**
   * Create new conversation
   */
  async createConversation(participants: string[]): Promise<string> {
    const conversationId = createConversationId();
    
    const context: ConversationContext = {
      conversationId,
      participants,
      messageHistory: [],
      sharedContext: {},
      lastActivity: new Date(),
      ttl: 3600000 // 1 hour default
    };

    this.conversations.set(conversationId, context);
    this.messageHistory.set(conversationId, []);

    console.log(`Conversation created: ${conversationId} with ${participants.length} participants`);
    return conversationId;
  }

  /**
   * Join existing conversation
   */
  async joinConversation(conversationId: string, agentId: string): Promise<void> {
    const context = this.conversations.get(conversationId);
    if (!context) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.CONTEXT_LOST,
        `Conversation not found: ${conversationId}`
      );
    }

    if (!context.participants.includes(agentId)) {
      context.participants.push(agentId);
      context.lastActivity = new Date();
      console.log(`Agent ${agentId} joined conversation ${conversationId}`);
    }
  }

  /**
   * Leave conversation
   */
  async leaveConversation(conversationId: string, agentId: string): Promise<void> {
    const context = this.conversations.get(conversationId);
    if (!context) return;

    context.participants = context.participants.filter(id => id !== agentId);
    context.lastActivity = new Date();
    
    console.log(`Agent ${agentId} left conversation ${conversationId}`);

    // Clean up empty conversations
    if (context.participants.length === 0) {
      this.conversations.delete(conversationId);
      this.messageHistory.delete(conversationId);
      console.log(`Empty conversation deleted: ${conversationId}`);
    }
  }

  // ============================================================================
  // Citation Request/Response Protocol
  // ============================================================================

  /**
   * Send citation request
   */
  async sendCitationRequest(
    fromAgent: string,
    query: string,
    context: CitationContext,
    conversationId?: string
  ): Promise<string> {
    const messageId = createMessageId();
    const convId = conversationId || await this.createConversation([fromAgent, 'CITATION001']);

    const message = new AgentMessageBuilder()
      .setFrom(fromAgent)
      .setTo('CITATION001') // Citation agent ID
      .setConversationId(convId)
      .setMessageType('citation_request')
      .setContent({ query, context, requestId: messageId })
      .setMetadata({ messageId })
      .build();

    await this.sendMessage(message);
    return messageId;
  }

  /**
   * Send citation response
   */
  async sendCitationResponse(
    toAgent: string,
    requestId: string,
    citations: CitationResponse,
    conversationId: string
  ): Promise<void> {
    const message = new AgentMessageBuilder()
      .setFrom('CITATION001')
      .setTo(toAgent)
      .setConversationId(conversationId)
      .setMessageType('citation_response')
      .setContent({ requestId, citations })
      .setCorrelationId(requestId)
      .build();

    await this.sendMessage(message);
  }

  // ============================================================================
  // Message Processing
  // ============================================================================

  /**
   * Queue message for processing
   */
  private async queueMessage(message: AgentMessage): Promise<void> {
    const messageId = message.metadata?.messageId || createMessageId();
    const priority = message.metadata?.priority || 'medium';

    this.messageQueue.pending.set(messageId, {
      message,
      queuedAt: new Date(),
      retryCount: 0,
      priority
    });
  }

  /**
   * Process queued message
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    const messageId = message.metadata?.messageId!;
    
    // Move to processing
    const queuedMessage = this.messageQueue.pending.get(messageId);
    if (!queuedMessage) return;

    this.messageQueue.pending.delete(messageId);
    
    const timeout = setTimeout(() => {
      this.handleMessageTimeout(messageId);
    }, 30000); // 30 second timeout

    this.messageQueue.processing.set(messageId, {
      message,
      startedAt: new Date(),
      timeout
    });

    try {
      // Deliver to recipient
      await this.deliverMessage(message);

      // Mark as completed
      clearTimeout(timeout);
      this.messageQueue.processing.delete(messageId);
      this.messageQueue.completed.set(messageId, {
        message,
        completedAt: new Date(),
        status: 'delivered'
      });

      console.log(`Message delivered: ${messageId}`);
    } catch (error) {
      // Mark as failed
      clearTimeout(timeout);
      this.messageQueue.processing.delete(messageId);
      this.messageQueue.completed.set(messageId, {
        message,
        completedAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });

      console.error(`Message delivery failed: ${messageId}`, error);
    }
  }

  /**
   * Deliver message to recipient
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    const callback = this.messageCallbacks.get(message.to);
    if (callback) {
      await callback(message);
    } else {
      console.warn(`No callback registered for agent: ${message.to}`);
    }
  }

  /**
   * Handle message timeout
   */
  private handleMessageTimeout(messageId: string): void {
    const processing = this.messageQueue.processing.get(messageId);
    if (processing) {
      this.messageQueue.processing.delete(messageId);
      this.messageQueue.completed.set(messageId, {
        message: processing.message,
        completedAt: new Date(),
        status: 'failed',
        error: 'Message delivery timeout'
      });
      
      console.warn(`Message timeout: ${messageId}`);
    }
  }

  /**
   * Add message to history
   */
  private addToMessageHistory(message: AgentMessage): void {
    const messages = this.messageHistory.get(message.conversationId) || [];
    messages.push(message);
    
    // Keep only last 1000 messages per conversation
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }
    
    this.messageHistory.set(message.conversationId, messages);
  }

  /**
   * Setup default message routes
   */
  private setupDefaultRoutes(): void {
    // Citation request routing
    this.router.registerRoute('citation_request', async (message) => {
      console.log(`Routing citation request from ${message.from}`);
      return message; // Pass through
    });

    // Task request routing
    this.router.registerRoute('task_request', async (message) => {
      console.log(`Routing task request from ${message.from} to ${message.to}`);
      return message; // Pass through
    });

    // Error notification routing
    this.router.registerRoute('error_notification', async (message) => {
      console.error(`Error notification from ${message.from}:`, message.content);
      return message; // Pass through
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get communication statistics
   */
  getStatistics(): {
    pendingMessages: number;
    processingMessages: number;
    completedMessages: number;
    activeConversations: number;
    subscribedAgents: number;
    messageHistory: number;
  } {
    const totalHistory = Array.from(this.messageHistory.values())
      .reduce((sum, messages) => sum + messages.length, 0);

    return {
      pendingMessages: this.messageQueue.pending.size,
      processingMessages: this.messageQueue.processing.size,
      completedMessages: this.messageQueue.completed.size,
      activeConversations: this.conversations.size,
      subscribedAgents: this.messageCallbacks.size,
      messageHistory: totalHistory
    };
  }

  /**
   * Cleanup expired messages and conversations
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    let cleanedMessages = 0;
    let cleanedConversations = 0;

    // Clean expired messages
    for (const [messageId, completed] of this.messageQueue.completed.entries()) {
      if (now - completed.completedAt.getTime() > 3600000) { // 1 hour
        this.messageQueue.completed.delete(messageId);
        cleanedMessages++;
      }
    }

    // Clean expired conversations
    for (const [conversationId, context] of this.conversations.entries()) {
      if (now - context.lastActivity.getTime() > context.ttl) {
        this.conversations.delete(conversationId);
        this.messageHistory.delete(conversationId);
        cleanedConversations++;
      }
    }

    console.log(`Cleanup completed: ${cleanedMessages} messages, ${cleanedConversations} conversations`);
  }
}

// ============================================================================
// Simple Message Router Implementation
// ============================================================================

/**
 * Simple message router for handling different message types
 */
export class SimpleMessageRouter implements MessageRouter {
  private routes: Map<string, RouteHandler> = new Map();

  async routeMessage(message: AgentMessage): Promise<string> {
    const handler = this.routes.get(message.messageType);
    if (handler) {
      await handler(message);
      return `${message.messageType}_handler`;
    }
    return 'default_route';
  }

  registerRoute(pattern: string, handler: RouteHandler): void {
    this.routes.set(pattern, handler);
    console.log(`Route registered: ${pattern}`);
  }

  unregisterRoute(pattern: string): void {
    this.routes.delete(pattern);
    console.log(`Route unregistered: ${pattern}`);
  }

  getRoutes(): Map<string, RouteHandler> {
    return new Map(this.routes);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create communication manager with default protocol
 */
export function createCommunicationManager(protocol?: AgentProtocol): CommunicationManager {
  return new AgentCommunicationManager(protocol);
}

/**
 * Create message builder
 */
export function createMessageBuilder(): AgentMessageBuilder {
  return new AgentMessageBuilder();
}

/**
 * Create message validator
 */
export function createMessageValidator(protocol?: AgentProtocol): MessageValidator {
  return new MessageValidator(protocol);
}