#  Personal Profile Page — Riko Londong

Halaman profil dan kartu identitas portofolio personal modern yang dirancang mengacu pada **Apple Human Interface Guidelines (HIG)** (iOS & macOS Design System).

Dibuat sebagai bagian dari rangkaian eksplorasi proyek **100 Days of Code**.

---

## ✨ Fitur Utama

- **Apple Human Interface Guidelines**:
  - Tipografi **San Francisco (SF Pro)** dengan hierarki Apple (Large Title, Subheadline, Body, Caption).
  - Skema warna iOS resmi (System Blue, Green, Indigo, Teal, Gray).
  - Material kaca buram (*Frosted Glass / Vibrancy*) pada bar navigasi (`backdrop-filter: blur(25px)`).
  - **UISegmentedControl**: Pemilih tab segmen interaktif (Ringkasan, Keahlian, Proyek, Pesan).
  - **Apple Inset Grouped Cards**: Kartu bergaya iOS Settings dengan pemisah *hairline 0.5px* dan ikon berwarna.
  - **Apple Dynamic Island Banner**: Notifikasi kapsul mengambang dengan kurva animasi *spring bounce*.
  - **Apple Sheet Modal**: Pop-up edit profil responsif dengan *sheet grabber*.
- **Dark Mode & Light Mode**: Dukungan tema ganda yang tersimpan otomatis di `localStorage`.
- **Interaksi Penuh**:
  - Form kontak langsung.
  - Salin tautan profil ke papan klip (*clipboard*).
  - Kemampuan mengedit profil dan foto secara langsung.
- **100% Responsif**: Tampilan optimal di smartphone (iOS/Android), tablet (iPad), dan desktop (macOS/Windows).

---

## 🛠️ Teknologi

- **HTML5 Semantic**: Struktur semantik berstandar aksesibilitas (WCAG).
- **Modern Vanilla CSS**: Variabel CSS (design tokens), flexbox, grid, dan efek material Apple.
- **Vanilla JavaScript (ES6+)**: Manajemen state lokal, navigasi segmen, dan animasi.

---

## 🚀 Menjalankan Secara Lokal

1. **Clone repository ini**:
   ```bash
   git clone <URL_REPOSITORY_ANDA>
   cd "1. MY PROFIL PAGE"
   ```

2. **Jalankan preview**:
   Cukup buka file `index.html` di browser Anda, atau gunakan server lokal:
   ```bash
   node server.cjs
   ```
   Lalu buka `http://localhost:3000/`.

---

## 👤 Kontak & Profil

- **Pengembang**: Riko Londong
- **Email**: riko.londong1997@gmail.com
- **Lokasi**: Jakarta, Indonesia
