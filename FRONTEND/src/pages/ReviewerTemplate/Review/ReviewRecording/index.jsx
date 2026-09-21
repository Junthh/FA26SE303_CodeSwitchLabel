import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Play,
  Pause,
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
import WaveSurfer from "wavesurfer.js";
import Pagination from "../../../../components/Pagination/Pagination";
import {
  parseCodeSwitch,
  stripTags,
} from "../../../../components/CodeSwitchText/CodeSwitchText";
import {
  REVIEWER_ACCENT as ACCENT,
  AUDIO_PRIMARY,
  AUDIO_WAVE_IDLE,
  AUDIO_WAVE_PROGRESS,
} from "../../../../constants/theme";

// "00:04" -> 4 (giây)
function parseDurationToSeconds(str) {
  const [m, s] = String(str).split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

// Sinh dạng sóng giả cố định theo seed (id bản ghi) - dùng khi chưa có audio thật để WaveSurfer vẫn vẽ
// được ngay lập tức. Cùng seed luôn ra cùng 1 hình dạng. Mô phỏng hình bao biên độ giọng nói thật:
// khoảng lặng đầu/cuối rõ rệt + các "cụm từ" biên độ cao dạng vòm dồn ở giữa.
// TODO: khi backend trả về audio thật, WaveSurfer sẽ tự vẽ lại đúng dạng sóng thật khi tải xong (event 'ready').
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

function formatTime(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.floor(Math.abs(s) % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
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

/**
 * Sparkline audio player - sóng âm cao 28px, chiều rộng co giãn theo màn hình.
 */
function SparklinePlayer({
  src,
  seed,
  fallbackDuration,
  previewProgress,
  useRealWaveform = false,
}) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(fallbackDuration || 0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: AUDIO_WAVE_IDLE,
      progressColor: AUDIO_WAVE_PROGRESS,
      cursorWidth: 0,
      barWidth: 2.5,
      barGap: 1.5,
      barRadius: 2,
      height: 28,
      normalize: true,
      backend: "WebAudio",
    });

    ws.on("ready", () => setDuration(ws.getDuration()));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    // Preview "đã nghe qua X%" cho một vài bản ghi - mô phỏng bằng seekTo, không phải đang phát thật.
    if (useRealWaveform) {
      ws.load(src);
    } else {
      ws.load(src, generatePeaks(seed), fallbackDuration || undefined);
      if (previewProgress) ws.seekTo(previewProgress);
    }

    waveSurferRef.current = ws;
    return () => ws.destroy();
  }, [src, seed, fallbackDuration, previewProgress, useRealWaveform]);

  const togglePlay = () => waveSurferRef.current?.playPause();

  return (
    <>
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Tạm dừng bản ghi" : "Phát bản ghi"}
        className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 cursor-pointer"
        style={{
          background: AUDIO_PRIMARY,
          boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
        }}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" fill="currentColor" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
        )}
      </button>
      <div
        ref={containerRef}
        className="w-[clamp(80px,14vw,190px)] min-w-0 shrink"
      />
      <span className="font-mono text-[11px] text-[#9A9CA3] shrink-0 w-7">
        {formatTime(duration)}
      </span>
    </>
  );
}

