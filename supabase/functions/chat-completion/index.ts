
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image intent detection logic
const imageKeywords = [
  'generate an image', 'create an image', 'make an image', 'draw an image',
  'generate a picture', 'create a picture', 'make a picture', 'draw a picture',
  'show me an image', 'show me a picture', 'create artwork', 'generate artwork',
  'make artwork', 'draw me', 'paint me', 'illustrate', 'visualize',
  'design an image', 'design a picture', 'sketch', 'render an image', 'produce an image'
];

const imagePatterns = [
  /(?:generate|create|make|draw|show me|paint|illustrate|visualize|design|sketch|render|produce)\s+(?:an?\s+)?(?:image|picture|artwork|illustration|drawing|painting|sketch|visual|graphic)\s+(?:of|showing|depicting|with|featuring)\s+(.+)/i,
  /(?:can you|could you|please)\s+(?:generate|create|make|draw|show me|paint|illustrate|visualize|design|sketch|render|produce)\s+(?:an?\s+)?(?:image|picture|artwork|illustration|drawing|painting|sketch|visual|graphic)\s+(?:of|showing|depicting|with|featuring)?\s*(.+)/i,
  /(?:i want|i need|i'd like)\s+(?:an?\s+)?(?:image|picture|artwork|illustration|drawing|painting|sketch|visual|graphic)\s+(?:of|showing|depicting|with|featuring)\s+(.+)/i,
  /draw me\s+(.+)/i,
  /paint me\s+(.+)/i,
  /illustrate\s+(.+)/i,
  /visualize\s+(.+)/i
];

function analyzeImageIntent(message: string) {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Check for direct keyword matches
  const hasKeyword = imageKeywords.some(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );

  if (!hasKeyword) {
    return { hasImageIntent: false, originalMessage: message, confidence: 0 };
  }

  // Extract image prompt using patterns
  for (const pattern of imagePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const imagePrompt = match[1].trim();
      if (imagePrompt.length > 3) {
        return {
          hasImageIntent: true,
          imagePrompt,
          originalMessage: message,
          confidence: 0.9
        };
      }
    }
  }

  // Fallback extraction
  const keywordMatch = imageKeywords.find(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );

  if (keywordMatch) {
    const keywordIndex = normalizedMessage.indexOf(keywordMatch.toLowerCase());
    const afterKeyword = message.substring(keywordIndex + keywordMatch.length).trim();
    
    const ofMatch = afterKeyword.match(/^(?:of|showing|depicting|with|featuring)?\s*(.+)/i);
    if (ofMatch && ofMatch[1] && ofMatch[1].trim().length > 3) {
      return {
        hasImageIntent: true,
        imagePrompt: ofMatch[1].trim(),
        originalMessage: message,
        confidence: 0.7
      };
    }
  }

  return {
    hasImageIntent: true,
    imagePrompt: message,
    originalMessage: message,
    confidence: 0.5
  };
}

async function generateImageWithOpenAI(prompt: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
      output_format: 'png'
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Image API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}

