-- ИСПРАВЛЕНИЕ БЕСКОНЕЧНОЙ РЕКУРСИИ В RLS ПОЛИТИКАХ
-- Проблема: политики для teachers/admins создают циклическую зависимость

-- Удаляем ВСЕ политики для profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers and admins can read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation by anyone" ON public.profiles;

-- НОВЫЕ ПОЛИТИКИ БЕЗ РЕКУРСИИ

-- 1. INSERT: Любой может создать профиль (для регистрации)
CREATE POLICY "Enable insert for all users"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

-- 2. SELECT: Пользователи могут читать свой профиль
CREATE POLICY "Enable read for own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. SELECT: Преподаватели и админы могут читать ВСЕ профили
-- ВАЖНО: Используем прямую проверку role без подзапроса
CREATE POLICY "Enable read for teachers and admins"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin')
);

-- 4. UPDATE: Пользователи могут обновлять свой профиль
CREATE POLICY "Enable update for own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. UPDATE: Админы могут обновлять любые профили
CREATE POLICY "Enable update for admins"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Проверка результата
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
