import Link from 'next/link';
import { Search, MapPin, Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      {/* 1. 한경 패밀리 헤더 (최상단) */}
      <div className="bg-[#f8f9fa] border-b border-gray-100 text-xs text-gray-500 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex space-x-3">
            <span className="font-semibold text-gray-700">한국경제</span>
            <span>한경코리아마켓</span>
            <span className="text-[#0A2540] font-bold">한경트래블</span>
          </div>
          <div className="flex space-x-3 items-center">
            <Link href="/admin" className="text-gray-500 hover:text-[#0A2540] flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>관리자</span>
            </Link>
            <span>로그인</span>
            <span>My한경</span>
          </div>
        </div>
      </div>

      {/* 2. 한경 트래블 브랜드 로고 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-baseline space-x-2">
            <span className="text-2xl font-black tracking-tight text-[#0A2540]">한경</span>
            <span className="text-2xl font-bold tracking-tight text-[#1e40af]">트래블</span>
            <span className="ml-2 text-sm font-semibold bg-[#0A2540] text-white px-2 py-0.5 rounded">
              지역축제
            </span>
          </Link>
        </div>
        <div className="text-xs text-gray-400 hidden md:block">
          전국 지역축제 지도 & 정보 서비스
        </div>
      </div>

      {/* 3. 개편된 GNB: 커뮤니티/검색 삭제 -> '지역축제' 메뉴 신규 적용 */}
      <nav className="bg-[#0A2540] text-white text-sm font-medium">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="py-3 px-3 hover:text-blue-200 border-b-2 border-transparent">
            홈
          </Link>
          <Link href="/" className="py-3 px-3 hover:text-blue-200 border-b-2 border-transparent">
            국내여행
          </Link>
          <Link href="/" className="py-3 px-3 hover:text-blue-200 border-b-2 border-transparent">
            해외여행
          </Link>
          <Link href="/" className="py-3 px-3 hover:text-blue-200 border-b-2 border-transparent">
            호텔·리조트
          </Link>
          {/* 신규 확정 메뉴 */}
          <Link 
            href="/" 
            className="py-3 px-3 text-white font-bold border-b-2 border-white bg-blue-900/50 flex items-center gap-1"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>지역축제</span>
          </Link>
          <Link href="/" className="py-3 px-3 hover:text-blue-200 border-b-2 border-transparent">
            골프·레저
          </Link>
        </div>
      </nav>
    </header>
  );
}
