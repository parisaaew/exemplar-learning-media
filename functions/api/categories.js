/**
 * Cloudflare Pages Function: /api/categories
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 */

export async function onRequestGet(context) {
  const env = context.env;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!env.DB) {
    return new Response(JSON.stringify(getInitialCategories()), { headers: corsHeaders });
  }

  try {
    // บังคับสร้างตารางหมวดหมู่หากยังไม่มี
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS media_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'fa-tag',
        badge_class TEXT DEFAULT 'badge-website'
      );
    `).run();

    let { results } = await env.DB.prepare('SELECT * FROM media_categories').all();

    // Seed หากตารางยังว่างเปล่า
    if (!results || results.length === 0) {
      const initials = getInitialCategories();
      for (const cat of initials) {
        await env.DB.prepare(`
          INSERT INTO media_categories (id, name, icon, badge_class)
          VALUES (?, ?, ?, ?)
        `).bind(cat.id, cat.name, cat.icon, cat.badgeClass).run();
      }
      const seeded = await env.DB.prepare('SELECT * FROM media_categories').all();
      results = seeded.results;
    }

    const formatted = (results || []).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon || 'fa-tag',
      badgeClass: c.badge_class || c.badgeClass || 'badge-website'
    }));

    return new Response(JSON.stringify(formatted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify(getInitialCategories()), { headers: corsHeaders });
  }
}

export async function onRequestPost(context) {
  const env = context.env;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!env.DB) return new Response(JSON.stringify({ success: false }), { status: 500, headers: corsHeaders });

  try {
    const body = await context.request.json();

    await env.DB.prepare(`
      INSERT INTO media_categories (id, name, icon, badge_class)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        icon = excluded.icon,
        badge_class = excluded.badge_class
    `).bind(
      body.id || 'cat-' + Date.now(),
      body.name,
      body.icon || 'fa-tag',
      body.badgeClass || 'badge-website'
    ).run();

    return new Response(JSON.stringify({ success: true, message: 'บันทึกหมวดหมู่ลง D1 Database สำเร็จ' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestDelete(context) {
  const env = context.env;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const url = new URL(context.request.url);
  const queryId = url.searchParams.get('id');

  if (!env.DB) return new Response(JSON.stringify({ error: 'DB Binding Not Found' }), { status: 500, headers: corsHeaders });
  if (!queryId) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: corsHeaders });

  try {
    await env.DB.prepare('DELETE FROM media_categories WHERE id = ?').bind(queryId).run();
    return new Response(JSON.stringify({ success: true, message: 'ลบหมวดหมู่จาก D1 Database สำเร็จ' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

function getInitialCategories() {
  return [
    { id: 'website', name: 'เว็บไซต์ต้นแบบ', icon: 'fa-globe', badgeClass: 'badge-website' },
    { id: 'banner', name: 'แบนเนอร์ Best Practice', icon: 'fa-image', badgeClass: 'badge-banner' },
    { id: 'student-banner', name: 'ผลงานแบนเนอร์นักเรียน', icon: 'fa-user-astronaut', badgeClass: 'badge-banner' },
    { id: 'video', name: 'วิดีโอ UX/UI', icon: 'fa-play', badgeClass: 'badge-video' },
    { id: 'document', name: 'ใบความรู้/เอกสาร', icon: 'fa-file-lines', badgeClass: 'badge-document' }
  ];
}
