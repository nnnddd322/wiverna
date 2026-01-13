# Установка LibreOffice для converter

## Проблема
Converter не может конвертировать PPTX потому что LibreOffice не установлен в Windows.

Ошибка:
```
"libreoffice" не является внутренней или внешней
командой, исполняемой программой или пакетным файлом.
```

## Решение 1: Установить LibreOffice (для локальной разработки)

### Шаг 1: Скачать LibreOffice
https://www.libreoffice.org/download/download/

Выберите версию для Windows (обычно 64-bit).

### Шаг 2: Установить
Запустите установщик и следуйте инструкциям.

### Шаг 3: Добавить в PATH
После установки добавьте LibreOffice в PATH:

1. Откройте "Параметры системы" → "Дополнительные параметры системы"
2. "Переменные среды"
3. В "Системные переменные" найдите `Path`
4. Добавьте путь к LibreOffice (обычно `C:\Program Files\LibreOffice\program`)
5. Перезапустите терминал

### Шаг 4: Проверить
```bash
libreoffice --version
```

Должно показать версию LibreOffice.

### Шаг 5: Перезапустить converter
```bash
cd converter
npm start
```

---

## Решение 2: Использовать Docker (рекомендуется для продакшена)

Docker уже установлен (видел на скриншоте). Используйте Docker Compose:

```bash
# Остановить локальные процессы
# Ctrl+C в терминалах где запущены npm run dev и npm start

# Запустить через Docker
docker-compose up --build
```

В Docker LibreOffice уже установлен в контейнере converter.

---

## Решение 3: Временный обход (для тестирования без конвертации)

Можно временно изменить converter чтобы он создавал mock слайды для тестирования UI:

```javascript
// В converter/index.js добавить mock режим
const MOCK_MODE = process.env.MOCK_MODE === 'true';

if (MOCK_MODE) {
  // Создать mock слайды без LibreOffice
  // Только для тестирования UI
}
```

Но это не рекомендуется для реального использования.

---

## Рекомендация

**Для Windows разработки:** Установите LibreOffice (Решение 1)
**Для продакшена:** Используйте Docker (Решение 2)

Docker предпочтительнее потому что:
- LibreOffice уже в контейнере
- Одинаковое окружение на всех машинах
- Проще деплоить

---

## После установки LibreOffice

Converter автоматически продолжит обработку. Презентация которая сейчас в статусе "processing" будет переконвертирована автоматически при следующем запросе, или можно переконвертировать вручную:

```sql
-- В Supabase SQL Editor
UPDATE presentations 
SET status = 'processing', 
    error_message = NULL,
    slides_data = NULL
WHERE lecture_id = 'e74acd41-e8ad-43b6-96e1-7d169eae70fd';
```

Затем перезагрузить страницу в браузере.
