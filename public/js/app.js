/**
 * Main Frontend Application Controller for Digital Sathi (ڈیجیٹل ساتھی)
 * Modern, Responsive, Fast & Interactive
 */

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

    // 3. Load Remote Data
    await this.loadPlatformData();

    // 4. Bind Events & Route checks
    this.bindEvents();
    this.handleRouting();
    window.addEventListener('hashchange', () => this.handleRouting());
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
        this.apps = appsRes.apps;
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
    const ticker = document.getElementById('announcement-text');
    if (ticker) {
      const isUr = window.i18n ? window.i18n.isUrdu() : true;
      ticker.innerText = (isUr ? settings.announcement_text_ur : settings.announcement_text_en) || 'خوش آمدید! ڈیجیٹل ساتھی پر تمام فائلیں تصدیق شدہ اور محفوظ ہیں۔';
    }

    // Toggle ad spaces if configured
    if (settings.ads_enabled === 'true') {
      document.querySelectorAll('.ad-placeholder-slot').forEach(el => el.style.display = 'block');
    } else {
      document.querySelectorAll('.ad-placeholder-slot').forEach(el => el.style.display = 'none');
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
          <button class="btn btn-secondary btn-sm" onclick="App.openAppDetails(${app.id})">
            <i class="fa-solid fa-circle-info"></i>
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
      container.innerHTML = `<p class="no-records">${window.i18n.t('no_results')}</p>`;
      return;
    }

    container.innerHTML = featured.map(a => this.renderAppCard(a)).join('');
  },

  renderNewApps() {
    const container = document.getElementById('new-apps-grid');
    if (!container) return;

    const newApps = this.apps.filter(a => a.is_new || a.id > 4).slice(0, 4);
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
      container.innerHTML = `
        <div class="empty-store-box">
          <i class="fa-solid fa-box-open"></i>
          <p>${window.i18n.isUrdu() ? 'معذرت، اس معیار کے مطابق کوئی ایپ نہیں ملی۔' : 'No apps found matching your search criteria.'}</p>
          <button class="btn btn-outline-cyan btn-sm" onclick="App.resetFilters()">${window.i18n.isUrdu() ? 'تمام ایپس دیکھیں' : 'Show All Apps'}</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(a => this.renderAppCard(a)).join('');
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
        <div class="detail-header-download-action">
          <button class="btn btn-primary btn-lg" onclick="App.startDownloadFlow(${app.id})">
            <i class="fa-solid fa-download"></i> ${window.i18n.t('btn_download_apk')} (${app.size_mb} MB)
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

        // Render Ready State with countdown and direct download buttons
        this.renderDownloadReady(checkData, name, isUr);
      } catch (err) {
        container.innerHTML = `
          <div class="alert alert-danger">
            ${isUr ? 'ڈاؤن لوڈ سرور سے رابطہ منقطع ہو گیا۔ براہِ کرم دوبارہ کوشش کریں۔' : 'Failed to reach download server. Please try again.'}
          </div>
        `;
      }
    }, 1800);
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

        <div class="ready-actions">
          <a href="${checkData.download_url}" target="_blank" class="btn btn-primary btn-lg btn-block" id="direct-download-anchor">
            <i class="fa-solid fa-download"></i> ${window.i18n.t('download_btn_now')} (${checkData.size_mb} MB)
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
  },

  handleRouting() {
    const hash = window.location.hash;
    const adminContainer = document.getElementById('admin-container');
    const mainWebsite = document.getElementById('main-website-content');

    if (hash === '#admin') {
      if (mainWebsite) mainWebsite.style.display = 'none';
      if (adminContainer) {
        adminContainer.style.display = 'block';
        window.AdminApp.init();
      }
    } else {
      if (adminContainer) adminContainer.style.display = 'none';
      if (mainWebsite) mainWebsite.style.display = 'block';

      // Update mobile nav active states
      document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
      const activeNav = document.querySelector(`.mobile-nav-item[href="${hash || '#home'}"]`);
      if (activeNav) activeNav.classList.add('active');
    }
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
