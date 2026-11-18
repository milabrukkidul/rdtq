# 📖 Aplikasi Rapor TPQ

Sistem penilaian dan rapor digital berbasis web untuk TPQ/TPA dengan database Google Spreadsheet.

## 🚀 Fitur

- **Input Nilai Lengkap**: Materi Pokok, Hafalan Juz 'Amma (37 surah), Materi Tambahan, Akhlak
- **Cetak Rapor A4**: Layout 2 halaman profesional siap cetak
- **Multi Role**: Admin (akses penuh) & Guru (input nilai + cetak kelas sendiri)
- **Responsive**: Tampilan desktop & mobile
- **Database Google Spreadsheet**: Data tersimpan aman di Google Drive

## 👤 Default Login

| Username | Password | Role |
|----------|----------|------|
| admin    | admin123 | Admin |
| guru1    | guru123  | Guru (Kelas 1C) |

> ⚠️ Ganti password setelah login pertama!

## 🛠️ Setup

### 1. Google Apps Script

1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru
2. Menu **Extensions → Apps Script**
3. Copy isi `Code.gs` ke editor
4. Jalankan fungsi `initSheets()` sekali untuk inisialisasi sheet
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy URL deployment

### 2. GitHub Pages

1. Fork / upload repository ini ke GitHub
2. Buka `app.js`, ganti nilai `API_URL` di baris atas dengan URL Apps Script Anda
3. Masuk ke **Settings → Pages → Source: main branch**
4. Akses aplikasi di `https://username.github.io/nama-repo`

## 📋 Struktur File

```
├── index.html      # Halaman utama aplikasi
├── style.css       # Tampilan layar
├── print.css       # Tampilan cetak (A4)
├── app.js          # Logika aplikasi
├── Code.gs         # Google Apps Script backend
└── README.md       # Dokumentasi ini
```

## 📄 Struktur Rapor

**Halaman 1:**
- Identitas siswa
- I. Materi Pokok (Fashohah, Suara & Lagu, Teori Tajwid, Ghorib)
- II. Hafalan Juz 'Amma (37 surah + rata-rata + terbilang)

**Halaman 2:**
- III. Materi Tambahan (Doa, Menulis, Kebersihan)
- IV. Akhlak Peserta Didik (Kedisiplinan, Akhlak kpd Ustadz, Teman, Belajar)
- Catatan Ustadz/Ustadzah
- Tanda tangan (Orang Tua, Kepala TPQ, Ustadz Pengampu)
