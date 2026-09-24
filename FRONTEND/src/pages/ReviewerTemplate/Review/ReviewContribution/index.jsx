import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Search, FolderKanban, X, AlertTriangle, ArrowRight, ArrowLeft, ClipboardCheck } from 'lucide-react';
import Pagination from '../../../../components/Pagination/Pagination';
import { parseCodeSwitch, stripTags } from '../../../../components/CodeSwitchText/CodeSwitchText';
import { REVIEWER_ACCENT as ACCENT } from '../../../../constants/theme';
import { PROPOSAL_TASK as TASK, CONTRIBUTION_QUEUE, REPORT_QUEUE as INITIAL_REPORTS } from '../../../../mocks/reviewer/proposals';

const CATEGORIES = ['Hội thoại hàng ngày', 'Công nghệ thông tin', 'Giáo dục'];

// Màu phân loại (bộ A) - xanh dương / hổ phách / hồng magenta, tránh màu status
const CATEGORY_COLORS = {
  'Hội thoại hàng ngày': { bg: '#E6F0FE', text: '#1E40AF', border: '#C9DEFB' },
  'Công nghệ thông tin': { bg: '#FBF0DA', text: '#92600A', border: '#F3E0B5' },
  'Giáo dục': { bg: '#FCE7F0', text: '#9D2662', border: '#F8CFE0' },
};
const catStyle = (cat) => CATEGORY_COLORS[cat] || { bg: '#F7F5EF', text: '#6E7078', border: '#E5E2D8' };

// Nhãn pill (VI-EN / VI) đứng đầu mỗi câu - đồng bộ với InlineLabel bên trang Kiểm duyệt ghi âm.
// cs (câu có xen [vi]/[en]) dùng ACCENT, vi (câu thuần Việt) dùng xám trung tính.
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

// Trang "Đề xuất câu" chia 2 tab: Câu đóng góp / Câu báo lỗi.
// Muốn tạm khoá 1 tab thì đặt disabled: true (tab sẽ hiện nhãn "Sắp có").
const TABS = [
  { key: 'contribution', label: 'Câu đóng góp', color: ACCENT, disabled: false },
  { key: 'report', label: 'Câu báo lỗi', color: '#C0442B', disabled: false },
];

/** Câu Việt-Anh hiển thị sạch: bỏ thẻ [vi]/[en], đoạn tiếng Anh tô màu accent. */
function CodeSwitchSentence({ transcript }) {
  return parseCodeSwitch(transcript).map((seg, i) =>
    seg.lang === 'en'
      ? <span key={i} className="font-bold" style={{ color: ACCENT }}>{seg.text}</span>
      : <span key={i}>{seg.text}</span>
  );
}

