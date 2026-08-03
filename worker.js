/**
 * Cloudflare Worker Full Application & API Engine for Learning Media Repository
 * (คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง)
 * 
 * Subdomain: exemplar-learning-media.parisa-aew.workers.dev
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. API Endpoint: POST /api/checklists
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

      // 2. API Endpoint: GET /api/media
      if (pathname === '/api/media' && request.method === 'GET') {
        if (env.DB) {
          const { results } = await env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all();
          return jsonResponse(results, corsHeaders);
        }
        return jsonResponse([], corsHeaders);
      }

      // 3. Serve Frontend Application HTML Directly at root /
      const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>คลังสื่อการเรียนรู้ผลงานต้นแบบ โรงเรียนวัดนาวง</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    ${getCssContent()}
  </style>
</head>
<body>

  <!-- Navigation Bar -->
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <div class="brand-icon">
          <i class="fa-solid fa-graduation-cap"></i>
        </div>
        <div class="brand-text">
          <span class="brand-title">คลังสื่อผลงานต้นแบบ</span>
        </div>
      </div>

      <div class="nav-actions">
        <button id="rubricGuideBtn" class="btn btn-outline-nav" title="ดูเกณฑ์การประเมินดาว 3 มิติ">
          <i class="fa-solid fa-book-open"></i>
          <span>เกณฑ์ประเมิน</span>
        </button>

        <button id="openChecklistModalBtn" class="btn btn-outline-nav" title="แบบสรุปถอดบทเรียนประเมินความรู้ K">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>สรุปถอดบทเรียน (Checklist)</span>
        </button>

        <button id="openSubmitBannerModalBtn" class="btn btn-outline-nav" title="ส่งผลงานแบนเนอร์ที่ออกแบบ (งานเดี่ยว)">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>ส่งแบนเนอร์ของฉัน</span>
        </button>

        <button id="adminToggleBtn" class="btn btn-admin">
          <i class="fa-solid fa-user-shield"></i>
          <span id="adminBtnText">เข้าสู่ระบบครู</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Admin Mode Notification Banner -->
  <div id="adminModeBanner" class="admin-banner hidden">
    <div class="container admin-banner-content">
      <div class="admin-banner-text">
        <i class="fa-solid fa-lock-open me-2"></i>
        <span>คุณกำลังอยู่ใน <strong>โหมดผู้ดูแลระบบ (Admin Panel)</strong> - สามารถบริหารจัดการสื่อ หมวดหมู่ และดูผลสรุปถอดบทเรียนของนักเรียนได้</span>
      </div>
      <button id="exitAdminBtn" class="btn btn-sm btn-light">
        <i class="fa-solid fa-right-from-bracket me-1"></i> ออกจากโหมดแอดมิน
      </button>
    </div>
  </div>

  <!-- Hero Header -->
  <header class="hero-section">
    <div class="hero-bg-accent"></div>
    <div class="container hero-container">
      <h1 class="hero-title">
        คลังสื่อการเรียนรู้ <br>
        <span class="gradient-text">ผลงานต้นแบบ</span>
      </h1>
      <p class="hero-description">
        ศูนย์รวมผลงานดิจิทัลต้นแบบ เช่น เว็บไซต์ประยุกต์, แบนเนอร์สื่อความหมาย, วิดีโอ UX/UI และใบความรู้ 
        เพื่อให้ผู้เรียนเข้ามาศึกษา วิเคราะห์องค์ประกอบ สรุปถอดบทเรียนความรู้ และส่งผลงานแบนเนอร์ของตนเอง
      </p>

      <div class="hero-stats">
        <div class="stat-chip">
          <i class="fa-solid fa-layer-group"></i>
          <span id="totalMediaStat">0</span> สื่อการเรียนรู้
        </div>
        <div class="stat-chip clickable-chip" onclick="openAvgRatingSummaryModal()" style="cursor: pointer;" title="คลิกดูสรุปคะแนนประเมินดาวเจาะลึก 3 มิติ">
          <i class="fa-solid fa-star text-amber"></i>
          <span id="avgRatingStat">0.0</span> คะแนนประเมินเฉลี่ย
        </div>
        <div class="stat-chip">
          <i class="fa-solid fa-users text-cyan"></i>
          <span id="totalReviewsStat">0</span> ครั้งที่ร่วมประเมิน
        </div>
        <div class="stat-chip highlight-chip" id="checklistsStatChip">
          <i class="fa-solid fa-clipboard-check text-emerald"></i>
          <span id="totalChecklistsStat">0</span> นักเรียนส่งสรุปบทเรียนแล้ว
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container main-content">

    <section class="controls-section">
      <div class="search-bar-wrapper">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="searchInput" placeholder="ค้นหาชื่อสื่อ, คำอธิบาย หรือแท็กหมวดหมู่..." autocomplete="off">
        <button id="clearSearchBtn" class="btn-clear hidden" title="ล้างการค้นหา">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="filter-tabs" id="filterTabs"></div>
    </section>

    <!-- Admin Operations Toolbar -->
    <section id="adminToolbar" class="admin-toolbar hidden">
      <div class="admin-toolbar-header">
        <h2><i class="fa-solid fa-sliders text-indigo me-2"></i>เครื่องมือจัดการหลังบ้านครู</h2>
        <div class="admin-toolbar-actions">
          <button id="openAddMediaModalBtn" class="btn btn-admin-tool">
            <i class="fa-solid fa-plus me-1 text-indigo"></i> เพิ่มสื่อใหม่
          </button>
          
          <button id="openManageCategoriesModalBtn" class="btn btn-admin-tool">
            <i class="fa-solid fa-tags me-1 text-amber"></i> จัดการหมวดหมู่สื่อ
          </button>

          <button id="openViewChecklistsModalBtn" class="btn btn-admin-tool">
            <i class="fa-solid fa-list-check me-1 text-emerald"></i> ตรวจสรุปถอดบทเรียนนักเรียน
          </button>

          <button id="exportCsvBtn" class="btn btn-admin-tool">
            <i class="fa-solid fa-file-excel me-1 text-cyan"></i> Export ผลประเมินดาว (CSV)
          </button>
        </div>
      </div>
    </section>

    <section class="media-section">
      <div class="section-header">
        <h2 id="sectionTitle"><i class="fa-solid fa-list-check me-2"></i>รายการสื่อการเรียนรู้ต้นแบบ</h2>
        <span id="resultCountBadge" class="count-badge">แสดง 0 รายการ</span>
      </div>

      <div id="mediaGrid" class="media-grid"></div>

      <div id="emptyState" class="empty-state hidden">
        <div class="empty-icon"><i class="fa-solid fa-folder-open"></i></div>
        <h3>ไม่พบสื่อการเรียนรู้ที่ค้นหา</h3>
        <p>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูนะครับ</p>
        <button id="resetFiltersBtn" class="btn btn-outline">แสดงสื่อทั้งหมด</button>
      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-container">
      <div class="footer-info">
        <p class="footer-title">คลังสื่อการเรียนรู้ผลงานต้นแบบ</p>
        <p class="footer-sub">พัฒนาระบบโดยนางปริศา มานพ ครูโรงเรียนวัดนาวง</p>
      </div>
      <div class="footer-links">
        <button class="footer-link-btn" onclick="openRubricModal()">เกณฑ์การประเมินดาว</button> | 
        <button class="footer-link-btn" onclick="openChecklistModal()">สรุปถอดบทเรียน (Define Checklist)</button> | 
        <button class="footer-link-btn" onclick="openSubmitBannerModal()">ส่งผลงานแบนเนอร์ของฉัน</button>
      </div>
    </div>
  </footer>

  <!-- Modals -->
  <div id="submitBannerModal" class="modal-overlay hidden">
    <div class="modal-container modal-lg">
      <div class="modal-header">
        <div>
          <h3><i class="fa-solid fa-cloud-arrow-up text-emerald me-2"></i>ส่งผลงานแบนเนอร์ (งานเดี่ยว)</h3>
          <p class="modal-subtitle">อัปโหลดแบนเนอร์ที่นักเรียนออกแบบ เพื่อเข้าสู่คลังสื่อการเรียนรู้ให้เพื่อนๆ ร่วมประเมิน</p>
        </div>
        <button class="modal-close" onclick="closeSubmitBannerModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <form id="studentBannerForm" onsubmit="handleStudentBannerSubmit(event)">
          <div class="checklist-section-box mb-3">
            <h4><i class="fa-solid fa-user-graduate text-indigo me-2"></i>ข้อมูลผู้เรียน (เจ้าของผลงาน)</h4>
            <div class="form-row mt-2">
              <div class="form-group col-6">
                <label for="bannerAuthorName">ชื่อ - นามสกุลผู้เรียน *</label>
                <input type="text" id="bannerAuthorName" class="form-control" placeholder="เช่น ด.ช.สมชาย ใจดี" required>
              </div>
              <div class="form-group col-3">
                <label for="bannerStudentClass">ชั้น *</label>
                <input type="text" id="bannerStudentClass" class="form-control" placeholder="เช่น ม.3/1" required>
              </div>
              <div class="form-group col-3">
                <label for="bannerStudentNo">เลขที่ *</label>
                <input type="number" id="bannerStudentNo" class="form-control" placeholder="เช่น 5" min="1" max="60" required>
              </div>
              <div class="form-group col-3">
                <label for="bannerAcademicYear">ปีการศึกษา *</label>
                <input type="text" id="bannerAcademicYear" class="form-control" value="2567" placeholder="เช่น 2567" required>
              </div>
            </div>
          </div>

          <div class="checklist-question-box mb-3">
            <div class="form-group">
              <label for="bannerTitleInput" class="question-title text-indigo">ชื่อผลงานแบนเนอร์ / หัวข้อประชาสัมพันธ์ *</label>
              <input type="text" id="bannerTitleInput" class="form-control mt-1" placeholder="เช่น แบนเนอร์รณรงค์ประหยัดพลังงานดิจิทัล" required>
            </div>

            <div class="form-group mt-3">
              <label for="bannerConceptInput" class="question-title text-amber">แนวคิดการออกแบบสรุปสั้นๆ (Design Concept) *</label>
              <p class="question-hint">(อธิบายจุดเด่นเรื่องการเลือกใช้สี, ฟอนต์ หรือจุดสนใจ Call to Action ของแบนเนอร์นี้)</p>
              <textarea id="bannerConceptInput" class="form-control" rows="3" placeholder="✍️ อธิบายแนวคิดการออกแบบ..." required></textarea>
            </div>
          </div>

          <div class="checklist-question-box mb-3">
            <label class="question-title text-rose">
              <i class="fa-solid fa-image me-1"></i> ไฟล์รูปภาพแบนเนอร์ที่ออกแบบ *
            </label>
            <p class="question-hint">เลือกอัปโหลดรูปภาพแบนเนอร์จากเครื่อง (ไฟล์ JPG/PNG) หรือวางลิงก์รูปภาพ</p>

            <div class="form-group mt-2">
              <label for="bannerFileInput">1. เลือกรูปภาพจากเครื่องของฉัน:</label>
              <input type="file" id="bannerFileInput" class="form-control" accept="image/*" onchange="previewBannerImage(event)">
            </div>

            <div class="form-group mt-2">
              <label for="bannerUrlInput">2. หรือวางลิงก์ URL รูปภาพ / Canva (กรณีไม่อัปโหลดไฟล์):</label>
              <input type="url" id="bannerUrlInput" class="form-control" placeholder="https://..." oninput="previewBannerUrl(event)">
            </div>

            <div id="bannerImagePreviewBox" class="mt-3 hidden text-center" style="background: #0f172a; padding: 1rem; border-radius: var(--radius-md);">
              <p class="text-light mb-2" style="font-size: 0.85rem;"><i class="fa-solid fa-eye me-1"></i> ตัวอย่างรูปภาพแบนเนอร์ที่จะส่ง:</p>
              <img id="bannerImagePreview" src="" alt="Preview" style="max-height: 250px; max-width: 100%; border-radius: var(--radius-sm); object-fit: contain;">
            </div>
          </div>

          <div class="modal-footer px-0 pb-0 mt-4">
            <button type="button" class="btn btn-ghost" onclick="closeSubmitBannerModal()">ยกเลิก</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane me-1"></i> ส่งผลงานแบนเนอร์เข้าคลังสื่อ</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Checklist Modal -->
  <div id="checklistModal" class="modal-overlay hidden">
    <div class="modal-container modal-lg">
      <div class="modal-header">
        <div>
          <h3><i class="fa-solid fa-pen-to-square text-indigo me-2"></i>แบบสรุปถอดบทเรียน (Define Checklist)</h3>
          <p class="modal-subtitle">สำรวจและประเมินผลงานต้นแบบเพื่อกำหนดเกณฑ์การออกแบบสื่อของตนเอง</p>
        </div>
        <button class="modal-close" onclick="closeChecklistModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <form id="checklistForm" onsubmit="handleChecklistSubmit(event)">
          <div class="checklist-section-box">
            <h4><i class="fa-solid fa-user-graduate text-indigo me-2"></i>ข้อมูลผู้เรียน</h4>
            <div class="form-row mt-2">
              <div class="form-group col-6">
                <label for="studentName">ชื่อ - นามสกุล *</label>
                <input type="text" id="studentName" class="form-control" placeholder="เช่น ด.ช.สมชาย ใจดี" required>
              </div>
              <div class="form-group col-3">
                <label for="studentClass">ชั้น *</label>
                <input type="text" id="studentClass" class="form-control" placeholder="เช่น ม.3/1" required>
              </div>
              <div class="form-group col-3">
                <label for="studentNo">เลขที่ *</label>
                <input type="number" id="studentNo" class="form-control" placeholder="เช่น 5" min="1" max="60" required>
              </div>
            </div>
          </div>

          <div class="alert alert-info mt-3">
            <i class="fa-solid fa-circle-info me-1"></i> <strong>คำชี้แจง:</strong> จากการสำรวจและประเมินผลงานต้นแบบ ให้นักเรียนระบุข้อสรุปเพื่อใช้เป็นเกณฑ์การออกแบบสื่อ/แบนเนอร์ของตนเอง
          </div>

          <div class="checklist-question-box mt-3">
            <label class="question-title text-indigo">1. ข้อดีที่ควรนำมาเป็นแบบอย่าง (Best Practices) *</label>
            <p class="question-hint">(แบนเนอร์หรือสื่อที่ได้ดาวเยอะ มีลักษณะอย่างไรที่เราจะนำมาปรับใช้กับงานของเรา?)</p>
            <textarea id="bestPracticesInput" class="form-control" rows="3" placeholder="✍️ พิมพ์สรุปข้อดีที่เป็นแบบอย่าง..." required></textarea>
          </div>

          <div class="checklist-question-box mt-3">
            <label class="question-title text-rose">2. ข้อผิดพลาดที่ต้องระวังและหลีกเลี่ยง (Things to Avoid) *</label>
            <p class="question-hint">(ข้อเสียหรือจุดบกพร่องที่พบจากงานที่ได้ดาวน้อย ซึ่งเราจะไม่ทำตาม?)</p>
            <textarea id="thingsToAvoidInput" class="form-control" rows="3" placeholder="⚠️ พิมพ์สรุปข้อควรระวังและหลีกเลี่ยง..." required></textarea>
          </div>

          <div class="checklist-question-box mt-3">
            <label class="question-title text-amber">3. กฎเหล็ก 3 ข้อ (Design Rules) สำหรับการออกแบบของฉัน *</label>
            
            <div class="form-group mt-2">
              <label for="ruleColorInput"><i class="fa-solid fa-palette text-amber me-1"></i> เรื่องการใช้สี / พื้นหลัง:</label>
              <input type="text" id="ruleColorInput" class="form-control" placeholder="เช่น ใช้สีโทนเย็นคู่กับสีสว่าง ไม่เกิน 3 สี..." required>
            </div>

            <div class="form-group mt-2">
              <label for="ruleFontInput"><i class="fa-solid fa-font text-indigo me-1"></i> เรื่องฟอนต์ / ข้อความ:</label>
              <input type="text" id="ruleFontInput" class="form-control" placeholder="เช่น ขนาดตัวหนังสืออ่านง่าย จัดหัวข้อชัดเจน..." required>
            </div>

            <div class="form-group mt-2">
              <label for="ruleCtaInput"><i class="fa-solid fa-bullseye text-rose me-1"></i> เรื่องจุดสนใจ (Focus & CTA):</label>
              <input type="text" id="ruleCtaInput" class="form-control" placeholder="เช่น วางจุดเด่นไว้ตรงกลาง หรือใส่ปุ่มสะดุดตา..." required>
            </div>
          </div>

          <div class="modal-footer px-0 pb-0 mt-4">
            <button type="button" class="btn btn-ghost" onclick="closeChecklistModal()">ยกเลิก</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane me-1"></i> ส่งแบบสรุปถอดบทเรียน</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Other Modals -->
  <div id="viewChecklistsModal" class="modal-overlay hidden">
    <div class="modal-container modal-lg">
      <div class="modal-header">
        <h3><i class="fa-solid fa-clipboard-list text-indigo me-2"></i>รายการแบบสรุปถอดบทเรียนของนักเรียน (K Assessment)</h3>
        <button class="modal-close" onclick="closeViewChecklistsModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span id="checklistsCountBadge" class="count-badge">ส่งแล้ว 0 คน</span>
          <button onclick="exportChecklistsCSV()" class="btn btn-sm btn-success">
            <i class="fa-solid fa-file-excel me-1"></i> Export ข้อมูลสรุปถอดบทเรียน (CSV)
          </button>
        </div>

        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>ชั้น/เลขที่</th>
                <th>ข้อดี (Best Practices)</th>
                <th>ข้อควรระวัง (Things to Avoid)</th>
                <th>กฎเหล็ก 3 ข้อ (สี/ฟอนต์/CTA)</th>
                <th>วันที่ส่ง</th>
                <th>ลบ</th>
              </tr>
            </thead>
            <tbody id="checklistsTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeViewChecklistsModal()">ปิดหน้าต่าง</button>
      </div>
    </div>
  </div>

  <div id="avgRatingSummaryModal" class="modal-overlay hidden">
    <div class="modal-container">
      <div class="modal-header">
        <div>
          <h3><i class="fa-solid fa-chart-line text-amber me-2"></i>สรุปผลคะแนนประเมินดาว 3 มิติภาพรวม</h3>
          <p class="modal-subtitle">คะแนนดาวเฉลี่ยเจาะลึกจากการประเมินสื่อของผู้เรียนทุกคน</p>
        </div>
        <button class="modal-close" onclick="closeAvgRatingSummaryModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="rating-overall-hero mb-4">
          <div class="big-score-num text-amber" id="modalHeroAvgScore">0.0</div>
          <div class="big-score-stars" id="modalHeroAvgStars">⭐⭐⭐⭐⭐</div>
          <p class="mt-1 text-muted" id="modalHeroTotalReviews">คำนวณจากทั้งหมด 0 ครั้งที่ร่วมประเมิน</p>
        </div>

        <h4 class="mb-3"><i class="fa-solid fa-layer-group text-indigo me-2"></i>คะแนนดาวเฉลี่ยแยกรายมิติ</h4>
        
        <div class="dim-score-card mb-3">
          <div class="dim-score-header">
            <span><i class="fa-solid fa-font text-indigo me-2"></i><strong>1. Readability (ความอ่านง่าย)</strong></span>
            <span class="dim-score-badge" id="dimReadabilityScore">0.0 / 5.0</span>
          </div>
          <div class="progress-bar-bg mt-2">
            <div class="progress-bar-fill fill-indigo" id="dimReadabilityBar" style="width: 0%;"></div>
          </div>
        </div>

        <div class="dim-score-card mb-3">
          <div class="dim-score-header">
            <span><i class="fa-solid fa-palette text-amber me-2"></i><strong>2. Visual Harmony (ความสวยงาม)</strong></span>
            <span class="dim-score-badge" id="dimVisualScore">0.0 / 5.0</span>
          </div>
          <div class="progress-bar-bg mt-2">
            <div class="progress-bar-fill fill-amber" id="dimVisualBar" style="width: 0%;"></div>
          </div>
        </div>

        <div class="dim-score-card mb-3">
          <div class="dim-score-header">
            <span><i class="fa-solid fa-bullseye text-rose me-2"></i><strong>3. Focus & CTA (จุดสนใจ)</strong></span>
            <span class="dim-score-badge" id="dimFocusScore">0.0 / 5.0</span>
          </div>
          <div class="progress-bar-bg mt-2">
            <div class="progress-bar-fill fill-rose" id="dimFocusBar" style="width: 0%;"></div>
          </div>
        </div>

        <h4 class="mt-4 mb-2"><i class="fa-solid fa-trophy text-amber me-2"></i>สื่อที่ได้คะแนนดาวสูงสุด 3 อันดับแรก</h4>
        <div id="topRatedSummaryList" class="top-rated-list"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeAvgRatingSummaryModal()">ปิดหน้าต่าง</button>
      </div>
    </div>
  </div>

  <div id="adminLoginModal" class="modal-overlay hidden">
    <div class="modal-container modal-sm">
      <div class="modal-header">
        <h3><i class="fa-solid fa-lock text-indigo me-2"></i>เข้าสู่ระบบผู้ดูแล (ครู)</h3>
        <button class="modal-close" onclick="closeAdminLoginModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <form id="adminLoginForm" onsubmit="handleAdminLogin(event)">
          <div class="form-group">
            <label for="adminPassword">กรอกรหัสผ่านเข้าใช้งาน:</label>
            <input type="password" id="adminPassword" class="form-control" placeholder="กรอกรหัสผ่านผู้ดูแลระบบ" required autocomplete="current-password">
          </div>
          <div id="adminLoginError" class="alert alert-danger mt-3 hidden">
            <i class="fa-solid fa-circle-exclamation me-1"></i> รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
          </div>
          <div class="modal-footer px-0 pb-0 mt-4">
            <button type="button" class="btn btn-ghost" onclick="closeAdminLoginModal()">ยกเลิก</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-key me-1"></i> เข้าสู่ระบบ</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div id="rubricModal" class="modal-overlay hidden">
    <div class="modal-container">
      <div class="modal-header">
        <h3><i class="fa-solid fa-book-bookmark text-indigo me-2"></i>เกณฑ์การประเมินสื่อต้นแบบ 3 มิติ</h3>
        <button class="modal-close" onclick="closeRubricModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="rubric-card">
          <div class="rubric-icon icon-indigo"><i class="fa-solid fa-font"></i></div>
          <div class="rubric-detail">
            <h4>1. Readability (ความอ่านง่ายและโครงสร้างภาษา)</h4>
            <ul>
              <li><strong>5 ดาว:</strong> ตัวอักษรขนาดพอดี อ่านง่ายชัดเจน สีตัวอักษรตัดกับพื้นหลัง</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeRubricModal()">รับทราบและเข้าใจแล้ว</button>
      </div>
    </div>
  </div>

  <div id="mediaViewerModal" class="modal-overlay hidden">
    <div class="modal-container modal-lg">
      <div class="modal-header">
        <h3 id="viewerTitle">ชื่อสื่อการเรียนรู้</h3>
        <button class="modal-close" onclick="closeViewerModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div id="viewerContentContainer" class="viewer-content"></div>
        <div class="viewer-meta mt-4">
          <div class="meta-row">
            <span id="viewerCategoryBadge" class="badge">หมวดหมู่</span>
            <span id="viewerYearBadge" class="badge badge-light">ปีการศึกษา</span>
          </div>
          <p id="viewerDescription" class="mt-2 text-muted"></p>
          <div id="viewerTags" class="tags-wrapper mt-2"></div>
        </div>
      </div>
      <div class="modal-footer">
        <a id="viewerExternalLink" href="#" target="_blank" class="btn btn-outline">
          <i class="fa-solid fa-up-right-from-square me-1"></i> เปิดในหน้าต่างใหม่
        </a>
        <button id="viewerRateBtn" class="btn btn-primary">
          <i class="fa-solid fa-star me-1"></i> ประเมินสื่อนี้
        </button>
      </div>
    </div>
  </div>

  <div id="ratingModal" class="modal-overlay hidden">
    <div class="modal-container">
      <div class="modal-header">
        <div>
          <h3>ประเมินและถอดบทเรียนสื่อต้นแบบ</h3>
          <p id="ratingMediaTitle" class="modal-subtitle">ชื่อสื่อการเรียนรู้</p>
        </div>
        <button class="modal-close" onclick="closeRatingModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <form id="ratingForm" onsubmit="handleRatingSubmit(event)">
          <input type="hidden" id="ratingMediaId">
          <div class="rating-dimension">
            <div class="dimension-header">
              <label><i class="fa-solid fa-font text-indigo me-1"></i> 1. Readability</label>
              <span id="readabilityValue" class="rating-val-badge">5.0</span>
            </div>
            <div class="star-rating-selector" data-dimension="readability">
              <i class="fa-solid fa-star star-btn active" data-score="1"></i>
              <i class="fa-solid fa-star star-btn active" data-score="2"></i>
              <i class="fa-solid fa-star star-btn active" data-score="3"></i>
              <i class="fa-solid fa-star star-btn active" data-score="4"></i>
              <i class="fa-solid fa-star star-btn active" data-score="5"></i>
            </div>
          </div>

          <div class="rating-dimension mt-3">
            <div class="dimension-header">
              <label><i class="fa-solid fa-palette text-amber me-1"></i> 2. Visual Harmony</label>
              <span id="visualHarmonyValue" class="rating-val-badge">5.0</span>
            </div>
            <div class="star-rating-selector" data-dimension="visualHarmony">
              <i class="fa-solid fa-star star-btn active" data-score="1"></i>
              <i class="fa-solid fa-star star-btn active" data-score="2"></i>
              <i class="fa-solid fa-star star-btn active" data-score="3"></i>
              <i class="fa-solid fa-star star-btn active" data-score="4"></i>
              <i class="fa-solid fa-star star-btn active" data-score="5"></i>
            </div>
          </div>

          <div class="rating-dimension mt-3">
            <div class="dimension-header">
              <label><i class="fa-solid fa-bullseye text-rose me-1"></i> 3. Focus & CTA</label>
              <span id="focusCtaValue" class="rating-val-badge">5.0</span>
            </div>
            <div class="star-rating-selector" data-dimension="focusCta">
              <i class="fa-solid fa-star star-btn active" data-score="1"></i>
              <i class="fa-solid fa-star star-btn active" data-score="2"></i>
              <i class="fa-solid fa-star star-btn active" data-score="3"></i>
              <i class="fa-solid fa-star star-btn active" data-score="4"></i>
              <i class="fa-solid fa-star star-btn active" data-score="5"></i>
            </div>
          </div>

          <div class="rating-summary-box mt-4">
            <span>คะแนนรวมเฉลี่ยของคุณ:</span>
            <span id="liveAvgRating" class="rating-score-highlight">5.0</span> / 5.0
          </div>

          <div class="form-group mt-3">
            <label for="reflectionText"><i class="fa-solid fa-pen-to-square text-cyan me-1"></i> ข้อคิดเห็นถอดบทเรียนจากสื่อนี้:</label>
            <textarea id="reflectionText" rows="3" class="form-control" placeholder="พิมพ์ข้อคิดเห็น..."></textarea>
          </div>

          <div class="modal-footer px-0 pb-0 mt-4">
            <button type="button" class="btn btn-ghost" onclick="closeRatingModal()">ยกเลิก</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane me-1"></i> บันทึกผลการประเมิน</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- JavaScript Bundle Engine -->
  <script>
    ${getJsContent()}
  </script>
</body>
</html>`;

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};

function jsonResponse(data, headers) {
  return new Response(JSON.stringify(data), {
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function getCssContent() {
  return `
    :root {
      --primary-50: #eef2ff; --primary-100: #e0e7ff; --primary-500: #6366f1; --primary-600: #4f46e5; --primary-700: #4338ca; --primary-900: #1e1b4b;
      --accent-cyan: #06b6d4; --accent-amber: #f59e0b; --accent-emerald: #10b981; --accent-rose: #f43f5e; --accent-purple: #8b5cf6;
      --bg-slate: #f8fafc; --bg-card: #ffffff; --text-main: #0f172a; --text-muted: #64748b; --text-light: #94a3b8; --border-color: #e2e8f0;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1); --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1); --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      --radius-sm: 0.375rem; --radius-md: 0.75rem; --radius-lg: 1rem; --radius-full: 9999px; --transition-fast: 0.15s ease; --transition-normal: 0.25s ease;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Prompt', 'Inter', sans-serif; background-color: var(--bg-slate); color: var(--text-main); line-height: 1.6; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
    .gradient-text { background: linear-gradient(135deg, #a5b4fc 0%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .text-indigo { color: var(--primary-600); } .text-amber { color: var(--accent-amber); } .text-cyan { color: var(--accent-cyan); } .text-rose { color: var(--accent-rose); } .text-emerald { color: var(--accent-emerald); } .text-light { color: var(--text-light); } .text-muted { color: var(--text-muted); }
    .hidden { display: none !important; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-3 { margin-top: 0.75rem; } .mt-4 { margin-top: 1rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-4 { margin-bottom: 1rem; } .me-1 { margin-right: 0.25rem; } .me-2 { margin-right: 0.5rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; font-family: inherit; font-weight: 500; font-size: 0.9rem; padding: 0.55rem 1.15rem; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; transition: var(--transition-normal); text-decoration: none; gap: 0.4rem; }
    .btn-primary { background: linear-gradient(135deg, var(--primary-600), var(--primary-700)); color: #ffffff; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
    .btn-primary:hover { background: linear-gradient(135deg, var(--primary-700), var(--primary-900)); transform: translateY(-2px); }
    .btn-outline { background-color: transparent; border-color: var(--border-color); color: var(--text-main); }
    .btn-outline-nav, .btn-outline-checklist, .btn-admin { background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff; border-radius: var(--radius-full); font-weight: 500; backdrop-filter: blur(8px); }
    .btn-outline-nav:hover, .btn-outline-checklist:hover, .btn-admin:hover { background: #ffffff; color: var(--primary-900); transform: translateY(-2px); }
    .btn-admin-tool { background: #ffffff; border: 1px solid var(--border-color); color: var(--text-main); border-radius: var(--radius-full); font-weight: 500; font-size: 0.9rem; padding: 0.55rem 1.15rem; box-shadow: var(--shadow-sm); display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; }
    .btn-admin-tool:hover { background: var(--primary-600); color: #ffffff; border-color: var(--primary-600); transform: translateY(-2px); }
    .btn-admin-tool:hover i { color: #ffffff !important; }
    .btn-ghost { background: transparent; color: var(--text-muted); }
    .btn-success { background-color: var(--accent-emerald); color: #ffffff; }
    .btn-light { background-color: #ffffff; color: var(--text-main); border-color: var(--border-color); }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.825rem; border-radius: var(--radius-sm); }
    .navbar { background-color: var(--primary-900); border-bottom: 1px solid rgba(255, 255, 255, 0.1); position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow-md); }
    .nav-container { display: flex; align-items: center; justify-content: space-between; height: 4.25rem; max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; }
    .nav-brand { display: flex; align-items: center; gap: 0.85rem; color: #ffffff; }
    .brand-icon { width: 2.6rem; height: 2.6rem; background: linear-gradient(135deg, var(--accent-cyan), var(--primary-500)); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
    .brand-title { font-size: 1.15rem; font-weight: 700; }
    .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
    .admin-banner { background: linear-gradient(90deg, #312e81, #4338ca); color: #ffffff; padding: 0.6rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2); }
    .admin-banner-content { display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; }
    .hero-section { position: relative; background: radial-gradient(circle at 50% 0%, #2e1065 0%, #1e1b4b 70%, #0f172a 100%); color: #ffffff; padding: 4rem 0 3.5rem 0; text-align: center; overflow: hidden; }
    .hero-container { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; }
    .hero-title { font-size: 2.5rem; font-weight: 700; line-height: 1.25; margin-bottom: 1rem; max-width: 900px; }
    .hero-description { font-size: 1.05rem; color: #cbd5e1; max-width: 750px; font-weight: 300; margin-bottom: 2rem; }
    .hero-stats { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
    .stat-chip { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); padding: 0.5rem 1.25rem; border-radius: var(--radius-full); font-size: 0.9rem; color: #ffffff; display: flex; align-items: center; gap: 0.5rem; }
    .stat-chip.highlight-chip { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); }
    .controls-section { margin-top: -1.75rem; margin-bottom: 2.5rem; position: relative; z-index: 10; }
    .search-bar-wrapper { background: var(--bg-card); border-radius: var(--radius-lg); padding: 0.5rem 0.75rem 0.5rem 1.25rem; display: flex; align-items: center; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); max-width: 800px; margin: 0 auto 1.5rem auto; }
    .search-bar-wrapper input { border: none; outline: none; width: 100%; font-family: inherit; font-size: 1rem; color: var(--text-main); background: transparent; }
    .filter-tabs { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
    .filter-btn { background: var(--bg-card); border: 1px solid var(--border-color); padding: 0.55rem 1.1rem; border-radius: var(--radius-full); font-family: inherit; font-size: 0.9rem; font-weight: 500; color: var(--text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; box-shadow: var(--shadow-sm); }
    .filter-btn.active { background: var(--primary-600); border-color: var(--primary-600); color: #ffffff; }
    .admin-toolbar { background: #ffffff; border: 1px dashed var(--primary-500); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; }
    .admin-toolbar-header { display: flex; align-items: center; justify-content: space-between; }
    .admin-toolbar-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .count-badge { background-color: var(--primary-50); color: var(--primary-700); font-weight: 600; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.85rem; border: 1px solid var(--primary-100); }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.75rem; }
    .media-card { background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow: hidden; box-shadow: var(--shadow-md); transition: var(--transition-normal); display: flex; flex-direction: column; position: relative; }
    .media-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-xl); border-color: var(--primary-500); }
    .card-thumbnail-wrapper { position: relative; width: 100%; height: 200px; background-color: #cbd5e1; overflow: hidden; }
    .card-thumbnail { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
    .card-overlay-badges { position: absolute; top: 0.75rem; left: 0.75rem; right: 0.75rem; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }
    .badge { padding: 0.25rem 0.65rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge-website { background: #3b82f6; color: #ffffff; } .badge-banner { background: #8b5cf6; color: #ffffff; } .badge-video { background: #ef4444; color: #ffffff; } .badge-document { background: #10b981; color: #ffffff; }
    .card-body { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-title { font-size: 1.15rem; font-weight: 700; line-height: 1.35; color: var(--text-main); margin-bottom: 0.5rem; }
    .card-description { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tags-wrapper { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .tag-chip { background: var(--bg-slate); color: var(--text-muted); font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); }
    .card-rating-box { background-color: var(--primary-50); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; margin-top: auto; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--primary-100); }
    .card-footer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--bg-slate); border-top: 1px solid var(--border-color); }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-container { background: var(--bg-card); border-radius: var(--radius-lg); width: 100%; max-width: 650px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: var(--shadow-xl); border: 1px solid var(--border-color); overflow: hidden; }
    .modal-lg { max-width: 900px; } .modal-sm { max-width: 420px; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; }
    .modal-close { background: transparent; border: none; font-size: 1.25rem; color: var(--text-light); cursor: pointer; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); background-color: var(--bg-slate); display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-group label { font-size: 0.875rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem; }
    .form-control { font-family: inherit; font-size: 0.95rem; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: #ffffff; color: var(--text-main); }
    .form-row { display: flex; gap: 1rem; } .col-6 { flex: 2; } .col-3 { flex: 1; }
    .checklist-section-box { background: var(--primary-50); border: 1px solid var(--primary-100); border-radius: var(--radius-md); padding: 1.25rem; }
    .checklist-question-box { background: var(--bg-slate); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; }
    .footer { background: var(--primary-900); color: #a5b4fc; padding: 2.5rem 0; margin-top: 5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.9rem; }
    .footer-container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .footer-link-btn { background: transparent; border: none; color: #a5b4fc; font-family: inherit; font-size: inherit; cursor: pointer; text-decoration: underline; }
  `;
}

function getJsContent() {
  return `
    const STORAGE_KEY_MEDIA = 'exemplar_media_items_v1';
    const STORAGE_KEY_CATEGORIES = 'exemplar_categories_v1';
    const STORAGE_KEY_CHECKLISTS = 'exemplar_checklists_v1';
    const ADMIN_PASSCODE = 'admin121314';

    const INITIAL_CATEGORIES = [
      { id: 'website', name: 'เว็บไซต์ต้นแบบ', icon: 'fa-globe', badgeClass: 'badge-website' },
      { id: 'banner', name: 'แบนเนอร์ Best Practice', icon: 'fa-image', badgeClass: 'badge-banner' },
      { id: 'student-banner', name: 'ผลงานแบนเนอร์นักเรียน', icon: 'fa-user-astronaut', badgeClass: 'badge-banner' },
      { id: 'video', name: 'วิดีโอ UX/UI', icon: 'fa-play', badgeClass: 'badge-video' },
      { id: 'document', name: 'ใบความรู้/เอกสาร', icon: 'fa-file-lines', badgeClass: 'badge-document' }
    ];

    const INITIAL_MEDIA_DATA = [
      {
        id: 'media-1',
        title: 'เว็บไซต์ผลงานพอร์ตโฟลิโอดิจิทัล (Student Portfolio Website)',
        category: 'website',
        academicYear: '2567',
        url: 'https://example.com/portfolio-m3',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        tags: ['HTML5', 'CSS Grid', 'UX/UI', 'พอร์ตโฟลิโอ'],
        description: 'ผลงานเว็บไซต์ส่วนตัวสำหรับจัดเก็บผลงาน ออกแบบด้วยโครงสร้าง Grid System เน้นอ่านง่าย อ่านสบายตา',
        ratings: [{ readability: 5, visualHarmony: 5, focusCta: 4, reflection: 'จัดวางเมนูหัวข้ออ่านง่ายมาก', timestamp: '2026-08-01' }]
      },
      {
        id: 'media-2',
        title: 'แบนเนอร์ประชาสัมพันธ์กิจกรรมเทคโนโลยี (Best Practice Banner)',
        category: 'banner',
        academicYear: '2567',
        url: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=1200&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80',
        tags: ['Graphic Design', 'Banner', 'การนำสายตา'],
        description: 'ตัวอย่างแบนเนอร์สื่อความหมายที่ดี มีพอยท์เน้นจุดสนใจชัดเจน (Focus & CTA)',
        ratings: [{ readability: 5, visualHarmony: 4, focusCta: 5, reflection: 'ปุ่ม Call to Action โดดเด่น', timestamp: '2026-08-02' }]
      }
    ];

    let mediaList = [], categoriesList = [], checklistsList = [];
    let activeCategory = 'all', searchQuery = '', isAdminLoggedIn = false;
    let currentRatingScores = { readability: 5, visualHarmony: 5, focusCta: 5 };
    let currentBannerImageData = '';

    document.addEventListener('DOMContentLoaded', () => { initApp(); setupEventListeners(); });

    function initApp() {
      const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      categoriesList = storedCategories ? JSON.parse(storedCategories) : [...INITIAL_CATEGORIES];
      if (!categoriesList.some(c => c.id === 'student-banner')) {
        categoriesList.push({ id: 'student-banner', name: 'ผลงานแบนเนอร์นักเรียน', icon: 'fa-user-astronaut', badgeClass: 'badge-banner' });
      }
      const storedMedia = localStorage.getItem(STORAGE_KEY_MEDIA);
      mediaList = storedMedia ? JSON.parse(storedMedia) : [...INITIAL_MEDIA_DATA];
      const storedChecklists = localStorage.getItem(STORAGE_KEY_CHECKLISTS);
      checklistsList = storedChecklists ? JSON.parse(storedChecklists) : [];
      renderApp();
    }

    function renderApp() {
      document.getElementById('totalMediaStat').textContent = mediaList.length;
      document.getElementById('avgRatingStat').textContent = '4.8';
      document.getElementById('totalReviewsStat').textContent = '12';
      document.getElementById('totalChecklistsStat').textContent = checklistsList.length;
      renderFilterTabs();
      renderMediaGrid();
    }

    function renderFilterTabs() {
      let html = \`<button class="filter-btn \${activeCategory === 'all' ? 'active' : ''}" onclick="filterCat('all')"><i class="fa-solid fa-border-all"></i> ทั้งหมด</button>\`;
      categoriesList.forEach(cat => {
        html += \`<button class="filter-btn \${activeCategory === cat.id ? 'active' : ''}" onclick="filterCat('\${cat.id}')"><i class="fa-solid \${cat.icon}"></i> \${cat.name}</button>\`;
      });
      document.getElementById('filterTabs').innerHTML = html;
    }

    function filterCat(catId) { activeCategory = catId; renderApp(); }

    function renderMediaGrid() {
      const filtered = mediaList.filter(m => activeCategory === 'all' || m.category === activeCategory);
      document.getElementById('resultCountBadge').textContent = \`แสดง \${filtered.length} จาก \${mediaList.length} รายการ\`;
      let html = '';
      filtered.forEach(item => {
        html += \`
          <div class="media-card">
            <div class="card-thumbnail-wrapper">
              <img src="\${item.thumbnail}" class="card-thumbnail">
              <div class="card-overlay-badges"><span class="badge badge-website">\${item.category}</span></div>
            </div>
            <div class="card-body">
              <h3 class="card-title">\${item.title}</h3>
              <p class="card-description">\${item.description}</p>
            </div>
            <div class="card-footer-actions">
              <button class="btn btn-outline btn-sm" onclick="alert('เปิดสื่อ \${item.title}')">เข้าชมสื่อ</button>
              <button class="btn btn-primary btn-sm" onclick="openRatingModal('\${item.id}')">ประเมินสื่อ</button>
            </div>
          </div>
        \`;
      });
      document.getElementById('mediaGrid').innerHTML = html;
    }

    function openSubmitBannerModal() { document.getElementById('submitBannerModal').classList.remove('hidden'); }
    function closeSubmitBannerModal() { document.getElementById('submitBannerModal').classList.add('hidden'); }
    function openChecklistModal() { document.getElementById('checklistModal').classList.remove('hidden'); }
    function closeChecklistModal() { document.getElementById('checklistModal').classList.add('hidden'); }
    function openRubricModal() { document.getElementById('rubricModal').classList.remove('hidden'); }
    function closeRubricModal() { document.getElementById('rubricModal').classList.add('hidden'); }
    function openAvgRatingSummaryModal() { document.getElementById('avgRatingSummaryModal').classList.remove('hidden'); }
    function closeAvgRatingSummaryModal() { document.getElementById('avgRatingSummaryModal').classList.add('hidden'); }
    function openViewChecklistsModal() { document.getElementById('viewChecklistsModal').classList.remove('hidden'); }
    function closeViewChecklistsModal() { document.getElementById('viewChecklistsModal').classList.add('hidden'); }
    function openAdminLoginModal() { document.getElementById('adminLoginModal').classList.remove('hidden'); }
    function closeAdminLoginModal() { document.getElementById('adminLoginModal').classList.add('hidden'); }
    
    function setupEventListeners() {
      document.getElementById('openSubmitBannerModalBtn').addEventListener('click', openSubmitBannerModal);
      document.getElementById('openChecklistModalBtn').addEventListener('click', openChecklistModal);
      document.getElementById('rubricGuideBtn').addEventListener('click', openRubricModal);
      document.getElementById('adminToggleBtn').addEventListener('click', openAdminLoginModal);
    }
  `;
}
