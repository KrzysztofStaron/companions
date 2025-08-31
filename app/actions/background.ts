"use server";

export interface BackgroundRequest {
  description: string;
  reason: string;
  say: string; // What the AI should say while changing background
}

export async function generateBackground(description: string): Promise<string | null> {
  try {
    console.log(`🎨 Generating background with OpenRouter Gemini: ${description}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "AI Companion Background Generator",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview:free",
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
                       Wide aspect ratio preferred. Make sure at the bottom of the Image is a nice ground, so the character can walk on it.`,
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
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

// Store the current background URL and generation status in memory (in production, you'd use a database)
let currentBackgroundUrl: string | null = null;
let isGeneratingBackground: boolean = false;
let currentGenerationDescription: string | null = null;

export async function setCurrentBackground(url: string | null): Promise<void> {
  currentBackgroundUrl = url;
}

export async function getCurrentBackground(): Promise<string | null> {
  return currentBackgroundUrl;
}

export async function getBackgroundGenerationStatus(): Promise<{
  isGenerating: boolean;
  description: string | null;
}> {
  return {
    isGenerating: isGeneratingBackground,
    description: currentGenerationDescription,
  };
}

export async function startBackgroundGeneration(description: string): Promise<void> {
  if (isGeneratingBackground) {
    console.log(`🎨 Background generation already in progress, skipping new request`);
    return;
  }

  isGeneratingBackground = true;
  currentGenerationDescription = description;

  console.log(`🎨 Starting background generation in background: ${description}`);

  // Generate background asynchronously without blocking
  generateBackground(description)
    .then(backgroundUrl => {
      if (backgroundUrl) {
        console.log(`✅ Background generation completed: ${description}`);
        setCurrentBackground(backgroundUrl);
      } else {
        console.error(`❌ Background generation failed: ${description}`);
      }
    })
    .catch(error => {
      console.error(`❌ Background generation error:`, error);
    })
    .finally(() => {
      isGeneratingBackground = false;
      currentGenerationDescription = null;
    });
}
