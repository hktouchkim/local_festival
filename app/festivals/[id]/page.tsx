import Link from 'next/link';
import Header from '@/components/Header';
import FestivalGallery, { GalleryImage } from '@/components/FestivalGallery';
import { getFestivalById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Clock, DollarSign, Phone, Globe, ArrowLeft, Share2 } from 'lucide-react';

interface FestivalDetailPageProps {
  params: { id: string };
}

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
  const todayStr = '2026-09-04';
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
    badgeColor = 'bg-gray-400 text-white';
  }

  // TourAPI 서브 이미지 조회
  const galleryImages = await fetchFestivalImages(festival.contentid);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#0A2540]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록으로 돌아가기</span>
          </Link>
          <div className="p-2 border border-gray-200 rounded-lg text-gray-500">
            <Share2 className="w-4 h-4" />
          </div>
        </div>

        {/* 1. 상단 비주얼 영역 (대표 이미지 포스터) */}
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-gray-100 relative shadow-sm border border-gray-200">
          {festival.firstimage ? (
            <img
              src={festival.firstimage}
              alt={festival.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-medium">
              대표 이미지가 준비 중입니다.
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${badgeColor}`}>
              {badgeText}
            </span>
          </div>
        </div>

        {/* 2. 타이틀 헤더 */}
        <div className="mt-5 pb-4 border-b border-gray-200">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            {festival.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{festival.addr1} {festival.addr2}</span>
          </p>
        </div>

        {/* 3. 핵심 메타 정보 박스 (기획서 4.5항 반영) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 bg-white p-5 rounded-xl border border-gray-200 shadow-xs text-sm">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">행사 기간</span>
              <span className="font-semibold text-gray-800">
                {festival.start_date.replace(/-/g, '.')} ~ {festival.end_date.replace(/-/g, '.')}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">관람 및 운영시간</span>
              <span className="font-semibold text-gray-800">{festival.playtime || '정보 없음'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-[#0A2540] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-400 block font-medium">이용 요금</span>
              <span className="font-semibold text-gray-800">{festival.usetime || '무료'}</span>
            </div>
          </div>

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

        {/* 4. 축제 소개 본문 */}
        <section className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            축제 소개
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {festival.overview || '상세 축제 소개 정보가 준비 중입니다.'}
          </p>
          {(festival.sponsor1 || festival.sponsor2) && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              주최/주관: {festival.sponsor1} {festival.sponsor2 ? `· ${festival.sponsor2}` : ''}
            </div>
          )}
        </section>

        {/* 5. 축제 현장 갤러리 (A안: TourAPI 서브 이미지 연동 및 라이트박스) */}
        {galleryImages.length > 0 && (
          <FestivalGallery images={galleryImages} festivalTitle={festival.title} />
        )}

        {/* 6. 공식 홈페이지 및 바로가기 아웃링크 */}
        {festival.homepage && (
          <div className="mt-6 text-center">
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
