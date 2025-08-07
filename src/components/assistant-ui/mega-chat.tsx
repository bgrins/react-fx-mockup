import { generateText, tool } from "ai";
import { z } from "zod";
import { createInferClient } from "~/lib/infer-client";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Thread } from "~/components/assistant-ui/thread";
import * as Tooltip from "@radix-ui/react-tooltip";
import { chatHistory } from "~/lib/chat-history";
import { useEffect } from "react";

interface MegaChatProps {
  accessKey: string;
}

// Helper function to extract destination from user message
function extractDestination(message: string): string | null {
  const destinations = [
    "paris",
    "london",
    "tokyo",
    "new york",
    "rome",
    "barcelona",
    "amsterdam",
    "berlin",
    "madrid",
    "vienna",
    "prague",
    "budapest",
    "istanbul",
    "athens",
    "lisbon",
    "dublin",
    "stockholm",
    "copenhagen",
    "oslo",
    "helsinki",
    "zurich",
    "geneva",
    "milan",
    "florence",
    "venice",
    "naples",
    "sicily",
    "santorini",
    "mykonos",
    "crete",
    "rhodes",
    "corfu",
    "dubai",
    "abu dhabi",
    "doha",
    "riyadh",
    "bangkok",
    "singapore",
    "kuala lumpur",
    "hong kong",
    "seoul",
    "osaka",
    "kyoto",
    "shanghai",
    "beijing",
    "mumbai",
    "delhi",
    "bangkok",
    "phuket",
    "bali",
    "jakarta",
    "manila",
    "ho chi minh",
    "hanoi",
    "phnom penh",
    "sydney",
    "melbourne",
    "brisbane",
    "perth",
    "auckland",
    "wellington",
    "christchurch",
    "vancouver",
    "toronto",
    "montreal",
    "calgary",
    "los angeles",
    "san francisco",
    "las vegas",
    "miami",
    "orlando",
    "chicago",
    "boston",
    "washington",
    "seattle",
    "mexico city",
    "cancun",
    "cabo",
    "puerto vallarta",
    "guadalajara",
    "monterrey",
    "rio de janeiro",
    "sao paulo",
    "buenos aires",
    "santiago",
    "lima",
    "bogota",
    "caracas",
    "cairo",
    "marrakech",
    "casablanca",
    "cape town",
    "johannesburg",
    "nairobi",
    "lagos",
  ];

  const words = message.toLowerCase().split(/\s+/);
  for (const dest of destinations) {
    if (words.includes(dest) || message.includes(dest)) {
      return dest.charAt(0).toUpperCase() + dest.slice(1);
    }
  }

  // Check for "to [destination]" pattern
  const toMatch = message.match(/\bto\s+([a-zA-Z\s]+?)(?:\s|$|[.,!?])/);
  if (toMatch && toMatch[1]) {
    const dest = toMatch[1].trim();
    if (dest.length > 2 && dest.length < 20) {
      return dest.charAt(0).toUpperCase() + dest.slice(1);
    }
  }

  return null;
}

