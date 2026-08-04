/**
 * Cloudflare Pages Function: /api/media
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const queryId = url.searchParams.get('id');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB Binding Not Found' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    // -------------------------------------------------------------
    // GET: อ่านรายการสื่อทั้งหมดจาก D1 Database (ห้ามจำแคชทุกกรณี)
    // -------------------------------------------------------------
    if (method === 'GET') {
      const { results: mediaRows } = await env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all();
      const { results: ratingRows } = await env.DB.prepare('SELECT * FROM media_ratings').all();

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

      return new Response(JSON.stringify(formattedList), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // -------------------------------------------------------------
    // POST: เพิ่ม/อัปเดต หรือลบสื่อ (รองรับ action: delete)
    // -------------------------------------------------------------
    if (method === 'POST') {
      const body = await request.json();

      if (body.action === 'delete') {
        const targetId = body.id || '';
        let decodedId = targetId;
        try { decodedId = decodeURIComponent(targetId).trim(); } catch(e) {}
        const targetTitle = (body.title || '').trim();

        if (targetId || targetTitle) {
          await env.DB.prepare('DELETE FROM media_items WHERE id = ? OR id = ? OR (title = ? AND title != "")')
            .bind(targetId, decodedId, targetTitle).run();
          await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ? OR media_id = ?')
            .bind(targetId, decodedId).run();
        }

        return new Response(JSON.stringify({ success: true, message: `ลบสื่อ ${targetId} ถาวรสำเร็จ` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      await env.DB.prepare(`
        INSERT INTO media_items (id, title, category, academic_year, url, thumbnail, tags, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          category = excluded.category,
          academic_year = excluded.academic_year,
          url = excluded.url,
          thumbnail = excluded.thumbnail,
          tags = excluded.tags,
          description = excluded.description
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

      return new Response(JSON.stringify({ success: true, message: 'บันทึกสื่อลง D1 Database สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // -------------------------------------------------------------
    // DELETE: ลบสื่อออกจาก D1 Database
    // -------------------------------------------------------------
    if (method === 'DELETE') {
      const targetId = queryId || (await request.json().catch(() => ({}))).id;
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'Missing media ID' }), { status: 400, headers: corsHeaders });
      }

      let decodedId = targetId;
      try { decodedId = decodeURIComponent(targetId).trim(); } catch(e) {}

      await env.DB.prepare('DELETE FROM media_items WHERE id = ? OR id = ?').bind(targetId, decodedId).run();
      await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ? OR media_id = ?').bind(targetId, decodedId).run();

      return new Response(JSON.stringify({ success: true, message: `ลบสื่อ ${targetId} จาก D1 สำเร็จ` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
