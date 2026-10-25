// ============================================================================
// PANTURA: MUDIK ODYSSEY — DATA & NARRATIVE ENGINE
// Route Checkpoints, MPV Vehicles, Roofbox Items, Road Trip Events & Chatter
// ============================================================================

export const TOTAL_ROUTE_KM = 780;

export const MPV_MODELS = [
  {
    id: 'avanza_mudik',
    name: 'Avanza "Sejuta Umat"',
    subtitle: 'MPV Lincah & Irit BBM',
    emoji: '🚙',
    bodyColor: 0xd8dee9, // Metallic Silver
    accentColor: 0x2b6cb0,
    roofStyle: 'tarp_boxes',
    maxSlots: 6,
    startingCash: 1500000,
    fuelEfficiency: 1.15, // 15% more fuel efficient
    durability: 1.0,
    moodStability: 1.0,
    perkText: '✓ Irit BBM +15% • Lincah selap-selip • 6 Slot Bagasi/Atap',
    description: 'Mobil keluarga paling populer di jalur Pantura. Mesin bandel, irit bensin saat macet panjang, dengan rak atap terpal biru khas pemudik.'
  },
  {
    id: 'kijang_kapsul',
    name: 'Kijang Kapsul LGX "Bapak"',
    subtitle: 'Legenda Badak & Kabin Lega',
    emoji: '🚐',
    bodyColor: 0x1e6091, // Classic Deep Ocean Blue
    accentColor: 0xd97706,
    roofStyle: 'vintage_rack',
    maxSlots: 7,
    startingCash: 1400000,
    fuelEfficiency: 0.92,
    durability: 1.3, // 30% tougher against potholes
    moodStability: 1.2, // Family nostalgia keeps mood higher
    perkText: '✓ 7 Slot Bagasi • Kaki-kaki Tahan Lubang +30% • Kabin Nyaman',
    description: 'Mobil kesayangan Bapak sejak zaman dulu. Suspensi empuk melibas jalan berlubang Pantura dan muat lebih banyak kardus oleh-oleh di atap.'
  },
  {
    id: 'innova_diesel',
    name: 'Innova Diesel "Torsi Badak"',
    subtitle: 'Cruiser Kencang & Roofbox Modern',
    emoji: '🚘',
    bodyColor: 0x262b33, // Jet Black Mica
    accentColor: 0xf59e0b,
    roofStyle: 'aero_roofbox',
    maxSlots: 6,
    startingCash: 1650000,
    fuelEfficiency: 1.05,
    durability: 1.15,
    moodStability: 1.15,
    perkText: '✓ Modal THR Rp 1,65 Juta • AC Double Blower Dingin • Stabil Ngebut',
    description: 'MPV keluarga bermesin diesel tangguh. Kuat menanjak di Alas Roban tanpa ngos-ngosan, dilengkapi roofbox aerodinamis di atap.'
  }
];

