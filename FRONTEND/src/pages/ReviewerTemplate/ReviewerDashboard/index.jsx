import { ArrowRight, PieChart, FolderKanban, CircleCheck, CircleX, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { REVIEWER_ACCENT as ACCENT } from '../../../constants/theme';

export default function ReviewerDashboard() {
  const navigate = useNavigate();

  const ongoingTasks = [
    { title: 'Nhiệm vụ ghi âm hàng ngày', reviewed: 65, target: 100, deadline: '28/05/2025' },
    { title: 'Chủ đề công nghệ & AI', reviewed: 135, target: 150, deadline: '05/06/2025' },
    { title: 'Hội thoại đời sống thường nhật', reviewed: 30, target: 110, deadline: '20/06/2025' },
  ];

  const approvedCount = 1782;
  const rejectedCount = 120;
  const totalReviewed = approvedCount + rejectedCount;
  const approvedPercent = Math.round((approvedCount / totalReviewed) * 100);
  const rejectedPercent = Math.round((rejectedCount / totalReviewed) * 100);

  const rejectStats = [
    { label: 'Phát âm sai (Code-Switching)', percentage: 50, count: '8 bản', color: ACCENT },
    { label: 'Tạp âm / Tiếng ồn môi trường', percentage: 31, count: '5 bản', color: '#D9A441' },
    { label: 'Đọc thiếu / Sai văn bản', percentage: 19, count: '3 bản', color: '#C63B3B' },
  ];

  // Vòng donut tỉ lệ duyệt/từ chối - vẽ bằng 2 vòng tròn SVG stroke chồng nhau
  const R = 32;
  const CIRC = 2 * Math.PI * R; // chu vi vòng tròn
  const approvedDash = (approvedPercent / 100) * CIRC;

  return (
    <div className="space-y-5 pb-6 text-left font-sans">

      {/* 1. THẺ CHỈ SỐ TỔNG QUAN - donut tỉ lệ + 2 thẻ số */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Donut tỉ lệ duyệt/từ chối */}
        <div className="bg-white p-[18px] rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex items-center gap-4">
          <div className="relative w-[76px] h-[76px] shrink-0">
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r={R} fill="none" stroke="#FDEAEA" strokeWidth="9" />
              <circle
                cx="38" cy="38" r={R} fill="none" stroke="#3FA66B" strokeWidth="9"
                strokeDasharray={`${approvedDash} ${CIRC}`} strokeLinecap="round"
                transform="rotate(-90 38 38)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-[#16171C]">{approvedPercent}%</div>
          </div>
          <div>
            <p className="text-[11.5px] text-[#6E7078] mb-1">Tỉ lệ duyệt / từ chối</p>
            <p className="text-[22px] font-bold font-mono text-[#16171C] leading-none">
              {totalReviewed.toLocaleString('vi-VN')} <span className="text-[11.5px] text-[#9A9CA3] font-normal">tổng</span>
            </p>
            <p className="text-[11px] mt-1.5">
              <span className="text-[#3FA66B]">●</span> <span className="text-[#6E7078]">{approvedCount.toLocaleString('vi-VN')} duyệt</span>{' '}
              &nbsp;<span className="text-[#C63B3B]">●</span> <span className="text-[#6E7078]">{rejectedCount} từ chối</span>
            </p>
          </div>
        </div>

        {/* Đã phê duyệt */}
        <div className="bg-white p-[18px] rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)]">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EAF7EF' }}>
              <CircleCheck className="w-4 h-4" style={{ color: '#3FA66B' }} />
            </span>
            <span className="text-[11.5px] text-[#6E7078]">Đã phê duyệt</span>
          </div>
          <p className="text-[26px] font-bold font-mono text-[#16171C] leading-none">{approvedCount.toLocaleString('vi-VN')}</p>
          <p className="text-[11px] text-[#6E7078] mt-1.5">Đạt {approvedPercent}% chất lượng</p>
        </div>

        {/* Đã từ chối */}
        <div className="bg-white p-[18px] rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)]">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FDEAEA' }}>
              <CircleX className="w-4 h-4" style={{ color: '#C63B3B' }} />
            </span>
            <span className="text-[11.5px] text-[#6E7078]">Đã từ chối</span>
          </div>
          <p className="text-[26px] font-bold font-mono text-[#16171C] leading-none">{rejectedCount}</p>
          <p className="text-[11px] text-[#9A9CA3] mt-1.5">Chiếm {rejectedPercent}% tổng số</p>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 CỘT CÂN ĐỐI 1:1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">

        {/* CỘT TRÁI: Tiến độ nhiệm vụ & Hạn chót */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col">
          <div className="mb-3.5 flex justify-between items-center">
            <h3 className="font-bold text-[#16171C] text-[13.5px] flex items-center gap-1.5">
              <FolderKanban className="w-[15px] h-[15px]" style={{ color: ACCENT }} /> Tiến độ nhiệm vụ đang kiểm duyệt
            </h3>
            <button
              onClick={() => navigate('/reviewer/task')}
              className="text-xs font-bold hover:underline cursor-pointer"
              style={{ color: ACCENT }}
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-[9px] flex-1">
            {ongoingTasks.map((task, idx) => {
              const percent = Math.round((task.reviewed / task.target) * 100);
              return (
                <div key={idx} className="p-[13px] rounded-xl bg-[#F7F5EF] border border-[#EDEBE3]">
                  <div className="flex justify-between items-center mb-[7px]">
                    <span className="font-semibold text-[#16171C] text-xs">{task.title}</span>
                    <span className="text-[9.5px] font-mono text-[#9A9CA3] bg-white px-2 py-0.5 rounded border border-[#E5E2D8] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> Hạn {task.deadline}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10.5px] text-[#6E7078] mb-[5px]">
                    <span>{task.reviewed}/{task.target} bản</span>
                    <span className="font-bold font-mono" style={{ color: ACCENT }}>{percent}%</span>
                  </div>
                  <div className="w-full bg-[#E5E2D8] h-1.5 rounded-full overflow-hidden mb-[9px]">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: ACCENT }} />
                  </div>

                  <button
                    onClick={() => navigate(`/reviewer/recording?task=${encodeURIComponent(task.title)}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
                    style={{ background: ACCENT }}
                  >
                    Vào duyệt <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI: Phân tích lý do từ chối & Gợi ý QA */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-bold text-[#16171C] text-[13.5px] flex items-center gap-1.5">
              <PieChart className="w-[15px] h-[15px]" style={{ color: ACCENT }} /> Lý do từ chối phổ biến
            </h3>
            <span className="text-[10.5px] text-[#9A9CA3]">Hệ thống</span>
          </div>

          <div className="space-y-4 flex-1">
            {rejectStats.map((stat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-[7px]">
                  <span className="text-[#16171C] font-semibold">{stat.label}</span>
                  <span className="font-bold text-[#16171C] font-mono">{stat.percentage}%</span>
                </div>
                <div className="w-full bg-[#E5E2D8] h-[7px] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${stat.percentage}%`, background: stat.color }} />
                </div>
                <p className="text-[10.5px] text-[#9A9CA3] mt-[6px]">Tổng số lỗi ghi nhận: {stat.count}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-[13px] rounded-xl border flex items-start gap-2.5" style={{ background: '#EAEBFB', borderColor: '#CFD0F4' }}>
            <Sparkles className="w-[15px] h-[15px] shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="text-[11px] leading-relaxed" style={{ color: '#3F41A8' }}>
              <strong>Gợi ý QA:</strong> Tỷ lệ phát âm sai từ Code-Switching chiếm 50%. Hãy chú ý kỹ âm đuôi của speaker.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}