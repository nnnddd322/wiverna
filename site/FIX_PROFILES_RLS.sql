-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ RLS ДЛЯ ТАБЛИЦЫ PROFILES
-- Выполните этот скрипт в SQL Editor Supabase

-- ============================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИКИ ДЛЯ PROFILES
-- ============================================

-- Удаляем ВСЕ существующие политики для profiles
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
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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

-- Админы могут обновлять любые профили
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
-- ПРОВЕРКА
-- ============================================

-- Проверьте, что политики созданы
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
