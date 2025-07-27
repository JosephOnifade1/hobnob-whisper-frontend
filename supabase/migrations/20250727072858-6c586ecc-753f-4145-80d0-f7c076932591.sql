-- Phase 1: Simplify image generations table and use service role approach

-- Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can create own generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can delete own generations" ON public.image_generations;

-- Disable RLS on image_generations table since we'll use service role
ALTER TABLE public.image_generations DISABLE ROW LEVEL SECURITY;

-- Add generation_status enum for better status tracking
DO $$ BEGIN
    CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the status column to use enum
ALTER TABLE public.image_generations 
ALTER COLUMN status TYPE generation_status USING status::generation_status;

-- Add additional useful columns for the new approach
ALTER TABLE public.image_generations 
ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '1:1',
ADD COLUMN IF NOT EXISTS model_used text DEFAULT 'gpt-image-1',
ADD COLUMN IF NOT EXISTS generation_time_ms integer,
ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
ADD COLUMN IF NOT EXISTS public_url text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id_status ON public.image_generations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_image_generations_conversation_id ON public.image_generations(conversation_id) WHERE conversation_id IS NOT NULL;