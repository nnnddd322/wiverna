# 📋 Deployment Checklist

**Полный чеклист для деплоя Presentation Converter на VM**

---

## ✅ Pre-Deployment

### 1. VM Provisioning

- [ ] **VM создана**
  - OS: Ubuntu 20.04+ или Debian 11+
  - RAM: минимум 2GB (рекомендуется 4GB)
  - CPU: минимум 2 cores
  - Disk: минимум 10GB свободного места
  - Публичный IP адрес

- [ ] **SSH доступ настроен**
  ```bash
  ssh user@VM_IP
  ```

- [ ] **Firewall настроен**
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 8787/tcp # Converter
  sudo ufw enable
  sudo ufw status
  ```

### 2. Supabase Credentials

- [ ] **Получены credentials**
  - `SUPABASE_URL` (из Supabase Dashboard → Settings → API)
  - `SUPABASE_SERVICE_ROLE_KEY` (НЕ anon key!)

- [ ] **Bucket `presentations` создан**
  - Supabase Dashboard → Storage → Create bucket
  - Name: `presentations`
  - Public: Yes (или настроить RLS)

- [ ] **Таблица `presentations` существует**
  ```sql
  -- Должна иметь поля:
  -- lecture_id, status, slides_data, error_message
  ```

---

## 🚀 Deployment Steps

### Step 1: Подключиться к VM

```bash
ssh user@VM_IP
```

### Step 2: Клонировать репозиторий

```bash
cd /opt
sudo git clone <your-repo-url> eduplatform
sudo chown -R $USER:$USER eduplatform
cd eduplatform/infra-converter
```

### Step 3: Установить системные зависимости

```bash
sudo chmod +x scripts/*.sh
sudo scripts/install.sh
```

**Проверка:**
```bash
node --version    # Должно быть v18.x.x
libreoffice --version
pdftoppm -v
```

### Step 4: Установить Node.js dependencies

```bash
cd server
npm install
```

**Проверка:**
```bash
ls node_modules/@supabase/supabase-js  # Должна существовать
```

### Step 5: Настроить .env

```bash
cp .env.example .env
nano .env
```

**Заполнить:**
```env
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-ключ
PORT=8787
PRESENTATIONS_BUCKET=presentations
```

**Проверка:**
```bash
cat .env | grep SUPABASE_URL
# Должен показать правильный URL
```

### Step 6: Тестовый запуск

```bash
npm start
```

**В другом терминале:**
```bash
curl http://localhost:8787/health
# Ожидается: {"status":"ok",...}
```

**Остановить:** `Ctrl+C`

### Step 7: Настроить systemd service

```bash
cd ..
sudo scripts/setup-systemd.sh
```

**Проверка:**
```bash
sudo systemctl status converter
# Должно быть: enabled
```

### Step 8: Запустить service

```bash
sudo systemctl start converter
sudo systemctl status converter
```

**Проверка:**
```bash
# Должно быть: active (running)
```

### Step 9: Проверить логи

```bash
sudo journalctl -u converter -n 50
```

**Ожидается:**
```
Converter service running on port 8787
Supabase URL: https://...
Bucket: presentations
```

### Step 10: Внешняя проверка

**С вашего компьютера:**
```bash
curl http://VM_IP:8787/health
# Должно вернуть: {"status":"ok",...}
```

---

## 🔗 Post-Deployment

### 1. Обновить Edge Function

**Файл:** `supabase/functions/presentation-convert/index.ts`

```typescript
const CONVERTER_URL = 'http://ВАШ_VM_IP:8787';
```

**Задеплоить:**
```bash
supabase functions deploy presentation-convert
```

### 2. Тестовая конвертация

**Через Edge Function:**
```bash
curl -X POST https://ваш-проект.supabase.co/functions/v1/presentation-convert \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lectureId":"test-lecture-id"}'
```

**Проверить логи на VM:**
```bash
sudo journalctl -u converter -f
```

### 3. Настроить автозапуск

```bash
sudo systemctl enable converter
```

**Проверка:**
```bash
sudo systemctl is-enabled converter
# Должно вернуть: enabled
```

---

## 🔍 Verification Checklist

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

- [ ] **Логи чистые (нет ошибок)**
  ```bash
  sudo journalctl -u converter -n 100
  ```

- [ ] **Порт 8787 слушается**
  ```bash
  sudo netstat -tlnp | grep 8787
  # → node ... LISTEN
  ```

- [ ] **Подключение к Supabase работает**
  ```bash
  # Проверить в логах при старте:
  # "Supabase URL: https://..."
  ```

- [ ] **Edge Function обновлена**
  - Проверить `CONVERTER_URL` в коде
  - Задеплоена в Supabase

- [ ] **Тестовая конвертация прошла**
  - Загрузить PPTX через frontend
  - Проверить статус в таблице `presentations`
  - Проверить слайды в Storage

---

## 🛡 Security Checklist

- [ ] **Firewall настроен**
  ```bash
  sudo ufw status
  # → 22/tcp, 8787/tcp ALLOW
  ```

- [ ] **SSH ключи используются (не пароли)**
  ```bash
  cat ~/.ssh/authorized_keys
  ```

- [ ] **Service role key НЕ в git**
  ```bash
  cat .gitignore | grep .env
  # → .env должен быть в .gitignore
  ```

- [ ] **Логи не содержат sensitive data**
  ```bash
  sudo journalctl -u converter -n 100 | grep -i "key\|password\|secret"
  # → Не должно быть ключей
  ```

---

## 🔄 Maintenance

### Обновление кода

```bash
cd /opt/eduplatform
git pull origin main
cd infra-converter/server
npm install
sudo systemctl restart converter
sudo systemctl status converter
```

### Просмотр логов

```bash
# Live logs
sudo journalctl -u converter -f

# Последние 100 строк
sudo journalctl -u converter -n 100

# За последний час
sudo journalctl -u converter --since "1 hour ago"
```

### Перезапуск сервиса

```bash
sudo systemctl restart converter
```

### Остановка сервиса

```bash
sudo systemctl stop converter
```

### Проверка статуса

```bash
sudo systemctl status converter
```

---

## 🐛 Troubleshooting

### Сервис не стартует

**1. Проверить логи:**
```bash
sudo journalctl -u converter -n 50
```

**2. Проверить .env:**
```bash
cat /opt/eduplatform/infra-converter/server/.env
```

**3. Проверить зависимости:**
```bash
cd /opt/eduplatform/infra-converter/server
npm install
```

**4. Запустить вручную для отладки:**
```bash
npm start
```

### Ошибка подключения к Supabase

**1. Проверить credentials:**
```bash
cat .env | grep SUPABASE
```

**2. Тест подключения:**
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.storage.from('presentations').list().then(console.log);
"
```

### Конвертация зависает

**1. Проверить RAM:**
```bash
free -h
# Должно быть минимум 2GB
```

**2. Проверить процессы:**
```bash
ps aux | grep libreoffice
ps aux | grep pdftoppm
```

**3. Увеличить timeout (если нужно):**
```javascript
// В index.js, строки 46 и 70:
timeout: 120000 → timeout: 300000
```

### Порт занят

```bash
sudo netstat -tlnp | grep 8787
# Если занят другим процессом:
sudo kill -9 <PID>
```

---

## 📊 Monitoring

### Health Check Script

```bash
#!/bin/bash
# /opt/eduplatform/infra-converter/scripts/healthcheck.sh

CONVERTER_URL="http://localhost:8787"
response=$(curl -s -o /dev/null -w "%{http_code}" "$CONVERTER_URL/health")

if [ "$response" = "200" ]; then
  echo "✓ Converter is healthy"
  exit 0
else
  echo "✗ Converter is unhealthy (HTTP $response)"
  exit 1
fi
```

### Cron для мониторинга

```bash
# Добавить в crontab:
*/5 * * * * /opt/eduplatform/infra-converter/scripts/healthcheck.sh || echo "Converter down!" | mail -s "Alert" admin@example.com
```

---

## 📝 Quick Reference

### Команды

| Действие | Команда |
|----------|---------|
| Запустить | `sudo systemctl start converter` |
| Остановить | `sudo systemctl stop converter` |
| Перезапустить | `sudo systemctl restart converter` |
| Статус | `sudo systemctl status converter` |
| Логи (live) | `sudo journalctl -u converter -f` |
| Логи (last 100) | `sudo journalctl -u converter -n 100` |
| Health check | `curl http://localhost:8787/health` |

### Пути

| Что | Путь |
|-----|------|
| Код сервера | `/opt/eduplatform/infra-converter/server/` |
| Скрипты | `/opt/eduplatform/infra-converter/scripts/` |
| Systemd service | `/etc/systemd/system/converter.service` |
| .env файл | `/opt/eduplatform/infra-converter/server/.env` |

### Порты

| Сервис | Порт |
|--------|------|
| Converter API | 8787 |
| SSH | 22 |

---

## ✅ Final Checklist

**Перед тем как считать деплой завершенным:**

- [ ] VM создана и доступна по SSH
- [ ] Все системные зависимости установлены
- [ ] Node.js dependencies установлены
- [ ] .env настроен с правильными credentials
- [ ] Systemd service создан и enabled
- [ ] Сервис запущен и active
- [ ] Health check проходит (200 OK)
- [ ] Логи чистые, нет ошибок
- [ ] Порт 8787 доступен извне
- [ ] Edge Function обновлена с IP VM
- [ ] Тестовая конвертация прошла успешно
- [ ] Firewall настроен
- [ ] Автозапуск включен

**Если все пункты выполнены — деплой завершен! 🎉**
