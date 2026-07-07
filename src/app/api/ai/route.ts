import { NextRequest, NextResponse } from "next/server";

const SODEM_API = "https://sodeom.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { prompt, maxTokens = 1024 } = body;
    const { searchResults, places, service, idealClient } = body;

    // If real Places data provided (preferred path — real business data, no guessing)
    if (places && Array.isArray(places)) {
      const placesJson = JSON.stringify(places, null, 2);
      prompt = `You are a lead qualification AI. Below are REAL businesses found via Google Maps/Places search — potential clients needing "${service || "your service"}" services.

Ideal client: "${idealClient || "businesses needing digital solutions"}"

For EACH business, using ONLY the real data given, return:
- businessName: use the given name exactly, do not change it
- ownerName: "Contact via Website" (never invent a person's name)
- businessType: use the given category if present, otherwise infer briefly from the business name
- location: use the given address (or extract just the city/area from it)
- businessSize: "Small" or "Medium" based on context (default "Small" if unsure)
- painPoint: one specific, concrete line about why this business might need "${service || "your service"}", based on its business type
- website: the given website exactly, or empty string "" if none was given — do NOT invent a URL
- phone: the given phone number exactly, or empty string "" if none was given — do NOT invent a number
- score: a relevance score 0-100 for how well this matches "${idealClient || "the ideal client"}" — favor businesses that have both a real website and a rating

Do NOT invent an email address, phone number, or website under any circumstance. Only use exactly what is given below, or leave the field as an empty string.

Return ONLY a JSON array of objects with these exact keys. No markdown, no extra text.

Businesses:
${placesJson}`;
      maxTokens = 4096;
    }
    // Legacy path: generic web search results (kept for backward compatibility)
    else if (searchResults && Array.isArray(searchResults)) {
      const resultsJson = JSON.stringify(searchResults, null, 2);
      prompt = `You are a lead enrichment AI. Below are Google search results for potential clients needing "${service || "your service"}" services.

Ideal client: "${idealClient || "businesses needing digital solutions"}"

For EACH search result, extract:
- businessName: The real business name from the title
- ownerName: The likely owner/decision maker (if name found in snippet, use it; otherwise "Contact via Website")
- businessType: The industry/category (e.g. Retail, Tech, Healthcare, Manufacturing, etc.)
- location: Any location mentioned, or "Unknown" if not found
- businessSize: "Small" or "Medium" based on context
- painPoint: One specific line about why they might need "${service || "your service"}", based on the snippet
- website: The full URL from the search result
- score: A relevance score 0-100 based on how well they match "${idealClient || "the ideal client"}"

Do NOT invent an email address — leave it out entirely, real emails are looked up separately.

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
