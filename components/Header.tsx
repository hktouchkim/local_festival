'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="w-full px-4 md:px-6 h-14 flex items-center justify-between">
        {/* 좌측: 한경 트래블 로고 + 구분선 + 지역축제 타이틀 */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hkstatic.hankyung.com/resource/common/img/logo/logo-travel.svg"
              alt="한경 트래블"
              width={130}
              height={26}
              className="h-6 md:h-7 w-auto object-contain"
            />
          </Link>
          <span className="w-px h-4 bg-gray-300" />
          <h1 className="text-base md:text-lg font-extrabold text-[#0A2540] tracking-tight">
            지역축제
          </h1>
        </div>

        {/* 우측: 완전히 비움 (질문 3 B안 반영) */}
        <div />
      </div>
    </header>
  );
}
