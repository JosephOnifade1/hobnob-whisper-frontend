
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const targetFormat = formData.get('targetFormat') as string

      if (!file || !targetFormat) {
        return new Response(
          JSON.stringify({ error: 'File and target format are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Converting file: ${file.name} to ${targetFormat}`)

      // Get file info
      const sourceFormat = file.name.split('.').pop()?.toLowerCase() || ''
      const fileBuffer = await file.arrayBuffer()
      const fileBytes = new Uint8Array(fileBuffer)

      // Create conversion record
      const { data: conversion, error: conversionError } = await supabase
        .from('document_conversions')
        .insert({
          user_id: user.id,
          original_file_path: file.name,
          source_format: sourceFormat,
          target_format: targetFormat,
          status: 'processing'
        })
        .select()
        .single()

      if (conversionError) {
        console.error('Error creating conversion record:', conversionError)
        return new Response(
          JSON.stringify({ error: 'Failed to create conversion record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Upload original file to storage
        const originalPath = `${user.id}/${conversion.id}/original.${sourceFormat}`
        const { error: uploadError } = await supabase.storage
          .from('document-converter')
          .upload(originalPath, fileBytes, {
            contentType: file.type,
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Perform conversion based on formats
        let convertedBytes: Uint8Array
        let convertedContentType: string

        if (sourceFormat === 'txt' && targetFormat === 'pdf') {
          // Convert text to PDF
          const textContent = new TextDecoder().decode(fileBytes)
          convertedBytes = await convertTextToPdf(textContent)
          convertedContentType = 'application/pdf'
        } else if (sourceFormat === 'pdf' && targetFormat === 'txt') {
          // Convert PDF to text
          const textContent = await convertPdfToText(fileBytes)
          convertedBytes = new TextEncoder().encode(textContent)
          convertedContentType = 'text/plain'
        } else if ((sourceFormat === 'jpg' || sourceFormat === 'jpeg' || sourceFormat === 'png') && targetFormat === 'pdf') {
          // Convert image to PDF
          convertedBytes = await convertImageToPdf(fileBytes, sourceFormat)
          convertedContentType = 'application/pdf'
        } else if (sourceFormat === 'docx' && targetFormat === 'txt') {
          // Convert DOCX to text
          const textContent = await convertDocxToText(fileBytes)
          convertedBytes = new TextEncoder().encode(textContent)
          convertedContentType = 'text/plain'
        } else if (sourceFormat === 'txt' && targetFormat === 'docx') {
          // Convert text to DOCX
          const textContent = new TextDecoder().decode(fileBytes)
          convertedBytes = await convertTextToDocx(textContent)
          convertedContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else {
          throw new Error(`Conversion from ${sourceFormat} to ${targetFormat} is not supported yet`)
        }

        // Upload converted file
        const convertedPath = `${user.id}/${conversion.id}/converted.${targetFormat}`
        const { error: convertedUploadError } = await supabase.storage
          .from('document-converter')
          .upload(convertedPath, convertedBytes, {
            contentType: convertedContentType,
            upsert: true
          })

        if (convertedUploadError) {
          throw new Error(`Converted file upload failed: ${convertedUploadError.message}`)
        }

        // Update conversion record
        await supabase
          .from('document_conversions')
          .update({
            status: 'completed',
            converted_file_path: convertedPath,
            completed_at: new Date().toISOString()
          })
          .eq('id', conversion.id)

        // Generate signed URL for download
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('document-converter')
          .createSignedUrl(convertedPath, 3600) // 1 hour expiry

        if (urlError) {
          throw new Error(`Failed to generate download URL: ${urlError.message}`)
        }

        return new Response(
          JSON.stringify({
            success: true,
            conversionId: conversion.id,
            downloadUrl: signedUrl.signedUrl,
            originalFileName: file.name,
            convertedFileName: `${file.name.split('.')[0]}.${targetFormat}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (conversionError) {
        console.error('Conversion error:', conversionError)
        
        // Update conversion record with error
        await supabase
          .from('document_conversions')
          .update({
            status: 'failed',
            error_message: conversionError.message
          })
          .eq('id', conversion.id)

        return new Response(
          JSON.stringify({ error: `Conversion failed: ${conversionError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Conversion helper functions
async function convertTextToPdf(text: string): Promise<Uint8Array> {
  // Simple PDF creation with text content
  const lines = text.split('\n')
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${text.length + 100}
>>
stream
BT
/F1 12 Tf
50 750 Td
${lines.map(line => `(${line.replace(/[()\\]/g, '\\$&')}) Tj 0 -14 Td`).join('\n')}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000${(400 + text.length).toString().padStart(6, '0')} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${450 + text.length}
%%EOF`
  
  return new TextEncoder().encode(pdfContent)
}

async function convertPdfToText(pdfBytes: Uint8Array): Promise<string> {
  // Basic PDF text extraction (simplified)
  const pdfText = new TextDecoder().decode(pdfBytes)
  const textMatches = pdfText.match(/\((.*?)\)/g)
  if (textMatches) {
    return textMatches.map(match => match.slice(1, -1)).join(' ')
  }
  return 'Unable to extract text from PDF'
}

async function convertImageToPdf(imageBytes: Uint8Array, format: string): Promise<Uint8Array> {
  // Basic image to PDF conversion (simplified)
  const base64Image = btoa(String.fromCharCode(...imageBytes))
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/XObject <<
/Im1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
q
612 0 0 792 0 0 cm
/Im1 Do
Q
endstream
endobj

5 0 obj
<<
/Type /XObject
/Subtype /Image
/Width 612
/Height 792
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${imageBytes.length}
>>
stream
${base64Image}
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000364 00000 n 
0000000452 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${600 + imageBytes.length}
%%EOF`
  
  return new TextEncoder().encode(pdfContent)
}

async function convertDocxToText(docxBytes: Uint8Array): Promise<string> {
  // Simplified DOCX text extraction
  try {
    const text = new TextDecoder().decode(docxBytes)
    // Basic extraction of text content between XML tags
    const textMatches = text.match(/>([^<]+)</g)
    if (textMatches) {
      return textMatches
        .map(match => match.slice(1, -1))
        .filter(text => text.trim().length > 0)
        .join(' ')
    }
  } catch (error) {
    console.error('DOCX parsing error:', error)
  }
  return 'Unable to extract text from DOCX file'
}

async function convertTextToDocx(text: string): Promise<Uint8Array> {
  // Basic DOCX creation (simplified)
  const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${text.replace(/\n/g, '</w:t></w:r></w:p><w:p><w:r><w:t>')}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`
  
  return new TextEncoder().encode(docxContent)
}
