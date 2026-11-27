# STUDYNEST --- MASTER PROJECT DOCUMENT

> **Product:** StudyNest\
> **Category:** All-in-One Student Assistant\
> **Tagline:** Your Academic Life, Smarter with AI.\
> **Document purpose:** Dokumen acuan utama produk, fitur, UX,
> arsitektur, data, dan roadmap pengembangan.

------------------------------------------------------------------------

## 1. Product Overview

StudyNest adalah platform pendamping akademik mahasiswa yang
menggabungkan AI Academic Assistant dan Smart Student Planner dalam satu
ekosistem.

StudyNest membantu mahasiswa mengelola mata kuliah, memahami materi,
membuat latihan soal, mengatur jadwal, memantau deadline, dan
merencanakan kegiatan belajar.

### Product Vision

Menjadi satu ruang kerja akademik yang membantu mahasiswa belajar lebih
terarah, mengelola waktu, dan memahami progres perkuliahan.

### Product Mission

1.  Mempermudah akses dan pemahaman materi kuliah.
2.  Mengurangi beban pengelolaan aktivitas akademik.
3.  Membantu mahasiswa mempersiapkan ujian dan tugas.
4.  Memberikan rekomendasi belajar berdasarkan data akademik pengguna.
5.  Menyatukan aktivitas akademik dalam satu platform.

### Target Users

Mahasiswa dari berbagai jurusan dan perguruan tinggi. Setiap pengguna
memiliki akun serta data akademik pribadi. Integrasi sistem kampus dapat
menjadi pengembangan lanjutan, bukan prasyarat MVP.

------------------------------------------------------------------------

## 2. Product Principles

-   **Student-first:** semua alur harus mudah dipahami mahasiswa.
-   **Connected modules:** mata kuliah menjadi penghubung antarmodul.
-   **AI with evidence:** jawaban berbasis dokumen harus menyertakan
    sumber yang tersedia.
-   **User control:** AI memberi rekomendasi, pengguna tetap memutuskan.
-   **Privacy by design:** data dan dokumen pengguna tidak boleh terbuka
    ke pengguna lain.
-   **Real functionality:** setiap tombol dan fitur inti harus
    benar-benar bekerja.
-   **Responsive:** pengalaman baik di desktop, tablet, dan ponsel.

------------------------------------------------------------------------

## 3. Information Architecture

Navigasi utama:

1.  Dashboard
2.  AI Assistant
3.  My Materials
4.  AI Quiz
5.  Smart Schedule
6.  Task Manager
7.  AI Study Planner
8.  My Courses
9.  Settings / Profile

### 3.1 Dashboard

Menampilkan: - Sapaan personal. - Ringkasan jadwal hari ini. - Tugas
dengan deadline terdekat. - Pengingat praktikum dan ujian. - Progress
belajar. - Aktivitas terbaru. - Rekomendasi tindakan AI.

Dashboard harus menggunakan data aktual. Jika belum ada data, tampilkan
empty state dan ajakan untuk menambahkan mata kuliah, jadwal, materi,
atau tugas.

### 3.2 AI Academic Assistant

Fungsi: - Upload dokumen pembelajaran. - Ringkasan dokumen. - Penjelasan
materi. - Tanya jawab berdasarkan dokumen. - Riwayat percakapan. -
Referensi dokumen/halaman jika metadata sumber tersedia.

Mode penjelasan yang disarankan: - Ringkas. - Bertahap untuk pemula. -
Mendalam. - Dengan contoh. - Persiapan ujian.

### 3.3 My Materials

Fungsi: - Folder atau koleksi berdasarkan mata kuliah. - Upload dan
pengelolaan file. - Pencarian dan filter. - Metadata dan status
pemrosesan. - Preview/unduh dokumen. - Hapus dokumen dengan konfirmasi.

Status dokumen: - `queued` - `processing` - `completed` - `failed`

### 3.4 AI Quiz

Fungsi: - Generate kuis dari materi terpilih. - Pilihan ganda dan
essay. - Pengaturan jumlah dan tingkat kesulitan. - Pengerjaan kuis. -
Penilaian. - Pembahasan. - Riwayat attempt dan analisis topik.

### 3.5 Smart Schedule

Fungsi: - Tampilan kalender dan daftar. - Jadwal kuliah berulang. -
Jadwal praktikum, ujian, dan kegiatan akademik. - Tambah, ubah, hapus. -
Deteksi bentrok. - Pengingat.

