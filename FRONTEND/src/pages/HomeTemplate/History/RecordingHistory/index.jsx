import React, { useState, useMemo } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import { CheckCircle2, XCircle, Clock, AlertCircle, Filter, Eye, X, BarChart3, ChevronDown } from "lucide-react";
import { SPEAKER_ACCENT as ACCENT, SUCCESS, DANGER, WARNING } from "../../../../constants/theme";

// Tính trạng thái tổng từ 3 đánh giá của reviewer: >=2 từ chối -> Rejected, >=2 duyệt -> Approved, còn lại -> Pending
function resolveStatus(reviews) {
  const rejected = reviews.filter((r) => r.decision === "reject").length;
  const approved = reviews.filter((r) => r.decision === "approve").length;
  if (rejected >= 2) return "Rejected";
  if (approved >= 2) return "Approved";
  return "Pending";
}

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
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#3FA66B]/10 text-[#1F5C3F] border border-[#3FA66B]/25 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA66B]" /> Đã duyệt
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FDEAEA] text-[#C63B3B] border border-[#F3C9C9] whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 text-[#C63B3B]" /> Từ chối
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF1DE] text-[#A85E12] border border-[#F5DFC0] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-[#A85E12]" /> Chờ duyệt
        </span>
      );
  }
}

// TODO: thay bằng dữ liệu thật từ API
const AUDIO_HISTORY = [
  { id: "REC-091", task: "Nhiệm vụ ghi âm hàng ngày", text: "Em nhớ upload tài liệu trước deadline nhé.", date: "07/09/2026 - 10:15", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-090", task: "Nhiệm vụ ghi âm hàng ngày", text: "Cần fix bug này gấp trước khi release bản mới.", date: "07/09/2026 - 09:45", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Tạp âm", reason: "Tạp âm ồn ào nền (Tiếng quạt)." },
    { reviewer: "R2", decision: "reject", errorCategory: "Tạp âm", reason: "Nghe rõ tiếng vọng, không đạt." },
    { reviewer: "R3", decision: "approve", reason: "Giọng đọc rõ ràng." }] },
  { id: "REC-089", task: "Chủ đề công nghệ & AI", text: "Hệ thống AI đang phân tích dữ liệu đầu vào.", date: "06/09/2026 - 16:30", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "reject", errorCategory: "Phát âm sai", reason: "Sai âm 'phân tích'." }, { reviewer: "R3", decision: "pending" }] },
  { id: "REC-088", task: "Nhiệm vụ ghi âm cuối tuần", text: "Cuộc họp sẽ bắt đầu lúc hai giờ chiều nay.", date: "06/09/2026 - 14:20", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-087", task: "Chủ đề đặc biệt: Giáo dục", text: "Phương pháp học tập mới mang lại hiệu quả cao.", date: "05/09/2026 - 09:10", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "reject", errorCategory: "Ngữ điệu", reason: "Ngữ điệu hơi cứng." }] },
  { id: "REC-086", task: "Nhiệm vụ ghi âm hàng ngày", text: "Bản báo cáo này cần được gửi cho giám đốc.", date: "04/09/2026 - 11:05", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Phát âm sai", reason: "Âm lượng quá nhỏ, không rõ 'giám đốc'." },
    { reviewer: "R2", decision: "reject", errorCategory: "Phát âm sai", reason: "Đồng ý, nghe không rõ." },
    { reviewer: "R3", decision: "reject", errorCategory: "Âm lượng", reason: "Cần thu lại to hơn." }] },
  { id: "REC-085", task: "Thu âm hội thoại công sở", text: "Anh chị vui lòng kiểm tra lại email xác nhận.", date: "03/09/2026 - 15:50", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-084", task: "Chủ đề công nghệ & AI", text: "Thuật toán tối ưu hóa giúp giảm thiểu thời gian.", date: "02/09/2026 - 10:22", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "pending" }, { reviewer: "R3", decision: "pending" }] },
  { id: "REC-083", task: "Nhiệm vụ ghi âm hàng ngày", text: "Cho tôi một ly cà phê đen không đường.", date: "01/09/2026 - 08:30", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "reject", errorCategory: "Tốc độ", reason: "Đọc hơi nhanh." }] },
  { id: "REC-082", task: "Thu âm hội thoại công sở", text: "Mật khẩu của bạn đã được thay đổi thành công.", date: "30/08/2026 - 17:15", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Đọc vấp", reason: "Đọc vấp từ 'thành công'." },
    { reviewer: "R2", decision: "reject", errorCategory: "Đọc vấp", reason: "Đồng ý, vấp rõ." },
    { reviewer: "R3", decision: "approve" }] },
];

