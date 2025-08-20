import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure Gemini client
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_CONFIG = {
  defaultModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash', // Fast and free
  
  // Default options for chat completions
  defaultOptions: {
    maxOutputTokens: 300,
    temperature: 0.8,
  },
  
  // Fast options for quick responses
  fastOptions: {
    maxOutputTokens: 150,
    temperature: 0.3,
  }
};

// Convert OpenAI/Ollama format to Gemini format
function convertMessages(messages: any[]) {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');
  
  if (chatMessages.length === 0) {
    return {
      systemInstruction: systemMessage?.content,
      history: [],
      message: ''
    };
  }
  
  // For first message in conversation, return empty history
  if (chatMessages.length === 1) {
    return {
      systemInstruction: systemMessage?.content,
      history: [],
      message: chatMessages[0].content
    };
  }
  
  // Convert chat messages to Gemini format, ensuring proper alternating pattern
  const history: any[] = [];
  const historyMessages = chatMessages.slice(0, -1);
  
  for (let i = 0; i < historyMessages.length; i++) {
    const msg = historyMessages[i];
    const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
    
    // Only add if it maintains the alternating user->model pattern
    if (history.length === 0 && geminiRole === 'user') {
      // First message should be user
      history.push({
        role: geminiRole,
        parts: [{ text: msg.content }]
      });
    } else if (history.length > 0) {
      const lastRole = history[history.length - 1].role;
      // Only add if it alternates properly
      if ((lastRole === 'user' && geminiRole === 'model') || 
          (lastRole === 'model' && geminiRole === 'user')) {
        history.push({
          role: geminiRole,
          parts: [{ text: msg.content }]
        });
      }
    }
  }
  
  const currentMessage = chatMessages[chatMessages.length - 1]?.content || '';
  
  return {
    systemInstruction: systemMessage?.content,
    history,
    message: currentMessage
  };
}

export async function createChatCompletion(messages: any[], options: any = {}) {
  try {
    const { systemInstruction, history, message } = convertMessages(messages);
    
    const model = geminiClient.getGenerativeModel({ 
      model: options.model || GEMINI_CONFIG.defaultModel,
      systemInstruction: systemInstruction
    });
    
    // Start chat with history
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens || GEMINI_CONFIG.defaultOptions.maxOutputTokens,
        temperature: options.temperature || GEMINI_CONFIG.defaultOptions.temperature,
      }
    });
    
    // Use the current message directly since system instruction is handled by the model
    const finalMessage = message;
    
    const result = await chat.sendMessage(finalMessage);
    const response = await result.response;
    
    // Return in similar format to your existing code
    return {
      message: {
        role: 'assistant',
        content: response.text()
      },
      usage: {
        prompt_tokens: 0, // Gemini doesn't provide exact token counts in free tier
        completion_tokens: 0,
        total_tokens: 0
      },
      model: options.model || GEMINI_CONFIG.defaultModel
    };
  } catch (error) {
    console.error('Gemini chat completion error:', error);
    throw error;
  }
}

// Fast completion for simple tasks
export async function createFastChatCompletion(messages: any[], options: any = {}) {
  return createChatCompletion(messages, {
    ...GEMINI_CONFIG.fastOptions,
    ...options
  });
}

// Streaming for real-time responses
export async function createStreamingChatCompletion(messages: any[], options: any = {}) {
  try {
    const { systemInstruction, history, message } = convertMessages(messages);
    
    const model = geminiClient.getGenerativeModel({ 
      model: options.model || GEMINI_CONFIG.defaultModel,
      systemInstruction: systemInstruction
    });
    
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens || GEMINI_CONFIG.defaultOptions.maxOutputTokens,
        temperature: options.temperature || GEMINI_CONFIG.defaultOptions.temperature,
      }
    });
    
    // Use the current message directly since system instruction is handled by the model
    const finalMessage = message;
    const result = await chat.sendMessageStream(finalMessage);
    
    return result.stream;
  } catch (error) {
    console.error('Gemini streaming error:', error);
    throw error;
  }
}

export async function listModels() {
  // Return available Gemini models
  return [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Free)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
  ];
}

export async function checkModelAvailable(modelName: string) {
  const models = await listModels();
  return models.some((model: any) => model.id.includes(modelName));
}

export default geminiClient;