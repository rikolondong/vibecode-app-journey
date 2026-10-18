/**
 * ResponsiView Studio — Native Device & OS Environment Emulator (Apple Design System Edition)
 * Features:
 * 1. Apple Human Interface Guidelines UI with Cupertino Light & macOS Pro Dark Mode Toggle
 * 2. Authentic OS System Design Chrome (iOS 18, Android 15 One UI / Pixel, iPadOS 18, macOS Sequoia, Windows 11)
 * 3. OS Typography & Emoji Engine (SF Pro + Apple Emoji, Roboto + Google Noto Color Emoji, Segoe UI Variable)
 * 4. Deep Browser Fingerprint Spoofing (User-Agent, Sec-CH-UA, navigator.platform, vendor, DPR, maxTouchPoints, screen)
 * 5. Locked Hardware Resolution per device preset, with dedicated "Mode Responsive" for free resizing.
 */

const DEVICE_PRESETS = [
  // ================= SMARTPHONES =================
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    category: 'mobile',
    osFamily: 'ios',
    os: 'iOS 18 • 6.3" Super Retina XDR',
    osBadge: 'iOS 18 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📱',
    width: 393,
    height: 852,
    dprNum: 3,
    dpr: '3x Retina',
    touchPoints: 5,
    platform: 'iPhone',
    vendor: 'Apple Computer, Inc.',
    model: 'iPhone',
    shellClass: 'device-mobile',
    frameType: 'dynamic-island',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    category: 'mobile',
    osFamily: 'ios',
    os: 'iOS 18 • 6.9" Super Retina XDR',
    osBadge: 'iOS 18 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📱',
    width: 440,
    height: 956,
    dprNum: 3,
    dpr: '3x Retina',
    touchPoints: 5,
    platform: 'iPhone',
    vendor: 'Apple Computer, Inc.',
    model: 'iPhone',
    shellClass: 'device-mobile',
    frameType: 'dynamic-island',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-xr',
    name: 'iPhone XR',
    category: 'mobile',
    osFamily: 'ios',
    os: 'iOS 17.5 • 6.1" Liquid Retina HD',
    osBadge: 'iOS 17 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📱',
    width: 414,
    height: 896,
    dprNum: 2,
    dpr: '2x Liquid Retina',
    touchPoints: 5,
    platform: 'iPhone',
    vendor: 'Apple Computer, Inc.',
    model: 'iPhone',
    shellClass: 'device-mobile',
    frameType: 'notch',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE (Gen 3)',
    category: 'mobile',
    osFamily: 'ios',
    os: 'iOS 18 • 4.7" Retina HD (Touch ID)',
    osBadge: 'iOS 18 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📲',
    width: 375,
    height: 667,
    dprNum: 2,
    dpr: '2x Retina',
    touchPoints: 5,
    platform: 'iPhone',
    vendor: 'Apple Computer, Inc.',
    model: 'iPhone',
    shellClass: 'device-mobile',
    frameType: 'classic-bezel',
    navStyle: 'home-btn',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'mobile',
    osFamily: 'android',
    os: 'Android 15 • One UI 7 (QHD+)',
    osBadge: 'One UI 7 • Roboto',
    fontDesc: 'Roboto + Noto Color Emoji',
    icon: '📱',
    width: 412,
    height: 915,
    dprNum: 3.5,
    dpr: '3.5x QHD+',
    touchPoints: 5,
    platform: 'Linux armv8l',
    vendor: 'Google Inc.',
    model: 'SM-S928B',
    shellClass: 'device-mobile',
    frameType: 'punch-hole-sharp',
    navStyle: 'samsung',
    ua: 'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  },
  {
    id: 'pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    category: 'mobile',
    osFamily: 'android',
    os: 'Android 15 • Material You',
    osBadge: 'Android 15 • Roboto',
    fontDesc: 'Roboto + Noto Color Emoji',
    icon: '📱',
    width: 412,
    height: 892,
    dprNum: 3,
    dpr: '3x Super Actua',
    touchPoints: 5,
    platform: 'Linux armv8l',
    vendor: 'Google Inc.',
    model: 'Pixel 9 Pro',
    shellClass: 'device-mobile',
    frameType: 'punch-hole',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  },

  // ================= TABLETS =================
  {
    id: 'ipad-mini',
    name: 'iPad Mini (Gen 6)',
    category: 'tablet',
    osFamily: 'ipados',
    os: 'iPadOS 18 • 8.3" Liquid Retina',
    osBadge: 'iPadOS 18 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📟',
    width: 744,
    height: 1133,
    dprNum: 2,
    dpr: '2x Retina',
    touchPoints: 5,
    platform: 'iPad',
    vendor: 'Apple Computer, Inc.',
    model: 'iPad',
    shellClass: 'device-tablet',
    frameType: 'tablet-clean',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-air',
    name: 'iPad Air 11" (M2)',
    category: 'tablet',
    osFamily: 'ipados',
    os: 'iPadOS 18 • 10.9" Liquid Retina',
    osBadge: 'iPadOS 18 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📟',
    width: 820,
    height: 1180,
    dprNum: 2,
    dpr: '2x Retina',
    touchPoints: 5,
    platform: 'iPad',
    vendor: 'Apple Computer, Inc.',
    model: 'iPad',
    shellClass: 'device-tablet',
    frameType: 'tablet-clean',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13" (M4)',
    category: 'tablet',
    osFamily: 'ipados',
    os: 'iPadOS 18 • Ultra Retina XDR',
    osBadge: 'iPadOS 18 • SF Pro',
    fontDesc: 'SF Pro + Apple Emoji',
    icon: '📟',
    width: 1024,
    height: 1366,
    dprNum: 2,
    dpr: '2x Tandem OLED',
    touchPoints: 5,
    platform: 'iPad',
    vendor: 'Apple Computer, Inc.',
    model: 'iPad',
    shellClass: 'device-tablet',
    frameType: 'tablet-clean',
    navStyle: 'gesture',
    ua: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  {
    id: 'galaxy-tab-s9',
    name: 'Samsung Galaxy Tab S9',
    category: 'tablet',
    osFamily: 'android',
    os: 'Android 14 Tablet • One UI',
    osBadge: 'One UI Tab • Roboto',
    fontDesc: 'Roboto + Noto Color Emoji',
    icon: '📟',
    width: 800,
    height: 1280,
    dprNum: 2,
    dpr: '2x Dynamic AMOLED',
    touchPoints: 5,
    platform: 'Linux armv8l',
    vendor: 'Google Inc.',
    model: 'SM-X710',
    shellClass: 'device-tablet',
    frameType: 'tablet-clean',
    navStyle: 'samsung',
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  },

  // ================= DESKTOP & LAPTOPS =================
  {
    id: 'macbook-air',
    name: 'MacBook Air 13" (M3)',
    category: 'desktop',
    osFamily: 'macos',
    os: 'macOS Sequoia • Safari 18',
    osBadge: 'macOS • SF Pro',
    fontDesc: 'SF Pro Display + Apple Emoji',
    icon: '💻',
    width: 1280,
    height: 800,
    dprNum: 2,
    dpr: '2x Liquid Retina',
    touchPoints: 0,
    platform: 'MacIntel',
    vendor: 'Apple Computer, Inc.',
    model: 'Macintosh',
    shellClass: 'device-laptop',
    frameType: 'laptop',
    navStyle: 'none',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16" (M3 Max)',
    category: 'desktop',
    osFamily: 'macos',
    os: 'macOS Sequoia • Liquid Retina XDR',
    osBadge: 'macOS • SF Pro',
    fontDesc: 'SF Pro Display + Apple Emoji',
    icon: '💻',
    width: 1512,
    height: 982,
    dprNum: 2,
    dpr: '2x Retina XDR',
    touchPoints: 0,
    platform: 'MacIntel',
    vendor: 'Apple Computer, Inc.',
    model: 'Macintosh',
    shellClass: 'device-laptop',
    frameType: 'laptop',
    navStyle: 'none',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
  },
  {
    id: 'desktop-1080p',
    name: 'Windows 11 Desktop 24"',
    category: 'desktop',
    osFamily: 'windows',
    os: 'Windows 11 24H2 • Chrome 131',
    osBadge: 'Windows 11 • Segoe UI',
    fontDesc: 'Segoe UI Variable + Segoe Emoji',
    icon: '🖥️',
    width: 1920,
    height: 1080,
    dprNum: 1,
    dpr: '1x Full HD',
    touchPoints: 0,
    platform: 'Win32',
    vendor: 'Google Inc.',
    model: 'PC',
    shellClass: 'device-monitor',
    frameType: 'monitor',
    navStyle: 'none',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  }
];

const RESPONSIVE_CUSTOM_PRESET = {
  id: 'responsive-custom',
  name: 'Mode Responsive',
  category: 'responsive',
  osFamily: 'responsive',
  os: 'Bebas Ubah Ukuran Layar',
  osBadge: 'Custom Viewport',
  fontDesc: 'SF Pro System Font',
  icon: '📐',
  width: 768,
  height: 850,
  dprNum: 1,
  dpr: '1x Custom',
  touchPoints: 0,
  platform: 'MacIntel',
  vendor: 'Apple Computer, Inc.',
  model: 'Responsive',
  shellClass: 'device-mobile',
  frameType: 'none',
  navStyle: 'none',
  ua: navigator.userAgent
};

// Application State
const state = {
  theme: localStorage.getItem('responsiview-theme') || 'light',
  currentUrl: 'demo.html',
  urlHistory: ['demo.html'],
  historyIndex: 0,
  useProxy: true,
  proxyAvailable: false,
  viewMode: 'single',
  activeCategory: 'all',
  activeDeviceId: 'iphone-16-pro',
  isResponsiveMode: false,
  width: 393,
  height: 852,
  zoomMode: 'fit',
  currentScale: 1,
  showBezel: true,
  showStatusBar: true,
  touchCursor: true,
  showGrid: false,
  matrixDims: {
    mobile: { w: 393, h: 852, presetId: 'iphone-16-pro' },
    tablet: { w: 820, h: 1180, presetId: 'ipad-air' },
    desktop: { w: 1280, h: 800, presetId: 'macbook-air' }
  },
  matrixScale: 'fit'
};

// DOM Elements
const els = {
  urlForm: document.getElementById('urlForm'),
  urlInput: document.getElementById('urlInput'),
  btnClearUrl: document.getElementById('btnClearUrl'),
  btnBack: document.getElementById('btnBack'),
  btnForward: document.getElementById('btnForward'),
  btnReload: document.getElementById('btnReload'),
  btnOpenExternal: document.getElementById('btnOpenExternal'),
  authSecurityNotice: document.getElementById('authSecurityNotice'),
  btnNoticeOpenExternal: document.getElementById('btnNoticeOpenExternal'),
  btnNoticeClose: document.getElementById('btnNoticeClose'),
  proxyModeToggle: document.getElementById('proxyModeToggle'),
  proxyStatusDot: document.getElementById('proxyStatusDot'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIconSun: document.getElementById('themeIconSun'),
  themeIconMoon: document.getElementById('themeIconMoon'),
  themeToggleLabel: document.getElementById('themeToggleLabel'),
  modeSingleBtn: document.getElementById('modeSingleBtn'),
  modeMatrixBtn: document.getElementById('modeMatrixBtn'),
  btnResponsiveMode: document.getElementById('btnResponsiveMode'),
  categoryTabs: document.getElementById('categoryTabs'),
  deviceList: document.getElementById('deviceList'),
  deviceCountBadge: document.getElementById('deviceCountBadge'),
  singleControlsGroup: document.getElementById('singleControlsGroup'),
  singleZoomGroup: document.getElementById('singleZoomGroup'),
  matrixControlsGroup: document.getElementById('matrixControlsGroup'),
  matrixScaleSelect: document.getElementById('matrixScaleSelect'),
  btnMatrixSyncReload: document.getElementById('btnMatrixSyncReload'),
  matrixSelectMobile: document.getElementById('matrixSelectMobile'),
  matrixSelectTablet: document.getElementById('matrixSelectTablet'),
  matrixSelectDesktop: document.getElementById('matrixSelectDesktop'),
  matrixWrapMobile: document.getElementById('matrixWrapMobile'),
  matrixWrapTablet: document.getElementById('matrixWrapTablet'),
  matrixWrapDesktop: document.getElementById('matrixWrapDesktop'),
  activeDeviceIcon: document.getElementById('activeDeviceIcon'),
  activeDeviceName: document.getElementById('activeDeviceName'),
  activeOsBadge: document.getElementById('activeOsBadge'),
  dimFieldW: document.getElementById('dimFieldW'),
  dimFieldH: document.getElementById('dimFieldH'),
  inputWidth: document.getElementById('inputWidth'),
  inputHeight: document.getElementById('inputHeight'),
  resLockBadge: document.getElementById('resLockBadge'),
  btnRotate: document.getElementById('btnRotate'),
  zoomSelect: document.getElementById('zoomSelect'),
  btnZoom100: document.getElementById('btnZoom100'),
  btnZoomFit: document.getElementById('btnZoomFit'),
  zoomReadout: document.getElementById('zoomReadout'),
  btnToggleFrame: document.getElementById('btnToggleFrame'),
  btnToggleStatusbar: document.getElementById('btnToggleStatusbar'),
  btnToggleTouch: document.getElementById('btnToggleTouch'),
  btnToggleGrid: document.getElementById('btnToggleGrid'),
  canvasViewport: document.getElementById('canvasViewport'),
  singleStage: document.getElementById('singleStage'),
  matrixStage: document.getElementById('matrixStage'),
  deviceScaleWrapper: document.getElementById('deviceScaleWrapper'),
  deviceShell: document.getElementById('deviceShell'),
  deviceScreen: document.getElementById('deviceScreen'),
  osTopChrome: document.getElementById('osTopChrome'),
  osBottomChrome: document.getElementById('osBottomChrome'),
  iframeContainer: document.getElementById('iframeContainer'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  gridOverlay: document.getElementById('gridOverlay'),
  simIframe: document.getElementById('simIframe'),
  matrixIframeMobile: document.getElementById('matrixIframeMobile'),
  matrixIframeTablet: document.getElementById('matrixIframeTablet'),
  matrixIframeDesktop: document.getElementById('matrixIframeDesktop'),
  matrixBoxMobile: document.getElementById('matrixBoxMobile'),
  matrixBoxTablet: document.getElementById('matrixBoxTablet'),
  matrixBoxDesktop: document.getElementById('matrixBoxDesktop'),
  matrixMobileDims: document.getElementById('matrixMobileDims'),
  matrixTabletDims: document.getElementById('matrixTabletDims'),
  matrixDesktopDims: document.getElementById('matrixDesktopDims'),
  btnRotateMatrixMobile: document.getElementById('btnRotateMatrixMobile'),
  btnRotateMatrixTablet: document.getElementById('btnRotateMatrixTablet'),
  btnReloadMatrixMobile: document.getElementById('btnReloadMatrixMobile'),
  btnReloadMatrixTablet: document.getElementById('btnReloadMatrixTablet'),
  btnReloadMatrixDesktop: document.getElementById('btnReloadMatrixDesktop'),
  btnFocusMatrixMobile: document.getElementById('btnFocusMatrixMobile'),
  btnFocusMatrixTablet: document.getElementById('btnFocusMatrixTablet'),
  btnFocusMatrixDesktop: document.getElementById('btnFocusMatrixDesktop'),
  footerRes: document.getElementById('footerRes'),
  footerFont: document.getElementById('footerFont'),
  footerDpr: document.getElementById('footerDpr'),
  footerBp: document.getElementById('footerBp'),
  footerUa: document.getElementById('footerUa'),
  resizeRight: document.getElementById('resizeRight'),
  resizeBottom: document.getElementById('resizeBottom'),
  resizeCorner: document.getElementById('resizeCorner'),
  btnScreenshot: document.getElementById('btnScreenshot'),
  btnQuickScreenshot: document.getElementById('btnQuickScreenshot'),
  screenshotModal: document.getElementById('screenshotModal'),
  btnModalShotClose: document.getElementById('btnModalShotClose'),
  tabShotMockup: document.getElementById('tabShotMockup'),
  tabShotViewport: document.getElementById('tabShotViewport'),
  tabShotCanvas: document.getElementById('tabShotCanvas'),
  shotPreviewBox: document.getElementById('shotPreviewBox'),
  shotPreviewImg: document.getElementById('shotPreviewImg'),
  shotSpinner: document.getElementById('shotSpinner'),
  shotMetaDevice: document.getElementById('shotMetaDevice'),
  shotMetaRes: document.getElementById('shotMetaRes'),
  shotMetaDpr: document.getElementById('shotMetaDpr'),
  shotBgSelect: document.getElementById('shotBgSelect'),
  shotMethodSelect: document.getElementById('shotMethodSelect'),
  btnShotRetake: document.getElementById('btnShotRetake'),
  btnShotCopy: document.getElementById('btnShotCopy'),
  btnShotCopyLabel: document.getElementById('btnShotCopyLabel'),
  btnShotDownload: document.getElementById('btnShotDownload'),
  appleToastContainer: document.getElementById('appleToastContainer')
};

// Initialize Application
async function init() {
  applyTheme(state.theme);
  updateClock();
  setInterval(updateClock, 20000);

  await checkProxyHealth();
  renderDeviceList();
  selectDevice('iphone-16-pro', false);
  setupEventListeners();
  setupResizeHandles();
  updateMatrixScales();
  setupScreenshotHandlers();

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RESPONSIVIEW_NAVIGATE' && event.data.url) {
      els.urlInput.value = event.data.url;
      loadUrl(event.data.url, true);
    }
  });
}