export default function ReviewContribution() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('contribution');
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [filterCategory, setFilterCategory] = useState('all');

  const [selectedItem, setSelectedItem] = useState(null); // form từ chối
  const [rejectCategory, setRejectCategory] = useState('grammar');
  const [rejectReason, setRejectReason] = useState('');

  // Số hàng mỗi trang tự tính theo chiều cao vùng danh sách -> cả trang luôn vừa 1 màn hình, không cuộn
  const listRef = useRef(null);
  const [pageSize, setPageSize] = useState(4);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const fit = () => {
      // Đo chiều cao tự nhiên của 1 hàng (không tính phần giãn thêm khi trang đầy)
      const row = el.firstElementChild;
      // Chiều cao tự nhiên của hàng = phần nội dung cao nhất trong các cột (đo từ phần tử con đầu tới cuối,
      // vì cột thông tin bị kéo giãn theo hàng) + đệm trên dưới py-3 (24px) + viền ngăn cách 1px
      const contentH = (col) => {
        const first = col.firstElementChild;
        const last = col.lastElementChild;
        return first ? last.getBoundingClientRect().bottom - first.getBoundingClientRect().top : col.offsetHeight;
      };
      const rowH = row ? Math.max(...[...row.children].map(contentH)) + 25 : 120;
      setPageSize(Math.max(1, Math.floor(el.clientHeight / rowH)));
    };
    // Đo sau khi trình duyệt vẽ xong khung hình (bố cục đã ổn định), và đo lại khi font chữ tải xong
    // vì font dự phòng rộng hơn làm câu xuống dòng -> hàng cao hơn thực tế
    let frame = 0;
    const scheduleFit = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
    const ro = new ResizeObserver(scheduleFit);
    ro.observe(el);
    scheduleFit();
    document.fonts?.ready.then(scheduleFit);
    return () => { ro.disconnect(); cancelAnimationFrame(frame); };
  }, [activeTab]); // đổi tab thì đo lại vì chiều cao hàng 2 tab khác nhau

  const [activeQueue, setActiveQueue] = useState(CONTRIBUTION_QUEUE);

  const filteredQueue = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (activeTab === 'report') {
      return reports.filter((r) =>
        `${r.id} ${r.author} ${r.reason} ${r.cs_transcript} ${r.vi_equivalent}`.toLowerCase().includes(q),
      );
    }
    return activeQueue.filter((it) => {
      const matchSearch = it.id.toLowerCase().includes(q) ||
        it.cs_transcript.toLowerCase().includes(q) ||
        it.vi_equivalent.toLowerCase().includes(q) ||
        it.author.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || it.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [activeTab, reports, activeQueue, searchTerm, filterCategory]);

  const totalPages = Math.ceil(filteredQueue.length / pageSize) || 1;
  // Màn hình đổi cỡ làm số trang giảm -> kéo trang hiện tại về trang cuối hợp lệ
  const page = Math.min(currentPage, totalPages);
  const paginatedQueue = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, page, pageSize]);

  // Số câu đã xử lý trong phiên (cả 2 tab) - cộng vào tiến độ của nhiệm vụ chung
  const [processed, setProcessed] = useState(0);
  const markProcessed = () => setProcessed((n) => n + 1);
  const taskReviewed = Math.min(TASK.total, TASK.reviewedBefore + processed);
  const taskPercent = Math.round((taskReviewed / TASK.total) * 100);
  const tabCounts = { contribution: activeQueue.length, report: reports.length };

  const switchTab = (key) => { setActiveTab(key); setCurrentPage(1); setSearchTerm(''); };

  // Duyệt / từ chối xong thì câu rời hàng đợi của tab đang mở
  // TODO: gọi API duyệt / từ chối câu đóng góp hoặc câu báo lỗi
  const removeFromActiveTab = (id) => {
    const setQueue = activeTab === 'report' ? setReports : setActiveQueue;
    setQueue((prev) => prev.filter((it) => it.id !== id));
    markProcessed();
  };

  const handleApprove = (id) => removeFromActiveTab(id);

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    removeFromActiveTab(selectedItem.id);
    setSelectedItem(null);
    setRejectReason('');
    setRejectCategory('grammar');
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 text-left font-sans">

      {/* Thanh nhiệm vụ + bộ lọc - cùng cấu trúc với trang Kiểm duyệt ghi âm */}
      <div className="shrink-0 bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
        <div className="px-3.5 py-2.5 flex items-center gap-4">
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

        {/* Tab dạng gạch chân + tìm kiếm + lọc chủ đề */}
        <div className="px-3.5 flex flex-col md:flex-row md:items-end gap-2.5 border-t border-[#F0EEE6]">
          <div role="tablist" className="flex items-end gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  disabled={tab.disabled}
                  onClick={() => switchTab(tab.key)}
                  className={`h-11 px-3 flex items-center gap-2 text-[13px] font-bold border-b-2 -mb-px transition-colors ${tab.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    color: tab.disabled ? '#B7B4A9' : active ? tab.color : '#6E7078',
                    borderBottomColor: active ? tab.color : 'transparent',
                  }}
                  title={tab.disabled ? 'Tạm thời chưa mở' : undefined}
                >
                  {tab.label}
                  {tab.disabled ? (
                    <span className="h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold flex items-center bg-[#F0EEE6] text-[#A3A6AE]">Sắp có</span>
                  ) : (
                    <span
                      className="h-[18px] min-w-5 px-1.5 rounded-full text-[10.5px] font-mono font-semibold flex items-center justify-center"
                      style={active ? { background: tab.color, color: '#FFFFFF' } : { background: '#F0EEE6', color: '#6E7078' }}
                    >
                      {tabCounts[tab.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="md:ml-auto flex flex-col md:flex-row md:items-center gap-2.5 py-2">
            <div className="relative w-full md:w-[280px]">
              <Search className="w-4 h-4 text-[#9A9CA3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={activeTab === 'report' ? 'Tìm theo người báo lỗi, lý do, nội dung...' : 'Tìm theo người đóng góp, nội dung...'}
                className="w-full pl-9 pr-4 py-2 text-[13px] leading-4 border border-[#E5E2D8] rounded-xl outline-none focus:border-[#818CF8] focus:ring-4 focus:ring-[#818CF8]/10 transition-all"
              />
            </div>
            {/* Lọc chủ đề chỉ có ở tab đóng góp - câu báo lỗi không có chủ đề */}
            {activeTab === 'contribution' && (
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#9A9CA3]" />
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="text-xs leading-4 border border-[#E5E2D8] rounded-xl px-2.5 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
              >
                <option value="all">Tất cả chủ đề</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách câu đóng góp - hàng liền nhau, cột thông tin bên trái tách khỏi câu, câu hiển thị sạch (không thẻ [vi]/[en]) */}
      {paginatedQueue.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
          <div ref={listRef} className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {paginatedQueue.map((it, idx) => {
            // Hàng luôn cao theo nội dung (không giãn) để 2 tab có khoảng cách giống hệt nhau.
            // Mọi hàng đều có đường kẻ dưới (kể cả hàng cuối) để phân cách rõ với phần trống / phân trang
            const rowCls = 'px-4 py-3 grid grid-cols-[20px_160px_minmax(0,1fr)_auto] items-center gap-4 border-b border-[#F0EEE6]';
            const rowNo = (page - 1) * pageSize + idx + 1;

            // Tag bên trái: câu báo lỗi dùng lý do báo lỗi, câu đóng góp dùng chủ đề
            const isReport = activeTab === 'report';
            const tag = isReport
              ? { label: it.reason, bg: '#FFF4E5', text: '#8B5E0F' }
              : { label: it.category, ...catStyle(it.category) };
            return (
              <div key={it.id} className={rowCls}>
                <span className="text-[11px] text-[#9A9CA3] font-mono self-start pt-0.5">{rowNo}</span>

                {/* Cột thông tin: chủ đề + người đóng góp + thời gian, tách khỏi phần câu */}
                <div className="flex flex-col items-start gap-1.5 pr-3 border-r border-[#F0EEE6] self-stretch justify-center">
                  <span className="h-[22px] px-2 rounded-md text-[11px] font-bold inline-flex items-center" style={{ background: tag.bg, color: tag.text }}>
                    {tag.label}
                  </span>
                  <span className="text-xs font-semibold text-[#16171C]">{it.author}</span>
                  <span className="text-[11px] text-[#9A9CA3] font-mono">{it.time}</span>
                </div>

                {/* Cột câu: hai câu cùng cỡ và độ đậm, nghĩa từ bên dưới */}
                <div className="min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <InlineLabel variant="cs" />
                    <p className="text-[14px] font-medium text-[#16171C] leading-snug min-w-0">
                      <CodeSwitchSentence transcript={it.cs_transcript} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <InlineLabel variant="vi" />
                    <p className="text-[14px] font-medium text-[#16171C] leading-snug min-w-0">{stripTags(it.vi_equivalent)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-[46px] pt-0.5">
                    {it.alignment.map((a, i) => (
                      <span key={i} className="h-6 flex items-center gap-1.5 bg-[#F4F3EE] rounded-md px-2">
                        <span className="text-[11px] font-bold font-mono" style={{ color: ACCENT }}>{a.source}</span>
                        <ArrowRight className="w-3 h-3 text-[#B7B4A9] shrink-0" />
                        <span className="text-[11.5px] font-medium text-[#16171C]">{a.target}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleApprove(it.id)}
                    className="h-[30px] px-3 bg-[#EAF7EF] border border-[#C5E8D3] text-[#1F5C3F] rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#DCF0E5] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => setSelectedItem(it)}
                    className="h-[30px] px-3 bg-[#FDEAEA] border border-[#F3C9C9] text-[#C63B3B] rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#FBDADA] transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </div>
              </div>
            );
          })}
          </div>

          <div className="shrink-0 px-3">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} accent={ACCENT} />
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-white rounded-2xl border border-[#E5E2D8] py-14 text-center">
          <p className="font-bold text-[#16171C] text-sm">
            {activeTab === 'report' ? 'Tuyệt vời! Bạn đã xử lý hết câu báo lỗi.' : 'Tuyệt vời! Bạn đã xử lý hết câu đóng góp chờ duyệt.'}
          </p>
          <p className="text-[#9A9CA3] text-xs mt-1">Các câu đã thao tác sẽ được ghi nhận tại mục Lịch sử kiểm duyệt.</p>
        </div>
      )}

      {/* MODAL TỪ CHỐI */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)] max-h-[90vh] flex flex-col">
            <div className="h-1.5 w-full bg-[#C63B3B] shrink-0" />
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FDEAEA] flex-shrink-0">
                    <AlertTriangle className="w-[18px] h-[18px] text-[#C63B3B]" />
                  </div>
                  <span className="text-[15px] font-bold text-[#16171C]">Từ chối câu · {selectedItem.author}</span>
                </div>
                <button onClick={() => setSelectedItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>

              {/* Câu đang xét - cả 2 câu, cùng nhãn pill VI-EN/VI để reviewer nhớ lại ngữ cảnh khi viết lý do */}
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-2.5 flex items-center gap-2.5">
                <InlineLabel variant="cs" />
                <p className="text-[12.5px] text-[#16171C] leading-relaxed break-words min-w-0">
                  <CodeSwitchSentence transcript={selectedItem.cs_transcript} />
                </p>
              </div>
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <InlineLabel variant="vi" />
                <p className="text-[12.5px] text-[#16171C] leading-relaxed break-words min-w-0">{stripTags(selectedItem.vi_equivalent)}</p>
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
                  <button type="button" onClick={() => setSelectedItem(null)} className="flex-1 py-2.5 border border-[#E5E2D8] text-[#55565B] rounded-xl text-xs font-bold hover:bg-[#F7F5EF] transition-colors">
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