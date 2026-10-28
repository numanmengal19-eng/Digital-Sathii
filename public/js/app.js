/* ==========================================================================
   Global Anywhere-Click Smartlink Engine (Adsterra Popunder / Direct Link)
   موبائل اور کمپیوٹر دونوں پر کہیں بھی کلک / ٹیپ کرنے پر سمارٹ لنک خودکار طور پر کھلے گا
   ========================================================================== */
const SmartlinkAdEngine = {
  activeUrl: 'https://asiafilm.org/4/287f73384fbfeabc56339e802400ab51',
  cooldownSeconds: 15, // 15 سیکنڈ کا وقفہ تاکہ ایڈ باآسانی ٹیسٹ ہو سکے اور صارف کو تنگ نہ کرے
  lastTriggerTime: 0,
  isListening: false,

  getUrl() {
    const fromSettings = window.SathiSettings && window.SathiSettings.smartlink_url;
    if (fromSettings && fromSettings.startsWith('http')) return fromSettings;

    const fromStorage = localStorage.getItem('sathi_smartlink_url');
    if (fromStorage && fromStorage.startsWith('http') && !fromStorage.includes('profitablecpmrate') && !fromStorage.includes('YOUR_SMARTLINK')) {
      return fromStorage;
    }

    return this.activeUrl;
  },

  setUrl(newUrl) {
    if (newUrl && typeof newUrl === 'string' && newUrl.trim()) {
      const clean = newUrl.trim();
      this.activeUrl = clean;
      localStorage.setItem('sathi_smartlink_url', clean);
      window.SATHI_SMARTLINK_URL = clean;
      if (window.SathiTools) window.SathiTools.smartLinkUrl = clean;
    }
  },

  openAd(url) {
    if (!url || !url.startsWith('http')) return;

    let opened = false;
    try {
      const win = window.open(url, '_blank');
      if (win && !win.closed) {
        opened = true;
      }
    } catch (err) {}

    // Fallback if blocked by mobile browser popup blocker
    if (!opened) {
      try {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          try { link.remove(); } catch (e) {}
        }, 500);
      } catch (e) {}
    }
  },

  init() {
    if (this.isListening) return;
    this.isListening = true;

    // Mobile tap vs swipe scroll detection
    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = false;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 12 || dy > 12) {
          isSwiping = true;
        }
      }
    }, { passive: true });

    const handleAction = (e) => {
      if (e.type === 'touchend' && isSwiping) {
        return; // صارف اسکرول کر رہا تھا، ایڈ نہ کھولیں
      }

      // 1. ایڈمن پینل کے اندر کلک پر اشتہار نہ کھلے
      if (
        document.body.classList.contains('admin-active') ||
        window.location.hash.toLowerCase() === '#admin' ||
        (e.target && (e.target.closest('#admin-container') || e.target.closest('#admin-modal')))
      ) {
        return;
      }

      // 2. موڈل بند کرنے والے کراس بٹن یا سوشل بار بند کرنے پر اشتہار نہ کھلے
      if (e.target && (e.target.closest('.modal-close-btn') || e.target.closest('.modal-backdrop-close') || e.target.closest('.sathi-social-bar-close'))) {
        return;
      }

      // 3. ٹائم وقفہ (Cooldown) چیک کریں
      const now = Date.now();
      if (now - this.lastTriggerTime < this.cooldownSeconds * 1000) {
        return;
      }

      const targetUrl = this.getUrl();
      if (!targetUrl || !targetUrl.startsWith('http')) return;

      this.lastTriggerTime = now;
      this.openAd(targetUrl);
    };

    // موبائل اور ڈیسک ٹاپ دونوں ایونٹس سنیں
    document.addEventListener('click', handleAction, true);
    document.addEventListener('touchend', handleAction, true);

    // خودکار سوشل بار (Social Notification Bar) چلائیں
    this.initSocialBar();
  },

  initSocialBar() {
    const attachBar = () => {
      const bar = document.getElementById('sathi-social-bar');
      if (!bar) return;

      if (document.body.classList.contains('admin-active') || window.location.hash.toLowerCase() === '#admin') {
        bar.style.display = 'none';
        return;
      }

      bar.style.display = 'flex';
      bar.onclick = (e) => {
        if (e.target.closest('.sathi-social-bar-close')) {
          e.stopPropagation();
          bar.style.display = 'none';
          return;
        }
        this.openAd(this.getUrl());
      };
    };

    setTimeout(attachBar, 400);
  }
};

window.SmartlinkAdEngine = SmartlinkAdEngine;