// Apply Apple Light / Dark Mode Theme
function applyTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('responsiview-theme', state.theme);

  const isDark = state.theme === 'dark';
  els.themeIconSun.classList.toggle('hidden', isDark);
  els.themeIconMoon.classList.toggle('hidden', !isDark);
  els.themeToggleLabel.textContent = isDark ? 'Dark' : 'Light';

  // Broadcast theme to all simulated iframes
  [els.simIframe, els.matrixIframeMobile, els.matrixIframeTablet, els.matrixIframeDesktop].forEach(
    (iframe) => {
      try {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: 'RESPONSIVIEW_THEME_CHANGED', theme: state.theme },
            '*'
          );
        }
      } catch (_) {}
    }
  );
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;
  document.querySelectorAll('[data-clock]').forEach((el) => {
    el.textContent = timeStr;
  });
}

function updateDomainLabels(urlStr) {
  let label = 'demo.html';
  if (!isLocalDemoUrl(urlStr)) {
    try {
      const u = new URL(urlStr);
      label = u.hostname.replace(/^www\./, '');
    } catch (_) {
      label = urlStr;
    }
  }
  document.querySelectorAll('[data-domain]').forEach((el) => {
    el.textContent = label;
  });
}

async function checkProxyHealth() {
  if (window.location.protocol === 'file:') {
    state.proxyAvailable = false;
    state.useProxy = false;
    els.proxyModeToggle.checked = false;
    return;
  }
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    if (res.ok) {
      state.proxyAvailable = true;
      state.useProxy = true;
      els.proxyModeToggle.checked = true;
      els.proxyStatusDot.classList.add('online');
      els.proxyStatusDot.title = 'Deep Device Spoofing & Smart Proxy Aktif';
    }
  } catch (_) {
    state.proxyAvailable = false;
  }
}

