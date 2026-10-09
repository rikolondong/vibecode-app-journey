/**
 * PT NUSA SAWIT AGRO TBK
 * Enterprise Front-end Scripts
 * Focus: Lightweight, dependable, clean UX
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeaderScroll();
  initProductModals();
  initInquiryForm();
  initReportDownload();
});

/* Mobile Menu Navigation */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('mobile-active');
      const isOpen = mainNav.classList.contains('mobile-active');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('mobile-active');
      });
    });
  }
}

/* Header Scroll Elevation */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.style.boxShadow = '0 2px 10px rgba(20, 45, 30, 0.06)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
}

/* Product Specification Data & Modal */
const enterpriseProducts = {
  cpo: {
    title: 'Crude Palm Oil (CPO)',
    grade: 'Minyak Sawit Mentah • Standar Ekspor',
    description: 'Minyak kelapa sawit mentah berkualitas tinggi hasil ekstraksi mesocarp tandan buah segar dalam waktu kurang dari 24 jam setelah panen. Diproses tanpa zat aditif dan memenuhi kriteria keberlanjutan RSPO.',
    specs: [
      { param: 'Asam Lemak Bebas (FFA)', value: '< 3.00% Max' },
      { param: 'Kadar Air & Kotoran (M&I)', value: '< 0.20% Max' },
      { param: 'DOBI (Bleachability Index)', value: '> 2.80 Min' },
      { param: 'Bilangan Iodin (IV)', value: '50 - 55 Wijs' },
      { param: 'Sertifikasi Terkait', value: 'RSPO (IP/MB), ISPO, Halal' },
      { param: 'Bentuk Pengiriman', value: 'Kapal Tangker Curah, Flexibag 21 MT' }
    ]
  },
  olein: {
    title: 'RBD Palm Olein',
    grade: 'Fraksi Pangan • Minyak Goreng Nabati',
    description: 'Fraksi cair hasil pemurnian, pemutihan, dan penghilangan bau dari CPO. Jernih keemasan pada suhu ruang, memiliki stabilitas oksidasi tinggi, serta bebas dari asam lemak trans.',
    specs: [
      { param: 'Asam Lemak Bebas (as Palmitic)', value: '< 0.08% Max' },
      { param: 'Kadar Air (Moisture)', value: '< 0.05% Max' },
      { param: 'Warna Lovibond (5.25")', value: '2.5R / 25Y Max' },
      { param: 'Iodine Value (IV)', value: '56.0 - 58.5 Wijs' },
      { param: 'Titik Asap (Smoke Point)', value: '> 230°C' },
      { param: 'Bentuk Pengiriman', value: 'Kemasan Ritel, Jerigen, Flexitank' }
    ]
  },
  cpko: {
    title: 'Crude Palm Kernel Oil (CPKO)',
    grade: 'Bahan Baku Industri Oleokimia',
    description: 'Minyak inti sawit yang diekstraksi dari kernel biji kelapa sawit. Mengandung asam laurat (C12) tinggi yang banyak diaplikasikan pada industri sabun, surfaktan, deterjen, dan kosmetik.',
    specs: [
      { param: 'Asam Lemak Bebas (FFA)', value: '< 3.50% Max' },
      { param: 'Kadar Air & Kotoran', value: '< 0.50% Max' },
      { param: 'Kandungan Asam Laurat', value: '48% - 52%' },
      { param: 'Iodine Value (IV)', value: '16.5 - 19.0 Wijs' },
      { param: 'Sertifikasi Terkait', value: 'RSPO Mass Balance, ISPO' },
      { param: 'Bentuk Pengiriman', value: 'Drum Baja 200L, ISO Tank' }
    ]
  },
  pke: {
    title: 'Palm Kernel Expeller (PKE)',
    grade: 'Bungkil Sawit • Nutrisi Ternak',
    description: 'Bahan pakan hewani bernutrisi padat hasil samping pengepresan mekanis kernel sawit. Mengandung serat tercerna dan protein nabati berkualitas untuk ternak ruminansia.',
    specs: [
      { param: 'Protein Kasar (Crude Protein)', value: '15.0% - 17.5%' },
      { param: 'Minyak Kasar (Crude Fat)', value: '7.0% - 9.0%' },
      { param: 'Serat Kasar (Crude Fiber)', value: '15.0% - 18.0%' },
      { param: 'Kadar Air (Moisture)', value: '< 10.0% Max' },
      { param: 'Pasar Tujuan', value: 'Selandia Baru, Australia, Eropa' },
      { param: 'Bentuk Pengiriman', value: 'Jumbo Bag 1 MT, Kapal Bulk Curah' }
    ]
  }
};

function initProductModals() {
  const modal = document.getElementById('productModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const titleEl = document.getElementById('modalTitle');
  const gradeEl = document.getElementById('modalGrade');
  const descEl = document.getElementById('modalDesc');
  const tableEl = document.getElementById('modalSpecsBody');

  if (!modal) return;

  document.querySelectorAll('.btn-spec-open').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodKey = btn.getAttribute('data-product');
      const item = enterpriseProducts[prodKey];
      if (!item) return;

      titleEl.textContent = item.title;
      gradeEl.textContent = item.grade;
      descEl.textContent = item.description;

      tableEl.innerHTML = item.specs.map(s => `
        <tr style="border-bottom: 1px solid var(--color-border-light);">
          <td style="padding: 10px 0; font-size: 0.88rem; color: var(--text-secondary);">${s.param}</td>
          <td style="padding: 10px 0; font-size: 0.88rem; font-weight: 600; color: var(--text-main); text-align: right;">${s.value}</td>
        </tr>
      `).join('');

      modal.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

/* Formal Inquiry Form */
function initInquiryForm() {
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('inqName').value.trim();
    const company = document.getElementById('inqCompany').value.trim();

    const submitBtn = form.querySelector('button[type="submit"]');
    const prevText = submitBtn.innerText;
    submitBtn.innerText = 'Mengirimkan...';
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.innerText = prevText;
      submitBtn.disabled = false;
      form.reset();
      showNotice(`Terima kasih. Pesan dari ${name} (${company || 'Mitra'}) telah diterima oleh Tim Sekretariat Korporat PT Nusa Sawit Agro Tbk.`);
    }, 900);
  });
}

/* Report Download Notice */
function initReportDownload() {
  document.querySelectorAll('.btn-report-dl').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showNotice('Mengunduh Laporan Keberlanjutan Tahunan PT Nusa Sawit Agro Tbk (Format PDF)...');
    });
  });
}

/* Dignified Toast Notification */
function showNotice(text) {
  let notice = document.querySelector('.toast-notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'toast-notice';
    document.body.appendChild(notice);
  }

  notice.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
    <span>${text}</span>
  `;

  notice.classList.add('show');
  setTimeout(() => {
    notice.classList.remove('show');
  }, 4200);
}
