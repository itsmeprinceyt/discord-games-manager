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
    last_crosstraded_at VARCHAR(30),
    voted_at VARCHAR(30),
    updated_at VARCHAR(30) NOT NULL,
    FOREIGN KEY (bot_account_id) REFERENCES bot_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (name) REFERENCES bots(name) ON DELETE CASCADE,
    FOREIGN KEY (currency_name) REFERENCES bots(currency_name) ON DELETE CASCADE
);


ADD COLUMN normal_days TINYINT UNSIGNED NOT NULL AFTER balance,
ADD COLUMN weekend_days TINYINT UNSIGNED NOT NULL AFTER normal_days;

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
    amount_received INT UNSIGNED NOT NULL,
    rate VARCHAR(10) DEFAULT NULL,
    conversion_rate DECIMAL(18, 12) NULL,
    net_amount INT UNSIGNED NULL,
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

ALTER TABLE crosstrades 
MODIFY COLUMN amount_received DECIMAL(10, 2) NOT NULL,
MODIFY COLUMN net_amount DECIMAL(10, 2) NULL;