function getActivePreset() {
  if (state.isResponsiveMode) {
    return {
      ...RESPONSIVE_CUSTOM_PRESET,
      width: state.width,
      height: state.height
    };
  }
  return DEVICE_PRESETS.find((d) => d.id === state.activeDeviceId) || DEVICE_PRESETS[0];
}

// Render Device List in Left Sidebar
function renderDeviceList() {
  const filtered = DEVICE_PRESETS.filter(
    (d) => state.activeCategory === 'all' || d.category === state.activeCategory
  );
  els.deviceCountBadge.textContent = `${filtered.length} Perangkat`;

  els.btnResponsiveMode.classList.toggle('active', state.isResponsiveMode);

  els.deviceList.innerHTML = filtered
    .map((device) => {
      const isActive = !state.isResponsiveMode && device.id === state.activeDeviceId;
      return `
        <button type="button" class="device-card ${isActive ? 'active' : ''}" data-id="${device.id}">
          <div class="device-card-left">
            <div class="device-card-icon">${device.icon}</div>
            <div class="device-card-info">
              <span class="device-card-name">${device.name}</span>
              <span class="device-card-os">${device.os}</span>
            </div>
          </div>
          <span class="device-card-dims">${device.width}×${device.height}</span>
        </button>
      `;
    })
    .join('');

  els.deviceList.querySelectorAll('.device-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      if (state.viewMode === 'matrix') {
        setViewMode('single');
      }
      selectDevice(id, true);
    });
  });
}

// Select a Fixed Hardware Device Preset
function selectDevice(deviceId, reloadIframe = true) {
  const device = DEVICE_PRESETS.find((d) => d.id === deviceId) || DEVICE_PRESETS[0];
  state.isResponsiveMode = false;
  state.activeDeviceId = device.id;
  state.width = device.width;
  state.height = device.height;

  // Lock resolution inputs & hide resize handles for authentic hardware simulation
  els.inputWidth.readOnly = true;
  els.inputHeight.readOnly = true;
  els.dimFieldW.classList.add('locked');
  els.dimFieldH.classList.add('locked');
  els.resLockBadge.textContent = '🔒 Fix Hardware';
  els.resLockBadge.className = 'resolution-lock-badge locked';

  els.resizeRight.classList.add('hidden');
  els.resizeBottom.classList.add('hidden');
  els.resizeCorner.classList.add('hidden');

  // Update Toolbar UI
  els.activeDeviceIcon.textContent = device.icon;
  els.activeDeviceName.textContent = device.name;
  els.activeOsBadge.textContent = device.osBadge;
  els.inputWidth.value = state.width;
  els.inputHeight.value = state.height;

  // Update Shell & OS Chrome attributes
  els.deviceShell.className = `device-shell ${device.shellClass} ${state.showBezel ? 'bezel-enabled' : ''}`;
  els.deviceShell.setAttribute('data-device', device.id);
  els.deviceShell.setAttribute('data-frame', device.frameType);
  els.deviceShell.setAttribute('data-os', device.osFamily);
  els.deviceScreen.setAttribute('data-device', device.id);
  els.deviceScreen.setAttribute('data-os', device.osFamily);
  els.deviceScreen.setAttribute('data-nav', device.navStyle || 'gesture');

  applyDimensionsAndTelemetry(device);
  renderDeviceList();

  if (reloadIframe) {
    if (isLocalDemoUrl(state.currentUrl)) {
      injectEnvironmentIntoSameOriginIframe(els.simIframe, device);
    } else {
      refreshIframes();
    }
  }
}

