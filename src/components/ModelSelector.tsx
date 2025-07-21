
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIProvider, AIService } from '@/services/aiService';
import { Brain, Zap } from 'lucide-react';

interface ModelSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  disabled?: boolean;
  compact?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
  compact = false
}) => {
  const providers = AIService.getAvailableProviders();

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'openai':
        return <Brain className="h-4 w-4" />;
      case 'deepseek':
        return <Zap className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {providers.map((provider) => (
          <Button
            key={provider.value}
            variant={selectedProvider === provider.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onProviderChange(provider.value)}
            disabled={disabled}
            className="gap-1 text-xs"
          >
            {getProviderIcon(provider.value)}
            {provider.label.split(' ')[0]}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Model</label>
      <Select
        value={selectedProvider}
        onValueChange={onProviderChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI model">
            <div className="flex items-center gap-2">
              {getProviderIcon(selectedProvider)}
              {providers.find(p => p.value === selectedProvider)?.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.value} value={provider.value}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.value)}
                  <div>
                    <div className="font-medium">{provider.label}</div>
                    <div className="text-xs text-muted-foreground">{provider.description}</div>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
