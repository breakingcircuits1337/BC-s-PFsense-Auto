
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, KeyRound, Server, ShieldCheck } from 'lucide-react';

interface ApiSettings {
  elevenLabsApiKey: string;
  geminiApiKey: string;
  mistralApiKey: string;
  groqApiKey: string;
  ollamaEndpoint: string;
  pfsenseApiUrl: string;
  pfsenseApiKey: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ApiSettings>({
    elevenLabsApiKey: '',
    geminiApiKey: '',
    mistralApiKey: '',
    groqApiKey: '',
    ollamaEndpoint: 'http://127.0.0.1:11434',
    pfsenseApiUrl: '',
    pfsenseApiKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // For now, we'll just log the settings to the console.
    // In a real application, you would save these securely or use them to update environment variables.
    console.log("API Settings Submitted (for reference, actual values used by tools come from .env):", settings);

    // Simulate saving
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Logged",
        description: "API keys and endpoints have been logged for your reference. Ensure corresponding .env variables are set for tools to function.",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <SettingsIcon className="h-8 w-8 text-primary" /> API & Service Settings
      </h1>
      <p className="text-muted-foreground">
        Manage your API keys and service endpoints here. Values entered are for reference. Ensure corresponding server environment variables are set for tools to function correctly.
      </p>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>Enter the API keys for the services you want to use. These will be logged for reference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey" className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Gemini API Key</Label>
              <Input
                id="geminiApiKey"
                name="geminiApiKey"
                type="password"
                value={settings.geminiApiKey}
                onChange={handleChange}
                placeholder="Enter your Gemini API Key (via GOOGLE_API_KEY in .env for Genkit)"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Used for Google AI Studio models via Genkit. Set `GOOGLE_API_KEY` in your .env file.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevenLabsApiKey" className="flex items-center gap-2"><KeyRound className="h-4 w-4" />ElevenLabs API Key</Label>
              <Input
                id="elevenLabsApiKey"
                name="elevenLabsApiKey"
                type="password"
                value={settings.elevenLabsApiKey}
                onChange={handleChange}
                placeholder="Enter your ElevenLabs API Key"
                disabled={isLoading}
              />
               <p className="text-xs text-muted-foreground">For Text-to-Speech services. Set `ELEVENLABS_API_KEY` in .env if used by a tool.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mistralApiKey" className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Mistral API Key</Label>
              <Input
                id="mistralApiKey"
                name="mistralApiKey"
                type="password"
                value={settings.mistralApiKey}
                onChange={handleChange}
                placeholder="Enter your Mistral API Key"
                disabled={isLoading}
              />
               <p className="text-xs text-muted-foreground">Set `MISTRAL_API_KEY` in .env if used by a tool.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groqApiKey" className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Groq API Key</Label>
              <Input
                id="groqApiKey"
                name="groqApiKey"
                type="password"
                value={settings.groqApiKey}
                onChange={handleChange}
                placeholder="Enter your Groq API Key"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Set `GROQ_API_KEY` in .env if used by a tool.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ollamaEndpoint" className="flex items-center gap-2"><Server className="h-4 w-4" />Ollama Endpoint</Label>
              <Input
                id="ollamaEndpoint"
                name="ollamaEndpoint"
                type="text"
                value={settings.ollamaEndpoint}
                onChange={handleChange}
                placeholder="e.g., http://127.0.0.1:11434"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Endpoint for your local Ollama instance. Set `OLLAMA_ENDPOINT` in .env if used by a tool.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pfsenseApiUrl" className="flex items-center gap-2"><Server className="h-4 w-4 text-orange-500" />pfSense API URL</Label>
              <Input
                id="pfsenseApiUrl"
                name="pfsenseApiUrl"
                type="text"
                value={settings.pfsenseApiUrl}
                onChange={handleChange}
                placeholder="e.g., https://pfsense.example.com"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">URL for your pfSense API. Set `PFSENSE_API_URL` in .env for the pfSense tool.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pfsenseApiKey" className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-orange-500" />pfSense API Key</Label>
              <Input
                id="pfsenseApiKey"
                name="pfsenseApiKey"
                type="password"
                value={settings.pfsenseApiKey}
                onChange={handleChange}
                placeholder="Enter your pfSense API Key"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Set `PFSENSE_API_KEY` in .env for the pfSense tool.</p>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Logging..." : "Log Settings for Reference"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
