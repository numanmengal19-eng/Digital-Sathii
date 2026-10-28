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
  // 1. Seed & Ensure Super Admin Accounts
  const salt = bcrypt.genSaltSync(10);
  const numanHash = bcrypt.hashSync('abid12@#12', salt);
  const defaultHash = bcrypt.hashSync('Admin@DigitalSathi2026', salt);

  const existingNuman = db.prepare(`
    SELECT id FROM admins WHERE LOWER(username) = 'numanmengal19' OR LOWER(email) = 'numanmengal19@gmail.com'
  `).get();

  if (!existingNuman) {
    db.prepare(`
      INSERT INTO admins (username, password_hash, email, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('numanmengal19', numanHash, 'numanmengal19@gmail.com', 'Numan Mengal', 'superadmin');
    console.log('✔ Numan Mengal Admin seeded: numanmengal19@gmail.com');
  } else {
    db.prepare(`
      UPDATE admins SET password_hash = ?, email = 'numanmengal19@gmail.com' WHERE id = ?
    `).run(numanHash, existingNuman.id);
  }

  const existingAdmin = db.prepare(`
    SELECT id FROM admins WHERE LOWER(username) = 'admin' OR LOWER(email) = 'admin@digitalsathi.pk'
  `).get();

  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO admins (username, password_hash, email, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', defaultHash, 'admin@digitalsathi.pk', 'Super Admin', 'superadmin');
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

  // 3. Apps: Real Published Apps (یہاں اپنی ایپس اور ڈاؤن لوڈ لنکس شامل کریں)
  try {
    db.exec("DELETE FROM apps WHERE download_url LIKE '%Sample%' OR download_url LIKE '%sample%'");
  } catch (e) {}

  const realApps = [
    {
      slug: 'capcut-pro',
      name_en: 'CapCut Pro',
      name_ur: 'کیپ کٹ پرو (ویڈیو ایڈیٹر)',
      category_slug: 'media',
      version: 'v12.5.0',
      size_mb: 85.0,
      package_name: 'com.lemon.lvoverseas',
      min_android: 'Android 8.0+',
      icon_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=160&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      short_desc_en: 'CapCut Pro Mod APK with all premium unlocked features, transitions, and no watermark.',
      short_desc_ur: 'کیپ کٹ پرو: بغیر واٹر مارک تمام پریمیم فیچرز، 4K ویڈیو ایکسپورٹ اور فلٹرز کے ساتھ۔',
      full_desc_en: 'CapCut Pro is the best video editor for Android with unlocked pro filters, smooth transitions, and high quality 60fps export.',
      full_desc_ur: 'کیپ کٹ پرو اینڈرائڈ کا جدید ترین ویڈیو ایڈیٹر ہے۔ اس میں تمام پریمیم ٹرانزیشنز، فلٹرز اور نو واٹر مارک شامل ہیں۔',
      changelog_en: '• All VIP filters & effects unlocked\n• No watermark\n• 4K 60FPS export',
      changelog_ur: '• تمام پریمیم فلٹرز اور ایفیکٹس ان لاکڈ\n• بغیر واٹر مارک کے ایکسپورٹ\n• 4K 60FPS سپورٹ',
      download_url: 'https://drive.google.com/uc?export=download&id=YOUR_CAPCUT_LINK_HERE', // <<< اپنا کیپ کٹ کا ڈاؤن لوڈ لنک یہاں پیسٹ کریں
      mirror_url: '',
      sha256: 'capcut_pro_verified_clean',
      is_featured: 1,
      is_popular: 1,
      is_new: 1,
      is_published: 1
    }
  ];

  for (const app of realApps) {
    const existing = db.prepare('SELECT id FROM apps WHERE slug = ?').get(app.slug);
    if (!existing) {
      db.prepare(`
        INSERT INTO apps (
          slug, name_en, name_ur, category_slug, version, size_mb, package_name, min_android,
          icon_url, banner_url, screenshots, short_desc_en, short_desc_ur,
          full_desc_en, full_desc_ur, changelog_en, changelog_ur,
          download_url, mirror_url, sha256, is_featured, is_popular, is_new, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        app.slug, app.name_en, app.name_ur, app.category_slug, app.version, app.size_mb,
        app.package_name, app.min_android, app.icon_url, app.banner_url, '[]',
        app.short_desc_en, app.short_desc_ur, app.full_desc_en, app.full_desc_ur,
        app.changelog_en, app.changelog_ur, app.download_url, app.mirror_url,
        app.sha256, app.is_featured, app.is_popular, app.is_new, app.is_published
      );
    } else {
      db.prepare('UPDATE apps SET download_url = ?, version = ?, size_mb = ? WHERE id = ?').run(
        app.download_url, app.version, app.size_mb, existing.id
      );
    }
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
    insertSetting.run('ads_enabled', 'true');
    insertSetting.run('telegram_channel', 'https://t.me/digitalsathiofficial');
    insertSetting.run('announcement_text_ur', 'خوش آمدید! ڈیجیٹل ساتھی کے تمام اے پی کے اور فائلیں 100% ٹیسٹ شدہ اور محفوظ ہیں۔');
    insertSetting.run('announcement_text_en', 'Welcome to Digital Sathi! All APKs and files are 100% verified, clean, and tested.');
    console.log('✔ Default Settings initialized');
  }

  // Ensure ads_enabled is true and smartlink_url is active
  try {
    db.prepare("INSERT INTO settings (key, value) VALUES ('ads_enabled', 'true') ON CONFLICT(key) DO UPDATE SET value = 'true'").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('smartlink_url', 'https://asiafilm.org/4/287f73384fbfeabc56339e802400ab51') ON CONFLICT(key) DO UPDATE SET value = 'https://asiafilm.org/4/287f73384fbfeabc56339e802400ab51'").run();
  } catch(e) {}
}

initDatabase();

module.exports = {
  db,
  initDatabase
};
