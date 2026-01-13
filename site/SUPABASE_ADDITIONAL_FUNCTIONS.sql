-- Дополнительные SQL функции для Supabase
-- Выполните эти запросы после основной настройки БД

-- Функция для проверки секретного ключа преподавателя
-- Эта функция нужна, т.к. обычные пользователи не могут читать system_settings
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

-- Функция для получения статистики по дисциплине (для преподавателей)
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

-- Функция для автоматического создания записи прогресса при первом доступе
CREATE OR REPLACE FUNCTION public.ensure_student_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.student_progress (student_id, lecture_id, completed, last_accessed)
  VALUES (auth.uid(), NEW.id, false, NOW())
  ON CONFLICT (student_id, lecture_id) DO UPDATE
  SET last_accessed = NOW();
  
  RETURN NEW;
END;
$$;

-- Триггер для автоматического создания прогресса (опционально, можно не использовать)
-- DROP TRIGGER IF EXISTS auto_create_progress ON public.lectures;
-- CREATE TRIGGER auto_create_progress
-- AFTER INSERT ON public.lectures
-- FOR EACH ROW
-- EXECUTE FUNCTION public.ensure_student_progress();
