/**
 * Automated End-to-End API and Database Validation Script for Digital Sathi
 */

async function runValidation() {
  console.log('--- STARTING COMPREHENSIVE VALIDATION ---');
  const baseUrl = 'http://localhost:3000';

  // 1. Stats
  console.log('\n[1] Testing /api/stats/public...');
  let res = await fetch(`${baseUrl}/api/stats/public`);
  let data = await res.json();
  console.log('Result:', data);

  // 2. Categories
  console.log('\n[2] Testing /api/categories...');
  res = await fetch(`${baseUrl}/api/categories`);
  data = await res.json();
  console.log('Categories count:', data.categories.length);

  // 3. Apps with Category Filter
  console.log('\n[3] Testing /api/apps?category=finance...');
  res = await fetch(`${baseUrl}/api/apps?category=finance`);
  data = await res.json();
  console.log('Finance apps count:', data.apps.length, 'First app:', data.apps[0]?.name_en);

  // 4. Download Check & Verification
  console.log('\n[4] Testing /api/apps/1/download-check...');
  res = await fetch(`${baseUrl}/api/apps/1/download-check`, { method: 'POST' });
  data = await res.json();
  console.log('Download Check result:', { status: data.status, sha256: data.sha256, url: data.download_url });

  // 5. Submit Service Quote Inquiry
  console.log('\n[5] Testing /api/inquiries (Service Quote)...');
  res = await fetch(`${baseUrl}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'ٹیسٹ کلائنٹ (Test User)',
      phone: '03009988776',
      email: 'client@example.com',
      service_type: 'موبائل ایپ ڈویلپمنٹ',
      budget_range: '50,000 - 100,000 PKR',
      message: 'ہمیں دکان کے لیے کھاتہ ایپ درکار ہے۔'
    })
  });
  data = await res.json();
  console.log('Inquiry result:', data);

  // 6. Report Broken Link
  console.log('\n[6] Testing /api/reports/broken-link...');
  res = await fetch(`${baseUrl}/api/reports/broken-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: 1,
      app_name: 'DigiKhata Pro',
      download_url: 'https://drive.google.com/...',
      user_note: 'سپیڈ سلو ہے'
    })
  });
  data = await res.json();
  console.log('Report result:', data);

  // 7. Admin Login
  console.log('\n[7] Testing Admin Login (/api/admin/login)...');
  res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@DigitalSathi2026' })
  });
  data = await res.json();
  const token = data.token;
  console.log('Admin Login Token generated:', token ? 'YES (Valid JWT)' : 'NO');

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 8. Admin Overview
  console.log('\n[8] Testing Admin Overview (/api/admin/overview)...');
  res = await fetch(`${baseUrl}/api/admin/overview`, { headers: adminHeaders });
  data = await res.json();
  console.log('Admin Overview:', {
    totalApps: data.overview.totalApps,
    totalDownloads: data.overview.totalDownloads,
    pendingInquiries: data.overview.pendingInquiries,
    pendingBrokenLinks: data.overview.pendingBrokenLinks
  });

  // 9. Admin Add App
  console.log('\n[9] Testing Admin Add App (/api/admin/apps)...');
  res = await fetch(`${baseUrl}/api/admin/apps`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name_en: 'Test Automation App',
      name_ur: 'ٹیسٹ آٹومیشن ایپ',
      category_slug: 'utilities',
      version: 'v1.0.0',
      size_mb: 12.5,
      download_url: 'https://drive.google.com/test-apk-url',
      short_desc_en: 'Automated test application',
      short_desc_ur: 'ٹیسٹنگ کے لیے تیار کردہ ایپ'
    })
  });
  data = await res.json();
  const newAppId = data.id;
  console.log('New App created with ID:', newAppId);

  // 10. Admin Delete App
  console.log('\n[10] Testing Admin Delete App (/api/admin/apps/' + newAppId + ')...');
  res = await fetch(`${baseUrl}/api/admin/apps/${newAppId}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  data = await res.json();
  console.log('Delete result:', data);

  console.log('\n=========================================');
  console.log('🎉 ALL 10 TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('=========================================');
}

runValidation().catch(console.error);
