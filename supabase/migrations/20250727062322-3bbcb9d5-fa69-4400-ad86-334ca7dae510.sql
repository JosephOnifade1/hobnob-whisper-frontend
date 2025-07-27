
-- First, let's check if the image_generations table exists and fix the RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own generations" ON image_generations;
DROP POLICY IF EXISTS "Users can create own generations" ON image_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON image_generations;

-- Create the image_generations table if it doesn't exist
CREATE TABLE IF NOT EXISTS image_generations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id uuid,
    message_id uuid,
    prompt text NOT NULL,
    image_path text,
    status text DEFAULT 'pending',
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
CREATE POLICY "Users can view own generations" ON image_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON image_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON image_generations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON image_generations
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for generated images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can view own generated images" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own generated images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own generated images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own generated images" ON storage.objects
    FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
