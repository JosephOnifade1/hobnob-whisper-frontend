
import React from 'react';
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

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`
      flex w-full py-6 px-4
      ${isAssistant ? 'bg-gray-50' : 'bg-white'}
    `}>
      <div className="max-w-4xl mx-auto w-full flex gap-4">
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isAssistant 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
            : 'bg-gray-700 text-white'
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
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {message.content}
            </div>
          </div>

          {/* Actions */}
          {isAssistant && (
            <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-7 text-gray-500 hover:text-gray-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-gray-500 hover:text-gray-700"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-gray-500 hover:text-gray-700"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
