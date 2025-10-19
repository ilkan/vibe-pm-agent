import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ToolRunCard } from './components/ToolRunCard';
import { Composer } from './components/Composer';
import { EmptyState } from './components/EmptyState';
import { RightRail } from './components/RightRail';
import { CitationList } from './components/CitationList';
import { ScrollArea } from './components/ui/scroll-area';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from './components/ui/button';
import { useAuth, type User } from './services/auth';
import { bedrockAgentService } from './services/bedrockAgent';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  citations?: any[];
}

interface ToolExecution {
  id: string;
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  parameters?: Record<string, any>;
  logs?: string[];
  results?: any;
}

const MOCK_TOOLS = [
  {
    id: 'analyze',
    name: 'Analyze Opportunity',
    description: 'Deep-dive business opportunity analysis with market sizing',
    requiredInputs: ['idea', 'market']
  },
  {
    id: 'prfaq',
    name: 'Generate PR-FAQ',
    description: 'Create a press release FAQ document',
    requiredInputs: ['product', 'audience']
  },
  {
    id: 'onepager',
    name: 'Create One-Pager',
    description: 'Board-ready one-page summary with citations',
    requiredInputs: ['topic']
  },
  {
    id: 'interview',
    name: 'Interview Coach',
    description: 'Mock PM interview with CIRCLES framework',
    requiredInputs: ['question']
  }
];

const MOCK_CITATIONS = [
  {
    id: 1,
    source: 'Gartner Research',
    title: 'Market Analysis: AI-Powered Development Tools 2024',
    date: 'Oct 2024',
    credibility: 'high' as const,
    url: 'https://gartner.com',
    excerpt: 'The AI code review market is projected to grow at 45% CAGR...'
  },
  {
    id: 2,
    source: 'Stack Overflow Survey',
    title: 'Developer Survey Results 2024',
    date: 'Sept 2024',
    credibility: 'high' as const,
    url: 'https://stackoverflow.com',
    excerpt: '68% of developers report using AI tools in their workflow...'
  },
  {
    id: 3,
    source: 'TechCrunch',
    title: 'Code Review Automation Raises $50M',
    date: 'Aug 2024',
    credibility: 'medium' as const,
    url: 'https://techcrunch.com',
    excerpt: 'Investors betting big on automated code quality tools...'
  }
];

