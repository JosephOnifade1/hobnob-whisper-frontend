
import { AIProvider } from './aiService';

export interface UnifiedProvider {
  id: string;
  name: string;
  description: string;
  chatProvider: AIProvider | 'grok';
  imageProvider: 'openai' | 'grok';
  icon: string;
  capabilities: {
    chat: boolean;
    image: boolean;
  };
}

export class UnifiedProviderService {
  private static providers: UnifiedProvider[] = [
    {
      id: 'enhanced',
      name: 'Enhanced Mode',
      description: 'Advanced creativity with Grok AI',
      chatProvider: 'grok',
      imageProvider: 'grok',
      icon: 'brain',
      capabilities: {
        chat: true,
        image: true
      }
    },
    {
      id: 'lightning',
      name: 'Lightning Mode',
      description: 'Fast responses with OpenAI',
      chatProvider: 'openai',
      imageProvider: 'openai',
      icon: 'zap',
      capabilities: {
        chat: true,
        image: true
      }
    }
  ];

  static getProviders(): UnifiedProvider[] {
    return this.providers;
  }

  static getProvider(id: string): UnifiedProvider | undefined {
    return this.providers.find(provider => provider.id === id);
  }

  static getProviderByChat(chatProvider: AIProvider | 'grok'): UnifiedProvider | undefined {
    return this.providers.find(provider => provider.chatProvider === chatProvider);
  }

  static getDefaultProvider(): UnifiedProvider {
    return this.providers[0]; // Enhanced mode as default
  }

  static setDefaultProvider(id: string): void {
    const provider = this.getProvider(id);
    if (provider) {
      localStorage.setItem('preferredUnifiedProvider', id);
    }
  }

  static getSavedProvider(): UnifiedProvider {
    const saved = localStorage.getItem('preferredUnifiedProvider');
    return saved ? this.getProvider(saved) || this.getDefaultProvider() : this.getDefaultProvider();
  }
}
