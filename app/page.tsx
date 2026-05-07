"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ur-PK";
    utterance.rate = 0.85;
    utterance.pitch = 1.3;
    utterance.volume = 1;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const urduVoice = voices.find(v => v.lang.includes("ur"));
      const femaleVoice = voices.find(v =>
        v.name.includes("Female") ||
        v.name.includes("Samantha") ||
        v.name.includes("Google")
      );
      if (urduVoice) utterance.voice = urduVoice;
      else if (femaleVoice) utterance.voice = femaleVoice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
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
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setMessage(text);
      sendMessage(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
    setTimeout(() => {
      try { recognition.stop(); } catch (e) {}
    }, 100000);
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
    const cleanReply = reply.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, "");

    setChat([...newChat, { role: "assistant", text: reply }]);
    speak(cleanReply);
    setLoading(false);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "#000",
      display: "flex", flexDirection: "column",
      fontFamily: "'Segoe UI', sans-serif", position: "relative"
    }}>

      {/* Welcome Screen */}
      {!started && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "radial-gradient(ellipse at center, #1a0030, #000)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24
        }}>
          <img src="/sara.gif" style={{
            width: 200, height: 200, borderRadius: "50%",
            border: "3px solid #ff64c8",
            boxShadow: "0 0 60px rgba(255,100,200,0.6)"
          }} />
          <div style={{
            fontSize: 36, fontWeight: 900, letterSpacing: 4,
            background: "linear-gradient(90deg, #ff64c8, #a855f7, #4fd1c5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>✨ SARA ✨</div>
          <div style={{ color: "#a78bfa", fontSize: 14 }}>Aapki Personal AI Assistant</div>
          <button onClick={() => {
            window.speechSynthesis.cancel();
            setStarted(true);
          }} style={{
            background: "linear-gradient(135deg, #ff64c8, #a855f7)",
            border: "none", borderRadius: 30, padding: "16px 48px",
            color: "#fff", fontWeight: 700, fontSize: 18, cursor: "pointer",
            boxShadow: "0 0 40px rgba(255,100,200,0.5)",
            marginTop: 8
          }}>💜 SARA se Milein</button>
        </div>
      )}

      {/* Sara Full Screen */}
      <div style={{
        flex: 1, position: "relative", zIndex: 1, overflow: "hidden"
      }}>
        <img src="/sara.gif" style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          filter: speaking
            ? "drop-shadow(0 0 40px #ff64c8) brightness(1.1)"
            : "brightness(0.9)",
          transition: "all 0.5s ease",
          transform: speaking ? "scale(1.03)" : "scale(1)"
        }} />

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "45%",
          background: "linear-gradient(transparent, rgba(5,0,15,0.95))",
          zIndex: 2
        }} />

        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "20%",
          background: "linear-gradient(rgba(5,0,15,0.7), transparent)",
          zIndex: 2
        }} />

        {(chat.length > 0 || loading) && (
          <div style={{
            position: "absolute", top: 20, left: 16, right: 16,
            zIndex: 3,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,100,200,0.35)",
            borderRadius: 20, padding: "14px 20px",
            fontSize: 15, color: "#f0e8ff", lineHeight: 1.8,
            textAlign: "center",
            boxShadow: "0 4px 30px rgba(168,85,247,0.3)"
          }}>
            {loading ? (
              <span style={{ color: "#ff64c8" }}>💭 Soch rahi hoon...</span>
            ) : (
              chat[chat.length - 1].role === "assistant"
                ? chat[chat.length - 1].text
                : chat.length >= 2 ? chat[chat.length - 2].text : ""
            )}
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 20, left: 0, right: 0,
          textAlign: "center", zIndex: 3
        }}>
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: 3,
            background: "linear-gradient(90deg, #ff64c8, #a855f7, #4fd1c5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>✨ SARA ✨</div>
          <div style={{
            fontSize: 13, marginTop: 6, fontWeight: 600, letterSpacing: 1,
            color: speaking ? "#ff64c8" : listening ? "#ef4444" : "#4fd1c5"
          }}>
            {speaking ? "🔊 Bol rahi hoon..." : listening ? "🎤 Sun rahi hoon..." : "💚 Online"}
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div style={{
        padding: "14px 16px 20px",
        background: "rgba(5,0,15,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,100,200,0.2)",
        display: "flex", gap: 10, alignItems: "center",
        zIndex: 10, position: "relative"
      }}>
        <button onClick={startVoice} style={{
          width: 50, height: 50, borderRadius: "50%", border: "none",
          background: listening
            ? "linear-gradient(135deg, #ef4444, #b91c1c)"
            : "linear-gradient(135deg, #7c3aed, #a855f7)",
          fontSize: 22, cursor: "pointer", flexShrink: 0,
          boxShadow: listening
            ? "0 0 25px rgba(239,68,68,0.7)"
            : "0 0 15px rgba(124,58,237,0.5)",
          transition: "all 0.3s ease"
        }}>🎤</button>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={listening ? "Sun rahi hoon..." : "Kuch bhi pucho..."}
          style={{
            flex: 1, background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,100,200,0.3)",
            borderRadius: 25, padding: "12px 20px", color: "#e8eaf0",
            fontSize: 14, outline: "none"
          }}
        />

        <button onClick={() => sendMessage()} disabled={loading} style={{
          background: "linear-gradient(135deg, #ff64c8, #a855f7)",
          border: "none", borderRadius: 25,
          padding: "12px 24px", color: "#fff", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", fontSize: 14,
          opacity: loading ? 0.6 : 1,
          boxShadow: "0 0 20px rgba(255,100,200,0.4)"
        }}>Send ➤</button>
      </div>
    </div>
  );
}