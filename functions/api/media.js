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

    if (!mediaRows || mediaRows.length === 0) {
      await seedInitialMediaData(env.DB);
      const seeded = await env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all();
      mediaRows = seeded.results;
    }

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

async function seedInitialMediaData(db) {
  const initialMedia = [
    { id: 'media-1', title: 'เว็บไซต์ผลงานพอร์ตโฟลิโอดิจิทัล (Student Portfolio Website)', category: 'website', academic_year: '2567', url: 'https://example.com/portfolio-m3', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', tags: 'HTML5,CSS Grid,UX/UI,พอร์ตโฟลิโอ', description: 'ผลงานเว็บไซต์ส่วนตัวสำหรับจัดเก็บผลงาน ออกแบบด้วยโครงสร้าง Grid System เน้นอ่านง่าย อ่านสบายตา และมีจุดนำสายตาชัดเจน' },
    { id: 'media-2', title: 'แบนเนอร์ประชาสัมพันธ์กิจกรรมเทคโนโลยี (Best Practice Banner)', category: 'banner', academic_year: '2567', url: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80', tags: 'Graphic Design,Banner,Contrast,การนำสายตา', description: 'ตัวอย่างแบนเนอร์สื่อความหมายที่ดี มีพอยท์เน้นจุดสนใจชัดเจน (Focus & CTA) ใช้หลักการความต่างระดับสี (Color Contrast)' },
    { id: 'media-3', title: 'วิดีโอแนะนำหลักการออกแบบ UX/UI สำหรับนักเรียน', category: 'video', academic_year: '2567', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80', tags: 'UX/UI Video,Tutorial,Visual Design', description: 'วิดีโอความยาว 5 นาที สรุปหลักการเลือกใช้สี ตัวอักษร และการจัดวาง Layout ในการสร้างสรรค์สื่อดิจิทัลให้ตรงกลุ่มเป้าหมาย' },
    { id: 'media-4', title: 'ใบความรู้เรื่องการออกแบบ Wireframe & User Journey Map', category: 'document', academic_year: '2567', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80', tags: 'Document,PDF,Wireframe,ใบความรู้', description: 'เอกสารสรุปขั้นตอนการวางแผนสร้างเว็บด้วย Wireframe 8 ขั้นตอน พร้อมตัวอย่างการร่างภาพก่อนลงมือเขียนโค้ดจริง' },
    { id: 'media-5', title: 'เว็บไซต์ระบบลงทะเบียนกิจกรรมชมรมคอมพิวเตอร์', category: 'website', academic_year: '2566', url: 'https://example.com/club-reg', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', tags: 'Web Application,Form Design,UI Component', description: 'เว็บไซต์แอพพลิเคชันตัวอย่างการสร้างฟอร์มกรอกข้อมูล และปุ่มกดโต้ตอบ (Interactive Buttons) ดีไซน์เรียบหรูสไตล์ Minimal' },
    { id: 'media-6', title: 'ชุดสื่อนำเสนอ Infographic เรื่อง ความปลอดภัยในโลกไซเบอร์', category: 'banner', academic_year: '2567', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', tags: 'Infographic,Cyber Security,Visual Communication', description: 'สื่ออินโฟกราฟิกนำเสนอข้อมูลความปลอดภัยด้วยไอคอนและตัวเลขสถิติ ใช้โทนสีเขียว-น้ำเงินสื่อถึงความน่าเชื่อถือ' }
  ];

  for (const m of initialMedia) {
    await db.prepare(`
      INSERT INTO media_items (id, title, category, academic_year, url, thumbnail, tags, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(m.id, m.title, m.category, m.academic_year, m.url, m.thumbnail, m.tags, m.description).run();
  }
}
