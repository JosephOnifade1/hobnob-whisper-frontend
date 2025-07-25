import { supabase } from '@/integrations/supabase/client';

export interface StabilityGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  outputFormat?: string;
  model?: string;
}

export interface StabilityGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  generationId?: string;
}

export class StabilityService {
  private static readonly API_BASE_URL = 'https://api.stability.ai/v2beta/stable-image/generate';
  
  static async generateImage(request: StabilityGenerationRequest): Promise<StabilityGenerationResponse> {
    try {
      // Call the Supabase edge function for image generation
      const { data, error } = await supabase.functions.invoke('image-generation', {
        body: {
          prompt: request.prompt,
          provider: 'stability',
          aspectRatio: request.aspectRatio || '1:1',
          outputFormat: request.outputFormat || 'png',
          model: request.model || 'core'
        }
      });

      if (error) {
        console.error('Stability API error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate image'
        };
      }

      return {
        success: true,
        imageUrl: data.imageUrl,
        generationId: data.generationId
      };
    } catch (error) {
      console.error('Error calling Stability service:', error);
      return {
        success: false,
        error: 'Failed to generate image with Stability AI'
      };
    }
  }

  static getAvailableModels() {
    return [
      { value: 'core', label: 'Stable Image Core', description: 'Fast, high-quality image generation' },
      { value: 'ultra', label: 'Stable Image Ultra', description: 'Ultra-high quality image generation' },
      { value: 'sd3-large', label: 'SD3 Large', description: 'Advanced diffusion model' }
    ];
  }

  static getAspectRatios() {
    return [
      { value: '1:1', label: 'Square (1:1)' },
      { value: '16:9', label: 'Landscape (16:9)' },
      { value: '9:16', label: 'Portrait (9:16)' },
      { value: '4:3', label: 'Standard (4:3)' },
      { value: '3:4', label: 'Portrait (3:4)' }
    ];
  }
}