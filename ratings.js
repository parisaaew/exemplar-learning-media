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
    return new Response(JSON.stringify({ error: 'DB Binding Not Found on Pages' }), { status: 500, headers: corsHeaders });
  }

  try {
    if (method === 'POST') {
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

      return new Response(JSON.stringify({ success: true, message: 'บันทึกคะแนนดาวลง D1 Database สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (method === 'DELETE') {
      const body = await request.json().catch(() => ({}));
      const url = new URL(request.url);
      const mediaId = body.mediaId || url.searchParams.get('mediaId');
      const reflection = body.reflection || url.searchParams.get('reflection');
      const timestamp = body.timestamp || url.searchParams.get('timestamp');

      if (mediaId && reflection) {
        await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ? AND reflection = ?')
          .bind(mediaId, reflection).run().catch(() => {});
      } else if (mediaId && timestamp) {
        await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ? AND timestamp = ?')
          .bind(mediaId, timestamp).run().catch(() => {});
      }

      return new Response(JSON.stringify({ success: true, message: 'ลบความคิดเห็นถอดบทเรียนจาก D1 สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
