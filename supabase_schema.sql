-- ==========================================
-- 한경 지역축제 (Hankyoung Festival) 테이블 스키마
-- Supabase SQL Editor에 복사하여 실행
-- ==========================================

CREATE TABLE IF NOT EXISTS festivals (
  id BIGSERIAL PRIMARY KEY,
  contentid VARCHAR(50) UNIQUE, -- TourAPI 식별자 (수동등록 건은 null 또는 자체 prefix)
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  addr1 VARCHAR(255),
  addr2 VARCHAR(255),
  mapx DOUBLE PRECISION, -- 경도 (Longitude)
  mapy DOUBLE PRECISION, -- 위도 (Latitude)
  firstimage TEXT, -- 대표 이미지 URL
  overview TEXT, -- 축제 상세 소개
  playtime VARCHAR(255), -- 운영시간
  usetime VARCHAR(255), -- 이용요금
  sponsor1 VARCHAR(255), -- 주최기관
  sponsor2 VARCHAR(255), -- 주관기관
  tel VARCHAR(100), -- 문의 전화번호
  homepage TEXT, -- 공식 홈페이지 URL
  status VARCHAR(20) DEFAULT 'PUBLISHED', -- 'PUBLISHED' (공개) | 'HIDDEN' (숨김)
  source VARCHAR(20) DEFAULT 'API', -- 'API' (공공API 수집) | 'MANUAL' (관리자 등록)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 설정 (검색 및 날짜 필터링 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_festivals_dates ON festivals (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_festivals_status ON festivals (status);
CREATE INDEX IF NOT EXISTS idx_festivals_contentid ON festivals (contentid);

-- RLS (Row Level Security) 설정: 익명 사용자 읽기 허용
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON festivals FOR SELECT 
USING (true);

CREATE POLICY "Allow service/anon write access for prototype" 
ON festivals FOR ALL 
USING (true);
