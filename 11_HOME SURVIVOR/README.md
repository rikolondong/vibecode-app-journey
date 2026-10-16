# 🧟‍♂️ HOME SURVIVOR: ISOLATION (3D Isometric Zombie Survival)

Simulasi realistis bertahan hidup di dalam rumah saat terjadi wabah serangan zombie dengan sudut pandang **3D Isometric** (terinspirasi dari *Project Zomboid*). Dibangun menggunakan **Three.js (WebGL)** dan **Procedural Web Audio API** tanpa memerlukan aset audio/model eksternal.

---

## 🌟 Fitur Utama

### 1. Rumah 3D Multi-Ruangan & Cutaway Walls Otomatis
- **Tata Ruang Lengkap**:
  - **Ruang Tamu**: TV & Radio Darurat, Sofa, Rak Buku.
  - **Dapur**: Kulkas, Kompor Listrik/Gas (untuk memasak daging mentah), Wastafel Keran Air, Lemari Pangan, Meja Makan.
  - **Kamar Tidur**: Tempat Tidur (untuk beristirahat & mempercepat waktu), Lemari Pakaian.
  - **Kamar Mandi**: Kotak P3K Dinding, Wastafel Kamar Mandi.
  - **Garasi & Bengkel**: Generator Listrik Cadangan, Meja Kerja & Rak Perkakas, Peti Gudang.
  - **Halaman & Jalan Raya**: Mobil Polisi & Ambulans terbengkalai (loot risiko tinggi seperti Pistol 9mm, Peluru, Jerigen Bensin, dan Medkit), serta pohon pinus yang dapat ditebang.
- **Sistem Dinding Cutaway (Sims / Project Zomboid Style)**: Dinding luar maupun penyekat ruangan yang menghalangi kamera secara otomatis merendah saat pemain berada di dalam rumah.

### 2. Mekanik Fortifikasi & Barikade Rumah
- **Barikade Papan Kayu 3D (`[B]`)**: Pasang hingga 4 lapis papan kayu di setiap pintu dan jendela menggunakan *Papan Kayu*, *Paku Besi*, dan *Palu*.
- **Tirai Jendela (`[G]`)**: Tutup tirai jendela di malam hari agar cahaya lampu dalam rumah tidak memancing zombie dari jalan raya.
- **Bongkar Perabotan (`[X]`)**: Bongkar meja, sofa, rak, atau tebang pohon untuk memperoleh bahan *Papan Kayu* dan *Paku* darurat.
- **Pecahan Kaca**: Jendela yang dijebol zombie meninggalkan pecahan kaca di lantai yang menimbulkan suara berisik jika terinjak.

### 3. Simulasi Kebutuhan & Utilitas Kota Realistis
- **Vitals & Moodles**: Kelola **Kesehatan (HP), Stamina Fisik, Nutrisi (Lapar), Hidrasi (Haus), Kantuk (Fatigue), Tingkat Panik**, serta status medis **Pendarahan (Bleeding)** dan **Infeksi**.
- **Jaringan Listrik & Air PDAM**: Listrik kota dan pasokan air PDAM akan mati seiring berjalannya hari (diumumkan melalui Siaran Darurat TV/Radio). Gunakan **Generator Bensin** di garasi untuk menyalakan kembali listrik rumah, namun waspadai suara mesinnya yang memancing zombie!
- **Gelombang Suara 3D (Noise Ripple)**: Berlari, memalu barikade, membongkar perabotan, dan menembakkan Pistol 9mm memancarkan gelombang suara 3D yang didengar oleh AI zombie di sekitar.

---

## 🎮 Panduan Kontrol

| Tombol | Aksi |
|:---:|:---|
| **W, A, S, D** | Bergerak mengikuti orientasi kamera isometrik |
| **Shift** | Berlari (*Sprint* — menguras stamina & menimbulkan suara langkah) |
| **C / Ctrl** | Mengendap-endap (*Sneak* — langkah senyap & sulit dideteksi) |
| **Mouse** | Mengarahkan pandangan, senter, dan bidikan senjata |
| **Klik Kiri** | Menyerang (Melee) / Menembak (Pistol 9mm) |
| **Spasi** | Mendorong Zombie (*Shove* — membuat zombie terhuyung mundur) |
| **E** | Interaksi Utama (Buka/Tutup Pintu & Jendela, Geledah Wadah, Masak, Minum, Tidur, Nyalakan Generator/TV) |
| **B** | Memaku Papan Barikade pada Pintu / Jendela (Maks. 4 lapis) |
| **G** | Membuka / Menutup Tirai Jendela |
| **X** | Membongkar Perabotan Kayu / Menebang Pohon |
| **F / L** | Menyalakan/Mematikan Senter Taktis / Saklar Lampu Rumah |
| **1 - 5** | Memilih Slot Hotbar Cepat |
| **I / K** | Membuka Panel Tas Inventaris / Menu Perakitan (*Crafting*) |
| **Q, R / Scroll** | Memutar Sudut Kamera 90° / Zoom In & Out |

---

## 🛠️ Tech Stack
- **3D Rendering**: Three.js (r128) Orthographic Isometric Camera, Real-time PCF Soft Shadows, Dynamic Point/Spot/Directional Lighting.
- **Audio Engine**: Pure Web Audio API Procedural Synthesizer (tanpa file audio eksternal).
- **Frontend**: HTML5, Modern Tactical Glassmorphism CSS3, Vanilla JavaScript (ES6+).
