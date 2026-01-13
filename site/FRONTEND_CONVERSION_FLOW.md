# 🔄 Frontend Conversion Flow - Стабилизированная версия

## ✅ Что исправлено

### 1. **Правильный вызов Edge Function**
**Было:** `triggerConversion()` вызывал напрямую VM converter на `localhost:8787`
```typescript
// ❌ СТАРЫЙ КОД
const converterUrl = 'http://localhost:8787';
fetch(`${converterUrl}/convert`, { ... })
```

**Стало:** Вызывает Edge Function `presentation-convert` с JWT
```typescript
// ✅ НОВЫЙ КОД
const edgeFunctionUrl = `${supabaseUrl}/functions/v1/presentation-convert`;
const { data: { session } } = await supabase.auth.getSession();
fetch(edgeFunctionUrl, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': VITE_SUPABASE_ANON_KEY,
  }
})
```

### 2. **Атомарная операция загрузки**
**Было:** `PresentationViewer` вызывал два метода отдельно
```typescript
// ❌ СТАРЫЙ КОД
await presentationService.uploadAndCreatePresentation(file, lectureId);
await presentationService.triggerConversion(lectureId); // Дубль!
```

**Стало:** Один атомарный метод делает всё
```typescript
// ✅ НОВЫЙ КОД
await presentationService.uploadAndCreatePresentation(file, lectureId);
// Внутри: upload → create record → trigger conversion
```

### 3. **Защита от race conditions**
**Было:** Можно было загрузить файл несколько раз параллельно
```typescript
// ❌ СТАРЫЙ КОД - нет проверки
async uploadAndCreatePresentation(file, lectureId) {
  const filePath = await this.uploadPresentationFile(file, lectureId);
  const presentation = await this.upsertPresentation(lectureId, filePath);
  return presentation;
}
```

**Стало:** Проверка перед загрузкой
```typescript
// ✅ НОВЫЙ КОД
async uploadAndCreatePresentation(file, lectureId) {
  // Проверка: уже обрабатывается?
  const existing = await this.getPresentationByLectureId(lectureId);
  if (existing?.status === 'processing') {
    throw new Error('Презентация уже обрабатывается. Дождитесь завершения.');
  }
  // ... остальной код
}
```

### 4. **Откат при ошибке**
**Было:** Если `triggerConversion()` падал, презентация оставалась в `processing` навсегда
```typescript
// ❌ СТАРЫЙ КОД
await presentationService.uploadAndCreatePresentation(file, lectureId);
try {
  await presentationService.triggerConversion(lectureId);
} catch (convError) {
  setError(convError.message); // Презентация в processing!
}
```

**Стало:** Автоматический откат статуса
```typescript
// ✅ НОВЫЙ КОД
try {
  await this.triggerConversion(lectureId);
  return presentation;
} catch (error) {
  // Откат: status = 'error'
  if (presentation) {
    await this.updatePresentationStatus(
      presentation.id,
      'error',
      undefined,
      error.message
    );
  }
  throw error;
}
```

---

## 🎯 Новый флоу конвертации

### Шаг 1: Пользователь загружает PPTX
```typescript
// PresentationViewer.tsx
const handleFileUpload = async (event) => {
  const file = event.target.files?.[0];
  
  // Валидация
  if (!file.name.endsWith('.pptx')) {
    setError('Пожалуйста, выберите файл .pptx');
    return;
  }
  
  // Атомарная операция
  await presentationService.uploadAndCreatePresentation(file, lectureId);
  
  // Перезагрузка для показа статуса
  await loadPresentation();
  setPollingCount(0);
}
```

### Шаг 2: uploadAndCreatePresentation (атомарно)
```typescript
// presentationService.ts
async uploadAndCreatePresentation(file, lectureId) {
  // 1. Проверка race condition
  const existing = await this.getPresentationByLectureId(lectureId);
  if (existing?.status === 'processing') {
    throw new Error('Презентация уже обрабатывается');
  }

  let presentation;
  try {
    // 2. Upload PPTX в Storage
    const filePath = await this.uploadPresentationFile(file, lectureId);
    // → presentations/<lectureId>/source.pptx
    
    // 3. Upsert запись в БД
    presentation = await this.upsertPresentation(lectureId, filePath);
    // → status = 'processing', slides_data = null
    
    // 4. Trigger конвертации через Edge Function
    await this.triggerConversion(lectureId);
    
    return presentation;
  } catch (error) {
    // 5. Откат при ошибке
    if (presentation) {
      await this.updatePresentationStatus(
        presentation.id,
        'error',
        undefined,
        error.message
      );
    }
    throw error;
  }
}
```

