'use client';

import { useState, useEffect } from 'react';
import { Festival } from '@/lib/data';
import { SERVICE_TODAY } from '@/lib/data';
import FestivalGallery, { GalleryImage } from '@/components/FestivalGallery';
import {
  X, Calendar, MapPin, Clock, DollarSign, Phone, Globe,
  Users, Sparkles, Building2, Ticket, FileText, Loader2, Share2
} from 'lucide-react';

interface FestivalDetailPanelProps {
  festival: Festival;
  onClose: () => void;
}

export default function FestivalDetailPanel({
  festival,
  onClose,
}: FestivalDetailPanelProps) {
  const [detailData, setDetailData] = useState<any>(festival);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="w-[410px] max-w-[calc(100vw-450px)] bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-2xl flex flex-col overflow-hidden h-full animate-fade-in relative z-30">
      {/* 1. 상단 바: 타이틀 및 닫기 버튼 */}
      <div className="p-3.5 border-b border-gray-100 bg-white/95 flex items-center justify-between sticky top-0 z-20">
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
        {/* 대표 이미지 포스터 */}
        <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 relative border border-gray-100 shadow-2xs">
          {festival.firstimage ? (
            <img
              src={festival.firstimage}
              alt={festival.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-slate-100">
              대표 이미지가 준비 중입니다.
            </div>
          )}
          {festival.festivalgrade && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2540] text-white shadow-xs">
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
    </div>
  );
}
