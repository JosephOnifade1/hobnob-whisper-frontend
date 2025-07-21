
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
    // For guest users, always use DeepSeek
    const provider = options.isGuest ? 'deepseek' : (options.provider || this.getDefaultProvider());
    
    try {
      console.log(`Sending message via ${provider} provider`);
      
      let response;
      if (options.isGuest) {
        // For guest users, use the guest chat service with DeepSeek
        response = await GuestChatService.sendMessage(messages);
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
      
      // Try fallback provider if the primary one fails (only for authenticated users)
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
