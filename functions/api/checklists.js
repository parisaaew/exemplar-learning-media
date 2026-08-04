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
    
    // แปลงรูปแบบคีย์ให้รองรับทั้ง camelCase และ snake_case 100%
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

    return new Response(JSON.stringify(formatted), {
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
      body.name || '',
      body.studentClass || body.student_class || '',
      body.studentNo || body.student_no || '',
      body.bestPractices || body.best_practices || '',
      body.thingsToAvoid || body.things_to_avoid || '',
      body.ruleColor || body.rule_color || '',
      body.ruleFont || body.rule_font || '',
      body.ruleCta || body.rule_cta || '',
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
