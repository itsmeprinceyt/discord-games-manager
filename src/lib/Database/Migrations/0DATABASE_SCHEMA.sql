-- Database User
CREATE TABLE users (
    id CHAR(12) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NULL
);
-- All the bots ( Sofi, Karuta )
CREATE TABLE IF NOT EXISTS bots (
    id CHAR(12) PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    currency_name VARCHAR(30) NOT NULL UNIQUE,
    vote_link VARCHAR(100) DEFAULT NULL,
    vote_link_alternate VARCHAR(100) DEFAULT NULL,
    normal_days TINYINT UNSIGNED NOT NULL,
    weekend_days TINYINT UNSIGNED NOT NULL,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NOT NULL
);
-- Game Account created by the User
CREATE TABLE IF NOT EXISTS bot_accounts (
    id CHAR(12) PRIMARY KEY,
    user_id CHAR(12) NOT NULL,
    -- Owner user
    name VARCHAR(30) NOT NULL,
    -- Bot account name
    account_uid CHAR(36),
    voted_at VARCHAR(30),
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Bot Active in that Game Account
CREATE TABLE IF NOT EXISTS selected_bot (
    id CHAR(12) PRIMARY KEY,
    bot_account_id CHAR(12) NOT NULL,
    -- Parent bot account
    name VARCHAR(30) NOT NULL,
    currency_name VARCHAR(30) NOT NULL,
    balance INT DEFAULT 0,
    normal_days TINYINT UNSIGNED NOT NULL,
    weekend_days TINYINT UNSIGNED NOT NULL,
    last_crosstraded_at VARCHAR(30),
    voted_at VARCHAR(30),
    updated_at VARCHAR(30) NOT NULL,
    FOREIGN KEY (bot_account_id) REFERENCES bot_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (name) REFERENCES bots(name) ON DELETE CASCADE,
    FOREIGN KEY (currency_name) REFERENCES bots(currency_name) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS crosstrades (
    id CHAR(12) PRIMARY KEY,
    -- Relationships
    user_id CHAR(12) NOT NULL,
    bot_account_id CHAR(12) NOT NULL,
    selected_bot_id CHAR(12) NOT NULL,
    -- Trade Info
    crosstrade_date VARCHAR(30) NOT NULL,
    currency ENUM('inr', 'usd') NOT NULL DEFAULT 'inr',
    crosstrade_via ENUM('upi', 'paypal', 'wise') NOT NULL DEFAULT 'upi',
    amount_received DECIMAL(10, 2) NOT NULL,
    rate VARCHAR(10) DEFAULT NULL,
    conversion_rate DECIMAL(18, 12) NULL,
    net_amount DECIMAL(10, 2) NULL,
    traded_with CHAR(36) DEFAULT NULL,
    trade_link VARCHAR(100) DEFAULT NULL,
    traded BOOLEAN NOT NULL DEFAULT TRUE,
    paid BOOLEAN NOT NULL DEFAULT TRUE,
    note VARCHAR(250) DEFAULT NULL,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bot_account_id) REFERENCES bot_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_bot_id) REFERENCES selected_bot(id) ON DELETE CASCADE
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