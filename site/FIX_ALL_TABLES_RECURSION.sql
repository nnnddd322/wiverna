-- ИСПРАВЛЕНИЕ РЕКУРСИИ ВО ВСЕХ ТАБЛИЦАХ
-- Убираем все политики с подзапросами к profiles

-- ============================================
-- 1. ИСПРАВЛЕНИЕ PROFILES
-- ============================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers and admins can read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation by anyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for teachers and admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Простые политики для profiles
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. ИСПРАВЛЕНИЕ DISCIPLINES
-- ============================================

DROP POLICY IF EXISTS "Teachers can manage their disciplines" ON public.disciplines;
DROP POLICY IF EXISTS "Students can read disciplines" ON public.disciplines;
DROP POLICY IF EXISTS "Admins can manage all disciplines" ON public.disciplines;

-- Простые политики для disciplines
CREATE POLICY "disciplines_select_policy"
ON public.disciplines
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "disciplines_insert_policy"
ON public.disciplines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "disciplines_update_policy"
ON public.disciplines
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "disciplines_delete_policy"
ON public.disciplines
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 3. ИСПРАВЛЕНИЕ GROUPS
-- ============================================

DROP POLICY IF EXISTS "Anyone can read groups" ON public.groups;
DROP POLICY IF EXISTS "Only admins can manage groups" ON public.groups;

-- Простые политики для groups
CREATE POLICY "groups_select_policy"
ON public.groups
FOR SELECT
TO public
USING (true);

CREATE POLICY "groups_insert_policy"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "groups_update_policy"
ON public.groups
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "groups_delete_policy"
ON public.groups
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 4. ИСПРАВЛЕНИЕ ОСТАЛЬНЫХ ТАБЛИЦ
-- ============================================

-- discipline_access
DROP POLICY IF EXISTS "Users can read discipline access" ON public.discipline_access;
DROP POLICY IF EXISTS "Teachers can manage discipline access" ON public.discipline_access;
DROP POLICY IF EXISTS "Admins can manage all discipline access" ON public.discipline_access;

CREATE POLICY "discipline_access_select_policy"
ON public.discipline_access
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "discipline_access_insert_policy"
ON public.discipline_access
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "discipline_access_update_policy"
ON public.discipline_access
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "discipline_access_delete_policy"
ON public.discipline_access
FOR DELETE
TO authenticated
USING (true);

-- lectures
DROP POLICY IF EXISTS "Teachers can manage their lectures" ON public.lectures;
DROP POLICY IF EXISTS "Students can read lectures" ON public.lectures;
DROP POLICY IF EXISTS "Admins can manage all lectures" ON public.lectures;

CREATE POLICY "lectures_select_policy"
ON public.lectures
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "lectures_insert_policy"
ON public.lectures
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "lectures_update_policy"
ON public.lectures
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "lectures_delete_policy"
ON public.lectures
FOR DELETE
TO authenticated
USING (true);

-- presentations
DROP POLICY IF EXISTS "Teachers can manage their presentations" ON public.presentations;
DROP POLICY IF EXISTS "Students can read presentations" ON public.presentations;
DROP POLICY IF EXISTS "Admins can manage all presentations" ON public.presentations;

CREATE POLICY "presentations_select_policy"
ON public.presentations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "presentations_insert_policy"
ON public.presentations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "presentations_update_policy"
ON public.presentations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "presentations_delete_policy"
ON public.presentations
FOR DELETE
TO authenticated
USING (true);

-- tests
DROP POLICY IF EXISTS "Teachers can manage their tests" ON public.tests;
DROP POLICY IF EXISTS "Students can read tests" ON public.tests;
DROP POLICY IF EXISTS "Admins can manage all tests" ON public.tests;

CREATE POLICY "tests_select_policy"
ON public.tests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "tests_insert_policy"
ON public.tests
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "tests_update_policy"
ON public.tests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "tests_delete_policy"
ON public.tests
FOR DELETE
TO authenticated
USING (true);

-- student_progress
DROP POLICY IF EXISTS "Students can read own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Teachers can read student progress" ON public.student_progress;
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.student_progress;

CREATE POLICY "student_progress_select_policy"
ON public.student_progress
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "student_progress_insert_policy"
ON public.student_progress
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "student_progress_update_policy"
ON public.student_progress
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "student_progress_delete_policy"
ON public.student_progress
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 5. ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

-- Проверяем policies для profiles
SELECT 
  'profiles' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
UNION ALL
-- Проверяем policies для disciplines
SELECT 
  'disciplines' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'disciplines'
UNION ALL
-- Проверяем policies для groups
SELECT 
  'groups' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'groups'
ORDER BY table_name, policyname;
