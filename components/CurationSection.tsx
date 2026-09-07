'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Sparkles, Music, Moon, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Festival, SERVICE_TODAY } from '@/lib/data';

interface CurationSectionProps {
  title: string;
  subtitle: string;
  festivals: Festival[];
  icon?: 'sparkles' | 'music' | 'moon' | 'users';
}

export default function CurationSection({
  title,
  subtitle,
  festivals,
  icon = 'sparkles'
}: CurationSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 스크롤 위치 감지하여 좌우 화살표 버튼의 활성화/비활성화 상태 업데이트
  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [festivals]);

  // 좌우 스크롤 이동 함수 (카드 2~3장 분량 약 560px 스무스 이동)
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 560;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!festivals || festivals.length === 0) return null;

  return (
    <section className="py-6 border-b border-gray-100 last:border-b-0">
      {/* 헤더 영역: 타이틀 + PC 전용 좌우 이동 화살표 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {icon === 'sparkles' && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />}
            {icon === 'music' && <Music className="w-5 h-5 text-blue-600" />}
            {icon === 'moon' && <Moon className="w-5 h-5 text-indigo-500 fill-indigo-400" />}
            {icon === 'users' && <Users className="w-5 h-5 text-emerald-600" />}
            <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
              {title}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* PC 전용 <, > 네비게이션 버튼 (모바일에서는 숨김, 터치 스와이프 사용) */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'border-gray-300 bg-white text-gray-800 hover:bg-slate-100 hover:border-gray-400 shadow-xs cursor-pointer active:scale-95'
                : 'border-gray-200 bg-slate-50 text-gray-300 cursor-not-allowed opacity-50'
            }`}
            title="이전 축제 보기"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              canScrollRight
                ? 'border-gray-300 bg-white text-gray-800 hover:bg-slate-100 hover:border-gray-400 shadow-xs cursor-pointer active:scale-95'
                : 'border-gray-200 bg-slate-50 text-gray-300 cursor-not-allowed opacity-50'
            }`}
            title="다음 축제 보기"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 가로 스와이프 캐러셀 컨테이너 (스크롤바 완전 숨김: no-scrollbar) */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
      >
        {festivals.map((fest) => {
          return (
            <Link
              key={fest.id}
              href={`/festivals/${fest.id}`}
              className="flex-shrink-0 w-64 md:w-72 bg-white rounded-xl border border-gray-200 hover:border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col cursor-pointer"
            >
              {/* 이미지 썸네일 */}
              <div className="relative w-full h-40 bg-slate-100 overflow-hidden">
                {fest.firstimage ? (
                  <img
                    src={fest.firstimage}
                    alt={fest.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs">
                    이미지 준비중
                  </div>
                )}
                {/* 행사 상태 뱃지 (A안: 진행중 / D-Day 표기) */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  {fest.event_status === 'ONGOING' || (!fest.event_status && fest.start_date <= SERVICE_TODAY && fest.end_date >= SERVICE_TODAY) ? (
                    <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      진행 중
                    </span>
                  ) : (
                    <span className="bg-[#e83428] text-white text-[11px] font-extrabold px-2 py-0.5 rounded shadow">
                      {fest.d_day !== undefined && fest.d_day !== null
                        ? (fest.d_day === 0 ? 'D-Day' : `D-${fest.d_day}`)
                        : (fest.start_date > SERVICE_TODAY ? '진행 예정' : '종료')}
                    </span>
                  )}
                </div>

                {/* 지역 뱃지 (우측 상단) */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="bg-[#0A2540]/85 backdrop-blur-xs text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                    {fest.addr1 ? fest.addr1.split(' ')[0] : '전국'}
                  </span>
                </div>
              </div>

              {/* 본문 정보 */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                    {fest.title}
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{fest.start_date} ~ {fest.end_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{fest.addr1 || '상세 주소 확인 필요'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
