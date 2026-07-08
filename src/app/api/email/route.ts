import { NextRequest, NextResponse } from "next/server";

const HUNTER_DOMAIN_SEARCH = "https://api.hunter.io/v2/domain-search";
const HUNTER_VERIFIER = "https://api.hunter.io/v2/email-verifier";

interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  first_name?: string;
  last_name?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.warn("[API/email] HUNTER_API_KEY is not set -- returning empty, no real lookup attempted");
      return NextResponse.json({ emails: [] });
    }
    console.log("[API/email] Key present, searching domain:", domain);

    const searchUrl = `${HUNTER_DOMAIN_SEARCH}?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      console.error("[API/email] Hunter domain-search HTTP error:", searchRes.status, JSON.stringify(searchData).slice(0, 300));
      return NextResponse.json({ emails: [] });
    }
    if (!searchData?.data?.emails?.length) {
      console.log("[API/email] Hunter has no emails on file for domain:", domain, "-- this is a real data-coverage limit, not an error");
      return NextResponse.json({ emails: [] });
    }
    console.log("[API/email] Hunter found", searchData.data.emails.length, "candidate email(s) for", domain);

    // Sort by Hunter's own confidence score, highest first
    const sorted = (searchData.data.emails as HunterEmail[]).sort(
      (a, b) => (b.confidence || 0) - (a.confidence || 0)
    );

    // Only verify the single best candidate -- verification calls are a separate
    // quota cost, so we don't burn it on every email found for a domain.
    const best = sorted[0];
    let verifiedStatus: string | null = null;
    let verifiedScore: number | null = null;

    try {
      const verifyUrl = `${HUNTER_VERIFIER}?email=${encodeURIComponent(best.value)}&api_key=${apiKey}`;
      const verifyRes = await fetch(verifyUrl);
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData?.data) {
        verifiedStatus = verifyData.data.status; // "valid" | "invalid" | "accept_all" | "webmail" | "disposable" | "unknown"
        verifiedScore = verifyData.data.score ?? null;
      }
    } catch (verifyErr) {
      console.warn("[API/email] Verification call failed, continuing with unverified result:", verifyErr);
    }

    // Don't hand back an email we've actively confirmed is dead
    if (verifiedStatus === "invalid" || verifiedStatus === "disposable") {
      return NextResponse.json({ emails: [] });
    }

    const emails = [
      {
        email: best.value,
        type: best.type,
        confidence: best.confidence,
        firstName: best.first_name || "",
        lastName: best.last_name || "",
        verified: verifiedStatus === "valid",
        verificationStatus: verifiedStatus || "unverified",
        verificationScore: verifiedScore,
      },
    ];

    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json({ emails: [] });
  }
}
