
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedImageData } from './aiService';

export interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GrokResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  generatedImage?: GeneratedImageData;
}

export interface GrokServiceOptions {
  conversationId?: string;
  userId?: string;
}

export class GrokService {
  static async sendMessage(
    messages: GrokMessage[], 
    options: GrokServiceOptions = {}
  ): Promise<GrokResponse> {
    try {
      console.log('Sending message to Grok service (Enhanced Mode):', { messages: messages.length, options });
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages,
          provider: 'grok', // Explicitly set to grok
          conversationId: options.conversationId,
          userId: options.userId,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Grok service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from Grok service');
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
      console.error('GrokService error:', error);
      throw error;
    }
  }
}
