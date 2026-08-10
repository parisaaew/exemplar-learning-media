/**
 * คลังสื่อการเรียนรู้ผลงานต้นแบบ
 * Application Logic & LocalStorage Data Engine
 */

// Storage Keys & Auth Passcode
const STORAGE_KEY_MEDIA = 'exemplar_media_items_v1';
const STORAGE_KEY_CATEGORIES = 'exemplar_categories_v1';
const STORAGE_KEY_CHECKLISTS = 'exemplar_checklists_v1';
const ADMIN_PASSCODE = 'admin121314';

// Cloudflare Integration Ready Config (Cloudflare Pages Functions Engine)
function getApiUrl(path) {
  return '/api' + path;
}

// หมวดหมู่เริ่มต้น
const INITIAL_CATEGORIES = [
  { id: 'website', name: 'เว็บไซต์ต้นแบบ', icon: 'fa-globe', badgeClass: 'badge-website' },
  { id: 'banner', name: 'แบนเนอร์ Best Practice', icon: 'fa-image', badgeClass: 'badge-banner' },
  { id: 'student-banner', name: 'ผลงานแบนเนอร์นักเรียน', icon: 'fa-user-astronaut', badgeClass: 'badge-banner' },
  { id: 'video', name: 'วิดีโอ UX/UI', icon: 'fa-play', badgeClass: 'badge-video' },
  { id: 'document', name: 'ใบความรู้/เอกสาร', icon: 'fa-file-lines', badgeClass: 'badge-document' }
];

// ข้อมูลสื่อเริ่มต้น
const INITIAL_MEDIA_DATA = [
  {
    id: 'media-1',
    title: 'เว็บไซต์ผลงานพอร์ตโฟลิโอดิจิทัล (Student Portfolio Website)',
    category: 'website',
    academicYear: '2567',
    url: 'https://example.com/portfolio-m3',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    tags: ['HTML5', 'CSS Grid', 'UX/UI', 'พอร์ตโฟลิโอ'],
    description: 'ผลงานเว็บไซต์ส่วนตัวสำหรับจัดเก็บผลงาน ออกแบบด้วยโครงสร้าง Grid System เน้นอ่านง่าย อ่านสบายตา และมีจุดนำสายตาชัดเจน',
    ratings: [
      { readability: 5, visualHarmony: 5, focusCta: 4, reflection: 'จัดวางเมนูหัวข้ออ่านง่ายมาก สีตัวหนังสือตัดกับพื้นหลังดี', timestamp: '2026-08-01' },
      { readability: 4, visualHarmony: 5, focusCta: 5, reflection: 'ใช้โทนสี Indigo คมชัดและทันสมัย อยากนำโครงสร้างนี้ไปใช้กับเว็บตนเอง', timestamp: '2026-08-02' }
    ]
  },
  {
    id: 'media-2',
    title: 'แบนเนอร์ประชาสัมพันธ์กิจกรรมเทคโนโลยี (Best Practice Banner)',
    category: 'banner',
    academicYear: '2567',
    url: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80',
    tags: ['Graphic Design', 'Banner', 'Contrast', 'การนำสายตา'],
    description: 'ตัวอย่างแบนเนอร์สื่อความหมายที่ดี มีพอยท์เน้นจุดสนใจชัดเจน (Focus & CTA) ใช้หลักการความต่างระดับสี (Color Contrast)',
    ratings: [
      { readability: 5, visualHarmony: 4, focusCta: 5, reflection: 'ปุ่ม Call to Action โดดเด่น มองเห็นได้ทันทีตั้งแต่แรกเห็น', timestamp: '2026-08-02' }
    ]
  },
  {
    id: 'media-3',
    title: 'วิดีโอแนะนำหลักการออกแบบ UX/UI สำหรับนักเรียน',
    category: 'video',
    academicYear: '2567',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    tags: ['UX/UI Video', 'Tutorial', 'Visual Design'],
    description: 'วิดีโอความยาว 5 นาที สรุปหลักการเลือกใช้สี ตัวอักษร และการจัดวาง Layout ในการสร้างสรรค์สื่อดิจิทัลให้ตรงกลุ่มเป้าหมาย',
    ratings: [
      { readability: 4, visualHarmony: 5, focusCta: 4, reflection: 'วิดีโอมีภาพประกอบชัดเจน เข้าใจง่าย การบรรยายไม่ช้าหรือเร็วเกินไป', timestamp: '2026-08-03' }
    ]
  },
  {
    id: 'media-4',
    title: 'ใบความรู้เรื่องการออกแบบ Wireframe & User Journey Map',
    category: 'document',
    academicYear: '2567',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
    tags: ['Document', 'PDF', 'Wireframe', 'ใบความรู้'],
    description: 'เอกสารสรุปขั้นตอนการวางแผนสร้างเว็บด้วย Wireframe 8 ขั้นตอน พร้อมตัวอย่างการร่างภาพก่อนลงมือเขียนโค้ดจริง',
    ratings: [
      { readability: 5, visualHarmony: 4, focusCta: 4, reflection: 'มีแผนภาพตัวอย่างชัดเจน ช่วยให้ออกแบบร่างเว็บได้ง่ายขึ้นมาก', timestamp: '2026-08-03' }
    ]
  },
  {
    id: 'media-5',
    title: 'เว็บไซต์ระบบลงทะเบียนกิจกรรมชมรมคอมพิวเตอร์',
    category: 'website',
    academicYear: '2566',
    url: 'https://example.com/club-reg',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    tags: ['Web Application', 'Form Design', 'UI Component'],
    description: 'เว็บไซต์แอพพลิเคชันตัวอย่างการสร้างฟอร์มกรอกข้อมูล และปุ่มกดโต้ตอบ (Interactive Buttons) ดีไซน์เรียบหรูสไตล์ Minimal',
    ratings: [
      { readability: 4, visualHarmony: 4, focusCta: 5, reflection: 'ฟอร์มใช้ง่าย ปุ่มกดส่งข้อมูลสะดุดตาดีมาก', timestamp: '2026-08-01' }
    ]
  },
  {
    id: 'media-6',
    title: 'ชุดสื่อนำเสนอ Infographic เรื่อง ความปลอดภัยในโลกไซเบอร์',
    category: 'banner',
    academicYear: '2567',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    tags: ['Infographic', 'Cyber Security', 'Visual Communication'],
    description: 'สื่ออินโฟกราฟิกนำเสนอข้อมูลความปลอดภัยด้วยไอคอนและตัวเลขสถิติ ใช้โทนสีเขียว-น้ำเงินสื่อถึงความน่าเชื่อถือ',
    ratings: [
      { readability: 5, visualHarmony: 5, focusCta: 4, reflection: 'แบ่งหมวดหมู่เนื้อหาได้เป็นสัดส่วน ไอคอนสื่อความหมายดีมาก', timestamp: '2026-08-03' }
    ]
  }
];