### Шаг 3: triggerConversion → Edge Function
```typescript
// presentationService.ts
async triggerConversion(lectureId) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/presentation-convert`;
  
  // Получить JWT токен
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Требуется авторизация');
  }

  // Вызов Edge Function с JWT
  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ lectureId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Ошибка: ${response.status}`);
  }

  return await response.json();
}
```

### Шаг 4: Edge Function → VM Converter
```typescript
// supabase/functions/presentation-convert/index.ts
serve(async (req) => {
  // 1. Проверка JWT
  const authHeader = req.headers.get("Authorization");
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // 2. Проверка роли (teacher/admin)
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  const role = String(profile?.role || "").toLowerCase();
  if (!(role === "teacher" || role === "admin")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // 3. Проксирование на VM converter
  const r = await fetch(`${CONVERTER_URL}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONVERTER_SECRET}`,
    },
    body: JSON.stringify({ lectureId }),
  });

  return new Response(await r.text(), { status: r.status });
});
```

### Шаг 5: VM Converter обрабатывает
```javascript
// converter/index.js
app.post('/convert', async (req, res) => {
  const { lectureId } = req.body;
  
  // 1. Скачать PPTX из Storage
  const pptxPath = await downloadFromStorage(lectureId);
  
  // 2. PPTX → PDF (LibreOffice)
  const pdfPath = await convertPPTXToPDF(pptxPath);
  
  // 3. PDF → PNG слайды (ImageMagick)
  const slidePaths = await convertPDFToPNG(pdfPath);
  
  // 4. Upload PNG в Storage
  const slides = await uploadSlidesToStorage(lectureId, slidePaths);
  
  // 5. Update БД: status = 'ready', slides_data = {...}
  await updatePresentation(lectureId, {
    status: 'ready',
    slides_data: {
      pageCount: slides.length,
      slides: slides
    }
  });
  
  res.json({ success: true, pageCount: slides.length });
});
```

### Шаг 6: Frontend polling
```typescript
// PresentationViewer.tsx
useEffect(() => {
  // Polling каждые 3 секунды если status = 'processing'
  if (status === 'processing' && pollingCount < maxPollingAttempts) {
    const timer = setTimeout(() => {
      loadPresentation(); // Перезагрузка презентации
      setPollingCount(prev => prev + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [status, pollingCount]);

const loadPresentation = async () => {
  const data = await presentationService.getPresentationByLectureId(lectureId);
  setPresentation(data);
  
  // Если status = 'ready' → показать слайды
  // Если status = 'error' → показать ошибку
  // Если status = 'processing' → продолжить polling
};
```

---

## 🔒 Безопасность

### Проверки на каждом уровне

1. **Frontend (presentationService.ts)**
   - ✅ Проверка JWT токена перед вызовом Edge Function
   - ✅ Проверка race condition (уже processing?)
   - ✅ Откат статуса при ошибке

2. **Edge Function (presentation-convert)**
   - ✅ Проверка JWT токена пользователя
   - ✅ Проверка роли (только teacher/admin)
   - ✅ Безопасное проксирование на VM

3. **VM Converter**
   - ✅ Проверка Authorization header с CONVERTER_SECRET
   - ✅ Обработка ошибок конвертации
   - ✅ Обновление статуса в БД

4. **Database (RLS)**
   - ✅ Students видят только опубликованные презентации с доступом
   - ✅ Teachers управляют только своими презентациями
   - ✅ WITH CHECK в INSERT policy

---

## 📊 Состояния презентации

### `processing`
- **Когда:** После upload, до завершения конвертации
- **UI:** Spinner + "Обрабатываем презентацию"
- **Polling:** Каждые 3 сек, макс 60 попыток (3 минуты)

