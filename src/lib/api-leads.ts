import type { Lead } from "./types";

export async function fetchLeads(): Promise<Lead[]> {
  try {
    const res = await fetch("/api/leads");
    const data = await res.json();
    return data.leads || [];
  } catch (err) {
    console.error("[api-leads] fetchLeads failed:", err);
    return [];
  }
}

export async function saveLeadRemote(lead: Lead): Promise<void> {
  try {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
  } catch (err) {
    console.error("[api-leads] saveLeadRemote failed:", err);
  }
}

export async function updateLeadRemote(id: string, updates: Partial<Lead>): Promise<void> {
  try {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.error("[api-leads] updateLeadRemote failed:", err);
  }
}

export async function deleteLeadRemote(id: string): Promise<void> {
  try {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
  } catch (err) {
    console.error("[api-leads] deleteLeadRemote failed:", err);
  }
}
