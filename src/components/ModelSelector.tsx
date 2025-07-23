
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Zap, MessageCircle, Image } from 'lucide-react';
import { UnifiedProvider, UnifiedProviderService } from '@/services/unifiedProviderService';

interface ModelSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
  compact = false
}) => {
  const providers = UnifiedProviderService.getProviders();
  const currentProvider = UnifiedProviderService.getProvider(selectedProvider) || UnifiedProviderService.getDefaultProvider();

  const getProviderIcon = (provider: UnifiedProvider) => {
    switch (provider.icon) {
      case 'brain':
        return <Brain className="h-4 w-4" />;
      case 'zap':
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
            key={provider.id}
            variant={selectedProvider === provider.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onProviderChange(provider.id)}
            disabled={disabled}
            className="gap-1 text-xs"
          >
            {getProviderIcon(provider)}
            {provider.name.split(' ')[0]}
          </Button>
        ))}
      </div>
    );
  }

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
              {getProviderIcon(currentProvider)}
              {currentProvider.name}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider)}
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-muted-foreground">{provider.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {provider.capabilities.chat && (
                    <MessageCircle className="h-3 w-3 text-blue-500" title="Chat enabled" />
                  )}
                  {provider.capabilities.image && (
                    <Image className="h-3 w-3 text-purple-500" title="Image generation enabled" />
                  )}
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
