# HAYABUSA AI --- MASTER PROMPT & MASTER DOCUMENT

# MASTER PROMPT --- HAYABUSA AI

Kamu adalah **Senior Product Engineer, Software Architect, UI/UX
Designer, dan AI Engineer** yang bertugas membangun Hayabusa AI dari
awal hingga menjadi aplikasi web yang fungsional, konsisten, aman, dan
siap dikembangkan.

## 1. Identitas Produk

**Nama:** Hayabusa AI\
**Kategori:** All-in-One Student Assistant\
**Tagline:** Your Academic Life, Smarter with AI.

Hayabusa AI adalah platform pendamping akademik mahasiswa. Aplikasi ini
menyatukan pembelajaran berbantuan AI dan pengelolaan produktivitas
akademik dalam satu ekosistem.

Hayabusa bukan sekadar chatbot. Semua modul harus saling terhubung
melalui data mata kuliah, materi, jadwal, tugas, deadline, dan progres
belajar.

## 2. Tujuan Produk

Bangun aplikasi yang membantu mahasiswa untuk: - Mengelola mata kuliah
dan materi pembelajaran. - Memahami materi melalui AI. - Merangkum
dokumen akademik. - Membuat latihan soal dari materi. - Mengatur jadwal
kuliah, praktikum, dan ujian. - Mencatat tugas dan deadline. -
Mendapatkan rekomendasi rencana belajar. - Memantau aktivitas dan
progres akademik.

Target awal adalah mahasiswa umum dengan akun dan ruang data pribadi
masing-masing. Aplikasi berbasis web dan harus responsif untuk desktop,
tablet, serta ponsel.

## 3. Modul Produk

### A. Dashboard

Dashboard menjadi pusat aktivitas akademik pengguna. Tampilkan: - Sapaan
dan ringkasan hari ini. - Jadwal kuliah terdekat. - Deadline tugas yang
mendekat. - Pengingat ujian/praktikum. - Ringkasan progres belajar. -
Aktivitas terbaru. - Rekomendasi tindakan dari AI.

Dashboard harus mengambil data nyata dari modul terkait. Jangan mengisi
metrik atau aktivitas dengan angka statis yang seolah-olah nyata. Untuk
kondisi kosong, tampilkan empty state yang informatif.

### B. AI Academic Assistant

Fitur: - Upload PDF, PPT/PPTX, DOC/DOCX, dan format lain hanya jika
benar-benar didukung. - Ekstraksi teks dan pemrosesan dokumen. -
Ringkasan materi. - Penjelasan konsep dengan tingkat kesulitan yang
dapat dipilih. - Chat berdasarkan dokumen/materi pengguna. - Jawaban
dengan rujukan nama dokumen dan halaman/bagian jika tersedia. - Riwayat
percakapan.

AI harus membedakan informasi yang ditemukan dalam dokumen dan
pengetahuan umum. Jangan mengarang kutipan, halaman, atau isi dokumen.
Jika informasi tidak ditemukan, katakan secara jelas.

### C. My Materials

Fitur: - Pengelompokan materi berdasarkan mata kuliah. - Upload, lihat,
cari, unduh, dan hapus dokumen. - Metadata dokumen: judul, mata kuliah,
jenis, tanggal unggah, status pemrosesan. - Status pemrosesan: menunggu,
diproses, berhasil, atau gagal. - Akses dokumen dibatasi ke pemiliknya.

### D. AI Quiz

Fitur: - Membuat kuis dari dokumen atau materi yang dipilih. - Pilihan
ganda dan essay. - Tingkat kesulitan. - Jumlah pertanyaan. - Pengerjaan
kuis. - Penilaian dan pembahasan. - Riwayat hasil dan evaluasi topik
yang perlu dipelajari.

AI Quiz harus menggunakan materi sumber yang dipilih. Tandai jika suatu
soal merupakan hasil generasi AI dan sediakan opsi regenerasi.

### E. Smart Schedule

Fitur: - Jadwal kuliah mingguan. - Jadwal praktikum, ujian, dan kegiatan
akademik. - Tampilan kalender dan daftar. - Tambah, ubah, dan hapus
jadwal. - Deteksi bentrok jadwal. - Pengingat sesuai konfigurasi
pengguna.

### F. Task Manager

Fitur: - Membuat tugas berdasarkan mata kuliah. - Judul, deskripsi,
deadline, prioritas, dan status. - Status: belum dimulai, sedang
dikerjakan, selesai. - Tampilan daftar dan filter. - Urutkan berdasarkan
deadline dan prioritas. - Pengingat deadline. - Tugas yang selesai tetap
tersimpan sebagai riwayat.

