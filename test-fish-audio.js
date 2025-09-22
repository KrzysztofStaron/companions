// Simple test script for Fish Audio TTS
// Run with: node test-fish-audio.js

const { WebSocket } = require("ws");
const msgpack = require("msgpack-lite");

async function testFishAudio() {
  const apiKey = process.env.FISH_API_KEY;
  const modelId = process.env.MODEL_ID || "03397b4c4be74759b72533b663fbd001";

  if (!apiKey || !modelId) {
    console.error("❌ Please set FISH_API_KEY and MODEL_ID environment variables");
    console.log("Example:");
    console.log("FISH_API_KEY=your_key MODEL_ID=your_model_id node test-fish-audio.js");
    return;
  }

  console.log("🔊 Testing Fish Audio TTS...");
  console.log("API Key:", apiKey.substring(0, 10) + "...");
  console.log("Model ID:", modelId);

  return new Promise(resolve => {
    const ws = new WebSocket("wss://api.fish.audio/v1/tts/live", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        model: "speech-1.6",
      },
    });

    const audioChunks = [];
    let isFinished = false;

    ws.on("open", () => {
      console.log("✅ WebSocket connected");

      const startMessage = {
        event: "start",
        request: {
          text: "",
          latency: "normal",
          format: "mp3",
          temperature: 0.7,
          top_p: 0.7,
          reference_id: modelId,
        },
      };

      ws.send(msgpack.encode(startMessage));

      // Send test text
      const testText = "Hello, this is a test of Fish Audio TTS integration.";
      ws.send(
        msgpack.encode({
          event: "text",
          text: testText + " ",
        })
      );

      // Send stop event
      setTimeout(() => {
        ws.send(msgpack.encode({ event: "stop" }));
      }, 1000);
    });

    ws.on("message", data => {
      try {
        const message = msgpack.decode(data);

        if (message.event === "audio") {
          audioChunks.push(Buffer.from(message.audio));
          console.log("🔊 Received audio chunk:", message.time, "ms");
        } else if (message.event === "finish") {
          console.log("✅ Fish Audio test completed");
          isFinished = true;

          if (audioChunks.length > 0) {
            console.log("✅ Successfully received", audioChunks.length, "audio chunks");
            console.log(
              "✅ Total audio size:",
              audioChunks.reduce((sum, chunk) => sum + chunk.length, 0),
              "bytes"
            );
          } else {
            console.log("❌ No audio data received");
          }

          ws.close();
          resolve();
        } else if (message.event === "log") {
          console.log("📝 Fish Audio log:", message.message);
        }
      } catch (error) {
        console.error("❌ Error decoding message:", error);
        ws.close();
        resolve();
      }
    });

    ws.on("error", error => {
      console.error("❌ WebSocket error:", error);
      resolve();
    });

    ws.on("close", () => {
      console.log("🔌 WebSocket closed");
      if (!isFinished) {
        console.log("❌ Connection closed unexpectedly");
      }
      resolve();
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!isFinished) {
        console.error("❌ Test timeout");
        ws.close();
        resolve();
      }
    }, 10000);
  });
}

testFishAudio()
  .then(() => {
    console.log("🏁 Test completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
