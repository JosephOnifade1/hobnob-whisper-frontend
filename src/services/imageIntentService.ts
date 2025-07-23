
export interface ImageIntentResult {
  hasImageIntent: boolean;
  imagePrompt?: string;
  originalMessage: string;
  confidence: number;
}

export class ImageIntentService {
  private static imageKeywords = [
    'generate an image',
    'create an image',
    'make an image',
    'draw an image',
    'generate a picture',
    'create a picture',
    'make a picture',
    'draw a picture',
    'show me an image',
    'show me a picture',
    'create artwork',
    'generate artwork',
    'make artwork',
    'draw me',
    'paint me',
    'illustrate',
    'visualize',
    'design an image',
    'design a picture',
    'sketch',
    'render an image',
    'produce an image'
  ];

  private static imagePatterns = [
    /(?:generate|create|make|draw|show me|paint|illustrate|visualize|design|sketch|render|produce)\s+(?:an?\s+)?(?:image|picture|artwork|illustration|drawing|painting|sketch|visual|graphic)\s+(?:of|showing|depicting|with|featuring)\s+(.+)/i,
    /(?:can you|could you|please)\s+(?:generate|create|make|draw|show me|paint|illustrate|visualize|design|sketch|render|produce)\s+(?:an?\s+)?(?:image|picture|artwork|illustration|drawing|painting|sketch|visual|graphic)\s+(?:of|showing|depicting|with|featuring)?\s*(.+)/i,
    /(?:i want|i need|i'd like)\s+(?:an?\s+)?(?:image|picture|artwork|illustration|drawing|painting|sketch|visual|graphic)\s+(?:of|showing|depicting|with|featuring)\s+(.+)/i,
    /draw me\s+(.+)/i,
    /paint me\s+(.+)/i,
    /illustrate\s+(.+)/i,
    /visualize\s+(.+)/i
  ];

  static analyzeMessage(message: string): ImageIntentResult {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for direct keyword matches
    const hasKeyword = this.imageKeywords.some(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    );

    if (!hasKeyword) {
      return {
        hasImageIntent: false,
        originalMessage: message,
        confidence: 0
      };
    }

    // Extract image prompt using patterns
    for (const pattern of this.imagePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const imagePrompt = match[1].trim();
        if (imagePrompt.length > 3) { // Ensure we have a meaningful prompt
          return {
            hasImageIntent: true,
            imagePrompt,
            originalMessage: message,
            confidence: 0.9
          };
        }
      }
    }

    // Fallback: if we have keywords but no clear pattern match
    // Extract everything after the image generation request
    const keywordMatch = this.imageKeywords.find(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    );

    if (keywordMatch) {
      const keywordIndex = normalizedMessage.indexOf(keywordMatch.toLowerCase());
      const afterKeyword = message.substring(keywordIndex + keywordMatch.length).trim();
      
      // Look for "of" or similar prepositions
      const ofMatch = afterKeyword.match(/^(?:of|showing|depicting|with|featuring)?\s*(.+)/i);
      if (ofMatch && ofMatch[1] && ofMatch[1].trim().length > 3) {
        return {
          hasImageIntent: true,
          imagePrompt: ofMatch[1].trim(),
          originalMessage: message,
          confidence: 0.7
        };
      }
    }

    return {
      hasImageIntent: true,
      imagePrompt: message, // Use the whole message as fallback
      originalMessage: message,
      confidence: 0.5
    };
  }

  static extractTextOnlyResponse(message: string, imagePrompt: string): string {
    // Remove the image generation part from the message to get any additional text
    const normalizedMessage = message.toLowerCase();
    const normalizedPrompt = imagePrompt.toLowerCase();
    
    // Find and remove the image generation request
    for (const keyword of this.imageKeywords) {
      const keywordIndex = normalizedMessage.indexOf(keyword.toLowerCase());
      if (keywordIndex !== -1) {
        const beforeKeyword = message.substring(0, keywordIndex).trim();
        const afterImageRequest = message.substring(keywordIndex + keyword.length)
          .replace(new RegExp(`(?:of|showing|depicting|with|featuring)?\\s*${imagePrompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), '')
          .trim();
        
        const textParts = [beforeKeyword, afterImageRequest].filter(part => part.length > 0);
        return textParts.join(' ').trim();
      }
    }
    
    return '';
  }
}
