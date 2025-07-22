
interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DeepSeekResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekService {
  private static readonly API_BASE = 'https://api.deepseek.com/v1';

  static async sendMessage(
    messages: DeepSeekMessage[],
    options: {
      conversationId?: string;
      userId?: string;
      isGuest?: boolean;
    } = {}
  ): Promise<DeepSeekResponse> {
    try {
      console.log('Sending message to DeepSeek via edge function');
      
      // Import Supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages,
          provider: 'deepseek',
          ...options,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke DeepSeek edge function');
      }

      return {
        message: data?.message || data?.response || '',
        usage: data?.usage,
      };
    } catch (error) {
      console.error('Error in DeepSeek service:', error);
      throw error;
    }
  }
}
