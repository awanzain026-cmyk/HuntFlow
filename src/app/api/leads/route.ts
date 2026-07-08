import { NextRequest, NextResponse } from "next/server";
import { getAllLeads, upsertLead } from "@/lib/db";
import type { Lead } from "@/lib/types";

export async function GET() {
  try {
    const leads = await getAllLeads();
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[API/leads GET] error:", err);
    return NextResponse.json({ leads: [], error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const lead: Lead = await req.json();
    if (!lead.id || !lead.businessName) {
      return NextResponse.json({ error: "id and businessName are required" }, { status: 400 });
    }
    await upsertLead(lead, "manual");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API/leads POST] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
