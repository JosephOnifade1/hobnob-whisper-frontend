
import { GrokService } from './grokService';
import { GuestChatService } from './guestChatService';
import { UnifiedProviderService } from './unifiedProviderService';

export type AIProvider = 'grok';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GeneratedImageData {
  imageUrl: string;
  downloadUrl: string;
  prompt: string;
  provider: string;
  generationId: string;
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
  providerId?: string;
}

export class AIService {
  static setDefaultProvider(providerId: string): void {
    // No-op since we only have one provider
  }

  static getDefaultProvider(): AIProvider {
    return 'grok';
  }

  static getDefaultProviderId(): string {
    return 'grok';
  }

  static async sendMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    // Always use Grok for authenticated users, guest service for guests
    const chatProvider: AIProvider = 'grok';
    
    try {
      console.log('Processing message with Grok AI');
      
      let response;
      if (options.isGuest) {
        // For guest users, use the guest chat service (which uses OpenAI internally but we'll update it)
        response = await GuestChatService.sendMessage(messages);
      } else {
        // For authenticated users, always use Grok
        response = await GrokService.sendMessage(messages, options);
      }

      return {
        ...response,
        provider: chatProvider,
      };
    } catch (error) {
      console.error('Error with Grok AI:', error);
      throw error;
    }
  }

  static getAvailableProviders(): { value: AIProvider; label: string; description: string }[] {
    return [
      {
        value: 'grok',
        label: 'Grok AI',
        description: 'Advanced AI powered by Grok'
      }
    ];
  }
}
