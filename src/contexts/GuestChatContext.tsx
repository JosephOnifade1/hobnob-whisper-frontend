
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GuestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isError?: boolean;
  canRetry?: boolean;
}

interface GuestChatContextType {
  messages: GuestMessage[];
  addMessage: (message: Omit<GuestMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

const GuestChatContext = createContext<GuestChatContextType | undefined>(undefined);

export const useGuestChat = () => {
  const context = useContext(GuestChatContext);
  if (context === undefined) {
    throw new Error('useGuestChat must be used within a GuestChatProvider');
  }
  return context;
};

interface GuestChatProviderProps {
  children: ReactNode;
}

export const GuestChatProvider: React.FC<GuestChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Load messages from sessionStorage on mount
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('guestChatMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading guest messages:', error);
      }
    }
  }, []);

  // Save messages to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('guestChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const addMessage = (message: Omit<GuestMessage, 'id' | 'timestamp'>) => {
    const newMessage: GuestMessage = {
      ...message,
      id: `guest-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
    sessionStorage.removeItem('guestChatMessages');
  };

  const value: GuestChatContextType = {
    messages,
    addMessage,
    clearMessages,
    isTyping,
    setIsTyping,
  };

  return (
    <GuestChatContext.Provider value={value}>
      {children}
    </GuestChatContext.Provider>
  );
};
