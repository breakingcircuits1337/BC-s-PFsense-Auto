'use server';

/**
 * @fileOverview Analyzes potential security threats using AI.
 *
 * - analyzeThreat - Analyzes potential security threats using AI, providing a confidence level and recommendations.
 * - AnalyzeThreatInput - The input type for the analyzeThreat function.
 * - AnalyzeThreatOutput - The return type for the analyzeThreat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeThreatInputSchema = z.object({
  threatDescription: z
    .string()
    .describe('A description of the potential security threat.'),
});
export type AnalyzeThreatInput = z.infer<typeof AnalyzeThreatInputSchema>;

const AnalyzeThreatOutputSchema = z.object({
  analysis: z.object({
    confidenceLevel: z
      .number()
      .describe(
        'The confidence level of the AI in its analysis, from 0 to 1.'
      ),
    recommendations: z
      .string()
      .describe('Plain English recommendations to mitigate the threat.'),
    severity: z.string().describe('The severity of the threat (e.g., High, Medium, Low).'),
    explanation: z
      .string()
      .describe('Explanation of why the threat was flagged and contributing factors.'),
  }),
});
export type AnalyzeThreatOutput = z.infer<typeof AnalyzeThreatOutputSchema>;

export async function analyzeThreat(input: AnalyzeThreatInput): Promise<AnalyzeThreatOutput> {
  return analyzeThreatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeThreatPrompt',
  input: {schema: AnalyzeThreatInputSchema},
  output: {schema: AnalyzeThreatOutputSchema},
  prompt: `You are an AI-powered network security analyst. Analyze the following potential security threat and provide a confidence level (0 to 1), plain English recommendations to mitigate the threat, the severity of the threat, and an explanation of why the threat was flagged and contributing factors.\n\nThreat Description: {{{threatDescription}}}`,
});

const analyzeThreatFlow = ai.defineFlow(
  {
    name: 'analyzeThreatFlow',
    inputSchema: AnalyzeThreatInputSchema,
    outputSchema: AnalyzeThreatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
