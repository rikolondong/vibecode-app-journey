/**
 * Spline 3D Bridge & Loader
 * Enables dynamic embedding and loading of interactive Spline (.splinecode) scenes.
 */

export class SplineBridge {
  constructor(containerElement) {
    this.container = containerElement;
    this.viewerElement = null;
    this.currentUrl = null;
    this.isScriptLoaded = false;
  }

  ensureScript() {
    if (this.isScriptLoaded || customElements.get('spline-viewer')) {
      this.isScriptLoaded = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js';
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  async loadScene(splineUrl) {
    if (!this.container) return;
    this.currentUrl = splineUrl;

    await this.ensureScript();

    this.container.innerHTML = '';
    const viewer = document.createElement('spline-viewer');
    viewer.setAttribute('url', splineUrl);
    viewer.style.width = '100%';
    viewer.style.height = '100%';
    viewer.style.display = 'block';

    this.container.appendChild(viewer);
    this.viewerElement = viewer;
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.viewerElement = null;
    this.currentUrl = null;
  }
}
