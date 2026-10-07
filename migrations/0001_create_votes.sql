CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_id INTEGER NOT NULL CHECK (option_id BETWEEN 1 AND 20),
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_votes_ip_hash ON votes(ip_hash);
CREATE INDEX idx_votes_option_id ON votes(option_id);

PRAGMA optimize;

