import { NextRequest, NextResponse } from "next/server";

const SERPER_API = "https://google.serper.dev/search";

export async function POST(req: NextRequest) {
  try {
    const { query, num = 10 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SERPER_API_KEY not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    console.log("[API/search] Searching Serper for:", query);

    const res = await fetch(SERPER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: Math.min(num, 20) }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[API/search] Serper error:", res.status, body.slice(0, 300));
      return NextResponse.json(
        { error: `Serper API error ${res.status}: ${body.slice(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (data.organic || []).map((r: any) => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.snippet || "",
    }));

    console.log("[API/search] Got", results.length, "results");
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[API/search] Internal error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
