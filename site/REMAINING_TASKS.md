# 📋 Оставшиеся задачи

## ✅ Что уже сделано

1. **Оптимизация PresentationViewer**
   - ✅ Предзагрузка соседних слайдов (текущий + 2 следующих + 1 предыдущий)
   - ✅ Кэширование URL слайдов с useMemo
   - ✅ Плавная навигация с useCallback
   - ✅ Индикация загрузки для каждого слайда
   - ✅ Transition opacity для плавного появления

2. **Исправление текстов загрузки**
   - ✅ PresentationViewer: "Загрузка презентации..."
   - ✅ LectureViewWrapper: "Загрузка..." (универсально)

3. **Исправление overflow текста**
   - ✅ LectureReader: добавлен `break-words` для параграфов
   - ✅ Длинные строки корректно переносятся

---

## ⏳ Что нужно добавить

### 1. Функционал удаления

#### Дисциплины
- Кнопка удаления в списке дисциплин (TeacherDashboard)
- Подтверждение удаления (диалог)
- Каскадное удаление всех лекций дисциплины
- Метод `disciplineService.deleteDiscipline(id)`

#### Лекции
- Кнопка удаления в списке лекций (LectureListPage)
- Подтверждение удаления
- Удаление связанных данных (презентации, тесты, прогресс)
- Метод `lectureService.deleteLecture(id)`

#### Презентации
- Кнопка удаления в PresentationViewer (для teacher)
- Удаление файлов из Storage (PPTX + PNG слайды)
- Удаление записи из БД
- Метод `presentationService.deletePresentation(lectureId)`

---

### 2. Функционал редактирования

#### Лекции (article)
- Кнопка "Редактировать" в LectureReader (для teacher)
- Модальное окно с формой редактирования
- Поля: название, содержимое (textarea)
- Метод `lectureService.updateLecture(id, data)`

#### Тесты
- Кнопка "Редактировать" в TestPage (для teacher)
- Модальное окно с формой редактирования
- Редактирование вопросов, вариантов ответов, правильных ответов
- Метод `testService.updateTest(id, questions)`

#### Дисциплины
- Кнопка "Редактировать" в списке дисциплин
- Модальное окно с формой
- Поля: название, описание
- Метод `disciplineService.updateDiscipline(id, data)`

---

### 3. Функционал замены презентации

#### PresentationViewer
- Кнопка "Заменить презентацию" (для teacher)
- При клике - открывается file input
- Удаление старых слайдов из Storage
- Загрузка нового PPTX
- Запуск конвертации
- Метод `presentationService.replacePresentation(lectureId, file)`

---

## 🔧 Технические детали

### Удаление дисциплины
```typescript
// disciplineService.ts
async deleteDiscipline(id: string) {
  // 1. Получить все лекции дисциплины
  const { data: lectures } = await supabase
    .from('lectures')
    .select('id')
    .eq('discipline_id', id);

  // 2. Удалить каждую лекцию (каскадно)
  for (const lecture of lectures || []) {
    await lectureService.deleteLecture(lecture.id);
  }

  // 3. Удалить дисциплину
  const { error } = await supabase
    .from('disciplines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

### Удаление лекции
```typescript
// lectureService.ts
async deleteLecture(id: string) {
  // 1. Удалить презентацию (если есть)
  await presentationService.deletePresentation(id);

  // 2. Удалить тест (если есть)
  await testService.deleteTest(id);

  // 3. Удалить прогресс студентов
  await supabase
    .from('student_progress')
    .delete()
    .eq('lecture_id', id);

  // 4. Удалить лекцию
  const { error } = await supabase
    .from('lectures')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

### Удаление презентации
```typescript
// presentationService.ts
async deletePresentation(lectureId: string) {
  // 1. Получить данные презентации
  const presentation = await this.getPresentationByLectureId(lectureId);
  if (!presentation) return;

  // 2. Удалить все файлы из Storage
  const filesToDelete = [
    `${lectureId}/source.pptx`,
    ...presentation.slides_data?.slides?.map(s => s.path) || []
  ];

  await supabase.storage
    .from('presentations')
    .remove(filesToDelete);

  // 3. Удалить запись из БД
  await supabase
    .from('presentations')
    .delete()
    .eq('lecture_id', lectureId);
}
```

### Замена презентации
```typescript
// presentationService.ts
async replacePresentation(lectureId: string, file: File) {
  // 1. Удалить старую презентацию
  await this.deletePresentation(lectureId);

  // 2. Загрузить новую
  await this.uploadAndCreatePresentation(file, lectureId);
}
```

### Редактирование лекции
```typescript
// lectureService.ts
async updateLecture(id: string, updates: { title?: string; content?: string }) {
  const { data, error } = await supabase
    .from('lectures')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Редактирование теста
```typescript
// testService.ts
async updateTest(id: string, questions: Question[]) {
  const { data, error } = await supabase
    .from('tests')
    .update({
      questions: questions as any,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 🎨 UI компоненты

### Кнопка удаления
```tsx
<Button
  variant="destructive"
  size="sm"
  onClick={() => setDeleteDialogOpen(true)}
>
  <Trash2 className="w-4 h-4 mr-2" />
  Удалить
</Button>
```

### Диалог подтверждения
```tsx
{deleteDialogOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md">
      <h3 className="text-lg font-bold mb-2">Подтверждение удаления</h3>
      <p className="text-gray-600 mb-4">
        Вы уверены, что хотите удалить эту {itemType}? Это действие нельзя отменить.
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
          Отмена
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Удалить
        </Button>
      </div>
    </div>
  </div>
)}
```

### Кнопка редактирования
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setEditDialogOpen(true)}
>
  <Edit className="w-4 h-4 mr-2" />
  Редактировать
</Button>
```

### Форма редактирования
```tsx
{editDialogOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
      <h3 className="text-lg font-bold mb-4">Редактирование</h3>
      <form onSubmit={handleSave}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Название"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 h-64"
          placeholder="Содержимое"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
            Отмена
          </Button>
          <Button type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

## 📝 Приоритеты

### Высокий приоритет:
1. ✅ Оптимизация презентаций (СДЕЛАНО)
2. ✅ Исправление текстов загрузки (СДЕЛАНО)
3. ✅ Исправление overflow (СДЕЛАНО)
4. **⏳ Функционал удаления** (В РАБОТЕ)

### Средний приоритет:
5. **⏳ Функционал редактирования**
6. **⏳ Функционал замены презентации**

---

## 🚀 План реализации

### Этап 1: Удаление (1-2 часа)
1. Добавить методы удаления в сервисы
2. Добавить кнопки удаления в UI
3. Добавить диалоги подтверждения
4. Протестировать каскадное удаление

### Этап 2: Редактирование (2-3 часа)
1. Добавить методы обновления в сервисы
2. Создать формы редактирования
3. Добавить кнопки редактирования в UI
4. Протестировать сохранение изменений

### Этап 3: Замена презентации (30 минут)
1. Добавить метод замены в presentationService
2. Добавить кнопку "Заменить" в PresentationViewer
3. Протестировать замену и конвертацию

---

**Версия:** 2.2  
**Дата:** 10 января 2026  
**Статус:** 3 из 6 задач выполнено, осталось 3
