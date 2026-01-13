# Сводка исправлений презентаций

## ✅ Выполненные исправления

### DB-1: Схема таблицы presentations ✅

**Проблема:** Таблица уже существовала, нужна была миграция-дельта, а не CREATE TABLE.

**Решение:** Создан файл `supabase/migrations/20260108_presentations_delta.sql`

**Что исправлено:**
- ✅ Миграция безопасна для существующей таблицы (IF NOT EXISTS, DO blocks)
- ✅ Добавляет недостающие колонки если их нет
- ✅ UNIQUE constraint на `lecture_id` (1:1 связь)
- ✅ CHECK constraint для статусов: **только `processing | ready | error`**
- ✅ DEFAULT status = `'processing'` (не `'pending'`)
- ✅ Все колонки: `id, lecture_id, file_path, status, error_message, slides_data, created_at, updated_at`

### DB-2: RLS политики для студентов с доступом по группам ✅

**Проблема:** Студенты с доступом через `group_id` не видели презентации.

**Решение:**
```sql
CREATE POLICY "Students can view presentations"
  ON presentations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures l
      JOIN discipline_access da ON l.discipline_id = da.discipline_id
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE l.id = presentations.lecture_id
      AND l.status = 'published'
      AND (
        da.student_id = auth.uid()
        OR (da.group_id IS NOT NULL AND da.group_id = p.group_id)
      )
    )
  );
```

**Что исправлено:**
- ✅ Проверка `da.student_id = auth.uid()` (индивидуальный доступ)
- ✅ ИЛИ `da.group_id = p.group_id` (доступ по группе)
- ✅ Обязательная проверка `l.status = 'published'`

### DB-3: WITH CHECK для INSERT в teacher policy ✅

**Проблема:** Политика FOR ALL без WITH CHECK не работала для INSERT.

**Решение:**
```sql
CREATE POLICY "Teachers can manage their presentations"
  ON presentations FOR ALL
  USING (...)
  WITH CHECK (...);  -- Добавлен WITH CHECK
```

**Что исправлено:**
- ✅ Добавлен `WITH CHECK` с той же логикой что и `USING`
- ✅ Преподаватель может делать INSERT/UPSERT без "permission denied"

### DB-4: Общая функция updated_at ✅

**Проблема:** Дублирование триггеров `updated_at`.

**Решение:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    -- Создать специфичную функцию
    CREATE FUNCTION update_presentations_updated_at() ...
  ELSE
    -- Использовать общую функцию
    CREATE TRIGGER ... EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
