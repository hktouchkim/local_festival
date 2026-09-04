'use client';

import { useEffect, useRef } from 'react';
import { Festival } from '@/lib/data';

interface InteractiveMapProps {
  festivals: Festival[];
  selectedFestival: Festival | null;
  onSelectFestival: (festival: Festival) => void;
}

export default function InteractiveMap({
  festivals,
  selectedFestival,
  onSelectFestival
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 대한민국 지도 좌표 변환 (SVG 뷰박스 0 0 500 700 기준)
  // 경도: 125.0 ~ 130.0 -> X: 20 ~ 480
  // 위도: 33.0 ~ 38.5  -> Y: 680 ~ 30 (위도가 클수록 화면 상단)
  const projectCoordinates = (lng: number, lat: number) => {
    const minLng = 125.5;
    const maxLng = 129.8;
    const minLat = 33.2;
    const maxLat = 38.5;

    const x = ((lng - minLng) / (maxLng - minLng)) * 420 + 40;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 580 + 50;
    return { x, y };
  };

  return (
    <div className="w-full h-full min-h-[450px] relative bg-slate-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* 지도 상단 컨트롤 바 */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#0A2540] animate-pulse"></span>
        <span className="font-semibold text-gray-800">전국 축제 지도</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500 font-medium">{festivals.length}개 축제 개최</span>
      </div>

      {/* SVG 기반 인터랙티브 대한민국 지도 및 마커 */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <svg
          viewBox="0 0 500 680"
          className="w-full h-full max-h-[650px] drop-shadow-md select-none"
        >
          {/* 한반도 배경 형상 윤곽선 */}
          <path
            d="M 170 60 Q 250 50 320 80 Q 380 130 360 220 Q 380 290 350 380 Q 370 480 320 540 Q 240 560 170 520 Q 120 460 140 380 Q 110 260 150 160 Z"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* 제주도 */}
          <ellipse cx="140" cy="625" rx="35" ry="18" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          {/* 울릉도/독도 */}
          <circle cx="430" cy="220" r="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* 지역 구분 텍스트 라벨 */}
          <text x="180" y="160" className="text-[12px] fill-slate-400 font-bold">수도권</text>
          <text x="300" y="150" className="text-[12px] fill-slate-400 font-bold">강원</text>
          <text x="210" y="270" className="text-[12px] fill-slate-400 font-bold">충청</text>
          <text x="320" y="360" className="text-[12px] fill-slate-400 font-bold">경상</text>
          <text x="190" y="440" className="text-[12px] fill-slate-400 font-bold">전라</text>
          <text x="125" y="628" className="text-[10px] fill-slate-400 font-bold">제주</text>

          {/* 축제 마커 렌더링 */}
          {festivals.map((fest) => {
            const { x, y } = projectCoordinates(fest.mapx, fest.mapy);
            const isSelected = selectedFestival?.id === fest.id;

            return (
              <g
                key={fest.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectFestival(fest)}
              >
                {/* 펄스 파동 효과 (선택 시) */}
                {isSelected && (
                  <circle r="22" fill="#0A2540" opacity="0.2" className="animate-ping" />
                )}

                {/* 마커 핀 본체 */}
                <path
                  d="M 0 0 C -8 -12 -12 -18 -12 -25 A 12 12 0 1 1 12 -25 C 12 -18 8 -12 0 0 Z"
                  fill={isSelected ? '#0A2540' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform duration-200 hover:scale-125"
                />
                <circle cx="0" cy="-25" r="4.5" fill="#ffffff" />

                {/* 마커 호버/선택 텍스트 말풍선 */}
                <g transform="translate(0, -42)" className={isSelected ? 'block' : 'hover:block'}>
                  <rect
                    x="-60"
                    y="-12"
                    width="120"
                    height="20"
                    rx="4"
                    fill="#0A2540"
                    className="shadow-lg"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {fest.title.length > 9 ? fest.title.slice(0, 8) + '..' : fest.title}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 지도 하단 안내 바 */}
      <div className="bg-white/90 border-t border-gray-100 p-2.5 text-center text-xs text-gray-500">
        💡 마커를 클릭하면 해당 축제 카드가 강조되고 상세 정보로 연결됩니다.
      </div>
    </div>
  );
}
