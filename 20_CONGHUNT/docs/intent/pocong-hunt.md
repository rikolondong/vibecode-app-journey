# Statement of Intent: Pocong Hunt (Cong Hunt)

- **Outcome**: Game web arcade retro 2D "Pocong Hunt" berbasis Phaser.js yang mengadaptasi gameplay klasik Duck Hunt NES dengan tema horor-komedi lokal Indonesia.
- **User**: Pemain game kasual & penggemar retro arcade 8-bit/16-bit yang mencari nostalgia gameplay cepat, refleks bidik-tembak, dan humor lokal.
- **Why now**: Proyek ke-20 dalam inisiatif 100 Days of Code/Projects (`20_CONGHUNT`).
- **Success**:
  - Grafis pixel art 8-bit/16-bit berlatar kuburan angker malam hari (batu nisan, pohon kamboja & pisang, kabut melayang, bulan purnama).
  * Karakter pendamping/pengganti anjing: Kuntilanak yang menyembul dari balik nisan dan tertawa melengking ("hihihi") saat tembakan meleset, serta mengacungkan/memamerkan pocong saat pemain berhasil menembak.
  - Mekanik bidik & tembak responsif (mouse crosshair di desktop, tap di mobile) dengan jatah 3 peluru per kemunculan target.
  - Dua jenis target: Pocong Putih (kecepatan normal) dan Pocong Merah (sangat cepat, bernilai poin bonus ganda), melompat dengan parabola zig-zag di udara sebelum kabur.
  - Sistem ronde Duck Hunt klasik: 10 target per ronde dengan kuota minimal kena (hit indicator bar di bawah layar), pilihan Mode 1 Pocong dan Mode 2 Pocong, serta penyimpanan High Score lokal (localStorage).
  - Audio retro 8-bit terintegrasi (Web Audio API synth / audio buffer) untuk suara tembakan, tawa Kuntilanak, lompatan pocong, dan jingle arcade.
- **Constraint**: Phaser 3 berbasis Web (Vite), 100% self-contained tanpa bergantung pada CDN gambar eksternal yang rentan rusak/404.
- **Out of scope**: Mode multiplayer online, sistem login/database backend, mikrotransaksi, dan sistem cerita/boss fight panjang.
