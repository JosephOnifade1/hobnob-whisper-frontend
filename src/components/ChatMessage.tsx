
import React, { forwardRef } from 'react';
import { Bot, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(({ message }, ref) => {
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div 
      ref={ref}
      className={`message-group flex w-full py-6 px-4 ${isAssistant ? 'bg-muted/30' : 'bg-background'}`}
    >
      <div className="max-w-4xl mx-auto w-full flex gap-4">
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isAssistant 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg'
          }
        `}>
          {isAssistant ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message content */}
          <div className="prose prose-sm max-w-none dark:prose-invert light:prose-gray">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {message.content}
            </div>
          </div>

          {/* Timestamp and actions */}
          <div className="flex items-center gap-2 mt-2">
            <span className="timestamp-hover text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            
            {isAssistant && (
              <div className="timestamp-hover flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copy</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-green-400 hover:bg-accent"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-red-400 hover:bg-accent"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
