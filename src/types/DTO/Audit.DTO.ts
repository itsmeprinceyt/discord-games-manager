import {
  AuditLog,
  FilterInfo,
  PaginationInfo,
} from "../Admin/AuditLogger/Audit.type";

export interface GetAuditLogsResponseDTO {
  audit_logs: AuditLog[];
  pagination: PaginationInfo;
  filters: FilterInfo;
}

export interface GetAuditLogsRequestDTO {
  page?: number;
  limit?: number;
  search?: string;
  action_type?: string;
  actor_user_id?: string;
  target_user_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: "performed_at" | "action_type" | "actor_name";
  sort_order?: "asc" | "desc";
}
