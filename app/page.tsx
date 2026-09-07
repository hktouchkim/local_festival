'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import InteractiveMap from '@/components/InteractiveMap';
import CurationSection from '@/components/CurationSection';
import MobileSearchListSection from '@/components/MobileSearchListSection';
import { Festival } from '@/lib/data';

const REGIONS = ['전국', '서울', '경기/인천', '강원', '충청', '전라', '경상', '제주'];

const PERIOD_TABS = [
  { key: 'ALL', label: '전체 일정' },
  { key: 'WEEKEND', label: '이번 주말' },
  { key: 'MONTH', label: '이번 달' }
];

export default function Home() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [curationData, setCurationData] = useState<{
    hot: Festival[];
    music: Festival[];
    night: Festival[];
    family: Festival[];
  }>({ hot: [], music: [], night: [], family: [] });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [showOngoing, setShowOngoing] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  // 1. 축제 검색/필터 데이터 로드
  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedRegion !== '전국') params.append('region', selectedRegion);
      if (selectedPeriod !== 'ALL') params.append('period', selectedPeriod);
      params.append('ongoing', showOngoing ? 'true' : 'false');
      params.append('upcoming', showUpcoming ? 'true' : 'false');
      params.append('ended', showEnded ? 'true' : 'false');

      const res = await fetch(`/api/festivals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFestivals(data.data);
      }
    } catch (error) {
      console.error('Failed to load festivals', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. 큐레이션 데이터 로드 (실제 TourAPI DB 기반)
  const fetchCuration = async () => {
    try {
      const res = await fetch('/api/festivals/curation');
      const json = await res.json();
      if (json.success && json.data) {
        setCurationData(json.data);
      }
    } catch (err) {
      console.error('Failed to load curation data', err);
    }
  };

  useEffect(() => {
    fetchCuration();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFestivals();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedRegion, selectedPeriod, showOngoing, showUpcoming, showEnded]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900 font-sans">
      <Header />

      {/* ========================================================= */}
      {/* 1. PC 전용 와이드 지도 영역 (모바일에서는 지도 미제공: hidden md:block) */}
      {/* ========================================================= */}
      <section className="hidden md:block relative w-full bg-slate-100 border-b border-gray-200">
        <div className="w-full h-[620px] relative">
          <InteractiveMap
            festivals={festivals}
            selectedFestival={selectedFestival}
            onSelectFestival={(fest) => setSelectedFestival(fest)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            periodTabs={PERIOD_TABS}
            regions={REGIONS}
            showOngoing={showOngoing}
            setShowOngoing={setShowOngoing}
            showUpcoming={showUpcoming}
            setShowUpcoming={setShowUpcoming}
            showEnded={showEnded}
            setShowEnded={setShowEnded}
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. 4대 테마 큐레이션 섹션 (모바일에서는 최상단 우선 노출)   */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 w-full space-y-6">
        {/* 섹션 1: 지금 가장 핫한 축제 TOP 10 */}
        <CurationSection
          title="지금 가장 핫한 축제 TOP 10"
          subtitle="실시간으로 많은 여행객이 찾고 있는 이번 시즌 최고의 축제를 만나보세요."
          festivals={curationData.hot}
          icon="sparkles"
        />

        {/* 섹션 2: 흥 폭발! 뮤직 & 페스티벌 */}
        <CurationSection
          title="흥 폭발! 뮤직 & 페스티벌"
          subtitle="열정적인 락, 감미로운 재즈, 시원한 비어 페스티벌까지!"
          festivals={curationData.music}
          icon="music"
        />

        {/* 섹션 3: 낭만 가득 야간 & 빛 축제 */}
        <CurationSection
          title="낭만 가득 야간 & 빛 축제"
          subtitle="밤하늘을 수놓는 화려한 불꽃과 드론 라이트쇼, 달빛 산책길."
          festivals={curationData.night}
          icon="moon"
        />

        {/* 섹션 4: 온 가족 & 아이와 함께 가기 좋은 축제 */}
        <CurationSection
          title="온 가족 & 아이와 함께 가기 좋은 축제"
          subtitle="오감 만족 체험 프로그램과 즐거운 캐릭터·생태 축제."
          festivals={curationData.family}
          icon="users"
        />

        {/* ========================================================= */}
        {/* 3. 모바일 전용: 검색 필터 및 결과 카드 리스트 일체형 모듈 (md:hidden) */}
        {/* ========================================================= */}
        <div className="block md:hidden pt-4">
          <MobileSearchListSection
            festivals={festivals}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            periodTabs={PERIOD_TABS}
            regions={REGIONS}
            showOngoing={showOngoing}
            setShowOngoing={setShowOngoing}
            showUpcoming={showUpcoming}
            setShowUpcoming={setShowUpcoming}
            showEnded={showEnded}
            setShowEnded={setShowEnded}
          />
        </div>
      </main>
    </div>
  );
}
