
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: Grok models are text-only and do not support image generation
// Image generation has been removed as it's not supported by xAI's Grok models

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, isGuest = false } = await req.json();
    
    console.log('Chat completion request (Grok only):', { 
      messageCount: messages?.length, 
      conversationId, 
      userId,
      isGuest
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and cannot be empty');
    }

    // Note: Image generation is not supported by Grok models

    // Get API keys
    const xaiApiKey = Deno.env.get('XAI_API_KEY');

    if (!xaiApiKey) {
      throw new Error('Grok API key not configured');
    }

    // Initialize Supabase client for authenticated users
    let supabase;
    let user;
    if (!isGuest) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      supabase = createClient(supabaseUrl, supabaseServiceKey);

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header is required for authenticated requests');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('Authentication error:', authError);
        throw new Error('Invalid authentication token');
      }

      if (userId && authUser.id !== userId) {
        throw new Error('User ID mismatch');
      }

      user = authUser;
    }

    // No image generation - Grok models are text-only

    // Call Grok API for text response
    console.log('Using Grok API with model grok-3');
    const aiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      console.error('Grok API error:', { status: aiResponse.status, statusText: aiResponse.statusText, errorData });
      
      if (aiResponse.status === 401) {
        throw new Error('Grok API key is invalid or expired. Please check your API key configuration.');
      } else if (aiResponse.status === 403) {
        throw new Error('Access denied to Grok API. Please check your API key permissions and account credits.');
      } else if (aiResponse.status === 404) {
        throw new Error('Grok model not found. Please verify the model name and your API access.');
      } else if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(errorData.error?.message || `Grok API error: ${aiResponse.status} - ${aiResponse.statusText}`);
    }

    const data = await aiResponse.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response generated from Grok');
    }

    console.log('Grok response received successfully');

    // Return text-only response
    const response = {
      message: aiMessage,
      usage: data.usage,
      provider: 'grok',
      isGuest
    };

    return new Response(JSON.stringify(response), {
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
