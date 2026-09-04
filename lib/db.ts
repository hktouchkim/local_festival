import { neon } from '@neondatabase/serverless';
import { Festival, INITIAL_FESTIVALS } from './data';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cSNzgHjhd4p7@ep-dry-wildflower-aypqx72r-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

// 테이블 자동 생성 및 초기 데이터 시딩
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS festivals (
        id BIGSERIAL PRIMARY KEY,
        contentid VARCHAR(50) UNIQUE,
        title VARCHAR(255) NOT NULL,
        start_date VARCHAR(20) NOT NULL,
        end_date VARCHAR(20) NOT NULL,
        addr1 VARCHAR(255),
        addr2 VARCHAR(255),
        mapx DOUBLE PRECISION,
        mapy DOUBLE PRECISION,
        firstimage TEXT,
        overview TEXT,
        playtime VARCHAR(255),
        usetime VARCHAR(255),
        sponsor1 VARCHAR(255),
        sponsor2 VARCHAR(255),
        tel VARCHAR(100),
        homepage TEXT,
        status VARCHAR(20) DEFAULT 'PUBLISHED',
        source VARCHAR(20) DEFAULT 'API',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 데이터 건수 확인
    const countRes = await sql`SELECT count(*) FROM festivals;`;
    const count = parseInt(countRes[0].count, 10);

    // 테이블이 비어있으면 초기 전국 축제 데이터 일괄 적재
    if (count === 0) {
      console.log('Seeding initial festival data into Neon DB...');
      for (const fest of INITIAL_FESTIVALS) {
        await sql`
          INSERT INTO festivals (
            contentid, title, start_date, end_date, addr1, addr2, mapx, mapy,
            firstimage, overview, playtime, usetime, sponsor1, sponsor2, tel, homepage, status, source
          ) VALUES (
            ${fest.contentid || null}, ${fest.title}, ${fest.start_date}, ${fest.end_date},
            ${fest.addr1}, ${fest.addr2 || ''}, ${fest.mapx}, ${fest.mapy},
            ${fest.firstimage || ''}, ${fest.overview || ''}, ${fest.playtime || ''}, ${fest.usetime || ''},
            ${fest.sponsor1 || ''}, ${fest.sponsor2 || ''}, ${fest.tel || ''}, ${fest.homepage || ''},
            ${fest.status}, ${fest.source}
          ) ON CONFLICT (contentid) DO NOTHING;
        `;
      }
      console.log('Seeding finished successfully.');
    }
  } catch (err) {
    console.error('Failed to init Neon database:', err);
  }
}

// 축제 목록 조회
export async function getFestivals(): Promise<Festival[]> {
  try {
    await initDatabase();
    const rows = await sql`
      SELECT * FROM festivals ORDER BY id DESC;
    `;
    return rows.map((r: any) => ({
      id: r.id,
      contentid: r.contentid,
      title: r.title,
      start_date: r.start_date,
      end_date: r.end_date,
      addr1: r.addr1,
      addr2: r.addr2,
      mapx: Number(r.mapx) || 126.9780,
      mapy: Number(r.mapy) || 37.5665,
      firstimage: r.firstimage,
      overview: r.overview,
      playtime: r.playtime,
      usetime: r.usetime,
      sponsor1: r.sponsor1,
      sponsor2: r.sponsor2,
      tel: r.tel,
      homepage: r.homepage,
      status: r.status as 'PUBLISHED' | 'HIDDEN',
      source: r.source as 'API' | 'MANUAL',
      created_at: r.created_at
    }));
  } catch (err) {
    console.error('getFestivals error:', err);
    return INITIAL_FESTIVALS;
  }
}

// 축제 단건 조회
export async function getFestivalById(id: string | number): Promise<Festival | null> {
  try {
    await initDatabase();
    const rows = await sql`
      SELECT * FROM festivals WHERE id = ${id} LIMIT 1;
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      contentid: r.contentid,
      title: r.title,
      start_date: r.start_date,
      end_date: r.end_date,
      addr1: r.addr1,
      addr2: r.addr2,
      mapx: Number(r.mapx) || 126.9780,
      mapy: Number(r.mapy) || 37.5665,
      firstimage: r.firstimage,
      overview: r.overview,
      playtime: r.playtime,
      usetime: r.usetime,
      sponsor1: r.sponsor1,
      sponsor2: r.sponsor2,
      tel: r.tel,
      homepage: r.homepage,
      status: r.status,
      source: r.source,
      created_at: r.created_at
    };
  } catch (err) {
    console.error('getFestivalById error:', err);
    return null;
  }
}

// 상태 토글 (공개 / 숨김)
export async function toggleFestivalStatus(id: string | number): Promise<Festival | null> {
  try {
    const current = await getFestivalById(id);
    if (!current) return null;

    const nextStatus = current.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    const rows = await sql`
      UPDATE festivals 
      SET status = ${nextStatus}, updated_at = NOW() 
      WHERE id = ${id} 
      RETURNING *;
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...current,
      status: r.status
    };
  } catch (err) {
    console.error('toggleFestivalStatus error:', err);
    return null;
  }
}

// 신규 수동 등록
export async function addManualFestival(newFest: Omit<Festival, 'id' | 'source' | 'status' | 'created_at'>): Promise<Festival> {
  await initDatabase();
  const rows = await sql`
    INSERT INTO festivals (
      title, start_date, end_date, addr1, addr2, mapx, mapy,
      firstimage, overview, playtime, usetime, sponsor1, sponsor2, tel, homepage, status, source
    ) VALUES (
      ${newFest.title}, ${newFest.start_date}, ${newFest.end_date},
      ${newFest.addr1}, ${newFest.addr2 || ''}, ${newFest.mapx}, ${newFest.mapy},
      ${newFest.firstimage || ''}, ${newFest.overview || ''}, ${newFest.playtime || ''}, ${newFest.usetime || ''},
      ${newFest.sponsor1 || ''}, ${newFest.sponsor2 || ''}, ${newFest.tel || ''}, ${newFest.homepage || ''},
      'PUBLISHED', 'MANUAL'
    ) RETURNING *;
  `;
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    start_date: r.start_date,
    end_date: r.end_date,
    addr1: r.addr1,
    addr2: r.addr2,
    mapx: Number(r.mapx),
    mapy: Number(r.mapy),
    firstimage: r.firstimage,
    overview: r.overview,
    playtime: r.playtime,
    usetime: r.usetime,
    sponsor1: r.sponsor1,
    sponsor2: r.sponsor2,
    tel: r.tel,
    homepage: r.homepage,
    status: r.status,
    source: r.source,
    created_at: r.created_at
  };
}
