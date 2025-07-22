
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageCircle, Plus, FileText, Video, Bot, Zap, RefreshCw } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ResponsiveChatSidebar from '@/components/ResponsiveChatSidebar';
import TypingIndicator from '@/components/TypingIndicator';
import ModelSelector from '@/components/ModelSelector';
import ThemeToggle from '@/components/ThemeToggle';
import QuickActions from '@/components/QuickActions';
import MobileNavigation from '@/components/MobileNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestChat } from '@/contexts/GuestChatContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const Index = () => {
  const { user } = useAuth();
  const { messages: guestMessages, addMessage: addGuestMessage } = useGuestChat();
  const { isMobile } = useDeviceType();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'deepseek'>('openai');
  
  // Add local state for active conversation ID
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const {
    conversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    getCurrentConversationId,
    setCurrentConversationId
  } = useConversations();

  const {
    messages: dbMessages,
    loading: messagesLoading,
    saveMessage,
    refreshMessages
  } = useMessages(activeConversationId);

  const messages = user ? dbMessages : guestMessages;

  // Initialize active conversation ID from stored value
  useEffect(() => {
    if (user && !activeConversationId) {
      const storedId = getCurrentConversationId();
      if (storedId) {
        setActiveConversationId(storedId);
      }
    }
  }, [user, activeConversationId, getCurrentConversationId]);

  // Update stored conversation ID when active ID changes
  useEffect(() => {
    if (user && activeConversationId) {
      setCurrentConversationId(activeConversationId);
    }
  }, [activeConversationId, user, setCurrentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create wrapper function for addMessage to match expected interface
  const addMessage = async (content: string, role: 'user' | 'assistant', conversationId: string) => {
    if (user && conversationId) {
      return await saveMessage(conversationId, role, content);
    }
    return null;
  };

  // Create clearMessages function
  const clearMessages = () => {
    if (!user) {
      // For guest users, clear via context
      console.log('Clearing guest messages');
    }
    // For authenticated users, we can't clear messages without deleting the conversation
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!content.trim()) return;

    try {
      if (user) {
        let conversationId = activeConversationId;
        
        if (!conversationId) {
          const newConversation = await createConversation(content.slice(0, 50) + '...');
          if (newConversation) {
            conversationId = newConversation.id;
            setActiveConversationId(conversationId);
          } else {
            return;
          }
        }

        await addMessage(content, 'user', conversationId);
        setIsTyping(true);

        // Simulate AI response
        setTimeout(async () => {
          const aiResponse = `I understand you said: "${content}". This is a simulated response from ${selectedModel === 'openai' ? 'Enhanced Mode' : 'Lightning Mode'}. How can I help you further?`;
          await addMessage(aiResponse, 'assistant', conversationId);
          setIsTyping(false);
        }, 1500);
      } else {
        addGuestMessage(content, 'user');
        setIsTyping(true);

        setTimeout(() => {
          const aiResponse = `I understand you said: "${content}". This is a simulated response from ${selectedModel === 'openai' ? 'Enhanced Mode' : 'Lightning Mode'}. How can I help you further?`;
          addGuestMessage(aiResponse, 'assistant');
          setIsTyping(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setIsTyping(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      if (user) {
        const newConversation = await createConversation('New conversation');
        if (newConversation) {
          setActiveConversationId(newConversation.id);
        }
      } else {
        clearMessages();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create new conversation.');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      if (conversationId === activeConversationId) {
        setActiveConversationId(null);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation.');
    }
  };

  const handleActionSelect = (action: string) => {
    console.log('Quick action selected:', action);
    // For now, just start a new message with the action prompt
    // In the future, this could pre-fill the input or trigger specific actions
  };

  const quickActionItems = [
    {
      icon: FileText,
      title: 'Summarize Document',
      description: 'Upload and get AI insights',
      color: 'from-blue-500 to-cyan-500',
      action: () => console.log('Document summary')
    },
    {
      icon: Video,
      title: 'Generate Video',
      description: 'Create AI-powered videos',
      color: 'from-purple-500 to-pink-500',
      action: () => console.log('Video generation')
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Advanced problem solving',
      color: 'from-green-500 to-emerald-500',
      action: () => console.log('AI Assistant')
    },
    {
      icon: Zap,
      title: 'Quick Analysis',
      description: 'Instant data insights',
      color: 'from-orange-500 to-red-500',
      action: () => console.log('Quick analysis')
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ResponsiveChatSidebar
        isOpen={false}
        onToggle={() => {}}
        currentChatId={activeConversationId || ''}
        onChatSelect={setActiveConversationId}
        onNewChat={handleNewConversation}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/95 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-foreground">Hobnob AI</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ModelSelector 
                selectedProvider={selectedModel}
                onProviderChange={setSelectedModel}
                compact
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto chat-container scroll-smooth-mobile">
          {messages.length > 0 ? (
            <div className="space-y-0">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  ref={index === messages.length - 1 ? messagesEndRef : undefined}
                />
              ))}
              {isTyping && (
                <div className="py-4 lg:py-6 px-4 lg:px-6 bg-muted/30">
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-lg">
                      <Bot className="h-4 w-4 lg:h-5 lg:w-5" />
                    </div>
                    <div className="flex-1">
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
              <div className="text-center max-w-2xl mx-auto space-y-6">
                {/* Welcome Section */}
                <div className="space-y-3">
                  <div className="w-16 h-16 lg:w-18 lg:h-18 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                    <Sparkles className="h-8 w-8 lg:h-9 lg:w-9 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gradient">
                      Welcome to Hobnob AI
                    </h2>
                    <p className="text-muted-foreground text-base lg:text-lg max-w-lg mx-auto leading-relaxed">
                      Your intelligent assistant for creative solutions, analysis, and productivity
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Get started with</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickActionItems.map((item, index) => (
                      <Card 
                        key={index}
                        className="glass-card glass-card-hover p-3 cursor-pointer transition-all duration-300"
                        onClick={item.action}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <item.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                            <p className="text-muted-foreground text-xs">{item.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Start Conversation */}
                <div className="space-y-3">
                  <Button
                    onClick={handleNewConversation}
                    className="btn-primary px-6 py-3 text-base font-medium"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Start a conversation
                  </Button>
                  <p className="text-xs text-muted-foreground/70">
                    Ask anything or try one of the quick actions above
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isTyping}
        />
      </div>

      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation />}

      {/* Quick Actions Component */}
      <QuickActions onActionSelect={handleActionSelect} />
    </div>
  );
};

export default Index;
