
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create service role client for database operations (bypasses RLS)
const supabaseServiceRole = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Create client for auth verification
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

async function generateWithOpenAI(prompt: string, aspectRatio = '1:1') {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log(`Generating image with OpenAI - Prompt: ${prompt.substring(0, 50)}...`);
  const startTime = Date.now();

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
      size: aspectRatio === '16:9' ? '1792x1024' : aspectRatio === '9:16' ? '1024x1792' : '1024x1024',
      response_format: 'b64_json',
      quality: 'high',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const generationTime = Date.now() - startTime;
  
  console.log(`Image generated successfully in ${generationTime}ms`);
  
  return {
    imageData: data.data[0].b64_json,
    generationTime
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Image Generation Request Started ===');
    
    // Verify authentication using anon client
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid authentication' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated user: ${user.id}`);

    const { prompt, conversationId, messageId, aspectRatio } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Prompt is required' 
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

    // Create image generation record using service role (bypasses RLS)
    console.log('Creating image generation record...');
    const { data: generation, error: generationError } = await supabaseServiceRole
      .from('image_generations')
      .insert({
        user_id: user.id,
        conversation_id: conversationId || null,
        message_id: messageId || null,
        prompt: prompt,
        status: 'pending',
        aspect_ratio: aspectRatio || '1:1',
        model_used: 'gpt-image-1'
      })
      .select()
      .single();

    if (generationError) {
      console.error('Error creating generation record:', generationError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to create generation record' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generation record created: ${generation.id}`);

    // Update status to processing
    await supabaseServiceRole
      .from('image_generations')
      .update({ status: 'processing' })
      .eq('id', generation.id);

    try {
      // Generate image with OpenAI
      const { imageData, generationTime } = await generateWithOpenAI(prompt, aspectRatio);
      
      // Convert base64 to blob
      const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
      const fileSize = imageBytes.length;
      
      // Create unique filename
      const filename = `${user.id}/${generation.id}.png`;
      
      console.log(`Uploading image to storage: ${filename}`);
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
        .from('generated-images')
        .upload(filename, imageBytes, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      console.log('Image uploaded successfully:', uploadData.path);

      // Get public URL
      const { data: { publicUrl } } = supabaseServiceRole.storage
        .from('generated-images')
        .getPublicUrl(filename);

      console.log('Public URL generated:', publicUrl);

      // Update generation record with success
      const { error: updateError } = await supabaseServiceRole
        .from('image_generations')
        .update({
          status: 'completed',
          image_path: uploadData.path,
          public_url: publicUrl,
          completed_at: new Date().toISOString(),
          generation_time_ms: generationTime,
          file_size_bytes: fileSize
        })
        .eq('id', generation.id);

      if (updateError) {
        console.error('Error updating generation record:', updateError);
      }

      console.log('=== Image Generation Completed Successfully ===');

      return new Response(JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        generationId: generation.id,
        prompt: prompt,
        downloadUrl: publicUrl,
        generationTime: generationTime,
        fileSize: fileSize
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Generation error:', error);
      
      // Update record with error
      await supabaseServiceRole
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', generation.id);

      throw error;
    }

  } catch (error) {
    console.error('=== Image Generation Failed ===');
    console.error('Error details:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate image'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
