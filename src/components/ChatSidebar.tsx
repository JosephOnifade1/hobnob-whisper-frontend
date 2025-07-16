
import React, { useState } from 'react';
import { MessageSquare, Plus, Settings, Menu, X, Trash2, Edit3, Video, Shield, Compass, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
}

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
  const [chatSessions] = useState<ChatSession[]>([
    { id: '1', title: 'Getting started with AI', timestamp: new Date() },
    { id: '2', title: 'Creative writing tips', timestamp: new Date(Date.now() - 86400000) },
    { id: '3', title: 'Code optimization help', timestamp: new Date(Date.now() - 172800000) },
  ]);

  const navigationItems = [
    { icon: MessageSquare, label: 'Chat', path: '/' },
    { icon: Video, label: 'Video Generation', path: '/video-generation' },
    { icon: Shield, label: 'Fake News Detection', path: '/fake-news-detection' },
    { icon: Compass, label: 'Explore Tools', path: '/explore' },
  ];

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
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onChatSelect(session.id)}
                className={`
                  group flex items-center px-3 py-2 rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${currentChatId === session.id 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