// Activate Free-Resize Responsive Mode
function activateResponsiveMode(customW = null, customH = null) {
  if (state.viewMode === 'matrix') {
    setViewMode('single');
  }
  state.isResponsiveMode = true;
  if (customW) state.width = customW;
  if (customH) state.height = customH;

  // Unlock resolution inputs & show drag resize handles
  els.inputWidth.readOnly = false;
  els.inputHeight.readOnly = false;
  els.dimFieldW.classList.remove('locked');
  els.dimFieldH.classList.remove('locked');
  els.resLockBadge.textContent = '🔓 Mode Responsive';
  els.resLockBadge.className = 'resolution-lock-badge unlocked';

  els.resizeRight.classList.remove('hidden');
  els.resizeBottom.classList.remove('hidden');
  els.resizeCorner.classList.remove('hidden');

  els.activeDeviceIcon.textContent = '📐';
  els.activeDeviceName.textContent = 'Mode Responsive';
  els.activeOsBadge.textContent = 'Bebas Atur Ukuran';
  els.inputWidth.value = state.width;
  els.inputHeight.value = state.height;

  els.deviceShell.className = 'device-shell device-mobile';
  els.deviceShell.setAttribute('data-device', 'responsive-custom');
  els.deviceShell.setAttribute('data-frame', 'none');
  els.deviceShell.setAttribute('data-os', 'responsive');
  els.deviceScreen.setAttribute('data-device', 'responsive-custom');
  els.deviceScreen.setAttribute('data-os', 'responsive');

  applyDimensionsAndTelemetry(getActivePreset());
  renderDeviceList();

  if (isLocalDemoUrl(state.currentUrl)) {
    injectEnvironmentIntoSameOriginIframe(els.simIframe, getActivePreset());
  }
}

// Exact Physical Hardware Bezel Dimensions (Matches styles.css device specifications)
function getDeviceBezelSpec(preset) {
  if (!state.showBezel || state.isResponsiveMode) {
    return { padX: 0, padY: 0 };
  }
  switch (preset.id) {
    case 'iphone-16-pro':
    case 'iphone-16-pro-max':
      return { padX: 18, padY: 18 }; // 9px each side
    case 'iphone-xr':
      return { padX: 28, padY: 28 }; // 14px each side
    case 'iphone-se':
      return { padX: 24, padY: 120 }; // 12px sides, 56px forehead, 64px chin
    case 'galaxy-s24-ultra':
      return { padX: 16, padY: 16 }; // 8px each side
    case 'pixel-9-pro':
      return { padX: 20, padY: 20 }; // 10px each side
    case 'ipad-mini':
      return { padX: 32, padY: 32 }; // 16px each side
    case 'ipad-air':
      return { padX: 36, padY: 36 }; // 18px each side
    case 'ipad-pro-13':
      return { padX: 28, padY: 28 }; // 14px each side
    case 'galaxy-tab-s9':
      return { padX: 32, padY: 32 }; // 16px each side
    case 'macbook-air':
    case 'macbook-pro-16':
      return { padX: 28, padY: 42 }; // 14px sides/top, 10px bottom + 18px base
    case 'desktop-1080p':
      return { padX: 28, padY: 106 }; // 14px sides/top, 28px bottom + 64px stand
    default:
      return { padX: 20, padY: 20 };
  }
}

// Apply Width/Height to Viewport & Update Footer Telemetry
function applyDimensionsAndTelemetry(preset = null) {
  const active = preset || getActivePreset();
  const isTouchDevice = active.touchPoints > 0;
  const showOsChrome = state.showStatusBar && !state.isResponsiveMode;

  els.deviceShell.setAttribute('data-device', active.id);
  els.deviceScreen.setAttribute('data-device', active.id);

  els.osTopChrome.classList.toggle('hidden', !showOsChrome);
  els.osBottomChrome.classList.toggle(
    'hidden',
    !showOsChrome || active.osFamily === 'macos'
  );

  const isLandscape = state.width > state.height;
  els.deviceShell.classList.toggle('is-landscape', isLandscape);

  // Set the screen dimensions directly on deviceScreen so it remains 100% faithful to the authentic hardware resolution
  els.deviceScreen.style.width = `${state.width}px`;
  els.deviceScreen.style.height = `${state.height}px`;

  els.deviceScreen.classList.toggle('touch-cursor-enabled', state.touchCursor && isTouchDevice);

  const modeSuffix = state.isResponsiveMode ? '(Responsive)' : '(Fix Asli)';
  els.footerRes.textContent = `${state.width} × ${state.height} px ${modeSuffix}`;
  els.footerFont.textContent = active.fontDesc;
  els.footerDpr.textContent = `${active.dpr} • ${active.touchPoints} Touch`;
  els.footerBp.textContent = `${active.platform} (${active.osBadge})`;
  els.footerUa.textContent = `UA: ${active.ua}`;

  updateScale();
}

// Calculate and apply Auto-Fit or Manual Zoom Scale
function updateScale() {
  if (state.viewMode !== 'single') return;

  const active = getActivePreset();
  const bezel = getDeviceBezelSpec(active);

  const totalDeviceW = state.width + bezel.padX;
  const totalDeviceH = state.height + bezel.padY;

  const padViewport = 50;
  const availW = Math.max(220, els.canvasViewport.clientWidth - padViewport);
  const availH = Math.max(220, els.canvasViewport.clientHeight - padViewport);

  let scale = 1;
  if (state.zoomMode === 'fit') {
    const scaleX = availW / totalDeviceW;
    const scaleY = availH / totalDeviceH;
    scale = Math.min(scaleX, scaleY, 1.0);
    scale = Math.max(0.2, Number(scale.toFixed(3)));
  } else {
    scale = parseFloat(state.zoomMode) || 1;
  }

  state.currentScale = scale;
  els.deviceScaleWrapper.style.transform = `scale(${scale})`;
  els.zoomReadout.textContent = `${Math.round(scale * 100)}%`;

  if (els.btnZoom100) els.btnZoom100.classList.toggle('active', state.zoomMode === '1');
  if (els.btnZoomFit) els.btnZoomFit.classList.toggle('active', state.zoomMode === 'fit');
}

