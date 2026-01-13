# 📚 Полная спецификация проекта - Образовательная платформа

## 🎯 Общее описание

**Название:** Educational Platform Design  
**Назначение:** Платформа для профессиональной переподготовки "Педагогика и психология" (530 часов)  
**Технологический стек:** React + TypeScript + Vite + Supabase + Node.js

---

## 🏗️ Архитектура системы

### Frontend (React + TypeScript)
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 6.3.5
- **Styling:** TailwindCSS + shadcn/ui компоненты
- **State management:** React Context API (AuthContext)
- **Routing:** Custom page-based routing через useState
- **Icons:** Lucide React

### Backend (Supabase)
- **Database:** PostgreSQL через Supabase
- **Authentication:** Supabase Auth (JWT tokens)
- **Storage:** Supabase Storage (bucket: presentations)
- **RLS:** Row Level Security для всех таблиц
- **Edge Functions:** Deno runtime для serverless функций

### Converter Service (Node.js)
- **Runtime:** Node.js 24.11.1
- **Framework:** Express.js
- **Conversion:** LibreOffice (PPTX → PDF → PNG)
- **Image processing:** ImageMagick/GraphicsMagick
- **Port:** 8787

---

## 📊 Структура базы данных

### Таблицы

#### 1. `profiles`
```sql
- id: UUID (PK, FK → auth.users)
- email: TEXT
- role: TEXT (student | teacher | admin)
- first_name: TEXT
- last_name: TEXT
- group_id: UUID (FK → groups)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS политики:**
- `profiles_insert`: authenticated пользователи могут создавать свой профиль
- `profiles_select`: authenticated пользователи видят свой профиль
- `profiles_update`: authenticated пользователи обновляют свой профиль

#### 2. `groups`
```sql
- id: UUID (PK)
- name: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS политики:**
- `groups_select`: все authenticated пользователи видят группы

#### 3. `disciplines`
```sql
- id: UUID (PK)
- title: TEXT
- description: TEXT
- icon: TEXT
- teacher_id: UUID (FK → profiles)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS политики:**
- `disciplines_delete`: teacher может удалять свои дисциплины
- `disciplines_insert`: teacher может создавать дисциплины
- `disciplines_select`: все authenticated видят дисциплины
- `disciplines_update`: teacher может обновлять свои дисциплины

#### 4. `discipline_access`
```sql
- id: UUID (PK)
- discipline_id: UUID (FK → disciplines)
- student_id: UUID (FK → profiles, nullable)
- group_id: UUID (FK → groups, nullable)
- created_at: TIMESTAMPTZ
```

**Логика:** Доступ предоставляется либо индивидуально (student_id), либо группе (group_id)

**RLS политики:**
- `discipline_access_delete`: authenticated
- `discipline_access_insert`: authenticated
- `discipline_access_select`: authenticated

#### 5. `lectures`
```sql
- id: UUID (PK)
- discipline_id: UUID (FK → disciplines)
- title: TEXT
- content: JSONB | TEXT
- type: TEXT (article | presentation | test)
- status: TEXT (draft | published)
- order_index: INT4
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS политики:**
- `lectures_delete`: authenticated
- `lectures_insert`: authenticated
- `lectures_select`: authenticated
- `lectures_update`: authenticated

#### 6. `presentations`
```sql
- id: UUID (PK)
- lecture_id: UUID (FK → lectures, UNIQUE)
- file_path: TEXT (nullable)
- status: TEXT (processing | ready | error)
- error_message: TEXT
- slides_data: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Формат slides_data:**
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

**RLS политики:**
- `Teachers can manage their presentations`: teacher может INSERT/UPDATE/DELETE своих презентаций (с WITH CHECK)
- `Students can view presentations`: студенты видят презентации опубликованных лекций с доступом (по student_id или group_id)

#### 7. `tests`
```sql
- id: UUID (PK)
- lecture_id: UUID (FK → lectures)
- questions: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Формат questions:**
```json
[
  {
    "id": "q1",
    "question": "Вопрос?",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctAnswer": 0,
    "explanation": "Пояснение"
  }
]
```

