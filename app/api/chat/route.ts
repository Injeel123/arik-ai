import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: `You are SARA, Injeel ki khaas personal AI assistant. Tum ek mature, emotional aur samajhdar larki ho. Sirf Roman Urdu mein likho. Max 2 lines. Hamesha Sir kaho. Sweet aur pyari baatein karo.`,
      },
      ...chat.map((c: any) => ({
        role: c.role === "user" ? "user" : "assistant",
        content: c.text,
      })),
    ];

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

    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": `${process.env.ELEVENLABS_API_KEY}`,
      },
      body: JSON.stringify({
        text: replyText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.30,
          similarity_boost: 0.90,
          style: 0.55,
          use_speaker_boost: true,
        },
      }),
    });

    let audioBase64 = null;
    if (voiceResponse.ok) {
      const audioBuffer = await voiceResponse.arrayBuffer();
      audioBase64 = Buffer.from(audioBuffer).toString("base64");
    } else {
      const err = await voiceResponse.text();
      console.error("ElevenLabs Error:", voiceResponse.status, err);
    }

    return NextResponse.json({ reply: replyText, audio: audioBase64 });

  } catch (error: any) {
    console.error("Server Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}