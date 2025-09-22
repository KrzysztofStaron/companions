"use server";

import { Session, TTSRequest } from "fish-audio-sdk";

export async function generateFishAudioTTS(text: string): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const apiKey = process.env.FISH_API_KEY;
    const modelId = process.env.MODEL_ID || "03397b4c4be74759b72533b663fbd001";

    if (!apiKey) {
      console.error("❌ Fish Audio configuration missing:");
      console.error("   - FISH_API_KEY environment variable not set");
      return null;
    }

    console.log(`🔊 Generating Fish Audio TTS for: "${text.substring(0, 50)}..."`);

    // Create session with Fish Audio
    const session = new Session(apiKey);

    // Create TTS request
    const request = new TTSRequest(text, {
      format: "mp3",
      latency: "balanced",
      referenceId: modelId, // Use custom model if provided
      modelId: "s1",
      prosody: {
        speed: 1.0,
        volume: 1.0,
      },
    });

    // Create a ReadableStream to stream audio chunks
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Start generating TTS and enqueue chunks as they arrive
        (async () => {
          try {
            for await (const chunk of session.tts(request)) {
              controller.enqueue(new Uint8Array(chunk));
              console.log(`🔊 Enqueued audio chunk: ${chunk.length} bytes`);
            }
            controller.close();
            console.log(`✅ Fish Audio TTS stream completed`);
          } catch (error) {
            console.error("❌ Error in TTS stream:", error);
            controller.error(error);
          } finally {
            // Always close the session
            session.close();
          }
        })();
      },
      cancel() {
        // Handle stream cancellation
        console.log("🔊 TTS stream cancelled");
        session.close();
      },
    });

    return stream;
  } catch (error: any) {
    console.error("❌ Fish Audio TTS error:", error);

    // Enhanced error messages based on the error type
    if (error.message?.includes("401") || error.status === 401) {
      console.error("   → Authentication failed - Check your FISH_API_KEY");
    } else if (error.message?.includes("402") || error.status === 402) {
      console.error("   → Payment required - API quota exceeded or billing issue");
    } else if (error.message?.includes("403") || error.status === 403) {
      console.error("   → Access forbidden - Check API permissions");
    } else if (error.message?.includes("429") || error.status === 429) {
      console.error("   → Rate limit exceeded - Too many requests");
    } else if (error.message?.includes("500") || error.status === 500) {
      console.error("   → Server error - Fish Audio service temporarily unavailable");
    } else if (error.message?.includes("ECONNREFUSED")) {
      console.error("   → Connection refused - Check network connectivity");
    } else if (error.message?.includes("ENOTFOUND")) {
      console.error("   → Service not found - Check internet connection");
    } else if (error.message?.includes("ETIMEDOUT")) {
      console.error("   → Connection timeout - Network may be slow");
    } else {
      console.error("   → Error details:", error.message || error);
    }

    return null;
  }
}
