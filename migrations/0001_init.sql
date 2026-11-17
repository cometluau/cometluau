CREATE TABLE pastebins (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','taken_down')),
  takedown_reason TEXT,
  user_id TEXT,
  views INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_pastebins_created ON pastebins(created_at DESC);
CREATE INDEX idx_pastebins_expires ON pastebins(expires_at);
CREATE TABLE pastebin_management_keys (
  paste_id TEXT PRIMARY KEY REFERENCES pastebins(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_enc TEXT NOT NULL
);
