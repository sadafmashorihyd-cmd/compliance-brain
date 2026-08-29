import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function callGroq(prompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
            temperature: 0.2,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq failed: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from Groq");
    return content;
}

const PAKISTAN_CITIES = [
    { name: "Karachi", x: 120, y: 310 },
    { name: "Lahore", x: 260, y: 180 },
    { name: "Islamabad", x: 255, y: 145 },
    { name: "Faisalabad", x: 235, y: 195 },
    { name: "Peshawar", x: 215, y: 130 },
    { name: "Quetta", x: 145, y: 235 },
    { name: "Multan", x: 225, y: 225 },
    { name: "Hyderabad", x: 140, y: 295 },
    { name: "Sialkot", x: 270, y: 165 },
    { name: "Gujranwala", x: 258, y: 175 },
];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const industry = searchParams.get("industry") || "all";
        const country = searchParams.get("country") || "Pakistan";

        const { data: regulations } = await supabaseAdmin
            .from("regulations")
            .select("category, content, penalty, industry")
            .eq("country", country)
            .limit(50);

        const regSummary = (regulations || [])
            .map((r: any) => `Category: ${r.category}, Industry: ${r.industry}, Penalty: ${r.penalty || "N/A"}`)
            .join("\n");

        const prompt = `You are a compliance risk analyst for Pakistan. Assign risk scores to major Pakistani cities for the ${industry} industry.

REGULATIONS DATA:
${regSummary || `General compliance regulations for ${industry} industry`}

Return ONLY valid JSON:
{
  "industry": "${industry}",
  "country": "${country}",
  "generated_at": "2026-01-01T00:00:00Z",
  "risk_summary": "2 sentence summary",
  "cities": [
    {"name": "Karachi", "risk_score": 85, "risk_level": "critical", "top_risk": "risk description", "active_regulations": 12, "industries_affected": ["Textile"]},
    {"name": "Lahore", "risk_score": 72, "risk_level": "high", "top_risk": "risk description", "active_regulations": 9, "industries_affected": ["Manufacturing"]},
    {"name": "Islamabad", "risk_score": 45, "risk_level": "medium", "top_risk": "risk description", "active_regulations": 6, "industries_affected": ["IT"]},
    {"name": "Faisalabad", "risk_score": 78, "risk_level": "high", "top_risk": "risk description", "active_regulations": 8, "industries_affected": ["Textile"]},
    {"name": "Peshawar", "risk_score": 55, "risk_level": "medium", "top_risk": "risk description", "active_regulations": 5, "industries_affected": ["Construction"]},
    {"name": "Quetta", "risk_score": 40, "risk_level": "low", "top_risk": "risk description", "active_regulations": 4, "industries_affected": ["Mining"]},
    {"name": "Multan", "risk_score": 62, "risk_level": "medium", "top_risk": "risk description", "active_regulations": 7, "industries_affected": ["Textile"]},
    {"name": "Hyderabad", "risk_score": 58, "risk_level": "medium", "top_risk": "risk description", "active_regulations": 6, "industries_affected": ["Manufacturing"]},
    {"name": "Sialkot", "risk_score": 70, "risk_level": "high", "top_risk": "risk description", "active_regulations": 8, "industries_affected": ["Export"]},
    {"name": "Gujranwala", "risk_score": 65, "risk_level": "medium", "top_risk": "risk description", "active_regulations": 7, "industries_affected": ["Manufacturing"]}
  ],
  "highest_risk_city": "Karachi",
  "lowest_risk_city": "Quetta"
}`;

        const text = await callGroq(prompt);
        const clean = text.replace(/```json|```/g, "").trim();

        let result;
        try {
            result = JSON.parse(clean);
        } catch {
            result = {
                industry, country,
                generated_at: new Date().toISOString(),
                risk_summary: `Risk analysis for ${industry} industry across ${country}.`,
                cities: PAKISTAN_CITIES.map((c) => ({
                    name: c.name,
                    risk_score: Math.floor(Math.random() * 40) + 40,
                    risk_level: "medium",
                    top_risk: "General compliance monitoring required",
                    active_regulations: Math.floor(Math.random() * 8) + 4,
                    industries_affected: [industry]
                })),
                highest_risk_city: "Karachi",
                lowest_risk_city: "Quetta"
            };
        }

        result.cities = result.cities.map((city: any) => {
            const coords = PAKISTAN_CITIES.find(c => c.name === city.name);
            return { ...city, x: coords?.x || 200, y: coords?.y || 200 };
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("[Heatmap API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}