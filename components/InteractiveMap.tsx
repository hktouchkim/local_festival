'use client';

import { useEffect, useRef, useState } from 'react';
import { Festival } from '@/lib/data';
import Link from 'next/link';

declare global {
  interface Window {
    kakao: any;
  }
}

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
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 카카오맵 초기화
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps || !mapRef.current) return;

      window.kakao.maps.load(() => {
        const container = mapRef.current;
        // 대한민국 중심 좌표 (대전/충청 인근 기준)
        const options = {
          center: new window.kakao.maps.LatLng(36.35, 127.75),
          level: 13, // 전국 단위 줌 레벨
        };

        const map = new window.kakao.maps.Map(container, options);
        kakaoMapInstance.current = map;

        // 지도 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        setIsLoaded(true);
      });
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const interval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(interval);
          initMap();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // 축제 데이터 변경 시 마커 렌더링
  useEffect(() => {
    if (!isLoaded || !kakaoMapInstance.current || !window.kakao) return;

    const map = kakaoMapInstance.current;

    // 기존 마커 및 오버레이 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    // 마커 생성
    const newMarkers = festivals.map(fest => {
      const pos = new window.kakao.maps.LatLng(fest.mapy, fest.mapx);
      const isSelected = selectedFestival?.id === fest.id;

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: map,
        title: fest.title
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onSelectFestival(fest);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // 축제 필터링 시 지도 영역 재조정 (선택된 축제가 없을 때)
    if (festivals.length > 0 && !selectedFestival) {
      const bounds = new window.kakao.maps.LatLngBounds();
      festivals.forEach(fest => {
        if (fest.mapy && fest.mapx) {
          bounds.extend(new window.kakao.maps.LatLngBounds(fest.mapy, fest.mapx));
        }
      });
    }
  }, [festivals, isLoaded, onSelectFestival, selectedFestival]);

  // 선택된 축제 변경 시 지도 중심 이동 및 커스텀 오버레이(말풍선) 노출
  useEffect(() => {
    if (!isLoaded || !kakaoMapInstance.current || !window.kakao) return;

    const map = kakaoMapInstance.current;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (selectedFestival && selectedFestival.mapy && selectedFestival.mapx) {
      const moveLatLon = new window.kakao.maps.LatLng(
        selectedFestival.mapy,
        selectedFestival.mapx
      );

      // 지도 부드럽게 중심 이동 및 줌 확대
      map.setLevel(7, { animate: true });
      map.panTo(moveLatLon);

      // 커스텀 오버레이(상세 팝업) 콘텐츠 생성
      const content = document.createElement('div');
      content.className = 'bg-white rounded-xl shadow-2xl border border-gray-200 p-3 max-w-[240px] text-left transform -translate-y-12';
      content.innerHTML = `
        <div class="flex items-center gap-2 mb-1.5">
          <span class="bg-[#0A2540] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">한경픽</span>
          <span class="text-xs font-bold text-gray-900 truncate">${selectedFestival.title}</span>
        </div>
        <p class="text-[11px] text-gray-500 mb-1 truncate">${selectedFestival.addr1 || ''}</p>
        <p class="text-[10px] text-blue-600 font-medium mb-2">${selectedFestival.start_date} ~ ${selectedFestival.end_date}</p>
        <a href="/festivals/${selectedFestival.id}" class="block text-center text-xs bg-[#2292d8] hover:bg-blue-600 text-white font-medium py-1 rounded transition-colors">
          상세보기 →
        </a>
      `;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: moveLatLon,
        content: content,
        yAnchor: 1.0,
      });

      customOverlay.setMap(map);
      overlayRef.current = customOverlay;
    }
  }, [selectedFestival, isLoaded]);

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
      {/* 지도 상단 컨트롤 바 */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs flex items-center gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse"></span>
        <span className="font-semibold text-gray-800">카카오맵 전국 실시간 지도</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500 font-medium">{festivals.length}개 축제 표시</span>
      </div>

      {/* 카카오맵이 마운트될 DOM 컨테이너 */}
      <div ref={mapRef} className="w-full h-full min-h-[500px] z-0" />

      {/* 로딩 인디케이터 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10 text-xs text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin"></div>
            <span>카카오 지도 로딩 중...</span>
          </div>
        </div>
      )}

      {/* 지도 하단 안내 바 */}
      <div className="bg-white/95 border-t border-gray-100 p-2 text-center text-xs text-gray-500 z-10">
        💡 마커를 클릭하면 축제 위치로 확대되고 상세 팝업이 노출됩니다.
      </div>
    </div>
  );
}
