import { useState, useMemo, useRef, useEffect } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  BarChart3,
  Search,
  Play,
  Pause,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import {
  parseCodeSwitch,
  stripTags,
} from "../../../../components/CodeSwitchText/CodeSwitchText";
import {
  SPEAKER_ACCENT as ACCENT,
  AUDIO_PRIMARY,
  AUDIO_WAVE_IDLE,
} from "../../../../constants/theme";

// 3 reviewer -> trạng thái tổng: >=2 từ chối = Rejected, >=2 duyệt = Approved, còn lại Pending
function resolveStatus(reviews) {
  const rejected = reviews.filter((r) => r.decision === "reject").length;
  const approved = reviews.filter((r) => r.decision === "approve").length;
  if (rejected >= 2) return "Rejected";
  if (approved >= 2) return "Approved";
  return "Pending";
}

// Số phiếu THỰC SỰ đã bỏ (approve/reject) - loại cả "pending" (chưa tới lượt/chưa vote) lẫn
// "not_needed" (R1+R2 đã đồng thuận nên R3 không cần đánh giá nữa).
function votedCountOf(reviews) {
  return reviews.filter(
    (r) => r.decision === "approve" || r.decision === "reject",
  ).length;
}

function InlineLabel({ variant }) {
  return <span className="text-[9px] font-bold w-9 h-[18px] shrink-0 rounded-md inline-flex items-center justify-center text-white" style={{ background: variant === "cs" ? ACCENT : "#8B8D95" }}>{variant === "cs" ? "VI-EN" : "VI"}</span>;
}

