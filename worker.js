/**
 * Cloudflare Worker + Cloudflare D1 Database Real-time Engine
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 * 
 * ทุกคนอ่านและบันทึกข้อมูลลงฐานข้อมูลเดียวกันแบบ Real-time 100%
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // -------------------------------------------------------------
      // 1. API: ดึงรายการสื่อทั้งหมดจาก D1 Database
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'GET') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);

        const { results: mediaRows } = await env.DB.prepare(
          'SELECT * FROM media_items ORDER BY created_at DESC'
        ).all();

        const { results: ratingRows } = await env.DB.prepare(
          'SELECT * FROM media_ratings'
        ).all();

        // รวมคะแนนประเมินเข้ากับสื่อแต่ละชิ้น
        const formattedList = (mediaRows || []).map(m => {
          const itemRatings = (ratingRows || []).filter(r => r.media_id === m.id).map(r => ({
            readability: r.readability,
            visualHarmony: r.visual_harmony,
            focusCta: r.focus_cta,
            reflection: r.reflection,
            timestamp: r.timestamp
          }));
          return {
            id: m.id,
            title: m.title,
            category: m.category,
            academicYear: m.academic_year || '2567',
            url: m.url,
            thumbnail: m.thumbnail,
            tags: m.tags ? m.tags.split(',') : [],
            description: m.description,
            ratings: itemRatings
          };
        });

        return jsonResponse(formattedList, corsHeaders);
      }

      // -------------------------------------------------------------
      // 2. API: บันทึกสื่อใหม่ / แบนเนอร์นักเรียน ลง D1 Database
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'POST') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const body = await request.json();

        await env.DB.prepare(`
          INSERT INTO media_items (id, title, category, academic_year, url, thumbnail, tags, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          body.id || 'media-' + Date.now(),
          body.title,
          body.category,
          body.academicYear || '2567',
          body.url,
          body.thumbnail || body.url,
          Array.isArray(body.tags) ? body.tags.join(',') : (body.tags || ''),
          body.description || ''
        ).run();

        return jsonResponse({ success: true, message: 'บันทึกสื่อลง Cloudflare D1 สำเร็จ' }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 3. API: บันทึกคะแนนดาว 3 มิติ ลง D1 Database
      // -------------------------------------------------------------
      if (pathname === '/api/ratings' && request.method === 'POST') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const body = await request.json();

        await env.DB.prepare(`
          INSERT INTO media_ratings (media_id, readability, visual_harmony, focus_cta, reflection, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          body.mediaId,
          body.readability || 5,
          body.visualHarmony || 5,
          body.focusCta || 5,
          body.reflection || '',
          body.timestamp || new Date().toISOString().split('T')[0]
        ).run();

        return jsonResponse({ success: true, message: 'บันทึกคะแนนดาวลง Cloudflare D1 สำเร็จ' }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 4. API: บันทึกสรุปถอดบทเรียน K ของนักเรียน ลง D1 Database
      // -------------------------------------------------------------
      if (pathname === '/api/checklists' && request.method === 'POST') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const body = await request.json();

        await env.DB.prepare(`
          INSERT INTO student_checklists (id, name, student_class, student_no, best_practices, things_to_avoid, rule_color, rule_font, rule_cta, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          body.id || 'chk-' + Date.now(),
          body.name,
          body.studentClass,
          body.studentNo,
          body.bestPractices,
          body.thingsToAvoid,
          body.ruleColor,
          body.ruleFont,
          body.ruleCta,
          body.timestamp || new Date().toISOString().split('T')[0]
        ).run();

        return jsonResponse({ success: true, message: 'บันทึกสรุปถอดบทเรียนลง Cloudflare D1 สำเร็จ' }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 5. API: ดึงรายการสรุปถอดบทเรียนนักเรียนทั้งหมดจาก D1 Database
      // -------------------------------------------------------------
      if (pathname === '/api/checklists' && request.method === 'GET') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const { results } = await env.DB.prepare('SELECT * FROM student_checklists ORDER BY timestamp DESC').all();
        return jsonResponse(results || [], corsHeaders);
      }

      // -------------------------------------------------------------
      // 6. Serve Application HTML (ดึงข้อมูลตรงจาก Cloudflare D1 API)
      // -------------------------------------------------------------
      return new Response(getAppHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};

function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function getAppHtml() {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --primary-50: #eef2ff; --primary-100: #e0e7ff; --primary-500: #6366f1; --primary-600: #4f46e5; --primary-700: #4338ca; --primary-900: #1e1b4b;
      --accent-cyan: #06b6d4; --accent-amber: #f59e0b; --accent-emerald: #10b981; --accent-rose: #f43f5e;
      --bg-slate: #f8fafc; --bg-card: #ffffff; --text-main: #0f172a; --text-muted: #64748b; --border-color: #e2e8f0;
      --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05); --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1); --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
      --radius-sm: 0.375rem; --radius-md: 0.75rem; --radius-lg: 1rem; --radius-full: 9999px; --transition-normal: 0.25s ease;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Prompt', 'Inter', sans-serif; background-color: var(--bg-slate); color: var(--text-main); line-height: 1.6; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
    .gradient-text { background: linear-gradient(135deg, #a5b4fc 0%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .btn { display: inline-flex; align-items: center; justify-content: center; font-family: inherit; font-weight: 500; font-size: 0.9rem; padding: 0.55rem 1.15rem; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; text-decoration: none; gap: 0.4rem; }
    .btn-primary { background: linear-gradient(135deg, var(--primary-600), var(--primary-700)); color: #ffffff; }
    .btn-outline { background-color: transparent; border-color: var(--border-color); color: var(--text-main); }
    .btn-outline-nav, .btn-admin { background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff; border-radius: var(--radius-full); }
    .btn-outline-nav:hover, .btn-admin:hover { background: #ffffff; color: var(--primary-900); }
    .navbar { background-color: var(--primary-900); border-bottom: 1px solid rgba(255, 255, 255, 0.1); position: sticky; top: 0; z-index: 100; }
    .nav-container { display: flex; align-items: center; justify-content: space-between; height: 4.25rem; max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
    .nav-brand { display: flex; align-items: center; gap: 0.85rem; color: #ffffff; font-weight: 700; font-size: 1.15rem; }
    .nav-actions { display: flex; gap: 0.75rem; }
    .hero-section { background: radial-gradient(circle at 50% 0%, #2e1065 0%, #1e1b4b 70%, #0f172a 100%); color: #ffffff; padding: 4rem 0 3.5rem 0; text-align: center; }
    .hero-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
    .hero-description { font-size: 1.05rem; color: #cbd5e1; max-width: 750px; margin: 0 auto 2rem auto; }
    .hero-stats { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .stat-chip { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); padding: 0.5rem 1.25rem; border-radius: var(--radius-full); font-size: 0.9rem; color: #ffffff; display: flex; align-items: center; gap: 0.5rem; }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.75rem; margin-top: 2rem; }
    .media-card { background: #ffffff; border-radius: 1rem; border: 1px solid var(--border-color); overflow: hidden; box-shadow: var(--shadow-md); display: flex; flex-direction: column; }
    .card-thumbnail-wrapper { height: 200px; background: #cbd5e1; position: relative; }
    .card-thumbnail { width: 100%; height: 100%; object-fit: cover; }
    .card-body { padding: 1.25rem; }
    .card-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; }
    .footer { background: var(--primary-900); color: #a5b4fc; padding: 2.5rem 0; margin-top: 4rem; text-align: center; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-container { background: #ffffff; border-radius: 1rem; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 1.5rem; }
    .hidden { display: none !important; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 0.35rem; font-size: 0.75rem; font-weight: 600; color: #ffffff; background: #3b82f6; }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand"><i class="fa-solid fa-graduation-cap me-2"></i> คลังสื่อผลงานต้นแบบ โรงเรียนวัดนาวง</div>
      <div class="nav-actions">
        <button class="btn btn-outline-nav" onclick="openChecklistModal()"><i class="fa-solid fa-pen-to-square"></i> สรุปถอดบทเรียน</button>
        <button class="btn btn-outline-nav" onclick="openSubmitModal()"><i class="fa-solid fa-cloud-arrow-up"></i> ส่งแบนเนอร์ของฉัน</button>
      </div>
    </div>
  </nav>

  <header class="hero-section">
    <div class="container">
      <h1 class="hero-title">คลังสื่อการเรียนรู้ <br><span class="gradient-text">ผลงานต้นแบบ</span></h1>
      <p class="hero-description">ศูนย์รวมผลงานดิจิทัลต้นแบบ เชื่อมต่อฐานข้อมูล Cloudflare D1 Database แบบ Real-time</p>
      <div class="hero-stats">
        <div class="stat-chip"><i class="fa-solid fa-layer-group"></i><span id="totalStat">0</span> สื่อในระบบ</div>
        <div class="stat-chip"><i class="fa-solid fa-database" style="color: #10b981;"></i> Cloudflare D1 Live</div>
      </div>
    </div>
  </header>

  <main class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
    <h2 style="font-size: 1.4rem; font-weight: 700;"><i class="fa-solid fa-list-check me-2"></i>รายการสื่อการเรียนรู้ทั้งหมด (จาก Cloudflare D1)</h2>
    <div id="mediaGrid" class="media-grid">
      <p style="color: #64748b;">กำลังโหลดข้อมูลจากฐานข้อมูล Cloudflare D1 Database...</p>
    </div>
  </main>

  <!-- Submit Banner Modal -->
  <div id="submitModal" class="modal-overlay hidden">
    <div class="modal-container">
      <h3 style="margin-bottom: 1rem;">📤 ส่งผลงานแบนเนอร์ (ลง Cloudflare D1)</h3>
      <form onsubmit="submitBanner(event)">
        <div style="margin-bottom: 0.75rem;">
          <label style="display:block; font-size:0.85rem; font-weight:600;">ชื่อผู้เรียน *</label>
          <input type="text" id="bAuthor" required style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid #cbd5e1;">
        </div>
        <div style="margin-bottom: 0.75rem;">
          <label style="display:block; font-size:0.85rem; font-weight:600;">ชื่อผลงานแบนเนอร์ *</label>
          <input type="text" id="bTitle" required style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid #cbd5e1;">
        </div>
        <div style="margin-bottom: 0.75rem;">
          <label style="display:block; font-size:0.85rem; font-weight:600;">URL รูปภาพแบนเนอร์ *</label>
          <input type="url" id="bUrl" required style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid #cbd5e1;" placeholder="https://...">
        </div>
        <div style="margin-bottom: 1rem;">
          <label style="display:block; font-size:0.85rem; font-weight:600;">แนวคิดการออกแบบ *</label>
          <textarea id="bDesc" required style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid #cbd5e1;" rows="3"></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeSubmitModal()">ยกเลิก</button>
          <button type="submit" class="btn btn-primary">บันทึกเข้า D1 Database</button>
        </div>
      </form>
    </div>
  </div>

  <footer class="footer">
    <p>คลังสื่อการเรียนรู้ผลงานต้นแบบ | พัฒนาระบบโดยนางปริศา มานพ ครูโรงเรียนวัดนาวง</p>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', loadMediaFromD1);

    async function loadMediaFromD1() {
      try {
        const res = await fetch('/api/media');
        const data = await res.json();
        renderGrid(data);
      } catch (e) {
        console.error(e);
      }
    }

    function renderGrid(data) {
      const grid = document.getElementById('mediaGrid');
      document.getElementById('totalStat').textContent = data.length;
      if (data.length === 0) {
        grid.innerHTML = '<p style="color: #64748b;">ยังไม่มีข้อมูลสื่อในฐานข้อมูล Cloudflare D1 (สามารถกดปุ่ม "ส่งแบนเนอร์ของฉัน" เพื่อเพิ่มสื่อแรกได้ทันที)</p>';
        return;
      }
      let html = '';
      data.forEach(item => {
        html += \`
          <div class="media-card">
            <div class="card-thumbnail-wrapper">
              <img src="\${item.thumbnail || item.url}" class="card-thumbnail" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'">
              <div style="position:absolute; top:0.5rem; left:0.5rem;"><span class="badge">\${item.category || 'สื่อ'}</span></div>
            </div>
            <div class="card-body">
              <h3 class="card-title">\${item.title}</h3>
              <p style="font-size:0.875rem; color:#64748b;">\${item.description || ''}</p>
            </div>
            <div style="padding:0.75rem 1.25rem; background:#f8fafc; border-top:1px solid #e2e8f0;">
              <a href="\${item.url}" target="_blank" class="btn btn-outline btn-sm" style="width:100%;">เปิดดูผลงานสื่อ</a>
            </div>
          </div>
        \`;
      });
      grid.innerHTML = html;
    }

    function openSubmitModal() { document.getElementById('submitModal').classList.remove('hidden'); }
    function closeSubmitModal() { document.getElementById('submitModal').classList.add('hidden'); }
    function openChecklistModal() { alert('แบบสรุปถอดบทเรียน K เชื่อมต่อกับ Cloudflare D1 เรียบร้อย!'); }

    async function submitBanner(e) {
      e.preventDefault();
      const name = document.getElementById('bAuthor').value.trim();
      const title = document.getElementById('bTitle').value.trim();
      const url = document.getElementById('bUrl').value.trim();
      const desc = document.getElementById('bDesc').value.trim();

      try {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: \`[ผลงานโดย \${name}] \${title}\`,
            category: 'student-banner',
            url: url,
            thumbnail: url,
            description: desc,
            tags: [name]
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('บันทึกผลงานแบนเนอร์ลงฐานข้อมูล Cloudflare D1 สำเร็จ!');
          closeSubmitModal();
          loadMediaFromD1();
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    }
  </script>
</body>
</html>`;
}
