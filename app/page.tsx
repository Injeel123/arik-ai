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

  const unlockAudio = () => {
    const audio = new Audio();
    audio.play().catch(() => {});
  };

  const playAudio = async (base64Audio: string) => {
    try {
      setSpeaking(true);
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => setSpeaking(false);
      await audio.play();
    } catch (e) {
      setSpeaking(false);
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
    recognition.lang = "ur";
    recognition.continuous = false;
    recognition.interimResults = false;
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
    setChat([...newChat, { role: "assistant", text: reply }]);
    if (data.audio) await playAudio(data.audio);
    setLoading(false);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "linear-gradient(180deg, #0a0015 0%, #1a0030 50%, #0a0010 100%)",
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
          <button onClick={() => { setStarted(true); unlockAudio(); }} style={{
            background: "linear-gradient(135deg, #ff64c8, #a855f7)",
            border: "none", borderRadius: 30, padding: "16px 48px",
            color: "#fff", fontWeight: 700, fontSize: 18, cursor: "pointer",
            boxShadow: "0 0 40px rgba(255,100,200,0.5)",
            marginTop: 8
          }}>💜 SARA se Milein</button>
        </div>
      )}

      {/* Stars background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 20% 50%, rgba(120,40,200,0.15), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,100,200,0.1), transparent 50%)"
      }} />

      {/* SARA - Full Face to Face */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 1
      }}>

        {/* Glow behind sara */}
        <div style={{
          position: "absolute",
          width: 350, height: 350,
          borderRadius: "50%",
          background: speaking
            ? "radial-gradient(circle, rgba(255,100,200,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(120,60,255,0.2), transparent 70%)",
          transition: "all 0.5s ease",
          animation: speaking ? "pulse 1s infinite" : "none"
        }} />

        {/* Sara image - big face to face */}
        <div style={{
          width: 280, height: 280, borderRadius: "50%",
          overflow: "hidden", position: "relative", zIndex: 2,
          border: speaking ? "4px solid #ff64c8" : "4px solid #7c3aed",
          boxShadow: speaking
            ? "0 0 50px rgba(255,100,200,0.8), 0 0 100px rgba(255,100,200,0.4)"
            : "0 0 30px rgba(124,58,237,0.5)",
          transition: "all 0.4s ease",
          transform: speaking ? "scale(1.05)" : "scale(1)"
        }}>
          <img src="/sara.gif" style={{
            width: "100%", height: "100%", objectFit: "cover"
          }} />
        </div>

        {/* Name + Status */}
        <div style={{ textAlign: "center", marginTop: 16, zIndex: 2 }}>
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: 3,
            background: "linear-gradient(90deg, #ff64c8, #a855f7, #4fd1c5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>✨ SARA ✨</div>
          <div style={{
            fontSize: 13, marginTop: 6, fontWeight: 600,
            color: speaking ? "#ff64c8" : listening ? "#ef4444" : "#4fd1c5",
            letterSpacing: 1
          }}>
            {speaking ? "🔊 Bol rahi hoon..." : listening ? "🎤 Sun rahi hoon..." : "💚 Online"}
          </div>
        </div>

        {/* Last message bubble */}
        {chat.length > 0 && (
          <div style={{
            marginTop: 16, maxWidth: "80%", zIndex: 2,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,100,200,0.3)",
            borderRadius: 20, padding: "12px 20px",
            fontSize: 14, color: "#e8eaf0", lineHeight: 1.7,
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(168,85,247,0.2)"
          }}>
            {chat[chat.length - 1].role === "assistant"
              ? chat[chat.length - 1].text
              : chat.length >= 2
                ? chat[chat.length - 2].text
                : ""}
          </div>
        )}

        {loading && (
          <div style={{
            marginTop: 16, zIndex: 2,
            color: "#ff64c8", fontSize: 14, letterSpacing: 1
          }}>💭 Soch rahi hoon...</div>
        )}
      </div>

      {/* Input Bar */}
      <div style={{
        padding: "16px 20px 24px",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,100,200,0.15)",
        display: "flex", gap: 10, alignItems: "center",
        zIndex: 2, position: "relative"
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

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}