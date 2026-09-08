'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, Download } from 'lucide-react';
import { marked } from 'marked';

interface SpecClientViewProps {
  content: string;
}

export default function SpecClientView({ content }: SpecClientViewProps) {
  const [copied, setCopied] = useState(false);

  // 마크다운 텍스트를 완벽한 시맨틱 HTML(h1, h2, ul, li, strong 등)로 파싱
  const renderedHtml = useMemo(() => {
    return marked.parse(content, { gfm: true, breaks: true }) as string;
  }, [content]);

  const handleCopyForGoogleDocs = async () => {
    try {
      const container = document.getElementById('spec-doc-content');
      if (!container) return;

      // 구글 문서가 가장 잘 인식하는 인라인 스타일이 입혀진 HTML 문자열 추출
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
        // 구형 브라우저 대체 (Selection API)
        const range = document.createRange();
        range.selectNodeContents(container);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          sel.removeAllRanges();
        }
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback
      const container = document.getElementById('spec-doc-content');
      if (container) {
        const range = document.createRange();
        range.selectNodeContents(container);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          sel.removeAllRanges();
        }
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
            <p className="text-xs text-slate-600 font-medium">아래 복사 버튼 클릭 후, 새 구글 문서에서 Cmd+V(Ctrl+V)를 누르면 완벽한 서식(제목, 글머리기호, 볼드체)으로 붙여넣어집니다.</p>
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

      {/* 시맨틱 서식이 온전히 렌더링된 HTML 뷰 (구글 문서 복사 타겟) */}
      <article
        id="spec-doc-content"
        className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 md:p-10 space-y-4 text-slate-900 leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
