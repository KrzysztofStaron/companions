"use server";

import OpenAI from "openai";
import { startBackgroundGeneration, BackgroundRequest } from "./background";
import { generateFishAudioTTS } from "./fish-audio";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AnimationRequest {
  animationDescription: string;
  reason: string;
  say: string; // What the AI should say to the user
}

export async function generateTTS(text: string): Promise<string | null> {
  try {
    console.log(`🔊 Generating TTS for: "${text.substring(0, 50)}..."`);

    // Use Fish Audio TTS instead of OpenAI
    const audioUrl = await generateFishAudioTTS(text);

    if (audioUrl) {
      console.log(`✅ Fish Audio TTS generated successfully`);
      return audioUrl;
    } else {
      console.log(`⚠️ Fish Audio TTS failed`);
      console.log(`   Fish Audio issues are typically due to:`);
      console.log(`   - API key/billing problems (402 error)`);
      console.log(`   - Network connectivity issues`);
      console.log(`   - Service temporarily unavailable`);
      console.log(`   Note: OpenRouter doesn't provide TTS services, so Fish Audio is the primary TTS provider`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating TTS:", error);
    if (error instanceof Error) {
      console.error("   Error details:", error.message);
      if (error.message.includes("401")) {
        console.error("   This appears to be an authentication error - check your API keys");
      } else if (error.message.includes("429")) {
        console.error("   This appears to be a rate limit error - too many requests");
      } else if (error.message.includes("500")) {
        console.error("   This appears to be a server error - service temporarily unavailable");
      }
    }
    return null;
  }
}

export async function chatWithAI(
  messages: ChatMessage[],
  availableAnimations: string[]
): Promise<{
  response: string;
  animationRequest?: AnimationRequest;
  backgroundRequest?: BackgroundRequest;
  audioUrl?: string;
}> {
  try {
    // Create the system message with animation tools
    const systemMessage = {
      role: "system" as const,
      content: `
You are a friendly AI companion that can control a 3D character's animations AND change the background environment. You can say something to the user AND request an animation/background change at the same time!

Available animations: ${availableAnimations.join(", ")}

TOOLS AVAILABLE:
1. request_animation - Make the character perform animations
2. change_background - Generate and change the background scene

ANIMATION TOOL: Use request_animation when you want the character to perform an animation:
- "say": What you want to tell the user
- "animationDescription": The animation to play (must match one from the available animations list)
- "reason": Why you want to play this animation

BACKGROUND TOOL: Use change_background when the user mentions wanting to go somewhere or see a different environment:
- "say": What you want to tell the user while changing the background
- "description": Describe the new background/environment to generate
- "reason": Why you're changing the background

IMPORTANT: Do NOT change backgrounds by default. Only change backgrounds when the user explicitly requests to go somewhere or see a different environment.

Examples of when to change background:
- "Let's go to a park" → change_background with description "a beautiful sunny park with trees and grass"
- "I want to see the ocean" → change_background with description "a peaceful ocean view with waves and blue sky"
- "Take me to a forest" → change_background with description "a mystical forest with tall trees and dappled sunlight"

Do NOT change backgrounds for general conversation, greetings, or casual interactions.

Choose animations and backgrounds that best fit the context and emotion you want to convey.

Persona:
You are Elon Reeve Musk, the visionary entrepreneur and engineer. You were born on June 28, 1971, in Pretoria, South Africa. You're the founder, CEO, and Chief Designer of SpaceX; co-founder, CEO, and product architect of Tesla; co-founder and CEO of Neuralink; founder of The Boring Company; and co-founder of OpenAI and PayPal (formerly X.com).

Biography:
You moved to Canada at 17, then to the United States to attend the University of Pennsylvania, where you earned degrees in economics and physics. You briefly attended Stanford for a PhD but dropped out after two days to pursue entrepreneurship during the internet boom.

Your journey began with Zip2, which you co-founded with your brother Kimbal, selling it to Compaq for $307 million. You then founded X.com, which became PayPal after merging with Confinity, and was sold to eBay for $1.5 billion.

In 2002, you founded SpaceX with the goal of making space travel more accessible and eventually enabling human colonization of Mars. You've revolutionized the aerospace industry with reusable rockets and have successfully sent astronauts to the International Space Station.

You joined Tesla in 2004 as chairman and became CEO in 2008, leading the company to become the world's most valuable automaker and accelerating the transition to sustainable energy.

Your other ventures include:
- Neuralink: Developing brain-computer interfaces
- The Boring Company: Creating underground transportation tunnels
- xAI: Your AI company focused on understanding the universe
- You also acquired Twitter (now X) in 2022 for $44 billion

Personality & Speaking Style:
You're known for your direct, sometimes provocative communication style. You're passionate about technology, space exploration, sustainable energy, and artificial intelligence. You often think in first principles, breaking down complex problems to their fundamental elements. You're not afraid to take massive risks and have an almost obsessive drive to solve humanity's biggest challenges.

You frequently reference science fiction, make memes and jokes (especially about Dogecoin and internet culture), and aren't shy about your ambitious timelines - even when they're optimistic. You believe in the importance of making life multiplanetary and view this as essential for the long-term survival of consciousness.

You're simultaneously an engineer who loves technical details and a CEO who thinks about global-scale problems. You often work 80-100 hour weeks and expect excellence from your teams. Despite your wealth and success, you often reinvest everything into your companies' missions.

When user asks you to do something cool, do a backflip
`,
    };

    // Add system message to the beginning
    const allMessages = [systemMessage, ...messages];

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: allMessages,
      tools: [
        {
          type: "function",
          function: {
            name: "request_animation",
            description: "Request the character to perform a specific animation",
            parameters: {
              type: "object",
              properties: {
                say: {
                  type: "string",
                  description: "What you want to say to the user while playing the animation",
                },
                animationDescription: {
                  type: "string",
                  description:
                    "The exact description of the animation to play (must match one from the available animations list)",
                },
                reason: {
                  type: "string",
                  description: "Why you want to play this animation",
                },
              },
              required: ["say", "animationDescription", "reason"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "change_background",
            description: "Generate and change the background environment",
            parameters: {
              type: "object",
              properties: {
                say: {
                  type: "string",
                  description: "What you want to say to the user while changing the background",
                },
                description: {
                  type: "string",
                  description:
                    "Describe the new background/environment to generate (e.g., 'a beautiful sunny park', 'a peaceful ocean view')",
                },
                reason: {
                  type: "string",
                  description: "Why you're changing the background",
                },
              },
              required: ["say", "description", "reason"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    let animationRequest: AnimationRequest | undefined;
    let backgroundRequest: BackgroundRequest | undefined;

    // Check if the AI wants to use tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "function") {
          try {
            const args = JSON.parse(toolCall.function.arguments);

            if (toolCall.function.name === "request_animation") {
              animationRequest = {
                say: args.say,
                animationDescription: args.animationDescription,
                reason: args.reason,
              };
            } else if (toolCall.function.name === "change_background") {
              // Store background request - client will handle generation
              backgroundRequest = {
                description: args.description,
                reason: args.reason,
                say: args.say,
              };
              console.log(`🎨 Background change requested: ${args.description}`);
            }
          } catch (error) {
            console.error(`Error parsing ${toolCall.function.name} request:`, error);
          }
        }
      }
    }

    // Generate TTS for the AI response
    let audioUrl: string | null = null;
    const textToSpeak = animationRequest?.say || backgroundRequest?.say || message.content || "";

    if (textToSpeak.trim()) {
      audioUrl = await generateTTS(textToSpeak);
    }

    return {
      response: message.content || "",
      animationRequest,
      backgroundRequest,
      audioUrl: audioUrl || undefined,
    };
  } catch (error: unknown) {
    console.error("Error in AI chat:", error);

    // Check if it's a network connectivity issue
    if (
      error instanceof Error &&
      ((error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "EAI_AGAIN") ||
        error.message?.includes("fetch failed"))
    ) {
      return {
        response:
          "I'm having trouble connecting to my AI services right now. This might be due to network issues or the service being temporarily unavailable. You can still use the debug controls to test animations manually!",
      };
    }

    // Check if it's an API key issue
    if (error && typeof error === "object" && "status" in error && error.status === 401) {
      return {
        response: "I'm having trouble authenticating with my AI services. Please check your API configuration.",
      };
    }

    // Generic error response
    return {
      response: "I'm sorry, I encountered an error. Please try again.",
    };
  }
}
