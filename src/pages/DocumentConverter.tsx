
import React, { useState } from 'react';
import { ArrowLeft, Upload, Download, FileText, Image, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDeviceType } from '@/hooks/useDeviceType';
import { supabase } from '@/integrations/supabase/client';
import FileUploader from '@/components/FileUploader';
import ConversionProgress from '@/components/ConversionProgress';

const DocumentConverter = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedFileName, setConvertedFileName] = useState<string>('');

  const supportedFormats = {
    pdf: { label: 'PDF', icon: FileText, accepts: ['.pdf'] },
    docx: { label: 'Word Document', icon: FileType, accepts: ['.docx', '.doc'] },
    jpg: { label: 'JPEG Image', icon: Image, accepts: ['.jpg', '.jpeg'] },
    png: { label: 'PNG Image', icon: Image, accepts: ['.png'] },
    txt: { label: 'Text File', icon: FileText, accepts: ['.txt'] }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getAvailableTargetFormats = (sourceFormat: string) => {
    switch (sourceFormat) {
      case 'pdf':
        return ['txt'];
      case 'docx':
      case 'doc':
        return ['txt'];
      case 'jpg':
      case 'jpeg':
      case 'png':
        return ['pdf'];
      case 'txt':
        return ['pdf', 'docx'];
      default:
        return [];
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTargetFormat('');
    setConvertedFileUrl(null);
    setConversionProgress(0);
    setConvertedFileName('');
  };

  const handleConvert = async () => {
    if (!selectedFile || !targetFormat) {
      toast.error('Please select a file and target format');
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Please sign in to convert documents');
        setIsConverting(false);
        return;
      }

      // Create progress simulation
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('targetFormat', targetFormat);

      console.log('Starting conversion:', selectedFile.name, 'to', targetFormat);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('document-converter', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Conversion error:', error);
        throw new Error(error.message || 'Conversion failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      setConversionProgress(100);
      setConvertedFileUrl(data.downloadUrl);
      setConvertedFileName(data.convertedFileName);

      toast.success('Conversion completed successfully!');
      
      console.log('Conversion successful:', data);

    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(error instanceof Error ? error.message : 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (convertedFileUrl && convertedFileName) {
      try {
        const response = await fetch(convertedFileUrl);
        const blob = await response.blob();
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = convertedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(link.href);
        toast.success('File downloaded successfully!');
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      }
    }
  };

  const sourceFormat = selectedFile ? getFileExtension(selectedFile.name) : '';
  const availableTargets = sourceFormat ? getAvailableTargetFormats(sourceFormat) : [];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2e2e2e] p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tools')}
            className="text-gray-400 hover:text-white hover:bg-[#2e2e2e]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Document Converter
            </h1>
            <p className="text-gray-400">Convert between PDF, DOCX, JPG, PNG, and TXT formats</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="bg-[#1e1e1e] border-[#2e2e2e]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-400" />
                Upload Document
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose a file to convert (Max size: 50MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onFileSelect={handleFileSelect} />
              
              {selectedFile && (
                <div className="mt-4 p-4 bg-[#252525] rounded-lg border border-[#3e3e3e]">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {sourceFormat.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Options */}
          <Card className="bg-[#1e1e1e] border-[#2e2e2e]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileType className="h-5 w-5 text-purple-400" />
                Conversion Options
              </CardTitle>
              <CardDescription className="text-gray-400">
                Select the target format for conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Target Format</label>
                <Select value={targetFormat} onValueChange={setTargetFormat} disabled={!selectedFile}>
                  <SelectTrigger className="bg-[#252525] border-[#3e3e3e] text-white">
                    <SelectValue placeholder="Choose target format" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-[#3e3e3e]">
                    {availableTargets.map((format) => (
                      <SelectItem key={format} value={format} className="text-white hover:bg-[#3e3e3e]">
                        {supportedFormats[format as keyof typeof supportedFormats]?.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleConvert}
                disabled={!selectedFile || !targetFormat || isConverting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert Document'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        {isConverting && (
          <div className="mt-6">
            <ConversionProgress progress={conversionProgress} />
          </div>
        )}

        {/* Download Section */}
        {convertedFileUrl && !isConverting && (
          <Card className="mt-6 bg-[#1e1e1e] border-[#2e2e2e]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="h-5 w-5 text-green-400" />
                Download Converted File
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your file has been converted successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-[#252525] rounded-lg border border-[#3e3e3e]">
                <p className="text-white text-sm">
                  <span className="text-gray-400">Converted file:</span> {convertedFileName}
                </p>
              </div>
              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {targetFormat.toUpperCase()} File
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Supported Formats */}
        <Card className="mt-6 bg-[#1e1e1e] border-[#2e2e2e]">
          <CardHeader>
            <CardTitle className="text-white">Supported Conversions</CardTitle>
            <CardDescription className="text-gray-400">
              Available conversion options for each file type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(supportedFormats).map(([format, info]) => {
                const targets = getAvailableTargetFormats(format);
                if (targets.length === 0) return null;
                
                return (
                  <div key={format} className="p-3 bg-[#252525] rounded-lg border border-[#3e3e3e]">
                    <div className="flex items-center gap-2 mb-2">
                      <info.icon className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-medium">{info.label}</span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Converts to: {targets.map(f => 
                        supportedFormats[f as keyof typeof supportedFormats]?.label
                      ).join(', ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentConverter;
