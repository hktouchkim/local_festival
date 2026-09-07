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
  const [showUpcoming, setShowUpcoming] = useState(true);
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
    fetchFestivals();
  }, [selectedRegion, selectedPeriod, showOngoing, showUpcoming]);

  useEffect(() => {
    fetchCuration();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFestivals();
  };

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
      {/* 1. 상단 필터 바 + 하단 지도 영역 2단 분리형 (B안)          */}
      {/* ========================================================= */}
      {/* 1-1. 상단 독립 검색 및 필터 컨트롤 바 */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* 검색창 */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="축제명을 입력해주세요"
                className="w-full pl-9 pr-16 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-[#0A2540] text-white text-xs font-semibold rounded hover:bg-slate-800 transition"
              >
                검색
              </button>
            </form>

            {/* 상태 체크박스 & 기간 빠른 선택 탭 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 진행중 / 예정 체크박스 (하단 배치 연동) */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-gray-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={showOngoing}
                    onChange={(e) => setShowOngoing(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#0A2540] border-gray-300 focus:ring-0 accent-[#0A2540]"
                  />
                  <span>진행 중인 축제</span>
                </label>

                <span className="text-gray-300">|</span>

                <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-gray-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={showUpcoming}
                    onChange={(e) => setShowUpcoming(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#0A2540] border-gray-300 focus:ring-0 accent-[#0A2540]"
                  />
                  <span>진행 예정</span>
                </label>
              </div>

              {/* 시점 선택 탭 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedPeriod(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      selectedPeriod === tab.key
                        ? 'bg-[#0A2540] text-white shadow-xs'
                        : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 지역 선택 바 */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100 overflow-x-auto pb-1">
            <span className="text-xs text-gray-400 flex-shrink-0 font-medium">지역:</span>
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`text-xs px-2.5 py-1 rounded transition whitespace-nowrap ${
                  selectedRegion === region
                    ? 'font-bold text-[#0A2540] bg-blue-50 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 1-2. 하단 시원한 전면 와이드 지도 영역 */}
      <section ref={mapSectionRef} className="relative w-full bg-slate-100 border-b border-gray-200">
        <div className="w-full h-[480px] md:h-[580px] relative">
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
