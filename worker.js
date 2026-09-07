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
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
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

        let mediaRows = [];
        try {
          const { results } = await env.DB.prepare('SELECT * FROM media_items ORDER BY rowid DESC').all();
          mediaRows = results || [];
        } catch (e) {
          const { results } = await env.DB.prepare('SELECT * FROM media_items').all();
          mediaRows = results || [];
        }

        let ratingRows = [];
        try {
          const { results } = await env.DB.prepare('SELECT * FROM media_ratings').all();
          ratingRows = results || [];
        } catch (e) {}

        const formattedList = (mediaRows || []).map(m => {
          const itemRatings = (ratingRows || []).filter(r => r.media_id === m.id).map(r => ({
            id: r.id, // ส่ง ID หลักไปฝั่ง Frontend เพื่อลบตรงเป๊ะ 100%
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
      // 2. API: บันทึกสื่อใหม่ / แก้ไขสื่อ / ลบสื่อ (POST)
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'POST') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        const body = await request.json().catch(() => ({}));

        if (body.action === 'delete') {
          const targetId = (body.id || queryId || '').trim();
          if (targetId) {
            await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ?').bind(targetId).run().catch(() => {});
            await env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(targetId).run().catch(() => {});
          }
          return jsonResponse({ success: true, message: `ลบสื่อ ${targetId} จาก D1 สำเร็จ` }, corsHeaders);
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

        return jsonResponse({ success: true, message: 'บันทึก/แก้ไขสื่อลง Cloudflare D1 สำเร็จ' }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 3. API: ลบสื่อออกจาก D1 Database (DELETE)
      // -------------------------------------------------------------
      if (pathname === '/api/media' && request.method === 'DELETE') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);
        if (!queryId) return jsonResponse({ error: 'Missing media ID' }, corsHeaders, 400);

        await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ?').bind(queryId).run().catch(() => {});
        await env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(queryId).run().catch(() => {});

        return jsonResponse({ success: true, message: `ลบสื่อ ${queryId} จาก Cloudflare D1 เรียบร้อย` }, corsHeaders);
      }

      // -------------------------------------------------------------
      // 4. API: บริหารจัดการคะแนนดาว 3 มิติ (ลบ / เพิ่ม)
      // -------------------------------------------------------------
      if (pathname === '/api/ratings') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);

        let body = {};
        try { body = await request.json(); } catch(e) {}

        const isDeleteAction = (request.method === 'DELETE') || 
                               (body && body.action === 'delete') || 
                               (url.searchParams.get('action') === 'delete');

        if (isDeleteAction) {
          const mediaId = body.mediaId || url.searchParams.get('mediaId');
          const ratingId = body.ratingId || body.id || url.searchParams.get('ratingId') || url.searchParams.get('id');
          const rawRef = (body.reflection || url.searchParams.get('reflection') || '').trim();
          const cleanRef = rawRef.replace(/^["']|["']$/g, '').trim();
          const timestamp = body.timestamp || url.searchParams.get('timestamp');
          const r1 = Number(body.readability || url.searchParams.get('readability') || 0);
          const r2 = Number(body.visualHarmony || body.visual_harmony || url.searchParams.get('visualHarmony') || url.searchParams.get('visual_harmony') || 0);
          const r3 = Number(body.focusCta || body.focus_cta || url.searchParams.get('focusCta') || url.searchParams.get('focus_cta') || 0);

          let deletedCount = 0;

          // Stage 1: ลบด้วย Primary Key ID
          if (ratingId && ratingId !== 'undefined' && ratingId !== 'null' && ratingId !== '') {
            const numId = Number(ratingId);
            if (!isNaN(numId) && numId > 0) {
              const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(numId).run().catch(() => ({}));
              if (res && res.meta && res.meta.changes > 0) deletedCount += res.meta.changes;
            }
          }

          // Stage 2: ลบด้วย media_id + Exact Reflection Match
          if (deletedCount === 0 && mediaId && (rawRef || cleanRef)) {
            const res = await env.DB.prepare(`
              DELETE FROM media_ratings 
              WHERE media_id = ? 
                AND (
                  TRIM(reflection) = ? 
                  OR TRIM(reflection) = ? 
                  OR reflection = ? 
                  OR REPLACE(reflection, '"', '') = ?
                )
            `).bind(mediaId, rawRef, cleanRef, rawRef, cleanRef).run().catch(() => ({}));
            if (res && res.meta && res.meta.changes > 0) deletedCount += res.meta.changes;
          }

          // Stage 3: ลบด้วย media_id + Substring Match
          if (deletedCount === 0 && mediaId && cleanRef && cleanRef.length >= 3) {
            const searchPattern = `%${cleanRef.substring(0, 15)}%`;
            const res = await env.DB.prepare(`
              DELETE FROM media_ratings 
              WHERE media_id = ? 
                AND (
                  reflection LIKE ? 
                  OR REPLACE(reflection, '"', '') LIKE ?
                )
            `).bind(mediaId, searchPattern, searchPattern).run().catch(() => ({}));
            if (res && res.meta && res.meta.changes > 0) deletedCount += res.meta.changes;
          }

          // Stage 4: ลบด้วย media_id + Scores + Timestamp (LIMIT 1)
          if (deletedCount === 0 && mediaId && r1 > 0 && r2 > 0 && r3 > 0 && timestamp) {
            const row = await env.DB.prepare(`
              SELECT id FROM media_ratings 
              WHERE media_id = ? AND readability = ? AND visual_harmony = ? AND focus_cta = ? AND timestamp = ?
              ORDER BY id DESC LIMIT 1
            `).bind(mediaId, r1, r2, r3, timestamp).first().catch(() => null);

            if (row && row.id) {
              const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(row.id).run().catch(() => ({}));
              if (res && res.meta && res.meta.changes > 0) deletedCount += res.meta.changes;
            }
          }

          // Stage 5: ลบด้วย คะแนน 3 มิติ (LIMIT 1)
          if (deletedCount === 0 && mediaId && r1 > 0 && r2 > 0 && r3 > 0) {
            const row = await env.DB.prepare(`
              SELECT id FROM media_ratings 
              WHERE media_id = ? AND readability = ? AND visual_harmony = ? AND focus_cta = ?
              ORDER BY id DESC LIMIT 1
            `).bind(mediaId, r1, r2, r3).first().catch(() => null);

            if (row && row.id) {
              const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(row.id).run().catch(() => ({}));
              if (res && res.meta && res.meta.changes > 0) deletedCount += res.meta.changes;
            }
          }

          return jsonResponse({ success: true, message: 'ลบความคิดเห็นจาก Cloudflare D1 สำเร็จ', deletedCount }, corsHeaders);
        }

        if (request.method === 'POST') {
          // Guard: ป้องกันการเพิ่มข้อมูลใหม่ขณะสั่งลบ
          if (!body.mediaId || body.action === 'delete' || url.searchParams.get('action') === 'delete') {
            return jsonResponse({ message: 'No action taken for delete' }, corsHeaders);
          }

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
      }

      // -------------------------------------------------------------
      // 5. API: บันทึกสรุปถอดบทเรียน K (POST & DELETE)
      // -------------------------------------------------------------
      if (pathname === '/api/checklists') {
        if (!env.DB) return jsonResponse({ error: 'DB Binding Not Found' }, corsHeaders, 500);

        let body = {};
        try { body = await request.json(); } catch(e) {}

        if (request.method === 'DELETE' || body.action === 'delete' || url.searchParams.get('action') === 'delete') {
          const targetId = body.id || queryId || url.searchParams.get('id');
          if (targetId) {
            await env.DB.prepare('DELETE FROM student_checklists WHERE id = ?').bind(targetId).run().catch(() => {});
          }
          return jsonResponse({ success: true, message: `ลบสรุปถอดบทเรียน ${targetId} สำเร็จ` }, corsHeaders);
        }

        if (request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM student_checklists ORDER BY timestamp DESC').all();
          const formatted = (results || []).map(item => ({
            id: item.id,
            name: item.name,
            studentClass: item.student_class || item.studentClass || '',
            studentNo: item.student_no || item.studentNo || '',
            bestPractices: item.best_practices || item.bestPractices || '',
            thingsToAvoid: item.things_to_avoid || item.thingsToAvoid || '',
            ruleColor: item.rule_color || item.ruleColor || '',
            ruleFont: item.rule_font || item.ruleFont || '',
            ruleCta: item.rule_cta || item.ruleCta || '',
            timestamp: item.timestamp || ''
          }));
          return jsonResponse(formatted, corsHeaders);
        }

        if (request.method === 'POST') {
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
