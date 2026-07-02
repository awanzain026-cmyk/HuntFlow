const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callAI(prompt: string, maxTokens = 1024): Promise<string> {
  // Try Gemini first if key is set
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        const errBody = await res.text();
        console.warn("[AI] Gemini failed:", res.status, errBody.slice(0, 200));
      }
    } catch (e) {
      console.warn("[AI] Gemini error:", e);
    }
  }

  // Fallback: proxy through our own API route (server-side fetch avoids CORS/blocker issues)
  console.log("[AI] Calling Sodeom via /api/ai proxy. Prompt length:", prompt.length);
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });

  const data = await res.json();

  if (!res.ok || !data.content) {
    const errMsg = data.error || `HTTP ${res.status}`;
    throw new Error(`AI request failed: ${errMsg}`);
  }

  return data.content;
}

export async function enrichSearchResults(
  results: Array<{ title: string; link: string; snippet: string }>,
  service: string,
  idealClient: string
): Promise<string> {
  console.log("[enrichSearchResults] Sending", results.length, "results for enrichment");
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchResults: results,
      service,
      idealClient,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.content) {
    throw new Error(data.error || `Enrichment failed (${res.status})`);
  }
  return data.content;
}

export function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function findRealEmails(
  leads: Array<{ website?: string; ownerName?: string; businessName?: string }>
): Promise<Map<string, { email: string; ownerName?: string }>> {
  const result = new Map<string, { email: string; ownerName?: string }>();

  const tasks = leads.map(async (lead) => {
    const domain = lead.website ? extractDomain(lead.website) : null;
    if (!domain) return;

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data?.emails?.length) return;

      const emails = data.emails;
      // Prefer personal emails over generic (info@, contact@)
      const personal = emails.filter((e: { type: string }) => e.type === "personal");
      const best = personal.length > 0 ? personal[0] : emails[0];

      const ownerName = best.firstName
        ? `${best.firstName} ${best.lastName || ""}`.trim()
        : undefined;

      result.set(lead.website || domain, { email: best.email, ownerName });
    } catch {
      // Silently fall back to AI-guessed email
    }
  });

  await Promise.all(tasks);
  return result;
}

export async function generateOutreach(
  businessName: string,
  painPoint: string,
  platform: "LinkedIn DM" | "Email" | "WhatsApp",
  ownerName: string
): Promise<string> {
  const wordLimit = platform === "Email" ? 200 : 150;
  const prompt = `You are a professional outreach copywriter. Write a personalized ${platform} message from Muhammad Zain to ${ownerName} at ${businessName}.

Context:
- Muhammad Zain is a freelancer who helps businesses with AI solutions, dashboards, and automation
- ${businessName}'s specific problem: "${painPoint}"
- Portfolio examples: FinSight (fin-sight-beta-pink.vercel.app) for financial dashboards, BizFlow (biz-flow-kappa.vercel.app) for business workflow automation

Requirements:
- Address ${ownerName} by name
- Mention ${businessName} specifically
- Reference their exact problem: "${painPoint}"
- Introduce Muhammad Zain naturally
- Mention a relevant portfolio example (FinSight or BizFlow depending on context)
- Include a soft CTA (not pushy — suggest a quick chat or demo)
- Under ${wordLimit} words
- Professional but warm tone
- Do NOT use placeholders like [brackets]

Write the complete message.`;

  return callAI(prompt, 1024);
}

export async function generateTip(): Promise<string> {
  const prompt = `Give one actionable freelancing tip for finding and converting high-quality clients. Keep it under 3 sentences. Make it specific and practical. Return just the tip text, no introduction.`;
  return callAI(prompt, 256);
}
