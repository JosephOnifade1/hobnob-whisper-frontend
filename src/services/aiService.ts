
import { GrokService } from './grokService';
import { ClaudeService } from './claudeService';
import { OpenAIService } from './openaiService';
import { GuestChatService } from './guestChatService';
import { UnifiedProviderService } from './unifiedProviderService';

export type AIProvider = 'grok' | 'claude' | 'openai';

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
  provider?: AIProvider;
  stream?: boolean;
}

export class AIService {
  // Intelligent provider selection
  static selectOptimalProvider(messages: AIMessage[]): AIProvider {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Use Claude for complex reasoning, coding, analysis
    if (lastMessage.includes('code') || lastMessage.includes('analyze') || 
        lastMessage.includes('explain') || lastMessage.includes('debug') ||
        lastMessage.includes('algorithm') || lastMessage.includes('logic')) {
      return 'claude';
    }
    
    // Use OpenAI for general conversation and quick responses
    if (lastMessage.length < 100 || lastMessage.includes('quick') || lastMessage.includes('simple')) {
      return 'openai';
    }
    
    // Use Grok for creative tasks and humor
    if (lastMessage.includes('creative') || lastMessage.includes('funny') || 
        lastMessage.includes('joke') || lastMessage.includes('story')) {
      return 'grok';
    }
    
    // Default to Claude for best quality
    return 'claude';
  }

  static setDefaultProvider(providerId: string): void {
    localStorage.setItem('preferred_ai_provider', providerId);
  }

  static getDefaultProvider(): AIProvider {
    const saved = localStorage.getItem('preferred_ai_provider') as AIProvider;
    return saved || 'claude';
  }

  static getDefaultProviderId(): string {
    return this.getDefaultProvider();
  }

  static async sendMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIResponse> {
    // Select provider: explicit > saved preference > intelligent selection
    const selectedProvider = options.provider || 
                            (options.isGuest ? 'openai' : this.getDefaultProvider()) ||
                            this.selectOptimalProvider(messages);
    
    try {
      console.log(`Processing message with ${selectedProvider.toUpperCase()}`);
      
      let response;
      if (options.isGuest) {
        // For guest users, use OpenAI for fast responses
        response = await OpenAIService.sendMessage(messages, options);
      } else {
        // For authenticated users, use selected provider with fallback
        try {
          switch (selectedProvider) {
            case 'claude':
              response = await ClaudeService.sendMessage(messages, options);
              break;
            case 'openai':
              response = await OpenAIService.sendMessage(messages, options);
              break;
            case 'grok':
            default:
              response = await GrokService.sendMessage(messages, options);
              break;
          }
        } catch (primaryError) {
          console.log(`Primary provider ${selectedProvider} failed, falling back to Grok`);
          response = await GrokService.sendMessage(messages, options);
        }
      }

      return {
        ...response,
        provider: selectedProvider,
      };
    } catch (error) {
      console.error(`Error with ${selectedProvider}:`, error);
      throw error;
    }
  }

  static async sendStreamingMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const selectedProvider = options.provider || this.selectOptimalProvider(messages);
    
    try {
      console.log(`Streaming message with ${selectedProvider.toUpperCase()}`);
      
      let response;
      switch (selectedProvider) {
        case 'claude':
          response = await ClaudeService.sendStreamingMessage(messages, options, onChunk);
          break;
        case 'openai':
          response = await OpenAIService.sendStreamingMessage(messages, options, onChunk);
          break;
        case 'grok':
        default:
          // Grok streaming not implemented yet, use regular
          response = await GrokService.sendMessage(messages, options);
          onChunk?.(response.message);
          break;
      }

      return {
        ...response,
        provider: selectedProvider,
      };
    } catch (error) {
      console.error(`Streaming error with ${selectedProvider}:`, error);
      throw error;
    }
  }

  static getAvailableProviders(): { value: AIProvider; label: string; description: string }[] {
    return [
      {
        value: 'claude',
        label: 'Claude AI',
        description: 'Superior reasoning and coding (Recommended)'
      },
      {
        value: 'openai',
        label: 'OpenAI GPT',
        description: 'Fast and reliable for general tasks'
      },
      {
        value: 'grok',
        label: 'Grok AI',
        description: 'Creative and conversational'
      }
    ];
  }
}
