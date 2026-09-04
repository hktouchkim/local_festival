'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Shield, ChevronDown, ChevronUp } from 'lucide-react';

export default function Header() {
  const [isSubGnbOpen, setIsSubGnbOpen] = useState(false);

  return (
    <header className="w-full bg-white sticky top-0 z-50">
      {/* ========================================================= */}
      {/* 1. 모바일 전용 헤더 (md:hidden)                          */}
      {/* ========================================================= */}
      <div className="md:hidden">
        {/* 모바일 1단 탑바: 딥블루 네이비 배경 (#0A2540) */}
        <div className="bg-[#0A2540] text-white px-4 h-12 flex items-center justify-between">
          <button className="text-white p-1 hover:opacity-80" aria-label="메뉴">
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
          <span className="font-bold text-[19px] tracking-tight">
            한경
          </span>
          <button className="text-white p-1 hover:opacity-80" aria-label="검색">
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 모바일 2단 브랜드 바: 흰색 배경 + 한경 트래블 공식 로고 + 드롭다운 화살표 */}
        <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hkstatic.hankyung.com/resource/common/img/logo/logo-travel.svg"
              alt="한경 트래블"
              width={140}
              height={28}
              className="w-[140px] h-[28px] object-contain"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-xs flex items-center gap-0.5">
              <Shield className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setIsSubGnbOpen(!isSubGnbOpen)}
              className="text-gray-700 p-1 hover:text-black transition-transform"
              aria-label="하위 메뉴 펼치기"
            >
              {isSubGnbOpen ? (
                <ChevronUp className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <ChevronDown className="w-5 h-5 stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 3단: 드롭다운 토글형 메뉴 또는 횡스크롤 탭 */}
        {isSubGnbOpen ? (
          <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 grid grid-cols-2 gap-2 text-sm font-semibold text-gray-700 shadow-inner">
            <Link href="/" className="p-2 hover:bg-white rounded">트래블맵</Link>
            <Link href="/" className="p-2 hover:bg-white rounded">트래블 PICK!</Link>
            <Link href="/" className="p-2 hover:bg-white rounded">한 장 여행</Link>
            <Link href="/" className="p-2 hover:bg-white rounded">추천 여행지</Link>
            <Link href="/" className="p-2 hover:bg-white rounded">스테이&푸드</Link>
            <Link href="/" className="p-2 hover:bg-white rounded">여행 잇!템</Link>
            <Link href="/" className="p-2 hover:bg-white rounded">여행뉴스</Link>
            <Link href="/" className="p-2 bg-blue-50 text-[#2292d8] rounded font-bold">지역축제</Link>
          </div>
        ) : (
          <div className="bg-white border-b border-gray-100 px-3 flex items-center space-x-5 overflow-x-auto whitespace-nowrap text-[13px] font-semibold text-gray-700 scrollbar-none">
            <Link href="/" className="py-2.5 hover:text-blue-600">트래블맵</Link>
            <Link href="/" className="py-2.5 hover:text-blue-600">트래블 PICK!</Link>
            <Link href="/" className="py-2.5 hover:text-blue-600">한 장 여행</Link>
            <Link href="/" className="py-2.5 hover:text-blue-600">추천 여행지</Link>
            <Link href="/" className="py-2.5 text-[#2292d8] border-b-2 border-[#2292d8] font-bold">지역축제</Link>
            <Link href="/" className="py-2.5 hover:text-blue-600">스테이&푸드</Link>
            <Link href="/" className="py-2.5 hover:text-blue-600">여행 잇!템</Link>
            <Link href="/" className="py-2.5 hover:text-blue-600">여행뉴스</Link>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. PC 전용 헤더 (hidden md:block)                         */}
      {/* ========================================================= */}
      <div className="hidden md:block border-b border-gray-200">
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

        {/* PC 서브 GNB 탭 메뉴 바 */}
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
            <Link
              href="/"
              className="py-2.5 text-[#2292d8] border-b-2 border-[#2292d8] font-bold"
            >
              지역축제
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
