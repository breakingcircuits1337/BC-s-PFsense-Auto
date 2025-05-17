"use client";
import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BrainCircuit, Lightbulb, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { ExplainAlertInput, ExplainAlertOutput } from '@/ai/flows/explain-alert';
import { explainAlert } from '@/ai/flows/explain-alert';

const severityLevels = ["Low", "Medium", "High", "Critical"];

export default function ExplainAIPage() {
  const [alertDescription, setAlertDescription] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<string>('0.9'); // Stored as string for input
  const [severity, setSeverity] = useState<string>('Medium');
  const [contributingFactors, setContributingFactors] = useState<string>('');
  
  const [explanationResult, setExplanationResult] = useState<ExplainAlertOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setExplanationResult(null);

    if (!alertDescription.trim() || !contributingFactors.trim()) {
      setError("Alert description and contributing factors cannot be empty.");
      return;
    }
    const parsedConfidence = parseFloat(confidenceLevel);
    if (isNaN(parsedConfidence) || parsedConfidence < 0 || parsedConfidence > 1) {
      setError("Confidence level must be a number between 0 and 1.");
      return;
    }

    setIsLoading(true);

    try {
      const input: ExplainAlertInput = { 
        alertDescription, 
        confidenceLevel: parsedConfidence,
        severity,
        contributingFactors 
      };
      const result = await explainAlert(input);
      setExplanationResult(result);
    } catch (err) {
      console.error("Error explaining alert:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during explanation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <BrainCircuit className="h-8 w-8 text-primary" /> Explainable AI (XAI)
      </h1>
      <p className="text-muted-foreground">
        Get clear, concise explanations for AI-generated security alerts or recommendations. Understand the 'why' behind AI decisions.
      </p>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Explain AI Alert/Recommendation</CardTitle>
          <CardDescription>Provide details about the AI-generated output you want to understand.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="alertDescription" className="font-medium">Alert/Recommendation Description</Label>
              <Textarea
                id="alertDescription"
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
                placeholder="e.g., 'Blocked suspicious outbound connection to IP 8.8.8.8 on port 53 from host 192.168.1.10.'"
                rows={3}
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="confidenceLevel" className="font-medium">Confidence Level (0.0 - 1.0)</Label>
                <Input
                  id="confidenceLevel"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(e.target.value)}
                  placeholder="e.g., 0.95"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="severity" className="font-medium">Severity</Label>
                <Select value={severity} onValueChange={setSeverity} disabled={isLoading}>
                  <SelectTrigger id="severity" className="mt-1">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="contributingFactors" className="font-medium">Contributing Factors (comma-separated)</Label>
              <Input
                id="contributingFactors"
                value={contributingFactors}
                onChange={(e) => setContributingFactors(e.target.value)}
                placeholder="e.g., unusual port, known malicious IP, high data volume"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Explaining...
                </>
              ) : (
                "Get Explanation"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {explanationResult && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">AI Explanation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{explanationResult.explanation}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Justification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{explanationResult.justification}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{explanationResult.recommendedActions}</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
