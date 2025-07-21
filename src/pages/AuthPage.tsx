
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import SignUpForm from '@/components/SignUpForm';
import SignInForm from '@/components/SignInForm';

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading, initializing } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading && !initializing) {
      console.log('User authenticated, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, loading, initializing, navigate]);

  const handleAuthSuccess = () => {
    // Navigation will happen automatically via useEffect when user state updates
    console.log('Authentication successful');
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is already authenticated, don't render the auth form
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Create your account to get started with Hobnob AI'
              : 'Sign in to your account to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSignUp ? (
            <SignUpForm 
              onSuccess={handleAuthSuccess}
              onSwitchToSignIn={() => setIsSignUp(false)}
            />
          ) : (
            <SignInForm 
              onSuccess={handleAuthSuccess}
              onSwitchToSignUp={() => setIsSignUp(true)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