**RLS политики:**
- `tests_delete`: authenticated
- `tests_insert`: authenticated
- `tests_select`: authenticated
- `tests_update`: authenticated

#### 8. `student_progress`
```sql
- id: UUID (PK)
- student_id: UUID (FK → profiles)
- lecture_id: UUID (FK → lectures)
- completed: BOOL
- last_accessed: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS политики:**
- `student_progress_insert`: authenticated
- `student_progress_select`: authenticated
- `student_progress_update`: authenticated

#### 9. `system_settings`
```sql
- id: UUID (PK)
- key: TEXT
- value: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS политики:**
- `Only admins can read settings`: только admin может SELECT

---

## 🗄️ Storage

### Bucket: `presentations`
- **Public:** true
- **Структура путей:**
  ```
  <lectureId>/source.pptx              # Исходный PPTX файл
  <lectureId>/slides/001.png           # Слайд 1
  <lectureId>/slides/002.png           # Слайд 2
  ...
  <lectureId>/slides/020.png           # Слайд 20
  <lectureId>/thumb.png                # Опционально: превью
  ```

**Storage policies:**
- `Teachers can upload presentations`: teacher может загружать в папки своих лекций
- `Teachers can update presentations`: teacher может обновлять файлы (с WITH CHECK)
- `Teachers can delete presentations`: teacher может удалять файлы
- `Public read access for presentations`: все могут читать (для отображения слайдов)

---

## 🔐 Аутентификация и авторизация

### Роли пользователей
1. **student** - студент
   - Просмотр дисциплин с доступом
   - Просмотр лекций и презентаций
   - Прохождение тестов
   - Отслеживание прогресса

2. **teacher** - преподаватель
   - Все права студента
   - Создание/редактирование дисциплин
   - Создание/редактирование лекций, презентаций, тестов
   - Управление доступом студентов
   - Просмотр статистики студентов

3. **admin** - администратор
   - Все права teacher
   - Управление системными настройками
   - Полный доступ ко всем данным

### Механизм доступа к дисциплинам
- **Индивидуальный:** `discipline_access.student_id = auth.uid()`
- **Групповой:** `discipline_access.group_id = profiles.group_id`
- **Проверка в RLS:** `OR` между двумя условиями

---

## 🎨 Frontend структура

### Страницы (Page-based routing)

#### 1. `home` - Главная страница
- **Компонент:** `HomePage`
- **Доступ:** Все пользователи
- **Функции:**
  - Приветственный экран
  - Кнопки "Войти" / "Зарегистрироваться" (для неавторизованных)
  - Кнопки "Начать обучение" / "Пройти тесты" (для авторизованных)

#### 2. `login` - Вход
- **Компонент:** `LoginPage`
- **Доступ:** Неавторизованные
- **Функции:**
  - Форма входа (email + password)
  - Переключение на регистрацию

#### 3. `register` - Регистрация
- **Компонент:** `RegisterPage`
- **Доступ:** Неавторизованные
- **Функции:**
  - Форма регистрации (email, password, имя, фамилия, роль, группа)
  - Переключение на вход

#### 4. `disciplines` - Список дисциплин
- **Компонент:** `DisciplinesPage`
- **Доступ:** Авторизованные
- **Функции:**
  - Отображение карточек дисциплин
  - Фильтрация по доступным дисциплинам
  - Клик → переход к списку лекций

#### 5. `lecture-list` - Список материалов дисциплины
- **Компонент:** `LectureListPage`
- **Доступ:** Авторизованные с доступом к дисциплине
- **Функции:**
  - Отображение лекций, презентаций, тестов
  - Кнопка "Добавить материал" (для teacher)
  - Кнопка "Управление доступом" (для teacher)
  - Клик на материал → переход к просмотру

#### 6. `lecture-view` - Просмотр лекции/презентации/теста
- **Компонент:** `LectureViewWrapper` → `PresentationViewer` | `LectureReader` | `TestPage`
- **Доступ:** Авторизованные с доступом
- **Функции:**
  - **Презентация:** Просмотр слайдов, навигация, зум, fullscreen, загрузка PPTX (teacher)
  - **Статья:** Чтение текста, скачивание, отметка как пройденной
  - **Тест:** Прохождение теста, отображение результатов

