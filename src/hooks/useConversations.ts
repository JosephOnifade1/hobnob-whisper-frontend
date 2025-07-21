
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { conversationService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await conversationService.getUserConversations(user.id);
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (title: string = 'New Conversation') => {
    if (!user) return null;
    
    try {
      const { data, error } = await conversationService.create({
        user_id: user.id,
        title,
      });
      if (error) throw error;
      
      await loadConversations();
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

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const { error } = await conversationService.update(id, { title });
      if (error) throw error;
      
      await loadConversations();
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
    try {
      const { error } = await conversationService.update(id, { is_deleted: true });
      if (error) throw error;
      
      await loadConversations();
      toast({
        title: "Success",
        description: "Conversation deleted.",
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

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;

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
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    conversations,
    loading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    refreshConversations: loadConversations,
  };
};
