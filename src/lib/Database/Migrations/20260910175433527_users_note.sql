CREATE TABLE IF NOT EXISTS user_notes (
    id CHAR(12) PRIMARY KEY,
    user_id CHAR(12) NOT NULL,
    title VARCHAR(100) NULL,
    note TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE users DROP COLUMN todo;