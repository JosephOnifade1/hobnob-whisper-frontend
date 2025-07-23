
import { ChatService } from './chatService';
import { DeepSeekService } from './deepseekService';
import { GuestChatService } from './guestChatService';
import { UnifiedProviderService } from './unifiedProviderService';

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
  providerId?: string;
}

export class AIService {
  static setDefaultProvider(providerId: string): void {
    UnifiedProviderService.setDefaultProvider(providerId);
  }

  static getDefaultProvider(): AIProvider {
    const unifiedProvider = UnifiedProviderService.getSavedProvider();
    return unifiedProvider.chatProvider;
  }

  static getDefaultProviderId(): string {
    return UnifiedProviderService.getSavedProvider().id;
  }

  static async sendMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    // For guest users, always use Lightning Mode (deepseek)
    let chatProvider: AIProvider;
    
    if (options.isGuest) {
      chatProvider = 'deepseek';
    } else {
      const unifiedProvider = options.providerId 
        ? UnifiedProviderService.getProvider(options.providerId)
        : UnifiedProviderService.getSavedProvider();
      
      chatProvider = unifiedProvider?.chatProvider || 'openai';
    }
    
    try {
      console.log(`Processing message with ${chatProvider === 'openai' ? 'Enhanced Mode' : 'Lightning Mode'}`);
      
      let response;
      if (options.isGuest) {
        // For guest users, use the guest chat service with Lightning Mode
        response = await GuestChatService.sendMessage(messages);
      } else if (chatProvider === 'deepseek') {
        response = await DeepSeekService.sendMessage(messages, options);
      } else {
        response = await ChatService.sendMessage(messages, options);
      }

      return {
        ...response,
        provider: chatProvider,
      };
    } catch (error) {
      console.error(`Error with ${chatProvider === 'openai' ? 'Enhanced Mode' : 'Lightning Mode'}:`, error);
      
      // Try fallback capability if the primary one fails (only for authenticated users)
      if (!options.isGuest) {
        const fallbackProvider: AIProvider = chatProvider === 'openai' ? 'deepseek' : 'openai';
        const fallbackMode = fallbackProvider === 'openai' ? 'Enhanced Mode' : 'Lightning Mode';
        console.log(`Attempting fallback to ${fallbackMode}`);
        
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
          console.error(`Fallback to ${fallbackMode} also failed:`, fallbackError);
        }
      }
      
      throw error;
    }
  }

  static getAvailableProviders(): { value: AIProvider; label: string; description: string }[] {
    return [
      {
        value: 'openai',
        label: 'Enhanced Mode',
        description: 'Advanced reasoning and creativity'
      },
      {
        value: 'deepseek',
        label: 'Lightning Mode',
        description: 'Fast and efficient responses'
      }
    ];
  }
}