// Inject OS Font, Emoji, Theme & Navigator Fingerprint directly into Same-Origin Iframe
function injectEnvironmentIntoSameOriginIframe(iframeEl, preset) {
  try {
    const win = iframeEl.contentWindow;
    const doc = iframeEl.contentDocument || (win && win.document);
    if (!win || !doc) return;

    const defineGetter = (obj, prop, val) => {
      try {
        Object.defineProperty(obj, prop, {
          get: () => val,
          configurable: true
        });
      } catch (_) {}
    };

    const navProto = Object.getPrototypeOf(win.navigator) || win.navigator;
    defineGetter(navProto, 'userAgent', preset.ua);
    defineGetter(navProto, 'platform', preset.platform);
    defineGetter(navProto, 'vendor', preset.vendor);
    defineGetter(navProto, 'maxTouchPoints', preset.touchPoints);

    defineGetter(win, 'devicePixelRatio', preset.dprNum);
    if (win.screen) {
      defineGetter(win.screen, 'width', state.width);
      defineGetter(win.screen, 'height', state.height);
      defineGetter(win.screen, 'availWidth', state.width);
      defineGetter(win.screen, 'availHeight', state.height);
    }

    let osFontStack = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif`;
    let emojiFontStack = `'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;

    if (preset.osFamily === 'android') {
      osFontStack = `'Roboto', 'Noto Color Emoji', sans-serif`;
      emojiFontStack = `'Noto Color Emoji', sans-serif`;
    } else if (preset.osFamily === 'windows') {
      osFontStack = `'Segoe UI Variable Text', 'Segoe UI', 'Segoe UI Emoji', sans-serif`;
      emojiFontStack = `'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
    }

    doc.documentElement.setAttribute('data-theme', state.theme);
    doc.documentElement.style.setProperty('--active-os-font', osFontStack);
    doc.documentElement.style.setProperty('--active-emoji-font', emojiFontStack);
    if (doc.body) {
      doc.body.style.fontFamily = osFontStack;
    }

    win.postMessage({ type: 'RESPONSIVIEW_ENV_UPDATED', theme: state.theme }, '*');
  } catch (_) {}
}

// Scale calculation for Multi-Device Matrix boxes (Edge-to-Edge with Zero Gaps)
function updateMatrixScales() {
  const configs = [
    { key: 'mobile', wrap: els.matrixWrapMobile, box: els.matrixBoxMobile, label: els.matrixMobileDims, maxW: 280, maxH: 520 },
    { key: 'tablet', wrap: els.matrixWrapTablet, box: els.matrixBoxTablet, label: els.matrixTabletDims, maxW: 360, maxH: 520 },
    { key: 'desktop', wrap: els.matrixWrapDesktop, box: els.matrixBoxDesktop, label: els.matrixDesktopDims, maxW: 480, maxH: 520 }
  ];

  const userScale = state.matrixScale === 'fit' ? null : parseFloat(state.matrixScale);

  configs.forEach(({ key, wrap, box, label, maxW, maxH }) => {
    const { w, h } = state.matrixDims[key];
    if (label) label.textContent = `${w} × ${h}`;

    let scale = userScale || Math.min(maxW / w, maxH / h, 1);
    scale = Math.max(0.2, Number(scale.toFixed(3)));

    const scaledW = Math.round(w * scale);
    const scaledH = Math.round(h * scale);

    if (box) {
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.style.transform = `scale(${scale})`;
    }
    if (wrap) {
      wrap.style.width = `${scaledW}px`;
      wrap.style.height = `${scaledH}px`;
    }
  });
}

function normalizeUrl(raw) {
  const input = raw.trim();
  if (!input) return 'demo.html';

  if (input === 'demo.html' || input.endsWith('/demo.html')) {
    return 'demo.html';
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  if (/^(localhost|127\.0\.0\.1|192\.168\.|10\.)/i.test(input)) {
    return `http://${input}`;
  }

  return `https://${input}`;
}

function isLocalDemoUrl(url) {
  return url === 'demo.html' || url.startsWith('demo.html');
}

function buildIframeSrc(targetUrl, preset) {
  if (isLocalDemoUrl(targetUrl)) {
    return 'demo.html';
  }

  if (state.useProxy && state.proxyAvailable) {
    const params = new URLSearchParams({
      url: targetUrl,
      ua: preset.ua,
      platform: preset.platform,
      vendor: preset.vendor,
      dpr: String(preset.dprNum),
      touch: String(preset.touchPoints),
      mobile: preset.category === 'mobile' ? '1' : '0',
      os: preset.osFamily,
      model: preset.model || '',
      w: String(preset.width),
      h: String(preset.height)
    });
    return `/proxy?${params.toString()}`;
  }

  return targetUrl;
}

function loadUrl(rawInput, pushHistory = true) {
  const normalized = normalizeUrl(rawInput);
  state.currentUrl = normalized;
  els.urlInput.value = normalized;
  updateDomainLabels(normalized);

  if (pushHistory && state.urlHistory[state.historyIndex] !== normalized) {
    state.urlHistory = state.urlHistory.slice(0, state.historyIndex + 1);
    state.urlHistory.push(normalized);
    state.historyIndex = state.urlHistory.length - 1;
  }

  document.querySelectorAll('.site-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.getAttribute('data-url') === normalized);
  });

  // Check if target is a known authentication-restricted / anti-phishing service
  const isAuthRestricted = /instagram\.com|facebook\.com|threads\.net|accounts\.google\.com|appleid\.apple\.com|twitter\.com|x\.com/i.test(normalized);
  if (els.authSecurityNotice) {
    els.authSecurityNotice.classList.toggle('hidden', !isAuthRestricted);
    if (isAuthRestricted && els.btnNoticeOpenExternal) {
      els.btnNoticeOpenExternal.href = normalized;
    }
  }

  refreshIframes();
}

function reloadMatrixDevice(category) {
  const dims = state.matrixDims[category];
  if (!dims) return;
  const preset = DEVICE_PRESETS.find((d) => d.id === dims.presetId) || DEVICE_PRESETS[0];

  const targetPreset = {
    ...preset,
    width: dims.w,
    height: dims.h
  };

  const iframeMap = {
    mobile: els.matrixIframeMobile,
    tablet: els.matrixIframeTablet,
    desktop: els.matrixIframeDesktop
  };

  const targetIframe = iframeMap[category];
  if (targetIframe) {
    targetIframe.src = buildIframeSrc(state.currentUrl, targetPreset);
  }
}

function reloadAllMatrixDevices() {
  reloadMatrixDevice('mobile');
  reloadMatrixDevice('tablet');
  reloadMatrixDevice('desktop');
}

function refreshIframes() {
  const activePreset = getActivePreset();
  activePreset.width = state.width;
  activePreset.height = state.height;

  els.loadingOverlay.classList.add('visible');
  els.simIframe.src = buildIframeSrc(state.currentUrl, activePreset);

  if (state.viewMode === 'matrix') {
    reloadAllMatrixDevices();
  }
}

function setViewMode(mode) {
  state.viewMode = mode;
  els.modeSingleBtn.classList.toggle('active', mode === 'single');
  els.modeMatrixBtn.classList.toggle('active', mode === 'matrix');

  els.singleStage.classList.toggle('hidden', mode !== 'single');
  els.matrixStage.classList.toggle('hidden', mode !== 'matrix');

  if (els.singleControlsGroup) els.singleControlsGroup.classList.toggle('hidden', mode !== 'single');
  if (els.singleZoomGroup) els.singleZoomGroup.classList.toggle('hidden', mode !== 'single');
  if (els.matrixControlsGroup) els.matrixControlsGroup.classList.toggle('hidden', mode !== 'matrix');

  if (mode === 'matrix') {
    updateMatrixScales();
    refreshIframes();
  } else {
    updateScale();
  }
}

function changeMatrixDevice(category, presetId) {
  const preset = DEVICE_PRESETS.find((d) => d.id === presetId);
  if (!preset) return;
  state.matrixDims[category] = {
    w: preset.width,
    h: preset.height,
    presetId: preset.id
  };
  updateMatrixScales();
  reloadMatrixDevice(category);
}

function rotateMatrixDevice(category) {
  const dims = state.matrixDims[category];
  if (!dims) return;
  const temp = dims.w;
  dims.w = dims.h;
  dims.h = temp;
  updateMatrixScales();
}

function focusSingleDevice(presetId) {
  setViewMode('single');
  selectDevice(presetId, true);
}

window.rotateMatrixDevice = rotateMatrixDevice;
window.focusSingleDevice = focusSingleDevice;

