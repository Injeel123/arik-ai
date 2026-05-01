import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: "Aap ARIK hain. Injeel ke personal AI assistant. Hamesha sirf Urdu mein jawab dein. User ko Sir bulayein. Helpful aur friendly rahein.",
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