export const ROUTE_CHECKPOINTS = [
  {
    km: 0,
    id: 'bekasi',
    name: 'Bekasi — Karawang',
    shortName: 'Bekasi',
    subtitle: 'Gerbang Awal Perantauan • Deretan Pabrik & Kalimalang',
    biome: 'suburban',
    defaultWeather: 'sunset',
    specialSouvenirId: 'kaleng_khongguan',
    stopoverTitle: 'Posko Mudik Kalimalang — Karawang',
    arrivalChatter: {
      speaker: 'Ibu di Kursi Depan',
      avatar: '👩',
      text: 'Alhamdulillah sudah lepas gerbang Bekasi, Pak. Pastikan bensin dan kopi aman sebelum masuk jalur utama Pantura ya!'
    }
  },
  {
    km: 110,
    id: 'subang',
    name: 'Cikampek — Subang (Patokbeusi)',
    shortName: 'Subang',
    subtitle: 'Simpang Jomin Legendaris • Hamparan Sawah & Kios Nanas Madu',
    biome: 'ricefield',
    defaultWeather: 'sunset',
    specialSouvenirId: 'nanas_subang',
    stopoverTitle: 'Rest Area Simpang Jomin & Warung Subang',
    arrivalChatter: {
      speaker: 'Raka (Anak Sulung)',
      avatar: '👦',
      text: 'Wah, di pinggir jalan banyak banget yang gantung buah nanas raksasa! Itu Nanas Madu Subang ya, Pak?'
    }
  },
  {
    km: 215,
    id: 'cirebon',
    name: 'Cirebon — Kota Udang',
    shortName: 'Cirebon',
    subtitle: 'Perbatasan Jabar-Jateng • Harum Kuah Empal Gentong & Warung Tenda',
    biome: 'town',
    defaultWeather: 'night',
    specialSouvenirId: 'empal_gentong',
    stopoverTitle: 'Sentra Kuliner & SPBU Cirebon Pantura',
    arrivalChatter: {
      speaker: 'Ibu di Kursi Depan',
      avatar: '👩',
      text: 'Sudah sampai Cirebon nih! Kalau Bapak mulai lapar atau ngantuk, kita mampir makan Empal Gentong hangat dulu yuk.'
    }
  },
  {
    km: 285,
    id: 'brebes',
    name: 'Brebes — Tegal',
    shortName: 'Brebes',
    subtitle: 'Kios Telur Asin Berjajar • Pasar Tumpah & Aroma Teh Poci Melati',
    biome: 'town',
    defaultWeather: 'night',
    specialSouvenirId: 'telur_asin',
    stopoverTitle: 'Kios Telur Asin Brebes & Posko Lebaran',
    arrivalChatter: {
      speaker: 'Dinda (Anak Bungsu)',
      avatar: '👧',
      text: 'Bu, jangan lupa beli Telur Asin Brebes yang warna biru itu buat Nenek di kampung halaman!'
    }
  },
  {
    km: 355,
    id: 'alasroban',
    name: 'Pekalongan — Jalur Alas Roban',
    shortName: 'Alas Roban',
    subtitle: 'Kota Batik & Tanjakan Hutan Berkabut • Truk Berat Merayap Pelan',
    biome: 'forest',
    defaultWeather: 'dawn',
    specialSouvenirId: 'batik_pekalongan',
    stopoverTitle: 'Warung Kopi Puncak Alas Roban & Pekalongan',
    arrivalChatter: {
      speaker: 'Ibu di Kursi Depan',
      avatar: '👩',
      text: 'Hati-hati masuk jalur Alas Roban, Pak. Jalannya menanjak dan berkabut, jaga jarak sama truk gandeng di depan.'
    }
  },
  {
    km: 450,
    id: 'semarang',
    name: 'Semarang — Kaligawe',
    shortName: 'Semarang',
    subtitle: 'Ibu Kota Jawa Tengah • Jembatan Kaligawe, Kota Lama & Lumpia Rebung',
    biome: 'coastal',
    defaultWeather: 'dawn',
    specialSouvenirId: 'lumpia_semarang',
    stopoverTitle: 'Posko Masjid Agung & Pusat Oleh-Oleh Semarang',
    arrivalChatter: {
      speaker: 'Raka (Anak Sulung)',
      avatar: '👦',
      text: 'Sudah separuh jalan lebih, Pak! Semarang kelihatan megah banget, beli Lumpia sama Bandeng Presto yuk!'
    }
  },
  {
    km: 595,
    id: 'tuban',
    name: 'Rembang — Lasem — Tuban',
    shortName: 'Tuban',
    subtitle: 'Pesisir Laut Jawa • Ombak Pantai Utara, Perahu Nelayan & Warung Ikan Asap',
    biome: 'coastal',
    defaultWeather: 'sunset',
    specialSouvenirId: 'siwalan_tuban',
    stopoverTitle: 'Rest Area Pantai Utara Tuban & Warung Lamongan',
    arrivalChatter: {
      speaker: 'Dinda (Anak Bungsu)',
      avatar: '👧',
      text: 'Lihat ke kiri jalan deh! Jalanannya persis di pinggir pantai, banyak perahu warna-warni!'
    }
  },
  {
    km: 780,
    id: 'surabaya',
    name: 'Surabaya — Kampung Halaman!',
    shortName: 'Surabaya',
    subtitle: 'Garis Akhir Perjalanan Mudik • Suara Takbir & Senyum Ibu Menanti di Teras',
    biome: 'town',
    defaultWeather: 'sunset',
    specialSouvenirId: null,
    stopoverTitle: 'Rumah Keluarga di Surabaya',
    arrivalChatter: {
      speaker: 'Ibu di Kursi Depan',
      avatar: '👩',
      text: 'Alhamdulillah Ya Allah... Itu gapura kampung kita sudah kelihatan! Nenek sudah berdiri di depan pagar!'
    }
  }
];

