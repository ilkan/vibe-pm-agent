// React Hook for Bedrock Agent Chat Integration
import { useState, useCallback, useRef } from 'react';
import { bedrockAgentService } from '../services/bedrockAgent';

export const useBedrockChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const sessionIdRef = useRef(null);

  // Initialize session ID
  const initializeSession = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(sessionIdRef.current);
    }
    return sessionIdRef.current;
  }, []);

  // Add message to chat
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...message
    }]);
  }, []);

  // Send message to Bedrock Agent
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const currentSessionId = initializeSession();
    
    // Add user message
    addMessage({
      type: 'user',
      content: text,
      sender: 'user'
    });

    setIsLoading(true);
    setError(null);

    try {
      // Call Bedrock Agent
      const response = await bedrockAgentService.invokeAgent(
        text, 
        currentSessionId, 
        false // Enable trace for debugging if needed
      );

      // Add agent response
      addMessage({
        type: 'agent',
        content: response.response,
        sender: 'agent',
        metadata: {
          sessionId: response.sessionId,
          agentId: response.agentId,
          timestamp: response.timestamp
        }
      });

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message);
      
      // Add error message to chat
      addMessage({
        type: 'error',
        content: `Sorry, I encountered an error: ${err.message}`,
        sender: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, initializeSession]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionIdRef.current = null;
    setSessionId(null);
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.type === 'user');
    
    if (lastUserMessage) {
      // Remove messages after the last user message
      const lastUserIndex = messages.findIndex(msg => msg.id === lastUserMessage.id);
      setMessages(prev => prev.slice(0, lastUserIndex + 1));
      
      // Resend the message
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  // Get service status
  const getServiceStatus = useCallback(() => {
    return bedrockAgentService.getStatus();
  }, []);

  return {
    // State
    messages,
    isLoading,
    error,
    sessionId,
    
    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,
    
    // Utils
    getServiceStatus,
    isConfigured: bedrockAgentService.isConfigured()
  };
};