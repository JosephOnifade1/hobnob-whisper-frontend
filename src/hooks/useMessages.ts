
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/database';

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const validateMessageOperation = async (targetConversationId: string) => {
    if (!user) {
      console.error('User not authenticated for message operation');
      throw new Error('User must be authenticated to save messages');
    }

    console.log('Validating message operation:', { 
      userId: user.id, 
      conversationId: targetConversationId 
    });

    // Verify conversation exists and belongs to user
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', targetConversationId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Conversation validation error:', error);
      throw new Error(`Conversation validation failed: ${error.message}`);
    }

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    console.log('Message operation validation successful');
    return true;
  };

  const loadMessages = async () => {
    if (!conversationId || !user) return;
    
    setLoading(true);
    try {
      console.log('Loading messages for conversation:', conversationId);
      
      // First validate we can access this conversation
      await validateMessageOperation(conversationId);
      
      const { data, error } = await messageService.getByConversationId(conversationId);
      
      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }
      
      const validMessages = (data || []) as ChatMessage[];
      console.log('Loaded messages:', validMessages.length);
      setMessages(validMessages);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = async (
    targetConversationId: string, 
    role: 'user' | 'assistant', 
    content: string,
    retryCount = 0
  ): Promise<ChatMessage | null> => {
    const maxRetries = 3;
    
    try {
      console.log('Attempting to save message:', { 
        conversationId: targetConversationId, 
        role, 
        contentLength: content.length,
        retryCount 
      });

      // Validate authentication and conversation ownership
      await validateMessageOperation(targetConversationId);

      const { data, error } = await messageService.create({
        conversation_id: targetConversationId,
        role,
        content,
      });

      if (error) {
        console.error('Message save error:', error);
        
        // Check if it's an RLS violation and we should retry
        if (error.message.includes('row-level security') && retryCount < maxRetries) {
          console.log(`RLS error encountered, retrying... (${retryCount + 1}/${maxRetries})`);
          
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return saveMessage(targetConversationId, role, content, retryCount + 1);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No message data returned from save operation');
      }

      console.log('Message saved successfully:', data.id);

      // Update local state if this is for the current conversation
      if (targetConversationId === conversationId) {
        setMessages(prev => {
          // Avoid duplicates by checking if message already exists
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data as ChatMessage];
        });

        // Update conversation's last_message_at timestamp for better memory context
        if (role === 'assistant') {
          try {
            await supabase
              .from('conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', targetConversationId);
          } catch (updateError) {
            console.warn('Could not update conversation timestamp:', updateError);
          }
        }
      }

      return data as ChatMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      
      if (retryCount >= maxRetries) {
        toast({
          title: "Error",
          description: "Failed to save message after multiple attempts. Please try again.",
          variant: "destructive",
        });
      }
      
      throw error;
    }
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId && user) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId, user?.id]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!conversationId || !user) return;

    console.log('Setting up real-time subscription for messages:', conversationId);
    
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Real-time message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up message subscription');
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  return {
    messages,
    loading,
    saveMessage,
    refreshMessages: loadMessages,
  };
};
