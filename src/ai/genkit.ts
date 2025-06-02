import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { mistralAI } from '@genkit-ai/mistral';
import { groqAI } from '@genkit-ai/groq';
import { ollamaAI } from '@genkit-ai/ollama';

// Initialize all AI providers
export const ai = genkit({
  plugins: [
    googleAI(),
    mistralAI(),
    groqAI(),
    ollamaAI({
      endpoint: process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434',
    }),
  ],
  // Default to Gemini, but allow override through environment variable
  model: process.env.DEFAULT_AI_MODEL || 'googleai/gemini-2.0-flash',
});