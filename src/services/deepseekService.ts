
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedImageData } from './aiService';

export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepSeekResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  generatedImage?: GeneratedImageData;
}

export interface DeepSeekServiceOptions {
  conversationId?: string;
  userId?: string;
}

export class DeepSeekService {
  static async sendMessage(
    messages: DeepSeekMessage[], 
    options: DeepSeekServiceOptions = {}
  ): Promise<DeepSeekResponse> {
    try {
      console.log('Sending message to DeepSeek service:', { messages: messages.length, options });
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages,
          provider: 'deepseek',
          conversationId: options.conversationId,
          userId: options.userId,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`DeepSeek service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from DeepSeek service');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        message: data.message || '',
        usage: data.usage,
        generatedImage: data.generatedImage,
      };
    } catch (error) {
      console.error('DeepSeekService error:', error);
      throw error;
    }
  }
}
