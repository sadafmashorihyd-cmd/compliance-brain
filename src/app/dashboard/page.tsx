"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

const RobotIcon = ({ color, size = 15 }: { color: string; size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="90" rx="18" stroke={color} strokeWidth="4" />
    <circle cx="50" cy="38" r="18" stroke={color} strokeWidth="3" />
    <circle cx="50" cy="10" r="4" fill={color} />
    <line x1="50" y1="14" x2="50" y2="20" stroke={color} strokeWidth="2.5" />
    <rect x="34" y="30" width="10" height="7" rx="2" fill={color} />
    <rect x="56" y="30" width="10" height="7" rx="2" fill={color} />
    <path d="M38 48 Q50 56 62 48" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="26" cy="38" r="5" stroke={color} strokeWidth="2" />
    <circle cx="74" cy="38" r="5" stroke={color} strokeWidth="2" />
    <path d="M68 65 Q74 55 80 60 Q85 65 80 75" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M68 65 L80 68 L78 75" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);

const ChartIcon = ({ color, size = 15 }: { color: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="22" height="22" rx="4" stroke={color} strokeWidth="1.5" fill="none" />
    <rect x="5" y="13" width="2" height="4" fill={color} />
    <rect x="9" y="10" width="2" height="7" fill={color} />
    <rect x="13" y="7" width="2" height="10" fill={color} />
    <circle cx="6" cy="10" r="1.5" fill={color} />
    <circle cx="14" cy="6" r="1.5" fill={color} />
    <path d="M6 10 L10 7 L14 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [stats, setStats] = useState({ chats: 0, reports: 0, docs: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserName((data.user.user_metadata?.full_name || "there").split(" ")[0]);
      setIndustry(data.user.user_metadata?.industry || "");
      setCountry(data.user.user_metadata?.country || "");
      const [{ count: chats }, { count: reports }, { count: docs }] = await Promise.all([
        supabase.from("chat_sessions").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("compliance_reports").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("uploaded_documents").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
      ]);
      setStats({ chats: chats || 0, reports: reports || 0, docs: docs || 0 });
    });
  }, []);

  const actions = [
    {
      href: "/dashboard/chat",
      icon: <RobotIcon color="#00FF88" size={15} />,
      color: "#00FF88", bg: "#00FF8810", border: "#00FF8820",
      title: "Ask Compliance",
      desc: "Exact regulation references with page & line numbers",
      cta: "Ask now"
    },
    {
      href: "/dashboard/upload",
      icon: <Upload size={15} color="#00D4FF" />,
      color: "#00D4FF", bg: "#00D4FF10", border: "#00D4FF20",
      title: "Analyze Document",
      desc: "Upload docs for instant AI compliance check",
      cta: "Upload"
    },
    {
      href: "/dashboard/reports",
      icon: <ChartIcon color="#A855F7" size={15} />,
      color: "#A855F7", bg: "#A855F710", border: "#A855F720",
      title: "Generate Report",
      desc: "Create professional PDF compliance reports",
      cta: "Generate"
    },
  ];

  const coverage = [
    "Textile · Pakistan", "Textile · UAE", "Textile · Saudi Arabia", "Textile · Egypt",
    "Construction · Pakistan", "Construction · UAE", "Construction · Saudi Arabia", "Construction · Egypt",
    "Pharmaceutical · Pakistan", "Pharmaceutical · UAE", "Pharmaceutical · Saudi Arabia", "Pharmaceutical · Egypt",
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto", fontFamily: "Inter, sans-serif", color: "#fff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Good day, <span style={{ background: "linear-gradient(135deg, #00FF88, #00D4FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userName || "there"}</span>
          </p>
          <p style={{ fontSize: 12, color: "#444", marginTop: 3 }}>
            {industry && country ? `${industry} · ${country}` : "Your compliance dashboard"}
          </p>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, background: "#00FF8810", color: "#00FF88", border: "1px solid #00FF8820", borderRadius: 6, padding: "5px 12px" }}>
          {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Chat sessions", value: stats.chats, color: "#00FF88" },
          { label: "Reports generated", value: stats.reports, color: "#00D4FF" },
          { label: "Documents analyzed", value: stats.docs, color: "#A855F7" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: 10, padding: "16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${s.color}10 0%, transparent 70%)`, pointerEvents: "none" }} />
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#444", marginTop: 5 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <p style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Quick actions</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
        {actions.map(a => (
          <Link key={a.href} href={a.href}
            style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: 12, padding: "18px", display: "block", textDecoration: "none", transition: "all 0.2s", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.border; e.currentTarget.style.background = "#141414"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${a.color}10`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E1E"; e.currentTarget.style.background = "#111"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: a.bg, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              {a.icon}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", marginBottom: 5 }}>{a.title}</p>
            <p style={{ fontSize: 11, color: "#444", lineHeight: 1.5, marginBottom: 14 }}>{a.desc}</p>
            <span style={{ fontSize: 11, fontWeight: 600, color: a.color, display: "flex", alignItems: "center", gap: 4 }}>
              {a.cta} <ArrowRight size={10} />
            </span>
          </Link>
        ))}
      </div>

      {/* Coverage */}
      <p style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Regulation coverage</p>
      <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: 12, padding: "18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, #00FF8806 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {coverage.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 500, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 6, padding: "4px 10px", color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, background: "#00FF88", borderRadius: "50%", flexShrink: 0 }} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}