export const ITEMS_CATALOG = {
  kaleng_khongguan: {
    id: 'kaleng_khongguan',
    name: 'Kaleng Biskuit Merah',
    icon: '🥫',
    type: 'both', // Can be eaten in emergency OR kept as prestige souvenir
    price: 65000,
    points: 500,
    effectLabel: 'Oleh-Oleh Wajib (Atau buka: +28% Mood)',
    description: 'Kaleng biskuit merah legendaris. Entah isinya biskuit asli atau rengginang, Nenek pasti senang kalau sampai utuh!',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 28);
      state.stamina = Math.min(100, state.stamina + 8);
      return 'Kaleng biskuit dibuka di mobil! Anak-anak riang ngemil wafer cokelat (+28% Mood Keluarga).';
    }
  },
  kardus_sarung: {
    id: 'kardus_sarung',
    name: 'Kardus Sarung & Baju Lebaran',
    icon: '📦',
    type: 'souvenir',
    price: 150000,
    points: 650,
    effectLabel: 'Oleh-Oleh Utama (+650 Poin Lebaran)',
    description: 'Kardus diikat tali rafia berisi sarung tenun, mukena baru, dan baju Lebaran untuk keluarga di kampung.',
    onUse: null
  },
  kopi_kapal: {
    id: 'kopi_kapal',
    name: 'Termos Kopi Hitam Bapak',
    icon: '☕',
    type: 'usable',
    price: 25000,
    points: 50,
    effectLabel: 'Klik Pakai: +36% Fokus Bapak',
    description: 'Kopi hitam pekat panas di dalam termos. Senjata utama Bapak melawan kantuk di jalur Pantura malam hari.',
    onUse: (state) => {
      state.stamina = Math.min(100, state.stamina + 36);
      return 'Slruuup! Kopi hitam hangat bikin mata Bapak langsung melek (+36% Fokus Bapak).';
    }
  },
  tolak_angin: {
    id: 'tolak_angin',
    name: 'Jamu Sachet & Minyak Kayu Putih',
    icon: '🌿',
    type: 'usable',
    price: 30000,
    points: 60,
    effectLabel: 'Klik Pakai: +24% Mood & +20% Fokus',
    description: 'Aroma minyak kayu putih khas perjalanan jauh dan jamu herbal pengusir mual serta masuk angin.',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 24);
      state.stamina = Math.min(100, state.stamina + 20);
      return 'Aroma minyak kayu putih menyebar di kabin. Perut hangat, mabuk darat hilang (+24% Mood, +20% Fokus).';
    }
  },
  air_radiator: {
    id: 'air_radiator',
    name: 'Coolant & Kunci Pas Darurat',
    icon: '🧰',
    type: 'usable',
    price: 55000,
    points: 80,
    effectLabel: 'Klik Pakai: +30% Kondisi MPV',
    description: 'Cairan pendingin radiator dan peralatan darurat untuk merawat mesin MPV setelah macet atau kena lubang.',
    onUse: (state) => {
      state.condition = Math.min(100, state.condition + 30);
      return 'Bapak mengecek kap mesin dan menambah air radiator. Suara mesin kembali halus (+30% Kondisi MPV).';
    }
  },
  bensin_jerigen: {
    id: 'bensin_jerigen',
    name: 'Jerigen BBM Cadangan (5L)',
    icon: '⛽',
    type: 'usable',
    price: 65000,
    points: 70,
    effectLabel: 'Klik Pakai: +35% Bensin (BBM)',
    description: 'Bensin cadangan di bagasi belakang untuk jaga-jaga kalau antrean SPBU Pantura mengular panjang.',
    onUse: (state) => {
      state.fuel = Math.min(100, state.fuel + 35);
      return 'Bensin cadangan dituang ke tangki MPV (+35% BBM). Aman melanjutkan perjalanan!';
    }
  },
  nanas_subang: {
    id: 'nanas_subang',
    name: 'Keranjang Nanas Madu Subang',
    icon: '🍍',
    type: 'both',
    price: 50000,
    points: 420,
    effectLabel: 'Oleh-Oleh Subang (+420 Poin / +26% Mood)',
    description: 'Nanas madu super manis khas Simpang Jomin Subang. Segar dimakan di jalan atau dibawa ke kampung.',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 26);
      state.stamina = Math.min(100, state.stamina + 12);
      return 'Nanas Madu Subang yang dingin dan manis menyegarkan seisi mobil (+26% Mood, +12% Fokus)!';
    }
  },
  empal_gentong: {
    id: 'empal_gentong',
    name: 'Paket Empal Gentong Cirebon',
    icon: '🍲',
    type: 'both',
    price: 85000,
    points: 480,
    effectLabel: 'Oleh-Oleh Cirebon (+480 Poin / +32% Mood)',
    description: 'Empal gentong kemasan vakum lengkap dengan sambal cabai kering khas Cirebon dan kerupuk kulit.',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 32);
      state.stamina = Math.min(100, state.stamina + 16);
      return 'Makan bersama Empal Gentong Cirebon hangat di mobil (+32% Mood, +16% Fokus Bapak)!';
    }
  },
  telur_asin: {
    id: 'telur_asin',
    name: 'Kotak Telur Asin Bakar Brebes',
    icon: '🥚',
    type: 'both',
    price: 75000,
    points: 500,
    effectLabel: 'Oleh-Oleh Brebes (+500 Poin / +28% Mood)',
    description: 'Telur asin bebek masir berminyak khas Brebes dalam kotak kardus biru ikonik.',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 28);
      return 'Telur asin masir Brebes dibuka buat lauk makan siang di mobil (+28% Mood Keluarga).';
    }
  },
  batik_pekalongan: {
    id: 'batik_pekalongan',
    name: 'Bingkisan Batik Pekalongan',
    icon: '👘',
    type: 'souvenir',
    price: 135000,
    points: 620,
    effectLabel: 'Oleh-Oleh Spesial (+620 Poin Lebaran)',
    description: 'Kain batik tulis dan kemeja batik halus langsung dari pengrajin Kota Batik Pekalongan.',
    onUse: null
  },
  lumpia_semarang: {
    id: 'lumpia_semarang',
    name: 'Besek Lumpia & Bandeng Presto',
    icon: '🌯',
    type: 'both',
    price: 95000,
    points: 540,
    effectLabel: 'Oleh-Oleh Semarang (+540 Poin / +34% Mood)',
    description: 'Besek bambu berisi lumpia rebung udang khas Gang Lombok Semarang dan bandeng presto duri lunak.',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 34);
      return 'Lumpia Semarang garing dengan saus bawang manis disantap rame-rame (+34% Mood Keluarga)!';
    }
  },
  siwalan_tuban: {
    id: 'siwalan_tuban',
    name: 'Buah Siwalan & Legen Tuban',
    icon: '🥥',
    type: 'both',
    price: 60000,
    points: 460,
    effectLabel: 'Oleh-Oleh Tuban (+460 Poin / +25% Fokus & Mood)',
    description: 'Buah lontar/siwalan kenyal dingin dan minuman legen segar khas jalur pesisir Rembang-Tuban.',
    onUse: (state) => {
      state.mood = Math.min(100, state.mood + 25);
      state.stamina = Math.min(100, state.stamina + 25);
      return 'Segarnya buah siwalan dan es legen pesisir Tuban memulihkan tenaga (+25% Mood, +25% Fokus)!';
    }
  }
};

