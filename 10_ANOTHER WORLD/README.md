# 👻 DUNIA LAIN: MALAM UJI NYALI
> **Game Horor Indonesia Berbasis Point-and-Click Survival (FNAF Style Mechanics)**  
> Terinspirasi dari acara televisi legendaris Indonesia: *"Dunia Lain"* (Uji Nyali).

---

## 📖 Sinopsis & Latar Belakang
Anda bertugas sebagai **Operator Keamanan & Pos Pantau Siaran** di dalam Mobil Kontrol (*OB Van*) kru televisi. Malam ini, siaran *Uji Nyali* diadakan di bekas Rumah Sakit Kolonial peninggalan era Belanda yang terbengkalai di Jawa Tengah.

Seorang peserta uji nyali ditinggalkan seorang diri di tengah ruangan gelap (CAM 05) hanya dengan sebatang lilin. Tugas Anda adalah memantau gerak-gerik mahluk tak kasat mata melalui kamera pengawas (CCTV Inframerah/Night Vision), menjaga ketahanan mental peserta dan nyala lilinnya, serta mempertahankan pos pantau dari serangan hantu hingga **06:00 Subuh**.

Ingat ucapan presenter legendaris:  
> *"Jika Anda tidak kuat... lambaikan tangan ke kamera!"*

---

## 🕹️ Mekanik Gameplay (Gaya Five Nights at Freddy's)

### 1. Sistem Pos Pantau (Ruang Operator / OB Van)
- **Sudut Pandang Panoramik 180°:** Geser kursor ke sisi kiri atau kanan layar untuk mengarahkan pandangan ke pintu kiri, meja tengah operator, atau pintu kanan.
- **Pintu Teralis Besi Kiri & Kanan:**
  - Tekan tombol **[Q]** untuk menutup / membuka pintu kiri.
  - Tekan tombol **[E]** untuk menutup / membuka pintu kanan.
- **Lampu Sorot Pintu (*Spotlight*):**
  - Tekan tombol **[A]** untuk menyorot lorong pintu kiri (mendeteksi keberadaan Pocong).
  - Tekan tombol **[D]** untuk menyorot lorong pintu kanan (mendeteksi keberadaan Kuntilanak).
- **Manajemen Daya Aki (*Battery Gauge*):**
  - Setiap tindakan (menutup pintu, menyalakan lampu sorot, membuka monitor CCTV) mengonsumsi daya listrik.
  - Perhatikan bilah *Usage* (Tingkat 1 s.d. 5).
  - **Peringatan Blackout (Aki 0%):** Bila aki habis, seluruh pintu akan terbuka paksa, lampu mati total, dan entitas mahluk gaib akan langsung menyerang pos pantau!

### 2. Monitor Kamera Pengawas (CCTV Inframerah)
Tekan tombol **[SPACE]** atau klik bilah bawah untuk menaikkan/menurunkan monitor CCTV:
- **CAM 01:** *Lorong Utama Kolonial* (Jalur penghubung utama)
- **CAM 02:** *Kamar Jenazah Tua* (Sarang entitas Genderuwo)
- **CAM 03:** *Ruang Bedah Tua* (Tempat awal Kuntilanak berdiam)
- **CAM 04:** *Pohon Beringin Angker* (Tempat kemunculan awal Pocong)
- **CAM 05:** *Ruang Peserta Uji Nyali* (Peserta duduk bersila dengan lilin)
- **CAM 06:** *Lorong Sayap Kiri* (Akses mendekati Pintu Kiri Operator)
- **CAM 07:** *Lorong Sayap Kanan* (Akses mendekati Pintu Kanan Operator)
- **CAM 08:** *Ruang Generator & Ventilasi* (Tempat Tuyul & kabel listrik)

### 3. Mekanik Khusus Acara "Dunia Lain"
- **🕯️ Lilin Peserta Uji Nyali (CAM 05):**
  - Lilin peserta akan terus melemah dan bisa ditiup oleh Kuntilanak atau angin gaib.
  - Jika lilin padam lebih dari 12 detik, peserta akan kerasukan histeris (*Game Over*).
  - Pantau CAM 05 dan tekan tombol **[🔥 TIUP DUPA / KUATKAN DOA]** sebelum lilin padam sepenuhnya.
- **📢 Pancar Audio Radio (Lure Distraction):**
  - Mengirimkan transmisi suara radio ke ruangan yang sedang dipantau untuk memancing mahluk gaib agar menjauh dari pos operator.
- **🏳️ Lambaikan Tangan ke Kamera (Tombol Darurat):**
  - Tombol evakuasi darurat khas Dunia Lain untuk menghentikan uji nyali jika pemain menyerah.

---

## 👹 Entitas Mahluk Gaib Indonesia

