
"use client";
import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert, Lightbulb, CheckCircle, Info, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import type { AnalyzeThreatInput, AnalyzeThreatOutput } from '@/ai/flows/analyze-threat';
import { analyzeThreat } from '@/ai/flows/analyze-threat'; // Ensure this path is correct

export default function ThreatAnalysisPage() {
  const [threatDescription, setThreatDescription] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeThreatOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!threatDescription.trim()) {
      setError("Threat description cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const input: AnalyzeThreatInput = { threatDescription };
      const result = await analyzeThreat(input);
      setAnalysisResult(result);
    } catch (err) {
      console.error("Error analyzing threat:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during threat analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <ShieldAlert className="h-8 w-8 text-primary" /> AI Threat Analysis
      </h1>
      <p className="text-muted-foreground">
        Describe a potential security threat, and our AI will provide an analysis, confidence level, and mitigation recommendations.
      </p>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analyze Potential Threat</CardTitle>
          <CardDescription>Enter the details of the suspicious activity or potential threat below.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="threatDescription" className="text-base font-medium">Threat Description</Label>
              <Textarea
                id="threatDescription"
                value={threatDescription}
                onChange={(e) => setThreatDescription(e.target.value)}
                placeholder="e.g., 'Received an email with a suspicious attachment from an unknown sender asking for credentials.'"
                rows={5}
                className="mt-1 text-base"
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
                  Analyzing...
                </>
              ) : (
                "Analyze Threat"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{analysisResult.analysis.severity}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" />Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{(analysisResult.analysis.confidenceLevel * 100).toFixed(0)}%</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{analysisResult.analysis.explanation}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{analysisResult.analysis.recommendations}</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
