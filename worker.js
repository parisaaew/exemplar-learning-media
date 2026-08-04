/**
 * Cloudflare Worker + Cloudflare D1 Database Real-time Engine
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 * 
 * ทุกคนอ่าน และ ลบ และ บันทึกข้อมูลลงฐานข้อมูลเดียวกันแบบ Real-time 100%
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const queryId = url.searchParams.get('id');

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
      // 1. API: ดึงรายการสื่อทั้งหมดจาก D1 Database (ไม่ re-seed ซ้ำเมื่อถูกลบ)
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'GET') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);

        const { results: mediaRows } = await env.DB.prepare(
          'SELECT * FROM media_items ORDER BY created_at DESC'
        ).all();

        const { results: ratingRows } = await env.DB.prepare(
          'SELECT * FROM media_ratings'
        ).all();

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
      // 2. API: บันทึกสื่อใหม่ / แก้ไขสื่อ ลง D1 Database (INSERT OR REPLACE)
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'POST') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const body = await request.json();

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

        return jsonResponse({ success: true, message: 'บันทึก/แก้ไขสื่อลง Cloudflare D1 สำเร็จ' }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 3. API: ลบสื่อออกจาก D1 Database (DELETE)
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'DELETE') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        if (!queryId) return jsonResponse({ error: 'Missing media ID' }, corsHeaders, 400);

        await env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(queryId).run();
        await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ?').bind(queryId).run();

        return jsonResponse({ success: true, message: `ลบสื่อ ${queryId} จาก Cloudflare D1 เรียบร้อย` }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 4. API: บันทึกคะแนนดาว 3 มิติ ลง D1 Database
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
      // 5. API: บันทึกสรุปถอดบทเรียน K ลง D1 Database
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
      // 6. API: ดึงรายการสรุปถอดบทเรียนทั้งหมดจาก D1 Database
      // -------------------------------------------------------------
      if (pathname === '/api/checklists' && request.method === 'GET') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const { results } = await env.DB.prepare('SELECT * FROM student_checklists ORDER BY timestamp DESC').all();
        return jsonResponse(results || [], corsHeaders);
      }

      // -------------------------------------------------------------
      // 7. API: ลบรายการสรุปถอดบทเรียนออกจาก D1 Database (DELETE)
      // -------------------------------------------------------------
      if (pathname === '/api/checklists' && request.method === 'DELETE') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        if (!queryId) return jsonResponse({ error: 'Missing checklist ID' }, corsHeaders, 400);

        await env.DB.prepare('DELETE FROM student_checklists WHERE id = ?').bind(queryId).run();
        return jsonResponse({ success: true, message: `ลบสรุปถอดบทเรียน ${queryId} เรียบร้อย` }, corsHeaders);
      }

      return jsonResponse({ message: 'Cloudflare D1 Real-time API Engine Active' }, corsHeaders);

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
