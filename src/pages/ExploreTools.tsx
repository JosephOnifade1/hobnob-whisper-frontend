import React from 'react';
import { ArrowLeft, FileText, Presentation, Image, UserCheck, Video, Shield, MessageSquare, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FeatureRequestModal from '@/components/FeatureRequestModal';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'Content' | 'Analysis' | 'Creative' | 'Business';
  isNew?: boolean;
  isPro?: boolean;
  comingSoon?: boolean;
}

const ExploreTools = () => {
  const navigate = useNavigate();

  const tools: Tool[] = [
    {
      id: 'pdf-summarizer',
      title: 'PDF Summarizer',
      description: 'Upload PDFs and get AI-powered summaries and key insights',
      icon: FileText,
      category: 'Content',
      isNew: true,
    },
    {
      id: 'pitch-deck-creator',
      title: 'Pitch Deck Creator',
      description: 'Generate professional presentation slides from your ideas',
      icon: Presentation,
      category: 'Business',
      isPro: true,
    },
    {
      id: 'image-captioning',
      title: 'Image Captioning',
      description: 'Automatically generate captions and descriptions for images',
      icon: Image,
      category: 'Creative',
    },
    {
      id: 'resume-analyzer',
      title: 'Resume Analyzer',
      description: 'Get feedback and suggestions to improve your resume',
      icon: UserCheck,
      category: 'Business',
    },
    {
      id: 'video-generation',
      title: 'Video Generation',
      description: 'Create AI-generated videos from text prompts',
      icon: Video,
      category: 'Creative',
      isPro: true,
    },
    {
      id: 'fake-news-detector',
      title: 'Fake News Detection',
      description: 'Analyze news articles for credibility and bias',
      icon: Shield,
      category: 'Analysis',
    },
    {
      id: 'chat-assistant',
      title: 'AI Chat Assistant',
      description: 'Advanced conversational AI for various tasks',
      icon: MessageSquare,
      category: 'Content',
    },
    {
      id: 'content-optimizer',
      title: 'Content Optimizer',
      description: 'Optimize your content for SEO and engagement',
      icon: Zap,
      category: 'Business',
      comingSoon: true,
    },
  ];

  const categories = ['All', 'Content', 'Analysis', 'Creative', 'Business'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredTools = tools.filter(tool => 
    selectedCategory === 'All' || tool.category === selectedCategory
  );

  const handleToolClick = (tool: Tool) => {
    if (tool.comingSoon) {
      toast.info('This tool is coming soon! Stay tuned for updates.');
      return;
    }

    if (tool.isPro) {
      toast.error('This is a Pro feature. Please upgrade your plan to access it.');
      return;
    }

    // Navigate to specific tools
    switch (tool.id) {
      case 'video-generation':
        navigate('/video-generation');
        break;
      case 'fake-news-detector':
        navigate('/fake-news-detection');
        break;
      case 'chat-assistant':
        navigate('/');
        break;
      default:
        toast.success(`Opening ${tool.title}...`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explore Tools</h1>
            <p className="text-gray-600">Discover AI-powered tools to enhance your workflow</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Card
              key={tool.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
              onClick={() => handleToolClick(tool)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                      <tool.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {tool.isNew && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        New
                      </Badge>
                    )}
                    {tool.isPro && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    )}
                    {tool.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Request */}
        <div className="mt-12 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Need a Specific Tool?</CardTitle>
              <CardDescription>
                Let us know what AI tool would help your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureRequestModal>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  Request a Feature
                </Button>
              </FeatureRequestModal>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExploreTools;
