'use server';

import { z } from 'zod';

// Schema for the expected data part of the API response
const InterfaceStatsDataSchema = z.object({
  name: z.string(),
  inbytes: z.number().nonnegative(),
  outbytes: z.number().nonnegative(),
  inpackets: z.number().nonnegative(),
  outpackets: z.number().nonnegative(),
  inerrs: z.number().nonnegative(),
  outerrs: z.number().nonnegative(),
  indiscards: z.number().nonnegative(),
  outdiscards: z.number().nonnegative(),
});
export type InterfaceStatsData = z.infer<typeof InterfaceStatsDataSchema>;

// Schema for the overall API response structure
const PfSenseApiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number().optional(),
  data: InterfaceStatsDataSchema.optional(),
  error: z.string().optional(),
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

  const endpoint = `/api/v2/status/interface/${interfaceName}`;
  const fullUrl = `${PfsenseApiUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${PfsenseApiKey}`,
  };

  const requestOptions: RequestInit = {
    method: 'GET',
    headers,
    cache: 'no-store',
  };

  try {
    const response = await fetch(fullUrl, requestOptions);
    
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      if (response.status === 204) {
        return { success: true, status: response.status, data: undefined };
      }
      const textResponse = await response.text();
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
    
    const parsedStats = InterfaceStatsDataSchema.safeParse(responseBody.data);

    if (!parsedStats.success) {
      console.error("pfSense API response data parsing error:", parsedStats.error.errors);
      return {
        success: false,
        error: `Failed to parse pfSense API response data for interface ${interfaceName}: ${parsedStats.error.message}. Received: ${JSON.stringify(responseBody.data).substring(0,200)}...`,
        data: responseBody.data
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

// Function to get system status
export async function getPfSenseSystemStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
  const PfsenseApiUrl = process.env.PFSENSE_API_URL;
  const PfsenseApiKey = process.env.PFSENSE_API_KEY;

  if (!PfsenseApiUrl || !PfsenseApiKey) {
    return {
      success: false,
      error: 'pfSense API URL or API Key is not configured.',
    };
  }

  const endpoint = '/api/v2/status/system';
  const fullUrl = `${PfsenseApiUrl.replace(/\/$/, '')}${endpoint}`;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${PfsenseApiKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch system status',
    };
  }
}

// Function to get firewall rules
export async function getPfSenseFirewallRules(): Promise<{ success: boolean; data?: any; error?: string }> {
  const PfsenseApiUrl = process.env.PFSENSE_API_URL;
  const PfsenseApiKey = process.env.PFSENSE_API_KEY;

  if (!PfsenseApiUrl || !PfsenseApiKey) {
    return {
      success: false,
      error: 'pfSense API URL or API Key is not configured.',
    };
  }

  const endpoint = '/api/v2/firewall/rule';
  const fullUrl = `${PfsenseApiUrl.replace(/\/$/, '')}${endpoint}`;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${PfsenseApiKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch firewall rules',
    };
  }
}