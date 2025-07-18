
import { 
  ApiService, 
  ChatMessage, 
  ChatResponse, 
  ImageGenerationResponse, 
  TranscriptionResponse, 
  FakeNewsAnalysis,
  ApiError 
} from './api';

// OpenAI Service class with loading states and error handling
export class OpenAIService {
  private static instance: OpenAIService;
  
  // Singleton pattern to ensure single instance
  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  private constructor() {}

  /**
   * Send chat messages to OpenAI GPT model
   * @param messages Array of chat messages with role and content
   * @returns Promise with the AI response
   */
  async sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      console.log('Sending chat message to OpenAI...', messages);
      
      if (!messages || messages.length === 0) {
        throw new ApiError('Messages array cannot be empty');
      }

      // Validate message format
      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          throw new ApiError('Each message must have role and content');
        }
        if (!['user', 'assistant', 'system'].includes(msg.role)) {
          throw new ApiError('Message role must be user, assistant, or system');
        }
      }

      const response = await ApiService.sendChatRequest(messages);
      console.log('Chat response received:', response);
      return response;
    } catch (error) {
      console.error('Error in sendChatMessage:', error);
      throw error;
    }
  }

  /**
   * Generate images using DALL-E
   * @param prompt Text description for image generation
   * @returns Promise with generated image URL
   */
  async generateImage(prompt: string): Promise<ImageGenerationResponse> {
    try {
      console.log('Generating image with prompt:', prompt);
      
      if (!prompt || prompt.trim().length === 0) {
        throw new ApiError('Image prompt cannot be empty');
      }

      if (prompt.length > 1000) {
        throw new ApiError('Image prompt is too long. Please keep it under 1000 characters.');
      }

      const response = await ApiService.generateImageRequest(prompt.trim());
      console.log('Image generation completed:', response);
      return response;
    } catch (error) {
      console.error('Error in generateImage:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio files using Whisper
   * @param audioFile Audio file to transcribe
   * @returns Promise with transcribed text
   */
  async transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
    try {
      console.log('Transcribing audio file:', audioFile.name);
      
      if (!audioFile) {
        throw new ApiError('Audio file is required');
      }

      // Validate file type
      const allowedTypes = [
        'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 
        'audio/ogg', 'audio/flac', 'audio/m4a'
      ];
      
      if (!allowedTypes.includes(audioFile.type)) {
        throw new ApiError(`Unsupported audio format: ${audioFile.type}. Supported formats: MP3, MP4, WAV, WEBM, OGG, FLAC, M4A`);
      }

      // Check file size (25MB limit for OpenAI)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (audioFile.size > maxSize) {
        throw new ApiError('Audio file is too large. Maximum size is 25MB.');
      }

      const response = await ApiService.transcribeAudioRequest(audioFile);
      console.log('Audio transcription completed:', response);
      return response;
    } catch (error) {
      console.error('Error in transcribeAudio:', error);
      throw error;
    }
  }

  /**
   * Analyze text for fake news and misinformation
   * @param text Text content to analyze
   * @returns Promise with credibility analysis
   */
  async detectFakeNews(text: string): Promise<FakeNewsAnalysis> {
    try {
      console.log('Analyzing text for fake news:', text.substring(0, 100) + '...');
      
      if (!text || text.trim().length === 0) {
        throw new ApiError('Text content cannot be empty');
      }

      if (text.length < 10) {
        throw new ApiError('Text is too short for meaningful analysis. Please provide at least 10 characters.');
      }

      if (text.length > 4000) {
        // Truncate text if too long to avoid token limits
        text = text.substring(0, 4000) + '...';
        console.warn('Text truncated to 4000 characters for analysis');
      }

      const response = await ApiService.analyzeFakeNewsRequest(text.trim());
      console.log('Fake news analysis completed:', response);
      return response;
    } catch (error) {
      console.error('Error in detectFakeNews:', error);
      throw error;
    }
  }

  /**
   * Check if the service is properly configured
   * @returns Boolean indicating if API key is available
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Get configuration status and recommendations
   * @returns Object with configuration details
   */
  getConfigStatus() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    return {
      configured: !!apiKey,
      hasApiKey: !!apiKey,
      message: apiKey 
        ? 'OpenAI service is properly configured' 
        : 'OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.',
    };
  }
}

// Export singleton instance
export const openaiService = OpenAIService.getInstance();

// Export types for use in components
export type {
  ChatMessage,
  ChatResponse,
  ImageGenerationResponse,
  TranscriptionResponse,
  FakeNewsAnalysis,
  ApiError,
} from './api';
