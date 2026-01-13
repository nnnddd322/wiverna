-- Fix RLS policies for groups table
-- Drop existing policies if any
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read groups (for registration)
CREATE POLICY "groups_select" ON groups
  FOR SELECT
  USING (true);

-- Only teachers can insert groups
CREATE POLICY "groups_insert" ON groups
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Only teachers can update groups
CREATE POLICY "groups_update" ON groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Only teachers can delete groups
CREATE POLICY "groups_delete" ON groups
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );
