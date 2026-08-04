/**
 * Cloudflare Pages Function: /api/checklists
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
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB Binding Not Found' }), { status: 500, headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
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

      return new Response(JSON.stringify(formatted), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (method === 'POST') {
      const body = await request.json();

      if (body.action === 'delete' && body.id) {
        await env.DB.prepare('DELETE FROM student_checklists WHERE id = ?').bind(body.id).run();
        return new Response(JSON.stringify({ success: true, message: `ลบสรุป ${body.id} สำเร็จ` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

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

      return new Response(JSON.stringify({ success: true, message: 'บันทึกสรุปบทเรียนลง D1 สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (method === 'DELETE') {
      const targetId = queryId || (await request.json().catch(() => ({}))).id;
      if (!targetId) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: corsHeaders });

      await env.DB.prepare('DELETE FROM student_checklists WHERE id = ?').bind(targetId).run();
      return new Response(JSON.stringify({ success: true, message: `ลบสรุป ${targetId} สำเร็จ` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
