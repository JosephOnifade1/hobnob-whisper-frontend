
import React, { useState } from 'react';
import { MessageSquare, Edit3, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConversationItemProps {
  id: string;
  title: string;
  lastMessageAt: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  id,
  title,
  lastMessageAt,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleEdit = () => {
    if (editTitle.trim() && editTitle !== title) {
      onEdit(id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div
      className={`
        group flex items-center px-3 py-2 rounded-lg cursor-pointer
        transition-colors duration-200
        ${isActive 
          ? 'bg-gray-700 text-white' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }
      `}
      onClick={() => !isEditing && onSelect(id)}
    >
      <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEdit();
              if (e.key === 'Escape') handleCancel();
            }}
            className="h-6 text-sm bg-gray-600 border-gray-500 text-white"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">{title}</div>
            <div className="text-xs text-gray-500">
              {formatTime(lastMessageAt)}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationItem;
