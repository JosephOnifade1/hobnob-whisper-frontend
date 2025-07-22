import React from 'react';
import { ArrowLeft, FileImage, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'Creative' | 'Business' | 'Analysis' | 'Content';
  route?: string;
  emoji: string;
  isPro?: boolean;
  isNew?: boolean;
  comingSoon?: boolean;
}

const ToolsDashboard = () => {
  const navigate = useNavigate();

  const tools: Tool[] = [
    {
      id: 'document-converter',
      title: 'Document Converter',
      description: 'Convert between PDF, DOCX, JPG, PNG, and TXT formats with ease',
      icon: FileImage,
      category: 'Content',
      route: '/tools/document-converter',
      emoji: '🌀',
      isNew: true,
    },
  ];

  const categories = ['All', 'Creative', 'Business', 'Analysis', 'Content'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredTools = tools.filter(tool => 
    selectedCategory === 'All' || tool.category === selectedCategory
  );

  const handleToolClick = (tool: Tool) => {
    if (tool.comingSoon) {
      toast.info(`${tool.title} is coming soon! We're working hard to bring you this feature.`);
      return;
    }

    if (tool.isPro) {
      toast.error(`${tool.title} is a Pro feature. Please upgrade your plan to access it.`);
      return;
    }

    if (tool.route) {
      navigate(tool.route);
    } else {
      toast.success(`Opening ${tool.title}...`);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2e2e2e] p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white hover:bg-[#2e2e2e]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Hobnob AI Toolbox
            </h1>
            <p className="text-gray-400">Professional AI-powered tools for creators and developers</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your Professional AI Toolkit
          </h2>
          <p className="text-gray-400 text-lg mb-6">
            Discover powerful AI tools designed to enhance your workflow and creativity
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`
                  ${selectedCategory === category 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-[#1e1e1e] border-[#2e2e2e] text-gray-300 hover:bg-[#2e2e2e] hover:text-white'
                  }
                `}
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
              className="bg-[#1e1e1e] border-[#2e2e2e] cursor-pointer hover:bg-[#252525] transition-all duration-200 group hover-glow"
              onClick={() => handleToolClick(tool)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 group-hover:border-blue-400/50 transition-all">
                      <span className="text-2xl">{tool.emoji}</span>
                    </div>
                    <div>
                      <CardTitle className="text-white group-hover:text-blue-300 transition-colors">
                        {tool.title}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className="text-xs mt-1 border-gray-600 text-gray-400"
                      >
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {tool.isNew && (
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
                        New
                      </Badge>
                    )}
                    {tool.isPro && (
                      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs">
                        Pro
                      </Badge>
                    )}
                    {tool.comingSoon && (
                      <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Request */}
        <div className="mt-12 text-center">
          <Card className="max-w-md mx-auto bg-[#1e1e1e] border-[#2e2e2e]">
            <CardHeader>
              <CardTitle className="text-white">Need a Specific Tool?</CardTitle>
              <CardDescription className="text-gray-400">
                Let us know what AI tool would help your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 w-full"
                onClick={() => toast.info('Feature request modal coming soon!')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Request a Feature
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ToolsDashboard;
