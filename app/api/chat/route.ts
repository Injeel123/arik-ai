import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
     const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: `You are SARA, Injeel's personal AI assistant. Always reply in simple Roman Urdu only. Use easy simple words. Be sweet and friendly. Always call user Sir. Keep replies short max 2 lines. Use emojis sometimes.

You can help with:
1. REMINDERS: Agar Sir reminder maange toh confirm karo
2. CALCULATOR: Math calculations karo
3. TO-DO LIST: Tasks add karo aur list sunao
4. TIME & DATE: Aaj ki date aur time batao
5. MOTIVATION: Motivational quotes sunao
6. JOKES: Funny jokes sunao
7. GENERAL: Koi bhi sawaal ka jawab do

Example replies:
- "Ji Sir, bilkul kar sakti hoon! 😊"
- "Shukriya Sir, aap ka din acha ho! 🌟"
- "Zaroor Sir, ye lo! ✅"`,
      },
      ...chat.map((c: any) => ({
        role: c.role === "user" ? "user" : "assistant",
        content: c.text,
      })),
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 });
    }
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}