
-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policies for the generated images bucket
CREATE POLICY "Users can upload their own generated images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own generated images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own generated images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create a table to track image generation requests
CREATE TABLE public.image_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) NOT NULL,
  message_id UUID REFERENCES public.messages(id),
  prompt TEXT NOT NULL,
  image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for image generations table
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own image generations" ON public.image_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image generations" ON public.image_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image generations" ON public.image_generations
  FOR UPDATE USING (auth.uid() = user_id);
