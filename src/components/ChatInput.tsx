import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TouchButton } from '@/components/ui/touch-button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useDeviceType } from '@/hooks/useDeviceType';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  Video, 
  Mic, 
  X,
  Sparkles
} from 'lucide-react';
import { ImageGenerationModal } from './ImageGenerationModal';
import { useAuth } from '@/contexts/AuthContext';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: any[]) => void;
  disabled?: boolean;
  conversationId?: string;
  providerId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  conversationId,
  providerId
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isMobile } = useDeviceType();
  const { user } = useAuth();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
      setShowAttachmentMenu(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (type: string) => {
    if (!fileInputRef.current) return;
    
    let accept = '';
    switch (type) {
      case 'image':
        accept = 'image/*';
        break;
      case 'document':
        accept = '.pdf,.doc,.docx,.txt,.rtf';
        break;
      case 'video':
        accept = 'video/*';
        break;
      case 'audio':
        accept = 'audio/*';
        break;
      default:
        accept = '*/*';
    }
    
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
    setShowAttachmentMenu(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const newAttachments = await Promise.all(
        files.map(async (file) => {
          // Create a preview URL for images
          let previewUrl = '';
          if (file.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(file);
          }
          
          return {
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl,
            uploadStatus: 'pending'
          };
        })
      );
      
      setAttachments(prev => [...prev, ...newAttachments]);
      
      toast({
        title: "Files added",
        description: `${files.length} file(s) ready to send`
      });
      
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Error",
        description: "Failed to process some files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Clean up preview URL if it exists
      if (newAttachments[index].previewUrl) {
        URL.revokeObjectURL(newAttachments[index].previewUrl);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleImageGenerated = (imageUrl: string, prompt: string, downloadUrl?: string) => {
    const imageAttachment = {
      type: 'generated-image',
      url: imageUrl,
      prompt: prompt,
      downloadUrl: downloadUrl,
      name: `Generated: ${prompt.substring(0, 50)}...`,
      uploadStatus: 'completed'
    };
    
    setAttachments(prev => [...prev, imageAttachment]);
    
    toast({
      title: "Image Generated",
      description: "AI-generated image added to your message"
    });
  };

  const AttachmentPreview = ({ attachment, index }: { attachment: any, index: number }) => (
    <div className="relative bg-muted rounded-lg p-2 flex items-center gap-2 text-sm">
      {attachment.type === 'generated-image' ? (
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <img 
            src={attachment.url} 
            alt={attachment.prompt}
            className="w-8 h-8 object-cover rounded"
          />
          <span className="truncate">{attachment.name}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {attachment.type.startsWith('image/') && (
            <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          {attachment.type.startsWith('video/') && (
            <Video className="h-4 w-4 text-purple-500 flex-shrink-0" />
          )}
          {attachment.type.startsWith('audio/') && (
            <Mic className="h-4 w-4 text-green-500 flex-shrink-0" />
          )}
          {(attachment.type.includes('pdf') || attachment.type.includes('document')) && (
            <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span className="truncate">{attachment.name}</span>
        </div>
      )}
      <TouchButton
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 flex-shrink-0 hover:bg-destructive/20"
        onClick={() => removeAttachment(index)}
      >
        <X className="h-3 w-3" />
      </TouchButton>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4 z-50">
        <div className="max-w-4xl mx-auto">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <AttachmentPreview 
                  key={index} 
                  attachment={attachment} 
                  index={index} 
                />
              ))}
            </div>
          )}

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <Card className="mb-3 p-2">
              <div className="grid grid-cols-2 gap-2">
                <TouchButton
                  variant="ghost"
                  className="justify-start gap-2 h-10"
                  onClick={() => handleFileUpload('image')}
                  disabled={disabled || isUploading}
                >
                  <Image className="h-4 w-4 text-blue-500" />
                  Upload Image
                </TouchButton>
                <TouchButton
                  variant="ghost"
                  className="justify-start gap-2 h-10"
                  onClick={() => setShowImageModal(true)}
                  disabled={disabled || !user}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Generate Image
                </TouchButton>
                <TouchButton
                  variant="ghost"
                  className="justify-start gap-2 h-10"
                  onClick={() => handleFileUpload('document')}
                  disabled={disabled || isUploading}
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  Document
                </TouchButton>
                <TouchButton
                  variant="ghost"
                  className="justify-start gap-2 h-10"
                  onClick={() => handleFileUpload('video')}
                  disabled={disabled || isUploading}
                >
                  <Video className="h-4 w-4 text-purple-500" />
                  Video
                </TouchButton>
              </div>
            </Card>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={user ? "Type your message..." : "Sign in to send messages..."}
                className="min-h-[44px] max-h-[120px] resize-none border-2 border-border/50 focus:border-primary/50 rounded-xl px-4 py-3 bg-background/50 backdrop-blur-sm"
                disabled={disabled || !user}
                rows={1}
              />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <TouchButton
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 rounded-xl hover:bg-accent/50"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                disabled={disabled || !user}
              >
                <Paperclip className="h-5 w-5" />
              </TouchButton>
              
              <TouchButton
                type="submit"
                size="sm"
                className="h-11 w-11 p-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={disabled || (!message.trim() && attachments.length === 0) || !user}
              >
                <Send className="h-5 w-5" />
              </TouchButton>
            </div>
          </form>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImageGenerated={handleImageGenerated}
        conversationId={conversationId || ''}
      />
    </>
  );
};

export default ChatInput;
