
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

  // Enhanced function to format message content with professional markdown rendering
  const formatMessageContent = (content: string) => {
    // First, split by code blocks to handle them separately
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push({ type: 'text', content: textBefore });
        }
      }

      // Add code block
      parts.push({
        type: 'codeblock',
        language: match[1] || 'text',
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText });
      }
    }

    // If no code blocks found, treat entire content as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: content });
    }

    return parts.map((part, index) => {
      if (part.type === 'codeblock') {
        return renderCodeBlock(part.language, part.content, index);
      }
      return renderFormattedText(part.content, index);
    });
  };

  // Professional code block rendering
  const renderCodeBlock = (language: string, code: string, key: number) => {
    const copyCode = () => {
      navigator.clipboard.writeText(code);
    };

    return (
      <div key={key} className="my-6 rounded-lg overflow-hidden border border-border bg-muted/20 shadow-sm">
        {/* Code block header */}
        <div className="flex items-center justify-between bg-muted/60 px-4 py-2 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {language || 'code'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-6 px-2 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3 mr-1" />
            <span className="text-xs">Copy</span>
          </Button>
        </div>
        {/* Code content */}
        <pre className="p-4 overflow-x-auto bg-muted/10 text-sm leading-relaxed">
          <code className="font-mono text-foreground whitespace-pre">{code}</code>
        </pre>
      </div>
    );
  };

  // Enhanced text formatting with headers, links, and better styling
  const renderFormattedText = (text: string, key: number) => {
    const lines = text.split('\n');
    const formattedElements = [];
    let currentParagraph = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle headers (## Header)
      if (trimmedLine.match(/^#{1,6}\s+/)) {
        // Finish current paragraph if any
        if (currentParagraph.length > 0) {
          formattedElements.push(renderParagraph(currentParagraph.join('\n'), formattedElements.length));
          currentParagraph = [];
        }

        const headerLevel = (trimmedLine.match(/^#+/) || [''])[0].length;
        const headerText = trimmedLine.replace(/^#+\s*/, '');
        const HeaderTag = `h${Math.min(headerLevel, 6)}` as keyof JSX.IntrinsicElements;
        
        formattedElements.push(
          <HeaderTag
            key={formattedElements.length}
            className={`font-semibold text-foreground mt-6 mb-3 ${
              headerLevel === 1 ? 'text-xl' :
              headerLevel === 2 ? 'text-lg' :
              headerLevel === 3 ? 'text-base' : 'text-sm'
            }`}
          >
            {formatInlineElements(headerText)}
          </HeaderTag>
        );
        continue;
      }

      // Handle lists
      if (trimmedLine.match(/^[-*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        // Finish current paragraph if any
        if (currentParagraph.length > 0) {
          formattedElements.push(renderParagraph(currentParagraph.join('\n'), formattedElements.length));
          currentParagraph = [];
        }

        formattedElements.push(renderListItem(trimmedLine, formattedElements.length));
        continue;
      }

      // Handle empty lines (paragraph breaks)
      if (!trimmedLine) {
        if (currentParagraph.length > 0) {
          formattedElements.push(renderParagraph(currentParagraph.join('\n'), formattedElements.length));
          currentParagraph = [];
        }
        continue;
      }

      // Regular text - add to current paragraph
      currentParagraph.push(line);
    }

    // Handle remaining paragraph
    if (currentParagraph.length > 0) {
      formattedElements.push(renderParagraph(currentParagraph.join('\n'), formattedElements.length));
    }

    return <div key={key}>{formattedElements}</div>;
  };

  // Render paragraph with proper spacing
  const renderParagraph = (text: string, key: number) => {
    if (!text.trim()) return null;
    
    return (
      <p key={key} className="text-sm leading-relaxed text-foreground mb-4 last:mb-0">
        {formatInlineElements(text)}
      </p>
    );
  };

  // Render list items
  const renderListItem = (line: string, key: number) => {
    const isNumbered = line.match(/^\d+\.\s+/);
    const content = line.replace(/^[-*]\s+|^\d+\.\s+/, '');

    if (isNumbered) {
      const match = line.match(/^(\d+)\.\s+(.+)/);
      return (
        <div key={key} className="flex items-start gap-3 mb-2">
          <span className="text-muted-foreground font-medium text-sm min-w-6 mt-0.5">
            {match?.[1]}.
          </span>
          <span className="text-sm leading-relaxed text-foreground flex-1">
            {formatInlineElements(content)}
          </span>
        </div>
      );
    } else {
      return (
        <div key={key} className="flex items-start gap-3 mb-2">
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
          <span className="text-sm leading-relaxed text-foreground flex-1">
            {formatInlineElements(content)}
          </span>
        </div>
      );
    }
  };

  // Format inline elements (bold, italic, inline code, links)
  const formatInlineElements = (text: string) => {
    // Handle inline code first
    const codeRegex = /`([^`]+)`/g;
    const parts = text.split(codeRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is inline code
        return (
          <code
            key={index}
            className="bg-muted/70 text-foreground px-1.5 py-0.5 rounded text-xs font-mono border border-border/50"
          >
            {part}
          </code>
        );
      }

      // Handle other formatting in non-code parts
      return formatOtherInlineElements(part, index);
    });
  };

  // Handle bold, italic, and links
  const formatOtherInlineElements = (text: string, baseKey: number) => {
    // Handle links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const linkParts = text.split(linkRegex);
    
    const linkFormatted = linkParts.map((part, index) => {
      if (index % 3 === 1) {
        // Link text
        const url = linkParts[index + 1];
        return (
          <a
            key={`${baseKey}-link-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            {part}
          </a>
        );
      } else if (index % 3 === 2) {
        // URL part, skip it
        return null;
      }
      
      // Regular text - handle bold and italic
      return formatBoldItalic(part, `${baseKey}-${index}`);
    }).filter(Boolean);

    return linkFormatted;
  };

  // Handle bold and italic formatting
  const formatBoldItalic = (text: string, baseKey: string) => {
    // Handle bold (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const boldParts = text.split(boldRegex);
    
    return boldParts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={`${baseKey}-bold-${index}`} className="font-semibold text-foreground">
            {part}
          </strong>
        );
      }
      
      // Handle italic (*text*)
      const italicRegex = /\*([^*]+)\*/g;
      const italicParts = part.split(italicRegex);
      
      return italicParts.map((italicPart, italicIndex) => {
        if (italicIndex % 2 === 1) {
          return (
            <em key={`${baseKey}-italic-${index}-${italicIndex}`} className="italic text-foreground/90">
              {italicPart}
            </em>
          );
        }
        return italicPart || null;
      }).filter(part => part !== null && part !== '');
    });
  };

  return (
    <div 
      ref={ref}
      className={`message-group flex w-full py-6 px-4 ${
        isAssistant ? 'bg-muted/30' : 'bg-background'
      } transition-colors duration-200`}
    >
      <div className="max-w-4xl mx-auto w-full flex gap-4">
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
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
          {/* Message content with enhanced formatting */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="text-foreground">
              {formatMessageContent(message.content)}
            </div>
          </div>

          {/* Timestamp and actions */}
          <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="timestamp-hover text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            
            {isAssistant && (
              <div className="timestamp-hover flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copy</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-green-400 hover:bg-accent transition-all duration-200"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-red-400 hover:bg-accent transition-all duration-200"
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
