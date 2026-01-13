# 🏗 Architecture Overview

**Presentation Converter Infrastructure**

---

## 📊 System Flow

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ 1. Upload PPTX
       ↓
┌─────────────────────┐
│  Supabase Storage   │
│  presentations/     │
│  {lectureId}/       │
│  source.pptx        │
└──────┬──────────────┘
       │ 2. Trigger
       ↓
┌─────────────────────┐
│  Edge Function      │
│  presentation-      │
│  convert            │
└──────┬──────────────┘
       │ 3. POST /convert
       ↓
┌─────────────────────┐
│  VM Converter       │ ← YOU ARE HERE
│  (Node.js)          │
│  Port 8787          │
└──────┬──────────────┘
       │ 4. Process
       ↓
┌─────────────────────┐
│  PPTX → PDF → PNG   │
│  (LibreOffice +     │
│   pdftoppm)         │
└──────┬──────────────┘
       │ 5. Upload slides
       ↓
┌─────────────────────┐
│  Supabase Storage   │
│  presentations/     │
│  {lectureId}/       │
│  slides/001.png     │
│  slides/002.png     │
│  ...                │
└──────┬──────────────┘
       │ 6. Update status
       ↓
┌─────────────────────┐
│  Supabase DB        │
│  presentations      │
│  status='ready'     │
│  slides_data={...}  │
└─────────────────────┘
```

---

## 🔌 API Contract

### Edge Function → Converter

**Endpoint:** `POST http://VM_IP:8787/convert`

**Request:**
```json
{
  "lectureId": "uuid-of-lecture"
}
```

**Response (immediate):**
```json
{
  "success": true,
  "message": "Conversion started",
  "lectureId": "uuid-of-lecture"
}
```

**Process:**
- Response возвращается сразу (200 OK)
- Конвертация идет в фоне (async)
- Статус отслеживается через таблицу `presentations`

---

## 🗄 Database Schema

### Table: `presentations`