function StatCard({ icon: Icon, label, value, pct, accent, bg }) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)]">
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#6E7078]">{label}</p>
        <p className="text-[17px] font-bold text-[#16171C] font-mono leading-tight">
          {value}
          {pct !== undefined && (
            <span
              className="text-[11px] font-semibold ml-1"
              style={{ color: accent }}
            >
              {pct}%
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// Font-size đồng bộ với StatusBadge của trang Lịch sử Câu đóng góp (text-[11px] font-bold).
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

// Nút "Phản hồi" - hiện đúng số phiếu ĐÃ BỎ / tổng 3 (không phải luôn "3 vote" cứng như trước), và
// đổi màu theo trạng thái để nhất quán với StatusBadge cùng dòng: xanh lá khi Approved, đỏ khi
// Rejected, cam khi còn Pending (kể cả khi đã có người từ chối/duyệt nhưng chưa đủ 2 phiếu).
function FeedbackButton({ status, votedCount, onClick, ariaLabel }) {
  const styles = {
    Approved: {
      bg: "#EAF7EF",
      border: "rgba(63,166,107,0.25)",
      text: "#1F5C3F",
    },
    Rejected: { bg: "#FDEAEA", border: "#F3C9C9", text: "#C63B3B" },
    Pending: { bg: "#FFF1DE", border: "#F5DFC0", text: "#A85E12" },
  }[status];
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap hover:opacity-80"
      style={{
        background: styles.bg,
        borderColor: styles.border,
        color: styles.text,
      }}
    >
      <Eye className="w-3.5 h-3.5 shrink-0" />
      <span>{votedCount}/3 vote</span>
    </button>
  );
}

// TODO: thay bằng dữ liệu thật từ API
const AUDIO_HISTORY = [
  { id: "REC-091", task: "Nhiệm vụ ghi âm hàng ngày",
    csText: "[vi]Em nhớ [en]upload [vi]tài liệu trước [en]deadline [vi]nhé.",
    viText: "[vi]Em nhớ tải lên tài liệu trước hạn chót nhé.",
    csAudioUrl: "/review-recording-first-sample.m4a",
    csDuration: 5, viDuration: 5,
    date: "07/09/2026 - 10:15", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-090", task: "Nhiệm vụ ghi âm hàng ngày",
    csText: "[vi]Cần [en]fix [en]bug [vi]này gấp trước khi [en]release [vi]bản mới.",
    viText: "[vi]Cần sửa lỗi này gấp trước khi phát hành bản mới.",
    csDuration: 6, viDuration: 6,
    date: "07/09/2026 - 09:45", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Tạp âm", reason: "Tạp âm ồn ào nền (Tiếng quạt)." },
    { reviewer: "R2", decision: "reject", errorCategory: "Tạp âm", reason: "Nghe rõ tiếng vọng, không đạt." },
    { reviewer: "R3", decision: "approve", reason: "Giọng đọc rõ ràng." }] },
  { id: "REC-089", task: "Chủ đề công nghệ & AI",
    csText: "[vi]Hệ thống [en]AI [vi]đang phân tích dữ liệu đầu vào.",
    viText: "[vi]Hệ thống trí tuệ nhân tạo đang phân tích dữ liệu đầu vào.",
    csDuration: 5, viDuration: 6,
    date: "06/09/2026 - 16:30", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "reject", errorCategory: "Phát âm sai", reason: "Sai âm 'phân tích'." }, { reviewer: "R3", decision: "pending" }] },
  { id: "REC-088", task: "Nhiệm vụ ghi âm cuối tuần",
    csText: "[vi]Cuộc họp sẽ bắt đầu lúc hai giờ chiều nay.",
    viText: "[vi]Cuộc họp sẽ bắt đầu lúc hai giờ chiều nay.",
    csDuration: 4, viDuration: 4,
    date: "06/09/2026 - 14:20", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-087", task: "Chủ đề đặc biệt: Giáo dục",
    csText: "[vi]Phương pháp học tập mới mang lại hiệu quả cao.",
    viText: "[vi]Phương pháp học tập mới mang lại hiệu quả cao.",
    csDuration: 4, viDuration: 5,
    date: "05/09/2026 - 09:10", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "reject", errorCategory: "Ngữ điệu", reason: "Ngữ điệu hơi cứng." }] },
  { id: "REC-086", task: "Nhiệm vụ ghi âm hàng ngày",
    csText: "[vi]Bản báo cáo này cần được gửi cho giám đốc.",
    viText: "[vi]Bản báo cáo này cần được gửi cho giám đốc.",
    csDuration: 5, viDuration: 6,
    date: "04/09/2026 - 11:05", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Phát âm sai", reason: "Âm lượng quá nhỏ, không rõ 'giám đốc'." },
    { reviewer: "R2", decision: "reject", errorCategory: "Phát âm sai", reason: "Đồng ý, nghe không rõ." },
    { reviewer: "R3", decision: "reject", errorCategory: "Âm lượng", reason: "Cần thu lại to hơn." }] },
  { id: "REC-085", task: "Thu âm hội thoại công sở",
    csText: "[vi]Anh chị vui lòng kiểm tra lại [en]email [vi]xác nhận.",
    viText: "[vi]Anh chị vui lòng kiểm tra lại thư điện tử xác nhận.",
    csDuration: 3, viDuration: 4,
    date: "03/09/2026 - 15:50", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "approve" }] },
  { id: "REC-084", task: "Chủ đề công nghệ & AI",
    csText: "[vi]Thuật toán tối ưu hóa giúp giảm thiểu thời gian.",
    viText: "[vi]Thuật toán tối ưu hóa giúp giảm thiểu thời gian.",
    csDuration: 5, viDuration: 5,
    date: "02/09/2026 - 10:22", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "pending" }, { reviewer: "R3", decision: "pending" }] },
  { id: "REC-083", task: "Nhiệm vụ ghi âm hàng ngày",
    csText: "[vi]Cho tôi một ly cà phê đen không đường.",
    viText: "[vi]Cho tôi một ly cà phê đen không đường.",
    csDuration: 4, viDuration: 4,
    date: "01/09/2026 - 08:30", reviews: [
    { reviewer: "R1", decision: "approve" }, { reviewer: "R2", decision: "approve" }, { reviewer: "R3", decision: "reject", errorCategory: "Tốc độ", reason: "Đọc hơi nhanh." }] },
  { id: "REC-082", task: "Thu âm hội thoại công sở",
    csText: "[vi]Mật khẩu của bạn đã được thay đổi thành công.",
    viText: "[vi]Mật khẩu của bạn đã được thay đổi thành công.",
    csDuration: 5, viDuration: 5,
    date: "30/08/2026 - 17:15", reviews: [
    { reviewer: "R1", decision: "reject", errorCategory: "Đọc vấp", reason: "Đọc vấp từ 'thành công'." },
    { reviewer: "R2", decision: "reject", errorCategory: "Đọc vấp", reason: "Đồng ý, vấp rõ." },
    { reviewer: "R3", decision: "approve" }] },
];