// ข้อมูลสรุปถอดบทเรียนรายบุคคลเริ่มต้น
const INITIAL_CHECKLISTS_DATA = [
  {
    id: 'chk-1',
    name: 'ด.ช.สมชาย ใจดี',
    studentClass: 'ม.3/1',
    studentNo: '5',
    bestPractices: 'ใช้สีตัวหนังสือคมชัดตัดกับพื้นหลัง จัดวางเป็นสัดส่วน มีปุ่ม CTA โดดเด่นอ่านง่าย',
    thingsToAvoid: 'หลีกเลี่ยงการใช้ฟอนต์ตัวหนังสืออ่านยากเกิน 3 ฟอนต์ และการใช้สีฉูดฉาดสะท้อนตา',
    ruleColor: 'ใช้โทนสีเย็น (Indigo) เป็นหลัก สลับสีขาว ไม่เกิน 3 สี',
    ruleFont: 'ใช้ฟอนต์ไม่มีหัวอ่านง่าย จัดขนาดหัวข้อ 24px และเนื้อหา 16px',
    ruleCta: 'ใส่ปุ่มกดสีส้ม/ชมพูตรงกลางภาพเพื่อนำสายตา',
    timestamp: '2026-08-03'
  }
];

// App State Global Variables
let mediaList = [];
let categoriesList = [];
let checklistsList = [];
let activeCategory = 'all';
let searchQuery = '';
let isAdminLoggedIn = false;
let currentRatingScores = { readability: 5, visualHarmony: 5, focusCta: 5 };
let currentBannerImageData = '';

// ==========================================
// Initialization & Storage Handling
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

const STORAGE_KEY_DELETED_MEDIA = 'exemplar_deleted_media_v1';
const STORAGE_KEY_DELETED_CHECKLISTS = 'exemplar_deleted_checklists_v1';

function getDeletedMediaIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_DELETED_MEDIA) || '[]')); } catch (e) { return new Set(); }
}
function markMediaAsDeleted(id) {
  const set = getDeletedMediaIds();
  set.add(id);
  localStorage.setItem(STORAGE_KEY_DELETED_MEDIA, JSON.stringify(Array.from(set)));
}

function getDeletedChecklistIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_DELETED_CHECKLISTS) || '[]')); } catch (e) { return new Set(); }
}
function markChecklistAsDeleted(id) {
  const set = getDeletedChecklistIds();
  set.add(id);
  localStorage.setItem(STORAGE_KEY_DELETED_CHECKLISTS, JSON.stringify(Array.from(set)));
}

function initApp() {
  // 1. Restore Admin Mode Session (ป้องกันหลุดเมื่อรีเฟรชหน้าเว็บ F5)
  isAdminLoggedIn = sessionStorage.getItem('exemplar_admin_logged_in') === 'true';

  // 2. ล้างความจำแคชเก่าชั่วคราวออก
  localStorage.removeItem(STORAGE_KEY_MEDIA);
  localStorage.removeItem(STORAGE_KEY_CHECKLISTS);
  localStorage.removeItem(STORAGE_KEY_CATEGORIES);

  // 3. ดึงข้อมูลสดจาก Cloudflare D1 Database
  fetchLiveDataFromD1();

  // 4. ตั้งระบบ Auto-Sync Real-time ดึงข้อมูลสดจาก D1 ทุก 3 วินาทีอัตโนมัติ
  setInterval(fetchLiveDataFromD1, 3000);

  renderApp();
}

