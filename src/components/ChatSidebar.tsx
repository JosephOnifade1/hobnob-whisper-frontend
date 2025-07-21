
import React from 'react';
import { Plus, Settings, X, User, Crown, Bot, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useConversations } from '@/hooks/useConversations';
import ConversationItem from './ConversationItem';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentChatId: string;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  currentChatId,
  onChatSelect,
  onNewChat
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
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
    await deleteConversation(id);
    if (id === currentChatId) {
      onNewChat();
    }
  };

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
          
          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 mb-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>

          <Button
            onClick={() => navigate('/account')}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white border-0"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>

        {/* Navigation */}
        <div className="p-2 border-b border-gray-700">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onToggle();
                }}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
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
          <Button 
            onClick={() => navigate('/account')}
            variant="ghost" 
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <User className="h-4 w-4 mr-3" />
            Account Settings
          </Button>
          <Button 
            onClick={() => navigate('/admin')}
            variant="ghost" 
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Settings className="h-4 w-4 mr-3" />
            Admin Dashboard
          </Button>
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Log Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
