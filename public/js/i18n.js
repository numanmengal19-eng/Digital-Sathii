/**
 * Internationalization (i18n) Module for Digital Sathi (ڈیجیٹل ساتھی)
 * High-quality Urdu & English translations with RTL/LTR management
 */

const translations = {
  ur: {
    // Brand & Header
    brand_name: "ڈیجیٹل ساتھی",
    brand_subtitle: "ایپ اسٹور و ڈیجیٹل حب",
    search_placeholder: "ایپس، ٹولز یا فائلیں تلاش کریں...",
    nav_home: "ہوم",
    nav_apps: "ایپ اسٹور",
    nav_tools: "مفید ٹولز",
    nav_files: "پی ڈی ایف و فائلیں",
    nav_services: "ہماری خدمات",
    nav_about: "ہمارے بارے میں",
    nav_contact: "رابطہ کریں",
    nav_admin: "ایڈمن پینل",
    login_btn: "ایڈمن لاگ ان",
    dashboard_btn: "ڈیش بورڈ",

    // Announcement Bar
    announcement_badge: "تصدیق شدہ سیکیورٹی",
    announcement_text: "ڈیجیٹل ساتھی کے تمام اے پی کے اور فائلیں 100% ٹیسٹ شدہ اور وائرس سے پاک ہیں۔",
    lang_toggle_text: "English",

    // Hero Section
    hero_badge: "پاکستان کا جدید ترین ٹیک و ایپ پلیٹ فارم 2026",
    hero_title: "آپ کا قابلِ اعتماد ایپ اسٹور اور",
    hero_title_highlight: "ڈیجیٹل ساتھی",
    hero_desc: "محفوظ اور تیز رفتار اینڈرائڈ ایپس (APKs)، روزمرہ کے مفید کاروباری و اسلامی ٹولز، مستند دستاویزات اور پیشہ ورانہ سافٹ ویئر سروسز — سب ایک ہی جگہ۔",
    hero_btn_explore: "ایپس ڈاؤن لوڈ کریں",
    hero_btn_services: "ہماری خدمات دیکھیں",
    stat_verified_apps: "تصدیق شدہ ایپس",
    stat_safe_downloads: "محفوظ ڈاؤن لوڈز",
    stat_clean_guarantee: "وائرس سے پاک گارنٹی",
    stat_active_users: "مطمئن صارفین",

    // Categories
    cat_all: "تمام ایپس",
    cat_finance: "کھاتہ و مالیات",
    cat_islamic: "اسلامی ایپس",
    cat_education: "تعلیم و کورسز",
    cat_utilities: "مفید ٹولز",
    cat_productivity: "پروڈکٹیوٹی",
    cat_media: "میڈیا و ایڈیٹنگ",

    // Section Titles
    popular_apps_title: "مشہور اور مقبول ترین ایپس",
    popular_apps_sub: "ہمارے صارفین کی سب سے زیادہ ڈاؤن لوڈ کردہ مستند ایپس",
    new_apps_title: "تازہ ترین ریلیزز",
    new_apps_sub: "نئی شامل کردہ ایپس اور تازہ ترین ورژنز",
    tools_section_title: "مفید آن لائن ٹولز",
    tools_section_sub: "بغیر انسٹال کیے فوری استعمال ہونے والے اسمارٹ ٹولز",
    files_section_title: "پی ڈی ایف اور مفید دستاویزات",
    files_section_sub: "کاروباری کھاتہ شیٹس، اسلامی گائیڈز اور رہبرِ روزگار",
    services_section_title: "ہماری پیشہ ورانہ خدمات",
    services_section_sub: "جدید موبائل ایپس، خوبصورت ویب سائٹس اور برانڈنگ ڈیزائن",
    why_us_title: "ہمیں کیوں منتخب کریں؟",
    faq_title: "اکثر پوچھے جانے والے سوالات (FAQs)",
    contact_section_title: "ہم سے رابطہ کریں",
    contact_section_sub: "کسی بھی سوال، تجاویز یا پروجیکٹ کے لیے ہماری ٹیم حاضر ہے",

    // App Card
    btn_download_apk: "ڈاؤن لوڈ APK",
    btn_view_details: "تفصیلات",
    badge_featured: "نمایاں",
    badge_popular: "مقبول",
    badge_new: "نیا ورژن",
    label_size: "سائز:",
    label_version: "ورژن:",
    label_downloads: "ڈاؤن لوڈز:",

    // App Detail Modal
    app_specs: "تکنیکی تفصیلات",
    spec_package: "پیکیج کا نام",
    spec_min_android: "کم از کم اینڈرائیڈ",
    spec_last_updated: "آخری اپ ڈیٹ",
    spec_file_size: "فائل کا سائز",
    spec_checksum: "SHA-256 ہیش",
    spec_security: "سیکیورٹی جانچ",
    security_clean: "کلین و محفوظ (Malware-Free)",
    tab_overview: "جائزہ",
    tab_screenshots: "اسکرین شاٹس",
    tab_changelog: "کیا نیا ہے؟",
    server_drive: "گوگل ڈرائیو سرور (تیز رفتار)",
    server_direct: "ڈیجیٹل ساتھی ڈائریکٹ سرور",
    btn_report_broken: "خراب لنک کی رپورٹ کریں",

    // Download Verification Flow
    download_modal_title: "محفوظ ڈاؤن لوڈنگ سسٹم",
    download_verifying: "لنک کی تصدیق اور سیکیورٹی اسکین جاری ہے...",
    download_verified_desc: "فائل کا سائز اور ڈیجیٹل دستخط کامیابی سے تصدیق ہو چکے ہیں۔",
    download_ready: "آپ کی فائل ڈاؤن لوڈ کے لیے تیار ہے!",
    download_btn_now: "براہِ راست ڈاؤن لوڈ کریں",
    download_countdown_prefix: "خودکار ڈاؤن لوڈ شروع ہونے میں باقی:",
    download_seconds: "سیکنڈ",
    download_link_copy: "لنک کاپی کریں",
    copied_alert: "لنک کاپی ہو گیا!",

    // Tools
    tool_khata_title: "کھاتہ و منافع کیلکولیٹر",
    tool_khata_desc: "دکان و کاروبار کی آمدن، خرچ، ادھار اور خالص منافع کا فوری حساب لگائیں۔",
    tool_zakat_title: "مستند زکوٰۃ کیلکولیٹر",
    tool_zakat_desc: "سونے، چاندی، نقدی اور مالِ تجارت پر شرعی اصولوں کے مطابق زکوٰۃ معلوم کریں۔",
    tool_qr_title: "کیو آر کوڈ جنریٹر",
    tool_qr_desc: "واٹس ایپ، ویب سائٹ، فائی یا کسی بھی تحریر کا فوری ایچ ڈی کیو آر بنائیں۔",
    tool_roman_title: "رومن اردو سے نستعلیق کنورٹر",
    tool_roman_desc: "انگریزی حروف میں اردو ٹائپ کریں اور جمیل نوری نستعلیق رسم الخط پائیں۔",
    tool_unit_title: "ڈیٹا و یونٹ کنورٹر",
    tool_unit_desc: "موبائل ڈیٹا (MB, GB, TB) اور پیمائش کے مختلف یونٹس کو فوری تبدیل کریں۔",
    btn_open_tool: "ٹول استعمال کریں",

    // Services
    service_app_title: "موبائل ایپ ڈویلپمنٹ",
    service_app_desc: "اینڈرائیڈ اور آئی او ایس کے لیے تیز رفتار، محفوظ اور خوبصورت نیٹیو و فلوٹر ایپس۔",
    service_web_title: "ویب سائٹ و پورٹل ڈویلپمنٹ",
    service_web_desc: "ریسپانسو، جدید ڈیزائن اور گوگل سرچ میں سرِفہرست آنے والی جدید ویب سائٹس۔",
    service_graphic_title: "گرافک ڈیزائننگ و برانڈنگ",
    service_graphic_desc: "پیشہ ورانہ لوگو ڈیزائن، سوشل میڈیا پوسٹس، بینرز اور مکمل برانڈ شناخت۔",
    btn_get_quote: "قیمت معلوم کریں / آرڈر دیں",

    // Common Buttons & Messages
    btn_close: "بند کریں",
    btn_submit: "ارسال کریں",
    loading: "لوڈ ہو رہا ہے...",
    no_results: "کوئی ریکارڈ نہیں ملا۔",
    success_submit: "آپ کی درخواست کامیابی سے موصول ہو گئی ہے۔",

    // Footer
    footer_tagline: "پاکستان کا قابلِ اعتماد پورٹل برائے ایپس، ٹولز اور ڈیجیٹل خدمات۔",
    footer_quick_links: "فوری لنکس",
    footer_categories: "مقبول کیٹیگریز",
    footer_legal: "قانونی معلومات",
    privacy_policy: "پرائیویسی پالیسی",
    terms_conditions: "شرائط و ضوابط",
    disclaimer: "ڈس کلیمر",
    copyright: "© 2026 ڈیجیٹل ساتھی۔ جملہ حقوق محفوظ ہیں۔"
  },

  en: {
    // Brand & Header
    brand_name: "Digital Sathi",
    brand_subtitle: "App Store & Digital Hub",
    search_placeholder: "Search apps, tools, or files...",
    nav_home: "Home",
    nav_apps: "App Store",
    nav_tools: "Tools",
    nav_files: "Files & PDFs",
    nav_services: "Services",
    nav_about: "About Us",
    nav_contact: "Contact",
    nav_admin: "Admin",
    login_btn: "Admin Login",
    dashboard_btn: "Dashboard",

    // Announcement Bar
    announcement_badge: "Verified Security",
    announcement_text: "All Digital Sathi APKs and files are 100% verified, clean, and malware-free.",
    lang_toggle_text: "اردو",

    // Hero Section
    hero_badge: "Next-Gen Tech Hub & App Store 2026",
    hero_title: "Your Trusted App Store &",
    hero_title_highlight: "Digital Sathi",
    hero_desc: "Verified, lightning-fast Android APKs, everyday utility tools, authentic documents, and enterprise IT services — all in one powerful platform.",
    hero_btn_explore: "Browse Apps",
    hero_btn_services: "Explore Services",
    stat_verified_apps: "Verified Apps",
    stat_safe_downloads: "Safe Downloads",
    stat_clean_guarantee: "Malware-Free Guarantee",
    stat_active_users: "Happy Users",

    // Categories
    cat_all: "All Apps",
    cat_finance: "Finance & Khata",
    cat_islamic: "Islamic Apps",
    cat_education: "Education & Courses",
    cat_utilities: "Tools & Utilities",
    cat_productivity: "Productivity",
    cat_media: "Media & Editing",

    // Section Titles
    popular_apps_title: "Popular & Featured Apps",
    popular_apps_sub: "Most downloaded and highly rated apps by our community",
    new_apps_title: "New Releases",
    new_apps_sub: "Latest version releases and newly added tools",
    tools_section_title: "Interactive Web & Mobile Tools",
    tools_section_sub: "Smart online tools that work instantly without installation",
    files_section_title: "PDF & Useful Documents Library",
    files_section_sub: "Free business ledger sheets, Islamic guides, and career roadmaps",
    services_section_title: "Professional Tech Services",
    services_section_sub: "Bespoke Mobile Apps, High-Converting Websites, and Brand Design",
    why_us_title: "Why Choose Digital Sathi?",
    faq_title: "Frequently Asked Questions (FAQs)",
    contact_section_title: "Get in Touch with Us",
    contact_section_sub: "Have an inquiry, feedback, or a project in mind? We are here to help.",

    // App Card
    btn_download_apk: "Download APK",
    btn_view_details: "View Details",
    badge_featured: "Featured",
    badge_popular: "Popular",
    badge_new: "New Release",
    label_size: "Size:",
    label_version: "Version:",
    label_downloads: "Downloads:",

    // App Detail Modal
    app_specs: "Technical Specifications",
    spec_package: "Package Name",
    spec_min_android: "Requires Android",
    spec_last_updated: "Last Updated",
    spec_file_size: "File Size",
    spec_checksum: "SHA-256 Hash",
    spec_security: "Security Scan",
    security_clean: "100% Clean & Verified",
    tab_overview: "Overview",
    tab_screenshots: "Screenshots",
    tab_changelog: "What's New",
    server_drive: "Google Drive High-Speed Mirror",
    server_direct: "Digital Sathi Direct CDN",
    btn_report_broken: "Report Broken Link",

    // Download Verification Flow
    download_modal_title: "Safe Download System",
    download_verifying: "Verifying mirror link & scanning file integrity...",
    download_verified_desc: "File integrity and digital certificates have been successfully validated.",
    download_ready: "Your file is ready to download!",
    download_btn_now: "Download Direct APK Now",
    download_countdown_prefix: "Your download will start automatically in:",
    download_seconds: "seconds",
    download_link_copy: "Copy Direct Link",
    copied_alert: "Download link copied!",

    // Tools
    tool_khata_title: "Khata & Profit Calculator",
    tool_khata_desc: "Calculate revenue, costs, customer credits, and net profit margins instantly.",
    tool_zakat_title: "Authentic Zakat Calculator",
    tool_zakat_desc: "Accurately calculate Zakat on Gold, Silver, Cash, and trade inventory.",
    tool_qr_title: "Instant QR Code Generator",
    tool_qr_desc: "Create HD QR codes for Websites, WhatsApp chats, Wi-Fi, or custom text.",
    tool_roman_title: "Roman Urdu to Nastaliq Converter",
    tool_roman_desc: "Type phonetic Roman Urdu and get beautiful Jameel Nastaliq Urdu script.",
    tool_unit_title: "Data Storage & Unit Converter",
    tool_unit_desc: "Convert mobile data (MB, GB, TB) and physical measurements seamlessly.",
    btn_open_tool: "Launch Tool",

    // Services
    service_app_title: "Mobile App Development",
    service_app_desc: "Native Android & Flutter applications crafted for performance and smooth UX.",
    service_web_title: "Website & Portal Development",
    service_web_desc: "Fast, responsive, and SEO-engineered web platforms designed to impress.",
    service_graphic_title: "Graphic Design & Branding",
    service_graphic_desc: "Professional logos, social media marketing kits, and full visual brand identity.",
    btn_get_quote: "Get a Quote / Book Order",

    // Common Buttons & Messages
    btn_close: "Close",
    btn_submit: "Submit",
    loading: "Loading...",
    no_results: "No records found.",
    success_submit: "Your request has been submitted successfully.",

    // Footer
    footer_tagline: "Pakistan's premier destination for verified apps, smart tools, and tech services.",
    footer_quick_links: "Quick Links",
    footer_categories: "Top Categories",
    footer_legal: "Legal Information",
    privacy_policy: "Privacy Policy",
    terms_conditions: "Terms & Conditions",
    disclaimer: "Disclaimer",
    copyright: "© 2026 Digital Sathi. All rights reserved."
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('sathi_lang') || 'ur';
    this.listeners = [];
  }

  getLang() {
    return this.currentLang;
  }

  isUrdu() {
    return this.currentLang === 'ur';
  }

  t(key) {
    const dict = translations[this.currentLang] || translations.ur;
    return dict[key] || translations.en[key] || key;
  }

  setLang(lang) {
    if (lang !== 'ur' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('sathi_lang', lang);
    this.applyToDOM();
    this.listeners.forEach(fn => fn(lang));
  }

  toggleLang() {
    const next = this.currentLang === 'ur' ? 'en' : 'ur';
    this.setLang(next);
  }

  onLangChange(fn) {
    this.listeners.push(fn);
  }

  applyToDOM() {
    const isUr = this.isUrdu();
    document.documentElement.lang = isUr ? 'ur' : 'en';
    document.documentElement.dir = isUr ? 'rtl' : 'ltr';

    if (isUr) {
      document.body.classList.add('rtl-mode');
      document.body.classList.remove('ltr-mode');
    } else {
      document.body.classList.add('ltr-mode');
      document.body.classList.remove('rtl-mode');
    }

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  }
}

const i18n = new I18nManager();
window.i18n = i18n;