// Event Listeners Setup
function setupEventListeners() {
  els.urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loadUrl(els.urlInput.value, true);
  });

  els.btnClearUrl.addEventListener('click', () => {
    els.urlInput.value = '';
    els.urlInput.focus();
  });

  els.btnBack.addEventListener('click', () => {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      loadUrl(state.urlHistory[state.historyIndex], false);
    }
  });

  els.btnForward.addEventListener('click', () => {
    if (state.historyIndex < state.urlHistory.length - 1) {
      state.historyIndex++;
      loadUrl(state.urlHistory[state.historyIndex], false);
    }
  });

  els.btnReload.addEventListener('click', () => {
    refreshIframes();
  });

  els.btnOpenExternal.addEventListener('click', () => {
    window.open(state.currentUrl, '_blank', 'noopener');
  });

  if (els.btnNoticeClose) {
    els.btnNoticeClose.addEventListener('click', () => {
      if (els.authSecurityNotice) {
        els.authSecurityNotice.classList.add('hidden');
      }
    });
  }

  els.proxyModeToggle.addEventListener('change', () => {
    state.useProxy = els.proxyModeToggle.checked;
    refreshIframes();
  });

  // Apple Light / Dark Theme Toggle
  els.themeToggleBtn.addEventListener('click', () => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });

  // Dedicated Responsive Mode Button
  els.btnResponsiveMode.addEventListener('click', () => {
    activateResponsiveMode();
  });

  // Quick Site Chips
  document.querySelectorAll('.site-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const targetUrl = chip.getAttribute('data-url');
      const wantsProxy = chip.getAttribute('data-proxy') === 'true';
      if (wantsProxy && state.proxyAvailable) {
        state.useProxy = true;
        els.proxyModeToggle.checked = true;
      }
      loadUrl(targetUrl, true);
    });
  });

  els.modeSingleBtn.addEventListener('click', () => setViewMode('single'));
  els.modeMatrixBtn.addEventListener('click', () => setViewMode('matrix'));

  els.categoryTabs.querySelectorAll('.cat-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      els.categoryTabs.querySelectorAll('.cat-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeCategory = tab.getAttribute('data-cat');
      renderDeviceList();
    });
  });

  document.querySelectorAll('.bp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = parseInt(btn.getAttribute('data-w'), 10);
      const h = parseInt(btn.getAttribute('data-h'), 10);
      activateResponsiveMode(w, h);
    });
  });

  const handleManualDimChange = () => {
    if (!state.isResponsiveMode) return;
    const w = Math.min(3840, Math.max(240, parseInt(els.inputWidth.value, 10) || 768));
    const h = Math.min(3840, Math.max(240, parseInt(els.inputHeight.value, 10) || 850));
    state.width = w;
    state.height = h;
    applyDimensionsAndTelemetry();
  };

  els.inputWidth.addEventListener('change', handleManualDimChange);
  els.inputHeight.addEventListener('change', handleManualDimChange);

  els.btnRotate.addEventListener('click', () => {
    const temp = state.width;
    state.width = state.height;
    state.height = temp;
    els.inputWidth.value = state.width;
    els.inputHeight.value = state.height;
    applyDimensionsAndTelemetry();
  });

  els.zoomSelect.addEventListener('change', () => {
    state.zoomMode = els.zoomSelect.value;
    if (els.btnZoom100) els.btnZoom100.classList.toggle('active', state.zoomMode === '1');
    if (els.btnZoomFit) els.btnZoomFit.classList.toggle('active', state.zoomMode === 'fit');
    updateScale();
  });

  if (els.btnZoom100) {
    els.btnZoom100.addEventListener('click', () => {
      state.zoomMode = '1';
      els.zoomSelect.value = '1';
      els.btnZoom100.classList.add('active');
      if (els.btnZoomFit) els.btnZoomFit.classList.remove('active');
      updateScale();
    });
  }

  if (els.btnZoomFit) {
    els.btnZoomFit.addEventListener('click', () => {
      state.zoomMode = 'fit';
      els.zoomSelect.value = 'fit';
      els.btnZoomFit.classList.add('active');
      if (els.btnZoom100) els.btnZoom100.classList.remove('active');
      updateScale();
    });
  }

  els.btnToggleFrame.addEventListener('click', () => {
    state.showBezel = !state.showBezel;
    els.btnToggleFrame.classList.toggle('active', state.showBezel);
    els.deviceShell.classList.toggle('bezel-enabled', state.showBezel && !state.isResponsiveMode);
    applyDimensionsAndTelemetry();
  });

  els.btnToggleStatusbar.addEventListener('click', () => {
    state.showStatusBar = !state.showStatusBar;
    els.btnToggleStatusbar.classList.toggle('active', state.showStatusBar);
    applyDimensionsAndTelemetry();
  });

  els.btnToggleTouch.addEventListener('click', () => {
    state.touchCursor = !state.touchCursor;
    els.btnToggleTouch.classList.toggle('active', state.touchCursor);
    applyDimensionsAndTelemetry();
  });

  els.btnToggleGrid.addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    els.btnToggleGrid.classList.toggle('active', state.showGrid);
    els.gridOverlay.classList.toggle('hidden', !state.showGrid);
  });

  els.simIframe.addEventListener('load', () => {
    els.loadingOverlay.classList.remove('visible');
    injectEnvironmentIntoSameOriginIframe(els.simIframe, getActivePreset());
  });

  // Interactive simulated browser address bars & reload buttons
  document.querySelectorAll('.ios-reload, .ac-tabs, .win11-nav-icons span:last-child').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      refreshIframes();
    });
  });

  document.querySelectorAll('.ios-capsule-domain, .ac-omnibox, .ipados-url-pill, .macos-address-pill, .win11-omnibox').forEach((pill) => {
    pill.addEventListener('click', () => {
      els.urlInput.focus();
      els.urlInput.select();
    });
  });

  // Multi-Device Matrix Controls
  if (els.matrixScaleSelect) {
    els.matrixScaleSelect.addEventListener('change', () => {
      state.matrixScale = els.matrixScaleSelect.value;
      updateMatrixScales();
    });
  }

  if (els.btnMatrixSyncReload) {
    els.btnMatrixSyncReload.addEventListener('click', () => {
      reloadAllMatrixDevices();
    });
  }

  if (els.matrixSelectMobile) {
    els.matrixSelectMobile.addEventListener('change', (e) => {
      changeMatrixDevice('mobile', e.target.value);
    });
  }

  if (els.matrixSelectTablet) {
    els.matrixSelectTablet.addEventListener('change', (e) => {
      changeMatrixDevice('tablet', e.target.value);
    });
  }

  if (els.matrixSelectDesktop) {
    els.matrixSelectDesktop.addEventListener('change', (e) => {
      changeMatrixDevice('desktop', e.target.value);
    });
  }

  if (els.btnRotateMatrixMobile) {
    els.btnRotateMatrixMobile.addEventListener('click', () => rotateMatrixDevice('mobile'));
  }

  if (els.btnRotateMatrixTablet) {
    els.btnRotateMatrixTablet.addEventListener('click', () => rotateMatrixDevice('tablet'));
  }

  if (els.btnReloadMatrixMobile) {
    els.btnReloadMatrixMobile.addEventListener('click', () => reloadMatrixDevice('mobile'));
  }

  if (els.btnReloadMatrixTablet) {
    els.btnReloadMatrixTablet.addEventListener('click', () => reloadMatrixDevice('tablet'));
  }

  if (els.btnReloadMatrixDesktop) {
    els.btnReloadMatrixDesktop.addEventListener('click', () => reloadMatrixDevice('desktop'));
  }

  if (els.btnFocusMatrixMobile) {
    els.btnFocusMatrixMobile.addEventListener('click', () => focusSingleDevice(state.matrixDims.mobile.presetId));
  }

  if (els.btnFocusMatrixTablet) {
    els.btnFocusMatrixTablet.addEventListener('click', () => focusSingleDevice(state.matrixDims.tablet.presetId));
  }

  if (els.btnFocusMatrixDesktop) {
    els.btnFocusMatrixDesktop.addEventListener('click', () => focusSingleDevice(state.matrixDims.desktop.presetId));
  }

  els.matrixIframeMobile.addEventListener('load', () => {
    const p = DEVICE_PRESETS.find((d) => d.id === state.matrixDims.mobile.presetId);
    if (p) injectEnvironmentIntoSameOriginIframe(els.matrixIframeMobile, p);
  });

  els.matrixIframeTablet.addEventListener('load', () => {
    const p = DEVICE_PRESETS.find((d) => d.id === state.matrixDims.tablet.presetId);
    if (p) injectEnvironmentIntoSameOriginIframe(els.matrixIframeTablet, p);
  });

  els.matrixIframeDesktop.addEventListener('load', () => {
    const p = DEVICE_PRESETS.find((d) => d.id === state.matrixDims.desktop.presetId);
    if (p) injectEnvironmentIntoSameOriginIframe(els.matrixIframeDesktop, p);
  });

  window.addEventListener('resize', () => {
    if (state.viewMode === 'single' && state.zoomMode === 'fit') {
      updateScale();
    } else if (state.viewMode === 'matrix' && state.matrixScale === 'fit') {
      updateMatrixScales();
    }
  });
}

