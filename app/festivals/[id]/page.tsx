import Link from 'next/link';
import Header from '@/components/Header';
import FestivalGallery, { GalleryImage } from '@/components/FestivalGallery';
import { getFestivalById } from '@/lib/db';
import { SERVICE_TODAY } from '@/lib/data';
import { notFound } from 'next/navigation';
import { 
  Calendar, MapPin, Clock, DollarSign, Phone, Globe, ArrowLeft, Share2, 
  Users, Sparkles, Building2, Ticket, FileText
} from 'lucide-react';

interface FestivalDetailPageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SERVICE_KEY = 'ND%2F0A%2FDqAIORcQUsJJGJ44TYbdnvLk%2FHbdxZ%2BjAhZKY0NjfZyNLHLEmCrS8QFPGAmEw8WK380t4ugQqMuYo0TA%3D%3D';

// 한국관광공사 TourAPI 서브 이미지 목록 실시간 조회
async function fetchFestivalImages(contentId?: string): Promise<GalleryImage[]> {
  if (!contentId || contentId.startsWith('fest_')) return [];
  try {
    const url = `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${SERVICE_KEY}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=LocalFestivalApp&_type=json&contentId=${contentId}&imageYN=Y`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const items = json.response?.body?.items?.item;
    if (!items) return [];
    const list = Array.isArray(items) ? items : [items];
    return list.map((item: any) => ({
      originimgurl: item.originimgurl,
      smallimageurl: item.smallimageurl || item.originimgurl,
      imgname: item.imgname || ''
    }));
  } catch (e) {
    console.error('Failed to fetch festival images:', e);
    return [];
  }
}

export default async function FestivalDetailPage({ params }: FestivalDetailPageProps) {
  const festival = await getFestivalById(params.id);

  if (!festival) {
    notFound();
  }

  // D-Day 및 진행 상태 판별
  const todayStr = SERVICE_TODAY;
  let badgeText = '진행 예정';
  let badgeColor = 'bg-[#e83428] text-white';

  if (festival.start_date <= todayStr && festival.end_date >= todayStr) {
    badgeText = '진행 중';
    badgeColor = 'bg-emerald-600 text-white';
  } else if (festival.start_date > todayStr) {
    const d = Math.ceil((new Date(festival.start_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
    badgeText = d === 0 ? 'D-Day (오늘 오픈)' : `D-${d} (진행 예정)`;
    badgeColor = 'bg-[#e83428] text-white';
  } else if (festival.end_date < todayStr) {
    badgeText = '종료된 축제';
    badgeColor = 'bg-slate-500 text-white';
  }

  // TourAPI 서브 이미지 조회
  const galleryImages = await fetchFestivalImages(festival.contentid);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#0A2540]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록으로 돌아가기</span>
          </Link>
          <div className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer">
            <Share2 className="w-4 h-4" />
          </div>
        </div>

        {/* 1. 상단 비주얼 영역 (대표 이미지 포스터) */}
        <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-sm border border-gray-200">
          {festival.firstimage ? (
            <img
              src={festival.firstimage}
              alt={festival.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-medium">
              대표 이미지가 준비 중입니다.
            </div>
          )}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${badgeColor}`}>
              {badgeText}
            </span>
            {festival.festivalgrade && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0A2540] text-white shadow-md">
                {festival.festivalgrade}
              </span>
            )}
          </div>
        </div>

        {/* 2. 타이틀 헤더 */}
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            {festival.title}
          </h1>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{festival.addr1} {festival.addr2}</span>
            {festival.eventplace && (
              <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded text-xs ml-1">
                {festival.eventplace}
              </span>
            )}
          </p>
        </div>

        {/* 3. 핵심 메타 정보 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs text-sm">
          {/* 기간 */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">행사 기간</span>
              <span className="font-semibold text-gray-800">
                {festival.start_date.replace(/-/g, '.')} ~ {festival.end_date.replace(/-/g, '.')}
              </span>
            </div>
          </div>

          {/* 운영시간 */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">운영 및 관람시간</span>
              <span className="font-semibold text-gray-800">{festival.playtime || '정보 없음'}</span>
            </div>
          </div>

          {/* 이용 요금 */}
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">이용 요금</span>
              <span className="font-semibold text-gray-800">{festival.usetime || '무료'}</span>
            </div>
          </div>

          {/* 관람 연령 */}
          {festival.agelimit && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-gray-400 block font-medium">관람 가능 연령</span>
                <span className="font-semibold text-gray-800">{festival.agelimit}</span>
              </div>
            </div>
          )}

          {/* 소요 시간 */}
          {festival.spendtimefestival && (
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-gray-400 block font-medium">관람 소요 시간</span>
                <span className="font-semibold text-gray-800">{festival.spendtimefestival}</span>
              </div>
            </div>
          )}

          {/* 문의처 */}
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">문의처</span>
              {festival.tel ? (
                <a href={`tel:${festival.tel}`} className="font-semibold text-blue-600 hover:underline">
                  {festival.tel}
                </a>
              ) : (
                <span className="font-semibold text-gray-800">정보 없음</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. 축제 상세 소개 본문 (값 부재 시에도 모듈 영역 유지) */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0A2540]" />
            <span>축제 소개</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {festival.overview?.trim() || '상세 축제 소개 정보가 준비 중입니다.'}
          </p>
          {(festival.sponsor1 || festival.sponsor2) && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span>주최/주관: {festival.sponsor1} {festival.sponsor2 ? `· ${festival.sponsor2}` : ''}</span>
            </div>
          )}
        </section>

        {/* 5. 행사 프로그램 일정표 (값 부재 시에도 모듈 영역 유지) */}
        <section className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs bg-gradient-to-br from-white to-blue-50/30">
          <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-blue-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>주요 행사 프로그램</span>
          </h2>
          {festival.program?.trim() ? (
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-mono bg-white p-4 rounded-xl border border-blue-100/80">
              {festival.program}
            </div>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed py-2">
              등록된 주요 행사 프로그램 정보가 없습니다. 상세 일정은 공식 홈페이지를 참고해주세요.
            </p>
          )}
        </section>

        {/* 6. 부대행사 (subevent 데이터가 있을 경우 노출) */}
        {festival.subevent && (
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#0A2540]" />
              <span>부대행사 및 특별 프로그램</span>
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {festival.subevent}
            </p>
          </section>
        )}

        {/* 7. 축제 현장 갤러리 (원복: TourAPI 서브 이미지 연동 및 라이트박스) */}
        {galleryImages.length > 0 && (
          <FestivalGallery images={galleryImages} festivalTitle={festival.title} />
        )}

        {/* 8. 공식 홈페이지 및 바로가기 아웃링크 */}
        {festival.homepage && (
          <div className="text-center pt-2">
            <a
              href={festival.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-[#0A2540] text-white text-sm font-bold rounded-xl shadow hover:bg-slate-800 transition"
            >
              <span>공식 홈페이지 바로가기</span>
              <Globe className="w-4 h-4" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
