
import { supabase } from '@/integrations/supabase/client';

export interface ImageGenerationRequest {
  prompt: string;
  conversationId: string;
  messageId?: string;
  aspectRatio?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  generationId?: string;
  prompt?: string;
  downloadUrl?: string;
  error?: string;
}

export class ImageGenerationService {
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      console.log('Generating image with Replicate:', request.prompt);
      
      const { data, error } = await supabase.functions.invoke('image-generation', {
        body: {
          prompt: request.prompt,
          conversationId: request.conversationId,
          messageId: request.messageId,
          aspectRatio: request.aspectRatio || '1:1'
        }
      });

      if (error) {
        console.error('Image generation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate image'
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to generate image'
        };
      }

      return {
        success: true,
        imageUrl: data.imageUrl,
        generationId: data.generationId,
        prompt: data.prompt,
        downloadUrl: data.downloadUrl
      };

    } catch (error) {
      console.error('Image generation service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async downloadImage(imageUrl: string, filename: string) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  static async getGenerationHistory(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching generation history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getGenerationHistory:', error);
      return [];
    }
  }
}
