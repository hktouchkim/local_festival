'use client';

import { useEffect, useRef, useState } from 'react';
import { Festival } from '@/lib/data';
import { Locate, Loader2 } from 'lucide-react';

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
  const myLocationOverlayRef = useRef<any>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 카카오 지도 스크립트 동적 로드 및 맵 초기화
  useEffect(() => {
    let isMounted = true;

    const loadKakaoSDK = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          if (isMounted) initKakaoMap();
        });
        return;
      }

      const existingScript = document.getElementById('kakao-map-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          window.kakao.maps.load(() => {
            if (isMounted) initKakaoMap();
          });
        });
        return;
      }

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
          center: new window.kakao.maps.LatLng(35.9, 127.8), // 초기 한반도 전역 뷰
          level: 13,
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

  // 사용자 현재 위치(GPS) 조회 및 지도 중심 이동 (A안)
  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      return;
    }

    if (!isLoaded || !kakaoMapInstance.current || !window.kakao) return;

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const locPosition = new window.kakao.maps.LatLng(lat, lng);
        const map = kakaoMapInstance.current;

        // 1. 지도 줌인 및 중심 이동 (레벨 7: 구/시 단위 뷰)
        map.setLevel(7, { animate: true });
        map.panTo(locPosition);

        // 2. 기존 내 위치 마커 제거
        if (myLocationOverlayRef.current) {
          myLocationOverlayRef.current.setMap(null);
        }

        // 3. 내 위치 전용 펄스 애니메이션 마커(파란색 점) 생성
        const myLocContent = document.createElement('div');
        myLocContent.className = 'relative flex items-center justify-center';
        myLocContent.innerHTML = `
          <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="relative w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <div class="absolute bottom-6 whitespace-nowrap bg-[#0A2540] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md">
            내 위치
          </div>
        `;

        const myLocOverlay = new window.kakao.maps.CustomOverlay({
          position: locPosition,
          content: myLocContent,
          yAnchor: 0.5,
          zIndex: 30
        });

        myLocOverlay.setMap(map);
        myLocationOverlayRef.current = myLocOverlay;
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('위치 정보 접근 권한이 허용되지 않았습니다.');
        } else {
          setLocationError('현재 위치를 가져올 수 없습니다.');
        }
        setTimeout(() => setLocationError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
      {/* 지도 상단 정보 바 */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs flex items-center gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse"></span>
        <span className="font-semibold text-gray-800">카카오맵 전국 실시간 지도</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500 font-medium">{festivals.length}개 축제 표시</span>
      </div>

      {/* 내 위치 중심 이동 플로팅 버튼 (A안) */}
      <div className="absolute top-3 right-14 z-20">
        <button
          onClick={handleFindMyLocation}
          disabled={isLocating}
          className="bg-white hover:bg-slate-50 text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 shadow-md text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          title="내 주변 축제 찾기"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : (
            <Locate className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{isLocating ? '위치 찾는 중...' : '내 위치'}</span>
        </button>

        {/* 에러 팝업 */}
        {locationError && (
          <div className="absolute top-10 right-0 bg-red-600 text-white text-[11px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
            {locationError}
          </div>
        )}
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
        💡 '내 위치' 버튼을 누르면 현재 위치 주변의 축제를 한눈에 확인할 수 있습니다.
      </div>
    </div>
  );
}
