import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  AlertTriangle,
  FolderKanban,
  X,
  ArrowLeft,
  ClipboardCheck,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../../components/Pagination/Pagination";
import useFitPageSize from "../../../../hooks/useFitPageSize";
import WaveformInline from "../../../../components/AudioPlayer/WaveformInline";
import {
  parseCodeSwitch,
  stripTags,
} from "../../../../components/CodeSwitchText/CodeSwitchText";
import {
  REVIEWER_ACCENT as ACCENT,
  AUDIO_PRIMARY,
} from "../../../../constants/theme";
import { TASK_TOTALS, RECORDING_QUEUE } from "../../../../mocks/reviewer/recordings";

// "00:04" -> 4 (giây)
function parseDurationToSeconds(str) {
  const [m, s] = String(str).split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

/** Đoạn văn có nhãn [vi]/[en] -> câu Anh tô màu AUDIO_PRIMARY (audio/giọng đọc = xanh dương này). */
function CodeSwitchPreview({ transcript }) {
  const segments = useMemo(() => parseCodeSwitch(transcript), [transcript]);
  return segments.map((seg, i) =>
    seg.lang === "en" ? (
      <span key={i} style={{ color: AUDIO_PRIMARY }}>
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

/** Nhãn pill (VI-EN / VI) đứng đầu mỗi dòng sparkline - cs dùng AUDIO_PRIMARY, vi dùng xám trung tính. */
function InlineLabel({ variant }) {
  const bg = variant === "cs" ? AUDIO_PRIMARY : "#8B8D95";
  return (
    <span
      className="text-[9px] font-bold w-9 h-[18px] text-center shrink-0 rounded-md inline-flex items-center justify-center text-white"
      style={{ background: bg, letterSpacing: "0.02em" }}
    >
      {variant === "cs" ? "VI-EN" : "VI"}
    </span>
  );
}

export default function ReviewRecording() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskQuery = searchParams.get("task");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpeaker, setFilterSpeaker] = useState("all");
  const [filterTask, setFilterTask] = useState(
    taskQuery || Object.keys(TASK_TOTALS)[0],
  );

  const [selectedRecording, setSelectedRecording] = useState(null);
  const [rejectCategory, setRejectCategory] = useState("pronunciation");
  const [rejectReason, setRejectReason] = useState("");

  const [activeQueue, setActiveQueue] = useState(RECORDING_QUEUE);

  const filteredQueue = useMemo(() => {
    return activeQueue.filter((rec) => {
      const q = searchTerm.toLowerCase();

      const matchSearch =
        rec.id.toLowerCase().includes(q) ||
        stripTags(rec.csText).toLowerCase().includes(q) ||
        rec.viText.toLowerCase().includes(q) ||
        rec.speaker.toLowerCase().includes(q) ||
        rec.taskName.toLowerCase().includes(q);

      const matchSpeaker =
        filterSpeaker === "all" || rec.speaker === filterSpeaker;

      const matchTask = rec.taskName === filterTask;

      return matchSearch && matchSpeaker && matchTask;
    });
  }, [activeQueue, searchTerm, filterSpeaker, filterTask]);

  const hasRows = filteredQueue.length > 0;
  const [listRef, pageSize] = useFitPageSize(5, [hasRows]);

  const totalPages = Math.ceil(filteredQueue.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedQueue = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, currentPage, pageSize]);

  const handleApprove = (id) => {
    setActiveQueue((prev) => prev.filter((rec) => rec.id !== id));
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();

    if (!selectedRecording) return;

    setActiveQueue((prev) =>
      prev.filter((rec) => rec.id !== selectedRecording.id),
    );

    setSelectedRecording(null);
    setRejectReason("");
    setRejectCategory("pronunciation");
  };

  const taskTotal = TASK_TOTALS[filterTask];

  const taskRemaining = activeQueue.filter(
    (rec) => rec.taskName === filterTask,
  ).length;

  const taskReviewed =
    taskTotal !== undefined
      ? Math.max(0, taskTotal - taskRemaining)
      : undefined;

  const taskPercent = taskTotal
    ? Math.round((taskReviewed / taskTotal) * 100)
    : 0;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 text-left font-sans">
      {/* ================= HEADER / TASK INFO ================= */}
      {taskTotal !== undefined && (
        <div className="shrink-0 bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
          {/* Task progress */}
          <div className="px-3.5 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{
                  background: `${ACCENT}1A`,
                }}
              >
                <ClipboardCheck
                  className="w-3.5 h-3.5"
                  style={{
                    color: ACCENT,
                  }}
                />
              </div>

              <p className="text-xs font-bold text-[#16171C] whitespace-nowrap">
                {filterTask}
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
              <div className="flex-1 h-1.5 bg-[#F0EEE6] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${taskPercent}%`,
                    background: ACCENT,
                  }}
                />
              </div>

              <span className="text-[11px] text-[#6E7078] whitespace-nowrap">
                <strong className="text-[#16171C]">{taskReviewed}</strong>/
                {taskTotal} đã xử lý
              </span>
            </div>

            {/* Back */}
            <button
              onClick={() => navigate("/reviewer/task")}
              className="ml-auto text-[11px] font-semibold flex items-center gap-1.5 hover:underline shrink-0 whitespace-nowrap cursor-pointer"
              style={{
                color: ACCENT,
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Về danh sách nhiệm vụ
            </button>
          </div>

          <div className="h-px bg-[#F0EEE6]" />

          {/* ================= FILTER ================= */}
          <div className="px-3.5 py-2.5 flex flex-col md:flex-row md:items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full md:w-[300px] shrink-0">
              <Search className="w-4 h-4 text-[#9A9CA3] absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);

                  setCurrentPage(1);
                }}
                placeholder="Tìm theo nhiệm vụ, speaker, nội dung..."
                className="w-full pl-9 pr-4 py-2 text-[13px] leading-4 border border-[#E5E2D8] rounded-xl outline-none focus:border-[#818CF8] focus:ring-4 focus:ring-[#818CF8]/10 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="md:ml-auto flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Task filter */}
              <div className="flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#9A9CA3]" />

                <select
                  value={filterTask}
                  onChange={(e) => {
                    setFilterTask(e.target.value);

                    setCurrentPage(1);
                  }}
                  className="text-xs leading-4 border border-[#E5E2D8] rounded-xl px-2.5 py-1.5 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
                >
                  <option value="Nhiệm vụ ghi âm hàng ngày">
                    Nhiệm vụ ghi âm hàng ngày
                  </option>

                  <option value="Nhiệm vụ ghi âm cuối tuần">
                    Nhiệm vụ ghi âm cuối tuần
                  </option>

                  <option value="Chủ đề công nghệ & AI">
                    Chủ đề công nghệ & AI
                  </option>

                  <option value="Chủ đề đặc biệt: Giáo dục">
                    Chủ đề đặc biệt: Giáo dục
                  </option>

                  <option value="Thu âm hội thoại công sở">
                    Thu âm hội thoại công sở
                  </option>
                </select>
              </div>

              {/* Speaker filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#9A9CA3]" />

                <select
                  value={filterSpeaker}
                  onChange={(e) => {
                    setFilterSpeaker(e.target.value);

                    setCurrentPage(1);
                  }}
                  className="text-xs leading-4 border border-[#E5E2D8] rounded-xl px-2.5 py-1.5 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
                >
                  <option value="all">Tất cả speaker</option>

                  <option value="Nguyễn Mạnh Lực">Nguyễn Mạnh Lực</option>

                  <option value="Trần Minh Tâm">Trần Minh Tâm</option>

                  <option value="Lê Hoàng Nam">Lê Hoàng Nam</option>

                  <option value="Phạm Thu Thảo">Phạm Thu Thảo</option>

                  <option value="Hoàng Quốc Bảo">Hoàng Quốc Bảo</option>

                  <option value="Đặng Mai Phương">Đặng Mai Phương</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECORDING LIST ================= */}
      {paginatedQueue.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
          <div ref={listRef} className="flex-1 min-h-0 overflow-hidden">
          {paginatedQueue.map((rec, idx) => (
            <div
              key={rec.id}
              className="px-3.5 sm:px-4 py-1.5 border-t border-[#F0EEE6] first:border-t-0"
            >
              {/* Header row */}
              <div className="flex items-center gap-x-2 gap-y-1 mb-1 flex-wrap">
                {/* STT */}
                <span className="text-[11px] font-semibold flex items-center text-[#B7B4A9] w-5 shrink-0">
                  {(currentPage - 1) * pageSize + idx + 1}
                </span>

                {/* Task */}
                <span className="text-[11px] font-semibold bg-[#F0EEE6] text-[#6E7078] border border-[#E5E2D8] px-2.5 py-1 rounded-md">
                  {rec.taskName}
                </span>

                {/* Speaker */}
                <span className="text-xs font-semibold text-[#16171C]">
                  {rec.speaker}
                </span>

                {/* Time */}
                <span className="text-[11px] text-[#9A9CA3] font-mono tabular-nums">
                  {rec.time}
                </span>

                <span className="flex-1" />

                {/* Approve */}
                <button
                  onClick={() => handleApprove(rec.id)}
                  className="px-2.5 py-1.5 bg-[#EAF7EF] border border-[#C5E8D3] text-[#1F5C3F] rounded-lg text-[11px] leading-4 font-bold flex items-center gap-1.5 hover:bg-[#DCF0E5] transition-colors cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Duyệt
                </button>

                {/* Reject */}
                <button
                  onClick={() => setSelectedRecording(rec)}
                  className="px-2.5 py-1.5 bg-[#FDEAEA] border border-[#F3C9C9] text-[#C63B3B] rounded-lg text-[11px] leading-4 font-bold flex items-center gap-1.5 hover:bg-[#FBDADA] transition-colors cursor-pointer shrink-0"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Từ chối
                </button>
              </div>

              {/* VI-EN */}
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-x-2.5 gap-y-1 py-0.5 sm:pl-7">
                <InlineLabel variant="cs" />

                <WaveformInline
                  label="VI-EN"
                  src={rec.csAudioUrl}
                  demoSeed={`${rec.id}-cs`}
                  demoDuration={parseDurationToSeconds(rec.csDuration)}
                  previewProgress={rec.csPreview}
                  className="w-[clamp(140px,19vw,270px)] shrink-0"
                />

                <p className="text-sm font-semibold text-[#16171C] leading-5 basis-full xl:basis-auto xl:flex-1 xl:ml-1 min-w-0 break-words">
                  <CodeSwitchPreview transcript={rec.csText} />
                </p>
              </div>

              {/* VI */}
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-x-2.5 gap-y-1 py-0.5 sm:pl-7">
                <InlineLabel variant="vi" />

                <WaveformInline
                  label="VI"
                  src={rec.viAudioUrl}
                  demoSeed={`${rec.id}-vi`}
                  demoDuration={parseDurationToSeconds(rec.viDuration)}
                  previewProgress={rec.viPreview}
                  className="w-[clamp(140px,19vw,270px)] shrink-0"
                />

                <p className="text-sm font-semibold text-[#16171C] leading-5 basis-full xl:basis-auto xl:flex-1 xl:ml-1 min-w-0 break-words">
                  {rec.viText}
                </p>
              </div>
            </div>
          ))}
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="shrink-0 border-t border-[#F0EEE6] px-4 py-2 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              accent={ACCENT}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E2D8] py-14 text-center">
          <p className="font-bold text-[#16171C] text-sm">
            Tuyệt vời! Bạn đã xử lý hết hàng đợi chờ duyệt.
          </p>

          <p className="text-[#9A9CA3] text-xs mt-1">
            Các bản ghi đã thao tác sẽ được ghi nhận tại mục Lịch sử kiểm duyệt.
          </p>
        </div>
      )}

      {/* ================= MODAL TỪ CHỐI ================= */}
      {selectedRecording && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64"
          style={{
            background: "rgba(22,23,28,0.55)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        >
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]">
            <div className="h-1.5 w-full bg-[#C63B3B]" />

            <div className="p-6">
              {/* Modal header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FDEAEA] flex-shrink-0">
                    <AlertTriangle className="w-[18px] h-[18px] text-[#C63B3B]" />
                  </div>

                  <span className="text-[15px] font-bold text-[#16171C]">
                    Từ chối bản ghi · {selectedRecording.speaker}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedRecording(null)}
                  aria-label="Đóng"
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">
                    Loại lỗi kiểm duyệt
                  </label>

                  <select
                    value={rejectCategory}
                    onChange={(e) => setRejectCategory(e.target.value)}
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-2.5 bg-white text-[#16171C] font-medium outline-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  >
                    <option value="pronunciation">
                      Phát âm sai từ Tiếng Anh / Code-Switching
                    </option>

                    <option value="noise">Tạp âm / Rè tiếng / Nhỏ tiếng</option>

                    <option value="wrong_text">
                      Đọc sai hoặc thiếu từ so với văn bản
                    </option>

                    <option value="other">Lỗi khác</option>
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">
                    Mô tả lý do từ chối chi tiết
                  </label>

                  <textarea
                    required
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Phát âm từ 'deadline' chưa rõ, bị nuốt âm đuôi..."
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-3 outline-none resize-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRecording(null)}
                    className="flex-1 py-2.5 border border-[#E5E2D8] text-[#55565B] rounded-xl text-xs font-bold hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#C63B3B] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
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