'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { Festival } from '@/lib/data';
import { Locate, Loader2, ChevronLeft, ChevronRight, MapPin, Calendar, Search, Filter, X } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface InteractiveMapProps {
  festivals: Festival[];
  selectedFestival: Festival | null;
  onSelectFestival: (festival: Festival) => void;
  // 검색 필터 상태 연동
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPeriod: string;
  setSelectedPeriod: (p: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  periodTabs: { key: string; label: string }[];
  regions: string[];
}

const KAKAO_KEY = 'eb3a51361a63acc8e8877f7307febc8a';

export default function InteractiveMap({
  festivals,
  selectedFestival,
  onSelectFestival,
  searchQuery,
  setSearchQuery,
  selectedPeriod,
  setSelectedPeriod,
  selectedRegion,
  setSelectedRegion,
  periodTabs,
  regions
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

  // 우측 플로팅 패널 접기/펼치기 상태 (기본값: 펼침)
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // 현재 지도 화면(영역 Bounds) 좌표 범위 상태
  const [mapBounds, setMapBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);

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
          setErrorMsg('카카오 지도 SDK를 불러오지 못했습니다. 도메인 설정을 확인해주세요.');
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

        // 지도 영역(Bounds) 갱신 함수
        const updateBounds = () => {
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          setMapBounds({
            minLat: sw.getLat(),
            maxLat: ne.getLat(),
            minLng: sw.getLng(),
            maxLng: ne.getLng()
          });
        };

        // 지도 이동/줌 완료 시(idle) 실시간 지도 영역 갱신 이벤트 등록
        window.kakao.maps.event.addListener(map, 'idle', updateBounds);
        updateBounds();

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

  // 축제 마커 렌더링
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

  // 선택된 축제 변경 시 줌인 및 말풍선 노출
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

  // 내 위치 찾기
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

        map.setLevel(7, { animate: true });
        map.panTo(locPosition);

        if (myLocationOverlayRef.current) {
          myLocationOverlayRef.current.setMap(null);
        }

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
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('위치 권한이 허용되지 않았습니다.');
        } else {
          setLocationError('현재 위치를 가져올 수 없습니다.');
        }
        setTimeout(() => setLocationError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 현재 지도 화면(mapBounds) 안에 실제로 들어와 있는 축제들만 실시간 필터링
  const visibleFestivals = useMemo(() => {
    if (!mapBounds) return festivals;
    return festivals.filter(fest => {
      const lat = fest.mapy;
      const lng = fest.mapx;
      if (!lat || !lng) return false;
      return (
        lat >= mapBounds.minLat &&
        lat <= mapBounds.maxLat &&
        lng >= mapBounds.minLng &&
        lng <= mapBounds.maxLng
      );
    });
  }, [festivals, mapBounds]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[560px] relative rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
      {/* 지도 상단 정보 바 */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs flex items-center gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse"></span>
        <span className="font-semibold text-gray-800">카카오맵 전국 실시간 지도</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500 font-medium">현재 화면에 {visibleFestivals.length}개 축제 노출</span>
      </div>

      {/* 내 위치 중심 이동 플로팅 버튼 */}
      <div className="absolute top-3 left-64 md:left-72 z-20 hidden sm:block">
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

        {locationError && (
          <div className="absolute top-10 left-0 bg-red-600 text-white text-[11px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
            {locationError}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. 지도 우측 플로팅 필터 & 실시간 영역 축제 목록 패널 (A안)   */}
      {/* ========================================================= */}
      <div
        className={`absolute top-3 right-3 bottom-3 z-30 transition-all duration-300 flex items-stretch ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-36px)]'
        }`}
      >
        {/* 접기/펼치기 토글 탭 버튼 */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-9 h-14 bg-white/95 backdrop-blur-md self-center rounded-l-xl border border-r-0 border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:text-black hover:bg-white transition"
          title={isPanelOpen ? '목록 접기' : '현재 지도 축제 목록 펼치기'}
        >
          {isPanelOpen ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          )}
        </button>

        {/* 패널 메인 바디 */}
        <div className="w-72 sm:w-80 md:w-88 bg-white/95 backdrop-blur-md rounded-r-2xl sm:rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden">
          {/* 패널 헤더: 검색어 입력 및 필터 */}
          <div className="p-3 border-b border-gray-100 bg-white/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">지도 영역 내 축제</span>
                <span className="bg-blue-50 text-blue-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                  {visibleFestivals.length}
                </span>
              </div>
              <button
                onClick={handleFindMyLocation}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium sm:hidden"
              >
                <Locate className="w-3 h-3" />
                <span>내위치</span>
              </button>
            </div>

            {/* 미니 검색창 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="결과 내 검색..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 퀵 기간 칩 */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {periodTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPeriod(tab.key)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
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

          {/* 패널 바디: 현재 지도 화면 내 축제 스크롤 리스트 */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-gray-50 scrollbar-thin scrollbar-thumb-gray-200">
            {visibleFestivals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 text-xs space-y-2">
                <MapPin className="w-8 h-8 text-gray-300 stroke-1" />
                <p>현재 지도 화면에 표시된 축제가 없습니다.</p>
                <p className="text-[11px] text-gray-400">지도를 축소하거나 다른 지역으로 이동해 보세요.</p>
              </div>
            ) : (
              visibleFestivals.map((fest) => {
                const isSelected = selectedFestival?.id === fest.id;
                return (
                  <div
                    key={fest.id}
                    onClick={() => onSelectFestival(fest)}
                    className={`pt-2 first:pt-0 p-2 rounded-xl transition-all duration-150 cursor-pointer flex gap-2.5 ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200 shadow-xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* 축제 썸네일 */}
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden relative">
                      {fest.firstimage ? (
                        <img
                          src={fest.firstimage}
                          alt={fest.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          이미지없음
                        </div>
                      )}
                    </div>

                    {/* 축제 정보 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-gray-900 truncate hover:text-blue-600">
                          {fest.title}
                        </h5>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {fest.addr1 || '전국'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span className="truncate">{fest.start_date} ~ {fest.end_date}</span>
                        <Link
                          href={`/festivals/${fest.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 font-semibold hover:underline flex-shrink-0 ml-1"
                        >
                          상세 →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 패널 푸터: 안내 */}
          <div className="p-2 border-t border-gray-100 bg-slate-50 text-[10px] text-gray-500 text-center">
            지도를 움직이면 화면 안의 축제가 자동으로 갱신됩니다.
          </div>
        </div>
      </div>

      {/* 카카오맵이 마운트될 DOM 컨테이너 */}
      <div ref={mapRef} className="w-full h-full min-h-[500px] md:min-h-[560px] z-0" />

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
    </div>
  );
}
