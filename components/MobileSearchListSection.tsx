'use client';

import { Search, X, MapPin } from 'lucide-react';
import { Festival } from '@/lib/data';
import FestivalCard from './FestivalCard';

interface MobileSearchListSectionProps {
  festivals: Festival[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedPeriod: string;
  setSelectedPeriod: (p: string) => void;
  periodTabs: { key: string; label: string }[];
  regions: string[];
  showOngoing: boolean;
  setShowOngoing: (b: boolean) => void;
  showUpcoming: boolean;
  setShowUpcoming: (b: boolean) => void;
  showEnded: boolean;
  setShowEnded: (b: boolean) => void;
}

export default function MobileSearchListSection({
  festivals,
  loading,
  searchQuery,
  setSearchQuery,
  selectedRegion,
  setSelectedRegion,
  selectedPeriod,
  setSelectedPeriod,
  periodTabs,
  regions,
  showOngoing,
  setShowOngoing,
  showUpcoming,
  setShowUpcoming,
  showEnded,
  setShowEnded
}: MobileSearchListSectionProps) {
  return (
    <section className="w-full bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-4">
      {/* 1. 모듈 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#0A2540]" />
          <span>전국 축제 검색 및 목록</span>
        </h2>
        <span className="text-xs font-semibold text-gray-500">
          총 <strong className="text-[#0A2540]">{festivals.length}</strong>개 축제
        </span>
      </div>

      {/* 2. 검색창 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="축제명 또는 지역명을 검색해보세요"
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#0A2540] focus:bg-white transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. 지역 선택 칩 */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-gray-500">지역별</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedRegion === region
                  ? 'bg-[#0A2540] text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 일정 탭 칩 */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-gray-500">일정별</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedPeriod(tab.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedPeriod === tab.key
                  ? 'bg-blue-50 text-[#0A2540] border border-blue-200 font-bold'
                  : 'bg-slate-50 text-gray-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. 상태 체크박스 */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-gray-700">
          <input
            type="checkbox"
            checked={showOngoing}
            onChange={(e) => setShowOngoing(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-0 accent-emerald-600"
          />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            진행 중
          </span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-gray-700">
          <input
            type="checkbox"
            checked={showUpcoming}
            onChange={(e) => setShowUpcoming(e.target.checked)}
            className="w-4 h-4 rounded text-[#e83428] border-gray-300 focus:ring-0 accent-[#e83428]"
          />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#e83428]" />
            진행 예정
          </span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-gray-700">
          <input
            type="checkbox"
            checked={showEnded}
            onChange={(e) => setShowEnded(e.target.checked)}
            className="w-4 h-4 rounded text-gray-500 border-gray-300 focus:ring-0 accent-gray-500"
          />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            종료
          </span>
        </label>
      </div>

      {/* 6. 결과 카드 목록 (세로 1열 리스트) */}
      <div className="pt-2 space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-sm space-y-2">
            <div className="w-6 h-6 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin" />
            <p>축제 목록을 불러오는 중입니다...</p>
          </div>
        ) : festivals.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 text-sm space-y-2 bg-slate-50 rounded-xl border border-gray-100">
            <MapPin className="w-8 h-8 text-gray-300 stroke-1" />
            <p className="font-medium text-gray-600">조건에 맞는 축제가 없습니다.</p>
            <p className="text-xs text-gray-400">검색어 또는 지역/일정 설정을 변경해보세요.</p>
          </div>
        ) : (
          festivals.map((fest) => (
            <FestivalCard key={fest.id} festival={fest} />
          ))
        )}
      </div>
    </section>
  );
}
