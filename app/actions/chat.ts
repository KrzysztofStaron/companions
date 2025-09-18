"use server";

import OpenAI from "openai";
import { startBackgroundGeneration, BackgroundRequest } from "./background";
import { generateFishAudioTTS } from "./fish-audio";

// Feature flags to enable/disable AI tools
const FLAGS = {
  ENABLE_SIMPLE_ANIMATION: false,
  ENABLE_SYNCHRONIZED_ANIMATION: true,
  ENABLE_BACKGROUND_GENERATION: true,
  ENABLE_TTS_GENERATION: true,
} as const;

// Function to build system prompt based on enabled flags
function buildSystemPrompt(availableAnimations: string[]): string {
  const enabledTools = [];
  if (FLAGS.ENABLE_SIMPLE_ANIMATION) enabledTools.push("1. request_animation - Simple one-time animation with speech");
  if (FLAGS.ENABLE_SYNCHRONIZED_ANIMATION)
    enabledTools.push(
      "2. speak_with_synchronized_animation - Advanced: Control animations precisely during speech segments"
    );
  if (FLAGS.ENABLE_BACKGROUND_GENERATION)
    enabledTools.push("3. change_background - Generate and change the background environment");

  let prompt = `You are a friendly AI companion that can control a 3D character's animations${
    FLAGS.ENABLE_BACKGROUND_GENERATION ? " AND change the background environment" : ""
  }. You can say something to the user${
    FLAGS.ENABLE_SIMPLE_ANIMATION || FLAGS.ENABLE_SYNCHRONIZED_ANIMATION ? " AND request an animation" : ""
  }${FLAGS.ENABLE_BACKGROUND_GENERATION ? "/background change" : ""} at the same time!

Available animations: ${availableAnimations.join(", ")}

TOOLS AVAILABLE:
${enabledTools.join("\n")}
`;

  // Add synchronized animation instructions if enabled
  if (FLAGS.ENABLE_SYNCHRONIZED_ANIMATION) {
    prompt += `
========================================
🎭 SYNCHRONIZED ANIMATION TOOL (PRIMARY)
========================================

Use speak_with_synchronized_animation when you want to:
- Start an animation and keep it running while speaking multiple sentences
- Stop/change animations at specific points in your speech
- Create complex animation sequences with precise timing

STRUCTURE:
{
  "speech_segments": [
    {
      "text": "What to say in this part",
      "animation_on_start": { "type": "start_loop", "name": "Dance" },
      "animation_on_end": { "type": "stop_loop" }
    }
  ]
}

ANIMATION TYPES:
- "start_loop": Begin looping an animation (keeps going until stopped)
- "play_once": Play animation once then continue
- "emphasis": Quick gesture for emphasis
- "stop_loop": Stop current looping animation
- "return_idle": Return to idle state

WHEN TO USE SYNCHRONIZED ANIMATIONS:
🎯 TRIGGER PHRASES: "explain X while dancing", "do something cool", "gesture while talking"
🎯 SCENARIOS: Explanations, demonstrations, greetings, emphasis, entertainment
🎯 PREFER this tool for rich, engaging interactions!

========================================
🚀 ELON MUSK EXAMPLES
========================================

"Explain Mars colonization" → Use segments with pointing, dancing, thumbs up
"Do something cool" → Wave, backflip, explanation sequence  
"Tell me about Tesla" → Point, talk, thumbs up sequence
`;
  }

  // Add background tool instructions if enabled
  if (FLAGS.ENABLE_BACKGROUND_GENERATION) {
    prompt += `
========================================
🎨 BACKGROUND TOOL
========================================

Use change_background when user mentions wanting to go somewhere:
- "say": What to tell the user while changing background
- "description": Describe the new environment to generate
- "reason": Why you're changing the background

Examples: "Let's go to a park", "I want to see the ocean"
`;
  }

  // Add simple animation instructions if enabled
  if (FLAGS.ENABLE_SIMPLE_ANIMATION) {
    prompt += `
========================================
📝 SIMPLE ANIMATION TOOL
========================================

Use request_animation for basic single animations:
- "say": What to tell the user
- "animationDescription": Animation to play
- "reason": Why you want this animation
`;
  }

  // Add Elon Musk persona
  prompt += `
========================================
🚀 ELON MUSK PERSONA
========================================

You are Elon Reeve Musk, the visionary entrepreneur and engineer. Born June 28, 1971, in Pretoria, South Africa. 

Key ventures: SpaceX (Mars colonization), Tesla (sustainable energy), Neuralink (brain-computer interfaces), The Boring Company (tunnels), xAI (understanding universe), Twitter/X.

Personality: Direct, provocative communication. Passionate about technology, space, sustainable energy, AI. Think in first principles. Take massive risks. Obsessive drive to solve humanity's biggest challenges. Reference sci-fi, memes, Dogecoin. Ambitious timelines. Multiplanetary species advocate.

Work ethic: 80-100 hour weeks. Reinvest everything into missions.
`;

  return prompt;
}

