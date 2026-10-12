# ⛰️ Ekspedisi Puncak Nusantara (Indonesian Mountain Hiking Idle Game)

Game Idle bertema pendakian gunung-gunung tersohor di Indonesia dengan gaya visual **2D Side-Scrolling** dan **Multi-Layer Dynamic Parallax Scrolling Engine**.

---

## 🌟 Fitur Utama

### 1. Efek Parallax 2D & Siklus Alam Dinamis
- **Multi-Layer Depth Rendering**:
  - **Lapisan Langit & Benda Langit**: Siklus waktu dinamis (Subuh / Golden Sunrise, Siang Terik, Senja Lembayung, Malam Berbintang dengan Bulan Sabit).
  - **Awan Berarak**: Lapisan awan tebal dengan kecepatan parallaks berbeda sesuai elevasi.
  - **Siluet Gunung Api Jauh**: Lanskap megah gunung vulkanik khas Indonesia (Sindoro, Sumbing, Merbabu, Semeru).
  - **Hutan Cemara & Punggungan**: Hutan pinus tropis dan barisan bukit hijau berundak.
  - **Lereng Savana & Hamparan Bunga Edelweis**: Savana bunga abadi (*Anaphalis javanica*) yang bergoyang ditiup angin.
  - **Setapak Pendakian & Patok Jalur**: Jalur tanah berbatu alami dengan patok kilometer penunjuk arah.
  - **Sistem Cuaca Real-Time**: Efek cerah berawan, kabut dingin tebal (*frost*), hujan rintik gunung, hingga guguran daun & kelopak bunga yang beterbangan.

### 2. Gunung-Gunung Legendaris Indonesia
1. **Gunung Prau (2.565 mdpl - Dieng, Jateng)**
   - Jalur Patakbanteng: Savana Bukit Teletubbies & Golden Sunrise terbaik memandang Sindoro-Sumbing.
2. **Gunung Bromo (2.329 mdpl - Tengger, Jatim)**
   - Jalur Cemoro Lawang: Lautan Pasir Bisik, Pura Luhur Poten, & kawah aktif bergemuruh.
3. **Gunung Merapi (2.930 mdpl - Boyolali / Sleman, DIY-Jateng)**
   - Jalur Selo: Gunung api teraktif dunia, Pos Watu Belah, dan plataran Pasar Bubrah.
4. **Gunung Semeru (3.676 mdpl - Lumajang / Malang, Jatim)**
   - Jalur Ranu Pani: Danau magis Ranu Kumbolo, Tanjakan Cinta, savana Oro-oro Ombo, hingga Puncak Mahameru.
5. **Gunung Rinjani (3.726 mdpl - Lombok, NTB)**
   - Jalur Sembalun: Savana emas tanpa batas, Pelawangan Sembalun, Danau Segara Anak, & Puncak Dewi Anjani.
6. **Gunung Kerinci (3.805 mdpl - Jambi / Sumbar)**
   - Jalur Kersik Tuo: Atap Pulau Sumatera, rimba kanopi tropis, kebun teh Kayu Aro, dan Puncak Indrapura.

### 3. Animasi Karakter & Mode Istirahat Tenda
- **Karakter Pendaki Lengkap**: Animasi langkah kaki realistis, ransel carrier 60L dengan matras gulung, jaket windbreaker oranye, kupluk outdoor, dan trekking pole yang menancap ritmis.
- **Rombongan Tim (Companions)**: Porter lokal dengan keranjang bambu, sahabat pendaki, ranger taman nasional, dan fotografer yang berjalan beriringan di belakang.
- **Mode Tenda (Campfire & Rest Mode)**: Saat kelelahan atau di pos peristirahatan, buka tenda dome kuning cerah, nyalakan api unggun, dan nikmati seduhan kopi jahe hangat untuk memulihkan tenaga.
- **Selebrasi Puncak**: Kibaran bendera Merah Putih di tiang tugu triangulasi puncak dengan sorakan kegembiraan dan taburan selebrasi!

### 4. Sistem Idle & Active Tap
- **Auto-Walk (Idle)**: Pendaki otomatis melangkah mendaki sesuai kecepatan perlengkapan dan tim.
- **Langkah Mantap (Active Tap)**: Klik layar atau tekan tombol **Spasi** untuk melangkah cepat dan memicu **Combo Multiplier hingga 2.5x**.
- **Tenaga / Stamina**: Tenaga terkuras saat mendaki lereng curam; pulihkan dengan tenda atau konsumsi logistik.
- **Ekonomi & Upgrade**:
  - *Sepatu Trekking, Trekking Pole, Carrier 60L, Jaket Windbreaker, Kompor Nesting, Headlamp*.
  - *Rekrut Tim*: Porter Pak Slamet, Teman Medsos, Guide Ranger, Fotografer, Dokter Relawan.
  - *Bekal*: Kopi Jahe, Mie Rebus Telur Gunung, Cokelat Energi, Tolak Angin.
- **Prestige Reinkarnasi (Edelweis Emas)**: Setiap menaklukkan puncak, dapatkan Bunga Edelweis Emas abadi yang memberikan multiplier bonus permanen untuk ekspedisi selanjutnya!

### 5. Audio Synthesizer (Web Audio API)
- Suara langkah kaki di kerikil tanah berpasir (*crunch*).
- Hentakan trekking pole logam.
- Hembusan angin sepoi-sepoi gunung (ambient pink-noise filter).
- Kicau burung alam tropis acak.
- Alunan musik melodi akustik santai khas mendaki gunung (*procedural chill acoustic chords*).

---

## 🚀 Cara Menjalankan Game

Game ini dibuat dengan teknologi web murni (**HTML5 Canvas, CSS3, JavaScript**), tidak membutuhkan instalasi dependensi rumit:

1. **Buka Langsung di Browser**:
   - Cukup buka file [`index.html`](./index.html) menggunakan peramban modern (Google Chrome, Microsoft Edge, Firefox, Safari).
2. **Atau Menggunakan Local Server**:
   ```bash
   npx serve .
   # atau
   python -m http.server 8000
   ```
   Lalu buka `http://localhost:8000` di browser Anda.

---

## 🎮 Kontrol Permainan
- **Klik / Tap Layar / Tombol "Langkah Mantap" / Tombol Spasi**: Melangkah cepat & kumpulkan combo.
- **Tombol "Buka Tenda"**: Pasang tenda & api unggun untuk pemulihan stamina instan.
- **Tombol "Foto"**: Jepret panorama indah untuk bonus cuan sponsor & vlog.
- **Tab Navigasi**: Buka menu perlengkapan, rekrut tim porter, beli bekal makanan, dan pilih rute gunung nusantara.
