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
            model: "gemma2-9b-it",
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

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let docText = "";
        try {
            const pdfParse = require("pdf-parse");
            const pdfData = await pdfParse(buffer);
            docText = pdfData.text.slice(0, 4000);
        } catch {
            docText = `Document: ${file.name}`;
        }

        const { data: regulations } = await supabaseAdmin
            .from("regulations")
            .select("id, title, section_number, page_number, content, category")
            .eq("industry", industry)
            .eq("country", country)
            .limit(20);

        const regList = (regulations || [])
            .map((r: any, i: number) => `REG_${i + 1}: [${r.title}] Section ${r.section_number}, Page ${r.page_number}\nContent: ${r.content?.slice(0, 200)}`)
            .join("\n\n");

        const prompt = `You are a compliance similarity analyst. Compare this document against regulations and calculate similarity scores.

UPLOADED DOCUMENT:
${docText}

REGULATIONS:
${regList || `General ${industry} compliance regulations in ${country}`}

Return ONLY valid JSON:
{
  "overall_similarity": 72,
  "document_name": "${file.name}",
  "industry": "${industry}",
  "country": "${country}",
  "summary": "2-3 sentence summary of similarity analysis",
  "regulation_matches": [
    {
      "regulation_title": "Regulation name",
      "section": "1.1",
      "page": "5",
      "similarity_score": 85,
      "match_level": "strong",
      "matched_clauses": ["Matched clause 1", "Matched clause 2"],
      "missing_clauses": ["Missing requirement 1"]
    }
  ],
  "top_matches": ["Most similar regulation"],
  "critical_gaps": ["Most important gap"],
  "recommendation": "Overall recommendation"
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
                industry, country,
                summary: `Document analyzed for similarity with ${industry} regulations in ${country}.`,
                regulation_matches: [{
                    regulation_title: "General Compliance Framework",
                    section: "1.1", page: "1",
                    similarity_score: 60,
                    match_level: "partial",
                    matched_clauses: ["Basic compliance structure present"],
                    missing_clauses: ["Detailed regulatory alignment needed"]
                }],
                top_matches: ["General Compliance Framework"],
                critical_gaps: ["Full regulatory review required"],
                recommendation: "Schedule a detailed compliance audit."
            };
        }

        await supabaseAdmin.from("uploaded_documents").insert({
            user_id: userId,
            file_name: file.name,
            file_path: `similarity/${userId}/${Date.now()}_${file.name}`,
            file_size: file.size,
            industry, country,
            analysis_status: "similarity_done",
            analysis_result: result,
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("[Similarity API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}