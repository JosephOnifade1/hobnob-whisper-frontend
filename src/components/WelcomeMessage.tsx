import { Bot, Sparkles, Zap, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WelcomeMessage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Hobnob AI</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your intelligent AI assistant that automatically selects the best model for every conversation.
          Fast, smart, and always ready to help.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-500/20 rounded-full w-fit mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Optimized model selection for quick responses to simple questions
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-500/20 rounded-full w-fit mx-auto mb-4">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-semibold mb-2">Super Smart</h3>
            <p className="text-sm text-muted-foreground">
              Advanced reasoning for complex problems, coding, and analysis
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-500/20 rounded-full w-fit mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-semibold mb-2">Creative & Fun</h3>
            <p className="text-sm text-muted-foreground">
              Engaging storytelling and creative content generation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-primary font-medium">Smart Mode Active</span>
          <span className="text-muted-foreground">• Automatic model selection enabled</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;