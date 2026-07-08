import { NextRequest, NextResponse } from "next/server";
import { upsertLead, isDuplicateBusiness } from "@/lib/db";
import type { Lead } from "@/lib/types";

// Rotates through target client types + countries so auto-hunt doesn't
// search the exact same thing every single day.
const TARGET_SEGMENTS = [
  { idealClient: "e-commerce stores", service: "AI customer support agent", country: "us" },
  { idealClient: "real estate agencies", service: "AI lead qualification chatbot", country: "gb" },
  { idealClient: "dental clinics", service: "AI appointment booking assistant", country: "ca" },
  { idealClient: "law firms", service: "AI intake and scheduling agent", country: "au" },
  { idealClient: "restaurants", service: "AI reservation and FAQ chatbot", country: "ae" },
  { idealClient: "digital marketing agencies", service: "AI client reporting agent", country: "pk" },
];

const COUNTRY_META: Record<string, { gl: string; location: string }> = {
  us: { gl: "us", location: "United States" },
  gb: { gl: "gb", location: "United Kingdom" },
  ca: { gl: "ca", location: "Canada" },
  au: { gl: "au", location: "Australia" },
  ae: { gl: "ae", location: "Dubai, United Arab Emirates" },
  pk: { gl: "pk", location: "Pakistan" },
};

function getBaseUrl(req: NextRequest): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = req.headers.get("host");
  return host ? `http://${host}` : "http://localhost:3000";
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export async function GET(req: NextRequest) {
  // Protect against anyone triggering this manually and spamming API quota
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = getBaseUrl(req);
  // Pick one segment per run, rotating by day-of-year so it cycles through all of them
  const dayIndex = Math.floor(Date.now() / 86400000) % TARGET_SEGMENTS.length;
  const segment = TARGET_SEGMENTS[dayIndex];
  const countryMeta = COUNTRY_META[segment.country];

  const results = { segment, found: 0, saved: 0, skippedDuplicate: 0, errors: [] as string[] };

  try {
    const placesRes = await fetch(`${baseUrl}/api/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `${segment.service} for ${segment.idealClient}`,
        gl: countryMeta.gl,
        location: countryMeta.location,
        num: 15,
      }),
    });
    const placesData = await placesRes.json();
    const places = placesData.places || [];
    results.found = places.length;

    if (places.length === 0) {
      return NextResponse.json(results);
    }

    const aiRes = await fetch(`${baseUrl}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ places, service: segment.service, idealClient: segment.idealClient }),
    });
    const aiData = await aiRes.json();
    if (!aiData.content) {
      results.errors.push("AI enrichment returned no content");
      return NextResponse.json(results);
    }

    let parsed: Array<Record<string, unknown>>;
    try {
      const cleaned = aiData.content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      results.errors.push("Failed to parse AI response as JSON");
      return NextResponse.json(results);
    }

    for (const p of parsed) {
      const score = typeof p.score === "number" ? p.score : 50;
      // Only auto-save genuinely promising leads -- don't fill the DB with cold ones
      if (score < 60) continue;

      const businessName = String(p.businessName || "");
      const location = String(p.location || countryMeta.location);
      if (!businessName) continue;

      const isDup = await isDuplicateBusiness(businessName, location);
      if (isDup) {
        results.skippedDuplicate++;
        continue;
      }

      const lead: Lead = {
        id: generateId(),
        businessName,
        ownerName: String(p.ownerName || "Contact via Website"),
        businessType: String(p.businessType || "General"),
        location,
        businessSize: p.businessSize === "Medium" ? "Medium" : "Small",
        painPoint: String(p.painPoint || "Potential client"),
        email: "",
        emailVerified: false,
        emailVerificationStatus: "unverified",
        website: String(p.website || ""),
        phone: String(p.phone || ""),
        snippet: "",
        score,
        scoreLabel: score >= 80 ? "🔥 Hot" : score >= 50 ? "⚡ Warm" : "❄️ Cold",
        status: "New",
        createdAt: new Date().toISOString(),
        saved: true,
      };

      await upsertLead(lead, "auto");
      results.saved++;
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("[cron/auto-hunt] error:", err);
    results.errors.push(String(err));
    return NextResponse.json(results, { status: 500 });
  }
}
