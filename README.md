# 🪺 StudyNest

**Your Academic Life, Smarter with AI.**

[![Laravel](https://img.shields.io/badge/Laravel-13-red?logo=laravel&logoColor=white)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![pgvector](https://img.shields.io/badge/pgvector-0.8-2f6f4f?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI-8b5cf6)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

Platform pendamping akademik mahasiswa **all-in-one** yang menyatukan pengelolaan mata kuliah, materi kuliah (PDF, DOCX, PPTX, TXT, MD), asisten AI berbasis dokumen (RAG) dengan rujukan sumber, generator kuis AI, jadwal kuliah anti-bentrok, manajemen tugas, dan AI Study Planner dalam satu ekosistem terintegrasi.

---

## ✨ Fitur Utama

| Modul | Deskripsi |
|---|---|
| 📚 **Mata Kuliah** | Kelola mata kuliah semester berjalan sebagai hub semua modul |
| 📄 **Materi & Dokumen** | Upload PDF/DOCX/PPTX/TXT/MD dengan ekstraksi otomatis & chunking |
| 💬 **AI Assistant (RAG)** | Tanya jawab berbasis dokumen dengan **rujukan sumber** |
| 🧠 **AI Quiz Generator** | Buat latihan soal dari materi, lengkap dengan percobaan & regenerasi |
| 📅 **Smart Schedule** | Jadwal kuliah/praktikum dengan deteksi **anti-bentrok** otomatis |
| ✅ **Task Manager** | Lacak tugas & deadline dengan pengingat (reminder) |
| 🗓️ **AI Study Planner** | Rencana belajar otomatis yang memetakan jam kosong |
| 📊 **Dashboard** | Ringkasan kesiapan akademik & aktivitas harian |

---

## 🏗️ Arsitektur & Struktur Repository

```text
.
├── backend/              # Laravel 13 API + Sanctum + Queue + RAG & Academic Services
├── frontend/             # Next.js (App Router) + TypeScript + Tailwind CSS
├── docker-compose.yml    # PostgreSQL + pgvector container untuk development/production
├── .env.example          # Ringkasan variabel environment root
├── MASTER.md             # Master Project Document
├── MASTER_PROMPT.md      # Master Prompt Acuan Pengembangan
└── STUDYNEST_MASTER_BUNDLE.md # Bundle master prompt + dokumen
```

### Tech Stack

- **Backend:** Laravel 13, Sanctum (token auth), Queue + Job, PostgreSQL + pgvector
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **AI Provider:** Gemini (default) atau OpenAI — melalui lapisan abstraksi `backend/app/Services/AI/`
- **RAG Pipeline:** Ekstraksi dokumen → chunking → embedding → retrieval dengan rujukan sumber

---

## 🔧 Prasyarat

- **PHP** >= 8.3 (disarankan dengan ekstensi `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `fileinfo`, `zlib`, `xml`)
- **Composer** >= 2.x
- **Node.js** >= 20 & **npm**
- **PostgreSQL** >= 16 (opsional dengan ekstensi `pgvector`, tersedia fallback similarity bawaan jika `pgvector` belum terpasang)

---

## 🚀 Instalasi & Menjalankan Secara Lokal

### 1. Database PostgreSQL

Anda dapat menggunakan PostgreSQL lokal atau menjalankan container dengan `pgvector`:

```bash
docker compose up -d
```

Atau buat database lokal secara manual:

```sql
CREATE DATABASE studynest_ai;
CREATE DATABASE studynest_ai_test;
```

### 2. Backend (Laravel API)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
```

Opsional — isi sample data development (`mahasiswa@studynest.dev` / `StudyNestDemo123!`):

```bash
php artisan db:seed --class=DemoAcademicSeeder
```

Jalankan API server dan Queue Worker (untuk pemrosesan ekstraksi materi secara asinkron):

```bash
php artisan serve --host=127.0.0.1 --port=8010
php artisan queue:work
```

> Catatan: Untuk mode cepat saat development tanpa worker terpisah, ubah `QUEUE_CONNECTION=sync` pada `backend/.env`.

### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://127.0.0.1:3000`.

---

## 🤖 Konfigurasi AI Provider & Keamanan

Atur pada `backend/.env` (jangan pernah menyimpan API key di `frontend/`):

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Atau gunakan OpenAI:
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

- Lapisan abstraksi provider berada di `backend/app/Services/AI/`.
- Jika API key belum diisi, endpoint AI akan mengembalikan status `503` dengan pesan eksplisit tanpa memalsukan jawaban.

---

## 📄 Document Processing Pipeline

Format file yang didukung dan divalidasi:

- **PDF** (`.pdf`) — ekstraksi teks per halaman via `smalot/pdfparser`
- **Word** (`.docx`) — ekstraksi paragraf XML via `SimpleZipReader`
- **PowerPoint** (`.pptx`) — ekstraksi teks per slide via `SimpleZipReader`
- **Plain Text / Markdown** (`.txt`, `.md`)

Alur: Upload (`POST /api/materials`) → validasi MIME & ukuran → simpan ke storage privat per user (`storage/app/private/users/{id}/materials`) → `ProcessMaterialJob` → ekstraksi per halaman/slide → chunking → embedding → simpan ke `document_chunks` → status `completed` / `failed` (dapat diulang via `POST /api/materials/{id}/retry`).

---

## 🔌 Ringkasan API Endpoints

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/profile`, `POST /api/auth/logout`
- **Dashboard:** `GET /api/dashboard`
- **My Courses:** `GET|POST /api/courses`, `GET|PATCH|DELETE /api/courses/{id}`
- **My Materials:** `GET|POST /api/materials`, `GET|DELETE /api/materials/{id}`, `GET /api/materials/{id}/download`, `POST /api/materials/{id}/retry`, `POST /api/materials/{id}/summarize`
- **AI Assistant:** `GET /api/ai/status`, `GET|POST /api/conversations`, `GET|DELETE /api/conversations/{id}`, `POST /api/conversations/{id}/messages`
- **AI Quiz:** `GET /api/quizzes`, `POST /api/quizzes/generate`, `GET|DELETE /api/quizzes/{id}`, `POST /api/quizzes/{id}/attempts`, `POST /api/quizzes/{id}/questions/{qid}/regenerate`
- **Smart Schedule:** `GET|POST /api/schedules`, `PATCH|DELETE /api/schedules/{id}`
- **Task Manager:** `GET|POST /api/tasks`, `PATCH|DELETE /api/tasks/{id}`
- **Reminders:** `GET /api/reminders`, `POST /api/reminders/{id}/dismiss`
- **AI Study Planner:** `GET /api/study-plans`, `POST /api/study-plans/generate`, `GET|DELETE /api/study-plans/{id}`, `POST /api/study-plans/{id}/approve`, `PATCH /api/study-sessions/{id}`

---

## 🧪 Pengujian & Verifikasi

### Backend Tests

```bash
cd backend
php artisan test
```

### Frontend Lint, Type-Check & Build

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

---

## 🚢 Deployment Checklist

1. Set `APP_ENV=production`, `APP_DEBUG=false`, dan `APP_KEY` yang kuat pada backend.
2. Gunakan HTTPS dan atur `CORS_ALLOWED_ORIGINS` serta `SANCTUM_STATEFUL_DOMAINS` ke domain produksi.
3. Aktifkan PostgreSQL + `pgvector` (jalankan ulang `php artisan migrate --force`).
4. Konfigurasikan object storage S3 (`FILESYSTEM_DISK=s3`) dan worker queue (`php artisan queue:work --tries=2`) melalui Supervisor/systemd.
5. Build frontend dengan `npm run build` dan jalankan dengan `npm run start`.

---

## 📚 Dokumentasi Tambahan

- **MASTER.md** — Master Project Document (visi, fitur, UX, arsitektur, data, roadmap)
- **MASTER_PROMPT.md** — Master Prompt acuan pengembangan
- **STUDYNEST_MASTER_BUNDLE.md** — Bundle keduanya

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License** — silakan gunakan, modifikasi, dan kembangkan.
