-- ПОЛНОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ С RLS И ДАННЫМИ
-- Выполните этот скрипт в Supabase SQL Editor

-- =====================================================
-- 1. УДАЛЕНИЕ ВСЕХ СУЩЕСТВУЮЩИХ RLS ПОЛИТИК
-- =====================================================

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'disciplines', 'discipline_access', 'lectures', 'presentations', 'tests', 'student_progress', 'groups')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- 2. ВКЛЮЧЕНИЕ RLS НА ВСЕХ ТАБЛИЦАХ
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. ПРОСТЫЕ RLS ПОЛИТИКИ БЕЗ РЕКУРСИИ
-- =====================================================

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- DISCIPLINES
CREATE POLICY "disciplines_select" ON disciplines FOR SELECT TO authenticated USING (true);
CREATE POLICY "disciplines_insert" ON disciplines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "disciplines_update" ON disciplines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "disciplines_delete" ON disciplines FOR DELETE TO authenticated USING (true);

-- DISCIPLINE_ACCESS
CREATE POLICY "discipline_access_select" ON discipline_access FOR SELECT TO authenticated USING (true);
CREATE POLICY "discipline_access_insert" ON discipline_access FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "discipline_access_delete" ON discipline_access FOR DELETE TO authenticated USING (true);

-- LECTURES
CREATE POLICY "lectures_select" ON lectures FOR SELECT TO authenticated USING (true);
CREATE POLICY "lectures_insert" ON lectures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lectures_update" ON lectures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lectures_delete" ON lectures FOR DELETE TO authenticated USING (true);

-- PRESENTATIONS
CREATE POLICY "presentations_select" ON presentations FOR SELECT TO authenticated USING (true);
CREATE POLICY "presentations_insert" ON presentations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "presentations_update" ON presentations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "presentations_delete" ON presentations FOR DELETE TO authenticated USING (true);

-- TESTS
CREATE POLICY "tests_select" ON tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "tests_insert" ON tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tests_update" ON tests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tests_delete" ON tests FOR DELETE TO authenticated USING (true);

-- STUDENT_PROGRESS
CREATE POLICY "student_progress_select" ON student_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "student_progress_insert" ON student_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "student_progress_update" ON student_progress FOR UPDATE TO authenticated USING (true);

-- GROUPS
CREATE POLICY "groups_select" ON groups FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 4. ПРОВЕРКА И ИСПРАВЛЕНИЕ ДАННЫХ
-- =====================================================

-- Проверить, что все лекции имеют правильный тип
UPDATE lectures 
SET type = 'article' 
WHERE type NOT IN ('presentation', 'article', 'test');

-- Проверить, что все лекции имеют статус
UPDATE lectures 
SET status = 'published' 
WHERE status IS NULL;

-- Проверить, что content не NULL
UPDATE lectures 
SET content = '[]'::jsonb 
WHERE content IS NULL AND type = 'presentation';

UPDATE lectures 
SET content = '"Содержимое лекции"'::jsonb 
WHERE content IS NULL AND type = 'article';

-- =====================================================
-- 5. СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ (если нужно)
-- =====================================================

-- Раскомментируйте и замените YOUR_USER_ID на ваш реальный user ID

/*
-- Создать тестовую дисциплину
INSERT INTO disciplines (id, title, description, icon, teacher_id, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Тестовая дисциплина',
  'Это тестовая дисциплина для проверки',
  'code',
  'YOUR_USER_ID',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Создать тестовую лекцию
INSERT INTO lectures (id, discipline_id, title, type, content, status, order_index, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  d.id,
  'Тестовая лекция',
  'article',
  '"# Заголовок\n\nЭто содержимое тестовой лекции.\n\n## Подзаголовок\n\nТекст лекции."'::jsonb,
  'published',
  0,
  NOW(),
  NOW()
FROM disciplines d
WHERE d.teacher_id = 'YOUR_USER_ID'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Создать тестовую презентацию
INSERT INTO lectures (id, discipline_id, title, type, content, status, order_index, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  d.id,
  'Тестовая презентация',
  'presentation',
  '[
    {
      "id": "slide-1",
      "title": "Первый слайд",
      "content": "Содержимое первого слайда",
      "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      "id": "slide-2",
      "title": "Второй слайд",
      "content": "Содержимое второго слайда",
      "gradient": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    }
  ]'::jsonb,
  'published',
  1,
  NOW(),
  NOW()
FROM disciplines d
WHERE d.teacher_id = 'YOUR_USER_ID'
LIMIT 1
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- 6. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- =====================================================

-- Проверить политики
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'disciplines', 'discipline_access', 'lectures', 'presentations', 'tests', 'student_progress', 'groups')
ORDER BY tablename, policyname;

-- Проверить дисциплины
SELECT id, title, teacher_id, created_at 
FROM disciplines 
ORDER BY created_at DESC 
LIMIT 10;

-- Проверить лекции
SELECT id, title, type, discipline_id, status, created_at 
FROM lectures 
ORDER BY created_at DESC 
LIMIT 10;

-- Проверить текущего пользователя
SELECT auth.uid() as current_user_id;
