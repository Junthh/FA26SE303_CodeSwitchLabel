import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, CheckCircle2, Search, X } from 'lucide-react';
import { REVIEWER_ACCENT as ACCENT } from '../../../../constants/theme';
import { SCRIPT_REPORTS as INITIAL_REPORTS } from '../../../../mocks/reviewer/scriptReports';

const cloneDraft = (report) => {
  const content = report.proposal || report.original;
  // Speaker chỉ đề xuất hai câu; Reviewer tự chỉnh các cặp từ từ dữ liệu gốc.
  return { cs: content.cs, vi: content.vi, words: report.original.words.map((word) => ({ ...word })) };
};

function SentenceLine({ label, children, compact = false }) {
  return (
    <div className={`flex items-start gap-2 text-[#2B2C31] ${compact ? 'text-[11px] leading-4' : 'text-[12px] leading-5'}`}>
      <span className={`mt-0.5 inline-flex h-[18px] w-10 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white ${label === 'VI' ? 'bg-[#8B8D95]' : 'bg-[#0052CC]'}`}>{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function ReviewScript() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [selectedId, setSelectedId] = useState(INITIAL_REPORTS[0].id);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = reports.find((report) => report.id === selectedId) || reports[0];
  const draft = selected && (drafts[selected.id] || cloneDraft(selected));
  const filtered = useMemo(() => reports.filter((report) => {
    const text = `${report.id} ${report.author} ${report.reason} ${report.original.cs}`.toLocaleLowerCase('vi');
    return text.includes(query.trim().toLocaleLowerCase('vi'));
  }), [reports, query]);

  const updateDraft = (patch) => {
    setDrafts((current) => ({ ...current, [selected.id]: { ...draft, ...patch } }));
    setError('');
  };

  const updateWord = (index, field, value) => {
    const words = draft.words.map((word, position) => position === index ? { ...word, [field]: value } : word);
    updateDraft({ words });
  };

  const resolveReport = (action) => {
    if (action === 'approve') {
      if (!draft.cs.trim() || !draft.vi.trim() || draft.words.some((word) => !word.source.trim() || !word.target.trim())) {
        setError('Vui lòng điền đủ hai câu và các cặp từ trước khi lưu.');
        return;
      }
      if (!draft.cs.includes('[vi]') || !draft.cs.includes('[en]') || !draft.vi.startsWith('[vi]')) {
        setError('Câu VI-EN cần thẻ [vi], [en]; câu VI cần bắt đầu bằng [vi].');
        return;
      }
      if (draft.words.some((word) => !draft.cs.includes(`[en]${word.source.trim()}`))) {
        setError('Từ tiếng Anh phải khớp với từ đứng sau thẻ [en] trong câu VI-EN.');
        return;
      }
    }
    const remaining = reports.filter((report) => report.id !== selected.id);
    setReports(remaining);
    setSelectedId(remaining[0]?.id || null);
    setDrafts((current) => {
      const next = { ...current };
      delete next[selected.id];
      return next;
    });
    setError('');
    setNotice(action === 'approve' ? 'Đã duyệt bản chỉnh sửa.' : 'Đã bỏ qua báo lỗi.');
  };

  return (
    <div className="flex min-h-[calc(100dvh-129px)] flex-col text-left font-sans lg:h-[calc(100dvh-129px)] lg:min-h-0">
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(290px,0.38fr)_minmax(0,0.62fr)]">
        <section className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-[#E5E2D8] bg-white shadow-sm" aria-label="Danh sách câu lỗi">
          <div className="shrink-0 border-b border-[#E5E2D8] p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9CA3]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm câu, người báo lỗi..." aria-label="Tìm câu lỗi" className="h-9 w-full rounded-lg border border-[#E5E2D8] bg-[#FBFAF7] pl-9 pr-3 text-xs outline-none focus:border-[#0052CC]" />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.length ? filtered.map((report) => (
              <button key={report.id} type="button" onClick={() => { setSelectedId(report.id); setError(''); setNotice(''); }} className={`mb-1.5 w-full rounded-xl border p-2 text-left transition-colors ${selected?.id === report.id ? 'border-[#A9C6F5] bg-[#F2F7FF]' : 'border-transparent hover:border-[#E5E2D8] hover:bg-[#FBFAF7]'}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 text-xs font-bold text-[#16171C]">{report.author}{report.type === 'Báo lỗi' && <span className="text-[10px] font-normal text-[#858994]"> · {report.reason}</span>}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${report.type === 'Đề xuất sửa' ? 'bg-[#EAF7EF] text-[#1F5C3F]' : 'bg-[#FFF4E5] text-[#8B5E0F]'}`}>{report.type}</span>
                </span>
                <div className="mt-1 space-y-0.5">
                  <SentenceLine label="VI-EN" compact>{report.original.cs.replaceAll('[vi]', '').replaceAll('[en]', '')}</SentenceLine>
                  <SentenceLine label="VI" compact>{report.original.vi.replaceAll('[vi]', '')}</SentenceLine>
                </div>
                <span className="mt-1 block text-right text-[10px] text-[#858994]">{report.time}</span>
              </button>
            )) : <p className="p-4 text-center text-xs text-[#858994]">Không có câu phù hợp.</p>}
          </div>
        </section>

        <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[#E5E2D8] bg-white shadow-sm" aria-label="Chi tiết câu lỗi">
          {selected ? <>
            <div className="flex shrink-0 items-center justify-between border-b border-[#E5E2D8] px-4 py-2.5">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-[#16171C]">{selected.type}</h2>
                <p className="text-[11px] text-[#6E7078]">{selected.author}{selected.type === 'Báo lỗi' ? ` · ${selected.reason}` : ''}</p>
              </div>
              <span className="rounded-full bg-[#FFF4E5] px-2 py-1 text-[10px] font-semibold text-[#8B5E0F]">Chờ kiểm duyệt</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="mb-3 rounded-xl border border-[#E5E2D8] bg-[#FAF9F6] p-2.5">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#858994]">Câu hiện tại</p>
                <div className="space-y-1"><SentenceLine label="VI-EN">{selected.original.cs}</SentenceLine><SentenceLine label="VI">{selected.original.vi}</SentenceLine></div>
              </div>

              <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-[#16171C]">Nội dung sau chỉnh sửa</h3><span className="text-[10px] text-[#858994]">Giữ thẻ [vi] / [en]</span></div>
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <label className="block min-w-0 text-[10px] font-bold text-[#6E7078]">CÂU VI-EN
                  <textarea value={draft.cs} onChange={(event) => updateDraft({ cs: event.target.value })} rows={3} className="mt-1 block h-[68px] w-full resize-none rounded-lg border border-[#E5E2D8] p-2.5 text-xs font-medium leading-5 text-[#16171C] outline-none focus:border-[#0052CC]" />
                </label>
                <label className="block min-w-0 text-[10px] font-bold text-[#6E7078]">CÂU TIẾNG VIỆT
                  <textarea value={draft.vi} onChange={(event) => updateDraft({ vi: event.target.value })} rows={3} className="mt-1 block h-[68px] w-full resize-none rounded-lg border border-[#E5E2D8] p-2.5 text-xs font-medium leading-5 text-[#16171C] outline-none focus:border-[#0052CC]" />
                </label>
              </div>

              <h3 className="mb-1.5 text-xs font-bold text-[#16171C]">Từ tiếng Anh và nghĩa tiếng Việt</h3>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {draft.words.map((word, index) => (
                  <div key={index} className="flex min-w-0 items-center gap-1.5">
                    <input value={word.source} onChange={(event) => updateWord(index, 'source', event.target.value)} aria-label={`Từ tiếng Anh ${index + 1}`} className="h-8 min-w-0 flex-1 rounded-lg border border-[#E5E2D8] bg-[#FAF9F6] px-2.5 text-xs font-semibold text-[#0052CC] outline-none focus:border-[#0052CC]" />
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#9A9CA3]" />
                    <input value={word.target} onChange={(event) => updateWord(index, 'target', event.target.value)} aria-label={`Nghĩa tiếng Việt ${index + 1}`} className="h-8 min-w-0 flex-1 rounded-lg border border-[#E5E2D8] bg-[#FAF9F6] px-2.5 text-xs text-[#16171C] outline-none focus:border-[#0052CC]" />
                  </div>
                ))}
              </div>
              {error && <p role="alert" className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#C0442B]"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#E5E2D8] px-4 py-2.5">
              <p className="hidden text-[10px] text-[#858994] sm:block">Kiểm tra câu và nghĩa từ trước khi duyệt.</p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => resolveReport('dismiss')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E2D8] px-3 text-xs font-semibold text-[#6E7078] hover:bg-[#F7F5EF]"><X className="h-3.5 w-3.5" /> Bỏ qua</button>
                <button type="button" onClick={() => resolveReport('approve')} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white hover:brightness-110" style={{ background: ACCENT }}><Check className="h-3.5 w-3.5" /> Lưu & duyệt</button>
              </div>
            </div>
          </> : <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center"><CheckCircle2 className="h-9 w-9 text-[#3FA66B]" /><p className="text-sm font-semibold text-[#16171C]">Đã xử lý hết câu lỗi</p><p className="text-xs text-[#858994]">Báo lỗi mới sẽ xuất hiện tại đây.</p></div>}
        </section>
      </div>
      {notice && <p role="status" className="sr-only">{notice}</p>}
    </div>
  );
}