// Interactive Drag-to-Resize Handles (ONLY active in Mode Responsive)
function setupResizeHandles() {
  let isResizing = false;
  let resizeDir = null;
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;

  const startResize = (e, dir) => {
    if (!state.isResponsiveMode) return;
    e.preventDefault();
    isResizing = true;
    resizeDir = dir;
    startX = e.clientX;
    startY = e.clientY;
    startW = state.width;
    startH = state.height;

    els.deviceShell.classList.add('resizing');
    els.simIframe.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';
  };

  els.resizeRight.addEventListener('mousedown', (e) => startResize(e, 'right'));
  els.resizeBottom.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
  els.resizeCorner.addEventListener('mousedown', (e) => startResize(e, 'corner'));

  window.addEventListener('mousemove', (e) => {
    if (!isResizing || !state.isResponsiveMode) return;

    const scale = state.currentScale || 1;
    const dx = ((e.clientX - startX) / scale) * 2;
    const dy = ((e.clientY - startY) / scale) * 2;

    if (resizeDir === 'right' || resizeDir === 'corner') {
      state.width = Math.round(Math.min(3840, Math.max(260, startW + dx)));
      els.inputWidth.value = state.width;
    }

    if (resizeDir === 'bottom' || resizeDir === 'corner') {
      state.height = Math.round(Math.min(3840, Math.max(260, startH + dy)));
      els.inputHeight.value = state.height;
    }

    applyDimensionsAndTelemetry();
  });

  window.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    resizeDir = null;
    els.deviceShell.classList.remove('resizing');
    els.simIframe.style.pointerEvents = 'auto';
    document.body.style.userSelect = '';
  });
}

// ==========================================================================
// STUDIO SCREENSHOT & MOCKUP ENGINE (Apple HIG Suite)
// ==========================================================================

const shotState = {
  target: 'mockup', // 'mockup' | 'viewport' | 'canvas'
  bg: 'studio',     // 'transparent' | 'studio' | 'white' | 'black'
  method: 'display-media', // 'display-media' | 'headless'
  currentBlob: null,
  currentDataUrl: null,
  isCapturing: false
};