// Interactive Road Trip Events along Pantura
export const PANTURA_EVENTS = [
  {
    id: 'bus_raja_jalanan',
    title: 'Bus Malam "Raja Pantura" Minta Jalan!',
    category: 'LALU LINTAS PANTURA',
    icon: '🚌',
    location: 'Jalur Lurus Pantura',
    minKm: 20,
    maxKm: 750,
    description: 'Dari kaca spion, sebuah bus malam berlampu strobo warna-warni melaju kencang sambil memainkan klakson Telolet Basuri. Anak-anak di kursi belakang langsung berteriak: "Pak, om telolet om!"',
    choices: [
      {
        label: '📯 Balas Klakson & Beri Jalan dengan Aman di Kiri',
        hint: 'Aman + Anak-anak senang dengar balasan Telolet (+14% Mood)',
        apply: (state) => {
          state.mood = Math.min(100, state.mood + 14);
          return {
            text: 'Sopir bus melambaikan tangan dan membunyikan melodi Telolet panjang! Raka dan Dinda tertawa girang di kursi belakang.',
            deltas: ['+14% Mood Keluarga']
          };
        }
      },
      {
        label: '⚡ Ikut Tempel di Belakang Bus Biar Cepat Sampai',
        hint: 'Maju +18 KM lebih cepat, tapi butuh konsentrasi tinggi (-14% Fokus, -8% BBM)',
        apply: (state) => {
          state.distanceKm = Math.min(TOTAL_ROUTE_KM - 2, state.distanceKm + 18);
          state.stamina = Math.max(5, state.stamina - 14);
          state.fuel = Math.max(5, state.fuel - 8);
          return {
            text: 'Bapak memanfaatkan jalur buka-bukaan di belakang bus malam! Jarak terpangkas cepat, meski Ibu sempat pegangan erat di handle pintu.',
            deltas: ['+18 KM Jarak', '-14% Fokus Bapak', '-8% BBM']
          };
        }
      },
      {
        label: '🛑 Tetap Bertahan di Lajur Kanan Tidak Mau Minggir',
        hint: 'Bikin tegang seisi kabin (-12% Mood Keluarga)',
        apply: (state) => {
          state.mood = Math.max(5, state.mood - 12);
          return {
            text: 'Bus malam menyalip tipis dari sebelah kiri sambil klakson panjang. Ibu langsung mengelus dada mengingatkan Bapak agar tidak terpancing emosi.',
            deltas: ['-12% Mood Keluarga']
          };
        }
      }
    ]
  },
  {
    id: 'pasar_tumpah',
    title: 'Kemacetan Pasar Tumpah & Pedagang Asongan',
    category: 'DINAMIKA JALAN RAYA',
    icon: '🏪',
    location: 'Pasar Tumpah Pantura',
    minKm: 60,
    maxKm: 520,
    description: 'Menjelang pasar tradisional, arus lalu lintas tersendat karena warga menyeberang membawa belanjaan Lebaran, becak barang, dan pedagang asongan yang menawarkan tahu sumedang serta telur asin.',
    choices: [
      {
        label: '🍘 Beli Tahu Hangat & Camilan dari Pedagang Asongan (Rp 30.000)',
        hint: 'Hitung-hitung berbagi rezeki Lebaran (+18% Mood Keluarga, +8% Fokus)',
        apply: (state) => {
          if (state.cash >= 30000) {
            state.cash -= 30000;
            state.mood = Math.min(100, state.mood + 18);
            state.stamina = Math.min(100, state.stamina + 8);
            return {
              text: 'Tahu goreng hangat dengan cabai rawit hijau menemani macet. Pedagang mendoakan perjalanan keluarga Bapak selamat sampai tujuan!',
              deltas: ['-Rp 30.000', '+18% Mood Keluarga', '+8% Fokus Bapak']
            };
          }
          state.mood = Math.min(100, state.mood + 5);
          return {
            text: 'Uang tunai di dompet sedang menipis, jadi Bapak menyapa ramah pedagang sambil merayap pelan melewati pasar.',
            deltas: ['+5% Mood Keluarga']
          };
        }
      },
      {
        label: '🎵 Sabar Antre Sambil Putar Lagu Lebaran di Radio',
        hint: 'Hemat uang, hanya makan sedikit BBM & fokus (-6% BBM, -6% Fokus)',
        apply: (state) => {
          state.fuel = Math.max(5, state.fuel - 6);
          state.stamina = Math.max(5, state.stamina - 6);
          return {
            text: 'Dengan sabar Bapak merayap sedikit demi sedikit melewati keramaian pasar tanpa menyenggol satu pun becak.',
            deltas: ['-6% BBM', '-6% Fokus Bapak']
          };
        }
      },
      {
        label: '🛵 Ikut Pemudik Motor Masuk Jalan Tikus Kampung',
        hint: 'Lolos macet (+12 KM), tapi jalan kampung sempit & berbatu (-10% Kondisi MPV)',
        apply: (state) => {
          state.distanceKm = Math.min(TOTAL_ROUTE_KM - 2, state.distanceKm + 12);
          state.condition = Math.max(5, state.condition - 10);
          return {
            text: 'MPV berhasil menembus gang kampung dan sawah warga! Cepat lolos dari pasar, meski suspensi berbunyi keras melewati jalan berbatu.',
            deltas: ['+12 KM Jarak', '-10% Kondisi MPV']
          };
        }
      }
    ]
  },
  {
    id: 'anak_kebelet_pipis',
    title: '"Pak, Berhenti Dulu! Dinda Kebelet Pipis!"',
    category: 'KELUARGA DI KABIN',
    icon: '🚻',
    location: 'Di Dalam MPV Keluarga',
    minKm: 40,
    maxKm: 720,
    description: 'Di tengah perjalanan, anak bungsu mulai gelisah di jok tengah. "Pak, dari tadi AC-nya dingin banget, Dinda kebelet pipis sekarang!" Di depan tampak plang Masjid Jami dan SPBU.',
    choices: [
      {
        label: '🕌 Menepi Sebentar ke Masjid Pinggir Jalan & Cuci Muka',
        hint: 'Gratis, berkah, keluarga lega (+15% Mood, +12% Fokus Bapak, -5% BBM parkir)',
        apply: (state) => {
          state.mood = Math.min(100, state.mood + 15);
          state.stamina = Math.min(100, state.stamina + 12);
          state.fuel = Math.max(5, state.fuel - 4);
          state.cash = Math.max(0, state.cash - 10000);
          return {
            text: 'Sekeluarga mampir ke masjid yang bersih dan sejuk. Bapak sekalian membasuh wajah dengan air wudhu dan mengisi kotak amal Rp 10.000.',
            deltas: ['+15% Mood Keluarga', '+12% Fokus Bapak', '-Rp 10.000 Infaq']
          };
        }
      },
      {
        label: '🏪 Mampir Minimarket Rest Area Sekalian Jajan Es Krim (Rp 45.000)',
        hint: 'Anak-anak super bahagia (+24% Mood Keluarga)',
        apply: (state) => {
          const cost = Math.min(state.cash, 45000);
          state.cash -= cost;
          state.mood = Math.min(100, state.mood + 24);
          return {
            text: 'Selesai dari toilet, anak-anak keluar membawa es krim dan minuman dingin. Suasana kabin langsung ceria kembali!',
            deltas: [`-Rp ${cost.toLocaleString('id-ID')}`, '+24% Mood Keluarga']
          };
        }
      },
      {
        label: '⏳ "Tahan 15 Menit Lagi Ya Nak, Tanggung Lagi Lancar!"',
        hint: 'Hemat waktu (+10 KM), tapi anak rewel sepanjang jalan (-16% Mood)',
        apply: (state) => {
          state.distanceKm = Math.min(TOTAL_ROUTE_KM - 2, state.distanceKm + 10);
          state.mood = Math.max(5, state.mood - 16);
          return {
            text: 'Mobil terus melaju kencang, tapi suasana kabin jadi panik sampai akhirnya ketemu SPBU di kota berikutnya.',
            deltas: ['+10 KM Jarak', '-16% Mood Keluarga']
          };
        }
      }
    ]
  },
  {
    id: 'warung_pecel_lele',
    title: 'Aroma Menggoda Warung Tenda Pecel Lele Lamongan',
    category: 'KULINER MALAM PANTURA',
    icon: '🐟',
    location: 'Bahu Jalan Pantura',
    minKm: 90,
    maxKm: 700,
    description: 'Spanduk kain warna kuning-putih bergambar lele, bebek goreng, dan burung dara berjajar diterangi lampu bohlam hangat. Asap bakaran sambal terasi tercium sampai ke ventilasi mobil!',
    choices: [
      {
        label: '🍛 Mampir Makan Malam Sekeluarga + Teh Hangat (Rp 95.000)',
        hint: 'Pulihkan tenaga penuh (+28% Mood Keluarga, +26% Fokus Bapak)',
        apply: (state) => {
          if (state.cash >= 95000) {
            state.cash -= 95000;
            state.mood = Math.min(100, state.mood + 28);
            state.stamina = Math.min(100, state.stamina + 26);
            state.condition = Math.min(100, state.condition + 6);
            return {
              text: 'Lele goreng garing, lalapan kemangi, nasi uduk hangat, dan sambal lamongan juara! Sambil makan, mesin MPV juga ikut dingin.',
              deltas: ['-Rp 95.000', '+28% Mood', '+26% Fokus', '+6% Kondisi MPV']
            };
          }
          return {
            text: 'Uang di dompet kurang untuk makan besar, jadi Bapak memilih membuka bekal yang ada di mobil.',
            deltas: ['Uang Tidak Cukup']
          };
        }
      },
      {
        label: '☕ Pesan Kopi Hitam & Gorengan Saja Buat Bapak (Rp 20.000)',
        hint: 'Hemat & praktis (+22% Fokus Bapak)',
        apply: (state) => {
          const cost = Math.min(state.cash, 20000);
          state.cash -= cost;
          state.stamina = Math.min(100, state.stamina + 22);
          return {
            text: 'Segelas kopi tubruk panas dan tempe mendoan hangat membuat mata Bapak kembali segar menatap aspal Pantura.',
            deltas: [`-Rp ${cost.toLocaleString('id-ID')}`, '+22% Fokus Bapak']
          };
        }
      },
      {
        label: '🚗 Lewati Saja, Fokus Kejar Target Kilometer',
        hint: 'Tidak keluar uang, tapi perut keroncongan (-8% Mood Keluarga)',
        apply: (state) => {
          state.mood = Math.max(5, state.mood - 8);
          return {
            text: 'Anak-anak menatap spanduk pecel lele dari balik kaca jendela sambil menghela napas lapar.',
            deltas: ['-8% Mood Keluarga']
          };
        }
      }
    ]
  },
  {
    id: 'jalan_berlubang_jembatan',
    title: 'Perbaikan Jembatan & Jalan Berlubang Pantura',
    category: 'KONDISI JALAN',
    icon: '🚧',
    location: 'Jembatan Sungai Pantura',
    minKm: 50,
    maxKm: 740,
    description: 'Di depan terlihat barikade kerucut oranye dan penyempitan lajur di atas jembatan rangka baja kuning. Aspal di sekitarnya mengelupas akibat dilewati truk muatan berat dan diguyur hujan.',
    choices: [
      {
        label: '🐢 Kurangi Kecepatan &Pilih Jalur Aspal Paling Mulus',
        hint: 'Mobil dan oleh-oleh di atap aman (-5% BBM karena merayap)',
        apply: (state) => {
          state.fuel = Math.max(5, state.fuel - 5);
          state.mood = Math.min(100, state.mood + 5);
          return {
            text: 'Manuver halus Bapak melewati celah lubang membuat Ibu mengacungkan jempol. Kardus oleh-oleh di atap tetap aman!',
            deltas: ['-5% BBM', '+5% Mood Keluarga']
          };
        }
      },
      {
        label: '🙋‍♂️ Ikuti Arahan "Pak Ogah" Lokal dengan Kasih Uang Receh (Rp 5.000)',
        hint: 'Dibantu bukakan jalur aman melewati truk (+8% Fokus, -Rp 5.000)',
        apply: (state) => {
          const cost = Math.min(state.cash, 5000);
          state.cash -= cost;
          state.stamina = Math.min(100, state.stamina + 8);
          return {
            text: '"Terus Pak, kiri dikit... balas kanan, mantap!" Berkat aba-aba warga lokal, MPV lolos dari jebakan lubang dalam.',
            deltas: ['-Rp 5.000', '+8% Fokus Bapak']
          };
        }
      },
      {
        label: '💨 Hajar Terus Biar Tidak Disalip Truk dari Belakang',
        hint: 'Cepat lewat, tapi suspensi menghantam lubang (-16% Kondisi MPV, -10% Mood)',
        apply: (state) => {
          const dmg = Math.round(16 / state.mpv.durability);
          state.condition = Math.max(5, state.condition - dmg);
          state.mood = Math.max(5, state.mood - 10);
          return {
            text: 'GUBRAK! Ban depan menghantam lubang cukup dalam. Kaleng biskuit di atap sampai berbunyi gemerincing!',
            deltas: [`-${dmg}% Kondisi MPV`, '-10% Mood Keluarga']
          };
        }
      }
    ]
  },
  {
    id: 'hujan_deras_terpal',
    title: 'Awan Gelap & Guyuran Hujan Tropis Pantura!',
    category: 'CUACA EKSTREM',
    icon: '⛈️',
    location: 'Lintas Sawah Pantura',
    minKm: 80,
    maxKm: 730,
    description: 'Langit mendadak gelap gulita disusul rintik hujan besar yang mengaburkan kaca depan. Ibu langsung teringat kardus sarung dan oleh-oleh yang diikat di atas rak atap mobil!',
    choices: [
      {
        label: '🛡️ Menepi Sebentar, Kencangkan Terpal Biru & Nyalakan Wiper',
        hint: 'Oleh-oleh di atap 100% terlindungi (+8% Mood, -6% Fokus Bapak)',
        apply: (state) => {
          state.tarpSecured = true;
          state.mood = Math.min(100, state.mood + 8);
          state.stamina = Math.max(5, state.stamina - 6);
          return {
            text: 'Bapak sigap memastikan ikatan tali rafia dan terpal biru menutup rapat seluruh kardus oleh-oleh. Air hujan tidak tembus sedikit pun!',
            deltas: ['Terpal Atap Aman', '+8% Mood Keluarga', '-6% Fokus Bapak']
          };
        }
      },
      {
        label: '🚗 Terus Jalan Pelan dengan Lampu Utama Menyala (Jangan Pakai Hazard!)',
        hint: 'Mengemudi sesuai aturan keselamatan (+10% Fokus, aman jika terpal sudah rapat)',
        apply: (state) => {
          if (!state.tarpSecured && state.inventory.length > 0) {
            state.mood = Math.max(5, state.mood - 12);
            return {
              text: 'Mobil tetap stabil menembus hujan, tapi ujung terpal atap agak berkibar tertiup angin kencang. Ibu jadi agak cemas memikirkan kardus di atas.',
              deltas: ['-12% Mood Keluarga (Terpal Kurang Rapat)']
            };
          }
          state.mood = Math.min(100, state.mood + 6);
          return {
            text: 'Dengan lampu utama menyala dan kecepatan terjaga, MPV membelah genangan air hujan Pantura dengan mantap dan aman.',
            deltas: ['+6% Mood Keluarga']
          };
        }
      }
    ]
  },
  {
    id: 'pemudik_motor_mogok',
    title: 'Sesama Pemudik Motor Kehabisan Bensin di Pinggir Sawah',
    category: 'SOLIDARITAS MUDIK',
    icon: '🛵',
    location: 'Pinggir Sawah Pantura',
    minKm: 70,
    maxKm: 680,
    description: 'Seorang pemudik motor yang membawa kardus bertuliskan "Mudik Ceria - Kampung Halaman" tampak mendorong motornya di bahu jalan bersama istrinya karena kehabisan bensin jauh dari SPBU.',
    choices: [
      {
        label: '⛽ Berbagi Sedikit Bensin & Air Minum untuk Mereka',
        hint: 'Mengurangi -8% BBM, tapi hati keluarga hangat (+22% Mood Keluarga)',
        apply: (state) => {
          state.fuel = Math.max(5, state.fuel - 8);
          state.mood = Math.min(100, state.mood + 22);
          return {
            text: 'Pemudik motor itu sangat berterima kasih dan mendoakan perjalanan keluarga Bapak lancar sampai rumah. Anak-anak belajar arti tolong-menolong di jalan.',
            deltas: ['-8% BBM', '+22% Mood Keluarga', '+150 Poin Berkah Mudik']
          };
        }
      },
      {
        label: '💵 Beri Bantuan Uang Beli Bensin Eceran (Rp 25.000)',
        hint: 'Bantu sesama pemudik (+16% Mood Keluarga, -Rp 25.000)',
        apply: (state) => {
          const cost = Math.min(state.cash, 25000);
          state.cash -= cost;
          state.mood = Math.min(100, state.mood + 16);
          return {
            text: 'Bapak membuka kaca dan memberikan uang untuk membeli bensin Pertamini di warung depan. Senyum lega terpancar dari wajah mereka.',
            deltas: [`-Rp ${cost.toLocaleString('id-ID')}`, '+16% Mood Keluarga']
          };
        }
      },
      {
        label: '📯 Bunyikan Klakson Pendek Sapa Semangat & Lanjut Jalan',
        hint: 'Tidak mengurangi resource',
        apply: () => {
          return {
            text: 'Bapak membunyikan klakson sapaan ramah "Tit-tit!" memberi semangat kepada sesama pejuang mudik Pantura.',
            deltas: ['Perjalanan Berlanjut']
          };
        }
      }
    ]
  },
  {
    id: 'tanjakan_alas_roban',
    title: 'Tanjakan & Tikungan Berkabut Jalur Alas Roban!',
    category: 'JALUR LEGENDARIS',
    icon: '🌲',
    location: 'Hutan Alas Roban - Batang',
    minKm: 310,
    maxKm: 430,
    description: 'Pohon-pohon beringin besar menjulang di kiri-kanan jalan yang berkelok tajam dan menanjak. Di depan ada iring-iringan truk tronton yang merayap dengan kepulan asap knalpot tebal.',
    choices: [
      {
        label: '⚙️ Turunkan ke Gigi Rendah, Matikan AC Sebentar & Menanjak Mantap',
        hint: 'Mesin MPV awet (+5% Kondisi), hanya sedikit gerah (-6% Mood)',
        apply: (state) => {
          state.condition = Math.min(100, state.condition + 5);
          state.mood = Math.max(5, state.mood - 6);
          return {
            text: 'Trik klasik Bapak mematikan AC di tanjakan curam terbukti ampuh! MPV menaklukkan tanjakan Alas Roban tanpa gejala overheat.',
            deltas: ['+5% Kondisi MPV', '-6% Mood Keluarga']
          };
        }
      },
      {
        label: '🔦 Nyalakan Lampu Dim & Salip Truk Saat Jalur Kosong',
        hint: 'Cepat lolos (+15 KM), tapi menguras bensin & fokus (-10% BBM, -10% Fokus)',
        apply: (state) => {
          state.distanceKm = Math.min(TOTAL_ROUTE_KM - 2, state.distanceKm + 15);
          state.fuel = Math.max(5, state.fuel - 10);
          state.stamina = Math.max(5, state.stamina - 10);
          return {
            text: 'Raungan mesin MPV menggema di tengah hutan Alas Roban saat berhasil mendahului tiga truk gandeng sekaligus!',
            deltas: ['+15 KM Jarak', '-10% BBM', '-10% Fokus Bapak']
          };
        }
      }
    ]
  },
  {
    id: 'banjir_rob_kaligawe',
    title: 'Genangan Banjir Rob di Jalur Pesisir Semarang!',
    category: 'TANTANGAN PESISIR',
    icon: '🌊',
    location: 'Kaligawe - Semarang',
    minKm: 420,
    maxKm: 560,
    description: 'Air pasang laut utara (banjir rob) menggenangi sebagian aspal jalur Pantura setinggi mata kaki. Kendaraan di depan melambat menjaga agar air tidak masuk ke knalpot.',
    choices: [
      {
        label: '🚙 Tahan Gas Konstan di Lajur Tengah Paling Dangkal',
        hint: 'Teknik mengemudi aman melewati genangan (-8% Fokus, -6% BBM)',
        apply: (state) => {
          state.stamina = Math.max(5, state.stamina - 8);
          state.fuel = Math.max(5, state.fuel - 6);
          return {
            text: 'Bapak menjaga putaran mesin tetap stabil di lajur tengah. MPV berhasil melewati genangan rob tanpa mogok sedikit pun!',
            deltas: ['-8% Fokus Bapak', '-6% BBM']
          };
        }
      },
      {
        label: '🧽 Lewat Jalur Alternatif + Cuci Kolong Mobil dari Air Asin (Rp 35.000)',
        hint: 'Mesin & sasis bersih bebas karat (+14% Kondisi MPV, -Rp 35.000)',
        apply: (state) => {
          const cost = Math.min(state.cash, 35000);
          state.cash -= cost;
          state.condition = Math.min(100, state.condition + 14);
          return {
            text: 'Selepas genangan, Bapak mampir sebentar ke tempat semprot air tawar warga agar sasis mobil bebas dari sisa air laut asin.',
            deltas: [`-Rp ${cost.toLocaleString('id-ID')}`, '+14% Kondisi MPV']
          };
        }
      }
    ]
  },
  {
    id: 'karaoke_keluarga',
    title: 'Lagu Nostalgia Mudik Mengalun di Radio Pantura FM!',
    category: 'SUASANA KABIN',
    icon: '📻',
    location: 'Kabin MPV Keluarga',
    minKm: 15,
    maxKm: 760,
    description: 'Penyiar Radio Pantura FM memutarkan lagu mudik legendaris diikuti salam-salam dari para pemudik se-Pulau Jawa. Ibu dan anak-anak langsung kompak bernyanyi bersama di dalam mobil!',
    choices: [
      {
        label: '🎤 Ikut Nyanyi Bareng Sekeluarga Sepanjang Jalan!',
        hint: 'Suasana hangat & kantuk hilang (+18% Mood Keluarga, +14% Fokus Bapak)',
        apply: (state) => {
          state.mood = Math.min(100, state.mood + 18);
          state.stamina = Math.min(100, state.stamina + 14);
          return {
            text: 'Gelak tawa dan nyanyian bersama di dalam kabin MPV membuat rasa lelah ratusan kilometer terasa hilang seketika!',
            deltas: ['+18% Mood Keluarga', '+14% Fokus Bapak']
          };
        }
      },
      {
        label: '📞 Titip Salam Lewat Radio Buat Nenek di Surabaya',
        hint: 'Bikin semua tak sabar sampai rumah (+22% Mood Keluarga)',
        apply: (state) => {
          state.mood = Math.min(100, state.mood + 22);
          return {
            text: '"Salam buat Ibu Hajah di Surabaya, tunggu kami sebentar lagi sampai bawa kaleng biskuit!" seru Raka lewat pesan radio.',
            deltas: ['+22% Mood Keluarga']
          };
        }
      }
    ]
  }
];

