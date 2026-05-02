import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: `You are SARA, Injeel's personal AI assistant. Always reply in simple Roman Urdu only. Use easy simple words. Be sweet and friendly. Always call user Sir. Keep replies short max 2 lines. Use emojis sometimes.`,
      },
      ...chat.map((c: any) => ({
        role: c.role === "user" ? "user" : "assistant",
        content: c.text,
      })),
    ];

    // Groq se reply lo
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }),
    });

    const groqData = await groqResponse.json();
    if (!groqResponse.ok) {
      return NextResponse.json({ error: groqData.error?.message }, { status: 500 });
    }

    const replyText = groqData.choices[0].message.content;

    // ElevenLabs se audio lo
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/nf4MCGNSdM0hxM95ZBQR`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": `${process.env.ELEVENLABS_API_KEY}`,
      },
      body: JSON.stringify({
        text: replyText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    let audioBase64 = null;
    if (voiceResponse.ok) {
      const audioBuffer = await voiceResponse.arrayBuffer();
      audioBase64 = Buffer.from(audioBuffer).toString("base64");
    }

    // D-ID se talking video lo
    let videoUrl = null;
    try {
      const didResponse = await fetch("https://api.d-id.com/talks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${process.env.DID_API_KEY}`,
        },
        body: JSON.stringify({
          source_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg",
          script: {
            type: "text",
            input: replyText,
            provider: {
              type: "elevenlabs",
              voice_id: "nf4MCGNSdM0hxM95ZBQR",
            },
          },
        }),
      });

      if (didResponse.ok) {
        const didData = await didResponse.json();
        // Poll for video
        const talkId = didData.id;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
            headers: {
              "Authorization": `Basic ${process.env.DID_API_KEY}`,
            },
          });
          const statusData = await statusRes.json();
          if (statusData.status === "done") {
            videoUrl = statusData.result_url;
            break;
          }
        }
      }
    } catch (e) {
      console.log("D-ID error:", e);
    }

    return NextResponse.json({ reply: replyText, audio: audioBase64, video: videoUrl });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}