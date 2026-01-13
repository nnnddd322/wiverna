# 🚀 Presentation Converter Infrastructure

**Автономный сервис конвертации PPTX → PNG для образовательной платформы**

---

## 📁 Структура

```
infra-converter/
├── server/              # Node.js converter service
│   ├── index.js        # Main server code
│   ├── package.json    # Dependencies
│   ├── .env.example    # Environment template
│   └── .gitignore
├── scripts/            # Deployment & management scripts
│   ├── install.sh      # System dependencies installer
│   ├── start.sh        # Start service manually
│   ├── healthcheck.sh  # Health check utility
│   └── setup-systemd.sh # Systemd service setup
├── docs/               # Documentation
│   └── DEPLOY.md       # Deployment checklist
└── README.md           # This file
```

---

## 🎯 Что делает этот сервис

1. **Принимает запрос** от Supabase Edge Function
2. **Скачивает PPTX** из Supabase Storage
3. **Конвертирует** PPTX → PDF → PNG (LibreOffice + pdftoppm)
4. **Загружает слайды** обратно в Storage
5. **Обновляет статус** в таблице `presentations`

---

## 🔧 Требования

### Система
- **OS**: Ubuntu 20.04+ / Debian 11+
- **RAM**: минимум 2GB (рекомендуется 4GB)
- **Disk**: минимум 10GB свободного места
- **Network**: публичный IP, порт 8787 открыт

### Софт
- **Node.js** 18+
- **LibreOffice** (headless mode)
- **poppler-utils** (pdftoppm)
- **Fonts** (DejaVu, Liberation)

---

## 📦 Быстрый старт (на VM)

### 1️⃣ Клонируйте репозиторий

```bash
cd /opt
git clone <your-repo-url> eduplatform
cd eduplatform/infra-converter
```

### 2️⃣ Установите системные зависимости

```bash
sudo chmod +x scripts/*.sh
sudo scripts/install.sh
```

Скрипт установит:
- Node.js 18
- LibreOffice
- poppler-utils
- Необходимые шрифты

### 3️⃣ Настройте сервис

```bash
cd server
npm install
cp .env.example .env
nano .env  # Заполните Supabase credentials
```

**Обязательные переменные в `.env`:**
```env
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-ключ
PORT=8787
```

### 4️⃣ Запустите сервис

**Вариант A: Вручную (для теста)**
```bash
npm start
```

**Вариант B: Systemd (production)**
```bash
cd ..
sudo scripts/setup-systemd.sh
sudo systemctl start converter
sudo systemctl status converter
```

### 5️⃣ Проверьте работу

```bash
curl http://localhost:8787/health
# Ожидается: {"status":"ok","service":"presentation-converter",...}
```

---

## 🔐 Безопасность

### Firewall (UFW)

```bash
# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить converter port
sudo ufw allow 8787/tcp

# Включить firewall
sudo ufw enable
```

### Supabase Edge Function

Убедитесь, что Edge Function `presentation-convert` настроена:

```typescript
// supabase/functions/presentation-convert/index.ts
const CONVERTER_URL = 'http://ВАШ_VM_IP:8787';
const CONVERTER_SECRET = Deno.env.get('CONVERTER_SECRET');

// Проксирует запрос на VM converter
```

---

## 📊 API Endpoints

### `POST /convert`

Запускает конвертацию презентации.

**Request:**
```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{"lectureId":"uuid-лекции"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Conversion started",
  "lectureId": "uuid-лекции"
}
```

**Процесс:**
1. Ответ возвращается сразу (200 OK)
2. Конвертация идет в фоне
3. Статус отслеживается в таблице `presentations`

### `GET /health`

Проверка здоровья сервиса.

**Response:**
```json
{
  "status": "ok",
  "service": "presentation-converter",
  "timestamp": "2026-01-13T12:00:00.000Z"
}
```

---

## 🔄 Процесс конвертации

```
1. Download PPTX
   ↓ presentations/{lectureId}/source.pptx
   
2. PPTX → PDF
   ↓ LibreOffice headless
   
3. PDF → PNG
   ↓ pdftoppm -r 150
   
4. Upload slides
   ↓ presentations/{lectureId}/slides/001.png, 002.png, ...
   
5. Update DB
   ↓ presentations.status = 'ready'
   ↓ presentations.slides_data = {...}
```

