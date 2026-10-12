// Data Gunung-Gunung di Indonesia
const MOUNTAIN_DATA = [
  {
    id: 'prau',
    name: 'Gunung Prau',
    region: 'Dieng, Jawa Tengah',
    trailName: 'Jalur Patakbanteng',
    peakName: 'Puncak 2565 mdpl',
    elevation: 2565,
    baseElevation: 2050,
    totalDistance: 4500, // meter
    description: 'Terkenal dengan Golden Sunrise terbaik se-Asia Tenggara dan hamparan bukit teletubbies berbunga.',
    skyTheme: 'dieng',
    accentColor: '#f59e0b',
    unlockedByDefault: true,
    checkpoints: [
      { name: 'Basecamp Patakbanteng', distance: 0, elevation: 2050, desc: 'Pengecekan perlengkapan & registrasi simaksi.' },
      { name: 'Pos 1 - Senthong', distance: 800, elevation: 2150, desc: 'Awal pendakian melewati kebun sayur warga.' },
      { name: 'Pos 2 - Semar', distance: 1800, elevation: 2280, desc: 'Pohon beringin rindang tempat istirahat pendaki.' },
      { name: 'Pos 3 - Cacingan', distance: 3000, elevation: 2420, desc: 'Tanjakan tanah berundak yang cukup menguras keringat.' },
      { name: 'Camp Bukit Teletubbies', distance: 4000, elevation: 2540, desc: 'Savana bergelombang tempat mendirikan tenda dome.' },
      { name: 'Puncak Gunung Prau', distance: 4500, elevation: 2565, desc: 'Pemandangan megah Gunung Sindoro & Sumbing berselimut awan!' }
    ],
    funFacts: [
      'Pemandangan sunrise di Prau memperlihatkan lanskap Gunung Sindoro dan Sumbing yang simetris sempurna.',
      'Prau memiliki hamparan bunga daisy dan edelweis yang mekar indah di musim kemarau.',
      'Waktu tempuh pendakian relatif ramah untuk pendaki pemula (3-4 jam).'
    ]
  },
  {
    id: 'bromo',
    name: 'Gunung Bromo',
    region: 'Tengger, Jawa Timur',
    trailName: 'Jalur Cemoro Lawang',
    peakName: 'Bibir Kawah Bromo',
    elevation: 2329,
    baseElevation: 1900,
    totalDistance: 5200,
    description: 'Gunung suci suku Tengger di tengah hamparan Lautan Pasir vulkanik yang mistis dan menakjubkan.',
    skyTheme: 'bromo',
    accentColor: '#ef4444',
    unlockCost: 250000, // Rp
    checkpoints: [
      { name: 'Basecamp Cemoro Lawang', distance: 0, elevation: 1900, desc: 'Desa tertinggi menghadap kaldera Tengger berkabut.' },
      { name: 'Gerbang Lautan Pasir', distance: 1200, elevation: 1980, desc: 'Memasuki hamparan pasir bisik yang luas.' },
      { name: 'Pura Luhur Poten', distance: 2600, elevation: 2040, desc: 'Tempat ibadah suci umat Hindu Tengger di tengah kaldera.' },
      { name: 'Kaki Kawah Bromo', distance: 3800, elevation: 2120, desc: 'Aroma belerang mulai tercium saat mendekati kawah.' },
      { name: 'Tangga 250 Anak Tangga', distance: 4700, elevation: 2240, desc: 'Tanjakan tangga beton menuju bibir kawah aktif.' },
      { name: 'Bibir Kawah Bromo', distance: 5200, elevation: 2329, desc: 'Gemuruh magma alami dan asap putih vulkanik yang megah!' }
    ],
    funFacts: [
      'Setiap tahun digelar upacara Yadnya Kasada dengan melempar sesaji ke dalam kawah.',
      'Bromo merupakan gunung berapi aktif yang berada dalam kaldera raksasa seluas 10 km.',
      'Suhu udara di subuh hari bisa mencapai 2 - 5 derajat Celcius.'
    ]
  },
  {
    id: 'merapi',
    name: 'Gunung Merapi',
    region: 'Boyolali / Sleman, DIY-Jateng',
    trailName: 'Jalur Selo Baru',
    peakName: 'Pasar Bubrah - Puncak Garuda',
    elevation: 2930,
    baseElevation: 1560,
    totalDistance: 6800,
    description: 'Salah satu gunung api paling aktif di dunia dengan jalur pasir batu dan panorama spektakuler Gunung Merbabu.',
    skyTheme: 'volcanic',
    accentColor: '#f97316',
    unlockCost: 750000,
    checkpoints: [
      { name: 'Basecamp Selo', distance: 0, elevation: 1560, desc: 'Pemandangan indah lereng Merbabu di belakang kita.' },
      { name: 'Gerbang Taman Nasional', distance: 1200, elevation: 1800, desc: 'Memasuki kawasan hutan pinus dan perkebunan tembakau.' },
      { name: 'Pos 1 - Simpang Selo', distance: 2500, elevation: 2150, desc: 'Jalur tanah padat yang mulai menanjak tajam.' },
      { name: 'Pos 2 - Pitu', distance: 4000, elevation: 2420, desc: 'Vegetasi mulai menipis berganti bebatuan andesit.' },
      { name: 'Pos 3 - Watu Belah', distance: 5400, elevation: 2680, desc: 'Batu besar terbelah dua yang ikonik di lereng berbatu.' },
      { name: 'Pasar Bubrah & Puncak', distance: 6800, elevation: 2930, desc: 'Hamparan pasir batu tepat di bawah kubah lava Merapi!' }
    ],
    funFacts: [
      'Pasar Bubrah adalah batas aman pendakian dan tempat mendirikan tenda dengan pemandangan bintang.',
      'Merapi dijuluki "Gunung Api Abadi" dengan aktivitas vulkanik yang terpantau 24 jam.',
      'Dari lereng Merapi, Gunung Merbabu tampak seperti benteng hijau raksasa.'
    ]
  },
  {
    id: 'semeru',
    name: 'Gunung Semeru',
    region: 'Lumajang / Malang, Jawa Timur',
    trailName: 'Jalur Ranu Pani - Mahameru',
    peakName: 'Puncak Mahameru 3676 mdpl',
    elevation: 3676,
    baseElevation: 2100,
    totalDistance: 12000,
    description: 'Atap Pulau Jawa! Danau Ranu Kumbolo nan magis, hamparan Oro-oro Ombo, dan puncak legendaris Mahameru.',
    skyTheme: 'semeru',
    accentColor: '#3b82f6',
    unlockCost: 2000000,
    checkpoints: [
      { name: 'Basecamp Ranu Pani', distance: 0, elevation: 2100, desc: 'Danau dingin di pedesaan Tengger titik awal petualangan.' },
      { name: 'Pos 2 & Watu Rejeng', distance: 2500, elevation: 2200, desc: 'Jalur setapak melipir tebing batu terjal yang megah.' },
      { name: 'Ranu Kumbolo (Danau Magis)', distance: 5000, elevation: 2400, desc: 'Danau kristal di pelukan bukit pinus, surga para pendaki.' },
      { name: 'Tanjakan Cinta & Oro-Oro Ombo', distance: 6800, elevation: 2460, desc: 'Savana bunga ungu Verbena Brasiliensis yang mempesona.' },
      { name: 'Cemoro Kandang & Kalimati', distance: 9500, elevation: 2700, desc: 'Camp terakhir di bawah lereng pasir tegak Mahameru.' },
      { name: 'Puncak Mahameru 3676 mdpl', distance: 12000, elevation: 3676, desc: 'Puncak tertinggi Jawa! Menatap letupan wedhus gembel kawah Jonggring Saloko.' }
    ],
    funFacts: [
      'Ranu Kumbolo sering diselimuti kabut pagi dengan suhu embun es (frost/upas) di musim kemarau.',
      'Di Tanjakan Cinta, mitosnya pendaki dilarang menoleh ke belakang agar cinta mereka abadi.',
      'Kawah Jonggring Saloko meletupkan abu setiap 15-30 menit sekali secara berkala.'
    ]
  },
  {
    id: 'rinjani',
    name: 'Gunung Rinjani',
    region: 'Lombok, Nusa Tenggara Barat',
    trailName: 'Jalur Sembalun - Segara Anak',
    peakName: 'Puncak Dewi Anjani 3726 mdpl',
    elevation: 3726,
    baseElevation: 1156,
    totalDistance: 14500,
    description: 'Kaldera terindah di dunia dengan Danau Segara Anak dan anak gunung Barujari di tengahnya.',
    skyTheme: 'rinjani',
    accentColor: '#10b981',
    unlockCost: 5000000,
    checkpoints: [
      { name: 'Pintu Gerbang Sembalun', distance: 0, elevation: 1156, desc: 'Hamparan savana emas luas membentang sejauh mata memandang.' },
      { name: 'Pos 2 - Tengengean', distance: 3000, elevation: 1500, desc: 'Jembatan sungai kering tempat istirahat makan siang.' },
      { name: 'Pos 3 - Pada Balong', distance: 6000, elevation: 1800, desc: 'Awal dari "Bukit Penyesalan" tanjakan bertingkat 7 punggungan.' },
      { name: 'Pelawangan Sembalun', distance: 9500, elevation: 2639, desc: 'Pemandangan luar biasa menatap Danau Segara Anak dan Barujari!' },
      { name: 'Letter E (Jalur Pasir Rinjani)', distance: 12500, elevation: 3200, desc: 'Mendaki dua langkah, merosot satu langkah di bibir jurang.' },
      { name: 'Puncak Dewi Anjani 3726 mdpl', distance: 14500, elevation: 3726, desc: 'Melihat Pulau Sumbawa, Gunung Agung Bali, dan samudra luas tanpa batas!' }
    ],
    funFacts: [
      'Pemandangan kaldera Segara Anak dinobatkan sebagai salah satu lanskap tercantik di planet Bumi.',
      'Gunung Barujari yang berada di tengah danau adalah anak gunung yang masih terus bertumbuh.',
      'Air Danau Segara Anak mengandung mata air panas alami (Aiq Kalak) yang menyegarkan badan.'
    ]
  },
  {
    id: 'kerinci',
    name: 'Gunung Kerinci',
    region: 'Jambi / Sumbar, Sumatera',
    trailName: 'Jalur Kersik Tuo',
    peakName: 'Puncak Indrapura 3805 mdpl',
    elevation: 3805,
    baseElevation: 1800,
    totalDistance: 16000,
    description: 'Gunung berapi tertinggi di Indonesia & Asia Tenggara, berdiri anggun di tengah rimba Taman Nasional Kerinci Seblat.',
    skyTheme: 'kerinci',
    accentColor: '#8b5cf6',
    unlockCost: 12000000,
    checkpoints: [
      { name: 'Pintu Rimba Kersik Tuo', distance: 0, elevation: 1800, desc: 'Gerbang perbatasan antara kebun teh Kayu Aro dan hutan hujan tropis.' },
      { name: 'Pos 2 - Batu Gantung', distance: 3500, elevation: 2225, desc: 'Hutan kanopi lebat rumah bagi satwa endemik harimau dan siamang.' },
      { name: 'Shelter 1', distance: 7000, elevation: 2505, desc: 'Jalur lorong akar pohon berlumut yang menyerupai terowongan alam.' },
      { name: 'Shelter 2 & Shelter 3', distance: 11000, elevation: 3073, desc: 'Camp tertinggi di batas vegetasi sebelum zona cadas terbuka.' },
      { name: 'Tugu Yudha (Cadas Kerinci)', distance: 14000, elevation: 3500, desc: 'Plataran cadas berbatu tempat mengenang pendaki pemberani.' },
      { name: 'Puncak Indrapura 3805 mdpl', distance: 16000, elevation: 3805, desc: 'Atap Pulau Sumatera! Menatap samudra Hindia dan kawah hijau toska raksasa!' }
    ],
    funFacts: [
      'Gunung Kerinci adalah gunung berapi tertinggi di Asia Tenggara (3.805 mdpl).',
      'Di kaki gunungnya terdapat Perkebunan Teh Kayu Aro, kebun teh tertua dan tertinggi di Indonesia.',
      'Sering terdengar suara panggilan kera siamang yang bersahut-sahutan di dalam hutan rimba.'
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MOUNTAIN_DATA };
}
