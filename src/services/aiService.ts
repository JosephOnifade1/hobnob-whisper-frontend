
import { ChatService } from './chatService';
import { DeepSeekService } from './deepseekService';
import { GuestChatService } from './guestChatService';

export type AIProvider = 'openai' | 'deepseek';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider: AIProvider;
}

export interface AIServiceOptions {
  conversationId?: string;
  userId?: string;
  isGuest?: boolean;
  provider?: AIProvider;
}

export class AIService {
  private static defaultProvider: AIProvider = 'openai';

  static setDefaultProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
    localStorage.setItem('preferredAIProvider', provider);
  }

  static getDefaultProvider(): AIProvider {
    const saved = localStorage.getItem('preferredAIProvider') as AIProvider;
    return saved || this.defaultProvider;
  }

  static async sendMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    const provider = options.provider || this.getDefaultProvider();
    
    try {
      console.log(`Sending message via ${provider} provider`);
      
      let response;
      if (options.isGuest) {
        // For guest users, use the guest chat service with provider selection
        response = await this.sendGuestMessage(messages, provider);
      } else if (provider === 'deepseek') {
        response = await DeepSeekService.sendMessage(messages, options);
      } else {
        response = await ChatService.sendMessage(messages, options);
      }

      return {
        ...response,
        provider,
      };
    } catch (error) {
      console.error(`Error with ${provider} provider:`, error);
      
      // Try fallback provider if the primary one fails
      if (!options.isGuest) {
        const fallbackProvider: AIProvider = provider === 'openai' ? 'deepseek' : 'openai';
        console.log(`Attempting fallback to ${fallbackProvider}`);
        
        try {
          let fallbackResponse;
          if (fallbackProvider === 'deepseek') {
            fallbackResponse = await DeepSeekService.sendMessage(messages, options);
          } else {
            fallbackResponse = await ChatService.sendMessage(messages, options);
          }
          
          return {
            ...fallbackResponse,
            provider: fallbackProvider,
          };
        } catch (fallbackError) {
          console.error(`Fallback to ${fallbackProvider} also failed:`, fallbackError);
        }
      }
      
      throw error;
    }
  }

  private static async sendGuestMessage(
    messages: AIMessage[],
    provider: AIProvider
  ): Promise<{ message: string; usage?: any }> {
    // Check rate limit for guest users
    const { allowed } = GuestChatService.checkRateLimit();
    if (!allowed) {
      throw new Error('Daily message limit reached. Please sign up for unlimited access.');
    }

    const response = await fetch('https://mkyvnegyagdfehukmklu.supabase.co/functions/v1/chat-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reXZuZWd5YWdkZmVodWtta2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODIxNzcsImV4cCI6MjA2ODQ1ODE3N30.y3tm0N8Kq11mS2aFFk24pn9P7wN6iVLYMhHTvNXfw30',
      },
      body: JSON.stringify({
        messages,
        provider,
        isGuest: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Increment usage after successful request
    GuestChatService.incrementUsage();
    
    return {
      message: data.message || data.response || '',
      usage: data.usage,
    };
  }

  static getAvailableProviders(): { value: AIProvider; label: string; description: string }[] {
    return [
      {
        value: 'openai',
        label: 'OpenAI GPT-4.1',
        description: 'Advanced reasoning and creativity'
      },
      {
        value: 'deepseek',
        label: 'DeepSeek V3',
        description: 'Fast and efficient responses'
      }
    ];
  }
}
