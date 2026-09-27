import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Search, X, AlertTriangle, ArrowRight, ArrowLeft, ClipboardCheck, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { REVIEWER_ACCENT as ACCENT } from '../../../../constants/theme';
import { PROPOSAL_TASK as TASK, CONTRIBUTION_QUEUE, ISSUE_QUEUE } from '../../../../mocks/reviewer/proposals';

const CATEGORIES = ['Hội thoại hàng ngày', 'Công nghệ thông tin', 'Giáo dục'];

// Màu phân loại (bộ A) - xanh dương / hổ phách / hồng magenta, tránh màu status
const CATEGORY_COLORS = {
  'Hội thoại hàng ngày': { bg: '#E6F0FE', text: '#1E40AF' },
  'Công nghệ thông tin': { bg: '#FBF0DA', text: '#92600A' },
  'Giáo dục': { bg: '#FCE7F0', text: '#9D2662' },
};
const catStyle = (cat) => CATEGORY_COLORS[cat] || { bg: '#F7F5EF', text: '#6E7078' };

// Nhãn loại của câu có vấn đề
const ISSUE_KIND = {
  report: { label: 'Báo lỗi', bg: '#FFF4E5', text: '#8B5E0F' },
  edit: { label: 'Đề xuất sửa', bg: '#EAF7EF', text: '#1F5C3F' },
};

// 1 hàng chờ chung cho cả nhiệm vụ duyệt câu - lọc theo loại thay cho 2 tab
const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'contribution', label: 'Đóng góp' },
  { key: 'issue', label: 'Có vấn đề' },
];

const INITIAL_QUEUE = [
  ...CONTRIBUTION_QUEUE.map((it) => ({ ...it, type: 'contribution' })),
  ...ISSUE_QUEUE.map((it) => ({ ...it, type: 'issue' })),
];

// Nội dung hiển thị của 1 câu: đóng góp dùng chính nó, câu có vấn đề ưu tiên bản đề xuất
const contentOf = (it) => (it.type === 'issue' ? it.proposed || it.original : it);

// Nhãn pill (VI-EN / VI) đứng đầu mỗi câu - đồng bộ với InlineLabel bên trang Kiểm duyệt ghi âm.
function InlineLabel({ variant }) {
  const bg = variant === 'cs' ? ACCENT : '#8B8D95';
  return (
    <span
      className="text-[9px] font-bold w-9 h-[18px] text-center shrink-0 rounded-md inline-flex items-center justify-center text-white"
      style={{ background: bg, letterSpacing: '0.02em' }}
    >
      {variant === 'cs' ? 'VI-EN' : 'VI'}
    </span>
  );
}

