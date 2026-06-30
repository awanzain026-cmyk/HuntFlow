import type { Lead, Draft, Activity } from "./types";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.warn("[store] Failed to parse", key, e);
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
  const existing = leads.findIndex((l) => l.id === lead.id);
  if (existing !== -1) {
    leads[existing] = { ...leads[existing], ...lead };
  } else {
    leads.unshift(lead);
  }
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
  setItem("huntflow_leads", getLeads().filter((l) => l.id !== id));
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
  setItem("huntflow_drafts", getDrafts().filter((d) => d.id !== id));
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

export function clearAllLeads(): void {
  setItem("huntflow_leads", []);
  setItem("huntflow_activities", []);
  setItem("huntflow_drafts", []);
}

export function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  }
}
