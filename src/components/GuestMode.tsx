
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGuestChat } from '@/contexts/GuestChatContext';
import { GuestChatService } from '@/services/guestChatService';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { Crown, Upload, MessageSquare, Users, Star, UserPlus } from 'lucide-react';

const GuestMode = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { messages, addMessage, isTyping, setIsTyping } = useGuestChat();
  const [isSending, setIsSending] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  
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

  const sendMessageToAI = async (content: string, isRetry: boolean = false) => {
    if (isSending) return;

    setIsSending(true);
    setIsTyping(true);

    try {
      // Check rate limit
      const remainingMessages = GuestChatService.getRemainingMessages();
      if (remainingMessages <= 0) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily message limit. Sign up for unlimited access!",
          variant: "destructive",
        });
        return;
      }

      // Prepare conversation history
      const chatMessages = [
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content }
      ];

      console.log('Sending guest message to AI');

      const response = await GuestChatService.sendMessage(chatMessages);

      // Add AI response
      addMessage({
        content: response.message,
        role: 'assistant',
      });

      if (isRetry) {
        toast({
          title: "Success!",
          description: "Message sent successfully after retry.",
        });
      }

      // Show remaining messages warning
      const remaining = GuestChatService.getRemainingMessages();
      if (remaining <= 3 && remaining > 0) {
        toast({
          title: "Limited Messages Remaining",
          description: `You have ${remaining} messages left today. Sign up for unlimited access!`,
        });
      }

    } catch (error) {
      console.error('Error sending guest message:', error);
      
      let errorMessage = "I apologize, but I encountered an error. Please try again.";
      let canRetry = true;
      
      if (error instanceof Error) {
        if (error.message.includes('Daily message limit')) {
          errorMessage = error.message;
          canRetry = false;
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = "I'm receiving too many requests right now. Please wait a moment and try again.";
        } else {
          errorMessage = `I encountered an error: ${error.message}. Please try again.`;
        }
      }
      
      addMessage({
        content: errorMessage,
        role: 'assistant',
        isError: true,
        canRetry: canRetry,
      });
      
      toast({
        title: "Error",
        description: canRetry ? "Failed to get AI response. You can try again." : "Service unavailable. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (isSending) return;

    if (attachments && attachments.length > 0) {
      toast({
        title: "File Upload Not Available",
        description: "Sign up to unlock file upload functionality!",
        variant: "destructive",
      });
      return;
    }

    // Add user message
    addMessage({
      content,
      role: 'user',
    });
    
    setLastUserMessage(content);
    await sendMessageToAI(content);
  };

  const handleRetryMessage = async () => {
    if (lastUserMessage && !isSending) {
      await sendMessageToAI(lastUserMessage, true);
    }
  };

  const remainingMessages = GuestChatService.getRemainingMessages();

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 backdrop-blur-md bg-opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Hobnob AI - Guest Mode
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{remainingMessages} messages left today</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Unlock the full experience!
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Sign up for unlimited messages, file uploads, and conversation history
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Upgrade Now
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pb-32">
          <div className="space-y-0">
            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-6 max-w-md">
                  <h2 className="text-xl font-semibold">Welcome to Hobnob AI</h2>
                  <p className="text-muted-foreground">
                    Try our AI assistant for free! You have {remainingMessages} messages to get started.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Star className="h-4 w-4" />
                      <span>Powered by GPT-4.1</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Upload className="h-4 w-4" />
                      <span>File uploads (Sign up required)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>Conversation history (Sign up required)</span>
                    </div>
                  </div>
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
                      disabled={isTyping || isSending}
                    >
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
          disabled={isTyping || isSending || remainingMessages <= 0}
          placeholder={remainingMessages <= 0 ? "Daily limit reached. Sign up for unlimited access!" : "Ask me anything..."}
        />
      </div>
    </div>
  );
};

export default GuestMode;
