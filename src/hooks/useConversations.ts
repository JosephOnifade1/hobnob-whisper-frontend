
import { useState, useEffect } from 'react';
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

  const createConversationWithMessage = async (firstMessage: string) => {
    if (!user) return null;
    
    try {
      // Generate title from the first message
      const title = await ChatService.generateTitle([{ role: 'user', content: firstMessage }]);
      
      // Create conversation with the generated title
      const { data, error } = await conversationService.create({
        user_id: user.id,
        title,
      });
      if (error) throw error;
      
      await loadConversations();
      console.log('Created conversation with title:', title);
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
      console.log('Deleting conversation:', id);
      
      // First, delete all messages associated with this conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }
      
      // Then delete the conversation itself
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
      
      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        throw conversationError;
      }
      
      // Update local state immediately
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
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
    createConversationWithMessage,
    updateConversationTitle,
    deleteConversation,
    refreshConversations: loadConversations,
  };
};
