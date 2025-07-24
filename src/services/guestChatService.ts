
interface GuestChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GuestChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GuestChatService {
  static async sendMessage(messages: GuestChatMessage[]): Promise<GuestChatResponse> {
    try {
      console.log('Sending guest chat request to edge function with Grok');
      
      const response = await fetch('https://mkyvnegyagdfehukmklu.supabase.co/functions/v1/chat-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reXZuZWd5YWdkZmVodWtta2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODIxNzcsImV4cCI6MjA2ODQ1ODE3N30.y3tm0N8Kq11mS2aFFk24pn9P7wN6iVLYMhHTvNXfw30',
        },
        body: JSON.stringify({
          messages,
          isGuest: true,
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
      console.error('Error in guest chat service:', error);
      throw error;
    }
  }
}
