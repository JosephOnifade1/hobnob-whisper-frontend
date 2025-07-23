
import React from 'react';
import { Brain } from 'lucide-react';

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
  // Since we only have Grok now, just display it as a static element
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Brain className="h-4 w-4" />
      <span>Grok AI</span>
    </div>
  );
};

export default ModelSelector;
