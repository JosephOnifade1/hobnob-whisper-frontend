
import React from 'react';
import { Home, MessageCircle, Settings, User, Bot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TouchButton } from '@/components/ui/touch-button';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: MessageCircle, label: 'Chat', path: '/' },
  { icon: Bot, label: 'AI Agent', path: '/ai-agent' },
  { icon: Settings, label: 'Settings', path: '/account' },
  { icon: User, label: 'Profile', path: '/account' },
];

const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <TouchButton
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              haptic
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[60px] rounded-xl transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </TouchButton>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;
