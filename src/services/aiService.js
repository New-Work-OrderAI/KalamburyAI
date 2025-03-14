import axios from 'axios';

// OpenRouter API key from environment variable
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY || 'klucz api openrouter';

// Available AI models for guessing
export const AI_MODELS = [
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 Vision',
    color: '#4285F4',
    score: 0
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    color: '#EA4335',
    score: 0
  },
  {
    id: 'google/gemini-2.0-flash-lite-001',
    name: 'Gemini 2.0 Flash Lite',
    color: '#FBBC05',
    score: 0
  },
  {
    id: 'microsoft/phi-4-multimodal-instruct',
    name: 'Phi-4 Multimodal',
    color: '#34A853',
    score: 0
  },
  {
    id: 'mistralai/pixtral-12b',
    name: 'Mistral Pixtral-12B',
    color: '#9C27B0',
    score: 0
  },
  {
    id: 'mistralai/mistral-nemo',
    name: 'Mistral Nemo',
    color: '#FF9800',
    score: 0
  }
];

/**
 * Generate a drawing prompt using Grok 2 via OpenRouter
 * @returns {Promise<string>} The generated prompt
 */
export const generatePrompt = async () => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'x-ai/grok-2-1212',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates simple, clear drawing prompts for a Pictionary game. Generate a single word or short phrase that would be fun to draw and guess. Respond with ONLY the word or short phrase, nothing else.'
          },
          {
            role: 'user',
            content: 'Generate a Pictionary prompt.'
          }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Pictionary'
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating prompt:', error);
    // Fallback to random prompt if API call fails
    return getRandomPrompt();
  }
};

/**
 * Send the drawing to multiple AI models via OpenRouter for analysis
 * @param {string} imageData - Base64 encoded image data
 * @param {string} modelId - The model ID to use for analysis
 * @returns {Promise<string>} The AI's guess
 */
export const guessDrawing = async (imageData, modelId) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are an AI that analyzes drawings and tries to guess what they represent. Be extremely concise and direct in your guess. Respond with ONLY the object or concept you see in the drawing, using a single word or very short phrase. Do not include explanations, confidence levels, or any other text. Just the object name.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What is drawn in this image? Provide ONLY a single word or very short phrase as your guess. No explanations.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 20
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Pictionary'
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error getting AI guess from ${modelId}:`, error);
    return `Error: Could not analyze the drawing with ${modelId}`;
  }
};

/**
 * Send the drawing to all AI models for analysis
 * @param {string} imageData - Base64 encoded image data
 * @returns {Promise<Object>} Object with model IDs as keys and guesses as values
 */
export const guessDrawingWithAllModels = async (imageData) => {
  try {
    // Create an array of promises for each model's guess
    const guessPromises = AI_MODELS.map(model => 
      guessDrawing(imageData, model.id)
        .then(guess => ({ modelId: model.id, guess }))
        .catch(error => ({ 
          modelId: model.id, 
          guess: `Error: ${error.message || 'Could not analyze the drawing'}` 
        }))
    );
    
    // Wait for all promises to settle (either resolve or reject)
    const results = await Promise.allSettled(guessPromises);
    
    // Process the results into an object with model IDs as keys and guesses as values
    const guesses = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // Extract just the guess text, removing any extra explanations
        let cleanGuess = result.value.guess;
        
        // Try to extract just the main guess if it's a longer explanation
        if (cleanGuess.length > 20) {
          // Look for common patterns in AI responses
          const patterns = [
            /I see a ([\w\s\-]+)/i,
            /This appears to be a ([\w\s\-]+)/i,
            /This looks like a ([\w\s\-]+)/i,
            /It's a ([\w\s\-]+)/i,
            /This is a ([\w\s\-]+)/i,
            /I think this is a ([\w\s\-]+)/i,
            /The image shows a ([\w\s\-]+)/i,
            /A ([\w\s\-]+)/i,
            /An ([\w\s\-]+)/i,
            /person ([\w\s\-]+)/i,
            /someone ([\w\s\-]+)/i
          ];
          
          for (const pattern of patterns) {
            const match = cleanGuess.match(pattern);
            if (match && match[1]) {
              cleanGuess = match[1].trim();
              break;
            }
          }
          
          // If still too long, just take the first sentence or phrase
          if (cleanGuess.length > 50) {
            cleanGuess = cleanGuess.split(/[.!?]/, 1)[0].trim();
          }
        }
        
        // Remove any trailing punctuation
        cleanGuess = cleanGuess.replace(/[.,!?;:]$/, '').trim();
        
        // Log the original and cleaned guess for debugging
        console.log(`Model ${result.value.modelId} original guess: "${result.value.guess}"`);
        console.log(`Model ${result.value.modelId} cleaned guess: "${cleanGuess}"`);
        
        guesses[result.value.modelId] = cleanGuess;
      } else {
        guesses[AI_MODELS[index].id] = `Error: Could not analyze the drawing`;
      }
    });
    
    return guesses;
  } catch (error) {
    console.error('Error getting AI guesses:', error);
    throw error;
  }
};

// Helper functions for development/testing

/**
 * Get a random prompt from a predefined list
 * @returns {string} A random prompt
 */
const getRandomPrompt = () => {
  const prompts = [
    'cat',
    'dog',
    'house',
    'tree',
    'car',
    'bicycle',
    'sun',
    'moon',
    'star',
    'flower',
    'book',
    'computer',
    'phone',
    'chair',
    'table',
    'pizza',
    'hamburger',
    'airplane',
    'train',
    'boat'
  ];
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}; 