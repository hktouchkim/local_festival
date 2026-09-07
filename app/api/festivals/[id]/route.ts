import { NextRequest, NextResponse } from 'next/server';
import { getFestivalById } from '@/lib/db';

const SERVICE_KEY = 'ND%2F0A%2FDqAIORcQUsJJGJ44TYbdnvLk%2FHbdxZ%2BjAhZKY0NjfZyNLHLEmCrS8QFPGAmEw8WK380t4ugQqMuYo0TA%3D%3D';

// 한국관광공사 TourAPI 서브 이미지 조회
async function fetchFestivalImages(contentId?: string) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const festival = await getFestivalById(params.id);
    if (!festival) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const images = await fetchFestivalImages(festival.contentid);

    return NextResponse.json({
      success: true,
      data: {
        ...festival,
        galleryImages: images
      }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
