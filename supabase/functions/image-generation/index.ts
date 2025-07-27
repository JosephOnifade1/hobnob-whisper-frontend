
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateWithOpenAI(prompt: string, aspectRatio = '1:1') {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  console.log(`Generating image with OpenAI: "${prompt}" and aspect ratio: ${aspectRatio}`);
  
  // Convert aspect ratio to OpenAI size format
  let size = '1024x1024';
  if (aspectRatio === '16:9' || aspectRatio === '1536:1024') {
    size = '1792x1024';
  } else if (aspectRatio === '9:16' || aspectRatio === '1024:1536') {
    size = '1024x1792';
  }
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "high",
      output_format: "png"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('OpenAI image generation completed');

  if (!result.data || !result.data[0] || !result.data[0].b64_json) {
    console.error('Unexpected OpenAI response format:', result);
    throw new Error('No image data received from OpenAI');
  }

  return result.data[0].b64_json;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      console.error('User not authenticated');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User not authenticated' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const { prompt, conversationId, messageId, aspectRatio } = await req.json();

    if (!prompt || !conversationId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Prompt and conversation ID are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if OpenAI API key is configured
    if (!Deno.env.get('OPENAI_API_KEY')) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY in the project settings.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create image generation record
    console.log('Creating image generation record...');
    const { data: generation, error: generationError } = await supabase
      .from('image_generations')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        message_id: messageId,
        prompt: prompt,
        status: 'pending'
      })
      .select()
      .single();

    if (generationError) {
      console.error('Error creating generation record:', generationError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to create generation record. Please ensure you are logged in and have proper permissions.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generation record created:', generation.id);

    try {
      console.log(`Starting image generation with OpenAI for prompt: "${prompt}"`);
      
      // Generate image with OpenAI
      const base64Data = await generateWithOpenAI(prompt, aspectRatio || '1:1');

      // Convert base64 to blob
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Generate unique filename
      const filename = `${user.id}/${generation.id}.png`;
      
      console.log('Uploading image to Supabase storage...');
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(filename, binaryData, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image to storage');
      }

      console.log('Image uploaded successfully:', uploadData.path);

      // Update generation record with success
      const { error: updateError } = await supabase
        .from('image_generations')
        .update({
          status: 'completed',
          image_path: uploadData.path,
          completed_at: new Date().toISOString()
        })
        .eq('id', generation.id);

      if (updateError) {
        console.error('Error updating generation record:', updateError);
      }

      // Get signed URL for the image
      const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from('generated-images')
        .createSignedUrl(uploadData.path, 3600);

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        throw new Error('Failed to create signed URL for image');
      }

      console.log('Image generation completed successfully');

      return new Response(JSON.stringify({
        success: true,
        imageUrl: signedUrl.signedUrl,
        generationId: generation.id,
        prompt: prompt,
        provider: 'openai',
        downloadUrl: signedUrl.signedUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error generating image:', error);
      
      // Update generation record with error
      await supabase
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', generation.id);

      return new Response(JSON.stringify({ 
        success: false,
        error: error.message.includes('OPENAI_API_KEY') 
          ? 'OpenAI API key not configured properly' 
          : `Failed to generate image: ${error.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
