import { api } from "@/lib/axios";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  user?: { id: string; name: string; email: string } | null;
  messages: TicketMessage[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  body: string;
  senderId?: string | null;
  isStaff: boolean;
  senderName?: string | null;
  createdAt: string;
}

export interface SubmitTicketPayload {
  subject: string;
  category: string;
  message: string;
  priority?: string;
  guestName?: string;
  guestEmail?: string;
}

export interface AdminTicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: Record<string, number>;
}

// Submit ticket (public — works for guests and logged-in users)
export const submitSupportTicketRequest = (data: SubmitTicketPayload) =>
  api.post<{ success: boolean; message: string; data: { ticketNumber: string; id: string } }>("/support", data);

// Customer: list my tickets
export const getMyTicketsRequest = () =>
  api.get<{ success: boolean; data: SupportTicket[] }>("/support/my");

// Customer: reply to ticket
export const replyToTicketRequest = (ticketId: string, message: string) =>
  api.post<{ success: boolean; data: TicketMessage }>(`/support/my/${ticketId}/reply`, { message });

// Admin: list all tickets
export const getAdminTicketsRequest = (params?: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}) =>
  api.get<{ success: boolean; data: AdminTicketsResponse }>("/support/admin", { params });

// Admin: get single ticket
export const getAdminTicketRequest = (ticketId: string) =>
  api.get<{ success: boolean; data: SupportTicket }>(`/support/admin/${ticketId}`);

// Admin: update ticket
export const updateAdminTicketRequest = (
  ticketId: string,
  data: { status?: string; priority?: string; assignedToId?: string | null }
) =>
  api.patch<{ success: boolean; data: any }>(`/support/admin/${ticketId}`, data);

// Admin: reply to ticket
export const adminReplyToTicketRequest = (ticketId: string, message: string) =>
  api.post<{ success: boolean; data: TicketMessage }>(`/support/admin/${ticketId}/reply`, { message });
