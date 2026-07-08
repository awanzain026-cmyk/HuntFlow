import { sql } from "@vercel/postgres";
import type { Lead } from "./types";

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      owner_name TEXT,
      business_type TEXT,
      location TEXT,
      business_size TEXT,
      pain_point TEXT,
      email TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      email_verification_status TEXT,
      website TEXT,
      phone TEXT,
      snippet TEXT,
      score INTEGER,
      score_label TEXT,
      status TEXT DEFAULT 'New',
      created_at TIMESTAMPTZ DEFAULT now(),
      last_contacted TIMESTAMPTZ,
      saved BOOLEAN DEFAULT FALSE,
      source TEXT DEFAULT 'manual'
    );
  `;
  schemaReady = true;
}

interface LeadRow {
  id: string;
  business_name: string;
  owner_name: string | null;
  business_type: string | null;
  location: string | null;
  business_size: string | null;
  pain_point: string | null;
  email: string | null;
  email_verified: boolean | null;
  email_verification_status: string | null;
  website: string | null;
  phone: string | null;
  snippet: string | null;
  score: number | null;
  score_label: string | null;
  status: string | null;
  created_at: string | Date | null;
  last_contacted: string | Date | null;
  saved: boolean | null;
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    businessName: row.business_name,
    ownerName: row.owner_name || "",
    businessType: row.business_type || "",
    location: row.location || "",
    businessSize: row.business_size === "Medium" ? "Medium" : "Small",
    painPoint: row.pain_point || "",
    email: row.email || "",
    emailVerified: row.email_verified || false,
    emailVerificationStatus: row.email_verification_status || "unverified",
    website: row.website || "",
    phone: row.phone || "",
    snippet: row.snippet || "",
    score: row.score || 0,
    scoreLabel: (row.score_label as Lead["scoreLabel"]) || "❄️ Cold",
    status: (row.status as Lead["status"]) || "New",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    lastContacted: row.last_contacted ? new Date(row.last_contacted).toISOString() : undefined,
    saved: row.saved || false,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  await ensureSchema();
  const { rows } = await sql<LeadRow>`SELECT * FROM leads ORDER BY created_at DESC LIMIT 500;`;
  return rows.map(rowToLead);
}

export async function upsertLead(lead: Lead, source: "manual" | "auto" = "manual"): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO leads (
      id, business_name, owner_name, business_type, location, business_size,
      pain_point, email, email_verified, email_verification_status, website, phone,
      snippet, score, score_label, status, created_at, last_contacted, saved, source
    ) VALUES (
      ${lead.id}, ${lead.businessName}, ${lead.ownerName}, ${lead.businessType}, ${lead.location}, ${lead.businessSize},
      ${lead.painPoint}, ${lead.email}, ${lead.emailVerified || false}, ${lead.emailVerificationStatus || "unverified"},
      ${lead.website}, ${lead.phone || ""}, ${lead.snippet || ""}, ${lead.score}, ${lead.scoreLabel}, ${lead.status},
      ${lead.createdAt}, ${lead.lastContacted || null}, ${lead.saved}, ${source}
    )
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      saved = EXCLUDED.saved,
      last_contacted = EXCLUDED.last_contacted;
  `;
}

export async function updateLeadFields(id: string, updates: Partial<Lead>): Promise<void> {
  await ensureSchema();
  if (updates.status !== undefined) {
    await sql`UPDATE leads SET status = ${updates.status} WHERE id = ${id};`;
  }
  if (updates.saved !== undefined) {
    await sql`UPDATE leads SET saved = ${updates.saved} WHERE id = ${id};`;
  }
  if (updates.lastContacted !== undefined) {
    await sql`UPDATE leads SET last_contacted = ${updates.lastContacted} WHERE id = ${id};`;
  }
}

export async function deleteLeadById(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM leads WHERE id = ${id};`;
}

export async function isDuplicateBusiness(businessName: string, location: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id FROM leads WHERE business_name = ${businessName} AND location = ${location} LIMIT 1;
  `;
  return rows.length > 0;
}
