import { useState, useMemo } from "react";
import Pagination from "../../../../components/Pagination/Pagination";
import useFitPageSize from "../../../../hooks/useFitPageSize";
import WaveformInline from "../../../../components/AudioPlayer/WaveformInline";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  BarChart3,
  Search,
} from "lucide-react";
import {
  parseCodeSwitch,
  stripTags,
} from "../../../../components/CodeSwitchText/CodeSwitchText";
import {
  SPEAKER_ACCENT as ACCENT,
  AUDIO_PRIMARY,
} from "../../../../constants/theme";
import { RECORDING_HISTORY as AUDIO_HISTORY } from "../../../../mocks/speaker/history";

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
  // Số dòng mỗi trang tự tính theo chiều cao bảng -> trang vừa 1 màn hình, không cuộn
  const [listRef, itemsPerPage] = useFitPageSize(10, [filteredData.length > 0], "tbody");
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="-mt-2 h-full min-h-0 flex flex-col gap-3 text-left font-sans">
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

      <section className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
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
        <div ref={listRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
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
                        variant === "cs" ? "pt-[3px] pb-0" : "pt-0 pb-[3px]";
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
                            <td rowSpan={2} className="px-3 py-[3px]">
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
                            <WaveformInline
                              label={variant === "cs" ? "VI-EN" : "VI"}
                              src={variant === "cs" ? item.csAudioUrl : item.viAudioUrl}
                              demoSeed={`${variant}-${transcript}`}
                              demoDuration={variant === "cs" ? item.csDuration : item.viDuration}
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
        <div className="shrink-0 border-t border-[#F0EEE6] px-4 sm:px-5 grid sm:grid-cols-[1fr_auto_1fr] items-center">
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
