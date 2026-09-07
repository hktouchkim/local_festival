import { redirect } from 'next/navigation';

interface FestivalDetailPageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default function FestivalDetailPage({ params }: FestivalDetailPageProps) {
  // 단독 상세 페이지를 배제하고 네이버지도 방식의 메인 2단 패널로 자동 리다이렉트
  redirect(`/?festivalId=${params.id}`);
}
