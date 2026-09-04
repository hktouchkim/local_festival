'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* 1. 최상단 메인 헤더 영역 */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 좌측: 햄버거 메뉴, 검색, 한경 브랜드명 */}
        <div className="flex items-center space-x-3.5">
          <button className="text-gray-700 hover:text-black p-1" title="메뉴">
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
          <button className="text-gray-700 hover:text-black p-1" title="검색">
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>
          <span className="font-extrabold text-[17px] tracking-tight text-[#0A2540] ml-1 select-none">
            한경
          </span>
        </div>

        {/* 중앙: 한경 트래블 공식 공식 SVG 원본 로고 (228x35) */}
        <div className="flex items-center justify-center">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hkstatic.hankyung.com/resource/common/img/logo/logo-travel.svg"
              alt="한경 트래블"
              width={228}
              height={35}
              className="w-[228px] h-[35px] object-contain"
            />
          </Link>
        </div>

        {/* 우측: 유틸리티 링크 & 구독/로그인 */}
        <div className="flex flex-col items-end justify-center text-[11px] text-gray-600">
          <div className="flex items-center space-x-2.5">
            <Link href="/admin" className="text-gray-500 hover:text-[#0A2540] flex items-center gap-0.5">
              <Shield className="w-3 h-3 text-gray-400" />
              <span>관리자</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="hover:text-black cursor-pointer">신문 구독</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-black cursor-pointer font-medium text-gray-700">한경 프리미엄9 구독</span>
            <span className="text-gray-300">|</span>
            <span className="hover:text-black cursor-pointer">로그인</span>
          </div>
          <div className="mt-1">
            <span className="text-[10px] text-gray-500 hover:text-black cursor-pointer">
              한경 프리미엄9 구독하기
            </span>
          </div>
        </div>
      </div>

      {/* 2. 서브 GNB 탭 메뉴 바 (가로줄 없음, 중앙 정렬 justify-center 적용) */}
      <nav className="bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center space-x-7 overflow-x-auto whitespace-nowrap text-[13px] font-semibold text-gray-800">
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            트래블맵
          </Link>
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            트래블 PICK!
          </Link>
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            한 장 여행
          </Link>
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            추천 여행지
          </Link>
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            스테이&푸드
          </Link>
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            여행 잇!템
          </Link>
          <Link href="/" className="py-2.5 hover:text-blue-600 border-b-2 border-transparent">
            여행뉴스
          </Link>
          {/* '지역축제' 활성화 */}
          <Link
            href="/"
            className="py-2.5 text-[#2292d8] border-b-2 border-[#2292d8] font-bold"
          >
            지역축제
          </Link>
        </div>
      </nav>
    </header>
  );
}
