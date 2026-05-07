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

    // Google TTS se audio lo
    let audioBase64 = null;
    try {
      const ttsResponse = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: replyText },
            voice: {
              languageCode: "ur-PK",
              name: "ur-PK-Wavenet-A",
              ssmlGender: "FEMALE",
            },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        audioBase64 = ttsData.audioContent;
      } else {
        const err = await ttsResponse.text();
        console.error("Google TTS Error:", ttsResponse.status, err);
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