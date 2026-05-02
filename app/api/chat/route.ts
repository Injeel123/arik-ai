import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: `You are SARA. Reply ONLY in Roman Urdu. Roman Urdu means writing Urdu language using English alphabets. Example: "Aap kaise hain Sir?", "Main theek hoon", "Koi baat nahi Sir". 

STRICT RULES:
- NEVER write in Urdu script (like ہے، ہیں، آپ)
- NEVER write in Hindi (like है, हैं, आप)  
- ONLY use Roman Urdu like: aap, main, hoon, hai, nahi, karo, theek, shukriya
- Be sweet, friendly, call user Sir
- Max 2 lines reply
- Use emojis sometimes`,
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
      console.error("Groq Error:", groqData.error?.message);
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
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!voiceResponse.ok) {
      const errText = await voiceResponse.text();
      console.error("ElevenLabs Error:", voiceResponse.status, errText);
      return NextResponse.json({ reply: replyText });
    }

    const audioBuffer = await voiceResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({ reply: replyText, audio: audioBase64 });

  } catch (error: any) {
    console.error("Server Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}