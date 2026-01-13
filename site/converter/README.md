# Presentation Converter Service

Микросервис для конвертации PPTX презентаций в PNG слайды.

## Архитектура

```
PPTX → LibreOffice → PDF → pdftoppm → PNG слайды → Supabase Storage
```

## Требования

- Node.js 18+
- LibreOffice (для конвертации PPTX → PDF)
- poppler-utils (для конвертации PDF → PNG)

## Установка

### Локальная разработка

```bash
cd converter
npm install
cp .env.example .env
# Заполните .env файл вашими данными Supabase
npm start
```

### Docker

```bash
# Из корня проекта
docker-compose up converter
```

## API Endpoints

### POST /convert

Запускает конвертацию презентации.

**Request:**
```json
{
  "lectureId": "uuid-of-lecture"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversion started",
  "lectureId": "uuid-of-lecture"
}
```

Конвертация происходит асинхронно. Статус можно отслеживать через таблицу `presentations`.

### GET /health

Проверка здоровья сервиса.

**Response:**
```json
{
  "status": "ok",
  "service": "presentation-converter",
  "timestamp": "2026-01-08T19:00:00.000Z"
}
```

## Процесс конвертации

1. **Download**: Скачивание PPTX из Supabase Storage (`presentations/<lectureId>/source.pptx`)
2. **Convert to PDF**: LibreOffice headless конвертация
3. **Convert to PNG**: pdftoppm создает PNG для каждой страницы (150 DPI)
4. **Upload**: Загрузка слайдов в Storage (`presentations/<lectureId>/slides/001.png`, `002.png`, ...)
5. **Update DB**: Обновление записи в таблице `presentations`:
   - `status = 'ready'`
   - `slides_data` с информацией о слайдах

## Формат slides_data

```json
{
  "pageCount": 20,
  "slides": [
    {
      "index": 1,
      "path": "lecture-uuid/slides/001.png",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

## Обработка ошибок

При ошибке конвертации:
- `status = 'error'`
- `error_message` содержит описание ошибки
- Временные файлы удаляются

## Переменные окружения

- `SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service role ключ (не anon key!)
- `PORT` - Порт сервера (по умолчанию 8787)
- `PRESENTATIONS_BUCKET` - Имя bucket в Storage (по умолчанию 'presentations')

## Логирование

Сервис логирует все этапы конвертации:
- Скачивание файла
- Конвертация PPTX → PDF
- Конвертация PDF → PNG
- Загрузка слайдов
- Обновление статуса

## Производительность

- Timeout на конвертацию: 2 минуты на каждый этап
- Разрешение PNG: 150 DPI (оптимально для веб)
- Временные файлы автоматически удаляются после конвертации

## Troubleshooting

### LibreOffice не установлен
```bash
# Alpine Linux
apk add libreoffice

# Ubuntu/Debian
apt-get install libreoffice
```

### poppler-utils не установлен
```bash
# Alpine Linux
apk add poppler-utils

# Ubuntu/Debian
apt-get install poppler-utils
```

### Ошибка доступа к Supabase
Проверьте:
1. Правильность `SUPABASE_URL`
2. Используется ли `service_role` ключ (не `anon` ключ)
3. Bucket `presentations` существует и публичный
4. RLS политики настроены корректно
