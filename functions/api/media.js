/**
 * Cloudflare Pages Function: /api/media
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
    return new Response(JSON.stringify({ error: 'DB Binding Not Found on Pages' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    let { results: mediaRows } = await env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all();

    // ป้องกันการ Re-seed ซ้ำเมื่อถูกแอดมินสั่งลบสื่อ
    const { results: ratingRows } = await env.DB.prepare('SELECT * FROM media_ratings').all();

    const formattedList = (mediaRows || []).map(m => {
      const itemRatings = (ratingRows || []).filter(r => r.media_id === m.id).map(r => ({
        readability: r.readability,
        visualHarmony: r.visual_harmony,
        focusCta: r.focus_cta,
        reflection: r.reflection,
        timestamp: r.timestamp
      }));
      return {
        id: m.id,
        title: m.title,
        category: m.category,
        academicYear: m.academic_year || '2567',
        url: m.url,
        thumbnail: m.thumbnail,
        tags: m.tags ? m.tags.split(',') : [],
        description: m.description,
        ratings: itemRatings
      };
    });

    return new Response(JSON.stringify(formattedList), {
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
    return new Response(JSON.stringify({ error: 'DB Binding Not Found on Pages' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const body = await context.request.json();

    await env.DB.prepare(`
      INSERT INTO media_items (id, title, category, academic_year, url, thumbnail, tags, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        category = excluded.category,
        academic_year = excluded.academic_year,
        url = excluded.url,
        thumbnail = excluded.thumbnail,
        tags = excluded.tags,
        description = excluded.description
    `).bind(
      body.id || 'media-' + Date.now(),
      body.title,
      body.category,
      body.academicYear || '2567',
      body.url,
      body.thumbnail || body.url,
      Array.isArray(body.tags) ? body.tags.join(',') : (body.tags || ''),
      body.description || ''
    ).run();

    return new Response(JSON.stringify({ success: true, message: 'บันทึกสื่อลง D1 Database สำเร็จ' }), {
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
    await env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(queryId).run();
    await env.DB.prepare('DELETE FROM media_ratings WHERE media_id = ?').bind(queryId).run();

    return new Response(JSON.stringify({ success: true, message: 'ลบสื่อจาก D1 Database สำเร็จ' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
