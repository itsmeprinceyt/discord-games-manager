CREATE TABLE users (
    id CHAR(12) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NULL
);
CREATE TABLE IF NOT EXISTS bots (
    id CHAR(12) PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    currency_name VARCHAR(30) NOT NULL,
    vote_link VARCHAR(100) DEFAULT NULL,
    normal_days TINYINT UNSIGNED NOT NULL,
    weekend_days TINYINT UNSIGNED NOT NULL,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NOT NULL
);
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