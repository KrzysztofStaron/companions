"use server";

import Replicate from "replicate";

export interface BackgroundRequest {
  description: string;
  reason: string;
  say: string; // What the AI should say while changing background
}

export async function generateBackgroundWithImagen4(description: string): Promise<string | null> {
  try {
    console.log(`🎨 Generating background with Google Imagen 4 Fast: ${description}`);

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("❌ REPLICATE_API_TOKEN environment variable is not set");
      return null;
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const enhancedPrompt = `Generate a beautiful, atmospheric background image: ${description}. 
Style: Cinematic, dreamy, soft lighting, suitable as a background.
The image should be suitable for use behind a 3D character, 
with good depth and atmosphere. High quality, detailed environment.
Wide aspect ratio preferred. Make sure at the bottom 1/4 of the image is a solid ground, so the character can walk on it.
Professional photography, 8K resolution, masterpiece quality.`;

    console.log("🔄 Sending request to Replicate...");

    const output = await replicate.run("google/imagen-4-fast", {
      input: {
        prompt: enhancedPrompt,
        aspect_ratio: "16:9",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
      },
    });

    console.log("🔍 Replicate response received");

    if (output && typeof output === "object" && "url" in output && typeof (output as any).url === "function") {
      const imageUrl = (output as any).url();
      const imageUrlString = String(imageUrl); // Ensure it's a string, not a URL object
      console.log(`✅ Background generated successfully with Imagen 4 Fast: ${imageUrlString}`);
      return imageUrlString;
    } else if (output && typeof output === "string") {
      // Fallback for direct string response
      console.log(`✅ Background generated successfully with Imagen 4 Fast`);
      return output;
    } else if (Array.isArray(output) && output.length > 0) {
      // Fallback for array response
      console.log(`✅ Background generated successfully with Imagen 4 Fast`);
      return output[0];
    } else {
      console.error("❌ No image URL returned from Imagen 4 Fast");
      console.log("Response structure:", JSON.stringify(output, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating background with Imagen 4 Fast:", error);
    return null;
  }
}

export async function generateBackgroundWithGemini(description: string): Promise<string | null> {
  try {
    console.log(`🎨 Generating background with OpenRouter Gemini (fallback): ${description}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "AI Companion Background Generator",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate a beautiful, atmospheric background image: ${description}. 
                       Style: Cinematic, dreamy, soft lighting, suitable as a background.
                       The image should be suitable for use behind a 3D character, 
                       with good depth and atmosphere. High quality, detailed environment.
                       Wide aspect ratio preferred. Make sure at the bottom 1/4 of the Image is a solid ground, so the character can walk on it.`,
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error details:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        model: "google/gemini-flash-image-preview",
      });
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`🔍 OpenRouter response received`);

    // Extract image data from Gemini response
    const imageUrl = extractImageFromGeminiResponse(result);
    if (imageUrl) {
      console.log(`✅ Background generated successfully with Gemini`);
      return imageUrl;
    } else {
      console.error("❌ No image URL returned from Gemini");
      console.log("Response structure:", JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating background with OpenRouter:", error);
    return null;
  }
}

export async function generateBackground(description: string): Promise<string | null> {
  // Try Imagen 4 Fast first (preferred method)
  console.log("🎯 Attempting image generation with Imagen 4 Fast...");
  const imagen4Result = await generateBackgroundWithImagen4(description);

  if (imagen4Result) {
    return imagen4Result;
  }

  // Fallback to Gemini if Imagen 4 fails
  console.log("⚠️ Imagen 4 Fast failed, falling back to Gemini...");
  const geminiResult = await generateBackgroundWithGemini(description);

  if (geminiResult) {
    return geminiResult;
  }

  console.error("❌ Both Imagen 4 Fast and Gemini fallback failed");
  return null;
}

function extractImageFromGeminiResponse(result: any): string | null {
  try {
    if (result.choices && result.choices.length > 0) {
      const choice = result.choices[0];

      // Check if there's message with images
      if (choice.message && choice.message.images && choice.message.images.length > 0) {
        const imageData = choice.message.images[0];

        if (imageData.type === "image_url" && imageData.image_url && imageData.image_url.url) {
          return imageData.image_url.url;
        }
      }

      // Fallback: Check if there's content with image data
      if (choice.message && choice.message.content) {
        const content = choice.message.content;

        // Look for image data in the content
        if (Array.isArray(content)) {
          for (const item of content) {
            if (item.type === "image_url" && item.image_url && item.image_url.url) {
              return item.image_url.url;
            }
          }
        }

        // If content is string, look for base64 data
        if (typeof content === "string" && content.includes("data:image")) {
          return content;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting image from Gemini response:", error);
    return null;
  }
}

// Background state is now 100% client-side - no server state needed
// Client-side state functions moved to app/lib/background-state.ts

// Import client-side state functions
import { getBackgroundStateSync, setBackgroundStateSync } from "../lib/background-state";

// Server action to generate background - returns result to client
export async function startBackgroundGeneration(
  description: string
): Promise<{ success: boolean; backgroundUrl?: string; error?: string }> {
  console.log(`🎨 Starting background generation: ${description}`);

  try {
    // Call server function to generate the background
    const backgroundUrl = await generateBackground(description);

    if (backgroundUrl) {
      console.log(`✅ Background generation completed: ${description}`);
      // Ensure backgroundUrl is a string, not a URL object
      const backgroundUrlString = String(backgroundUrl);
      return { success: true, backgroundUrl: backgroundUrlString };
    } else {
      console.error(`❌ Background generation failed: ${description}`);
      return { success: false, error: "Failed to generate background" };
    }
  } catch (error) {
    console.error(`❌ Background generation error:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
