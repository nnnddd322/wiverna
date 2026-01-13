# Инструкция по настройке базы данных в Supabase

## Шаг 1: Создание проекта в Supabase

1. Зайдите на https://supabase.com
2. Создайте новый проект
3. Сохраните URL проекта и anon key - они понадобятся для `.env` файла

## Шаг 2: Выполнение SQL запросов

Перейдите в раздел **SQL Editor** в панели Supabase и выполните следующие запросы **по порядку**:

### 2.1. Создание таблицы групп

```sql
-- Таблица групп
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по имени
CREATE INDEX idx_groups_name ON groups(name);
```

### 2.2. Создание таблицы профилей пользователей

```sql
-- Таблица профилей пользователей
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_group_id ON profiles(group_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_name ON profiles(first_name, last_name);

-- Ограничение уникальности: в одной группе не может быть двух студентов с одинаковыми ФИО
CREATE UNIQUE INDEX idx_unique_student_in_group 
ON profiles(first_name, last_name, group_id) 
WHERE role = 'student' AND group_id IS NOT NULL;
```

### 2.3. Создание таблицы дисциплин

```sql
-- Таблица дисциплин
CREATE TABLE disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_disciplines_teacher_id ON disciplines(teacher_id);
CREATE INDEX idx_disciplines_title ON disciplines(title);
```

### 2.4. Создание таблицы доступов к дисциплинам

```sql
-- Таблица доступов к дисциплинам
CREATE TABLE discipline_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Проверка: должен быть указан либо student_id, либо group_id
  CHECK (
    (student_id IS NOT NULL AND group_id IS NULL) OR
    (student_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Индексы для оптимизации
CREATE INDEX idx_discipline_access_discipline_id ON discipline_access(discipline_id);
CREATE INDEX idx_discipline_access_student_id ON discipline_access(student_id);
CREATE INDEX idx_discipline_access_group_id ON discipline_access(group_id);

-- Уникальность: один студент не может иметь дублирующийся доступ к дисциплине
CREATE UNIQUE INDEX idx_unique_student_discipline_access 
ON discipline_access(discipline_id, student_id) 
WHERE student_id IS NOT NULL;

-- Уникальность: одна группа не может иметь дублирующийся доступ к дисциплине
CREATE UNIQUE INDEX idx_unique_group_discipline_access 
ON discipline_access(discipline_id, group_id) 
WHERE group_id IS NOT NULL;
```

### 2.5. Создание таблицы лекций

```sql
-- Таблица лекций
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]'::jsonb,
  type TEXT NOT NULL CHECK (type IN ('article', 'presentation', 'test')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_lectures_discipline_id ON lectures(discipline_id);
CREATE INDEX idx_lectures_type ON lectures(type);
CREATE INDEX idx_lectures_status ON lectures(status);
CREATE INDEX idx_lectures_order ON lectures(discipline_id, order_index);
```

### 2.6. Создание таблицы презентаций

```sql
-- Таблица презентаций
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  slides_data JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_presentations_lecture_id ON presentations(lecture_id);
CREATE INDEX idx_presentations_status ON presentations(status);
```

### 2.7. Создание таблицы тестов

```sql
-- Таблица тестов
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс
CREATE INDEX idx_tests_lecture_id ON tests(lecture_id);
```

### 2.8. Создание таблицы прогресса студентов

```sql
-- Таблица прогресса студентов
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Уникальность: один студент - одна запись прогресса на лекцию
  UNIQUE(student_id, lecture_id)
);

-- Индексы
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_lecture_id ON student_progress(lecture_id);
CREATE INDEX idx_student_progress_completed ON student_progress(completed);
```

### 2.9. Создание таблицы системных настроек

```sql
-- Таблица системных настроек
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Вставка секретного ключа для регистрации преподавателей
-- ВАЖНО: Измените значение на свой секретный ключ!
INSERT INTO system_settings (key, value) 
VALUES ('teacher_secret', 'CHANGE_THIS_SECRET_KEY_123');
```

### 2.10. Создание функций для автоматического обновления updated_at

```sql
-- Функция для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применение триггеров ко всем таблицам
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplines_updated_at BEFORE UPDATE ON disciplines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON presentations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Шаг 3: Настройка Row Level Security (RLS)

### 3.1. Включение RLS для всех таблиц

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
```

### 3.2. Политики для таблицы profiles

```sql
-- Пользователи могут читать свой профиль
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Преподаватели и админы могут читать профили студентов
CREATE POLICY "Teachers and admins can read student profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );
```

### 3.3. Политики для таблицы groups

```sql
-- Все авторизованные пользователи могут читать группы
CREATE POLICY "Authenticated users can read groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- Только админы могут создавать, обновлять и удалять группы
CREATE POLICY "Only admins can manage groups" ON groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3.4. Политики для таблицы disciplines

```sql
-- Преподаватели могут читать свои дисциплины
CREATE POLICY "Teachers can read own disciplines" ON disciplines
  FOR SELECT USING (teacher_id = auth.uid());

-- Студенты могут читать дисциплины, к которым у них есть доступ
CREATE POLICY "Students can read accessible disciplines" ON disciplines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM discipline_access da
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE da.discipline_id = disciplines.id
      AND (da.student_id = auth.uid() OR da.group_id = p.group_id)
    )
  );

