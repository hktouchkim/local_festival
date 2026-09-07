import Link from 'next/link';
import { Calendar, MapPin, Sparkles, Music, Moon, Users } from 'lucide-react';
import { Festival } from '@/lib/data';

interface CurationSectionProps {
  title: string;
  subtitle: string;
  festivals: Festival[];
  badgeColor?: string;
  icon?: 'sparkles' | 'music' | 'moon' | 'users';
  onSelectOnMap?: (festival: Festival) => void;
}

export default function CurationSection({
  title,
  subtitle,
  festivals,
  icon = 'sparkles',
  onSelectOnMap
}: CurationSectionProps) {
  if (!festivals || festivals.length === 0) return null;

  return (
    <section className="py-6 border-b border-gray-100 last:border-b-0">
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
      </div>

      {/* 가로 스와이프 캐러셀 컨테이너 */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-gray-200">
        {festivals.map((fest) => {
          return (
            <div
              key={fest.id}
              className="flex-shrink-0 w-64 md:w-72 bg-white rounded-xl border border-gray-200 hover:border-gray-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col"
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
                {/* 행사 상태 뱃지 */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-[#0A2540]/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow">
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

                {/* 하단 액션 버튼 */}
                <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                  <Link
                    href={`/festivals/${fest.id}`}
                    className="flex-1 py-1.5 text-center bg-slate-50 hover:bg-slate-100 text-gray-700 rounded text-xs font-semibold transition"
                  >
                    상세보기
                  </Link>
                  {onSelectOnMap && (
                    <button
                      onClick={() => onSelectOnMap(fest)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0A2540] rounded text-xs font-semibold flex items-center gap-1 transition"
                      title="상단 지도에서 위치 확인"
                    >
                      <MapPin className="w-3 h-3 text-[#2292d8]" />
                      <span>지도</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
