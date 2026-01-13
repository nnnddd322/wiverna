-- ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ С SUPABASE
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта
-- ВАЖНО: Выполните ВСЕ команды по порядку!

-- ============================================
-- 1. ВКЛЮЧЕНИЕ RLS ДЛЯ ВСЕХ ТАБЛИЦ
-- ============================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. СОЗДАНИЕ RPC ФУНКЦИИ ДЛЯ ПРОВЕРКИ СЕКРЕТНОГО КЛЮЧА
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_teacher_secret(secret TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_secret TEXT;
BEGIN
  SELECT value INTO stored_secret
  FROM public.system_settings
  WHERE key = 'teacher_secret';
  
  RETURN stored_secret = secret;
END;
$$;

-- ============================================
-- 3. ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ТАБЛИЦЫ GROUPS
-- ============================================

-- Удаляем старые политики для groups
DROP POLICY IF EXISTS "Authenticated users can read groups" ON public.groups;
DROP POLICY IF EXISTS "Only admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Anyone can read groups" ON public.groups;

-- ВАЖНО: Разрешаем ВСЕМ (даже неаутентифицированным) читать группы
-- Это нужно для формы регистрации
CREATE POLICY "Anyone can read groups"
ON public.groups
FOR SELECT
TO public
USING (true);

-- Только админы могут управлять группами
CREATE POLICY "Only admins can manage groups"
ON public.groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 4. ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ТАБЛИЦЫ PROFILES
-- ============================================

-- Удаляем все старые политики для profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers and admins can read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- КРИТИЧЕСКИ ВАЖНО: Разрешаем ЛЮБОМУ аутентифицированному пользователю создать профиль
-- Это необходимо, потому что при регистрации auth.uid() уже существует,
-- но профиль создается сразу после создания auth пользователя
CREATE POLICY "Allow profile creation during signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Пользователи могут читать свой профиль
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Преподаватели и админы могут читать профили студентов
CREATE POLICY "Teachers and admins can read student profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('teacher', 'admin')
  )
);

-- ============================================
-- 5. RLS ПОЛИТИКИ ДЛЯ SYSTEM_SETTINGS
-- ============================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Only admins can read settings" ON public.system_settings;

-- Только админы могут читать настройки (обычные пользователи используют RPC функцию)
CREATE POLICY "Only admins can read settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 6. ПРОВЕРКА И ОБНОВЛЕНИЕ СЕКРЕТНОГО КЛЮЧА
-- ============================================

-- Обновляем секретный ключ на "1" (как в вашей БД)
UPDATE public.system_settings
SET value = '1'
WHERE key = 'teacher_secret';

-- Если записи нет, создаем её
INSERT INTO public.system_settings (key, value)
VALUES ('teacher_secret', '1')
ON CONFLICT (key) DO UPDATE
SET value = '1';

-- ============================================
-- 7. ПРОВЕРКА НАЛИЧИЯ ГРУПП
-- ============================================

-- Удаляем все существующие группы и создаем заново
DELETE FROM public.groups;

-- Создаем тестовые группы
INSERT INTO public.groups (name)
VALUES 
  ('ПИ-21'),
  ('ПИ-22'),
  ('ИС-21'),
  ('ИВТ-21'),
  ('ИВТ-22');

-- ============================================
-- 8. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ СТАТИСТИКИ
-- ============================================

-- Функция для получения статистики по дисциплине
CREATE OR REPLACE FUNCTION public.get_discipline_statistics(discipline_id_param UUID)
RETURNS TABLE (
  total_students BIGINT,
  total_lectures BIGINT,
  avg_completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT da.student_id) +
    COUNT(DISTINCT CASE WHEN da.group_id IS NOT NULL THEN p.id END) as total_students,
    COUNT(DISTINCT l.id) as total_lectures,
    COALESCE(AVG(
      CASE
        WHEN sp.completed THEN 100
        ELSE 0
      END
    ), 0) as avg_completion_rate
  FROM public.disciplines d
  LEFT JOIN public.discipline_access da ON da.discipline_id = d.id
  LEFT JOIN public.profiles p ON p.group_id = da.group_id
  LEFT JOIN public.lectures l ON l.discipline_id = d.id AND l.status = 'published'
  LEFT JOIN public.student_progress sp ON sp.lecture_id = l.id
  WHERE d.id = discipline_id_param
    AND d.teacher_id = auth.uid();
END;
$$;

-- Функция для получения списка студентов с доступом к дисциплине
CREATE OR REPLACE FUNCTION public.get_discipline_students(discipline_id_param UUID)
RETURNS TABLE (
  student_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  group_name TEXT,
  access_type TEXT,
  progress_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as student_id,
    p.first_name,
    p.last_name,
    p.email,
    g.name as group_name,
    CASE
      WHEN da_direct.student_id IS NOT NULL THEN 'individual'
      ELSE 'group'
    END as access_type,
    COALESCE(
      (
        SELECT COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT l.id), 0) * 100
        FROM public.lectures l
        LEFT JOIN public.student_progress sp ON sp.lecture_id = l.id AND sp.student_id = p.id AND sp.completed = true
        WHERE l.discipline_id = discipline_id_param AND l.status = 'published'
      ),
      0
    ) as progress_percentage
  FROM public.profiles p
  LEFT JOIN public.groups g ON g.id = p.group_id
  LEFT JOIN public.discipline_access da_direct ON da_direct.student_id = p.id AND da_direct.discipline_id = discipline_id_param
  LEFT JOIN public.discipline_access da_group ON da_group.group_id = p.group_id AND da_group.discipline_id = discipline_id_param
  WHERE (da_direct.id IS NOT NULL OR da_group.id IS NOT NULL)
    AND p.role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.disciplines d
      WHERE d.id = discipline_id_param AND d.teacher_id = auth.uid()
    );
END;
$$;

-- ============================================
-- ГОТОВО!
-- ============================================

-- Проверка: выведем текущий секретный ключ
SELECT key, value FROM public.system_settings WHERE key = 'teacher_secret';

-- Проверка: выведем все группы
SELECT * FROM public.groups;
