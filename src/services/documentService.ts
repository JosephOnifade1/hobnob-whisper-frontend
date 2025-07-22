
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DocumentConversion = Database['public']['Tables']['document_conversions']['Row'];
type DocumentConversionInsert = Database['public']['Tables']['document_conversions']['Insert'];

export interface ConversionResult {
  success: boolean;
  conversionId?: string;
  downloadUrl?: string;
  originalFileName?: string;
  convertedFileName?: string;
  error?: string;
}

export const documentService = {
  // Convert document using edge function
  convertDocument: async (file: File, targetFormat: string): Promise<ConversionResult> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);

      console.log('Converting document:', file.name, 'to', targetFormat);

      const { data, error } = await supabase.functions.invoke('document-converter', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Conversion error:', error);
        throw new Error(error.message || 'Conversion failed');
      }

      return data as ConversionResult;
    } catch (error) {
      console.error('Document conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get user's conversion history
  getConversions: async (): Promise<{ data: DocumentConversion[] | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('document_conversions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversions:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching conversions:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  // Get conversion by ID
  getConversion: async (id: string): Promise<{ data: DocumentConversion | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('document_conversions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching conversion:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching conversion:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  // Download converted file
  downloadFile: async (filePath: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      const { data, error } = await supabase.storage
        .from('document-converter')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating download URL:', error);
        return { url: null, error: error.message };
      }

      return { url: data.signedUrl, error: null };
    } catch (error) {
      console.error('Error creating download URL:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
};