function fetchLiveDataFromD1() {
  const ts = Date.now();

  Promise.all([
    fetch(getApiUrl('/media?_t=' + ts), { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    fetch(getApiUrl('/categories?_t=' + ts), { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    fetch(getApiUrl('/checklists?_t=' + ts), { cache: 'no-store' }).then(r => r.json()).catch(() => null)
  ]).then(([mediaData, categoriesData, checklistsData]) => {
    let hasChanged = false;

    if (Array.isArray(mediaData)) {
      if (JSON.stringify(mediaData) !== JSON.stringify(mediaList)) {
        mediaList = mediaData;
        hasChanged = true;
      }
    }

    if (Array.isArray(categoriesData) && categoriesData.length > 0) {
      if (JSON.stringify(categoriesData) !== JSON.stringify(categoriesList)) {
        categoriesList = categoriesData;
        hasChanged = true;
      }
    }

    if (Array.isArray(checklistsData)) {
      if (JSON.stringify(checklistsData) !== JSON.stringify(checklistsList)) {
        checklistsList = checklistsData;
        hasChanged = true;
      }
    }

    // วาดภาพหน้าจอใหม่เฉพาะเมื่อมีข้อมูลเปลี่ยนแปลงจริง ป้องกันหน้าจอกระพริบ 100%
    if (hasChanged) {
      renderApp();
    }
  });
}

function loadMediaLocalFallback() {
  const storedMedia = localStorage.getItem(STORAGE_KEY_MEDIA);
  if (storedMedia) {
    try { mediaList = JSON.parse(storedMedia); } catch (e) { mediaList = [...INITIAL_MEDIA_DATA]; }
  } else {
    mediaList = [...INITIAL_MEDIA_DATA];
    saveMediaToStorage();
  }
  renderApp();
}

function loadChecklistsLocalFallback() {
  const storedChecklists = localStorage.getItem(STORAGE_KEY_CHECKLISTS);
  if (storedChecklists) {
    try { checklistsList = JSON.parse(storedChecklists); } catch (e) { checklistsList = [...INITIAL_CHECKLISTS_DATA]; }
  } else {
    checklistsList = [...INITIAL_CHECKLISTS_DATA];
    saveChecklistsToStorage();
  }
  renderApp();
}

function saveMediaToStorage() { localStorage.setItem(STORAGE_KEY_MEDIA, JSON.stringify(mediaList)); }
function saveCategoriesToStorage() { localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categoriesList)); }
function saveChecklistsToStorage() { localStorage.setItem(STORAGE_KEY_CHECKLISTS, JSON.stringify(checklistsList)); }

// ==========================================
// Main Rendering Engine
// ==========================================

function renderApp() {
  renderStats();
  renderFilterTabs();
  renderCategoryFormSelect();
  renderMediaGrid();
  updateAdminUI();
}

function renderStats() {
  const totalMedia = mediaList.length;
  let totalReviews = 0;
  let sumRatingTotal = 0;

  mediaList.forEach(item => {
    if (item.ratings && item.ratings.length > 0) {
      totalReviews += item.ratings.length;
      sumRatingTotal += getItemAvgRating(item);
    }
  });

  const overallAvg = totalMedia > 0 && totalReviews > 0 ? (sumRatingTotal / totalMedia).toFixed(1) : '0.0';

  document.getElementById('totalMediaStat').textContent = totalMedia;
  document.getElementById('avgRatingStat').textContent = overallAvg;
  document.getElementById('totalReviewsStat').textContent = totalReviews;
  document.getElementById('totalChecklistsStat').textContent = checklistsList.length;
}

function renderFilterTabs() {
  const tabsContainer = document.getElementById('filterTabs');
  
  let html = `
    <button class="filter-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
      <i class="fa-solid fa-border-all"></i> ทั้งหมด
    </button>
  `;

  categoriesList.forEach(cat => {
    const isActive = activeCategory === cat.id ? 'active' : '';
    const iconClass = cat.icon || 'fa-tag';
    html += `
      <button class="filter-btn ${isActive}" data-category="${cat.id}">
        <i class="fa-solid ${iconClass}"></i> ${escapeHtml(cat.name)}
      </button>
    `;
  });

  tabsContainer.innerHTML = html;
}

function renderCategoryFormSelect() {
  const selectEl = document.getElementById('formCategory');
  if (!selectEl) return;

  let html = '';
  categoriesList.forEach(cat => {
    html += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
  });
  selectEl.innerHTML = html;
}

function getItemAvgRating(item) {
  if (!item.ratings || item.ratings.length === 0) return 0;
  
  let total = 0;
  item.ratings.forEach(r => {
    const dimAvg = (r.readability + r.visualHarmony + r.focusCta) / 3;
    total += dimAvg;
  });
  return total / item.ratings.length;
}

function renderMediaGrid() {
  const gridContainer = document.getElementById('mediaGrid');
  const emptyState = document.getElementById('emptyState');
  const countBadge = document.getElementById('resultCountBadge');

  const filteredList = mediaList.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      item.title.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) || 
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(q)));
    
    return matchCategory && matchQuery;
  });

  countBadge.textContent = `แสดง ${filteredList.length} จาก ${mediaList.length} รายการ`;

  if (filteredList.length === 0) {
    gridContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  
  let html = '';
  filteredList.forEach(item => {
    const avgScore = getItemAvgRating(item);
    const formattedAvg = avgScore > 0 ? avgScore.toFixed(1) : 'ยังไม่มี';
    const reviewCount = item.ratings ? item.ratings.length : 0;
    const isHallOfFame = avgScore >= 4.5;

    const catObj = categoriesList.find(c => c.id === item.category);
    const categoryLabel = catObj ? catObj.name : 'สื่อการเรียนรู้';
    const badgeClass = catObj && catObj.badgeClass ? catObj.badgeClass : 'badge-website';

    const fallbackImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
    const thumbnailSrc = item.thumbnail || fallbackImage;

    const tagsHtml = (item.tags || []).map(t => `<span class="tag-chip">#${t}</span>`).join('');
    const starsHtml = renderMiniStars(avgScore);

    html += `
      <div class="media-card" data-id="${item.id}">
        ${isAdminLoggedIn ? `
          <div class="card-admin-actions">
            <button class="btn-icon-admin edit" onclick="openEditMediaModal('${item.id}')" title="แก้ไขสื่อนี้">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-admin delete" onclick="confirmDeleteMedia(event, '${item.id}')" title="ลบสื่อนี้">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        ` : ''}

        <div class="card-thumbnail-wrapper" onclick="openMediaViewer('${item.id}')" style="cursor: pointer;">
          <img src="${thumbnailSrc}" alt="${escapeHtml(item.title)}" class="card-thumbnail" onerror="this.src='${fallbackImage}'">
          <div class="card-overlay-badges">
            <span class="badge ${badgeClass}">${escapeHtml(categoryLabel)}</span>
            ${isHallOfFame ? '<span class="badge badge-hall-of-fame"><i class="fa-solid fa-trophy"></i> ผลงานยอดเยี่ยม</span>' : ''}
          </div>
        </div>

        <div class="card-body">
          <div class="card-year-badge"><i class="fa-solid fa-calendar-days me-1"></i>ปีการศึกษา ${escapeHtml(item.academicYear || '2567')}</div>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-description">${escapeHtml(item.description || '')}</p>

          <div class="tags-wrapper">
            ${tagsHtml}
          </div>

          <div class="card-rating-box">
            <div class="rating-score-group">
              <span class="rating-score-num">${formattedAvg}</span>
              <div class="rating-stars-mini">${starsHtml}</div>
            </div>
            <span class="rating-count-text">(${reviewCount} ประเมิน)</span>
          </div>
        </div>

        <div class="card-footer-actions">
          <button class="btn btn-outline btn-sm" onclick="openMediaViewer('${item.id}')">
            <i class="fa-solid fa-eye me-1"></i> เข้าชมสื่อ
          </button>
          <button class="btn btn-primary btn-sm" onclick="openRatingModal('${item.id}')">
            <i class="fa-solid fa-star me-1"></i> ประเมินสื่อ
          </button>
        </div>
      </div>
    `;
  });

  gridContainer.innerHTML = html;
}

function renderMiniStars(score) {
  let starsHtml = '';
  const num = Math.round(score);
  for (let i = 1; i <= 5; i++) {
    if (i <= num) starsHtml += '<i class="fa-solid fa-star"></i>';
    else starsHtml += '<i class="fa-regular fa-star"></i>';
  }
  return starsHtml;
}

// ==========================================
// Student Individual Banner Submission Handlers
// ==========================================

function openSubmitBannerModal() {
  document.getElementById('studentBannerForm').reset();
  document.getElementById('bannerAcademicYear').value = '2569';
  document.getElementById('bannerImagePreviewBox').classList.add('hidden');
  currentBannerImageData = '';
  document.getElementById('submitBannerModal').classList.remove('hidden');
}

function closeSubmitBannerModal() {
  document.getElementById('submitBannerModal').classList.add('hidden');
}

function previewBannerImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  // บีบอัดรูปภาพให้มีขนาดย่อย (Max Width 800px, JPEG Quality 0.7)
  // เพื่อย่อรูปจาก 5MB-10MB เหลือเพียง ~50KB ส่งเข้า D1 Database ได้เร็วและไม่ค้าง
  compressImageFile(file, 800, 0.7, function(compressedBase64) {
    currentBannerImageData = compressedBase64;
    const previewImg = document.getElementById('bannerImagePreview');
    const previewBox = document.getElementById('bannerImagePreviewBox');
    previewImg.src = currentBannerImageData;
    previewBox.classList.remove('hidden');
  });
}

function compressImageFile(file, maxWidth, quality, callback) {
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(compressedDataUrl);
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

function previewBannerUrl(e) {
  const url = e.target.value.trim();
  if (url) {
    currentBannerImageData = url;
    const previewImg = document.getElementById('bannerImagePreview');
    const previewBox = document.getElementById('bannerImagePreviewBox');
    previewImg.src = url;
    previewBox.classList.remove('hidden');
  }
}

async function handleStudentBannerSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('bannerAuthorName').value.trim();
  const studentClass = document.getElementById('bannerStudentClass').value.trim();
  const studentNo = document.getElementById('bannerStudentNo').value.trim();
  const academicYear = document.getElementById('bannerAcademicYear').value.trim() || '2569';
  const title = document.getElementById('bannerTitleInput').value.trim();
  const concept = document.getElementById('bannerConceptInput').value.trim();

  const finalImgSrc = currentBannerImageData || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80';

  const newBannerItem = {
    id: 'media-' + Date.now(),
    title: `[ผลงานนักเรียน] ${title}`,
    category: 'student-banner',
    academicYear: academicYear,
    url: finalImgSrc,
    thumbnail: finalImgSrc,
    tags: [name, studentClass, `เลขที่${studentNo}`, `ปีการศึกษา${academicYear}`],
    description: `ผลงานโดย: ${name} (ชั้น ${studentClass} เลขที่ ${studentNo}) | ปีการศึกษา ${academicYear} | แนวคิดการออกแบบ: ${concept}`,
    ratings: []
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> กำลังส่งผลงานเข้า D1 Database...';
  }

  try {
    const res = await fetch(getApiUrl('/media'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBannerItem)
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      console.warn('D1 Database Notice:', data.error);
    }
  } catch (err) {
    console.warn('D1 Network Sync Notice:', err.message);
  } finally {
    mediaList.unshift(newBannerItem);
    currentBannerImageData = null;
    document.getElementById('studentBannerForm').reset();
    closeSubmitBannerModal();
    activeCategory = 'student-banner';
    renderApp();
    showToast(`ส่งผลงานแบนเนอร์ของ ${name} (ปีการศึกษา ${academicYear}) เข้าสู่คลังสื่อเรียบร้อยแล้ว!`);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

// ==========================================
// Average Rating Summary Modal Handlers
// ==========================================

function openAvgRatingSummaryModal() {
  let totalReviews = 0;
  let sumReadability = 0;
  let sumVisual = 0;
  let sumFocus = 0;
  let sumOverall = 0;

  mediaList.forEach(item => {
    if (item.ratings && item.ratings.length > 0) {
      item.ratings.forEach(r => {
        totalReviews++;
        sumReadability += r.readability || 0;
        sumVisual += r.visualHarmony || 0;
        sumFocus += r.focusCta || 0;
        sumOverall += (r.readability + r.visualHarmony + r.focusCta) / 3;
      });
    }
  });

  const avgReadability = totalReviews > 0 ? (sumReadability / totalReviews).toFixed(1) : '0.0';
  const avgVisual = totalReviews > 0 ? (sumVisual / totalReviews).toFixed(1) : '0.0';
  const avgFocus = totalReviews > 0 ? (sumFocus / totalReviews).toFixed(1) : '0.0';
  const avgOverall = totalReviews > 0 ? (sumOverall / totalReviews).toFixed(1) : '0.0';

  // Hero Card text
  document.getElementById('modalHeroAvgScore').textContent = avgOverall;
  document.getElementById('modalHeroAvgStars').innerHTML = renderMiniStars(parseFloat(avgOverall));
  document.getElementById('modalHeroTotalReviews').textContent = `คำนวณจากทั้งหมด ${totalReviews} ครั้งที่ร่วมประเมินสื่อในระบบ`;

  // Dimension Scores & Bars
  document.getElementById('dimReadabilityScore').textContent = `${avgReadability} / 5.0`;
  document.getElementById('dimReadabilityBar').style.width = `${(parseFloat(avgReadability) / 5) * 100}%`;

  document.getElementById('dimVisualScore').textContent = `${avgVisual} / 5.0`;
  document.getElementById('dimVisualBar').style.width = `${(parseFloat(avgVisual) / 5) * 100}%`;

  document.getElementById('dimFocusScore').textContent = `${avgFocus} / 5.0`;
  document.getElementById('dimFocusBar').style.width = `${(parseFloat(avgFocus) / 5) * 100}%`;

  // Top 3 Media
  const sortedMedia = [...mediaList].sort((a, b) => getItemAvgRating(b) - getItemAvgRating(a)).slice(0, 3);
  const listContainer = document.getElementById('topRatedSummaryList');
  if (listContainer) {
    let html = '';
    sortedMedia.forEach((item, index) => {
      const avg = getItemAvgRating(item).toFixed(1);
      const trophyIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      html += `
        <div class="top-rated-item" onclick="closeAvgRatingSummaryModal(); openMediaViewer('${item.id}');" style="cursor: pointer;">
          <div class="top-rated-rank">${trophyIcon}</div>
          <div class="top-rated-info">
            <strong>${escapeHtml(item.title)}</strong>
            <small class="d-block text-muted">${item.ratings ? item.ratings.length : 0} ครั้งการประเมิน</small>
          </div>
          <div class="top-rated-score text-amber">
            ⭐ ${avg}
          </div>
        </div>
      `;
    });
    listContainer.innerHTML = html;
  }

  document.getElementById('avgRatingSummaryModal').classList.remove('hidden');
}

async function handleChecklistSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  const name = (document.getElementById('studentName') || document.getElementById('studentNameInput'))?.value?.trim() || '';
  const studentClass = (document.getElementById('studentClass') || document.getElementById('studentClassInput'))?.value?.trim() || '';
  const studentNo = (document.getElementById('studentNo') || document.getElementById('studentNoInput'))?.value?.trim() || '';

  const bestPractices = document.getElementById('bestPracticesInput')?.value?.trim() || '';
  const thingsToAvoid = document.getElementById('thingsToAvoidInput')?.value?.trim() || '';
  const ruleColor = document.getElementById('ruleColorInput')?.value?.trim() || '';
  const ruleFont = document.getElementById('ruleFontInput')?.value?.trim() || '';
  const ruleCta = document.getElementById('ruleCtaInput')?.value?.trim() || '';

  if (!name) {
    alert('กรุณากรอกชื่อ-นามสกุลนักเรียนก่อนส่งครับ');
    return;
  }

  const newChecklist = {
    id: 'chk-' + Date.now(),
    name,
    studentClass,
    studentNo,
    bestPractices,
    thingsToAvoid,
    ruleColor,
    ruleFont,
    ruleCta,
    timestamp: new Date().toISOString().split('T')[0]
  };

  const submitBtn = e?.target?.querySelector ? e.target.querySelector('button[type="submit"]') : null;
  const originalHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> กำลังส่งแบบสรุปเข้า D1 Database...';
  }

  try {
    const res = await fetch(getApiUrl('/checklists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChecklist)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      console.warn('D1 Database Notice:', data.error);
    }
  } catch (err) {
    console.warn('D1 Network Sync Notice:', err.message);
  } finally {
    checklistsList.unshift(newChecklist);
    closeChecklistModal();
    renderApp();
    showToast(`บันทึกแบบสรุปถอดบทเรียนของ ${name} เรียบร้อยแล้ว!`);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

function closeAvgRatingSummaryModal() {
  document.getElementById('avgRatingSummaryModal').classList.add('hidden');
}

// ==========================================
// Event Listeners Setup
// ==========================================

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', !searchQuery);
    renderMediaGrid();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderMediaGrid();
  });

  const filterTabs = document.getElementById('filterTabs');
  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterTabs.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.getAttribute('data-category');
    renderMediaGrid();
  });

  document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    activeCategory = 'all';
    renderFilterTabs();
    renderMediaGrid();
  });

  document.getElementById('adminToggleBtn').addEventListener('click', () => {
    if (isAdminLoggedIn) exitAdminMode();
    else openAdminLoginModal();
  });

  document.getElementById('exitAdminBtn').addEventListener('click', exitAdminMode);
  document.getElementById('openSubmitBannerModalBtn').addEventListener('click', openSubmitBannerModal);
  document.getElementById('openAddMediaModalBtn').addEventListener('click', openAddMediaModal);
  document.getElementById('openManageCategoriesModalBtn').addEventListener('click', openManageCategoriesModal);
  document.getElementById('openChecklistModalBtn').addEventListener('click', openChecklistModal);
  document.getElementById('openViewChecklistsModalBtn').addEventListener('click', openViewChecklistsModal);
  document.getElementById('exportCsvBtn').addEventListener('click', exportRatingsCSV);
  document.getElementById('rubricGuideBtn').addEventListener('click', openRubricModal);

  setupStarRatingSelectors();
}

// ==========================================
// Student Define Checklist Handlers (Knowledge - K Assessment)
// ==========================================

function openChecklistModal() {
  document.getElementById('checklistForm').reset();
  document.getElementById('checklistModal').classList.remove('hidden');
}

function closeChecklistModal() { document.getElementById('checklistModal').classList.add('hidden'); }



// ==========================================
// Teacher View Student Checklists Modal (K Assessment Records)
// ==========================================

function openViewChecklistsModal() {
  renderChecklistsTable();
  document.getElementById('viewChecklistsModal').classList.remove('hidden');
}

function closeViewChecklistsModal() { document.getElementById('viewChecklistsModal').classList.add('hidden'); }

function renderChecklistsTable() {
  const tbody = document.getElementById('checklistsTableBody');
  const badge = document.getElementById('checklistsCountBadge');
  if (!tbody) return;

  badge.textContent = `ส่งแล้ว ${checklistsList.length} คน`;

  if (checklistsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">ยังไม่มีนักเรียนส่งแบบสรุปถอดบทเรียน</td></tr>`;
    return;
  }

  let html = '';
  checklistsList.forEach(item => {
    const studentClass = item.studentClass || item.student_class || '';
    const studentNo = item.studentNo || item.student_no || '';
    const bestPractices = item.bestPractices || item.best_practices || '';
    const thingsToAvoid = item.thingsToAvoid || item.things_to_avoid || '';
    const ruleColor = item.ruleColor || item.rule_color || '';
    const ruleFont = item.ruleFont || item.rule_font || '';
    const ruleCta = item.ruleCta || item.rule_cta || '';

    html += `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td><span class="badge badge-light">${escapeHtml(studentClass)} / เลขที่ ${escapeHtml(studentNo)}</span></td>
        <td style="max-width: 200px;"><small>${escapeHtml(bestPractices)}</small></td>
        <td style="max-width: 200px;"><small class="text-rose">${escapeHtml(thingsToAvoid)}</small></td>
        <td style="max-width: 220px;">
          <small class="d-block">🎨 <strong>สี:</strong> ${escapeHtml(ruleColor)}</small>
          <small class="d-block">🔤 <strong>ฟอนต์:</strong> ${escapeHtml(ruleFont)}</small>
          <small class="d-block">🎯 <strong>CTA:</strong> ${escapeHtml(ruleCta)}</small>
        </td>
        <td><small class="text-muted">${item.timestamp || '-'}</small></td>
        <td>
          <button class="btn btn-sm btn-ghost text-rose" onclick="deleteChecklist('${item.id}')" title="ลบข้อมูลนี้">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function deleteChecklist(chkId) {
  const item = checklistsList.find(c => c.id === chkId);
  if (!item) return;

  if (confirm(`ต้องการลบผลสรุปของนักเรียน "${item.name}" หรือไม่?`)) {
    markChecklistAsDeleted(chkId);
    checklistsList = checklistsList.filter(c => c.id !== chkId);
    saveChecklistsToStorage();

    // 1. ส่งคำสั่งลบทาง HTTP DELETE
    fetch(getApiUrl(`/checklists?id=${encodeURIComponent(chkId)}`), { method: 'DELETE' }).catch(() => {});
    // 2. ส่งคำสั่งลบสำรองทาง HTTP POST (action: 'delete')
    fetch(getApiUrl('/checklists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: chkId })
    }).catch(() => {});

    renderChecklistsTable();
    renderApp();
    showToast('ลบข้อมูลเรียบร้อยแล้ว');
  }
}

function exportChecklistsCSV() {
  if (checklistsList.length === 0) {
    alert('ไม่มีข้อมูลสรุปถอดบทเรียนสำหรับส่งออก');
    return;
  }

  let csvContent = '\uFEFF';
  csvContent += 'ID,ชื่อ-นามสกุล,ชั้น,เลขที่,ข้อดี(Best Practices),ข้อควรระวัง(Things to Avoid),กฎเหล็กเรื่องสี,กฎเหล็กเรื่องฟอนต์,กฎเหล็กเรื่องCTA,วันที่ส่ง\n';

  checklistsList.forEach(item => {
    const studentClass = item.studentClass || item.student_class || '';
    const studentNo = item.studentNo || item.student_no || '';
    const bestPractices = item.bestPractices || item.best_practices || '';
    const thingsToAvoid = item.thingsToAvoid || item.things_to_avoid || '';
    const ruleColor = item.ruleColor || item.rule_color || '';
    const ruleFont = item.ruleFont || item.rule_font || '';
    const ruleCta = item.ruleCta || item.rule_cta || '';

    const safeName = `"${(item.name || '').replace(/"/g, '""')}"`;
    const safeClass = `"${(studentClass || '').replace(/"/g, '""')}"`;
    const safeBest = `"${(bestPractices || '').replace(/"/g, '""')}"`;
    const safeAvoid = `"${(thingsToAvoid || '').replace(/"/g, '""')}"`;
    const safeColor = `"${(ruleColor || '').replace(/"/g, '""')}"`;
    const safeFont = `"${(item.ruleFont || '').replace(/"/g, '""')}"`;
    const safeCta = `"${(item.ruleCta || '').replace(/"/g, '""')}"`;

    csvContent += `${item.id},${safeName},${safeClass},${item.studentNo},${safeBest},${safeAvoid},${safeColor},${safeFont},${safeCta},${item.timestamp || ''}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `รายงานผลสรุปถอดบทเรียนนักเรียน_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('ดาวน์โหลดไฟล์ CSV ผลสรุปถอดบทเรียนเรียบร้อยแล้ว');
}

// ==========================================
// Interactive Star Rating Modal Handlers
// ==========================================

function setupStarRatingSelectors() {
  const selectors = document.querySelectorAll('.star-rating-selector');
  
  selectors.forEach(selector => {
    const dimension = selector.getAttribute('data-dimension');
    const stars = selector.querySelectorAll('.star-btn');

    stars.forEach(star => {
      star.addEventListener('click', () => {
        const score = parseInt(star.getAttribute('data-score'), 10);
        currentRatingScores[dimension] = score;

        stars.forEach(s => {
          const sScore = parseInt(s.getAttribute('data-score'), 10);
          s.classList.toggle('active', sScore <= score);
        });

        const badgeEl = document.getElementById(`${dimension}Value`);
        if (badgeEl) badgeEl.textContent = score.toFixed(1);

        calculateLiveAvgRating();
      });
    });
  });
}

function calculateLiveAvgRating() {
  const avg = (currentRatingScores.readability + currentRatingScores.visualHarmony + currentRatingScores.focusCta) / 3;
  document.getElementById('liveAvgRating').textContent = avg.toFixed(1);
}

function openRatingModal(mediaId) {
  const item = mediaList.find(m => m.id === mediaId);
  if (!item) return;

  document.getElementById('ratingMediaId').value = mediaId;
  document.getElementById('ratingMediaTitle').textContent = item.title;
  document.getElementById('reflectionText').value = '';

  currentRatingScores = { readability: 5, visualHarmony: 5, focusCta: 5 };
  document.querySelectorAll('.star-rating-selector').forEach(selector => {
    selector.querySelectorAll('.star-btn').forEach(s => s.classList.add('active'));
  });
  document.getElementById('readabilityValue').textContent = '5.0';
  document.getElementById('visualHarmonyValue').textContent = '5.0';
  document.getElementById('focusCtaValue').textContent = '5.0';
  document.getElementById('liveAvgRating').textContent = '5.0';

  document.getElementById('ratingModal').classList.remove('hidden');
}

function closeRatingModal() { document.getElementById('ratingModal').classList.add('hidden'); }

function handleRatingSubmit(e) {
  e.preventDefault();
  const mediaId = document.getElementById('ratingMediaId').value;
  const reflectionText = document.getElementById('reflectionText').value.trim();

  const item = mediaList.find(m => m.id === mediaId);
  if (!item) return;

  if (!item.ratings) item.ratings = [];

  const newRating = {
    readability: currentRatingScores.readability,
    visualHarmony: currentRatingScores.visualHarmony,
    focusCta: currentRatingScores.focusCta,
    reflection: reflectionText,
    timestamp: new Date().toISOString().split('T')[0]
  };

  item.ratings.push(newRating);
  saveMediaToStorage();

  // ส่งข้อมูลคะแนนดาวเข้า Cloudflare D1 Database API
  fetch(getApiUrl('/ratings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaId: mediaId,
      readability: newRating.readability,
      visualHarmony: newRating.visualHarmony,
      focusCta: newRating.focusCta,
      reflection: newRating.reflection,
      timestamp: newRating.timestamp
    })
  }).catch(err => console.error('Cloudflare D1 rating sync error:', err));

  closeRatingModal();
  renderApp();

  showToast('บันทึกผลการประเมินดาวเรียบร้อยแล้ว!');
}

