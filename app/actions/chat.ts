"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

export async function chatWithAI(
  messages: ChatMessage[],
  availableAnimations: string[]
): Promise<{ response: string; animationRequest?: AnimationRequest; audioUrl?: string }> {
  try {
    // Create the system message with animation tools
    const systemMessage = {
      role: "system" as const,
      content: `You are a friendly AI companion that can control a 3D character's animations. You can now say something to the user AND request an animation at the same time!

Available animations: ${availableAnimations.join(", ")}

IMPORTANT: Use the request_animation tool to do BOTH:
1. Say something to the user (use the "say" parameter)
2. Make the character perform a relevant animation

When you want the character to perform an animation, use the request_animation tool with:
- "say": What you want to tell the user
- "animationDescription": The animation to play (must match one from the available animations list)
- "reason": Why you want to play this animation

Choose animations that best fit the context and emotion you want to convey. Always return to idle after any animation.

Be conversational, helpful, and use animations to enhance your responses. Keep responses concise and engaging.`,
    };

    // Add system message to the beginning
    const allMessages = [systemMessage, ...messages];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      ],
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    let animationRequest: AnimationRequest | undefined;

    // Check if the AI wants to play an animation
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.type === "function" && toolCall.function.name === "request_animation") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          animationRequest = {
            say: args.say,
            animationDescription: args.animationDescription,
            reason: args.reason,
          };
        } catch (error) {
          console.error("Error parsing animation request:", error);
        }
      }
    }

    // Generate TTS audio for the response
    let audioUrl: string | undefined;
    const textToSpeak = message.content || animationRequest?.say || "";

    if (textToSpeak) {
      try {
        const audioResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: "echo",
          input: textToSpeak,
        });

        // Convert the audio to base64 for embedding
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const base64Audio = audioBuffer.toString("base64");
        audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      } catch (error) {
        console.error("Error generating TTS:", error);
      }
    }

    return {
      response: message.content || "",
      animationRequest,
      audioUrl,
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
