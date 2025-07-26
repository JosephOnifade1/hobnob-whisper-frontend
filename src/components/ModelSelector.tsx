
import React from 'react';
import { Brain, Zap, Sparkles } from 'lucide-react';
import { AIService, AIProvider } from '@/services/aiService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const getProviderIcon = (provider: AIProvider) => {
  switch (provider) {
    case 'claude':
      return <Brain className="h-4 w-4" />;
    case 'openai':
      return <Zap className="h-4 w-4" />;
    case 'grok':
      return <Sparkles className="h-4 w-4" />;
    default:
      return <Brain className="h-4 w-4" />;
  }
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
  compact = false
}) => {
  const providers = AIService.getAvailableProviders();
  const currentProvider = providers.find(p => p.value === selectedProvider) || providers[0];

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {getProviderIcon(currentProvider.value)}
        <span>{currentProvider.label}</span>
      </div>
    );
  }

  return (
    <Select value={selectedProvider} onValueChange={onProviderChange} disabled={disabled}>
      <SelectTrigger className="w-[200px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            {getProviderIcon(selectedProvider as AIProvider)}
            <span>{currentProvider.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {providers.map((provider) => (
          <SelectItem key={provider.value} value={provider.value}>
            <div className="flex items-center gap-2">
              {getProviderIcon(provider.value)}
              <div className="flex flex-col">
                <span>{provider.label}</span>
                <span className="text-xs text-muted-foreground">{provider.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
