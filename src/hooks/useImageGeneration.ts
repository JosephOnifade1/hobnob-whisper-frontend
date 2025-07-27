
import { useState, useCallback } from 'react';
import { ImageGenerationService } from '@/services/imageGenerationService';
import { useToast } from '@/components/ui/use-toast';

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  downloadUrl?: string;
  timestamp: string;
}

interface UseImageGenerationReturn {
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  generateImage: (prompt: string, conversationId: string, messageId?: string) => Promise<void>;
  downloadImage: (image: GeneratedImage) => Promise<void>;
  clearImages: () => void;
}

export const useImageGeneration = (): UseImageGenerationReturn => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = useCallback(async (prompt: string, conversationId: string, messageId?: string) => {
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
      console.log('Generating image with prompt:', prompt);
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
        toast({
          title: "Success",
          description: "Image generated successfully with OpenAI!"
        });
      } else {
        console.error('Image generation failed:', response.error);
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
  }, [toast]);

  const downloadImage = useCallback(async (image: GeneratedImage) => {
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
  }, [toast]);

  const clearImages = useCallback(() => {
    setGeneratedImages([]);
  }, []);

  return {
    generatedImages,
    isGenerating,
    generateImage,
    downloadImage,
    clearImages
  };
};
