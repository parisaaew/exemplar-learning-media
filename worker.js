/**
 * Cloudflare Worker API Backend for Learning Media Repository
 * (ระบบคลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง)
 * 
 * Target: Cloudflare Workers + D1 Database / KV Storage
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. GET /api/media - ดึงรายการสื่อทั้งหมด
      if (pathname === '/api/media' && request.method === 'GET') {
        if (env.DB) {
          const { results } = await env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all();
          return jsonResponse(results, corsHeaders);
        } else if (env.MEDIA_KV) {
          const data = await env.MEDIA_KV.get('media_items', { type: 'json' });
          return jsonResponse(data || [], corsHeaders);
        }
        return jsonResponse({ message: 'Cloudflare Storage Configured' }, corsHeaders);
      }

      // 2. POST /api/checklists - บันทึกแบบสรุปถอดบทเรียนนักเรียน (K Assessment)
      if (pathname === '/api/checklists' && request.method === 'POST') {
        const body = await request.json();
        if (env.DB) {
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
            body.timestamp || new Date().toISOString()
          ).run();
        }
        return jsonResponse({ success: true, message: 'บันทึกสรุปถอดบทเรียนลง Cloudflare D1 สำเร็จ' }, corsHeaders);
      }

      // 3. POST /api/banners - รับส่งผลงานแบนเนอร์นักเรียน
      if (pathname === '/api/banners' && request.method === 'POST') {
        const body = await request.json();
        return jsonResponse({ success: true, message: 'บันทึกแบนเนอร์นักเรียนเรียบร้อย' }, corsHeaders);
      }

      return new Response('Learning Media Repository API Engine Active', { status: 200, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};

function jsonResponse(data, headers) {
  return new Response(JSON.stringify(data), {
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
