-- =================================================================
-- Cloudflare D1 Database Schema for Learning Media Repository
-- =================================================================

-- 1. ตารางเก็บสื่อการเรียนรู้ต้นแบบ & ผลงานแบนเนอร์นักเรียน
CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  academic_year TEXT DEFAULT '2567',
  url TEXT NOT NULL,
  thumbnail TEXT,
  tags TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางเก็บผลสรุปถอดบทเรียนนักเรียน (Define Checklist - K Assessment)
CREATE TABLE IF NOT EXISTS student_checklists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  student_no INTEGER NOT NULL,
  best_practices TEXT,
  things_to_avoid TEXT,
  rule_color TEXT,
  rule_font TEXT,
  rule_cta TEXT,
  timestamp TEXT
);

-- 3. ตารางเก็บผลการประเมินดาว 3 มิติรายสื่อ
CREATE TABLE IF NOT EXISTS media_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id TEXT NOT NULL,
  readability INTEGER NOT NULL,
  visual_harmony INTEGER NOT NULL,
  focus_cta INTEGER NOT NULL,
  reflection TEXT,
  timestamp TEXT,
  FOREIGN KEY (media_id) REFERENCES media_items(id)
);
