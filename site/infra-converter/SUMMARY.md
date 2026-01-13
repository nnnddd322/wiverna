# 📦 Infra-Converter - Complete Package

**Автономный сервис конвертации презентаций для деплоя на VM**

---

## 📁 Структура файлов

```
infra-converter/
│
├── server/                          # Node.js converter service
│   ├── index.js                    # Main server code (286 lines)
│   ├── package.json                # Dependencies
│   ├── .env.example                # Environment template
│   └── .gitignore                  # Git ignore rules
│
├── scripts/                         # Deployment & management scripts
│   ├── install.sh                  # System dependencies installer
│   ├── start.sh                    # Start service manually
│   ├── healthcheck.sh              # Health check utility
│   └── setup-systemd.sh            # Systemd service setup
│
├── docs/                            # Documentation
│   ├── DEPLOY.md                   # Full deployment checklist
│   └── ARCHITECTURE.md             # System architecture overview
│
├── README.md                        # Quick start guide
└── SUMMARY.md                       # This file
```

---

## 📋 Что скопировано из проекта

### Из `/converter/`

| Файл | Куда | Изменения |
|------|------|-----------|
| `index.js` | `server/index.js` | Без изменений |
| `package.json` | `server/package.json` | Без изменений |
| `.env.example` | `server/.env.example` | Без изменений |

### Новые файлы

| Файл | Назначение |
|------|-----------|
| `scripts/install.sh` | Установка системных зависимостей (Node.js, LibreOffice, poppler-utils) |
| `scripts/start.sh` | Запуск сервиса вручную |
| `scripts/healthcheck.sh` | Проверка здоровья сервиса |
| `scripts/setup-systemd.sh` | Настройка systemd service для автозапуска |
| `docs/DEPLOY.md` | Полный чеклист деплоя на VM |
| `docs/ARCHITECTURE.md` | Архитектура системы и API контракты |
| `README.md` | Быстрый старт и документация |
| `server/.gitignore` | Игнорирование node_modules, .env, логов |

---

## 🚀 Чеклист: "Залить на VM и запустить"

### ✅ Pre-Flight

- [ ] **VM готова**
  - Ubuntu 20.04+ / Debian 11+
  - 2GB+ RAM, 2+ CPU cores
  - 10GB+ disk space
  - Публичный IP адрес

- [ ] **SSH доступ**
  ```bash
  ssh user@VM_IP
  ```

- [ ] **Supabase credentials готовы**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

### 🔧 Deployment (5 минут)

#### 1. Клонировать репозиторий

```bash
cd /opt
sudo git clone <your-repo-url> eduplatform
sudo chown -R $USER:$USER eduplatform
cd eduplatform/infra-converter
```

#### 2. Установить системные зависимости

```bash
sudo chmod +x scripts/*.sh
sudo scripts/install.sh
```

**Проверка:**
```bash
node --version      # v18.x.x
libreoffice --version
pdftoppm -v
```

#### 3. Установить Node.js dependencies

```bash
cd server
npm install
```

#### 4. Настроить .env

```bash
cp .env.example .env
nano .env
```

**Заполнить:**
```env
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-ключ
PORT=8787
```

#### 5. Тестовый запуск

```bash
npm start
```

**В другом терминале:**
```bash
curl http://localhost:8787/health
# → {"status":"ok",...}
```

**Остановить:** `Ctrl+C`

#### 6. Настроить systemd

```bash
cd ..
sudo scripts/setup-systemd.sh
```

#### 7. Запустить service

```bash
sudo systemctl start converter
sudo systemctl status converter
```

**Проверка:**
```bash
# Должно быть: active (running)
```

#### 8. Проверить извне

```bash
# С вашего компьютера:
curl http://VM_IP:8787/health
# → {"status":"ok",...}
```

---

### 🔗 Post-Deployment

#### 9. Обновить Edge Function

**Файл:** `supabase/functions/presentation-convert/index.ts`

```typescript
const CONVERTER_URL = 'http://ВАШ_VM_IP:8787';
```

**Деплой:**
```bash
supabase functions deploy presentation-convert
```

#### 10. Тестовая конвертация

**Через frontend:**
1. Загрузить PPTX презентацию
2. Проверить статус в таблице `presentations`
3. Проверить слайды в Storage

**Логи на VM:**
```bash
sudo journalctl -u converter -f
```

---

## ✅ Verification Checklist

После деплоя проверьте:

- [ ] **Health check работает**
  ```bash
  curl http://VM_IP:8787/health
  # → {"status":"ok"}
  ```

