'use client';

import Link from 'next/link';
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

        {/* 중앙: 한경 Tra[♥]el 공식 시그니처 브랜드 로고 */}
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center">
            {/* 한경 */}
            <span className="text-[26px] font-black tracking-tight text-[#0A2540] mr-1.5 font-sans">
              한경
            </span>
            {/* Tra */}
            <span className="text-[26px] font-extrabold tracking-tight text-[#2292d8] font-sans">
              Tra
            </span>
            {/* v 대체 심볼: 붉은색 위치핀 & 하트 */}
            <span className="inline-flex items-center justify-center mx-0.5 relative -top-[1px]">
              <svg width="19" height="23" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 핀 외곽 */}
                <path
                  d="M10 0C4.477 0 0 4.477 0 10C0 16.5 10 24 10 24S20 16.5 20 10C20 4.477 15.523 0 10 0Z"
                  fill="#E11D48"
                />
                {/* 핀 내부 흰색 하트 */}
                <path
                  d="M10 13.5L9.13 12.7C6.06 9.92 4 8.05 4 5.75C4 3.88 5.48 2.4 7.35 2.4C8.41 2.4 9.42 2.89 10 3.67C10.58 2.89 11.59 2.4 12.65 2.4C14.52 2.4 16 3.88 16 5.75C16 8.05 13.94 9.92 10.87 12.71L10 13.5Z"
                  fill="white"
                />
              </svg>
            </span>
            {/* el */}
            <span className="text-[26px] font-extrabold tracking-tight text-[#2292d8] font-sans">
              el
            </span>
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

      {/* 2. GNB 탭 메뉴 바 (A안 적용: 화이트 배경, '지역축제' 활성화) */}
      <nav className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-7 overflow-x-auto whitespace-nowrap text-[13px] font-semibold text-gray-800">
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
          {/* A안 확정: 커뮤니티/검색 자리에 '지역축제' 활성화 */}
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