Perhatikan zona waktu pengguna dan simpan waktu secara konsisten.

### 3.6 Task Manager

Data tugas: - Judul. - Deskripsi. - Mata kuliah. - Deadline. -
Prioritas. - Status. - Estimasi durasi (opsional).

Status: - `todo` - `in_progress` - `completed`

Fungsi: - Filter berdasarkan status, mata kuliah, prioritas, dan
deadline. - Urutkan berdasarkan urgensi. - Pengingat sebelum deadline. -
Riwayat tugas selesai.

### 3.7 AI Study Planner

Input yang dapat digunakan: - Jadwal kuliah dan kegiatan. - Deadline
tugas. - Tanggal ujian. - Materi yang perlu dipelajari. - Target
belajar. - Preferensi durasi dan waktu belajar.

Output: - Sesi belajar yang disarankan. - Prioritas topik. - Estimasi
durasi. - Alasan rekomendasi. - Opsi menerima, mengedit, atau menolak
rencana.

AI tidak boleh menimpa jadwal yang sudah ada tanpa persetujuan.

### 3.8 My Courses

Setiap mata kuliah menjadi pusat data yang menghubungkan: - Informasi
mata kuliah. - Materi. - Jadwal. - Tugas. - Kuis. - Sesi belajar. -
Progres.

Field awal: - `name` wajib. - `code` opsional. - `credits` opsional. -
`lecturer` opsional. - `semester` opsional. - `color` opsional.

------------------------------------------------------------------------

## 4. Core User Journeys

### Journey A --- Belajar dari dokumen

1.  Pengguna masuk ke My Courses.
2.  Memilih mata kuliah.
3.  Upload dokumen.
4.  Sistem memvalidasi dan memproses file.
5.  Pengguna membuka AI Assistant.
6.  Memilih dokumen sebagai konteks.
7.  Meminta ringkasan, penjelasan, atau bertanya.
8.  AI menjawab dengan sumber yang relevan.

### Journey B --- Membuat latihan ujian

1.  Pengguna memilih mata kuliah.
2.  Memilih satu atau beberapa materi.
3.  Membuka AI Quiz.
4.  Menentukan tipe, jumlah, dan kesulitan soal.
5.  AI menghasilkan soal.
6.  Pengguna mengerjakan.
7.  Sistem menampilkan skor dan pembahasan.
8.  Hasil tersimpan dalam riwayat.

### Journey C --- Mengatur tugas

1.  Pengguna membuat tugas.
2.  Memilih mata kuliah dan deadline.
3.  Menentukan prioritas dan estimasi durasi.
4.  Task Manager menampilkan tugas.
5.  Reminder dikirim sesuai preferensi.
6.  Pengguna memperbarui status hingga selesai.

### Journey D --- Membuat rencana belajar

1.  Pengguna memiliki materi, jadwal, tugas, dan tanggal ujian.
2.  Pengguna meminta rencana belajar.
3.  AI menganalisis ketersediaan waktu dan urgensi.
4.  AI menyarankan sesi belajar.
5.  Pengguna meninjau dan menyetujui/mengubah rencana.
6.  Sesi masuk ke Study Planner dan Dashboard.

------------------------------------------------------------------------

## 5. UI/UX Direction

### Visual Identity

-   Base: dark navy.
-   Accent: violet dan blue.
-   Surface: slate/navy dengan kontras yang cukup.
-   Typography: modern, mudah dibaca.
-   Style: clean, premium, minimal, productivity-focused.

### Layout

**Desktop** - Sidebar navigasi. - Header dengan pencarian/aksi cepat dan
profil. - Konten utama berbasis grid. - Dashboard menonjolkan agenda dan
prioritas.

**Mobile** - Navigasi ringkas. - Konten satu kolom. - Kalender dan tabel
memiliki tampilan mobile yang sesuai. - Aksi utama mudah dijangkau.

### Component Standards

Gunakan komponen konsisten untuk: - Button. - Input dan select. -
Modal/dialog. - Dropdown. - Cards. - Tables. - Tabs. - Badges. -
Toast/notification. - Calendar. - Empty states. - Loading skeleton. -
Error states.

Jangan gunakan data dummy sebagai data produksi. Seed data hanya untuk
development dan harus jelas ditandai.

------------------------------------------------------------------------

## 6. Recommended Technical Architecture

