"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

const MG = "linear-gradient(135deg, #003300, #00CC44, #69FF47, #00CC44, #003300)";

const RobotIcon = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="90" rx="18" stroke="#00ff88" strokeWidth="4" />
    <circle cx="50" cy="38" r="18" stroke="#00ff88" strokeWidth="3" />
    <circle cx="50" cy="10" r="4" fill="#00ff88" />
    <line x1="50" y1="14" x2="50" y2="20" stroke="#00ff88" strokeWidth="2.5" />
    <rect x="34" y="30" width="10" height="7" rx="2" fill="#00ff88" />
    <rect x="56" y="30" width="10" height="7" rx="2" fill="#00ff88" />
    <path d="M38 48 Q50 56 62 48" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="26" cy="38" r="5" stroke="#00ff88" strokeWidth="2" />
    <circle cx="74" cy="38" r="5" stroke="#00ff88" strokeWidth="2" />
    <path d="M68 65 Q74 55 80 60 Q85 65 80 75" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M68 65 L80 68 L78 75" stroke="#00ff88" strokeWidth="2" fill="none" />
  </svg>
);

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00FF88">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*?)$/gm, '<p style="font-size:12px;font-weight:700;color:#00FF88;margin:10px 0 4px;text-transform:uppercase;letter-spacing:0.06em">$1</p>')
    .replace(/^## (.*?)$/gm, '<p style="font-size:13px;font-weight:700;color:#E5E7EB;margin:12px 0 6px">$1</p>')
    .replace(/^# (.*?)$/gm, '<p style="font-size:14px;font-weight:800;color:#fff;margin:14px 0 6px">$1</p>')
    .replace(/^\* (.*?)$/gm, '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:#00FF88;margin-top:2px">•</span><span>$1</span></div>')
    .replace(/^\+ (.*?)$/gm, '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:#00FF88;margin-top:2px">›</span><span>$1</span></div>')
    .replace(/^- (.*?)$/gm, '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:#00FF88;margin-top:2px">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [industry, setIndustry] = useState("Textile");
  const [country, setCountry] = useState("Pakistan");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      setIndustry(data.user.user_metadata?.industry || "Textile");
      setCountry(data.user.user_metadata?.country || "Pakistan");
      const { data: s } = await supabase.from("chat_sessions").select("*").eq("user_id", data.user.id).order("updated_at", { ascending: false }).limit(20);
      setSessions(s || []);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const newSession = async () => {
    const { data } = await supabase.from("chat_sessions").insert({ user_id: userId, title: "New conversation", industry, country }).select().single();
    if (data) { setSessions((prev: any[]) => [data, ...prev]); setCurrentSession(data.id); setMessages([]); }
  };

  const loadSession = async (id: string) => {
    setCurrentSession(id);
    const { data } = await supabase.from("chat_messages").select("*").eq("session_id", id).order("created_at");
    setMessages((data || []).map((m: any) => ({ role: m.role, content: m.content })));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    let sessionId = currentSession;
    if (!sessionId) {
      const { data } = await supabase.from("chat_sessions").insert({ user_id: userId, title: input.slice(0, 60), industry, country }).select().single();
      if (data) { sessionId = data.id; setCurrentSession(data.id); setSessions((prev: any[]) => [data, ...prev]); }
    }
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, sessionId, userId, industry, country }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100%", background: "#0A0A0A", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#1E1E1E;border-radius:99px}
        input::placeholder{color:#333}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
      `}</style>

      <div style={{ width: 190, borderRight: "1px solid #1A1A1A", background: "#0D0D0D", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "10px" }}>
          <button onClick={newSession} style={{ width: "100%", padding: "8px", fontSize: 12, fontWeight: 600, background: MG, backgroundSize: "200% auto", color: "#0A0A0A", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
            <Plus size={12} /> New chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px" }}>
          {sessions.map((s: any) => (
            <button key={s.id} onClick={() => loadSession(s.id)}
              style={{ width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 6, fontSize: 11, background: currentSession === s.id ? "#00FF8810" : "transparent", color: currentSession === s.id ? "#00FF88" : "#444", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.title || "Conversation"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, background: "#00FF8810", border: "1px solid #00FF8820", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <RobotIcon size={32} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#00FF88", marginBottom: 4 }}>Ask anything about compliance</p>
              <p style={{ fontSize: 11, color: "#444", marginBottom: 16 }}>Exact regulation references for {industry} in {country}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["What are fire safety requirements?", "Environmental discharge limits?", "Worker safety regulations?"].map(q => (
                  <button key={q} onClick={() => setInput(q)} style={{ fontSize: 11, background: "#111", border: "1px solid #222", color: "#555", padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "user" ? (
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: 13, lineHeight: 1.65, background: "linear-gradient(135deg, #003300, #00AA33)", color: "#fff" }}>
                  {m.content}
                </div>
              ) : (
                <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: "14px 14px 14px 4px", fontSize: 13, lineHeight: 1.75, background: "#111", color: "#ccc", border: "1px solid #1E1E1E" }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                />
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "#111", border: "1px solid #1E1E1E", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 150, 300].map(d => (
                  <span key={d} style={{ width: 6, height: 6, background: "#00FF88", borderRadius: "50%", display: "inline-block", animation: "bounce 1.2s infinite ease-in-out", animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1A1A1A", background: "#0D0D0D", display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1, padding: "10px 14px", fontSize: 13, background: "#111", border: "1px solid #1E1E1E", borderRadius: 10, outline: "none", color: "#fff", fontFamily: "inherit" }}
            placeholder={`Ask about ${industry} compliance in ${country}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            style={{ width: 42, height: 42, background: input.trim() ? MG : "#111", backgroundSize: "200% auto", border: "none", borderRadius: 10, cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={15} color={input.trim() ? "#0A0A0A" : "#333"} />
          </button>
        </div>
      </div>
    </div>
  );
}