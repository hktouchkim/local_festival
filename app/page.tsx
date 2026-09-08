'use client';

import { useState, useEffect, Suspense } from 'react';
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
  const initialFestivalId = searchParams.get('festivalId');

  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 및 필터 상태 (기본값: 한경 트래블 PICK)
  const [searchQuery, setSearchQuery] = useState('한경 트래블 PICK');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedTheme, setSelectedTheme] = useState<string | null>('HOT');
  const [showOngoing, setShowOngoing] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showEnded, setShowEnded] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  // 축제 데이터 로드 (검색어, 기간, 테마, 상태 연동)
  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedPeriod !== 'ALL') params.append('period', selectedPeriod);
      if (selectedTheme) params.append('theme', selectedTheme);
      params.append('ongoing', showOngoing ? 'true' : 'false');
      params.append('upcoming', showUpcoming ? 'true' : 'false');
      params.append('ended', showEnded ? 'true' : 'false');

      const res = await fetch(`/api/festivals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFestivals(data.data);

        // URL에 festivalId가 전달된 경우 해당 축제 자동 선택
        if (initialFestivalId) {
          const target = data.data.find((f: Festival) => f.id === initialFestivalId);
          if (target) {
            setSelectedFestival(target);
          } else {
            // 목록 필터에 포함되지 않았더라도 단독 API로 가져와 선택
            fetch(`/api/festivals/${initialFestivalId}`)
              .then(r => r.json())
              .then(single => {
                if (single.success && single.data) {
                  setSelectedFestival(single.data);
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
    const timer = setTimeout(() => {
      fetchFestivals();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedPeriod, selectedTheme, showOngoing, showUpcoming, showEnded]);

  // 검색 및 필터 전체 초기화 함수
  const handleResetFilters = () => {
    setSearchQuery('');
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
          selectedFestival={selectedFestival}
          onSelectFestival={(fest) => setSelectedFestival(fest)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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