async function generateImageWithGrok(prompt: string) {
  const xaiApiKey = Deno.env.get('XAI_API_KEY');
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${xaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-vision-beta',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate a high-quality image based on this prompt: ${prompt}. Return the image in base64 format.`
            }
          ]
        }
      ],
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const base64Match = content.match(/data:image\/[^;]+;base64,([^"]+)/);
  
  if (!base64Match) {
    throw new Error('No valid base64 image found in response');
  }
  
  return base64Match[1];
}

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

    // Get the last user message to check for image intent
    const lastUserMessage = messages[messages.length - 1];
    const imageIntent = lastUserMessage?.role === 'user' ? analyzeImageIntent(lastUserMessage.content) : null;

    console.log('Image intent analysis:', imageIntent);

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const deepSeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const xaiApiKey = Deno.env.get('XAI_API_KEY');

    // Validate API key based on provider
    if (provider === 'openai' && !openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    if (provider === 'deepseek' && !deepSeekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }
    if (provider === 'grok' && !xaiApiKey) {
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

    // Generate image if intent detected and user is authenticated
    let generatedImageData = null;
    if (imageIntent?.hasImageIntent && imageIntent.confidence > 0.5 && !isGuest && supabase && user) {
      try {
        console.log(`Generating image with prompt: "${imageIntent.imagePrompt}" using ${provider === 'grok' ? 'Grok' : 'OpenAI'}`);
        
        let base64Data;
        let imageProvider;
        
        if (provider === 'grok' && xaiApiKey) {
          // Use Grok for Enhanced Mode
          base64Data = await generateImageWithGrok(imageIntent.imagePrompt);
          imageProvider = 'grok';
        } else if (openAIApiKey) {
          // Use OpenAI for Lightning Mode or fallback
          base64Data = await generateImageWithOpenAI(imageIntent.imagePrompt);
          imageProvider = 'openai';
        } else {
          throw new Error('No image generation API available');
        }

        // Create image generation record
        const { data: generation, error: generationError } = await supabase
          .from('image_generations')
          .insert({
            user_id: user.id,
            conversation_id: conversationId,
            prompt: imageIntent.imagePrompt,
            status: 'pending'
          })
          .select()
          .single();

        if (generationError) {
          console.error('Error creating generation record:', generationError);
        } else {
          // Convert base64 to blob and upload
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const filename = `${user.id}/${generation.id}.png`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(filename, binaryData, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError && uploadData) {
            // Update generation record
            await supabase
              .from('image_generations')
              .update({
                status: 'completed',
                image_path: uploadData.path,
                completed_at: new Date().toISOString()
              })
              .eq('id', generation.id);

            // Get signed URL
            const { data: signedUrl } = await supabase.storage
              .from('generated-images')
              .createSignedUrl(uploadData.path, 3600);

            if (signedUrl?.signedUrl) {
              generatedImageData = {
                imageUrl: signedUrl.signedUrl,
                downloadUrl: signedUrl.signedUrl,
                prompt: imageIntent.imagePrompt,
                provider: imageProvider,
                generationId: generation.id
              };
              console.log('Image generated successfully:', generatedImageData);
            }
          }
        }
      } catch (imageError) {
        console.error('Image generation failed:', imageError);
        // Continue with text-only response
      }
    }

    // Prepare messages for AI (modify last message if image was requested)
    let processedMessages = [...messages];
    if (imageIntent?.hasImageIntent && generatedImageData) {
      // Modify the user's message to focus on text response
      const textOnlyRequest = imageIntent.originalMessage.replace(
        new RegExp(imageKeywords.join('|'), 'gi'),
        ''
      ).trim();
      
      if (textOnlyRequest.length > 0) {
        processedMessages[processedMessages.length - 1] = {
          ...lastUserMessage,
          content: `${textOnlyRequest} (Note: I'm also generating an image for you based on your request: "${imageIntent.imagePrompt}")`
        };
      } else {
        processedMessages[processedMessages.length - 1] = {
          ...lastUserMessage,
          content: `I'm generating an image for you based on your request: "${imageIntent.imagePrompt}". Please provide a brief description of what you've created.`
        };
      }
    }

    // Call appropriate AI API for text response
    console.log(`Calling ${provider} API for text response...`);
    let aiResponse;
    let aiMessage;

    if (provider === 'grok') {
      console.log('Using Grok API with model grok-beta');
      aiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: processedMessages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });
    } else if (provider === 'deepseek') {
      console.log('Using DeepSeek API with model deepseek-reasoner');
      aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepSeekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: processedMessages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });
    } else {
      console.log('Using OpenAI API with model gpt-4.1-2025-04-14');
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: processedMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
    }

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      console.error(`${provider} API error:`, { status: aiResponse.status, statusText: aiResponse.statusText, errorData });
      
      if (aiResponse.status === 401) {
        if (provider === 'grok') {
          throw new Error('Grok API key is invalid or expired. Please check your API key configuration.');
        } else if (provider === 'deepseek') {
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

    // Combine response with image data if available
    const response = {
      message: aiMessage,
      usage: data.usage,
      provider: provider,
      isGuest,
      generatedImage: generatedImageData
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