const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Pending", label: "Chờ duyệt" },
];

export default function RecordingHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  // Popup PHẢN HỒI (đầy đủ 3 reviewer, mở từ cột "Phản hồi")
  const [detailItem, setDetailItem] = useState(null);
  // Popup CÂU VĂN (chỉ 2 câu VI-EN + VI, mở từ icon con mắt cạnh nội dung)
  const [sentenceItem, setSentenceItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const itemsPerPage = 10;

  const withStatus = useMemo(
    () =>
      AUDIO_HISTORY.map((it) => ({ ...it, status: resolveStatus(it.reviews) })),
    [],
  );

  const stats = useMemo(() => {
    const total = withStatus.length;
    const approved = withStatus.filter((i) => i.status === "Approved").length;
    const rejected = withStatus.filter((i) => i.status === "Rejected").length;
    const pending = withStatus.filter((i) => i.status === "Pending").length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    return {
      total,
      approved,
      rejected,
      pending,
      approvedPct: pct(approved),
      rejectedPct: pct(rejected),
      pendingPct: pct(pending),
    };
  }, [withStatus]);

  const tasks = [...new Set(AUDIO_HISTORY.map((item) => item.task))];
  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    return withStatus.filter(
      (item) =>
        (statusFilter === "all" || item.status === statusFilter) &&
        (taskFilter === "all" || item.task === taskFilter) &&
        [item.task, stripTags(item.csText), stripTags(item.viText)].some(
          (value) => value.toLocaleLowerCase("vi").includes(query),
        ),
    );
  }, [withStatus, statusFilter, taskFilter, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="-mt-2 space-y-3 text-left font-sans flex flex-col">
      {/* THẺ THỐNG KÊ - ô cứng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          icon={BarChart3}
          label="Tổng bản ghi"
          value={stats.total}
          accent="#16171C"
          bg="#F0EEE6"
        />
        <StatCard
          icon={CheckCircle2}
          label="Đã duyệt"
          value={stats.approved}
          pct={stats.approvedPct}
          accent="#3FA66B"
          bg="#EAF7EF"
        />
        <StatCard
          icon={XCircle}
          label="Từ chối"
          value={stats.rejected}
          pct={stats.rejectedPct}
          accent="#C63B3B"
          bg="#FDEAEA"
        />
        <StatCard
          icon={Clock}
          label="Chờ duyệt"
          value={stats.pending}
          pct={stats.pendingPct}
          accent="#A85E12"
          bg="#FFF1DE"
        />
      </div>

      <section className="bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#F0EEE6] space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9CA3]" />
              <input
                aria-label="Tìm bản ghi"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm nhiệm vụ, nội dung..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5E2D8] text-[13px] leading-4 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              aria-label="Lọc nhiệm vụ"
              value={taskFilter}
              onChange={(event) => {
                setTaskFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="min-w-0 rounded-lg border border-[#E5E2D8] px-3 py-2 bg-white text-xs text-[#16171C]"
            >
              <option value="all">Tất cả nhiệm vụ</option>
              {tasks.map((task) => (
                <option key={task} value={task}>
                  {task}
                </option>
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
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table
            aria-label="Lịch sử ghi âm"
            className="w-full min-w-[1280px] table-fixed border-collapse text-left"
          >
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[11%]" />
              <col className="w-[17%]" />
              <col className="w-[30%]" />
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead className="bg-[#F7F5EF] text-[11px] font-semibold uppercase text-[#9A9CA3] border-b border-[#E5E2D8]">
              <tr>
                {[
                  "STT",
                  "Ngày nộp",
                  "Nhiệm vụ",
                  "Nội dung",
                  "Đoạn ghi âm",
                  "Trạng thái",
                  "Phản hồi",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`px-3 py-2.5 font-semibold ${heading === "STT" ? "text-center" : ""}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            {/* tbody dùng text-xs font-medium làm cỡ chữ mặc định - khớp đúng bảng Lịch sử Câu đóng góp */}
            {pageItems.length === 0 ? (
              <tbody className="text-xs font-medium">
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-4 text-center text-sm text-[#6E7078]"
                  >
                    Không có bản ghi phù hợp bộ lọc.
                  </td>
                </tr>
              </tbody>
            ) : (
              pageItems.map((item, index) => {
                const [date, time] = item.date.split(" - ");
                const votedCount = votedCountOf(item.reviews);
                return (
                  <tbody
                    key={item.id}
                    className="border-b border-[#F0EEE6] last:border-b-0 text-xs font-medium"
                  >
                    {["cs", "vi"].map((variant) => {
                      const transcript =
                        variant === "cs" ? item.csText : item.viText;
                      const cellSpacing =
                        variant === "cs" ? "pt-1 pb-0" : "pt-0 pb-1";
                      return (
                        <tr key={variant}>
                          {variant === "cs" && (
                            <>
                              <td
                                rowSpan={2}
                                className="px-3 text-center text-xs font-mono text-[#9A9CA3] tabular-nums"
                              >
                                {startIndex + index + 1}
                              </td>
                              <td rowSpan={2} className="px-3">
                                <p className="text-[11px] leading-4 text-[#6E7078] font-mono">
                                  {date} - {time}
                                </p>
                              </td>
                              <td rowSpan={2} className="px-3">
                                <span className="inline-block rounded-md border border-[#E5E2D8] bg-[#F0EEE6] px-2.5 py-1 text-[11px] font-semibold text-[#6E7078]">
                                  {item.task}
                                </span>
                              </td>
                            </>
                          )}
                          {variant === "cs" && (
                            <td rowSpan={2} className="px-3 py-1">
                              {/* Căn icon mắt về cùng một mép cột như bảng lịch sử câu đóng góp. */}
                              <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                  {[item.csText, item.viText].map(
                                    (text, textIndex) => (
                                      <p
                                        key={textIndex}
                                        className="font-semibold text-[#16171C] truncate leading-6"
                                      >
                                        {parseCodeSwitch(text).map(
                                          (segment, segmentIndex) => (
                                            <span
                                              key={segmentIndex}
                                              style={
                                                segment.lang === "en"
                                                  ? {
                                                      color: AUDIO_PRIMARY,
                                                      fontWeight: 700,
                                                    }
                                                  : undefined
                                              }
                                            >
                                              {segment.text}
                                            </span>
                                          ),
                                        )}
                                      </p>
                                    ),
                                  )}
                                </div>
                                {/* Icon này CHỈ mở popup xem 2 câu - không hiện phản hồi/vote ở đây */}
                                <button
                                  onClick={() => setSentenceItem(item)}
                                  aria-label={`Xem cả hai câu của ${item.id}`}
                                  title="Xem đầy đủ hai câu"
                                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                          <td className={`px-3 ${cellSpacing}`}>
                            <HistoryAudioRow
                              variant={variant}
                              demoDuration={
                                variant === "cs"
                                  ? item.csDuration
                                  : item.viDuration
                              }
                              src={
                                variant === "cs"
                                  ? item.csAudioUrl
                                  : item.viAudioUrl
                              }
                              transcript={transcript}
                            />
                          </td>
                          {variant === "cs" && (
                            <>
                              <td rowSpan={2} className="px-3">
                                <StatusBadge status={item.status} />
                              </td>
                              <td rowSpan={2} className="px-3">
                                {/* Phản hồi - đúng số vote thật đã bỏ / 3, màu khớp trạng thái cùng dòng
                                (không phải luôn "3 vote" như trước, cũng không phải màu trung tính cố định). */}
                                <FeedbackButton
                                  status={item.status}
                                  votedCount={votedCount}
                                  onClick={() => setDetailItem(item)}
                                  ariaLabel={`Xem phản hồi cho ${item.id}`}
                                />
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })
            )}
          </table>
        </div>
        <div className="border-t border-[#F0EEE6] px-4 sm:px-5 grid sm:grid-cols-[1fr_auto_1fr] items-center">
          <p className="text-[11px] text-[#9A9CA3] pt-2 sm:pt-0">
            Hiển thị {filteredData.length ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredData.length)} /{" "}
            {filteredData.length} bản ghi
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            accent={ACCENT}
          />
        </div>
      </section>

      {/* POPUP CÂU VĂN - chỉ 2 câu VI-EN + VI, KHÔNG có phần phản hồi/vote */}
      {sentenceItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64"
          style={{
            background: "rgba(22,23,28,0.55)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
          onClick={() => setSentenceItem(null)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-1.5 w-full shrink-0"
              style={{ background: ACCENT }}
            />
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[16px] font-bold text-[#16171C]">
                  Nội dung câu
                </span>
                <button
                  onClick={() => setSentenceItem(null)}
                  aria-label="Đóng"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>
              <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-2.5 flex items-center gap-2.5">
                <InlineLabel variant="cs" />
                <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">
                  {parseCodeSwitch(sentenceItem.csText).map((segment, i) => <span key={i} style={segment.lang === "en" ? { color: AUDIO_PRIMARY, fontWeight: 700 } : undefined}>{segment.text}</span>)}
                </p>
              </div>
              <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] flex items-center gap-2.5">
                <InlineLabel variant="vi" />
                <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{stripTags(sentenceItem.viText)}</p>
              </div>
              <button
                onClick={() => setSentenceItem(null)}
                className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{ background: ACCENT }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PHẢN HỒI - 3 reviewer */}
      {detailItem &&
        (() => {
          const ResultIcon = detailItem.status === "Approved" ? CheckCircle2 : detailItem.status === "Rejected" ? AlertCircle : Clock;
          const accent =
            detailItem.status === "Rejected"
              ? "#C63B3B"
              : detailItem.status === "Approved"
                ? "#3FA66B"
                : "#A85E12";
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64"
              style={{
                background: "rgba(22,23,28,0.55)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
              onClick={() => setDetailItem(null)}
            >
              <div
                className="bg-white rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(16,17,20,0.25)] relative z-10 overflow-hidden max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ background: accent }}
                />
                <div className="p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}1A` }}
                      >
                        <ResultIcon
                          className="w-[18px] h-[18px]"
                          style={{ color: accent }}
                        />
                      </div>
                      <span className="text-[16px] font-bold text-[#16171C]">
                        Kết quả kiểm duyệt
                      </span>
                    </div>
                    <button
                      onClick={() => setDetailItem(null)}
                      aria-label="Đóng"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0"
                    >
                      <X className="w-[18px] h-[18px] text-[#6E7078]" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#E5E2D8] bg-[#F0EEE6] text-[#6E7078]">{detailItem.task}</span>
                    <span className="text-[11px] text-[#9A9CA3] font-mono">{detailItem.date}</span>
                  </div>
                  <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-2.5 flex items-center gap-2.5">
                    <InlineLabel variant="cs" />
                    <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{stripTags(detailItem.csText)}</p>
                  </div>
                  <div className="bg-[#F7F5EF] p-3.5 rounded-xl border border-[#E5E2D8] mb-4 flex items-center gap-2.5">
                    <InlineLabel variant="vi" />
                    <p className="text-sm font-semibold text-[#16171C] leading-relaxed break-words min-w-0">{stripTags(detailItem.viText)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {detailItem.reviews.filter((r) => r.decision !== "not_needed" && (detailItem.status === "Pending" || r.decision === "approve" || r.decision === "reject")).map((r, i) => {
                      const isReject = r.decision === "reject";
                      const isApprove = r.decision === "approve";
                      const c = isReject
                        ? "#C63B3B"
                        : isApprove
                          ? "#3FA66B"
                          : "#A85E12";
                      const rowBg = isReject
                        ? "#FDEAEA"
                        : isApprove
                          ? "#EAF7EF"
                          : "#FFF1DE";
                      const rowBorder = isReject
                        ? "#F3C9C9"
                        : isApprove
                          ? "rgba(63,166,107,0.2)"
                          : "#F5DFC0";
                      return (
                        <div
                          key={i}
                          className="flex gap-2.5 px-3 py-2.5 rounded-xl border"
                          style={{ background: rowBg, borderColor: rowBorder }}
                        >
                          <span
                            className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: c }}
                          >
                            {r.reviewer}
                          </span>
                          <div className="min-w-0">
                            <p
                              className="text-[12.5px] font-bold"
                              style={{ color: isApprove ? "#1F5C3F" : c }}
                            >
                              {isReject
                                ? `Từ chối${r.errorCategory ? " · " + r.errorCategory : ""}`
                                : isApprove
                                  ? "Đã duyệt"
                                  : "Chưa đánh giá"}
                            </p>
                            {r.reason && (
                              <p className="text-[12px] text-[#6E7078] mt-0.5">
                                {r.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setDetailItem(null)}
                    className="w-full mt-5 py-3 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: ACCENT }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// Sóng âm mẫu cho dữ liệu demo; audio thật vẫn được WaveSurfer giải mã.
function generatePeaks(seed, count = 60) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let state = h || 1;
  const rand = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };

  const usableStart = Math.round(count * 0.08);
  const usableEnd = count - Math.round(count * 0.08);
  const usableLen = usableEnd - usableStart;

  const peaks = new Array(count).fill(0);
  const wordCount = 5 + Math.floor(rand() * 3); // 5-7 "từ"
  const avgSlot = usableLen / wordCount;
  let pos = usableStart;

  for (let w = 0; w < wordCount && pos < usableEnd - 3; w++) {
    const wordLen = Math.max(3, Math.round(avgSlot * (0.45 + rand() * 0.35)));
    const peakAmp = 0.55 + rand() * 0.4;
    for (let j = 0; j < wordLen && pos < usableEnd; j++, pos++) {
      const envelope = Math.sin((j / wordLen) * Math.PI);
      const jitter = 0.75 + rand() * 0.5;
      peaks[pos] = Math.max(0.04, envelope * peakAmp * jitter);
    }
    pos += Math.max(1, Math.round(avgSlot * (0.15 + rand() * 0.25)));
  }
  for (let i = 0; i < count; i++)
    if (peaks[i] === 0) peaks[i] = 0.03 + rand() * 0.04;

  return peaks;
}

function HistoryAudioRow({ variant, src, transcript, demoDuration }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [playback, setPlayback] = useState({
    ready: false,
    playing: false,
    duration: 0,
    error: false,
  });
  const label = variant === "cs" ? "VI-EN" : "VI";
  const demoPeaks = useMemo(
    () => generatePeaks(`${variant}-${transcript}`, 44),
    [variant, transcript],
  );

  useEffect(() => {
    if (!src || !containerRef.current) return;
    let disposed = false;
    const player = WaveSurfer.create({
      container: containerRef.current,
      height: 24,
      waveColor: AUDIO_WAVE_IDLE,
      progressColor: AUDIO_PRIMARY,
      cursorWidth: 0,
      barWidth: 2.5,
      barGap: 1.5,
      barRadius: 2,
      normalize: true,
    });
    playerRef.current = player;
    player.on("ready", () =>
      setPlayback({
        ready: true,
        playing: false,
        duration: player.getDuration(),
        error: false,
      }),
    );
    player.on("play", () => {
      // Only one history recording plays at a time.
      window.dispatchEvent(
        new CustomEvent("history-audio-play", { detail: player }),
      );
      setPlayback((state) => ({ ...state, playing: true }));
    });
    player.on("pause", () =>
      setPlayback((state) => ({ ...state, playing: false })),
    );
    player.on("finish", () =>
      setPlayback((state) => ({ ...state, playing: false })),
    );
    const onOtherPlay = (event) => {
      if (event.detail !== player) player.pause();
    };
    window.addEventListener("history-audio-play", onOtherPlay);
    player.load(src).catch(() => {
      if (!disposed)
        setPlayback((state) => ({
          ...state,
          ready: false,
          playing: false,
          error: true,
        }));
    });
    return () => {
      disposed = true;
      window.removeEventListener("history-audio-play", onOtherPlay);
      player.destroy();
      playerRef.current = null;
    };
  }, [src, variant]);

  const togglePlay = () =>
    playerRef.current
      ?.playPause()
      .catch(() =>
        setPlayback((state) => ({ ...state, playing: false, error: true })),
      );
  const minutes = Math.floor(playback.duration / 60);
  const seconds = Math.floor(playback.duration % 60)
    .toString()
    .padStart(2, "0");
  return (
    <div className="flex items-center gap-2 min-h-6">
      <button
        disabled={!playback.ready || playback.error}
        onClick={togglePlay}
        aria-label={`${playback.playing ? "Tạm dừng" : "Phát"} bản ${label}`}
        title={!src ? "Sóng âm minh họa – chưa có file để phát" : undefined}
        className="w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center text-white disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="w-5 h-5 rounded-full inline-flex items-center justify-center" style={{ background: AUDIO_PRIMARY, boxShadow: "0 1px 3px rgba(37,99,235,0.2)" }}>
        {playback.playing ? (
          <Pause className="w-3 h-3" fill="currentColor" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
        )}
        </span>
      </button>
      <div className="relative flex-1 min-w-0 h-6">
        <div
          ref={containerRef}
          className={!src || playback.error ? "hidden" : "w-full"}
        />
        {!src && (
          <svg
            viewBox="0 0 176 28"
            preserveAspectRatio="none"
            className="w-full h-full"
            role="img"
            aria-label="Sóng âm mẫu"
          >
            {demoPeaks.map((peak, index) => {
              const height = Math.max(2, peak * 26);
              return (
                <rect
                  key={index}
                  x={index * 4}
                  y={(28 - height) / 2}
                  width="2.5"
                  height={height}
                  rx="1"
                  fill={AUDIO_WAVE_IDLE}
                />
              );
            })}
          </svg>
        )}
        {src && playback.error && (
          <span className="h-full flex items-center text-[11px] text-[#9A9CA3]">
            Không tải được audio
          </span>
        )}
      </div>
      <span className="font-mono text-[11px] text-[#9A9CA3] shrink-0 w-10 whitespace-nowrap tabular-nums">
        {playback.ready
          ? `${minutes}:${seconds}`
          : !src
            ? (demoDuration != null ? `0:${String(demoDuration).padStart(2, "0")}` : "--:--")
            : "—"}
      </span>
    </div>
  );
}