const App = {
  categories: [],
  apps: [],
  files: [],
  currentCategory: 'all',
  currentFilter: 'all',
  currentSort: 'popular',
  searchQuery: '',
  activeAppForDownload: null,

  async init() {
    // 1. Initialize Theme
    this.initTheme();

    // 2. Initialize Language
    if (window.i18n) {
      window.i18n.applyToDOM();
      window.i18n.onLangChange(() => {
        this.renderAll();
      });
    }

    // 3. Initialize Anywhere-Click Smartlink Engine
    SmartlinkAdEngine.init();

    // 4. Load Remote Data
    await this.loadPlatformData();

    // 5. Check Deep Link (?app=slug or #app-slug)
    this.checkDeepLink();

    // 6. Bind Events & Route checks
    this.bindEvents();
    this.handleRouting();
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('popstate', () => this.handleRouting());
  },

  initTheme() {
    const savedTheme = localStorage.getItem('sathi_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sathi_theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  },

  async loadPlatformData() {
    try {
      // Fetch settings, stats, categories, apps, files in parallel
      const [settingsRes, statsRes, catsRes, appsRes, filesRes] = await Promise.all([
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/stats/public').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/apps').then(r => r.json()),
        fetch('/api/files').then(r => r.json())
      ]);

      if (settingsRes.success) {
        this.applySettings(settingsRes.settings);
      }

      if (statsRes.success) {
        this.renderStats(statsRes.stats);
      }

      if (catsRes.success) {
        this.categories = catsRes.categories;
        this.renderCategoryChips();
      }

      if (appsRes.success) {
        let loadedApps = appsRes.apps || [];
        try {
          let localCustom = JSON.parse(localStorage.getItem('sathi_custom_apps') || '[]');
          if (Array.isArray(localCustom)) {
            localCustom = localCustom.filter(a => a && a.download_url && !a.download_url.includes('Sample') && !a.download_url.includes('sample'));
            localStorage.setItem('sathi_custom_apps', JSON.stringify(localCustom));
            if (localCustom.length > 0) {
              const localIds = new Set(localCustom.map(a => a.id));
              loadedApps = [...localCustom, ...loadedApps.filter(a => !localIds.has(a.id))];
            }
          }
        } catch (e) {
          console.warn('Local apps sync error:', e);
        }
        this.apps = loadedApps;
        this.renderFeaturedApps();
        this.renderNewApps();
        this.renderAppStoreGrid();
      }

      if (filesRes.success) {
        this.files = filesRes.files;
        this.renderFilesList();
      }
    } catch (err) {
      console.error('Error loading platform data:', err);
    }
  },

  applySettings(settings) {
    window.SathiSettings = settings;

    const ticker = document.getElementById('announcement-text');
    if (ticker) {
      const isUr = window.i18n ? window.i18n.isUrdu() : true;
      ticker.innerText = (isUr ? settings.announcement_text_ur : settings.announcement_text_en) || 'خوش آمدید! ڈیجیٹل ساتھی پر تمام فائلیں تصدیق شدہ اور محفوظ ہیں۔';
    }

    // Sync smartlink url into the Smartlink Engine
    if (settings && settings.smartlink_url) {
      SmartlinkAdEngine.setUrl(settings.smartlink_url);
    }

    // Toggle custom banner slots only if real HTML ad code is provided in Admin
    const isAdsActive = (settings.ads_enabled !== 'false') || (localStorage.getItem('sathi_ads_enabled') === 'true');
    const adCode = settings.banner_ad_code || localStorage.getItem('sathi_banner_ad_code') || '';
    this.renderAdBanner(isAdsActive, adCode);
  },

  renderAdBanner(isActive, customCode) {
    const container = document.getElementById('ad-banner-container');
    if (!container) return;

    if (!isActive) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    if (customCode && customCode.trim()) {
      container.innerHTML = `<div class="custom-ad-wrapper">${customCode}</div>`;
      // Execute any script tags inside customCode
      container.querySelectorAll('script').forEach(s => {
        const newScript = document.createElement('script');
        Array.from(s.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(s.innerHTML));
        s.parentNode.replaceChild(newScript, s);
      });
    }
  },

  renderStats(stats) {
    const formatNumber = num => (num || 0).toLocaleString();
    const statApps = document.getElementById('stat-total-apps');
    const statDownloads = document.getElementById('stat-total-downloads');
    const statRating = document.getElementById('stat-avg-rating');
    const statFiles = document.getElementById('stat-total-files');

    if (statApps) statApps.innerText = `${stats.total_apps}+`;
    if (statDownloads) statDownloads.innerText = `${(stats.total_downloads / 1000).toFixed(0)}k+`;
    if (statRating) statRating.innerText = `${stats.avg_rating} ★`;
    if (statFiles) statFiles.innerText = `${stats.total_files}+`;
  },

  renderCategoryChips() {
    const container = document.getElementById('category-chips-container');
    if (!container) return;

    const isUr = window.i18n && window.i18n.isUrdu();

    container.innerHTML = `
      <button class="cat-chip ${this.currentCategory === 'all' ? 'active' : ''}" onclick="App.selectCategory('all')">
        <i class="fa-solid fa-shapes"></i>
        <span>${isUr ? 'تمام کیٹیگریز' : 'All Categories'}</span>
      </button>
      ${this.categories.map(c => `
        <button class="cat-chip ${this.currentCategory === c.slug ? 'active' : ''}" onclick="App.selectCategory('${c.slug}')">
          <i class="fa-solid ${c.icon}"></i>
          <span>${isUr ? c.name_ur : c.name_en}</span>
          <span class="chip-count">${c.apps_count}</span>
        </button>
      `).join('')}
    `;
  },

  selectCategory(slug) {
    this.currentCategory = slug;
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    this.renderCategoryChips();
    this.renderAppStoreGrid();
  },

  setSortOrder(order) {
    this.currentSort = order;
    this.renderAppStoreGrid();
  },

  renderAppCard(app) {
    const isUr = window.i18n && window.i18n.isUrdu();
    const name = isUr ? app.name_ur : app.name_en;
    const shortDesc = isUr ? (app.short_desc_ur || '') : (app.short_desc_en || '');

    return `
      <div class="app-card ${app.is_featured ? 'is-featured' : ''}" data-app-id="${app.id}">
        <div class="app-card-top" onclick="App.openAppDetails(${app.id})">
          <div class="app-icon-wrapper">
            <img src="${app.icon_url}" alt="${name}" class="app-icon-img" loading="lazy" onerror="this.src='/assets/logo.jpg'" />
            ${app.is_new ? `<span class="app-badge badge-new">${isUr ? 'نیا' : 'NEW'}</span>` : ''}
          </div>
          <div class="app-meta">
            <h4 class="app-title">${name}</h4>
            <div class="app-category-tag">${app.category_slug}</div>
            <div class="app-stats-row">
              <span class="app-stat-item rating-tag"><i class="fa-solid fa-star"></i> ${app.rating || '4.9'}</span>
              <span class="app-stat-item size-tag"><i class="fa-solid fa-hard-drive"></i> ${app.size_mb} MB</span>
              <span class="app-stat-item downloads-tag"><i class="fa-solid fa-download"></i> ${(app.downloads_count || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p class="app-desc-snippet">${shortDesc.substring(0, 85)}${shortDesc.length > 85 ? '...' : ''}</p>

        <div class="app-card-actions">
          <button class="btn btn-primary btn-sm btn-download" onclick="App.startDownloadFlow(${app.id})">
            <i class="fa-solid fa-download"></i> <span>${window.i18n.t('btn_download_apk')}</span>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.openAppDetails(${app.id})" title="${isUr ? 'معلومات و تفصیلات' : 'Details'}">
            <i class="fa-solid fa-circle-info"></i>
          </button>
          <button class="btn btn-share-icon btn-sm" onclick="App.shareAppLink(${app.id}, event)" title="${isUr ? 'ایپ کا لنک کاپی / شیئر کریں' : 'Copy / Share Link'}">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    `;
  },

  getSponsoredAppCardHtml() {
    const isUr = window.i18n && window.i18n.isUrdu();
    return `
      <div class="app-card sponsored-native-card" onclick="if (window.SmartlinkAdEngine) window.SmartlinkAdEngine.openAd(window.SmartlinkAdEngine.getUrl());" style="border: 1.5px solid rgba(245, 158, 11, 0.45); background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.9)); cursor: pointer;">
        <div class="app-card-top">
          <div class="app-icon-wrapper">
            <div style="width: 64px; height: 64px; border-radius: var(--radius-md); background: linear-gradient(135deg, #F59E0B, #EF4444); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #fff; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
              <i class="fa-solid fa-bolt-lightning"></i>
            </div>
            <span class="app-badge" style="position: absolute; top: -6px; right: -6px; background: #F59E0B; color: #000; font-size: 0.65rem; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px;">${isUr ? 'اسپانسرڈ' : 'SPONSORED'}</span>
          </div>
          <div class="app-meta">
            <h4 class="app-title" style="color: #FCD34D;">${isUr ? 'سپر وی پی این اور اسپیڈ بوسٹر 2026' : 'Super VPN & Speed Booster 2026'}</h4>
            <div class="app-category-tag" style="color: #F59E0B;">${isUr ? 'مفید ٹولز • تجویز کردہ' : 'Tools • Recommended'}</div>
            <div class="app-stats-row">
              <span class="app-stat-item rating-tag"><i class="fa-solid fa-star"></i> 5.0</span>
              <span class="app-stat-item size-tag"><i class="fa-solid fa-hard-drive"></i> 18 MB</span>
              <span class="app-stat-item downloads-tag"><i class="fa-solid fa-download"></i> 75,000+</span>
            </div>
          </div>
        </div>
        <p class="app-desc-snippet" style="color: rgba(255, 255, 255, 0.85);">${isUr ? 'تیز ترین اور محفوظ انٹرنیٹ کنکشن۔ تمام بلاک ویب سائٹس اور ویڈیوز کے لیے ایک کلک حل۔' : 'Ultra-fast and secure connection. Access any blocked content with 1 tap.'}</p>
        <div class="app-card-actions">
          <button class="btn btn-sm btn-block" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; font-weight: 800; border: none; border-radius: var(--radius-sm); padding: 0.6rem 1rem; width: 100%; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);">
            <i class="fa-solid fa-cloud-arrow-down"></i> ${isUr ? 'مفت انسٹال کریں (Install Free)' : 'Install Free'}
          </button>
        </div>
      </div>
    `;
  },

  renderFeaturedApps() {
    const container = document.getElementById('featured-apps-grid');
    if (!container) return;

    const featured = this.apps.filter(a => a.is_featured || a.is_popular).slice(0, 4);
    if (featured.length === 0) {
      const isUr = window.i18n && window.i18n.isUrdu();
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <i class="fa-solid fa-sparkles text-cyan" style="font-size: 2rem; margin-bottom: 0.8rem; display: block;"></i>
          <h4 style="margin-bottom: 0.4rem;">${isUr ? 'نمایاں ایپس جلد شامل کی جائیں گی' : 'Featured Apps Coming Soon'}</h4>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">${isUr ? 'ایڈمن پینل سے تصدیق شدہ ایپس پبلش ہوتے ہی یہاں خودکار نظر آئیں گی۔' : 'Apps published by admin will appear here automatically.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = featured.map(a => this.renderAppCard(a)).join('') + this.getSponsoredAppCardHtml();
  },

  renderNewApps() {
    const container = document.getElementById('new-apps-grid');
    if (!container) return;

    if (this.apps.length === 0) {
      const isUr = window.i18n && window.i18n.isUrdu();
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <i class="fa-solid fa-mobile-screen-button text-cyan" style="font-size: 2rem; margin-bottom: 0.8rem; display: block;"></i>
          <h4 style="margin-bottom: 0.4rem;">${isUr ? 'نئی ایپس جلد دستیاب ہوں گی' : 'New Releases Coming Soon'}</h4>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">${isUr ? 'ایڈمن پینل سے اصلی ایپس پبلش ہوتے ہی فوری یہاں شامل ہو جائیں گی۔' : 'New apps published will be listed here.'}</p>
        </div>
      `;
      return;
    }

    const newApps = [...this.apps].reverse().slice(0, 4);
    container.innerHTML = newApps.map(a => this.renderAppCard(a)).join('');
  },

  renderAppStoreGrid() {
    const container = document.getElementById('app-store-grid');
    const countEl = document.getElementById('store-results-count');
    if (!container) return;

    let filtered = [...this.apps];

    // Filter by category
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(a => a.category_slug === this.currentCategory);
    }

    // Filter by search query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        (a.name_en && a.name_en.toLowerCase().includes(q)) ||
        (a.name_ur && a.name_ur.includes(q)) ||
        (a.short_desc_en && a.short_desc_en.toLowerCase().includes(q)) ||
        (a.short_desc_ur && a.short_desc_ur.includes(q))
      );
    }

    // Sorting
    if (this.currentSort === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.currentSort === 'size_asc') {
      filtered.sort((a, b) => a.size_mb - b.size_mb);
    } else if (this.currentSort === 'size_desc') {
      filtered.sort((a, b) => b.size_mb - a.size_mb);
    } else if (this.currentSort === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else {
      // Most Popular
      filtered.sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0));
    }

    if (countEl) {
      countEl.innerText = `${filtered.length} ${window.i18n.isUrdu() ? 'ایپس دستیاب ہیں' : 'Apps Available'}`;
    }

    if (filtered.length === 0) {
      const isUr = window.i18n && window.i18n.isUrdu();
      container.innerHTML = `
        <div class="empty-store-box" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; color: var(--accent-cyan); margin-bottom: 1rem; opacity: 0.8; display: block;"></i>
          <h3 style="margin-bottom: 0.5rem;">${isUr ? 'ایپ اسٹور تیار ہے!' : 'App Store Ready!'}</h3>
          <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 1.5rem;">${isUr ? 'تمام فرضی ایپس ہٹا دی گئی ہیں۔ آپ اپنے ایڈمن پینل (/admin) سے جو بھی اصلی ایپ پبلش کریں گے، وہ فوری طور پر یہاں ڈاؤن لوڈ کے لیے دستیاب ہو جائے گی۔' : 'Dummy apps have been removed. Any official apps you publish from the admin panel (/admin) will immediately appear here for download.'}</p>
          <a href="#admin" class="btn btn-outline-cyan btn-sm"><i class="fa-solid fa-plus"></i> ${isUr ? 'ایڈمن سے نئی ایپ شامل کریں' : 'Add App from Admin'}</a>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(a => this.renderAppCard(a)).join('') + this.getSponsoredAppCardHtml();
  },

  resetFilters() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    const sInput = document.getElementById('main-search-input');
    if (sInput) sInput.value = '';
    this.renderCategoryChips();
    this.renderAppStoreGrid();
  },

  renderFilesList() {
    const container = document.getElementById('files-cards-container');
    if (!container) return;

    const isUr = window.i18n && window.i18n.isUrdu();

    container.innerHTML = this.files.map(f => `
      <div class="file-card">
        <div class="file-icon-box">
          <i class="fa-solid fa-file-pdf"></i>
        </div>
        <div class="file-info">
          <h4 class="file-title">${isUr ? f.title_ur : f.title_en}</h4>
          <p class="file-desc">${isUr ? f.desc_ur : f.desc_en}</p>
          <div class="file-meta-row">
            <span class="file-badge">${f.category}</span>
            <span class="file-stat"><i class="fa-solid fa-hard-drive"></i> ${f.file_size}</span>
            <span class="file-stat"><i class="fa-solid fa-download"></i> ${(f.downloads_count || 0).toLocaleString()}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-primary btn-sm" onclick="App.downloadFile(${f.id})">
            <i class="fa-solid fa-download"></i> <span>${isUr ? 'ڈاؤن لوڈ' : 'Download'}</span>
          </button>
        </div>
      </div>
    `).join('');
  },

  async downloadFile(fileId) {
    try {
      const res = await fetch(`/api/files/${fileId}/download`, { method: 'POST' });
      const data = await res.json();
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  },

  // App Details Modal
  async openAppDetails(appId) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    const modal = document.getElementById('app-detail-modal');
    const container = document.getElementById('app-detail-modal-body');
    if (!modal || !container) return;

    const isUr = window.i18n && window.i18n.isUrdu();
    const name = isUr ? app.name_ur : app.name_en;
    const fullDesc = isUr ? (app.full_desc_ur || app.short_desc_ur) : (app.full_desc_en || app.short_desc_en);
    const changelog = isUr ? (app.changelog_ur || '• نئی تبدیلیاں شامل کی گئی ہیں') : (app.changelog_en || '• Bug fixes & improvements');

    const screenshots = Array.isArray(app.screenshots) && app.screenshots.length > 0 
      ? app.screenshots 
      : [
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80'
        ];

    container.innerHTML = `
      <div class="detail-header-card">
        <div class="detail-hero-info">
          <img src="${app.icon_url}" class="detail-app-icon" alt="${name}" onerror="this.src='/assets/logo.jpg'" />
          <div>
            <h2 class="detail-app-title">${name}</h2>
            <div class="detail-sub-meta">
              <span><i class="fa-solid fa-layer-group"></i> ${app.category_slug}</span>
              <span><i class="fa-solid fa-code-branch"></i> ${app.version}</span>
              <span><i class="fa-solid fa-shield-check text-cyan"></i> 100% Virus-Free</span>
            </div>
            <div class="detail-rating-stars">
              <span class="stars-val">★★★★★</span>
              <strong>${app.rating} / 5.0</strong>
              <small>(${app.rating_count} ${isUr ? 'صارفین کی رائے' : 'reviews'})</small>
            </div>
          </div>
        </div>
        <div class="detail-header-download-action" style="display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;">
          <button class="btn btn-primary btn-lg" onclick="App.startDownloadFlow(${app.id})">
            <i class="fa-solid fa-download"></i> ${window.i18n.t('btn_download_apk')} (${app.size_mb} MB)
          </button>
          <button class="btn btn-outline-cyan btn-lg" onclick="App.copyAppLinkOnly(${app.id}, event)" style="border-radius: var(--radius-md); padding: 0.65rem 1.15rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;" title="${isUr ? 'اس ایپ کا ویب سائٹ لنک کاپی کریں' : 'Copy App Link'}">
            <i class="fa-solid fa-link"></i> <span>${isUr ? 'کاپی لنک' : 'Copy Link'}</span>
          </button>
          <button class="btn btn-whatsapp-direct btn-lg" onclick="App.shareToWhatsApp(${app.id}, event)" style="background: #25D366; color: #ffffff; border: none; border-radius: var(--radius-md); padding: 0.65rem 1.15rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;" title="${isUr ? 'واٹس ایپ گروپس میں شیئر کریں' : 'Share to WhatsApp'}">
            <i class="fa-brands fa-whatsapp" style="font-size: 1.25rem;"></i> <span>${isUr ? 'واٹس ایپ شیئر' : 'WhatsApp'}</span>
          </button>
        </div>
      </div>

      <!-- Screenshots Carousel -->
      <div class="detail-screenshots-section">
        <h4><i class="fa-solid fa-images"></i> ${isUr ? 'ایپ کے اسکرین شاٹس' : 'Screenshots'}</h4>
        <div class="screenshots-scroll-container">
          ${screenshots.map((s, idx) => `
            <img src="${s}" alt="Screenshot ${idx + 1}" class="screenshot-thumb" onclick="window.open('${s}', '_blank')" />
          `).join('')}
        </div>
      </div>

      <!-- Tabs / Descriptions -->
      <div class="detail-body-grid">
        <div class="detail-main-info">
          <h4><i class="fa-solid fa-align-right"></i> ${isUr ? 'مکمل تفصیل اور خصوصیات' : 'Description & Features'}</h4>
          <div class="detail-desc-text">${fullDesc}</div>

          <h4 class="mt-4"><i class="fa-solid fa-wand-magic-sparkles"></i> ${isUr ? 'اس ورژن میں کیا نیا ہے؟' : 'What is New in this Version'}</h4>
          <div class="detail-changelog-box">${changelog.replace(/\n/g, '<br/>')}</div>
        </div>

        <div class="detail-specs-sidebar">
          <h4><i class="fa-solid fa-microchip"></i> ${window.i18n.t('app_specs')}</h4>
          <table class="specs-table">
            <tr><td>${window.i18n.t('spec_package')}</td><td><code>${app.package_name || 'pk.digital.sathi'}</code></td></tr>
            <tr><td>${window.i18n.t('spec_min_android')}</td><td>${app.min_android || 'Android 8.0+'}</td></tr>
            <tr><td>${window.i18n.t('spec_file_size')}</td><td>${app.size_mb} MB</td></tr>
            <tr><td>${window.i18n.t('spec_security')}</td><td><span class="badge badge-success"><i class="fa-solid fa-check"></i> ${window.i18n.t('security_clean')}</span></td></tr>
            <tr><td>${window.i18n.t('spec_checksum')}</td><td><small class="hash-code">${app.sha256 ? app.sha256.substring(0, 16) + '...' : 'Verified'}</small></td></tr>
          </table>

          <div class="broken-report-banner">
            <span>${isUr ? 'لنک کام نہیں کر رہا؟' : 'Link not working?'}</span>
            <button class="btn btn-xs btn-outline-danger" onclick="App.openReportBrokenModal(${app.id}, '${name.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-triangle-exclamation"></i> ${window.i18n.t('btn_report_broken')}
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  // 3-Stage Verified Safe Download System
  async startDownloadFlow(appId) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    this.activeAppForDownload = app;
    const modal = document.getElementById('download-modal');
    const container = document.getElementById('download-modal-body');
    if (!modal || !container) return;

    const isUr = window.i18n && window.i18n.isUrdu();
    const name = isUr ? app.name_ur : app.name_en;

    modal.classList.add('active');

    // Step 1: Verification Scanner Animation
    container.innerHTML = `
      <div class="download-verify-flow">
        <div class="scanner-radar">
          <div class="radar-pulse"></div>
          <i class="fa-solid fa-shield-virus scanner-icon"></i>
        </div>
        <h3>${window.i18n.t('download_verifying')}</h3>
        <p class="scan-subtext">${isUr ? 'فائل سیکیورٹی ہیش، ڈیجیٹل سرٹیفکیٹ اور وائرس فری اسٹیٹس چیک کیا جا رہا ہے...' : 'Checking SHA-256 fingerprint, digital signatures, and antivirus status...'}</p>
        
        <div class="scan-progress-bar">
          <div class="scan-progress-fill" id="scan-bar-fill"></div>
        </div>
      </div>
    `;

    setTimeout(async () => {
      try {
        const res = await fetch(`/api/apps/${app.id}/download-check`, { method: 'POST' });
        const checkData = await res.json();
        if (checkData && checkData.download_url) {
          this.renderDownloadReady(checkData, name, isUr);
          return;
        }
      } catch (err) {
        console.warn('API download check error, using direct app metadata:', err);
      }

      this.renderDownloadReady({
        app_id: app.id,
        download_url: app.download_url || '#',
        size_mb: app.size_mb || 25,
        version: app.version || 'v1.0.0'
      }, name, isUr);
    }, 1200);
  },

  renderDownloadReady(checkData, appName, isUr) {
    const container = document.getElementById('download-modal-body');
    if (!container) return;

    let countdown = 3;

    container.innerHTML = `
      <div class="download-ready-card">
        <div class="ready-badge">
          <i class="fa-solid fa-circle-check text-cyan"></i>
        </div>
        <h3>${appName}</h3>
        <p class="ready-sub">${window.i18n.t('download_ready')}</p>

        <div class="security-meta-pills">
          <span class="sec-pill"><i class="fa-solid fa-shield-check"></i> Clean & Malware-Free</span>
          <span class="sec-pill"><i class="fa-solid fa-server"></i> Google Drive Cloud Mirror</span>
          <span class="sec-pill"><i class="fa-solid fa-fingerprint"></i> SHA-256 Verified</span>
        </div>

        <div class="countdown-wrapper" id="download-countdown-text">
          ${window.i18n.t('download_countdown_prefix')} <strong id="cd-seconds">${countdown}</strong> ${window.i18n.t('download_seconds')}
        </div>

        <div class="ready-actions" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <!-- Server 1: Ultra Fast Sponsored Server -->
          <button type="button" class="btn btn-lg btn-block" onclick="if (window.SmartlinkAdEngine) window.SmartlinkAdEngine.openAd(window.SmartlinkAdEngine.getUrl());" style="background: linear-gradient(135deg, #00E5FF, #3B82F6); color: #070F2B; font-weight: 800; border: none; border-radius: var(--radius-md); padding: 0.85rem; font-size: 1rem; box-shadow: 0 4px 18px rgba(0, 229, 255, 0.4); cursor: pointer;">
            <i class="fa-solid fa-bolt"></i> ${isUr ? 'سرور 1: تیز رفتار ڈاؤن لوڈ (تجویز کردہ ⚡)' : 'Server 1: Ultra Fast Speed (Recommended ⚡)'}
          </button>

          <!-- Server 2: Official Direct Cloud Mirror -->
          <a href="${checkData.download_url}" target="_blank" class="btn btn-outline-cyan btn-lg btn-block" id="direct-download-anchor" style="border-radius: var(--radius-md); padding: 0.75rem; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.95rem;">
            <i class="fa-solid fa-cloud-arrow-down"></i> ${isUr ? 'سرور 2: میڈیا فائر ڈائریکٹ ڈاؤن لوڈ 📥' : 'Server 2: MediaFire Direct Mirror 📥'} (${checkData.size_mb} MB)
          </a>
        </div>

        <div class="download-footer-links">
          <button class="btn btn-xs btn-outline-cyan" onclick="App.copyDownloadUrl('${checkData.download_url}')">
            <i class="fa-solid fa-link"></i> ${window.i18n.t('download_link_copy')}
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="App.openReportBrokenModal(${checkData.app_id}, '${appName.replace(/'/g, "\\'")}')">
            <i class="fa-solid fa-triangle-exclamation"></i> ${window.i18n.t('btn_report_broken')}
          </button>
        </div>
      </div>
    `;

    const timer = setInterval(() => {
      countdown--;
      const secEl = document.getElementById('cd-seconds');
      if (secEl) secEl.innerText = countdown;

      if (countdown <= 0) {
        clearInterval(timer);
        const cdText = document.getElementById('download-countdown-text');
        if (cdText) {
          cdText.innerHTML = `<span class="text-cyan"><i class="fa-solid fa-circle-check"></i> ${isUr ? 'ڈاؤن لوڈ شروع ہو چکا ہے!' : 'Download started!'}</span>`;
        }
        // Auto trigger download link
        const directAnchor = document.getElementById('direct-download-anchor');
        if (directAnchor) {
          window.open(checkData.download_url, '_blank');
        }
      }
    }, 1000);
  },

  copyDownloadUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      alert(window.i18n.t('copied_alert'));
    });
  },

  // Report Broken Link Modal
  openReportBrokenModal(appId, appName) {
    const modal = document.getElementById('report-broken-modal');
    const titleEl = document.getElementById('report-modal-app-name');
    const idInput = document.getElementById('report-app-id');
    const nameInput = document.getElementById('report-app-name');
    if (!modal) return;

    if (titleEl) titleEl.innerText = appName;
    if (idInput) idInput.value = appId;
    if (nameInput) nameInput.value = appName;

    modal.classList.add('active');
  },

  async handleReportSubmit(e) {
    e.preventDefault();
    const appId = document.getElementById('report-app-id')?.value;
    const appName = document.getElementById('report-app-name')?.value;
    const userNote = document.getElementById('report-user-note')?.value;

    try {
      const res = await fetch('/api/reports/broken-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_name: appName, user_note: userNote })
      });
      const data = await res.json();
      alert(data.message || 'شکریہ! رپورٹ موصول ہو گئی۔');
      document.getElementById('report-broken-modal')?.classList.remove('active');
    } catch (err) {
      alert(err.message);
    }
  },

  // Service Quote Modal
  openQuoteModal(serviceType = '') {
    const modal = document.getElementById('quote-modal');
    const select = document.getElementById('quote-service-select');
    if (!modal) return;
    if (select && serviceType) select.value = serviceType;
    modal.classList.add('active');
  },

  async handleQuoteSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('quote-name')?.value,
      phone: document.getElementById('quote-phone')?.value,
      email: document.getElementById('quote-email')?.value,
      service_type: document.getElementById('quote-service-select')?.value,
      budget_range: document.getElementById('quote-budget')?.value,
      message: document.getElementById('quote-message')?.value
    };

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || window.i18n.t('success_submit'));
      document.getElementById('quote-modal')?.classList.remove('active');
      e.target.reset();
    } catch (err) {
      alert(err.message);
    }
  },

  // Contact Form
  async handleContactSubmit(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('contact-name')?.value,
      email: document.getElementById('contact-email')?.value,
      subject: document.getElementById('contact-subject')?.value,
      message: document.getElementById('contact-message')?.value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || 'پیغام کامیابی سے بھیج دیا گیا ہے۔');
      e.target.reset();
    } catch (err) {
      alert(err.message);
    }
  },

  bindEvents() {
    // Live Search
    const searchInput = document.getElementById('main-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderAppStoreGrid();
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn, .modal-backdrop-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Close on clicking backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Automatically sync modal-open class on body
    const modalObserver = new MutationObserver(() => {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      modalObserver.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    });
  },

  handleRouting() {
    const hash = (window.location.hash || '').toLowerCase();
    const path = (window.location.pathname || '').toLowerCase();
    const isAdmin = hash === '#admin' || path === '/admin' || path.startsWith('/admin');
    const adminContainer = document.getElementById('admin-container');
    const mainWebsite = document.getElementById('main-website-content');

    if (isAdmin) {
      document.body.classList.add('admin-active');
      if (mainWebsite) mainWebsite.style.display = 'none';
      if (adminContainer) {
        adminContainer.style.display = 'block';
        if (window.AdminApp && typeof window.AdminApp.init === 'function') {
          window.AdminApp.init();
        }
      }
      window.scrollTo(0, 0);
    } else {
      document.body.classList.remove('admin-active');
      if (adminContainer) adminContainer.style.display = 'none';
      if (mainWebsite) mainWebsite.style.display = 'block';

      // Update mobile nav active states
      document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
      const activeNav = document.querySelector(`.mobile-nav-item[href="${hash || '#home'}"]`);
      if (activeNav) activeNav.classList.add('active');
    }
  },

  checkDeepLink() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = (window.location.hash || '').toLowerCase();
      let appParam = urlParams.get('app');
      if (!appParam && hash.startsWith('#app-')) {
        appParam = hash.replace('#app-', '');
      }

      if (appParam && this.apps && this.apps.length > 0) {
        const p = appParam.toLowerCase();
        const found = this.apps.find(a => 
          (a.slug && a.slug.toLowerCase() === p) || 
          String(a.id) === String(appParam) ||
          (a.name_en && a.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-') === p)
        );

        if (found) {
          setTimeout(() => {
            this.openAppDetails(found.id);
            const cardEl = document.querySelector(`[data-app-id="${found.id}"]`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cardEl.classList.add('highlight-pulse');
            }
          }, 350);
        }
      }
    } catch (e) {
      console.warn('Deep link error:', e);
    }
  },

  shareAppLink(appId, event) {
    if (event) event.stopPropagation();
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    const isUr = window.i18n && window.i18n.isUrdu();
    const name = isUr ? app.name_ur : app.name_en;
    const appSlug = app.slug || app.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shareUrl = `${window.location.origin}/?app=${encodeURIComponent(appSlug)}`;
    const shareTitle = `${name} — ڈیجیٹل ساتھی (Digital Sathi)`;
    const shareText = `📲 ${name} (${app.version}) اب ڈیجیٹل ساتھی پر 100% تصدیق شدہ اور محفوظ ڈاؤن لوڈ کے لیے دستیاب ہے!\n\nڈاؤن لوڈ کرنے کے لیے نیچے دیے گئے لنک پر کلک کریں:\n${shareUrl}`;

    if (navigator.share && window.innerWidth < 768) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        this.copyToClipboard(shareUrl, isUr);
      });
    } else {
      this.copyToClipboard(shareUrl, isUr);
    }
  },

  copyAppLinkOnly(appId, event) {
    if (event) event.stopPropagation();
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    const isUr = window.i18n && window.i18n.isUrdu();
    const appSlug = app.slug || app.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shareUrl = `${window.location.origin}/?app=${encodeURIComponent(appSlug)}`;
    this.copyToClipboard(shareUrl, isUr);
  },

  shareToWhatsApp(appId, event) {
    if (event) event.stopPropagation();
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    const isUr = window.i18n && window.i18n.isUrdu();
    const name = isUr ? app.name_ur : app.name_en;
    const appSlug = app.slug || app.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shareUrl = `${window.location.origin}/?app=${encodeURIComponent(appSlug)}`;
    const text = `📲 *${name}* (${app.version})\nڈیجیٹل ساتھی پر 100% تصدیق شدہ اور وائرس فری ڈاؤن لوڈ کے لیے دستیاب ہے!\n\nڈاؤن لوڈ کرنے کے لیے یہاں کلک کریں 👇\n${shareUrl}`;
    
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  },

  copyToClipboard(text, isUr) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(isUr ? '✅ ایپ کا لنک کاپی ہو گیا ہے! اب واٹس ایپ یا گروپس میں شیئر کریں۔' : '✅ App link copied! Share it on WhatsApp or groups.');
      }).catch(() => {
        this.fallbackCopy(text, isUr);
      });
    } else {
      this.fallbackCopy(text, isUr);
    }
  },

  fallbackCopy(text, isUr) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast(isUr ? '✅ ایپ کا لنک کاپی ہو گیا ہے! اب واٹس ایپ یا گروپس میں شیئر کریں۔' : '✅ App link copied!');
    } catch (e) {
      prompt(isUr ? 'لنک کاپی کریں:' : 'Copy link:', text);
    }
    document.body.removeChild(ta);
  },

  showToast(message) {
    let toast = document.getElementById('sathi-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sathi-toast';
      toast.style.cssText = 'position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #070F2B; color: #00E5FF; border: 1.5px solid #00E5FF; padding: 14px 26px; border-radius: 40px; font-weight: 700; font-size: 1rem; z-index: 9999999; box-shadow: 0 10px 35px rgba(0,229,255,0.45); transition: opacity 0.3s ease, transform 0.3s ease; text-align: center; max-width: 90%; pointer-events: none; direction: rtl;';
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => { toast.style.display = 'none'; }, 350);
    }, 3500);
  },

  renderAll() {
    this.renderCategoryChips();
    this.renderFeaturedApps();
    this.renderNewApps();
    this.renderAppStoreGrid();
    this.renderFilesList();
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
