
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatServiceOptions {
  conversationId?: string;
  userId?: string;
}

export class ChatService {
  static async sendMessage(
    messages: ChatMessage[], 
    options: ChatServiceOptions = {}
  ): Promise<ChatResponse> {
    try {
      console.log('Sending message to chat service:', { messages: messages.length, options });
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages,
          conversationId: options.conversationId,
          userId: options.userId,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Chat service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from chat service');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        message: data.message || '',
        usage: data.usage,
      };
    } catch (error) {
      console.error('ChatService error:', error);
      throw error;
    }
  }

  static async createConversation(userId: string, title?: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || 'New Conversation',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createConversation:', error);
      throw error;
    }
  }

  static async getConversationMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw error;
    }
  }
}