- [ ] **Systemd service активен**
  ```bash
  sudo systemctl status converter
  # → active (running)
  ```

- [ ] **Логи чистые**
  ```bash
  sudo journalctl -u converter -n 100
  # → Нет ошибок
  ```

- [ ] **Порт 8787 слушается**
  ```bash
  sudo netstat -tlnp | grep 8787
  # → node ... LISTEN
  ```

- [ ] **Edge Function обновлена**
  - Проверить `CONVERTER_URL` в коде
  - Задеплоена в Supabase

- [ ] **Тестовая конвертация прошла**
  - PPTX загружен через frontend
  - Статус `presentations.status = 'ready'`
  - Слайды в Storage

---

## 🔐 Security Checklist

- [ ] **Firewall настроен**
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 8787/tcp # Converter
  sudo ufw enable
  ```

- [ ] **SSH ключи используются**
  ```bash
  cat ~/.ssh/authorized_keys
  ```

- [ ] **Service role key НЕ в git**
  ```bash
  cat server/.gitignore | grep .env
  # → .env должен быть в .gitignore
  ```

---

## 📊 Quick Reference

### Команды управления

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

# Логи (last 100)
sudo journalctl -u converter -n 100

# Health check
curl http://localhost:8787/health
```

### Пути

```
Код сервера:    /opt/eduplatform/infra-converter/server/
Скрипты:        /opt/eduplatform/infra-converter/scripts/
Systemd:        /etc/systemd/system/converter.service
.env файл:      /opt/eduplatform/infra-converter/server/.env
```

### API Endpoints

```
POST /convert    - Запустить конвертацию
GET  /health     - Проверка здоровья
```

---

## 🐛 Troubleshooting

### Сервис не стартует

```bash
# 1. Проверить логи
sudo journalctl -u converter -n 50

# 2. Проверить .env
cat /opt/eduplatform/infra-converter/server/.env

# 3. Запустить вручную
cd /opt/eduplatform/infra-converter/server
npm start
```

### Ошибка подключения к Supabase

```bash
# Тест подключения
cd /opt/eduplatform/infra-converter/server
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.storage.from('presentations').list().then(console.log);
"
```

### Конвертация зависает

```bash
# Проверить RAM
free -h
# Должно быть минимум 2GB

# Проверить процессы
ps aux | grep libreoffice
ps aux | grep pdftoppm
```

---

## 📚 Документация

### Основные файлы

- **`README.md`** - Быстрый старт, API endpoints, troubleshooting
- **`docs/DEPLOY.md`** - Полный чеклист деплоя с проверками
- **`docs/ARCHITECTURE.md`** - Архитектура системы, flow, контракты

### Скрипты

- **`scripts/install.sh`** - Установка всех системных зависимостей
- **`scripts/start.sh`** - Запуск сервиса вручную
- **`scripts/healthcheck.sh`** - Проверка здоровья сервиса
- **`scripts/setup-systemd.sh`** - Настройка systemd service

---

## 🔄 Обновление

```bash
cd /opt/eduplatform
git pull origin main

cd infra-converter/server
npm install

sudo systemctl restart converter
sudo systemctl status converter
```

---

## 📞 Support

**Логи:**
```bash
sudo journalctl -u converter -f
```

**Health check:**
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

## ✅ Final Checklist

**Деплой считается завершенным, если:**

- ✅ VM создана и доступна
- ✅ Все системные зависимости установлены
- ✅ Node.js dependencies установлены
- ✅ .env настроен с правильными credentials
- ✅ Systemd service создан и enabled
- ✅ Сервис запущен и active (running)
- ✅ Health check проходит (200 OK)
- ✅ Логи чистые, нет ошибок
- ✅ Порт 8787 доступен извне
- ✅ Edge Function обновлена с IP VM
- ✅ Тестовая конвертация прошла успешно
- ✅ Firewall настроен
- ✅ Автозапуск включен (systemctl enable)

---

## 🎯 Что НЕ изменилось

### Frontend
- Без изменений
- Продолжает работать как раньше

### Supabase Edge Function
- Нужно обновить только `CONVERTER_URL`
- Остальная логика без изменений

### Supabase Database
- Без изменений
- Таблица `presentations` та же

### Supabase Storage
- Без изменений
- Bucket `presentations` тот же

### API контракт
- Без изменений
- `POST /convert` с `{lectureId}`
- `GET /health`

---

**Версия:** 1.0.0  
**Дата:** 2026-01-13  
**Статус:** ✅ Готово к деплою