```sql
CREATE TABLE presentations (
  id UUID PRIMARY KEY,
  lecture_id UUID UNIQUE NOT NULL,
  status TEXT NOT NULL,  -- 'processing' | 'ready' | 'error'
  slides_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `slides_data` Format

```json
{
  "pageCount": 20,
  "slides": [
    {
      "index": 1,
      "path": "lecture-uuid/slides/001.png",
      "width": 1920,
      "height": 1080
    },
    {
      "index": 2,
      "path": "lecture-uuid/slides/002.png",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

---

## 📦 Storage Structure

### Bucket: `presentations`

```
presentations/
├── {lectureId-1}/
│   ├── source.pptx          # Original uploaded file
│   └── slides/
│       ├── 001.png          # Slide 1
│       ├── 002.png          # Slide 2
│       └── ...
├── {lectureId-2}/
│   ├── source.pptx
│   └── slides/
│       └── ...
```

**Naming convention:**
- Source: `{lectureId}/source.pptx`
- Slides: `{lectureId}/slides/{index}.png` (zero-padded, 3 digits)

---

## 🔄 Conversion Pipeline

### Stage 1: Download
```javascript
const { data } = await supabase.storage
  .from('presentations')
  .download(`${lectureId}/source.pptx`);
```

### Stage 2: PPTX → PDF
```bash
libreoffice --headless --convert-to pdf --outdir /tmp source.pptx
```

**Output:** `source.pdf`

### Stage 3: PDF → PNG
```bash
pdftoppm -png -r 150 source.pdf slide
```

**Output:** `slide-01.png`, `slide-02.png`, ...

**Resolution:** 150 DPI (оптимально для веб)

### Stage 4: Upload
```javascript
for (const pngPath of pngPaths) {
  await supabase.storage
    .from('presentations')
    .upload(`${lectureId}/slides/${index}.png`, fileBuffer);
}
```

### Stage 5: Update DB
```javascript
await supabase
  .from('presentations')
  .update({
    status: 'ready',
    slides_data: { pageCount, slides }
  })
  .eq('lecture_id', lectureId);
```

---

## 🛡 Error Handling

### Conversion Errors

**If any stage fails:**
```javascript
await supabase
  .from('presentations')
  .update({
    status: 'error',
    error_message: error.message
  })
  .eq('lecture_id', lectureId);
```

**Temp files cleanup:**
```javascript
finally {
  await cleanupTempFiles(workDir);
}
```

### Timeouts

- **LibreOffice:** 2 minutes
- **pdftoppm:** 2 minutes

**Configurable in `index.js`:**
```javascript
timeout: 120000  // milliseconds
```

---

## 🔐 Security

### Authentication

**Edge Function → Converter:**
- No auth currently (VM IP whitelisting)
- TODO: Add `Authorization: Bearer SECRET` header

### Supabase Access

**Service Role Key:**
- Full access to Storage and Database
- Stored in `.env` (NOT in git)
- Required for:
  - Downloading PPTX
  - Uploading PNG slides
  - Updating presentation status

### File System

**Temp directory:** `/tmp/converter/{lectureId}/`
- Created per conversion
- Cleaned up after completion
- Isolated per lecture

---

## 📈 Performance

### Resource Usage

**Per conversion:**
- **RAM:** ~500MB - 1GB (LibreOffice)
- **CPU:** 1-2 cores (peak during conversion)
- **Disk:** ~50MB temp files
- **Time:** 10-60 seconds (depends on PPTX size)

### Concurrency

**Current:** Sequential (one conversion at a time)
**Reason:** LibreOffice headless не thread-safe

**Future improvement:**
- Queue system (Bull/BullMQ)
- Multiple worker processes
- Load balancing

### Optimization

**Current settings:**
- Resolution: 150 DPI
- Format: PNG (lossless)
- Compression: Default

**Possible improvements:**
- WebP format (smaller size)
- Adaptive resolution
- Progressive upload

---

## 🔧 Dependencies

### System

| Package | Purpose | Version |
|---------|---------|---------|
| Node.js | Runtime | 18+ |
| LibreOffice | PPTX → PDF | Latest |
| poppler-utils | PDF → PNG | Latest |
| Fonts | Text rendering | DejaVu, Liberation |

### Node.js

| Package | Purpose | Version |
|---------|---------|---------|
| express | HTTP server | ^4.22.1 |
| @supabase/supabase-js | Supabase client | ^2.90.1 |
| cors | CORS middleware | ^2.8.5 |
| dotenv | Environment vars | ^16.6.1 |

---

## 🚀 Deployment Options

### Option 1: Systemd (Recommended)

**Pros:**
- Auto-restart on crash
- Logs via journalctl
- Starts on boot

**Setup:**
```bash
sudo scripts/setup-systemd.sh
sudo systemctl start converter
```

### Option 2: PM2

**Pros:**
- Process management
- Cluster mode
- Monitoring

**Setup:**
```bash
npm install -g pm2
pm2 start index.js --name converter
pm2 save
pm2 startup
```

### Option 3: Docker

**Pros:**
- Isolated environment
- Easy scaling
- Reproducible

**Setup:**
```bash
docker build -t converter .
docker run -d -p 8787:8787 --env-file .env converter
```

---

## 📊 Monitoring

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "presentation-converter",
  "timestamp": "2026-01-13T12:00:00.000Z"
}
```

### Logs

**Systemd:**
```bash
sudo journalctl -u converter -f
```

**PM2:**
```bash
pm2 logs converter
```

**Docker:**
```bash
docker logs -f converter
```

### Metrics

**TODO:**
- Conversion count
- Average conversion time
- Error rate
- Queue length

---

## 🔄 Scaling

### Vertical Scaling

**Increase VM resources:**
- More RAM → handle larger PPTX
- More CPU → faster conversion
- More disk → more concurrent conversions

### Horizontal Scaling

**Multiple VMs:**
1. Deploy converter on multiple VMs
2. Load balancer in front
3. Edge Function round-robin

**Challenges:**
- State management (queue)
- Distributed locking
- Health checks

---

## 🐛 Known Limitations

1. **Sequential processing**
   - One conversion at a time
   - No queue system

2. **No retry mechanism**
   - Failed conversions stay in 'error' state
   - Manual retry required

3. **Fixed resolution**
   - 150 DPI for all slides
   - No adaptive quality

4. **No progress tracking**
   - Only 'processing' or 'ready'
   - No percentage complete

5. **No authentication**
   - VM IP whitelisting only
   - No API key validation

---

## 🔮 Future Improvements

### Short-term

- [ ] Add authentication (Bearer token)
- [ ] Implement retry mechanism
- [ ] Add progress tracking
- [ ] Better error messages

### Medium-term

- [ ] Queue system (Bull/BullMQ)
- [ ] Multiple workers
- [ ] Metrics & monitoring
- [ ] WebP format support

### Long-term

- [ ] Horizontal scaling
- [ ] Kubernetes deployment
- [ ] CDN integration
- [ ] Video support (MP4 → frames)

---

## 📚 References

### External Dependencies

- [LibreOffice Headless](https://wiki.documentfoundation.org/Faq/General/007)
- [poppler-utils (pdftoppm)](https://poppler.freedesktop.org/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Express.js](https://expressjs.com/)

### Internal Documentation

- `README.md` - Quick start guide
- `DEPLOY.md` - Deployment checklist
- `ARCHITECTURE.md` - This file

---

**Last updated:** 2026-01-13