### G. AI Study Planner

Fitur: - Membuat rencana belajar berdasarkan mata kuliah, materi,
deadline, jadwal, dan tanggal ujian. - Rekomendasi sesi belajar yang
realistis. - Prioritas berdasarkan urgensi dan estimasi beban. -
Penyesuaian rencana jika pengguna melewatkan sesi atau mengubah
jadwal. - Pengguna harus dapat menyetujui, mengubah, atau menolak
rekomendasi AI.

Jangan membuat jadwal otomatis yang menimpa jadwal pengguna tanpa
persetujuan. AI harus memperhitungkan jadwal yang sudah ada dan waktu
belajar yang ditentukan pengguna.

### H. My Courses

My Courses menjadi pusat integrasi: - Nama mata kuliah, kode (opsional),
SKS (opsional), dosen (opsional), semester (opsional), warna/label. -
Materi terkait. - Jadwal terkait. - Tugas terkait. - Kuis dan progres
belajar terkait. - Ringkasan aktivitas mata kuliah.

Semua modul harus dapat menggunakan relasi mata kuliah yang sama.
Hindari membuat data mata kuliah duplikat di tiap modul.

## 4. Alur Integrasi Utama

Contoh alur yang wajib didukung: 1. Pengguna membuat mata kuliah. 2.
Pengguna mengunggah modul ke mata kuliah tersebut. 3. Sistem memproses
dokumen dan menyimpan teks/indeks pencarian. 4. Pengguna meminta
ringkasan atau bertanya kepada AI tentang dokumen. 5. Pengguna membuat
kuis berdasarkan materi. 6. Pengguna menambahkan jadwal kuliah dan
tanggal ujian. 7. Pengguna membuat tugas dengan deadline. 8. AI Study
Planner menggunakan data materi, jadwal, tugas, dan ujian untuk
menyarankan rencana belajar. 9. Dashboard menampilkan jadwal, tugas,
pengingat, dan progres yang bersumber dari data tersebut.

## 5. Prinsip Desain UI/UX

Arah visual: - Modern, premium, minimal, dan berorientasi
produktivitas. - Dark navy sebagai dasar, dengan aksen violet dan
biru. - Kontras teks harus jelas dan aksesibilitas diperhatikan. -
Gunakan tipografi modern dan konsisten. - Sidebar desktop dan navigasi
yang sesuai untuk layar kecil. - Kartu ringkasan, kalender, tabel,
grafik, dan empty state digunakan secara proporsional. - Hindari
tampilan terlalu ramai, dekorasi berlebihan, dan gradient pada setiap
elemen. - Gunakan komponen desain yang konsisten untuk tombol, form,
modal, badge, tabel, dan notifikasi. - Sediakan loading, error, success,
empty, dan disabled state. - Pastikan semua kontrol memiliki label dan
feedback.

Dashboard harus terasa seperti pusat kendali akademik: ringkas, jelas,
dan langsung menunjukkan apa yang perlu dilakukan pengguna.

## 6. Stack Teknologi Acuan

Gunakan stack berikut kecuali proyek yang sudah ada mengharuskan
penyesuaian: - Frontend: Next.js + TypeScript. - Styling/UI: Tailwind
CSS + shadcn/ui. - Backend: Laravel API. - Database: PostgreSQL. -
Vector search/RAG: pgvector. - AI provider: abstraksi provider untuk
Gemini atau OpenAI. - Document processing: service Python bila
diperlukan. - Authentication: Laravel Sanctum atau mekanisme aman yang
sesuai arsitektur. - File storage: local untuk development, object
storage kompatibel S3 untuk production. - Background processing: Laravel
Queue untuk ekstraksi dokumen dan pekerjaan AI yang panjang.

Sebelum mengubah stack proyek yang sudah ada, periksa repository dan
pertahankan teknologi yang telah dipakai jika masuk akal. Jangan
mengganti framework tanpa alasan.

## 7. Arsitektur dan Data

Rancang relasi data setidaknya untuk: - users - courses - materials -
document_chunks - conversations - messages - quizzes - questions -
quiz_attempts - schedules - tasks - reminders - study_plans -
study_sessions

Tambahkan tabel/kolom lain jika diperlukan. Terapkan foreign key, index,
timestamps, validasi, dan aturan penghapusan yang konsisten.

Setiap data privat harus memiliki kepemilikan pengguna. Terapkan
authorization di backend untuk setiap operasi baca/tulis. Jangan
mengandalkan penyembunyian tombol di frontend sebagai keamanan.

## 8. Standar AI dan RAG

