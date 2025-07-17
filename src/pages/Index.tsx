import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import QuickActions from '@/components/QuickActions';
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Hobnob AI, your advanced AI assistant optimized for nighttime productivity. I can help you with:\n\n• **AI Video Generation** - Create stunning videos from text prompts\n• **Fake News Detection** - Analyze news credibility and bias\n• **Professional Tools** - Generate avatars, invoices, emails, and more\n• **Multi-modal Analysis** - Understand images, videos, documents, and audio\n• **Smart AI Routing** - Automatically use the best AI model for your task\n\nHow can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);

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

    // Enhanced AI response with smart routing logic
    setTimeout(() => {
      let response = '';
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('video') || lowerContent.includes('generate video')) {
        response = `🎬 **Video Generation Request Detected**\n\nI can help you create AI-generated videos! Using our **Runway API integration**, you can create:\n\n• **Talking Head Videos** - Professional presentations\n• **Cinematic Scenes** - Movie-like sequences\n• **Product Demos** - Showcase your products\n• **Explainer Videos** - Educational content\n\nWould you like me to guide you through the video generation process, or would you prefer to visit our dedicated Video Generation page?`;
      } else if (lowerContent.includes('fake news') || lowerContent.includes('fact check') || lowerContent.includes('news')) {
        response = `🛡️ **Fake News Detection Activated**\n\nI can analyze news articles and claims for credibility using our advanced AI systems:\n\n• **Source Verification** - Check article sources and publication credibility\n• **Bias Analysis** - Detect political or commercial bias\n• **Fact Cross-referencing** - Compare with verified news sources\n• **Confidence Scoring** - Get reliability percentages\n\nPlease share a news article URL or paste the text you'd like me to analyze.`;
      } else if (lowerContent.includes('avatar') || lowerContent.includes('generate avatar')) {
        response = `🎭 **Avatar Generation Ready**\n\nUsing **Runway's Gen-2 API**, I can create stunning AI avatars:\n\n• **Photo-to-Avatar** - Transform your photos into AI avatars\n• **Text-to-Avatar** - Describe your ideal avatar\n• **Style Options** - Realistic, cartoon, artistic, or professional\n• **Custom Features** - Specific clothing, backgrounds, expressions\n\nUpload a photo or describe the avatar you'd like me to create!`;
      } else if (lowerContent.includes('invoice') || lowerContent.includes('generate invoice')) {
        response = `📄 **Invoice Generator Activated**\n\nI can create professional invoices using our **HTML2PDF integration**:\n\n• **Custom Branding** - Add your logo and company details\n• **Multiple Templates** - Professional, modern, or minimal designs\n• **Auto Calculations** - Tax, discounts, and totals\n• **Instant Download** - PDF format ready to send\n\nPlease provide your business details and invoice information to get started.`;
      } else if (lowerContent.includes('email') || lowerContent.includes('cold email')) {
        response = `📧 **Cold Email Tool Ready**\n\nUsing **OpenAI's advanced prompting**, I can craft personalized emails:\n\n• **Sales Outreach** - Convert prospects into customers\n• **Partnership Proposals** - Professional collaboration emails\n• **Follow-up Sequences** - Nurture leads effectively\n• **Personalization** - Tailored to recipient's background\n\nTell me about your target audience and email objective!`;
      } else if (lowerContent.includes('plant') || lowerContent.includes('identify plant')) {
        response = `🌱 **Plant Identifier Active**\n\nUsing the **Plant.id API**, I can identify any plant from photos:\n\n• **Species Identification** - Exact plant names and classifications\n• **Care Instructions** - Watering, light, and soil requirements\n• **Health Assessment** - Detect diseases or issues\n• **Growing Tips** - Optimize plant health\n\nUpload a clear photo of the plant you'd like me to identify!`;
      } else if (lowerContent.includes('animal') || lowerContent.includes('detect animal')) {
        response = `🦁 **Animal Detector Engaged**\n\nUsing **DeepAI & Clarifai APIs**, I can identify animals from images:\n\n• **Species Recognition** - Identify exact animal types\n• **Breed Classification** - For pets and livestock\n• **Habitat Information** - Natural environments and behaviors\n• **Conservation Status** - Endangered species alerts\n\nShare a photo and I'll tell you everything about the animal!`;
      } else if (lowerContent.includes('mood') || lowerContent.includes('emotion') || lowerContent.includes('feeling')) {
        response = `😊 **Mood Detection Analyzing...**\n\nBased on your message, I'm using **Emotion AI** to understand your current state:\n\n• **Sentiment Analysis** - Positive, negative, or neutral tone\n• **Emotional Cues** - Specific feelings detected\n• **Empathetic Response** - Human-like understanding\n• **Supportive Suggestions** - Tailored to your mood\n\nI sense you might be looking for emotional support or mood analysis. How are you feeling today?`;
      } else if (attachments && attachments.length > 0) {
        const attachmentTypes = attachments.map(a => a.type).join(', ');
        response = `📎 **Multi-modal Analysis Initiated**\n\nI can see you've shared ${attachments.length} file(s): ${attachmentTypes}\n\n• **Image Analysis** - Object detection, text extraction, scene understanding\n• **Video Processing** - Frame analysis, content summarization\n• **Document Processing** - PDF parsing, content extraction\n• **Audio Transcription** - Speech-to-text conversion\n\nProcessing your files with the most appropriate AI model...`;
      } else if (lowerContent.includes('tools') || lowerContent.includes('features') || lowerContent.includes('what can you do')) {
        response = `🧰 **Hobnob AI Professional Toolkit**\n\n**Core AI Features:**\n• Advanced Chat Assistant (GPT-4o + DeepSeek V3)\n• Smart AI Model Routing\n• Multi-modal Input Support\n\n**Professional Tools:**\n• 🎬 Video Generation (Runway API)\n• 🎭 Avatar Creator\n• 📄 Invoice Generator\n• 📧 Cold Email Writer\n• 🌱 Plant Identifier\n• 🦁 Animal Detector\n• 😊 Mood Analysis\n• 🛡️ Fake News Detection\n• 📰 Real-time News Feed\n\n**Global Features:**\n• 50+ Language Support\n• Real-time Data Awareness\n• Emotion Recognition\n• Professional Content Creation\n\nWhich tool interests you most?`;
      } else {
        response = `Thank you for your message: "${content}"\n\nI'm processing this with our **Smart AI Router** to give you the best response. Based on your query, I'm selecting the optimal AI model (GPT-4o or DeepSeek V3) for the most accurate assistance.\n\n**Quick suggestions:**\n• Ask me to "generate a video about..."\n• Upload an image for analysis\n• Request "check if this news is real..."\n• Try "create an avatar" or "identify this plant"\n• Say "what tools do you offer?"\n\nHow else can I help you today?`;
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

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm Hobnob AI, your advanced AI assistant optimized for nighttime productivity. How can I assist you today?",
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
  };

  return (
    <div className="flex h-screen bg-[#121212] text-white">
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
        <div className="bg-[#1a1a1a] border-b border-[#2e2e2e] p-4 backdrop-blur-md bg-opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white hover:bg-[#2e2e2e]"
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
                  className="text-gray-400 hover:text-white hover:bg-[#2e2e2e]"
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
          {messages.length === 1 ? (
            // Welcome Screen
            <div className="flex items-center justify-center min-h-full p-4">
              <div className="text-center max-w-4xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Welcome to Hobnob AI Pro
                  </h1>
                  <p className="text-gray-400 text-lg mb-8">
                    Your advanced AI assistant optimized for nighttime productivity and mobile-first power users.
                  </p>
                </div>
                
                {/* Quick Actions */}
                <QuickActions onActionSelect={handleQuickAction} />
                
                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm mt-12">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mx-auto mb-3 glow-shadow">
                      <span className="text-2xl">🧠</span>
                    </div>
                    <h4 className="font-medium text-gray-200 mb-1">Smart AI Router</h4>
                    <p className="text-gray-500">GPT-4o + DeepSeek V3 integration</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center mx-auto mb-3 glow-shadow">
                      <span className="text-2xl">📁</span>
                    </div>
                    <h4 className="font-medium text-gray-200 mb-1">Multi-Modal</h4>
                    <p className="text-gray-500">Images, videos, audio, and files</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center mx-auto mb-3 glow-shadow">
                      <span className="text-2xl">🌍</span>
                    </div>
                    <h4 className="font-medium text-gray-200 mb-1">Global AI</h4>
                    <p className="text-gray-500">50+ languages, real-time data</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl flex items-center justify-center mx-auto mb-3 glow-shadow">
                      <span className="text-2xl">🔧</span>
                    </div>
                    <h4 className="font-medium text-gray-200 mb-1">Pro Tools</h4>
                    <p className="text-gray-500">Professional AI toolkit</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <div className="space-y-0">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Input Area - Now floating */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default Index;
