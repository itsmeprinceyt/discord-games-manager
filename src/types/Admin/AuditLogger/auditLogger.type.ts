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
  | "admin_promote"
  | "admin_demote"
  | "mod_promote"
  | "mod_demote"
  | "post_create"
  | "post_update"
  | "post_delete"
  | "post_feature"
  | "post_unfeature"
  | "category_create"
  | "category_update"
  | "category_delete"
  | "reaction_create"
  | "reaction_delete"
  | "invite_token_create"
  | "invite_token_deactivate"
  | "suggestion_create"
  | "suggestion_update"
  | "suggestion_delete"
  | "suggestion_status_change"
  | "settings_update"
  | "system";
