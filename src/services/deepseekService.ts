
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
      
      const response = await fetch('https://mkyvnegyagdfehukmklu.supabase.co/functions/v1/chat-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reXZuZWd5YWdkZmVodWtta2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODIxNzcsImV4cCI6MjA2ODQ1ODE3N30.y3tm0N8Kq11mS2aFFk24pn9P7wN6iVLYMhHTvNXfw30',
        },
        body: JSON.stringify({
          messages,
          provider: 'deepseek',
          ...options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        message: data.message || data.response || '',
        usage: data.usage,
      };
    } catch (error) {
      console.error('Error in DeepSeek service:', error);
      throw error;
    }
  }
}
