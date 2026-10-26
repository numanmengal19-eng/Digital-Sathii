/**
 * Database Module for Digital Sathi (ڈیجیٹل ساتھی)
 * Uses Node.js native DatabaseSync from node:sqlite
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

let dbPath = path.join(__dirname, 'digital_sathi.db');
if (process.env.VERCEL) {
  const tmpDb = path.join('/tmp', 'digital_sathi.db');
  try {
    if (!fs.existsSync(tmpDb) && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tmpDb);
    }
  } catch (e) {
    console.error('Error copying db to /tmp:', e);
  }
  dbPath = tmpDb;
}

const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance and integrity
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  console.log('PRAGMA error (ignored on serverless):', e.message);
}

// Initialize Tables
function initDatabase() {
  db.exec(`
    -- Admin Users Table
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      name TEXT,
      role TEXT DEFAULT 'superadmin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ur TEXT NOT NULL,
      icon TEXT NOT NULL,
      badge_color TEXT DEFAULT '#00e5ff',
      display_order INTEGER DEFAULT 0
    );

    -- Apps Table
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ur TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      version TEXT NOT NULL,
      size_mb REAL NOT NULL,
      package_name TEXT,
      min_android TEXT DEFAULT 'Android 8.0+',
      icon_url TEXT NOT NULL,
      banner_url TEXT,
      screenshots TEXT, -- JSON array of URLs
      short_desc_en TEXT,
      short_desc_ur TEXT,
      full_desc_en TEXT,
      full_desc_ur TEXT,
      changelog_en TEXT,
      changelog_ur TEXT,
      download_url TEXT NOT NULL,
      mirror_url TEXT,
      sha256 TEXT,
      rating REAL DEFAULT 4.8,
      rating_count INTEGER DEFAULT 120,
      downloads_count INTEGER DEFAULT 1500,
      is_featured INTEGER DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Files & PDFs Table
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_ur TEXT NOT NULL,
      category TEXT NOT NULL,
      file_type TEXT DEFAULT 'PDF',
      file_size TEXT NOT NULL,
      download_url TEXT NOT NULL,
      preview_url TEXT,
      desc_en TEXT,
      desc_ur TEXT,
      downloads_count INTEGER DEFAULT 250,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Service Inquiries Table
    CREATE TABLE IF NOT EXISTS service_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      service_type TEXT NOT NULL,
      budget_range TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, contacted, closed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Contact Messages Table
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Broken Link Reports Table
    CREATE TABLE IF NOT EXISTS broken_link_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER,
      app_name TEXT NOT NULL,
      download_url TEXT NOT NULL,
      user_note TEXT,
      status TEXT DEFAULT 'pending', -- pending, fixed, invalid
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Site Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  seedInitialData();
}

// Seed initial data if tables are empty
function seedInitialData() {
  // 1. Seed Admin
  const checkAdmin = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (checkAdmin.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@DigitalSathi2026', salt);
    const insertAdmin = db.prepare(`
      INSERT INTO admins (username, password_hash, email, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertAdmin.run('admin', hash, 'admin@digitalsathi.pk', 'Super Admin', 'superadmin');
    console.log('✔ Initial Super Admin seeded: admin / Admin@DigitalSathi2026');
  }

  // 2. Seed Categories
  const checkCats = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (checkCats.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (slug, name_en, name_ur, icon, badge_color, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const categories = [
      ['finance', 'Finance & Khata', 'مالیات اور کھاتہ', 'fa-wallet', '#10B981', 1],
      ['islamic', 'Islamic Apps', 'اسلامی ایپس', 'fa-mosque', '#06B6D4', 2],
      ['education', 'Education & Learning', 'تعلیم اور کورسز', 'fa-graduation-cap', '#3B82F6', 3],
      ['utilities', 'Tools & Utilities', 'مفید ٹولز و یوٹیلیٹیز', 'fa-screwdriver-wrench', '#F59E0B', 4],
      ['productivity', 'Productivity & Office', 'پروڈکٹیوٹی و آفس', 'fa-briefcase', '#8B5CF6', 5],
      ['media', 'Media & Editing', 'میڈیا اور ایڈیٹنگ', 'fa-photo-film', '#EC4899', 6]
    ];

    for (const cat of categories) {
      insertCat.run(...cat);
    }
    console.log('✔ Default Categories seeded');
  }

  // 3. Seed Apps
  const checkApps = db.prepare('SELECT COUNT(*) as count FROM apps').get();
  if (checkApps.count === 0) {
    const insertApp = db.prepare(`
      INSERT INTO apps (
        slug, name_en, name_ur, category_slug, version, size_mb, package_name, min_android,
        icon_url, banner_url, screenshots, short_desc_en, short_desc_ur,
        full_desc_en, full_desc_ur, changelog_en, changelog_ur,
        download_url, mirror_url, sha256, rating, rating_count, downloads_count,
        is_featured, is_popular, is_new, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const appsData = [
      [
        'digikhata-pro',
        'DigiKhata Pro — کھاتہ بک',
        'ڈیجی کھاتہ پرو — ڈیجیٹل رجسٹر',
        'finance',
        'v5.8.2',
        26.4,
        'pk.digikhata.app',
        'Android 7.0+',
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80'
        ]),
        '100% Free digital ledger and khata book for Pakistani shopkeepers and businesses.',
        'پاکستانی دکانداروں اور کاروبار کے لیے ادھار اور نقد کا 100% مفت اور محفوظ ڈیجیٹل کھاتہ۔',
        'DigiKhata Pro is your modern pocket accountant. Manage customer credits, generate PDF reports, send free SMS reminders, and back up your business data securely on cloud servers.',
        'ڈیجی کھاتہ پرو آپ کا ڈیجیٹل اکاؤنٹنٹ ہے۔ گاہکوں کا ادھار سنبھالیں، مفت ایس ایم ایس اور واٹس ایپ میسیجز بھیجیں، پی ڈی ایف کھاتہ رپورٹ ڈاؤن لوڈ کریں اور بیک اپ محفوظ رکھیں۔',
        '• Instant WhatsApp reminders\n• Enhanced PDF Khata Statement\n• Multi-currency support',
        '• فوری واٹس ایپ یاد دہانی\n• کھاتہ پی ڈی ایف رپورٹ میں بہتری\n• ملٹی بزنس اکاؤنٹ سپورٹ',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_DigiKhata_APK_Mirror',
        'https://download.digitalsathi.pk/apks/digikhata-pro-v5.8.2.apk',
        '8b7d9f2a4e1c8d5b3a9f0e2b1c4d8e7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e',
        4.9,
        3420,
        48500,
        1, 1, 0, 1
      ],
      [
        'quran-majeed-urdu',
        'Quran Majeed Urdu Translation & Audio',
        'قرآن مجید با ترجمہ و تلاوت آڈیو',
        'islamic',
        'v6.3.0',
        48.2,
        'com.pakdata.quranmajeed',
        'Android 6.0+',
        'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80'
        ]),
        'Complete Holy Quran with authentic Urdu translation, Tafseer, audio recitations, and Qibla finder.',
        'مستند اردو ترجمہ، تفسیر، خوبصورت تلاوت آڈیو اور قبلہ رخ معلوم کرنے کی جامع اسلامی ایپ۔',
        'Quran Majeed provides authentic 16-line and 15-line Mushaf, Word by Word translation, multiple Qaris audio, precise prayer times notification, and offline listening feature.',
        'قرآن مجید ایپ میں 16 سطری اور 15 سطری مصحف، لفظ بہ لفظ اردو ترجمہ، مشہور قراء کی تلاوت، نماز کے اوقات کی اذان الرٹس اور آف لائن ریڈنگ شامل ہے۔',
        '• Added High Quality Urdu Audio\n• Accurate Ramadan & Namaz times\n• Bug fixes for Android 14',
        '• اعلیٰ کوالٹی آڈیو تلاوت شامل\n• نماز کے صحیح اوقات کی نوٹیفکیشن\n• اینڈرائیڈ 14 کے لیے اصلاحات',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Quran_APK_Mirror',
        'https://download.digitalsathi.pk/apks/quran-majeed-v6.3.0.apk',
        '3c2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
        5.0,
        8900,
        92000,
        1, 1, 0, 1
      ],
      [
        'urdu-nastaliq-keyboard',
        'Easy Urdu Nastaliq Keyboard Pro',
        'آسان اردو نستعلیق کی بورڈ پرو',
        'utilities',
        'v4.1.2',
        18.6,
        'com.urdu.keyboard.nastaliq',
        'Android 7.0+',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
        ]),
        'Type in Roman Urdu and convert directly to Urdu Nastaliq font with voice typing.',
        'رومن اردو میں لکھیں اور خوبصورت جمیل نوری نستعلیق فونٹ میں خودکار تبدیل کریں۔ وائس ٹائپنگ شامل۔',
        'Write Urdu everywhere with ease. Converts phonetic Roman text into proper Urdu calligraphy instantly with custom themes, emojis, and speech-to-text.',
        'واٹس ایپ، فیس بک اور میسجز میں باآسانی نستعلیق اردو لکھیں۔ بول کر اردو لکھنے کی سہولت، نئے اردو اسٹیکرز اور خوبصورت تھیمز۔',
        '• Added Jameel Noori Nastaliq Preview\n• Faster Urdu word predictions\n• Reduced memory usage',
        '• جمیل نوری نستعلیق پیش نظارہ شامل\n• تیز رفتار الفاظ کی پیشین گوئی\n• میموری کا کم استعمال',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Urdu_KB_APK',
        'https://download.digitalsathi.pk/apks/urdu-keyboard-pro-v4.1.2.apk',
        '5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
        4.8,
        4150,
        64000,
        1, 1, 1, 1
      ],
      [
        'smart-pdf-scanner',
        'Smart PDF Scanner & Office Docs',
        'اسمارٹ پی ڈی ایف اسکینر و دستاویزات',
        'productivity',
        'v3.4.0',
        32.1,
        'com.sathi.pdfscanner',
        'Android 8.0+',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
        ]),
        'HD document scanner, Urdu OCR text extractor, digital signature and PDF merger.',
        'ایچ ڈی کیمرہ اسکینر، اردو اور انگریزی تحریر نکالنے والا OCR، ڈیجیٹل دستخط اور پی ڈی ایف ٹولز۔',
        'Turn your phone into a powerful portable scanner. Scan documents, CNIC cards, receipts, contracts, apply edge detection and watermarks in seconds.',
        'اپنے موبائل کو طاقتور اسکینر بنائیں۔ شناختی کارڈ، اسناد، بل اور دستاویزات اسکین کریں، سگنیچر لگائیں اور فوراً واٹس ایپ پر شیئر کریں۔',
        '• Ultra Clear HD enhancement filter\n• Urdu text OCR recognition\n• Password protect PDF files',
        '• الٹرا کلئیر ایچ ڈی فلٹر\n• اردو تحریر پڑھنے کا OCR انجن\n• پی ڈی ایف پر پاس ورڈ لگانے کا آپشن',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_PDFScanner_APK',
        'https://download.digitalsathi.pk/apks/smart-pdf-scanner-v3.4.0.apk',
        '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
        4.7,
        2900,
        37500,
        0, 1, 1, 1
      ],
      [
        'taleem-pakistan-learn',
        'Taleem Sathi — تعلیمی ساتھی',
        'تعلیم ساتھی — اسکول و اکیڈمی کورسز',
        'education',
        'v2.9.1',
        42.0,
        'pk.taleem.sathi',
        'Android 7.0+',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80'
        ]),
        'Matric, Inter, MDCAT, ECAT video lectures, past papers and online quizzes.',
        'میٹرک، ایف ایس سی، ایم ڈی کیٹ اور ای کیٹ کے ویڈیو لیکچرز، پاسٹ پیپرز اور ٹیسٹ سیریز۔',
        'All Pakistan board syllabus covered. Complete animated video lessons, solved past papers for 9th, 10th, 1st year, and 2nd year students.',
        'پنجاب، سندھ، کے پی کے اور فیڈرل بورڈ کا مکمل نصاب۔ نویں سے بارہویں جماعت کے حل شدہ پیپرز اور فوری ٹیسٹ سسٹم۔',
        '• 2026 Past papers added\n• Offline lecture download mode\n• Performance report card',
        '• 2026 کے نئے پاسٹ پیپرز شامل\n• آف لائن لیکچر ڈاؤن لوڈ کرنے کی سہولت\n• پرفارمنس رپورٹ کارڈ سسٹم',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Taleem_APK',
        'https://download.digitalsathi.pk/apks/taleem-sathi-v2.9.1.apk',
        '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        4.9,
        1890,
        29000,
        0, 0, 1, 1
      ],
      [
        'fast-video-maker-pro',
        'Video Studio Pro — اردو ویڈیو میکر',
        'ویڈیو اسٹوڈیو پرو — اردو شاعری و اسٹیٹس',
        'media',
        'v4.5.0',
        68.5,
        'com.sathi.videostudio',
        'Android 8.0+',
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
        ]),
        'Urdu poetry video maker, reels creator, 4K exporter with trending Pakistani transitions.',
        'اردو شاعری، واٹس ایپ اسٹیٹس اور سوشل میڈیا ریلز بنانے والا زبردست ویڈیو ایڈیٹر، بغیر واٹر مارک۔',
        'Design cinematic reels and TikToks with ready-made Urdu poetry templates, sound effects, trending audio, and no watermark export in 1080p and 4K.',
        'ریڈی میڈ اردو شاعری ٹیمپلیٹس، بیک گراؤنڈ میوزک، سلو موشن ایفیکٹس اور بغیر واٹر مارک 4K ویڈیو ایکسپورٹ۔',
        '• 100+ New Urdu Calligraphy fonts\n• Smooth 60fps export\n• Chroma Key Green screen',
        '• 100 سے زائد نئے اردو فونٹس شامل\n• اسموتھ 60fps ویڈیو ایکسپورٹ\n• گرین اسکرین کروماکی فیچر',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_VideoStudio_APK',
        'https://download.digitalsathi.pk/apks/video-studio-pro-v4.5.0.apk',
        '7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
        4.8,
        3100,
        51000,
        1, 1, 0, 1
      ],
      [
        'pak-namaz-qibla-pro',
        'Namaz Timings & Qibla Compass Pro',
        'نماز کے اوقات، اذان الرٹ و قبلہ نما',
        'islamic',
        'v3.1.0',
        14.2,
        'pk.namaz.qibla.pro',
        'Android 6.0+',
        'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&auto=format&fit=crop&q=80'
        ]),
        'Accurate Pakistan prayer times with GPS, automatic Azan alarms, and 3D Qibla direction.',
        'پاکستان کے تمام شہروں کے لیے مستند اوقاتِ نماز، خودکار اذان الرٹس اور تھری ڈی قبلہ رخ۔',
        'Never miss your Salah. Calculates exact timings according to Karachi / Hanafi / Jafari methods with offline compass and digital Tasbeeh counter.',
        'نماز فجر، ظہر، عصر، مغرب، عشاء اور تہجد کے درست ترین اوقات۔ ڈیجیٹل تسبیح کاؤنٹر، اور مسنون دعائیں بغیر انٹرنیٹ کے دستیاب۔',
        '• Sehri & Iftar countdown\n• Silent mode during Namaz\n• New Ramadan Calendar 2026',
        '• سحری و افطاری کا کاؤنٹ ڈاؤن\n• نماز کے دوران موبائل خودکار سائلنٹ\n• نیا رمضان کیلنڈر 2026',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Namaz_APK',
        'https://download.digitalsathi.pk/apks/namaz-qibla-v3.1.0.apk',
        '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        4.9,
        5200,
        78000,
        0, 1, 0, 1
      ],
      [
        'safe-vpn-shield',
        'Sathi VPN Shield — فاسٹ اینڈ سیکیور',
        'ساتھی وی پی این شیلڈ — تیز رفتار و محفوظ',
        'utilities',
        'v2.1.8',
        21.0,
        'com.sathi.vpnshield',
        'Android 7.0+',
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=160&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
        ]),
        'Ultra-fast, unmetered encrypted connection for safe browsing and streaming.',
        'تیز رفتار، محفوظ اور انکرپٹڈ کنکشن جو آپ کی پرائیویسی کو مکمل تحفظ فراہم کرے۔',
        'Military-grade 256-bit encryption protects your identity on public Wi-Fi networks with high-speed global servers and zero data logging policy.',
        'عوامی وائی فائی پر محفوظ انٹرنیٹ براؤزنگ۔ کوئی ڈیٹا لاگ نہیں رکھا جاتا اور تیز رفتار گلوبل سرورز مفت دستیاب ہیں۔',
        '• Added Singapore & Dubai low-ping nodes\n• Kill switch feature enabled\n• Zero ads experience',
        '• سنگاپور اور دبئی کے تیز رفتار سرورز\n• خودکار کِل سوئچ پروٹیکشن\n• اشتہارات کے بغیر تجربہ',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_VPN_APK',
        'https://download.digitalsathi.pk/apks/sathi-vpn-v2.1.8.apk',
        '4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e',
        4.7,
        2840,
        36000,
        0, 0, 1, 1
      ]
    ];

    for (const app of appsData) {
      insertApp.run(...app);
    }
    console.log('✔ Initial 8 Verified Apps seeded');
  }

  // 4. Seed Files & PDFs
  const checkFiles = db.prepare('SELECT COUNT(*) as count FROM files').get();
  if (checkFiles.count === 0) {
    const insertFile = db.prepare(`
      INSERT INTO files (
        title_en, title_ur, category, file_type, file_size, download_url, preview_url,
        desc_en, desc_ur, downloads_count, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const filesData = [
      [
        'Business Khata & Ledger Sheet 2026',
        'کاروباری کھاتہ و رجسٹر شیٹ 2026 (ایکسل و پی ڈی ایف)',
        'Business',
        'XLSX / PDF',
        '2.4 MB',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Khata_Sheet',
        'https://drive.google.com/file/d/1Ex_Sample_Khata_Sheet/preview',
        'Complete printable and digital ledger book for daily transactions, debits, and credits.',
        'چھوٹے و بڑے کاروبار، دکانوں اور تاجروں کے لیے مکمل ڈیجیٹل اور پرنٹ ایبل کھاتہ بک۔',
        3820,
        1
      ],
      [
        'Complete Urdu Freelancing Roadmap 2026',
        'مکمل فری لانسنگ گائیڈ و آن لائن روزگار روڈ میپ',
        'Career',
        'PDF',
        '5.8 MB',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Freelance_Roadmap',
        'https://drive.google.com/file/d/1Ex_Sample_Freelance_Roadmap/preview',
        'A comprehensive step-by-step Urdu book on how to earn from Upwork, Fiverr, Web, and Graphic Design in Pakistan.',
        'پاکستان میں اپ ورک، فائیور، ویب اور گرافک ڈیزائننگ سے آن لائن حلال روزگار کمانے کی جامع کتاب۔',
        6410,
        1
      ],
      [
        'Quranic Duas & Daily Supplications (Urdu)',
        'مسنون دعائیں اور قرآنی وظائف با ترجمہ',
        'Islamic',
        'PDF',
        '3.1 MB',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Quran_Duas',
        'https://drive.google.com/file/d/1Ex_Sample_Quran_Duas/preview',
        'Authentic daily morning, evening, and situational prayers with clear Arabic text and Urdu translation.',
        'مستند صبح و شام کی مسنون دعائیں، بیماری، پریشانی اور ہر موقع کی دعائیں اردو ترجمہ کے ساتھ۔',
        9150,
        1
      ],
      [
        'Computer & Keyboard Shortcuts Handbook',
        'کمپیوٹر اور کی بورڈ کے مفید شارٹ کٹس کی کتاب',
        'Technology',
        'PDF',
        '1.9 MB',
        'https://drive.google.com/uc?export=download&id=1Ex_Sample_Computer_Shortcuts',
        'https://drive.google.com/file/d/1Ex_Sample_Computer_Shortcuts/preview',
        'Master Windows 11, MS Office, Excel, and Chrome with hundreds of productivity boosting shortcuts.',
        'ونڈوز 11، مائیکروسافٹ ایکسل، ورڈ اور انٹرنیٹ براؤزنگ کو تیز بنانے والے سیکڑوں شارٹ کٹس۔',
        4230,
        1
      ]
    ];

    for (const f of filesData) {
      insertFile.run(...f);
    }
    console.log('✔ Initial Useful Files seeded');
  }

  // 5. Seed Settings
  const checkSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (checkSettings.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('site_name_en', 'Digital Sathi');
    insertSetting.run('site_name_ur', 'ڈیجیٹل ساتھی');
    insertSetting.run('contact_whatsapp', '+92 300 1234567');
    insertSetting.run('contact_email', 'contact@digitalsathi.pk');
    insertSetting.run('ads_enabled', 'false');
    insertSetting.run('telegram_channel', 'https://t.me/digitalsathiofficial');
    insertSetting.run('announcement_text_ur', 'خوش آمدید! ڈیجیٹل ساتھی کے تمام اے پی کے اور فائلیں 100% ٹیسٹ شدہ اور محفوظ ہیں۔');
    insertSetting.run('announcement_text_en', 'Welcome to Digital Sathi! All APKs and files are 100% verified, clean, and tested.');
    console.log('✔ Default Settings initialized');
  }
}

initDatabase();

module.exports = {
  db,
  initDatabase
};
