'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Festival, SERVICE_TODAY } from '@/lib/data';
import { Locate, Loader2, ChevronLeft, ChevronRight, MapPin, Search, X, RotateCcw } from 'lucide-react';

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
  periodTabs: { key: string; label: string }[];
  // 추천 단축키 테마 상태
  selectedTheme: string | null;
  setSelectedTheme: (t: string | null) => void;
  // 전체 초기화
  onResetFilters: () => void;
  // 진행중 / 예정 / 종료 체크박스 상태
  showOngoing: boolean;
  setShowOngoing: (val: boolean) => void;
  showUpcoming: boolean;
  setShowUpcoming: (val: boolean) => void;
  showEnded: boolean;
  setShowEnded: (val: boolean) => void;
}

const KAKAO_KEY = 'eb3a51361a63acc8e8877f7307febc8a';
const TODAY_STR = SERVICE_TODAY;

export default function InteractiveMap({
  festivals,
  selectedFestival,
  onSelectFestival,
  searchQuery,
  setSearchQuery,
  selectedPeriod,
  setSelectedPeriod,
  periodTabs,
  selectedTheme,
  setSelectedTheme,
  onResetFilters,
  showOngoing,
  setShowOngoing,
  showUpcoming,
  setShowUpcoming,
  showEnded,
  setShowEnded
}: InteractiveMapProps) {
  const router = useRouter();
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

  // Ctrl/Cmd 스크롤 안내 힌트 상태
  const [showScrollHint, setShowScrollHint] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || ''));
    }
  }, []);

  // 지도 영역 휠(Wheel) 이벤트 리스너 (Ctrl 또는 Cmd 키를 눌렀을 때만 줌 동작)
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 1. 맥은 MetaKey(Cmd), 윈도우/리눅스는 CtrlKey 체크
      const isModifierPressed = e.metaKey || e.ctrlKey;

      if (isModifierPressed) {
        // 브라우저 줌 방지 및 지도 레벨 변경
        e.preventDefault();
        if (!kakaoMapInstance.current) return;
        const map = kakaoMapInstance.current;
        const currentLevel = map.getLevel();

        if (e.deltaY < 0) {
          // 위로 스크롤: 확대 (레벨 감소)
          if (currentLevel > 1) {
            map.setLevel(currentLevel - 1, { animate: true });
          }
        } else if (e.deltaY > 0) {
          // 아래로 스크롤: 축소 (레벨 증가)
          if (currentLevel < 14) {
            map.setLevel(currentLevel + 1, { animate: true });
          }
        }
      } else {
        // 일반 스크롤: 브라우저 기본 스크롤 동작 허용하되, 안내 힌트 잠시 노출
        setShowScrollHint(true);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => {
          setShowScrollHint(false);
        }, 1200);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [isLoaded]);

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
          center: new window.kakao.maps.LatLng(36.1, 127.8), // 초기 한반도 중심 뷰
          level: 12, // 기존 13에서 한 단계 확대
        };

        const map = new window.kakao.maps.Map(container, options);
        kakaoMapInstance.current = map;

        // 기본 휠 줌 비활성화 (일반 스크롤 시 브라우저 스크롤 유지)
        map.setZoomable(false);

        // 줌 컨트롤러 추가 (우측 버튼 줌은 언제든 가능)
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

    // 상태별 마커 SVG 생성 함수 (그린: #059669, 레드: #e83428, 그레이: #64748b)
    const createMarkerSvg = (fillColor: string, innerColor: string) => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
          </filter>
          <path d="M16 0C7.16 0 0 7.16 0 16c0 11.25 14.2 23.1 14.81 23.6a1.8 1.8 0 0 0 2.38 0C17.8 39.1 32 27.25 32 16 32 7.16 24.84 0 16 0z" fill="${fillColor}" filter="url(#shadow)"/>
          <circle cx="16" cy="15" r="7" fill="${innerColor}"/>
          <circle cx="16" cy="15" r="3" fill="#ffffff"/>
        </svg>
      `.trim();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    const ongoingMarkerImg = new window.kakao.maps.MarkerImage(
      createMarkerSvg('#059669', '#10b981'),
      new window.kakao.maps.Size(28, 36),
      { offset: new window.kakao.maps.Point(14, 36) }
    );

    const upcomingMarkerImg = new window.kakao.maps.MarkerImage(
      createMarkerSvg('#e83428', '#fb7185'),
      new window.kakao.maps.Size(28, 36),
      { offset: new window.kakao.maps.Point(14, 36) }
    );

    const endedMarkerImg = new window.kakao.maps.MarkerImage(
      createMarkerSvg('#64748b', '#94a3b8'),
      new window.kakao.maps.Size(26, 33),
      { offset: new window.kakao.maps.Point(13, 33) }
    );

    const newMarkers = festivals.map(fest => {
      const pos = new window.kakao.maps.LatLng(fest.mapy, fest.mapx);

      let markerImage = ongoingMarkerImg;
      if (fest.start_date <= TODAY_STR && fest.end_date >= TODAY_STR) {
        markerImage = ongoingMarkerImg;
      } else if (fest.start_date > TODAY_STR) {
        markerImage = upcomingMarkerImg;
      } else {
        markerImage = endedMarkerImg;
      }

      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: map,
        title: fest.title,
        image: markerImage
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

      let popupBadge = '<span class="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">진행중</span>';
      if (selectedFestival.start_date > TODAY_STR) {
        const d = Math.ceil((new Date(selectedFestival.start_date).getTime() - new Date(TODAY_STR).getTime()) / (1000 * 60 * 60 * 24));
        const dText = d === 0 ? 'D-Day' : `D-${d}`;
        popupBadge = `<span class="bg-[#e83428] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">${dText}</span>`;
      } else if (selectedFestival.end_date < TODAY_STR) {
        popupBadge = '<span class="bg-slate-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">종료</span>';
      }

      const content = document.createElement('div');
      content.className = 'bg-white rounded-xl shadow-2xl border border-gray-200 p-3 max-w-[240px] text-left transform -translate-y-12 select-none';
      content.innerHTML = `
        <div class="flex items-center gap-1.5 mb-1.5">
          ${popupBadge}
          <span class="text-xs font-bold text-gray-900 truncate">${selectedFestival.title}</span>
        </div>
        <p class="text-[11px] text-gray-500 mb-1 truncate">${selectedFestival.addr1 || ''}</p>
        <p class="text-[10px] text-blue-600 font-medium mb-2">${selectedFestival.start_date} ~ ${selectedFestival.end_date}</p>
        <button type="button" id="kakao-overlay-detail-btn" class="w-full block text-center text-xs bg-[#0A2540] hover:bg-slate-800 text-white font-medium py-1.5 rounded-lg transition-colors cursor-pointer">
          상세보기 →
        </button>
      `;

      const detailBtn = content.querySelector('#kakao-overlay-detail-btn');
      if (detailBtn) {
        detailBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          router.push(`/festivals/${selectedFestival.id}`);
        });
      }

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: moveLatLon,
        content: content,
        yAnchor: 1.0,
      });

      customOverlay.setMap(map);
      overlayRef.current = customOverlay;
    }
  }, [selectedFestival, isLoaded, router]);

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

  // 모바일 전용 전체화면 팝업 오버레이 상태
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      {/* 지도 상단 정보 바 (좌측) */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-200 shadow-md text-xs flex items-center gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse"></span>
        <span className="font-bold text-gray-900">전국 실시간 축제 지도</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600 font-medium">현재 화면에 {visibleFestivals.length}개 축제</span>
      </div>

      {/* 내 위치 중심 이동 플로팅 버튼 */}
      <div className="absolute top-3 left-64 md:left-72 z-20 hidden sm:block">
        <button
          onClick={handleFindMyLocation}
          disabled={isLocating}
          className="bg-white hover:bg-slate-50 text-gray-800 px-3.5 py-2 rounded-xl border border-gray-200 shadow-md text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
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
          <div className="absolute top-11 left-0 bg-red-600 text-white text-[11px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
            {locationError}
          </div>
        )}
      </div>

      {/* 모바일 전용: 상단 검색/목록 보기 플로팅 버튼 (질문 2 B안 모바일 목록 덮기 진입) */}
      <div className="absolute top-14 left-3 right-3 z-20 md:hidden flex items-center gap-2">
        <button
          onClick={() => setIsMobileOverlayOpen(true)}
          className="flex-1 bg-white/95 backdrop-blur-md border-2 border-[#0A2540] shadow-lg rounded-xl px-3.5 py-2.5 flex items-center justify-between text-left transition active:scale-98"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 truncate">
            <Search className="w-4 h-4 text-[#0A2540] flex-shrink-0" />
            <span className="truncate">{searchQuery || '축제명 또는 주소를 입력하세요.'}</span>
          </div>
          <span className="bg-[#0A2540] text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
            {visibleFestivals.length}개
          </span>
        </button>
        <button
          onClick={handleFindMyLocation}
          disabled={isLocating}
          className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2.5 text-blue-600 active:scale-95"
          title="내 위치"
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. PC 전용: 지도 우측 플로팅 필터 & 실시간 영역 축제 목록 패널 */}
      {/* ========================================================= */}
      <div
        className={`hidden md:flex absolute top-3 right-3 bottom-3 z-30 transition-all duration-300 items-stretch ${
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
        <div className="w-80 lg:w-92 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden">
          {/* 패널 헤더: 검색어 입력 및 필터 */}
          <div className="p-3.5 border-b border-gray-100 bg-white/90 space-y-2.5">
            {/* 상단: 건수 + 검색 초기화 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">화면 내 축제</span>
                <span className="bg-blue-50 text-[#0A2540] font-extrabold text-[11px] px-2 py-0.5 rounded-full border border-blue-200">
                  {visibleFestivals.length}
                </span>
              </div>
              {/* 우측 상단 검색/필터 초기화 버튼 */}
              <button
                onClick={onResetFilters}
                className="text-[11px] text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition flex items-center gap-1 font-semibold"
                title="모든 검색어 및 필터 조건 초기화"
              >
                <RotateCcw className="w-3 h-3" />
                <span>초기화</span>
              </button>
            </div>

            {/* 시인성 강화된 검색창 (진한 테두리 및 포커스 대비) */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#0A2540] absolute left-3 top-3 font-bold" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="축제명 또는 주소를 입력하세요."
                className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-slate-300 focus:border-[#0A2540] rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none shadow-xs transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 추천 테마 단축키 칩 버튼 (전체 배제, 단축키 토글 형태) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">추천 목록</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: 'HOT', label: '🔥 HOT 10' },
                  { key: 'MUSIC', label: '🎵 뮤직&페스티벌' },
                  { key: 'NIGHT', label: '🌙 야간·빛' },
                  { key: 'FAMILY', label: '👨‍👩‍👧 가족·체험' }
                ].map((item) => {
                  const isActive = selectedTheme === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedTheme(isActive ? null : item.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition border ${
                        isActive
                          ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-xs'
                          : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100 hover:border-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 퀵 기간 칩 (이번 주 반영) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {periodTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPeriod(tab.key)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                    selectedPeriod === tab.key
                      ? 'bg-blue-50 text-[#0A2540] border border-blue-200 font-bold'
                      : 'bg-slate-100 text-gray-500 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 진행중 / 진행예정 / 종료 체크박스 필터 */}
            <div className="flex items-center gap-2.5 pt-1.5 border-t border-gray-100 text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer select-none font-medium text-gray-700 hover:text-black">
                <input
                  type="checkbox"
                  checked={showOngoing}
                  onChange={(e) => setShowOngoing(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-0 accent-emerald-600"
                />
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  진행 중
                </span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer select-none font-medium text-gray-700 hover:text-black">
                <input
                  type="checkbox"
                  checked={showUpcoming}
                  onChange={(e) => setShowUpcoming(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#e83428] border-gray-300 focus:ring-0 accent-[#e83428]"
                />
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e83428]" />
                  진행 예정
                </span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer select-none font-medium text-gray-700 hover:text-black">
                <input
                  type="checkbox"
                  checked={showEnded}
                  onChange={(e) => setShowEnded(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-gray-500 border-gray-300 focus:ring-0 accent-gray-500"
                />
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  종료
                </span>
              </label>
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
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                          한경
                        </div>
                      )}
                      {/* 상태/D-day 미니 뱃지 */}
                      <div className="absolute top-1 left-1">
                        {fest.start_date <= TODAY_STR && fest.end_date >= TODAY_STR ? (
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                            진행중
                          </span>
                        ) : fest.start_date > TODAY_STR ? (
                          <span className="bg-[#e83428] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                            {(() => {
                              const d = Math.ceil((new Date(fest.start_date).getTime() - new Date(TODAY_STR).getTime()) / (1000 * 60 * 60 * 24));
                              return d === 0 ? 'D-Day' : `D-${d}`;
                            })()}
                          </span>
                        ) : (
                          <span className="bg-slate-500 text-white text-[9px] font-medium px-1.5 py-0.5 rounded shadow-xs">
                            종료
                          </span>
                        )}
                      </div>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/festivals/${fest.id}`);
                          }}
                          className="text-blue-600 font-semibold hover:underline flex-shrink-0 ml-1 cursor-pointer"
                        >
                          상세 →
                        </button>
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

      {/* Ctrl / Cmd 스크롤 안내 힌트 오버레이 (일반 스크롤 시 화면 중앙에 노출) */}
      {showScrollHint && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-40 pointer-events-none transition-opacity duration-200">
          <div className="bg-[#0A2540]/95 text-white px-5 py-3 rounded-xl shadow-2xl border border-white/20 text-xs md:text-sm font-semibold flex items-center gap-2 animate-scale-in">
            <span className="bg-white/20 px-2 py-0.5 rounded text-amber-300 font-mono text-xs">
              {isMac ? '⌘ Command' : 'Ctrl'}
            </span>
            <span>키를 누른 채 스크롤하면 지도가 확대/축소됩니다.</span>
          </div>
        </div>
      )}

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