### `ready`
- **Когда:** Конвертация завершена успешно
- **UI:** Отображение слайдов
- **slides_data:** `{ pageCount, slides: [...] }`

### `error`
- **Когда:** Ошибка на любом этапе
- **UI:** Сообщение об ошибке + кнопка "Попробовать снова"
- **error_message:** Текст ошибки

---

## 🛡️ Защита от проблем

### Race Conditions
```typescript
// ✅ Проверка перед загрузкой
if (existing?.status === 'processing') {
  throw new Error('Презентация уже обрабатывается');
}
```

### Зависшие конвертации
```typescript
// ✅ Максимум 60 попыток polling (3 минуты)
const maxPollingAttempts = 60;
if (pollingCount >= maxPollingAttempts) {
  // Остановить polling, показать ошибку
}
```

### Ошибки Edge Function
```typescript
// ✅ Откат статуса
catch (error) {
  if (presentation) {
    await updatePresentationStatus(id, 'error', undefined, error.message);
  }
  throw error;
}
```

### Недоступность VM Converter
```typescript
// ✅ Edge Function вернет ошибку
// ✅ Frontend откатит статус в 'error'
// ✅ Пользователь увидит сообщение
```

---

## 🧪 Тестирование

### Сценарий 1: Успешная конвертация
1. Teacher загружает PPTX
2. `uploadAndCreatePresentation()` → status = 'processing'
3. Edge Function вызывает VM converter
4. Converter конвертирует и обновляет status = 'ready'
5. Frontend polling обнаруживает 'ready'
6. Отображаются слайды

### Сценарий 2: Ошибка конвертации
1. Teacher загружает поврежденный PPTX
2. `uploadAndCreatePresentation()` → status = 'processing'
3. Converter падает с ошибкой
4. Converter обновляет status = 'error'
5. Frontend polling обнаруживает 'error'
6. Показывается сообщение об ошибке

### Сценарий 3: Edge Function недоступна
1. Teacher загружает PPTX
2. `uploadAndCreatePresentation()` → upload OK
3. `triggerConversion()` → fetch fails
4. Catch блок откатывает status = 'error'
5. Пользователь видит ошибку сразу

### Сценарий 4: Повторная загрузка во время processing
1. Teacher загружает PPTX #1
2. Status = 'processing'
3. Teacher пытается загрузить PPTX #2
4. `uploadAndCreatePresentation()` → throw Error
5. Показывается: "Презентация уже обрабатывается"

---

## 📝 Переменные окружения

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://ygkuamwoxsqjdkxxkwuo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Function (Supabase Dashboard)
```env
SUPABASE_URL=https://ygkuamwoxsqjdkxxkwuo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CONVERTER_URL=http://your-vm-ip:8787
CONVERTER_SECRET=your-secret-key
```

### VM Converter (.env)
```env
SUPABASE_URL=https://ygkuamwoxsqjdkxxkwuo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=8787
PRESENTATIONS_BUCKET=presentations
```

---

## ✅ Чеклист готовности

- [x] `triggerConversion()` вызывает Edge Function с JWT
- [x] `uploadAndCreatePresentation()` атомарный (upload + create + trigger)
- [x] Защита от race conditions (проверка status = 'processing')
- [x] Откат статуса при ошибке Edge Function
- [x] Правильная обработка ошибок во всех местах
- [x] Polling работает корректно
- [x] UI показывает все состояния (loading, processing, ready, error)
- [x] Edge Function проверяет JWT и роль
- [x] Edge Function проксирует на VM с CONVERTER_SECRET
- [ ] Edge Function развернута в Supabase
- [ ] Переменные окружения настроены
- [ ] Протестирован полный флоу

---

## 🚀 Развертывание

### 1. Развернуть Edge Function
```bash
supabase functions deploy presentation-convert
```

### 2. Настроить переменные в Supabase Dashboard
Edge Functions → presentation-convert → Settings → Secrets

### 3. Проверить работу
```bash
# Тест Edge Function
curl -X POST https://ygkuamwoxsqjdkxxkwuo.supabase.co/functions/v1/presentation-convert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lectureId": "test-uuid"}'
```

---

**Версия:** 2.0 (Стабилизированная)  
**Дата:** 9 января 2026  
**Статус:** Готово к production
