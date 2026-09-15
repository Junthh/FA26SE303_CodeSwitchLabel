import { useState, useMemo, useRef, useEffect } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import { CheckCircle2, XCircle, Clock, AlertCircle, Filter, Eye, X, BarChart3, ChevronDown, Play, Pause, Headphones } from "lucide-react";
import { REVIEWER_ACCENT as ACCENT } from "../../../../constants/theme";

// 3 reviewer -> trạng thái tổng: >=2 từ chối = Rejected, >=2 duyệt = Approved, còn lại Pending
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
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#3FA66B]/10 text-[#1F5C3F] border border-[#3FA66B]/25 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5 text-[#3FA66B]" /> Đã duyệt</span>;
    case "Rejected":
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FDEAEA] text-[#C63B3B] border border-[#F3C9C9] whitespace-nowrap"><XCircle className="w-3.5 h-3.5 text-[#C63B3B]" /> Từ chối</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF1DE] text-[#A85E12] border border-[#F5DFC0] whitespace-nowrap"><Clock className="w-3.5 h-3.5 text-[#A85E12]" /> Chờ duyệt</span>;
  }
}

// TODO: thay bằng dữ liệu thật từ API
const AUDIO_HISTORY = [
  { id: "REC-091", task: "Nhiệm vụ ghi âm hàng ngày", speaker: "Nguyễn Mạnh Lực", date: "08/09/2026 - 09:10", text: "Em nhớ upload tài liệu trước deadline nhé.", duration: "00:04", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-090", task: "Chủ đề công nghệ & AI", speaker: "Lê Hoàng Nam", date: "07/09/2026 - 15:40", text: "Cần fix bug này gấp trước khi release bản mới.", duration: "00:06", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Tạp âm", reason: "Tạp âm ồn ào nền (Tiếng quạt)." },
    { reviewer: "R2", decision: "reject", errorCategory: "Tạp âm", reason: "Nghe rõ tiếng vọng, không đạt." },
    { reviewer: "R3", decision: "approve", reason: "Giọng đọc rõ ràng." }] },
  { id: "REC-089", task: "Thu âm hội thoại công sở", speaker: "Phạm Thu Thảo", date: "06/09/2026 - 13:45", text: "Cuối tuần này cả team đi workshop ở Quận 1 nhé.", duration: "00:05", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "reject", errorCategory: "Phát âm sai", reason: "Sai âm 'workshop'." }, { reviewer: "R3", decision: "pending" }] },
  { id: "REC-088", task: "Nhiệm vụ ghi âm cuối tuần", speaker: "Trần Minh Tâm", date: "06/09/2026 - 10:05", text: "Bạn đã book lịch họp với khách hàng chưa?", duration: "00:04", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-087", task: "Chủ đề đặc biệt: Giáo dục", speaker: "Nguyễn Mạnh Lực", date: "05/09/2026 - 16:00", text: "Hạn nộp assignment là cuối tuần này.", duration: "00:04", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "reject", errorCategory: "Ngữ điệu", reason: "Ngữ điệu hơi cứng." }] },
  { id: "REC-086", task: "Nhiệm vụ ghi âm hàng ngày", speaker: "Hoàng Quốc Bảo", date: "04/09/2026 - 11:20", text: "Mô hình AI này xử lý prompt rất nhanh.", duration: "00:05", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Âm lượng", reason: "Thu quá nhỏ." },
    { reviewer: "R2", decision: "reject", errorCategory: "Âm lượng", reason: "Đồng ý, cần to hơn." },
    { reviewer: "R3", decision: "reject", errorCategory: "Âm lượng", reason: "Nghe không rõ." }] },
  { id: "REC-085", task: "Thu âm hội thoại công sở", speaker: "Trần Minh Tâm", date: "03/09/2026 - 09:45", text: "Tối nay order đồ ăn ở quán cũ nhé.", duration: "00:03", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-084", task: "Chủ đề công nghệ & AI", speaker: "Lê Hoàng Nam", date: "02/09/2026 - 10:22", text: "Thuật toán tối ưu hóa giúp giảm thiểu thời gian.", duration: "00:05", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "pending" }, { reviewer: "R3", decision: "pending" }] },
  { id: "REC-083", task: "Nhiệm vụ ghi âm hàng ngày", speaker: "Đặng Mai Phương", date: "01/09/2026 - 08:30", text: "Cho tôi một ly cà phê đen không đường.", duration: "00:04", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "reject", errorCategory: "Tốc độ", reason: "Đọc hơi nhanh." }] },
  { id: "REC-082", task: "Thu âm hội thoại công sở", speaker: "Phạm Thu Thảo", date: "30/08/2026 - 17:15", text: "Mật khẩu của bạn đã được thay đổi thành công.", duration: "00:05", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Đọc vấp", reason: "Đọc vấp từ 'thành công'." },
    { reviewer: "R2", decision: "reject", errorCategory: "Đọc vấp", reason: "Đồng ý, vấp rõ." },
    { reviewer: "R3", decision: "approve" }] },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Pending", label: "Chờ duyệt" },
];

