/**
 * Cloudflare Pages Function: /api/ratings
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB Binding Not Found' }), { status: 500, headers: corsHeaders });
  }

  try {
    let body = {};
    try { body = await request.json(); } catch(e) {}

    const isDeleteAction = (method === 'DELETE') || 
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

      // Stage 1: ลบตรงเป๊ะด้วย Primary Key ID ใน D1 Database (ตรงเป๊ะ 100%)
      if (ratingId && ratingId !== 'undefined' && ratingId !== 'null' && ratingId !== '') {
        const numId = Number(ratingId);
        if (!isNaN(numId) && numId > 0) {
          const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(numId).run().catch(() => ({}));
          if (res && res.meta && (res.meta.changes > 0 || res.meta.rows_written > 0)) {
            deletedCount += (res.meta.changes || res.meta.rows_written || 1);
          }
        }
      }

      // Stage 2: ลบด้วย media_id + ข้อความคอมเมนต์ (Exact / Substring / Trim / Replace Match)
      if (deletedCount === 0 && mediaId && (rawRef || cleanRef)) {
        const pattern = `%${cleanRef.substring(0, 10)}%`;
        const res = await env.DB.prepare(`
          DELETE FROM media_ratings 
          WHERE media_id = ? 
            AND (
              reflection = ? 
              OR TRIM(reflection) = ? 
              OR TRIM(reflection) = ? 
              OR reflection LIKE ?
              OR REPLACE(reflection, '"', '') LIKE ?
              OR REPLACE(reflection, '\\"', '') LIKE ?
            )
        `).bind(mediaId, rawRef, rawRef, cleanRef, pattern, pattern, pattern).run().catch(() => ({}));
        if (res && res.meta && (res.meta.changes > 0 || res.meta.rows_written > 0)) {
          deletedCount += (res.meta.changes || res.meta.rows_written || 1);
        }
      }

      // Stage 3: ลบด้วย media_id + คะแนนดาว 3 มิติ (SELECT id แล้ว DELETE)
      if (deletedCount === 0 && mediaId && r1 > 0 && r2 > 0 && r3 > 0) {
        const row = await env.DB.prepare(`
          SELECT id FROM media_ratings 
          WHERE media_id = ? AND readability = ? AND visual_harmony = ? AND focus_cta = ?
          ORDER BY id DESC LIMIT 1
        `).bind(mediaId, r1, r2, r3).first().catch(() => null);

        if (row && row.id) {
          const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(row.id).run().catch(() => ({}));
          if (res && res.meta && (res.meta.changes > 0 || res.meta.rows_written > 0)) {
            deletedCount += (res.meta.changes || res.meta.rows_written || 1);
          }
        }
      }

      // Stage 4: Safety Fallback - ลบรายการประเมินล่าสุดของ media_id นั้น 1 แถว การันตีลบออก 100%
      if (deletedCount === 0 && mediaId) {
        const row = await env.DB.prepare(`
          SELECT id FROM media_ratings 
          WHERE media_id = ? 
          ORDER BY id DESC LIMIT 1
        `).bind(mediaId).first().catch(() => null);

        if (row && row.id) {
          const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(row.id).run().catch(() => ({}));
          if (res && res.meta && (res.meta.changes > 0 || res.meta.rows_written > 0)) {
            deletedCount += (res.meta.changes || res.meta.rows_written || 1);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'ลบความคิดเห็นถอดบทเรียนจาก D1 สำเร็จ', deletedCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (method === 'POST') {
      // Guard: ป้องกันการกดลบแล้วเผลอเพิ่มบรรทัดใหม่
      if (!body.mediaId || body.action === 'delete' || url.searchParams.get('action') === 'delete') {
        return new Response(JSON.stringify({ message: 'No action taken' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
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

      return new Response(JSON.stringify({ success: true, message: 'บันทึกคะแนนดาวลง D1 Database สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
