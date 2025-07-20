
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, conversationId, userId } = await req.json();
    console.log('Received request:', { conversationId, userId, messageCount: messages?.length });

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      // Provide specific error messages based on status code
      let userFriendlyError = 'Failed to get AI response';
      
      if (response.status === 429) {
        userFriendlyError = 'API rate limit exceeded. Please wait a moment before trying again.';
      } else if (response.status === 401) {
        userFriendlyError = 'API authentication failed. Please check your API key.';
      } else if (response.status === 402) {
        userFriendlyError = 'API quota exceeded. Please check your OpenAI billing and add credits.';
      } else if (response.status === 503) {
        userFriendlyError = 'OpenAI service is temporarily unavailable. Please try again later.';
      } else if (response.status >= 500) {
        userFriendlyError = 'OpenAI service error. Please try again later.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyError,
          statusCode: response.status,
          details: errorData 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || '';
    console.log('Got AI response, length:', aiMessage.length);

    // Save messages to database if conversationId and userId are provided
    if (conversationId && userId) {
      try {
        // Save user message
        const userMessage = messages[messages.length - 1];
        if (userMessage.role === 'user') {
          const { error: userMessageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'user',
              content: userMessage.content,
            });

          if (userMessageError) {
            console.error('Error saving user message:', userMessageError);
          }
        }

        // Save AI response
        const { error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiMessage,
          });

        if (aiMessageError) {
          console.error('Error saving AI message:', aiMessageError);
        }

        // Update conversation updated_at
        const { error: conversationError } = await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        if (conversationError) {
          console.error('Error updating conversation:', conversationError);
        }

        // Log tool usage
        const { error: logError } = await supabase
          .from('tool_usage_logs')
          .insert({
            user_id: userId,
            tool_name: 'chat-completion',
            usage_data: {
              model: 'gpt-4.1-2025-04-14',
              prompt_tokens: data.usage?.prompt_tokens || 0,
              completion_tokens: data.usage?.completion_tokens || 0,
              total_tokens: data.usage?.total_tokens || 0,
            },
            success: true,
          });

        if (logError) {
          console.error('Error logging tool usage:', logError);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue execution even if database operations fail
      }
    }

    return new Response(
      JSON.stringify({
        message: aiMessage,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
