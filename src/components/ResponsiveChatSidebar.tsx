import React from 'react';
import { Plus, Settings, X, User, Crown, Bot, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TouchButton } from '@/components/ui/touch-button';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import { useDeviceType } from '@/hooks/useDeviceType';
import ConversationItem from './ConversationItem';

interface ResponsiveChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentChatId: string;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
}

const ResponsiveChatSidebar: React.FC<ResponsiveChatSidebarProps> = ({
  isOpen,
  onToggle,
  currentChatId,
  onChatSelect,
  onNewChat
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { isMobile, isTablet } = useDeviceType();
  const { 
    conversations, 
    loading, 
    updateConversationTitle, 
    deleteConversation 
  } = useConversations();

  const navigationItems = [
    { icon: Bot, label: 'AI Agent', path: '/ai-agent' },
  ];

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      await signOut();
      console.log('Sign out completed, navigating to auth page');
      navigate('/auth');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    console.log('Deleting conversation:', id);
    
    const isDeletingCurrentChat = id === currentChatId;
    await deleteConversation(id);
    
    if (isDeletingCurrentChat) {
      console.log('Deleted current conversation, starting new chat');
      onNewChat();
    }
  };

  // On desktop, render the traditional sidebar
  if (!isMobile && !isTablet) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed lg:relative top-0 left-0 h-full bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex flex-col
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Hobnob AI
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <TouchButton
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 mb-4"
              haptic
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </TouchButton>

            <TouchButton
              onClick={() => navigate('/account')}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white border-0"
              haptic
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </TouchButton>
          </div>

          {/* Navigation */}
          <div className="p-2 border-b border-gray-700">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <TouchButton
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onToggle();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  haptic
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </TouchButton>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center text-gray-500 py-4">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    id={conversation.id}
                    title={conversation.title}
                    lastMessageAt={conversation.last_message_at}
                    isActive={currentChatId === conversation.id}
                    onSelect={onChatSelect}
                    onEdit={updateConversationTitle}
                    onDelete={handleDeleteConversation}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <TouchButton 
              onClick={() => navigate('/account')}
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              haptic
            >
              <User className="h-4 w-4 mr-3" />
              Account Settings
            </TouchButton>
            <TouchButton 
              onClick={() => navigate('/admin')}
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              haptic
            >
              <Settings className="h-4 w-4 mr-3" />
              Admin Dashboard
            </TouchButton>
            <TouchButton 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              haptic
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log Out
            </TouchButton>
          </div>
        </div>
      </>
    );
  }

  // On mobile/tablet, use responsive drawer
  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Hobnob AI
          </h1>
        </div>
        
        <TouchButton
          onClick={() => {
            onNewChat();
            onToggle();
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 mb-4"
          haptic
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </TouchButton>

        <TouchButton
          onClick={() => {
            navigate('/account');
            onToggle();
          }}
          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white border-0"
          haptic
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </TouchButton>
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-gray-700">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <TouchButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onToggle();
              }}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              haptic
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </TouchButton>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center text-gray-500 py-4">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                id={conversation.id}
                title={conversation.title}
                lastMessageAt={conversation.last_message_at}
                isActive={currentChatId === conversation.id}
                onSelect={(id) => {
                  onChatSelect(id);
                  onToggle();
                }}
                onEdit={updateConversationTitle}
                onDelete={handleDeleteConversation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <TouchButton 
          onClick={() => {
            navigate('/account');
            onToggle();
          }}
          variant="ghost" 
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          haptic
        >
          <User className="h-4 w-4 mr-3" />
          Account Settings
        </TouchButton>
        <TouchButton 
          onClick={() => {
            navigate('/admin');
            onToggle();
          }}
          variant="ghost" 
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          haptic
        >
          <Settings className="h-4 w-4 mr-3" />
          Admin Dashboard
        </TouchButton>
        <TouchButton 
          onClick={handleLogout}
          variant="ghost" 
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          haptic
        >
          <LogOut className="h-4 w-4 mr-3" />
          Log Out
        </TouchButton>
      </div>
    </div>
  );

  return (
    <ResponsiveDrawer
      trigger={<div />} // No trigger needed, controlled externally
      side="left"
      open={isOpen}
      onOpenChange={onToggle}
      className="w-[280px] p-0"
    >
      {sidebarContent}
    </ResponsiveDrawer>
  );
};

export default ResponsiveChatSidebar;
