import React, { useState, useRef, useEffect } from "react";
import TaskStepper from "../../../components/TaskStepper/TaskStepper";
import { Send, Play, Pause, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { parseCodeSwitch } from "../../../components/CodeSwitchText/CodeSwitchText";
import { SPEAKER_ACCENT as ACCENT } from "../../../constants/theme";

// TODO: thay bằng dữ liệu thật từ API - giữ nguyên format có thẻ [vi]/[en]
const SENTENCE_TRANSCRIPT = "[vi]Em nhớ [en]upload [vi]tài liệu trước [en]deadline [vi]nhé.";

export default function SubmitTask({ audioUrl, durationSeconds = 7 }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: thay bằng URL bản ghi thật (props/state khi điều hướng từ bước trước)
  const src = audioUrl || "/demo-recording.wav";
  const audioRef = useRef(null);
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
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.floor(Math.abs(s) % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // Dùng durationSeconds làm giá trị hiển thị tạm trước khi metadata audio load xong,
  // tránh hiện "-0:00" xấu xí lúc mới vào trang
  const effectiveDuration = duration || durationSeconds;
  const playedFraction = effectiveDuration ? currentTime / effectiveDuration : 0;
  const sentenceSegments = parseCodeSwitch(SENTENCE_TRANSCRIPT);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // TODO: nối API nộp bài thật, thay cho setTimeout mô phỏng này
      toast.success("Nộp bài thành công!", {
        description: "Bản ghi đang chờ đội ngũ kiểm duyệt chất lượng.",
      });
      navigate("/review-text");
    }, 1200);
  };

  return (
    <div className="space-y-5 pb-6 text-left max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={4} />

      {/* Recap gọn: câu văn + bản ghi trong 1 khối duy nhất */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-6 space-y-3">
        <h3 className="font-bold text-[#16171C] text-[15px] mb-2">Kiểm tra lần cuối trước khi nộp</h3>

        <div className="p-4 bg-[#F7F5EF] rounded-xl border border-[#E5E2D8]">
          <p className="text-base sm:text-lg font-bold text-[#16171C] leading-relaxed">
            "{sentenceSegments.map((seg, i) =>
              seg.lang === "en" ? (
                <span key={i} style={{ color: ACCENT }}>{seg.text}</span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}"
          </p>
        </div>

        {/* Khối audio - thu nhỏ nút play + track mảnh hơn để cân sức nặng thị giác với khối câu ở trên */}
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
        <div className="p-3.5 bg-[#F7F5EF] rounded-xl border border-[#E5E2D8] flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-[0_4px_10px_rgba(255,75,46,0.28)] hover:scale-105 active:scale-95 transition-transform"
            style={{ background: ACCENT }}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[11.5px] text-[#6E7078] font-mono font-semibold mb-1">
              <span className="truncate pr-2">recording_task2025_001.wav</span>
              <span className="text-[#16171C]">{formatTime(effectiveDuration - currentTime)}</span>
            </div>
            <div className="w-full bg-[#E5E2D8] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{ width: `${playedFraction * 100}%`, background: ACCENT }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Nút hành động: xếp chung 1 hàng cho cân đối, nộp bài vẫn là trọng tâm nhờ chiếm phần lớn hơn */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/review-recording")}
          className="flex-1 py-4 bg-white border border-[#E5E2D8] text-[#6E7078] hover:text-[#16171C] rounded-2xl text-[13.5px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_10px_rgba(85,86,91,0.15)] transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Quay lại kiểm tra
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-[2] py-4 text-white font-bold text-[15px] rounded-2xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-all shadow-[0_10px_24px_rgba(255,75,46,0.25)]"
          style={{ background: ACCENT }}
        >
          {isSubmitting ? <span>Đang nộp bài...</span> : (<><Send className="w-4 h-4" /> Xác nhận và nộp bài</>)}
        </button>
      </div>
    </div>
  );
}