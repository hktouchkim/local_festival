import Header from '@/components/Header';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { FileText, ArrowLeft, Download } from 'lucide-react';

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
            <a
              href="/festival_service_spec.docx"
              download="지역축제_서비스_기획_정의서.docx"
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>워드(DOCX) 파일 다운로드</span>
            </a>
            <span className="text-xs bg-blue-50 text-[#0A2540] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200">
              최종 기획 정의서
            </span>
          </div>
        </div>

        {/* 문서 본문 카드 */}
        <article className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 md:p-10">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <FileText className="w-6 h-6 text-[#0A2540]" />
            <h1 className="text-2xl font-extrabold text-gray-900">지역축제 서비스 기획 정의서</h1>
          </div>

          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-800">
            {content}
          </div>
        </article>
      </main>
    </div>
  );
}