-- Преподаватели могут создавать дисциплины
CREATE POLICY "Teachers can create disciplines" ON disciplines
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Преподаватели могут обновлять свои дисциплины
CREATE POLICY "Teachers can update own disciplines" ON disciplines
  FOR UPDATE USING (teacher_id = auth.uid());

-- Преподаватели могут удалять свои дисциплины
CREATE POLICY "Teachers can delete own disciplines" ON disciplines
  FOR DELETE USING (teacher_id = auth.uid());
```

### 3.5. Политики для таблицы discipline_access

```sql
-- Преподаватели могут управлять доступом к своим дисциплинам
CREATE POLICY "Teachers can manage access to own disciplines" ON discipline_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM disciplines d
      WHERE d.id = discipline_access.discipline_id
      AND d.teacher_id = auth.uid()
    )
  );

-- Студенты могут читать свои доступы
CREATE POLICY "Students can read own access" ON discipline_access
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.group_id = discipline_access.group_id
    )
  );
```

### 3.6. Политики для таблицы lectures

```sql
-- Преподаватели могут управлять лекциями своих дисциплин
CREATE POLICY "Teachers can manage lectures in own disciplines" ON lectures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM disciplines d
      WHERE d.id = lectures.discipline_id AND d.teacher_id = auth.uid()
    )
  );

-- Студенты могут читать опубликованные лекции доступных дисциплин
CREATE POLICY "Students can read published lectures" ON lectures
  FOR SELECT USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM discipline_access da
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE da.discipline_id = lectures.discipline_id
      AND (da.student_id = auth.uid() OR da.group_id = p.group_id)
    )
  );
```

### 3.7. Политики для остальных таблиц

```sql
-- Presentations: доступ через lectures
CREATE POLICY "Users can access presentations through lectures" ON presentations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lectures l
      LEFT JOIN disciplines d ON d.id = l.discipline_id
      LEFT JOIN discipline_access da ON da.discipline_id = d.id
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE l.id = presentations.lecture_id
      AND (d.teacher_id = auth.uid() OR da.student_id = auth.uid() OR da.group_id = p.group_id)
    )
  );

-- Tests: доступ через lectures
CREATE POLICY "Users can access tests through lectures" ON tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lectures l
      LEFT JOIN disciplines d ON d.id = l.discipline_id
      LEFT JOIN discipline_access da ON da.discipline_id = d.id
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE l.id = tests.lecture_id
      AND (d.teacher_id = auth.uid() OR da.student_id = auth.uid() OR da.group_id = p.group_id)
    )
  );

-- Student progress: студенты управляют своим прогрессом
CREATE POLICY "Students can manage own progress" ON student_progress
  FOR ALL USING (student_id = auth.uid());

-- Преподаватели могут читать прогресс студентов своих дисциплин
CREATE POLICY "Teachers can read student progress" ON student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lectures l
      JOIN disciplines d ON d.id = l.discipline_id
      WHERE l.id = student_progress.lecture_id AND d.teacher_id = auth.uid()
    )
  );

-- System settings: только чтение для всех авторизованных
CREATE POLICY "Authenticated users can read settings" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Шаг 4: Создание первого админа

После выполнения всех SQL запросов, создайте первого администратора:

1. Зарегистрируйтесь через интерфейс приложения как студент
2. Найдите свой ID в таблице `auth.users` в Supabase
3. Выполните SQL запрос для изменения роли на admin:

```sql
-- Замените 'your-user-id' на реальный ID пользователя
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id';
```

## Шаг 5: Создание тестовых групп

Создайте несколько групп для тестирования:

```sql
INSERT INTO groups (name) VALUES 
  ('ПИ-21'),
  ('ПИ-22'),
  ('ПИ-23'),
  ('ИС-21'),
  ('ИС-22');
```

## Шаг 6: Настройка Storage (для презентаций)

1. Перейдите в раздел **Storage** в Supabase
2. Создайте новый bucket с именем `presentations`
3. Настройте политики доступа:

```sql
-- Преподаватели могут загружать файлы
CREATE POLICY "Teachers can upload presentations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'presentations' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

-- Авторизованные пользователи могут читать файлы
CREATE POLICY "Authenticated users can read presentations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'presentations' AND
  auth.role() = 'authenticated'
);
```

## Шаг 7: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Замените значения на реальные из настроек вашего проекта Supabase.

## Готово!

База данных настроена и готова к использованию. Теперь можно запустить приложение:

```bash
npm install
npm run dev
```

## Важные замечания

1. **Секретный ключ преподавателя**: Обязательно измените значение в таблице `system_settings` на безопасный ключ
2. **Первый админ**: Создайте первого администратора вручную через SQL после регистрации
3. **Backup**: Регулярно делайте резервные копии базы данных
4. **Security**: Проверьте все RLS политики перед запуском в продакшн

## Troubleshooting

Если возникают проблемы с доступом:
1. Проверьте, что RLS включен для всех таблиц
2. Убедитесь, что политики созданы корректно
3. Проверьте роль пользователя в таблице `profiles`
4. Проверьте логи в разделе **Logs** в Supabase