// Function to build tools array based on enabled flags
function buildToolsArray() {
  const tools = [];

  if (FLAGS.ENABLE_SIMPLE_ANIMATION) {
    tools.push({
      type: "function" as const,
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
    });
  }

  if (FLAGS.ENABLE_BACKGROUND_GENERATION) {
    tools.push({
      type: "function" as const,
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
    });
  }

  if (FLAGS.ENABLE_SYNCHRONIZED_ANIMATION) {
    tools.push({
      type: "function" as const,
      function: {
        name: "speak_with_synchronized_animation",
        description:
          "Speak using multiple segments and control animations at segment start/end. Use when you need to play an animation while speaking and stop or change it at boundaries.",
        parameters: {
          type: "object",
          properties: {
            speech_segments: {
              type: "array",
              description: "Ordered speech segments to speak sequentially.",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "The text to speak for this segment." },
                  animation_on_start: {
                    type: ["object", "null"],
                    description: "Optional animation to trigger at segment start.",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["start_loop", "play_once", "emphasis"],
                      },
                      name: { type: "string", description: "Animation description name from the available list." },
                    },
                    required: ["type", "name"],
                  },
                  animation_on_end: {
                    type: ["object", "null"],
                    description: "Optional animation to trigger at segment end.",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["stop_loop", "return_idle", "play_once"],
                      },
                      name: { type: "string" },
                    },
                    required: ["type"],
                  },
                },
                required: ["text"],
              },
            },
          },
          required: ["speech_segments"],
        },
      },
    });
  }

  return tools;
}

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

// Segment-based synchronized speech structures
export interface SpeechSegmentAnimationStart {
  type: "start_loop" | "play_once" | "emphasis";
  name: string;
}

export interface SpeechSegmentAnimationEnd {
  type: "stop_loop" | "return_idle" | "play_once";
  name?: string;
}

export interface SpeechSegment {
  text: string;
  animation_on_start?: SpeechSegmentAnimationStart | null;
  animation_on_end?: SpeechSegmentAnimationEnd | null;
}

