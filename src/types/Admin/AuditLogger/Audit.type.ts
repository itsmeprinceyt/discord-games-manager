/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AuditLogActor {
  user_id: string | null;
  email: string | null;
  name: string | null;
  db_id: string | null;
  username: string | null;
  display_name: string | null;
}

export interface AuditLogTarget {
  user_id: string;
  db_id: string | null;
  name: string | null;
  username: string | null;
}

export interface AuditLog {
  id: string;
  action_type: string;
  actor: AuditLogActor;
  target: AuditLogTarget | null;
  description: string | null;
  meta: any | null;
  performed_at: string;
  timestamp: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterInfo {
  search: string;
  action_type: string;
  actor_user_id: string;
  target_user_id: string;
  start_date: string;
  end_date: string;
  sort_by: string;
  sort_order: string;
}
