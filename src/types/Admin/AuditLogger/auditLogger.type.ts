export interface AuditActor {
  user_id: string;
  email: string;
  name: string;
}

export type AuditActionType =
  | "user_signup"
  | "user_update"
  | "user_ban"
  | "user_unban"
  | "game_account_create"
  | "game_account_update"
  | "game_account_delete"
  | "system"
  | "admin_action"
  | "user_action";
