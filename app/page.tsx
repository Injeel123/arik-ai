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
      audio.onerror = (e) => {
        console.error("Audio error:", e);
        setSpeaking(false);
      };
      await audio.play();
    } catch (e) {
      console.error("Play error:", e);
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
    recognition.lang = "ur-PK";
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
    recognition.start();

    // 8 second ke baad auto stop
    setTimeout(() => {
      try { recognition.stop(); } catch (e) {}
    }, 8000);
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

    if (data.audio) {
      await playAudio(data.audio);
    }

    setLoading(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "linear-gradient(160deg, #0d0015, #1a0030, #0d0015)",
      color: "#e8eaf0", fontFamily: "'Segoe UI', sans-serif",
      position: "relative"
    }}>

      {!started && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.85)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 20
        }}>
          <div style={{
            fontSize: 32, fontWeight: 800,
            background: "linear-gradient(90deg, #ff64c8, #a855f7, #4fd1c5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>✨ SARA ✨</div>
          <button onClick={() => setStarted(true)} style={{
            background: "linear-gradient(135deg, #ff64c8, #a855f7)",
            border: "none", borderRadius: 25, padding: "16px 40px",
            color: "#fff", fontWeight: 700, fontSize: 20, cursor: "pointer",
            boxShadow: "0 0 30px rgba(255,100,200,0.5)"
          }}>✨ SARA se Milein ✨</button>
        </div>
      )}

      <img src="/sara.gif" alt="background" style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        objectFit: "cover", zIndex: 0, opacity: 0.15
      }} />

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 24, paddingBottom: 8, position: "relative", zIndex: 1
      }}>
        <div style={{
          position: "absolute", width: 240, height: 240,
          borderRadius: "50%", top: 10,
          background: speaking
            ? "radial-gradient(circle, rgba(255,100,200,0.35), transparent 70%)"
            : "radial-gradient(circle, rgba(150,80,255,0.15), transparent 70%)",
          transition: "all 0.4s ease"
        }} />

        <div style={{
          width: 180, height: 180, borderRadius: "50%", overflow: "hidden",
          border: speaking ? "3px solid #ff64c8" : "3px solid #7c3aed",
          boxShadow: speaking
            ? "0 0 35px rgba(255,100,200,0.7), 0 0 60px rgba(255,100,200,0.3)"
            : "0 0 20px rgba(124,58,237,0.4)",
          transition: "all 0.4s ease", position: "relative", zIndex: 1
        }}>
          <img src="/sara.gif" alt="SARA"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div style={{ marginTop: 12, textAlign: "center", zIndex: 1 }}>
          <div style={{
            fontWeight: 800, fontSize: 26, letterSpacing: 2,
            background: "linear-gradient(90deg, #ff64c8, #a855f7, #4fd1c5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>✨ SARA ✨</div>
          <div style={{
            fontSize: 12, marginTop: 4,
            color: speaking ? "#ff64c8" : listening ? "#ef4444" : "#4fd1c5"
          }}>
            {speaking ? "● Bol rahi hoon..." : listening ? "● Sun rahi hoon..." : "● Online"}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "10px 20px",
        display: "flex", flexDirection: "column", gap: 10,
        zIndex: 1, position: "relative"
      }}>
        {chat.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", color: "#6b7080" }}>
            <div style={{ fontSize: 14 }}>Kuch bhi pucho — main yahan hoon! 💜</div>
          </div>
        )}
        {chat.map((c, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: c.role === "user" ? "flex-end" : "flex-start"
          }}>
            <div style={{
              maxWidth: "75%", padding: "10px 16px", borderRadius: 18,
              background: c.role === "user"
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "rgba(255,255,255,0.06)",
              border: c.role === "user" ? "none" : "1px solid rgba(255,100,200,0.25)",
              fontSize: 14, lineHeight: 1.8,
              borderTopRightRadius: c.role === "user" ? 4 : 18,
              borderTopLeftRadius: c.role === "user" ? 18 : 4,
            }}>
              {c.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,100,200,0.25)",
              padding: "10px 16px", borderRadius: 18, borderTopLeftRadius: 4,
              color: "#ff64c8", fontSize: 14
            }}>SARA soch rahi hai... 💭</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid rgba(255,100,200,0.15)",
        background: "rgba(0,0,0,0.4)",
        display: "flex", gap: 10, alignItems: "center",
        zIndex: 1, position: "relative"
      }}>
        <button onClick={startVoice} style={{
          width: 46, height: 46, borderRadius: "50%", border: "none",
          background: listening
            ? "linear-gradient(135deg, #ef4444, #b91c1c)"
            : "linear-gradient(135deg, #7c3aed, #a855f7)",
          fontSize: 20, cursor: "pointer", flexShrink: 0,
          boxShadow: listening ? "0 0 20px rgba(239,68,68,0.6)" : "0 0 10px rgba(124,58,237,0.4)"
        }}>🎤</button>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={listening ? "Sun rahi hoon..." : "Kuch bhi pucho..."}
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,100,200,0.25)",
            borderRadius: 25, padding: "11px 18px", color: "#e8eaf0",
            fontSize: 14, outline: "none"
          }}
        />

        <button onClick={() => sendMessage()} disabled={loading} style={{
          background: "linear-gradient(135deg, #ff64c8, #a855f7)",
          border: "none", borderRadius: 25,
          padding: "11px 22px", color: "#fff", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", fontSize: 14,
          opacity: loading ? 0.6 : 1,
          boxShadow: "0 0 15px rgba(255,100,200,0.4)"
        }}>Send ➤</button>
      </div>
    </div>
  );
}