#### 7. `tests` - Список всех тестов
- **Компонент:** `TestsPageWrapper` → `TestListPage`
- **Доступ:** Авторизованные студенты
- **Функции:**
  - Отображение всех доступных тестов
  - Клик → переход к прохождению теста

#### 8. `test-view` - Прохождение теста
- **Компонент:** `TestViewWrapper` → `TestPage`
- **Доступ:** Авторизованные с доступом
- **Функции:**
  - Отображение вопросов
  - Выбор ответов
  - Прогресс-бар
  - Отображение результатов
  - Сохранение результата в БД

#### 9. `teacher-dashboard` - Панель преподавателя
- **Компонент:** `TeacherDashboard`
- **Доступ:** Teacher/Admin
- **Функции:**
  - Статистика студентов
  - Таблица студентов с прогрессом
  - Фильтр по дисциплинам

#### 10. `create-lecture` - Создание лекции
- **Компонент:** `CreateLecturePage`
- **Доступ:** Teacher/Admin
- **Функции:**
  - Форма создания лекции (название, тип, содержимое)
  - Сохранение в БД

#### 11. `create-test` - Создание теста
- **Компонент:** `CreateTestPage`
- **Доступ:** Teacher/Admin
- **Функции:**
  - Форма создания теста
  - Добавление вопросов
  - Сохранение в БД

---

## 🔄 Процесс конвертации презентаций

### Архитектура
```
Frontend → presentationService.triggerConversion()
    ↓
Edge Function: presentation-convert (проверка прав)
    ↓
Converter Service (Node.js + LibreOffice)
    ↓
Storage: загрузка PNG слайдов
    ↓
Database: обновление slides_data
    ↓
Frontend: polling → отображение слайдов
```

### Шаги конвертации

#### 1. Загрузка PPTX (Frontend)
```typescript
// presentationService.uploadAndCreatePresentation()
1. Загрузить PPTX в Storage: <lectureId>/source.pptx
2. Создать/обновить запись в presentations:
   - lecture_id
   - file_path
   - status = 'processing'
   - slides_data = null
   - error_message = null
```

#### 2. Запуск конвертации (Frontend)
```typescript
// presentationService.triggerConversion()
1. Вызвать Edge Function: /functions/v1/presentation-convert
2. Передать lectureId
3. Edge Function проверяет права (teacher/admin)
4. Edge Function вызывает Converter API
```

#### 3. Конвертация (Converter Service)
```javascript
// converter/index.js - processConversion()
1. Скачать PPTX из Storage
2. Конвертировать PPTX → PDF (LibreOffice)
3. Конвертировать PDF → PNG слайды (ImageMagick)
4. Загрузить PNG в Storage: <lectureId>/slides/001.png, 002.png, ...
5. Обновить БД:
   - status = 'ready'
   - slides_data = { pageCount, slides: [...] }
```

#### 4. Отображение (Frontend)
```typescript
// PresentationViewer - polling каждые 3 секунды
1. Проверить status презентации
2. Если 'processing' → показать "Обрабатываем..."
3. Если 'ready' → загрузить slides_data и отобразить слайды
4. Если 'error' → показать error_message
```

### Статусы презентации
- **`processing`** - файл загружен, идет конвертация (default)
- **`ready`** - слайды готовы, slides_data заполнен
- **`error`** - ошибка конвертации, см. error_message

---

## 🛠️ Сервисы (Frontend)

### 1. `authService.ts`
**Не используется** - вся аутентификация через `AuthContext`

### 2. `lectureService.ts`
```typescript
- getLecturesByDisciplineId(disciplineId): Lecture[]
- getLectureById(id): Lecture
- createLecture(lecture): Lecture
- updateLecture(id, updates): Lecture
- deleteLecture(id): void
```

### 3. `testService.ts`
```typescript
- getTestByLectureId(lectureId): Test
- createTest(test): Test
- updateTest(id, updates): Test
- deleteTest(id): void
- checkAnswers(testId, answers): { score, correct, total }
```

