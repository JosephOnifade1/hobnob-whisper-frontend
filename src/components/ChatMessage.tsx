
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

  // Function to format message content with proper markdown-like rendering
  const formatMessageContent = (content: string) => {
    // Split content by code blocks (```...```)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n').trim();
        
        return (
          <div key={index} className="my-4">
            {language && (
              <div className="bg-muted/50 px-3 py-1 text-xs text-muted-foreground border border-border rounded-t-md font-mono">
                {language}
              </div>
            )}
            <pre className={`bg-muted/30 p-4 rounded-md overflow-x-auto border border-border ${language ? 'rounded-t-none' : ''}`}>
              <code className="text-sm font-mono text-foreground">{code}</code>
            </pre>
          </div>
        );
      }
      
      // Handle inline code (text between single backticks)
      const inlineCodeRegex = /`([^`]+)`/g;
      if (inlineCodeRegex.test(part)) {
        const formattedPart = part.split(inlineCodeRegex).map((segment, segIndex) => {
          if (segIndex % 2 === 1) {
            // This is inline code
            return (
              <code key={segIndex} className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono border">
                {segment}
              </code>
            );
          }
          return formatTextWithStructure(segment);
        });
        return <span key={index}>{formattedPart}</span>;
      }
      
      return <span key={index}>{formatTextWithStructure(part)}</span>;
    });
  };

  // Function to handle other text formatting (bold, lists, etc.)
  const formatTextWithStructure = (text: string) => {
    // Handle bold text (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold">{part}</strong>;
      }
      
      // Handle bullet points and numbered lists
      const lines = part.split('\n');
      const formattedLines = lines.map((line, lineIndex) => {
        // Handle bullet points (- or *)
        if (line.trim().match(/^[-*]\s+/)) {
          const content = line.replace(/^[-*]\s+/, '').trim();
          return (
            <div key={lineIndex} className="flex items-start gap-2 my-1">
              <span className="text-muted-foreground mt-1.5 w-2 h-2 bg-current rounded-full flex-shrink-0"></span>
              <span>{content}</span>
            </div>
          );
        }
        
        // Handle numbered lists (1. 2. etc.)
        if (line.trim().match(/^\d+\.\s+/)) {
          const match = line.match(/^(\d+)\.\s+(.+)/);
          if (match) {
            return (
              <div key={lineIndex} className="flex items-start gap-2 my-1">
                <span className="text-muted-foreground font-medium min-w-6">{match[1]}.</span>
                <span>{match[2]}</span>
              </div>
            );
          }
        }
        
        // Regular line
        if (line.trim()) {
          return <div key={lineIndex} className="my-1">{line}</div>;
        }
        
        return <br key={lineIndex} />;
      });
      
      return <span key={index}>{formattedLines}</span>;
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
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="text-sm leading-relaxed text-foreground">
              {formatMessageContent(message.content)}
            </div>
          </div>

          {/* Timestamp and actions */}
          <div className="flex items-center gap-2 mt-3">
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
