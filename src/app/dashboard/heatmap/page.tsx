"use client";
import { useState, useEffect } from "react";

const INDUSTRIES = ["all", "Pharmaceutical", "Construction", "Textile", "Environmental"];
const COUNTRIES = ["Pakistan"];

interface City {
    name: string;
    risk_score: number;
    risk_level: string;
    top_risk: string;
    active_regulations: number;
    industries_affected: string[];
    x: number;
    y: number;
}

interface HeatmapResult {
    industry: string;
    country: string;
    generated_at: string;
    risk_summary: string;
    cities: City[];
    highest_risk_city: string;
    lowest_risk_city: string;
}

export default function HeatmapPage() {
    const [industry, setIndustry] = useState("all");
    const [country, setCountry] = useState("Pakistan");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HeatmapResult | null>(null);
    const [hoveredCity, setHoveredCity] = useState<City | null>(null);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    const fetchHeatmap = async () => {
        setLoading(true);
        setResult(null);
        setSelectedCity(null);
        try {
            const res = await fetch(`/api/heatmap?industry=${industry}&country=${country}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResult(data.result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeatmap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getRiskColor = (score: number) => {
        if (score >= 80) return "#ff2222";
        if (score >= 65) return "#ff6600";
        if (score >= 50) return "#ffaa00";
        if (score >= 35) return "#aadd00";
        return "#00ff88";
    };

    const getRiskGlow = (score: number) => {
        const color = getRiskColor(score);
        return `0 0 ${Math.floor(score / 10) * 4}px ${color}, 0 0 ${Math.floor(score / 10) * 8}px ${color}44`;
    };

    return (
        <div className="min-h-screen bg-[#0a0f0a] text-white p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🗺️</span>
                    <h1 className="text-2xl font-bold text-[#00ff88]">Compliance Risk Heatmap</h1>
                </div>
                <p className="text-gray-400 ml-12">
                    Live risk visualization — see which cities have highest compliance risk by industry.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Industry</label>
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="bg-[#0a0f0a] border border-[#00ff8833] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff88]"
                        >
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i === "all" ? "All Industries" : i}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Country</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="bg-[#0a0f0a] border border-[#00ff8833] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff88]"
                        >
                            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={fetchHeatmap}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg font-bold text-black text-sm transition-all"
                        style={{ background: loading ? "#1a2e1a" : "#00ff88", color: loading ? "#444" : "#000" }}
                    >
                        {loading ? "Loading..." : "🔄 Update Map"}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* MAP */}
                <div className="lg:col-span-2 bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-[#00ff88]">Pakistan — Compliance Risk Map</h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00ff88] inline-block" /> Low</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffaa00] inline-block" /> Medium</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff2222] inline-block" /> Critical</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-80">
                            <div className="text-center">
                                <div className="text-5xl mb-3 animate-pulse">🗺️</div>
                                <p className="text-[#00ff88]">Generating risk heatmap...</p>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="relative">
                            {/* Pakistan SVG Map */}
                            <svg viewBox="0 0 400 450" className="w-full" style={{ maxHeight: "400px" }}>
                                {/* Pakistan outline — simplified shape */}
                                <path
                                    d="M180,50 L230,45 L280,60 L310,80 L320,110 L310,130 L290,140 L280,160 L300,180 L310,210 L300,240 L280,260 L260,280 L240,310 L220,340 L200,370 L180,380 L160,370 L140,350 L130,320 L120,290 L110,260 L100,230 L95,200 L100,170 L110,150 L120,130 L130,110 L140,90 L160,65 Z"
                                    fill="#0a1a0a"
                                    stroke="#00ff8844"
                                    strokeWidth="1.5"
                                />

                                {/* Grid lines */}
                                {[100, 150, 200, 250, 300, 350].map(y => (
                                    <line key={y} x1="80" y1={y} x2="320" y2={y} stroke="#00ff8811" strokeWidth="0.5" strokeDasharray="4,4" />
                                ))}
                                {[100, 150, 200, 250, 300].map(x => (
                                    <line key={x} x1={x} y1="40" x2={x} y2="400" stroke="#00ff8811" strokeWidth="0.5" strokeDasharray="4,4" />
                                ))}

                                {/* City dots */}
                                {result.cities.map((city, i) => {
                                    const color = getRiskColor(city.risk_score);
                                    const radius = 6 + (city.risk_score / 100) * 8;
                                    const isSelected = selectedCity?.name === city.name;
                                    const isHovered = hoveredCity?.name === city.name;

                                    return (
                                        <g key={i}>
                                            {/* Pulse ring */}
                                            <circle
                                                cx={city.x}
                                                cy={city.y}
                                                r={radius + 6}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="1"
                                                opacity="0.3"
                                                className={city.risk_score >= 70 ? "animate-ping" : ""}
                                                style={{ animationDuration: "2s" }}
                                            />
                                            {/* Main dot */}
                                            <circle
                                                cx={city.x}
                                                cy={city.y}
                                                r={isSelected || isHovered ? radius + 3 : radius}
                                                fill={color}
                                                opacity="0.9"
                                                style={{ filter: `drop-shadow(0 0 ${city.risk_score / 15}px ${color})`, cursor: "pointer" }}
                                                onMouseEnter={() => setHoveredCity(city)}
                                                onMouseLeave={() => setHoveredCity(null)}
                                                onClick={() => setSelectedCity(city)}
                                            />
                                            {/* Score label */}
                                            <text
                                                x={city.x}
                                                y={city.y + 1}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fill="#000"
                                                fontSize="7"
                                                fontWeight="bold"
                                                style={{ pointerEvents: "none" }}
                                            >
                                                {city.risk_score}
                                            </text>
                                            {/* City name */}
                                            <text
                                                x={city.x}
                                                y={city.y + radius + 10}
                                                textAnchor="middle"
                                                fill={isSelected ? color : "#aaa"}
                                                fontSize="8"
                                                fontWeight={isSelected ? "bold" : "normal"}
                                                style={{ pointerEvents: "none" }}
                                            >
                                                {city.name}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                            <p className="text-gray-600 text-xs text-center mt-2">Click any city for details • Circle size = risk level</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-80">
                            <p className="text-gray-500">Click "Update Map" to generate heatmap</p>
                        </div>
                    )}
                </div>

                {/* SIDEBAR */}
                <div className="space-y-4">
                    {/* Selected City Detail */}
                    {selectedCity && (
                        <div className="bg-[#0d1a0d] border rounded-2xl p-4" style={{ borderColor: getRiskColor(selectedCity.risk_score) + "44" }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-white">{selectedCity.name}</h3>
                                <div
                                    className="text-2xl font-black"
                                    style={{ color: getRiskColor(selectedCity.risk_score) }}
                                >
                                    {selectedCity.risk_score}
                                </div>
                            </div>
                            <div
                                className="text-xs px-2 py-1 rounded-full inline-block font-medium mb-3"
                                style={{
                                    background: `${getRiskColor(selectedCity.risk_score)}22`,
                                    color: getRiskColor(selectedCity.risk_score)
                                }}
                            >
                                {selectedCity.risk_level?.toUpperCase()} RISK
                            </div>
                            <p className="text-gray-300 text-sm mb-3">{selectedCity.top_risk}</p>
                            <div className="text-xs text-gray-500 mb-1">Active Regulations: <span className="text-white">{selectedCity.active_regulations}</span></div>
                            <div className="text-xs text-gray-500">Industries: <span className="text-white">{selectedCity.industries_affected?.join(", ")}</span></div>
                        </div>
                    )}

                    {/* Risk Summary */}
                    {result && (
                        <>
                            <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-4">
                                <h3 className="text-[#00ff88] font-bold text-sm mb-2">📊 Risk Summary</h3>
                                <p className="text-gray-300 text-xs">{result.risk_summary}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="bg-[#1a0d0d] rounded-lg p-2 text-center">
                                        <p className="text-red-400 text-xs font-bold">Highest Risk</p>
                                        <p className="text-white text-sm font-medium">{result.highest_risk_city}</p>
                                    </div>
                                    <div className="bg-[#0d1a0d] border border-[#00ff8822] rounded-lg p-2 text-center">
                                        <p className="text-[#00ff88] text-xs font-bold">Lowest Risk</p>
                                        <p className="text-white text-sm font-medium">{result.lowest_risk_city}</p>
                                    </div>
                                </div>
                            </div>

                            {/* City Rankings */}
                            <div className="bg-[#0d1a0d] border border-[#00ff8833] rounded-2xl p-4">
                                <h3 className="text-white font-bold text-sm mb-3">🏙️ City Rankings</h3>
                                <div className="space-y-2">
                                    {[...result.cities]
                                        .sort((a, b) => b.risk_score - a.risk_score)
                                        .map((city, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-[#0a1a0a] rounded-lg px-2 py-1 transition-all"
                                                onClick={() => setSelectedCity(city)}
                                            >
                                                <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-xs text-white">{city.name}</span>
                                                        <span className="text-xs font-bold" style={{ color: getRiskColor(city.risk_score) }}>{city.risk_score}</span>
                                                    </div>
                                                    <div className="w-full bg-[#1a2e1a] rounded-full h-1">
                                                        <div
                                                            className="h-1 rounded-full"
                                                            style={{ width: `${city.risk_score}%`, background: getRiskColor(city.risk_score) }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}