// So từng từ (tách theo khoảng trắng) giữa 2 câu thô, trả về mảng { text, changed } cho mỗi bên (LCS đơn giản)
function diffWords(a, b) {
  const x = a.split(/(\s+)/);
  const y = b.split(/(\s+)/);
  const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i -= 1) {
    for (let j = y.length - 1; j >= 0; j -= 1) {
      dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const left = [];
  const right = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { left.push({ text: x[i], changed: false }); right.push({ text: y[j], changed: false }); i += 1; j += 1; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { left.push({ text: x[i], changed: true }); i += 1; }
    else { right.push({ text: y[j], changed: true }); j += 1; }
  }
  while (i < x.length) { left.push({ text: x[i], changed: true }); i += 1; }
  while (j < y.length) { right.push({ text: y[j], changed: true }); j += 1; }
  return [left, right];
}

const toPairs = (alignment) => alignment.map(({ source, target }) => ({ source, target }));

// Số dòng nghĩa từ tối đa reviewer được thêm (sau này lấy từ API cấu hình hệ thống)
const MAX_EN_WORDS = 3;

// Kiểm tra bản sẽ lưu: đủ thẻ, có dấu kết thúc câu và các ô đã nhập - reviewer toàn quyền sửa nội dung
function fixChecks(draft) {
  const cs = draft.cs.trim();
  const vi = draft.vi.trim();
  return [
    { ok: /^\[(vi|en)\]/.test(cs) && cs.includes('[vi]') && cs.includes('[en]'), label: 'Câu Việt-Anh bắt đầu bằng thẻ và có đủ [vi], [en]' },
    { ok: vi.startsWith('[vi]') && !vi.includes('[en]'), label: 'Câu tiếng Việt bắt đầu bằng [vi] và không có [en]' },
    { ok: /[.?!]$/.test(cs) && /[.?!]$/.test(vi), label: 'Hai câu kết thúc bằng dấu . ! ?' },
    { ok: draft.pairs.length > 0 && draft.pairs.every((p) => p.source.trim() && p.target.trim()), label: 'Mỗi dòng nghĩa từ có đủ từ tiếng Anh và nghĩa tiếng Việt' },
  ];
}

// Bản sẽ lưu điền sẵn đúng dữ liệu API trả về (bản đề xuất, hoặc câu gốc nếu chỉ báo lỗi)
const newDraft = (it) => {
  const c = it.proposed || it.original;
  return { cs: c.cs_transcript, vi: c.vi_equivalent, pairs: toPairs(c.alignment) };
};

// Số từ khác nhau giữa bản gốc và bản đề xuất (câu Việt-Anh + câu Việt)
function countChanges(it) {
  if (!it.proposed) return 0;
  const [, csRight] = diffWords(it.original.cs_transcript, it.proposed.cs_transcript);
  const [, viRight] = diffWords(it.original.vi_equivalent, it.proposed.vi_equivalent);
  return [...csRight, ...viRight].filter((p) => p.changed && p.text.trim()).length;
}

export default function ReviewContribution() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [filter, setFilter] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(INITIAL_QUEUE[0]?.id ?? null);
  const [drafts, setDrafts] = useState({}); // bản sẽ lưu của từng câu có vấn đề, giữ lại khi chuyển qua lại giữa các câu

  const [rejectItem, setRejectItem] = useState(null); // form từ chối
  const [rejectCategory, setRejectCategory] = useState('grammar');
  const [rejectReason, setRejectReason] = useState('');

  const filteredQueue = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return queue.filter((it) => {
      if (filter !== 'all' && it.type !== filter) return false;
      if (filter === 'contribution' && filterCategory !== 'all' && it.category !== filterCategory) return false;
      const c = contentOf(it);
      return `${it.id} ${it.author} ${it.category || ''} ${it.reason || ''} ${c.cs_transcript} ${c.vi_equivalent}`.toLowerCase().includes(q);
    });
  }, [queue, filter, filterCategory, searchTerm]);

  const counts = {
    all: queue.length,
    contribution: queue.filter((it) => it.type === 'contribution').length,
    issue: queue.filter((it) => it.type === 'issue').length,
  };

  // Câu đang xem: câu đã chọn nếu còn trong danh sách lọc, không thì câu đầu tiên
  const selected = filteredQueue.find((it) => it.id === selectedId) || filteredQueue[0] || null;
  const draft = selected?.type === 'issue' ? drafts[selected.id] || newDraft(selected) : null;
  const checks = draft ? fixChecks(draft) : [];
  const canSave = checks.every((c) => c.ok);

  // Số câu đã xử lý trong phiên - cộng vào tiến độ của nhiệm vụ
  const [processed, setProcessed] = useState(0);
  const taskReviewed = Math.min(TASK.total, TASK.reviewedBefore + processed);
  const taskPercent = Math.round((taskReviewed / TASK.total) * 100);

  const updateDraft = (patch) => setDrafts((prev) => ({ ...prev, [selected.id]: { ...draft, ...patch } }));
  const updatePair = (i, key, value) => updateDraft({ pairs: draft.pairs.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)) });

  // Xử lý xong 1 câu: rời hàng chờ và tự chuyển sang câu tiếp theo trong danh sách đang lọc
  const finish = (id, message) => {
    const idx = filteredQueue.findIndex((it) => it.id === id);
    const next = filteredQueue[idx + 1] || filteredQueue[idx - 1] || null;
    setQueue((prev) => prev.filter((it) => it.id !== id));
    setSelectedId(next?.id ?? null);
    setProcessed((n) => n + 1);
    toast.success(message);
  };

  // TODO: gọi API duyệt câu đóng góp
  const handleApproveContribution = () => finish(selected.id, 'Đã duyệt câu đóng góp.');

  // TODO: gọi API duyệt câu có vấn đề, gửi phiên bản mới: { cs_transcript, vi_equivalent,
  // alignment: mỗi dòng draft.pairs dạng { source, source_lang: 'en', target, target_lang: 'vi', relation: 'semantic_equivalent' } }
  const handleSaveIssue = () => {
    if (!canSave) return;
    finish(selected.id, 'Đã duyệt và cập nhật câu.');
  };

  // TODO: gọi API từ chối
  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectItem) return;
    finish(rejectItem.id, 'Đã từ chối câu.');
    setRejectItem(null);
    setRejectReason('');
    setRejectCategory('grammar');
  };


  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 text-left font-sans">

      {/* Thanh nhiệm vụ - cùng cấu trúc với trang Kiểm duyệt ghi âm */}
      <div className="shrink-0 bg-white rounded-2xl border border-[#E5E2D8] px-3.5 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}1A` }}>
            <ClipboardCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          </div>
          <p className="text-xs font-bold text-[#16171C] whitespace-nowrap">{TASK.title}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
          <div className="flex-1 h-1.5 bg-[#F0EEE6] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${taskPercent}%`, background: ACCENT }} />
          </div>
          <span className="text-[11px] text-[#6E7078] whitespace-nowrap">
            <strong className="text-[#16171C]">{taskReviewed}</strong>/{TASK.total} đã xử lý
          </span>
        </div>
        <button
          onClick={() => navigate('/reviewer/task')}
          className="ml-auto text-[11px] font-semibold flex items-center gap-1.5 hover:underline shrink-0 whitespace-nowrap cursor-pointer"
          style={{ color: ACCENT }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Về danh sách nhiệm vụ
        </button>
      </div>

      <div className="flex-1 min-h-0 grid gap-2.5 lg:grid-cols-[minmax(280px,0.34fr)_minmax(0,0.66fr)]">
        {/* DANH SÁCH: lọc theo loại + tìm kiếm */}
        <section className="min-h-[300px] flex flex-col bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden" aria-label="Hàng chờ duyệt câu">
          <div className="shrink-0 p-3 border-b border-[#E5E2D8] space-y-2.5">
            <div className="flex flex-wrap gap-1.5" role="tablist">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.key)}
                    className="h-7 px-2.5 rounded-full border text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    style={active ? { background: ACCENT, borderColor: ACCENT, color: '#FFFFFF' } : { borderColor: '#E5E2D8', color: '#6E7078' }}
                  >
                    {f.label}
                    <span className="font-mono text-[10.5px]">{counts[f.key]}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#9A9CA3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo người gửi, lý do, nội dung..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E2D8] rounded-xl outline-none focus:border-[#818CF8] focus:ring-4 focus:ring-[#818CF8]/10 transition-all"
              />
            </div>
            {/* Lọc chủ đề chỉ có khi xem câu đóng góp - câu có vấn đề không có chủ đề */}
            {filter === 'contribution' && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-xs border border-[#E5E2D8] rounded-xl px-2.5 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
              >
                <option value="all">Tất cả chủ đề</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {filteredQueue.length > 0 ? filteredQueue.map((it) => {
              const isIssue = it.type === 'issue';
              const tag = isIssue ? ISSUE_KIND[it.kind] : { label: it.category, ...catStyle(it.category) };
              const changes = isIssue ? countChanges(it) : 0;
              const active = selected?.id === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setSelectedId(it.id)}
                  className={`mb-1.5 w-full rounded-xl border p-2.5 text-left transition-colors cursor-pointer ${active ? 'border-[#A9C6F5] bg-[#F2F7FF]' : 'border-transparent hover:border-[#E5E2D8] hover:bg-[#FBFAF7]'}`}
                >
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span className="h-5 px-1.5 rounded-md text-[10.5px] font-bold inline-flex items-center" style={{ background: tag.bg, color: tag.text }}>{tag.label}</span>
                    {isIssue && <span className="text-[10.5px] text-[#6E7078]">{it.reason}{changes > 0 && ` · ${changes} chỗ sửa`}</span>}
                  </span>
                  <p className="mt-1.5 text-[11.5px] font-mono text-[#16171C] truncate">{contentOf(it).cs_transcript}</p>
                  <p className="mt-1 text-[10.5px] text-[#9A9CA3]">{it.author} · <span className="font-mono">{it.time}</span></p>
                </button>
              );
            }) : (
              <p className="p-6 text-center text-xs text-[#9A9CA3]">Không có câu nào phù hợp.</p>
            )}
          </div>
        </section>

        {/* CHI TIẾT: thay đổi theo loại câu */}
        <section className="min-h-[420px] flex flex-col bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden" aria-label="Chi tiết câu">
          {selected ? <>
            <div className="shrink-0 px-4 py-3 border-b border-[#E5E2D8]">
              <p className="text-sm font-bold text-[#16171C]">
                {selected.type === 'issue' ? ISSUE_KIND[selected.kind].label : 'Đóng góp'}
              </p>
              <p className="text-[11.5px] text-[#6E7078]">
                {selected.author} · {selected.type === 'issue' ? `Lý do: ${selected.reason}` : selected.category}
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
              {selected.type === 'contribution' ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-[#16171C] mb-2">Nội dung</p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2.5"><InlineLabel variant="cs" /><p className="text-[13px] font-mono text-[#16171C] leading-snug break-words min-w-0">{selected.cs_transcript}</p></div>
                      <div className="flex items-start gap-2.5"><InlineLabel variant="vi" /><p className="text-[13px] font-mono text-[#16171C] leading-snug break-words min-w-0">{selected.vi_equivalent}</p></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#16171C] mb-2">Nghĩa từ</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.alignment.map((a, i) => (
                        <span key={i} className="h-6 flex items-center gap-1.5 bg-[#F4F3EE] rounded-md px-2">
                          <span className="text-[11px] font-bold font-mono" style={{ color: ACCENT }}>{a.source}</span>
                          <ArrowRight className="w-3 h-3 text-[#B7B4A9] shrink-0" />
                          <span className="text-[11.5px] font-medium text-[#16171C]">{a.target}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Bảng gộp: cột trái là bản gốc (chỉ xem), cột phải là bản sẽ lưu (sửa trực tiếp) */}
                  <div>
                    <p className="text-xs font-bold text-[#16171C] mb-2">So sánh</p>
                    <div className="rounded-xl border border-[#E5E2D8] overflow-hidden text-[12px]">
                      <div className="grid grid-cols-[56px_1fr_1fr] bg-[#F7F5EF] text-[10.5px] font-bold text-[#9A9CA3]">
                        <span className="px-2.5 py-1.5" />
                        <span className="px-2.5 py-1.5">{selected.proposed ? 'Bản gốc trong kho' : 'Câu hiện tại trong kho'}</span>
                        <span className="px-2.5 py-1.5">
                          {selected.proposed ? 'Bản đề xuất' : 'Bản sửa'} <span className="font-normal">· {selected.proposed ? 'sửa được trước khi duyệt' : 'speaker chỉ báo lỗi, hãy sửa lại câu'}</span>
                        </span>
                      </div>
                      {/* Câu Việt-Anh */}
                      <div className="grid grid-cols-[56px_1fr_1fr] border-t border-[#F0EEE6]">
                        <span className="px-2.5 py-2"><InlineLabel variant="cs" /></span>
                        <p className="px-2.5 py-2 font-mono leading-5 text-[#6E7078] break-words min-w-0">{selected.original.cs_transcript}</p>
                        <div className="px-2 py-1.5 min-w-0">
                          <textarea
                            rows={2}
                            value={draft.cs}
                            onChange={(e) => updateDraft({ cs: e.target.value })}
                            aria-label="Câu Việt-Anh sẽ lưu"
                            className="w-full field-sizing-content min-h-[50px] text-[12px] leading-5 font-mono text-[#16171C] border border-[#E5E2D8] rounded-lg px-2 py-1 outline-none resize-none focus:border-[#3FA66B] focus:ring-4 focus:ring-[#3FA66B]/10 transition-all"
                          />
                        </div>
                      </div>
                      {/* Câu tiếng Việt */}
                      <div className="grid grid-cols-[56px_1fr_1fr] border-t border-[#F0EEE6]">
                        <span className="px-2.5 py-2"><InlineLabel variant="vi" /></span>
                        <p className="px-2.5 py-2 font-mono leading-5 text-[#6E7078] break-words min-w-0">{selected.original.vi_equivalent}</p>
                        <div className="px-2 py-1.5 min-w-0">
                          <textarea
                            rows={2}
                            value={draft.vi}
                            onChange={(e) => updateDraft({ vi: e.target.value })}
                            aria-label="Câu tiếng Việt sẽ lưu"
                            className="w-full field-sizing-content min-h-[50px] text-[12px] leading-5 font-mono text-[#16171C] border border-[#E5E2D8] rounded-lg px-2 py-1 outline-none resize-none focus:border-[#3FA66B] focus:ring-4 focus:ring-[#3FA66B]/10 transition-all"
                          />
                        </div>
                      </div>
                      {/* Nghĩa từ tiếng Anh - mỗi từ 1 dòng, bản gốc bên trái, ô sửa bên phải */}
                      <div className="px-2.5 py-1.5 border-t border-[#F0EEE6] bg-[#F7F5EF] flex items-center justify-between">
                        <p className="text-[10.5px] font-bold text-[#9A9CA3]">
                          Nghĩa tiếng Việt của các từ tiếng Anh <span className="font-normal">· tối đa {MAX_EN_WORDS} từ</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => updateDraft({ pairs: [...draft.pairs, { source: '', target: '' }] })}
                          disabled={draft.pairs.length >= MAX_EN_WORDS}
                          className="flex items-center gap-1 text-[11px] font-bold hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                          style={{ color: ACCENT }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm từ
                        </button>
                      </div>
                      <div className="py-1">
                        {Array.from({ length: Math.max(selected.original.alignment.length, draft.pairs.length) }, (_, i) => {
                          const old = selected.original.alignment[i];
                          const pair = draft.pairs[i];
                          return (
                            <div key={i} className="grid grid-cols-[56px_1fr_1fr] items-center">
                              <span />
                              <p className="px-2.5 py-1 text-[#6E7078] min-w-0 truncate">
                                {old && <><span className="font-mono">{old.source}</span> <ArrowRight className="inline w-3 h-3 text-[#B7B4A9]" /> {old.target}</>}
                              </p>
                              {pair ? (
                                <div className="px-2 py-1 grid grid-cols-[1fr_12px_1.3fr_24px] gap-1.5 items-center min-w-0">
                                  <input
                                    type="text"
                                    value={pair.source}
                                    onChange={(e) => updatePair(i, 'source', e.target.value)}
                                    placeholder="Từ tiếng Anh"
                                    aria-label={`Từ tiếng Anh ${i + 1}`}
                                    className={`h-7 px-2 rounded-md border text-[12px] font-mono font-bold outline-none focus:border-[#3FA66B] focus:ring-4 focus:ring-[#3FA66B]/10 transition-all min-w-0 ${pair.source.trim() ? 'border-[#E5E2D8]' : 'border-[#E0564F]'}`}
                                    style={{ color: ACCENT }}
                                  />
                                  <ArrowRight className="w-3 h-3 text-[#B7B4A9]" />
                                  <input
                                    type="text"
                                    value={pair.target}
                                    onChange={(e) => updatePair(i, 'target', e.target.value)}
                                    placeholder="Nghĩa tiếng Việt"
                                    aria-label={`Nghĩa tiếng Việt ${i + 1}`}
                                    className={`h-7 px-2 rounded-md border text-[12px] outline-none focus:border-[#3FA66B] focus:ring-4 focus:ring-[#3FA66B]/10 transition-all min-w-0 ${pair.target.trim() ? 'border-[#E5E2D8]' : 'border-[#E0564F]'}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateDraft({ pairs: draft.pairs.filter((_, idx) => idx !== i) })}
                                    aria-label="Xoá dòng"
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:bg-[#FDEAEA] hover:text-[#C63B3B] transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : <span />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Kiểm tra - luôn hiện đủ các mục: đạt tick xanh, chưa đạt dấu x đỏ */}
                  <ul className="space-y-1">
                    {checks.map((c) => (
                      <li key={c.label} className={`flex items-center gap-1.5 text-[11.5px] font-medium ${c.ok ? 'text-[#1F5C3F]' : 'text-[#C63B3B]'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? 'bg-[#3FA66B]' : 'bg-[#E0564F]'}`}>
                          {c.ok ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} /> : <X className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                        </span>
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Hành động - Duyệt / Từ chối cạnh nhau, cùng kiểu với trang Kiểm duyệt ghi âm */}
            <div className="shrink-0 px-4 py-2.5 border-t border-[#E5E2D8] flex items-center justify-end gap-1.5">
              <button
                onClick={selected.type === 'issue' ? handleSaveIssue : handleApproveContribution}
                disabled={selected.type === 'issue' && !canSave}
                className="h-[30px] px-3 bg-[#EAF7EF] border border-[#C5E8D3] text-[#1F5C3F] rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#DCF0E5] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
              </button>
              <button
                onClick={() => setRejectItem(selected)}
                className="h-[30px] px-3 bg-[#FDEAEA] border border-[#F3C9C9] text-[#C63B3B] rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#FBDADA] transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Từ chối
              </button>
            </div>
          </> : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6">
              <CheckCircle2 className="w-9 h-9 text-[#3FA66B]" />
              <p className="font-bold text-[#16171C] text-sm">Tuyệt vời! Bạn đã xử lý hết câu trong mục này.</p>
              <p className="text-[#9A9CA3] text-xs">Các câu đã thao tác sẽ được ghi nhận tại mục Lịch sử kiểm duyệt.</p>
            </div>
          )}
        </section>
      </div>

      {/* MODAL TỪ CHỐI */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)] max-h-[90vh] flex flex-col">
            <div className="h-1.5 w-full bg-[#C63B3B] shrink-0" />
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FDEAEA] flex-shrink-0">
                    <AlertTriangle className="w-[18px] h-[18px] text-[#C63B3B]" />
                  </div>
                  <span className="text-[15px] font-bold text-[#16171C]">Từ chối câu · {rejectItem.author}</span>
                </div>
                <button onClick={() => setRejectItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>

              {/* Câu đang xét - cả 2 câu thô, để reviewer nhớ lại ngữ cảnh khi viết lý do */}
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-2.5 flex items-center gap-2.5">
                <InlineLabel variant="cs" />
                <p className="text-[12.5px] font-mono text-[#16171C] leading-relaxed break-words min-w-0">{contentOf(rejectItem).cs_transcript}</p>
              </div>
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <InlineLabel variant="vi" />
                <p className="text-[12.5px] font-mono text-[#16171C] leading-relaxed break-words min-w-0">{contentOf(rejectItem).vi_equivalent}</p>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">Loại lỗi kiểm duyệt</label>
                  <select
                    value={rejectCategory}
                    onChange={(e) => setRejectCategory(e.target.value)}
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-2.5 bg-white text-[#16171C] font-medium outline-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  >
                    <option value="grammar">Sai ngữ pháp / cấu trúc câu</option>
                    <option value="label">Gắn nhãn [vi]/[en] sai hoặc thiếu</option>
                    <option value="alignment">Nghĩa từ tiếng Anh không đúng</option>
                    <option value="abbr">Viết tắt / từ mượn không hợp lệ</option>
                    <option value="context">Thiếu ngữ cảnh / nghĩa không rõ</option>
                    <option value="other">Lỗi khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">Mô tả lý do từ chối chi tiết</label>
                  <textarea
                    required rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Từ 'check-in' chưa gắn nhãn [en]..."
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-3 outline-none resize-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setRejectItem(null)} className="flex-1 py-2.5 border border-[#E5E2D8] text-[#55565B] rounded-xl text-xs font-bold hover:bg-[#F7F5EF] transition-colors">
                    Hủy bỏ
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#C63B3B] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                    Xác nhận từ chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