// Tổng số bản đã submit cho từng nhiệm vụ - khớp đúng "target" ở trang Nhiệm vụ (ReviewTasks.jsx).
// TODO: khi nối API thật, nên lấy trực tiếp từ endpoint nhiệm vụ (hoặc truyền qua query string khi
// điều hướng từ trang Nhiệm vụ) thay vì bảng tra cứu tĩnh này.
const TASK_TOTALS = {
  "Nhiệm vụ ghi âm hàng ngày": 100,
  "Nhiệm vụ ghi âm cuối tuần": 80,
  "Chủ đề công nghệ & AI": 150,
  "Chủ đề đặc biệt: Giáo dục": 120,
  "Thu âm hội thoại công sở": 60,
};

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

  const pageSize = 5;

  const [activeQueue, setActiveQueue] = useState([
    {
      id: "REC-2025-001",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Nguyễn Mạnh Lực",
      time: "08/09/2026 - 08:30",
      csText: "[vi]Em nhớ [en]upload [vi]tài liệu trước [en]deadline [vi]nhé.",
      csAudioUrl: "/review-recording-first-sample.m4a",
      csDuration: "00:05",
      viText: "Em nhớ tải lên tài liệu trước hạn chót nhé.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-002",
      taskName: "Nhiệm vụ ghi âm cuối tuần",
      speaker: "Trần Minh Tâm",
      time: "07/09/2026 - 17:15",
      csText: "[vi]Gửi cho mình [en]slide [vi]báo cáo trước 5h chiều nhé.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Gửi cho mình bản trình chiếu báo cáo trước 5h chiều nhé.",
      viAudioUrl: null,
      viDuration: "00:06",
    },
    {
      id: "REC-2025-003",
      taskName: "Chủ đề công nghệ & AI",
      speaker: "Lê Hoàng Nam",
      time: "07/09/2026 - 15:30",
      csText:
        "[vi]Cần [en]fix bug [vi]này gấp trước khi [en]release [vi]bản mới.",
      csAudioUrl: null,
      csDuration: "00:06",
      viText: "Cần sửa lỗi này gấp trước khi phát hành bản mới.",
      viAudioUrl: null,
      viDuration: "00:06",
      viPreview: 0.62,
    },
    {
      id: "REC-2025-004",
      taskName: "Chủ đề đặc biệt: Giáo dục",
      speaker: "Nguyễn Mạnh Lực",
      time: "07/09/2026 - 14:10",
      csText: "[vi]Thầy vừa gửi [en]link zoom [vi]qua [en]email [vi]lớp rồi.",
      csAudioUrl: null,
      csDuration: "00:04",
      viText: "Thầy vừa gửi đường dẫn zoom qua thư điện tử lớp rồi.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-005",
      taskName: "Thu âm hội thoại công sở",
      speaker: "Phạm Thu Thảo",
      time: "06/09/2026 - 13:45",
      csText:
        "[vi]Cuối tuần này cả [en]team [vi]đi [en]workshop [vi]ở Quận 1 nhé.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Cuối tuần này cả nhóm đi hội thảo ở Quận 1 nhé.",
      viAudioUrl: null,
      viDuration: "00:06",
    },
    {
      id: "REC-2025-006",
      taskName: "Chủ đề công nghệ & AI",
      speaker: "Hoàng Quốc Bảo",
      time: "06/09/2026 - 11:20",
      csText: "[vi]Mô hình [en]AI [vi]này xử lý [en]prompt [vi]rất nhanh.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Mô hình trí tuệ nhân tạo này xử lý câu lệnh rất nhanh.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-007",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Đặng Mai Phương",
      time: "06/09/2026 - 10:05",
      csText: "[vi]Bạn đã [en]book [vi]lịch họp với khách hàng chưa?",
      csAudioUrl: null,
      csDuration: "00:04",
      viText: "Bạn đã đặt lịch họp với khách hàng chưa?",
      viAudioUrl: null,
      viDuration: "00:04",
    },
    {
      id: "REC-2025-008",
      taskName: "Thu âm hội thoại công sở",
      speaker: "Trần Minh Tâm",
      time: "06/09/2026 - 09:45",
      csText: "[vi]Tối nay [en]order [vi]đồ ăn ở quán cũ nhé.",
      csAudioUrl: null,
      csDuration: "00:03",
      viText: "Tối nay đặt đồ ăn ở quán cũ nhé.",
      viAudioUrl: null,
      viDuration: "00:04",
    },
    {
      id: "REC-2025-009",
      taskName: "Chủ đề đặc biệt: Giáo dục",
      speaker: "Lê Hoàng Nam",
      time: "05/09/2026 - 16:00",
      csText: "[vi]Hạn nộp [en]assignment [vi]là cuối tuần này.",
      csAudioUrl: null,
      csDuration: "00:04",
      viText: "Hạn nộp bài tập là cuối tuần này.",
      viAudioUrl: null,
      viDuration: "00:04",
    },
    {
      id: "REC-2025-010",
      taskName: "Nhiệm vụ ghi âm cuối tuần",
      speaker: "Phạm Thu Thảo",
      time: "03/09/2026 - 15:45",
      csText: "[vi]Bộ phim mới ra mắt có [en]rating [vi]rất cao.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Bộ phim mới ra mắt có điểm đánh giá rất cao.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-011",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Lê Hoàng Nam",
      time: "03/09/2026 - 08:50",
      csText: "[vi]Bạn nhớ [en]check-in [vi]trước 9 giờ sáng nhé.",
      csAudioUrl: null,
      csDuration: "00:04",
      viText: "Bạn nhớ đến điểm danh trước 9 giờ sáng nhé.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-012",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Phạm Thu Thảo",
      time: "02/09/2026 - 16:40",
      csText: "[vi]Nhớ [en]backup [vi]dữ liệu trước khi tắt máy.",
      csAudioUrl: null,
      csDuration: "00:04",
      viText: "Nhớ sao lưu dữ liệu trước khi tắt máy.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-013",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Hoàng Quốc Bảo",
      time: "02/09/2026 - 09:15",
      csText: "[vi]Sếp muốn [en]feedback [vi]sớm về bản thiết kế.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Sếp muốn phản hồi sớm về bản thiết kế.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-014",
      taskName: "Chủ đề công nghệ & AI",
      speaker: "Trần Minh Tâm",
      time: "01/09/2026 - 14:25",
      csText: "[vi]Server [vi]đang bị [en]down [vi], mọi người kiểm tra giúp.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Máy chủ đang bị sập, mọi người kiểm tra giúp.",
      viAudioUrl: null,
      viDuration: "00:06",
    },
    {
      id: "REC-2025-015",
      taskName: "Chủ đề đặc biệt: Giáo dục",
      speaker: "Đặng Mai Phương",
      time: "01/09/2026 - 10:30",
      csText: "[vi]Lớp mình sẽ có 1 bài [en]quiz [vi]ngắn vào thứ Sáu.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Lớp mình sẽ có 1 bài kiểm tra ngắn vào thứ Sáu.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-016",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Trần Minh Tâm",
      time: "31/08/2026 - 08:20",
      csText: "[vi]Nhớ [en]confirm [vi]lại giờ họp chiều nay nhé.",
      csAudioUrl: null,
      csDuration: "00:04",
      viText: "Nhớ xác nhận lại giờ họp chiều nay nhé.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-017",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Nguyễn Mạnh Lực",
      time: "31/08/2026 - 07:45",
      csText: "[vi]Sáng nay mình có 1 cuộc [en]call [vi]với khách hàng.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Sáng nay mình có 1 cuộc gọi với khách hàng.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
    {
      id: "REC-2025-018",
      taskName: "Nhiệm vụ ghi âm hàng ngày",
      speaker: "Đặng Mai Phương",
      time: "30/08/2026 - 17:10",
      csText: "[vi]Đừng quên [en]submit [vi]báo cáo trước 6 giờ chiều.",
      csAudioUrl: null,
      csDuration: "00:05",
      viText: "Đừng quên nộp báo cáo trước 6 giờ chiều.",
      viAudioUrl: null,
      viDuration: "00:05",
    },
  ]);

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

  const totalPages = Math.ceil(filteredQueue.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedQueue = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, currentPage]);

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
    <div className="space-y-2.5 text-left font-sans">
      {/* ================= HEADER / TASK INFO ================= */}
      {taskTotal !== undefined && (
        <div className="bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
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
        <div className="bg-white rounded-2xl border border-[#E5E2D8] overflow-hidden">
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

                <SparklinePlayer
                  src={rec.csAudioUrl || "/demo-recording-cs.wav"}
                  useRealWaveform={Boolean(rec.csAudioUrl)}
                  seed={`${rec.id}-cs`}
                  fallbackDuration={parseDurationToSeconds(rec.csDuration)}
                  previewProgress={rec.csPreview}
                />

                <p className="text-sm font-semibold text-[#16171C] leading-5 basis-full xl:basis-auto xl:flex-1 xl:ml-1 min-w-0 break-words">
                  <CodeSwitchPreview transcript={rec.csText} />
                </p>
              </div>

              {/* VI */}
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-x-2.5 gap-y-1 py-0.5 sm:pl-7">
                <InlineLabel variant="vi" />

                <SparklinePlayer
                  src={rec.viAudioUrl || "/demo-recording-vi.wav"}
                  useRealWaveform={Boolean(rec.viAudioUrl)}
                  seed={`${rec.id}-vi`}
                  fallbackDuration={parseDurationToSeconds(rec.viDuration)}
                  previewProgress={rec.viPreview}
                />

                <p className="text-sm font-semibold text-[#16171C] leading-5 basis-full xl:basis-auto xl:flex-1 xl:ml-1 min-w-0 break-words">
                  {rec.viText}
                </p>
              </div>
            </div>
          ))}

          {/* ================= PAGINATION ================= */}
          <div className="border-t border-[#F0EEE6] px-4 py-2 flex justify-center">
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