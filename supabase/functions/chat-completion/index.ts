
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, isGuest = false, provider = 'openai' } = await req.json();
    
    console.log('Chat completion request:', { 
      messageCount: messages?.length, 
      conversationId, 
      userId,
      isGuest,
      provider 
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and cannot be empty');
    }

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const deepSeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

    // Validate API key based on provider
    if (provider === 'openai' && !openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    if (provider === 'deepseek' && !deepSeekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // For guest users, we don't need Supabase authentication
    if (!isGuest) {
      // Initialize Supabase client only for authenticated users
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify user authentication for non-guest requests
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header is required for authenticated requests');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        throw new Error('Invalid authentication token');
      }

      if (userId && user.id !== userId) {
        throw new Error('User ID mismatch');
      }
    }

    // Call appropriate AI API based on provider
    console.log(`Calling ${provider} API...`);
    let aiResponse;
    let aiMessage;

    if (provider === 'deepseek') {
      // Call DeepSeek API
      aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepSeekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });
    } else {
      // Call OpenAI API (default)
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
    }

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      console.error(`${provider} API error:`, { status: aiResponse.status, statusText: aiResponse.statusText, errorData });
      
      // More specific error handling for both providers
      if (aiResponse.status === 401) {
        if (provider === 'deepseek') {
          throw new Error('DeepSeek API key is invalid or expired. Please check your API key configuration.');
        } else if (provider === 'openai') {
          throw new Error('OpenAI API key is invalid or expired. Please check your API key configuration.');
        }
      }
      
      throw new Error(errorData.error?.message || `${provider} API error: ${aiResponse.status} - ${aiResponse.statusText}`);
    }

    const data = await aiResponse.json();
    aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error(`No response generated from ${provider}`);
    }

    console.log(`${provider} response received successfully`);

    return new Response(JSON.stringify({
      message: aiMessage,
      usage: data.usage,
      provider: provider,
      isGuest,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
