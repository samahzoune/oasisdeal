-- Durable social connections and scheduled posts for the OasisDeal Worker.
-- Access/refresh tokens are encrypted by the Worker before they reach D1.

CREATE TABLE IF NOT EXISTS social_connections (
  owner_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (owner_id, platform)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT 'https://oasisdeal.com',
  media_url TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  attempts INTEGER NOT NULL DEFAULT 0,
  external_id TEXT,
  last_error TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (owner_id, client_id)
);

CREATE INDEX IF NOT EXISTS social_posts_due_idx
  ON social_posts (status, scheduled_at);

