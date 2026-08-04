/**
 * Cloudflare Pages Function: /api/ratings
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 */

export async function onRequestPost(context) {
  const env = context.env;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB Binding Not Found on Pages' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await context.request.json();

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
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
