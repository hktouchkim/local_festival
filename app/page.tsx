'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FestivalCard from '@/components/FestivalCard';
import InteractiveMap from '@/components/InteractiveMap';
import { Festival } from '@/lib/data';
import { Search, Map, List, ChevronUp, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';

const REGIONS = ['전국', '서울', '경기/인천', '강원', '충청/대전/세종', '전라/광주', '경상/부산/대구/울산', '제주'];
const PERIOD_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'ONGOING', label: '진행 중인 축제' },
  { key: 'WEEKEND', label: '이번 주말' },
  { key: 'MONTH', label: '이번 달' }
];

export default function Home() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL'); // 기본값: 올해 포함된 전체 축제 노출
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  // 모바일 전용 상태: 지도 모드 토글 및 바텀시트 확장 상태 (1: 접힘, 2: 반확장, 3: 전체확장)
  const [isMobileMapMode, setIsMobileMapMode] = useState(false);
  const [bottomSheetLevel, setBottomSheetLevel] = useState<1 | 2 | 3>(1);

  // 데이터 로딩 함수
  const fetchFestivals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedRegion !== '전국') params.append('region', selectedRegion);
      if (selectedPeriod !== 'ALL') params.append('period', selectedPeriod);

      const res = await fetch(`/api/festivals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFestivals(data.data);
        // 초기 로딩 시 첫 번째 축제 자동 선택 배제 (지도의 한반도 전체 뷰 유지)
        setSelectedFestival(null);
      }
    } catch (error) {
      console.error('Failed to load festivals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();
  }, [selectedRegion, selectedPeriod]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFestivals();
  };

  // 지도 마커 클릭 시 해당 카드로 스크롤 이동
  const handleMarkerSelect = (fest: Festival) => {
    setSelectedFestival(fest);
    const cardEl = document.getElementById(`festival-card-${fest.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      {/* 1. 검색 및 필터 바 (기획서 4.1항 반영) */}
      <section className="bg-white border-b border-gray-200 sticky top-[92px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* 검색어 입력 폼 */}
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
                className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-[#0A2540] text-white text-xs font-semibold rounded hover:bg-slate-800 transition"
              >
                검색
              </button>
            </form>

            {/* 기간 빠른 선택 탭 */}
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

      {/* 2. 본문 메인 콘텐츠 (PC: 2단 분할 / 모바일: 목록 또는 지도 바텀시트) */}
      <main className="max-w-7xl mx-auto px-4 py-5 flex-1 w-full">
        {/* 모바일 화면 전환 분기 */}
        <div className="md:hidden">
          {!isMobileMapMode ? (
            /* 모바일 기본 뷰: 목록 */
            <div className="space-y-3 pb-20">
              <div className="text-xs text-gray-500 font-medium">
                총 <span className="font-bold text-[#0A2540]">{festivals.length}</span>개의 축제가 열리고 있습니다.
              </div>
              {festivals.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">조건에 맞는 지역축제가 없습니다.</p>
                  <button
                    onClick={() => { setSelectedRegion('전국'); setSelectedPeriod('ALL'); setSearchQuery(''); }}
                    className="mt-3 px-3 py-1.5 text-xs bg-[#0A2540] text-white rounded font-medium"
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                festivals.map((fest) => (
                  <FestivalCard key={fest.id} festival={fest} />
                ))
              )}

              {/* 모바일 '지도로 보기' 플로팅 버튼 */}
              <button
                onClick={() => setIsMobileMapMode(true)}
                className="fixed bottom-6 right-5 z-40 bg-[#0A2540] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold active:scale-95 transition"
              >
                <Map className="w-4 h-4 text-amber-400" />
                <span>지도로 보기</span>
              </button>
            </div>
          ) : (
            /* 모바일 전용 지도 화면 + 하단 3단계 확장 바텀시트 (기획서 4.3항 반영) */
            <div className="fixed inset-0 top-[148px] z-40 bg-white flex flex-col">
              {/* 지도 영역 */}
              <div className="flex-1 w-full relative">
                <InteractiveMap
                  festivals={festivals}
                  selectedFestival={selectedFestival}
                  onSelectFestival={(fest) => {
                    setSelectedFestival(fest);
                    setBottomSheetLevel(1);
                  }}
                />

                {/* '목록으로 보기' 복귀 플로팅 버튼 */}
                <button
                  onClick={() => setIsMobileMapMode(false)}
                  className="absolute top-4 right-4 z-20 bg-white text-gray-800 border border-gray-300 px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>목록으로</span>
                </button>
              </div>

              {/* 하단 바텀시트 */}
              <div
                className={`bg-white rounded-t-2xl border-t border-gray-300 shadow-2xl transition-all duration-300 flex flex-col ${
                  bottomSheetLevel === 1 ? 'h-36' : bottomSheetLevel === 2 ? 'h-[50vh]' : 'h-[85vh]'
                }`}
              >
                {/* 바텀시트 핸들 바 */}
                <div
                  onClick={() =>
                    setBottomSheetLevel(bottomSheetLevel === 1 ? 2 : bottomSheetLevel === 2 ? 3 : 1)
                  }
                  className="w-full py-2 flex flex-col items-center justify-center cursor-pointer border-b border-gray-100"
                >
                  <div className="w-10 h-1.5 bg-gray-300 rounded-full mb-1"></div>
                  <div className="flex items-center text-[10px] text-gray-400">
                    <span>{bottomSheetLevel === 3 ? '내리기' : '끌어올려 목록 더보기'}</span>
                    {bottomSheetLevel === 3 ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                  </div>
                </div>

                {/* 바텀시트 내부 콘텐츠 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {selectedFestival && bottomSheetLevel === 1 && (
                    <FestivalCard festival={selectedFestival} isSelected={true} />
                  )}
                  {bottomSheetLevel > 1 &&
                    festivals.map((fest) => (
                      <FestivalCard
                        key={fest.id}
                        festival={fest}
                        isSelected={selectedFestival?.id === fest.id}
                        onClick={() => setSelectedFestival(fest)}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PC 화면: 2단 분할 구조 (기획서 4.2항 반영) */}
        <div className="hidden md:grid md:grid-cols-12 gap-6 items-start">
          {/* 좌측: 인터랙티브 지도 영역 (화면 스크롤 시 뷰포트 고정) */}
          <div className="md:col-span-7 sticky top-[170px] h-[calc(100vh-200px)]">
            <InteractiveMap
              festivals={festivals}
              selectedFestival={selectedFestival}
              onSelectFestival={handleMarkerSelect}
            />
          </div>

          {/* 우측: 축제 카드 스크롤 목록 */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200">
              <span className="text-xs text-gray-600 font-medium">
                검색된 지역축제: <strong className="text-[#0A2540]">{festivals.length}</strong>건
              </span>
              <button
                onClick={fetchFestivals}
                className="text-xs text-gray-500 hover:text-[#0A2540] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>새로고침</span>
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 text-sm">축제 데이터를 불러오는 중...</div>
            ) : festivals.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-xs">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-gray-800 text-sm mb-1">일치하는 축제가 없습니다</h4>
                <p className="text-xs text-gray-500">지역이나 기간 조건을 변경해 보세요.</p>
              </div>
            ) : (
              festivals.map((fest) => (
                <FestivalCard
                  key={fest.id}
                  festival={fest}
                  isSelected={selectedFestival?.id === fest.id}
                  onClick={() => setSelectedFestival(fest)}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
