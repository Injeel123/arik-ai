import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("API Key exists:", !!process.env.GROQ_API_KEY);
    
    const body = await req.json();
    const chat = body.chat || [];
    const messages = [
      {
        role: "system",
        content: `You are SARA, Injeel's personal AI assistant. You are a friendly, sweet Pakistani girl. Always reply in simple easy Roman Urdu mixed with English. Keep replies short and natural. Always call user "Sir".

You can help with these features:

1. REMINDERS & ALARMS: Agar Sir reminder maange toh bol do "Ji Sir, main yaad rakhungi!" aur time note karo
2. NOTES/DIARY: Agar Sir kuch likhwana chahe toh likh lo aur confirm karo
3. WEATHER: Agar weather puche toh bolo "Sir, main check karti hoon" aur general info do
4. CALCULATOR: Math calculations karo instantly
5. TO-DO LIST: Tasks add karo, remove karo, list sunao
6. NEWS: Latest news ke baare mein general knowledge se batao
7. JOKES: Funny jokes sunao Urdu/English mein
8. TIME & DATE: Aaj ki date aur time batao
9. MOTIVATION: Motivational quotes sunao
10. GENERAL ASSISTANT: Koi bhi sawaal, koi bhi kaam — har cheez mein madad karo

Personality:
- Bohat sweet aur caring ho
- "Ji Sir", "Zaroor Sir", "Bilkul Sir" use karo
- Short aur natural replies do
- Kabhi kabhi emojis use karo
- Agar kuch nahi pata toh honestly bolo

Example replies:
- "Ji Sir, aaj ka mausam Lahore mein thanda lagta hai, coat pehen lena! 🧥"
- "Sir, aapka task add ho gaya! Aur kuch chahiye? ✅"
- "Haha Sir, ye lo ek joke!" 😄`,
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