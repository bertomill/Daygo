-- Table to store daily metric snapshots for tracking growth
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_metric_snapshots_lookup
ON metric_snapshots(user_id, metric_name, created_at DESC);

-- RLS policies
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
ON metric_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON metric_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);
