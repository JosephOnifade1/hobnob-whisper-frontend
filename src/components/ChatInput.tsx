
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Camera, Upload, Image, Video, FileText, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
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
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
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
    <div className="border-t bg-white px-4 py-4 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="relative p-2 flex items-center gap-2 max-w-xs">
                {attachment.type === 'image' && attachment.preview && (
                  <img src={attachment.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                )}
                {attachment.type === 'video' && attachment.preview && (
                  <video src={attachment.preview} className="w-12 h-12 object-cover rounded" />
                )}
                {attachment.type === 'audio' && (
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span className="text-sm">Audio Recording</span>
                  </div>
                )}
                {attachment.type === 'file' && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate">{attachment.file.name}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
            {/* Attachment Menu */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {showAttachmentMenu && (
                <Card className="absolute bottom-full mb-2 left-0 p-2 min-w-[200px] z-10">
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileSelect('image')}
                      className="w-full justify-start"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileSelect('video')}
                      className="w-full justify-start"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Upload Video
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileSelect('file')}
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={captureCamera}
                      className="w-full justify-start"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Message input */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Hobnob AI..."
              disabled={disabled}
              className="flex-1 border-0 bg-transparent resize-none focus:ring-0 focus:outline-none min-h-[24px] max-h-32 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
            />

            {/* Voice recording button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            {/* Send button */}
            <Button
              type="submit"
              disabled={(!message.trim() && attachments.length === 0) || disabled}
              className={`
                p-2 rounded-xl transition-all duration-200
                ${(message.trim() || attachments.length > 0) && !disabled
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Footer text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Hobnob AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
