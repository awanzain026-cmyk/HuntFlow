import { NextRequest, NextResponse } from "next/server";

const SERPER_PLACES_API = "https://google.serper.dev/places";

export async function POST(req: NextRequest) {
  try {
    const { query, gl, location, num = 20 } = await req.json();

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

    const body: Record<string, unknown> = { q: query, num: Math.min(num, 20) };
    if (gl) body.gl = gl;
    if (location) body.location = location;

    console.log("[API/places] Searching Serper Places for:", query, "gl:", gl, "location:", location);

    const res = await fetch(SERPER_PLACES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[API/places] Serper error:", res.status, errBody.slice(0, 300));
      return NextResponse.json(
        { error: `Serper Places API error ${res.status}: ${errBody.slice(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    interface PlaceItem {
      title?: string;
      address?: string;
      phoneNumber?: string;
      website?: string;
      rating?: number;
      ratingCount?: number;
      category?: string;
      cid?: string;
    }
    const places = ((data.places || []) as PlaceItem[]).map((p) => ({
      businessName: p.title || "",
      address: p.address || "",
      phone: p.phoneNumber || "",
      website: p.website || "",
      rating: p.rating,
      ratingCount: p.ratingCount,
      category: p.category || "",
    }));

    console.log("[API/places] Got", places.length, "real places for query:", query);
    return NextResponse.json({ places });
  } catch (err) {
    console.error("[API/places] Internal error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
