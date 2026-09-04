'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Festival } from '@/lib/data';
import { Shield, Plus, Eye, EyeOff, Search, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // 신규 등록 폼 상태 (기획서 7.3항 전 항목 직접 입력)
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    addr1: '',
    addr2: '',
    mapx: 126.9780,
    mapy: 37.5665,
    firstimage: '',
    overview: '',
    playtime: '',
    usetime: '',
    sponsor1: '',
    sponsor2: '',
    tel: '',
    homepage: ''
  });

  // 관리자용 전체 축제 목록 로딩 (숨김 포함)
  const loadAdminFestivals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/festivals?includeHidden=true');
      const data = await res.json();
      if (data.success) {
        setFestivals(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminFestivals();
  }, []);

  // 공개/숨김 상태 토글 (기획서 7.2항 반영)
  const handleToggleStatus = async (festival: Festival) => {
    const nextStatus = festival.status === 'PUBLISHED' ? '숨김' : '공개';
    if (!confirm(`'${festival.title}' 축제의 노출 상태를 [${nextStatus}]으로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch('/api/festivals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: festival.id })
      });
      const data = await res.json();
      if (data.success) {
        alert('상태가 성공적으로 변경되었습니다.');
        loadAdminFestivals();
      }
    } catch (error) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 신규 등록 제출 (기획서 7.3항 반영)
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) {
      alert('축제명과 개최 기간은 필수 입력 항목입니다.');
      return;
    }

    try {
      const res = await fetch('/api/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('신규 축제가 성공적으로 등록되었습니다.');
        setActiveTab('LIST');
        loadAdminFestivals();
        // 폼 초기화
        setFormData({
          title: '',
          start_date: '',
          end_date: '',
          addr1: '',
          addr2: '',
          mapx: 126.9780,
          mapy: 37.5665,
          firstimage: '',
          overview: '',
          playtime: '',
          usetime: '',
          sponsor1: '',
          sponsor2: '',
          tel: '',
          homepage: ''
        });
      }
    } catch (error) {
      alert('축제 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* 관리자 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-300">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#0A2540]" />
              <h1 className="text-2xl font-black text-gray-900">지역축제 운영 관리자</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              등록된 축제 데이터의 공개/숨김 제어 및 신규 제휴 축제 수동 등록
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'LIST'
                  ? 'bg-[#0A2540] text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              축제 목록 관리
            </button>
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'CREATE'
                  ? 'bg-[#0A2540] text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>신규 축제 등록</span>
            </button>
          </div>
        </div>

        {/* 탭 1: 축제 목록 관리 (기획서 7.2항 반영) */}
        {activeTab === 'LIST' && (
          <div className="mt-6 bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <span className="text-xs font-bold text-gray-700">
                전체 등록 축제: <span className="text-[#0A2540]">{festivals.length}</span>건
              </span>
              <span className="text-[11px] text-gray-500">
                💡 '숨김' 상태로 전환 시 사용자 화면(지도/목록)에서 즉시 비노출됩니다.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 w-14">No</th>
                    <th className="py-3 px-4">축제명</th>
                    <th className="py-3 px-4">개최 기간</th>
                    <th className="py-3 px-4">개최 지역</th>
                    <th className="py-3 px-4 w-24">출처</th>
                    <th className="py-3 px-4 w-28 text-center">공개 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {festivals.map((fest, idx) => (
                    <tr key={fest.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <a
                          href={`/festivals/${fest.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-[#0A2540] flex items-center gap-1.5"
                        >
                          <span>{fest.title}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        {fest.start_date} ~ {fest.end_date}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">{fest.addr1}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            fest.source === 'MANUAL'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {fest.source === 'MANUAL' ? '수동등록' : 'TourAPI'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(fest)}
                          className={`px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 transition ${
                            fest.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {fest.status === 'PUBLISHED' ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>공개 중</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>숨김</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 탭 2: 신규 축제 수동 등록 폼 (기획서 7.3항 반영) */}
        {activeTab === 'CREATE' && (
          <form
            onSubmit={handleSubmitNew}
            className="mt-6 bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-200">
              신규 지역축제 수동 등록
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-gray-700">축제명 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 한경 가을 미식 축제"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">시작일 (필수)</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">종료일 (필수)</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-gray-700">개최 장소 / 주소 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 서울특별시 종로구 세종대로 175"
                  value={formData.addr1}
                  onChange={(e) => setFormData({ ...formData, addr1: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-gray-700">대표 이미지 URL (선택)</label>
                <input
                  type="url"
                  placeholder="https://... (미입력 시 한경 기본 디폴트 이미지가 적용됩니다)"
                  value={formData.firstimage}
                  onChange={(e) => setFormData({ ...formData, firstimage: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">운영시간 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 10:00 ~ 20:00"
                  value={formData.playtime}
                  onChange={(e) => setFormData({ ...formData, playtime: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">이용요금 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 무료 (체험비 5,000원)"
                  value={formData.usetime}
                  onChange={(e) => setFormData({ ...formData, usetime: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">주최/주관 기관 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 한국경제신문"
                  value={formData.sponsor1}
                  onChange={(e) => setFormData({ ...formData, sponsor1: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">문의처 전화번호 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 02-360-4114"
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-gray-700">공식 홈페이지 URL (선택)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.homepage}
                  onChange={(e) => setFormData({ ...formData, homepage: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-gray-700">축제 상세 소개 (필수)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="축제의 주요 프로그램, 볼거리, 행사 취지를 작성해주세요."
                  value={formData.overview}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0A2540] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('LIST')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0A2540] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow"
              >
                신규 축제 등록 완료
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