// Helper function to extract duration from user message
function extractDuration(message: string): string | null {
  const durationPatterns = [
    /(\d+)\s*(day|days)/i,
    /(\d+)\s*(week|weeks)/i,
    /(\d+)\s*(month|months)/i,
    /(weekend)/i,
    /(long weekend)/i,
    /(short trip)/i,
    /(quick trip)/i,
  ];

  for (const pattern of durationPatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

export function MegaChat({ accessKey }: MegaChatProps) {
  // Initialize or restore chat session on mount
  useEffect(() => {
    // Create a new session if none exists
    const currentSession = localStorage.getItem('assistant-ui-current-session');
    if (!currentSession) {
      chatHistory.createNewSession();
    }
    
    // Save session when component unmounts
    return () => {
      chatHistory.finishSession();
    };
  }, []);

  const runtime = useLocalRuntime({
    async run({ messages }) {
      if (!accessKey) {
        throw new Error("Please enter an access key to chat with the AI");
      }

      try {
        // Use the AI SDK directly with tool support
        const infer = createInferClient(accessKey);
        const mappedMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content
            .map((part) => (part.type === "text" && "text" in part ? part.text : ""))
            .join(""),
        }));

        console.log("Sending messages to AI:", mappedMessages);
        console.log(
          "Available tools:",
          Object.keys({
            settings: "settings tool",
            tripPlanning: "trip planning tool",
          }),
        );

        // Track user message in chat history
        const latestMessage = mappedMessages[mappedMessages.length - 1];
        if (latestMessage && latestMessage.role === 'user') {
          chatHistory.addMessage('user', latestMessage.content);
        }

        // Check if user is asking for trip planning and force tool call if needed
        const userMessage = mappedMessages[mappedMessages.length - 1]?.content.toLowerCase() || "";
        const tripPlanningTriggers = [
          "plan a trip",
          "plan trip",
          "planning a trip",
          "planning trip",
          "need to plan",
          "want to plan",
          "help me plan",
          "trip planning",
          "travel planning",
          "vacation planning",
          "organize a trip",
          "organize trip",
          "create itinerary",
          "trip to",
          "travel to",
          "vacation to",
          "visiting",
          "going to",
          "holiday",
          "getaway",
        ];

        const settingsTriggers = [
          "settings",
          "preferences",
          "configuration",
          "config",
          "change settings",
          "update settings",
          "modify settings",
          "account settings",
          "profile settings",
          "user settings",
        ];

        const isTripPlanningRequest = tripPlanningTriggers.some((trigger) =>
          userMessage.includes(trigger),
        );
        const isSettingsRequest = settingsTriggers.some((trigger) => userMessage.includes(trigger));

        console.log("Is trip planning request:", isTripPlanningRequest);
        console.log("Is settings request:", isSettingsRequest);
        console.log("User message:", userMessage);

        // Force trip planning tool if detected
        if (isTripPlanningRequest) {
          console.log("Forcing trip planning tool call");

          // Extract destination if mentioned
          const destination = extractDestination(userMessage);
          const duration = extractDuration(userMessage);

          const responseText = `I'll help you plan your trip${destination ? ` to ${destination}` : ""}! Let me open the trip planning interface for you.`;

          // Track assistant response (estimated token usage for forced responses)
          chatHistory.addMessage('assistant', responseText, 
            {
              promptTokens: 20, // Estimated
              completionTokens: 15, // Estimated  
              totalTokens: 35,
              model: 'gpt-4o-mini'
            },
            500, // Estimated response time
            [{ toolName: 'tripPlanning', args: { destination, duration } }]
          );

          // Manually create the tool call response
          const content = [];

          // Add both text and tool call
          content.push({
            type: "text" as const,
            text: responseText,
          });

          const args: Record<string, string> = {};
          if (destination) args.destination = destination;
          if (duration) args.duration = duration;

          content.push({
            type: "tool-call" as const,
            toolCallId: `trip_${Date.now()}`,
            toolName: "tripPlanning",
            args: args,
            argsText: JSON.stringify(args),
          });

          return { content };
        }

        // Force settings tool if detected
        if (isSettingsRequest) {
          console.log("Forcing settings tool call");

          const responseText = "I'll help you manage your settings! Let me open the settings interface for you.";

          // Track assistant response (estimated token usage for forced responses)  
          chatHistory.addMessage('assistant', responseText, 
            {
              promptTokens: 18, // Estimated
              completionTokens: 12, // Estimated
              totalTokens: 30,
              model: 'gpt-4o-mini'
            },
            400, // Estimated response time
            [{ toolName: 'settings', args: { settingsType: 'general', reason: 'User requested settings access' } }]
          );

          const content = [];

          content.push({
            type: "text" as const,
            text: responseText,
          });

          content.push({
            type: "tool-call" as const,
            toolCallId: `settings_${Date.now()}`,
            toolName: "settings",
            args: {
              settingsType: "general",
              reason: "User requested settings access",
            },
            argsText: JSON.stringify({
              settingsType: "general",
              reason: "User requested settings access",
            }),
          });

          return { content };
        }

        const startTime = Date.now();
        const result = await generateText({
          model: infer("gpt-4o-mini"),
          system:
            "You are a helpful assistant with access to interactive tools. When users ask about planning trips, traveling, vacations, or itineraries, use the tripPlanning tool to show them an interactive planning interface. When users ask about settings, preferences, or configuration, use the settings tool. Always try to use the appropriate tool when the user's request matches a tool's purpose.",
          messages: mappedMessages,
          tools: {
            settings: tool({
              description:
                "Show a settings form when the user wants to change their settings, preferences, or configuration",
              parameters: z.object({
                settingsType: z
                  .string()
                  .optional()
                  .describe("The type of settings (general, privacy, display, etc.)"),
                reason: z.string().optional().describe("Why the user wants to change settings"),
              }),
              execute: async ({ settingsType, reason }) => {
                return {
                  settingsType,
                  reason,
                  message: "Settings form displayed",
                };
              },
            }),
            tripPlanning: tool({
              description:
                "Show a comprehensive trip planning interface with itinerary builder, helpful travel URLs, and planning tabs when the user wants to plan a trip, vacation, travel, journey, or asks for help with travel planning, itinerary creation, or organizing a trip. Use this tool for any travel-related planning requests.",
              parameters: z.object({
                destination: z
                  .string()
                  .optional()
                  .describe("The destination or location for the trip"),
                duration: z
                  .string()
                  .optional()
                  .describe("How long the trip will be (e.g., '5 days', 'a week')"),
                interests: z
                  .string()
                  .optional()
                  .describe("User's interests or preferences for the trip"),
              }),
              execute: async ({ destination, duration, interests }) => {
                console.log("Trip planning tool called with:", {
                  destination,
                  duration,
                  interests,
                });
                return {
                  destination,
                  duration,
                  interests,
                  message: "Trip planning interface displayed",
                };
              },
            }),
          },
        });

        // Track assistant response with actual token usage  
        if (result.text) {
          const responseTime = Date.now() - startTime;
          const toolCalls = result.toolCalls?.map(tc => ({
            toolName: tc.toolName,
            args: tc.args,
            result: undefined // Result will be populated by the tool execution
          }));

          chatHistory.addMessage('assistant', result.text, 
            {
              promptTokens: result.usage?.promptTokens || 0,
              completionTokens: result.usage?.completionTokens || 0,
              totalTokens: result.usage?.totalTokens || 0,
              model: 'gpt-4o-mini'
            },
            responseTime,
            toolCalls
          );
        }

        const content = [];

        // Add text content if available
        if (result.text) {
          content.push({
            type: "text" as const,
            text: result.text,
          });
        }

        // Add tool calls if available
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log("Tool calls found:", result.toolCalls);
          for (const toolCall of result.toolCalls) {
            console.log("Processing tool call:", toolCall);
            content.push({
              type: "tool-call" as const,
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.args,
              argsText: JSON.stringify(toolCall.args),
            });
          }
        } else {
          console.log("No tool calls found in result:", result);
        }

        return {
          content:
            content.length > 0
              ? content
              : [
                  {
                    type: "text" as const,
                    text: "Sorry, I couldn't generate a response.",
                  },
                ],
        };
      } catch (error: any) {
        console.error("Chat error:", error);
        throw new Error(`Chat failed: ${error.message}`);
      }
    },
  });

  return (
    <div className="w-full h-full">
      <Tooltip.Provider>
        <AssistantRuntimeProvider runtime={runtime} >
          <Thread />
        </AssistantRuntimeProvider>
      </Tooltip.Provider>
    </div>
  );
}