/**
 * OpenAI service for interacting with the OpenAI API
 * Supports multiple models with different API keys and base URLs
 */
import { OpenAI } from 'openai';

// Model configuration interface
interface ModelConfig {
  apiKey: string;
  baseURL: string;
  description?: string;
  maxConcurrentRequests?: number;
}

// Model configurations
const modelConfigs: Record<string, ModelConfig> = {
  // Default OpenAI configuration
  'openai': {
    apiKey: process.env.OPENAI_API_KEY as string,
    baseURL: "https://api.openai.com/v1",
    description: "OpenAI GPT-4o-mini model",
    maxConcurrentRequests: 1000
  },
  // Add more model configurations as needed
  // Example:
  // 'gemini': {
  //   apiKey: process.env.ALTERNATIVE_API_KEY as string,
  //   baseURL: "https://generativelanguage.googleapis.com/v1",
  //   description: "Google Gemini model",
  //   maxConcurrentRequests: 20
  // }
};

// OpenAI client instances cache
const clientInstances: Record<string, OpenAI> = {};

// Track active requests per model type
const activeRequests: Record<string, number> = {};
// Queue for pending requests
const requestQueues: Record<string, Array<() => Promise<void>>> = {};

/**
 * Gets or creates an OpenAI client for the specified model type
 * @param modelType - The model type to get a client for
 * @returns The OpenAI client instance
 */
export function getOpenAIClient(modelType: string = 'openai'): OpenAI {
  if (clientInstances[modelType]) {
    return clientInstances[modelType];
  }
  
  const config = modelConfigs[modelType];
  if (!config) {
    throw new Error(`No configuration found for model type: ${modelType}`);
  }
  
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: 60000,
    maxRetries: 3
  });
  
  clientInstances[modelType] = client;
  activeRequests[modelType] = 0;
  requestQueues[modelType] = [];
  
  return client;
}

// For backward compatibility
export const openai = getOpenAIClient('openai');

/**
 * Manages request queue to prevent exceeding concurrent request limits
 * @param modelType - The model type for the request
 * @param requestFn - The function to execute when a slot is available
 */
async function enqueueRequest<T>(modelType: string, requestFn: () => Promise<T>): Promise<T> {
  const config = modelConfigs[modelType];
  if (!config) {
    throw new Error(`No configuration found for model type: ${modelType}`);
  }
  
  const maxConcurrent = config.maxConcurrentRequests || 50;
  
  // If we're under the limit, execute immediately
  if (!activeRequests[modelType] || activeRequests[modelType] < maxConcurrent) {
    activeRequests[modelType] = (activeRequests[modelType] || 0) + 1;
    try {
      return await requestFn();
    } finally {
      activeRequests[modelType]--;
      if (requestQueues[modelType] && requestQueues[modelType].length > 0) {
        const nextRequest = requestQueues[modelType].shift();
        if (nextRequest) nextRequest();
      }
    }
  }
  
  // Otherwise, queue the request
  return new Promise<T>((resolve, reject) => {
    const queuedRequest = async () => {
      activeRequests[modelType]++;
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        activeRequests[modelType]--;
        if (requestQueues[modelType] && requestQueues[modelType].length > 0) {
          const nextRequest = requestQueues[modelType].shift();
          if (nextRequest) nextRequest();
        }
      }
    };
    
    // Add to queue
    if (!requestQueues[modelType]) requestQueues[modelType] = [];
    requestQueues[modelType].push(queuedRequest);
  });
}

/**
 * Creates a chat completion using the OpenAI API
 * @param model - The model to use for the completion
 * @param systemPrompt - The system prompt to use
 * @param userPrompt - The user prompt to use
 * @param jsonResponse - Whether to request a JSON response
 * @param modelType - The model type to use (defaults to 'openai')
 * @returns The completion response content
 */
export async function createChatCompletion(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  jsonResponse: boolean = true,
  modelType: string = 'openai'
): Promise<string> {
  // Get the appropriate client for this model type
  const client = getOpenAIClient(modelType);
  
  // Use the request queue system to prevent exceeding rate limits
  return enqueueRequest(modelType, async () => {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: jsonResponse ? { type: "json_object" } : undefined
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      return responseContent;
    } catch (error: unknown) {
      // Type guard to check if error is an APIError with status property
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
        console.error(`Rate limit exceeded for ${modelType}. Retrying after delay...`);
        // Wait for a bit before retrying via the queue system
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error(`Rate limit exceeded for ${modelType}. Please try again in a moment.`);
      }
      
      // Re-throw the original error
      throw error;
    }
  });
}