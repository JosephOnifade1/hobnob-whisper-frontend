import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { ChatService, type ChatMessage as ServiceChatMessage } from '@/services/chatService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ServiceChatMessage[]>([]);

  // Create initial conversation when user is available
  useEffect(() => {
    if (user && !currentChatId && !authLoading) {
      createNewConversation();
    }
  }, [user, currentChatId, authLoading]);

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
      const conversation = await ChatService.createConversation(user.id);
      setCurrentChatId(conversation.id);
      setMessages([]);
      setConversationHistory([]);
      console.log('Created new conversation:', conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!user || !currentChatId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send messages.",
        variant: "destructive",
      });
      return;
    }

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      attachments,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare conversation history for OpenAI
      const chatMessages: ServiceChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content }
      ];

      console.log('Sending to OpenAI via Edge Function:', { messageCount: chatMessages.length, currentChatId });

      // Call OpenAI through our Edge Function
      const response = await ChatService.sendMessage(chatMessages, {
        conversationId: currentChatId,
        userId: user.id,
      });

      // Add AI response to UI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content },
        { role: 'assistant', content: response.message }
      ]);

      console.log('OpenAI response received successfully:', { 
        length: response.message.length, 
        usage: response.usage 
      });

      // Show success feedback
      toast({
        title: "AI Response Generated",
        description: `Tokens used: ${response.usage?.total_tokens || 'N/A'}`,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to UI
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    createNewConversation();
    setSidebarOpen(false);
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      setCurrentChatId(chatId);
      
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

  // Show authentication message if not logged in
  if (!user && !authLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to Hobnob AI</h1>
          <p className="text-muted-foreground">Please sign in to start chatting with AI.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
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
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="space-y-0">
            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Ask me anything! I'm powered by OpenAI's latest GPT-4.1 model.
                  </p>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </div>

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping || !user} />
      </div>
    </div>
  );
};

export default Index;
