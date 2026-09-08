import Header from '@/components/Header';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SpecClientView from '@/components/SpecClientView';

export default function SpecPage() {
  const filePath = path.join(process.cwd(), 'docs', 'festival_service_spec.md');
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    content = '기획 문서를 불러올 수 없습니다.';
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900 font-sans">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#0A2540] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>메인으로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-[#0A2540] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200">
              최종 기획 정의서
            </span>
          </div>
        </div>

        {/* 구글문서 복사 툴바 및 서식 렌더링 뷰어 */}
        <SpecClientView content={content} />
      </main>
    </div>
  );
}
