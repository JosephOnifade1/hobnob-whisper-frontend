import { supabase } from '@/integrations/supabase/client';
import type { GeneratedImageData } from './aiService';

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
  generatedImage?: GeneratedImageData;
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
          provider: 'openai',
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
        generatedImage: data.generatedImage,
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

  static async saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw new Error(`Failed to save message: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      throw error;
    }
  }

  static async generateTitle(messages: ChatMessage[]): Promise<string> {
    try {
      // Take the first user message and generate a meaningful title
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
      
      if (!firstUserMessage) return 'New Conversation';
      
      // Create a more intelligent title from the first message
      let title = firstUserMessage.trim();
      
      // If it's a question, keep it concise
      if (title.length > 60) {
        title = title.substring(0, 60).trim();
        // Try to cut at a word boundary
        const lastSpace = title.lastIndexOf(' ');
        if (lastSpace > 30) {
          title = title.substring(0, lastSpace);
        }
        title += '...';
      }
      
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      return title;
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Conversation';
    }
  }

  static async updateConversationTitle(conversationId: string, title: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation title:', error);
        throw new Error(`Failed to update conversation title: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateConversationTitle:', error);
      throw error;
    }
  }
}
