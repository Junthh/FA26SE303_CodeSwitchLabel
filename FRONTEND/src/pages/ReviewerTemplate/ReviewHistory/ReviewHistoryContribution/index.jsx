import { useState, useMemo } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import useFitPageSize from "../../../../hooks/useFitPageSize";
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, Eye, X, BarChart3, ArrowRight } from "lucide-react";
import { REVIEWER_ACCENT as ACCENT } from "../../../../constants/theme";
import { REVIEWED_PROPOSALS as TEXT_HISTORY } from "../../../../mocks/reviewer/history";

// 3 reviewer -> trạng thái tổng: >=2 từ chối = Rejected, >=2 duyệt = Approved, còn lại Pending.
// Giống hệt logic bên Lịch sử Ghi âm - đóng góp câu giờ cũng do 3 người kiểm duyệt.
function resolveStatus(reviews) {
  const rejected = reviews.filter((r) => r.decision === "reject").length;
  const approved = reviews.filter((r) => r.decision === "approve").length;
  if (rejected >= 2) return "Rejected";
  if (approved >= 2) return "Approved";
  return "Pending";
}

// Số phiếu THỰC SỰ đã bỏ (approve/reject) - loại cả "pending" (chưa tới lượt) lẫn
// "not_needed" (R1+R2 đã đồng thuận nên R3 không cần đánh giá nữa).
function votedCountOf(reviews) {
  return reviews.filter((r) => r.decision === "approve" || r.decision === "reject").length;
}

function InlineLabel({ variant }) {
  return (
    <span className="text-[9px] font-bold w-9 h-[18px] text-center shrink-0 rounded-md inline-flex items-center justify-center text-white" style={{ background: variant === "cs" ? ACCENT : "#8B8D95", letterSpacing: "0.02em" }}>
      {variant === "cs" ? "VI-EN" : "VI"}
    </span>
  );
}

// Màu phân loại (bộ A) - xanh dương / hổ phách / hồng magenta
const CATEGORY_COLORS = {
  "Hội thoại hàng ngày": { bg: "#E6F0FE", text: "#1E40AF", border: "#C9DEFB" },
  "Công nghệ thông tin": { bg: "#FBF0DA", text: "#92600A", border: "#F3E0B5" },
  "Giáo dục": { bg: "#FCE7F0", text: "#9D2662", border: "#F8CFE0" },
};
const catStyle = (c) => CATEGORY_COLORS[c] || { bg: "#F7F5EF", text: "#6E7078", border: "#E5E2D8" };

function StatCard({ icon: Icon, label, value, pct, accent, bg }) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)]">
      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#6E7078]">{label}</p>
        <p className="text-[17px] font-bold text-[#16171C] font-mono leading-tight">
          {value}
          {pct !== undefined && <span className="text-[11px] font-semibold ml-1" style={{ color: accent }}>{pct}%</span>}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case "Approved":
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#3FA66B]/10 text-[#1F5C3F] border border-[#3FA66B]/25 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5 text-[#3FA66B]" /> Đã duyệt</span>;
    case "Rejected":
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FDEAEA] text-[#C63B3B] border border-[#F3C9C9] whitespace-nowrap"><XCircle className="w-3.5 h-3.5 text-[#C63B3B]" /> Từ chối</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF1DE] text-[#A85E12] border border-[#F5DFC0] whitespace-nowrap"><Clock className="w-3.5 h-3.5 text-[#A85E12]" /> Chờ duyệt</span>;
  }
}

