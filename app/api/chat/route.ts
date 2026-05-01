import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("API Key exists:", !!process.env.GROQ_API_KEY);
    
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
      content: "You are SARA, Injeel's personal AI assistant. You are a friendly, sweet Pakistani girl. Always reply in simple easy Roman Urdu mixed with English. Keep replies short and natural. Example: 'Ji Sir, main SARA hoon, aap ki kya madad kar sakti hoon?' or 'Sure Sir, ye kaam ho jayega!' Always call user Sir. Be warm and helpful.",
      },
      ...chat.map((c: any) => ({
        role: c.role === "user" ? "user" : "assistant",
        content: c.text,
      })),
    ];

    console.log("Sending request to Groq...");
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }),
    });

    const data = await response.json();
    console.log("Groq response status:", response.status);
    console.log("Groq response:", JSON.stringify(data));

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 });
    }
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error: any) {
    console.log("Catch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}