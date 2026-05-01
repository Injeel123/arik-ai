"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);
const speak = (text: string) => {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.3;
  utterance.volume = 1;

  const doSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log("Available voices:", voices.map(v => v.name));

    const preferredVoice =
      voices.find(v => v.name === "Microsoft Zira - English (United States)") ||
      voices.find(v => v.name === "Google UK English Female") ||
      voices.find(v => v.name.includes("Female")) ||
      voices.find(v => v.name.includes("Zira")) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log("Using voice:", preferredVoice.name);
    }

    utterance.onstart = () => console.log("Speaking started");
    utterance.onend = () => console.log("Speaking ended");
    utterance.onerror = (e) => console.log("Speech error:", e);

    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak();
  } else {
    // Voices abhi load nahi huin — wait karo
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null; // remove listener
      doSpeak();
    };
  }
};

  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser voice support nahi hai!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ur-PK";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setMessage(text);
    };
    recognition.start();
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText || message;
    if (!text.trim() || loading) return;
    const newChat = [...chat, { role: "user", text }];
    setChat(newChat);
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat: newChat }),
    });

    const data = await res.json();
    const reply = data.reply || "Koi jawab nahi mila";
    setChat([...newChat, { role: "assistant", text: reply }]);
    speak(reply);
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0f0f13", color: "#e8eaf0",
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid #252730",
        background: "#161820", display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c6af7, #4fd1c5)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Your ARIK</div>
          <div style={{ fontSize: 12, color: "#4fd1c5" }}>● Online</div>
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 12
      }}>
        {chat.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", color: "#6b7080" }}>
            <div style={{ fontSize: 48 }}>✨</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf0" }}>Your ARIK</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Type karo ya 🎤 dabao!</div>
          </div>
        )}
        {chat.map((c, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: c.role === "user" ? "flex-end" : "flex-start"
          }}>
            <div style={{
              maxWidth: "70%", padding: "10px 14px", borderRadius: 14,
              background: c.role === "user" ? "#3c3489" : "#1e2035",
              border: c.role === "user" ? "none" : "1px solid #252730",
              fontSize: 14, lineHeight: 1.7,
              borderTopRightRadius: c.role === "user" ? 4 : 14,
              borderTopLeftRadius: c.role === "user" ? 14 : 4,
            }}>
              {c.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{
              background: "#1e2035", border: "1px solid #252730",
              padding: "10px 16px", borderRadius: 14, borderTopLeftRadius: 4,
              color: "#6b7080", fontSize: 14
            }}>ARIK soch raha hai... ⏳</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "14px 24px", borderTop: "1px solid #252730",
        background: "#161820", display: "flex", gap: 10, alignItems: "center"
      }}>
        <button onClick={startVoice} style={{
          width: 44, height: 44, borderRadius: 10, border: "none",
          background: listening ? "#ef4444" : "#252730",
          fontSize: 20, cursor: "pointer", flexShrink: 0
        }}>🎤</button>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={listening ? "Sun raha hoon..." : "Kuch bhi pucho..."}
          style={{
            flex: 1, background: "#0f0f13", border: "1px solid #252730",
            borderRadius: 10, padding: "10px 14px", color: "#e8eaf0",
            fontSize: 14, outline: "none"
          }}
        />

        <button onClick={() => sendMessage()} disabled={loading} style={{
          background: "#7c6af7", border: "none", borderRadius: 10,
          padding: "10px 20px", color: "#fff", fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", fontSize: 14,
          opacity: loading ? 0.6 : 1
        }}>Send ➤</button>
      </div>
    </div>
  );
}