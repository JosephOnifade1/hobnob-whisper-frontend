
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
    const primaryProvider = options.provider || 
                           (options.isGuest ? 'openai' : this.getDefaultProvider()) ||
                           this.selectOptimalProvider(messages);
    
    // Try multiple providers in sequence for maximum reliability
    const providers = [primaryProvider, 'claude', 'openai', 'grok'].filter((p, index, arr) => arr.indexOf(p) === index);
    
    let lastError;
    
    for (const currentProvider of providers) {
      try {
        console.log(`🔄 Trying ${currentProvider.toUpperCase()}...`);
        
        let response;
        if (options.isGuest) {
          // For guest users, call the unified edge function
          response = await GuestChatService.sendMessage(messages);
        } else {
          // For authenticated users, use provider-specific services
          switch (currentProvider) {
            case 'claude':
              response = await ClaudeService.sendMessage(messages, options);
              break;
            case 'openai':
              response = await OpenAIService.sendMessage(messages, options);
              break;
            case 'grok':
              response = await GrokService.sendMessage(messages, options);
              break;
            default:
              throw new Error(`Unsupported provider: ${currentProvider}`);
          }
        }

        console.log(`✅ ${currentProvider.toUpperCase()} succeeded`);
        return {
          ...response,
          provider: currentProvider as AIProvider,
        };
      } catch (error) {
        console.error(`❌ ${currentProvider.toUpperCase()} failed:`, error);
        lastError = error;
        
        // If this was the last provider, throw the error
        if (currentProvider === providers[providers.length - 1]) {
          break;
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  static async sendStreamingMessage(
    messages: AIMessage[],
    options: AIServiceOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const primaryProvider = options.provider || this.selectOptimalProvider(messages);
    
    // Try multiple providers in sequence for streaming reliability
    const providers = [primaryProvider, 'claude', 'openai', 'grok'].filter((p, index, arr) => arr.indexOf(p) === index);
    
    let lastError;
    
    for (const currentProvider of providers) {
      try {
        console.log(`🔄 Trying streaming with ${currentProvider.toUpperCase()}...`);
        
        let response;
        if (options.isGuest) {
          // For guest users, use regular message service
          response = await GuestChatService.sendMessage(messages);
          onChunk?.(response.message);
        } else {
          // For authenticated users, use provider-specific services
          switch (currentProvider) {
            case 'claude':
              response = await ClaudeService.sendStreamingMessage(messages, options, onChunk);
              break;
            case 'openai':
              response = await OpenAIService.sendStreamingMessage(messages, options, onChunk);
              break;
            case 'grok':
              // Fallback to regular message for Grok
              response = await GrokService.sendMessage(messages, options);
              onChunk?.(response.message);
              break;
            default:
              throw new Error(`Unsupported provider: ${currentProvider}`);
          }
        }

        console.log(`✅ ${currentProvider.toUpperCase()} streaming succeeded`);
        return {
          ...response,
          provider: currentProvider as AIProvider,
        };
      } catch (error) {
        console.error(`❌ ${currentProvider.toUpperCase()} streaming failed:`, error);
        lastError = error;
        
        // If this was the last provider, throw the error
        if (currentProvider === providers[providers.length - 1]) {
          break;
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    throw new Error(`All streaming providers failed. Last error: ${lastError?.message}`);
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
