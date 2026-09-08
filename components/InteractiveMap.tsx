'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Festival, SERVICE_TODAY } from '@/lib/data';
import { Locate, Loader2, ChevronLeft, ChevronRight, MapPin, Search, X, RotateCcw } from 'lucide-react';
import FestivalDetailPanel from './FestivalDetailPanel';

declare global {
  interface Window {
    kakao: any;
  }
}

interface InteractiveMapProps {
  festivals: Festival[];
  selectedFestival: Festival | null;
  onSelectFestival: (festival: Festival | null) => void;
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

  // 현재 필터링에 적용된 지도 영역(Bounds) 좌표 범위 상태
  const [appliedBounds, setAppliedBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);

  // 현재 지도가 위치한 실시간 영역 및 재검색 버튼 노출 여부
  const [currentBounds, setCurrentBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const [showRefreshBtn, setShowRefreshBtn] = useState(false);

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

      script.addEventListener('load', () => {
        window.kakao.maps.load(() => {
          if (isMounted) initKakaoMap();
        });
      });

      script.addEventListener('error', () => {
        if (isMounted) {
          setErrorMsg('카카오 지도 스크립트를 불러오는데 실패했습니다.');
        }
      });

      document.head.appendChild(script);
    };

    const initKakaoMap = () => {
      try {
        const container = mapRef.current;
        if (!container) return;

        // 대한민국 중심 좌표 (약 대전 부근)
        const options = {
          center: new window.kakao.maps.LatLng(36.3504, 127.8845),
          level: 12,
        };

        const map = new window.kakao.maps.Map(container, options);
        kakaoMapInstance.current = map;

        // 마우스 휠 스크롤 시 즉시 줌 확대/축소 활성화
        map.setZoomable(true);

        // 줌 컨트롤러 추가 (우측 버튼 줌은 언제든 가능)
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // 최초 로딩 시 지도 영역(Bounds) 가져와서 바로 적용
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const initialBounds = {
          minLat: sw.getLat(),
          maxLat: ne.getLat(),
          minLng: sw.getLng(),
          maxLng: ne.getLng()
        };
        setAppliedBounds(initialBounds);
        setCurrentBounds(initialBounds);

        // 지도 이동/줌 완료 시(idle) 실시간 지도 영역 감지 -> '현 지도에서 검색' 버튼 노출
        window.kakao.maps.event.addListener(map, 'idle', () => {
          const newBounds = map.getBounds();
          const newSw = newBounds.getSouthWest();
          const newNe = newBounds.getNorthEast();
          const cur = {
            minLat: newSw.getLat(),
            maxLat: newNe.getLat(),
            minLng: newSw.getLng(),
            maxLng: newNe.getLng()
          };
          setCurrentBounds(cur);
          setShowRefreshBtn(true);
        });

        // 지도 빈 영역 클릭 시 상세 패널 닫기
        window.kakao.maps.event.addListener(map, 'click', () => {
          onSelectFestival(null);
        });

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
      const targetLat = Number(selectedFestival.mapy);
      const targetLng = Number(selectedFestival.mapx);
      const markerLatLon = new window.kakao.maps.LatLng(targetLat, targetLng);

      map.setLevel(7, { animate: true });

      // PC 환경에서 좌측 패널(약 390px) + 이격 여백(16px) + 상세 패널(410px) = 총 너비 약 816px 노출 시
      // 마커가 패널에 가려지지 않고 우측 가용 영역 정중앙에 오도록 오프셋 패닝
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      if (isDesktop && map.getProjection) {
        try {
          const proj = map.getProjection();
          const point = proj.pointFromCoords(markerLatLon);
          // 좌측 총 점유 너비(약 816px)의 절반인 약 410px만큼 중심점을 좌측으로 오프셋 주어 마커를 잔여 우측 중앙에 배치
          const offsetPoint = new window.kakao.maps.Point(point.x - 410, point.y);
          const newCenterCoords = proj.coordsFromPoint(offsetPoint);
          map.panTo(newCenterCoords);
        } catch (e) {
          map.panTo(markerLatLon);
        }
      } else {
        map.panTo(markerLatLon);
      }

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
          onSelectFestival(selectedFestival);
        });
      }

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: markerLatLon,
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

  // '현 지도에서 검색' 버튼 클릭 시 현재 보고 있는 영역을 적용하여 목록 갱신
  const handleSearchInCurrentMap = () => {
    if (currentBounds) {
      setAppliedBounds(currentBounds);
    }
    setShowRefreshBtn(false);
  };

  // 현재 지도 화면(appliedBounds) 안에 실제로 들어와 있는 축제들만 필터링
  const visibleFestivals = useMemo(() => {
    if (!appliedBounds) return festivals;
    return festivals.filter(fest => {
      const lat = fest.mapy;
      const lng = fest.mapx;
      if (!lat || !lng) return false;
      return (
        lat >= appliedBounds.minLat &&
        lat <= appliedBounds.maxLat &&
        lng >= appliedBounds.minLng &&
        lng <= appliedBounds.maxLng
      );
    });
  }, [festivals, appliedBounds]);

  // 모바일 전용 전체화면 팝업 오버레이 상태
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      {/* 내 위치 중심 이동 플로팅 버튼 (우측 하단으로 이동) */}
      <div className="absolute bottom-6 right-6 z-20 hidden sm:block">
        <button
          onClick={handleFindMyLocation}
          disabled={isLocating}
          className="bg-white hover:bg-slate-50 text-gray-800 px-4 py-2.5 rounded-xl border border-gray-300 shadow-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          title="내 주변 축제 찾기"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Locate className="w-4 h-4 text-blue-600" />
          )}
          <span>{isLocating ? '위치 찾는 중...' : '내 위치'}</span>
        </button>

        {locationError && (
          <div className="absolute bottom-12 right-0 bg-red-600 text-white text-[11px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
            {locationError}
          </div>
        )}
      </div>

      {/* 모바일 전용: 상단 검색/목록 보기 플로팅 버튼 */}
      <div className="absolute top-3 left-3 right-3 z-20 md:hidden flex items-center gap-2">
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
      {/* 2. PC 전용: 지도 좌측 풀하이트 검색 패널 + 우측 이격 플로팅 상세 패널 */}
      {/* ========================================================= */}
      <div
        className={`hidden md:flex absolute top-0 left-0 bottom-0 z-30 transition-all duration-300 items-start ${
          isPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%-36px)]'
        }`}
      >
        {/* 좌측 메인 검색 패널 컨테이너 (상/하/좌 여백 0px 밀착) */}
        <div className="flex items-stretch h-full">
          {/* 패널 메인 바디 (너비 w-[390px], 상/하/좌 완전 밀착, overflow-y-auto) */}
          <div className="w-[390px] bg-white border-r border-gray-200 shadow-xl flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 select-none">
            {/* [상단 고정 Sticky Header] 검색 결과 건수 + 초기화 버튼 + 검색어 입력창 */}
            <div className="sticky top-0 z-20 bg-white/98 backdrop-blur-md p-3.5 border-b border-gray-100 shadow-xs space-y-2.5">
              {/* 상단: 건수 + 검색 초기화 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-gray-900">축제 검색결과</span>
                  <span className="bg-blue-50 text-[#0A2540] font-extrabold text-[11px] px-2 py-0.5 rounded-full border border-blue-200">
                    {visibleFestivals.length}
                  </span>
                </div>
                {/* 우측 상단 검색/필터 초기화 버튼 */}
                <button
                  onClick={onResetFilters}
                  className="text-[11px] text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition flex items-center gap-1 font-semibold cursor-pointer"
                  title="모든 검색어 및 필터 조건 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>초기화</span>
                </button>
              </div>

              {/* 시인성 강화된 검색창 (상단 고정으로 언제든 재검색 가능) */}
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
            </div>

            {/* 패널 내부 스크롤 콘텐츠 (추천 배너 + 칩 + 체크박스 + 결과 목록) */}
            <div className="p-3.5 space-y-3">
              {/* 추천 배너 3종 */}
              <div className="space-y-1.5">
                {[
                  {
                    key: 'HOT',
                    title: 'HOT 10 축제',
                    desc: '지금 가장 주목받는 인기 축제',
                    badge: '🔥 인기',
                    bgGradient: 'from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100',
                    activeBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm border-transparent',
                    borderColor: 'border-amber-200/80',
                    textColor: 'text-amber-950',
                    descColor: 'text-amber-700'
                  },
                  {
                    key: 'MUSIC',
                    title: '뮤직 & 페스티벌',
                    desc: '음악·공연·버스킹·락 축제',
                    badge: '🎵 공연',
                    bgGradient: 'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100',
                    activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm border-transparent',
                    borderColor: 'border-blue-200/80',
                    textColor: 'text-blue-950',
                    descColor: 'text-blue-700'
                  },
                  {
                    key: 'NIGHT',
                    title: '야간 & 빛 축제',
                    desc: '낭만 가득 불꽃·달빛·드론쇼',
                    badge: '🌙 야경',
                    bgGradient: 'from-purple-50 to-slate-100 hover:from-purple-100 hover:to-slate-200',
                    activeBg: 'bg-gradient-to-r from-purple-700 to-[#0A2540] text-white shadow-sm border-transparent',
                    borderColor: 'border-purple-200/80',
                    textColor: 'text-purple-950',
                    descColor: 'text-purple-700'
                  }
                ].map((item) => {
                  const isActive = selectedTheme === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedTheme(isActive ? null : item.key)}
                      className={`w-full px-3 py-2 rounded-xl text-left transition border flex items-center justify-between ${
                        isActive
                          ? item.activeBg
                          : `bg-gradient-to-r ${item.bgGradient} ${item.borderColor}`
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold text-xs tracking-tight ${isActive ? 'text-white' : item.textColor}`}>
                            {item.title}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isActive ? 'bg-white/20 text-white' : 'bg-white/80 text-gray-700 border border-gray-200'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isActive ? 'text-white/90' : item.descColor}`}>
                          {item.desc}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {isActive ? '✓ 적용중' : '→'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 퀵 기간 칩 (이번 주 반영) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                {periodTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedPeriod(tab.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
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
              <div className="flex items-center gap-2.5 pt-1 border-t border-gray-100 text-[11px]">
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
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    종료
                  </span>
                </label>
              </div>

              {/* 검색 결과 목록 */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {visibleFestivals.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                    <p className="font-semibold text-gray-600">검색 조건에 맞는 축제가 없습니다.</p>
                    <p className="text-[11px] text-gray-400 mt-1">지도를 다른 지역으로 이동해보세요.</p>
                  </div>
                ) : (
                  visibleFestivals.map((fest) => {
                    const isSelected = selectedFestival?.id === fest.id;
                    let badgeText = '진행 예정';
                    let badgeColor = 'bg-[#e83428] text-white';

                    if (fest.start_date <= TODAY_STR && fest.end_date >= TODAY_STR) {
                      badgeText = '진행 중';
                      badgeColor = 'bg-emerald-600 text-white';
                    } else if (fest.start_date > TODAY_STR) {
                      const d = Math.ceil((new Date(fest.start_date).getTime() - new Date(TODAY_STR).getTime()) / (1000 * 60 * 60 * 24));
                      badgeText = d === 0 ? 'D-Day' : `D-${d}`;
                      badgeColor = 'bg-[#e83428] text-white';
                    } else if (fest.end_date < TODAY_STR) {
                      badgeText = '종료';
                      badgeColor = 'bg-slate-500 text-white';
                    }

                    return (
                      <div
                        key={fest.id}
                        onClick={() => onSelectFestival(fest)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex gap-2.5 ${
                          isSelected
                            ? 'border-[#0A2540] bg-blue-50/50 shadow-sm ring-1 ring-[#0A2540]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        {/* 축제 썸네일 */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative border border-gray-100">
                          {fest.first_image ? (
                            <img
                              src={fest.first_image}
                              alt={fest.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                              No Img
                            </div>
                          )}
                        </div>

                        {/* 축제 요약 정보 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${badgeColor}`}>
                                {badgeText}
                              </span>
                              <h4 className="font-bold text-xs text-gray-900 truncate flex-1">
                                {fest.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mb-1">
                              {fest.addr1 || '상세 주소 정보 없음'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span className="truncate">{fest.start_date} ~ {fest.end_date}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectFestival(fest);
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
            </div>

            {/* 패널 푸터: 안내 */}
            <div className="p-2 border-t border-gray-100 bg-slate-50 text-[10px] text-gray-500 text-center flex-shrink-0">
              지도를 움직인 후 상단 '현 지도에서 검색'을 누르면 갱신됩니다.
            </div>
          </div>

          {/* 접기/펼치기 토글 탭 버튼 (패널 우측 경계선에 위치: 상세 패널 오픈 시 숨김) */}
          {!selectedFestival && (
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="w-8 h-14 bg-white self-center rounded-r-xl border border-l-0 border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:text-black transition flex-shrink-0"
              title={isPanelOpen ? '목록 접기' : '축제 검색결과 펼치기'}
            >
              {isPanelOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-600" />
              )}
            </button>
          )}
        </div>

        {/* 2단 상세 패널 (검색 패널 우측에서 16px 떨어져 살짝 둥근 카드로 플로팅) */}
        {selectedFestival && isPanelOpen && (
          <div className="h-full py-4 pl-4 flex items-center">
            <FestivalDetailPanel
              festival={selectedFestival}
              onClose={() => onSelectFestival(null)}
            />
          </div>
        )}
      </div>

      {/* 지도 상단 플로팅: '현 지도에서 검색' 버튼 (지도 이동 시 노출) */}
      {showRefreshBtn && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <button
            onClick={handleSearchInCurrentMap}
            className="bg-[#0A2540] hover:bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300 animate-spin-reverse" />
            <span>현 지도에서 검색</span>
          </button>
        </div>
      )}

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
