/**
 * ==============================================================================
 * KARTU BIODATA DIRI — RIKO LONDONG
 * Logika Interaktif: Salin Data, Ekspor Kontak (.vcf), Cetak Kartu, Ganti Tema
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // --- Cache Elemen DOM ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Tombol aksi bawah
  const dockCopyAllBtn = document.getElementById('dockCopyAllBtn');
  const dockDownloadVCardBtn = document.getElementById('dockDownloadVCardBtn');
  const dockPrintBtn = document.getElementById('dockPrintBtn');

  // Elemen tampilan profil
  const cardAvatarImg = document.getElementById('cardAvatarImg');
  const displayName = document.getElementById('displayName');
  const displayRole = document.getElementById('displayRole');
  const displayLocation = document.getElementById('displayLocation');

  // Elemen nilai field
  const valNama = document.getElementById('valNama');
  const valTtl = document.getElementById('valTtl');
  const valGender = document.getElementById('valGender');
  const valEducation = document.getElementById('valEducation');
  const valAddress = document.getElementById('valAddress');
  const valEmail = document.getElementById('valEmail');
  const valPhone = document.getElementById('valPhone');
  const valSkills = document.getElementById('valSkills');
  const valBio = document.getElementById('valBio');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimeout = null;

  // Data Biodata Riko Londong (Sinkron dengan Profil LinkedIn & Portofolio)
  const biodataRiko = {
    nama: 'Riko Londong',
    role: 'Software Engineer & Web Developer',
    location: 'Jakarta, Indonesia',
    focus: 'Full Stack & Frontend Systems',
    ttl: 'Bandung, 14 Agustus 1997',
    gender: 'Laki-laki',
    education: 'S1 Teknik Informatika',
    address: 'Jakarta, Indonesia',
    email: 'riko.londong1997@gmail.com',
    phone: '+62 812-9876-5432',
    linkedin: 'https://www.linkedin.com/in/rikolondong/',
    github: 'https://github.com/rikolondong',
    skills: [
      'HTML5 Semantic',
      'Modern Vanilla CSS',
      'JavaScript (ES6+)',
      'Full Stack & APIs',
      'Node.js Runtime',
      'Responsive Layouts',
      'Git & GitHub',
      'UI/UX & Figma'
    ],
    bio: 'Software Engineer & Web Developer lulusan Teknik Informatika dengan fokus pada pengembangan antarmuka web modern, frontend systems, dan integrasi API yang andal. Mengutamakan kode bersih, arsitektur kokoh, performa optimal, serta kenyamanan pengalaman pengguna (UI/UX).',
    avatar: 'riko.jpg'
  };

  // ==========================================================================
  // 1. FUNGSI NOTIFIKASI TOAST
  // ==========================================================================
  function showToast(pesan) {
    if (!toastNotification || !toastMessage) return;

    toastMessage.textContent = pesan;
    toastNotification.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2600);
  }

  // ==========================================================================
  // 2. SALIN NILAI PER-BARIS
  // ==========================================================================
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const teks = targetEl.textContent.trim();
      navigator.clipboard.writeText(teks).then(() => {
        showToast(`Tersalin: "${teks}"`);
      }).catch(() => {
        showToast('Gagal menyalin ke clipboard.');
      });
    });
  });

  // ==========================================================================
  // 3. SALIN SELURUH TEKS BIODATA
  // ==========================================================================
  if (dockCopyAllBtn) {
    dockCopyAllBtn.addEventListener('click', () => {
      const skillsText = biodataRiko.skills.join(', ');

      const formatted = `
BIODATA DIRI — ${biodataRiko.nama.toUpperCase()}
--------------------------------------------------
Nama Lengkap        : ${biodataRiko.nama}
Profesi / Posisi    : ${biodataRiko.role}
Fokus Keahlian      : ${biodataRiko.focus}
Domisili            : ${biodataRiko.location}
Tempat, Tgl Lahir   : ${biodataRiko.ttl}
Jenis Kelamin       : ${biodataRiko.gender}
Pendidikan Terakhir : ${biodataRiko.education}
Alamat Lengkap      : ${biodataRiko.address}
Email               : ${biodataRiko.email}
LinkedIn            : ${biodataRiko.linkedin}
GitHub              : ${biodataRiko.github}
Telepon / WhatsApp  : ${biodataRiko.phone}
Keahlian            : ${skillsText}

Tentang Saya:
${biodataRiko.bio}
--------------------------------------------------
      `.trim();

      navigator.clipboard.writeText(formatted).then(() => {
        showToast('Seluruh data biodata berhasil disalin!');
      }).catch(() => {
        showToast('Gagal menyalin biodata.');
      });
    });
  }

  // ==========================================================================
  // 4. UNDUH KONTAK VCARD (.VCF)
  // ==========================================================================
  if (dockDownloadVCardBtn) {
    dockDownloadVCardBtn.addEventListener('click', () => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${biodataRiko.nama}`,
        `TITLE:${biodataRiko.role}`,
        `EMAIL;TYPE=INTERNET:${biodataRiko.email}`,
        `TEL;TYPE=CELL:${biodataRiko.phone}`,
        `URL;TYPE=LinkedIn:${biodataRiko.linkedin}`,
        `URL;TYPE=GitHub:${biodataRiko.github}`,
        `ADR;TYPE=HOME:;;${biodataRiko.address};;;;`,
        `NOTE:${biodataRiko.bio.replace(/\n/g, ' ')}`,
        'END:VCARD'
      ].join('\r\n');

      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `kontak_${biodataRiko.nama.toLowerCase().replace(/\s+/g, '_')}.vcf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Kontak vCard untuk "${biodataRiko.nama}" berhasil diunduh!`);
    });
  }

  // ==========================================================================
  // 5. CETAK KARTU / SIMPAN PDF
  // ==========================================================================
  if (dockPrintBtn) {
    dockPrintBtn.addEventListener('click', () => {
      showToast('Membuka menu cetak kartu...');
      setTimeout(() => {
        window.print();
      }, 250);
    });
  }

  // ==========================================================================
  // 6. TOGGLE TEMA GELAP / TERANG (NEUMORPHISM)
  // ==========================================================================
  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    localStorage.setItem('riko_biodata_theme', theme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = body.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      showToast(`Tema berganti ke ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`);
    });
  }

  // ==========================================================================
  // 7. INISIALISASI TAMPILAN
  // ==========================================================================
  const savedTheme = localStorage.getItem('riko_biodata_theme') || 'light';
  applyTheme(savedTheme);

  // Pastikan data selalu terpasang dengan rapi
  if (displayName) displayName.textContent = biodataRiko.nama;
  if (valNama) valNama.textContent = biodataRiko.nama;
  if (displayRole) displayRole.textContent = biodataRiko.role;
  if (displayLocation) {
    const locSpan = displayLocation.querySelector('span');
    if (locSpan) locSpan.textContent = biodataRiko.location;
  }
  const valFocus = document.getElementById('valFocus');
  if (valFocus) valFocus.textContent = biodataRiko.focus;

  if (valTtl) valTtl.textContent = biodataRiko.ttl;
  if (valGender) valGender.textContent = biodataRiko.gender;
  if (valEducation) valEducation.textContent = biodataRiko.education;
  if (valAddress) valAddress.textContent = biodataRiko.address;
  if (valBio) valBio.textContent = biodataRiko.bio;

  if (valEmail) {
    valEmail.textContent = biodataRiko.email;
    valEmail.setAttribute('href', `mailto:${biodataRiko.email}`);
  }

  const valLinkedin = document.getElementById('valLinkedin');
  if (valLinkedin) {
    valLinkedin.textContent = 'linkedin.com/in/rikolondong';
    valLinkedin.setAttribute('href', biodataRiko.linkedin);
  }

  const valGithub = document.getElementById('valGithub');
  if (valGithub) {
    valGithub.textContent = 'github.com/rikolondong';
    valGithub.setAttribute('href', biodataRiko.github);
  }

  if (valPhone) {
    valPhone.textContent = biodataRiko.phone;
    const cleanPhone = biodataRiko.phone.replace(/[^0-9+]/g, '');
    valPhone.setAttribute('href', `tel:${cleanPhone}`);
  }

  if (biodataRiko.avatar && cardAvatarImg) {
    cardAvatarImg.src = biodataRiko.avatar;
  }
});
