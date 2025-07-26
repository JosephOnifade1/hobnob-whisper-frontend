import { supabase } from '@/integrations/supabase/client';

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeResponse {
  message: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeServiceOptions {
  conversationId?: string;
  userId?: string;
  stream?: boolean;
}

export class ClaudeService {
  static async sendMessage(
    messages: ClaudeMessage[], 
    options: ClaudeServiceOptions = {}
  ): Promise<ClaudeResponse> {
    try {
      console.log('Sending message to Claude service:', { messages: messages.length, options });
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages,
          provider: 'claude',
          conversationId: options.conversationId,
          userId: options.userId,
          stream: options.stream || false,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Claude service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from Claude service');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        message: data.message || '',
        usage: data.usage,
      };
    } catch (error) {
      console.error('ClaudeService error:', error);
      throw error;
    }
  }

  static async sendStreamingMessage(
    messages: ClaudeMessage[], 
    options: ClaudeServiceOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<ClaudeResponse> {
    try {
      console.log('Sending streaming message to Claude service');
      
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
          provider: 'claude',
          conversationId: options.conversationId,
          userId: options.userId,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude streaming error: ${response.status}`);
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
      console.error('Claude streaming error:', error);
      throw error;
    }
  }
}