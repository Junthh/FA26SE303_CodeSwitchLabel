import { useState, useMemo } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye, X, BarChart3, Search, ArrowRight } from "lucide-react";
import { SPEAKER_ACCENT as ACCENT, SUCCESS, DANGER, WARNING } from "../../../../constants/theme";

function SentenceContent({ item }) {
  return (
    <>
      {[{ label: "VI-EN", text: item.cs_transcript, color: ACCENT }, { label: "VI", text: item.vi_equivalent, color: "#8B8D95" }].map(({ label, text, color }) => (
        <div key={label} className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-2.5 flex items-center gap-2.5">
          <span className="text-[9px] font-bold w-9 h-[18px] shrink-0 rounded-md inline-flex items-center justify-center text-white" style={{ background: color }}>{label}</span>
          <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{text}</p>
        </div>
      ))}
      {item.alignment.length > 0 && (
        <div className="mt-4 mb-4">
          <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-2">Nghĩa từ tiếng Anh</p>
          <div className="flex flex-wrap gap-2">
            {item.alignment.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-[#F0EEE6] border border-[#E5E2D8] rounded-lg px-2.5 py-1.5">
                <span className="text-[11.5px] font-bold font-mono" style={{ color: ACCENT }}>{a.source}</span>
                <ArrowRight className="w-3 h-3 text-[#B7B4A9] shrink-0" />
                <span className="text-[11.5px] font-semibold text-[#16171C]">{a.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Tính trạng thái tổng từ 3 đánh giá của reviewer: >=2 từ chối -> Rejected, >=2 duyệt -> Approved, còn lại -> Pending
// (đồng bộ với RecordingHistory - đóng góp giờ cũng qua 3 reviewer thay vì 1)
function resolveStatus(reviews) {
  const rejected = reviews.filter((r) => r.decision === "reject").length;
  const approved = reviews.filter((r) => r.decision === "approve").length;
  if (rejected >= 2) return "Rejected";
  if (approved >= 2) return "Approved";
  return "Pending";
}

// Màu phân loại (bộ A) - xanh dương / hổ phách / hồng magenta, giống bên Reviewer
const CATEGORY_COLORS = {
  "Hội thoại hàng ngày": { bg: "#E6F0FE", text: "#1E40AF", border: "#C9DEFB" },
  "Công nghệ thông tin": { bg: "#FBF0DA", text: "#92600A", border: "#F3E0B5" },
  "Giáo dục": { bg: "#FCE7F0", text: "#9D2662", border: "#F8CFE0" },
};
const catStyle = (cat) => CATEGORY_COLORS[cat] || { bg: "#F7F5EF", text: "#6E7078", border: "#E5E2D8" };

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

// TODO: thay bằng dữ liệu thật từ API. Mỗi câu giờ đủ 3 reviewer (giống RecordingHistory) và có alignment
// khớp đúng format của trang Đóng góp văn bản: cs_transcript (Việt-Anh) + vi_equivalent (Việt) + alignment (nghĩa từng từ tiếng Anh)
const TEXT_HISTORY = [
  { id: "TXT-204", category: "Hội thoại hàng ngày",
    cs_transcript: "[vi]Chiều nay mình đi cà phê rồi [en]check-in [vi]chỗ mới nha.",
    vi_equivalent: "[vi]Chiều nay mình đi cà phê rồi đánh dấu vị trí chỗ mới nha.",
    alignment: [{ source: "check-in", target: "đánh dấu vị trí" }],
    date: "05/09/2026 - 14:20",
    reviews: [
      { reviewer: "R1", decision: "approve", reason: "Câu tự nhiên, đạt yêu cầu." },
      { reviewer: "R2", decision: "approve" },
      { reviewer: "R3", decision: "approve" },
    ] },
  { id: "TXT-203", category: "Hội thoại hàng ngày",
    cs_transcript: "[vi]Tối nay có [en]sale [vi]lớn, mình đi [en]shopping [vi]chút đi.",
    vi_equivalent: "[vi]Tối nay có giảm giá lớn, mình đi mua sắm chút đi.",
    alignment: [{ source: "sale", target: "giảm giá" }, { source: "shopping", target: "mua sắm" }],
    date: "05/09/2026 - 10:10",
    reviews: [
      { reviewer: "R1", decision: "approve" },
      { reviewer: "R2", decision: "approve" },
      { reviewer: "R3", decision: "approve" },
    ] },
  { id: "TXT-202", category: "Hội thoại hàng ngày",
    cs_transcript: "[vi]Nhớ [en]order [vi]đồ ăn trước khi hết giờ [en]happy hour [vi]nha.",
    vi_equivalent: "[vi]Nhớ đặt đồ ăn trước khi hết giờ vàng nha.",
    alignment: [{ source: "order", target: "đặt" }, { source: "happy hour", target: "giờ vàng" }],
    date: "04/09/2026 - 09:30",
    reviews: [
      { reviewer: "R1", decision: "pending" },
      { reviewer: "R2", decision: "pending" },
      { reviewer: "R3", decision: "pending" },
    ] },
  { id: "TXT-201", category: "Công nghệ thông tin",
    cs_transcript: "[vi]Bạn [en]deploy [vi]bản mới lên [en]server [vi]chưa vậy?",
    vi_equivalent: "[vi]Bạn triển khai bản mới lên máy chủ chưa vậy?",
    alignment: [{ source: "deploy", target: "triển khai" }, { source: "server", target: "máy chủ" }],
    date: "03/09/2026 - 11:45",
    reviews: [
      { reviewer: "R1", decision: "approve" },
      { reviewer: "R2", decision: "approve" },
      { reviewer: "R3", decision: "approve" },
    ] },
  { id: "TXT-200", category: "Công nghệ thông tin",
    cs_transcript: "[vi]Cái [en]bug [vi]này mình [en]fix [vi]xong rồi, chờ [en]review [vi]thôi.",
    vi_equivalent: "[vi]Cái lỗi này mình sửa xong rồi, chờ xem xét thôi.",
    alignment: [{ source: "bug", target: "lỗi" }, { source: "fix", target: "sửa" }, { source: "review", target: "xem xét" }],
    date: "02/09/2026 - 16:15",
    reviews: [
      { reviewer: "R1", decision: "approve" },
      { reviewer: "R2", decision: "approve" },
      { reviewer: "R3", decision: "approve" },
    ] },
  { id: "TXT-199", category: "Công nghệ thông tin",
    cs_transcript: "[vi]Nhớ [en]commit [vi]code rồi tạo [en]pull request [vi]cho mình duyệt.",
    vi_equivalent: "[vi]Nhớ lưu thay đổi code rồi tạo yêu cầu hợp nhất cho mình duyệt.",
    alignment: [{ source: "commit", target: "lưu thay đổi" }, { source: "pull request", target: "yêu cầu hợp nhất" }],
    date: "01/09/2026 - 14:05",
    reviews: [
      { reviewer: "R1", decision: "reject", errorCategory: "Nhiều từ mượn", reason: "Câu chứa quá nhiều từ tiếng Anh liên tiếp." },
      { reviewer: "R2", decision: "reject", errorCategory: "Nhiều từ mượn", reason: "Đồng ý, nên rút bớt từ mượn." },
      { reviewer: "R3", decision: "pending" },
    ] },
  { id: "TXT-198", category: "Công nghệ thông tin",
    cs_transcript: "[vi]Con [en]model [vi]này [en]train [vi]xong chưa, cho mình xem [en]result [vi]với.",
    vi_equivalent: "[vi]Con mô hình này huấn luyện xong chưa, cho mình xem kết quả với.",
    alignment: [{ source: "model", target: "mô hình" }, { source: "train", target: "huấn luyện" }, { source: "result", target: "kết quả" }],
    date: "31/08/2026 - 20:30",
    reviews: [
      { reviewer: "R1", decision: "pending" },
      { reviewer: "R2", decision: "pending" },
      { reviewer: "R3", decision: "pending" },
    ] },
  { id: "TXT-197", category: "Giáo dục",
    cs_transcript: "[vi]Hạn nộp [en]assignment [vi]là thứ sáu tuần này nha.",
    vi_equivalent: "[vi]Hạn nộp bài tập là thứ sáu tuần này nha.",
    alignment: [{ source: "assignment", target: "bài tập" }],
    date: "30/08/2026 - 08:20",
    reviews: [
      { reviewer: "R1", decision: "approve" },
      { reviewer: "R2", decision: "approve" },
      { reviewer: "R3", decision: "approve" },
    ] },
  { id: "TXT-196", category: "Giáo dục",
    cs_transcript: "[vi]Mai có buổi [en]workshop [vi]về kỹ năng [en]presentation [vi]đó.",
    vi_equivalent: "[vi]Mai có buổi hội thảo về kỹ năng thuyết trình đó.",
    alignment: [{ source: "workshop", target: "hội thảo" }, { source: "presentation", target: "thuyết trình" }],
    date: "29/08/2026 - 13:10",
    reviews: [
      { reviewer: "R1", decision: "approve" },
      { reviewer: "R2", decision: "approve" },
      { reviewer: "R3", decision: "approve" },
    ] },
  { id: "TXT-195", category: "Giáo dục",
    cs_transcript: "[vi]Nhớ ôn kỹ trước khi thi [en]final [vi]nhé, đề khó lắm.",
    vi_equivalent: "[vi]Nhớ ôn kỹ trước khi thi cuối kỳ nhé, đề khó lắm.",
    alignment: [{ source: "final", target: "cuối kỳ" }],
    date: "28/08/2026 - 17:00",
    reviews: [
      { reviewer: "R1", decision: "reject", errorCategory: "Ngữ cảnh", reason: "Thiếu ngữ cảnh, câu chưa rõ môn thi." },
      { reviewer: "R2", decision: "reject", errorCategory: "Ngữ cảnh", reason: "Đồng ý, nên nói rõ môn thi nào." },
      { reviewer: "R3", decision: "approve" },
    ] },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Pending", label: "Chờ duyệt" },
];

export default function ContributionHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const withStatus = useMemo(() => TEXT_HISTORY.map((it) => ({ ...it, status: resolveStatus(it.reviews) })), []);

  const stats = useMemo(() => {
    const total = withStatus.length;
    const approved = withStatus.filter((i) => i.status === "Approved").length;
    const rejected = withStatus.filter((i) => i.status === "Rejected").length;
    const pending = withStatus.filter((i) => i.status === "Pending").length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    return { total, approved, rejected, pending, approvedPct: pct(approved), rejectedPct: pct(rejected), pendingPct: pct(pending) };
  }, [withStatus]);

  const categories = [...new Set(TEXT_HISTORY.map((item) => item.category))];
  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    return withStatus.filter((item) =>
      (statusFilter === "all" || item.status === statusFilter) &&
      (categoryFilter === "all" || item.category === categoryFilter) &&
      [item.category, item.cs_transcript, item.vi_equivalent].some((value) =>
        value.toLocaleLowerCase("vi").includes(query)
      )
    );
  }, [withStatus, statusFilter, categoryFilter, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const pageItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="-mt-2 space-y-3 pb-4 text-left flex flex-col">

      {/* THẺ THỐNG KÊ - ô cứng (không bấm để lọc) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard icon={BarChart3} label="Tổng cộng" value={stats.total} accent="#16171C" bg="#F0EEE6" />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} pct={stats.approvedPct} accent={SUCCESS} bg="#EAF7EF" />
        <StatCard icon={XCircle} label="Từ chối" value={stats.rejected} pct={stats.rejectedPct} accent={DANGER} bg="#FDEAEA" />
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} pct={stats.pendingPct} accent={WARNING} bg="#FFF1DE" />
      </div>

      {/* BẢNG */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#F0EEE6] space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9CA3]" />
              <input
                aria-label="Tìm câu đóng góp"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm phân loại, nội dung..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5E2D8] text-[13px] leading-4 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              aria-label="Lọc phân loại"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="min-w-0 rounded-lg border border-[#E5E2D8] px-3 py-2 bg-white text-xs text-[#16171C]"
            >
              <option value="all">Tất cả phân loại</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-[#E5E2D8] px-3 py-2 bg-white text-xs text-[#16171C]"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[1200px] table-fixed border-collapse">
            <thead>
              <tr className="bg-[#F7F5EF] text-[11px] uppercase tracking-wider text-[#9A9CA3] border-b border-[#E5E2D8] font-bold">
                <th className="py-2.5 px-3 text-center w-[5%]">STT</th>
                <th className="py-2.5 px-3 text-left w-[43%]">Nội dung</th>
                <th className="py-2.5 px-3 text-left w-[17%]">Phân loại</th>
                <th className="py-2.5 px-3 text-left w-[15%]">Ngày nộp</th>
                <th className="py-2.5 px-3 text-left w-[10%]">Trạng thái</th>
                <th className="py-2.5 px-3 text-left w-[10%]">Phản hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-[#9A9CA3] text-sm">Không có mục nào phù hợp bộ lọc.</td></tr>
              ) : pageItems.map((item, idx) => {
                const votedCount = item.reviews.filter((r) => r.decision === "approve" || r.decision === "reject").length;
                return (
                  <tr key={item.id} className="hover:bg-[#F7F5EF]/70 transition-colors group h-14">
                    <td className="px-3 text-center whitespace-nowrap align-middle">
                      <span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                    </td>
                    <td className="px-3 text-left align-middle">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#16171C] truncate leading-5">{item.cs_transcript}</p>
                          <p className="font-semibold text-[#16171C] truncate leading-5 mt-0.5">{item.vi_equivalent}</p>
                        </div>
                        <button onClick={() => setViewItem(item)} aria-label={`Xem đầy đủ hai câu, ${item.id}`} className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors" title="Xem đầy đủ hai câu">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 text-left align-middle">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border" style={{ background: catStyle(item.category).bg, color: catStyle(item.category).text, borderColor: catStyle(item.category).border }}>{item.category}</span>
                    </td>
                    <td className="px-3 text-left whitespace-nowrap align-middle">
                      <span className="text-[#6E7078] font-mono text-[11px]">{item.date}</span>
                    </td>
                    <td className="px-3 text-left align-middle"><StatusBadge status={item.status} /></td>
                    {/* Phản hồi: X/3 vote - đồng bộ với RecordingHistory thay vì "Xem"/"Từ chối" của 1 reviewer cũ */}
                    <td className="px-3 text-left align-middle">
                      <FeedbackButton status={item.status} votedCount={votedCount} onClick={() => setDetailItem(item)} ariaLabel={`Xem phản hồi, ${item.id}`} />
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

      {/* POPUP XEM TOÀN BỘ CÂU - hiện cả câu Việt-Anh, câu Việt, và nghĩa từng từ tiếng Anh */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-md max-h-[85vh] overflow-y-auto shadow-[0_20px_50px_rgba(16,17,20,0.25)]" onClick={(e) => e.stopPropagation()}>
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
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border" style={{ background: catStyle(viewItem.category).bg, color: catStyle(viewItem.category).text, borderColor: catStyle(viewItem.category).border }}>{viewItem.category}</span>
                <span className="text-[11px] text-[#9A9CA3] font-mono">{viewItem.date}</span>
              </div>

              <SentenceContent item={viewItem} />
              <button onClick={() => setViewItem(null)} className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors" style={{ background: ACCENT }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT - 3 reviewer, giống RecordingHistory */}
      {detailItem && (() => {
        const ResultIcon = detailItem.status === "Approved" ? CheckCircle2 : detailItem.status === "Rejected" ? AlertCircle : Clock;
        const accent = detailItem.status === "Rejected" ? "#C63B3B" : detailItem.status === "Approved" ? "#3FA66B" : "#A85E12";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64">
            <div className="absolute inset-0" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={() => setDetailItem(null)} />
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col">
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
                  <span className="text-[11px] text-[#9A9CA3] font-mono">{detailItem.date}</span>
                </div>

                <SentenceContent item={detailItem} />

                {/* 3 reviewer - giống RecordingHistory */}
                <div className="flex flex-col gap-2">
                  {detailItem.reviews.filter((r) => r.decision !== "not_needed" && (detailItem.status === "Pending" || r.decision === "approve" || r.decision === "reject")).map((r, i) => {
                    const isReject = r.decision === "reject";
                    const isApprove = r.decision === "approve";
                    const c = isReject ? "#C63B3B" : isApprove ? "#3FA66B" : "#A85E12";
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
                <button onClick={() => setDetailItem(null)} className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer" style={{ background: ACCENT }}>Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
