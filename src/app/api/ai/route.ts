import { NextRequest, NextResponse } from "next/server";

const SODEM_API = "https://sodeom.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, maxTokens = 1024 } = body;

    console.log("[API/ai] Proxying to Sodeom. Prompt length:", prompt?.length);

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
