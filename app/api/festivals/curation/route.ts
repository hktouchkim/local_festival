import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cSNzgHjhd4p7@ep-dry-wildflower-aypqx72r-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

export async function GET() {
  try {
    const today = '2026-09-04';

    // 1. 지금 가장 핫한 축제 TOP 10 (진행 중이거나 최신 축제 중 고화질 대표 이미지가 있는 실제 축제)
    const hotList = await sql`
      SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel
      FROM festivals
      WHERE status = 'PUBLISHED' 
        AND firstimage IS NOT NULL AND firstimage != ''
      ORDER BY 
        CASE WHEN start_date <= ${today} AND end_date >= ${today} THEN 0 ELSE 1 END,
        start_date ASC
      LIMIT 10;
    `;

    // 2. 뮤직 & 페스티벌 (실제 TourAPI 데이터 중 음악, 페스티벌 관련 15건)
    const musicList = await sql`
      SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel
      FROM festivals
      WHERE status = 'PUBLISHED'
        AND firstimage IS NOT NULL AND firstimage != ''
        AND title ~ '뮤직|락|재즈|콘서트|페스티벌|음악|버스킹|비어|맥주'
      ORDER BY start_date ASC
      LIMIT 15;
    `;

    // 3. 야간 & 빛 축제 (실제 TourAPI 데이터 중 야간, 빛, 불꽃 등 관련 15건)
    const nightList = await sql`
      SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel
      FROM festivals
      WHERE status = 'PUBLISHED'
        AND firstimage IS NOT NULL AND firstimage != ''
        AND title ~ '야간|빛|불꽃|달빛|밤|나이트|드론'
      ORDER BY start_date ASC
      LIMIT 15;
    `;

    // 4. 온 가족 & 어린이 축제 (실제 TourAPI 데이터 중 가족, 체험, 만화 등 관련 15건)
    const familyList = await sql`
      SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel
      FROM festivals
      WHERE status = 'PUBLISHED'
        AND firstimage IS NOT NULL AND firstimage != ''
        AND title ~ '어린이|가족|만화|체험|공룡|인형|생태|키즈'
      ORDER BY start_date ASC
      LIMIT 15;
    `;

    return NextResponse.json({
      success: true,
      data: {
        hot: hotList,
        music: musicList,
        night: nightList,
        family: familyList
      }
    });
  } catch (error) {
    console.error('Failed to fetch curation data:', error);
    return NextResponse.json({ success: false, message: '데이터 조회 실패' }, { status: 500 });
  }
}
