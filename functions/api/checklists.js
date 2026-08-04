/**
 * Cloudflare Pages Function: /api/checklists
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
    return new Response(JSON.stringify({ error: 'DB Binding Not Found on Pages' }), { status: 500, headers: corsHeaders });
  }

  try {
    const { results } = await env.DB.prepare('SELECT * FROM student_checklists ORDER BY timestamp DESC').all();
    return new Response(JSON.stringify(results || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPost(context) {
  const env = context.env;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB Binding Not Found on Pages' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await context.request.json();

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

    return new Response(JSON.stringify({ success: true, message: 'บันทึกสรุปบทเรียนลง D1 Database สำเร็จ' }), {
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
    await env.DB.prepare('DELETE FROM student_checklists WHERE id = ?').bind(queryId).run();
    return new Response(JSON.stringify({ success: true, message: 'ลบข้อมูลจาก D1 Database สำเร็จ' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