export const AMBIENT_CHATTER_POOL = [
  {
    speaker: 'Ibu di Kursi Depan',
    avatar: '👩',
    text: 'Pak, nanti kalau lewat kota yang terkenal makanannya, kita mampir beli oleh-oleh buat tetangga di kampung ya.'
  },
  {
    speaker: 'Raka (Anak Sulung)',
    avatar: '👦',
    text: 'Keren banget lihat truk-truk Pantura tulisannya lucu-lucu: "Kangen Masakan Ibu", "Pergi Karena Tugas, Pulang Karena Cinta"!'
  },
  {
    speaker: 'Dinda (Anak Bungsu)',
    avatar: '👧',
    text: 'Pak, nanti di rumah Nenek aku mau langsung makan opor ayam sama ketupat lebaran!'
  },
  {
    speaker: 'Ibu di Kursi Depan',
    avatar: '👩',
    text: 'Kalau mata mulai berat jangan dipaksain ngebut ya Pak, seduh Kopi Hitam di bagasi atau kita menepi ke Posko Mudik.'
  },
  {
    speaker: 'Raka (Anak Sulung)',
    avatar: '👦',
    text: 'Lihat motor di sebelah kiri itu Pak, bawa kardus sama kaleng Khong Guan diikat rapi banget di jok belakang!'
  },
  {
    speaker: 'Dinda (Anak Bungsu)',
    avatar: '👧',
    text: 'Lampu jalanan Pantura kalau malam warnanya kuning hangat bagus banget ya Bu!'
  }
];