function showAppleToast(message, icon = '✅') {
  if (!els.appleToastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'apple-toast';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  els.appleToastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar render'));
    img.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Composite realistic device mockup chassis onto canvas
 */
async function renderMockupComposite(viewportImg, preset, bgOption) {
  const isMobile = preset.category === 'mobile';
  const isTablet = preset.category === 'tablet';
  const isDesktop = preset.category === 'desktop';

  // Physical bezel paddings
  let padX = 24;
  let padY = 24;
  let cornerRadius = 46;
  let screenCornerRadius = 40;

  if (isTablet) {
    padX = 32;
    padY = 32;
    cornerRadius = 28;
    screenCornerRadius = 22;
  } else if (isDesktop) {
    padX = 20;
    padY = 38;
    cornerRadius = 14;
    screenCornerRadius = 8;
  }

  const screenW = state.width;
  const screenH = state.height;
  const chassisW = screenW + (padX * 2);
  const chassisH = screenH + (padY * 2);

  const margin = bgOption === 'transparent' ? 24 : 60;
  const canvasW = chassisW + (margin * 2);
  const canvasH = chassisH + (margin * 2);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  // 1. Draw Background
  if (bgOption === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (bgOption === 'black') {
    ctx.fillStyle = '#0B0B0E';
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (bgOption === 'studio') {
    const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    if (state.theme === 'dark') {
      grad.addColorStop(0, '#1c1c1e');
      grad.addColorStop(1, '#08080a');
    } else {
      grad.addColorStop(0, '#f5f5f7');
      grad.addColorStop(1, '#e5e5ea');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  const chassisX = margin;
  const chassisY = margin;

  // 2. Realistic Chassis Drop Shadow
  ctx.save();
  ctx.shadowColor = state.theme === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 18;

  // Draw chassis background
  ctx.beginPath();
  ctx.roundRect(chassisX, chassisY, chassisW, chassisH, cornerRadius);
  ctx.fillStyle = '#1A1A1E';
  ctx.fill();
  ctx.restore();

  // 3. Chassis Rim Border (Titanium / Aluminum Sheen)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(chassisX, chassisY, chassisW, chassisH, cornerRadius);
  ctx.lineWidth = 3;
  ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.35)';
  ctx.stroke();
  ctx.restore();

  // 4. Clip and Draw Screen Content
  const screenX = chassisX + padX;
  const screenY = chassisY + padY;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(screenX, screenY, screenW, screenH, screenCornerRadius);
  ctx.clip();
  ctx.drawImage(viewportImg, screenX, screenY, screenW, screenH);
  ctx.restore();

  // 5. Draw Dynamic Island / Punch Hole / Notch & Top Chrome
  if (isMobile) {
    if (preset.frameType === 'dynamic-island') {
      const islandW = 114;
      const islandH = 32;
      const islandX = screenX + (screenW - islandW) / 2;
      const islandY = screenY + 11;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(islandX, islandY, islandW, islandH, 16);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Camera lens reflection
      ctx.beginPath();
      ctx.arc(islandX + islandW - 20, islandY + islandH / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0d131f';
      ctx.fill();
      ctx.restore();
    } else if (preset.frameType === 'punch-hole' || preset.frameType === 'punch-hole-sharp') {
      const holeX = screenX + screenW / 2;
      const holeY = screenY + 18;
      ctx.beginPath();
      ctx.arc(holeX, holeY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
    } else if (preset.frameType === 'classic-notch') {
      const notchW = 160;
      const notchH = 26;
      const notchX = screenX + (screenW - notchW) / 2;
      const notchY = screenY;
      ctx.beginPath();
      ctx.roundRect(notchX, notchY, notchW, notchH, [0, 0, 16, 16]);
      ctx.fillStyle = '#000000';
      ctx.fill();
    }

    // iOS Home Indicator pill
    if (preset.osFamily === 'ios' || preset.osFamily === 'ipados') {
      const pillW = 134;
      const pillH = 5;
      const pillX = screenX + (screenW - pillW) / 2;
      const pillY = screenY + screenH - 12;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    }
  } else if (isDesktop) {
    // macOS traffic lights
    const tlY = chassisY + 16;
    const tlStartX = chassisX + 16;
    const colors = ['#FF5F56', '#FFBD2E', '#27C93F'];
    colors.forEach((col, idx) => {
      ctx.beginPath();
      ctx.arc(tlStartX + (idx * 16), tlY, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });
  }

  const blob = await canvasToBlob(canvas);
  return {
    blob,
    dataUrl: canvas.toDataURL('image/png'),
    w: canvasW,
    h: canvasH
  };
}

/**
 * Capture Active Screen / Mockup via W3C Screen Capture API
 */
async function captureActiveViaDisplayMedia() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Fitur Screen Capture tidak didukung di browser ini');
  }

  // Temporarily disable touch cursor for pristine screenshot
  const wasTouchEnabled = els.deviceScreen.classList.contains('touch-cursor-enabled');
  if (wasTouchEnabled) els.deviceScreen.classList.remove('touch-cursor-enabled');

  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' },
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      audio: false
    });
  } catch (err) {
    if (wasTouchEnabled) els.deviceScreen.classList.add('touch-cursor-enabled');
    throw err;
  }

  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    let targetEl = els.deviceShell;
    if (shotState.target === 'viewport') {
      targetEl = els.deviceScreen;
    } else if (shotState.target === 'canvas') {
      targetEl = els.canvasViewport;
    }

    const rect = targetEl.getBoundingClientRect();
    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;

    const sx = Math.max(0, rect.left * scaleX);
    const sy = Math.max(0, rect.top * scaleY);
    const sw = Math.min(video.videoWidth - sx, rect.width * scaleX);
    const sh = Math.min(video.videoHeight - sy, rect.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');

    if (shotState.bg === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (shotState.bg === 'black') {
      ctx.fillStyle = '#0B0B0E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (shotState.bg === 'studio' && shotState.target !== 'canvas') {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (state.theme === 'dark') {
        grad.addColorStop(0, '#1c1c1e');
        grad.addColorStop(1, '#0b0b0e');
      } else {
        grad.addColorStop(0, '#f2f2f7');
        grad.addColorStop(1, '#e5e5ea');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

    stream.getTracks().forEach((track) => track.stop());
    if (wasTouchEnabled) els.deviceScreen.classList.add('touch-cursor-enabled');

    const blob = await canvasToBlob(canvas);
    return {
      blob,
      dataUrl: canvas.toDataURL('image/png'),
      w: canvas.width,
      h: canvas.height
    };
  } catch (err) {
    stream.getTracks().forEach((track) => track.stop());
    if (wasTouchEnabled) els.deviceScreen.classList.add('touch-cursor-enabled');
    throw err;
  }
}

/**
 * Capture High-DPI Clean Screenshot via Headless Chromium Server
 */
async function captureViaHeadlessServer() {
  const activePreset = getActivePreset();
  const queryParams = new URLSearchParams({
    url: state.currentUrl,
    w: String(state.width),
    h: String(state.height),
    dpr: String(activePreset.dprNum || 2),
    ua: activePreset.ua
  });

  const response = await fetch(`/api/screenshot?${queryParams.toString()}`);
  const data = await response.json();

  if (data.status !== 'ok' || !data.dataUrl) {
    throw new Error(data.message || 'Gagal merender screenshot dari server');
  }

  const viewportImg = await loadImage(data.dataUrl);

  if (shotState.target === 'viewport') {
    const canvas = document.createElement('canvas');
    canvas.width = viewportImg.naturalWidth;
    canvas.height = viewportImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(viewportImg, 0, 0);
    const blob = await canvasToBlob(canvas);
    return {
      blob,
      dataUrl: data.dataUrl,
      w: canvas.width,
      h: canvas.height
    };
  }

  // If Mockup or Studio Canvas, composite into authentic device frame
  return await renderMockupComposite(viewportImg, activePreset, shotState.bg);
}

/**
 * Orchestrate Screenshot Generation
 */
async function executeScreenshot() {
  if (shotState.isCapturing) return;
  shotState.isCapturing = true;

  if (els.shotSpinner) els.shotSpinner.classList.remove('hidden');
  if (els.shotPreviewImg) els.shotPreviewImg.style.opacity = '0.35';

  const activePreset = getActivePreset();
  if (els.shotMetaDevice) els.shotMetaDevice.textContent = `${activePreset.icon} ${activePreset.name}`;
  if (els.shotMetaRes) els.shotMetaRes.textContent = `${state.width} × ${state.height} px`;
  if (els.shotMetaDpr) els.shotMetaDpr.textContent = activePreset.dpr;

  try {
    let result;
    if (shotState.method === 'display-media') {
      try {
        result = await captureActiveViaDisplayMedia();
      } catch (displayErr) {
        // Fallback gracefully to headless server render
        console.warn('DisplayMedia dibatalkan atau dialihkan ke headless server:', displayErr);
        showAppleToast('Menggunakan render headless server...', '⚡');
        result = await captureViaHeadlessServer();
      }
    } else {
      result = await captureViaHeadlessServer();
    }

    shotState.currentBlob = result.blob;
    shotState.currentDataUrl = result.dataUrl;

    if (els.shotPreviewImg) {
      els.shotPreviewImg.src = result.dataUrl;
      els.shotPreviewImg.style.opacity = '1';
    }

    if (els.shotMetaRes) {
      els.shotMetaRes.textContent = `${result.w} × ${result.h} px`;
    }
  } catch (err) {
    console.error('Screenshot error:', err);
    showAppleToast(`Gagal: ${err.message}`, '⚠️');
  } finally {
    shotState.isCapturing = false;
    if (els.shotSpinner) els.shotSpinner.classList.add('hidden');
  }
}

function openScreenshotModal() {
  if (!els.screenshotModal) return;
  els.screenshotModal.classList.remove('hidden');
  executeScreenshot();
}

function closeScreenshotModal() {
  if (!els.screenshotModal) return;
  els.screenshotModal.classList.add('hidden');
}

function downloadCurrentScreenshot() {
  if (!shotState.currentDataUrl) {
    showAppleToast('Belum ada screenshot yang siap diunduh', '⚠️');
    return;
  }
  const activePreset = getActivePreset();
  const filename = `responsiview-${activePreset.id}-${state.width}x${state.height}-${shotState.target}.png`;

  const link = document.createElement('a');
  link.href = shotState.currentDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showAppleToast('Screenshot berhasil diunduh!', '💾');
}

async function copyCurrentScreenshotToClipboard() {
  if (!shotState.currentBlob) {
    showAppleToast('Belum ada screenshot untuk disalin', '⚠️');
    return;
  }

  if (!navigator.clipboard || !navigator.clipboard.write) {
    showAppleToast('Browser Anda tidak mendukung salin gambar ke clipboard', '⚠️');
    return;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': shotState.currentBlob })
    ]);
    if (els.btnShotCopyLabel) {
      const prev = els.btnShotCopyLabel.textContent;
      els.btnShotCopyLabel.textContent = 'Tersalin!';
      setTimeout(() => {
        els.btnShotCopyLabel.textContent = prev;
      }, 2200);
    }
    showAppleToast('Disalin ke clipboard! Siap di-paste ke Figma / Slack', '📋');
  } catch (err) {
    showAppleToast('Gagal menyalin gambar ke clipboard', '⚠️');
  }
}

function setupScreenshotHandlers() {
  if (els.btnScreenshot) {
    els.btnScreenshot.addEventListener('click', openScreenshotModal);
  }
  if (els.btnQuickScreenshot) {
    els.btnQuickScreenshot.addEventListener('click', openScreenshotModal);
  }
  if (els.btnModalShotClose) {
    els.btnModalShotClose.addEventListener('click', closeScreenshotModal);
  }

  if (els.screenshotModal) {
    els.screenshotModal.addEventListener('click', (e) => {
      if (e.target === els.screenshotModal) {
        closeScreenshotModal();
      }
    });
  }

  // Segmented target buttons
  const targetBtns = [els.tabShotMockup, els.tabShotViewport, els.tabShotCanvas].filter(Boolean);
  targetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      targetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      shotState.target = btn.getAttribute('data-target') || 'mockup';
      executeScreenshot();
    });
  });

  if (els.shotBgSelect) {
    els.shotBgSelect.addEventListener('change', () => {
      shotState.bg = els.shotBgSelect.value;
      executeScreenshot();
    });
  }

  if (els.shotMethodSelect) {
    els.shotMethodSelect.addEventListener('change', () => {
      shotState.method = els.shotMethodSelect.value;
      executeScreenshot();
    });
  }

  if (els.btnShotRetake) {
    els.btnShotRetake.addEventListener('click', executeScreenshot);
  }

  if (els.btnShotDownload) {
    els.btnShotDownload.addEventListener('click', downloadCurrentScreenshot);
  }

  if (els.btnShotCopy) {
    els.btnShotCopy.addEventListener('click', copyCurrentScreenshotToClipboard);
  }

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+S or Cmd+Shift+S to screenshot
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      openScreenshotModal();
    }
    // Escape to close screenshot modal
    if (e.key === 'Escape' && els.screenshotModal && !els.screenshotModal.classList.contains('hidden')) {
      closeScreenshotModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
