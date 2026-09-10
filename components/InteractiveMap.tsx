'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Festival, SERVICE_TODAY } from '@/lib/data';
import { Locate, Loader2, ChevronLeft, ChevronRight, MapPin, Search, X, Check } from 'lucide-react';
import FestivalDetailPanel from './FestivalDetailPanel';

declare global {
  interface Window {
    kakao: any;
  }
}

interface InteractiveMapProps {
  festivals: Festival[];
  loading?: boolean;
  dataQuery?: string;
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
  setSelectedTheme: (theme: string | null) => void;
  onResetFilters: () => void;
  // 진행 상태 필터 체크박스 상태
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
  loading = false,
  dataQuery = '',
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

  // 검색창 입력 로컬 상태 (엔터 또는 돋보기 클릭 시에만 실제 searchQuery로 전달)
  const [localSearchInput, setLocalSearchInput] = useState(searchQuery);

  // 외부(배너 클릭, 초기화 등)에서 searchQuery가 변경되면 입력창 텍스트 동기화
  useEffect(() => {
    setLocalSearchInput(searchQuery);
  }, [searchQuery]);

  // 엔터 키 또는 돋보기 아이콘 클릭 시 검색 실행 핸들러 (A안: 즉시 이전 선택/오버레이/마커 초기화)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // 1. 진행 중이던 날아가는 애니메이션 취소
    if (flyAnimationRef.current) {
      cancelAnimationFrame(flyAnimationRef.current);
      flyAnimationRef.current = null;
    }
    // 2. 오버레이 즉시 닫기
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    // 3. 기존 마커들 즉시 화면에서 제거하여 잔상 방지
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    // 4. 선택 상태 해제, 배지(테마) 및 기간 초기화(전체 축제 대상 신규 검색 보장, 진행상태는 보존)
    onSelectFestival(null);
    setSelectedTheme(null);
    setSelectedPeriod('ALL');
    setSearchQuery(localSearchInput);
  };

  // 우측 플로팅 패널 접기/펼치기 상태 (기본값: 펼침)
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const initialCenterRef = useRef<{ lat: number; lng: number; level: number } | null>(null);
  // 커스텀 스무스 글라이딩 애니메이션 프레임 레퍼런스
  const flyAnimationRef = useRef<number | null>(null);

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  // 롤링 배너 데이터 목록
  const THEME_BANNERS = [
    {
      key: 'HOT',
      title: '한경 트래블 PICK',
      desc: '에디터가 엄선한 실패 없는 전국 대표 축제',
      badge: 'TRAVEL PICK',
      icon: '✨',
      bg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-900',
      badgeBg: 'bg-black/10 text-slate-900 font-black border border-black/10',
      titleColor: 'text-slate-950',
      descColor: 'text-slate-800'
    },
    {
      key: 'MUSIC',
      title: '뮤직 & 페스티벌',
      desc: '음악·공연·버스킹·락 축제 엄선 큐레이션',
      badge: 'LIVE STAGE',
      icon: '🎵',
      bg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white',
      badgeBg: 'bg-black/25 text-blue-200 border border-white/20',
      titleColor: 'text-white',
      descColor: 'text-white/90'
    },
    {
      key: 'NIGHT',
      title: '야간 & 빛 축제',
      desc: '낭만 가득 불꽃·달빛·드론 야경 스팟',
      badge: 'NIGHT VIEW',
      icon: '🌙',
      bg: 'bg-gradient-to-r from-purple-800 via-indigo-900 to-[#0A2540] text-white',
      badgeBg: 'bg-black/25 text-purple-200 border border-white/20',
      titleColor: 'text-white',
      descColor: 'text-white/90'
    }
  ];

  const handlePrevBanner = () => {
    setActiveBannerIdx((prev) => (prev - 1 + THEME_BANNERS.length) % THEME_BANNERS.length);
  };

  const handleNextBanner = () => {
    setActiveBannerIdx((prev) => (prev + 1) % THEME_BANNERS.length);
  };

  // 추천 축제 큐레이션 클릭 시 검색어 입력란에 배너명을 채우고 결과 목록 갱신 (토글 해제 없이 항상 검색결과 적용)
  const handleThemeBannerClick = (themeKey: string, bannerTitle?: string) => {
    setSelectedTheme(themeKey);

    // 검색어 입력란에 해당 배너명을 주입하여 사용자가 검색결과를 직관적으로 파악하도록 연동
    if (bannerTitle) {
      setSearchQuery(bannerTitle);
      if (themeKey === 'HOT') {
        // 한경 트래블 PICK: 진행중, 예정에 모두 체크 활성화, 종료는 비활성화
        setShowOngoing(true);
        setShowUpcoming(true);
        setShowEnded(false);
      }
    }

    // 상세 패널이 열려있다면 닫기
    onSelectFestival(null);
  };

  // 지도 최초 전국(한반도) 뷰 및 초기 영역으로 부드럽게 글라이딩 리셋하는 공통 함수
  const resetMapToInitial = () => {
    if (kakaoMapInstance.current && window.kakao) {
      const map = kakaoMapInstance.current;
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      const defaultCenter = {
        lat: isDesktop ? 36.3504 : 35.75,
        lng: isDesktop ? 127.35 : 127.8845,
        level: isDesktop ? 12 : 13
      };
      const initialCenter = initialCenterRef.current || defaultCenter;
      const initialLatLon = new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng);

      map.panTo(initialLatLon);

      if (map.getLevel() !== initialCenter.level) {
        setTimeout(() => {
          if (kakaoMapInstance.current) {
            kakaoMapInstance.current.setLevel(initialCenter.level, { animate: true });
          }
        }, 150);
      }
    }
  };

  // 검색 및 필터 조건에 부합하는 축제 목록 (검색 패널과 지도 마커 데이터 100% 항상 일치)
  const visibleFestivals = festivals;

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
        // 대한민국 중심 좌표 (PC 좌측 390px 고정 패널 및 모바일 하단 88px 바텀시트를 감안하여 뷰포트 최적화)
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
        // PC: 좌측 390px 패널 너비를 감안하여 중심 경도를 서쪽으로 살짝 이동
        // 모바일: 하단 바텀시트에 남부/제주가 가려지지 않도록 중심 위도를 남쪽(35.75)으로 내리고 줌 레벨을 13으로 최적화
        const centerLat = isDesktop ? 36.3504 : 35.75;
        const centerLng = isDesktop ? 127.35 : 127.8845;
        const initialLevel = isDesktop ? 12 : 13;

        const options = {
          center: new window.kakao.maps.LatLng(centerLat, centerLng),
          level: initialLevel,
        };

        const map = new window.kakao.maps.Map(container, options);
        kakaoMapInstance.current = map;

        // 마우스 휠 스크롤 시 즉시 줌 확대/축소 활성화
        map.setZoomable(true);

        // 줌 컨트롤러 추가 (우측 버튼 줌은 언제든 가능)
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        initialCenterRef.current = { lat: centerLat, lng: centerLng, level: initialLevel };
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

  const lastFittedQueryRef = useRef<string>('');
  const lastProcessedQueryRef = useRef<string>('');

  // 검색어 변경 시 검색 결과 마커들을 모두 포함하는 최적의 영역(레벨 8 및 1번째 결과)으로 카메라 자동 이동
  useEffect(() => {
    if (!isLoaded || !kakaoMapInstance.current || !window.kakao) return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      if (lastFittedQueryRef.current !== '') {
        lastFittedQueryRef.current = '';
        lastProcessedQueryRef.current = '';
        // 검색어가 비워진 경우(X 클릭 등) 초기 전국 뷰로 복귀
        resetMapToInitial();
      }
      return;
    }

    // 새 검색어가 입력되면 이전 포커싱 잠금 해제
    if (lastProcessedQueryRef.current !== trimmed) {
      lastProcessedQueryRef.current = trimmed;
      lastFittedQueryRef.current = '';
    }

    // [핵심 해결책] 1-Step 지연 완벽 차단:
    // 1. 현재 네트워크 조회가 진행 중(loading)일 때는 이동 금지
    // 2. 현재 화면의 축제 데이터(visibleFestivals)가 '방금 요청한 검색어(trimmed)'의 결과가 아니라면 이동 금지 (dataQuery !== trimmed)
    if (loading) return;
    if (dataQuery !== trimmed) return;

    // 배너 타이틀 목록 정의 (배너 선택 시에는 첫 축제 줌인을 생략하고 남한 전체 뷰 유지)
    const bannerTitles = THEME_BANNERS.map(b => b.title.trim());
    const isThemeBannerQuery = bannerTitles.includes(trimmed);

    if (isThemeBannerQuery) {
      if (lastFittedQueryRef.current !== trimmed) {
        lastFittedQueryRef.current = trimmed;
        // 배너를 선택했을 때는 첫 화면처럼 지도가 항상 남한 전체를 보여주도록 초기 뷰로 리셋
        resetMapToInitial();
      }
      return;
    }

    // 유효한 좌표를 가진 검색 결과 축제 목록
    const validCoords = visibleFestivals.filter(f => f.mapy && f.mapx);
    if (validCoords.length === 0) return;

    // 현재 검색어에 대해 이미 카메라 포커싱을 적용했으면 중복 실행 방지
    if (lastFittedQueryRef.current === trimmed) return;
    lastFittedQueryRef.current = trimmed;

    const map = kakaoMapInstance.current;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    // 이전 비행 애니메이션이 실행 중이었다면 즉시 중단
    if (flyAnimationRef.current) {
      cancelAnimationFrame(flyAnimationRef.current);
      flyAnimationRef.current = null;
    }

    // 일반 검색어일 때만 검색 결과 중 첫 번째 항목을 중심으로 레벨 8 줌 포커싱
    const firstFest = validCoords[0];
    const targetLat = Number(firstFest.mapy);
    const targetLng = Number(firstFest.mapx);
    const targetLatLon = new window.kakao.maps.LatLng(targetLat, targetLng);

    // 요청 정책: 지도 레벨 8 고정
    map.setLevel(8, { animate: true });

    // PC 환경에서 좌측 패널(390px)을 고려하여 우측 가시 영역 중앙으로 오프셋 보정 (200px)
    if (isDesktop && map.getProjection) {
      try {
        const proj = map.getProjection();
        const point = proj.pointFromCoords(targetLatLon);
        const offsetPoint = new window.kakao.maps.Point(point.x - 200, point.y);
        const offsetCoords = proj.coordsFromPoint(offsetPoint);
        map.panTo(offsetCoords);
        return;
      } catch (e) {}
    }

    map.panTo(targetLatLon);
  }, [searchQuery, dataQuery, visibleFestivals, loading, isLoaded, selectedFestival]);

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
        mobileSheetMode === 'expanded' ? 'bottom-[calc(100vh-60px)] hidden' : 'bottom-24 md:bottom-6'
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
      {/* 2. PC 전용: 지도 좌측 풀하이트 검색 패널 + 우측 이격 플로팅 상세 패널 (상시 고정) */}
      {/* ========================================================= */}
      <div className="hidden md:flex absolute top-0 left-0 bottom-0 z-30 items-start pointer-events-none">
        {/* 좌측 메인 검색 패널 컨테이너 (상/하/좌 여백 0px 밀착, 상시 고정) */}
        <div className="flex items-stretch h-full pointer-events-auto">
          {/* 패널 메인 바디 (너비 w-[390px], 상/하/좌 완전 밀착, overflow-y-auto, stable-scrollbar) */}
          <div className="w-[390px] bg-white border-r border-gray-200 shadow-xl flex flex-col h-full overflow-y-auto stable-scrollbar scrollbar-thin scrollbar-thumb-gray-200 select-none">
            {/* 1. 검색창 (초기화 버튼 삭제, 엔터 또는 돋보기 클릭 시 검색 실행, x 누르면 즉시 초기화) */}
            <div className="sticky top-0 z-20 bg-white p-3.5 border-b border-gray-100 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <button
                  type="submit"
                  title="검색 실행"
                  className="absolute left-2.5 p-1 text-[#0A2540] hover:text-blue-700 hover:scale-110 transition z-10"
                >
                  <Search className="w-4 h-4 font-bold" />
                </button>
                <input
                  type="text"
                  value={localSearchInput}
                  onChange={(e) => setLocalSearchInput(e.target.value)}
                  placeholder="축제명 또는 주소를 입력하세요 (Enter)"
                  className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-slate-300 focus:border-[#0A2540] rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none shadow-xs transition"
                />
                {(localSearchInput || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearchInput('');
                      onResetFilters();
                      resetMapToInitial();
                    }}
                    className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1"
                    title="검색어 지우기 및 필터 초기화"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>

            {/* 패널 내부 스크롤 콘텐츠 */}
            <div className="p-3.5 space-y-3.5">
              {/* 2. 배너 (1단 롤링 추천 배너 + 인디케이터 도트) */}
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
                              <span className={`font-extrabold text-xs tracking-tight truncate ${item.titleColor}`}>
                                {item.title}
                              </span>
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${item.badgeBg}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className={`text-[10.5px] truncate leading-tight font-medium mt-0.5 ${item.descColor}`}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 배너 하단 분리 배치된 인디케이터 도트 */}
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

              {/* 3. 텍스트로 검색결과 안내 문구 */}
              <div className="pt-0.5 text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>
                  총 <span className="text-blue-600 font-extrabold">{visibleFestivals.length}</span>개의 축제가 있습니다.
                </span>
              </div>

              {/* 5. 진행중, 예정, 종료 -> 체크박스 형태 (중복 선택 가능) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOngoing(!showOngoing)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                    showOngoing
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      showOngoing
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {showOngoing && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>진행중</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                    showUpcoming
                      ? 'bg-rose-50 text-[#e83428] border-rose-300 shadow-xs'
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      showUpcoming
                        ? 'bg-[#e83428] border-[#e83428] text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {showUpcoming && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>예정</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEnded(!showEnded)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                    showEnded
                      ? 'bg-slate-100 text-gray-800 border-slate-300 shadow-xs'
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      showEnded
                        ? 'bg-gray-700 border-gray-700 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {showEnded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>종료</span>
                </button>
              </div>

              {/* 검색 결과 목록 */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {visibleFestivals.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                    <p className="font-semibold text-gray-600">검색 조건에 맞는 축제가 없습니다.</p>
                    <p className="text-[11px] text-gray-400 mt-1">다른 검색어를 입력하거나 필터를 변경해보세요.</p>
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
                        onClick={() => onSelectFestival(fest)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex gap-2.5 items-center ${
                          selectedFestival?.id === fest.id
                            ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-slate-50/70'
                        }`}
                      >
                        {/* 썸네일 이미지 */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                          {(fest.firstimage || (fest as any).first_image) ? (
                            <img
                              src={fest.firstimage || (fest as any).first_image}
                              alt={fest.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                              사진 없음
                            </div>
                          )}
                        </div>

                        {/* 텍스트 메타 정보 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-16 py-0.5">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
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
                          <div className="text-[10px] text-gray-400">
                            <span className="truncate">{fest.start_date} ~ {fest.end_date}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2단 상세 패널 (검색 패널 우측에서 16px 떨어져 살짝 둥근 카드로 플로팅, 상시 고정 패널 우측에 배치) */}
        {selectedFestival && (
          <div className="h-full py-4 pl-4 flex items-center pointer-events-auto">
            <FestivalDetailPanel
              key={selectedFestival.id}
              festival={selectedFestival}
              onClose={() => onSelectFestival(null)}
            />
          </div>
        )}
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
      {/* ========================================================= */}
      {/* 3. 모바일 전용: 하단 서랍형(바텀시트) - 지도는 70% 차지, 바텀시트는 30% 기본 차지 */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 3. 모바일 전용: 하단 서랍형(바텀시트) - 지도는 70% 차지, 바텀시트는 30% 기본 차지 */}
      {/* ========================================================= */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-[60] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-gray-200 transition-all duration-300 flex flex-col ${
          mobileSheetMode === 'expanded' ? 'h-[96dvh] top-[4dvh]' : 'h-[88px] overflow-hidden'
        }`}
      >
        {/* 상단 서랍 손잡이 핸들바 (A안: 텍스트 삭제, 슬림한 중앙 드래그 바만 유지) */}
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onClick={() => setMobileSheetMode(mobileSheetMode === 'collapsed' ? 'expanded' : 'collapsed')}
          className="pt-2.5 pb-2 px-4 flex flex-col items-center justify-center cursor-pointer select-none bg-white flex-shrink-0 touch-none rounded-t-3xl"
        >
          {/* 눈에 잘 띄는 중앙 드래그 핸들 */}
          <div className="w-10 h-1 bg-gray-300 hover:bg-gray-400 rounded-full transition" />
        </div>

        {/* 1. 검색창 (초기화 버튼 삭제, 엔터 또는 돋보기 클릭 시 검색 실행, x 누르면 즉시 초기화) */}
        <div className="p-3 border-b border-gray-100 bg-white flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-xs rounded-xl overflow-hidden bg-slate-50 border border-slate-300 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-blue-100 transition">
            <button
              type="submit"
              title="검색 실행"
              className="p-3 text-[#0A2540] hover:text-blue-700 transition flex-shrink-0"
            >
              <Search className="w-4 h-4 font-bold" />
            </button>
            <input
              type="text"
              value={localSearchInput}
              onFocus={() => setMobileSheetMode('expanded')}
              onChange={(e) => setLocalSearchInput(e.target.value)}
              placeholder="축제명 또는 주소를 입력하세요 (Enter)"
              className="w-full pr-10 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            {(localSearchInput || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearchInput('');
                  onResetFilters();
                  resetMapToInitial();
                }}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1.5"
                title="검색어 지우기 및 필터 초기화"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* 바텀시트 본문 스크롤 영역 (콘텐츠 내부 제스처 분리: 스크롤 끝 도달 시에만 시트 동작) */}
        <div
          ref={sheetContentRef}
          onTouchStart={onContentTouchStart}
          onTouchMove={onContentTouchMove}
          onTouchEnd={onContentTouchEnd}
          className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {/* 2. 배너 (모바일 1단 추천 배너 + 인디케이터 도트) */}
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
                          <span className={`font-extrabold text-xs tracking-tight truncate ${item.titleColor}`}>{item.title}</span>
                          <span className={`text-[8.5px] font-bold px-1 rounded ${item.badgeBg}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${item.descColor}`}>{item.desc}</p>
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

          {/* 3. 텍스트로 검색결과 안내 -> 총 ㅇㅇ개의 축제가 있습니다. */}
          <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-xs text-gray-700">
            <span className="font-medium">
              총 <span className="font-extrabold text-[#0A2540] text-sm">{visibleFestivals.length}</span>개의 축제가 있습니다.
            </span>
          </div>

          {/* 5. 진행중, 예정, 종료 -> 체크박스 형태 (중복 선택 가능) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowOngoing(!showOngoing)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                showOngoing
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  showOngoing
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
              >
                {showOngoing && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>진행중</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUpcoming(!showUpcoming)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                showUpcoming
                  ? 'bg-rose-50 text-[#e83428] border-rose-300 shadow-xs'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  showUpcoming
                    ? 'bg-[#e83428] border-[#e83428] text-white'
                    : 'bg-white border-gray-300'
                }`}
              >
                {showUpcoming && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>예정</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEnded(!showEnded)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
                showEnded
                  ? 'bg-slate-100 text-gray-800 border-slate-300 shadow-xs'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  showEnded
                    ? 'bg-gray-700 border-gray-700 text-white'
                    : 'bg-white border-gray-300'
                }`}
              >
                {showEnded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>종료</span>
            </button>
          </div>

          {/* 축제 목록 피드 */}
          <div className="space-y-2 pt-1">
            {visibleFestivals.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                <MapPin className="w-6 h-6 mx-auto mb-1 text-gray-300 stroke-[1.5]" />
                <p className="font-semibold text-gray-600">검색 조건에 맞는 축제가 없습니다.</p>
                <p className="text-[11px] text-gray-400 mt-1">다른 검색어를 입력하거나 필터를 변경해보세요.</p>
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
            key={selectedFestival.id}
            festival={selectedFestival}
            onClose={() => onSelectFestival(null)}
          />
        </div>
      )}
    </div>
  );
}
