/**
 * Cloudflare Pages Function: /api/ratings
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

    const isDeleteAction = (method === 'DELETE') || (body && body.action === 'delete');

    if (isDeleteAction) {
      const mediaId = body.mediaId || new URL(request.url).searchParams.get('mediaId');
      const ratingId = body.ratingId || body.id || new URL(request.url).searchParams.get('ratingId') || new URL(request.url).searchParams.get('id');
      const rawRef = (body.reflection || new URL(request.url).searchParams.get('reflection') || '').trim();
      const cleanRef = rawRef.replace(/^["']|["']$/g, '').trim();
      const timestamp = body.timestamp || new URL(request.url).searchParams.get('timestamp');

      let deletedCount = 0;

      // 1. ลบด้วย ID หลักของตาราง media_ratings ก่อน (Primary Key Deletion - แม่นยำที่สุด 100%)
      if (ratingId && ratingId !== 'undefined' && ratingId !== 'null' && ratingId !== '') {
        const numId = Number(ratingId);
        if (!isNaN(numId) && numId > 0) {
          const res = await env.DB.prepare('DELETE FROM media_ratings WHERE id = ?').bind(numId).run().catch(() => ({}));
          if (res && res.meta && res.meta.changes > 0) {
            deletedCount += res.meta.changes;
          }
        }
      }

      // 2. ถ้าลบด้วย ID แล้วยังไม่พบ ให้ลบด้วย media_id + reflection/timestamp เป็นตัวสำรอง (Fallback Deletion)
      if (deletedCount === 0 && mediaId) {
        if (cleanRef) {
          const searchPattern = `%${cleanRef.substring(0, 15)}%`;
          await env.DB.prepare(`
            DELETE FROM media_ratings 
            WHERE media_id = ? 
              AND (
                TRIM(reflection) = ? 
                OR TRIM(reflection) = ? 
                OR reflection LIKE ?
                OR REPLACE(reflection, '"', '') LIKE ?
              )
          `).bind(mediaId, rawRef, cleanRef, searchPattern, searchPattern).run().catch(() => {});
        } else if (timestamp) {
          await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ? AND timestamp = ?')
            .bind(mediaId, timestamp).run().catch(() => {});
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'ลบความคิดเห็นถอดบทเรียนจาก D1 สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (method === 'POST') {
      // Guard: ป้องกันการกดลบแล้วเผลอเพิ่มบรรทัดใหม่
      if (!body.mediaId || body.action === 'delete') {
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
