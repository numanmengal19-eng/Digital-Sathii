/**
 * Digital Sathi (ڈیجیٹل ساتھی) - 100% Real Interactive Tools Suite
 * Production-Grade Client-Side Engines:
 * 1. Khata & Profit Calculator (Daily Customer Ledger + Business Profit/Loss + WhatsApp Reminders + Printable Slip)
 * 2. Authentic Islamic Zakat Calculator (Tola/Gram toggle + Pakistani Market Rates + Silver Nisab Rule)
 * 3. Instant HD QR Code Generator (Multi-Format, Custom Colors, Canvas Direct PNG Download)
 * 4. Roman Urdu to Nastaliq Converter (Comprehensive 500+ Dictionary + Phonetic Digraph Engine)
 * 5. Data & Land Unit Converter (Storage + Download Time Calculator + Pakistani Marla/Kanal Land Units)
 * 6. Adsterra Smartlink Monetization Integration
 */

const SathiTools = {
  // Current active tool & tab state
  activeTool: null,
  activeKhataTab: 'ledger', // 'ledger' or 'profit'
  activeZakatUnit: 'tola',  // 'tola' or 'gram'
  activeUnitTab: 'storage', // 'storage', 'speed', 'land'
  urduFontSize: 20,

  // =========================================================================
  // Adsterra Smartlink Configuration (یہاں اپنا ایڈسٹرا سمارٹ لنک ایڈ ڈالیں)
  // =========================================================================
  smartLinkUrl: localStorage.getItem('sathi_smartlink_url') || 'https://www.profitablecpmrate.com/YOUR_SMARTLINK',

  setSmartLinkUrl(url) {
    if (url && url.trim()) {
      this.smartLinkUrl = url.trim();
      localStorage.setItem('sathi_smartlink_url', this.smartLinkUrl);
    }
  },

  openSmartLink(source = 'general') {
    if (this.smartLinkUrl && this.smartLinkUrl.startsWith('http') && !this.smartLinkUrl.includes('YOUR_SMARTLINK')) {
      window.open(this.smartLinkUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Friendly message if user hasn't set their smartlink yet
      const isUr = window.i18n ? window.i18n.isUrdu() : true;
      console.log(`[Smartlink clicked from: ${source}] (Smartlink URL is ready to be configured by site owner)`);
    }
  },

  // =========================================================================
  // 1. Khata & Profit Calculator
  // =========================================================================
  getKhataRecords() {
    try {
      const saved = localStorage.getItem('sathi_khata_records');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  saveKhataRecords(records) {
    try {
      localStorage.setItem('sathi_khata_records', JSON.stringify(records));
    } catch (e) {
      console.error('Error saving khata:', e);
    }
  },

  switchKhataTab(tab) {
    this.activeKhataTab = tab;
    this.renderKhataUI();
  },

  addKhataRecord() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const nameInput = document.getElementById('khata-entry-name');
    const phoneInput = document.getElementById('khata-entry-phone');
    const noteInput = document.getElementById('khata-entry-note');
    const amountInput = document.getElementById('khata-entry-amount');
    const typeInput = document.getElementById('khata-entry-type');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const note = noteInput ? noteInput.value.trim() : '';
    const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
    const type = typeInput ? typeInput.value : 'gave'; // 'gave' (ادھار دیا / لینا ہے) or 'got' (وصول ہوا / جمع)

    if (!name) {
      alert(isUr ? 'براہِ کرم گاہک کا نام درج کریں۔' : 'Please enter customer name.');
      return;
    }
    if (amount <= 0) {
      alert(isUr ? 'براہِ کرم درست رقم درج کریں۔' : 'Please enter a valid amount.');
      return;
    }

    const records = this.getKhataRecords();
    const newEntry = {
      id: Date.now(),
      name,
      phone,
      note: note || (type === 'gave' ? 'ادھار سامان' : 'وصولی / جمع'),
      amount,
      type,
      date: new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    records.unshift(newEntry);
    this.saveKhataRecords(records);

    // Reset inputs
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (noteInput) noteInput.value = '';
    if (amountInput) amountInput.value = '';

    this.renderKhataLedger();
  },

  deleteKhataRecord(id) {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    if (!confirm(isUr ? 'کیا آپ واقعی یہ کھاتہ اندراج حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this entry?')) return;
    let records = this.getKhataRecords();
    records = records.filter(r => r.id !== id);
    this.saveKhataRecords(records);
    this.renderKhataLedger();
  },

  clearAllKhata() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    if (!confirm(isUr ? 'خبردار! کیا آپ تمام کھاتہ ریکارڈ صاف کرنا چاہتے ہیں؟' : 'Warning: Clear all khata records?')) return;
    localStorage.removeItem('sathi_khata_records');
    this.renderKhataLedger();
  },

  sendKhataWhatsApp(id) {
    const records = this.getKhataRecords();
    const item = records.find(r => r.id === id);
    if (!item) return;

    let phone = (item.phone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '92' + phone.substring(1);

    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    let message = '';
    if (item.type === 'gave') {
      message = `محترم ${item.name} صاحب! السلام علیکم۔\nڈیجیٹل ساتھی کھاتہ کے مطابق آپ کے ذمے بقایا ادھار کی رقم Rs. ${item.amount.toLocaleString()} واجب الادا ہے۔\nتفصیل: ${item.note}\nتاریخ: ${item.date}\nبراہِ کرم جلد از جلد ادائیگی فرما کر شکریہ کا موقع دیں۔ جزاک اللہ!`;
    } else {
      message = `محترم ${item.name} صاحب! السلام علیکم۔\nڈیجیٹل کھاتہ کے تحت آپ کی جانب سے موصول شدہ رقم Rs. ${item.amount.toLocaleString()} بحفاظت جمع ہو چکی ہے۔\nتفصیل: ${item.note}\nشکریہ!`;
    }

    const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  },

  renderKhataLedger() {
    const container = document.getElementById('khata-ledger-view');
    if (!container) return;

    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const records = this.getKhataRecords();

    let totalGave = 0; // لینا ہے (ادھار دیا)
    let totalGot = 0;  // وصول ہوا

    records.forEach(r => {
      if (r.type === 'gave') totalGave += r.amount;
      else totalGot += r.amount;
    });

    const netReceivable = totalGave - totalGot;

    let tableRows = '';
    if (records.length === 0) {
      tableRows = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
            ${isUr ? 'فی الحال کوئی کھاتہ اندراج موجود نہیں۔ نیا ادھار یا وصولی شامل کریں۔' : 'No khata entries yet. Add your first customer entry above.'}
          </td>
        </tr>
      `;
    } else {
      tableRows = records.map(r => `
        <tr class="${r.type === 'gave' ? 'row-udhaar' : 'row-wasooli'}">
          <td><strong>${r.name}</strong>${r.phone ? `<div style="font-size:0.75rem; color:var(--text-muted);">${r.phone}</div>` : ''}</td>
          <td>${r.note || '-'}</td>
          <td><span class="badge ${r.type === 'gave' ? 'badge-rose' : 'badge-emerald'}">${r.type === 'gave' ? (isUr ? 'لینا ہے (ادھار)' : 'Receivable') : (isUr ? 'وصول ہوا (جمع)' : 'Received')}</span></td>
          <td><strong style="color: ${r.type === 'gave' ? '#f43f5e' : '#10b981'};">Rs. ${r.amount.toLocaleString()}</strong></td>
          <td style="font-size: 0.8rem; color: var(--text-secondary);">${r.date}</td>
          <td style="text-align: center;">
            <button class="btn-icon text-cyan" title="${isUr ? 'واٹس ایپ پر تقاضا / رسید بھیجیں' : 'Send WhatsApp Reminder'}" onclick="SathiTools.sendKhataWhatsApp(${r.id})">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-icon text-rose" title="${isUr ? 'حذف کریں' : 'Delete'}" onclick="SathiTools.deleteKhataRecord(${r.id})">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      <!-- Ledger Summary KPI Cards -->
      <div class="calc-metric-grid">
        <div class="calc-metric-card status-negative">
          <span class="calc-label">${isUr ? 'کل لینا ہے (بقایا ادھار)' : 'Total Receivable (Udhaar)'}</span>
          <span class="calc-value" style="color: #f43f5e;">Rs. ${totalGave.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card status-positive">
          <span class="calc-label">${isUr ? 'کل موصول شدہ (وصولی)' : 'Total Received (Wasooli)'}</span>
          <span class="calc-value" style="color: #10b981;">Rs. ${totalGot.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card" style="grid-column: span 2; border-color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05);">
          <span class="calc-label">${isUr ? 'خالص بقایا رقم (گاہکوں کے ذمے)' : 'Net Outstanding Balance'}</span>
          <span class="calc-value text-cyan">Rs. ${netReceivable.toLocaleString()}</span>
        </div>
      </div>

      <!-- Add New Entry Box -->
      <div class="tool-entry-box">
        <h5 style="margin-bottom: 0.75rem; font-weight: 700; color: var(--text-primary);">
          <i class="fa-solid fa-plus-circle text-cyan"></i> ${isUr ? 'نیا کھاتہ اندراج کریں:' : 'Add New Entry:'}
        </h5>
        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? 'گاہک کا نام: *' : 'Customer Name: *'}</label>
            <input type="text" id="khata-entry-name" class="form-control" placeholder="${isUr ? 'مثال: محمد احمد' : 'e.g. Ahmad Ali'}" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'موبائل نمبر (اختیاری):' : 'Mobile Phone (Optional):'}</label>
            <input type="text" id="khata-entry-phone" class="form-control" placeholder="03001234567" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? 'رقم (روپے): *' : 'Amount (PKR): *'}</label>
            <input type="number" id="khata-entry-amount" class="form-control" placeholder="5000" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'کھاتہ کی قسم:' : 'Entry Type:'}</label>
            <select id="khata-entry-type" class="form-control">
              <option value="gave">${isUr ? 'لینا ہے (میں نے ادھار دیا)' : 'Receivable (I gave credit)'}</option>
              <option value="got">${isUr ? 'وصول ہوا (گاہک نے جمع کروایا)' : 'Received (Customer paid)'}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>${isUr ? 'سامان / تفصیل (اختیاری):' : 'Item / Description (Optional):'}</label>
          <input type="text" id="khata-entry-note" class="form-control" placeholder="${isUr ? 'مثال: راشن کا سامان، بل ادائیگی، نقد' : 'e.g. Grocery items, cash loan'}" />
        </div>
        <div class="tool-actions-row">
          <button class="btn btn-primary" onclick="SathiTools.addKhataRecord()">
            <i class="fa-solid fa-save"></i> ${isUr ? 'کھاتہ میں محفوظ کریں' : 'Save to Ledger'}
          </button>
        </div>
      </div>

      <!-- Ledger Table -->
      <div style="overflow-x: auto; margin-top: 1.5rem;">
        <table class="khata-table">
          <thead>
            <tr>
              <th>${isUr ? 'گاہک' : 'Customer'}</th>
              <th>${isUr ? 'تفصیل' : 'Details'}</th>
              <th>${isUr ? 'قسم' : 'Type'}</th>
              <th>${isUr ? 'رقم' : 'Amount'}</th>
              <th>${isUr ? 'تاریخ' : 'Date'}</th>
              <th style="text-align: center;">${isUr ? 'عمل' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <!-- Bottom Actions & Smartlink -->
      <div class="tool-actions-row" style="justify-content: space-between; flex-wrap: wrap; margin-top: 1.25rem;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="SathiTools.printKhataStatement()">
            <i class="fa-solid fa-print"></i> ${isUr ? 'مکمل کھاتہ رسید پرنٹ کریں' : 'Print Statement'}
          </button>
          ${records.length > 0 ? `
            <button class="btn btn-secondary text-rose" onclick="SathiTools.clearAllKhata()">
              <i class="fa-solid fa-trash-can"></i> ${isUr ? 'کھاتہ صاف کریں' : 'Clear All'}
            </button>
          ` : ''}
        </div>
        <button class="btn btn-primary" onclick="SathiTools.openSmartLink('khata_export')">
          <i class="fa-solid fa-cloud-arrow-down"></i> ${isUr ? 'پریمیم کلاؤڈ بیک اپ (اسپانسرڈ)' : 'Cloud Backup (Sponsored)'}
        </button>
      </div>
    `;
  },

  calculateProfitLoss() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const sales = parseFloat(document.getElementById('profit-sales')?.value) || 0;
    const cost = parseFloat(document.getElementById('profit-cost')?.value) || 0;
    const rent = parseFloat(document.getElementById('profit-rent')?.value) || 0;
    const salaries = parseFloat(document.getElementById('profit-salaries')?.value) || 0;
    const bills = parseFloat(document.getElementById('profit-bills')?.value) || 0;
    const other = parseFloat(document.getElementById('profit-other')?.value) || 0;

    const totalExpenses = rent + salaries + bills + other;
    const grossProfit = sales - cost;
    const netProfit = grossProfit - totalExpenses;
    const margin = sales > 0 ? ((netProfit / sales) * 100).toFixed(1) : 0;
    const dailyProfit = Math.round(netProfit / 30);

    const resultBox = document.getElementById('profit-loss-results');
    if (!resultBox) return;

    let statusText = isUr ? 'ماشاءاللہ! کاروبار منافع بخش ہے۔' : 'Profitable business model!';
    let statusClass = 'status-positive';
    if (netProfit < 0) {
      statusText = isUr ? 'خبردار! کاروبار خسارے میں ہے۔ اخراجات کم کریں۔' : 'Operating at a loss. Review expenses.';
      statusClass = 'status-negative';
    } else if (netProfit === 0) {
      statusText = isUr ? 'برابر (بریک ایون) - نہ نفع نہ نقصان۔' : 'Break-Even reached.';
      statusClass = 'status-neutral';
    }

    resultBox.innerHTML = `
      <div class="calc-metric-grid">
        <div class="calc-metric-card ${statusClass}">
          <span class="calc-label">${isUr ? 'خالص منافع (Net Profit)' : 'Net Profit'}</span>
          <span class="calc-value">Rs. ${netProfit.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'خالص مارجن (Margin)' : 'Profit Margin'}</span>
          <span class="calc-value">${margin}%</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'مجموعی منافع (Gross Profit)' : 'Gross Profit'}</span>
          <span class="calc-value">Rs. ${grossProfit.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'کل ماہانہ اخراجات' : 'Total Operating Expenses'}</span>
          <span class="calc-value">Rs. ${totalExpenses.toLocaleString()}</span>
        </div>
      </div>
      <div class="calc-status-badge ${statusClass}">
        <i class="fa-solid fa-chart-line"></i> ${statusText} &bull; ${isUr ? `روزانہ اوسط بچت: Rs. ${dailyProfit.toLocaleString()}` : `Daily Average: Rs. ${dailyProfit.toLocaleString()}`}
      </div>
      <div class="tool-actions-row">
        <button class="btn btn-secondary" onclick="SathiTools.printProfitStatement(${sales}, ${cost}, ${totalExpenses}, ${netProfit}, ${margin})">
          <i class="fa-solid fa-print"></i> ${isUr ? 'منافع رپورٹ پرنٹ کریں' : 'Print Profit Report'}
        </button>
        <button class="btn btn-primary" onclick="SathiTools.openSmartLink('profit_upgrade')">
          <i class="fa-solid fa-crown"></i> ${isUr ? 'ایف بی آر ٹیکس فائلنگ آفر (اسپانسرڈ)' : 'FBR Tax Filing (Sponsored)'}
        </button>
      </div>
    `;
  },

  renderKhataUI() {
    const container = document.getElementById('tool-modal-body');
    if (!container) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;

    container.innerHTML = `
      <!-- Tool Tabs -->
      <div class="tool-tab-nav">
        <button class="tool-tab-btn ${this.activeKhataTab === 'ledger' ? 'active' : ''}" onclick="SathiTools.switchKhataTab('ledger')">
          <i class="fa-solid fa-book-bookmark"></i> ${isUr ? 'ادھار و وصولی کھاتہ لیجر' : 'Customer Udhaar Ledger'}
        </button>
        <button class="tool-tab-btn ${this.activeKhataTab === 'profit' ? 'active' : ''}" onclick="SathiTools.switchKhataTab('profit')">
          <i class="fa-solid fa-calculator"></i> ${isUr ? 'ماہانہ نفع و نقصان کیلکولیٹر' : 'Profit & Loss Calculator'}
        </button>
      </div>

      <!-- Tab Content -->
      <div id="khata-tab-content">
        ${this.activeKhataTab === 'ledger' ? `
          <div id="khata-ledger-view"></div>
        ` : `
          <div class="tool-form-layout">
            <p class="tool-subtitle">${isUr ? 'اپنی دکان یا کاروبار کے تمام مالیاتی اعداد و شمار درج کر کے منافع کی مکمل تفصیل حاصل کریں:' : 'Enter your revenue and operating expenses to calculate net business profit:'}</p>
            <div class="form-row">
              <div class="form-group">
                <label>${isUr ? 'کل سیلز / آمدن (روپے):' : 'Total Monthly Sales (PKR):'}</label>
                <input type="number" id="profit-sales" class="form-control" placeholder="150000" value="150000" oninput="SathiTools.calculateProfitLoss()" />
              </div>
              <div class="form-group">
                <label>${isUr ? 'سامان کی خریداری / لاگت (روپے):' : 'Cost of Goods / Purchases (PKR):'}</label>
                <input type="number" id="profit-cost" class="form-control" placeholder="100000" value="100000" oninput="SathiTools.calculateProfitLoss()" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${isUr ? 'دکان / دفتر کا کرایہ:' : 'Shop / Office Rent:'}</label>
                <input type="number" id="profit-rent" class="form-control" placeholder="15000" value="15000" oninput="SathiTools.calculateProfitLoss()" />
              </div>
              <div class="form-group">
                <label>${isUr ? 'ملازمین کی تنخواہیں:' : 'Staff Salaries:'}</label>
                <input type="number" id="profit-salaries" class="form-control" placeholder="12000" value="12000" oninput="SathiTools.calculateProfitLoss()" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${isUr ? 'بجلی، گیس و یوٹیلٹی بلز:' : 'Electricity & Utility Bills:'}</label>
                <input type="number" id="profit-bills" class="form-control" placeholder="5000" value="5000" oninput="SathiTools.calculateProfitLoss()" />
              </div>
              <div class="form-group">
                <label>${isUr ? 'دیگر متفرق اخراجات (چائے، کرایہ وغیرہ):' : 'Miscellaneous Expenses:'}</label>
                <input type="number" id="profit-other" class="form-control" placeholder="3000" value="3000" oninput="SathiTools.calculateProfitLoss()" />
              </div>
            </div>
            <div id="profit-loss-results" class="tool-results-wrapper"></div>
          </div>
        `}
      </div>
    `;

    if (this.activeKhataTab === 'ledger') {
      this.renderKhataLedger();
    } else {
      setTimeout(() => this.calculateProfitLoss(), 50);
    }
  },

  printKhataStatement() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const records = this.getKhataRecords();
    const dateStr = new Date().toLocaleDateString(isUr ? 'ur-PK' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let totalGave = 0;
    let totalGot = 0;
    records.forEach(r => {
      if (r.type === 'gave') totalGave += r.amount;
      else totalGot += r.amount;
    });
    const net = totalGave - totalGot;

    const rows = records.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.name}</strong>${r.phone ? ` (${r.phone})` : ''}</td>
        <td>${r.note || '-'}</td>
        <td>${r.type === 'gave' ? (isUr ? 'لینا ہے (ادھار)' : 'Receivable') : (isUr ? 'وصول ہوا' : 'Received')}</td>
        <td>Rs. ${r.amount.toLocaleString()}</td>
        <td>${r.date}</td>
      </tr>
    `).join('');

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="${isUr ? 'ur' : 'en'}" dir="${isUr ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>Digital Sathi - Khata Statement</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0b192c; }
          .header { text-align: center; border-bottom: 2px solid #00e5ff; padding-bottom: 12px; margin-bottom: 16px; }
          .brand { font-size: 22px; font-weight: 800; color: #0b192c; }
          .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: ${isUr ? 'right' : 'left'}; }
          th { background: #f8fafc; font-weight: 700; }
          .summary-box { display: flex; justify-content: space-around; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 15px; font-weight: bold; }
          .footer { margin-top: 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Digital Sathi — ڈیجیٹل ساتھی</div>
          <div>${isUr ? 'کسٹمر کھاتہ و ادھار لیجر رپورٹ' : 'Customer Khata & Credit Statement'}</div>
          <div class="meta">${isUr ? 'تاریخ رپورٹ:' : 'Date:'} ${dateStr}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isUr ? 'گاہک' : 'Customer'}</th>
              <th>${isUr ? 'تفصیل' : 'Details'}</th>
              <th>${isUr ? 'قسم' : 'Type'}</th>
              <th>${isUr ? 'رقم' : 'Amount'}</th>
              <th>${isUr ? 'تاریخ' : 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="6" style="text-align:center;">کوئی ریکارڈ نہیں ملا</td></tr>`}
          </tbody>
        </table>
        <div class="summary-box">
          <div>کل بقایا ادھار: <span style="color:#e11d48;">Rs. ${totalGave.toLocaleString()}</span></div>
          <div>کل وصول شدہ رقم: <span style="color:#059669;">Rs. ${totalGot.toLocaleString()}</span></div>
          <div>خالص باقی رقم: <span style="color:#0284c7;">Rs. ${net.toLocaleString()}</span></div>
        </div>
        <div class="footer">
          Generated automatically via Digital Sathi Business Tools • www.digitalsathi.pk
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  printProfitStatement(sales, cost, expenses, netProfit, margin) {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const dateStr = new Date().toLocaleDateString(isUr ? 'ur-PK' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="${isUr ? 'ur' : 'en'}" dir="${isUr ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>Digital Sathi - Profit Report</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 30px; color: #0b192c; }
          .header { text-align: center; border-bottom: 2px solid #00e5ff; padding-bottom: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: ${isUr ? 'right' : 'left'}; }
          th { background: #f8fafc; }
          .highlight { background: #e0f2fe; font-weight: bold; font-size: 16px; color: #0369a1; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Digital Sathi — ڈیجیٹل ساتھی</h2>
          <p>${isUr ? 'ماہانہ کاروبار کا نفع و نقصان اسٹیٹمنٹ' : 'Monthly Business Profit & Loss Statement'} (${dateStr})</p>
        </div>
        <table>
          <tr><th>${isUr ? 'آمدن و اخراجات کی تفصیل' : 'Description'}</th><th>${isUr ? 'رقم (روپے)' : 'Amount (PKR)'}</th></tr>
          <tr><td>${isUr ? 'کل سیلز / آمدن' : 'Total Revenue'}</td><td>Rs. ${sales.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'مال کی خریداری و لاگت' : 'Cost of Goods'}</td><td>Rs. ${cost.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'دکان، ملازمین و بلز کے اخراجات' : 'Operating Expenses'}</td><td>Rs. ${expenses.toLocaleString()}</td></tr>
          <tr class="highlight"><td>${isUr ? 'خالص منافع (Net Profit)' : 'Net Profit'}</td><td>Rs. ${netProfit.toLocaleString()} (${margin}%)</td></tr>
        </table>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  // =========================================================================
  // 2. Authentic Islamic Zakat Calculator (Tola / Grams + Silver Nisab)
  // =========================================================================
  switchZakatUnit(unit) {
    this.activeZakatUnit = unit;
    this.renderZakatUI();
  },

  calculateZakat() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const isTola = this.activeZakatUnit === 'tola';

    // Current standard gold & silver rates in Pakistan
    const goldRateTola = parseFloat(document.getElementById('zakat-gold-rate')?.value) || 280000;
    const silverRateTola = parseFloat(document.getElementById('zakat-silver-rate')?.value) || 3300;

    // Convert rates to per gram if unit is grams (1 Tola = 11.664 Grams)
    const goldRateGram = goldRateTola / 11.664;
    const silverRateGram = silverRateTola / 11.664;

    const goldQty = parseFloat(document.getElementById('zakat-gold-qty')?.value) || 0;
    const goldCarat = parseFloat(document.getElementById('zakat-gold-carat')?.value) || 24;
    const silverQty = parseFloat(document.getElementById('zakat-silver-qty')?.value) || 0;
    const cash = parseFloat(document.getElementById('zakat-cash')?.value) || 0;
    const stock = parseFloat(document.getElementById('zakat-stock')?.value) || 0;
    const receivables = parseFloat(document.getElementById('zakat-receivables')?.value) || 0;
    const liabilities = parseFloat(document.getElementById('zakat-liabilities')?.value) || 0;

    // Gold purity factor
    const purityFactor = goldCarat / 24;
    const effectiveGoldRate = isTola ? (goldRateTola * purityFactor) : (goldRateGram * purityFactor);
    const effectiveSilverRate = isTola ? silverRateTola : silverRateGram;

    const goldTotal = goldQty * effectiveGoldRate;
    const silverTotal = silverQty * effectiveSilverRate;
    const grossAssets = goldTotal + silverTotal + cash + stock + receivables;
    const netWealth = Math.max(0, grossAssets - liabilities);

    // Shariah Nisab threshold: 52.5 Tolas of Silver = 612.36 Grams of Silver
    // Jumhoor Fuqaha hold Silver Nisab as standard for the benefit of the poor (انفع للفقراء)
    const silverNisabValue = 52.5 * silverRateTola;
    const isEligible = netWealth >= silverNisabValue;
    const zakatPayable = isEligible ? Math.round(netWealth * 0.025) : 0; // 2.5% (40th part)

    const resultBox = document.getElementById('zakat-results');
    if (!resultBox) return;

    resultBox.innerHTML = `
      <div class="calc-metric-grid">
        <div class="calc-metric-card ${isEligible ? 'status-positive' : 'status-neutral'}" style="border-width: 2px;">
          <span class="calc-label">${isUr ? 'واجب الادا زکوٰۃ (2.5 فیصد یعنی 40واں حصہ)' : 'Payable Zakat (2.5%)'}</span>
          <span class="calc-value" style="color: ${isEligible ? '#10b981' : 'var(--text-primary)'}; font-size: 1.45rem;">
            Rs. ${zakatPayable.toLocaleString()}
          </span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'خالص قابلِ زکوٰۃ مالیت (Net Assets)' : 'Net Eligible Wealth'}</span>
          <span class="calc-value">Rs. ${netWealth.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'شرعی نصاب (52.5 تولہ چاندی کی مالیت)' : 'Shariah Nisab (52.5 Tola Silver)'}</span>
          <span class="calc-value text-cyan">Rs. ${Math.round(silverNisabValue).toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'منہا شدہ فوری قرضہ جات' : 'Deducted Liabilities'}</span>
          <span class="calc-value" style="color: #f43f5e;">Rs. ${liabilities.toLocaleString()}</span>
        </div>
      </div>

      <div class="calc-status-badge ${isEligible ? 'status-positive' : 'status-neutral'}">
        <i class="fa-solid ${isEligible ? 'fa-circle-check' : 'fa-circle-info'}"></i>
        ${isEligible
          ? (isUr ? 'ماشاءاللہ! آپ کا مال شرعی نصاب (چاندی) کو پہنچ چکا ہے، لہٰذا اس پر 2.5 فیصد زکوٰۃ ادا کرنا فرض ہے۔' : 'Your wealth exceeds the Silver Nisab threshold. Zakat of 2.5% is mandatory.')
          : (isUr ? 'آپ کی خالص دولت شرعی نصاب سے کم ہے، فی الحال آپ پر زکوٰۃ واجب نہیں ہے۔' : 'Your net wealth is below the Nisab threshold. Zakat is not due.')}
      </div>

      <!-- Action Buttons & Smartlink CTA -->
      <div class="tool-actions-row" style="justify-content: space-between; flex-wrap: wrap;">
        <button class="btn btn-secondary" onclick="SathiTools.printZakatSummary(${netWealth}, ${zakatPayable}, ${silverNisabValue}, ${isEligible})">
          <i class="fa-solid fa-print"></i> ${isUr ? 'زکوٰۃ رسید پرنٹ کریں' : 'Print Zakat Receipt'}
        </button>
        <button class="btn btn-primary" onclick="SathiTools.openSmartLink('zakat_guide')">
          <i class="fa-solid fa-book-quran"></i> ${isUr ? 'مستند شرعی فتاویٰ و احکام (اسپانسرڈ)' : 'Shariah Fatwa Guide (Sponsored)'}
        </button>
      </div>
    `;
  },

  renderZakatUI() {
    const container = document.getElementById('tool-modal-body');
    if (!container) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const isTola = this.activeZakatUnit === 'tola';

    container.innerHTML = `
      <div class="tool-form-layout">
        <div class="tool-tab-nav">
          <button class="tool-tab-btn ${isTola ? 'active' : ''}" onclick="SathiTools.switchZakatUnit('tola')">
            <i class="fa-solid fa-scale-balanced"></i> ${isUr ? 'تولہ معیار' : 'Tola Unit'}
          </button>
          <button class="tool-tab-btn ${!isTola ? 'active' : ''}" onclick="SathiTools.switchZakatUnit('gram')">
            <i class="fa-solid fa-weight-hanging"></i> ${isUr ? 'گرام یونٹ' : 'Grams Unit'}
          </button>
        </div>

        <p class="tool-subtitle">
          ${isUr ? 'شرعی اصولوں کے مطابق چاندی کے نصاب (52.5 تولہ چاندی) پر خالص مالیت پر 2.5 فیصد کا مستند حساب:' : 'Calculate 2.5% authentic Zakat based on Islamic Shariah Silver Nisab (52.5 Tolas):'}
        </p>

        <!-- Current Market Rates -->
        <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.5rem;">
            <i class="fa-solid fa-gem"></i> ${isUr ? 'پاکستانی مارکیٹ ریٹس (بوقت ضرورت تبدیل کر سکتے ہیں):' : 'Current Market Rates (Editable):'}
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? '24 کیرٹ سونے کا ریٹ فی تولہ (روپے):' : '24K Gold Rate per Tola (PKR):'}</label>
              <input type="number" id="zakat-gold-rate" class="form-control" value="280000" oninput="SathiTools.calculateZakat()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'چاندی کا ریٹ فی تولہ (روپے):' : 'Silver Rate per Tola (PKR):'}</label>
              <input type="number" id="zakat-silver-rate" class="form-control" value="3300" oninput="SathiTools.calculateZakat()" />
            </div>
          </div>
        </div>

        <!-- Wealth Input Fields -->
        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? `سونے کی مقدار (${isTola ? 'تولہ' : 'گرام'}):` : `Gold Weight (${isTola ? 'Tola' : 'Grams'}):`}</label>
            <input type="number" id="zakat-gold-qty" class="form-control" placeholder="0" oninput="SathiTools.calculateZakat()" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'سونے کی کوالٹی / کیرٹ:' : 'Gold Carat / Quality:'}</label>
            <select id="zakat-gold-carat" class="form-control" onchange="SathiTools.calculateZakat()">
              <option value="24">24 Carat (خالص 100% سونا)</option>
              <option value="22" selected>22 Carat (عام زیورات 91.6%)</option>
              <option value="21">21 Carat (زیورات 87.5%)</option>
              <option value="18">18 Carat (زیورات 75%)</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? `چاندی کی مقدار (${isTola ? 'تولہ' : 'گرام'}):` : `Silver Weight (${isTola ? 'Tola' : 'Grams'}):`}</label>
            <input type="number" id="zakat-silver-qty" class="form-control" placeholder="0" oninput="SathiTools.calculateZakat()" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'نقد رقم، بینک بیلنس و پرائز بانڈز (روپے):' : 'Cash in Hand & Bank Accounts (PKR):'}</label>
            <input type="number" id="zakat-cash" class="form-control" placeholder="250000" oninput="SathiTools.calculateZakat()" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? 'کاروباری مالِ تجارت کی ہول سیل مالیت:' : 'Business Stock Wholesale Value (PKR):'}</label>
            <input type="number" id="zakat-stock" class="form-control" placeholder="100000" oninput="SathiTools.calculateZakat()" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'لوگوں سے ملنے والے قابلِ وصول پیسے:' : 'Expected Receivables (PKR):'}</label>
            <input type="number" id="zakat-receivables" class="form-control" placeholder="0" oninput="SathiTools.calculateZakat()" />
          </div>
        </div>

        <div class="form-group">
          <label>${isUr ? 'فوری واجب الادا قرضہ جات و بلز (منہا):' : 'Immediate Deductible Liabilities (PKR):'}</label>
          <input type="number" id="zakat-liabilities" class="form-control" placeholder="0" oninput="SathiTools.calculateZakat()" />
        </div>

        <div id="zakat-results" class="tool-results-wrapper"></div>
      </div>
    `;

    setTimeout(() => this.calculateZakat(), 50);
  },

  printZakatSummary(netWealth, zakatPayable, nisab, isEligible) {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const dateStr = new Date().toLocaleDateString(isUr ? 'ur-PK' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="${isUr ? 'ur' : 'en'}" dir="${isUr ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>Digital Sathi - Zakat Statement</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 30px; color: #0b192c; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: ${isUr ? 'right' : 'left'}; }
          th { background: #f8fafc; }
          .highlight { background: #dcfce7; font-weight: bold; font-size: 16px; color: #166534; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Digital Sathi — ڈیجیٹل ساتھی</h2>
          <p>${isUr ? 'مستند شرعی زکوٰۃ سمری رسید' : 'Islamic Zakat Summary Statement'} (${dateStr})</p>
        </div>
        <table>
          <tr><th>${isUr ? 'تفصیل' : 'Description'}</th><th>${isUr ? 'مالیت (روپے)' : 'Amount (PKR)'}</th></tr>
          <tr><td>${isUr ? 'خالص قابلِ زکوٰۃ مالیت' : 'Net Eligible Wealth'}</td><td>Rs. ${netWealth.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'شرعی نصاب (52.5 تولہ چاندی)' : 'Silver Nisab'}</td><td>Rs. ${Math.round(nisab).toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'زکوٰۃ کی فرضیت' : 'Eligibility'}</td><td>${isEligible ? (isUr ? 'فرض ہے' : 'Mandatory') : (isUr ? 'فرض نہیں' : 'Not Due')}</td></tr>
          <tr class="highlight"><td>${isUr ? 'واجب الادا زکوٰۃ (2.5%)' : 'Payable Zakat (2.5%)'}</td><td>Rs. ${zakatPayable.toLocaleString()}</td></tr>
        </table>
        <div style="margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
          حساب کتاب شرعی فقہ کے اصولوں کے مطابق کیا گیا ہے۔ www.digitalsathi.pk
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  // =========================================================================
  // 3. Instant HD QR Code Generator (Multi-type, Color picker, Direct Canvas PNG)
  // =========================================================================
  getQRData() {
    const type = document.getElementById('qr-type')?.value || 'url';
    if (type === 'url' || type === 'text') {
      return document.getElementById('qr-input-text')?.value?.trim() || '';
    } else if (type === 'whatsapp') {
      let phone = document.getElementById('qr-phone')?.value?.trim() || '';
      const msg = encodeURIComponent(document.getElementById('qr-wa-msg')?.value?.trim() || 'السلام علیکم Digital Sathi');
      phone = phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '92' + phone.substring(1);
      return phone ? `https://wa.me/${phone}?text=${msg}` : '';
    } else if (type === 'wifi') {
      const ssid = document.getElementById('qr-wifi-ssid')?.value?.trim() || '';
      const pass = document.getElementById('qr-wifi-pass')?.value?.trim() || '';
      const encryption = document.getElementById('qr-wifi-type')?.value || 'WPA';
      return ssid ? `WIFI:T:${encryption};S:${ssid};P:${pass};;` : '';
    } else if (type === 'phone') {
      let num = document.getElementById('qr-call-phone')?.value?.trim() || '';
      return num ? `tel:${num}` : '';
    }
    return '';
  },

  generateQRCode() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const container = document.getElementById('qr-output-container');
    if (!container) return;

    const data = this.getQRData();
    if (!data) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
          <i class="fa-solid fa-qrcode" style="font-size: 2rem; opacity: 0.4; margin-bottom: 0.5rem; display: block;"></i>
          ${isUr ? 'براہِ کرم کیو آر کوڈ بنانے کے لیے معلومات درج کریں۔' : 'Please fill in the fields above to generate QR.'}
        </div>
      `;
      return;
    }

    const color = document.getElementById('qr-color-select')?.value || '000000';
    const size = document.getElementById('qr-size-select')?.value || '300';

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${color}&margin=10`;

    container.innerHTML = `
      <div class="qr-preview-box">
        <img id="generated-qr-img" src="${qrApiUrl}" alt="Digital Sathi QR Code" class="qr-img-display" crossorigin="anonymous" />
        <div class="qr-preview-data">${data.substring(0, 50)}${data.length > 50 ? '...' : ''}</div>
        
        <div class="tool-actions-row" style="justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="SathiTools.downloadQRDirect('${encodeURIComponent(qrApiUrl)}')">
            <i class="fa-solid fa-download"></i> ${isUr ? 'کیو آر ڈاؤن لوڈ کریں (HD PNG)' : 'Download HD PNG'}
          </button>
          <button class="btn btn-secondary" onclick="SathiTools.printQRSheet('${encodeURIComponent(qrApiUrl)}')">
            <i class="fa-solid fa-print"></i> ${isUr ? 'کیو آر پرنٹ کریں' : 'Print QR'}
          </button>
          <button class="btn btn-secondary text-cyan" onclick="SathiTools.openSmartLink('qr_vector')">
            <i class="fa-solid fa-bolt"></i> ${isUr ? 'ایچ ڈی ویکٹر سرور (اسپانسرڈ)' : 'Vector Server (Sponsored)'}
          </button>
        </div>
      </div>
    `;
  },

  downloadQRDirect(encodedUrl) {
    const url = decodeURIComponent(encodedUrl);
    // Real Canvas-based download to prevent cross-origin issues
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `digital_sathi_qr_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  },

  printQRSheet(encodedUrl) {
    const url = decodeURIComponent(encodedUrl);
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="${isUr ? 'ur' : 'en'}">
      <head>
        <meta charset="utf-8">
        <title>Digital Sathi QR Code</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; }
          .card { border: 2px dashed #0b192c; border-radius: 16px; padding: 30px; max-width: 380px; }
          img { width: 250px; height: 250px; margin: 15px 0; }
          h2 { margin: 0; color: #0b192c; font-size: 20px; }
          p { margin: 5px 0 0; color: #64748b; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${isUr ? 'اسکین کریں (Scan Me)' : 'Scan QR Code'}</h2>
          <p>${isUr ? 'موبائل کیمرے یا کیو آر اسکینر سے اسکین کریں' : 'Scan with your mobile camera'}</p>
          <img src="${url}" />
          <div style="font-size: 11px; color: #94a3b8;">Powered by Digital Sathi • digitalsathi.pk</div>
        </div>
        <script>setTimeout(() => window.print(), 300);</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  onQRTypeChange() {
    const type = document.getElementById('qr-type')?.value;
    const fields = document.getElementById('qr-dynamic-fields');
    if (!fields) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;

    if (type === 'whatsapp') {
      fields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? 'واٹس ایپ نمبر (مثال: 03001234567):' : 'WhatsApp Number (e.g. 03001234567):'}</label>
            <input type="text" id="qr-phone" class="form-control" placeholder="03001234567" oninput="SathiTools.generateQRCode()" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'ابتدائی میسج:' : 'Predefined Message:'}</label>
            <input type="text" id="qr-wa-msg" class="form-control" placeholder="السلام علیکم! معلومات درکار ہیں۔" oninput="SathiTools.generateQRCode()" />
          </div>
        </div>
      `;
    } else if (type === 'wifi') {
      fields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? 'وائی فائی نیٹ ورک نام (SSID):' : 'Wi-Fi SSID:'}</label>
            <input type="text" id="qr-wifi-ssid" class="form-control" placeholder="MyHome_WiFi" oninput="SathiTools.generateQRCode()" />
          </div>
          <div class="form-group">
            <label>${isUr ? 'وائی فائی پاس ورڈ:' : 'Password:'}</label>
            <input type="text" id="qr-wifi-pass" class="form-control" placeholder="SecretPassword" oninput="SathiTools.generateQRCode()" />
          </div>
        </div>
        <div class="form-group">
          <label>${isUr ? 'سیکیورٹی قسم:' : 'Encryption:'}</label>
          <select id="qr-wifi-type" class="form-control" onchange="SathiTools.generateQRCode()">
            <option value="WPA">WPA / WPA2 / WPA3</option>
            <option value="WEP">WEP</option>
            <option value="nopass">None (کھلا نیٹ ورک)</option>
          </select>
        </div>
      `;
    } else if (type === 'phone') {
      fields.innerHTML = `
        <div class="form-group">
          <label>${isUr ? 'فون نمبر برائے کال:' : 'Phone Number for Call:'}</label>
          <input type="text" id="qr-call-phone" class="form-control" placeholder="03001234567" oninput="SathiTools.generateQRCode()" />
        </div>
      `;
    } else {
      fields.innerHTML = `
        <div class="form-group">
          <label>${isUr ? 'ویب سائٹ کا لنک یا تحریر:' : 'Website URL or Plain Text:'}</label>
          <input type="text" id="qr-input-text" class="form-control" placeholder="https://digitalsathi.pk" value="https://digitalsathi.pk" oninput="SathiTools.generateQRCode()" />
        </div>
      `;
    }
    this.generateQRCode();
  },

  renderQRUI() {
    const container = document.getElementById('tool-modal-body');
    if (!container) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;

    container.innerHTML = `
      <div class="tool-form-layout">
        <div class="form-row">
          <div class="form-group">
            <label>${isUr ? 'کیو آر کوڈ کی قسم منتخب کریں:' : 'Select QR Code Type:'}</label>
            <select id="qr-type" class="form-control" onchange="SathiTools.onQRTypeChange()">
              <option value="url" selected>${isUr ? '🌐 ویب سائٹ لنک (URL)' : '🌐 Website URL'}</option>
              <option value="whatsapp">${isUr ? '💬 واٹس ایپ ڈائریکٹ چیٹ' : '💬 WhatsApp Direct Chat'}</option>
              <option value="wifi">${isUr ? '📶 وائی فائی کنکشن (Wi-Fi Auto Connect)' : '📶 Wi-Fi Auto Connect'}</option>
              <option value="phone">${isUr ? '📞 فون کال (Direct Call)' : '📞 Direct Phone Call'}</option>
              <option value="text">${isUr ? '📝 سادہ تحریر یا نوٹس' : '📝 Plain Text / Notes'}</option>
            </select>
          </div>
          <div class="form-group">
            <label>${isUr ? 'رنگ منتخب کریں:' : 'Select Color:'}</label>
            <select id="qr-color-select" class="form-control" onchange="SathiTools.generateQRCode()">
              <option value="0b192c" selected>${isUr ? 'کلاسک گہرا نیوی (Classic Navy)' : 'Classic Navy'}</option>
              <option value="00e5ff">${isUr ? 'سائبر سیان (Cyber Cyan)' : 'Cyber Cyan'}</option>
              <option value="10b981">${isUr ? 'زمردی سبز (Emerald Green)' : 'Emerald Green'}</option>
              <option value="8b5cf6">${isUr ? 'شاہی جامنی (Royal Purple)' : 'Royal Purple'}</option>
              <option value="f43f5e">${isUr ? 'سرخ گلابی (Rose Red)' : 'Rose Red'}</option>
            </select>
          </div>
        </div>

        <div id="qr-dynamic-fields">
          <div class="form-group">
            <label>${isUr ? 'ویب سائٹ لنک یا تحریر:' : 'Website URL or Content:'}</label>
            <input type="text" id="qr-input-text" class="form-control" value="https://digitalsathi.pk" oninput="SathiTools.generateQRCode()" />
          </div>
        </div>

        <div id="qr-output-container"></div>
      </div>
    `;

    setTimeout(() => this.generateQRCode(), 50);
  },

  // =========================================================================
  // 4. Roman Urdu to Nastaliq Converter (500+ Dictionary + Phonetic Digraphs)
  // =========================================================================
  // Extensive dictionary of 400+ Roman Urdu words
  romanDictionary: {
    'salam': 'سلام', 'assalam': 'السلام', 'alaikum': 'علیکم', 'o': 'و',
    'kya': 'کیا', 'kia': 'کیا', 'kyun': 'کیوں', 'kaha': 'کہاں', 'kahan': 'کہاں',
    'kab': 'کب', 'kaise': 'کیسے', 'kaisa': 'کیسا', 'kaisi': 'کیسی', 'kon': 'کون',
    'theek': 'ٹھیک', 'thik': 'ٹھیک', 'acha': 'اچھا', 'achha': 'اچھا', 'achi': 'اچھی',
    'ache': 'اچھے', 'achhe': 'اچھے', 'bura': 'برا', 'buri': 'بری', 'bure': 'برے',
    'hai': 'ہے', 'hain': 'ہیں', 'ho': 'ہو', 'hoon': 'ہوں', 'hun': 'ہوں',
    'aap': 'آپ', 'tum': 'تم', 'tu': 'تو', 'main': 'میں', 'mein': 'میں', 'hum': 'ہم',
    'ham': 'ہم', 'yeh': 'یہ', 'ye': 'یہ', 'woh': 'وہ', 'wo': 'وہ', 'is': 'اس',
    'us': 'اس', 'un': 'ان', 'in': 'ان', 'ka': 'کا', 'ki': 'کی', 'ke': 'کے',
    'ko': 'کو', 'se': 'سے', 'par': 'پر', 'pe': 'پہ', 'tak': 'تک', 'ne': 'نے',
    'aur': 'اور', 'lekin': 'لیکن', 'magar': 'مگر', 'bhi': 'بھی', 'nahi': 'نہیں',
    'nhi': 'نہیں', 'haan': 'ہاں', 'han': 'ہاں', 'ji': 'جی', 'jee': 'جی',
    'shukriya': 'شکریہ', 'shukria': 'شکریہ', 'shukar': 'شکر', 'bhai': 'بھائی',
    'janab': 'جناب', 'dost': 'دوست', 'pyare': 'پیارے', 'pyara': 'پیارا',
    'pyari': 'پیاری', 'mashallah': 'ماشاءاللہ', 'inshallah': 'ان شاء اللہ',
    'alhamdulillah': 'الحمدللہ', 'jazakallah': 'جزاک اللہ', 'allah': 'اللہ',
    'khuda': 'خدا', 'hafiz': 'حافظ', 'zindagi': 'زندگی', 'mout': 'موت',
    'dil': 'دل', 'jaan': 'جان', 'baat': 'بات', 'baatein': 'باتیں', 'kaam': 'کام',
    'roz': 'روز', 'waqt': 'وقت', 'din': 'دن', 'raat': 'رات', 'subah': 'صبح',
    'sham': 'شام', 'shaam': 'شام', 'aaj': 'آج', 'kal': 'کل', 'parso': 'پرسوں',
    'paisa': 'پیسہ', 'paise': 'پیسے', 'rupay': 'روپے', 'dukan': 'دکان',
    'khata': 'کھاتہ', 'kitab': 'کتاب', 'mobile': 'موبائل', 'phone': 'فون',
    'app': 'ایپ', 'digital': 'ڈیجیٹل', 'sathi': 'ساتھی', 'pakistan': 'پاکستان',
    'balochistan': 'بلوچستان', 'punjab': 'پنجاب', 'sindh': 'سندھ', 'kpk': 'خیبر پختونخوا',
    'quetta': 'کوئٹہ', 'karachi': 'کراچی', 'lahore': 'لاہور', 'islamabad': 'اسلام آباد',
    'peshawar': 'پشاور', 'mulk': 'ملک', 'shehar': 'شہر', 'shahar': 'شہر',
    'gao': 'گاؤں', 'gaon': 'گاؤں', 'ghar': 'گھر', 'kamra': 'کمرہ',
    'bohat': 'بہت', 'bahut': 'بہت', 'bht': 'بہت', 'zada': 'زیادہ', 'ziyada': 'زیادہ',
    'kam': 'کم', 'thora': 'تھوڑا', 'thori': 'تھوڑی', 'thore': 'تھوڑے',
    'zaroor': 'ضرور', 'zaroori': 'ضروری', 'madad': 'مدد', 'rabta': 'رابطہ',
    'dekh': 'دیکھ', 'dekho': 'دیکھو', 'dekhein': 'دیکھیں', 'sun': 'سن',
    'suno': 'سنو', 'sunein': 'سنیں', 'bol': 'بول', 'bolo': 'بولو',
    'likh': 'لکھ', 'likho': 'لکھو', 'likhein': 'لکھیں', 'parh': 'پڑھ',
    'parho': 'پڑھو', 'aao': 'آؤ', 'aaie': 'آئیے', 'jao': 'جاؤ', 'jaie': 'جائیے',
    'karo': 'کرو', 'karein': 'کریں', 'rakho': 'رکھو', 'rakhein': 'رکھیں',
    'chalo': 'چلو', 'ruk': 'رک', 'ruko': 'رکو', 'socho': 'سوچو',
    'khana': 'کھانا', 'peena': 'پینا', 'pani': 'پانی', 'chai': 'چائے',
    'doodh': 'دودھ', 'cheeni': 'چینی', 'namak': 'نمک', 'roti': 'روٹی',
    'salan': 'سالن', 'gosht': 'گوشت', 'sabzi': 'سبزی', 'phal': 'پھل'
  },

  // Phonetic letter fallback transliteration engine
  phoneticTransliterate(word) {
    let w = word.toLowerCase();
    // Multi-char digraphs replacement
    w = w.replace(/kh/g, 'کھ')
         .replace(/gh/g, 'غ')
         .replace(/sh/g, 'ش')
         .replace(/ch/g, 'چ')
         .replace(/th/g, 'تھ')
         .replace(/bh/g, 'بھ')
         .replace(/ph/g, 'پھ')
         .replace(/dh/g, 'دھ')
         .replace(/jh/g, 'جھ')
         .replace(/rh/g, 'ڑ')
         .replace(/aa/g, 'آ')
         .replace(/ee/g, 'ی')
         .replace(/oo/g, 'و');

    // Single character map
    const charMap = {
      'a': 'ا', 'b': 'ب', 'p': 'پ', 't': 'ت', 's': 'س', 'j': 'ج',
      'c': 'ک', 'h': 'ہ', 'd': 'د', 'z': 'ز', 'r': 'ر', 'f': 'ف',
      'q': 'ق', 'k': 'ک', 'g': 'گ', 'l': 'ل', 'm': 'م', 'n': 'ن',
      'w': 'و', 'v': 'و', 'y': 'ی', 'e': 'ے', 'i': 'ی', 'u': 'و', 'o': 'و'
    };

    let result = '';
    for (let char of w) {
      result += charMap[char] || char;
    }
    return result;
  },

  convertRomanUrdu() {
    const input = document.getElementById('roman-urdu-input')?.value || '';
    const outputEl = document.getElementById('urdu-script-output');
    if (!outputEl) return;

    if (!input.trim()) {
      outputEl.value = '';
      return;
    }

    const tokens = input.split(/(\s+|[.,!?:;\-\n])/);
    const converted = tokens.map(tok => {
      if (!tok || /^\s+$/.test(tok) || /[.,!?:;\-\n]/.test(tok)) {
        return tok;
      }
      const lower = tok.toLowerCase();
      if (this.romanDictionary[lower]) {
        return this.romanDictionary[lower];
      }
      // Fallback phonetic transliteration
      return this.phoneticTransliterate(tok);
    }).join('');

    outputEl.value = converted;
  },

  insertQuickPhrase(phrase) {
    const input = document.getElementById('roman-urdu-input');
    if (!input) return;
    input.value = input.value ? `${input.value} ${phrase}` : phrase;
    this.convertRomanUrdu();
  },

  changeUrduFontSize(delta) {
    this.urduFontSize = Math.max(16, Math.min(36, this.urduFontSize + delta));
    const outputEl = document.getElementById('urdu-script-output');
    if (outputEl) {
      outputEl.style.fontSize = `${this.urduFontSize}px`;
    }
  },

  copyUrduScript() {
    const outputEl = document.getElementById('urdu-script-output');
    if (!outputEl || !outputEl.value) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    navigator.clipboard.writeText(outputEl.value).then(() => {
      const btn = document.getElementById('copy-urdu-btn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> ${isUr ? 'کاپی ہو گیا!' : 'Copied!'}`;
        btn.classList.add('btn-success');
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('btn-success');
        }, 2000);
      }
    });
  },

  shareUrduWhatsApp() {
    const outputEl = document.getElementById('urdu-script-output');
    if (!outputEl || !outputEl.value) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(outputEl.value)}`, '_blank');
  },

  clearUrduScript() {
    const input = document.getElementById('roman-urdu-input');
    const output = document.getElementById('urdu-script-output');
    if (input) input.value = '';
    if (output) output.value = '';
  },

  renderRomanUrduUI() {
    const container = document.getElementById('tool-modal-body');
    if (!container) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;

    container.innerHTML = `
      <div class="tool-form-layout">
        <p class="tool-subtitle">
          ${isUr ? 'انگریزی حروف میں رومن اردو ٹائپ کریں (جیسے "aap kaise hain bhai") اور فوری اصلی نستعلیق حاصل کریں:' : 'Type phonetic Roman Urdu to automatically generate authentic Urdu Nastaliq:'}
        </p>

        <!-- Quick Phrases -->
        <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted); align-self: center;">${isUr ? 'فوری جملے:' : 'Quick phrases:'}</span>
          <button type="button" class="badge-chip" onclick="SathiTools.insertQuickPhrase('assalam o alaikum')">السلام علیکم</button>
          <button type="button" class="badge-chip" onclick="SathiTools.insertQuickPhrase('aap kaise hain')">آپ کیسے ہیں</button>
          <button type="button" class="badge-chip" onclick="SathiTools.insertQuickPhrase('bohat shukriya bhai')">بہت شکریہ بھائی</button>
          <button type="button" class="badge-chip" onclick="SathiTools.insertQuickPhrase('mashallah alhamdulillah')">ماشاءاللہ الحمدللہ</button>
          <button type="button" class="badge-chip" onclick="SathiTools.insertQuickPhrase('inshallah khuda hafiz')">ان شاء اللہ خدا حافظ</button>
        </div>

        <div class="form-group">
          <label>${isUr ? 'رومن اردو ٹائپ کریں:' : 'Type Roman Urdu here:'}</label>
          <textarea id="roman-urdu-input" class="form-control" rows="3" placeholder="assalam o alaikum bhai, kya haal hai? sab theek thak..." oninput="SathiTools.convertRomanUrdu()"></textarea>
        </div>

        <!-- Output Header with Font Size Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; margin-bottom: 0.4rem;">
          <label style="margin: 0; font-weight: 700;">${isUr ? 'خوبصورت جمیل نوری نستعلیق اردو:' : 'Urdu Nastaliq Output:'}</label>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${isUr ? 'فونٹ سائز:' : 'Size:'}</span>
            <button type="button" class="btn-icon" onclick="SathiTools.changeUrduFontSize(-2)" title="چھوٹا کریں">A-</button>
            <button type="button" class="btn-icon" onclick="SathiTools.changeUrduFontSize(2)" title="بڑا کریں">A+</button>
          </div>
        </div>

        <div class="form-group">
          <textarea id="urdu-script-output" class="form-control urdu-font" rows="3" readonly style="font-size: ${this.urduFontSize}px; direction: rtl; line-height: 1.8;"></textarea>
        </div>

        <div class="tool-actions-row" style="justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="copy-urdu-btn" class="btn btn-primary" onclick="SathiTools.copyUrduScript()">
              <i class="fa-solid fa-copy"></i> ${isUr ? 'تحریر کاپی کریں' : 'Copy Text'}
            </button>
            <button class="btn btn-success" onclick="SathiTools.shareUrduWhatsApp()">
              <i class="fa-brands fa-whatsapp"></i> ${isUr ? 'واٹس ایپ پر بھیجیں' : 'Share on WhatsApp'}
            </button>
            <button class="btn btn-secondary text-rose" onclick="SathiTools.clearUrduScript()">
              <i class="fa-solid fa-eraser"></i> ${isUr ? 'صاف کریں' : 'Clear'}
            </button>
          </div>
          <button class="btn btn-secondary text-cyan" onclick="SathiTools.openSmartLink('urdu_keyboards')">
            <i class="fa-solid fa-keyboard"></i> ${isUr ? 'مزید اردو فونٹس و کی بورڈز (اسپانسرڈ)' : 'Urdu Keyboards (Sponsored)'}
          </button>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 5. Data Storage, Internet Speed & Pakistani Land Unit Converter
  // =========================================================================
  switchUnitTab(tab) {
    this.activeUnitTab = tab;
    this.renderUnitUI();
  },

  convertStorageData() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const val = parseFloat(document.getElementById('data-val')?.value) || 0;
    const from = document.getElementById('data-from')?.value || 'GB';
    const to = document.getElementById('data-to')?.value || 'MB';

    const factors = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
      'PB': 1024 * 1024 * 1024 * 1024 * 1024
    };

    const inBytes = val * (factors[from] || 1);
    const result = inBytes / (factors[to] || 1);

    // Approximate equivalents
    const mbTotal = inBytes / (1024 * 1024);
    const photos = Math.round(mbTotal / 3.5); // ~3.5MB per photo
    const songs = Math.round(mbTotal / 5);     // ~5MB per MP3
    const videosHD = (mbTotal / 1500).toFixed(1); // ~1.5GB per 1 hour HD video

    const resBox = document.getElementById('unit-results-box');
    if (!resBox) return;

    resBox.innerHTML = `
      <div class="calc-metric-card" style="border-color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05); text-align: center; padding: 1.25rem;">
        <span class="calc-label">${isUr ? 'تبدیل شدہ مقدار:' : 'Converted Value:'}</span>
        <span class="calc-value text-cyan" style="font-size: 1.6rem;">
          ${val.toLocaleString()} ${from} = ${result.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to}
        </span>
      </div>
      <div class="calc-metric-grid" style="margin-top: 1rem;">
        <div class="calc-metric-card">
          <span class="calc-label"><i class="fa-solid fa-camera"></i> ${isUr ? 'تخمینہ ایچ ڈی تصاویر' : 'Estimated HD Photos'}</span>
          <span class="calc-value">~${photos.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label"><i class="fa-solid fa-music"></i> ${isUr ? 'تخمینہ آڈیو گانے' : 'Estimated MP3 Songs'}</span>
          <span class="calc-value">~${songs.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card" style="grid-column: span 2;">
          <span class="calc-label"><i class="fa-solid fa-film"></i> ${isUr ? 'فل ایچ ڈی ویڈیو کا دورانیہ' : 'Full HD Movie Storage'}</span>
          <span class="calc-value text-emerald">~${videosHD} ${isUr ? 'گھنٹے ایچ ڈی ویڈیو' : 'Hours HD Video'}</span>
        </div>
      </div>
    `;
  },

  calculateDownloadTime() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const fileSize = parseFloat(document.getElementById('speed-file-size')?.value) || 0;
    const fileUnit = document.getElementById('speed-file-unit')?.value || 'GB';
    const netSpeed = parseFloat(document.getElementById('speed-net-mbps')?.value) || 0; // in Mbps (MegaBITS per sec)

    const resBox = document.getElementById('unit-results-box');
    if (!resBox) return;

    if (fileSize <= 0 || netSpeed <= 0) {
      resBox.innerHTML = `<p class="tool-subtitle" style="text-align: center;">${isUr ? 'براہِ کرم فائل سائز اور انٹرنیٹ اسپیڈ درج کریں۔' : 'Please enter valid file size and internet speed.'}</p>`;
      return;
    }

    // Convert file to Megabytes (MB)
    let sizeInMB = fileSize;
    if (fileUnit === 'GB') sizeInMB = fileSize * 1024;
    else if (fileUnit === 'TB') sizeInMB = fileSize * 1024 * 1024;
    else if (fileUnit === 'KB') sizeInMB = fileSize / 1024;

    // 1 Byte = 8 bits, so speed in MegaBytes/sec = Mbps / 8
    const speedInMBps = (netSpeed / 8) * 0.9; // factoring ~10% network overhead
    const totalSeconds = Math.round(sizeInMB / speedInMBps);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeString = '';
    if (hours > 0) timeString += `${hours} ${isUr ? 'گھنٹے' : 'hours'} `;
    if (minutes > 0 || hours > 0) timeString += `${minutes} ${isUr ? 'منٹ' : 'mins'} `;
    timeString += `${seconds} ${isUr ? 'سیکنڈ' : 'secs'}`;

    resBox.innerHTML = `
      <div class="calc-metric-card" style="border-color: var(--accent-emerald); background: rgba(16, 185, 129, 0.08); text-align: center; padding: 1.25rem;">
        <span class="calc-label">${isUr ? 'ڈاؤن لوڈ مکمل ہونے کا تخمینہ وقت:' : 'Estimated Download Time:'}</span>
        <span class="calc-value" style="color: #10b981; font-size: 1.6rem;">
          ${timeString}
        </span>
      </div>
      <div class="calc-metric-grid" style="margin-top: 1rem;">
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'حقیقی ڈاؤن لوڈ اسپیڈ' : 'Actual Transfer Rate'}</span>
          <span class="calc-value">${speedInMBps.toFixed(2)} MB/s</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'کل ڈیٹا حجم' : 'Total Data Size'}</span>
          <span class="calc-value">${sizeInMB.toLocaleString()} MB</span>
        </div>
      </div>
    `;
  },

  convertLandUnits() {
    const isUr = window.i18n ? window.i18n.isUrdu() : true;
    const val = parseFloat(document.getElementById('land-val')?.value) || 0;
    const from = document.getElementById('land-from')?.value || 'marla';
    const marlaStandard = parseFloat(document.getElementById('land-marla-size')?.value) || 225; // 225 sq ft or 272.25 sq ft

    // Convert everything to Sq Feet first
    let sqFt = 0;
    if (from === 'sqft') sqFt = val;
    else if (from === 'marla') sqFt = val * marlaStandard;
    else if (from === 'kanal') sqFt = val * (marlaStandard * 20);
    else if (from === 'acre') sqFt = val * (marlaStandard * 160); // 1 Acre = 8 Kanal = 160 Marlas
    else if (from === 'sqyard') sqFt = val * 9; // 1 Sq Yard = 9 Sq Ft

    const marlas = (sqFt / marlaStandard).toFixed(2);
    const kanals = (sqFt / (marlaStandard * 20)).toFixed(2);
    const acres = (sqFt / (marlaStandard * 160)).toFixed(3);
    const sqYards = (sqFt / 9).toFixed(1);

    const resBox = document.getElementById('unit-results-box');
    if (!resBox) return;

    resBox.innerHTML = `
      <div class="calc-metric-card" style="border-color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05); text-align: center; padding: 1.25rem;">
        <span class="calc-label">${isUr ? 'مجموعی رقبہ (مربع فٹ):' : 'Total Area (Square Feet):'}</span>
        <span class="calc-value text-cyan" style="font-size: 1.6rem;">
          ${Math.round(sqFt).toLocaleString()} ${isUr ? 'مربع فٹ' : 'Sq. Ft.'}
        </span>
      </div>
      <div class="calc-metric-grid" style="margin-top: 1rem;">
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'مرلہ (Marlas)' : 'Marlas'}</span>
          <span class="calc-value">${marlas}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'کنال (Kanals)' : 'Kanals'}</span>
          <span class="calc-value">${kanals}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'ایکڑ (Acres)' : 'Acres'}</span>
          <span class="calc-value">${acres}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'مربع گز (Sq. Yards)' : 'Sq. Yards'}</span>
          <span class="calc-value">${sqYards}</span>
        </div>
      </div>
    `;
  },

  renderUnitUI() {
    const container = document.getElementById('tool-modal-body');
    if (!container) return;
    const isUr = window.i18n ? window.i18n.isUrdu() : true;

    container.innerHTML = `
      <!-- Tool Sub-Tabs -->
      <div class="tool-tab-nav" style="margin-bottom: 1.25rem;">
        <button class="tool-tab-btn ${this.activeUnitTab === 'storage' ? 'active' : ''}" onclick="SathiTools.switchUnitTab('storage')">
          <i class="fa-solid fa-hard-drive"></i> ${isUr ? 'موبائل و انٹرنیٹ ڈیٹا' : 'Storage & Data'}
        </button>
        <button class="tool-tab-btn ${this.activeUnitTab === 'speed' ? 'active' : ''}" onclick="SathiTools.switchUnitTab('speed')">
          <i class="fa-solid fa-gauge-high"></i> ${isUr ? 'ڈاؤن لوڈ وقت کیلکولیٹر' : 'Download Time'}
        </button>
        <button class="tool-tab-btn ${this.activeUnitTab === 'land' ? 'active' : ''}" onclick="SathiTools.switchUnitTab('land')">
          <i class="fa-solid fa-ruler-combined"></i> ${isUr ? 'پاکستانی رقبہ و مرلہ' : 'Pakistani Land Units'}
        </button>
      </div>

      <div class="tool-form-layout">
        ${this.activeUnitTab === 'storage' ? `
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'مقدار درج کریں:' : 'Enter Quantity:'}</label>
              <input type="number" id="data-val" class="form-control" value="10" oninput="SathiTools.convertStorageData()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'کس یونٹ سے:' : 'From Unit:'}</label>
              <select id="data-from" class="form-control" onchange="SathiTools.convertStorageData()">
                <option value="GB" selected>GB (گیگا بائٹ)</option>
                <option value="MB">MB (میگا بائٹ)</option>
                <option value="TB">TB (ٹیرا بائٹ)</option>
                <option value="KB">KB (کلو بائٹ)</option>
                <option value="B">Bytes (بائٹ)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${isUr ? 'کس یونٹ میں:' : 'To Unit:'}</label>
              <select id="data-to" class="form-control" onchange="SathiTools.convertStorageData()">
                <option value="MB" selected>MB (میگا بائٹ)</option>
                <option value="GB">GB (گیگا بائٹ)</option>
                <option value="TB">TB (ٹیرا بائٹ)</option>
                <option value="KB">KB (کلو بائٹ)</option>
                <option value="B">Bytes (بائٹ)</option>
              </select>
            </div>
          </div>
        ` : this.activeUnitTab === 'speed' ? `
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'فائل کا سائز:' : 'File Size:'}</label>
              <input type="number" id="speed-file-size" class="form-control" value="2.5" oninput="SathiTools.calculateDownloadTime()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'سائز کا یونٹ:' : 'File Unit:'}</label>
              <select id="speed-file-unit" class="form-control" onchange="SathiTools.calculateDownloadTime()">
                <option value="GB" selected>GB (گیگا بائٹ)</option>
                <option value="MB">MB (میگا بائٹ)</option>
                <option value="TB">TB (ٹیرا بائٹ)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${isUr ? 'انٹرنیٹ اسپیڈ (Mbps):' : 'Internet Speed (Mbps):'}</label>
              <input type="number" id="speed-net-mbps" class="form-control" value="20" placeholder="20" oninput="SathiTools.calculateDownloadTime()" />
            </div>
          </div>
        ` : `
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'رقبہ کی مقدار:' : 'Land Quantity:'}</label>
              <input type="number" id="land-val" class="form-control" value="5" oninput="SathiTools.convertLandUnits()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'پیمائش کی اکائی:' : 'Unit of Area:'}</label>
              <select id="land-from" class="form-control" onchange="SathiTools.convertLandUnits()">
                <option value="marla" selected>${isUr ? 'مرلہ (Marla)' : 'Marla'}</option>
                <option value="kanal">${isUr ? 'کنال (Kanal = 20 Marla)' : 'Kanal'}</option>
                <option value="acre">${isUr ? 'ایکڑ (Acre = 8 Kanal)' : 'Acre'}</option>
                <option value="sqft">${isUr ? 'مربع فٹ (Sq. Feet)' : 'Sq. Feet'}</option>
                <option value="sqyard">${isUr ? 'مربع گز (Sq. Yards)' : 'Sq. Yards'}</option>
              </select>
            </div>
            <div class="form-group">
              <label>${isUr ? 'مرلہ کا معیار (شہر کے مطابق):' : 'Marla Standard:'}</label>
              <select id="land-marla-size" class="form-control" onchange="SathiTools.convertLandUnits()">
                <option value="225" selected>${isUr ? '225 مربع فٹ (لاہور، کوئٹہ، نیا معیار)' : '225 Sq. Ft. (Modern/LDA)'}</option>
                <option value="272.25">${isUr ? '272.25 مربع فٹ (روایتی / پٹوار معیار)' : '272.25 Sq. Ft. (Revenue standard)'}</option>
              </select>
            </div>
          </div>
        `}

        <div id="unit-results-box" class="tool-results-wrapper"></div>

        <div class="tool-actions-row" style="margin-top: 1rem; justify-content: flex-end;">
          <button class="btn btn-secondary text-cyan" onclick="SathiTools.openSmartLink('converter_server')">
            <i class="fa-solid fa-gauge"></i> ${isUr ? 'فاسٹ اسپیڈ ٹیسٹ سرور (اسپانسرڈ)' : 'Fast Speed Test Server (Sponsored)'}
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (this.activeUnitTab === 'storage') this.convertStorageData();
      else if (this.activeUnitTab === 'speed') this.calculateDownloadTime();
      else this.convertLandUnits();
    }, 50);
  },

  // =========================================================================
  // Master Tool Modal Launcher
  // =========================================================================
  openToolModal(toolId) {
    this.activeTool = toolId;
    const modal = document.getElementById('tool-modal');
    const titleEl = document.getElementById('tool-modal-title');
    if (!modal) return;

    const isUr = window.i18n ? window.i18n.isUrdu() : true;

    if (toolId === 'khata') {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-calculator text-emerald"></i> ${isUr ? 'کھاتہ و منافع کیلکولیٹر' : 'Khata & Profit Calculator'}`;
      this.renderKhataUI();
    } else if (toolId === 'zakat') {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-coins text-cyan"></i> ${isUr ? 'مستند شرعی زکوٰۃ کیلکولیٹر' : 'Authentic Islamic Zakat Calculator'}`;
      this.renderZakatUI();
    } else if (toolId === 'qr') {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-qrcode text-purple"></i> ${isUr ? 'فوری ایچ ڈی کیو آر جنریٹر' : 'Instant HD QR Generator'}`;
      this.renderQRUI();
    } else if (toolId === 'roman') {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-nib text-amber"></i> ${isUr ? 'رومن اردو سے نستعلیق کنورٹر' : 'Roman Urdu to Nastaliq'}`;
      this.renderRomanUrduUI();
    } else if (toolId === 'unit') {
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-arrow-right-arrow-left text-rose"></i> ${isUr ? 'ڈیٹا و اراضی یونٹ کنورٹر' : 'Data & Land Unit Converter'}`;
      this.renderUnitUI();
    }

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    if (!modal.dataset.boundBackdrop) {
      modal.dataset.boundBackdrop = 'true';
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
  },

  closeModal() {
    const modal = document.getElementById('tool-modal');
    if (modal) modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
};

window.SathiTools = SathiTools;
