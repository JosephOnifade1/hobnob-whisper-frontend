
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { conversationService, messageService } from '@/services/database';
import { ChatService } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  user_id: string;
  is_deleted: boolean;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, initializing } = useAuth();
  const { toast } = useToast();
  const loadingRef = useRef(false);

  // Store current conversation ID in localStorage for persistence
  const getCurrentConversationId = () => {
    if (!user) return null;
    return localStorage.getItem(`currentConversationId_${user.id}`);
  };

  const setCurrentConversationId = (conversationId: string | null) => {
    if (!user) return;
    if (conversationId) {
      localStorage.setItem(`currentConversationId_${user.id}`, conversationId);
    } else {
      localStorage.removeItem(`currentConversationId_${user.id}`);
    }
  };

  const loadConversations = async () => {
    if (!user || loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('Loading conversations for user:', user.id);
      const { data, error } = await conversationService.getUserConversations(user.id);
      
      if (error) {
        console.error('Error loading conversations:', error);
        throw error;
      }
      
      const validConversations = data || [];
      console.log('Loaded conversations:', validConversations.length);
      
      setConversations(validConversations);
      
      // Clean up stored conversation ID if it no longer exists
      const currentId = getCurrentConversationId();
      if (currentId && !validConversations.find(conv => conv.id === currentId)) {
        setCurrentConversationId(null);
      }
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const createConversation = async (title: string = 'New Conversation') => {
    if (!user) return null;
    
    try {
      console.log('Creating new conversation:', title);
      const { data, error } = await conversationService.create({
        user_id: user.id,
        title,
      });
      
      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      // Update local state immediately
      if (data) {
        setConversations(prev => [data, ...prev]);
        setCurrentConversationId(data.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createConversationWithMessage = async (firstMessage: string) => {
    if (!user) return null;
    
    try {
      // Generate title from the first message
      const title = await ChatService.generateTitle([{ role: 'user', content: firstMessage }]);
      
      console.log('Creating conversation with message, title:', title);
      
      // Create conversation with the generated title
      const { data, error } = await conversationService.create({
        user_id: user.id,
        title,
      });
      
      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      // Update local state immediately
      if (data) {
        setConversations(prev => [data, ...prev]);
        setCurrentConversationId(data.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating conversation with message:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    if (!user) return;
    
    try {
      console.log('Updating conversation title:', id, title);
      const { data, error } = await conversationService.update(id, { title });
      
      if (error) {
        console.error('Error updating conversation:', error);
        throw error;
      }
      
      // Update local state immediately
      if (data) {
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, title: data.title, updated_at: data.updated_at } : conv
        ));
      }
      
      toast({
        title: "Success",
        description: "Conversation title updated.",
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation title.",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (id: string) => {
    if (!user) return;
    
    try {
      console.log('Deleting conversation:', id);
      
      // Use the service method that properly handles deletion
      const { error } = await conversationService.delete(id);
      
      if (error) {
        console.error('Error deleting conversation:', error);
        throw error;
      }
      
      // Update local state immediately
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      // Clear stored conversation ID if it matches the deleted one
      if (getCurrentConversationId() === id) {
        setCurrentConversationId(null);
      }
      
      toast({
        title: "Success",
        description: "Conversation deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  };

  // Load conversations when user is available and not initializing
  useEffect(() => {
    if (user && !initializing) {
      loadConversations();
    } else if (!user) {
      // Clear conversations when user logs out
      setConversations([]);
    }
  }, [user, initializing]);

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for conversations');
    
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time conversation change:', payload);
          
          // Refresh conversations on any change
          setTimeout(() => {
            loadConversations();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    conversations,
    loading,
    createConversation,
    createConversationWithMessage,
    updateConversationTitle,
    deleteConversation,
    refreshConversations: loadConversations,
    getCurrentConversationId,
    setCurrentConversationId,
  };
};
