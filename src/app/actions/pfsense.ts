
'use server';

import { z } from 'zod';

// Schema for the expected data part of the API response
const InterfaceStatsDataSchema = z.object({
  name: z.string(),
  inbytes: z.number().nonnegative(),
  outbytes: z.number().nonnegative(),
  // Add other relevant fields if known and needed e.g., packets, errors
});
export type InterfaceStatsData = z.infer<typeof InterfaceStatsDataSchema>;

// Schema for the overall API response structure
const PfSenseApiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number().optional(), // HTTP status if available in body
  data: InterfaceStatsDataSchema.optional(), // The actual stats payload
  error: z.string().optional(), // Error message from API if success is false
  // Some pfSense APIs might have a different top-level structure, e.g. a general 'message' or 'code'
  // For now, we assume 'success' and 'data' or 'error' fields.
});


export async function getPfSenseInterfaceStats(interfaceName: string): Promise<{ success: boolean; data?: InterfaceStatsData; error?: string; status?: number }> {
  const PfsenseApiUrl = process.env.PFSENSE_API_URL;
  const PfsenseApiKey = process.env.PFSENSE_API_KEY;

  if (!PfsenseApiUrl || !PfsenseApiKey) {
    return {
      success: false,
      error: 'pfSense API URL or API Key is not configured in server environment variables (PFSENSE_API_URL, PFSENSE_API_KEY).',
    };
  }

  // This is a HYPOTHETICAL endpoint. You WILL likely need to adjust this.
  // Common pfSense API packages might use /api/v<version>/status/interface or /api/v<version>/interface/stats
  // For a specific interface, it might be /api/v<version>/status/interface/<interface_name>
  const endpoint = `/api/v2/status/interface/${interfaceName}`; 
  const fullUrl = `${PfsenseApiUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${PfsenseApiKey}`, // Assuming Bearer token auth. Adjust if pfSense uses different scheme.
  };

  const requestOptions: RequestInit = {
    method: 'GET',
    headers,
    cache: 'no-store', // Ensure fresh data for stats
  };

  try {
    const response = await fetch(fullUrl, requestOptions);
    
    let responseBody;
    try {
        responseBody = await response.json();
    } catch (e) {
        // Handle non-JSON responses or empty responses for certain statuses
        if (response.status === 204) { // No Content
             return { success: true, status: response.status, data: undefined };
        }
        const textResponse = await response.text(); // Attempt to get text if JSON fails
        return {
            success: false,
            status: response.status,
            error: `API response was not valid JSON: ${response.statusText}. Response body: ${textResponse.substring(0, 200)}...`
        };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `API request failed with status ${response.status}: ${responseBody?.error || responseBody?.message || JSON.stringify(responseBody) || response.statusText}`,
      };
    }
    
    // Assuming the actual stats are in responseBody.data as per the common pfSense API package structure
    // If stats are at the root of responseBody, then parse responseBody directly with InterfaceStatsDataSchema
    const parsedStats = InterfaceStatsDataSchema.safeParse(responseBody.data);

    if (!parsedStats.success) {
      console.error("pfSense API response data parsing error:", parsedStats.error.errors);
      return {
        success: false,
        error: `Failed to parse pfSense API response data for interface ${interfaceName}: ${parsedStats.error.message}. Received: ${JSON.stringify(responseBody.data).substring(0,200)}...`,
        data: responseBody.data // Send back what was received for debugging
      };
    }

    return {
        success: true,
        status: response.status,
        data: parsedStats.data,
    };

  } catch (error: any) {
    console.error(`pfSense API fetch error in getPfSenseInterfaceStats for ${interfaceName}:`, error);
    return {
      success: false,
      error: `Failed to call pfSense API for interface ${interfaceName}: ${error.message || 'Unknown error'}`,
    };
  }
}

