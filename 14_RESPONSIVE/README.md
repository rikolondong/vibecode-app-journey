# 📱 ResponsiView Studio — Multi-Device & OS Environment Simulator

> **Proyek 14 dari serial VibeCode App Journey oleh Riko Londong.**
> Simulator pengujian website multi-perangkat dan lingkungan sistem operasi native berbasis **Apple Human Interface Guidelines (HIG)** dengan dukungan *Deep Browser Fingerprint Spoofing*, *Smart Reverse Proxy*, dan sasis perangkat otentik.

---

## 🌟 Fitur Unggulan

### 1. 📐 Resolusi Layar & Sasis Hardware Asli 1:1
Tampilan fisik sasis, bezel, tombol perangkat, dan layar disimulasikan sesuai dimensi nyata tanpa distorsi:
- **iPhone 16 Pro:** Bezel ultra-tipis Titanium Grade 5 (9px), radius sudut 54px/46px, Dynamic Island (120×35px), Action Button, dan Camera Control Button.
- **iPhone 16 Pro Max:** Bezel 9px, Dynamic Island (124×35px), resolusi native 440×956 px.
- **iPhone XR:** Bezel aluminium Liquid Retina 14px, Classic Notch (186×30px), resolusi 414×896 px.
- **iPhone SE (Gen 3):** Dahi (speaker slit & kamera depan), Dagu dengan cincin Touch ID (44px), sudut layar datar 0px (persegi otentik), resolusi 375×667 px.
- **Samsung Galaxy S24 Ultra:** Sudut sasis kotak tajam khas Ultra (12px/6px), punch-hole camera 11px, seluruh tombol fisik di sisi kanan, resolusi 412×915 px.
- **Google Pixel 9 Pro:** Sasis matte aluminium membulat, punch-hole camera, resolusi 412×892 px.
- **iPad Series:** iPad Mini (744×1133), iPad Air (820×1180), iPad Pro 13" (1024×1366) dengan sasis aluminium simetris.
- **MacBook Air & Pro:** Sasis display lid dengan lekukan lip dan bodi laptop unibody.
- **Windows 11 Desktop:** Frame monitor 24" dengan tiang leher dan kaki meja (*stand foot*).

### 2. 🌐 Antarmuka Browser & OS Asli (Safe-Area Layout)
- **Apple iOS 18 Safari:** Status bar dengan jam dan Dynamic Island terpadu, Safari bottom capsule (`AA`, domain, tombol muat ulang interaktif `↻`), dan Home Indicator bar. Konten website berada di antara header dan footer tanpa terpotong (*zero clipping*).
- **Google Android 15 & One UI:** Status bar dengan jam & punch-hole, Google Chrome Omnibox bar, serta tombol navigasi 3-tombol (`|||`, `▢`, `❮`) atau gesture pill.
- **Apple iPadOS 18:** Status bar tanggal/waktu dan Safari Unified Tab Bar.
- **Apple macOS Sequoia:** Menu bar atas, traffic lights window (`🔴`, `🟡`, `🟢`), dan Safari window bar.
- **Microsoft Windows 11:** Tab strip Chrome, omnibox, dan Taskbar Windows 11 bawah dengan ikon Start, Search, dan Systray Clock.
- **Mode Sistem OS Toggle:** Tombol `Sistem OS` di toolbar memungkinkan beralih instan antara mode Browser Safari/Chrome dan mode Layar Penuh/PWA 100%.

### 3. 🕵️ Deep Browser Spoofing & Environment Injection
Website di dalam iframe mendeteksi lingkungan perangkat target secara nyata:
- **`navigator.userAgent`**: Spoofing lengkap string browser Safari Mobile, Chrome Android, iPadOS, macOS, dan Windows.
- **`navigator.platform`**: `iPhone`, `iPad`, `Linux armv8l`, `MacIntel`, atau `Win32`.
- **`window.devicePixelRatio`**: 3x Retina, 2x Liquid Retina, 3.5x QHD+, atau 1x Desktop.
- **`navigator.maxTouchPoints`**: 5 titik sentuh pada smartphone/tablet, 0 pada desktop.
- **`window.screen`**: Mengembalikan resolusi fisik asli perangkat yang dipilih.
- **Tipografi & Emoji Engine**: Menginjeksi font native sistem (-apple-system / SF Pro + Apple Color Emoji, Roboto + Noto Color Emoji, Segoe UI Variable + Segoe Emoji).

### 4. 🔀 Multi-Device Studio (3 Layar Bersamaan)
Uji tampilan website secara simultan pada 3 perangkat sekaligus:
- **Smartphone** (misal iPhone 16 Pro)
- **Tablet** (misal iPad Air)
- **Desktop** (misal MacBook Air)
Dilengkapi kontrol putar orientasi independen, muat ulang serempak, dan sinkronisasi skala Auto-Fit.

### 5. 🛡️ Smart Reverse Proxy & Bypass CORS/X-Frame-Options
Server proxy Node.js bawaan (`server.js`) secara cerdas membersihkan header `X-Frame-Options`, `Content-Security-Policy` (frame-ancestors), dan merewrite URL relatif agar website eksternal dapat dimuat dan diinteraksikan secara lancar di dalam iframe simulator.

### 6. 📸 Studio Screenshot & Mockup Engine
- Ambil tangkapan layar perangkat dengan satu klik atau shortcut `Ctrl+Shift+S`.
- Pilihan ekspor: **Mockup Perangkat Lengkap** (dengan bingkai bodi fisik), **Hanya Viewport Layar**, atau **Kanvas Keseluruhan**.
- Pilihan latar belakang: Studio Gradient (Apple HIG), Transparan PNG, Putih, atau Hitam.

---

## 🚀 Cara Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru.
- Tanpa dependensi pihak ketiga (menggunakan Node.js native standard library).

### Menjalankan Server
```bash
# Masuk ke direktori proyek
cd 14_RESPONSIVE

# Jalankan server
node server.js
```

Buka browser dan akses:
```
http://localhost:3000
```

---

## 📁 Struktur Berkas

```
14_RESPONSIVE/
├── index.html        # Antarmuka simulator, stage canvas, toolbar, dan sasis perangkat
├── styles.css        # Desain Apple HIG, dark/light theme, sasis 1:1 tiap perangkat
├── app.js            # Engine simulasi, spoofing fingerprint, telemetri, zoom, & screenshot
├── server.js         # Server HTTP & Smart Reverse Proxy (CORS/X-Frame-Options bypass)
├── demo.html         # Halaman uji telemetri responsif lokal
├── package.json      # Metadata proyek
└── README.md         # Dokumentasi teknis proyek
```

---

## 👤 Pengembang

- **Nama**: Riko Londong
- **GitHub**: [@rikolondong](https://github.com/rikolondong)
- **Repositori**: [vibecode-app-journey](https://github.com/rikolondong/vibecode-app-journey)
