import { NextRequest, NextResponse } from "next/server";

const HUNTER_API = "https://api.hunter.io/v2/domain-search";

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ emails: [] });
    }

    const url = `${HUNTER_API}?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data?.data?.emails) {
      return NextResponse.json({ emails: [] });
    }

    const emails = data.data.emails.map((e: { value: string; type: string; confidence: number; first_name?: string; last_name?: string }) => ({
      email: e.value,
      type: e.type,
      confidence: e.confidence,
      firstName: e.first_name || "",
      lastName: e.last_name || "",
    }));

    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json({ emails: [] });
  }
}
