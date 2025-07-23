
import { supabase } from '@/integrations/supabase/client';

export interface ImageGenerationRequest {
  prompt: string;
  conversationId: string;
  messageId?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  generationId?: string;
  prompt?: string;
  error?: string;
}

export class ImageGenerationService {
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      console.log('Generating image with prompt:', request.prompt);
      
      const { data, error } = await supabase.functions.invoke('image-generation', {
        body: {
          prompt: request.prompt,
          conversationId: request.conversationId,
          messageId: request.messageId
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
        prompt: data.prompt
      };

    } catch (error) {
      console.error('Image generation service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
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
