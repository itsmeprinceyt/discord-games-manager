CREATE TABLE IF NOT EXISTS currency_crosstrades (
id CHAR(12) PRIMARY KEY,
user_id CHAR(12) NOT NULL,
-- Giving side
from_bot_account_id CHAR(12) NOT NULL,
from_selected_bot_id CHAR(12) NOT NULL,
from_currency_name VARCHAR(30) NOT NULL,
from_amount INT NOT NULL,
-- Receiving side
to_bot_account_id CHAR(12) NOT NULL,
to_selected_bot_id CHAR(12) NOT NULL,
to_currency_name VARCHAR(30) NOT NULL,
to_amount INT NOT NULL,
-- Meta
traded_with CHAR(36) DEFAULT NULL,
trade_link VARCHAR(100) DEFAULT NULL,
note VARCHAR(250) DEFAULT NULL,
created_at VARCHAR(30) NOT NULL,
updated_at VARCHAR(30) NOT NULL,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (from_bot_account_id) REFERENCES bot_accounts(id) ON DELETE CASCADE,
FOREIGN KEY (from_selected_bot_id) REFERENCES selected_bot(id) ON DELETE CASCADE,
FOREIGN KEY (to_bot_account_id) REFERENCES bot_accounts(id) ON DELETE CASCADE,
FOREIGN KEY (to_selected_bot_id) REFERENCES selected_bot(id) ON DELETE CASCADE
);

make indexing
