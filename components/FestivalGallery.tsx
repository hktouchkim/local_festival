'use client';

import { useState } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export interface GalleryImage {
  originimgurl: string;
  smallimageurl: string;
  imgname?: string;
}

interface FestivalGalleryProps {
  images: GalleryImage[];
  festivalTitle: string;
}

export default function FestivalGallery({ images, festivalTitle }: FestivalGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (idx: number) => setSelectedIdx(idx);
  const closeLightbox = () => setSelectedIdx(null);

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + images.length) % images.length);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % images.length);
  };

  return (
    <section className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#0A2540]" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">축제 현장 갤러리</h2>
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {images.length}장
          </span>
        </div>
        <span className="text-xs text-gray-400">클릭 시 고화질 확대</span>
      </div>

      {/* 세로 펼침형 갤러리 (아래로 쫙 펼쳐져 자연스럽게 스크롤 감상) */}
      <div className="space-y-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => openLightbox(idx)}
            className="group relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-gray-200/80 hover:border-gray-400 transition shadow-xs hover:shadow-md"
          >
            <img
              src={img.originimgurl || img.smallimageurl}
              alt={img.imgname || `${festivalTitle} 현장 사진 ${idx + 1}`}
              className="w-full h-auto max-h-72 object-contain bg-slate-900/90 group-hover:scale-[1.01] transition-transform duration-300"
              loading="lazy"
            />
            {img.imgname && (
              <div className="p-2 bg-white border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-700 truncate">
                  {img.imgname.replace(/\.[^/.]+$/, '')}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Maximize2 className="w-3 h-3" /> 확대
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 라이트박스 팝업 모달 */}
      {selectedIdx !== null && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn"
        >
          {/* 상단 닫기 & 카운터 */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
            <span className="text-white/80 text-sm font-medium">
              {selectedIdx + 1} / {images.length}
            </span>
            <button
              onClick={closeLightbox}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 좌우 네비게이션 버튼 */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* 중앙 확대 이미지 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center relative"
          >
            <img
              src={images[selectedIdx].originimgurl}
              alt={images[selectedIdx].imgname || festivalTitle}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {images[selectedIdx].imgname && (
              <p className="mt-3 text-white/90 text-xs md:text-sm text-center px-4 max-w-xl truncate">
                {images[selectedIdx].imgname.replace(/\.[^/.]+$/, '')}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
