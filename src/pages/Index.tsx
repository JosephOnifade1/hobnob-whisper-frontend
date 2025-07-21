import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, RefreshCw } from 'lucide-react';
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
import { ChatService, type ChatMessage as ServiceChatMessage } from '@/services/chatService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
  isError?: boolean;
  canRetry?: boolean;
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
  
  // Refs for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);
  
  // Scroll to bottom when messages change or typing starts
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isTyping, scrollToBottom]);

  // Restore conversation state when user is available - prevent multiple calls
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
        // If no saved conversation, select the most recent one
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
        variant: "destructive",
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
        variant: "destructive",
      });
    }
  };

  const sendMessageToAI = async (content: string, isRetry: boolean = false) => {
    if (!user || !currentChatId || isSendingMessage) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to send messages.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSendingMessage(true);
    setIsTyping(true);

    try {
      // Save user message to database only if not a retry
      if (!isRetry) {
        await ChatService.saveMessage(currentChatId, 'user', content);
      }

      // Prepare conversation history for OpenAI
      const chatMessages: ServiceChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content }
      ];

      console.log('Sending to OpenAI via Edge Function:', { messageCount: chatMessages.length, currentChatId, isRetry });

      // Call OpenAI through our Edge Function
      const response = await ChatService.sendMessage(chatMessages, {
        conversationId: currentChatId,
        userId: user.id,
      });

      // Save AI response to database
      await ChatService.saveMessage(currentChatId, 'assistant', response.message);

      // Update conversation title if it's the first exchange
      if (conversationHistory.length === 0 && !isRetry) {
        const title = await ChatService.generateTitle([{ role: 'user', content }]);
        await ChatService.updateConversationTitle(currentChatId, title);
        console.log('Updated conversation title to:', title);
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        if (isRetry) {
          // Remove the last error message and add the new response
          return [...prev.slice(0, -1), aiMessage];
        }
        return [...prev, aiMessage];
      });
      
      // Update conversation history
      setConversationHistory(prev => {
        if (isRetry) {
          // For retries, just update with the new AI response
          return [...prev, { role: 'assistant', content: response.message }];
        }
        return [
          ...prev,
          { role: 'user', content },
          { role: 'assistant', content: response.message }
        ];
      });

      console.log('OpenAI response received successfully:', { 
        length: response.message.length, 
        usage: response.usage 
      });

      if (isRetry) {
        toast({
          title: "Success!",
          description: "Message sent successfully after retry.",
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
          errorMessage = "The AI service quota has been exceeded. Please check your OpenAI billing or try again later.";
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
        canRetry: canRetry,
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
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      setIsSendingMessage(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (isSendingMessage) return; // Prevent duplicate sends
    
    // Create new conversation with the first message if none exists
    if (!currentChatId) {
      const conversation = await createConversationWithMessage(content);
      if (conversation) {
        setCurrentChatId(conversation.id);
        setCurrentConversationId(conversation.id);
        
        // Add user message to UI
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date(),
          attachments,
        };
        
        setMessages([userMessage]);
        setLastUserMessage(content);
        
        // Send to AI after conversation is created
        await sendMessageToAI(content);
      }
      return;
    }

    // Add user message to UI
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
      attachments,
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
    if (chatId === currentChatId) return; // Prevent reloading the same chat
    
    try {
      setCurrentChatId(chatId);
      setCurrentConversationId(chatId);
      
      // Load messages for this conversation
      const dbMessages = await ChatService.getConversationMessages(chatId);
      
      // Convert DB messages to UI format
      const uiMessages: Message[] = dbMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at),
      }));
      
      setMessages(uiMessages);
      
      // Build conversation history for OpenAI context
      const history: ServiceChatMessage[] = dbMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      
      setConversationHistory(history);
      setSidebarOpen(false);
      
      console.log('Loaded conversation:', { chatId, messageCount: uiMessages.length });
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation.",
        variant: "destructive",
      });
    }
  };

  // Show loading state during initialization
  if (initializing) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show guest mode if user chooses to continue as guest
  if (showGuestMode && !user) {
    return <GuestMode />;
  }

  // Show authentication options if not logged in
  if (!user && !authLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-6 max-w-md p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to Hobnob AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Your intelligent AI assistant powered by GPT-4.1
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
              size="lg"
            >
              Sign In / Sign Up
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border"></div>
            </div>
            
            <Button 
              onClick={() => setShowGuestMode(true)}
              variant="outline" 
              className="w-full py-3"
              size="lg"
            >
              Continue as Guest
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Guest mode: Limited to 10 messages per day. No file uploads or conversation history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentChatId={currentChatId || ''}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 backdrop-blur-md bg-opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-6">
                <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Hobnob AI {user ? `- ${user.email}` : ''}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tools')}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Tools Dashboard
                </Button>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pb-32">
          <div className="space-y-0">
            {messages.length === 0 && !isTyping && !isRestoringState && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Ask me anything! I'm powered by OpenAI's latest GPT-4.1 model.
                  </p>
                </div>
              </div>
            )}
            
            {isRestoringState && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
                  <p className="text-muted-foreground">Restoring conversation...</p>
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
                  <div className="flex justify-center py-4">
                    <Button
                      onClick={handleRetryMessage}
                      variant="outline"
                      size="sm"
                      className="gap-2"
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

        {/* Input Area */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isTyping || !user || isRestoringState || isSendingMessage} 
        />
      </div>
    </div>
  );
};

export default Index;
