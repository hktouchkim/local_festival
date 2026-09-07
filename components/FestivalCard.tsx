import Link from 'next/link';
import { Calendar, MapPin, ExternalLink, ImageOff } from 'lucide-react';
import { Festival, SERVICE_TODAY } from '@/lib/data';

interface FestivalCardProps {
  festival: Festival;
  isSelected?: boolean;
  onHover?: () => void;
  onClick?: () => void;
}

export default function FestivalCard({
  festival,
  isSelected = false,
  onHover,
  onClick
}: FestivalCardProps) {
  // 오늘 기준 진행 상태 판별
  const todayStr = SERVICE_TODAY;
  let badgeText = '진행 예정';
  let badgeColor = 'bg-gray-100 text-gray-700 border-gray-200';

  if (festival.start_date <= todayStr && festival.end_date >= todayStr) {
    if (festival.end_date === todayStr) {
      badgeText = '오늘 종료';
      badgeColor = 'bg-red-50 text-red-600 border-red-200';
    } else {
      badgeText = '진행 중';
      badgeColor = 'bg-blue-50 text-[#0A2540] border-blue-200 font-bold';
    }
  } else if (festival.end_date < todayStr) {
    badgeText = '종료';
    badgeColor = 'bg-gray-100 text-gray-400 border-gray-200';
  }

  return (
    <div
      id={`festival-card-${festival.id}`}
      onMouseEnter={onHover}
      onClick={onClick}
      className={`relative bg-white rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col md:flex-row ${
        isSelected
          ? 'border-[#0A2540] ring-2 ring-[#0A2540] shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow'
      }`}
    >
      {/* 1. 대표 썸네일 이미지 (결측 시 한경 디폴트 이미지 노출) */}
      <div className="w-full md:w-44 h-36 bg-gray-100 flex-shrink-0 relative overflow-hidden">
        {festival.firstimage ? (
          <img
            src={festival.firstimage}
            alt={festival.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            <ImageOff className="w-7 h-7 mb-1 stroke-1" />
            <span className="text-[11px] font-medium text-slate-500">한경 지역축제</span>
          </div>
        )}
        <span
          className={`absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full border ${badgeColor} backdrop-blur-sm shadow-sm`}
        >
          {badgeText}
        </span>
      </div>

      {/* 2. 카드 콘텐츠 정보 영역 */}
      <div className="p-3.5 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-bold text-[15px] text-gray-900 leading-snug line-clamp-2 hover:text-[#0A2540]">
              {festival.title}
            </h3>
          </div>

          <div className="space-y-1 text-xs text-gray-600 mt-2">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {festival.start_date.replace(/-/g, '.')} ~ {festival.end_date.replace(/-/g, '.')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 truncate">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{festival.addr1}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">
            {festival.source === 'MANUAL' ? '자체 등록' : '한국관광공사'}
          </span>
          <Link
            href={`/festivals/${festival.id}`}
            className="text-[#0A2540] font-semibold hover:underline flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span>상세보기</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
