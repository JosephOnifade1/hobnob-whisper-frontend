import React, { useState } from 'react';
import { ArrowLeft, Upload, Wand2, Download, User, Camera, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface GeneratedAvatar {
  id: string;
  prompt?: string;
  style: string;
  method: 'text-to-avatar' | 'photo-to-avatar';
  url: string;
  createdAt: Date;
}

const AvatarGenerator = () => {
  const navigate = useNavigate();
  const [textPrompt, setTextPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatars, setAvatars] = useState<GeneratedAvatar[]>([
    {
      id: '1',
      prompt: 'Professional business person with confident smile',
      style: 'Professional',
      method: 'text-to-avatar',
      url: '/placeholder.svg',
      createdAt: new Date(),
    },
    {
      id: '2',
      style: 'Cartoon',
      method: 'photo-to-avatar',
      url: '/placeholder.svg',
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setUploadedImage(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateFromText = async () => {
    if (!textPrompt.trim() || !style) {
      toast.error('Please enter a description and select a style');
      return;
    }

    setIsGenerating(true);
    
    // Simulate Runway API call
    setTimeout(() => {
      const newAvatar: GeneratedAvatar = {
        id: Date.now().toString(),
        prompt: textPrompt,
        style,
        method: 'text-to-avatar',
        url: '/placeholder.svg',
        createdAt: new Date(),
      };
      
      setAvatars(prev => [newAvatar, ...prev]);
      setTextPrompt('');
      setIsGenerating(false);
      toast.success('Avatar generated successfully!');
    }, 3000);
  };

  const handleGenerateFromPhoto = async () => {
    if (!uploadedImage || !style) {
      toast.error('Please upload an image and select a style');
      return;
    }

    setIsGenerating(true);
    
    // Simulate Runway API call
    setTimeout(() => {
      const newAvatar: GeneratedAvatar = {
        id: Date.now().toString(),
        style,
        method: 'photo-to-avatar',
        url: '/placeholder.svg',
        createdAt: new Date(),
      };
      
      setAvatars(prev => [newAvatar, ...prev]);
      setUploadedImage(null);
      setUploadPreview('');
      setIsGenerating(false);
      toast.success('Avatar generated from photo!');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2e2e2e] p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
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
              AI Avatar Generator
            </h1>
            <p className="text-gray-400">Create stunning avatars using Runway Gen-2 technology</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="space-y-6">
            <Card className="bg-[#1e1e1e] border-[#2e2e2e]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  Generate Avatar
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create AI avatars from text descriptions or transform your photos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-[#2e2e2e]">
                    <TabsTrigger value="text" className="data-[state=active]:bg-[#3e3e3e] text-gray-300">
                      Text to Avatar
                    </TabsTrigger>
                    <TabsTrigger value="photo" className="data-[state=active]:bg-[#3e3e3e] text-gray-300">
                      Photo to Avatar
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Avatar Description
                      </label>
                      <Textarea
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        placeholder="Describe the avatar you want to create... (e.g., 'Professional business person with confident smile, wearing a blue suit')"
                        className="min-h-[120px] bg-[#2e2e2e] border-[#3e3e3e] text-white placeholder-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Avatar Style
                      </label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-[#2e2e2e] border-[#3e3e3e] text-white">
                          <SelectValue placeholder="Choose a style" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2e2e2e] border-[#3e3e3e]">
                          <SelectItem value="realistic">Realistic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="cartoon">Cartoon</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGenerateFromText}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isGenerating ? (
                        <>
                          <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Avatar...
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 mr-2" />
                          Generate Avatar
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="photo" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload Photo
                      </label>
                      <div className="border-2 border-dashed border-[#3e3e3e] rounded-lg p-6 text-center hover:border-[#4e4e4e] transition-colors">
                        {uploadPreview ? (
                          <div className="space-y-4">
                            <img 
                              src={uploadPreview} 
                              alt="Upload preview" 
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setUploadedImage(null);
                                setUploadPreview('');
                              }}
                              className="border-[#3e3e3e] text-gray-300 hover:bg-[#2e2e2e]"
                            >
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <FileImage className="h-12 w-12 text-gray-400 mx-auto" />
                            <div>
                              <p className="text-gray-300 mb-2">Upload your photo</p>
                              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="photo-upload"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('photo-upload')?.click()}
                              className="border-[#3e3e3e] text-gray-300 hover:bg-[#2e2e2e]"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Transformation Style
                      </label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-[#2e2e2e] border-[#3e3e3e] text-white">
                          <SelectValue placeholder="Choose a style" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2e2e2e] border-[#3e3e3e]">
                          <SelectItem value="cartoon">Cartoon</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="oil-painting">Oil Painting</SelectItem>
                          <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                          <SelectItem value="vintage">Vintage</SelectItem>
                          <SelectItem value="pixel-art">Pixel Art</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGenerateFromPhoto}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isGenerating ? (
                        <>
                          <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                          Transforming Photo...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Transform Photo
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Style Examples */}
            <Card className="bg-[#1e1e1e] border-[#2e2e2e]">
              <CardHeader>
                <CardTitle className="text-white">Style Examples</CardTitle>
                <CardDescription className="text-gray-400">
                  Preview different avatar styles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {['Realistic', 'Cartoon', 'Anime', 'Professional', 'Artistic', 'Cyberpunk'].map((styleType) => (
                    <div key={styleType} className="text-center">
                      <div className="aspect-square bg-[#2e2e2e] rounded-lg mb-2 flex items-center justify-center border border-[#3e3e3e]">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-300">{styleType}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avatar Gallery */}
          <div className="space-y-6">
            <Card className="bg-[#1e1e1e] border-[#2e2e2e]">
              <CardHeader>
                <CardTitle className="text-white">Your Generated Avatars</CardTitle>
                <CardDescription className="text-gray-400">
                  View and download your created avatars
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {avatars.map((avatar) => (
                    <div key={avatar.id} className="border border-[#2e2e2e] rounded-lg p-4 hover:bg-[#252525] transition-colors">
                      <div className="flex gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 bg-[#2e2e2e] rounded-lg flex items-center justify-center border border-[#3e3e3e]">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">
                            {avatar.method === 'text-to-avatar' ? 'Text Generated' : 'Photo Transformed'}
                          </h4>
                          {avatar.prompt && (
                            <p className="text-sm text-gray-400 mb-2">{avatar.prompt}</p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-[#2e2e2e] px-2 py-1 rounded text-gray-300">
                              {avatar.style}
                            </span>
                            <span className="text-xs text-gray-500">
                              {avatar.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" className="border-[#3e3e3e] text-gray-300 hover:bg-[#2e2e2e]">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarGenerator;