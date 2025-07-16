
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-white px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl p-3">
            {/* Attachment button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Message input */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Hobnob AI..."
              disabled={disabled}
              className="flex-1 border-0 bg-transparent resize-none focus:ring-0 focus:outline-none min-h-[24px] max-h-32 text-gray-800 placeholder-gray-500"
              rows={1}
            />

            {/* Voice input button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              className={`
                p-2 rounded-xl transition-all duration-200
                ${message.trim() && !disabled
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Footer text */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Hobnob AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
