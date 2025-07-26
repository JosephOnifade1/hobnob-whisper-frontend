import { supabase } from '@/integrations/supabase/client';

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIServiceOptions {
  conversationId?: string;
  userId?: string;
  stream?: boolean;
}

export class OpenAIService {
  static async sendMessage(
    messages: OpenAIMessage[], 
    options: OpenAIServiceOptions = {}
  ): Promise<OpenAIResponse> {
    try {
      console.log('Sending message to OpenAI service:', { messages: messages.length, options });
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages,
          provider: 'openai',
          conversationId: options.conversationId,
          userId: options.userId,
          stream: options.stream || false,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`OpenAI service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from OpenAI service');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        message: data.message || '',
        usage: data.usage,
      };
    } catch (error) {
      console.error('OpenAIService error:', error);
      throw error;
    }
  }

  static async sendStreamingMessage(
    messages: OpenAIMessage[], 
    options: OpenAIServiceOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<OpenAIResponse> {
    try {
      console.log('Sending streaming message to OpenAI service');
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`https://mkyvnegyagdfehukmklu.supabase.co/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          provider: 'openai',
          conversationId: options.conversationId,
          userId: options.userId,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI streaming error: ${response.status}`);
      }

      let fullMessage = '';
      const reader = response.body?.getReader();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullMessage += data.content;
                  onChunk?.(data.content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      return {
        message: fullMessage,
        usage: undefined,
      };
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw error;
    }
  }
}