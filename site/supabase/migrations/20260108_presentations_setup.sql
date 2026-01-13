-- Create presentations table
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message TEXT,
  slides_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lecture_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_presentations_lecture_id ON presentations(lecture_id);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);

-- Enable RLS
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- Policies for presentations
-- Teachers can manage presentations for their lectures
CREATE POLICY "Teachers can manage their presentations"
  ON presentations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      JOIN disciplines d ON l.discipline_id = d.id
      WHERE l.id = presentations.lecture_id
      AND d.teacher_id = auth.uid()
    )
  );

-- Students can view presentations for lectures they have access to
CREATE POLICY "Students can view presentations"
  ON presentations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      JOIN discipline_access da ON l.discipline_id = da.discipline_id
      WHERE l.id = presentations.lecture_id
      AND da.student_id = auth.uid()
      AND l.status = 'published'
    )
  );

-- Create storage bucket for presentations
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentations', 'presentations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for presentations bucket
-- Teachers can upload to their lecture folders
CREATE POLICY "Teachers can upload presentations"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'presentations'
    AND (storage.foldername(name))[1] IN (
      SELECT l.id::text
      FROM lectures l
      JOIN disciplines d ON l.discipline_id = d.id
      WHERE d.teacher_id = auth.uid()
      AND l.type = 'presentation'
    )
  );

-- Teachers can update their presentations
CREATE POLICY "Teachers can update presentations"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'presentations'
    AND (storage.foldername(name))[1] IN (
      SELECT l.id::text
      FROM lectures l
      JOIN disciplines d ON l.discipline_id = d.id
      WHERE d.teacher_id = auth.uid()
      AND l.type = 'presentation'
    )
  );

-- Teachers can delete their presentations
CREATE POLICY "Teachers can delete presentations"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'presentations'
    AND (storage.foldername(name))[1] IN (
      SELECT l.id::text
      FROM lectures l
      JOIN disciplines d ON l.discipline_id = d.id
      WHERE d.teacher_id = auth.uid()
      AND l.type = 'presentation'
    )
  );

-- Everyone can read public presentations (for students to view slides)
CREATE POLICY "Public read access for presentations"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'presentations');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_presentations_updated_at();

-- Comments for documentation
COMMENT ON TABLE presentations IS 'Stores presentation metadata and conversion status';
COMMENT ON COLUMN presentations.lecture_id IS 'Reference to the lecture (one-to-one relationship)';
COMMENT ON COLUMN presentations.file_path IS 'Path to source PPTX file in storage';
COMMENT ON COLUMN presentations.status IS 'Conversion status: pending, processing, ready, error';
COMMENT ON COLUMN presentations.slides_data IS 'JSON with pageCount, slides array, and optional thumb';