// ==========================================
// Media Viewer Modal
// ==========================================

function openMediaViewer(mediaId) {
  const item = mediaList.find(m => m.id === mediaId);
  if (!item) return;

  const catObj = categoriesList.find(c => c.id === item.category);

  document.getElementById('viewerTitle').textContent = item.title;
  document.getElementById('viewerDescription').textContent = item.description || '';
  document.getElementById('viewerCategoryBadge').textContent = catObj ? catObj.name.toUpperCase() : item.category.toUpperCase();
  document.getElementById('viewerYearBadge').textContent = `ปีการศึกษา ${item.academicYear || '2569'}`;
  
  const tagsContainer = document.getElementById('viewerTags');
  tagsContainer.innerHTML = (item.tags || []).map(t => `<span class="tag-chip">#${t}</span>`).join('');

  const container = document.getElementById('viewerContentContainer');
  const externalBtn = document.getElementById('viewerExternalLink');
  const rateBtn = document.getElementById('viewerRateBtn');

  externalBtn.href = item.url;
  rateBtn.onclick = () => {
    closeViewerModal();
    openRatingModal(item.id);
  };

  if (item.category === 'video' || item.url.includes('youtube.com')) {
    const videoId = getYouTubeVideoId(item.url);
    if (videoId) {
      container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allowfullscreen allow="autoplay"></iframe>`;
    } else {
      container.innerHTML = `<img src="${item.thumbnail}" alt="${escapeHtml(item.title)}">`;
    }
  } else if (item.category === 'banner' || item.category === 'student-banner' || item.category === 'website') {
    container.innerHTML = `<img src="${item.thumbnail || item.url}" alt="${escapeHtml(item.title)}">`;
  } else {
    container.innerHTML = `
      <div style="text-align: center; color: white; padding: 2rem;">
        <i class="fa-solid fa-file-pdf" style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;"></i>
        <h4>${escapeHtml(item.title)}</h4>
        <p style="color: #cbd5e1; margin-top: 0.5rem;">คลิกปุ่มด้านล่างเพื่อเปิดอ่านเอกสารตัวเต็มในหน้าต่างใหม่</p>
      </div>
    `;
  }

  document.getElementById('mediaViewerModal').classList.remove('hidden');
}

function closeViewerModal() {
  document.getElementById('mediaViewerModal').classList.add('hidden');
  document.getElementById('viewerContentContainer').innerHTML = '';
}

function getYouTubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// ==========================================
// Rubric Info Modal
// ==========================================

function openRubricModal() { document.getElementById('rubricModal').classList.remove('hidden'); }
function closeRubricModal() { document.getElementById('rubricModal').classList.add('hidden'); }

// ==========================================
// Admin Authentication & Panel
// ==========================================

function openAdminLoginModal() {
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminLoginError').classList.add('hidden');
  document.getElementById('adminLoginModal').classList.remove('hidden');
}

function closeAdminLoginModal() { document.getElementById('adminLoginModal').classList.add('hidden'); }

function handleAdminLogin(e) {
  e.preventDefault();
  const pwd = document.getElementById('adminPassword').value;

  if (pwd === ADMIN_PASSCODE) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('exemplar_admin_logged_in', 'true');
    closeAdminLoginModal();
    renderApp();
    showToast('เข้าสู่โหมดผู้ดูแลระบบ (Admin Mode) สำเร็จ');
  } else {
    document.getElementById('adminLoginError').classList.remove('hidden');
  }
}

function exitAdminMode() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('exemplar_admin_logged_in');
  renderApp();
  showToast('ออกจากโหมดผู้ดูแลระบบเรียบร้อยแล้ว');
}

function updateAdminUI() {
  const banner = document.getElementById('adminModeBanner');
  const toolbar = document.getElementById('adminToolbar');
  const btnText = document.getElementById('adminBtnText');
  const checklistsStatChip = document.getElementById('checklistsStatChip');

  if (isAdminLoggedIn) {
    banner.classList.remove('hidden');
    toolbar.classList.remove('hidden');
    btnText.textContent = 'โหมดแอดมิน (ใช้งานอยู่)';

    if (checklistsStatChip) {
      checklistsStatChip.style.cursor = 'pointer';
      checklistsStatChip.title = 'คลิกเพื่อตรวจดูรายการแบบสรุปถอดบทเรียนของนักเรียนทุกคน (เฉพาะครู)';
      checklistsStatChip.onclick = openViewChecklistsModal;
      checklistsStatChip.classList.add('clickable-chip');
    }
  } else {
    banner.classList.add('hidden');
    toolbar.classList.add('hidden');
    btnText.textContent = 'เข้าสู่ระบบครู';

    if (checklistsStatChip) {
      checklistsStatChip.style.cursor = 'default';
      checklistsStatChip.title = 'สถิติจำนวนนักเรียนที่ส่งสรุปบทเรียน';
      checklistsStatChip.onclick = null;
      checklistsStatChip.classList.remove('clickable-chip');
    }
  }
}

// ==========================================
// Category Management Engine
// ==========================================

function openManageCategoriesModal() {
  renderCategoriesTable();
  document.getElementById('manageCategoriesModal').classList.remove('hidden');
}

function closeManageCategoriesModal() { document.getElementById('manageCategoriesModal').classList.add('hidden'); }

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  let html = '';
  categoriesList.forEach(cat => {
    const iconClass = cat.icon || 'fa-tag';
    html += `
      <tr>
        <td><i class="fa-solid ${iconClass} text-indigo" style="font-size: 1.2rem;"></i></td>
        <td><strong>${escapeHtml(cat.name)}</strong></td>
        <td><code>${cat.id}</code></td>
        <td>
          <button class="btn btn-sm btn-ghost text-rose" onclick="deleteCategory('${cat.id}')" title="ลบหมวดหมู่นี้">
            <i class="fa-solid fa-trash"></i> ลบ
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function handleAddCategory(e) {
  e.preventDefault();
  const nameInput = document.getElementById('catNameInput');
  const iconInput = document.getElementById('catIconInput');

  const catName = nameInput.value.trim();
  const catIcon = iconInput.value;

  if (!catName) return;

  const catId = 'cat-' + Date.now();
  const badgeClasses = ['badge-website', 'badge-banner', 'badge-video', 'badge-document'];
  const randomBadge = badgeClasses[Math.floor(Math.random() * badgeClasses.length)];

  const newCat = { id: catId, name: catName, icon: catIcon, badgeClass: randomBadge };

  categoriesList.push(newCat);
  saveCategoriesToStorage();

  // ส่งบันทึกหมวดหมู่ใหม่เข้า Cloudflare D1 Database
  fetch(getApiUrl('/categories'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCat)
  }).catch(err => console.error('D1 Category Add Error:', err));

  nameInput.value = '';
  renderCategoriesTable();
  renderApp();
  showToast(`เพิ่มหมวดหมู่ "${catName}" เรียบร้อยแล้ว`);
}

function deleteCategory(catId) {
  const catObj = categoriesList.find(c => c.id === catId);
  if (!catObj) return;

  const countInUse = mediaList.filter(m => m.category === catId).length;
  if (countInUse > 0) {
    if (!confirm(`หมวดหมู่ "${catObj.name}" มีสื่ออยู่ ${countInUse} รายการ ต้องการลบหมวดหมู่นี้หรือไม่?`)) return;
  }

  categoriesList = categoriesList.filter(c => c.id !== catId);
  saveCategoriesToStorage();

  // ส่งคำสั่งลบหมวดหมู่ออกจาก Cloudflare D1 Database
  fetch(getApiUrl(`/categories?id=${encodeURIComponent(catId)}`), { method: 'DELETE' })
    .catch(err => console.error('D1 Category Delete Error:', err));

  renderCategoriesTable();
  renderApp();
  showToast(`ลบหมวดหมู่ "${catObj.name}" เรียบร้อยแล้ว`);
}

// ==========================================
// Admin CRUD Operations (Add, Edit, Delete Media)
// ==========================================

function openAddMediaModal() {
  document.getElementById('addEditModalTitle').innerHTML = '<i class="fa-solid fa-folder-plus text-indigo me-2"></i>เพิ่มสื่อการเรียนรู้ใหม่';
  document.getElementById('editMediaId').value = '';
  document.getElementById('mediaForm').reset();
  renderCategoryFormSelect();
  document.getElementById('addEditMediaModal').classList.remove('hidden');
}

function openEditMediaModal(mediaId) {
  const item = mediaList.find(m => m.id === mediaId);
  if (!item) return;

  renderCategoryFormSelect();

  document.getElementById('addEditModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo me-2"></i>แก้ไขสื่อการเรียนรู้';
  document.getElementById('editMediaId').value = item.id;
  document.getElementById('formTitle').value = item.title;
  document.getElementById('formCategory').value = item.category;
  document.getElementById('formAcademicYear').value = item.academicYear || '2569';
  document.getElementById('formUrl').value = item.url;
  document.getElementById('formThumbnail').value = item.thumbnail || '';
  document.getElementById('formTags').value = (item.tags || []).join(', ');
  document.getElementById('formDescription').value = item.description || '';

  document.getElementById('addEditMediaModal').classList.remove('hidden');
}

function closeAddEditModal() { document.getElementById('addEditMediaModal').classList.add('hidden'); }

async function handleSaveMedia(e) {
  if (e && e.preventDefault) e.preventDefault();

  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const originalHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> กำลังบันทึกข้อมูล...';
  }

  const editId = document.getElementById('editMediaId').value;
  const title = document.getElementById('formTitle').value.trim();
  const category = document.getElementById('formCategory').value;
  const academicYear = document.getElementById('formAcademicYear').value.trim();
  const url = document.getElementById('formUrl').value.trim();
  const thumbnail = document.getElementById('formThumbnail').value.trim();
  const tagsStr = document.getElementById('formTags').value.trim();
  const description = document.getElementById('formDescription').value.trim();

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  let mediaItemToSave = null;

  if (editId) {
    const item = mediaList.find(m => m.id === editId);
    if (item) {
      item.title = title;
      item.category = category;
      item.academicYear = academicYear;
      item.url = url;
      item.thumbnail = thumbnail;
      item.tags = tags;
      item.description = description;
      mediaItemToSave = item;
    }
  } else {
    mediaItemToSave = {
      id: 'media-' + Date.now(),
      title,
      category,
      academicYear,
      url,
      thumbnail,
      tags,
      description,
      ratings: []
    };
    mediaList.unshift(mediaItemToSave);
  }

  // 1. สั่งปิดหน้าต่างแก้ไขสื่อทันที 100%
  closeAddEditModal();

  // 2. ส่งข้อมูลบันทึกเข้า Cloudflare D1 Database
  if (mediaItemToSave) {
    try {
      await fetch(getApiUrl('/media'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaItemToSave)
      });
      showToast(editId ? 'อัปเดตข้อมูลสื่อสำเร็จ' : 'เพิ่มสื่อการเรียนรู้ใหม่สำเร็จ');
    } catch (err) {
      console.error('Cloudflare D1 sync error:', err);
    } finally {
      saveMediaToStorage();
      fetchLiveDataFromD1();
      renderApp();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    }
  }
}

async function confirmDeleteMedia(e, mediaId) {
  if (e && e.stopPropagation) e.stopPropagation();
  
  const idToDelete = mediaId || (typeof e === 'string' ? e : '');
  if (!idToDelete) return;

  const item = mediaList.find(m => m.id === idToDelete);
  const title = item ? item.title : '';

  if (!confirm(`คุณต้องการลบสื่อ "${title || 'นี้'}" ออกจากระบบคลังสื่อหรือไม่?`)) return;

  // 1. ซ่อนจากความจำหน้าจอเบื้องต้น
  mediaList = mediaList.filter(m => m.id !== idToDelete);
  renderApp();
  showToast('กำลังลบสื่อออกจากฐานข้อมูล D1 บนคลาวด์...');

  // 2. ส่งคำสั่งลบตรงไปยัง Cloudflare D1 Database
  try {
    await fetch(getApiUrl('/media'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: idToDelete, title: title })
    });
    await fetch(getApiUrl(`/media?id=${encodeURIComponent(idToDelete)}`), { method: 'DELETE' }).catch(() => {});
    showToast('ลบสื่อออกจาก D1 Database เรียบร้อยแล้ว');
  } catch (err) {
    console.error('Cloudflare D1 delete error:', err);
  } finally {
    fetchLiveDataFromD1();
  }
}

