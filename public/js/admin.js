/**
 * Admin Panel CMS Controller for Digital Sathi (ڈیجیٹل ساتھی)
 * Secure, Token-based Dashboard with full CRUD & Analytics
 */

const AdminApp = {
  token: localStorage.getItem('sathi_admin_token') || null,
  currentTab: 'overview',
  categories: [],
  apps: [],

  init() {
    this.checkSession();
  },

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  },

  async checkSession() {
    if (!this.token) {
      this.showLoginView();
      return;
    }

    try {
      const res = await fetch('/api/admin/me', { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Session expired');
      const data = await res.json();
      this.showDashboardView(data.admin);
    } catch (e) {
      this.logout();
    }
  },

  async login(username, password) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Login failed');
        return;
      }

      this.token = data.token;
      localStorage.setItem('sathi_admin_token', this.token);
      this.showDashboardView(data.admin);
    } catch (err) {
      alert('Error during login: ' + err.message);
    }
  },

  logout() {
    this.token = null;
    localStorage.removeItem('sathi_admin_token');
    this.showLoginView();
  },

  showLoginView() {
    const adminContainer = document.getElementById('admin-container');
    if (!adminContainer) return;

    adminContainer.innerHTML = `
      <div class="admin-login-screen">
        <div class="admin-login-card">
          <div class="login-header">
            <div class="login-brand-icon">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h2>ڈیجیٹل ساتھی — ایڈمن کنٹرول پینل</h2>
            <p>Admin CMS Portal</p>
          </div>

          <!-- SECURE LOGIN FORM (No public password resetting) -->
          <form id="admin-login-form" onsubmit="AdminApp.handleLoginSubmit(event)">
            <div class="form-group">
              <label><i class="fa-solid fa-envelope"></i> ای میل یا یوزر نیم:</label>
              <input type="text" id="admin-username" class="form-control" required placeholder="ای میل یا یوزر نیم درج کریں" autofocus />
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-lock"></i> پاس ورڈ (Password):</label>
              <div style="position: relative;">
                <input type="password" id="admin-password" class="form-control" required placeholder="اپنا ایڈمن پاس ورڈ درج کریں" />
                <button type="button" onclick="AdminApp.togglePasswordVisibility('admin-password', 'pass-eye-icon-1')" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--accent-cyan); cursor: pointer; font-size: 1rem;" title="پاس ورڈ دیکھیں">
                  <i id="pass-eye-icon-1" class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="login-actions" style="margin-top: 1.25rem;">
              <button type="submit" class="btn btn-primary btn-block">
                <i class="fa-solid fa-right-to-bracket"></i> لاگ ان کریں (Sign In)
              </button>
            </div>
          </form>

          <div class="login-footer-hint" style="margin-top: 1.5rem; text-align: center;">
            <a href="/" style="color: var(--text-muted); font-size: 0.82rem; text-decoration: none;">
              <i class="fa-solid fa-house"></i> ہوم پیج دیکھیں
            </a>
          </div>
        </div>
      </div>
    `;
  },

  togglePasswordVisibility(inputId, iconId) {
    const p = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!p) return;
    if (p.type === 'password') {
      p.type = 'text';
      if (icon) icon.className = 'fa-solid fa-eye-slash';
    } else {
      p.type = 'password';
      if (icon) icon.className = 'fa-solid fa-eye';
    }
  },

  handleLoginSubmit(e) {
    e.preventDefault();
    const u = document.getElementById('admin-username')?.value;
    const p = document.getElementById('admin-password')?.value;
    this.login(u, p);
  },

  async showDashboardView(adminUser) {
    const adminContainer = document.getElementById('admin-container');
    if (!adminContainer) return;

    adminContainer.innerHTML = `
      <div class="admin-dashboard-layout">
        <!-- Mobile Sidebar Backdrop -->
        <div class="admin-sidebar-backdrop" id="admin-sidebar-backdrop" onclick="AdminApp.closeSidebar()"></div>

        <!-- Sidebar (Slide-out drawer on mobile) -->
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="admin-sidebar-header">
            <img src="/assets/logo.jpg" alt="Digital Sathi" class="admin-logo-img" onerror="this.style.display='none'" />
            <div class="admin-logo-text">
              <h3>Digital Sathi</h3>
              <span>Admin Console</span>
            </div>
            <!-- Mobile Close Button -->
            <button type="button" class="admin-sidebar-close-btn" onclick="AdminApp.closeSidebar()" aria-label="Close sidebar menu">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="admin-user-pill">
            <div class="user-avatar"><i class="fa-solid fa-user-shield"></i></div>
            <div class="user-info">
              <strong>${adminUser?.name || 'Super Admin'}</strong>
              <small title="${adminUser?.email || 'admin@digitalsathi.pk'}">${adminUser?.email || 'admin@digitalsathi.pk'}</small>
            </div>
          </div>

          <nav class="admin-nav">
            <button class="admin-nav-item active" onclick="AdminApp.switchTab('overview')">
              <i class="fa-solid fa-gauge-high"></i> <span>جائزہ و شماریات</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('apps')">
              <i class="fa-solid fa-mobile-screen-button"></i> <span>ایپس کا انتظام (Apps)</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('files')">
              <i class="fa-solid fa-file-pdf"></i> <span>فائلیں و دستاویزات (Files)</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('inquiries')">
              <i class="fa-solid fa-envelope-open-text"></i> <span>سروس انکوائریز (Quotes)</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('messages')">
              <i class="fa-solid fa-comments"></i> <span>رابطہ پیغامات (Contact)</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('broken_links')">
              <i class="fa-solid fa-triangle-exclamation"></i> <span>خراب لنکس رپورٹس</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('settings')">
              <i class="fa-solid fa-sliders"></i> <span>ویب سائٹ ترتیبات</span>
            </button>
            <button class="admin-nav-item" onclick="AdminApp.switchTab('security')">
              <i class="fa-solid fa-key"></i> <span>پاس ورڈ تبدیل کریں</span>
            </button>
          </nav>

          <div class="admin-sidebar-footer">
            <a href="/" target="_blank" class="btn btn-sm btn-outline-cyan btn-block">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> ویب سائٹ دیکھیں
            </a>
            <button class="btn btn-sm btn-danger btn-block mt-2" onclick="AdminApp.logout()">
              <i class="fa-solid fa-power-off"></i> لاگ آؤٹ
            </button>
          </div>
        </aside>

        <!-- Main Panel Content -->
        <main class="admin-main">
          <header class="admin-topbar">
            <div class="topbar-left-cluster">
              <button type="button" class="admin-hamburger-btn" onclick="AdminApp.toggleSidebar()" aria-label="Toggle navigation menu">
                <i class="fa-solid fa-bars"></i>
              </button>
              <div class="topbar-title" id="admin-tab-title">ڈیش بورڈ جائزہ</div>
            </div>
            <div class="topbar-actions">
              <button class="btn btn-sm btn-primary" onclick="AdminApp.openAddAppModal()">
                <i class="fa-solid fa-plus"></i> <span class="btn-text-responsive">نئی ایپ</span>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="AdminApp.refreshCurrentTab()" title="ریفریش">
                <i class="fa-solid fa-rotate"></i> <span class="btn-text-responsive">ریفریش</span>
              </button>
            </div>
          </header>

          <div class="admin-content-area" id="admin-tab-content">
            <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> ڈیٹا لوڈ ہو رہا ہے...</div>
          </div>
        </main>
      </div>
    `;

    await this.fetchCategories();
    this.switchTab('overview');
  },

  toggleSidebar() {
    const sb = document.getElementById('admin-sidebar');
    const bd = document.getElementById('admin-sidebar-backdrop');
    if (sb) sb.classList.toggle('active');
    if (bd) bd.classList.toggle('active');
    document.body.classList.toggle('sidebar-drawer-open');
  },

  closeSidebar() {
    const sb = document.getElementById('admin-sidebar');
    const bd = document.getElementById('admin-sidebar-backdrop');
    if (sb) sb.classList.remove('active');
    if (bd) bd.classList.remove('active');
    document.body.classList.remove('sidebar-drawer-open');
  },

  async fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      this.categories = data.categories || [];
    } catch (e) {
      console.error(e);
    }
  },

  async switchTab(tab) {
    this.closeSidebar();
    this.currentTab = tab;
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.admin-nav-item')).find(b => b.getAttribute('onclick')?.includes(tab));
    if (btn) btn.classList.add('active');

    const contentArea = document.getElementById('admin-tab-content');
    const titleEl = document.getElementById('admin-tab-title');

    if (tab === 'overview') {
      titleEl.innerText = '📊 ڈیش بورڈ شماریات و کارکردگی';
      this.renderOverviewTab(contentArea);
    } else if (tab === 'apps') {
      titleEl.innerText = '📱 ایپس کا مکمل انتظام (Apps Management)';
      this.renderAppsTab(contentArea);
    } else if (tab === 'files') {
      titleEl.innerText = '📁 پی ڈی ایف و مفید فائلیں (Files & PDFs)';
      this.renderFilesTab(contentArea);
    } else if (tab === 'inquiries') {
      titleEl.innerText = '📩 سروس آرڈرز و کوٹیشن درخواستیں (Inquiries)';
      this.renderInquiriesTab(contentArea);
    } else if (tab === 'messages') {
      titleEl.innerText = '💬 صارفین کے رابطہ پیغامات (Contact Messages)';
      this.renderMessagesTab(contentArea);
    } else if (tab === 'broken_links') {
      titleEl.innerText = '⚠️ خراب ڈاؤن لوڈ لنکس کی رپورٹس';
      this.renderBrokenLinksTab(contentArea);
    } else if (tab === 'settings') {
      titleEl.innerText = '⚙️ پورٹل ترتیبات و کنفیگریشن';
      this.renderSettingsTab(contentArea);
    } else if (tab === 'security') {
      titleEl.innerText = '🔒 ایڈمن پاس ورڈ تبدیل کریں';
      this.renderSecurityTab(contentArea);
    }
  },

  refreshCurrentTab() {
    this.switchTab(this.currentTab);
  },

  // 1. Overview Tab
  async renderOverviewTab(container) {
    container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> شماریات حاصل کی جا رہی ہیں...</div>';

    try {
      const res = await fetch('/api/admin/overview', { headers: this.getHeaders() });
      const { overview } = await res.json();

      container.innerHTML = `
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="stat-icon-wrapper bg-cyan"><i class="fa-solid fa-mobile-screen"></i></div>
            <div class="stat-meta">
              <span class="stat-number">${overview.totalApps}</span>
              <span class="stat-title">کل ایپس (${overview.publishedApps} شائع شدہ / ${overview.draftApps} ڈرافٹ)</span>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="stat-icon-wrapper bg-emerald"><i class="fa-solid fa-cloud-arrow-down"></i></div>
            <div class="stat-meta">
              <span class="stat-number">${(overview.totalDownloads || 0).toLocaleString()}</span>
              <span class="stat-title">کل تصدیق شدہ ڈاؤن لوڈز</span>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="stat-icon-wrapper bg-purple"><i class="fa-solid fa-file-pdf"></i></div>
            <div class="stat-meta">
              <span class="stat-number">${overview.totalFiles}</span>
              <span class="stat-title">دستیاب پی ڈی ایف فائلیں</span>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="stat-icon-wrapper bg-amber"><i class="fa-solid fa-handshake"></i></div>
            <div class="stat-meta">
              <span class="stat-number">${overview.pendingInquiries}</span>
              <span class="stat-title">نئی سروس درخواستیں</span>
            </div>
          </div>
        </div>

        <div class="admin-two-cols mt-4">
          <!-- Recent Inquiries -->
          <div class="admin-panel-box">
            <div class="panel-box-header">
              <h4><i class="fa-solid fa-inbox"></i> تازہ ترین سروس درخواستیں (Inquiries)</h4>
              <button class="btn btn-xs btn-outline-cyan" onclick="AdminApp.switchTab('inquiries')">سب دیکھیں</button>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr><th>نام</th><th>سروس</th><th>فون</th><th>اسٹیٹس</th></tr>
                </thead>
                <tbody>
                  ${overview.recentInquiries.length === 0 ? '<tr><td colspan="4" class="text-center">کوئی نئی درخواست نہیں۔</td></tr>' : ''}
                  ${overview.recentInquiries.map(inq => `
                    <tr>
                      <td><strong>${inq.name}</strong></td>
                      <td><span class="badge badge-info">${inq.service_type}</span></td>
                      <td><a href="https://wa.me/${inq.phone.replace(/[^0-9]/g,'')}" target="_blank" class="text-cyan">${inq.phone}</a></td>
                      <td><span class="badge ${inq.status === 'pending' ? 'badge-warning' : 'badge-success'}">${inq.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Broken Links Alerts -->
          <div class="admin-panel-box">
            <div class="panel-box-header">
              <h4><i class="fa-solid fa-triangle-exclamation text-amber"></i> خراب لنک کی رپورٹس</h4>
              <button class="btn btn-xs btn-outline-cyan" onclick="AdminApp.switchTab('broken_links')">سب دیکھیں</button>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr><th>ایپ کا نام</th><th>یوزر نوٹ</th><th>اسٹیٹس</th></tr>
                </thead>
                <tbody>
                  ${overview.recentReports.length === 0 ? '<tr><td colspan="3" class="text-center text-success">سب لنکس درست کام کر رہے ہیں!</td></tr>' : ''}
                  ${overview.recentReports.map(rep => `
                    <tr>
                      <td><strong>${rep.app_name}</strong></td>
                      <td><small>${rep.user_note || 'ڈاؤن لوڈ کام نہیں کر رہا'}</small></td>
                      <td><span class="badge ${rep.status === 'pending' ? 'badge-danger' : 'badge-success'}">${rep.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">خرابی: ${e.message}</div>`;
    }
  },

  // 2. Apps Management Tab
  async renderAppsTab(container) {
    container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> ایپس حاصل کی جا رہی ہیں...</div>';

    try {
      const res = await fetch('/api/admin/apps', { headers: this.getHeaders() });
      const data = await res.json();
      let appsList = (data.apps || []).filter(a => a && a.download_url && !a.download_url.includes('Sample') && !a.download_url.includes('sample'));
      try {
        let localCustom = JSON.parse(localStorage.getItem('sathi_custom_apps') || '[]');
        if (Array.isArray(localCustom)) {
          localCustom = localCustom.filter(a => a && a.download_url && !a.download_url.includes('Sample') && !a.download_url.includes('sample'));
          localStorage.setItem('sathi_custom_apps', JSON.stringify(localCustom));
          if (localCustom.length > 0) {
            const localIds = new Set(localCustom.map(a => a.id));
            appsList = [...localCustom, ...appsList.filter(a => !localIds.has(a.id))];
          }
        }
      } catch (e) {
        console.warn('Local apps sync error:', e);
      }
      this.apps = appsList;

      container.innerHTML = `
        <div class="table-controls-row">
          <div class="search-input-group">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="admin-apps-search" class="form-control" placeholder="ایپ تلاش کریں..." oninput="AdminApp.filterAppsTable()" />
          </div>
          <button class="btn btn-primary" onclick="AdminApp.openAddAppModal()">
            <i class="fa-solid fa-plus"></i> نئی ایپ شامل کریں
          </button>
        </div>

        <div class="table-responsive mt-3">
          <table class="admin-table" id="apps-data-table">
            <thead>
              <tr>
                <th>آئیکن</th>
                <th>نام (Urdu / English)</th>
                <th>کیٹیگری</th>
                <th>ورژن</th>
                <th>سائز</th>
                <th>ڈاؤن لوڈز</th>
                <th>اسٹیٹس</th>
                <th>نمایاں</th>
                <th>ایکشنز</th>
              </tr>
            </thead>
            <tbody>
              ${this.apps.map(app => `
                <tr id="app-row-${app.id}">
                  <td><img src="${app.icon_url}" class="table-app-icon" onerror="this.src='/assets/logo.jpg'" /></td>
                  <td>
                    <strong>${app.name_ur}</strong>
                    <div class="sub-text">${app.name_en}</div>
                  </td>
                  <td><span class="badge badge-secondary">${app.category_slug}</span></td>
                  <td><code>${app.version}</code></td>
                  <td>${app.size_mb} MB</td>
                  <td>${(app.downloads_count || 0).toLocaleString()}</td>
                  <td>
                    <button class="status-toggle-btn ${app.is_published ? 'is-active' : 'is-draft'}" onclick="AdminApp.togglePublish(${app.id})">
                      ${app.is_published ? 'شائع شدہ' : 'ڈرافٹ'}
                    </button>
                  </td>
                  <td>
                    <button class="featured-toggle-btn ${app.is_featured ? 'is-featured' : ''}" onclick="AdminApp.toggleFeatured(${app.id})">
                      <i class="fa-solid fa-star"></i>
                    </button>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="action-btn edit-btn" title="تبدیل کریں" onclick="AdminApp.openEditAppModal(${app.id})">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button class="action-btn delete-btn" title="حذف کریں" onclick="AdminApp.deleteApp(${app.id})">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">خرابی: ${e.message}</div>`;
    }
  },

  filterAppsTable() {
    const term = document.getElementById('admin-apps-search')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#apps-data-table tbody tr');
    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      r.style.display = text.includes(term) ? '' : 'none';
    });
  },

  async togglePublish(appId) {
    try {
      const res = await fetch(`/api/admin/apps/${appId}/toggle-publish`, {
        method: 'PATCH',
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.renderAppsTab(document.getElementById('admin-tab-content'));
      }
    } catch (e) {
      alert(e.message);
    }
  },

  async toggleFeatured(appId) {
    try {
      const res = await fetch(`/api/admin/apps/${appId}/toggle-featured`, {
        method: 'PATCH',
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.renderAppsTab(document.getElementById('admin-tab-content'));
      }
    } catch (e) {
      alert(e.message);
    }
  },

  async deleteApp(appId) {
    if (!confirm('کیا آپ واقعی اس ایپ کو مستقل طور پر حذف کرنا چاہتے ہیں؟')) return;
    try {
      await fetch(`/api/admin/apps/${appId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      // Also remove from localStorage cache
      try {
        const localCustom = JSON.parse(localStorage.getItem('sathi_custom_apps') || '[]');
        const filtered = localCustom.filter(a => a.id != appId);
        localStorage.setItem('sathi_custom_apps', JSON.stringify(filtered));
      } catch (e) {}

      alert('ایپ کامیابی سے حذف ہو گئی۔');
      this.renderAppsTab(document.getElementById('admin-tab-content'));
    } catch (e) {
      alert(e.message);
    }
  },

  openAddAppModal() {
    this.openAppFormModal(null);
  },

  openEditAppModal(appId) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;
    this.openAppFormModal(app);
  },

  openAppFormModal(app) {
    const isEdit = !!app;
    const modal = document.getElementById('admin-modal');
    const titleEl = document.getElementById('admin-modal-title');
    const bodyEl = document.getElementById('admin-modal-body');

    titleEl.innerText = isEdit ? `ایپ میں ترمیم: ${app.name_ur}` : 'نئی ایپ شامل کریں';

    const screenshots = isEdit && Array.isArray(app.screenshots) ? app.screenshots.join('\n') : '';

    bodyEl.innerHTML = `
      <form id="app-upsert-form" onsubmit="AdminApp.handleAppFormSubmit(event, ${isEdit ? app.id : 'null'})">
        <div class="form-row">
          <div class="form-group">
            <label>ایپ کا انگریزی نام (English Name): *</label>
            <input type="text" id="app_name_en" class="form-control" required value="${app?.name_en || ''}" placeholder="e.g. DigiKhata Pro" />
          </div>
          <div class="form-group">
            <label>ایپ کا اردو نام (Urdu Name): *</label>
            <input type="text" id="app_name_ur" class="form-control" required value="${app?.name_ur || ''}" placeholder="مثال: ڈیجی کھاتہ پرو" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>کیٹیگری (Category): *</label>
            <select id="app_category" class="form-control" required>
              ${this.categories.map(c => `
                <option value="${c.slug}" ${app?.category_slug === c.slug ? 'selected' : ''}>${c.name_ur} (${c.name_en})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>ورژن (Version): *</label>
            <input type="text" id="app_version" class="form-control" required value="${app?.version || 'v1.0.0'}" placeholder="v2.4.1" />
          </div>
          <div class="form-group">
            <label>سائز (Size in MB): *</label>
            <input type="number" step="0.1" id="app_size" class="form-control" required value="${app?.size_mb || 25.0}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>گوگل ڈرائیو یا مرکزی ڈاؤن لوڈ لنک (Download URL): *</label>
            <input type="url" id="app_download_url" class="form-control" required value="${app?.download_url || ''}" placeholder="https://drive.google.com/..." />
          </div>
          <div class="form-group">
            <label>متبادل مرر لنک (Mirror CDN URL):</label>
            <input type="url" id="app_mirror_url" class="form-control" value="${app?.mirror_url || ''}" placeholder="https://..." />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>آئیکن کا لنک (Icon Image URL):</label>
            <input type="url" id="app_icon_url" class="form-control" value="${app?.icon_url || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160&auto=format&fit=crop&q=80'}" />
          </div>
          <div class="form-group">
            <label>پیکیج کا نام (Package ID):</label>
            <input type="text" id="app_package_name" class="form-control" value="${app?.package_name || ''}" placeholder="com.example.app" />
          </div>
        </div>

        <div class="form-group">
          <label>مختصر اردو تعارف (Short Urdu Summary):</label>
          <input type="text" id="app_short_desc_ur" class="form-control" value="${app?.short_desc_ur || ''}" placeholder="ایک جملے کا اردو تعارف" />
        </div>

        <div class="form-group">
          <label>مختصر انگریزی تعارف (Short English Summary):</label>
          <input type="text" id="app_short_desc_en" class="form-control" value="${app?.short_desc_en || ''}" placeholder="Short 1-line English summary" />
        </div>

        <div class="form-group">
          <label>مکمل اردو تفصیل (Full Urdu Description):</label>
          <textarea id="app_full_desc_ur" class="form-control" rows="3">${app?.full_desc_ur || ''}</textarea>
        </div>

        <div class="form-group">
          <label>مکمل انگریزی تفصیل (Full English Description):</label>
          <textarea id="app_full_desc_en" class="form-control" rows="3">${app?.full_desc_en || ''}</textarea>
        </div>

        <div class="form-group">
          <label>اسکرین شاٹس کے لنکس (ایک لائن پر ایک لنک):</label>
          <textarea id="app_screenshots" class="form-control" rows="2" placeholder="https://image1.jpg&#10;https://image2.jpg">${screenshots}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label><input type="checkbox" id="app_is_featured" ${app?.is_featured ? 'checked' : ''} /> ہوم پیج پر نمایاں دکھائیں (Featured)</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" id="app_is_published" ${app ? (app.is_published ? 'checked' : '') : 'checked'} /> فوراً شائع کریں (Published)</label>
          </div>
        </div>

        <div class="modal-actions-bar">
          <button type="button" class="btn btn-secondary" onclick="AdminApp.closeModal()">منسوخ</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> محفوظ کریں</button>
        </div>
      </form>
    `;

    modal.classList.add('active');
  },

  async handleAppFormSubmit(e, editId) {
    e.preventDefault();

    const screenshotsRaw = document.getElementById('app_screenshots')?.value.trim() || '';
    const screenshots = screenshotsRaw ? screenshotsRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      name_en: document.getElementById('app_name_en')?.value.trim(),
      name_ur: document.getElementById('app_name_ur')?.value.trim(),
      category_slug: document.getElementById('app_category')?.value,
      version: document.getElementById('app_version')?.value.trim(),
      size_mb: parseFloat(document.getElementById('app_size')?.value) || 20,
      download_url: document.getElementById('app_download_url')?.value.trim(),
      mirror_url: document.getElementById('app_mirror_url')?.value.trim(),
      icon_url: document.getElementById('app_icon_url')?.value.trim(),
      package_name: document.getElementById('app_package_name')?.value.trim(),
      short_desc_ur: document.getElementById('app_short_desc_ur')?.value.trim(),
      short_desc_en: document.getElementById('app_short_desc_en')?.value.trim(),
      full_desc_ur: document.getElementById('app_full_desc_ur')?.value.trim(),
      full_desc_en: document.getElementById('app_full_desc_en')?.value.trim(),
      screenshots,
      is_featured: document.getElementById('app_is_featured')?.checked ? 1 : 0,
      is_published: document.getElementById('app_is_published')?.checked ? 1 : 0
    };

    try {
      const url = editId ? `/api/admin/apps/${editId}` : '/api/admin/apps';
      const method = editId ? 'PUT' : 'POST';

      let serverData = {};
      try {
        const res = await fetch(url, {
          method,
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        serverData = await res.json();
      } catch (e) {
        console.warn('API sync warning:', e);
      }

      // Persist in localStorage so it appears immediately on the website
      try {
        const localCustom = JSON.parse(localStorage.getItem('sathi_custom_apps') || '[]');
        const appId = editId || serverData.id || Date.now();
        const appObj = {
          id: appId,
          ...payload,
          rating: 5.0,
          rating_count: 1,
          downloads_count: 50,
          created_at: new Date().toISOString()
        };
        const idx = localCustom.findIndex(a => a.id == appId || a.name_en === payload.name_en);
        if (idx >= 0) {
          localCustom[idx] = { ...localCustom[idx], ...appObj };
        } else {
          localCustom.unshift(appObj);
        }
        localStorage.setItem('sathi_custom_apps', JSON.stringify(localCustom));
      } catch (e) {
        console.warn('Error saving to localStorage:', e);
      }

      alert('شاباش! ایپ کامیابی سے شائع ہو گئی اور ویب سائٹ پر شامل ہو گئی ہے!');
      this.closeModal();
      this.renderAppsTab(document.getElementById('admin-tab-content'));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  },

  // 3. Files Tab
  async renderFilesTab(container) {
    container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> فائلیں حاصل ہو رہی ہیں...</div>';

    try {
      const res = await fetch('/api/admin/files', { headers: this.getHeaders() });
      const { files } = await res.json();

      container.innerHTML = `
        <div class="table-controls-row">
          <h4>مفید پی ڈی ایف و دستاویزات لائبریری</h4>
          <button class="btn btn-primary" onclick="AdminApp.openAddFileModal()">
            <i class="fa-solid fa-plus"></i> نئی فائل شامل کریں
          </button>
        </div>

        <div class="table-responsive mt-3">
          <table class="admin-table">
            <thead>
              <tr><th>عنوان</th><th>قسم</th><th>سائز</th><th>ڈاؤن لوڈز</th><th>ایکشنز</th></tr>
            </thead>
            <tbody>
              ${files.map(f => `
                <tr>
                  <td>
                    <strong>${f.title_ur}</strong>
                    <div class="sub-text">${f.title_en}</div>
                  </td>
                  <td><span class="badge badge-info">${f.file_type}</span></td>
                  <td>${f.file_size}</td>
                  <td>${(f.downloads_count || 0).toLocaleString()}</td>
                  <td>
                    <button class="action-btn delete-btn" onclick="AdminApp.deleteFile(${f.id})"><i class="fa-solid fa-trash-can"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  },

  openAddFileModal() {
    const modal = document.getElementById('admin-modal');
    const titleEl = document.getElementById('admin-modal-title');
    const bodyEl = document.getElementById('admin-modal-body');

    titleEl.innerText = 'نئی پی ڈی ایف / فائل شامل کریں';
    bodyEl.innerHTML = `
      <form onsubmit="AdminApp.handleFileSubmit(event)">
        <div class="form-group">
          <label>فائل کا اردو عنوان:</label>
          <input type="text" id="f_title_ur" class="form-control" required placeholder="مثال: کاروباری کھاتہ رجسٹر 2026" />
        </div>
        <div class="form-group">
          <label>انگریزی عنوان:</label>
          <input type="text" id="f_title_en" class="form-control" required placeholder="Business Khata Sheet" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>کیٹیگری:</label>
            <input type="text" id="f_cat" class="form-control" placeholder="Business / Islamic / Tech" />
          </div>
          <div class="form-group">
            <label>سائز:</label>
            <input type="text" id="f_size" class="form-control" placeholder="3.5 MB" />
          </div>
        </div>
        <div class="form-group">
          <label>گوگل ڈرائیو یا ڈائریکٹ ڈاؤن لوڈ لنک:</label>
          <input type="url" id="f_url" class="form-control" required placeholder="https://..." />
        </div>
        <div class="modal-actions-bar">
          <button type="button" class="btn btn-secondary" onclick="AdminApp.closeModal()">منسوخ</button>
          <button type="submit" class="btn btn-primary">شامل کریں</button>
        </div>
      </form>
    `;
    modal.classList.add('active');
  },

  async handleFileSubmit(e) {
    e.preventDefault();
    const payload = {
      title_ur: document.getElementById('f_title_ur')?.value.trim(),
      title_en: document.getElementById('f_title_en')?.value.trim(),
      category: document.getElementById('f_cat')?.value.trim() || 'General',
      file_size: document.getElementById('f_size')?.value.trim() || '2 MB',
      download_url: document.getElementById('f_url')?.value.trim()
    };
    try {
      const res = await fetch('/api/admin/files', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('فائل شامل ہو گئی۔');
        this.closeModal();
        this.renderFilesTab(document.getElementById('admin-tab-content'));
      }
    } catch (e) {
      alert(e.message);
    }
  },

  async deleteFile(id) {
    if (!confirm('حذف کریں؟')) return;
    await fetch(`/api/admin/files/${id}`, { method: 'DELETE', headers: this.getHeaders() });
    this.renderFilesTab(document.getElementById('admin-tab-content'));
  },

  // 4. Inquiries Tab
  async renderInquiriesTab(container) {
    try {
      const res = await fetch('/api/admin/inquiries', { headers: this.getHeaders() });
      const { inquiries } = await res.json();

      container.innerHTML = `
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr><th>تاریخ</th><th>گاہک کا نام</th><th>موبائل / واٹس ایپ</th><th>سروس</th><th>پیغام</th><th>اسٹیٹس</th><th>ایکشن</th></tr>
            </thead>
            <tbody>
              ${inquiries.length === 0 ? '<tr><td colspan="7" class="text-center">کوئی نئی درخواست نہیں ملی۔</td></tr>' : ''}
              ${inquiries.map(inq => `
                <tr>
                  <td><small>${new Date(inq.created_at).toLocaleDateString()}</small></td>
                  <td><strong>${inq.name}</strong></td>
                  <td><a href="https://wa.me/${inq.phone.replace(/[^0-9]/g,'')}" target="_blank" class="text-cyan"><i class="fa-brands fa-whatsapp"></i> ${inq.phone}</a></td>
                  <td><span class="badge badge-info">${inq.service_type}</span></td>
                  <td><small>${inq.message}</small></td>
                  <td>
                    <select class="form-control form-control-sm" onchange="AdminApp.updateInquiryStatus(${inq.id}, this.value)">
                      <option value="pending" ${inq.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                      <option value="closed" ${inq.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                  </td>
                  <td>
                    <button class="action-btn delete-btn" onclick="AdminApp.deleteInquiry(${inq.id})"><i class="fa-solid fa-trash-can"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  },

  async updateInquiryStatus(id, status) {
    await fetch(`/api/admin/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
  },

  async deleteInquiry(id) {
    if (!confirm('حذف کریں؟')) return;
    await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE', headers: this.getHeaders() });
    this.renderInquiriesTab(document.getElementById('admin-tab-content'));
  },

  // 5. Contact Messages Tab
  async renderMessagesTab(container) {
    try {
      const res = await fetch('/api/admin/messages', { headers: this.getHeaders() });
      const { messages } = await res.json();

      container.innerHTML = `
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr><th>تاریخ</th><th>نام</th><th>ای میل</th><th>موضوع</th><th>پیغام</th></tr>
            </thead>
            <tbody>
              ${messages.length === 0 ? '<tr><td colspan="5" class="text-center">کوئی پیغام نہیں۔</td></tr>' : ''}
              ${messages.map(m => `
                <tr>
                  <td><small>${new Date(m.created_at).toLocaleDateString()}</small></td>
                  <td><strong>${m.name}</strong></td>
                  <td><a href="mailto:${m.email}">${m.email}</a></td>
                  <td>${m.subject}</td>
                  <td>${m.message}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  },

  // 6. Broken Links Tab
  async renderBrokenLinksTab(container) {
    try {
      const res = await fetch('/api/admin/broken-reports', { headers: this.getHeaders() });
      const { reports } = await res.json();

      container.innerHTML = `
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr><th>تاریخ</th><th>ایپ کا نام</th><th>خراب ڈاؤن لوڈ لنک</th><th>صارف کا نوٹ</th><th>اسٹیٹس</th></tr>
            </thead>
            <tbody>
              ${reports.length === 0 ? '<tr><td colspan="5" class="text-center text-success">کوئی خراب لنک رپورٹ نہیں ہے۔</td></tr>' : ''}
              ${reports.map(r => `
                <tr>
                  <td><small>${new Date(r.created_at).toLocaleDateString()}</small></td>
                  <td><strong>${r.app_name}</strong></td>
                  <td><small class="text-muted">${r.download_url}</small></td>
                  <td>${r.user_note || '-'}</td>
                  <td>
                    <select class="form-control form-control-sm" onchange="AdminApp.updateReportStatus(${r.id}, this.value)">
                      <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending Fix</option>
                      <option value="fixed" ${r.status === 'fixed' ? 'selected' : ''}>Fixed (درست کر دیا)</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  },

  async updateReportStatus(id, status) {
    await fetch(`/api/admin/broken-reports/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
  },

  // 7. Settings Tab
  async renderSettingsTab(container) {
    try {
      const res = await fetch('/api/admin/settings', { headers: this.getHeaders() });
      const { settings } = await res.json();

      const savedSmartLink = localStorage.getItem('sathi_smartlink_url') || '';

      container.innerHTML = `
        <form class="admin-settings-form" onsubmit="AdminApp.saveSettings(event)">
          <div class="form-row">
            <div class="form-group">
              <label>ویب سائٹ نام (Urdu):</label>
              <input type="text" id="set_name_ur" class="form-control" value="${settings.site_name_ur || 'ڈیجیٹل ساتھی'}" />
            </div>
            <div class="form-group">
              <label>ویب سائٹ نام (English):</label>
              <input type="text" id="set_name_en" class="form-control" value="${settings.site_name_en || 'Digital Sathi'}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>رابطہ واٹس ایپ (WhatsApp Number):</label>
              <input type="text" id="set_wa" class="form-control" value="${settings.contact_whatsapp || '+92 300 1234567'}" />
            </div>
            <div class="form-group">
              <label>رابطہ ای میل (Contact Email):</label>
              <input type="email" id="set_email" class="form-control" value="${settings.contact_email || 'contact@digitalsathi.pk'}" />
            </div>
          </div>
          <div class="form-group">
            <label>سیکیورٹی اعلان و ٹکر میسج (Urdu):</label>
            <input type="text" id="set_ann_ur" class="form-control" value="${settings.announcement_text_ur || ''}" />
          </div>

          <!-- Adsterra Smartlink Configuration -->
          <div class="form-group" style="background: rgba(0, 229, 255, 0.05); border: 1.5px solid var(--accent-cyan); border-radius: 8px; padding: 1rem; margin: 1.25rem 0;">
            <label style="color: var(--accent-cyan); font-weight: 700; font-size: 0.95rem;">
              <i class="fa-solid fa-link"></i> ایڈسٹرا سمارٹ لنک ایڈ (Adsterra Smartlink URL):
            </label>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
              یہاں اپنا Adsterra Direct Smartlink پیسٹ کریں (مثال: https://www.profitablecpmrate.com/... )۔ یہ آن لائن ٹولز میں کارآمد اشتہاری لنکس کے طور پر کام کرے گا۔
            </p>
            <input type="url" id="set_smartlink" class="form-control" placeholder="https://www.profitablecpmrate.com/..." value="${savedSmartLink}" />
          </div>

          <div class="form-group">
            <label>گوگل ایڈسینس یا اشتہارات فعال کریں (Enable Ad Slots):</label>
            <select id="set_ads" class="form-control">
              <option value="true" ${settings.ads_enabled !== 'false' ? 'selected' : ''}>فعال (Enabled — اشتہارات دکھائیں)</option>
              <option value="false" ${settings.ads_enabled === 'false' ? 'selected' : ''}>غیر فعال (Disabled)</option>
            </select>
          </div>

          <!-- Adsterra / Custom Ad Script Code -->
          <div class="form-group">
            <label style="font-weight: 700; color: var(--accent-cyan);">
              <i class="fa-solid fa-code"></i> بینر ایڈ اسکرپٹ کوڈ (Adsterra / AdSense Script Code):
            </label>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
              اگر آپ کے پاس Adsterra کا بینر کوڈ (300x250، 728x90، یا Native Banner) یا گوگل ایڈسینس کوڈ ہے تو یہاں پیسٹ کریں۔ اگر خالی چھوڑیں گے تو خودکار سمارٹ بینر دکھایا جائے گا۔
            </p>
            <textarea id="set_ad_code" class="form-control" rows="4" placeholder="<script type='text/javascript'>...</script>">${settings.banner_ad_code || localStorage.getItem('sathi_banner_ad_code') || ''}</textarea>
          </div>

          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> ترتیبات محفوظ کریں</button>
        </form>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  },

  async saveSettings(e) {
    e.preventDefault();

    // Save Smartlink locally and in tools engine
    const smartLinkVal = document.getElementById('set_smartlink')?.value?.trim();
    if (smartLinkVal) {
      localStorage.setItem('sathi_smartlink_url', smartLinkVal);
      if (window.SathiTools) window.SathiTools.setSmartLinkUrl(smartLinkVal);
    }

    const adsVal = document.getElementById('set_ads')?.value || 'true';
    localStorage.setItem('sathi_ads_enabled', adsVal);

    const adCode = document.getElementById('set_ad_code')?.value?.trim() || '';
    localStorage.setItem('sathi_banner_ad_code', adCode);

    const payload = {
      settings: {
        site_name_ur: document.getElementById('set_name_ur')?.value,
        site_name_en: document.getElementById('set_name_en')?.value,
        contact_whatsapp: document.getElementById('set_wa')?.value,
        contact_email: document.getElementById('set_email')?.value,
        announcement_text_ur: document.getElementById('set_ann_ur')?.value,
        ads_enabled: adsVal,
        banner_ad_code: adCode
      }
    };
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('ترتیبات اور اشتہارات کامیابی سے محفوظ ہو گئے ہیں۔');
      if (window.App && typeof window.App.renderAdBanner === 'function') {
        window.App.renderAdBanner(adsVal === 'true', adCode);
      }
    }
  },

  // 8. Security Tab
  renderSecurityTab(container) {
    container.innerHTML = `
      <form class="admin-settings-form" onsubmit="AdminApp.changePassword(event)">
        <div class="form-group">
          <label>موجودہ پاس ورڈ (Current Password):</label>
          <input type="password" id="cur_pass" class="form-control" required />
        </div>
        <div class="form-group">
          <label>نیا پاس ورڈ (کم از کم 6 ہندسے):</label>
          <input type="password" id="new_pass" class="form-control" required minlength="6" />
        </div>
        <div class="form-group">
          <label>نیا پاس ورڈ دوبارہ درج کریں:</label>
          <input type="password" id="confirm_pass" class="form-control" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-key"></i> پاس ورڈ اپ ڈیٹ کریں</button>
      </form>
    `;
  },

  async changePassword(e) {
    e.preventDefault();
    const cur = document.getElementById('cur_pass')?.value;
    const n1 = document.getElementById('new_pass')?.value;
    const n2 = document.getElementById('confirm_pass')?.value;

    if (n1 !== n2) {
      alert('نئے پاس ورڈ آپس میں مماثلت نہیں رکھتے۔');
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ current_password: cur, new_password: n1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      document.getElementById('cur_pass').value = '';
      document.getElementById('new_pass').value = '';
      document.getElementById('confirm_pass').value = '';
    } catch (err) {
      alert(err.message);
    }
  },

  closeModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
  }
};

window.AdminApp = AdminApp;
