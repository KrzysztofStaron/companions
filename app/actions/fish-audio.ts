"use server";

import { Session, TTSRequest } from "fish-audio-sdk";

export async function generateFishAudioTTS(text: string): Promise<string | null> {
  try {
    const apiKey = process.env.FISH_API_KEY;
    const modelId = process.env.MODEL_ID;

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
      prosody: {
        speed: 1.0,
        volume: 1.0,
      },
    });

    // Generate audio chunks
    const audioChunks: Buffer[] = [];

    try {
      for await (const chunk of session.tts(request)) {
        audioChunks.push(chunk);
        //console.log(`🔊 Received audio chunk: ${chunk.length} bytes`);
      }
    } finally {
      // Always close the session
      session.close();
    }

    if (audioChunks.length > 0) {
      // Concatenate all chunks and convert to base64 data URL
      const fullAudio = Buffer.concat(audioChunks);
      const base64Audio = fullAudio.toString("base64");
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      console.log(`✅ Fish Audio TTS generated successfully (${fullAudio.length} bytes)`);
      return audioUrl;
    } else {
      console.error("❌ Fish Audio TTS failed: No audio data received");
      return null;
    }
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
