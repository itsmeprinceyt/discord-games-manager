/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AuditLog {
  id: string;
  action_type: 'user_signup' | 'user_update' | 'user_ban' | 'user_unban' | 
              'game_account_create' | 'game_account_update' | 'game_account_delete' | 
              'system' | 'admin_action' | 'user_action';
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