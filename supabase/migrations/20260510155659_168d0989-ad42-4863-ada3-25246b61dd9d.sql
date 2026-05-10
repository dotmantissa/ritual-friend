CREATE TABLE public.members (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'oauth',
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX members_discord_id_asc_idx ON public.members (discord_id ASC);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can view the friend pool (it's a public game).
CREATE POLICY "Members are publicly readable"
  ON public.members FOR SELECT
  USING (true);

-- No public write — only the service role (server) can insert/update.
-- (No INSERT/UPDATE/DELETE policies = no anon writes.)
