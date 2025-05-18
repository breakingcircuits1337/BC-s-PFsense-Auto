
/**
 * @fileOverview A Genkit tool to interact with the pfSense API.
 *
 * - pfSenseApiTool - A tool that allows querying and managing a pfSense firewall.
 * - PfSenseToolInputSchema - The input type for the pfSenseApiTool.
 * - PfSenseToolOutputSchema - The return type for the pfSenseApiTool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PfSenseToolInputSchema = z.object({
  operation: z.enum(['get', 'post', 'put', 'delete'])
    .default('get')
    .describe("The API operation to perform. Currently, only 'get' is fully supported for querying."),
  endpoint: z.string().describe('The pfSense API endpoint path, e.g., /api/v2/firewall/rules or /api/v2/status/system'),
  filters: z.record(z.string()).optional().describe('Key-value pairs for filtering, e.g., { "name__contains": "LAN" } or { "id": "123" }. Refer to pfSense API docs for available filters on each endpoint.'),
  sortBy: z.string().optional().describe('Field to sort by, e.g., "name"'),
  sortFlags: z.string().optional().describe('Flags for sorting (e.g., "numeric", "caseinsensitive"). Refer to pfSense API docs.'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order for the results.'),
  data: z.any().optional().describe('Request body for POST/PUT operations (not fully implemented for general use yet).'),
});
export type PfSenseToolInput = z.infer<typeof PfSenseToolInputSchema>;

export const PfSenseToolOutputSchema = z.object({
  success: z.boolean().describe("Whether the API call was successful."),
  status: z.number().optional().describe("HTTP status code of the API response."),
  data: z.any().optional().describe("The JSON data returned by the API."),
  error: z.string().optional().describe("Error message if the API call failed."),
});
export type PfSenseToolOutput = z.infer<typeof PfSenseToolOutputSchema>;

export const pfSenseApiTool = ai.defineTool(
  {
    name: 'pfSenseApiTool',
    description: 'Interacts with a pfSense firewall API to query data or perform actions. Requires PFSENSE_API_URL and PFSENSE_API_KEY to be set as environment variables on the server.',
    inputSchema: PfSenseToolInputSchema,
    outputSchema: PfSenseToolOutputSchema,
  },
  async (input: PfSenseToolInput): Promise<PfSenseToolOutput> => {
    const { operation, endpoint, filters, sortBy, sortFlags, sortOrder, data: requestBody } = input;

    const PfsenseApiUrl = process.env.PFSENSE_API_URL;
    const PfsenseApiKey = process.env.PFSENSE_API_KEY;

    if (!PfsenseApiUrl || !PfsenseApiKey) {
      return {
        success: false,
        error: 'pfSense API URL or API Key is not configured in server environment variables (PFSENSE_API_URL, PFSENSE_API_KEY).',
      };
    }

    let fullUrl = `${PfsenseApiUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const queryParams = new URLSearchParams();

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        queryParams.append(key, value);
      }
    }
    if (sortBy) queryParams.append('sort_by', sortBy);
    if (sortFlags) queryParams.append('sort_flags', sortFlags);
    if (sortOrder) queryParams.append('sort_order', sortOrder);
    
    if (queryParams.toString()) {
      fullUrl += `?${queryParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      // Assuming Bearer token auth or a custom header. Adjust if pfSense uses a different scheme.
      // Common alternatives: 'X-API-Key': PfsenseApiKey or specific pfSense auth header.
      'Authorization': `Bearer ${PfsenseApiKey}`, 
    };

    const requestOptions: RequestInit = {
      method: operation.toUpperCase(),
      headers,
    };

    if (operation === 'post' || operation === 'put') {
      if (requestBody) {
        headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(requestBody);
      } else {
         return { success: false, error: `Request body is required for ${operation.toUpperCase()} operations.` };
      }
    }
    
    try {
      const response = await fetch(fullUrl, requestOptions);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        return {
          success: false,
          status: response.status,
          error: `API request failed with status ${response.status}: ${JSON.stringify(errorData) || response.statusText}`,
        };
      }

      // Handle no content response for operations like DELETE or certain PUTs
      if (response.status === 204) {
        return { success: true, status: response.status, data: null };
      }
      
      const responseData = await response.json();
      return {
        success: true,
        status: response.status,
        data: responseData,
      };
    } catch (error: any) {
      console.error('pfSense API tool error:', error);
      return {
        success: false,
        error: `Failed to call pfSense API: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
