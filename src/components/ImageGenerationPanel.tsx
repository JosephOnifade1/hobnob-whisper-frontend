
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Copy, 
  Share2, 
  RotateCcw, 
  Loader2, 
  Image as ImageIcon, 
  Sparkles,
  X,
  Maximize2,
  Edit
} from 'lucide-react';
import { ImageGenerationService } from '@/services/imageGenerationService';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  downloadUrl?: string;
  timestamp: string;
}

interface ImageGenerationPanelProps {
  conversationId: string;
  messageId?: string;
  onClose: () => void;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  conversationId,
  messageId,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
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
      const response = await ImageGenerationService.generateImage({
        prompt: prompt.trim(),
        conversationId,
        messageId
      });

      if (response.success && response.imageUrl) {
        const newImage: GeneratedImage = {
          id: response.generationId || Date.now().toString(),
          imageUrl: response.imageUrl,
          prompt: prompt.trim(),
          downloadUrl: response.downloadUrl,
          timestamp: new Date().toISOString()
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        setPrompt('');
        toast({
          title: "Success",
          description: "Image generated successfully with OpenAI!"
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to generate image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const filename = `generated-${image.id}.png`;
      await ImageGenerationService.downloadImage(image.downloadUrl || image.imageUrl, filename);
      toast({
        title: "Success",
        description: "Image downloaded successfully!"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  const handleCopyImageUrl = async (image: GeneratedImage) => {
    try {
      await navigator.clipboard.writeText(image.imageUrl);
      toast({
        title: "Success",
        description: "Image URL copied to clipboard!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy image URL",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          text: `Check out this AI-generated image: ${image.prompt}`,
          url: image.imageUrl
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback to copying URL
      handleCopyImageUrl(image);
    }
  };

  const handleRegenerateWithSamePrompt = () => {
    if (selectedImage) {
      setPrompt(selectedImage.prompt);
      setSelectedImage(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Image Generation</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Generation Controls */}
          <div className="w-1/3 border-r p-4 flex flex-col">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>Using:</span>
                  <Badge variant="secondary">OpenAI GPT-Image-1</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  High-quality image generation with advanced AI
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image Prompt</label>
                <Textarea
                  placeholder="Describe the image you want to generate... (e.g., 'a beautiful sunset over mountains')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>

              {selectedImage && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Selected Image</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    "{selectedImage.prompt}"
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegenerateWithSamePrompt}
                    className="w-full gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Use This Prompt
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Generated Images */}
          <div className="flex-1 p-4 overflow-y-auto">
            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No images generated yet</h3>
                <p className="text-muted-foreground">
                  Enter a prompt and click "Generate Image" to create your first AI image
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((image) => (
                  <Card 
                    key={image.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedImage?.id === image.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <CardContent className="p-3">
                      <div className="relative group">
                        <img 
                          src={image.imageUrl} 
                          alt={image.prompt}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        
                        {/* Overlay with tools */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(image);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyImageUrl(image);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(image);
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFullscreen(true);
                              }}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(image.timestamp).toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Image Modal */}
        {isFullscreen && selectedImage && (
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Generated Image
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img 
                  src={selectedImage.imageUrl} 
                  alt={selectedImage.prompt}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    "{selectedImage.prompt}"
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(selectedImage)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
