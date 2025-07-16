
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
      content: "Hello! I'm Hobnob AI, your intelligent assistant. I can help you with AI video generation, fake news detection, content creation, and much more. How can I assist you today?",
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

    // Simulate AI response with smart routing
    setTimeout(() => {
      let response = '';
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('video') || lowerContent.includes('generate video')) {
        response = `I can help you create AI-generated videos! You can use our Video Generation tool to create talking head videos, cinematic scenes, explainers, and more. Would you like me to guide you through the process, or you can visit our Video Generation page directly.`;
      } else if (lowerContent.includes('fake news') || lowerContent.includes('fact check')) {
        response = `I can help you analyze news articles and claims for credibility! Our Fake News Detection tool uses advanced AI to check sources, analyze bias, and provide credibility scores. You can input text or URLs for analysis.`;
      } else if (lowerContent.includes('tools') || lowerContent.includes('features')) {
        response = `Hobnob AI offers several powerful tools:
        
• **AI Chat Assistant** - Advanced conversational AI (that's me!)
• **Video Generation** - Create AI videos from text prompts
• **Fake News Detection** - Analyze news credibility and bias
• **PDF Summarizer** - Extract key insights from documents
• **Image Captioning** - Generate descriptions for images
• **Resume Analyzer** - Get feedback on your resume

You can explore all tools in our Tools Hub. Which one interests you most?`;
      } else {
        response = `Thank you for your message: "${content}". I'm here to help with various AI-powered tasks including video generation, fact-checking, content analysis, and more. 

Here are some things you can try:
• "Generate a video about..."
• "Check if this news is real..."
• "What tools do you offer?"
• "Help me with my resume"

What would you like to explore first?`;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
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
        content: "Hello! I'm Hobnob AI, your intelligent assistant. I can help you with AI video generation, fake news detection, content creation, and much more. How can I assist you today?",
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

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
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
          {messages.length === 1 ? (
            // Welcome Screen
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-4xl mx-auto px-4">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to Hobnob AI
                </h1>
                <p className="text-gray-600 text-lg mb-8">
                  Your AI-powered toolbox for video generation, fact-checking, content creation, and intelligent conversations.
                </p>
                
                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => handleSuggestionClick("Generate a video about sustainable energy")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer text-left"
                  >
                    <h3 className="font-medium text-gray-800 mb-2">🎬 Generate a Video</h3>
                    <p className="text-sm text-gray-600">Create AI-generated videos from text prompts</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Check if this news article is credible")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer text-left"
                  >
                    <h3 className="font-medium text-gray-800 mb-2">🛡️ Detect Fake News</h3>
                    <p className="text-sm text-gray-600">Analyze news articles for credibility and bias</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("What tools and features do you offer?")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer text-left"
                  >
                    <h3 className="font-medium text-gray-800 mb-2">🧰 Explore Tools</h3>
                    <p className="text-sm text-gray-600">Discover all available AI-powered features</p>
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Help me optimize my resume for a tech job")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer text-left"
                  >
                    <h3 className="font-medium text-gray-800 mb-2">📄 Resume Analysis</h3>
                    <p className="text-sm text-gray-600">Get AI feedback on your resume and career documents</p>
                  </button>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Multi-Modal AI</h4>
                    <p className="text-gray-600">Text, image, and file support for comprehensive assistance</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Smart Routing</h4>
                    <p className="text-gray-600">Automatically routes to the best AI model for your task</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Secure & Private</h4>
                    <p className="text-gray-600">Your data is protected with enterprise-grade security</p>
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
