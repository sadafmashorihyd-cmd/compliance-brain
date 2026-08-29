"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const INDUSTRIES = ["Pharmaceutical", "Construction", "Textile", "Environmental"];
const COUNTRIES = ["Pakistan", "UAE", "Saudi Arabia", "Egypt"];

interface RegMatch {
    regulation_title: string;
    section: string;
    page: string;
    similarity_score: number;
    match_level: "strong" | "partial" | "weak";
    matched_clauses: string[];
    missing_clauses: string[];
}

interface SimilarityResult {
    overall_similarity: number;
    document_name: string;
    summary: string;
    regulation_matches: RegMatch[];
    top_matches: string[];
    critical_gaps: string[];
    recommendation: string;
}

export default function SimilarityPage() {
    const [file, setFile] = useState<File | null>(null);
    const [industry, setIndustry] = useState("Pharmaceutical");
    const [country, setCountry] = useState("Pakistan");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SimilarityResult | null>(null);
    const [error, setError] = useState("");
    const [expandedReg, setExpandedReg] = useState<number | null>(null);

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", user?.id || "anonymous");
            formData.append("industry", industry);
            formData.append("country", country);

            const res = await fetch("/api/similarity", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResult(data.result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getMatchColor = (level: string) => {
        if (level === "strong") return "#00ff88";
        if (level === "partial") return "#ffaa00";
        return "#ff4444";
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return "#00ff88";
        if (score >= 40) return "#ffaa00";
        return "#ff4444";
    };

    return (
        <div className="min-h-screen bg-[#0a0f0a] text-white p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🧬</span>
                    <h1 className="text-2xl font-bold text-[#00ff88]">Compliance Similarity Detector</h1>
                </div>
                <p className="text-gray-400 ml-12">
                    Upload your document — AI detects how similar it is to each regulation. Like a plagiarism checker, but for compliance.
                </p>
            </div>

            {/* Upload Card */}
            <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Industry</label>
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full bg-[#0a0f0a] border border-[#00ff8833] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00ff88]"
                        >
                            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Country</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-[#0a0f0a] border border-[#00ff8833] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00ff88]"
                        >
                            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    onClick={() => document.getElementById("sim-file-input")?.click()}
                    className="border-2 border-dashed border-[#00ff8844] rounded-xl p-8 text-center cursor-pointer hover:border-[#00ff88] transition-all"
                >
                    <input
                        id="sim-file-input"
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                        <div>
                            <div className="text-4xl mb-2">📄</div>
                            <p className="text-[#00ff88] font-medium">{file.name}</p>
                            <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-4xl mb-2">🧬</div>
                            <p className="text-gray-300">Drop your PDF or DOCX here</p>
                            <p className="text-gray-500 text-sm mt-1">AI will compare it against all regulations</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="w-full mt-4 py-3 rounded-xl font-bold text-black transition-all"
                    style={{ background: file && !loading ? "#00ff88" : "#1a2e1a", color: file && !loading ? "#000" : "#444" }}
                >
                    {loading ? "🧬 Analyzing Similarity..." : "🔍 Detect Similarity"}
                </button>

                {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-pulse">🧬</div>
                    <p className="text-[#00ff88] text-lg font-medium">Comparing your document against regulations...</p>
                    <p className="text-gray-500 text-sm mt-2">AI is calculating similarity scores for each regulation</p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">Overall Similarity Score</h2>
                                <p className="text-gray-400 text-sm">{result.document_name}</p>
                            </div>
                            <div className="text-center">
                                <div
                                    className="text-5xl font-black"
                                    style={{ color: getScoreColor(result.overall_similarity) }}
                                >
                                    {result.overall_similarity}%
                                </div>
                                <p className="text-gray-400 text-xs mt-1">aligned</p>
                            </div>
                        </div>

                        {/* Score Bar */}
                        <div className="w-full bg-[#1a2e1a] rounded-full h-3 mb-4">
                            <div
                                className="h-3 rounded-full transition-all duration-1000"
                                style={{
                                    width: `${result.overall_similarity}%`,
                                    background: getScoreColor(result.overall_similarity)
                                }}
                            />
                        </div>

                        <p className="text-gray-300 text-sm">{result.summary}</p>
                    </div>

                    {/* Regulation by Regulation Breakdown */}
                    <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">📋 Regulation-by-Regulation Breakdown</h2>
                        <p className="text-gray-400 text-xs mb-4">Click any regulation to see matched & missing clauses</p>

                        <div className="space-y-3">
                            {result.regulation_matches?.map((reg, i) => (
                                <div key={i} className="border border-[#00ff8811] rounded-xl overflow-hidden">
                                    {/* Regulation Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#0a1a0a] transition-all"
                                        onClick={() => setExpandedReg(expandedReg === i ? null : i)}
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-white text-sm">{reg.regulation_title}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">Section {reg.section} • Page {reg.page}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Score Bar */}
                                            <div className="hidden md:flex items-center gap-2">
                                                <div className="w-24 bg-[#1a2e1a] rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{
                                                            width: `${reg.similarity_score}%`,
                                                            background: getMatchColor(reg.match_level)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="text-xl font-black min-w-[48px] text-right"
                                                style={{ color: getMatchColor(reg.match_level) }}
                                            >
                                                {reg.similarity_score}%
                                            </div>
                                            <div
                                                className="text-xs px-2 py-1 rounded-full font-medium"
                                                style={{
                                                    background: `${getMatchColor(reg.match_level)}22`,
                                                    color: getMatchColor(reg.match_level)
                                                }}
                                            >
                                                {reg.match_level}
                                            </div>
                                            <span className="text-gray-500">{expandedReg === i ? "▲" : "▼"}</span>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedReg === i && (
                                        <div className="px-4 pb-4 grid md:grid-cols-2 gap-4 border-t border-[#00ff8811]">
                                            <div className="pt-3">
                                                <p className="text-[#00ff88] text-xs font-bold mb-2">✅ MATCHED CLAUSES</p>
                                                {reg.matched_clauses?.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {reg.matched_clauses.map((c, j) => (
                                                            <li key={j} className="text-gray-300 text-xs flex gap-2">
                                                                <span className="text-[#00ff88] mt-0.5">•</span>
                                                                <span>{c}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-600 text-xs">No strong matches found</p>
                                                )}
                                            </div>
                                            <div className="pt-3">
                                                <p className="text-red-400 text-xs font-bold mb-2">❌ MISSING CLAUSES</p>
                                                {reg.missing_clauses?.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {reg.missing_clauses.map((c, j) => (
                                                            <li key={j} className="text-gray-300 text-xs flex gap-2">
                                                                <span className="text-red-400 mt-0.5">•</span>
                                                                <span>{c}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-600 text-xs">All clauses covered!</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Critical Gaps + Recommendation */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a0d0d] border border-red-900 rounded-2xl p-5">
                            <h3 className="text-red-400 font-bold mb-3">⚠️ Critical Gaps</h3>
                            <ul className="space-y-2">
                                {result.critical_gaps?.map((gap, i) => (
                                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                                        <span className="text-red-400">→</span>
                                        <span>{gap}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-5">
                            <h3 className="text-[#00ff88] font-bold mb-3">💡 Recommendation</h3>
                            <p className="text-gray-300 text-sm">{result.recommendation}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}