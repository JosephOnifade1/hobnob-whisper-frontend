
import { ChatService } from './chatService';
import { DeepSeekService } from './deepseekService';
import { GrokService } from './grokService';
import { GuestChatService } from './guestChatService';
import { UnifiedProviderService } from './unifiedProviderService';

export type AIProvider = 'openai' | 'deepseek' | 'grok';

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
  generatedImage?: GeneratedImageData;
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
    return unifiedProvider.chatProvider as AIProvider;
  }

  static getDefaultProviderId(): string {
    return UnifiedProviderService.getSavedProvider().id;
  }

  static async sendMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    // For guest users, always use Lightning Mode (openai)
    let chatProvider: AIProvider;
    
    if (options.isGuest) {
      chatProvider = 'openai';
    } else {
      const unifiedProvider = options.providerId 
        ? UnifiedProviderService.getProvider(options.providerId)
        : UnifiedProviderService.getSavedProvider();
      
      chatProvider = unifiedProvider?.chatProvider as AIProvider || 'openai';
    }
    
    try {
      console.log(`Processing message with ${chatProvider === 'grok' ? 'Enhanced Mode (Grok)' : chatProvider === 'openai' ? 'Lightning Mode (OpenAI)' : 'DeepSeek'}`);
      
      let response;
      if (options.isGuest) {
        // For guest users, use the guest chat service with Lightning Mode
        response = await GuestChatService.sendMessage(messages);
      } else {
        // For authenticated users, route based on the selected provider
        if (chatProvider === 'grok') {
          response = await GrokService.sendMessage(messages, options);
        } else if (chatProvider === 'deepseek') {
          response = await DeepSeekService.sendMessage(messages, options);
        } else {
          response = await ChatService.sendMessage(messages, options);
        }
      }

      return {
        ...response,
        provider: chatProvider,
      };
    } catch (error) {
      console.error(`Error with ${chatProvider === 'grok' ? 'Enhanced Mode (Grok)' : chatProvider === 'openai' ? 'Lightning Mode (OpenAI)' : 'DeepSeek'}:`, error);
      
      // Try fallback capability if the primary one fails (only for authenticated users)
      if (!options.isGuest) {
        const fallbackProvider: AIProvider = chatProvider === 'grok' ? 'openai' : 'grok';
        const fallbackMode = fallbackProvider === 'grok' ? 'Enhanced Mode (Grok)' : 'Lightning Mode (OpenAI)';
        console.log(`Attempting fallback to ${fallbackMode}`);
        
        try {
          let fallbackResponse;
          if (fallbackProvider === 'grok') {
            fallbackResponse = await GrokService.sendMessage(messages, options);
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
        value: 'grok',
        label: 'Enhanced Mode',
        description: 'Advanced creativity with Grok AI'
      },
      {
        value: 'openai',
        label: 'Lightning Mode',
        description: 'Fast responses with OpenAI'
      }
    ];
  }
}
