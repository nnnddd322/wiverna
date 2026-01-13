-- ФИНАЛЬНЫЙ FIX: удаляем ВСЕ политики (по pg_policies) и создаем простые политики без рекурсии
-- ВАЖНО: выполнять целиком в Supabase SQL Editor

-- ============================================
-- 0) УДАЛЕНИЕ ВСЕХ RLS ПОЛИТИК ДЛЯ УКАЗАННЫХ ТАБЛИЦ
-- ============================================
DO $$
DECLARE
  r record;
  t text;
  tables text[] := ARRAY[
    'profiles',
    'disciplines',
    'discipline_access',
    'lectures',
    'presentations',
    'tests',
    'student_progress',
    'groups'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 1) PROFILES (без рекурсии)
-- ============================================
-- INSERT: разрешаем создание профиля (для регистрации). Это менее безопасно, но убирает блокировки.
CREATE POLICY profiles_insert_policy
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

-- SELECT: разрешаем чтение профилей всем аутентифицированным
CREATE POLICY profiles_select_policy
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- UPDATE: только владелец может менять свой профиль
CREATE POLICY profiles_update_policy
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2) GROUPS (публичное чтение для регистрации)
-- ============================================
CREATE POLICY groups_select_policy
ON public.groups
FOR SELECT
TO public
USING (true);

-- ============================================
-- 3) DISCIPLINES
-- ============================================
-- SELECT: все аутентифицированные видят дисциплины
CREATE POLICY disciplines_select_policy
ON public.disciplines
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: временно разрешаем всем аутентифицированным (без рекурсии)
CREATE POLICY disciplines_insert_policy
ON public.disciplines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY disciplines_update_policy
ON public.disciplines
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY disciplines_delete_policy
ON public.disciplines
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 4) DISCIPLINE_ACCESS
-- ============================================
CREATE POLICY discipline_access_select_policy
ON public.discipline_access
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY discipline_access_insert_policy
ON public.discipline_access
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY discipline_access_update_policy
ON public.discipline_access
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY discipline_access_delete_policy
ON public.discipline_access
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 5) LECTURES
-- ============================================
CREATE POLICY lectures_select_policy
ON public.lectures
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY lectures_insert_policy
ON public.lectures
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY lectures_update_policy
ON public.lectures
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY lectures_delete_policy
ON public.lectures
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 6) PRESENTATIONS
-- ============================================
CREATE POLICY presentations_select_policy
ON public.presentations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY presentations_insert_policy
ON public.presentations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY presentations_update_policy
ON public.presentations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY presentations_delete_policy
ON public.presentations
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 7) TESTS
-- ============================================
CREATE POLICY tests_select_policy
ON public.tests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY tests_insert_policy
ON public.tests
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY tests_update_policy
ON public.tests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY tests_delete_policy
ON public.tests
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 8) STUDENT_PROGRESS
-- ============================================
CREATE POLICY student_progress_select_policy
ON public.student_progress
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY student_progress_insert_policy
ON public.student_progress
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY student_progress_update_policy
ON public.student_progress
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY student_progress_delete_policy
ON public.student_progress
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 9) ПРОВЕРКА (опционально)
-- ============================================
-- Должно показать, что больше нет старых policies (Teachers can ..., Students can ...)
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles','disciplines','discipline_access','lectures','presentations','tests','student_progress','groups')
ORDER BY tablename, policyname;
