-- Phase 2: Fix Anonymous Access and Strengthen Authentication

-- Update all RLS policies to require authenticated users only (no anonymous access)

-- 1. Update conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can soft delete their own conversations" ON public.conversations;

CREATE POLICY "Authenticated users can view their own conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated
USING ((auth.uid() = user_id) AND (is_deleted = false));

CREATE POLICY "Authenticated users can create their own conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Update messages policies
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;

CREATE POLICY "Authenticated users can view messages from their conversations" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))));

CREATE POLICY "Authenticated users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS ( SELECT 1
   FROM conversations
  WHERE ((conversations.id = messages.conversation_id) AND (conversations.user_id = auth.uid()))));

-- 3. Update profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Update user_settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

CREATE POLICY "Authenticated users can view their own settings" 
ON public.user_settings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Update image_generations policies
DROP POLICY IF EXISTS "Users can view their own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can create their own image generations" ON public.image_generations;
DROP POLICY IF EXISTS "Users can update their own image generations" ON public.image_generations;

CREATE POLICY "Authenticated users can view their own image generations" 
ON public.image_generations 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own image generations" 
ON public.image_generations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage image generations" 
ON public.image_generations 
FOR ALL 
TO service_role;

-- 6. Update document_conversions policies
DROP POLICY IF EXISTS "Users can view their own conversions" ON public.document_conversions;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.document_conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON public.document_conversions;

CREATE POLICY "Authenticated users can view their own conversions" 
ON public.document_conversions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own conversions" 
ON public.document_conversions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own conversions" 
ON public.document_conversions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- 7. Update tool_usage_logs policies
DROP POLICY IF EXISTS "Users can view their own tool usage logs" ON public.tool_usage_logs;
DROP POLICY IF EXISTS "Users can create their own tool usage logs" ON public.tool_usage_logs;

CREATE POLICY "Authenticated users can view their own tool usage logs" 
ON public.tool_usage_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own tool usage logs" 
ON public.tool_usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 8. Update rate_limits policies
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.rate_limits;

CREATE POLICY "Authenticated users can manage their own rate limits" 
ON public.rate_limits 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);