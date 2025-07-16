
import React, { useState } from 'react';
import { ArrowLeft, User, Crown, CreditCard, Bell, Shield, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UsageStats {
  chats: number;
  videosGenerated: number;
  factChecks: number;
  monthlyLimit: number;
}

const AccountSettings = () => {
  const navigate = useNavigate();
  const [currentPlan] = useState<'Free' | 'Pro'>('Free');
  const [email, setEmail] = useState('user@example.com');
  const [name, setName] = useState('John Doe');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    marketing: false,
  });

  const [usage] = useState<UsageStats>({
    chats: 47,
    videosGenerated: 3,
    factChecks: 12,
    monthlyLimit: 100,
  });

  const handleUpgrade = () => {
    toast.success('Redirecting to upgrade...');
    // In a real app, this would redirect to Stripe checkout
  };

  const handleCancelSubscription = () => {
    toast.error('Subscription cancelled');
  };

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive an email shortly.');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requested');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">Manage your account and billing preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={currentPlan === 'Pro' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                    {currentPlan}
                  </Badge>
                  {currentPlan === 'Free' && (
                    <span className="text-sm text-gray-600">Limited features</span>
                  )}
                </div>
                <p className="text-gray-600">
                  {currentPlan === 'Free' 
                    ? 'Enjoy basic features with usage limits'
                    : 'Full access to all premium features'
                  }
                </p>
              </div>
              {currentPlan === 'Free' ? (
                <Button onClick={handleUpgrade} className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              ) : (
                <Button variant="outline" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Track your feature usage and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usage.chats}</div>
                <p className="text-sm text-gray-600">Chat Messages</p>
                <div className="text-xs text-gray-500 mt-1">
                  {currentPlan === 'Free' ? `${usage.chats}/${usage.monthlyLimit}` : 'Unlimited'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{usage.videosGenerated}</div>
                <p className="text-sm text-gray-600">Videos Generated</p>
                <div className="text-xs text-gray-500 mt-1">
                  {currentPlan === 'Free' ? `${usage.videosGenerated}/5` : 'Unlimited'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{usage.factChecks}</div>
                <p className="text-sm text-gray-600">Fact Checks</p>
                <div className="text-xs text-gray-500 mt-1">
                  {currentPlan === 'Free' ? `${usage.factChecks}/20` : 'Unlimited'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive updates about your account and usage</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Browser Notifications</h4>
                <p className="text-sm text-gray-600">Get notified when analysis is complete</p>
              </div>
              <Switch
                checked={notifications.browser}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, browser: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Marketing Communications</h4>
                <p className="text-sm text-gray-600">Receive product updates and tips</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        {currentPlan === 'Pro' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Current Period</h4>
                  <p className="text-sm text-gray-600">December 1 - December 31, 2024</p>
                </div>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Next Billing Date</h4>
                  <p className="text-sm text-gray-600">January 1, 2025</p>
                </div>
                <span className="font-medium">$19.99</span>
              </div>
              <Separator />
              <Button variant="outline">Update Payment Method</Button>
              <Button variant="outline">Download Invoice</Button>
            </CardContent>
          </Card>
        )}

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-sm text-gray-600">Download a copy of your account data</p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
