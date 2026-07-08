import { NextRequest, NextResponse } from "next/server";
import { updateLeadFields, deleteLeadById } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json();
    await updateLeadFields(params.id, updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API/leads/[id] PATCH] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteLeadById(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API/leads/[id] DELETE] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
