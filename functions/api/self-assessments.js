/**
 * Cloudflare Pages Function: /api/self-assessments
 * Project: คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง
 * Description: API บริหารจัดการข้อมูลแบบประเมินตนเอง (Self-Assessment) ของนักเรียน
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
    'Cache-Control': 'no-cache, must-revalidate'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'DB Binding Not Found' }), { status: 500, headers: corsHeaders });
  }

  try {
    // สร้างตาราง student_self_assessments อัตโนมัติหากยังไม่มีในฐานข้อมูล D1
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS student_self_assessments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        student_class TEXT NOT NULL,
        student_no TEXT NOT NULL,
        q1_discovery TEXT NOT NULL,
        q2_key_rule TEXT NOT NULL,
        q3_improvement TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `).run().catch(() => {});

    // -------------------------------------------------------------
    // GET: อ่านรายการแบบประเมินตนเองทั้งหมด
    // -------------------------------------------------------------
    if (method === 'GET') {
      let results = [];
      try {
        const res = await env.DB.prepare('SELECT * FROM student_self_assessments ORDER BY rowid DESC').all();
        results = res.results || [];
      } catch (e) {
        const res = await env.DB.prepare('SELECT * FROM student_self_assessments').all();
        results = res.results || [];
      }

      const formatted = (results || []).map(item => ({
        id: item.id,
        name: item.name,
        studentClass: item.student_class || item.studentClass || '',
        studentNo: item.student_no || item.studentNo || '',
        q1Discovery: item.q1_discovery || item.q1Discovery || '',
        q2KeyRule: item.q2_key_rule || item.q2KeyRule || '',
        q3Improvement: item.q3_improvement || item.q3Improvement || '',
        timestamp: item.timestamp || ''
      }));

      return new Response(JSON.stringify(formatted), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // -------------------------------------------------------------
    // POST: บันทึกแบบประเมินตนเองใหม่ หรือลบข้อมูล (action: delete)
    // -------------------------------------------------------------
    if (method === 'POST') {
      const body = await request.json();

      if (body.action === 'delete' && body.id) {
        const targetId = body.id;
        let decodedId = targetId;
        try { decodedId = decodeURIComponent(targetId).trim(); } catch(e) {}
        await env.DB.prepare('DELETE FROM student_self_assessments WHERE id = ? OR id = ?').bind(targetId, decodedId).run();
        return new Response(JSON.stringify({ success: true, message: `ลบแบบประเมินตนเอง ${targetId} สำเร็จ` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      await env.DB.prepare(`
        INSERT INTO student_self_assessments (id, name, student_class, student_no, q1_discovery, q2_key_rule, q3_improvement, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          student_class = excluded.student_class,
          student_no = excluded.student_no,
          q1_discovery = excluded.q1_discovery,
          q2_key_rule = excluded.q2_key_rule,
          q3_improvement = excluded.q3_improvement,
          timestamp = excluded.timestamp
      `).bind(
        body.id || 'self-' + Date.now(),
        body.name || '',
        body.studentClass || body.student_class || '',
        body.studentNo || body.student_no || '',
        body.q1Discovery || body.q1_discovery || '',
        body.q2KeyRule || body.q2_key_rule || '',
        body.q3Improvement || body.q3_improvement || '',
        body.timestamp || new Date().toISOString().split('T')[0]
      ).run();

      return new Response(JSON.stringify({ success: true, message: 'บันทึกแบบประเมินตนเองลง D1 สำเร็จ' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // -------------------------------------------------------------
    // DELETE: ลบแบบประเมินตนเอง
    // -------------------------------------------------------------
    if (method === 'DELETE') {
      const targetId = queryId || (await request.json().catch(() => ({}))).id;
      if (!targetId) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: corsHeaders });

      let decodedId = targetId;
      try { decodedId = decodeURIComponent(targetId).trim(); } catch(e) {}
      await env.DB.prepare('DELETE FROM student_self_assessments WHERE id = ? OR id = ?').bind(targetId, decodedId).run();

      return new Response(JSON.stringify({ success: true, message: `ลบแบบประเมินตนเอง ${targetId} สำเร็จ` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
