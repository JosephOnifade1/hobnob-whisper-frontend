
import React, { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AnalysisResult {
  id: string;
  content: string;
  credibilityScore: number;
  credibilityLevel: 'High' | 'Medium' | 'Low' | 'Very Low';
  explanation: string;
  sources: Array<{
    title: string;
    url: string;
    reliability: string;
  }>;
  biasLevel: string;
  factChecks: Array<{
    organization: string;
    rating: string;
    url: string;
  }>;
  analyzedAt: Date;
}

const FakeNewsDetection = () => {
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([
    {
      id: '1',
      content: 'Scientists discover new renewable energy source...',
      credibilityScore: 85,
      credibilityLevel: 'High',
      explanation: 'This claim is supported by peer-reviewed research and multiple credible sources.',
      sources: [
        { title: 'Nature Journal', url: '#', reliability: 'High' },
        { title: 'Scientific American', url: '#', reliability: 'High' },
      ],
      biasLevel: 'Minimal',
      factChecks: [
        { organization: 'Reuters Fact Check', rating: 'True', url: '#' },
      ],
      analyzedAt: new Date(),
    },
  ]);

  const handleAnalyze = async (content: string, isUrl: boolean = false) => {
    if (!content.trim()) {
      toast.error(isUrl ? 'Please enter a URL' : 'Please enter text to analyze');
      return;
    }

    setIsAnalyzing(true);

    // Simulate analysis
    setTimeout(() => {
      const newResult: AnalysisResult = {
        id: Date.now().toString(),
        content: isUrl ? `Analysis of: ${content}` : content.substring(0, 100) + '...',
        credibilityScore: Math.floor(Math.random() * 100),
        credibilityLevel: ['High', 'Medium', 'Low', 'Very Low'][Math.floor(Math.random() * 4)] as any,
        explanation: 'Analysis completed using multiple fact-checking databases and source verification.',
        sources: [
          { title: 'Source 1', url: '#', reliability: 'High' },
          { title: 'Source 2', url: '#', reliability: 'Medium' },
        ],
        biasLevel: ['Minimal', 'Slight', 'Moderate', 'High'][Math.floor(Math.random() * 4)],
        factChecks: [
          { organization: 'Fact Check Org', rating: 'Verified', url: '#' },
        ],
        analyzedAt: new Date(),
      };

      setResults(prev => [newResult, ...prev]);
      setTextInput('');
      setUrlInput('');
      setIsAnalyzing(false);
      toast.success('Analysis completed!');
    }, 2000);
  };

  const getCredibilityColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-orange-100 text-orange-800';
      case 'Very Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCredibilityIcon = (level: string) => {
    switch (level) {
      case 'High': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fake News Detection</h1>
            <p className="text-gray-600">Analyze news claims for credibility and bias</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Analysis Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Fact Check Analysis
                </CardTitle>
                <CardDescription>
                  Enter text or a URL to analyze for credibility and bias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Text Analysis</TabsTrigger>
                    <TabsTrigger value="url">URL Analysis</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        News Text or Claim
                      </label>
                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Paste the news article or claim you want to fact-check..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <Button
                      onClick={() => handleAnalyze(textInput)}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <Search className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Analyze Text
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        News Article URL
                      </label>
                      <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/news-article"
                        type="url"
                      />
                    </div>
                    <Button
                      onClick={() => handleAnalyze(urlInput, true)}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <Search className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Analyze URL
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>How Our Analysis Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">1</div>
                  <p className="text-sm text-gray-600">Source verification against credible databases</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">2</div>
                  <p className="text-sm text-gray-600">Cross-reference with fact-checking organizations</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">3</div>
                  <p className="text-sm text-gray-600">Bias and sentiment analysis</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">4</div>
                  <p className="text-sm text-gray-600">Generate comprehensive credibility report</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Review the credibility assessment and supporting evidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 mb-2">{result.content}</p>
                          <p className="text-xs text-gray-500">
                            Analyzed {result.analyzedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getCredibilityIcon(result.credibilityLevel)}
                          <Badge className={getCredibilityColor(result.credibilityLevel)}>
                            {result.credibilityLevel}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Credibility Score</span>
                            <span className="text-sm font-semibold">{result.credibilityScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.credibilityScore >= 70 ? 'bg-green-500' :
                                result.credibilityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${result.credibilityScore}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-1">Explanation</h5>
                          <p className="text-sm text-gray-600">{result.explanation}</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-1">Bias Level</h5>
                          <Badge variant="outline">{result.biasLevel}</Badge>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2">Sources</h5>
                          <div className="space-y-1">
                            {result.sources.map((source, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                                  {source.title}
                                  <ExternalLink className="h-3 w-3" />
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {source.reliability}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2">Fact Checks</h5>
                          <div className="space-y-1">
                            {result.factChecks.map((check, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                                  {check.organization}
                                  <ExternalLink className="h-3 w-3" />
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {check.rating}
                                </Badge>
                              </div>
                            ))}
                          </div>
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

export default FakeNewsDetection;
