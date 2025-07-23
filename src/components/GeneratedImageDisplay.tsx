
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import { ImageGenerationService } from '@/services/imageGenerationService';
import { useToast } from '@/components/ui/use-toast';

interface GeneratedImageDisplayProps {
  imageUrl: string;
  prompt: string;
  downloadUrl?: string;
  className?: string;
}

export const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({
  imageUrl,
  prompt,
  downloadUrl,
  className = ''
}) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const filename = `generated-${Date.now()}.png`;
      await ImageGenerationService.downloadImage(downloadUrl || imageUrl, filename);
      toast({
        title: "Success",
        description: "Image downloaded successfully!"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <img 
        src={imageUrl} 
        alt={prompt}
        className="w-full h-auto rounded-lg shadow-lg"
      />
      
      {/* Overlay with download button */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
        <Button
          onClick={handleDownload}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
      
      {/* Generated badge */}
      <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        AI Generated
      </div>
    </div>
  );
};
