-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ RLS ДЛЯ PROFILES
-- Удаляем ВСЕ политики и создаем заново с нуля

-- ============================================
-- 1. УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ПОЛИТИКИ
-- ============================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers and admins can read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- ============================================
-- 2. СОЗДАЕМ НОВЫЕ ПОЛИТИКИ С НУЛЯ
-- ============================================

-- ПОЛИТИКА INSERT: Любой аутентифицированный пользователь может создать профиль
-- Это критически важно для регистрации
CREATE POLICY "Allow profile creation during signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ПОЛИТИКА SELECT: Пользователи могут читать свой профиль
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ПОЛИТИКА SELECT: Преподаватели и админы могут читать профили студентов
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

-- ПОЛИТИКА UPDATE: Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ПОЛИТИКА UPDATE: Админы могут обновлять любые профили
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- 3. ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

-- Должно показать только 5 политик
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Ожидаемый результат:
-- 1. Allow profile creation during signup | INSERT | {authenticated} | NULL | true
-- 2. Admins can update any profile | UPDATE | {authenticated} | EXISTS(...) | EXISTS(...)
-- 3. Teachers and admins can read student profiles | SELECT | {authenticated} | EXISTS(...) | NULL
-- 4. Users can read own profile | SELECT | {authenticated} | (auth.uid() = id) | NULL
-- 5. Users can update own profile | UPDATE | {authenticated} | (auth.uid() = id) | (auth.uid() = id)
