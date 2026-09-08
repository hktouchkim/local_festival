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

  const initialBoundsRef = useRef<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const initialCenterRef = useRef<{ lat: number; lng: number; level: number } | null>(null);
  // 서비스/프로그램에 의한 지도 자동 이동 여부 플래그 (사용자 직접 드래그/줌 조작 시에만 false)
  const isProgrammaticMoveRef = useRef<boolean>(true);
  // 커스텀 스무스 글라이딩 애니메이션 프레임 레퍼런스
  const flyAnimationRef = useRef<number | null>(null);

  // 현재 지도가 위치한 실시간 영역 및 재검색 버튼 노출 여부
  const [currentBounds, setCurrentBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const [showRefreshBtn, setShowRefreshBtn] = useState(false);

  // '현 지도에서 검색' 버튼 클릭 시 현재 보고 있는 영역을 적용하여 목록 갱신
  const handleSearchInCurrentMap = () => {
    if (currentBounds) {
      setAppliedBounds(currentBounds);
    }
    setShowRefreshBtn(false);
  };

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  // 롤링 배너 데이터 목록
  const THEME_BANNERS = [
    {
      key: 'HOT',
      title: 'HOT 10 축제',
      desc: '지금 가장 주목받는 전국 인기 축제 모음',
      badge: 'HOT PICK',
      icon: '🔥',
      bg: 'bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white',
      badgeBg: 'bg-black/25 text-amber-200 border border-white/20'
    },
    {
      key: 'MUSIC',
      title: '뮤직 & 페스티벌',
      desc: '음악·공연·버스킹·락 축제 엄선 큐레이션',
      badge: 'LIVE STAGE',
      icon: '🎵',
      bg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white',
      badgeBg: 'bg-black/25 text-blue-200 border border-white/20'
    },
    {
      key: 'NIGHT',
      title: '야간 & 빛 축제',
      desc: '낭만 가득 불꽃·달빛·드론 야경 스팟',
      badge: 'NIGHT VIEW',
      icon: '🌙',
      bg: 'bg-gradient-to-r from-purple-800 via-indigo-900 to-[#0A2540] text-white',
      badgeBg: 'bg-black/25 text-purple-200 border border-white/20'
    }
  ];

  const handlePrevBanner = () => {
    setActiveBannerIdx((prev) => (prev - 1 + THEME_BANNERS.length) % THEME_BANNERS.length);
  };

  const handleNextBanner = () => {
    setActiveBannerIdx((prev) => (prev + 1) % THEME_BANNERS.length);
  };

  // 추천 축제 큐레이션 클릭 시 검색어 입력란에 배너명을 채우고 결과 목록 갱신
  const handleThemeBannerClick = (themeKey: string, bannerTitle?: string) => {
    const nextTheme = selectedTheme === themeKey ? null : themeKey;
    setSelectedTheme(nextTheme);

    // 검색어 입력란에 해당 배너명을 주입하여 사용자가 검색결과를 직관적으로 파악하도록 연동
    if (nextTheme && bannerTitle) {
      setSearchQuery(bannerTitle);
    } else {
      setSearchQuery('');
    }

    // 상세 패널이 열려있다면 닫기
    onSelectFestival(null);

    // 프로그램 제어 이동 플래그 활성화 -> idle 이벤트 시 '현 지도에서 검색' 버튼 노출 억제
    isProgrammaticMoveRef.current = true;
    setShowRefreshBtn(false);

    // 지도 인스턴스가 존재할 경우 최초 중심 좌표 및 줌 레벨로 부드럽게 글라이딩 리셋
    if (kakaoMapInstance.current && window.kakao) {
      const map = kakaoMapInstance.current;
      const initialCenter = initialCenterRef.current || { lat: 36.3504, lng: 127.8845, level: 12 };
      const initialLatLon = new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng);

      // 먼저 중심 좌표로 부드럽게 패닝 이동
      map.panTo(initialLatLon);

      // 레벨이 다른 경우 순차적으로 부드러운 줌아웃 애니메이션 적용
      if (map.getLevel() !== initialCenter.level) {
        setTimeout(() => {
          if (kakaoMapInstance.current) {
            kakaoMapInstance.current.setLevel(initialCenter.level, { animate: true });
          }
        }, 150);
      }

      if (initialBoundsRef.current) {
        setAppliedBounds(initialBoundsRef.current);
        setCurrentBounds(initialBoundsRef.current);
      }
    }
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

        // 최초 로딩 시 지도 영역(Bounds) 및 중심 좌표/레벨 가져와서 바로 저장 및 적용
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const initialBounds = {
          minLat: sw.getLat(),
          maxLat: ne.getLat(),
          minLng: sw.getLng(),
          maxLng: ne.getLng()
        };
        initialBoundsRef.current = initialBounds;
        initialCenterRef.current = { lat: 36.3504, lng: 127.8845, level: 12 };
        // 사용자가 직접 지도를 드래그하거나 휠 줌을 조작할 때만 플래그 해제
        window.kakao.maps.event.addListener(map, 'dragstart', () => {
          isProgrammaticMoveRef.current = false;
        });
        window.kakao.maps.event.addListener(map, 'zoom_start', () => {
          isProgrammaticMoveRef.current = false;
        });

        // 지도 이동/줌 완료 시(idle) 실시간 지도 영역 감지 -> 사용자가 직접 조작했을 때만 '현 지도에서 검색' 버튼 노출
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

          if (!isProgrammaticMoveRef.current) {
            setShowRefreshBtn(true);
          } else {
            // 프로그램 제어 이동 완료 후 플래그 초기화
            isProgrammaticMoveRef.current = false;
          }
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

    const newMarkers = visibleFestivals.map(fest => {
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
  }, [visibleFestivals, isLoaded, onSelectFestival]);

  // 선택된 축제 변경 시 줌인 및 말풍선 노출
  useEffect(() => {
    if (!isLoaded || !kakaoMapInstance.current || !window.kakao) return;

    const map = kakaoMapInstance.current;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (selectedFestival && selectedFestival.mapy && selectedFestival.mapx) {
      // 축제 선택으로 인한 자동 이동 시 '현 지도에서 검색' 버튼 노출 억제
      isProgrammaticMoveRef.current = true;
      setShowRefreshBtn(false);

      const targetLat = Number(selectedFestival.mapy);
      const targetLng = Number(selectedFestival.mapx);
      const markerLatLon = new window.kakao.maps.LatLng(targetLat, targetLng);

      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

      // 1. 레벨 7로 먼저 줌 조정 (레벨 12 상태에서 픽셀 오프셋을 계산하면 수백 km 서해 바다로 이동하는 오류 방지)
      if (map.getLevel() !== 7) {
        map.setLevel(7, { animate: true });
      }

      // 부드러운 글라이딩(Smooth Fly-to) 카메라 이동 구현 (A안)
      // 이전 실행 중이던 애니메이션이 있으면 취소
      if (flyAnimationRef.current) {
        cancelAnimationFrame(flyAnimationRef.current);
        flyAnimationRef.current = null;
      }

      // 목표 좌표 계산: 레벨 7 기준 우측 가용 영역 중앙에 오도록 410px 오프셋 반영
      let targetCenterLat = targetLat;
      let targetCenterLng = targetLng;

      if (isDesktop && map.getProjection) {
        try {
          const proj = map.getProjection();
          const point = proj.pointFromCoords(markerLatLon);
          const offsetPoint = new window.kakao.maps.Point(point.x - 410, point.y);
          const offsetCoords = proj.coordsFromPoint(offsetPoint);
          targetCenterLat = offsetCoords.getLat();
          targetCenterLng = offsetCoords.getLng();
        } catch (e) {
          targetCenterLat = targetLat;
          targetCenterLng = targetLng;
        }
      }

      const startCenter = map.getCenter();
      const startLat = startCenter.getLat();
      const startLng = startCenter.getLng();

      // 위경도 차이가 거의 없으면 바로 설정
      const distLat = Math.abs(targetCenterLat - startLat);
      const distLng = Math.abs(targetCenterLng - startLng);
      if (distLat < 0.0001 && distLng < 0.0001) {
        map.setCenter(new window.kakao.maps.LatLng(targetCenterLat, targetCenterLng));
      } else {
        const duration = 650; // 0.65초 부드러운 비행
        const startTime = performance.now();

        // 큐빅 이징 (easeInOutCubic) 함수: 시작과 끝이 매우 부드러움
        const easeInOutCubic = (t: number) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const animateGliding = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = easeInOutCubic(progress);

          const currentLat = startLat + (targetCenterLat - startLat) * easeProgress;
          const currentLng = startLng + (targetCenterLng - startLng) * easeProgress;

          if (kakaoMapInstance.current && window.kakao) {
            kakaoMapInstance.current.setCenter(new window.kakao.maps.LatLng(currentLat, currentLng));
          }

          if (progress < 1) {
            flyAnimationRef.current = requestAnimationFrame(animateGliding);
          } else {
            flyAnimationRef.current = null;
          }
        };

        flyAnimationRef.current = requestAnimationFrame(animateGliding);
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
        <p class="text-[10px] text-blue-600 font-medium">${selectedFestival.start_date} ~ ${selectedFestival.end_date}</p>
      `;

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

  // 모바일 전용 바텀시트 확장 상태 ('collapsed': 미니 30% 높이, 'expanded': 화면 전체 100% 풀페이지)
  const [mobileSheetMode, setMobileSheetMode] = useState<'collapsed' | 'expanded'>('collapsed');
  // 모바일 전용 상세 바텀시트 모드 ('half': 60% 높이, 'full': 92% 풀스크린) - B안
  const [mobileDetailMode, setMobileDetailMode] = useState<'half' | 'full'>('half');

  // 모바일 바텀시트 꼭지 버튼/손잡이 전용 터치 추적 Ref
  const handleTouchStartYRef = useRef<number | null>(null);
  // 콘텐츠 내부 스크롤 한계 도달 시 터치 추적 Ref
  const contentTouchStartYRef = useRef<number | null>(null);
  const sheetContentRef = useRef<HTMLDivElement | null>(null);

  // 1) 꼭지 버튼/손잡이 영역 터치 제스처: 잡고 쓸어올리거나 쓸어내리면 즉각 바텀시트 이동
  const onHandleTouchStart = (e: React.TouchEvent) => {
    handleTouchStartYRef.current = e.touches[0].clientY;
  };

  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault(); // 기본 새로고침 및 브라우저 스크롤 완전 차단
  };

  const onHandleTouchEnd = (e: React.TouchEvent) => {
    if (handleTouchStartYRef.current === null) return;
    const diffY = handleTouchStartYRef.current - e.changedTouches[0].clientY;
    // 위로 30px 이상 쓸어올림 -> 풀페이지 확장
    if (diffY > 30) {
      setMobileSheetMode('expanded');
    }
    // 아래로 30px 이상 쓸어내림 -> 30%로 축소
    else if (diffY < -30) {
      setMobileSheetMode('collapsed');
    }
    handleTouchStartYRef.current = null;
  };

  // 2) 콘텐츠 내부 터치 제스처: "터치를 시작할 때부터 이미 맨 위(한계)였던 상태"에서 다시 아래로 쓸어내렸을 때만 시트 축소
  const contentTouchStartScrollTopRef = useRef<number>(0);

  const onContentTouchStart = (e: React.TouchEvent) => {
    contentTouchStartYRef.current = e.touches[0].clientY;
    if (sheetContentRef.current) {
      contentTouchStartScrollTopRef.current = sheetContentRef.current.scrollTop;
    }
  };

  const onContentTouchMove = (e: React.TouchEvent) => {
    if (!contentTouchStartYRef.current || !sheetContentRef.current) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - contentTouchStartYRef.current;
    const { scrollTop, scrollHeight, clientHeight } = sheetContentRef.current;

    // 맨 위에서 아래로 당길 때: 새로고침 방지
    if (scrollTop <= 0 && diffY > 0) {
      if (e.cancelable) e.preventDefault();
    }
    // 맨 아래에서 위로 당길 때: 오버스크롤 방지
    if (scrollTop + clientHeight >= scrollHeight - 1 && diffY < 0) {
      if (e.cancelable) e.preventDefault();
    }
  };

  const onContentTouchEnd = (e: React.TouchEvent) => {
    if (!contentTouchStartYRef.current || !sheetContentRef.current) return;
    const diffY = contentTouchStartYRef.current - e.changedTouches[0].clientY;
    const currentScrollTop = sheetContentRef.current.scrollTop;

    // 축소 상태(collapsed)일 때는 콘텐츠 내부에서 위로 쓸어올리면 풀페이지로 전환
    if (mobileSheetMode === 'collapsed' && diffY > 30) {
      setMobileSheetMode('expanded');
    }
    // 확장 상태(expanded)일 때:
    // 반드시 "터치를 시작했던 시점(start)에도 맨 위(<= 0)"였고, "터치가 끝난 지금도 맨 위"인 상태에서만 축소
    // 즉, 아래에서 위로 스크롤해서 탑에 도달한 연속 제스처에서는 절대 닫히지 않고,
    // 이미 탑에 머물러 있는 상태에서 사용자가 다시 손을 대어 의도적으로 아래로 쓸어내렸을 때만 닫힘
    else if (mobileSheetMode === 'expanded') {
      if (contentTouchStartScrollTopRef.current <= 0 && currentScrollTop <= 0 && diffY < -40) {
        setMobileSheetMode('collapsed');
      }
    }
    contentTouchStartYRef.current = null;
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      {/* 내 위치 중심 이동 플로팅 버튼 (PC: 우측 하단, 모바일: 바텀시트 바로 위 우측) */}
      <div className={`absolute right-4 md:right-6 z-20 transition-all duration-300 ${
        mobileSheetMode === 'expanded' ? 'bottom-[calc(100vh-60px)] hidden' : 'bottom-[32vh] md:bottom-6'
      }`}>
        <button
          onClick={handleFindMyLocation}
          disabled={isLocating}
          className="bg-white/95 backdrop-blur-md hover:bg-slate-50 text-gray-800 p-2.5 md:px-4 md:py-2.5 rounded-xl border border-gray-300 shadow-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          title="내 주변 축제 찾기"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Locate className="w-4 h-4 text-blue-600" />
          )}
          <span className="hidden sm:inline">{isLocating ? '위치 찾는 중...' : '내 위치'}</span>
        </button>

        {locationError && (
          <div className="absolute bottom-12 right-0 bg-red-600 text-white text-[11px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in">
            {locationError}
          </div>
        )}
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
          {/* 패널 메인 바디 (너비 w-[390px], 상/하/좌 완전 밀착, overflow-y-auto, stable-scrollbar) */}
          <div className="w-[390px] bg-white border-r border-gray-200 shadow-xl flex flex-col h-full overflow-y-auto stable-scrollbar scrollbar-thin scrollbar-thumb-gray-200 select-none">
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

            {/* 패널 내부 스크롤 콘텐츠 (롤링 배너 + 구분선 + 기간 칩 + 체크박스 + 결과 목록) */}
            <div className="p-3.5 space-y-3">
              {/* 1단 롤링 추천 배너 (도트 하단 분리, 스와이프 제스처 및 클릭 넘김 지원) */}
              <div className="space-y-1.5">
                <div
                  className="relative group touch-pan-y"
                  onTouchStart={(e) => {
                    touchStartXRef.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    if (touchStartXRef.current === null) return;
                    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
                    if (diff > 40) handleNextBanner();
                    else if (diff < -40) handlePrevBanner();
                    touchStartXRef.current = null;
                  }}
                  onMouseDown={(e) => {
                    touchStartXRef.current = e.clientX;
                  }}
                  onMouseUp={(e) => {
                    if (touchStartXRef.current === null) return;
                    const diff = touchStartXRef.current - e.clientX;
                    if (diff > 40) handleNextBanner();
                    else if (diff < -40) handlePrevBanner();
                    touchStartXRef.current = null;
                  }}
                >
                  {THEME_BANNERS.map((item, idx) => {
                    const isCurrent = activeBannerIdx === idx;
                    const isSelected = selectedTheme === item.key;
                    if (!isCurrent) return null;

                    return (
                      <div
                        key={item.key}
                        onClick={() => handleThemeBannerClick(item.key, item.title)}
                        className={`w-full p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-300 shadow-sm active:scale-[0.99] select-none ${
                          item.bg
                        } ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl flex-shrink-0 drop-shadow-xs">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-white tracking-tight truncate">
                                {item.title}
                              </span>
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${item.badgeBg}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-white/90 truncate leading-tight font-medium mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 배너 하단 분리 배치된 인디케이터 도트 (직접 클릭 및 전환 가능) */}
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  {THEME_BANNERS.map((item, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveBannerIdx(dotIdx)}
                      className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                        activeBannerIdx === dotIdx
                          ? 'w-4 bg-[#0A2540]'
                          : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                      title={`${item.title} 보기`}
                    />
                  ))}
                </div>
              </div>

              {/* 구분선 (배너와 기간 선택 사이 시각적 분리 강화) */}
              <div className="border-t border-gray-200/80 my-1" />

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

                <label
                  className="flex items-center gap-1 cursor-pointer select-none font-medium text-gray-700 hover:text-black"
                  title="종료일 기준 최근 1년 이내 종료된 축제만 노출"
                >
                  <input
                    type="checkbox"
                    checked={showEnded}
                    onChange={(e) => setShowEnded(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-gray-500 border-gray-300 focus:ring-0 accent-gray-500"
                  />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    종료 (1년 이내)
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
                          {(fest.firstimage || (fest as any).first_image) ? (
                            <img
                              src={fest.firstimage || (fest as any).first_image}
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
      {/* ========================================================= */}
      {/* 3. 모바일 전용: 하단 서랍형(바텀시트) - 지도는 70% 차지, 바텀시트는 30% 기본 차지 */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 3. 모바일 전용: 하단 서랍형(바텀시트) - 지도는 70% 차지, 바텀시트는 30% 기본 차지 */}
      {/* ========================================================= */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-[60] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-gray-200 transition-all duration-300 flex flex-col ${
          mobileSheetMode === 'expanded' ? 'h-[96dvh] top-[4dvh]' : 'h-[30vh]'
        }`}
      >
        {/* 상단 서랍 손잡이 핸들바 (꼭지 버튼 영역 잡고 쓸어올리기/내리기 지원) */}
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onClick={() => setMobileSheetMode(mobileSheetMode === 'collapsed' ? 'expanded' : 'collapsed')}
          className="pt-3 pb-2.5 px-4 flex flex-col items-center justify-center cursor-pointer select-none bg-white border-b border-gray-100 flex-shrink-0 touch-none rounded-t-3xl"
        >
          {/* 눈에 잘 띄는 중앙 드래그 핸들 */}
          <div className="w-12 h-1.5 bg-gray-300 hover:bg-gray-400 rounded-full mb-1.5 transition" />
          <div className="w-full flex items-center justify-between text-xs font-bold text-gray-800">
            <span className="flex items-center gap-1.5">
              <span>축제 검색 & 탐색</span>
              <span className="bg-blue-50 text-[#0A2540] text-[10px] px-1.5 py-0.2 rounded font-extrabold border border-blue-200">
                {visibleFestivals.length}
              </span>
            </span>
            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-0.5">
              {mobileSheetMode === 'collapsed' ? '펼치기 ↑' : '지도로 내려보기 ↓'}
            </span>
          </div>
        </div>

        {/* 1) 검색창 (바텀시트 상단 고정 - 크기 확대 및 쾌적한 터치 영역) */}
        <div className="p-3 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="relative flex items-center shadow-xs rounded-xl overflow-hidden bg-slate-50 border border-slate-300 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-blue-100 transition">
            <Search className="w-4 h-4 text-[#0A2540] ml-3.5 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setMobileSheetMode('expanded')}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="축제명 또는 주소를 입력하세요."
              className="w-full pl-3 pr-10 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* 바텀시트 본문 스크롤 영역 (콘텐츠 내부 제스처 분리: 스크롤 끝 도달 시에만 시트 동작) */}
        <div
          ref={sheetContentRef}
          onTouchStart={onContentTouchStart}
          onTouchMove={onContentTouchMove}
          onTouchEnd={onContentTouchEnd}
          className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {/* 모바일 1단 추천 배너 (컴팩트 스와이프) */}
          <div className="space-y-1">
            <div
              className="relative touch-pan-y"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null) return;
                const diff = touchStartXRef.current - e.changedTouches[0].clientX;
                if (diff > 35) handleNextBanner();
                else if (diff < -35) handlePrevBanner();
                touchStartXRef.current = null;
              }}
            >
              {THEME_BANNERS.map((item, idx) => {
                if (activeBannerIdx !== idx) return null;
                const isSelected = selectedTheme === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => handleThemeBannerClick(item.key, item.title)}
                    className={`w-full py-2 px-3 rounded-xl cursor-pointer flex items-center justify-between text-left select-none transition ${
                      item.bg
                    } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs tracking-tight truncate">{item.title}</span>
                          <span className={`text-[8.5px] font-bold px-1 rounded ${item.badgeBg}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/90 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 도트 인디케이터 */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              {THEME_BANNERS.map((item, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setActiveBannerIdx(dotIdx)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    activeBannerIdx === dotIdx
                      ? 'w-4 bg-[#0A2540]'
                      : 'w-1.5 bg-gray-300'
                  }`}
                  title={`${item.title} 보기`}
                />
              ))}
            </div>
          </div>

          {/* 기간 필터 칩 */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
            {periodTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedPeriod(tab.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedPeriod === tab.key
                    ? 'bg-blue-50 text-[#0A2540] border border-blue-200 font-bold'
                    : 'bg-slate-100 text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 상태 필터 체크박스 */}
          <div className="flex items-center gap-3 text-[11px] pt-1 pb-1 border-b border-gray-100 text-gray-700">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showOngoing}
                onChange={(e) => setShowOngoing(e.target.checked)}
                className="rounded text-emerald-600 w-3.5 h-3.5"
              />
              진행 중
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showUpcoming}
                onChange={(e) => setShowUpcoming(e.target.checked)}
                className="rounded text-[#e83428] w-3.5 h-3.5"
              />
              진행 예정
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showEnded}
                onChange={(e) => setShowEnded(e.target.checked)}
                className="rounded text-gray-500 w-3.5 h-3.5"
              />
              종료 (1년)
            </label>
          </div>

          {/* 축제 목록 피드 */}
          <div className="space-y-2 pt-1">
            {visibleFestivals.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                <MapPin className="w-6 h-6 mx-auto mb-1 text-gray-300 stroke-[1.5]" />
                <p className="font-semibold text-gray-600">검색 조건에 맞는 축제가 없습니다.</p>
                <p className="text-[11px] text-gray-400 mt-1">지도를 다른 지역으로 이동해보세요.</p>
              </div>
            ) : (
              visibleFestivals.map((fest) => {
                let badgeText = '진행 예정';
                let badgeColor = 'bg-[#e83428] text-white';

                if (fest.start_date <= TODAY_STR && fest.end_date >= TODAY_STR) {
                  badgeText = '진행 중';
                  badgeColor = 'bg-emerald-600 text-white';
                } else if (fest.start_date > TODAY_STR) {
                  badgeText = '예정';
                  badgeColor = 'bg-[#e83428] text-white';
                } else if (fest.end_date < TODAY_STR) {
                  badgeText = '종료';
                  badgeColor = 'bg-slate-500 text-white';
                }

                return (
                  <div
                    key={fest.id}
                    onClick={() => {
                      setMobileDetailMode('half');
                      onSelectFestival(fest);
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 bg-white flex gap-2.5 items-center cursor-pointer active:bg-slate-50 shadow-2xs"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                      {(fest.firstimage || (fest as any).first_image) ? (
                        <img
                          src={fest.firstimage || (fest as any).first_image}
                          alt={fest.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px]">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <h4 className="font-bold text-xs text-gray-900 truncate">
                          {fest.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {fest.addr1 || '상세 주소 없음'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {fest.start_date} ~ {fest.end_date}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 모바일 전용: 선택 축제 상세 풀사이즈 바텀시트 모달 (쓸어내리거나 X 클릭 시 닫혀 검색시트 복귀, z-[70]으로 최상위 보장) */}
      {selectedFestival && (
        <div className="md:hidden fixed inset-0 z-[70] bg-black/60 flex flex-col justify-end">
          <FestivalDetailPanel
            festival={selectedFestival}
            onClose={() => onSelectFestival(null)}
          />
        </div>
      )}
    </div>
  );
}
