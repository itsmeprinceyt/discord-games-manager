CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(12) NOT NULL PRIMARY KEY,
    action_type ENUM(
        'user_signup',
        'user_update',
        'user_ban',
        'user_unban',
        'game_account_create',
        'game_account_update',
        'game_account_delete',
        'system',
        'admin_action',
        'user_action'
    ) NOT NULL,

    actor_user_id CHAR(36),
    target_user_id CHAR(36),

    actor_email VARCHAR(255),
    actor_name VARCHAR(255),

    description TEXT,
    meta JSON,

    performed_at VARCHAR(30) DEFAULT NULL
);