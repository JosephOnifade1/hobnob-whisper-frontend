
import { AIProvider } from './aiService';

export interface UnifiedProvider {
  id: string;
  name: string;
  description: string;
  chatProvider: AIProvider | 'grok';
  imageProvider: 'replicate';
  icon: string;
  capabilities: {
    chat: boolean;
    image: boolean;
  };
}

export class UnifiedProviderService {
  private static providers: UnifiedProvider[] = [
    {
      id: 'replicate',
      name: 'Replicate',
      description: 'Fast, high-quality image generation with Flux Schnell',
      chatProvider: 'grok',
      imageProvider: 'replicate',
      icon: 'zap',
      capabilities: {
        chat: false,
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
    return this.providers[0]; // Replicate as the only provider
  }

  static setDefaultProvider(id: string): void {
    const provider = this.getProvider(id);
    if (provider) {
      localStorage.setItem('preferredUnifiedProvider', id);
    }
  }

  static getSavedProvider(): UnifiedProvider {
    return this.getDefaultProvider(); // Always return Replicate
  }
}
