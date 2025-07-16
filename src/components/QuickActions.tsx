
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, FileText, Code, Target, Camera, Lightbulb, Plus, Eye } from 'lucide-react';

interface QuickActionsProps {
  onActionSelect: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect }) => {
  const actions = [
    { id: 'analyze-image', label: 'Analyze Image', icon: Eye, prompt: 'Help me analyze this image', emoji: '👁' },
    { id: 'summarize', label: 'Summarize Text', icon: FileText, prompt: 'Summarize this content for me', emoji: '📄' },
    { id: 'plan', label: 'Make a Plan', icon: Target, prompt: 'Help me create a detailed plan for', emoji: '💡' },
    { id: 'code', label: 'Code', icon: Code, prompt: 'Help me write some code', emoji: '💻' },
    { id: 'creative', label: 'Be Creative', icon: Lightbulb, prompt: 'Help me brainstorm creative ideas for', emoji: '✨' },
    { id: 'capture', label: 'Camera', icon: Camera, prompt: 'Take a photo and analyze it', emoji: '📸' },
    { id: 'more', label: 'More', icon: Plus, prompt: 'Show me more tools and features', emoji: '➕' },
  ];

  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex gap-3 min-w-max px-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            onClick={() => onActionSelect(action.prompt)}
            className="action-chip glow-hover flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap min-w-fit"
            variant="ghost"
          >
            <span className="text-lg">{action.emoji}</span>
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
