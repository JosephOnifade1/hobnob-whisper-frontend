-- Fix the RLS policy for image_generations table
-- Drop the existing broken INSERT policy
DROP POLICY IF EXISTS "Users can insert their own image generations" ON public.image_generations;

-- Create a new INSERT policy with proper WITH CHECK clause
CREATE POLICY "Users can insert their own image generations" 
ON public.image_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);