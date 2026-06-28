const SODEM_API = "https://sodeom.com/v1/chat/completions";

export async function callSodeom(prompt: string, maxTokens = 1024): Promise<string> {
  const res = await fetch(SODEM_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    throw new Error(`Sodeom API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function generateLeads(
  idealClient: string,
  service: string
): Promise<string> {
  const prompt = `You are a lead generation AI. Generate exactly 8 realistic business leads for a freelancer named Muhammad Zain who offers "${service}" services.

Ideal client description: "${idealClient}"

For each lead, provide:
- Business Name (realistic Pakistani business)
- Owner Name (realistic Pakistani name)
- Business Type (e.g. Retail, Manufacturing, Tech, Healthcare, Education, Real Estate, E-commerce, Logistics)
- Location (choose from: Karachi, Lahore, Islamabad, Faisalabad, Rawalpindi, Multan, Peshawar, Quetta, Sialkot, Hyderabad)
- Business Size (Small or Medium)
- Pain Point (one specific line about why they need "${service}")
- Contact Email (realistic format like info@businessname.com or owner.name@gmail.com)
- Lead Score (0-100, be realistic — some should be high, some medium, some low)

Format as JSON array. Each object: { "businessName", "ownerName", "businessType", "location", "businessSize", "painPoint", "email", "score" }

Return ONLY the JSON array, no other text.`;

  return callSodeom(prompt, 2048);
}

export async function generateOutreach(
  leadName: string,
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

  return callSodeom(prompt, 1024);
}

export async function generateTip(): Promise<string> {
  const prompt = `Give one actionable freelancing tip for finding and converting high-quality clients. Keep it under 3 sentences. Make it specific and practical. Return just the tip text, no introduction.`;

  return callSodeom(prompt, 256);
}
