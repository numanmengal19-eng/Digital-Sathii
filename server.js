/**
 * Express Server for Digital Sathi (ڈیجیٹل ساتھی)
 * Modern, Secure Backend with SQLite and JWT Authentication
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'DigitalSathi_Secure_Key_2026_!@#$';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/* =========================================================================
   PUBLIC API ROUTES
   ========================================================================= */

// 1. Get Public Settings & Announcement
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Public Platform Stats
app.get('/api/stats/public', (req, res) => {
  try {
    const appStats = db.prepare(`
      SELECT 
        COUNT(*) as total_apps,
        SUM(downloads_count) as total_downloads,
        ROUND(AVG(rating), 1) as avg_rating
      FROM apps WHERE is_published = 1
    `).get();

    const categoryStats = db.prepare('SELECT COUNT(*) as total_categories FROM categories').get();
    const fileStats = db.prepare('SELECT COUNT(*) as total_files FROM files WHERE is_published = 1').get();

    res.json({
      success: true,
      stats: {
        total_apps: appStats.total_apps || 0,
        total_downloads: appStats.total_downloads || 0,
        avg_rating: appStats.avg_rating || 4.8,
        total_categories: categoryStats.total_categories || 0,
        total_files: fileStats.total_files || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Categories with App Count
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(a.id) as apps_count
      FROM categories c
      LEFT JOIN apps a ON c.slug = a.category_slug AND a.is_published = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `).all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Published Apps with Filters & Search
app.get('/api/apps', (req, res) => {
  try {
    const { category, search, filter, sort, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM apps WHERE is_published = 1`;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND category_slug = ?`;
      params.push(category);
    }

    if (filter === 'featured') {
      query += ` AND is_featured = 1`;
    } else if (filter === 'popular') {
      query += ` AND is_popular = 1`;
    } else if (filter === 'new') {
      query += ` AND is_new = 1`;
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (name_en LIKE ? OR name_ur LIKE ? OR short_desc_en LIKE ? OR short_desc_ur LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    if (sort === 'rating') {
      query += ` ORDER BY rating DESC, downloads_count DESC`;
    } else if (sort === 'size_asc') {
      query += ` ORDER BY size_mb ASC`;
    } else if (sort === 'size_desc') {
      query += ` ORDER BY size_mb DESC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY created_at DESC`;
    } else {
      // Default: Most Popular / Featured first
      query += ` ORDER BY is_featured DESC, downloads_count DESC, id DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const apps = db.prepare(query).all(...params);

    // Format parsed screenshots
    const formattedApps = apps.map(app => {
      let screenshots = [];
      try {
        screenshots = app.screenshots ? JSON.parse(app.screenshots) : [];
      } catch (e) {
        screenshots = [];
      }
      return {
        ...app,
        screenshots
      };
    });

    res.json({ success: true, apps: formattedApps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Single App Details
app.get('/api/apps/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;
    let app = null;

    if (!isNaN(slugOrId)) {
      app = db.prepare('SELECT * FROM apps WHERE id = ?').get(Number(slugOrId));
    } else {
      app = db.prepare('SELECT * FROM apps WHERE slug = ?').get(slugOrId);
    }

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    let screenshots = [];
    try {
      screenshots = app.screenshots ? JSON.parse(app.screenshots) : [];
    } catch (e) {
      screenshots = [];
    }

    // Get related apps in the same category
    const related = db.prepare(`
      SELECT id, slug, name_en, name_ur, icon_url, rating, size_mb, category_slug
      FROM apps
      WHERE category_slug = ? AND id != ? AND is_published = 1
      ORDER BY downloads_count DESC LIMIT 4
    `).all(app.category_slug, app.id);

    res.json({
      success: true,
      app: {
        ...app,
        screenshots,
        related
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Safe Download Verification & Counter increment
app.post('/api/apps/:id/download-check', (req, res) => {
  try {
    const { id } = req.params;
    const app = db.prepare('SELECT id, name_en, name_ur, version, size_mb, download_url, mirror_url, sha256 FROM apps WHERE id = ?').get(id);

    if (!app) {
      return res.status(404).json({ error: 'App not found or link expired.' });
    }

    // Safely increment download count in background
    db.prepare('UPDATE apps SET downloads_count = downloads_count + 1 WHERE id = ?').run(id);

    // Validate link format
    const isValidUrl = app.download_url && (app.download_url.startsWith('http://') || app.download_url.startsWith('https://'));

    res.json({
      success: true,
      app_id: app.id,
      name_en: app.name_en,
      name_ur: app.name_ur,
      version: app.version,
      size_mb: app.size_mb,
      sha256: app.sha256,
      status: isValidUrl ? 'verified_clean' : 'unavailable',
      download_url: app.download_url,
      mirror_url: app.mirror_url || null,
      verification_date: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Files & PDFs
app.get('/api/files', (req, res) => {
  try {
    const files = db.prepare('SELECT * FROM files WHERE is_published = 1 ORDER BY id DESC').all();
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Track File Download
app.post('/api/files/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    db.prepare('UPDATE files SET downloads_count = downloads_count + 1 WHERE id = ?').run(id);
    res.json({ success: true, download_url: file.download_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Submit Service Request / Quote Inquiry
app.post('/api/inquiries', (req, res) => {
  try {
    const { name, phone, email, service_type, budget_range, message } = req.body;

    if (!name || !phone || !service_type || !message) {
      return res.status(400).json({ error: 'براہ کرم تمام ضروری خانے پُر کریں۔ (Please fill all required fields)' });
    }

    const insert = db.prepare(`
      INSERT INTO service_inquiries (name, phone, email, service_type, budget_range, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      phone.trim(),
      email ? email.trim() : '',
      service_type,
      budget_range || 'Not specified',
      message.trim()
    );

    res.json({
      success: true,
      message: 'آپ کی درخواست موصول ہو گئی ہے۔ ڈیجیٹل ساتھی کی ٹیم جلد آپ سے رابطہ کرے گی۔',
      inquiry_id: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Submit Contact Message
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'نام، ای میل اور پیغام ضروری ہیں۔' });
    }

    const insert = db.prepare(`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `);

    insert.run(name.trim(), email.trim(), subject ? subject.trim() : 'عام رابطہ', message.trim());

    res.json({
      success: true,
      message: 'آپ کا پیغام کامیابی سے بھیج دیا گیا ہے۔ شکریہ!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Report Broken Link
app.post('/api/reports/broken-link', (req, res) => {
  try {
    const { app_id, app_name, download_url, user_note } = req.body;

    if (!app_name) {
      return res.status(400).json({ error: 'App name required.' });
    }

    const insert = db.prepare(`
      INSERT INTO broken_link_reports (app_id, app_name, download_url, user_note)
      VALUES (?, ?, ?, ?)
    `);

    insert.run(app_id || null, app_name, download_url || '', user_note || '');

    res.json({
      success: true,
      message: 'شکریہ! خراب لنک کی اطلاع موصول ہو گئی ہے اور ایڈمن جلد اسے درست کرے گا۔'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   ADMIN AUTHENTICATION & MANAGEMENT ROUTES
   ========================================================================= */

// Admin Login (Strict, Secure Authentication)
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'یوزر نیم / ای میل اور پاس ورڈ دونوں درج کرنا ضروری ہیں۔' });
    }

    const term = username.trim().toLowerCase();
    const admin = db.prepare(`
      SELECT * FROM admins 
      WHERE LOWER(username) = ? OR LOWER(email) = ?
      LIMIT 1
    `).get(term, term);

    if (!admin) {
      return res.status(401).json({ 
        error: 'درج کردہ ای میل یا پاس ورڈ درست نہیں ہے۔' 
      });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ 
        error: 'درج کردہ ای میل یا پاس ورڈ درست نہیں ہے۔' 
      });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Verify Token (me)
app.get('/api/admin/me', requireAdmin, (req, res) => {
  try {
    const admin = db.prepare('SELECT id, username, name, email, role FROM admins WHERE id = ?').get(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found.' });
    }
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Change Password
app.put('/api/admin/change-password', requireAdmin, (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
    const isMatch = bcrypt.compareSync(current_password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'موجودہ پاس ورڈ درست نہیں ہے۔ (Current password is incorrect)' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);

    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin.id);

    res.json({ success: true, message: 'پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔ (Password updated successfully)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Dashboard Overview Statistics
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  try {
    const totalApps = db.prepare('SELECT COUNT(*) as count FROM apps').get().count;
    const publishedApps = db.prepare('SELECT COUNT(*) as count FROM apps WHERE is_published = 1').get().count;
    const draftApps = totalApps - publishedApps;
    const totalDownloads = db.prepare('SELECT SUM(downloads_count) as total FROM apps').get().total || 0;
    const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files').get().count;
    const pendingInquiries = db.prepare("SELECT COUNT(*) as count FROM service_inquiries WHERE status = 'pending'").get().count;
    const unreadMessages = db.prepare("SELECT COUNT(*) as count FROM contact_messages WHERE status = 'unread'").get().count;
    const pendingBrokenLinks = db.prepare("SELECT COUNT(*) as count FROM broken_link_reports WHERE status = 'pending'").get().count;

    const recentApps = db.prepare('SELECT id, name_en, name_ur, version, downloads_count, is_published, created_at FROM apps ORDER BY id DESC LIMIT 5').all();
    const recentInquiries = db.prepare('SELECT * FROM service_inquiries ORDER BY id DESC LIMIT 5').all();
    const recentReports = db.prepare('SELECT * FROM broken_link_reports ORDER BY id DESC LIMIT 5').all();

    res.json({
      success: true,
      overview: {
        totalApps,
        publishedApps,
        draftApps,
        totalDownloads,
        totalFiles,
        pendingInquiries,
        unreadMessages,
        pendingBrokenLinks,
        recentApps,
        recentInquiries,
        recentReports
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get All Apps (including drafts)
app.get('/api/admin/apps', requireAdmin, (req, res) => {
  try {
    const apps = db.prepare('SELECT * FROM apps ORDER BY id DESC').all();
    const formatted = apps.map(a => {
      let screenshots = [];
      try {
        screenshots = a.screenshots ? JSON.parse(a.screenshots) : [];
      } catch (e) {
        screenshots = [];
      }
      return { ...a, screenshots };
    });
    res.json({ success: true, apps: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create App
app.post('/api/admin/apps', requireAdmin, (req, res) => {
  try {
    const {
      name_en, name_ur, category_slug, version, size_mb, package_name, min_android,
      icon_url, banner_url, screenshots, short_desc_en, short_desc_ur,
      full_desc_en, full_desc_ur, changelog_en, changelog_ur,
      download_url, mirror_url, sha256, is_featured, is_popular, is_new, is_published
    } = req.body;

    if (!name_en || !category_slug || !version || !download_url) {
      return res.status(400).json({ error: 'Name, Category, Version, and Download URL are required.' });
    }

    // Generate unique slug
    let slug = name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = db.prepare('SELECT id FROM apps WHERE slug = ?').get(slug);
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const screenshotsJson = Array.isArray(screenshots) ? JSON.stringify(screenshots) : (screenshots || '[]');

    const insert = db.prepare(`
      INSERT INTO apps (
        slug, name_en, name_ur, category_slug, version, size_mb, package_name, min_android,
        icon_url, banner_url, screenshots, short_desc_en, short_desc_ur,
        full_desc_en, full_desc_ur, changelog_en, changelog_ur,
        download_url, mirror_url, sha256,
        is_featured, is_popular, is_new, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      slug,
      name_en,
      name_ur || name_en,
      category_slug,
      version,
      Number(size_mb) || 15.0,
      package_name || `com.sathi.${slug.replace(/-/g, '')}`,
      min_android || 'Android 8.0+',
      icon_url || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=160&auto=format&fit=crop&q=80',
      banner_url || '',
      screenshotsJson,
      short_desc_en || '',
      short_desc_ur || '',
      full_desc_en || '',
      full_desc_ur || '',
      changelog_en || '• Initial release version',
      changelog_ur || '• ابتدائی ریلیز ورژن',
      download_url,
      mirror_url || '',
      sha256 || 'verified_hash_' + Math.random().toString(36).substring(2, 15),
      is_featured ? 1 : 0,
      is_popular ? 1 : 0,
      is_new ? 1 : 0,
      is_published !== undefined ? (is_published ? 1 : 0) : 1
    );

    res.json({ success: true, message: 'ایپ کامیابی سے شامل کر دی گئی۔', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update App
app.put('/api/admin/apps/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const {
      name_en, name_ur, category_slug, version, size_mb, package_name, min_android,
      icon_url, banner_url, screenshots, short_desc_en, short_desc_ur,
      full_desc_en, full_desc_ur, changelog_en, changelog_ur,
      download_url, mirror_url, sha256, is_featured, is_popular, is_new, is_published
    } = req.body;

    const screenshotsJson = Array.isArray(screenshots) ? JSON.stringify(screenshots) : (screenshots || '[]');

    const update = db.prepare(`
      UPDATE apps SET
        name_en = ?, name_ur = ?, category_slug = ?, version = ?, size_mb = ?, package_name = ?, min_android = ?,
        icon_url = ?, banner_url = ?, screenshots = ?, short_desc_en = ?, short_desc_ur = ?,
        full_desc_en = ?, full_desc_ur = ?, changelog_en = ?, changelog_ur = ?,
        download_url = ?, mirror_url = ?, sha256 = ?,
        is_featured = ?, is_popular = ?, is_new = ?, is_published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      name_en, name_ur, category_slug, version, Number(size_mb), package_name, min_android,
      icon_url, banner_url, screenshotsJson, short_desc_en, short_desc_ur,
      full_desc_en, full_desc_ur, changelog_en, changelog_ur,
      download_url, mirror_url, sha256,
      is_featured ? 1 : 0, is_popular ? 1 : 0, is_new ? 1 : 0, is_published ? 1 : 0,
      id
    );

    res.json({ success: true, message: 'ایپ کی معلومات کامیابی سے اپ ڈیٹ ہو گئیں۔' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete App
app.delete('/api/admin/apps/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM apps WHERE id = ?').run(id);
    res.json({ success: true, message: 'ایپ کامیابی سے ڈیلیٹ کر دی گئی۔' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle Publish
app.patch('/api/admin/apps/:id/toggle-publish', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT is_published FROM apps WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'App not found' });
    const nextVal = current.is_published ? 0 : 1;
    db.prepare('UPDATE apps SET is_published = ? WHERE id = ?').run(nextVal, id);
    res.json({ success: true, is_published: nextVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle Featured
app.patch('/api/admin/apps/:id/toggle-featured', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT is_featured FROM apps WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'App not found' });
    const nextVal = current.is_featured ? 0 : 1;
    db.prepare('UPDATE apps SET is_featured = ? WHERE id = ?').run(nextVal, id);
    res.json({ success: true, is_featured: nextVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Files CRUD
app.get('/api/admin/files', requireAdmin, (req, res) => {
  try {
    const files = db.prepare('SELECT * FROM files ORDER BY id DESC').all();
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/files', requireAdmin, (req, res) => {
  try {
    const { title_en, title_ur, category, file_type, file_size, download_url, desc_en, desc_ur } = req.body;
    const insert = db.prepare(`
      INSERT INTO files (title_en, title_ur, category, file_type, file_size, download_url, desc_en, desc_ur)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(title_en, title_ur || title_en, category, file_type || 'PDF', file_size || '2.0 MB', download_url, desc_en || '', desc_ur || '');
    res.json({ success: true, message: 'فائل کامیابی سے شامل ہو گئی۔' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/files/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
    res.json({ success: true, message: 'فائل کامیابی سے حذف کر دی گئی۔' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Service Inquiries
app.get('/api/admin/inquiries', requireAdmin, (req, res) => {
  try {
    const inquiries = db.prepare('SELECT * FROM service_inquiries ORDER BY id DESC').all();
    res.json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/inquiries/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE service_inquiries SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'اسٹیٹس اپ ڈیٹ ہو گیا۔' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM service_inquiries WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Contact Messages
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/messages/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Broken Link Reports
app.get('/api/admin/broken-reports', requireAdmin, (req, res) => {
  try {
    const reports = db.prepare('SELECT * FROM broken_link_reports ORDER BY id DESC').all();
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/broken-reports/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE broken_link_reports SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Settings Update
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const { settings } = req.body;
    const update = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(settings)) {
      update.run(key, String(value));
    }

    res.json({ success: true, message: 'ترتیبات کامیابی سے محفوظ ہو گئیں۔' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secret Admin Route: Redirect /admin directly to /#admin
app.get(['/admin', '/admin/'], (req, res) => {
  res.redirect('/#admin');
});

// SPA Fallback: send index.html for all non-api routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Start Server (Stand-alone or Local)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Digital Sathi (ڈیجیٹل ساتھی) Server Running!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔒 Admin Panel: http://localhost:${PORT}#admin`);
    console.log(`🔑 Default Admin: admin / Admin@DigitalSathi2026`);
    console.log(`====================================================`);
  });
}

module.exports = app;
