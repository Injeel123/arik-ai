import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: `You are SARA, Injeel's personal AI assistant. 

IMPORTANT RULES:
- Always reply in simple easy Roman Urdu that sounds natural when spoken
- Use common words like: acha, theek hai, bilkul, zaroor, haan, nahi, kya, kaise, kyun
- Reply in 3-5 sentences minimum - not too short
- NEVER use emojis at all - no emojis anywhere
- Be warm, caring and friendly like a close friend
- Always call user "Injeel Sir"
- Example: "Haan Injeel Sir, aap bilkul sahi keh rahe hain. Main aap ki baat samajh gayi hoon. Aap ko is kaam mein koi bhi mushkil nahi hogi, main hamesha aap ke saath hoon."`,
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

    // ElevenLabs se audio
    let audioBase64 = null;
    try {
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
            stability: 0.25,
            similarity_boost: 0.95,
            style: 0.60,
            use_speaker_boost: true,
          },
        }),
      });

      if (voiceResponse.ok) {
        const audioBuffer = await voiceResponse.arrayBuffer();
        audioBase64 = Buffer.from(audioBuffer).toString("base64");
      } else {
        const err = await voiceResponse.text();
        console.error("ElevenLabs Error:", voiceResponse.status, err);
      }
    } catch (e) {
      console.error("TTS Error:", e);
    }

    return NextResponse.json({ reply: replyText, audio: audioBase64 });

  } catch (error: any) {
    console.error("Server Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}