export default function RecordingHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const itemsPerPage = 10;

  const FILTER_OPTIONS = [
    { value: "all", label: "Tất cả" },
    { value: "Approved", label: "Đã duyệt" },
    { value: "Rejected", label: "Từ chối" },
    { value: "Pending", label: "Chờ duyệt" },
  ];
  const currentFilterLabel = FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || "Tất cả";

  const withStatus = useMemo(() => AUDIO_HISTORY.map((it) => ({ ...it, status: resolveStatus(it.reviews) })), []);

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
        <StatCard icon={BarChart3} label="Tổng cộng" value={stats.total} accent="#16171C" bg="#F0EEE6" />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} pct={stats.approvedPct} accent={SUCCESS} bg="#EAF7EF" />
        <StatCard icon={XCircle} label="Từ chối" value={stats.rejected} pct={stats.rejectedPct} accent={DANGER} bg="#FDEAEA" />
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} pct={stats.pendingPct} accent={WARNING} bg="#FFF1DE" />
      </div>

      {/* BẢNG */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col overflow-hidden">
        <div className="p-3 px-6 border-b border-[#E5E2D8] flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-[#16171C] text-sm">Danh sách ghi âm gần đây</h3>
          {/* Dropdown lọc theo trạng thái */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E2D8] text-[#16171C] text-xs font-semibold hover:bg-[#F7F5EF] transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-[#6E7078]" /> {currentFilterLabel}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6E7078] transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+6px)] w-40 bg-white border border-[#E5E2D8] rounded-xl shadow-[0_8px_20px_rgba(16,17,20,0.12)] p-1 z-20">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        statusFilter === opt.value ? "bg-[#F7F5EF] text-[#16171C]" : "text-[#6E7078] hover:bg-[#F7F5EF] hover:text-[#16171C]"
                      }`}
                    >
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
                <th className="py-3 px-6 text-center w-[5%]">STT</th>
                <th className="py-3 px-4 text-left w-[33%]">Nội dung</th>
                <th className="py-3 px-4 text-left w-[25%]">Phân loại</th>
                <th className="py-3 px-4 text-left w-[17%]">Ngày nộp</th>
                <th className="py-3 px-4 text-left w-[10%]">Trạng thái</th>
                <th className="py-3 px-6 text-left w-[10%]">Phản hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-[#9A9CA3] text-sm">Không có mục nào phù hợp bộ lọc.</td></tr>
              ) : filteredData.map((item, idx) => {
                const rejectedCount = item.reviews.filter((r) => r.decision === "reject").length;
                return (
                  <tr key={item.id} className="hover:bg-[#F7F5EF]/70 transition-colors group">
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center gap-2 max-w-[280px] md:max-w-xs">
                        <p className="font-bold text-[#16171C] text-sm leading-relaxed truncate">{item.text}</p>
                        <button onClick={() => setViewItem(item)} className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors" title="Xem toàn bộ câu">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap bg-[#F7F5EF] text-[#6E7078] border border-[#E5E2D8]">{item.task}</span>
                    </td>
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      <span className="text-[#6E7078] font-mono text-xs">{item.date}</span>
                    </td>
                    <td className="py-3 px-4 text-left"><StatusBadge status={item.status} /></td>
                    <td className="py-3 px-6 text-left">
                      <button onClick={() => setDetailItem(item)} className="flex items-center gap-1.5 text-[#6E7078] bg-[#F7F5EF] px-2.5 py-1.5 rounded-full text-[11px] leading-tight hover:bg-[#F0EEE6] transition-colors border border-[#E5E2D8]">
                        <span className="font-bold whitespace-nowrap">
                          {rejectedCount > 0 ? <span className="text-[#C63B3B]">{rejectedCount}/3 từ chối</span> : "3 reviewer"}
                        </span>
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

      {/* POPUP XEM TOÀN BỘ CÂU */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 w-full" style={{ background: ACCENT }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}1A` }}>
                    <Eye className="w-[18px] h-[18px]" style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[16px] font-bold text-[#16171C]">Nội dung câu</span>
                </div>
                <button onClick={() => setViewItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F7F5EF] text-[#6E7078] border border-[#E5E2D8]">{viewItem.task}</span>
                <span className="text-[11px] text-[#9A9CA3] font-mono">{viewItem.date}</span>
              </div>
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-4">
                <p className="text-sm font-medium text-[#16171C] leading-relaxed break-words">{viewItem.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT */}
      {detailItem && (() => {
        const rejectedCount = detailItem.reviews.filter((r) => r.decision === "reject").length;
        const approvedCount = detailItem.reviews.filter((r) => r.decision === "approve").length;
        const accent = detailItem.status === "Rejected" ? DANGER : detailItem.status === "Approved" ? SUCCESS : WARNING;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64">
            <div className="absolute inset-0" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setDetailItem(null)} />
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col">
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
                <p className="text-[12.5px] text-[#6E7078] ml-[46px] mb-4">
                  {approvedCount}/3 duyệt · {rejectedCount}/3 từ chối →{" "}
                  <b style={{ color: accent }}>{detailItem.status === "Rejected" ? "Từ chối" : detailItem.status === "Approved" ? "Đã duyệt" : "Chờ duyệt"}</b>
                </p>
                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-4">
                  <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-1">Câu văn</p>
                  <p className="text-sm font-medium text-[#16171C] leading-relaxed">{detailItem.text}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {detailItem.reviews.map((r, i) => {
                    const isReject = r.decision === "reject";
                    const isApprove = r.decision === "approve";
                    const c = isReject ? DANGER : isApprove ? SUCCESS : WARNING;
                    const rowBg = isReject ? "#FDEAEA" : isApprove ? "#EAF7EF" : "#FFF1DE";
                    const rowBorder = isReject ? "#F3C9C9" : isApprove ? "rgba(63,166,107,0.2)" : "#F5DFC0";
                    return (
                      <div key={i} className="flex gap-2.5 px-3 py-2.5 rounded-xl border" style={{ background: rowBg, borderColor: rowBorder }}>
                        <span className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: c }}>{r.reviewer}</span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold" style={{ color: isApprove ? "#1F5C3F" : c }}>
                            {isReject ? `Từ chối${r.errorCategory ? " · " + r.errorCategory : ""}` : isApprove ? "Đã duyệt" : "Chưa đánh giá"}
                          </p>
                          {r.reason && <p className="text-[12px] text-[#6E7078] mt-0.5">{r.reason}</p>}
                        </div>
                      </div>
                    );
                  })}
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