### 4. `presentationService.ts`
```typescript
- uploadPresentationFile(file, lectureId): string (filePath)
- getPresentationByLectureId(lectureId): Presentation
- uploadAndCreatePresentation(file, lectureId): void
- triggerConversion(lectureId): void
- updatePresentationStatus(id, status, slidesData?, errorMessage?): void
- deletePresentation(id): void
- getPresentationUrl(filePath): string (publicUrl)
- getSlideUrl(lectureId, slideIndex): string
- getThumbUrl(lectureId): string
```

### 5. `progressService.ts`
```typescript
- getStudentProgress(studentId): StudentProgress[]
- markLectureAccessed(lectureId): void
- markLectureCompleted(lectureId): void
- saveTestResult(lectureId, score, answers): void
```

### 6. `groupService.ts`
```typescript
- getAllGroups(): Group[]
- createGroup(name): Group
- updateGroup(id, name): Group
- deleteGroup(id): void
```

---

## 🎯 Компоненты UI

### Основные компоненты

#### `PresentationViewer`
**Функции:**
- Загрузка презентации по lectureId
- Polling статуса конвертации (каждые 3 сек, макс 60 попыток)
- Отображение слайдов из slides_data
- Навигация: стрелки, клавиатура (←→ Space Enter)
- Зум: 50%-200% (кнопки +/-)
- Fullscreen режим
- Загрузка PPTX (только для teacher)
- Состояния: loading, no file, processing, ready, error

#### `LectureReader`
**Функции:**
- Отображение текстового содержимого лекции
- Парсинг Markdown
- Скачивание лекции (PDF/TXT)
- Отметка как пройденной
- Отслеживание доступа

#### `TestPage`
**Функции:**
- Отображение вопросов теста
- Навигация между вопросами
- Выбор ответов
- Прогресс-бар
- Отправка результатов
- Отображение результатов с пояснениями
- Сохранение в student_progress

#### `TeacherDashboard`
**Функции:**
- Метрики: всего студентов, средний прогресс, средний балл
- Селектор дисциплин
- Таблица студентов с прогрессом
- Фильтрация по дисциплинам

#### `ManageAccessDialog`
**Функции:**
- Управление доступом к дисциплине
- Добавление студентов (индивидуально)
- Добавление групп
- Удаление доступа

### UI библиотека (shadcn/ui)
- Button
- Card
- Dialog
- Input
- Label
- Select
- Table
- Tabs
- Progress
- Textarea
- Avatar
- Badge
- Checkbox
- Form
- Carousel
- Chart
- Sidebar
- Toast

---

## 🔧 Конфигурация

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://ygkuamwoxsqjdkxxkwuo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_CONVERTER_URL=http://localhost:8787
```

### Converter (converter/.env)
```env
SUPABASE_URL=https://ygkuamwoxsqjdkxxkwuo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=8787
PRESENTATIONS_BUCKET=presentations
```

### Edge Function (Supabase Dashboard)
```env
SUPABASE_URL=https://ygkuamwoxsqjdkxxkwuo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CONVERTER_URL=http://localhost:8787
CONVERTER_SECRET=your-secret-key
```

---

## 📦 Зависимости

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.39.0",
    "lucide-react": "^0.index",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^6.3.5",
    "typescript": "^5.3.3",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

### Converter (converter/package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 🚀 Развертывание

### Локальная разработка

#### Frontend
```bash
cd c:\Users\nnndd\OneDrive\Desktop\v2.0
npm install
npm run dev
# http://localhost:5173
```

#### Converter
```bash
cd c:\Users\nnndd\OneDrive\Desktop\v2.0\converter
npm install
npm start
# http://localhost:8787
```

**Требования для Converter:**
- LibreOffice установлен и в PATH
- ImageMagick/GraphicsMagick установлен

### Docker (рекомендуется)
```bash
cd c:\Users\nnndd\OneDrive\Desktop\v2.0
docker compose up --build
# Frontend: http://localhost:5173
# Converter: http://localhost:8787
```

### Supabase

#### Миграции
```bash
# Применить миграцию presentations
supabase db push
# Или через SQL Editor в Dashboard
```

#### Edge Functions
```bash
# Развернуть Edge Function
supabase functions deploy presentation-convert

