
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
      model: 'claude-3-5-sonnet-20241022',
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
      model: 'gpt-4o',
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

// Multi-provider fallback with robust error handling
async function callWithFallback(messages, stream, primaryProvider) {
  const providers = ['claude', 'openai', 'grok'];
  
  // Put primary provider first
  if (primaryProvider && providers.includes(primaryProvider)) {
    const index = providers.indexOf(primaryProvider);
    providers.splice(index, 1);
    providers.unshift(primaryProvider);
  }

  let lastError;
  
  for (const provider of providers) {
    try {
      console.log(`🔄 Trying ${provider}...`);
      let response;
      
      if (provider === 'claude') {
        response = await callClaudeAPI(messages, stream);
      } else if (provider === 'openai') {
        response = await callOpenAIAPI(messages, stream);
      } else {
        response = await callGrokAPI(messages, stream);
      }
      
      if (response.ok) {
        console.log(`✅ ${provider} succeeded`);
        return { response, provider };
      } else {
        throw new Error(`${provider} API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ ${provider} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

// Enhanced memory context preparation
function prepareContextualMessages(messages, conversationHistory) {
  // Limit context to avoid token limits while maintaining relevance
  const recentMessages = messages.slice(-15);
  
  // Add conversation history for better context if available
  if (conversationHistory && conversationHistory.length > 0) {
    const historyContext = conversationHistory.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content.substring(0, 400) // Truncate long messages
    }));
    
    return [...historyContext, ...recentMessages];
  }
  
  return recentMessages;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId, isGuest = false, provider, stream = true } = await req.json();
    
    console.log('Enhanced chat completion request:', { 
      messageCount: messages?.length, 
      conversationId, 
      userId,
      isGuest,
      provider,
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
      
      // Create auth client for user validation
      const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('Authentication error:', authError);
        throw new Error('Invalid authentication token');
      }

      if (userId && authUser.id !== userId) {
        throw new Error('User ID mismatch');
      }

      user = authUser;
    }

    // Load conversation history for better context
    let conversationHistory = [];
    if (conversationId && supabase) {
      try {
        const { data: historyData } = await supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(10);
        
        conversationHistory = historyData || [];
        console.log(`📚 Loaded ${conversationHistory.length} historical messages for context`);
      } catch (error) {
        console.warn('Could not load conversation history:', error);
      }
    }

    // Prepare enhanced messages with context and personality
    const contextualMessages = prepareContextualMessages(messages, conversationHistory);
    const enhancedMessages = addHobnobPersonality(contextualMessages);
    const selectedProvider = provider || selectOptimalProvider(enhancedMessages);

    try {
      // Call AI with automatic fallback
      const { response: aiResponse, provider: usedProvider } = await callWithFallback(enhancedMessages, stream, selectedProvider);
      console.log(`🤖 Using ${usedProvider} for response`);
    

      // Handle streaming response with improved parsing
      if (stream) {
        const reader = aiResponse.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const readable = new ReadableStream({
          async start(controller) {
            try {
              let buffer = '';
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') {
                      controller.close();
                      return;
                    }

                    try {
                      const parsed = JSON.parse(data);
                      let content = '';

                      // Extract content based on provider format
                      if (usedProvider === 'claude' && parsed.delta?.text) {
                        content = parsed.delta.text;
                      } else if ((usedProvider === 'openai' || usedProvider === 'grok') && parsed.choices?.[0]?.delta?.content) {
                        content = parsed.choices[0].delta.content;
                      }

                      if (content) {
                        const streamData = `data: ${JSON.stringify({ content, provider: usedProvider })}\n\n`;
                        controller.enqueue(encoder.encode(streamData));
                      }
                    } catch (parseError) {
                      console.warn('Skipping malformed chunk:', data.substring(0, 100));
                      // Continue processing instead of failing
                    }
                  }
                }
              }
              
              controller.close();
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          }
        });

        return new Response(readable, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        // Handle non-streaming response
        const data = await aiResponse.json();
        let aiMessage = '';
        let usage = {};

        if (usedProvider === 'claude') {
          aiMessage = data.content?.[0]?.text || '';
          usage = data.usage || {};
        } else if (usedProvider === 'openai' || usedProvider === 'grok') {
          aiMessage = data.choices?.[0]?.message?.content || '';
          usage = data.usage || {};
        }

        if (!aiMessage) {
          throw new Error(`No response generated from ${usedProvider}`);
        }

        console.log(`✅ ${usedProvider} response received successfully`);

        const response = {
          message: aiMessage,
          usage,
          provider: usedProvider,
          isGuest,
          assistant: 'Hobnob AI'
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (allProvidersError) {
      console.error('❌ All providers failed:', allProvidersError);
      
      // Return fallback response to ensure user always gets a reply
      const fallbackContent = "I'm experiencing technical difficulties at the moment. Please try again in a few moments. If the issue persists, please check your internet connection.";
      
      if (stream) {
        const encoder = new TextEncoder();
        const fallbackStream = new ReadableStream({
          start(controller) {
            const streamData = `data: ${JSON.stringify({ content: fallbackContent, provider: 'fallback' })}\n\n`;
            controller.enqueue(encoder.encode(streamData));
            controller.close();
          }
        });

        return new Response(fallbackStream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        return new Response(JSON.stringify({
          message: fallbackContent,
          provider: 'fallback',
          isGuest,
          assistant: 'Hobnob AI',
          error: 'All AI providers temporarily unavailable'
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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