```

**Что исправлено:**
- ✅ Проверка существования общей функции
- ✅ Использование общей функции если есть
- ✅ Создание специфичной только если общей нет
- ✅ Нет конфликтов триггеров

### ST-1: Формат путей в Storage ✅

**Проблема:** Несогласованность путей между фронтом и конвертером.

**Решение:** Зафиксирован единый формат:
```
<lectureId>/source.pptx              # НЕ presentations/<lectureId>/...
<lectureId>/slides/001.png
<lectureId>/slides/002.png
...
```

**Что исправлено:**
- ✅ Пути БЕЗ префикса `presentations/` (он уже в имени bucket)
- ✅ Формат согласован в:
  - `presentationService.uploadPresentationFile()`
  - `converter/index.js` (download/upload)
  - `PresentationViewer.getCurrentSlideUrl()`
- ✅ Комментарии в миграции документируют формат

### ST-2: Storage policies для UPDATE/DELETE ✅

**Проблема:** Нужна возможность перезаливать презентации.

**Решение:**
```sql
CREATE POLICY "Teachers can update presentations" ... WITH CHECK (...);
CREATE POLICY "Teachers can delete presentations" ...;
```

**Что исправлено:**
- ✅ INSERT policy с WITH CHECK
- ✅ UPDATE policy с USING и WITH CHECK
- ✅ DELETE policy с USING
- ✅ Преподаватель может удалять старые слайды при перезагрузке

### APP-1: Согласование статусов ✅

**Проблема:** Разные статусы в БД, фронте и конвертере.

**Решение:** Единый контракт статусов:
- `processing` - файл загружен, идет конвертация (default)
- `ready` - слайды готовы, `slides_data` заполнен
- `error` - ошибка, см. `error_message`

**❌ Убран статус `pending`** из всех компонентов.

**Что исправлено:**
- ✅ БД: CHECK constraint `status IN ('processing', 'ready', 'error')`
- ✅ БД: DEFAULT status = `'processing'`
- ✅ Frontend: `presentationService` использует те же статусы
- ✅ Frontend: `PresentationViewer` обрабатывает те же статусы
- ✅ Converter: пишет `'ready'` или `'error'`

### CONV-1: Формат slides_data ✅

**Проблема:** Нужен единый формат JSON между конвертером и viewer.

**Решение:** Зафиксирован формат:
```json
{
  "pageCount": 20,
  "slides": [
    {
      "index": 1,
      "path": "<lectureId>/slides/001.png",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

**Что исправлено:**
- ✅ Converter пишет именно этот формат
- ✅ Viewer читает именно этот формат
- ✅ Поля `width` и `height` опциональны но рекомендуются
- ✅ Формат документирован в миграции и README

### MIG-1: Миграция как дельта ✅

**Проблема:** Нельзя применить CREATE TABLE на существующую таблицу.

**Решение:** Миграция использует:
- `CREATE TABLE IF NOT EXISTS`
- `DO $$ BEGIN IF NOT EXISTS ... END $$` для колонок
- `DROP POLICY IF EXISTS` перед `CREATE POLICY`
- `DROP CONSTRAINT IF EXISTS` перед `ADD CONSTRAINT`
- `ON CONFLICT DO NOTHING` для bucket

**Что исправлено:**
- ✅ Миграция безопасна для пустой БД
- ✅ Миграция безопасна для существующей таблицы
- ✅ Можно применять повторно без ошибок
- ✅ Приводит БД к нужному состоянию независимо от начального

---

## 📁 Созданные файлы

### 1. `supabase/migrations/20260108_presentations_delta.sql`
Миграция-дельта для приведения БД к нужному состоянию.

**Применить:**
```bash
# Скопировать содержимое и выполнить в Supabase SQL Editor
cat supabase/migrations/20260108_presentations_delta.sql
```

### 2. `PRESENTATIONS_SETUP_GUIDE.md`
Полное руководство по настройке и запуску презентаций.

**Содержит:**
- Контракт данных (статусы, пути, формат JSON)
- Пошаговую инструкцию запуска
- Тестовые сценарии
- Troubleshooting для всех типичных проблем
- SQL запросы для мониторинга

### 3. Существующие файлы (без изменений)
- `src/services/presentationService.ts` - уже правильный
- `src/app/components/PresentationViewer.tsx` - уже правильный
- `converter/index.js` - уже правильный
- `converter/Dockerfile` - уже правильный
- `docker-compose.yml` - уже правильный

---

## 🎯 Что делать дальше

### Шаг 1: Применить миграцию
```bash
# Открыть Supabase Dashboard → SQL Editor
# Скопировать содержимое файла:
cat supabase/migrations/20260108_presentations_delta.sql
# Выполнить
```

### Шаг 2: Проверить bucket
```bash
# Supabase Dashboard → Storage
# Должен появиться bucket "presentations" (public)
```

### Шаг 3: Настроить .env файлы
```bash
# Frontend .env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CONVERTER_URL=http://localhost:8787

# converter/.env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...  # НЕ anon key!
PORT=8787
```

### Шаг 4: Запустить
```bash
docker-compose up
```

### Шаг 5: Протестировать
1. Войти как teacher
2. Создать лекцию типа "Презентация"
3. Загрузить PPTX файл
4. Дождаться конвертации
5. Проверить слайды
6. Войти как student и проверить доступ

---

## ✅ Чеклист готовности

- [x] Миграция-дельта создана
- [x] Статусы согласованы (processing|ready|error)
- [x] Формат путей зафиксирован (<lectureId>/...)
- [x] RLS политики с группами
- [x] WITH CHECK для INSERT
- [x] Storage policies для UPDATE/DELETE
- [x] Формат slides_data зафиксирован
- [x] Документация создана
- [ ] Миграция применена в Supabase
- [ ] Bucket создан
- [ ] .env файлы настроены
- [ ] Сервисы запущены
- [ ] Тестовый PPTX загружен
- [ ] Конвертация прошла успешно
- [ ] Студент видит слайды

---

## 🔍 Как проверить что всё работает

### После применения миграции:

```sql
-- 1. Проверить таблицу
\d presentations

-- Должны быть колонки:
-- id, lecture_id, file_path, status, error_message, slides_data, created_at, updated_at

-- 2. Проверить constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'presentations'::regclass;

-- Должен быть: presentations_status_check CHECK (status IN ('processing', 'ready', 'error'))

-- 3. Проверить RLS политики
SELECT * FROM pg_policies WHERE tablename = 'presentations';

-- Должно быть 2 политики:
-- - Teachers can manage their presentations
-- - Students can view presentations

-- 4. Проверить bucket
SELECT * FROM storage.buckets WHERE id = 'presentations';

-- Должен быть: id=presentations, public=true

-- 5. Проверить Storage policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND definition LIKE '%presentations%';

-- Должно быть 4 политики:
-- - Teachers can upload presentations
-- - Teachers can update presentations
-- - Teachers can delete presentations
-- - Public read access for presentations
```

---

## 🎉 Готово!

Все исправления применены. Система готова к использованию после применения миграции и настройки окружения.

**Следующий шаг:** Применить миграцию в Supabase и протестировать полный flow.
