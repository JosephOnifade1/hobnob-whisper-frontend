
-- Create storage bucket for document conversion temporary files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-converter',
  'document-converter',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png', 'text/plain']
);

-- Create RLS policies for the document converter bucket
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-converter' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'document-converter' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-converter' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create a table to track conversions for cleanup
CREATE TABLE public.document_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  original_file_path TEXT NOT NULL,
  converted_file_path TEXT,
  source_format TEXT NOT NULL,
  target_format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Add RLS policies for conversions table
ALTER TABLE public.document_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversions" ON public.document_conversions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions" ON public.document_conversions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions" ON public.document_conversions
  FOR UPDATE USING (auth.uid() = user_id);
