import { useState, useMemo } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import { CheckCircle2, XCircle, Clock, AlertCircle, Filter, Eye, X, BarChart3, ChevronDown } from "lucide-react";
import { REVIEWER_ACCENT as ACCENT } from "../../../../constants/theme";

// Đóng góp chỉ 1 reviewer -> trạng thái lấy thẳng quyết định
function resolveStatus(review) {
  if (review.decision === "reject") return "Rejected";
  if (review.decision === "approve") return "Approved";
  return "Pending";
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

// TODO: thay bằng dữ liệu thật. category: Hội thoại hàng ngày | Công nghệ thông tin | Giáo dục
const TEXT_HISTORY = [
  { id: "TXT-204", category: "Hội thoại hàng ngày", author: "Đặng Mai Phương", date: "05/09/2026 - 14:30", text: "[vi]Chiều nay mình đi cà phê rồi [en]check-in [vi]chỗ mới nha.", review: { reviewer: "R1", decision: "approve", reason: "Câu tự nhiên, đạt yêu cầu." } },
  { id: "TXT-203", category: "Công nghệ thông tin", author: "Lê Hoàng Nam", date: "04/09/2026 - 10:00", text: "[vi]Bạn [en]deploy [vi]bản mới lên [en]server [vi]chưa vậy?", review: { reviewer: "R1", decision: "reject", errorCategory: "Nhiều từ mượn", reason: "Câu chứa quá nhiều từ tiếng Anh liên tiếp." } },
  { id: "TXT-202", category: "Hội thoại hàng ngày", author: "Nguyễn Mạnh Lực", date: "04/09/2026 - 09:30", text: "[vi]Tối nay có [en]sale [vi]lớn, mình đi [en]shopping [vi]chút đi.", review: { reviewer: "R1", decision: "approve" } },
  { id: "TXT-201", category: "Công nghệ thông tin", author: "Hoàng Quốc Bảo", date: "03/09/2026 - 11:45", text: "[vi]Cái [en]bug [vi]này mình [en]fix [vi]xong rồi, chờ [en]review [vi]thôi.", review: { reviewer: "R1", decision: "pending" } },
  { id: "TXT-200", category: "Giáo dục", author: "Phạm Thu Thảo", date: "02/09/2026 - 16:15", text: "[vi]Hạn nộp [en]assignment [vi]là thứ sáu tuần này nha.", review: { reviewer: "R1", decision: "approve" } },
  { id: "TXT-199", category: "Hội thoại hàng ngày", author: "Trần Minh Tâm", date: "01/09/2026 - 14:05", text: "[vi]Đc ko bạn ơi?", review: { reviewer: "R1", decision: "reject", errorCategory: "Viết tắt", reason: "Từ viết tắt không hợp lệ ('Đc ko')." } },
  { id: "TXT-198", category: "Giáo dục", author: "Nguyễn Mạnh Lực", date: "31/08/2026 - 20:30", text: "[vi]Mai có buổi [en]workshop [vi]về kỹ năng [en]presentation [vi]đó.", review: { reviewer: "R1", decision: "approve" } },
  { id: "TXT-197", category: "Công nghệ thông tin", author: "Lê Hoàng Nam", date: "30/08/2026 - 08:20", text: "[vi]Con [en]model [vi]này [en]train [vi]xong chưa, cho mình xem [en]result [vi]với.", review: { reviewer: "R1", decision: "pending" } },
  { id: "TXT-196", category: "Giáo dục", author: "Đặng Mai Phương", date: "29/08/2026 - 13:10", text: "[vi]Nhớ ôn kỹ trước khi thi [en]final [vi]nhé, đề khó lắm.", review: { reviewer: "R1", decision: "reject", errorCategory: "Ngữ cảnh", reason: "Thiếu ngữ cảnh, câu chưa rõ môn thi." } },
  { id: "TXT-195", category: "Hội thoại hàng ngày", author: "Phạm Thu Thảo", date: "28/08/2026 - 17:00", text: "[vi]Cuối tuần đi [en]camping [vi]với team không?", review: { reviewer: "R1", decision: "approve" } },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Pending", label: "Chờ duyệt" },
];

export default function ReviewerHistoryContribution() {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const itemsPerPage = 10;

  const currentFilterLabel = FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || "Tất cả";
  const withStatus = useMemo(() => TEXT_HISTORY.map((it) => ({ ...it, status: resolveStatus(it.review) })), []);

  const stats = useMemo(() => {
    const total = withStatus.length;
    const approved = withStatus.filter((i) => i.status === "Approved").length;
    const rejected = withStatus.filter((i) => i.status === "Rejected").length;
    const pending = withStatus.filter((i) => i.status === "Pending").length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    return { total, approved, rejected, pending, approvedPct: pct(approved), rejectedPct: pct(rejected), pendingPct: pct(pending) };
  }, [withStatus]);

  const filteredData = useMemo(
    () => (statusFilter === "all" ? withStatus : withStatus.filter((i) => i.status === statusFilter)),
    [withStatus, statusFilter]
  );

  return (
    <div className="-mt-2 space-y-3 pb-4 text-left max-w-6xl mx-auto flex flex-col">

      {/* THẺ THỐNG KÊ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard icon={BarChart3} label="Tổng đã xử lý" value={stats.total} accent="#16171C" bg="#F0EEE6" />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} pct={stats.approvedPct} accent="#3FA66B" bg="#EAF7EF" />
        <StatCard icon={XCircle} label="Từ chối" value={stats.rejected} pct={stats.rejectedPct} accent="#C63B3B" bg="#FDEAEA" />
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} pct={stats.pendingPct} accent="#A85E12" bg="#FFF1DE" />
      </div>

      {/* BẢNG */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col overflow-hidden">
        <div className="p-3 px-6 border-b border-[#E5E2D8] flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-[#16171C] text-sm">Câu đã kiểm duyệt</h3>
          <div className="relative">
            <button onClick={() => setFilterOpen((v) => !v)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E2D8] text-[#16171C] text-xs font-semibold hover:bg-[#F7F5EF] transition-colors">
              <Filter className="w-3.5 h-3.5 text-[#6E7078]" /> {currentFilterLabel}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6E7078] transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+6px)] w-40 bg-white border border-[#E5E2D8] rounded-xl shadow-[0_8px_20px_rgba(16,17,20,0.12)] p-1 z-20">
                  {FILTER_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === opt.value ? "bg-[#F7F5EF] text-[#16171C]" : "text-[#6E7078] hover:bg-[#F7F5EF] hover:text-[#16171C]"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F5EF] text-[11px] uppercase tracking-wider text-[#9A9CA3] border-b border-[#E5E2D8] font-bold">
                <th className="py-3 px-4 text-center w-[5%]">STT</th>
                <th className="py-3 px-4 text-left w-[19%]">Phân loại</th>
                <th className="py-3 px-4 text-left w-[16%]">Người đóng góp</th>
                <th className="py-3 px-4 text-left w-[14%]">THỜI GIAN</th>
                <th className="py-3 px-4 text-left w-[26%]">Nội dung câu</th>
                <th className="py-3 px-4 text-left w-[10%]">Trạng thái</th>
                <th className="py-3 px-6 text-left w-[10%]">Phản hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-[#9A9CA3] text-sm">Không có mục nào phù hợp bộ lọc.</td></tr>
              ) : filteredData.map((item, idx) => {
                const isReject = item.review.decision === "reject";
                return (
                  <tr key={item.id} className="hover:bg-[#F7F5EF]/70 transition-colors">
                    <td className="py-3 px-4 text-center whitespace-nowrap"><span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</span></td>
                    <td className="py-3 px-4 text-left whitespace-nowrap"><span className="px-2.5 py-1 rounded-md text-[11px] font-bold border" style={{ background: catStyle(item.category).bg, color: catStyle(item.category).text, borderColor: catStyle(item.category).border }}>{item.category}</span></td>
                    <td className="py-3 px-4 text-left whitespace-nowrap"><p className="font-semibold text-[#16171C]">{item.author}</p></td>
                    <td className="py-3 px-4 text-left whitespace-nowrap"><span className="text-[#6E7078] font-mono text-[11px]">{item.date}</span></td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center gap-2 max-w-[280px]">
                        <p className="font-semibold text-[#16171C] truncate">{item.text}</p>
                        <button onClick={() => setDetailItem(item)} className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors" title="Xem chi tiết">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left"><StatusBadge status={item.status} /></td>
                    <td className="py-3 px-6 text-left">
                      <button onClick={() => setDetailItem(item)} className="flex items-center gap-1.5 text-[#6E7078] bg-[#F7F5EF] px-2.5 py-1.5 rounded-full text-[11px] leading-tight hover:bg-[#F0EEE6] transition-colors border border-[#E5E2D8]">
                        <span className="font-bold whitespace-nowrap">{isReject ? <span className="text-[#C63B3B]">Từ chối</span> : "Xem"}</span>
                        <Eye className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-3 border-t border-[#E5E2D8] bg-white shrink-0">
          <Pagination currentPage={currentPage} totalPages={5} onPageChange={(page) => setCurrentPage(page)} accent={ACCENT} />
        </div>
      </div>

      {/* POPUP CHI TIẾT - 1 reviewer */}
      {detailItem && (() => {
        const r = detailItem.review;
        const isReject = r.decision === "reject";
        const isApprove = r.decision === "approve";
        const accent = isReject ? "#C63B3B" : isApprove ? "#3FA66B" : "#A85E12";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setDetailItem(null)}>
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="h-1.5 w-full shrink-0" style={{ background: accent }} />
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${accent}1A` }}>
                      <AlertCircle className="w-[18px] h-[18px]" style={{ color: accent }} />
                    </div>
                    <span className="text-[16px] font-bold text-[#16171C]">Kết quả kiểm duyệt</span>
                  </div>
                  <button onClick={() => setDetailItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                    <X className="w-[18px] h-[18px] text-[#6E7078]" />
                  </button>
                </div>
                <p className="text-[12.5px] text-[#6E7078] ml-[46px] mb-4">Kết quả: <b style={{ color: accent }}>{isReject ? "Từ chối" : isApprove ? "Đã duyệt" : "Chờ duyệt"}</b></p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border" style={{ background: catStyle(detailItem.category).bg, color: catStyle(detailItem.category).text, borderColor: catStyle(detailItem.category).border }}>{detailItem.category}</span>
                  <span className="text-[11px] text-[#9A9CA3] font-mono">{detailItem.author} · {detailItem.date}</span>
                </div>

                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-4">
                  <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-1">Câu văn</p>
                  <p className="text-sm font-medium text-[#16171C] leading-relaxed break-words">{detailItem.text}</p>
                </div>

                <div className="flex gap-2.5 px-3 py-2.5 rounded-xl border" style={{ background: isReject ? "#FDEAEA" : isApprove ? "#EAF7EF" : "#FFF1DE", borderColor: isReject ? "#F3C9C9" : isApprove ? "rgba(63,166,107,0.2)" : "#F5DFC0" }}>
                  <span className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: accent }}>{r.reviewer}</span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold" style={{ color: isApprove ? "#1F5C3F" : accent }}>{isReject ? `Từ chối${r.errorCategory ? " · " + r.errorCategory : ""}` : isApprove ? "Đã duyệt" : "Chưa đánh giá"}</p>
                    {r.reason && <p className="text-[12px] text-[#6E7078] mt-0.5">{r.reason}</p>}
                  </div>
                </div>

                <button onClick={() => setDetailItem(null)} className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] bg-[#16171C]">Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}