-- First, let's fix the RLS policy for image_generations that's causing the 500 errors
-- The current policy might be too restrictive for inserts

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can insert their own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can update their own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can view their own image generations" ON public.image_generations;

-- Create more permissive policies for image generations
CREATE POLICY "Users can insert their own image generations" ON public.image_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image generations" ON public.image_generations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own image generations" ON public.image_generations
  FOR SELECT USING (auth.uid() = user_id);