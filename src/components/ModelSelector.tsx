
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
  const getCapabilityInfo = (provider: AIProvider) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'Enhanced Mode',
          description: 'Advanced reasoning and creativity',
          icon: <Brain className="h-4 w-4" />
        };
      case 'deepseek':
        return {
          name: 'Lightning Mode',
          description: 'Fast and efficient responses',
          icon: <Zap className="h-4 w-4" />
        };
      default:
        return {
          name: 'Enhanced Mode',
          description: 'Advanced capabilities',
          icon: <Brain className="h-4 w-4" />
        };
    }
  };

  const capabilities = [
    {
      value: 'openai' as AIProvider,
      ...getCapabilityInfo('openai')
    },
    {
      value: 'deepseek' as AIProvider,
      ...getCapabilityInfo('deepseek')
    }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {capabilities.map((capability) => (
          <Button
            key={capability.value}
            variant={selectedProvider === capability.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onProviderChange(capability.value)}
            disabled={disabled}
            className="gap-1 text-xs"
          >
            {capability.icon}
            {capability.name.split(' ')[0]}
          </Button>
        ))}
      </div>
    );
  }

  const currentCapability = getCapabilityInfo(selectedProvider);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Capability</label>
      <Select
        value={selectedProvider}
        onValueChange={onProviderChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI capability">
            <div className="flex items-center gap-2">
              {currentCapability.icon}
              {currentCapability.name}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {capabilities.map((capability) => (
            <SelectItem key={capability.value} value={capability.value}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {capability.icon}
                  <div>
                    <div className="font-medium">{capability.name}</div>
                    <div className="text-xs text-muted-foreground">{capability.description}</div>
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
