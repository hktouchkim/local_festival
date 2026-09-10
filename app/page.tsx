'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import InteractiveMap from '@/components/InteractiveMap';
import { Festival } from '@/lib/data';

const PERIOD_TABS = [
  { key: 'ALL', label: '전체 일정' },
  { key: 'WEEK', label: '이번 주' },
  { key: 'MONTH', label: '이번 달' }
];

function HomeContent() {
  const searchParams = useSearchParams();
  const initialFestivalIdRef = useRef<string | null>(searchParams.get('festivalId'));

  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 및 필터 상태 (기본값: 검색어 없음, 진행중 ON, 예정 OFF, 종료 OFF)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showOngoing, setShowOngoing] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  // 현재 화면에 로드된 festivals 데이터가 어떤 검색어의 결과인지를 추적하는 상태 (1-Step 지연 방지 핵심)
  const [dataQuery, setDataQuery] = useState('');

  // 축제 데이터 로드 (검색어, 기간, 테마, 상태 연동)
  const fetchFestivals = async () => {
    const currentQ = searchQuery.trim();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentQ) params.append('q', currentQ);
      if (selectedPeriod !== 'ALL') params.append('period', selectedPeriod);
      if (selectedTheme) params.append('theme', selectedTheme);
      params.append('ongoing', showOngoing ? 'true' : 'false');
      params.append('upcoming', showUpcoming ? 'true' : 'false');
      params.append('ended', showEnded ? 'true' : 'false');

      const res = await fetch(`/api/festivals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFestivals(data.data);
        setDataQuery(currentQ);

        // 최초 진입 시 URL에 festivalId가 전달된 경우 1회 한정 해당 축제 자동 선택
        if (initialFestivalIdRef.current) {
          const fid = initialFestivalIdRef.current;
          // 1회 처리 후 ref 비움 -> 이후 필터 초기화나 검색 변경 시 재선택되지 않도록 방지
          initialFestivalIdRef.current = null;

          const target = data.data.find((f: Festival) => f.id === fid);
          if (target) {
            setSelectedFestival(target);
          } else {
            // 목록 필터에 포함되지 않았더라도 단독 API로 가져와 선택
            fetch(`/api/festivals/${fid}`)
              .then(r => r.json())
              .then(singleData => {
                if (singleData.success && singleData.data) {
                  setSelectedFestival(singleData.data);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Failed to load festivals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();
  }, [searchQuery, selectedPeriod, selectedTheme, showOngoing, showUpcoming, showEnded]);

  // 검색 및 필터 전체 초기화 함수 (URL 쿼리 파라미터도 깨끗하게 제거하여 루트로 변경)
  const handleResetFilters = () => {
    initialFestivalIdRef.current = null;
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState(null, '', window.location.pathname);
    }
    setSearchQuery('');
    setDataQuery('');
    setSelectedPeriod('ALL');
    setSelectedTheme(null);
    setShowOngoing(true);
    setShowUpcoming(false);
    setShowEnded(false);
    setSelectedFestival(null);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
      {/* 1. 상단 미니멀 헤더 (로고 + 지역축제 타이틀) */}
      <Header />

      {/* 2. 브라우저 풀사이즈 지도 영역 (하단 스크롤/큐레이션 전면 배제) */}
      <main className="flex-1 w-full relative overflow-hidden">
        <InteractiveMap
          festivals={festivals}
          loading={loading}
          dataQuery={dataQuery}
          selectedFestival={selectedFestival}
          onSelectFestival={(fest) => setSelectedFestival(fest)}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSelectedFestival(null);
            setSearchQuery(q);
          }}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          periodTabs={PERIOD_TABS}
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          onResetFilters={handleResetFilters}
          showOngoing={showOngoing}
          setShowOngoing={setShowOngoing}
          showUpcoming={showUpcoming}
          setShowUpcoming={setShowUpcoming}
          showEnded={showEnded}
          setShowEnded={setShowEnded}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#f8fafc]" />}>
      <HomeContent />
    </Suspense>
  );
}