// ==========================================
// Export CSV Analytics Function
// ==========================================

function exportRatingsCSV() {
  if (mediaList.length === 0) {
    alert('ไม่มีข้อมูลสำหรับส่งออก');
    return;
  }

  let csvContent = '\uFEFF';
  csvContent += 'ID,ชื่อสื่อการเรียนรู้,ประเภท,ปีการศึกษา,คะแนนReadability,คะแนนVisualHarmony,คะแนนFocusCTA,คะแนนเฉลี่ย,ข้อความถอดบทเรียน,วันที่ประเมิน\n';

  mediaList.forEach(item => {
    const catObj = categoriesList.find(c => c.id === item.category);
    const catName = catObj ? catObj.name : item.category;

    if (item.ratings && item.ratings.length > 0) {
      item.ratings.forEach(r => {
        const avg = ((r.readability + r.visualHarmony + r.focusCta) / 3).toFixed(1);
        const safeTitle = `"${(item.title || '').replace(/"/g, '""')}"`;
        const safeReflection = `"${(r.reflection || '').replace(/"/g, '""')}"`;
        
        csvContent += `${item.id},${safeTitle},${catName},${item.academicYear || ''},${r.readability},${r.visualHarmony},${r.focusCta},${avg},${safeReflection},${r.timestamp || ''}\n`;
      });
    } else {
      const safeTitle = `"${(item.title || '').replace(/"/g, '""')}"`;
      csvContent += `${item.id},${safeTitle},${catName},${item.academicYear || ''},0,0,0,0,"ยังไม่มีประเมิน",-\n`;
    }
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `รายงานผลการประเมินคลังสื่อ_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('ดาวน์โหลดไฟล์ CSV รายงานผลประเมินดาวสำเร็จ');
}

// ==========================================
// Toast Notification Utility
// ==========================================

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-cyan"></i> <span>${escapeHtml(message)}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