Stack acuan: - Frontend: Next.js + TypeScript. - UI: Tailwind CSS +
shadcn/ui. - Backend: Laravel API. - Database: PostgreSQL. - Vector
search: pgvector. - AI: provider adapter untuk Gemini/OpenAI. - Document
processing: Python service bila diperlukan. - Authentication: Laravel
Sanctum atau pendekatan aman sesuai deployment. - Queue: Laravel
Queue. - Storage: local saat development, object storage saat
production.

### High-level Architecture

``` text
Browser / Mobile Web
        |
        v
Next.js Frontend
        |
        v
Laravel API
  |      |       |
  |      |       +---- Queue / Reminder Jobs
  |      |
  |      +------------ AI Provider Service
  |                       |
  |                       +---- Gemini / OpenAI
  |
  +---------------------- PostgreSQL + pgvector
  |
  +---------------------- File Storage
                              |
                              v
                       Document Processing
```

Gunakan API contract yang konsisten, validasi request, autentikasi,
authorization, dan error response yang terstruktur.

------------------------------------------------------------------------

## 7. Initial Data Model

Tabel inti yang disarankan:

  Table             Purpose
  ----------------- -----------------------------
  users             Akun pengguna
  courses           Mata kuliah milik pengguna
  materials         Metadata dokumen
  document_chunks   Potongan teks dan embedding
  conversations     Sesi percakapan AI
  messages          Pesan pengguna dan AI
  quizzes           Konfigurasi kuis
  questions         Soal kuis
  quiz_attempts     Percobaan pengerjaan
  quiz_answers      Jawaban per soal
  schedules         Jadwal akademik
  tasks             Tugas mahasiswa
  reminders         Pengingat
  study_plans       Rencana belajar
  study_sessions    Sesi belajar

### Relationship Summary

-   User memiliki banyak Courses.
-   Course memiliki banyak Materials.
-   Material memiliki banyak Document Chunks.
-   User memiliki banyak Conversations.
-   Conversation memiliki banyak Messages.
-   Course dapat memiliki banyak Quizzes dan Tasks.
-   Quiz memiliki banyak Questions.
-   User memiliki banyak Quiz Attempts.
-   User memiliki banyak Schedules, Reminders, dan Study Plans.
-   Study Plan memiliki banyak Study Sessions.

Semua tabel data privat harus memiliki ownership yang jelas, baik
langsung melalui `user_id` maupun melalui relasi yang tervalidasi.

------------------------------------------------------------------------

## 8. AI and RAG Requirements

### Document Pipeline

1.  Upload file.
2.  Validasi tipe, ukuran, dan kepemilikan.
3.  Simpan file secara aman.
4.  Ekstrak teks.
5.  Pecah teks menjadi chunks.
6.  Buat embedding.
7.  Simpan chunks dan metadata sumber.
8.  Tandai status pemrosesan.

### Retrieval and Answering

1.  Terima pertanyaan.
2.  Pastikan pengguna berhak mengakses dokumen.
3.  Cari chunks yang relevan.
4.  Kirim konteks relevan ke model AI.
5.  Susun jawaban dengan sumber.
6.  Simpan riwayat percakapan.

### AI Guardrails

-   Jangan mengarang isi dokumen.
-   Jangan mengarang halaman atau kutipan.
-   Nyatakan jika sumber tidak cukup.
-   Bedakan jawaban berdasarkan dokumen dan pengetahuan umum.
-   Jangan membocorkan dokumen pengguna lain.
-   Simpan API key di backend.
-   Terapkan rate limit dan batas token/biaya.

------------------------------------------------------------------------

## 9. Notifications and Reminders

Jenis pengingat: - Jadwal kuliah. - Praktikum. - Ujian. - Deadline
tugas. - Sesi belajar.

Preferensi pengguna: - Jenis pengingat. - Waktu sebelum
acara/deadline. - Kanal notifikasi yang tersedia. - Zona waktu.

Notifikasi harus dapat dinonaktifkan atau diatur oleh pengguna. Hindari
mengirim pengingat ganda.

------------------------------------------------------------------------

## 10. Security and Privacy

