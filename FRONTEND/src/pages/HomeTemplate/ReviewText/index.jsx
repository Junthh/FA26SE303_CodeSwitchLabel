import React, { useState } from "react";
import TaskStepper from "../../../components/TaskStepper/TaskStepper";
import {
  Edit3,
  ArrowRight,
  SkipForward,
  ChevronDown,
  Check,
  Quote,
  Flag,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import CodeSwitchText from "../../../components/CodeSwitchText/CodeSwitchText";
import { SPEAKER_ACCENT as ACCENT } from "../../../constants/theme";

const REPORT_REASONS = [
  { id: "grammar", label: "Sai ngữ pháp", desc: "Câu sai cấu trúc, ngữ pháp" },
  { id: "spelling", label: "Sai chính tả", desc: "Từ viết sai, gõ nhầm" },
  { id: "semantic", label: "Sai ngữ nghĩa", desc: "Nghĩa câu khó hiểu, không hợp lý" },
  { id: "other", label: "Khác", desc: null },
];

export default function ReviewText() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTaskId = searchParams.get("taskId");
  const isJustSubmitted = searchParams.get("success") === "true";

  const [activeTasks] = useState([
    { id: "task-1", title: "Nhiệm vụ ghi âm hàng ngày", category: "Hội thoại hàng ngày", completed: 45, goal: 100, deadline: "25/05/2025" },
    { id: "task-2", title: "Nhiệm vụ ghi âm cuối tuần (Gấp)", category: "Công sở & Giao tiếp", completed: 16, goal: 80, deadline: "28/05/2025" },
    { id: "task-4", title: "Chủ đề công nghệ & AI", category: "Công nghệ & AI", completed: 135, goal: 150, deadline: "10/06/2025" },
  ]);

  const [selectedTask, setSelectedTask] = useState(
    () => activeTasks.find((t) => t.id === currentTaskId) || activeTasks[0]
  );

  // TODO: thay bằng dữ liệu thật từ API - giữ nguyên shape này
  const [sentence] = useState({
    id: "2110000",
    domain: "IT/Technology",
    cs_transcript: "[vi]Em nên [en]scan [vi]tài liệu này rồi gửi qua [en]email [vi]cho tôi.",
    vi_equivalent: "[vi]Em nên quét tài liệu này rồi gửi qua thư điện tử cho tôi.",
    alignment: [
      { source: "scan", source_lang: "en", target: "quét", target_lang: "vi", relation: "semantic_equivalent" },
      { source: "email", source_lang: "en", target: "thư điện tử", target_lang: "vi", relation: "semantic_equivalent" },
    ],
  });

  // Popup chỉnh sửa câu
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValue, setEditValue] = useState(sentence.cs_transcript);

  // Popup báo lỗi câu
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState(null);
  const [reportOther, setReportOther] = useState("");

  // Nếu vừa nộp bản ghi xong (quay về từ bước nộp bài) thì báo thành công qua sonner
  React.useEffect(() => {
    if (isJustSubmitted) {
      toast.success("Nộp bản ghi thành công!", { description: "Chuyển sang câu tiếp theo." });
      setSearchParams({ taskId: selectedTask.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTaskChange = (e) => {
    const found = activeTasks.find((t) => t.id === e.target.value);
    if (found) {
      setSelectedTask(found);
      setSearchParams({ taskId: found.id });
    }
  };

  const handleNextStep = () => navigate(`/record-speech?taskId=${selectedTask.id}`);

  // TODO: nối API "bỏ qua câu" thật - hiện chỉ mô phỏng UI
  const handleSkip = () => toast("Đã bỏ qua câu này.", { description: "Đang tải câu tiếp theo..." });

  const openEditModal = () => {
    setEditValue(sentence.cs_transcript);
    setShowEditModal(true);
  };

  // TODO: nối API lưu chỉnh sửa thật - hiện chỉ mô phỏng UI
  const handleSaveEdit = () => {
    setShowEditModal(false);
    toast.success("Đã lưu chỉnh sửa câu.");
  };

  // TODO: nối API báo lỗi thật (gửi kèm reportReason / reportOther) - hiện chỉ mô phỏng UI
  const handleSubmitReport = () => {
    if (!reportReason) return;
    setShowReportModal(false);
    setReportReason(null);
    setReportOther("");
    toast.error("Đã gửi báo lỗi.", { description: "Cảm ơn bạn đã phản hồi!" });
  };

  const percent = Math.round((selectedTask.completed / selectedTask.goal) * 100);
  const accent = ACCENT;

  return (
    <div className="pb-12 text-left max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={1} />

      {/* THANH NHIỆM VỤ: gộp tên + tiến độ + hạn chót vào 1 hàng ngang gọn */}
      {/* relative z-10: luôn nổi trên thẻ câu văn phía dưới, phòng khi 2 lớp thẻ xếp chồng lấn lên */}
      <div className="relative z-10 bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-4 flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="relative min-w-0 sm:w-[38%] sm:pr-4 sm:border-r border-[#E5E2D8]">
          <select
            value={selectedTask.id}
            onChange={handleTaskChange}
            className="w-full appearance-none bg-transparent text-[13.5px] font-bold text-[#16171C] pr-6 outline-none cursor-pointer truncate"
          >
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#6E7078] absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
          <p className="text-[11px] text-[#9A9CA3] font-medium mt-1.5">Nhấn để đổi nhiệm vụ</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[11.5px] font-semibold mb-1.5">
            <span className="text-[#6E7078]">Tiến độ</span>
            <span className="font-mono text-[#16171C]">{selectedTask.completed}/{selectedTask.goal} · {percent}%</span>
          </div>
          <div className="h-2 bg-[#F0EEE6] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: accent }} />
          </div>
        </div>

        <div className="sm:text-right shrink-0 sm:pl-4 sm:border-l border-[#E5E2D8]">
          <p className="text-[10.5px] text-[#6E7078] font-semibold">Hạn chót</p>
          <p className="font-mono text-[13px] font-bold text-[#16171C]">{selectedTask.deadline}</p>
        </div>
      </div>

      {/* THẺ CÂU VĂN - trọng tâm, hiệu ứng xếp chồng nhiều lớp */}
      {/* mt-8: khoảng cách rộng rãi hơn hẳn với thanh nhiệm vụ ở trên, tránh mọi khả năng đè lên */}
      <div className="relative mt-8">
        <div className="absolute inset-x-2 -top-3 h-full bg-[#EFEDE3] border border-[#E2DFD3] rounded-[24px] rotate-[-1.5deg]" />
        <div className="absolute inset-x-1 -top-1.5 h-full bg-[#F7F5EF] border border-[#E9E6DA] rounded-[24px] rotate-[1deg]" />

        <div className="relative bg-white rounded-[24px] border border-[#E5E2D8] shadow-[0_6px_20px_rgba(16,17,20,0.07)] overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: accent }} />

          <div className="px-6 sm:px-10 pt-6 pb-10 sm:pb-12">
            <div className="flex items-center justify-end gap-2.5 mb-8">
              <div className="flex items-end gap-[2.5px] h-3.5">
                <span className="w-[2.5px] h-[5px] bg-[#D8D5C9] rounded-[1px]" />
                <span className="w-[2.5px] h-3 bg-[#D8D5C9] rounded-[1px]" />
                <span className="w-[2.5px] h-2 bg-[#D8D5C9] rounded-[1px]" />
                <span className="w-[2.5px] h-3.5 bg-[#D8D5C9] rounded-[1px]" />
                <span className="w-[2.5px] h-[7px] bg-[#D8D5C9] rounded-[1px]" />
              </div>
              <span className="font-mono text-[12.5px] font-semibold text-[#6E7078]">
                Câu {selectedTask.completed + 1}/{selectedTask.goal}
              </span>
            </div>

            <div className="text-center">
              <Quote className="w-7 h-7 mx-auto mb-5" style={{ color: accent, opacity: 0.35 }} fill="currentColor" />
              <h2 className="text-[26px] sm:text-[32px] font-bold text-[#16171C] leading-[1.6] tracking-tight max-w-lg mx-auto">
                <CodeSwitchText
                  transcript={sentence.cs_transcript}
                  alignment={sentence.alignment}
                  accent={accent}
                />
              </h2>

              <p className="text-[12.5px] text-[#6E7078] mt-6">
                Từ được tô màu là từ tiếng Anh — di chuột vào để xem nghĩa tiếng Việt
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA chính */}
      <button
        onClick={handleNextStep}
        className="w-full mt-4 py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-[0_10px_24px_rgba(255,75,46,0.25)]"
        style={{ background: accent }}
      >
        Sẵn sàng, vào ghi âm <ArrowRight className="w-4 h-4" />
      </button>

      {/* Hành động phụ - không khung bao, tự nổi bật bằng màu + box-shadow riêng từng nút */}
      <div className="flex items-center justify-center gap-3.5 flex-wrap mt-5">
        <button
          onClick={handleSkip}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F0EEE6] text-[#55565B] text-[14px] font-semibold shadow-[0_4px_10px_rgba(85,86,91,0.18)] hover:opacity-85 active:scale-[0.98] transition-all"
        >
          <SkipForward className="w-[18px] h-[18px]" /> Bỏ qua câu này
        </button>
        <button
          onClick={openEditModal}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFF1DE] text-[#A85E12] text-[14px] font-semibold shadow-[0_4px_10px_rgba(168,94,18,0.20)] hover:opacity-85 active:scale-[0.98] transition-all"
        >
          <Edit3 className="w-[18px] h-[18px]" /> Chỉnh sửa câu
        </button>
        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FDEAEA] text-[#C63B3B] text-[14px] font-semibold shadow-[0_4px_10px_rgba(198,59,59,0.22)] hover:opacity-85 active:scale-[0.98] transition-all"
        >
          <Flag className="w-[18px] h-[18px]" /> Báo lỗi câu này
        </button>
      </div>

      {/* POPUP: Chỉnh sửa câu - canh giữa theo outlet (khu vực nội dung), không tính sidebar */}
      {showEditModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4 lg:pl-64"
          style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ background: accent }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}1A` }}
                  >
                    <Edit3 className="w-[18px] h-[18px]" style={{ color: accent }} />
                  </div>
                  <span className="text-[16px] font-bold text-[#16171C]">Chỉnh sửa câu</span>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  aria-label="Đóng"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0"
                >
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>

              <label className="text-[12px] font-semibold text-[#6E7078] block mb-2">Nội dung câu</label>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                className="w-full min-h-[96px] bg-white border border-[#E5E2D8] focus:border-[#FF4B2E] focus:ring-4 focus:ring-[#FF4B2E]/10 rounded-[14px] p-3.5 text-[14.5px] leading-relaxed text-[#16171C] outline-none resize-none transition-all"
              />
              <p className="text-[11px] text-[#9A9CA3] mt-2">
                Giữ nguyên các thẻ [vi]/[en] để hệ thống nhận đúng ngôn ngữ.
              </p>

              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#E5E2D8] bg-white text-[#55565B] text-[13.5px] font-semibold hover:bg-[#F7F5EF] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editValue.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-white text-[13.5px] font-semibold shadow-[0_4px_10px_rgba(255,75,46,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: accent }}
                >
                  <Check className="w-4 h-4" /> Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Báo lỗi câu này - cùng cách canh giữa theo outlet như trên */}
      {showReportModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4 lg:pl-64"
          style={{ background: "rgba(22,23,28,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-[#C63B3B]" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FDEAEA]">
                    <Flag className="w-[18px] h-[18px] text-[#C63B3B]" />
                  </div>
                  <span className="text-[16px] font-bold text-[#16171C]">Báo lỗi câu này</span>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  aria-label="Đóng"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0"
                >
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>
              <p className="text-[12.5px] text-[#6E7078] mb-4 mt-1 ml-[46px]">Chọn loại lỗi bạn gặp phải</p>

              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReportReason(r.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] border text-left transition-colors ${
                      reportReason === r.id
                        ? "border-[#C63B3B] bg-[#FDEAEA]"
                        : "border-[#E5E2D8] bg-white hover:bg-[#F7F5EF]"
                    }`}
                  >
                    <span
                      className={`w-[16px] h-[16px] rounded-full flex-shrink-0 ${
                        reportReason === r.id ? "border-[5px] border-[#C63B3B]" : "border-[1.5px] border-[#C7C4B8]"
                      }`}
                    />
                    <span>
                      <span className="block text-[13.5px] font-bold text-[#16171C]">{r.label}</span>
                      {r.desc && <span className="block text-[11.5px] text-[#6E7078] mt-0.5">{r.desc}</span>}
                    </span>
                  </button>
                ))}
              </div>

              {reportReason === "other" && (
                <textarea
                  value={reportOther}
                  onChange={(e) => setReportOther(e.target.value)}
                  placeholder="Mô tả lỗi bạn gặp phải..."
                  autoFocus
                  className="w-full min-h-[70px] mt-2.5 bg-white border border-[#E5E2D8] focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 rounded-[14px] p-3 text-[13.5px] text-[#16171C] outline-none resize-none transition-all"
                />
              )}

              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#E5E2D8] bg-white text-[#55565B] text-[13.5px] font-semibold hover:bg-[#F7F5EF] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#C63B3B] text-white text-[13.5px] font-semibold shadow-[0_4px_10px_rgba(198,59,59,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Flag className="w-4 h-4" /> Gửi báo lỗi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}