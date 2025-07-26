
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced AI service with multiple providers and streaming support

// Enhanced intelligent model selection for Hobnob AI
function selectOptimalProvider(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const messageLength = lastMessage.length;
  
  // Use Claude for complex reasoning, coding, analysis, long-form content
  if (lastMessage.includes('code') || lastMessage.includes('analyze') || 
      lastMessage.includes('explain') || lastMessage.includes('debug') ||
      lastMessage.includes('algorithm') || lastMessage.includes('logic') ||
      lastMessage.includes('write') || lastMessage.includes('create') ||
      lastMessage.includes('complex') || messageLength > 200) {
    return 'claude';
  }
  
  // Use OpenAI for quick responses, simple questions, general chat
  if (messageLength < 100 || lastMessage.includes('quick') || 
      lastMessage.includes('simple') || lastMessage.includes('hello') ||
      lastMessage.includes('hi') || lastMessage.includes('what') ||
      lastMessage.includes('how') || lastMessage.includes('when')) {
    return 'openai';
  }
  
  // Use Grok for creative tasks, humor, storytelling
  if (lastMessage.includes('creative') || lastMessage.includes('funny') || 
      lastMessage.includes('joke') || lastMessage.includes('story') ||
      lastMessage.includes('imagine') || lastMessage.includes('generate') ||
      lastMessage.includes('fun') || lastMessage.includes('creative')) {
    return 'grok';
  }
  
  // Default to Claude for best overall quality
  return 'claude';
}

// Add Hobnob AI personality to messages
function addHobnobPersonality(messages) {
  const systemPrompt = {
    role: 'system',
    content: `You are Hobnob AI, a smart, helpful, and friendly AI assistant. Your personality traits:
- Intelligent and insightful, but approachable
- Clear and concise in explanations
- Adaptable to user's needs and communication style
- Proactive in offering helpful suggestions
- Professional yet warm in tone
- Quick to understand context and provide relevant responses

Always strive to be helpful, accurate, and engaging while maintaining your distinct Hobnob AI identity.`
  };
  
  // Check if system message already exists
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  if (hasSystemMessage) {
    return messages;
  }
  
  return [systemPrompt, ...messages];
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
      model: 'claude-opus-4-20250514',
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || 'You are Hobnob AI, a helpful and intelligent assistant.',
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
    
    // Add Hobnob AI personality and select optimal provider
    const enhancedMessages = addHobnobPersonality(messages);
    const selectedProvider = provider || selectOptimalProvider(enhancedMessages);
    
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
      console.log('Hobnob AI using Claude for complex reasoning');
      aiResponse = await callClaudeAPI(enhancedMessages, stream);
    } else if (selectedProvider === 'openai') {
      console.log('Hobnob AI using OpenAI for quick responses');
      aiResponse = await callOpenAIAPI(enhancedMessages, stream);
    } else {
      console.log('Hobnob AI using Grok for creative tasks');
      aiResponse = await callGrokAPI(enhancedMessages, stream);
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`${selectedProvider} API error:`, { status: aiResponse.status, statusText: aiResponse.statusText, errorText });
      
      // Hobnob AI fallback system
      if (selectedProvider !== 'grok') {
        console.log('Hobnob AI falling back to Grok for reliability');
        aiResponse = await callGrokAPI(enhancedMessages, false);
        if (!aiResponse.ok) {
          throw new Error(`Hobnob AI: All providers failed. Last error: ${aiResponse.status} - ${aiResponse.statusText}`);
        }
      } else {
        throw new Error(`Hobnob AI error: ${selectedProvider} API error: ${aiResponse.status} - ${aiResponse.statusText}`);
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

    console.log(`Hobnob AI (${selectedProvider}) response received successfully`);

    const response = {
      message: aiMessage,
      usage,
      provider: selectedProvider,
      isGuest,
      assistant: 'Hobnob AI'
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