export default function App() {
  const { isAuthenticated, user, loading, signOut } = useAuth();
  const [authUser, setAuthUser] = useState<User | null>(null);
  
  const [chats, setChats] = useState([
    { 
      id: '1', 
      title: 'AI Code Review Analysis', 
      timestamp: '2 hours ago', 
      isPinned: true,
      hasTools: true 
    },
    { 
      id: '2', 
      title: 'Mobile App PR-FAQ', 
      timestamp: 'Yesterday', 
      hasTools: true 
    },
    { 
      id: '3', 
      title: 'Market Sizing Questions', 
      timestamp: '2 days ago' 
    }
  ]);

  const [currentChatId, setCurrentChatId] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [toolRuns, setToolRuns] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleLogin = (user: User) => {
    setAuthUser(user);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setAuthUser(null);
      setMessages([]);
      setToolExecutions([]);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Update auth user when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setAuthUser(user);
    }
  }, [isAuthenticated, user]);

  // Check Bedrock Agent service status on load
  useEffect(() => {
    if (isAuthenticated) {
      const status = bedrockAgentService.getStatus();
      console.log('Bedrock Agent Service Status:', status);
      
      if (!status.configured) {
        toast.info('Deploy the Lambda function to enable Bedrock Agent integration');
      }
    }
  }, [isAuthenticated]);

  // Simulate initial conversation
  useEffect(() => {
    if (isAuthenticated && currentChatId === '1' && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'user',
          content: 'Analyze business opportunity for AI code review assistant',
          timestamp: '2:34 PM'
        }
      ]);
    }
  }, [currentChatId, isAuthenticated]);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    setChats([
      {
        id: newId,
        title: 'New Chat',
        timestamp: 'Just now'
      },
      ...chats
    ]);
    setCurrentChatId(newId);
    setMessages([]);
    setToolExecutions([]);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    // In a real app, load messages for this chat
    if (id === '1') {
      setMessages([
        {
          id: '1',
          role: 'user',
          content: 'Analyze business opportunity for AI code review assistant',
          timestamp: '2:34 PM'
        }
      ]);
    } else {
      setMessages([]);
    }
    setToolExecutions([]);
  };

  const handleDeleteChat = (id: string) => {
    setChats(chats.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(chats[0]?.id);
    }
  };

  const handlePinChat = (id: string) => {
    setChats(chats.map(c => 
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    ));
  };

  const handleSend = async (message: string, files?: File[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);

    // Update chat title if it's a new chat
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat?.title === 'New Chat') {
      setChats(chats.map(c => 
        c.id === currentChatId 
          ? { ...c, title: message.slice(0, 50) + (message.length > 50 ? '...' : '') }
          : c
      ));
    }

    // Check if Bedrock Agent service is configured
    if (!bedrockAgentService.isConfigured()) {
      toast.error('Bedrock Agent not configured. Please deploy the Lambda function first.');
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: 'Sorry, the Bedrock Agent service is not configured yet. Please deploy the Lambda function and set VITE_API_GATEWAY_URL in your environment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsStreaming(true);

    try {
      // Initialize session ID if not exists
      const currentSessionId = sessionId || `chat-${currentChatId}-${Date.now()}`;
      if (!sessionId) {
        setSessionId(currentSessionId);
      }

      // Call Bedrock Agent
      const response = await bedrockAgentService.invokeAgent(
        message, 
        currentSessionId, 
        false // Enable trace for debugging if needed
      );

      // Add agent response
      const agentMessage: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: response.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: [] // TODO: Extract citations from response if available
      };

      setMessages(prev => [...prev, agentMessage]);

      // Show success toast
      toast.success('Response received from Bedrock Agent');

    } catch (error) {
      console.error('Bedrock Agent error:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error(`Bedrock Agent error: ${error.message}`);
    } finally {
      setIsStreaming(false);
    }
  };

  const simulateToolRun = (toolName: string, parameters: Record<string, any>) => {
    const toolId = Date.now().toString();
    
    // Add to tool runs list
    setToolRuns(prev => [{
      id: toolId,
      toolName,
      status: 'queued',
      timestamp: 'Just now'
    }, ...prev]);

    // Create tool execution
    const execution: ToolExecution = {
      id: toolId,
      toolName,
      status: 'queued',
      parameters
    };

    setToolExecutions(prev => [...prev, execution]);

    // Simulate running
    setTimeout(() => {
      setToolExecutions(prev => prev.map(t => 
        t.id === toolId ? { ...t, status: 'running' as const, logs: ['Initializing analysis...', 'Fetching market data...'] } : t
      ));
      setToolRuns(prev => prev.map(r => r.id === toolId ? { ...r, status: 'running' } : r));
    }, 500);

    // Simulate completion
    setTimeout(() => {
      setToolExecutions(prev => prev.map(t => 
        t.id === toolId 
          ? { 
              ...t, 
              status: 'completed' as const,
              logs: [...(t.logs || []), 'Analysis complete', 'Generated 3 citations'],
              results: 'Analysis complete with 88% confidence. See citations for sources.'
            } 
          : t
      ));
      setToolRuns(prev => prev.map(r => r.id === toolId ? { ...r, status: 'completed' } : r));

      // Add AI response
      simulateResponse(true);

      // Show toast
      toast('Business Case v1 ready • 3 citations • 88% confidence', {
        description: 'Analysis completed successfully'
      });
    }, 3000);
  };

  const simulateResponse = (withCitations = false) => {
    setIsStreaming(true);
    
    const responseContent = withCitations 
      ? `Based on the analysis, the AI code review assistant represents a strong business opportunity. Here's the breakdown:

**Market Opportunity**
The developer tools market is growing at 45% CAGR, with significant adoption of AI-powered solutions. 68% of developers already use AI tools in their workflow.

**Key Findings**
- TAM: $2.4B and growing
- Competition: Moderate, with opportunity to differentiate
- Customer pain: Manual code review takes 20-30% of engineering time
- Willingness to pay: High for teams >10 developers

**Recommendation**
Proceed with MVP focused on integration with GitHub/GitLab and focus on reducing review time by 50%.`
      : `I'd be happy to help with that. Let me analyze the opportunity and gather the relevant information.`;

    setTimeout(() => {
      const response: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: withCitations ? MOCK_CITATIONS : undefined
      };

      setMessages(prev => [...prev, response]);
      setIsStreaming(false);
    }, 1500);
  };

  const handlePromptSelect = (prompt: string) => {
    handleSend(prompt);
  };

  const handleRunTool = (toolId: string) => {
    const tool = MOCK_TOOLS.find(t => t.id === toolId);
    if (tool) {
      toast(`Running ${tool.name}...`);
      simulateToolRun(tool.name, { auto: true });
    }
  };

  const currentChat = chats.find(c => c.id === currentChatId);
  const hasMessages = messages.length > 0 || toolExecutions.length > 0;

  // Collect all citations from messages
  const allCitations = messages
    .filter(m => m.citations)
    .flatMap(m => m.citations || []);

  // Check if this is an OAuth callback (but we handle it in auth service now)
  const isCallback = false; // Disabled - handled in auth service

  // Show loading while initializing auth
  if (loading) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // Handle OAuth callback
  if (isCallback && !isAuthenticated) {
    return (
      <>
        <Toaster />
        <AuthCallback onAuthComplete={handleLogin} />
      </>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !authUser) {
    return (
      <>
        <Toaster />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Toaster />
      
      {/* Left Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          workspace="Vibe PM"
          chatTitle={currentChat?.title || 'New Chat'}
          model="Bedrock Agent • Nova Pro"
          latency="2.1s"
          status={bedrockAgentService.isConfigured() ? "online" : "offline"}
          userEmail={authUser.email}
          onShare={() => toast('Share link copied to clipboard')}
          onExport={() => toast('Exporting conversation...')}
          onLogout={handleLogout}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {!hasMessages ? (
            <EmptyState onPromptSelect={handlePromptSelect} />
          ) : (
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto py-4" role="log" aria-label="Conversation">
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <ChatMessage
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                      isStreaming={isStreaming && index === messages.length - 1}
                    />
                    
                    {/* Show citations inline */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="px-4 pb-4">
                        <CitationList citations={message.citations} inline />
                      </div>
                    )}

                    {/* Show tool executions after user messages */}
                    {message.role === 'user' && (
                      <>
                        {toolExecutions
                          .filter((_, i) => i === messages.slice(0, index + 1).filter(m => m.role === 'user').length - 1)
                          .map(execution => (
                            <div key={execution.id} className="px-4">
                              <ToolRunCard
                                toolName={execution.toolName}
                                status={execution.status}
                                parameters={execution.parameters}
                                logs={execution.logs}
                                results={execution.results}
                                onRerun={() => toast('Rerunning tool...')}
                                onViewDetails={() => setRightRailOpen(true)}
                              />
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStreaming(false)}
                    >
                      Stop generating
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Composer */}
        <Composer
          onSend={handleSend}
          onStop={() => setIsStreaming(false)}
          onRegenerate={() => {
            if (messages.length > 0) {
              simulateResponse(true);
            }
          }}
          isStreaming={isStreaming}
        />
      </div>

      {/* Right Rail */}
      <RightRail
        tools={MOCK_TOOLS}
        runs={toolRuns}
        files={[]}
        citations={allCitations}
        onRunTool={handleRunTool}
        onClose={() => setRightRailOpen(false)}
        isOpen={rightRailOpen}
      />

      {/* Toggle Right Rail Button */}
      {!rightRailOpen && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRightRailOpen(true)}
          className="fixed right-4 top-20 z-50"
        >
          <PanelRightOpen className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
