// use server'
'use server';

/**
 * @fileOverview A flow for interacting with an LLM chatbot to answer questions about network security, status, and suggested actions.
 *
 * - interactiveLLMChat - A function that handles the interaction with the LLM chatbot.
 * - InteractiveLLMChatInput - The input type for the interactiveLLMChat function.
 * - InteractiveLLMChatOutput - The return type for the interactiveLLMChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractiveLLMChatInputSchema = z.object({
  query: z.string().describe('The user query about network security, status, or suggested actions.'),
});

export type InteractiveLLMChatInput = z.infer<typeof InteractiveLLMChatInputSchema>;

const InteractiveLLMChatOutputSchema = z.object({
  response: z.string().describe('The LLM chatbot response to the user query.'),
});

export type InteractiveLLMChatOutput = z.infer<typeof InteractiveLLMChatOutputSchema>;

export async function interactiveLLMChat(input: InteractiveLLMChatInput): Promise<InteractiveLLMChatOutput> {
  return interactiveLLMChatFlow(input);
}

const interactiveLLMChatPrompt = ai.definePrompt({
  name: 'interactiveLLMChatPrompt',
  input: {schema: InteractiveLLMChatInputSchema},
  output: {schema: InteractiveLLMChatOutputSchema},
  prompt: `You are a helpful network security chatbot. A network administrator will ask you questions about network security, status, and suggested actions to improve the system.
  Provide clear, concise, and actionable answers.

  User Query: {{{query}}}`,
});

const interactiveLLMChatFlow = ai.defineFlow(
  {
    name: 'interactiveLLMChatFlow',
    inputSchema: InteractiveLLMChatInputSchema,
    outputSchema: InteractiveLLMChatOutputSchema,
  },
  async input => {
    const {output} = await interactiveLLMChatPrompt(input);
    return output!;
  }
);
