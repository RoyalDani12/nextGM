import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  submitSupportTicketRequest,
  getMyTicketsRequest,
  replyToTicketRequest,
  getAdminTicketsRequest,
  getAdminTicketRequest,
  updateAdminTicketRequest,
  adminReplyToTicketRequest,
  type SubmitTicketPayload,
} from "./support.api";

export const useSubmitSupportTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitTicketPayload) => submitSupportTicketRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
  });
};

export const useMyTickets = () => {
  return useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: () => getMyTicketsRequest().then((r) => r.data.data),
  });
};

export const useReplyToTicket = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => replyToTicketRequest(ticketId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["my-support-ticket", ticketId] });
    },
  });
};

export const useAdminTickets = (params?: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  page?: number;
}) => {
  return useQuery({
    queryKey: ["admin-support-tickets", params],
    queryFn: () => getAdminTicketsRequest(params).then((r) => r.data.data),
  });
};

export const useAdminTicket = (ticketId: string) => {
  return useQuery({
    queryKey: ["admin-support-ticket", ticketId],
    queryFn: () => getAdminTicketRequest(ticketId).then((r) => r.data.data),
    enabled: !!ticketId,
  });
};

export const useUpdateAdminTicket = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status?: string; priority?: string; assignedToId?: string | null }) =>
      updateAdminTicketRequest(ticketId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
    },
  });
};

export const useAdminReplyToTicket = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => adminReplyToTicketRequest(ticketId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
    },
  });
};