# Настроить переменные окружения в Dashboard
```

---

## 📝 Миграции

### Основные миграции
1. **Начальная схема** - создание всех таблиц
2. **RLS политики** - настройка безопасности
3. **20260108_presentations_setup.sql** - первая версия presentations
4. **20260108_presentations_delta.sql** - исправленная версия presentations

### Ключевые изменения в delta миграции
- ✅ Статусы: `processing | ready | error` (убран `pending`)
- ✅ DEFAULT status = `'processing'`
- ✅ RLS с поддержкой групп для студентов
- ✅ WITH CHECK в teacher policy для INSERT
- ✅ Использование общей функции `update_updated_at_column`
- ✅ Правильные Storage policies для UPDATE/DELETE

---

## 🔍 Troubleshooting

### Проблема: LibreOffice не найден
**Решение:**
1. Установить LibreOffice: https://www.libreoffice.org/download/
2. Добавить в PATH: `C:\Program Files\LibreOffice\program`
3. Перезапустить терминал
4. Проверить: `libreoffice --version`

### Проблема: Презентация застряла в "processing"
**Решение:**
1. Проверить логи converter
2. Убедиться что LibreOffice работает
3. Переконвертировать вручную:
```sql
UPDATE presentations 
SET status = 'processing', error_message = NULL, slides_data = NULL
WHERE lecture_id = '<lecture-uuid>';
```
```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{"lectureId": "<lecture-uuid>"}'
```

### Проблема: Студент не видит презентацию
**Решение:**
1. Проверить доступ к дисциплине:
```sql
SELECT * FROM discipline_access 
WHERE student_id = '<student-uuid>' 
   OR group_id = (SELECT group_id FROM profiles WHERE id = '<student-uuid>');
```
2. Проверить что лекция published:
```sql
SELECT * FROM lectures WHERE id = '<lecture-uuid>';
```

### Проблема: TypeScript ошибки в presentationService
**Решение:**
Обновить типы БД:
```bash
npx supabase gen types typescript --project-id ygkuamwoxsqjdkxxkwuo > src/lib/database.types.ts
```

---

## 📊 Мониторинг

### Проверить все презентации
```sql
SELECT 
  p.id,
  l.title as lecture_title,
  p.status,
  p.error_message,
  p.slides_data->>'pageCount' as slide_count,
  p.created_at,
  p.updated_at
FROM presentations p
JOIN lectures l ON l.id = p.lecture_id
ORDER BY p.updated_at DESC;
```

### Найти зависшие конвертации
```sql
SELECT * FROM presentations
WHERE status = 'processing'
AND updated_at < NOW() - INTERVAL '10 minutes';
```

### Проверить размер Storage
```sql
SELECT 
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'presentations';
```

---

## 🎯 Текущее состояние проекта

### ✅ Реализовано
- Frontend с полным UI
- Аутентификация и авторизация
- Управление дисциплинами, лекциями, тестами
- Система прогресса студентов
- Презентации с конвертацией PPTX → PNG
- RLS политики с поддержкой групп
- Storage для презентаций
- Converter service
- Edge Function для безопасного вызова converter
- Docker конфигурация

### ⚠️ Требует настройки
- LibreOffice для локальной разработки
- Переменные окружения для Edge Function
- Развертывание Edge Function в Supabase

### 📋 Документация
- `START_PRESENTATIONS.md` - руководство по запуску
- `PRESENTATIONS_SETUP_GUIDE.md` - полное руководство по настройке
- `PRESENTATIONS_FIXES_SUMMARY.md` - сводка исправлений
- `INSTALL_LIBREOFFICE_WINDOWS.md` - установка LibreOffice
- `FIX_CONVERTER_ISSUE.md` - решение проблем конвертации
- `PROJECT_SPECIFICATION.md` - этот файл

---

## 🔗 Полезные ссылки

- **Supabase Dashboard:** https://supabase.com/dashboard/project/ygkuamwoxsqjdkxxkwuo
- **LibreOffice:** https://www.libreoffice.org/download/
- **shadcn/ui:** https://ui.shadcn.com/
- **Lucide Icons:** https://lucide.dev/

---

**Версия спецификации:** 1.0  
**Дата:** 9 января 2026  
**Статус:** Готово к использованию
