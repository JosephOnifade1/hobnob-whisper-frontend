
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, FileText, Code, Target, Camera, Zap, BookOpen, Lightbulb } from 'lucide-react';

interface QuickActionsProps {
  onActionSelect: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect }) => {
  const actions = [
    { id: 'analyze-image', label: 'Analyze Image', icon: Image, prompt: 'Help me analyze this image' },
    { id: 'summarize', label: 'Summarize', icon: FileText, prompt: 'Summarize this content for me' },
    { id: 'code', label: 'Code', icon: Code, prompt: 'Help me write some code' },
    { id: 'plan', label: 'Make a Plan', icon: Target, prompt: 'Help me create a detailed plan for' },
    { id: 'creative', label: 'Be Creative', icon: Lightbulb, prompt: 'Help me brainstorm creative ideas for' },
    { id: 'learn', label: 'Learn', icon: BookOpen, prompt: 'Teach me about' },
    { id: 'improve', label: 'Improve', icon: Zap, prompt: 'Help me improve this' },
    { id: 'capture', label: 'Capture & Analyze', icon: Camera, prompt: 'Take a photo and analyze it' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={() => onActionSelect(action.prompt)}
          className="flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
