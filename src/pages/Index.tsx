
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState('1');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Hobnob AI, your intelligent assistant. I'm here to help you with questions, creative tasks, problem-solving, and much more. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for your message: "${content}". This is a demo response from Hobnob AI. In a real implementation, this would be connected to an AI service to provide intelligent responses based on your input.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm Hobnob AI, your intelligent assistant. I'm here to help you with questions, creative tasks, problem-solving, and much more. How can I assist you today?",
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);
    setCurrentChatId(Date.now().toString());
    setSidebarOpen(false);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setSidebarOpen(false);
    // In a real app, you would load the messages for this chat
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hobnob AI
            </h1>
            <div className="w-8"></div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl mx-auto px-4">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to Hobnob AI
                </h1>
                <p className="text-gray-600 text-lg mb-8">
                  Your intelligent assistant for creative tasks, problem-solving, and thoughtful conversations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <h3 className="font-medium text-gray-800 mb-2">Creative Writing</h3>
                    <p className="text-sm text-gray-600">Get help with stories, poems, and creative content</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <h3 className="font-medium text-gray-800 mb-2">Problem Solving</h3>
                    <p className="text-sm text-gray-600">Work through complex problems step by step</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <h3 className="font-medium text-gray-800 mb-2">Learning Support</h3>
                    <p className="text-sm text-gray-600">Understand new concepts and topics</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <h3 className="font-medium text-gray-800 mb-2">Code Assistance</h3>
                    <p className="text-sm text-gray-600">Get help with programming and development</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <div className="group">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <ChatMessage message={message} />
                </div>
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default Index;
