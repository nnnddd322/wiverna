-- ============================================================================
-- PRESENTATIONS DELTA MIGRATION
-- Приводит существующую таблицу presentations к нужному состоянию
-- ============================================================================

-- ============================================================================
-- ЧАСТЬ 1: ТАБЛИЦА PRESENTATIONS
-- ============================================================================

-- Создать таблицу если её нет (но скорее всего она уже есть)
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  slides_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавить колонки если их нет
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'presentations' AND column_name = 'file_path') THEN
    ALTER TABLE presentations ADD COLUMN file_path TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'presentations' AND column_name = 'error_message') THEN
    ALTER TABLE presentations ADD COLUMN error_message TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'presentations' AND column_name = 'slides_data') THEN
    ALTER TABLE presentations ADD COLUMN slides_data JSONB;
  END IF;
END $$;

-- Удалить старый constraint если есть
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presentations_status_check') THEN
    ALTER TABLE presentations DROP CONSTRAINT presentations_status_check;
  END IF;
END $$;

-- Добавить новый constraint для статусов (без 'pending')
-- Контракт: processing | ready | error
ALTER TABLE presentations 
  ADD CONSTRAINT presentations_status_check 
  CHECK (status IN ('processing', 'ready', 'error'));

-- Изменить default для status на 'processing'
ALTER TABLE presentations 
  ALTER COLUMN status SET DEFAULT 'processing';

-- Добавить UNIQUE constraint на lecture_id если его нет
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                 WHERE conname = 'presentations_lecture_id_key') THEN
    ALTER TABLE presentations ADD CONSTRAINT presentations_lecture_id_key UNIQUE (lecture_id);
  END IF;
END $$;

-- Создать индексы если их нет
CREATE INDEX IF NOT EXISTS idx_presentations_lecture_id ON presentations(lecture_id);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);

-- Включить RLS
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ЧАСТЬ 2: RLS ПОЛИТИКИ ДЛЯ PRESENTATIONS
-- ============================================================================

-- Удалить старые политики если есть
DROP POLICY IF EXISTS "Teachers can manage their presentations" ON presentations;
DROP POLICY IF EXISTS "Students can view presentations" ON presentations;

-- Политика для преподавателей (с WITH CHECK для INSERT)
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures l
      JOIN disciplines d ON l.discipline_id = d.id
      WHERE l.id = presentations.lecture_id
      AND d.teacher_id = auth.uid()
    )
  );

-- Политика для студентов (с учетом доступа по группам)
CREATE POLICY "Students can view presentations"
  ON presentations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      JOIN discipline_access da ON l.discipline_id = da.discipline_id
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE l.id = presentations.lecture_id
      AND l.status = 'published'
      AND (
        da.student_id = auth.uid()
        OR (da.group_id IS NOT NULL AND da.group_id = p.group_id)
      )
    )
  );

-- ============================================================================
-- ЧАСТЬ 3: STORAGE BUCKET
-- ============================================================================

-- Создать bucket если его нет
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentations', 'presentations', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ЧАСТЬ 4: STORAGE POLICIES
-- ============================================================================

-- Удалить старые политики если есть
DROP POLICY IF EXISTS "Teachers can upload presentations" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update presentations" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete presentations" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for presentations" ON storage.objects;

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
  )
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

-- ============================================================================
-- ЧАСТЬ 5: TRIGGERS (используем общую функцию если есть)
-- ============================================================================

-- Проверить есть ли общая функция update_updated_at_column
DO $$
BEGIN
  -- Если общей функции нет, создаем специфичную для presentations
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    -- Создать функцию для presentations
    CREATE OR REPLACE FUNCTION update_presentations_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Удалить старый триггер если есть
    DROP TRIGGER IF EXISTS presentations_updated_at ON presentations;
    
    -- Создать триггер
    CREATE TRIGGER presentations_updated_at
      BEFORE UPDATE ON presentations
      FOR EACH ROW
      EXECUTE FUNCTION update_presentations_updated_at();
  ELSE
    -- Использовать общую функцию
    DROP TRIGGER IF EXISTS presentations_updated_at ON presentations;
    DROP TRIGGER IF EXISTS update_presentations_updated_at ON presentations;
    
    CREATE TRIGGER update_presentations_updated_at
      BEFORE UPDATE ON presentations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- ЧАСТЬ 6: КОММЕНТАРИИ
-- ============================================================================

COMMENT ON TABLE presentations IS 'Stores presentation metadata and conversion status';
COMMENT ON COLUMN presentations.lecture_id IS 'Reference to the lecture (one-to-one relationship)';
COMMENT ON COLUMN presentations.file_path IS 'Path to source PPTX: <lectureId>/source.pptx';
COMMENT ON COLUMN presentations.status IS 'Conversion status: processing | ready | error';
COMMENT ON COLUMN presentations.slides_data IS 'JSON: {pageCount, slides: [{index, path, width, height}]}';
COMMENT ON COLUMN presentations.error_message IS 'Error description if status = error';

-- ============================================================================
-- ГОТОВО
-- ============================================================================

-- Формат путей в Storage:
-- Source: <lectureId>/source.pptx
-- Slides: <lectureId>/slides/001.png, 002.png, ...
-- Thumb (опционально): <lectureId>/thumb.png

-- Формат slides_data:
-- {
--   "pageCount": 20,
--   "slides": [
--     {"index": 1, "path": "<lectureId>/slides/001.png", "width": 1920, "height": 1080}
--   ]
-- }

-- Статусы:
-- processing - файл загружен, идет конвертация
-- ready - слайды готовы, slides_data заполнен
-- error - ошибка конвертации, см. error_message
