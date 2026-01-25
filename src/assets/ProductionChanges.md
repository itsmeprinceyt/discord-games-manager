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