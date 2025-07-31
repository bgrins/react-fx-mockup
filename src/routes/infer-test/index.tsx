"use client";

import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { generateText, generateObject, streamText } from "ai";
import { z } from "zod";
import { createInferClient } from "../../lib/infer-client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Alert, AlertDescription } from "../../components/ui/alert";

export const Route = createFileRoute("/infer-test/")({
  component: InferTestPage,
});

function InferTestPage() {
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load access key from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem("infer-access-key");
    if (stored) {
      setAccessKey(stored);
    }
  }, []);

  // Save access key to localStorage whenever it changes
  useEffect(() => {
    if (accessKey) {
      localStorage.setItem("infer-access-key", accessKey);
    }
  }, [accessKey]);

  // Text generation state
  const [textPrompt, setTextPrompt] = useState("Write a haiku about TypeScript");

  // Structured output state
  const [structuredPrompt, setStructuredPrompt] = useState(
    "List 3 programming languages with their main use cases. For each language, include: name (string), mainUseCase (string), yearCreated (number, optional), and popularity (must be one of: 'high', 'medium', or 'low')",
  );

  // Streaming state
  const [streamPrompt, setStreamPrompt] = useState("Tell me a short story about a robot");
  const [streamingContent, setStreamingContent] = useState("");

  const handleTextGeneration = async () => {
    if (!accessKey) {
      setError("Please enter an access key");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const infer = createInferClient(accessKey);
      const { text, usage } = await generateText({
        model: infer("gpt-4o-mini"),
        prompt: textPrompt,
      });

      setResult({ text, usage });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStructuredGeneration = async () => {
    if (!accessKey) {
      setError("Please enter an access key");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const infer = createInferClient(accessKey);

      // Define the schema for programming languages
      const schema = z.object({
        languages: z
          .array(
            z.object({
              name: z.string().describe("The name of the programming language"),
              mainUseCase: z.string().describe("The primary use case or domain for this language"),
              yearCreated: z.number().optional().describe("The year the language was created"),
              popularity: z
                .enum(["high", "medium", "low"])
                .describe("Current popularity level: high, medium, or low"),
            }),
          )
          .min(3)
          .max(3)
          .describe("Exactly 3 programming languages"),
      });

      const { object, usage } = await generateObject({
        model: infer("gpt-4o-mini"),
        schema,
        prompt: structuredPrompt,
      });

      setResult({ object, usage });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStreaming = async () => {
    if (!accessKey) {
      setError("Please enter an access key");
      return;
    }

    setLoading(true);
    setError(null);
    setStreamingContent("");

    try {
      const infer = createInferClient(accessKey);
      const { textStream } = await streamText({
        model: infer("gpt-4o-mini"),
        prompt: streamPrompt,
      });

      for await (const chunk of textStream) {
        setStreamingContent((prev) => prev + chunk);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Infer Proxy Test - AI SDK Integration</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Access Configuration</CardTitle>
          <CardDescription>
            Enter your access key to authenticate with the infer proxy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="access-key">Access Key</Label>
            <Input
              id="access-key"
              type="password"
              placeholder="Enter your access key..."
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                The proxy uses this as authentication instead of an OpenAI API key
              </p>
              {accessKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAccessKey("");
                    localStorage.removeItem("infer-access-key");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">Text Generation</TabsTrigger>
          <TabsTrigger value="structured">Structured Output</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Generation</CardTitle>
              <CardDescription>Generate text using the AI SDK with our proxy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-prompt">Prompt</Label>
                <Textarea
                  id="text-prompt"
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleTextGeneration} disabled={loading}>
                {loading ? "Generating..." : "Generate Text"}
              </Button>
              {result && (
                <div className="mt-4 space-y-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{result.text}</p>
                  </div>
                  {result.usage && (
                    <p className="text-sm text-muted-foreground">
                      Tokens: {result.usage.totalTokens} (prompt: {result.usage.promptTokens},
                      completion: {result.usage.completionTokens})
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structured Output</CardTitle>
              <CardDescription>Generate structured data with Zod schema validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="structured-prompt">Prompt</Label>
                <Textarea
                  id="structured-prompt"
                  value={structuredPrompt}
                  onChange={(e) => setStructuredPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono">
                  Schema: {`{ languages: [{ name, mainUseCase, yearCreated?, popularity }] }`}
                </p>
              </div>
              <Button onClick={handleStructuredGeneration} disabled={loading}>
                {loading ? "Generating..." : "Generate Structured Data"}
              </Button>
              {result && result.object && (
                <div className="mt-4 space-y-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(result.object, null, 2)}
                    </pre>
                  </div>
                  {result.usage && (
                    <p className="text-sm text-muted-foreground">
                      Tokens: {result.usage.totalTokens}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Response</CardTitle>
              <CardDescription>Stream text responses in real-time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-prompt">Prompt</Label>
                <Textarea
                  id="stream-prompt"
                  value={streamPrompt}
                  onChange={(e) => setStreamPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleStreaming} disabled={loading}>
                {loading ? "Streaming..." : "Start Streaming"}
              </Button>
              {streamingContent && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{streamingContent}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
