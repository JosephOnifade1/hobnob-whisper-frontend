import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Share2, Copy, RefreshCw, Sparkles, Image, Clock, HardDrive } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GeneratedImage {
  id: string;
  prompt: string;
  public_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  error_message?: string;
  aspect_ratio: string;
  model_used: string;
  generation_time_ms?: number;
  file_size_bytes?: number;
}

export default function ImageGeneration() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load user's image history
  useEffect(() => {
    if (user) {
      loadImageHistory();
      
      // Set up real-time subscription for status updates
      const channel = supabase
        .channel('image-generations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'image_generations',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time update:', payload);
            loadImageHistory(); // Refresh the list
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadImageHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading image history:', error);
    } else {
      setImages(data || []);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('image-generation', {
        body: {
          prompt: prompt.trim(),
          aspectRatio,
          conversationId: null,
          messageId: null
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Image generation started! Check the gallery for updates.",
        });
        
        // Clear the prompt and refresh history
        setPrompt('');
        setTimeout(() => loadImageHistory(), 1000);
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.public_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  const copyImageUrl = async (image: GeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.public_url);
      toast({
        title: "Success",
        description: "Image URL copied to clipboard!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive"
      });
    }
  };

  const shareImage = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: `Check out this AI-generated image: ${image.prompt}`,
          url: image.public_url
        });
      } catch (error) {
        copyImageUrl(image);
      }
    } else {
      copyImageUrl(image);
    }
  };

  const regenerateImage = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    setAspectRatio(image.aspect_ratio);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Image Generation
        </h1>
        <p className="text-muted-foreground">
          Create stunning images with AI using advanced prompts and customizable settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Generate Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={isGenerating}
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                </select>
              </div>

              <Button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Generated Images</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No images generated yet</p>
                  <p className="text-sm text-muted-foreground">Start by creating your first AI image!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="group relative">
                      <div className="aspect-square relative overflow-hidden rounded-lg border">
                        {image.status === 'completed' && image.public_url ? (
                          <img
                            src={image.public_url}
                            alt={image.prompt}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => setSelectedImage(image)}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            {image.status === 'processing' ? (
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            ) : image.status === 'failed' ? (
                              <div className="text-center text-red-500">
                                <p className="text-sm">Generation Failed</p>
                                {image.error_message && (
                                  <p className="text-xs mt-1">{image.error_message}</p>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground">
                                <p className="text-sm">Pending...</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className={`${getStatusColor(image.status)} text-white`}>
                            {image.status}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        {image.status === 'completed' && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(image)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => shareImage(image)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyImageUrl(image)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => regenerateImage(image)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Image Info */}
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{image.aspect_ratio}</span>
                          {image.generation_time_ms && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(image.generation_time_ms)}
                            </span>
                          )}
                          {image.file_size_bytes && (
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(image.file_size_bytes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.public_url}
              alt={selectedImage.prompt}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadImage(selectedImage)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </Button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-4 rounded">
              <p className="font-medium">{selectedImage.prompt}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                <span>{selectedImage.aspect_ratio}</span>
                <span>{selectedImage.model_used}</span>
                {selectedImage.generation_time_ms && (
                  <span>{formatDuration(selectedImage.generation_time_ms)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}