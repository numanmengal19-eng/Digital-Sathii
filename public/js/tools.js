/**
 * Interactive Web & Mobile Tools Suite for Digital Sathi (ڈیجیٹل ساتھی)
 * 100% Real, Client-Side Calculations and Utility Engines
 */

const SathiTools = {
  // Current active tool in modal
  activeTool: null,

  // 1. Khata & Profit Calculator
  calculateKhata() {
    const sales = parseFloat(document.getElementById('khata-sales')?.value) || 0;
    const cost = parseFloat(document.getElementById('khata-cost')?.value) || 0;
    const expenses = parseFloat(document.getElementById('khata-expenses')?.value) || 0;
    const udhaarGiven = parseFloat(document.getElementById('khata-udhaar-given')?.value) || 0;
    const udhaarTaken = parseFloat(document.getElementById('khata-udhaar-taken')?.value) || 0;

    const grossProfit = sales - cost;
    const netProfit = grossProfit - expenses;
    const margin = sales > 0 ? ((netProfit / sales) * 100).toFixed(1) : 0;
    const balance = grossProfit - udhaarGiven + udhaarTaken;

    const resultBox = document.getElementById('khata-results');
    if (!resultBox) return;

    const isUr = window.i18n && window.i18n.isUrdu();

    let statusText = isUr ? 'منافع بخش (مبارک ہو!)' : 'Profitable (Congratulations!)';
    let statusClass = 'status-positive';
    if (netProfit < 0) {
      statusText = isUr ? 'خسارہ (احتیاط کی ضرورت ہے)' : 'Loss (Caution required)';
      statusClass = 'status-negative';
    } else if (netProfit === 0) {
      statusText = isUr ? 'برابر (بریک ایون)' : 'Break-Even';
      statusClass = 'status-neutral';
    }

    resultBox.innerHTML = `
      <div class="calc-metric-grid">
        <div class="calc-metric-card ${statusClass}">
          <span class="calc-label">${isUr ? 'خالص منافع (Net Profit)' : 'Net Profit'}</span>
          <span class="calc-value">Rs. ${netProfit.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'منافع کی شرح (Margin)' : 'Profit Margin'}</span>
          <span class="calc-value">${margin}%</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'گاہکوں سے لینے والا ادھار' : 'Receivable Credits'}</span>
          <span class="calc-value">Rs. ${udhaarGiven.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'سپلائرز کو دینے والے پیسے' : 'Payable Debts'}</span>
          <span class="calc-value">Rs. ${udhaarTaken.toLocaleString()}</span>
        </div>
      </div>
      <div class="calc-status-badge ${statusClass}">
        <i class="fa-solid fa-chart-line"></i> ${statusText}
      </div>
      <div class="tool-actions-row">
        <button class="btn btn-primary" onclick="SathiTools.printKhataStatement(${sales}, ${cost}, ${expenses}, ${netProfit}, ${margin}, ${udhaarGiven}, ${udhaarTaken})">
          <i class="fa-solid fa-print"></i> ${isUr ? 'کھاتہ رسید پرنٹ یا محفوظ کریں' : 'Print / Save Statement'}
        </button>
      </div>
    `;
  },

  printKhataStatement(sales, cost, expenses, netProfit, margin, udhaarGiven, udhaarTaken) {
    const isUr = window.i18n && window.i18n.isUrdu();
    const dateStr = new Date().toLocaleDateString(isUr ? 'ur-PK' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="${isUr ? 'ur' : 'en'}" dir="${isUr ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8">
        <title>Digital Sathi - Khata Statement</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 30px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #00e5ff; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: bold; color: #0b192c; }
          .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: ${isUr ? 'right' : 'left'}; }
          th { background: #f1f5f9; font-weight: 600; }
          .total-row { font-weight: bold; background: #e0f2fe; color: #0369a1; font-size: 16px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Digital Sathi — ڈیجیٹل ساتھی</div>
          <div>${isUr ? 'کاروباری کھاتہ و منافع رپورٹ' : 'Business Khata & Profit Report'}</div>
          <div class="meta">${isUr ? 'تاریخ:' : 'Date:'} ${dateStr}</div>
        </div>
        <table>
          <tr><th>${isUr ? 'تفصیل' : 'Description'}</th><th>${isUr ? 'رقم (روپے)' : 'Amount (PKR)'}</th></tr>
          <tr><td>${isUr ? 'کل سیلز / آمدن' : 'Total Sales / Revenue'}</td><td>Rs. ${sales.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'سامان کی خریداری / لاگت' : 'Product Cost'}</td><td>Rs. ${cost.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'دکان و ملازمین کے اخراجات' : 'Operating Expenses'}</td><td>Rs. ${expenses.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'گاہکوں کے ذمے بقایا ادھار' : 'Receivable Credits'}</td><td>Rs. ${udhaarGiven.toLocaleString()}</td></tr>
          <tr><td>${isUr ? 'سپلائرز کے ذمے ادھار' : 'Payable Debts'}</td><td>Rs. ${udhaarTaken.toLocaleString()}</td></tr>
          <tr class="total-row"><td>${isUr ? 'خالص منافع (Net Profit)' : 'Net Profit'}</td><td>Rs. ${netProfit.toLocaleString()} (${margin}%)</td></tr>
        </table>
        <div class="footer">
          Generated via Digital Sathi Business Suite • www.digitalsathi.pk
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  // 2. Islamic Zakat Calculator
  calculateZakat() {
    const goldGrams = parseFloat(document.getElementById('zakat-gold-grams')?.value) || 0;
    const goldRate = parseFloat(document.getElementById('zakat-gold-rate')?.value) || 285000 / 11.66; // Approx per gram rate if tola is ~285k
    const silverGrams = parseFloat(document.getElementById('zakat-silver-grams')?.value) || 0;
    const silverRate = parseFloat(document.getElementById('zakat-silver-rate')?.value) || 3200 / 11.66;
    const cash = parseFloat(document.getElementById('zakat-cash')?.value) || 0;
    const stock = parseFloat(document.getElementById('zakat-stock')?.value) || 0;
    const liabilities = parseFloat(document.getElementById('zakat-liabilities')?.value) || 0;

    const goldTotal = goldGrams * goldRate;
    const silverTotal = silverGrams * silverRate;
    const grossWealth = goldTotal + silverTotal + cash + stock;
    const netWealth = Math.max(0, grossWealth - liabilities);

    // Silver Nisab: 52.5 Tolas = approx 612.36 grams
    const silverNisabValue = 612.36 * silverRate;
    const isEligible = netWealth >= silverNisabValue;
    const zakatPayable = isEligible ? Math.round(netWealth * 0.025) : 0;

    const resultBox = document.getElementById('zakat-results');
    if (!resultBox) return;

    const isUr = window.i18n && window.i18n.isUrdu();

    resultBox.innerHTML = `
      <div class="calc-metric-grid">
        <div class="calc-metric-card ${isEligible ? 'status-positive' : 'status-neutral'}">
          <span class="calc-label">${isUr ? 'واجب الادا زکوٰۃ (2.5%)' : 'Payable Zakat (2.5%)'}</span>
          <span class="calc-value">Rs. ${zakatPayable.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'خالص قابلِ زکوٰۃ مالیت' : 'Net Zakat-Eligible Wealth'}</span>
          <span class="calc-value">Rs. ${netWealth.toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'شرعی نصاب کی مالیت (چاندی)' : 'Shariah Nisab Threshold'}</span>
          <span class="calc-value">Rs. ${Math.round(silverNisabValue).toLocaleString()}</span>
        </div>
        <div class="calc-metric-card">
          <span class="calc-label">${isUr ? 'منہا شدہ قرضہ جات' : 'Deducted Liabilities'}</span>
          <span class="calc-value">Rs. ${liabilities.toLocaleString()}</span>
        </div>
      </div>
      <div class="calc-status-badge ${isEligible ? 'status-positive' : 'status-neutral'}">
        <i class="fa-solid ${isEligible ? 'fa-check-circle' : 'fa-info-circle'}"></i> 
        ${isEligible 
          ? (isUr ? 'ماشاءاللہ! آپ کا مال شرعی نصاب کو پہنچتا ہے، لہٰذا 2.5 فیصد زکوٰۃ ادا کرنا فرض ہے۔' : 'Your wealth exceeds the Nisab threshold. Zakat of 2.5% is due.')
          : (isUr ? 'آپ کا مال شرعی نصاب سے کم ہے، فی الحال زکوٰۃ واجب نہیں ہے۔' : 'Your wealth is below the Nisab threshold. Zakat is not mandatory.')}
      </div>
    `;
  },

  // 3. Instant QR Code Generator
  generateQRCode() {
    const type = document.getElementById('qr-type')?.value || 'url';
    let data = '';

    if (type === 'url' || type === 'text') {
      data = document.getElementById('qr-input-text')?.value?.trim();
    } else if (type === 'whatsapp') {
      let phone = document.getElementById('qr-phone')?.value?.trim() || '';
      const msg = encodeURIComponent(document.getElementById('qr-wa-msg')?.value?.trim() || 'اسلام علیکم Digital Sathi');
      phone = phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '92' + phone.substring(1);
      data = `https://wa.me/${phone}?text=${msg}`;
    } else if (type === 'wifi') {
      const ssid = document.getElementById('qr-wifi-ssid')?.value?.trim() || '';
      const pass = document.getElementById('qr-wifi-pass')?.value?.trim() || '';
      const encryption = document.getElementById('qr-wifi-type')?.value || 'WPA';
      data = `WIFI:T:${encryption};S:${ssid};P:${pass};;`;
    }

    const container = document.getElementById('qr-output-container');
    if (!container) return;

    if (!data) {
      container.innerHTML = `<p class="tool-hint">${window.i18n.isUrdu() ? 'براہِ کرم کیو آر کوڈ کے لیے معلومات درج کریں۔' : 'Please provide content to generate QR code.'}</p>`;
      return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}&margin=10`;

    container.innerHTML = `
      <div class="qr-preview-box">
        <img id="generated-qr-img" src="${qrUrl}" alt="Digital Sathi QR Code" class="qr-img-display" crossorigin="anonymous" />
        <div class="qr-preview-data">${data.substring(0, 45)}${data.length > 45 ? '...' : ''}</div>
        <div class="tool-actions-row">
          <a href="${qrUrl}" download="digital_sathi_qr.png" target="_blank" class="btn btn-primary">
            <i class="fa-solid fa-download"></i> ${window.i18n.isUrdu() ? 'کیو آر ڈاؤن لوڈ کریں (PNG)' : 'Download QR Code'}
          </a>
        </div>
      </div>
    `;
  },

  // 4. Roman Urdu to Nastaliq Converter
  convertRomanUrdu() {
    const input = document.getElementById('roman-urdu-input')?.value || '';
    const outputEl = document.getElementById('urdu-script-output');
    if (!outputEl) return;

    if (!input.trim()) {
      outputEl.value = '';
      return;
    }

    // Phonetic mapping dictionary for roman urdu
    const urduMap = {
      'aap': 'آپ', 'tum': 'تم', 'mein': 'میں', 'main': 'میں', 'hum': 'ہم',
      'kaise': 'کیسے', 'kaisi': 'کیسی', 'kaisa': 'کیسا', 'ho': 'ہو', 'hain': 'ہیں',
      'hai': 'ہے', 'shukriya': 'شکریہ', 'salam': 'سلام', 'assalam': 'السلام',
      'alaikum': 'علیکم', 'allah': 'اللہ', 'theek': 'ٹھیک', 'acha': 'اچھا',
      'achi': 'اچھی', 'bhai': 'بھائی', 'bohat': 'بہت', 'bahut': 'بہت',
      'shukria': 'شکریہ', 'kya': 'کیا', 'kyun': 'کیوں', 'kaha': 'کہاں',
      'kab': 'کب', 'kon': 'کون', 'yeh': 'یہ', 'woh': 'وہ', 'aur': 'اور',
      'lekin': 'لیکن', 'magar': 'مگر', 'bhi': 'بھی', 'nahi': 'نہیں',
      'nhi': 'نہیں', 'haan': 'ہاں', 'han': 'ہاں', 'ji': 'جی', 'jee': 'جی',
      'kitab': 'کتاب', 'khata': 'کھاتہ', 'dukan': 'دکان', 'paisa': 'پیسہ',
      'paise': 'پیسے', 'rupay': 'روپے', 'roz': 'روز', 'kaam': 'کام',
      'shab': 'شب', 'subah': 'صبح', 'shaam': 'شام', 'dost': 'دوست',
      'sathi': 'ساتھی', 'digital': 'ڈیجیٹل', 'mobile': 'موبائل', 'app': 'ایپ'
    };

    // Replace words
    const words = input.split(/(\s+|[.,!?:;])/);
    const converted = words.map(w => {
      const lower = w.toLowerCase();
      if (urduMap[lower]) {
        return urduMap[lower];
      }
      return w;
    }).join('');

    outputEl.value = converted;
  },

  copyUrduScript() {
    const outputEl = document.getElementById('urdu-script-output');
    if (!outputEl || !outputEl.value) return;
    navigator.clipboard.writeText(outputEl.value).then(() => {
      alert(window.i18n.isUrdu() ? 'اردو تحریر کاپی ہو گئی!' : 'Urdu text copied to clipboard!');
    });
  },

  shareUrduWhatsApp() {
    const outputEl = document.getElementById('urdu-script-output');
    if (!outputEl || !outputEl.value) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(outputEl.value)}`;
    window.open(url, '_blank');
  },

  // 5. Data Storage & Unit Converter
  convertDataUnits() {
    const val = parseFloat(document.getElementById('data-unit-val')?.value) || 0;
    const from = document.getElementById('data-unit-from')?.value || 'GB';
    const to = document.getElementById('data-unit-to')?.value || 'MB';

    // Base in Bytes
    const factors = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };

    const inBytes = val * (factors[from] || 1);
    const result = inBytes / (factors[to] || 1);

    const resultBox = document.getElementById('data-unit-result');
    if (!resultBox) return;

    resultBox.innerHTML = `
      <div class="unit-result-display">
        <strong>${val.toLocaleString()} ${from}</strong> = <span class="highlight-cyan">${result.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to}</span>
      </div>
    `;
  },

  // Modal Launcher for Tools
  openToolModal(toolId) {
    this.activeTool = toolId;
    const modal = document.getElementById('tool-modal');
    const container = document.getElementById('tool-modal-body');
    const titleEl = document.getElementById('tool-modal-title');
    if (!modal || !container) return;

    const isUr = window.i18n && window.i18n.isUrdu();

    if (toolId === 'khata') {
      titleEl.innerText = isUr ? 'کھاتہ و منافع کیلکولیٹر' : 'Khata & Profit Calculator';
      container.innerHTML = `
        <div class="tool-form-layout">
          <p class="tool-subtitle">${isUr ? 'روزمرہ کاروبار کا نفع، نقصان اور ادھار منٹوں میں محفوظ کریں:' : 'Easily calculate business profits, expenses, and credits:'}</p>
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'کل سیلز / آمدن (روپے):' : 'Total Sales / Revenue (PKR):'}</label>
              <input type="number" id="khata-sales" class="form-control" placeholder="100000" oninput="SathiTools.calculateKhata()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'سامان کی خریداری / لاگت (روپے):' : 'Cost of Goods / Purchases (PKR):'}</label>
              <input type="number" id="khata-cost" class="form-control" placeholder="70000" oninput="SathiTools.calculateKhata()" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'دکان و روزمرہ اخراجات (کرایہ، بل):' : 'Operating Expenses (Rent, Bills):'}</label>
              <input type="number" id="khata-expenses" class="form-control" placeholder="10000" oninput="SathiTools.calculateKhata()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'گاہکوں کا بقایا ادھار (وصول طلب):' : 'Customer Credits (Receivable):'}</label>
              <input type="number" id="khata-udhaar-given" class="form-control" placeholder="5000" oninput="SathiTools.calculateKhata()" />
            </div>
          </div>
          <div class="form-group">
            <label>${isUr ? 'سپلائرز کے ذمے ادھار (واجب الادا):' : 'Supplier Debts (Payable):'}</label>
            <input type="number" id="khata-udhaar-taken" class="form-control" placeholder="3000" oninput="SathiTools.calculateKhata()" />
          </div>
          <div id="khata-results" class="tool-results-wrapper"></div>
        </div>
      `;
      setTimeout(() => this.calculateKhata(), 100);
    } else if (toolId === 'zakat') {
      titleEl.innerText = isUr ? 'مستند شرعی زکوٰۃ کیلکولیٹر' : 'Authentic Islamic Zakat Calculator';
      container.innerHTML = `
        <div class="tool-form-layout">
          <p class="tool-subtitle">${isUr ? 'شرعی اصولوں کے مطابق چاندی و سونے کے نصاب پر 2.5 فیصد زکوٰۃ کا حساب:' : 'Calculate exact 2.5% Zakat based on Islamic Shariah Nisab:'}</p>
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'سونے کا وزن (گرام):' : 'Gold Weight (Grams):'}</label>
              <input type="number" id="zakat-gold-grams" class="form-control" placeholder="0" oninput="SathiTools.calculateZakat()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'سونے کا فی گرام ریٹ (روپے):' : 'Gold Rate per Gram (PKR):'}</label>
              <input type="number" id="zakat-gold-rate" class="form-control" value="24500" oninput="SathiTools.calculateZakat()" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'چاندی کا وزن (گرام):' : 'Silver Weight (Grams):'}</label>
              <input type="number" id="zakat-silver-grams" class="form-control" placeholder="0" oninput="SathiTools.calculateZakat()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'چاندی کا فی گرام ریٹ (روپے):' : 'Silver Rate per Gram (PKR):'}</label>
              <input type="number" id="zakat-silver-rate" class="form-control" value="280" oninput="SathiTools.calculateZakat()" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'موجودہ نقد رقم و بینک بیلنس (روپے):' : 'Cash in Hand & Bank Accounts (PKR):'}</label>
              <input type="number" id="zakat-cash" class="form-control" placeholder="500000" oninput="SathiTools.calculateZakat()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'کاروباری مالِ تجارت کی قیمت (روپے):' : 'Business Trade Goods Value (PKR):'}</label>
              <input type="number" id="zakat-stock" class="form-control" placeholder="200000" oninput="SathiTools.calculateZakat()" />
            </div>
          </div>
          <div class="form-group">
            <label>${isUr ? 'فوری قابلِ ادائیگی قرضہ جات (منہا):' : 'Immediate Deductible Liabilities (PKR):'}</label>
            <input type="number" id="zakat-liabilities" class="form-control" placeholder="50000" oninput="SathiTools.calculateZakat()" />
          </div>
          <div id="zakat-results" class="tool-results-wrapper"></div>
        </div>
      `;
      setTimeout(() => this.calculateZakat(), 100);
    } else if (toolId === 'qr') {
      titleEl.innerText = isUr ? 'فوری کیو آر کوڈ جنریٹر' : 'Instant QR Code Generator';
      container.innerHTML = `
        <div class="tool-form-layout">
          <div class="form-group">
            <label>${isUr ? 'کیو آر کوڈ کی قسم منتخب کریں:' : 'Select QR Code Type:'}</label>
            <select id="qr-type" class="form-control" onchange="SathiTools.onQRTypeChange()">
              <option value="url">${isUr ? 'ویب سائٹ لنک (URL)' : 'Website URL'}</option>
              <option value="whatsapp">${isUr ? 'واٹس ایپ ڈائریکٹ چیٹ' : 'WhatsApp Chat Link'}</option>
              <option value="wifi">${isUr ? 'وائی فائی نیٹ ورک (Wi-Fi)' : 'Wi-Fi Network'}</option>
              <option value="text">${isUr ? 'سادہ تحریر (Plain Text)' : 'Plain Text'}</option>
            </select>
          </div>
          <div id="qr-dynamic-fields">
            <div class="form-group">
              <label>${isUr ? 'ویب سائٹ کا لنک درج کریں:' : 'Enter Website URL:'}</label>
              <input type="text" id="qr-input-text" class="form-control" placeholder="https://digitalsathi.pk" />
            </div>
          </div>
          <div class="tool-actions-row">
            <button class="btn btn-primary" onclick="SathiTools.generateQRCode()">
              <i class="fa-solid fa-qrcode"></i> ${isUr ? 'کیو آر کوڈ بنائیں' : 'Generate QR Code'}
            </button>
          </div>
          <div id="qr-output-container"></div>
        </div>
      `;
      setTimeout(() => this.generateQRCode(), 100);
    } else if (toolId === 'roman') {
      titleEl.innerText = isUr ? 'رومن اردو سے نستعلیق کنورٹر' : 'Roman Urdu to Nastaliq Converter';
      container.innerHTML = `
        <div class="tool-form-layout">
          <p class="tool-subtitle">${isUr ? 'انگریزی میں رومن اردو لکھیں (مثلاً "aap kaise hain") اور نستعلیق خودکار حاصل کریں:' : 'Type phonetic Roman Urdu to get authentic Urdu script:'}</p>
          <div class="form-group">
            <label>${isUr ? 'رومن اردو یہاں ٹائپ کریں:' : 'Type Roman Urdu here:'}</label>
            <textarea id="roman-urdu-input" class="form-control" rows="3" placeholder="salam aap kaise hain shukriya bhai..." oninput="SathiTools.convertRomanUrdu()"></textarea>
          </div>
          <div class="form-group">
            <label>${isUr ? 'خوبصورت نستعلیق اردو رسم الخط:' : 'Urdu Nastaliq Output:'}</label>
            <textarea id="urdu-script-output" class="form-control urdu-font" rows="3" readonly></textarea>
          </div>
          <div class="tool-actions-row">
            <button class="btn btn-primary" onclick="SathiTools.copyUrduScript()">
              <i class="fa-solid fa-copy"></i> ${isUr ? 'تحریر کاپی کریں' : 'Copy Text'}
            </button>
            <button class="btn btn-success" onclick="SathiTools.shareUrduWhatsApp()">
              <i class="fa-brands fa-whatsapp"></i> ${isUr ? 'واٹس ایپ پر شیئر کریں' : 'Share on WhatsApp'}
            </button>
          </div>
        </div>
      `;
    } else if (toolId === 'unit') {
      titleEl.innerText = isUr ? 'ڈیٹا و اسٹوریج یونٹ کنورٹر' : 'Data Storage & Unit Converter';
      container.innerHTML = `
        <div class="tool-form-layout">
          <div class="form-row">
            <div class="form-group">
              <label>${isUr ? 'مقدار درج کریں:' : 'Enter Quantity:'}</label>
              <input type="number" id="data-unit-val" class="form-control" value="10" oninput="SathiTools.convertDataUnits()" />
            </div>
            <div class="form-group">
              <label>${isUr ? 'کس یونٹ سے:' : 'From Unit:'}</label>
              <select id="data-unit-from" class="form-control" onchange="SathiTools.convertDataUnits()">
                <option value="GB" selected>GB (گیگا بائٹ)</option>
                <option value="MB">MB (میگا بائٹ)</option>
                <option value="TB">TB (ٹیرا بائٹ)</option>
                <option value="KB">KB (کلو بائٹ)</option>
                <option value="B">Bytes (بائٹ)</option>
              </select>
            </div>
            <div class="form-group">
              <label>${isUr ? 'کس یونٹ میں:' : 'To Unit:'}</label>
              <select id="data-unit-to" class="form-control" onchange="SathiTools.convertDataUnits()">
                <option value="MB" selected>MB (میگا بائٹ)</option>
                <option value="GB">GB (گیگا بائٹ)</option>
                <option value="TB">TB (ٹیرا بائٹ)</option>
                <option value="KB">KB (کلو بائٹ)</option>
                <option value="B">Bytes (بائٹ)</option>
              </select>
            </div>
          </div>
          <div id="data-unit-result" class="tool-results-wrapper"></div>
        </div>
      `;
      setTimeout(() => this.convertDataUnits(), 100);
    }

    modal.classList.add('active');
  },

  onQRTypeChange() {
    const type = document.getElementById('qr-type')?.value;
    const fields = document.getElementById('qr-dynamic-fields');
    if (!fields) return;
    const isUr = window.i18n && window.i18n.isUrdu();

    if (type === 'whatsapp') {
      fields.innerHTML = `
        <div class="form-group">
          <label>${isUr ? 'واٹس ایپ موبائل نمبر (مثال: 03001234567):' : 'WhatsApp Phone Number (e.g. 03001234567):'}</label>
          <input type="text" id="qr-phone" class="form-control" placeholder="03001234567" />
        </div>
        <div class="form-group">
          <label>${isUr ? 'ابتدائی میسج:' : 'Predefined Message:'}</label>
          <input type="text" id="qr-wa-msg" class="form-control" placeholder="السلام علیکم! معلومات درکار ہیں۔" />
        </div>
      `;
    } else if (type === 'wifi') {
      fields.innerHTML = `
        <div class="form-group">
          <label>${isUr ? 'وائی فائی نیٹ ورک کا نام (SSID):' : 'Wi-Fi Network Name (SSID):'}</label>
          <input type="text" id="qr-wifi-ssid" class="form-control" placeholder="MyHome_WiFi" />
        </div>
        <div class="form-group">
          <label>${isUr ? 'پاس ورڈ:' : 'Password:'}</label>
          <input type="password" id="qr-wifi-pass" class="form-control" placeholder="Secret123" />
        </div>
        <div class="form-group">
          <label>${isUr ? 'سیکیورٹی قسم:' : 'Encryption:'}</label>
          <select id="qr-wifi-type" class="form-control">
            <option value="WPA">WPA / WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">None (Open)</option>
          </select>
        </div>
      `;
    } else {
      fields.innerHTML = `
        <div class="form-group">
          <label>${isUr ? 'ویب سائٹ کا لنک یا تحریر:' : 'Website URL or Content:'}</label>
          <input type="text" id="qr-input-text" class="form-control" placeholder="https://digitalsathi.pk" />
        </div>
      `;
    }
  },

  closeModal() {
    const modal = document.getElementById('tool-modal');
    if (modal) modal.classList.remove('active');
  }
};

window.SathiTools = SathiTools;
