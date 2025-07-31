import { createOpenAI } from "@ai-sdk/openai";

// Create a custom OpenAI provider that points to our infer proxy
export const inferProxy = createOpenAI({
  baseURL: "https://infer.arewexblstill.com/v1",
  apiKey: "", // We'll pass the access key as the API key
  // The proxy will validate this as an access key
});

// Helper to create the provider with an access key
export function createInferClient(accessKey: string) {
  return createOpenAI({
    baseURL: "https://infer.arewexblstill.com/v1",
    apiKey: accessKey, // The proxy will validate this as an access key
  });
}
