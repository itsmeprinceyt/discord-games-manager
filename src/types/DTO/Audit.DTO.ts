import { AuditActionType } from "../Admin/AuditLogger/auditLogger.type";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AuditLog {
  id: string;
  action_type: AuditActionType;
  actor_user_id: string | null;
  target_user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  description: string;
  meta: Record<string, any> | null;
  performed_at: string | null;
}

export interface AdminDashboardStats {
  total_users: number;
}

export interface AdminDashboardResponse {
  success: boolean;
  data: {
    stats: AdminDashboardStats;
    auditLogs: AuditLog[];
  };
  error?: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data: {
    logs: AuditLog[];
    pagination: {
      current_page: number;
      items_per_page: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  error?: string;
}
