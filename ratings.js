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
      const mediaId = body.mediaId;
      const rawRef = (body.reflection || '').trim();
      const cleanRef = rawRef.replace(/^["']|["']$/g, '').trim();
      const timestamp = body.timestamp;

      if (mediaId && (rawRef || cleanRef)) {
        await env.DB.prepare(`
          DELETE FROM media_ratings 
          WHERE media_id = ? 
            AND (
              TRIM(reflection) = ? 
              OR TRIM(reflection) = ? 
              OR reflection LIKE ?
              OR REPLACE(reflection, '"', '') LIKE ?
            )
        `).bind(mediaId, rawRef, cleanRef, `%${cleanRef}%`, `%${cleanRef}%`).run();
      } else if (mediaId && timestamp) {
        await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ? AND timestamp = ?')
          .bind(mediaId, timestamp).run();
      }

      return new Response(JSON.stringify({ success: true, message: 'ลบคะแนนและคอมเมนต์จาก D1 ถาวรสำเร็จ' }), {
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
