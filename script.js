/**
 * Apple Human Interface Guidelines (HIG) Profile Controller
 * iOS & macOS Design System Interactivity
 * For Riko Londong (riko.londong1997@gmail.com)
 */

document.addEventListener('DOMContentLoaded', () => {
  const htmlRoot = document.documentElement;

  // --- 1. Theme Controller (Apple Light / Dark) ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  const applyAppleTheme = (theme) => {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('apple_profile_theme', theme);
  };

  const storedTheme = localStorage.getItem('apple_profile_theme') || 'light';
  applyAppleTheme(storedTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const active = htmlRoot.getAttribute('data-theme');
    const target = active === 'dark' ? 'light' : 'dark';
    applyAppleTheme(target);
    showDynamicIsland(`Tampilan ${target === 'dark' ? 'Dark Mode' : 'Light Mode'} Aktif`);
  });

  // --- 2. Apple UISegmentedControl Navigation ---
  const segmentBtns = document.querySelectorAll('.segment-btn');
  const tabPanels = document.querySelectorAll('.apple-tab-panel');

  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      // Update Segment Buttons
      segmentBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update Tab Panels
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });
      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // --- 3. Profile Identity State & Persistence ---
  const profileName = document.getElementById('profileName');
  const profileRole = document.getElementById('profileRole');
  const locationText = document.getElementById('locationText');
  const profileBio = document.getElementById('profileBio');
  const profileEmail = document.getElementById('profileEmail');
  const emailRowLink = document.getElementById('emailRowLink');
  const profileAvatarImg = document.getElementById('profileAvatarImg');
  const changePhotoBtn = document.getElementById('changePhotoBtn');
  const photoFileInput = document.getElementById('photoFileInput');

  // Load custom saved data if available
  const savedDataStr = localStorage.getItem('apple_profile_info');
  if (savedDataStr) {
    try {
      const data = JSON.parse(savedDataStr);
      if (data.name) profileName.textContent = data.name;
      if (data.role) profileRole.textContent = data.role;
      if (data.location) locationText.textContent = data.location;
      if (data.bio) profileBio.textContent = data.bio;
    } catch (e) {
      console.warn('Error reading stored profile data', e);
    }
  }

  // --- 4. Custom Photo Upload & Preview ---
  changePhotoBtn?.addEventListener('click', () => {
    photoFileInput?.click();
  });

  photoFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showDynamicIsland('Pilih file gambar yang valid');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (profileAvatarImg && event.target?.result) {
          profileAvatarImg.src = event.target.result;
          try {
            localStorage.setItem('apple_custom_avatar', event.target.result);
          } catch (err) {
            console.warn('Image size exceeded localStorage limit');
          }
          showDynamicIsland('Foto profil diperbarui');
        }
      };
      reader.readAsDataURL(file);
    }
  });

  const storedAvatar = localStorage.getItem('apple_custom_avatar');
  if (storedAvatar && profileAvatarImg) {
    profileAvatarImg.src = storedAvatar;
  }

  // Fallback for avatar
  profileAvatarImg?.addEventListener('error', () => {
    if (!profileAvatarImg.src.includes('riko.jpg')) {
      profileAvatarImg.src = 'assets/riko.jpg';
    }
  });

  // --- 5. Apple Sheet Modal: Edit Profile ---
  const editProfileSheet = document.getElementById('editProfileSheet');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const closeSheetBtn = document.getElementById('closeSheetBtn');
  const cancelSheetBtn = document.getElementById('cancelSheetBtn');
  const editForm = document.getElementById('editForm');

  const editNameInput = document.getElementById('editNameInput');
  const editRoleInput = document.getElementById('editRoleInput');
  const editLocationInput = document.getElementById('editLocationInput');
  const editBioInput = document.getElementById('editBioInput');
  const bioCharCounter = document.getElementById('bioCharCounter');

  const openSheet = (sheet) => {
    sheet?.classList.add('is-open');
    sheet?.setAttribute('aria-hidden', 'false');
    const firstInput = sheet?.querySelector('input, textarea');
    firstInput?.focus();
  };

  const closeSheet = (sheet) => {
    sheet?.classList.remove('is-open');
    sheet?.setAttribute('aria-hidden', 'true');
  };

  editProfileBtn?.addEventListener('click', () => {
    if (editNameInput) editNameInput.value = profileName.textContent.trim();
    if (editRoleInput) editRoleInput.value = profileRole.textContent.trim();
    if (editLocationInput) editLocationInput.value = locationText.textContent.trim();
    if (editBioInput) editBioInput.value = profileBio.textContent.trim();
    updateCharCounter();
    openSheet(editProfileSheet);
  });

  const updateCharCounter = () => {
    if (bioCharCounter && editBioInput) {
      bioCharCounter.textContent = `${editBioInput.value.length}/400`;
    }
  };

  editBioInput?.addEventListener('input', updateCharCounter);

  editForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedName = editNameInput.value.trim();
    const updatedRole = editRoleInput.value.trim();
    const updatedLocation = editLocationInput.value.trim();
    const updatedBio = editBioInput.value.trim();

    if (updatedName && updatedBio) {
      profileName.textContent = updatedName;
      profileRole.textContent = updatedRole;
      locationText.textContent = updatedLocation;
      profileBio.textContent = updatedBio;

      const payload = {
        name: updatedName,
        role: updatedRole,
        location: updatedLocation,
        bio: updatedBio
      };
      localStorage.setItem('apple_profile_info', JSON.stringify(payload));

      closeSheet(editProfileSheet);
      showDynamicIsland('Profil berhasil disimpan');
    }
  });

  closeSheetBtn?.addEventListener('click', () => closeSheet(editProfileSheet));
  cancelSheetBtn?.addEventListener('click', () => closeSheet(editProfileSheet));

  // Dismiss sheet on backdrop click
  editProfileSheet?.addEventListener('click', (e) => {
    if (e.target === editProfileSheet) {
      closeSheet(editProfileSheet);
    }
  });

  // Escape key support
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editProfileSheet?.classList.contains('is-open')) {
      closeSheet(editProfileSheet);
    }
  });

  // --- 6. Quick Action: Hubungi Saya (Navigate to Pesan Tab) ---
  const openContactModalBtn = document.getElementById('openContactModalBtn');
  const segmentContact = document.getElementById('segmentContact');

  openContactModalBtn?.addEventListener('click', () => {
    segmentContact?.click();
    if (window.innerWidth <= 880) {
      segmentContact?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const directContactForm = document.getElementById('directContactForm');
  directContactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const sender = document.getElementById('inputSenderName')?.value.trim() || 'Teman';
    directContactForm.reset();
    showDynamicIsland(`Pesan terkirim ke riko.londong1997@gmail.com!`);
  });

  // --- 7. Share Profile (Copy URL) ---
  const shareProfileBtn = document.getElementById('shareProfileBtn');
  shareProfileBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showDynamicIsland('Tautan profil disalin');
    } catch (err) {
      const temp = document.createElement('input');
      temp.value = window.location.href;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showDynamicIsland('Tautan profil disalin');
    }
  });

  // --- 8. Dynamic Island Style Notification Controller ---
  const islandBanner = document.getElementById('dynamicIslandNotification');
  const islandText = document.getElementById('islandText');
  let islandTimer;

  function showDynamicIsland(message) {
    if (!islandBanner || !islandText) return;
    islandText.textContent = message;
    islandBanner.classList.add('is-visible');

    clearTimeout(islandTimer);
    islandTimer = setTimeout(() => {
      islandBanner.classList.remove('is-visible');
    }, 3000);
  }
});
