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
  const todayStr = SERVICE_TODAY;

  let list = await getFestivals();

  // 1. 관리자 조회가 아니면 공개(PUBLISHED) 축제만 필터링
  if (!includeHidden) {
    list = list.filter(f => f.status === 'PUBLISHED');
  }

  // 2. 검색어 필터 (축제명 또는 주소, 또는 추천 테마 키워드 지원)
  if (query) {
    const qLower = query.toLowerCase();
    if (qLower.includes('pick') || qLower.includes('한경') || qLower.includes('트래블') || qLower.includes('hot')) {
      // 한경 트래블 PICK: 축제 소개 또는 주요 행사 프로그램에 데이터가 있는 축제 중 진행중 전체 + 진행예정
      const withContent = list.filter(f => 
        (f.overview && f.overview.trim().length > 0) ||
        (f.program && f.program.trim().length > 0)
      );
      const ongoing = withContent.filter(f => f.start_date <= todayStr && f.end_date >= todayStr);
      const upcoming = withContent.filter(f => f.start_date > todayStr);
      const pickIds = new Set([...ongoing.map(f => f.id), ...upcoming.map(f => f.id)]);
      list = list.filter(f => pickIds.has(f.id));
    } else if (qLower.includes('뮤직') || qLower.includes('페스티벌')) {
      const regex = /뮤직|락|재즈|콘서트|페스티벌|음악|버스킹|비어|맥주/i;
      list = list.filter(f => regex.test(f.title) || (f.overview && regex.test(f.overview)));
    } else if (qLower.includes('야간') || qLower.includes('빛')) {
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
  const showOngoing = searchParams.get('ongoing') !== 'false';
  const showUpcoming = searchParams.get('upcoming') === 'true';
  const showEnded = searchParams.get('ended') === 'true';

  // 1년 전 기준일 계산 (예: 2026-09-08 -> 2025-09-08)
  const oneYearAgo = new Date(todayStr);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  // 진행 상태 필터링 (진행중, 예정, 최근 1년 이내 종료)
  list = list.filter(f => {
    const isOngoing = f.start_date <= todayStr && f.end_date >= todayStr;
    const isUpcoming = f.start_date > todayStr;
    const isEnded = f.end_date < todayStr && f.end_date >= oneYearAgoStr;

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
      // 한경 트래블 PICK: 축제 소개 또는 주요 행사 프로그램에 데이터가 있는 축제 중 진행중 전체 + 진행예정
      const withContent = list.filter(f => 
        (f.overview && f.overview.trim().length > 0) ||
        (f.program && f.program.trim().length > 0)
      );
      const ongoing = withContent.filter(f => f.start_date <= todayStr && f.end_date >= todayStr);
      const upcoming = withContent.filter(f => f.start_date > todayStr);
      const pickIds = new Set([...ongoing.map(f => f.id), ...upcoming.map(f => f.id)]);
      list = list.filter(f => pickIds.has(f.id));
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

  // 5. 정렬 정책 (A안: 진행중 우선 -> 진행예정 -> 종료순)
  list.sort((a, b) => {
    const isOngoingA = a.start_date <= todayStr && a.end_date >= todayStr;
    const isOngoingB = b.start_date <= todayStr && b.end_date >= todayStr;
    const isUpcomingA = a.start_date > todayStr;
    const isUpcomingB = b.start_date > todayStr;
    const isEndedA = a.end_date < todayStr;
    const isEndedB = b.end_date < todayStr;

    // 우선순위 점수 부여: 진행중(1순위: 0) -> 진행예정(2순위: 1) -> 종료(3순위: 2)
    const getGroupScore = (isOg: boolean, isUc: boolean) => {
      if (isOg) return 0;
      if (isUc) return 1;
      return 2;
    };

    const scoreA = getGroupScore(isOngoingA, isUpcomingA);
    const scoreB = getGroupScore(isOngoingB, isUpcomingB);

    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    // 그룹 내 세부 정렬 기준
    if (scoreA === 0) {
      // 진행중 그룹: 마감 임박순 (end_date 오름차순, 동일 시 최신 개막순)
      if (a.end_date !== b.end_date) {
        return a.end_date.localeCompare(b.end_date);
      }
      return b.start_date.localeCompare(a.start_date);
    } else if (scoreA === 1) {
      // 진행예정 그룹: 개막 임박순 (start_date 오름차순)
      if (a.start_date !== b.start_date) {
        return a.start_date.localeCompare(b.start_date);
      }
      return a.end_date.localeCompare(b.end_date);
    } else {
      // 종료 그룹: 최근 종료순 (end_date 내림차순)
      return b.end_date.localeCompare(a.end_date);
    }
  });

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
