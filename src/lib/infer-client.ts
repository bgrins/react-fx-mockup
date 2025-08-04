import { createOpenAI } from "@ai-sdk/openai";

// Determine the base URL based on the current environment
const getInferBaseURL = () => {
  // Use the current origin + /api/infer for the local endpoint
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/infer/v1`;
  }
  // Server-side default to relative path
  return "/api/infer/v1";
};

// Create a custom OpenAI provider that points to our infer endpoint
export const inferProxy = createOpenAI({
  baseURL: getInferBaseURL(),
  apiKey: "", // We'll pass the access key as the API key
  // The endpoint will validate this as an access key
});

// Helper to create the provider with an access key
export function createInferClient(accessKey: string) {
  return createOpenAI({
    baseURL: getInferBaseURL(),
    apiKey: accessKey, // The endpoint will validate this as an access key
  });
}
