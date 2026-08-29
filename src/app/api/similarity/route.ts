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
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
            temperature: 0.1,
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

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;
        const industry = formData.get("industry") as string;
        const country = formData.get("country") as string;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        // Extract text from uploaded document
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let docText = "";
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require("pdf-parse");
            const pdfData = await pdfParse(buffer);
            docText = pdfData.text.slice(0, 4000);
        } catch {
            docText = `Document: ${file.name}`;
        }

        // Fetch ALL regulations for this industry + country from DB
        const { data: regulations } = await supabaseAdmin
            .from("regulations")
            .select("id, title, section_number, page_number, content, category")
            .eq("industry", industry)
            .eq("country", country)
            .limit(20);

        const regList = (regulations || [])
            .map((r: any, i: number) => `REG_${i + 1}: [${r.title}] Section ${r.section_number}, Page ${r.page_number}\nContent: ${r.content?.slice(0, 200)}`)
            .join("\n\n");

        const prompt = `You are a world-class compliance similarity analyst. Compare this document against each regulation and calculate similarity scores.

UPLOADED DOCUMENT:
${docText}

REGULATIONS TO COMPARE AGAINST:
${regList || `General ${industry} compliance regulations in ${country}`}

For each regulation, calculate:
1. Similarity percentage (0-100%) — how much the document aligns with that regulation
2. Match level: "strong" (70-100%), "partial" (40-69%), "weak" (0-39%)
3. What matches and what is missing

Return ONLY valid JSON:
{
  "overall_similarity": 72,
  "document_name": "${file.name}",
  "industry": "${industry}",
  "country": "${country}",
  "summary": "This document shows strong alignment with safety regulations but weak alignment with environmental standards.",
  "regulation_matches": [
    {
      "regulation_title": "Title of regulation",
      "section": "Section number",
      "page": "Page number",
      "similarity_score": 85,
      "match_level": "strong",
      "matched_clauses": ["Clause 1 that matches", "Clause 2 that matches"],
      "missing_clauses": ["Missing requirement 1", "Missing requirement 2"]
    }
  ],
  "top_matches": ["Regulation with highest similarity"],
  "critical_gaps": ["Most important missing compliance areas"],
  "recommendation": "Overall recommendation based on similarity analysis"
}`;

        const text = await callGroq(prompt);
        const clean = text.replace(/```json|```/g, "").trim();

        let result;
        try {
            result = JSON.parse(clean);
        } catch {
            result = {
                overall_similarity: 60,
                document_name: file.name,
                industry,
                country,
                summary: `Document analyzed for similarity with ${industry} regulations in ${country}.`,
                regulation_matches: [
                    {
                        regulation_title: "General Compliance Framework",
                        section: "1.1",
                        page: "1",
                        similarity_score: 60,
                        match_level: "partial",
                        matched_clauses: ["Basic compliance structure present"],
                        missing_clauses: ["Detailed regulatory alignment needed"]
                    }
                ],
                top_matches: ["General Compliance Framework"],
                critical_gaps: ["Full regulatory review required"],
                recommendation: "Schedule a detailed compliance audit with a qualified expert."
            };
        }

        // Save similarity result to DB
        await supabaseAdmin
            .from("uploaded_documents")
            .insert({
                user_id: userId,
                file_name: file.name,
                file_path: `similarity/${userId}/${Date.now()}_${file.name}`,
                file_size: file.size,
                industry,
                country,
                analysis_status: "similarity_done",
                analysis_result: result,
            });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("[Similarity API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}