| Mahluk | Tipe Perilaku | Rute Pergerakan | Cara Penanganan |
| :--- | :--- | :--- | :--- |
| **POCONG** | Agresif / Pelompat Cepat | CAM 04 &rarr; CAM 01 &rarr; CAM 06 &rarr; Pintu Kiri | Cek lampu sorot kiri [A]. Jika nampak berdiri di depan pintu, segera tutup pintu kiri [Q]! |
| **KUNTILANAK** | Penyusup Halus / Meniup Lilin | CAM 03 &rarr; CAM 05 &rarr; CAM 07 &rarr; Pintu Kanan | Mengeluarkan audio tawa/tangis melengking. Sering mengganggu lilin peserta di CAM 05. Jika melayang di pintu kanan, tutup pintu kanan [E]! |
| **GENDERUWO** | Raksasa Penguras Daya Listrik | Berdiam di CAM 02 & menyusup ke CAM 08 (Generator) | Saat berada di CAM 08, dia menyedot daya aki 2x lebih cepat. Pancing ke CAM 04 dengan Audio Distract! |
| **TUYUL** | Pengacau Kabel Genset | CAM 08 (Ruang Generator) | Mengintai di ruang generator bawah tanah untuk mengacaukan aliran listrik. |

---

## 🖼️ Daftar Gambar Pre-Render (High Definition)
Seluruh aset visual pre-render telah disiapkan di folder `assets/images/`:
1. `title_poster.jpg` &mdash; Poster utama & menu bergaya siaran TV horor 2000-an.
2. `office.jpg` &mdash; Interior ruang kontrol pos pantau kru TV (*OB Van*) lengkap dengan monitor CRT, walkie-talkie, termos, cangkir kaleng, dan rajah penolak bala.
3. `door_left_pocong.jpg` &mdash; Tampilan pintu kiri saat lampu sorot menyala, memperlihatkan Pocong berdiri kaku menatap tajam.
4. `door_right_kunti.jpg` &mdash; Tampilan pintu kanan saat lampu sorot menyala, memperlihatkan Kuntilanak melayang dengan gaun putih berdarah.
5. `cam01_hallway.jpg` &mdash; Feed CCTV CAM 01: Lorong rumah sakit kolonial tua berlantai catur.
6. `cam02_morgue.jpg` &mdash; Feed CCTV CAM 02: Kamar jenazah tua dengan bayangan raksasa Genderuwo bermata merah.
7. `cam03_surgery.jpg` &mdash; Feed CCTV CAM 03: Ruang bedah berlumur karat dengan penampakan Kuntilanak di langit-langit.
8. `cam04_banyan.jpg` &mdash; Feed CCTV CAM 04: Pohon beringin berakar gantung dengan kabut dan Pocong di bawahnya.
9. `cam05_participant.jpg` &mdash; Feed CCTV CAM 05: Peserta uji nyali duduk bersila di atas tikar pandan dengan lilin menyala.
10. `cam08_generator.jpg` &mdash; Feed CCTV CAM 08: Ruang genset bawah tanah dengan penampakan Tuyul berkepala plontos dan bertaring.
11. `jumpscare_pocong.jpg` &mdash; Layar jumpscare wajah rusak Pocong yang menerjang kamera secara mendadak.

---

## 🎵 Sistem Audio Real-Time (Web Audio API Synthesizer)
Game ini dilengkapi mesin sintesis audio Web Audio API interaktif tanpa ketergantungan file eksternal yang besar:
- Drone bas frekuensi rendah (36 Hz) untuk menciptakan ketegangan psikologis.
- Frekuensi nada gamelan Slendro & Pelog mistis (*dissonant gong chime*).
- Bunyi tawa melengking Kuntilanak berbasis osilator modulasi frekuensi (*vibrato tremolo*).
- Dentuman hentakan langkah Pocong (*low frequency thump*).
- Geraman Genderuwo (*bandpass filtered sawtooth growl*).
- Bunyi derak radio walkie-talkie (*mic squelch & static burst*).
- Dentang kemenangan Adzan Subuh (06:00 AM).

---

## 🚀 Cara Menjalankan Game
1. **Opsi 1 (Paling Mudah di Windows):**
   - Cukup klik ganda file `MULAI_GAME.bat`.
   - Browser akan otomatis terbuka mengarah ke `http://localhost:8080`.

2. **Opsi 2 (Menggunakan Node.js Manual):**
   ```bash
   node server.js
   ```
   Lalu buka peramban dan navigasikan ke `http://localhost:8080`.

3. **Opsi 3 (Langsung Buka File):**
   - Anda juga dapat langsung mengklik dua kali file `index.html` pada peramban Chrome, Edge, atau Firefox modern.
