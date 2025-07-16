
import React, { useState } from 'react';
import { ArrowLeft, Video, Download, Play, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface GeneratedVideo {
  id: string;
  prompt: string;
  style: string;
  url: string;
  thumbnail: string;
  createdAt: Date;
}

const VideoGeneration = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([
    {
      id: '1',
      prompt: 'A serene mountain landscape at sunset',
      style: 'Cinematic',
      url: '#',
      thumbnail: '/placeholder.svg',
      createdAt: new Date(),
    },
    {
      id: '2',
      prompt: 'Product demo for a new smartphone',
      style: 'Explainer',
      url: '#',
      thumbnail: '/placeholder.svg',
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !style) {
      toast.error('Please enter a prompt and select a style');
      return;
    }

    setIsGenerating(true);
    
    // Simulate video generation
    setTimeout(() => {
      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        prompt,
        style,
        url: '#',
        thumbnail: '/placeholder.svg',
        createdAt: new Date(),
      };
      
      setVideos(prev => [newVideo, ...prev]);
      setPrompt('');
      setIsGenerating(false);
      toast.success('Video generated successfully!');
    }, 3000);
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
            <h1 className="text-2xl font-bold text-gray-900">AI Video Generation</h1>
            <p className="text-gray-600">Create stunning videos with AI-powered generation</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Generate Video
                </CardTitle>
                <CardDescription>
                  Describe what you want to create and our AI will generate a video for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Prompt
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the video you want to create..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Style
                  </label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="talking-head">Talking Head</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="explainer">Explainer</SelectItem>
                      <SelectItem value="product-demo">Product Demo</SelectItem>
                      <SelectItem value="animation">Animation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Generate Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Style Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Style Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['Talking Head', 'Cinematic', 'Explainer', 'Animation'].map((styleType) => (
                    <div key={styleType} className="text-center">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                        <Video className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">{styleType}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Generated Videos</CardTitle>
                <CardDescription>
                  Access and manage your previously generated videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div key={video.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-4">
                        <div className="relative">
                          <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute inset-0 text-white bg-black/50 hover:bg-black/70"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{video.prompt}</h4>
                          <p className="text-sm text-gray-600 mb-2">Style: {video.style}</p>
                          <p className="text-xs text-gray-500">
                            {video.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