export default function ReviewerHistoryRecording() {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [listenItem, setListenItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const itemsPerPage = 10;

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

      {/* THẺ THỐNG KÊ - ô cứng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard icon={BarChart3} label="Tổng đã xử lý" value={stats.total} accent="#16171C" bg="#F0EEE6" />
        <StatCard icon={CheckCircle2} label="Đã duyệt" value={stats.approved} pct={stats.approvedPct} accent="#3FA66B" bg="#EAF7EF" />
        <StatCard icon={XCircle} label="Từ chối" value={stats.rejected} pct={stats.rejectedPct} accent="#C63B3B" bg="#FDEAEA" />
        <StatCard icon={Clock} label="Chờ duyệt" value={stats.pending} pct={stats.pendingPct} accent="#A85E12" bg="#FFF1DE" />
      </div>

      {/* BẢNG */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col overflow-hidden">
        <div className="p-3 px-6 border-b border-[#E5E2D8] flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-[#16171C] text-sm">Bản ghi đã kiểm duyệt</h3>
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
                <th className="py-3 px-4 text-center w-[4%]">STT</th>
                <th className="py-3 px-4 text-left w-[18%]">Nhiệm vụ</th>
                <th className="py-3 px-4 text-left w-[14%]">Speaker</th>
                <th className="py-3 px-4 text-left w-[13%]">THỜI GIAN</th>
                <th className="py-3 px-4 text-left w-[21%]">Nội dung</th>
                <th className="py-3 px-4 text-left w-[10%]">Nghe</th>
                <th className="py-3 px-4 text-left w-[10%]">Trạng thái</th>
                <th className="py-3 px-6 text-left w-[10%]">Phản hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {filteredData.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-[#9A9CA3] text-sm">Không có mục nào phù hợp bộ lọc.</td></tr>
              ) : filteredData.map((item, idx) => {
                const rejectedCount = item.reviews.filter((r) => r.decision === "reject").length;
                return (
                  <tr key={item.id} className="hover:bg-[#F7F5EF]/70 transition-colors">
                    <td className="py-3 px-4 text-center whitespace-nowrap"><span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</span></td>
                    <td className="py-3 px-4 text-left"><p className="font-bold text-[#16171C] truncate max-w-[160px]" title={item.task}>{item.task}</p></td>
                    <td className="py-3 px-4 text-left whitespace-nowrap"><p className="font-semibold text-[#16171C]">{item.speaker}</p></td>
                    <td className="py-3 px-4 text-left whitespace-nowrap"><span className="text-[#6E7078] font-mono text-[11px]">{item.date}</span></td>
                    <td className="py-3 px-4 text-left"><p className="font-semibold text-[#16171C] truncate max-w-[200px]" title={item.text}>"{item.text}"</p></td>
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      <button onClick={() => setListenItem(item)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold hover:opacity-90 transition-opacity" style={{ background: ACCENT }}>
                        <Play className="w-3 h-3 fill-current" /><span>{item.duration}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-left"><StatusBadge status={item.status} /></td>
                    <td className="py-3 px-6 text-left">
                      <button onClick={() => setDetailItem(item)} className="flex items-center gap-1.5 text-[#6E7078] bg-[#F7F5EF] px-2.5 py-1.5 rounded-full text-[11px] leading-tight hover:bg-[#F0EEE6] transition-colors border border-[#E5E2D8]">
                        <span className="font-bold whitespace-nowrap">{rejectedCount > 0 ? <span className="text-[#C63B3B]">{rejectedCount}/3 từ chối</span> : "3 reviewer"}</span>
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

      {/* POPUP NGHE */}
      {listenItem && <ListenModal item={listenItem} onClose={() => setListenItem(null)} />}

      {/* POPUP CHI TIẾT 3 REVIEWER */}
      {detailItem && (() => {
        const rejectedCount = detailItem.reviews.filter((r) => r.decision === "reject").length;
        const approvedCount = detailItem.reviews.filter((r) => r.decision === "approve").length;
        const accent = detailItem.status === "Rejected" ? "#C63B3B" : detailItem.status === "Approved" ? "#3FA66B" : "#A85E12";
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
                <p className="text-[12.5px] text-[#6E7078] ml-[46px] mb-4">
                  {approvedCount}/3 duyệt · {rejectedCount}/3 từ chối → <b style={{ color: accent }}>{detailItem.status === "Rejected" ? "Từ chối" : detailItem.status === "Approved" ? "Đã duyệt" : "Chờ duyệt"}</b>
                </p>
                <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-4">
                  <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-1">Câu văn</p>
                  <p className="text-sm font-medium text-[#16171C] leading-relaxed">"{detailItem.text}"</p>
                </div>
                <div className="flex flex-col gap-2">
                  {detailItem.reviews.map((r, i) => {
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
                <button onClick={() => setDetailItem(null)} className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] bg-[#16171C]">Đóng</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Popup nghe
function ListenModal({ item, onClose }) {
  const src = item.audioUrl || "/demo-recording.wav";
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); } else { audio.play(); setIsPlaying(true); }
  };
  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = trackRef.current.getBoundingClientRect();
    audio.currentTime = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * duration;
  };
  const fmt = (s) => { if (!isFinite(s)) return "0:00"; const m = Math.floor(Math.abs(s) / 60); const sec = Math.floor(Math.abs(s) % 60); return `${m}:${String(sec).padStart(2, "0")}`; };
  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} onClick={onClose}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full" style={{ background: ACCENT }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}1A` }}>
                <Headphones className="w-[18px] h-[18px]" style={{ color: ACCENT }} />
              </div>
              <span className="text-[16px] font-bold text-[#16171C]">Nghe bản ghi âm</span>
            </div>
            <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
              <X className="w-[18px] h-[18px] text-[#6E7078]" />
            </button>
          </div>
          <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3.5 mb-5">
            <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-1">Nội dung câu</p>
            <p className="text-sm font-medium text-[#16171C] leading-relaxed">"{item.text}"</p>
          </div>
          <div ref={trackRef} onClick={seek} className="relative h-2 rounded-full bg-[#E5E2D8] cursor-pointer">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 shadow-[0_1px_3px_rgba(16,17,20,0.2)]" style={{ left: `calc(${pct}% - 7px)`, borderColor: ACCENT }} />
          </div>
          <div className="flex justify-between font-mono text-[12px] text-[#6E7078] font-semibold mt-2.5">
            <span className="text-[#16171C]">{fmt(currentTime)}</span>
            <span>-{fmt(duration - currentTime)}</span>
          </div>
          <div className="flex items-center justify-center mt-4">
            <button onClick={togglePlay} className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_22px_rgba(129,140,248,0.3)] hover:scale-105 active:scale-95 transition-transform" style={{ background: ACCENT }}>
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}