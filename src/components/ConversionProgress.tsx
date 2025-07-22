
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

interface ConversionProgressProps {
  progress: number;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ progress }) => {
  const getStatusText = (progress: number) => {
    if (progress < 20) return 'Initializing conversion...';
    if (progress < 40) return 'Processing document...';
    if (progress < 60) return 'Converting format...';
    if (progress < 80) return 'Optimizing output...';
    if (progress < 100) return 'Finalizing conversion...';
    return 'Conversion complete!';
  };

  return (
    <Card className="bg-[#1e1e1e] border-[#2e2e2e]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          Converting Document
        </CardTitle>
        <CardDescription className="text-gray-400">
          {getStatusText(progress)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-[#252525]"
          />
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg border border-[#3e3e3e]">
          <FileText className="h-6 w-6 text-blue-400" />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Processing your document</p>
            <p className="text-gray-400 text-xs">This may take a few moments depending on file size</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionProgress;
