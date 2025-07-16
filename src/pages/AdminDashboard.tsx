
import React, { useState } from 'react';
import { ArrowLeft, Users, MessageSquare, Video, Shield, DollarSign, TrendingUp, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface MetricData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'Features' | 'Models' | 'Limits';
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  const metrics: MetricData[] = [
    {
      title: 'Total Users',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Chat Messages',
      value: '45,692',
      change: '+8%',
      trend: 'up',
      icon: MessageSquare,
    },
    {
      title: 'Videos Generated',
      value: '1,293',
      change: '+24%',
      trend: 'up',
      icon: Video,
    },
    {
      title: 'Fact Checks',
      value: '8,756',
      change: '+15%',
      trend: 'up',
      icon: Shield,
    },
    {
      title: 'Revenue',
      value: '$18,450',
      change: '+32%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.4%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    {
      id: 'video-generation',
      name: 'Video Generation',
      description: 'Enable AI video generation feature',
      enabled: true,
      category: 'Features',
    },
    {
      id: 'fake-news-detection',
      name: 'Fake News Detection',
      description: 'Enable news credibility analysis',
      enabled: true,
      category: 'Features',
    },
    {
      id: 'gpt4-access',
      name: 'GPT-4 Access',
      description: 'Enable GPT-4 model for premium users',
      enabled: true,
      category: 'Models',
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      description: 'Enable DeepSeek V3 model access',
      enabled: false,
      category: 'Models',
    },
    {
      id: 'increased-limits',
      name: 'Increased Limits',
      description: 'Higher rate limits for all users',
      enabled: false,
      category: 'Limits',
    },
    {
      id: 'file-upload',
      name: 'File Upload',
      description: 'Allow users to upload files in chat',
      enabled: true,
      category: 'Features',
    },
  ]);

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'Pro', joinedAt: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', plan: 'Free', joinedAt: '2024-01-14' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', plan: 'Pro', joinedAt: '2024-01-13' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', plan: 'Free', joinedAt: '2024-01-12' },
  ];

  const handleToggleFeature = (id: string) => {
    setFeatureFlags(prev => prev.map(flag => 
      flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
    ));
    toast.success('Feature flag updated');
  };

  const categories = ['All', 'Features', 'Models', 'Limits'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFlags = featureFlags.filter(flag =>
    selectedCategory === 'All' || flag.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor usage, manage features, and view analytics</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Toggle features and model availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredFlags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{flag.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {flag.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{flag.description}</p>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => handleToggleFeature(flag.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Users
              </CardTitle>
              <CardDescription>
                Latest user registrations and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">Joined {user.joinedAt}</p>
                    </div>
                    <Badge variant={user.plan === 'Pro' ? 'default' : 'secondary'}>
                      {user.plan}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Users
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of various system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                </div>
                <h4 className="font-medium">API Status</h4>
                <p className="text-sm text-green-600">Operational</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                </div>
                <h4 className="font-medium">Database</h4>
                <p className="text-sm text-green-600">Operational</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                </div>
                <h4 className="font-medium">AI Models</h4>
                <p className="text-sm text-yellow-600">Degraded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
