
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
  private static readonly RATE_LIMIT_KEY = 'guestChatUsage';
  private static readonly MAX_DAILY_MESSAGES = 10;

  static checkRateLimit(): { allowed: boolean; remaining: number } {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '{}');
    
    if (usage.date !== today) {
      // Reset for new day
      usage.date = today;
      usage.count = 0;
    }

    const remaining = Math.max(0, this.MAX_DAILY_MESSAGES - (usage.count || 0));
    return {
      allowed: remaining > 0,
      remaining
    };
  }

  static incrementUsage(): void {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '{}');
    
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 1;
    } else {
      usage.count = (usage.count || 0) + 1;
    }

    localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(usage));
  }

  static async sendMessage(messages: GuestChatMessage[]): Promise<GuestChatResponse> {
    // Check rate limit
    const { allowed } = this.checkRateLimit();
    if (!allowed) {
      throw new Error('Daily message limit reached. Please sign up for unlimited access.');
    }

    try {
      console.log('Sending guest chat request to edge function');
      
      // Use the existing chat-completion edge function but without user context
      const response = await fetch('https://mkyvnegyagdfehukmklu.supabase.co/functions/v1/chat-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reXZuZWd5YWdkZmVodWtta2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODIxNzcsImV4cCI6MjA2ODQ1ODE3N30.y3tm0N8Kq11mS2aFFk24pn9P7wN6iVLYMhHTvNXfw30',
        },
        body: JSON.stringify({
          messages,
          isGuest: true, // Flag to indicate this is a guest request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Increment usage after successful request
      this.incrementUsage();
      
      return {
        message: data.message || data.response || '',
        usage: data.usage,
      };
    } catch (error) {
      console.error('Error in guest chat service:', error);
      throw error;
    }
  }

  static getRemainingMessages(): number {
    return this.checkRateLimit().remaining;
  }

  static clearUsageData(): void {
    localStorage.removeItem(this.RATE_LIMIT_KEY);
  }
}
