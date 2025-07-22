import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, RefreshCw, Sparkles, Zap, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import GuestMode from '@/components/GuestMode';
import ModelSelector from '@/components/ModelSelector';
import { ChatService, type ChatMessage as ServiceChatMessage } from '@/services/chatService';
import { AIService, AIProvider } from '@/services/aiService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
  isError?: boolean;
  canRetry?: boolean;
  provider?: AIProvider;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, initializing } = useAuth();
  const {
    createConversation,
    createConversationWithMessage,
    getCurrentConversationId,
    setCurrentConversationId,
    conversations
  } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ServiceChatMessage[]>([]);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showGuestMode, setShowGuestMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIService.getDefaultProvider());

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping, scrollToBottom]);

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    AIService.setDefaultProvider(provider);
    const capabilityName = provider === 'openai' ? 'Enhanced Mode' : 'Lightning Mode';
    toast({
      title: "AI Capability Changed",
      description: `Switched to ${capabilityName} for optimized performance`
    });
  };

  useEffect(() => {
    if (user && !initializing && conversations.length > 0 && !isRestoringState && !currentChatId) {
      const savedConversationId = getCurrentConversationId();
      if (savedConversationId && conversations.find(conv => conv.id === savedConversationId)) {
        console.log('Restoring conversation state:', savedConversationId);
        setIsRestoringState(true);
        handleChatSelect(savedConversationId).finally(() => {
          setIsRestoringState(false);
        });
      } else if (conversations.length > 0) {
        const mostRecent = conversations[0];
        console.log('Selecting most recent conversation:', mostRecent.id);
        setIsRestoringState(true);
        handleChatSelect(mostRecent.id).finally(() => {
          setIsRestoringState(false);
        });
      }
    }
  }, [user, initializing, conversations, currentChatId, isRestoringState]);

  const createNewConversation = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start chatting.",
        variant: "destructive"
      });
      return;
    }
    try {
      const conversation = await createConversation();
      if (conversation) {
        setCurrentChatId(conversation.id);
        setCurrentConversationId(conversation.id);
        setMessages([]);
        setConversationHistory([]);
        console.log('Created new conversation:', conversation.id);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendMessageToAI = async (content: string, isRetry: boolean = false) => {
    if (!user || !currentChatId || isSendingMessage) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to send messages.",
          variant: "destructive"
        });
      }
      return;
    }
    setIsSendingMessage(true);
    setIsTyping(true);
    try {
      if (!isRetry) {
        await ChatService.saveMessage(currentChatId, 'user', content);
      }

      const chatMessages: ServiceChatMessage[] = [...conversationHistory, {
        role: 'user',
        content
      }];
      console.log('Sending to Hobnob AI:', {
        messageCount: chatMessages.length,
        currentChatId,
        isRetry,
        provider: selectedProvider
      });

      const response = await AIService.sendMessage(chatMessages, {
        conversationId: currentChatId,
        userId: user.id,
        provider: selectedProvider
      });

      await ChatService.saveMessage(currentChatId, 'assistant', response.message);

      if (conversationHistory.length === 0 && !isRetry) {
        const title = await ChatService.generateTitle([{
          role: 'user',
          content
        }]);
        await ChatService.updateConversationTitle(currentChatId, title);
        console.log('Updated conversation title to:', title);
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
        provider: response.provider
      };
      setMessages(prev => {
        if (isRetry) {
          return [...prev.slice(0, -1), aiMessage];
        }
        return [...prev, aiMessage];
      });

      setConversationHistory(prev => {
        if (isRetry) {
          return [...prev, {
            role: 'assistant',
            content: response.message
          }];
        }
        return [...prev, {
          role: 'user',
          content
        }, {
          role: 'assistant',
          content: response.message
        }];
      });
      console.log('Hobnob AI response received successfully:', {
        length: response.message.length,
        usage: response.usage,
        provider: response.provider
      });
      if (isRetry) {
        const capabilityName = response.provider === 'openai' ? 'Enhanced Mode' : 'Lightning Mode';
        toast({
          title: "Success!",
          description: `Message sent successfully using ${capabilityName}.`
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = "I apologize, but I encountered an error. Please try again.";
      let canRetry = true;
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = "I'm receiving too many requests right now. Please wait a moment and try again.";
        } else if (error.message.includes('quota exceeded') || error.message.includes('402')) {
          errorMessage = "The AI service quota has been exceeded. Please check your API billing or try again later.";
          canRetry = false;
        } else if (error.message.includes('authentication') || error.message.includes('401')) {
          errorMessage = "There's an authentication issue with the AI service. Please contact support.";
          canRetry = false;
        } else if (error.message.includes('temporarily unavailable') || error.message.includes('503')) {
          errorMessage = "The AI service is temporarily unavailable. Please try again in a few minutes.";
        } else {
          errorMessage = `I encountered an error: ${error.message}. Please try again.`;
        }
      }
      const errorMessage_obj: Message = {
        id: `error-${Date.now()}`,
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date(),
        isError: true,
        canRetry: canRetry
      };
      setMessages(prev => {
        if (isRetry) {
          return [...prev.slice(0, -1), errorMessage_obj];
        }
        return [...prev, errorMessage_obj];
      });
      toast({
        title: "Error",
        description: canRetry ? "Failed to get AI response. You can try again." : "Service unavailable. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
      setIsSendingMessage(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (isSendingMessage) return;

    if (!currentChatId) {
      const conversation = await createConversationWithMessage(content);
      if (conversation) {
        setCurrentChatId(conversation.id);
        setCurrentConversationId(conversation.id);

        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date(),
          attachments
        };
        setMessages([userMessage]);
        setLastUserMessage(content);

        await sendMessageToAI(content);
      }
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
      attachments
    };
    setMessages(prev => [...prev, userMessage]);
    setLastUserMessage(content);
    await sendMessageToAI(content);
  };

  const handleRetryMessage = async () => {
    if (lastUserMessage && !isSendingMessage) {
      await sendMessageToAI(lastUserMessage, true);
    }
  };

  const handleNewChat = () => {
    createNewConversation();
    setSidebarOpen(false);
  };

  const handleChatSelect = async (chatId: string) => {
    if (chatId === currentChatId) return;

    try {
      setCurrentChatId(chatId);
      setCurrentConversationId(chatId);

      const dbMessages = await ChatService.getConversationMessages(chatId);

      const uiMessages: Message[] = dbMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at)
      }));
      setMessages(uiMessages);

      const history: ServiceChatMessage[] = dbMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      setConversationHistory(history);
      setSidebarOpen(false);
      console.log('Loaded conversation:', {
        chatId,
        messageCount: uiMessages.length
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation.",
        variant: "destructive"
      });
    }
  };

  if (initializing) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Initializing Hobnob AI</p>
            <p className="text-muted-foreground text-sm">Setting up your intelligent assistant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showGuestMode && !user) {
    return <GuestMode />;
  }

  if (!user && !authLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_hsl(var(--primary))_0%,_transparent_50%)] opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--purple-500))_0%,_transparent_50%)] opacity-10"></div>
        
        <div className="relative z-10 text-center space-y-8 max-w-lg p-8 mx-4">
          <div className="space-y-4">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl mx-auto">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-3xl blur-xl"></div>
            </div>
            <h1 className="text-4xl font-bold">
              <span className="text-gradient">Hobnob AI</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed text-balance">
              Your intelligent AI assistant with adaptive capabilities. 
              Experience the future of conversational AI.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="glass-card p-4 text-left">
              <Zap className="h-5 w-5 text-primary mb-2" />
              <div className="font-medium">Multiple AI Modes</div>
              <div className="text-muted-foreground text-xs">Enhanced & Lightning capabilities</div>
            </div>
            <div className="glass-card p-4 text-left">
              <Bot className="h-5 w-5 text-primary mb-2" />
              <div className="font-medium">Advanced Features</div>
              <div className="text-muted-foreground text-xs">File uploads & voice input</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full btn-primary py-4 text-base font-medium"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border/50"></div>
              <span className="text-sm text-muted-foreground font-medium">or</span>
              <div className="flex-1 border-t border-border/50"></div>
            </div>
            
            <Button 
              onClick={() => setShowGuestMode(true)} 
              variant="outline" 
              className="w-full btn-secondary py-4 text-base font-medium"
              size="lg"
            >
              Continue as Guest
            </Button>
            
            <p className="text-xs text-muted-foreground/70">
              Guest mode: Limited features, no conversation history or file uploads.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        currentChatId={currentChatId || ''} 
        onChatSelect={handleChatSelect} 
        onNewChat={handleNewChat} 
      />

      <div className="flex-1 flex flex-col lg:ml-0">
        <div className="glass-card border-b border-border/50 backdrop-blur-xl">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(true)} 
                  className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl p-3"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h1 className="text-xl font-bold">
                      <span className="text-gradient">Hobnob AI</span>
                      {user && <span className="text-sm font-normal text-muted-foreground ml-2">• {user.email}</span>}
                    </h1>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/tools')} 
                    className="text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl px-4 py-2"
                  >
                    Tools Dashboard
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ModelSelector 
                  selectedProvider={selectedProvider} 
                  onProviderChange={handleProviderChange} 
                  disabled={isTyping || isSendingMessage} 
                  compact 
                />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pb-32">
          <div className="space-y-0">
            {messages.length === 0 && !isTyping && !isRestoringState && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-6 max-w-md">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl mx-auto">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gradient">Start a conversation</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Ask me anything! I'm Hobnob AI, your intelligent assistant ready to help with any task.
                    </p>
                  </div>
                  <ModelSelector 
                    selectedProvider={selectedProvider} 
                    onProviderChange={handleProviderChange} 
                    disabled={isTyping || isSendingMessage} 
                  />
                </div>
              </div>
            )}
            
            {isRestoringState && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary mx-auto"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
                  </div>
                  <p className="text-muted-foreground font-medium">Restoring conversation...</p>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={message.id} className="group">
                <ChatMessage 
                  message={message} 
                  ref={index === messages.length - 1 ? lastMessageRef : null} 
                />
                {message.isError && message.canRetry && index === messages.length - 1 && (
                  <div className="flex justify-center py-6">
                    <Button 
                      onClick={handleRetryMessage} 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 btn-secondary hover:scale-105 transition-transform" 
                      disabled={isTyping || isSendingMessage}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div ref={lastMessageRef}>
                <TypingIndicator />
              </div>
            )}
          </div>
        </div>

        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isTyping || !user || isRestoringState || isSendingMessage} 
        />
      </div>
    </div>
  );
};

export default Index;
