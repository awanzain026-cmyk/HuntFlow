import type { Lead, Draft, Activity } from "./types";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLeads(): Lead[] {
  return getItem<Lead[]>("huntflow_leads", []);
}

export function saveLeads(leads: Lead[]): void {
  setItem("huntflow_leads", leads);
}

export function addLead(lead: Lead): void {
  const leads = getLeads();
  leads.unshift(lead);
  saveLeads(leads);
}

export function updateLead(id: string, updates: Partial<Lead>): void {
  const leads = getLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx !== -1) {
    leads[idx] = { ...leads[idx], ...updates };
    saveLeads(leads);
  }
}

export function deleteLead(id: string): void {
  const leads = getLeads().filter((l) => l.id !== id);
  saveLeads(leads);
}

export function getDrafts(): Draft[] {
  return getItem<Draft[]>("huntflow_drafts", []);
}

export function saveDrafts(drafts: Draft[]): void {
  setItem("huntflow_drafts", drafts);
}

export function addDraft(draft: Draft): void {
  const drafts = getDrafts();
  drafts.unshift(draft);
  saveDrafts(drafts);
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter((d) => d.id !== id);
  saveDrafts(drafts);
}

export function getActivities(): Activity[] {
  return getItem<Activity[]>("huntflow_activities", []);
}

export function saveActivities(activities: Activity[]): void {
  setItem("huntflow_activities", activities);
}

export function addActivity(activity: Activity): void {
  const activities = getActivities();
  activities.unshift(activity);
  if (activities.length > 50) activities.length = 50;
  saveActivities(activities);
}

export function storeDemoData(leads: Lead[]): void {
  saveLeads(leads);
  const activities: Activity[] = leads.map((l) => ({
    id: crypto.randomUUID(),
    type: "lead_found" as const,
    message: `Found lead: ${l.businessName} (${l.location})`,
    timestamp: new Date().toISOString(),
  }));
  saveActivities(activities);
}

export function generateId(): string {
  return crypto.randomUUID();
}
