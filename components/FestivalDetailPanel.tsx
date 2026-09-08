'use client';

import { useState, useEffect, useRef } from 'react';
import { Festival } from '@/lib/data';
import { SERVICE_TODAY } from '@/lib/data';
import FestivalGallery, { GalleryImage } from '@/components/FestivalGallery';
import {
  X, Calendar, MapPin, Clock, DollarSign, Phone, Globe,
  Users, Sparkles, Building2, Ticket, FileText, Loader2, Share2, Maximize2
} from 'lucide-react';

interface FestivalDetailPanelProps {
  festival: Festival;
  onClose: () => void;
  mobileMode?: 'half' | 'full';
  onToggleMobileMode?: () => void;
}

export default function FestivalDetailPanel({
  festival,
  onClose,
  mobileMode = 'half',
  onToggleMobileMode,
}: FestivalDetailPanelProps) {
  const [detailData, setDetailData] = useState<any>(festival);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/festivals/${festival.id}`);
        const json = await res.json();
        if (json.success && isCurrent) {
          setDetailData(json.data);
          setGalleryImages(json.data.galleryImages || []);
        }
      } catch (e) {
        console.error('Failed to load detail:', e);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isCurrent = false;
    };
  }, [festival.id]);

  // 진행 상태 뱃지 계산
  const todayStr = SERVICE_TODAY;
  let badgeText = '진행 예정';
  let badgeColor = 'bg-[#e83428] text-white';

  if (festival.start_date <= todayStr && festival.end_date >= todayStr) {
    badgeText = '진행 중';
    badgeColor = 'bg-emerald-600 text-white';
  } else if (festival.start_date > todayStr) {
    const d = Math.ceil((new Date(festival.start_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
    badgeText = d === 0 ? 'D-Day' : `D-${d}`;
    badgeColor = 'bg-[#e83428] text-white';
  } else if (festival.end_date < todayStr) {
    badgeText = '종료';
    badgeColor = 'bg-slate-500 text-white';
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/?festivalId=${festival.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // 모바일 상세 시트 스와이프 추적 Ref
  const detailTouchStartYRef = useRef<number | null>(null);

  const handleDetailTouchStart = (e: React.TouchEvent) => {
    detailTouchStartYRef.current = e.touches[0].clientY;
  };

  const handleDetailTouchEnd = (e: React.TouchEvent) => {
    if (detailTouchStartYRef.current === null || !onToggleMobileMode) return;
    const diffY = detailTouchStartYRef.current - e.changedTouches[0].clientY;
    // 위로 35px 이상 쓸어올렸을 때 -> 풀스크린(full) 확장
    if (diffY > 35 && mobileMode === 'half') {
      onToggleMobileMode();
    }
    // 아래로 35px 이상 내렸을 때 -> 하프(half) 축소 또는 닫기
    else if (diffY < -35 && mobileMode === 'full') {
      onToggleMobileMode();
    }
    detailTouchStartYRef.current = null;
  };

  return (
    <div
      onTouchStart={handleDetailTouchStart}
      onTouchEnd={handleDetailTouchEnd}
      className={`w-full md:w-[410px] md:max-w-[calc(100vw-450px)] bg-white rounded-t-3xl md:rounded-2xl border border-gray-200/90 shadow-2xl flex flex-col overflow-hidden animate-fade-in relative z-30 transition-all duration-300 ${
        mobileMode === 'full' ? 'h-[92vh] md:h-full' : 'h-[60vh] md:h-full'
      }`}
    >
      {/* 모바일 전용 상단 손잡이 바 (터치 시 60% <-> 92% 풀스크린 토글) */}
      <div
        onClick={onToggleMobileMode}
        className="md:hidden pt-3 pb-2 flex flex-col items-center justify-center cursor-pointer select-none bg-white touch-none"
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* 1. 상단 바: 타이틀 및 닫기 버튼 */}
      <div className="p-3.5 border-b border-gray-100 bg-white flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>
            {badgeText}
          </span>
          <h3 className="font-bold text-xs text-gray-900 truncate">
            {festival.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleShare}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition relative"
            title="공유 링크 복사"
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-7 right-0 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                복사됨!
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition"
            title="상세 모듈 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 패널 본문 (전체 세로 스크롤) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 text-xs">
        {/* 대표 이미지 포스터 (클릭 시 패널/화면 전체 확대 보기 지원) */}
        <div
          onClick={() => festival.firstimage && setShowPosterModal(true)}
          className={`w-full max-h-64 min-h-48 rounded-xl overflow-hidden bg-slate-900/95 relative border border-gray-100 shadow-xs flex items-center justify-center group ${
            festival.firstimage ? 'cursor-pointer' : ''
          }`}
          title={festival.firstimage ? '클릭하여 원본 포스터 크게 보기' : ''}
        >
          {festival.firstimage ? (
            <>
              <img
                src={festival.firstimage}
                alt={festival.title}
                className="w-full h-auto max-h-64 object-contain group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="p-2 bg-black/60 rounded-full text-white backdrop-blur-xs flex items-center gap-1.5 text-xs font-semibold shadow-md">
                  <Maximize2 className="w-4 h-4" /> 크게 보기
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-44 flex items-center justify-center text-gray-400 text-xs bg-slate-100">
              대표 이미지가 준비 중입니다.
            </div>
          )}
          {festival.festivalgrade && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2540] text-white shadow-xs z-10">
              {festival.festivalgrade}
            </span>
          )}
        </div>

        {/* 축제 타이틀 및 주소 */}
        <div>
          <h4 className="font-extrabold text-sm text-gray-900 leading-snug">
            {festival.title}
          </h4>
          <p className="text-gray-500 mt-1 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>{festival.addr1} {festival.addr2}</span>
          </p>
          {festival.eventplace && (
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5 pl-4">
              장소: {festival.eventplace}
            </p>
          )}
        </div>

        {/* 핵심 메타 정보 리스트 */}
        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-gray-100">
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-gray-400 block">행사 기간</span>
              <span className="font-semibold text-gray-800">
                {festival.start_date} ~ {festival.end_date}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-gray-400 block">운영 시간</span>
              <span className="font-semibold text-gray-800">
                {detailData.playtime || '정보 없음'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <DollarSign className="w-3.5 h-3.5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-gray-400 block">이용 요금</span>
              <span className="font-semibold text-gray-800">
                {detailData.usetime || '무료'}
              </span>
            </div>
          </div>

          {detailData.tel && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-[#0A2540] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block">문의처</span>
                <a href={`tel:${detailData.tel}`} className="font-semibold text-blue-600 hover:underline">
                  {detailData.tel}
                </a>
              </div>
            </div>
          )}

          {detailData.agelimit && (
            <div className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-[#0A2540] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block">관람 연령</span>
                <span className="font-semibold text-gray-800">{detailData.agelimit}</span>
              </div>
            </div>
          )}
        </div>

        {/* 축제 소개 본문 */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
            <FileText className="w-3.5 h-3.5 text-[#0A2540]" />
            <span>축제 소개</span>
          </div>
          <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-gray-100 text-[11px]">
            {loading ? (
              <div className="flex items-center gap-2 py-3 text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>상세 정보 로딩 중...</span>
              </div>
            ) : (
              detailData.overview?.trim() || '상세 축제 소개 정보가 준비 중입니다.'
            )}
          </div>
          {(detailData.sponsor1 || detailData.sponsor2) && (
            <p className="text-[10px] text-gray-400 pt-0.5">
              주최/주관: {detailData.sponsor1} {detailData.sponsor2 ? `· ${detailData.sponsor2}` : ''}
            </p>
          )}
        </div>

        {/* 주요 행사 프로그램 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>주요 행사 프로그램</span>
          </div>
          <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-blue-50/40 p-3 rounded-xl border border-blue-100/70 text-[11px]">
            {detailData.program?.trim() ? detailData.program : '등록된 프로그램 정보가 없습니다.'}
          </div>
        </div>

        {/* 부대행사 */}
        {detailData.subevent?.trim() && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
              <Ticket className="w-3.5 h-3.5 text-[#0A2540]" />
              <span>부대행사 및 특별 프로그램</span>
            </div>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-gray-100 text-[11px]">
              {detailData.subevent}
            </div>
          </div>
        )}

        {/* 현장 갤러리 */}
        {galleryImages.length > 0 && (
          <div className="pt-1">
            <FestivalGallery images={galleryImages} festivalTitle={festival.title} />
          </div>
        )}

        {/* 공식 홈페이지 아웃링크 */}
        {detailData.homepage && (
          <div className="pt-2 pb-1">
            <a
              href={detailData.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#0A2540] hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>공식 홈페이지 바로가기</span>
            </a>
          </div>
        )}
      </div>

      {/* 썸네일 포스터 원본 확대 라이트박스 팝업 (패널 및 화면에 꽉 차게 보기) */}
      {showPosterModal && festival.firstimage && (
        <div
          onClick={() => setShowPosterModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn cursor-pointer"
        >
          {/* 상단 닫기 버튼 */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
            <span className="text-white/80 text-xs font-semibold bg-white/10 px-3 py-1 rounded-full">
              {festival.title}
            </span>
            <button
              onClick={() => setShowPosterModal(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 중앙 확대 이미지 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[88vh] flex flex-col items-center justify-center relative cursor-default"
          >
            <img
              src={festival.firstimage}
              alt={festival.title}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="mt-3 text-white/90 text-xs md:text-sm text-center px-4 max-w-xl font-medium">
              {festival.title} 대표 포스터
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
