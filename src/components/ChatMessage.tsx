import React, { forwardRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TouchButton } from '@/components/ui/touch-button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { AIProvider } from '@/services/aiService';
import { 
  User, 
  Bot, 
  Copy, 
  Download, 
  Image, 
  FileText, 
  Video, 
  Mic,
  Sparkles,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
  isError?: boolean;
  canRetry?: boolean;
  provider?: AIProvider;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(({ message }, ref) => {
  const { user } = useAuth();
  const { isMobile } = useDeviceType();
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const handleDownload = (attachment: any) => {
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name || 'download';
      link.click();
    }
  };

  const getProviderIcon = (provider?: AIProvider) => {
    switch (provider) {
      case 'openai':
        return <Zap className="h-3 w-3 text-blue-500" />;
      case 'grok':
        return <Sparkles className="h-3 w-3 text-purple-500" />;
      case 'deepseek':
        return <Zap className="h-3 w-3 text-green-500" />;
      default:
        return <Bot className="h-3 w-3" />;
    }
  };

  const getProviderName = (provider?: AIProvider) => {
    switch (provider) {
      case 'openai':
        return 'Lightning Mode';
      case 'grok':
        return 'Enhanced Mode';
      case 'deepseek':
        return 'DeepSeek Mode';
      default:
        return 'AI Assistant';
    }
  };

  const AttachmentPreview = ({ attachment }: { attachment: any }) => {
    const isGeneratedImage = attachment.type === 'generated-image';
    
    return (
      <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
        {isGeneratedImage ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Generated Image</span>
            </div>
            <img 
              src={attachment.url} 
              alt={attachment.prompt || 'Generated image'}
              className="w-full max-w-md rounded-lg shadow-sm"
            />
            {attachment.prompt && (
              <p className="text-sm text-muted-foreground italic">
                "{attachment.prompt}"
              </p>
            )}
            <div className="flex gap-2">
              <TouchButton
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => handleDownload(attachment)}
              >
                <Download className="h-4 w-4" />
                Download
              </TouchButton>
              <TouchButton
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View Full Size
              </TouchButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {attachment.type?.startsWith('image/') && (
                <Image className="h-5 w-5 text-blue-500" />
              )}
              {attachment.type?.startsWith('video/') && (
                <Video className="h-5 w-5 text-purple-500" />
              )}
              {attachment.type?.startsWith('audio/') && (
                <Mic className="h-5 w-5 text-green-500" />
              )}
              {(attachment.type?.includes('pdf') || attachment.type?.includes('document')) && (
                <FileText className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              {attachment.size && (
                <p className="text-xs text-muted-foreground">
                  {(attachment.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            {attachment.previewUrl && attachment.type?.startsWith('image/') && (
              <img 
                src={attachment.previewUrl} 
                alt={attachment.name}
                className="w-12 h-12 object-cover rounded"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={ref} className="group">
      <Card className="glass-card border-border/50 backdrop-blur-sm">
        <div className={`p-4 ${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                {message.role === 'user' ? (
                  <>
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-600/20 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {message.role === 'user' ? (
                    user?.user_metadata?.full_name || user?.email || 'You'
                  ) : (
                    'Hobnob AI'
                  )}
                </span>
                {message.role === 'assistant' && message.provider && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {getProviderIcon(message.provider)}
                    {getProviderName(message.provider)}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              {message.content && (
                <div className={`prose prose-sm max-w-none ${
                  message.isError ? 'text-destructive' : 'text-foreground'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              )}
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <AttachmentPreview key={index} attachment={attachment} />
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <TouchButton
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </TouchButton>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
