import React, { useState } from 'react';
import { Mic, Target, Check } from 'lucide-react';
import { SPEAKER_ACCENT as ACCENT, SUCCESS } from '../../../constants/theme';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function SpeakerDashboard() {
  const leaderboards = {
    task_daily: {
      title: 'Nhiệm vụ hàng ngày',
      target: 100,
      top: [
        { rank: 1, name: 'Nguyễn Mạnh Lực', completed: 99 },
        { rank: 2, name: 'Đặng Mai Phương', completed: 90 },
        { rank: 3, name: 'Trần Minh Tâm', completed: 85 },
        { rank: 4, name: 'Lê Hoàng Nam', completed: 72 },
        { rank: 5, name: 'Phạm Thu Thảo', completed: 68 },
      ],
    },
    task_weekend: {
      title: 'Nhiệm vụ cuối tuần',
      target: 80,
      top: [
        { rank: 1, name: 'Hoàng Quốc Bảo', completed: 78 },
        { rank: 2, name: 'Nguyễn Mạnh Lực', completed: 70 },
        { rank: 3, name: 'Lê Hoàng Nam', completed: 65 },
        { rank: 4, name: 'Đặng Mai Phương', completed: 50 },
        { rank: 5, name: 'Trần Minh Tâm', completed: 42 },
      ],
    },
  };

  const [selectedLb, setSelectedLb] = useState('task_daily');
  const currentLeaderboard = leaderboards[selectedLb];

  // Không còn statusColor cứng - trạng thái tính từ completed/target: đủ chỉ tiêu = Hoàn thành
  const myTasks = [
    { id: '1', title: 'Nhiệm vụ ghi âm hàng ngày', description: 'Thu âm các đoạn hội thoại theo yêu cầu.', completed: 45, target: 100, deadline: '25/05/2025' },
    { id: '2', title: 'Nhiệm vụ ghi âm cuối tuần', description: 'Ghi âm các câu văn theo chủ đề được giao.', completed: 80, target: 80, deadline: '28/05/2025' },
    { id: '3', title: 'Nhiệm vụ ghi âm theo chủ đề', description: 'Ghi âm các đoạn văn bản tự do theo chủ đề.', completed: 8, target: 50, deadline: '02/06/2025' },
    { id: '4', title: 'Nhiệm vụ kiểm tra chất lượng', description: 'Nghe lại và đánh giá chất lượng bản ghi.', completed: 3, target: 30, deadline: '05/06/2025' },
  ];

  return (
    <div className="space-y-6 pb-16 text-left min-h-screen relative font-sans">

      {/* HERO: bảng điều khiển tối, bảng xếp hạng dạng bảng điểm */}
      <div className="relative bg-[#16171C] rounded-[20px] p-6 lg:p-7 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: `${ACCENT}1A` }} />

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between">

          {/* Cột trái: tiêu đề + chọn nhiệm vụ dạng tab */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ACCENT }} />
              <span className="text-[12.5px] font-semibold text-[#9A9CA6]">Đang mở · Vòng ghi âm tuần này</span>
            </div>

            <div>
              <h2 className="text-2xl lg:text-[26px] font-extrabold text-white tracking-tight leading-snug">
                Ai ghi nhanh nhất tuần này?
              </h2>
              <p className="text-[13px] text-[#9A9CA6] leading-relaxed mt-2 max-w-sm">
                Bảng điểm cập nhật ngay khi có người nộp bản ghi mới. Hoàn thành nhiệm vụ để giữ vị trí của bạn.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {Object.entries(leaderboards).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setSelectedLb(key)}
                  className={`px-3.5 py-2 rounded-lg text-[12.5px] font-bold transition-colors ${
                    selectedLb === key
                      ? 'text-white'
                      : 'bg-[#1F2129] text-[#9A9CA6] border border-[#262830] hover:text-white'
                  }`}
                  style={selectedLb === key ? { background: ACCENT } : {}}
                >
                  {data.title}
                </button>
              ))}
            </div>
          </div>

          {/* Cột phải: bảng điểm - top 3 có huy chương, top 1 nổi bật vàng */}
          <div className="w-full lg:w-7/12 flex flex-col gap-2">
            {currentLeaderboard.top.map((user) => {
              const percent = Math.round((user.completed / currentLeaderboard.target) * 100);
              const isTop1 = user.rank === 1;
              const medal = MEDALS[user.rank];
              return (
                <div
                  key={user.rank}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-[14px]"
                  style={
                    isTop1
                      ? { background: 'linear-gradient(90deg, rgba(217,164,65,0.18), rgba(217,164,65,0.04))', border: '1px solid rgba(217,164,65,0.45)' }
                      : { background: '#1F2129', border: '1px solid transparent' }
                  }
                >
                  {medal ? (
                    <span className="text-[19px] shrink-0 w-7 text-center">{medal}</span>
                  ) : (
                    <span className="font-mono w-7 text-center text-sm font-semibold text-[#6E7078] shrink-0">
                      {String(user.rank).padStart(2, '0')}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-[13.5px] font-semibold ${isTop1 ? 'text-[#D9A441]' : 'text-white'}`}>
                      {user.name}
                      {isTop1 && <span className="text-[10px] bg-[#D9A441] text-[#16171C] px-1.5 py-0.5 rounded-full ml-2 font-bold align-middle">Dẫn đầu</span>}
                    </p>
                    <div className={`h-1.5 rounded-full mt-1.5 overflow-hidden ${isTop1 ? 'bg-white/10' : 'bg-white/[0.07]'}`}>
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: isTop1 ? '#D9A441' : ACCENT }} />
                    </div>
                  </div>
                  <span className={`font-mono text-[13px] shrink-0 ${isTop1 ? 'text-[#D9A441] font-bold' : 'text-[#9A9CA6]'}`}>
                    {user.completed}<span className="text-[10px] opacity-60">/{currentLeaderboard.target}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* NHIỆM VỤ CỦA BẠN */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-base font-extrabold text-[#2B2C31] flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: ACCENT }} /> Nhiệm vụ của bạn
            </h3>
            <p className="text-xs text-[#6E7078] mt-0.5">Hoàn thành để giữ hạng trên bảng xếp hạng.</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {myTasks.map((task) => {
            const percent = task.target > 0 ? Math.round((task.completed / task.target) * 100) : 0;
            const isDone = task.completed >= task.target;
            const barColor = isDone ? SUCCESS : ACCENT;

            return (
              <div
                key={task.id}
                className="bg-white border border-[#E5E2D8] rounded-2xl p-4 px-5 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                {/* Tiêu đề + mô tả */}
                <div className="w-full lg:w-4/12 min-w-0">
                  <h4 className="text-[13.5px] font-bold text-[#2B2C31] truncate">{task.title}</h4>
                  <p className="text-xs text-[#6E7078] truncate mt-0.5">{task.description}</p>
                </div>

                {/* Thanh tiến độ */}
                <div className="w-full lg:w-3/12 flex items-center gap-3">
                  <div className="flex-1 bg-[#F0EEE6] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, background: barColor }}
                    />
                  </div>
                  <span className="font-mono text-xs text-[#6E7078] whitespace-nowrap">
                    {task.completed}/{task.target}
                  </span>
                </div>

                {/* Trạng thái (chip) + hạn chót + CTA */}
                <div className="w-full lg:w-5/12 flex items-center justify-between gap-3">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#1F5C3F] bg-[#EAF7EF] border border-[#C5E8D3] whitespace-nowrap">
                      <Check className="w-3.5 h-3.5" style={{ color: SUCCESS }} /> Hoàn thành
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#C0442B] bg-[#FDECE8] border border-[#F8D3C9] whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} /> Đang thực hiện
                    </span>
                  )}
                  <div className="text-right hidden sm:block">
                    <p className="text-[10.5px] text-[#6E7078] font-semibold">Hạn chót</p>
                    <p className="font-mono text-xs font-semibold text-[#2B2C31]">{task.deadline}</p>
                  </div>
                  {isDone ? (
                    <button className="px-4 py-2 rounded-lg text-xs font-bold text-[#6E7078] bg-[#F0EEE6] border border-[#E5E2D8] hover:bg-[#E9E6DA] transition-colors whitespace-nowrap cursor-pointer">
                      Xem lại
                    </button>
                  ) : (
                    <button className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#16171C] hover:bg-[#26282F] transition-colors whitespace-nowrap cursor-pointer">
                      Ghi âm tiếp
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}