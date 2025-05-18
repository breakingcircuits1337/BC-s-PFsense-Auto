
'use server';

/**
 * @fileOverview A flow for interacting with an LLM chatbot to answer questions about network security, status, and suggested actions, including pfSense control.
 *
 * - interactiveLLMChat - A function that handles the interaction with the LLM chatbot.
 * - InteractiveLLMChatInput - The input type for the interactiveLLMChat function.
 * - InteractiveLLMChatOutput - The return type for the interactiveLLMChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { pfSenseApiTool } from '@/ai/tools/pfsense-api-tool';

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
  tools: [pfSenseApiTool],
  system: `You are a helpful network security chatbot for NetGuardian AI.
A network administrator will ask you questions about network security, status, and suggested actions to improve the system.
Provide clear, concise, and actionable answers.

If the user asks to query or manage the pfSense firewall, use the 'pfSenseApiTool'.
This tool requires 'PFSENSE_API_URL' and 'PFSENSE_API_KEY' to be configured as environment variables on the server.
If you suspect these are not set (e.g., the tool returns an error about missing configuration), inform the user they need to configure these server-side environment variables.
The settings page in the NetGuardian AI UI can show them the names of these variables.
When using the pfSenseApiTool:
- For 'endpoint', use paths like '/api/v2/firewall/rules', '/api/v2/status/system', etc.
- For 'filters', provide an object like { "name__contains": "LAN" } or { "id": "123" }.
- Specify 'sortBy', 'sortFlags', and 'sortOrder' as needed.
- The default 'operation' is 'get'.

Example pfSenseApiTool usage for GET:
To get firewall rules containing 'office' in their description:
pfSenseApiTool({ operation: 'get', endpoint: '/api/v2/firewall/rule', filters: { "descr__contains": "office" } })

To get the system status:
pfSenseApiTool({ operation: 'get', endpoint: '/api/v2/status/system' })

Interpret user requests for pfSense information and translate them into appropriate parameters for the pfSenseApiTool.
`,
  prompt: `User Query: {{{query}}}`,
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

