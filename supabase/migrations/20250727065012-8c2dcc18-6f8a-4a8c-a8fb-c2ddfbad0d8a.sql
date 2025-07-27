-- Phase 1: Fix duplicate RLS policies and conversation_id issue

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can insert their own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can update their own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can view their own image generations" ON public.image_generations;

-- Make conversation_id nullable since it might not always be provided
ALTER TABLE public.image_generations 
ALTER COLUMN conversation_id DROP NOT NULL;

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean up and recreate storage policies
DROP POLICY IF EXISTS "Users can view own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own generated images" ON storage.objects;

-- Create storage policies for generated images
CREATE POLICY "Generated images are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Users can upload generated images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their generated images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their generated images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);