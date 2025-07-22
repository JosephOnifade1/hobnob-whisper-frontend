
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Camera, Upload, Image, Video, FileText, MicOff, X, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDeviceType } from '@/hooks/useDeviceType';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: any[]) => void;
  disabled?: boolean;
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  file: File;
  preview?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(80);
  const { isMobile } = useDeviceType();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      setShowAttachmentMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea and update container height
  useEffect(() => {
    if (textareaRef.current && containerRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${scrollHeight}px`;
      
      // Calculate total container height including attachments
      const baseHeight = 80; // Base padding and button height
      const textHeight = scrollHeight;
      const attachmentHeight = attachments.length > 0 ? 80 : 0;
      const totalHeight = baseHeight + Math.max(textHeight - 24, 0) + attachmentHeight;
      
      setInputHeight(totalHeight);
      
      // Update CSS custom property for dynamic padding
      document.documentElement.style.setProperty('--chat-input-height', `${totalHeight}px`);
    }
  }, [message, attachments.length]);

  const addAttachment = (file: File, type: Attachment['type']) => {
    const id = Date.now().toString();
    const attachment: Attachment = { id, type, file };

    if (type === 'image' || type === 'video') {
      attachment.preview = URL.createObjectURL(file);
    }

    setAttachments(prev => [...prev, attachment]);
    setShowAttachmentMenu(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleFileSelect = (type: 'image' | 'video' | 'file') => {
    const input = document.createElement('input');
    input.type = 'file';
    
    switch (type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'video':
        input.accept = 'video/*';
        break;
      case 'file':
        input.accept = '.pdf,.doc,.docx,.txt,.csv,.xlsx';
        break;
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error('File size must be less than 50MB');
          return;
        }
        addAttachment(file, type);
      }
    };
    
    input.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        addAttachment(audioFile, 'audio');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const captureCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            addAttachment(file, 'image');
          }
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg', 0.8);
      };
    } catch (error) {
      toast.error('Could not access camera');
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        fixed bottom-0 z-30
        left-0 right-0 lg:left-64
      `}
      style={{
        paddingBottom: `calc(${isMobile ? '80px' : '0px'} + env(safe-area-inset-bottom))`,
      }}
    >
      <div className="container-responsive">
        {/* Enhanced background with better coverage */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-background/80 pointer-events-none" />
        <div className="absolute inset-0 backdrop-blur-xl pointer-events-none" />
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3 relative z-10">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="glass-card relative p-3 flex items-center gap-3 max-w-xs transition-all duration-200 hover:shadow-xl">
                {attachment.type === 'image' && attachment.preview && (
                  <div className="relative">
                    <img src={attachment.preview} alt="Preview" className="w-12 h-12 object-cover rounded-md" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md" />
                  </div>
                )}
                {attachment.type === 'video' && attachment.preview && (
                  <div className="relative">
                    <video src={attachment.preview} className="w-12 h-12 object-cover rounded-md" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md flex items-center justify-center">
                      <Video className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                {attachment.type === 'audio' && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">Audio Recording</span>
                  </div>
                )}
                {attachment.type === 'file' && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[120px]">{attachment.file.name}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className={`glass-card transition-all duration-300 ${
            isFocused ? 'shadow-xl border-primary/30' : ''
          } ${isRecording ? 'border-red-400/50 shadow-red-400/20' : ''}`}>
            <div className={`${isMobile ? 'p-4' : 'p-4 lg:p-6'} flex items-end gap-4`}>
              {/* Attachment Menu */}
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className="text-muted-foreground hover:text-foreground p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 touch-target"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                {showAttachmentMenu && (
                  <Card className="absolute bottom-full mb-3 left-0 glass-card min-w-[220px] z-20 overflow-hidden">
                    <div className="p-2">
                      <div className="grid gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileSelect('image')}
                          className="w-full justify-start text-foreground hover:bg-accent/50 rounded-lg py-3 px-4 transition-all duration-200 touch-target"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                            <Image className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Upload Image</div>
                            <div className="text-xs text-muted-foreground">PNG, JPG, GIF up to 50MB</div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileSelect('video')}
                          className="w-full justify-start text-foreground hover:bg-accent/50 rounded-lg py-3 px-4 transition-all duration-200 touch-target"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                            <Video className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Upload Video</div>
                            <div className="text-xs text-muted-foreground">MP4, MOV up to 50MB</div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileSelect('file')}
                          className="w-full justify-start text-foreground hover:bg-accent/50 rounded-lg py-3 px-4 transition-all duration-200 touch-target"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Upload File</div>
                            <div className="text-xs text-muted-foreground">PDF, DOC, TXT, CSV</div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={captureCamera}
                          className="w-full justify-start text-foreground hover:bg-accent/50 rounded-lg py-3 px-4 transition-all duration-200 touch-target"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-3">
                            <Camera className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Take Photo</div>
                            <div className="text-xs text-muted-foreground">Capture with camera</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Message input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask anything..."
                  disabled={disabled}
                  className="border-0 bg-transparent resize-none focus:ring-0 focus:outline-none min-h-[24px] max-h-32 text-foreground placeholder-muted-foreground/70 text-base leading-relaxed p-0"
                  rows={1}
                  style={{ fontSize: isMobile ? '16px' : '14px' }}
                />
                {message.trim() && (
                  <div className="absolute top-0 right-0 text-xs text-muted-foreground/50 mt-1">
                    <Sparkles className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Language/Web toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 touch-target"
                >
                  <Globe className="h-5 w-5" />
                </Button>

                {/* Voice recording button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-xl transition-all duration-200 touch-target ${
                    isRecording 
                      ? 'text-red-400 bg-red-400/10 animate-pulse shadow-red-400/20 shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {/* Send button */}
                <Button
                  type="submit"
                  disabled={(!message.trim() && attachments.length === 0) || disabled}
                  className={`btn-primary p-3 rounded-xl transition-all duration-200 touch-target ${
                    (message.trim() || attachments.length > 0) && !disabled
                      ? 'opacity-100 hover:scale-105'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer text */}
        <p className="text-xs text-muted-foreground/70 text-center mt-4 relative z-10">
          Hobnob AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
