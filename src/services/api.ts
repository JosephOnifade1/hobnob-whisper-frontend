
// API Response Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageGenerationResponse {
  url: string;
  revised_prompt?: string;
}

export interface TranscriptionResponse {
  text: string;
  duration?: number;
}

export interface FakeNewsAnalysis {
  credibilityScore: number;
  credibilityLevel: 'High' | 'Medium' | 'Low' | 'Very Low';
  explanation: string;
  confidence: number;
  flags: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// API Service for handling OpenAI requests with proper error handling
export class ApiService {
  private static baseUrl = 'https://api.openai.com/v1';
  private static apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    if (!this.apiKey) {
      throw new ApiError('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error?.message || `HTTP error! status: ${response.status}`,
          errorData.error?.code,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('Network error. Please check your internet connection.');
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    }
  }

  static async sendChatRequest(messages: ChatMessage[]): Promise<ChatResponse> {
    const response = await this.makeRequest<any>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    return {
      message: response.choices[0]?.message?.content || '',
      usage: response.usage,
    };
  }

  static async generateImageRequest(prompt: string): Promise<ImageGenerationResponse> {
    const response = await this.makeRequest<any>('/images/generations', {
      method: 'POST',
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      }),
    });

    return {
      url: response.data[0]?.url || '',
      revised_prompt: response.data[0]?.revised_prompt,
    };
  }

  static async transcribeAudioRequest(audioFile: File): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || `HTTP error! status: ${response.status}`,
        errorData.error?.code,
        response.status
      );
    }

    const result = await response.json();
    return {
      text: result.text || '',
      duration: result.duration,
    };
  }

  static async analyzeFakeNewsRequest(text: string): Promise<FakeNewsAnalysis> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert fact-checker and misinformation analyst. Analyze the given text for credibility, bias, and potential misinformation. Provide a credibility score (0-100), credibility level (High/Medium/Low/Very Low), explanation, confidence level (0-100), and any red flags you identify. Return your analysis in JSON format with these exact fields: credibilityScore, credibilityLevel, explanation, confidence, flags.`
      },
      {
        role: 'user',
        content: `Please analyze this text for potential misinformation: "${text}"`
      }
    ];

    const response = await this.sendChatRequest(messages);
    
    try {
      // Try to parse JSON response
      const analysis = JSON.parse(response.message);
      return {
        credibilityScore: analysis.credibilityScore || 50,
        credibilityLevel: analysis.credibilityLevel || 'Medium',
        explanation: analysis.explanation || 'Analysis completed',
        confidence: analysis.confidence || 75,
        flags: Array.isArray(analysis.flags) ? analysis.flags : [],
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        credibilityScore: 50,
        credibilityLevel: 'Medium',
        explanation: response.message,
        confidence: 75,
        flags: [],
      };
    }
  }
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export { ApiError };
