
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import ThemeToggle from '@/components/ThemeToggle';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
}

const Index = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState('1');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      attachments,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // AI response simulation
    setTimeout(() => {
      let response = '';
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('video') || lowerContent.includes('generate video')) {
        response = `I can help you create AI-generated videos! Using our Runway API integration, you can create talking head videos, cinematic scenes, product demos, and explainer videos. Would you like me to guide you through the video generation process?`;
      } else if (lowerContent.includes('fake news') || lowerContent.includes('fact check') || lowerContent.includes('news')) {
        response = `I can analyze news articles and claims for credibility using advanced AI systems. I can check source verification, detect bias, cross-reference facts, and provide confidence scoring. Please share a news article URL or paste the text you'd like me to analyze.`;
      } else if (lowerContent.includes('avatar') || lowerContent.includes('generate avatar')) {
        response = `I can create stunning AI avatars using Runway's Gen-2 API. I can transform your photos into AI avatars, create avatars from text descriptions, and offer various style options including realistic, cartoon, artistic, or professional styles. Upload a photo or describe the avatar you'd like me to create!`;
      } else if (lowerContent.includes('tools') || lowerContent.includes('features') || lowerContent.includes('what can you do')) {
        response = `I'm Hobnob AI with these capabilities:

**Core AI Features:**
• Advanced Chat Assistant (GPT-4o + DeepSeek V3)
• Smart AI Model Routing
• Multi-modal Input Support

**Professional Tools:**
• 🎬 Video Generation (Runway API)
• 🎭 Avatar Creator  
• 📄 Invoice Generator
• 📧 Cold Email Writer
• 🌱 Plant Identifier
• 🦁 Animal Detector
• 😊 Mood Analysis
• 🛡️ Fake News Detection

Which tool interests you most?`;
      } else {
        response = `I'm processing your request using our Smart AI Router to give you the best response. I can help with a wide variety of tasks including content creation, analysis, problem-solving, and using our professional tools. How can I assist you further?`;
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
    setMessages([]);
    setCurrentChatId(Date.now().toString());
    setSidebarOpen(false);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
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
                  Hobnob AI
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
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </div>

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default Index;
