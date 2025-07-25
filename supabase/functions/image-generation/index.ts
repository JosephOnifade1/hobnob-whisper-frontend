
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateWithOpenAI(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}

async function generateWithStability(prompt: string, aspectRatio = '1:1', outputFormat = 'png', model = 'core') {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('aspect_ratio', aspectRatio);
  formData.append('output_format', outputFormat);
  formData.append('model', model);

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('STABILITY_API_KEY')}`,
      'Accept': 'image/*'
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Stability API error:', response.status, errorText);
    throw new Error(`Stability API error: ${response.status} ${response.statusText}`);
  }

  // Response is binary image data
  const imageData = await response.arrayBuffer();
  
  // Convert to base64
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(imageData)));
  
  return base64Data;
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

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, conversationId, messageId, provider = 'stability', aspectRatio, outputFormat, model } = await req.json();

    if (!prompt || !conversationId) {
      return new Response(JSON.stringify({ error: 'Prompt and conversation ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create image generation record
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
      return new Response(JSON.stringify({ error: 'Failed to create generation record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      console.log(`Generating image with ${provider} provider`);
      
      let base64Data;
      if (provider === 'stability') {
        base64Data = await generateWithStability(prompt, aspectRatio, outputFormat, model);
      } else if (provider === 'openai') {
        base64Data = await generateWithOpenAI(prompt);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Convert base64 to blob
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Generate unique filename
      const filename = `${user.id}/${generation.id}.png`;
      
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
      const { data: signedUrl } = await supabase.storage
        .from('generated-images')
        .createSignedUrl(uploadData.path, 3600);

      return new Response(JSON.stringify({
        success: true,
        imageUrl: signedUrl?.signedUrl,
        generationId: generation.id,
        prompt: prompt,
        provider: provider,
        downloadUrl: signedUrl?.signedUrl
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
        error: 'Failed to generate image', 
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