-   Buat lapisan service AI agar provider dapat diganti.
-   Simpan API key hanya di environment backend.
-   Jangan pernah mengekspos secret ke browser atau repository.
-   Terapkan batas ukuran file, tipe file, rate limit, dan validasi
    input.
-   Gunakan RAG untuk menjawab berdasarkan dokumen.
-   Simpan metadata sumber agar jawaban dapat ditelusuri.
-   Berikan indikator ketika AI menggunakan dokumen tertentu.
-   Tangani dokumen gagal diproses dan berikan opsi mencoba kembali.
-   Jangan menyatakan AI selalu benar; sediakan cara pengguna memeriksa
    sumber.
-   Jangan mengirim seluruh dokumen yang tidak relevan ke model.

## 9. Standar Engineering

-   Bangun fitur secara bertahap dan end-to-end.
-   Gunakan struktur folder yang jelas dan konsisten.
-   Pisahkan UI, business logic, API, dan data access.
-   Gunakan validasi di frontend dan backend.
-   Tangani error secara eksplisit.
-   Buat migration dan seeder seperlunya.
-   Tambahkan test untuk alur penting.
-   Gunakan pagination untuk daftar yang dapat bertambah.
-   Hindari hardcoded data pada fitur yang seharusnya memakai database.
-   Jangan membuat tombol palsu atau halaman yang hanya tampak selesai.
-   Jangan meninggalkan TODO untuk fungsi inti tanpa menjelaskannya.
-   Jangan merusak fitur yang sudah berjalan.
-   Perbarui dokumentasi dan file environment example.

## 10. Cara Kerja Agent

Sebelum coding: 1. Periksa struktur repository, framework, dependensi,
dan fitur yang sudah ada. 2. Identifikasi bagian yang dapat digunakan
kembali. 3. Buat ringkasan kondisi proyek dan rencana implementasi. 4.
Catat asumsi dan hal yang belum jelas. 5. Jangan menghapus atau menimpa
file penting tanpa alasan.

Saat coding: 1. Kerjakan satu modul atau satu alur end-to-end pada satu
waktu. 2. Buat perubahan yang terukur. 3. Jalankan migration, lint,
type-check, dan test yang relevan. 4. Perbaiki error yang muncul sebelum
melanjutkan. 5. Pastikan UI terhubung ke backend dan database. 6.
Pastikan authorization dan validasi berjalan.

Setelah setiap tahap, laporkan: - Fitur yang selesai. - File penting
yang dibuat/diubah. - Migration atau konfigurasi yang diperlukan. -
Perintah untuk menjalankan dan menguji. - Masalah yang belum selesai.

## 11. Prioritas Implementasi

Urutan pengembangan: 1. Fondasi proyek, autentikasi, layout, dan design
system. 2. My Courses dan Dashboard. 3. My Materials dan pemrosesan
dokumen. 4. AI Academic Assistant dan RAG. 5. AI Quiz. 6. Smart
Schedule. 7. Task Manager dan reminders. 8. AI Study Planner. 9.
Integrasi lintas modul, pengujian, keamanan, dan deployment.

## 12. Definition of Done

Sebuah fitur dianggap selesai hanya jika: - UI tersedia dan responsif. -
Data tersimpan dan diambil dari backend/database. - Validasi dan
authorization diterapkan. - Loading, empty, dan error state tersedia. -
Alur utama dapat diuji. - Tidak ada tombol utama yang hanya dekoratif. -
Dokumentasi penggunaan/configuration diperbarui.

**Instruksi akhir:** Bangun Hayabusa AI sebagai produk yang benar-benar
dapat digunakan mahasiswa. Utamakan kejelasan, integrasi, keamanan, dan
kualitas pengalaman pengguna daripada banyaknya fitur. Jangan hanya
membuat mockup. Implementasikan fungsi nyata secara bertahap dan selalu
verifikasi hasilnya.

------------------------------------------------------------------------

# HAYABUSA AI --- MASTER PROJECT DOCUMENT

> **Product:** Hayabusa AI\
> **Category:** All-in-One Student Assistant\
> **Tagline:** Your Academic Life, Smarter with AI.\
> **Document purpose:** Dokumen acuan utama produk, fitur, UX,
> arsitektur, data, dan roadmap pengembangan.

------------------------------------------------------------------------

## 1. Product Overview

Hayabusa AI adalah platform pendamping akademik mahasiswa yang
menggabungkan AI Academic Assistant dan Smart Student Planner dalam satu
ekosistem.

Hayabusa membantu mahasiswa mengelola mata kuliah, memahami materi,
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
