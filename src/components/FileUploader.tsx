
import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileSelect, 
  acceptedTypes = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.txt'],
  maxSize = 50 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error(`File type ${fileExtension} is not supported`);
      return false;
    }

    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      toast.error('Please select only one file at a time');
      return;
    }

    const file = files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
      toast.success('File uploaded successfully!');
    }
  }, [onFileSelect, maxSize, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
      toast.success('File uploaded successfully!');
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer
        ${isDragOver 
          ? 'border-blue-400 bg-blue-400/10' 
          : 'border-[#3e3e3e] hover:border-[#4e4e4e] bg-[#252525] hover:bg-[#2a2a2a]'
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className={`
          p-3 rounded-full mb-4 transition-colors
          ${isDragOver ? 'bg-blue-400/20' : 'bg-[#3e3e3e]'}
        `}>
          <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-400' : 'text-gray-400'}`} />
        </div>
        
        <h3 className="text-lg font-medium text-white mb-2">
          {isDragOver ? 'Drop your file here' : 'Upload Document'}
        </h3>
        
        <p className="text-gray-400 mb-4">
          Drag and drop your file here, or click to browse
        </p>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>Supported formats: {acceptedTypes.join(', ')}</p>
          <p>Maximum file size: {maxSize}MB</p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="mt-4 bg-transparent border-[#3e3e3e] text-gray-300 hover:bg-[#3e3e3e] hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById('file-input')?.click();
          }}
        >
          Choose File
        </Button>
      </div>

      <input
        id="file-input"
        type="file"
        className="hidden"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
      />
    </div>
  );
};

export default FileUploader;