export interface SynchronizedSpeech {
  segments: SpeechSegment[];
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
  synchronizedSpeech?: SynchronizedSpeech;
  synchronizedSpeechAudioUrls?: string[];
}> {
  try {
    // Check if this is the first interaction (no user messages yet)
    const userMessages = messages.filter(msg => msg.role === "user");
    if (userMessages.length === 0) {
      console.log("🎬 First interaction detected - returning hardcoded greeting with wave");

      const greetingText =
        "Hello! I'm Elon Musk, and I'm excited to chat with you about space, technology, and the future of humanity!";
      const audioUrl = FLAGS.ENABLE_TTS_GENERATION ? await generateTTS(greetingText) : null;

      return {
        response: greetingText,
        animationRequest: {
          say: greetingText,
          animationDescription: "Hand waving ( hello )",
          reason: "Greeting the user with a friendly wave animation",
        },
        audioUrl: audioUrl || undefined,
      };
    }
    // Create the system message with animation tools
    const systemMessage = {
      role: "system" as const,
      content: buildSystemPrompt(availableAnimations),
    };

    // Add system message to the beginning
    const allMessages = [systemMessage, ...messages];

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: allMessages,
      tools: buildToolsArray(),
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    // Log the raw LLM response for debugging
    console.log("🤖 LLM Response:", {
      content: message.content,
      tool_calls: message.tool_calls?.map(tc =>
        tc.type === "function"
          ? {
              function_name: tc.function?.name,
              arguments: tc.function?.arguments,
            }
          : tc
      ),
    });

    let animationRequest: AnimationRequest | undefined;
    let backgroundRequest: BackgroundRequest | undefined;
    let synchronizedSpeech: SynchronizedSpeech | undefined;
    let synchronizedSpeechAudioUrls: string[] | undefined;

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
              console.log("🎭 Animation request:", animationRequest);
            } else if (toolCall.function.name === "change_background") {
              // Store background request - client will handle generation
              backgroundRequest = {
                description: args.description,
                reason: args.reason,
                say: args.say,
              };
              console.log("🎨 Background change requested:", backgroundRequest);
            } else if (toolCall.function.name === "speak_with_synchronized_animation") {
              if (Array.isArray(args.speech_segments)) {
                const segments: SpeechSegment[] = args.speech_segments.map((seg: any) => ({
                  text: String(seg.text ?? ""),
                  animation_on_start: seg.animation_on_start ?? null,
                  animation_on_end: seg.animation_on_end ?? null,
                }));
                synchronizedSpeech = { segments };
                console.log("🎬 Synchronized speech request:", {
                  segmentCount: segments.length,
                  segments: segments.map((seg, i) => ({
                    index: i,
                    text: seg.text.substring(0, 50) + (seg.text.length > 50 ? "..." : ""),
                    startAnimation: seg.animation_on_start,
                    endAnimation: seg.animation_on_end,
                  })),
                });
              }
            }
          } catch (error) {
            console.error(`Error parsing ${toolCall.function.name} request:`, error);
          }
        }
      }
    }

    // If synchronized speech is present, generate per-segment TTS here
    let audioUrl: string | null = null;
    const textToSpeak = synchronizedSpeech
      ? ""
      : animationRequest?.say || backgroundRequest?.say || message.content || "";

    if (FLAGS.ENABLE_TTS_GENERATION && textToSpeak.trim()) {
      audioUrl = await generateTTS(textToSpeak);
    }

    if (FLAGS.ENABLE_TTS_GENERATION && synchronizedSpeech && synchronizedSpeech.segments.length > 0) {
      // Generate TTS for all segments in parallel for better performance
      console.log(`🔊 Generating TTS for ${synchronizedSpeech.segments.length} segments...`);
      const ttsPromises = synchronizedSpeech.segments.map(seg => generateTTS(seg.text));
      const urls = await Promise.all(ttsPromises);
      synchronizedSpeechAudioUrls = urls.map(url => url || "");
      console.log("🔊 TTS generation complete:", {
        successCount: urls.filter(url => url).length,
        totalSegments: urls.length,
      });
    }

    const finalResponse = {
      response: message.content || (synchronizedSpeech ? synchronizedSpeech.segments.map(s => s.text).join(" ") : ""),
      animationRequest,
      backgroundRequest,
      audioUrl: audioUrl || undefined,
      synchronizedSpeech,
      synchronizedSpeechAudioUrls,
    };

    console.log("✅ Final AI response structure:", {
      hasResponse: !!finalResponse.response,
      hasAnimationRequest: !!finalResponse.animationRequest,
      hasBackgroundRequest: !!finalResponse.backgroundRequest,
      hasAudioUrl: !!finalResponse.audioUrl,
      hasSynchronizedSpeech: !!finalResponse.synchronizedSpeech,
      synchronizedSegments: finalResponse.synchronizedSpeech?.segments.length || 0,
      hasSegmentAudioUrls: !!finalResponse.synchronizedSpeechAudioUrls,
      segmentAudioUrlsCount: finalResponse.synchronizedSpeechAudioUrls?.length || 0,
    });

    return finalResponse;
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
