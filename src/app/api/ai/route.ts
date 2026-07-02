import { NextRequest, NextResponse } from "next/server";

const SODEM_API = "https://sodeom.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { prompt, maxTokens = 1024 } = body;
    const { searchResults, service, idealClient } = body;

    // If search results provided, construct enrichment prompt server-side
    if (searchResults && Array.isArray(searchResults)) {
      const resultsJson = JSON.stringify(searchResults, null, 2);
      prompt = `You are a lead enrichment AI. Below are Google search results for potential clients needing "${service || "your service"}" services.

Ideal client: "${idealClient || "businesses needing digital solutions"}"

For EACH search result, extract:
- businessName: The real business name from the title
- ownerName: The likely owner/decision maker (if name found in snippet, use it; otherwise "Contact via Website")
- businessType: The industry/category (e.g. Retail, Tech, Healthcare, Manufacturing, etc.)
- location: Any location mentioned, or "Pakistan" if not found
- businessSize: "Small" or "Medium" based on context
- painPoint: One specific line about why they might need "${service || "your service"}", based on the snippet
- email: Generate the most likely contact email (info@domain.com, contact@domain.com, or hello@domain.com from the URL)
- website: The full URL from the search result
- score: A relevance score 0-100 based on how well they match "${idealClient || "the ideal client"}"

Return ONLY a JSON array of objects with these exact keys. No markdown, no extra text.

Search results:
${resultsJson}`;
      maxTokens = 4096;
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log("[API/ai] Proxying to Sodeom. Prompt length:", prompt.length);

    const res = await fetch(SODEM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[API/ai] Sodeom error:", res.status, data);
      return NextResponse.json(
        { error: `Sodeom API error ${res.status}`, details: data },
        { status: res.status }
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Unexpected API response structure", details: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ content: content.trim() });
  } catch (err) {
    console.error("[API/ai] Internal error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