// Nút "Phản hồi" - giống hệt bên Lịch sử Ghi âm: hiện đúng số phiếu ĐÃ BỎ / 3, màu khớp trạng thái
// cùng dòng (xanh lá/Approved, đỏ/Rejected, cam/Pending).
function FeedbackButton({ status, votedCount, onClick, ariaLabel }) {
  const styles = {
    Approved: { bg: "#EAF7EF", border: "rgba(63,166,107,0.25)", text: "#1F5C3F" },
    Rejected: { bg: "#FDEAEA", border: "#F3C9C9", text: "#C63B3B" },
    Pending: { bg: "#FFF1DE", border: "#F5DFC0", text: "#A85E12" },
  }[status];
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap hover:opacity-80"
      style={{ background: styles.bg, borderColor: styles.border, color: styles.text }}
    >
      <Eye className="w-3.5 h-3.5 shrink-0" />
      <span>{votedCount}/3 vote</span>
    </button>
  );
}

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Pending", label: "Chờ duyệt" },
];

export default function ReviewHistoryContribution() {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  // Popup nhẹ - chỉ xem 2 câu (Việt-Anh + Việt) đầy đủ, mở từ icon con mắt cạnh nội dung.
  const [sentenceItem, setSentenceItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const withStatus = useMemo(() => TEXT_HISTORY.map((it) => ({ ...it, status: resolveStatus(it.reviews) })), []);

  const stats = useMemo(() => {
    const total = withStatus.length;
    const approved = withStatus.filter((i) => i.status === "Approved").length;
    const rejected = withStatus.filter((i) => i.status === "Rejected").length;
    const pending = withStatus.filter((i) => i.status === "Pending").length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    return { total, approved, rejected, pending, approvedPct: pct(approved), rejectedPct: pct(rejected), pendingPct: pct(pending) };
  }, [withStatus]);

  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    return withStatus.filter((item) =>
      (statusFilter === "all" || item.status === statusFilter) &&
      (categoryFilter === "all" || item.category === categoryFilter) &&
      [item.author, item.cs_transcript, item.vi_equivalent].some((text) => text.toLocaleLowerCase("vi").includes(query))
    );
  }, [withStatus, statusFilter, categoryFilter, searchTerm]);
  // Số dòng mỗi trang tự tính theo chiều cao bảng -> trang vừa 1 màn hình, không cuộn
  const [listRef, itemsPerPage] = useFitPageSize(10, [filteredData.length > 0], "tbody > tr");
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const pageItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="-mt-2 h-full min-h-0 flex flex-col gap-3 text-left">

      {/* THẺ THỐNG KÊ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard icon={BarChart3} label="Tổng đã xử lý" value={stats.total} accent="#16171C" bg="#F0EEE6" />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} pct={stats.approvedPct} accent="#3FA66B" bg="#EAF7EF" />
        <StatCard icon={XCircle} label="Từ chối" value={stats.rejected} pct={stats.rejectedPct} accent="#C63B3B" bg="#FDEAEA" />
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} pct={stats.pendingPct} accent="#A85E12" bg="#FFF1DE" />
      </div>

      {/* BẢNG */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#F0EEE6]">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9CA3]" />
              <input aria-label="Tìm câu đóng góp" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Tìm người đóng góp, nội dung..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5E2D8] text-[13px] leading-4 focus:outline-none focus:border-blue-500" />
            </div>
            <select aria-label="Lọc phân loại" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setCurrentPage(1); }} className="min-w-0 rounded-lg border border-[#E5E2D8] px-3 py-2 bg-white text-xs text-[#16171C]">
              <option value="all">Tất cả phân loại</option>
              {[...new Set(TEXT_HISTORY.map((item) => item.category))].map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select aria-label="Lọc trạng thái" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} className="rounded-lg border border-[#E5E2D8] px-3 py-2 bg-white text-xs text-[#16171C]">
              {FILTER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.value === "all" ? "Tất cả trạng thái" : option.label}</option>)}
            </select>
          </div>
        </div>

        {/* Chiều cao mỗi dòng CỐ ĐỊNH như nhau, không có accordion/expand - nên không bao giờ vỡ layout
            1 màn hình. Câu (2 dòng, line-clamp) + loại lỗi/tóm tắt lý do (nếu từ chối) luôn hiện sẵn
            trong dòng, không cần bấm gì mới thấy. Nghĩa từng từ tiếng Anh + lý do đầy đủ + breakdown
            3 reviewer chỉ có trong popup (icon con mắt) - vì đó là lớp phủ, không cộng thêm chiều cao trang. */}
        <div ref={listRef} className="relative flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[1200px] border-collapse table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[33%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#F7F5EF] text-[11px] uppercase tracking-wider text-[#9A9CA3] border-b border-[#E5E2D8] font-bold">
                <th className="py-2.5 px-3 text-center">STT</th>
                <th className="py-2.5 px-3 text-left">Người đóng góp</th>
                <th className="py-2.5 px-3 text-left">Phân loại</th>
                <th className="py-2.5 px-3 text-left">Thời gian</th>
                <th className="py-2.5 px-3 text-left">Nội dung</th>
                <th className="py-2.5 px-3 text-left">Trạng thái</th>
                <th className="py-2.5 px-3 text-left">Phản hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-[#9A9CA3] text-sm">Không có mục nào phù hợp bộ lọc.</td></tr>
              ) : pageItems.map((item, idx) => {
                const votedCount = votedCountOf(item.reviews);
                return (
                  <tr key={item.id} className="hover:bg-[#F7F5EF]/70 transition-colors h-14">
                    <td className="px-3 text-center"><span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</span></td>
                    <td className="px-3 text-left"><p className="font-semibold text-[#16171C]">{item.author}</p></td>
                    <td className="px-3 text-left"><span className="px-2.5 py-1 rounded-md text-[11px] font-semibold border" style={{ background: catStyle(item.category).bg, color: catStyle(item.category).text, borderColor: catStyle(item.category).border }}>{item.category}</span></td>
                    <td className="px-3 text-left"><span className="text-[#6E7078] font-mono text-[11px]">{item.date}</span></td>
                    <td className="px-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#16171C] truncate leading-5">{item.cs_transcript}</p>
                          <p className="font-semibold text-[#16171C] truncate leading-5 mt-0.5">
                            {item.vi_equivalent}
                          </p>
                        </div>
                        {/* Icon con mắt - LUÔN hiện dù câu ngắn hay dài, mở popup nhẹ chỉ xem 2 câu đầy đủ */}
                        <button onClick={() => setSentenceItem(item)} aria-label={`Xem đầy đủ hai câu của ${item.author}, ${item.id}`} title="Xem đầy đủ hai câu" className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors cursor-pointer">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 text-left"><StatusBadge status={item.status} /></td>
                    <td className="px-3 text-left">
                      <FeedbackButton
                        status={item.status}
                        votedCount={votedCount}
                        onClick={() => setDetailItem(item)}
                        ariaLabel={`Xem phản hồi cho ${item.author}, ${item.id}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-3 border-t border-[#E5E2D8] bg-white shrink-0">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} accent={ACCENT} />
        </div>
      </div>

      {/* POPUP CÂU VĂN - hai câu và nghĩa từ tiếng Anh */}
      {sentenceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setSentenceItem(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 w-full shrink-0" style={{ background: ACCENT }} />
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[16px] font-bold text-[#16171C]">{sentenceItem.author}</span>
                <button onClick={() => setSentenceItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0 cursor-pointer">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>
              <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-2.5 flex items-center gap-2.5">
                <InlineLabel variant="cs" />
                <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{sentenceItem.cs_transcript}</p>
              </div>
              <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] flex items-center gap-2.5">
                <InlineLabel variant="vi" />
                <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{sentenceItem.vi_equivalent}</p>
              </div>
              {sentenceItem.alignment.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-2">Nghĩa từ tiếng Anh</p>
                  <div className="flex flex-wrap gap-2">
                    {sentenceItem.alignment.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-[#F0EEE6] border border-[#E5E2D8] rounded-lg px-2.5 py-1.5">
                        <span className="text-[11.5px] font-bold font-mono" style={{ color: ACCENT }}>{a.source}</span>
                        <ArrowRight className="w-3 h-3 text-[#B7B4A9] shrink-0" />
                        <span className="text-[11.5px] font-semibold text-[#16171C]">{a.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSentenceItem(null)} className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer" style={{ background: ACCENT }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT - 3 reviewer, câu Việt-Anh + câu Việt + nghĩa từng từ - không cộng chiều cao
          vào trang (overlay) nên bảng phía sau vẫn giữ nguyên chiều cao cố định. */}
      {detailItem && (() => {
        const ResultIcon = detailItem.status === "Approved" ? CheckCircle2 : detailItem.status === "Rejected" ? AlertCircle : Clock;
        const accent = detailItem.status === "Rejected" ? "#C63B3B" : detailItem.status === "Approved" ? "#3FA66B" : "#A85E12";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setDetailItem(null)}>
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="h-1.5 w-full shrink-0" style={{ background: accent }} />
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${accent}1A` }}>
                      <ResultIcon className="w-[18px] h-[18px]" style={{ color: accent }} />
                    </div>
                    <span className="text-[16px] font-bold text-[#16171C]">Kết quả kiểm duyệt</span>
                  </div>
                  <button onClick={() => setDetailItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                    <X className="w-[18px] h-[18px] text-[#6E7078]" />
                  </button>
                </div>


                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border" style={{ background: catStyle(detailItem.category).bg, color: catStyle(detailItem.category).text, borderColor: catStyle(detailItem.category).border }}>{detailItem.category}</span>
                  <span className="text-[11px] text-[#9A9CA3] font-mono"><span className="font-sans font-bold text-[#16171C]">{detailItem.author}</span> · {detailItem.date}</span>
                </div>

                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-2.5 flex items-center gap-2.5">
                  <InlineLabel variant="cs" />
                  <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{detailItem.cs_transcript}</p>
                </div>
                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-4 flex items-center gap-2.5">
                  <InlineLabel variant="vi" />
                  <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{detailItem.vi_equivalent}</p>
                </div>

                {detailItem.alignment.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-2">Nghĩa từ tiếng Anh</p>
                    <div className="flex flex-wrap gap-2">
                      {detailItem.alignment.map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-[#F0EEE6] border border-[#E5E2D8] rounded-lg px-2.5 py-1.5">
                          <span className="text-[11.5px] font-bold font-mono" style={{ color: ACCENT }}>{a.source}</span>
                          <ArrowRight className="w-3 h-3 text-[#B7B4A9] shrink-0" />
                          <span className="text-[11.5px] font-semibold text-[#16171C]">{a.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {detailItem.reviews.filter((r) => r.decision !== "not_needed").map((r, i) => {
                    const isReject = r.decision === "reject";
                    const isApprove = r.decision === "approve";
                    const c = isReject ? "#C63B3B" : isApprove ? "#3FA66B" : "#A85E12";
                    const rowBg = isReject ? "#FDEAEA" : isApprove ? "#EAF7EF" : "#FFF1DE";
                    const rowBorder = isReject ? "#F3C9C9" : isApprove ? "rgba(63,166,107,0.2)" : "#F5DFC0";
                    return (
                      <div key={i} className="flex gap-2.5 px-3 py-2.5 rounded-xl border" style={{ background: rowBg, borderColor: rowBorder }}>
                        <span className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: c }}>{r.reviewer}</span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold" style={{ color: isApprove ? "#1F5C3F" : c }}>{isReject ? `Từ chối${r.errorCategory ? " · " + r.errorCategory : ""}` : isApprove ? "Đã duyệt" : "Chưa đánh giá"}</p>
                          {r.reason && <p className="text-[12px] text-[#6E7078] mt-0.5">{r.reason}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setDetailItem(null)} className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer" style={{ background: ACCENT }}>Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
