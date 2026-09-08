'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Download } from 'lucide-react';

interface SpecClientViewProps {
  content: string;
}

export default function SpecClientView({ content }: SpecClientViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyForGoogleDocs = async () => {
    try {
      const container = document.getElementById('spec-doc-content');
      if (!container) return;

      const htmlContent = container.innerHTML;
      const plainText = container.innerText;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
      const container = document.getElementById('spec-doc-content');
      if (container) {
        await navigator.clipboard.writeText(container.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  return (
    <div>
      {/* 상단 원클릭 구글문서 복사 및 열기 플로팅 툴바 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0A2540] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            G
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">구글 문서(Google Docs) 바로 붙여넣기</h3>
            <p className="text-xs text-slate-600 font-medium">아래 복사 버튼 클릭 후, 새 구글 문서에서 Cmd+V(Ctrl+V)를 누르면 완벽한 서식으로 들어갑니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyForGoogleDocs}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0A2540] text-white hover:bg-blue-900 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>서식 복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>구글 문서 서식 복사</span>
              </>
            )}
          </button>

          <a
            href="https://docs.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-xs"
            title="새 구글 문서 창 열기"
          >
            <span>docs.new 열기</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="/festival_service_spec.docx"
            download="지역축제_서비스_기획_정의서.docx"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-xs"
            title="워드 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.docx</span>
          </a>
        </div>
      </div>

      {/* 서식 보존된 렌더링 뷰 (클립보드 추출용 HTML 타겟) */}
      <article
        id="spec-doc-content"
        className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 md:p-10 space-y-6 text-slate-900"
      >
        <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-800">
          {content}
        </div>
      </article>
    </div>
  );
}
