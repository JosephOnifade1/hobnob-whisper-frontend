
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
      console.log('Starting image generation request:', {
        prompt: request.prompt.substring(0, 50) + '...',
        conversationId: request.conversationId,
        messageId: request.messageId
      });
      
      const { data, error } = await supabase.functions.invoke('image-generation', {
        body: {
          prompt: request.prompt,
          conversationId: request.conversationId,
          messageId: request.messageId,
          aspectRatio: request.aspectRatio || '1:1'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate image'
        };
      }

      console.log('Image generation response:', data);

      if (!data || !data.success) {
        const errorMessage = data?.error || 'Failed to generate image';
        console.error('Image generation failed:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      if (!data.imageUrl) {
        console.error('No image URL in response');
        return {
          success: false,
          error: 'No image URL returned from generation service'
        };
      }

      console.log('Image generation successful:', data.imageUrl);
      return {
        success: true,
        imageUrl: data.imageUrl,
        generationId: data.generationId,
        prompt: data.prompt,
        downloadUrl: data.downloadUrl || data.imageUrl
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
      console.log('Downloading image:', imageUrl);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Image downloaded successfully:', filename);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  static async getGenerationHistory(conversationId: string) {
    try {
      console.log('Fetching generation history for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching generation history:', error);
        return [];
      }

      console.log('Generation history fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('Error in getGenerationHistory:', error);
      return [];
    }
  }
}
