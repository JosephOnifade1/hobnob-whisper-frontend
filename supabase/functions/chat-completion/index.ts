
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced AI service with multiple providers and streaming support

// Intelligent model selection based on query analysis
function selectOptimalProvider(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  // Use Claude for complex reasoning, coding, analysis
  if (lastMessage.includes('code') || lastMessage.includes('analyze') || 
      lastMessage.includes('explain') || lastMessage.includes('debug') ||
      lastMessage.includes('algorithm') || lastMessage.includes('logic')) {
    return 'claude';
  }
  
  // Use OpenAI for general conversation and quick responses
  if (lastMessage.length < 100 || lastMessage.includes('quick') || lastMessage.includes('simple')) {
    return 'openai';
  }
  
  // Use Grok for creative tasks and humor
  if (lastMessage.includes('creative') || lastMessage.includes('funny') || 
      lastMessage.includes('joke') || lastMessage.includes('story')) {
    return 'grok';
  }
  
  // Default to Claude for best quality
  return 'claude';
}

async function callClaudeAPI(messages, stream = false) {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) throw new Error('Claude API key not configured');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || 'You are a helpful AI assistant.',
      max_tokens: 4000,
      stream,
    }),
  });
  
  return response;
}

async function callOpenAIAPI(messages, stream = false) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) throw new Error('OpenAI API key not configured');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream,
    }),
  });
  
  return response;
}

async function callGrokAPI(messages, stream = false) {
  const xaiApiKey = Deno.env.get('XAI_API_KEY');
  if (!xaiApiKey) throw new Error('Grok API key not configured');
  
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${xaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream,
    }),
  });
  
  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, isGuest = false, provider, stream = true } = await req.json();
    
    // Select optimal provider if not specified
    const selectedProvider = provider || selectOptimalProvider(messages);
    
    console.log('Enhanced chat completion request:', { 
      messageCount: messages?.length, 
      conversationId, 
      userId,
      isGuest,
      provider: selectedProvider,
      streaming: stream
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and cannot be empty');
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

    // Call the selected AI provider
    let aiResponse;
    
    if (selectedProvider === 'claude') {
      console.log('Using Claude API (Sonnet)');
      aiResponse = await callClaudeAPI(messages, stream);
    } else if (selectedProvider === 'openai') {
      console.log('Using OpenAI API (GPT-4.1)');
      aiResponse = await callOpenAIAPI(messages, stream);
    } else {
      console.log('Using Grok API (default)');
      aiResponse = await callGrokAPI(messages, stream);
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`${selectedProvider} API error:`, { status: aiResponse.status, statusText: aiResponse.statusText, errorText });
      
      // Fallback to another provider if the primary fails
      if (selectedProvider !== 'grok') {
        console.log('Primary provider failed, falling back to Grok');
        aiResponse = await callGrokAPI(messages, false);
        if (!aiResponse.ok) {
          throw new Error(`All providers failed. Last error: ${aiResponse.status} - ${aiResponse.statusText}`);
        }
      } else {
        throw new Error(`${selectedProvider} API error: ${aiResponse.status} - ${aiResponse.statusText}`);
      }
    }

    // Handle streaming response
    if (stream && aiResponse.headers.get('content-type')?.includes('text/plain')) {
      console.log('Streaming response detected');
      
      // Create a readable stream to process the response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = aiResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    let content = '';
                    
                    if (selectedProvider === 'claude' && parsed.delta?.text) {
                      content = parsed.delta.text;
                    } else if (selectedProvider === 'openai' && parsed.choices?.[0]?.delta?.content) {
                      content = parsed.choices[0].delta.content;
                    } else if (selectedProvider === 'grok' && parsed.choices?.[0]?.delta?.content) {
                      content = parsed.choices[0].delta.content;
                    }
                    
                    if (content) {
                      const streamData = `data: ${JSON.stringify({ content, provider: selectedProvider })}\n\n`;
                      controller.enqueue(encoder.encode(streamData));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const data = await aiResponse.json();
    let aiMessage = '';
    let usage = {};

    if (selectedProvider === 'claude') {
      aiMessage = data.content?.[0]?.text || '';
      usage = data.usage || {};
    } else if (selectedProvider === 'openai' || selectedProvider === 'grok') {
      aiMessage = data.choices?.[0]?.message?.content || '';
      usage = data.usage || {};
    }

    if (!aiMessage) {
      throw new Error(`No response generated from ${selectedProvider}`);
    }

    console.log(`${selectedProvider} response received successfully`);

    const response = {
      message: aiMessage,
      usage,
      provider: selectedProvider,
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
