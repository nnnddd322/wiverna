-- ПРОСТОЕ ИСПРАВЛЕНИЕ БЕЗ РЕКУРСИИ
-- Убираем политики с подзапросами, оставляем только базовые

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
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for teachers and admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- НОВЫЕ ПРОСТЫЕ ПОЛИТИКИ БЕЗ ПОДЗАПРОСОВ

-- 1. INSERT: Любой может создать профиль (для регистрации)
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (true);

-- 2. SELECT: Все аутентифицированные пользователи могут читать ВСЕ профили
-- Это упрощённый подход, но он работает без рекурсии
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. UPDATE: Пользователи могут обновлять только свой профиль
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. DELETE: Никто не может удалять профили (безопасность)
-- Не создаём политику DELETE, значит никто не может удалять

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
