export interface Lead {
  id: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  location: string;
  businessSize: "Small" | "Medium";
  painPoint: string;
  email: string;
  website: string;
  snippet: string;
  score: number;
  scoreLabel: "🔥 Hot" | "⚡ Warm" | "❄️ Cold";
  status: "New" | "Contacted" | "Replied" | "Converted";
  createdAt: string;
  lastContacted?: string;
  saved: boolean;
}

export interface Draft {
  id: string;
  leadId: string;
  leadName: string;
  businessName: string;
  platform: "LinkedIn DM" | "Email" | "WhatsApp";
  content: string;
  createdAt: string;
}

export interface BriefingData {
  totalLeads: number;
  needsFollowUp: number;
  draftsWaiting: number;
  tipOfDay: string;
  bestPlatform: string;
}

export interface Activity {
  id: string;
  type:
    | "lead_found"
    | "lead_saved"
    | "lead_unsaved"
    | "message_generated"
    | "lead_contacted"
    | "lead_converted";
  message: string;
  timestamp: string;
}
