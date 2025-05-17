import { config } from 'dotenv';
config();

import '@/ai/flows/interactive-llm-chat.ts';
import '@/ai/flows/analyze-threat.ts';
import '@/ai/flows/explain-alert.ts';