import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SERVICE_TODAY } from '@/lib/data';

export async function GET() {
  try {
    const today = SERVICE_TODAY;

    // 1. 지금 가장 핫한 축제 TOP 10 (진행 중 + 예정 균형 배치)
    const hotList = await sql`
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'ONGOING' as event_status,
          0 as d_day,
          1 as ord
        FROM festivals
        WHERE status = 'PUBLISHED' 
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date <= ${today} AND end_date >= ${today}
          AND start_date >= '2026-08-15'
        ORDER BY start_date DESC
        LIMIT 6
      )
      UNION ALL
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'UPCOMING' as event_status,
          (start_date::date - ${today}::date) as d_day,
          2 as ord
        FROM festivals
        WHERE status = 'PUBLISHED' 
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date > ${today}
        ORDER BY start_date ASC
        LIMIT 6
      )
      ORDER BY ord, start_date ASC;
    `;

    // 2. 뮤직 & 페스티벌 (진행 중 + 예정)
    const musicList = await sql`
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'ONGOING' as event_status,
          0 as d_day,
          1 as ord
        FROM festivals
        WHERE status = 'PUBLISHED'
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date <= ${today} AND end_date >= ${today}
          AND title ~ '뮤직|락|재즈|콘서트|페스티벌|음악|버스킹|비어|맥주'
        ORDER BY start_date DESC
        LIMIT 6
      )
      UNION ALL
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'UPCOMING' as event_status,
          (start_date::date - ${today}::date) as d_day,
          2 as ord
        FROM festivals
        WHERE status = 'PUBLISHED'
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date > ${today}
          AND title ~ '뮤직|락|재즈|콘서트|페스티벌|음악|버스킹|비어|맥주'
        ORDER BY start_date ASC
        LIMIT 8
      )
      ORDER BY ord, start_date ASC;
    `;

    // 3. 야간 & 빛 축제 (진행 중 + 예정)
    const nightList = await sql`
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'ONGOING' as event_status,
          0 as d_day,
          1 as ord
        FROM festivals
        WHERE status = 'PUBLISHED'
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date <= ${today} AND end_date >= ${today}
          AND title ~ '야간|빛|불꽃|달빛|밤|나이트|드론'
        ORDER BY start_date DESC
        LIMIT 6
      )
      UNION ALL
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'UPCOMING' as event_status,
          (start_date::date - ${today}::date) as d_day,
          2 as ord
        FROM festivals
        WHERE status = 'PUBLISHED'
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date > ${today}
          AND title ~ '야간|빛|불꽃|달빛|밤|나이트|드론'
        ORDER BY start_date ASC
        LIMIT 8
      )
      ORDER BY ord, start_date ASC;
    `;

    // 4. 온 가족 & 어린이 축제 (진행 중 + 예정)
    const familyList = await sql`
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'ONGOING' as event_status,
          0 as d_day,
          1 as ord
        FROM festivals
        WHERE status = 'PUBLISHED'
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date <= ${today} AND end_date >= ${today}
          AND (title ~ '어린이|가족|만화|체험|공룡|인형|생태|키즈|문화제|문화' OR overview ~ '가족|어린이|체험')
        ORDER BY start_date DESC
        LIMIT 6
      )
      UNION ALL
      (
        SELECT id, contentid, title, start_date, end_date, addr1, addr2, mapx, mapy, firstimage, tel,
          'UPCOMING' as event_status,
          (start_date::date - ${today}::date) as d_day,
          2 as ord
        FROM festivals
        WHERE status = 'PUBLISHED'
          AND firstimage IS NOT NULL AND firstimage != ''
          AND start_date > ${today}
          AND (title ~ '어린이|가족|만화|체험|공룡|인형|생태|키즈' OR overview ~ '가족|어린이|체험')
        ORDER BY start_date ASC
        LIMIT 8
      )
      ORDER BY ord, start_date ASC;
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