**Формат `slides_data`:**
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

---

## 🛠 Управление сервисом

### Systemd команды

```bash
# Запустить
sudo systemctl start converter

# Остановить
sudo systemctl stop converter

# Перезапустить
sudo systemctl restart converter

# Статус
sudo systemctl status converter

# Логи (live)
sudo journalctl -u converter -f

# Логи (последние 100 строк)
sudo journalctl -u converter -n 100
```

### Ручной запуск (для отладки)

```bash
cd /opt/eduplatform/infra-converter/server
npm start
```

---

## 📝 Логирование

Сервис логирует все этапы:

```
Starting conversion for lecture abc-123
Downloading presentations/abc-123/source.pptx...
PPTX downloaded
Converting PPTX to PDF...
PDF generated
Converting PDF to PNG images...
Generated 15 slides
Cleaning old slides...
Uploading slides to Storage...
Uploaded slide 1/15
...
Updating presentation status...
Conversion completed successfully for lecture abc-123
```

**Просмотр логов:**
```bash
# Systemd
sudo journalctl -u converter -f

# Или напрямую (если запущено вручную)
# Логи выводятся в stdout
```

---

## 🐛 Troubleshooting

### Проблема: LibreOffice не найден

```bash
which libreoffice
# Если пусто:
sudo apt-get install libreoffice
```

### Проблема: pdftoppm не найден

```bash
which pdftoppm
# Если пусто:
sudo apt-get install poppler-utils
```

### Проблема: Ошибка доступа к Supabase

**Проверьте:**
1. `SUPABASE_URL` корректен
2. Используется `service_role` ключ (НЕ `anon` ключ!)
3. Bucket `presentations` существует
4. Bucket публичный или RLS настроен

**Тест подключения:**
```bash
cd server
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.storage.from('presentations').list().then(console.log);
"
```

### Проблема: Сервис не стартует

```bash
# Проверить статус
sudo systemctl status converter

# Проверить логи
sudo journalctl -u converter -n 50

# Проверить .env
cat /opt/eduplatform/infra-converter/server/.env

# Проверить порт
sudo netstat -tlnp | grep 8787
```

### Проблема: Конвертация зависает

**Возможные причины:**
- Недостаточно RAM (нужно минимум 2GB)
- Очень большой PPTX файл
- Timeout (по умолчанию 2 минуты)

**Решение:**
```bash
# Проверить RAM
free -h

# Увеличить timeout в index.js (если нужно)
# Строки 46, 70: timeout: 120000 → timeout: 300000
```

---

## 🔄 Обновление сервиса

```bash
cd /opt/eduplatform
git pull origin main

cd infra-converter/server
npm install

sudo systemctl restart converter
sudo systemctl status converter
```

---

## 📋 Checklist деплоя

См. `docs/DEPLOY.md` для полного чеклиста.

**Кратко:**
- ✅ VM создана (Ubuntu 20.04+, 2GB+ RAM)
- ✅ Порт 8787 открыт
- ✅ Системные зависимости установлены
- ✅ Node.js dependencies установлены
- ✅ `.env` настроен с правильными credentials
- ✅ Systemd service настроен
- ✅ Health check проходит
- ✅ Edge Function обновлена с IP VM

---

## 🔗 Связь с остальной системой

### Frontend
```
Не взаимодействует напрямую
```

### Supabase Edge Function
```typescript
// supabase/functions/presentation-convert/index.ts
const response = await fetch('http://VM_IP:8787/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lectureId })
});
```

### Supabase Storage
```
Bucket: presentations
Paths:
  - {lectureId}/source.pptx (input)
  - {lectureId}/slides/*.png (output)
```

### Supabase Database
```sql
-- Таблица presentations
UPDATE presentations 
SET status = 'ready', slides_data = {...}
WHERE lecture_id = ?
```

---

## 📞 Поддержка

**Логи сервиса:**
```bash
sudo journalctl -u converter -f
```

**Проверка здоровья:**
```bash
curl http://localhost:8787/health
```

**Тестовая конвертация:**
```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{"lectureId":"test-lecture-id"}'
```

---

## 📄 Лицензия

Часть образовательной платформы EduPortal.