-   Hash password menggunakan mekanisme standar framework.
-   Terapkan authorization untuk seluruh resource privat.
-   Validasi MIME type dan ukuran file.
-   Lindungi endpoint upload.
-   Jangan menyimpan API secret di frontend.
-   Gunakan HTTPS di production.
-   Terapkan rate limiting.
-   Batasi akses file berdasarkan pemilik.
-   Catat error tanpa membocorkan secret atau isi dokumen sensitif.
-   Sediakan penghapusan data pengguna sesuai kebijakan produk.

------------------------------------------------------------------------

## 11. Development Roadmap

### Phase 1 --- Foundation

-   Setup repository dan environment.
-   Authentication.
-   Design system.
-   App layout dan responsive navigation.
-   My Courses.
-   Dashboard awal.

### Phase 2 --- Materials and AI

-   Upload dan penyimpanan dokumen.
-   Document processing.
-   My Materials.
-   AI Summarizer.
-   AI Tutor.
-   RAG Chat.

### Phase 3 --- Assessment

-   AI Quiz Generator.
-   Quiz player.
-   Scoring and explanation.
-   Quiz history.

### Phase 4 --- Academic Productivity

-   Smart Schedule.
-   Task Manager.
-   Reminder jobs.
-   Notification preferences.

### Phase 5 --- Intelligence and Integration

-   AI Study Planner.
-   Integrasi jadwal, tugas, materi, dan ujian.
-   Progress analytics.
-   Dashboard recommendations.

### Phase 6 --- Quality and Release

-   Integration tests.
-   Authorization tests.
-   Performance review.
-   Accessibility review.
-   Deployment documentation.
-   Backup and monitoring.

------------------------------------------------------------------------

## 12. MVP Acceptance Criteria

MVP dinyatakan layak jika pengguna dapat:

-   Membuat akun dan login.
-   Membuat, mengubah, dan menghapus mata kuliah.
-   Upload dan mengelola materi.
-   Meminta ringkasan dokumen.
-   Bertanya berdasarkan dokumen dan melihat sumber.
-   Membuat serta mengerjakan kuis.
-   Mengelola jadwal.
-   Mengelola tugas dan deadline.
-   Membuat rencana belajar berdasarkan data akademik.
-   Melihat ringkasan aktivitas pada dashboard.
-   Mengakses aplikasi melalui desktop dan ponsel.

Setiap fungsi harus menggunakan backend dan database nyata, memiliki
validasi, authorization, loading/error/empty states, serta pengujian
alur utama.

------------------------------------------------------------------------

## 13. Repository and Documentation Expectations

Dokumentasikan: - Cara instalasi. - Environment variables melalui
`.env.example`. - Cara menjalankan frontend dan backend. - Cara
menjalankan migration dan seeder. - Cara menjalankan queue/worker. -
Konfigurasi AI provider. - Proses document processing. - API
endpoints. - Testing. - Deployment.

Jangan commit `.env`, API key, token, kredensial, atau file privat
pengguna.

------------------------------------------------------------------------

## 14. Product Decisions and Open Items

Keputusan awal yang digunakan sebagai asumsi: - Produk dimulai sebagai
responsive web application. - Target awal adalah mahasiswa umum. -
Setiap mahasiswa memiliki workspace pribadi. - My Courses menjadi pusat
integrasi. - Tema visual dark navy dengan aksen violet/biru. - AI Study
Planner memberi rekomendasi dan meminta persetujuan pengguna.

Hal yang dapat diputuskan saat implementasi: - Provider AI utama. -
Batas ukuran dan jenis dokumen. - Provider email/push notification. -
Object storage production. - Kebijakan retensi dokumen dan percakapan. -
Integrasi kalender eksternal. - Deployment target.

------------------------------------------------------------------------

## 15. Instruction for AI Coding Agents

Gunakan dokumen ini sebagai sumber acuan produk. Sebelum melakukan
perubahan: 1. Baca dokumen ini dan `MASTER_PROMPT.md`. 2. Periksa
repository dan jangan berasumsi proyek masih kosong. 3. Buat rencana
kecil sebelum perubahan besar. 4. Implementasikan alur end-to-end, bukan
sekadar UI. 5. Jangan menghapus fitur yang berjalan tanpa alasan. 6.
Jalankan test, lint, dan type-check yang tersedia. 7. Laporkan
perubahan, cara pengujian, dan pekerjaan tersisa.

Jika ada konflik antara dokumen ini dan kondisi repository, jelaskan
konflik tersebut dan pilih solusi yang paling aman serta konsisten.
Jangan mengarang bahwa fitur sudah selesai jika belum diuji.
