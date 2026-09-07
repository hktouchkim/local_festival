'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import InteractiveMap from '@/components/InteractiveMap';
import FestivalCard from '@/components/FestivalCard';
import CurationSection from '@/components/CurationSection';
import { Festival } from '@/lib/data';
import { Search, MapPin, Sparkles, Filter, ChevronDown, RefreshCw, AlertCircle, Compass } from 'lucide-react';

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
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  const mapSectionRef = useRef<HTMLDivElement>(null);

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
  }, [searchQuery, selectedRegion, selectedPeriod, showOngoing, showUpcoming]);

  // 큐레이션 카드에서 '지도에서 보기' 클릭 시 상단 지도로 스무스 스크롤 및 마커 선택
  const handleSelectOnMap = (fest: Festival) => {
    setSelectedFestival(fest);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900 font-sans">
      <Header />

      {/* ========================================================= */}
      {/* 1. 전면 와이드 지도 영역 (내부 플로팅 검색/필터 모듈 탑재)   */}
      {/* ========================================================= */}
      <section ref={mapSectionRef} className="relative w-full bg-slate-100 border-b border-gray-200">
        <div className="w-full h-[520px] md:h-[620px] relative">
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
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. 하단 매거진형 4대 테마 큐레이션 섹션 (실제 TourAPI DB 기반)  */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full space-y-4">
        {/* 섹션 1: 지금 가장 핫한 축제 TOP 10 */}
        <CurationSection
          title="지금 가장 핫한 축제 TOP 10"
          subtitle="실시간으로 많은 여행객이 찾고 있는 이번 시즌 최고의 축제를 만나보세요."
          festivals={curationData.hot}
          icon="sparkles"
          onSelectOnMap={handleSelectOnMap}
        />

        {/* 섹션 2: 흥 폭발! 뮤직 & 페스티벌 */}
        <CurationSection
          title="흥 폭발! 뮤직 & 페스티벌"
          subtitle="열정적인 락, 감미로운 재즈, 시원한 비어 페스티벌까지!"
          festivals={curationData.music}
          icon="music"
          onSelectOnMap={handleSelectOnMap}
        />

        {/* 섹션 3: 낭만 가득 야간 & 빛 축제 */}
        <CurationSection
          title="낭만 가득 야간 & 빛 축제"
          subtitle="밤하늘을 수놓는 화려한 불꽃과 드론 라이트쇼, 달빛 산책길."
          festivals={curationData.night}
          icon="moon"
          onSelectOnMap={handleSelectOnMap}
        />

        {/* 섹션 4: 온 가족 & 아이와 함께 가기 좋은 축제 */}
        <CurationSection
          title="온 가족 & 아이와 함께 가기 좋은 축제"
          subtitle="오감 만족 체험 프로그램과 즐거운 캐릭터·생태 축제."
          festivals={curationData.family}
          icon="users"
          onSelectOnMap={handleSelectOnMap}
        />

        {/* 전체 탐색 결과 그리드 영역 */}
        <section className="pt-8 mt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">전국 지역축제 전체 탐색</h3>
              <p className="text-xs md:text-sm text-gray-500">
                선택한 조건의 축제 <strong className="text-[#0A2540]">{festivals.length}</strong>개가 열리고 있습니다.
              </p>
            </div>
            <button
              onClick={fetchFestivals}
              className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">축제 목록을 불러오는 중...</div>
          ) : festivals.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-xs">
              <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h4 className="font-bold text-gray-800 text-sm mb-1">일치하는 축제가 없습니다</h4>
              <p className="text-xs text-gray-500">상단 지도에서 지역이나 기간 조건을 변경해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {festivals.map((fest) => (
                <FestivalCard
                  key={fest.id}
                  festival={fest}
                  isSelected={selectedFestival?.id === fest.id}
                  onClick={() => handleSelectOnMap(fest)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
