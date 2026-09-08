import { NextResponse } from 'next/server';
import { getFestivals, addManualFestival, toggleFestivalStatus } from '@/lib/db';
import { SERVICE_TODAY } from '@/lib/data';

// GET: 축제 목록 조회 (사용자 화면용 필터 또는 관리자용 전체 조회)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get('includeHidden') === 'true';
  const query = searchParams.get('q')?.toLowerCase() || '';
  const region = searchParams.get('region') || '전체';
  const period = searchParams.get('period') || 'ALL';

  let list = await getFestivals();

  // 1. 관리자 조회가 아니면 공개(PUBLISHED) 축제만 필터링
  if (!includeHidden) {
    list = list.filter(f => f.status === 'PUBLISHED');
  }

  // 2. 검색어 필터 (축제명 또는 주소, 또는 추천 테마 키워드 지원)
  if (query) {
    if (query.includes('hot') || query.includes('인기') || query.includes('hot 10')) {
      list = list.filter(f => {
        const isOngoingRecent = f.start_date <= todayStr && f.end_date >= todayStr && f.start_date >= '2026-08-15';
        const isUpcomingNear = f.start_date > todayStr;
        return isOngoingRecent || isUpcomingNear;
      });
    } else if (query.includes('뮤직') || query.includes('페스티벌')) {
      const regex = /뮤직|락|재즈|콘서트|페스티벌|음악|버스킹|비어|맥주/i;
      list = list.filter(f => regex.test(f.title) || (f.overview && regex.test(f.overview)));
    } else if (query.includes('야간') || query.includes('빛')) {
      const regex = /야간|빛|불꽃|달빛|밤|나이트|드론/i;
      list = list.filter(f => regex.test(f.title) || (f.overview && regex.test(f.overview)));
    } else {
      list = list.filter(f => 
        f.title.toLowerCase().includes(query) || 
        (f.addr1 && f.addr1.toLowerCase().includes(query))
      );
    }
  }

  // 3. 지역 필터
  if (region && region !== '전체' && region !== '전국') {
    list = list.filter(f => f.addr1 && f.addr1.includes(region.split('/')[0]));
  }

  // 4. 기간/상태 필터
  const todayStr = SERVICE_TODAY;
  const showOngoing = searchParams.get('ongoing') !== 'false';
  const showUpcoming = searchParams.get('upcoming') === 'true';
  const showEnded = searchParams.get('ended') === 'true';

  // 진행 상태 필터링 (진행중, 예정, 종료)
  list = list.filter(f => {
    const isOngoing = f.start_date <= todayStr && f.end_date >= todayStr;
    const isUpcoming = f.start_date > todayStr;
    const isEnded = f.end_date < todayStr;

    // 만약 모두 꺼져있으면 아무것도 노출하지 않음
    if (!showOngoing && !showUpcoming && !showEnded) return false;
    
    let matched = false;
    if (showOngoing && isOngoing) matched = true;
    if (showUpcoming && isUpcoming) matched = true;
    if (showEnded && isEnded) matched = true;
    return matched;
  });

  // 4.1 테마(추천 단축키) 필터
  const theme = searchParams.get('theme');
  if (theme) {
    if (theme === 'HOT') {
      // 진행중 최근 개막 또는 진행 예정 임박
      list = list.filter(f => {
        const isOngoingRecent = f.start_date <= todayStr && f.end_date >= todayStr && f.start_date >= '2026-08-15';
        const isUpcomingNear = f.start_date > todayStr;
        return isOngoingRecent || isUpcomingNear;
      });
    } else if (theme === 'MUSIC') {
      const regex = /뮤직|락|재즈|콘서트|페스티벌|음악|버스킹|비어|맥주/i;
      list = list.filter(f => regex.test(f.title) || (f.overview && regex.test(f.overview)));
    } else if (theme === 'NIGHT') {
      const regex = /야간|빛|불꽃|달빛|밤|나이트|드론/i;
      list = list.filter(f => regex.test(f.title) || (f.overview && regex.test(f.overview)));
    } else if (theme === 'FAMILY') {
      const regex = /어린이|가족|만화|체험|공룡|인형|생태|키즈/i;
      list = list.filter(f => regex.test(f.title) || (f.overview && regex.test(f.overview)));
    }
  }

  // 시점(이번 주/월) 추가 필터링
  if (period === 'WEEK' || period === 'WEEKEND') {
    const weekStart = '2026-08-31';
    const weekEnd = '2026-09-06';
    list = list.filter(f => f.start_date <= weekEnd && f.end_date >= weekStart);
  } else if (period === 'MONTH') {
    const monthStart = '2026-09-01';
    const monthEnd = '2026-09-30';
    list = list.filter(f => f.start_date <= monthEnd && f.end_date >= monthStart);
  }

  return NextResponse.json({ success: true, count: list.length, data: list });
}

// POST: 신규 축제 수동 등록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.start_date || !body.end_date) {
      return NextResponse.json({ success: false, message: '필수 입력값이 누락되었습니다.' }, { status: 400 });
    }

    const created = await addManualFestival({
      title: body.title,
      start_date: body.start_date,
      end_date: body.end_date,
      addr1: body.addr1 || '',
      addr2: body.addr2 || '',
      mapx: Number(body.mapx) || 126.9780,
      mapy: Number(body.mapy) || 37.5665,
      firstimage: body.firstimage || '',
      overview: body.overview || '',
      playtime: body.playtime || '',
      usetime: body.usetime || '',
      sponsor1: body.sponsor1 || '',
      sponsor2: body.sponsor2 || '',
      tel: body.tel || '',
      homepage: body.homepage || ''
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '등록 실패' }, { status: 500 });
  }
}

// PATCH: 상태 변경 (공개/숨김 토글)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID가 필요합니다.' }, { status: 400 });
    }

    const updated = await toggleFestivalStatus(id);
    if (!updated) {
      return NextResponse.json({ success: false, message: '축제를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '수정 실패' }, { status: 500 });
  }
}
