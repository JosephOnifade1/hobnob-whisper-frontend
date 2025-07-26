import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, RefreshCw, Sparkles, Zap, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TouchButton } from '@/components/ui/touch-button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useDeviceType } from '@/hooks/useDeviceType';
import ResponsiveChatSidebar from '@/components/ResponsiveChatSidebar';
import MobileNavigation from '@/components/MobileNavigation';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import GuestMode from '@/components/GuestMode';
import WelcomeMessage from '@/components/WelcomeMessage';
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
  isStreaming?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, initializing } = useAuth();
  const { isMobile, isTablet } = useDeviceType();
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
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollObserverRef = useRef<IntersectionObserver | null>(null);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && userScrolledUp) return;
    
    if (lastMessageRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const lastMessage = lastMessageRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const messageRect = lastMessage.getBoundingClientRect();
      
      const isMessageVisible = messageRect.bottom <= containerRect.bottom - 40;
      
      if (!isMessageVisible || force) {
        setTimeout(() => {
          lastMessage.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        }, 50);
      }
    }
  }, [userScrolledUp]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      setUserScrolledUp(distanceFromBottom > 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!lastMessageRef.current || !chatContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting && !userScrolledUp) {
          setUserScrolledUp(true);
        }
      },
      {
        root: chatContainerRef.current,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
      }
    );

    observer.observe(lastMessageRef.current);
    scrollObserverRef.current = observer;

    return () => {
      if (scrollObserverRef.current) {
        scrollObserverRef.current.disconnect();
      }
    };
  }, [messages.length, userScrolledUp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping, scrollToBottom]);

  const forceScrollToBottom = useCallback(() => {
    setUserScrolledUp(false);
    scrollToBottom(true);
  }, [scrollToBottom]);


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
    
    // Create streaming message placeholder
    const streamingMessageId = `streaming-${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      provider: 'auto' as any,
      isStreaming: true,
    };

    try {
      if (!isRetry) {
        await ChatService.saveMessage(currentChatId, 'user', content);
      }
      
      const chatMessages: ServiceChatMessage[] = [...conversationHistory, {
        role: 'user',
        content
      }];
      
      console.log('Sending to Enhanced AI:', {
        messageCount: chatMessages.length,
        currentChatId,
        isRetry,
        provider: 'auto-select'
      });

      // Add streaming message to UI
      setMessages(prev => {
        if (isRetry) {
          return [...prev.slice(0, -1), streamingMessage];
        }
        return [...prev, streamingMessage];
      });

      // Use streaming for real-time response
      let fullResponse = '';
      const response = await AIService.sendStreamingMessage(chatMessages, {
        conversationId: currentChatId,
        userId: user.id,
        // Provider will be auto-selected by AI service
        stream: true
      }, (chunk: string) => {
        // Update streaming message in real-time
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: fullResponse }
            : msg
        ));
      });

      // Finalize the message
      const finalMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.message || fullResponse,
        role: 'assistant',
        timestamp: new Date(),
        provider: response.provider,
        isStreaming: false,
      };

      // Replace streaming message with final message
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId ? finalMessage : msg
      ));

      // Save to database
      await ChatService.saveMessage(currentChatId, 'assistant', finalMessage.content);
      
      // Update conversation title if first message
      if (conversationHistory.length === 0 && !isRetry) {
        const title = await ChatService.generateTitle([{
          role: 'user',
          content
        }]);
        await ChatService.updateConversationTitle(currentChatId, title);
        console.log('Updated conversation title to:', title);
      }
      
      setConversationHistory(prev => {
        if (isRetry) {
          return [...prev, {
            role: 'assistant',
            content: finalMessage.content
          }];
        }
        return [...prev, {
          role: 'user',
          content
        }, {
          role: 'assistant',
          content: finalMessage.content
        }];
      });
      
      console.log('Enhanced AI response received successfully:', {
        length: finalMessage.content.length,
        usage: response.usage,
        provider: response.provider,
        streaming: true
      });
      if (isRetry) {
        const capabilityName = 'Hobnob AI';
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
    
    forceScrollToBottom();
    
    const processedAttachments = attachments ? attachments.map(attachment => ({
      ...attachment,
      timestamp: new Date().toISOString(),
      uploadStatus: 'completed'
    })) : [];
    
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
          attachments: processedAttachments
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
      attachments: processedAttachments
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
            <TouchButton 
              onClick={() => navigate('/auth')} 
              className="w-full btn-primary py-4 text-base font-medium" 
              size="lg"
              haptic
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started
            </TouchButton>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border/50"></div>
              <span className="text-sm text-muted-foreground font-medium">or</span>
              <div className="flex-1 border-t border-border/50"></div>
            </div>
            
            <TouchButton 
              onClick={() => setShowGuestMode(true)} 
              variant="outline" 
              className="w-full btn-secondary py-4 text-base font-medium" 
              size="lg"
              haptic
            >
              Continue as Guest
            </TouchButton>
            
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
      <ResponsiveChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        currentChatId={currentChatId || ''} 
        onChatSelect={handleChatSelect} 
        onNewChat={handleNewChat} 
      />

      <div className="flex-1 flex flex-col">
        <div className="glass-card border-b border-border/50 backdrop-blur-xl">
          <div className={`p-4 ${isMobile ? 'px-4 py-3' : 'lg:p-6'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TouchButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarOpen(true)} 
                  className={`${isMobile || isTablet ? 'block' : 'lg:hidden'} text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl p-3`}
                  haptic
                >
                  <Menu className="h-5 w-5" />
                </TouchButton>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                      <span className="text-gradient">Hobnob AI</span>
                      {user && !isMobile && <span className="text-sm font-normal text-muted-foreground ml-2">• {user.email}</span>}
                    </h1>
                  </div>
                  {!isMobile && (
                    <TouchButton 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/tools')} 
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl px-4 py-2"
                      haptic
                    >
                      Tools Dashboard
                    </TouchButton>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Hobnob AI</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div 
          ref={chatContainerRef} 
          className="flex-1 overflow-y-auto scroll-smooth-mobile"
          style={{
            paddingBottom: `calc(${isMobile ? '140px' : '120px'} + env(safe-area-inset-bottom))`,
          }}
        >
          <div className="space-y-0 min-h-full">
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
                      Ask me anything! I'm Hobnob AI, your intelligent assistant ready to help with any task. You can even ask me to generate images for you!
                    </p>
                  </div>
                  {!isMobile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Hobnob AI</span>
                      <span className="text-xs text-muted-foreground">Smart Mode</span>
                    </div>
                  )}
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
            
            {messages.length === 0 && (
              <WelcomeMessage />
            )}
            
            {messages.map((message, index) => (
              <div key={message.id} className="group">
                <ChatMessage 
                  message={message} 
                  ref={index === messages.length - 1 ? lastMessageRef : null} 
                />
                {message.isError && message.canRetry && index === messages.length - 1 && (
                  <div className="flex justify-center py-6">
                    <TouchButton 
                      onClick={handleRetryMessage} 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 btn-secondary hover:scale-105 transition-transform" 
                      disabled={isTyping || isSendingMessage}
                      haptic
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </TouchButton>
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

        {userScrolledUp && (
          <button
            onClick={forceScrollToBottom}
            className="fixed bottom-32 right-6 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
            style={{ bottom: `calc(${isMobile ? '160px' : '140px'} + env(safe-area-inset-bottom))` }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}

        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isTyping || !user || isRestoringState || isSendingMessage}
          conversationId={currentChatId || undefined}
        />
      </div>

      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Index;
