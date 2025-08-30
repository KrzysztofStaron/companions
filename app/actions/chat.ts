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
  animationName: string;
  reason: string;
}

export async function chatWithAI(
  messages: ChatMessage[],
  availableAnimations: string[]
): Promise<{ response: string; animationRequest?: AnimationRequest; audioUrl?: string }> {
  try {
    // Create the system message with animation tools
    const systemMessage = {
      role: "system" as const,
      content: `You are a friendly AI companion that can control a 3D character's animations. You can request specific animations to express emotions, actions, or responses.

Available animations: ${availableAnimations.join(", ")}

When you want the character to perform an animation, use the request_animation tool. Always return to idle after any animation.

Be conversational, helpful, and use animations to enhance your responses. Keep responses concise and engaging.`
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
                animationName: {
                  type: "string",
                  description: "The exact name of the animation to play"
                },
                reason: {
                  type: "string",
                  description: "Why you want to play this animation"
                }
              },
              required: ["animationName", "reason"]
            }
          }
        }
      ],
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    let animationRequest: AnimationRequest | undefined;

    // Check if the AI wants to play an animation
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "request_animation") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          animationRequest = {
            animationName: args.animationName,
            reason: args.reason
          };
        } catch (error) {
          console.error("Error parsing animation request:", error);
        }
      }
    }

    // Generate TTS audio for the response
    let audioUrl: string | undefined;
    if (message.content) {
      try {
        const audioResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: message.content,
        });

        // Convert the audio to base64 for embedding
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const base64Audio = audioBuffer.toString('base64');
        audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      } catch (error) {
        console.error("Error generating TTS:", error);
      }
    }

    return {
      response: message.content || "",
      animationRequest,
      audioUrl
    };
  } catch (error) {
    console.error("Error in AI chat:", error);
    return {
      response: "I'm sorry, I encountered an error. Please try again.",
    };
  }
}
