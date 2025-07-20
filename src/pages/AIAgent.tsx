
import React, { useState } from 'react';
import { ArrowLeft, Bot, Zap, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AIAgent = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentModel, setAgentModel] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([
    'Agent initialized successfully',
    'Waiting for instructions...',
  ]);

  const handleStartAgent = () => {
    if (!agentName || !agentPrompt || !agentModel) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsRunning(true);
    setAgentLogs(prev => [...prev, `Starting agent: ${agentName}`, 'Agent is now active']);
    toast.success('AI Agent started successfully!');
  };

  const handleStopAgent = () => {
    setIsRunning(false);
    setAgentLogs(prev => [...prev, 'Agent stopped by user']);
    toast.info('AI Agent stopped');
  };

  const handleResetAgent = () => {
    setIsRunning(false);
    setAgentLogs(['Agent reset', 'Ready for new configuration']);
    setAgentName('');
    setAgentPrompt('');
    setAgentModel('');
    toast.info('AI Agent reset');
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
            <h1 className="text-2xl font-bold text-gray-900">AI Agent</h1>
            <p className="text-gray-600">Configure and manage your autonomous AI agent</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agent Configuration
                </CardTitle>
                <CardDescription>
                  Set up your AI agent with custom instructions and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter agent name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Instructions
                  </label>
                  <Textarea
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="Define the agent's role, goals, and behavior..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model
                  </label>
                  <Select value={agentModel} onValueChange={setAgentModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Flagship)</SelectItem>
                      <SelectItem value="o4-mini-2025-04-16">O4 Mini (Fast Reasoning)</SelectItem>
                      <SelectItem value="o3-2025-04-16">O3 (Advanced Reasoning)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  {!isRunning ? (
                    <Button
                      onClick={handleStartAgent}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Agent
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopAgent}
                      variant="destructive"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Agent
                    </Button>
                  )}
                  <Button
                    onClick={handleResetAgent}
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agent Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge 
                    className={isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {isRunning ? 'Running' : 'Stopped'}
                  </Badge>
                </div>
                {agentName && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">Agent Name:</span>
                    <span className="text-sm text-gray-600">{agentName}</span>
                  </div>
                )}
                {agentModel && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">Model:</span>
                    <span className="text-sm text-gray-600">{agentModel}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Agent Logs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Agent Activity Log
                </CardTitle>
                <CardDescription>
                  Monitor your agent's activities and responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg p-4 h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {agentLogs.map((log, index) => (
                      <div key={index} className="text-green-400 text-sm font-mono">
                        [{new Date().toLocaleTimeString()}] {log}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Capabilities</CardTitle>
                <CardDescription>
                  Available features for your AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autonomous Task Execution</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Multi-step Reasoning</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory & Context</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Custom Tools Integration</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pro</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Connections</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pro</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgent;
