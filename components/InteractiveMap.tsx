'use client';

import { useEffect, useRef, useState } from 'react';
import { Festival } from '@/lib/data';

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

const KAKAO_KEY = 'eb3a51361a63acc8e8877f7307febc8a';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 카카오 지도 스크립트 동적 로드 및 맵 초기화
  useEffect(() => {
    let isMounted = true;

    const loadKakaoSDK = () => {
      // 1. 이미 kakao.maps 객체가 존재하는 경우
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          if (isMounted) initKakaoMap();
        });
        return;
      }

      // 2. 이미 script 태그가 삽입되어 있는지 확인
      const existingScript = document.getElementById('kakao-map-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          window.kakao.maps.load(() => {
            if (isMounted) initKakaoMap();
          });
        });
        return;
      }

      // 3. 신규 스크립트 태그 동적 삽입
      const script = document.createElement('script');
      script.id = 'kakao-map-script';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services,clusterer`;
      script.async = true;

      script.onload = () => {
        if (!window.kakao || !window.kakao.maps) {
          if (isMounted) setErrorMsg('카카오 지도 객체를 초기화할 수 없습니다.');
          return;
        }
        window.kakao.maps.load(() => {
          if (isMounted) initKakaoMap();
        });
      };

      script.onerror = () => {
        if (isMounted) {
          setErrorMsg('카카오 지도 SDK를 불러오지 못했습니다. 카카오 개발자 콘솔의 Web 플랫폼 도메인 설정을 확인해주세요.');
        }
      };

      document.head.appendChild(script);
    };

    const initKakaoMap = () => {
      if (!mapRef.current || !window.kakao || !window.kakao.maps) return;

      try {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(35.9, 127.8), // 한반도 정중앙 (남한 전역 및 제주도 포괄)
          level: 13, // 서울부터 부산, 제주도까지 한눈에 보이는 축척
        };

        const map = new window.kakao.maps.Map(container, options);
        kakaoMapInstance.current = map;

        // 줌 컨트롤러 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        setIsLoaded(true);
      } catch (err: any) {
        console.error('Failed to init Kakao map:', err);
        setErrorMsg('지도 초기화 실패: ' + err.message);
      }
    };

    loadKakaoSDK();

    return () => {
      isMounted = false;
    };
  }, []);

  // 축제 목록 마커 렌더링
  useEffect(() => {
    if (!isLoaded || !kakaoMapInstance.current || !window.kakao) return;

    const map = kakaoMapInstance.current;

    // 기존 마커 및 오버레이 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    const newMarkers = festivals.map(fest => {
      const pos = new window.kakao.maps.LatLng(fest.mapy, fest.mapx);

      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: map,
        title: fest.title
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        onSelectFestival(fest);
      });

      return marker;
    });

    markersRef.current = newMarkers;
  }, [festivals, isLoaded, onSelectFestival]);

  // 선택된 축제 변경 시 지도 이동 및 커스텀 말풍선 노출
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

      map.setLevel(7, { animate: true });
      map.panTo(moveLatLon);

      const content = document.createElement('div');
      content.className = 'bg-white rounded-xl shadow-2xl border border-gray-200 p-3 max-w-[240px] text-left transform -translate-y-12';
      content.innerHTML = `
        <div class="flex items-center gap-1.5 mb-1.5">
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

      {/* 로딩 인디케이터 또는 에러 안내 */}
      {!isLoaded && !errorMsg && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10 text-xs text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin"></div>
            <span>카카오 지도 로딩 중...</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center z-10 p-4 text-center">
          <div className="text-xs text-red-600 max-w-sm">
            <p className="font-bold mb-1">카카오 지도 로드 실패</p>
            <p>{errorMsg}</p>
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
