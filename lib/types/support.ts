export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SenderType  = "user" | "admin";

export interface SupportMessage {
  id:          number;
  sender_type: SenderType;
  sender_name: string;
  message:     string;
  created_at:  string;
}

export interface SupportTicket {
  id:              number;
  ticket_id:       string;
  subject:         string;
  status:          TicketStatus;
  assigned_to:     string | null;
  last_message_at: string | null;
  created_at:      string;
  last_message:    string | null;
  messages?:       SupportMessage[];
}

/** Response of the cursor delta endpoint — only messages newer than after_id. */
export interface MessageDelta {
  data:   SupportMessage[];
  status: TicketStatus;
}
