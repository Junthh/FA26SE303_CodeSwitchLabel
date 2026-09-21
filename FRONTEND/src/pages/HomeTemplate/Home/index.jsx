import React, { useState } from 'react';
import { Mic, Target, Check } from 'lucide-react';
import {
  SPEAKER_ACCENT as ACCENT,
  SURFACE_MUTED,
  TEXT_HEADING, TEXT_BODY,
  TEXT_ON_DARK_PRIMARY, TEXT_ON_DARK_SECONDARY,
  BORDER_LIGHT, BORDER_DARK_SUBTLE,
  CHIP_SUCCESS_BG, CHIP_SUCCESS_BORDER, CHIP_SUCCESS_TEXT,
  CHIP_WARNING_BG, CHIP_WARNING_BORDER, CHIP_WARNING_TEXT,
} from '../../../constants/theme';

// Bảng màu riêng của trang chủ; không thay đổi theme các trang khác.
const SURFACE_HERO = '#172337';
const SURFACE_HERO_ROW = '#223149';
const HERO_TEXT_MUTED = '#B7C5D8';
const HERO_BAR = '#60A5FA';
const SUCCESS = '#3FA66B';
const WARNING = '#D9A441';
const RANK_FIRST = '#4ADE80';
const RANK_FIRST_BG = 'linear-gradient(90deg, rgba(74,222,128,0.12), rgba(74,222,128,0.04))';
const RANK_FIRST_BORDER = 'rgba(74,222,128,0.25)';

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

  const myTasks = [
    { id: '1', title: 'Nhiệm vụ ghi âm hàng ngày', description: 'Thu âm các đoạn hội thoại theo yêu cầu.', completed: 45, target: 100, deadline: '25/05/2025' },
    { id: '2', title: 'Nhiệm vụ ghi âm cuối tuần', description: 'Ghi âm các câu văn theo chủ đề được giao.', completed: 80, target: 80, deadline: '28/05/2025' },
    { id: '3', title: 'Nhiệm vụ ghi âm theo chủ đề', description: 'Ghi âm các đoạn văn bản tự do theo chủ đề.', completed: 8, target: 50, deadline: '02/06/2025' },
    { id: '4', title: 'Nhiệm vụ kiểm tra chất lượng', description: 'Nghe lại và đánh giá chất lượng bản ghi.', completed: 3, target: 30, deadline: '05/06/2025' },
  ];

  return (
    <div className="space-y-6 pb-16 text-left min-h-screen relative font-sans">

      {/* HERO: bảng điều khiển tối, bảng xếp hạng */}
      <div className="relative rounded-[20px] p-6 lg:p-7 overflow-hidden" style={{ background: SURFACE_HERO }}>
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
          style={{ background: `${ACCENT}1A` }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between">

          {/* Cột trái */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ACCENT }} />
              <span className="text-[12.5px] font-semibold" style={{ color: HERO_TEXT_MUTED }}>
                Đang mở · Vòng ghi âm tuần này
              </span>
            </div>

            <div>
              <h2 className="text-2xl lg:text-[26px] font-extrabold tracking-tight leading-snug" style={{ color: TEXT_ON_DARK_PRIMARY }}>
                Ai ghi nhanh nhất tuần này?
              </h2>
              <p className="text-[13px] leading-relaxed mt-2 max-w-sm" style={{ color: HERO_TEXT_MUTED }}>
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
                      ? ''
                      : 'border hover:text-white'
                  }`}
                  style={
                    selectedLb === key
                      ? { background: ACCENT, color: TEXT_ON_DARK_PRIMARY }
                      : { background: `${ACCENT}1A`, color: HERO_BAR, borderColor: `${ACCENT}80` }
                  }
                >
                  {data.title}
                </button>
              ))}
            </div>
          </div>

          {/* Cột phải: bảng điểm */}
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
                      ? { background: RANK_FIRST_BG, border: `1px solid ${RANK_FIRST_BORDER}` }
                      : { background: SURFACE_HERO_ROW, border: '1px solid transparent' }
                  }
                >
                  {medal ? (
                    <span className="text-[19px] shrink-0 w-7 text-center">{medal}</span>
                  ) : (
                    <span className="font-mono w-7 text-center text-sm font-semibold shrink-0" style={{ color: HERO_TEXT_MUTED }}>
                      {String(user.rank).padStart(2, '0')}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-[13.5px] font-semibold`} style={{ color: TEXT_ON_DARK_PRIMARY }}>
                      {user.name}
                      {isTop1 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full ml-2 font-bold align-middle"
                          style={{ background: RANK_FIRST, color: SURFACE_HERO }}
                        >
                          Dẫn đầu
                        </span>
                      )}
                    </p>
                    <div className={`h-1.5 rounded-full mt-1.5 overflow-hidden ${isTop1 ? 'bg-white/10' : 'bg-white/[0.07]'}`}>
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: isTop1 ? RANK_FIRST : HERO_BAR }} />
                    </div>
                  </div>
                  <span className={`font-mono text-[13px] shrink-0 ${isTop1 ? 'font-bold' : ''}`} style={{ color: isTop1 ? RANK_FIRST : HERO_BAR }}>
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
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: TEXT_HEADING }}>
              <Target className="w-4 h-4" style={{ color: ACCENT }} /> Nhiệm vụ của bạn
            </h3>
            <p className="text-xs mt-0.5" style={{ color: TEXT_BODY }}>
              Hoàn thành để giữ hạng trên bảng xếp hạng.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {myTasks.map((task) => {
            const percent = task.target > 0 ? Math.round((task.completed / task.target) * 100) : 0;
            const isDone = task.completed >= task.target;

            // >= 50% hoặc hoàn thành → SUCCESS xanh, < 50% → WARNING cam
            const barColor = isDone || percent >= 50 ? SUCCESS : WARNING;

            return (
              <div
                key={task.id}
                className="rounded-2xl p-4 px-5 flex flex-col lg:flex-row lg:items-center gap-4"
                style={{ background: '#FFFFFF', border: `1px solid ${BORDER_LIGHT}` }}
              >
                {/* Tiêu đề + mô tả */}
                <div className="w-full lg:w-4/12 min-w-0">
                  <h4 className="text-[13.5px] font-bold truncate" style={{ color: TEXT_HEADING }}>{task.title}</h4>
                  <p className="text-xs truncate mt-0.5" style={{ color: TEXT_BODY }}>{task.description}</p>
                </div>

                {/* Thanh tiến độ */}
                <div className="w-full lg:w-3/12 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: SURFACE_MUTED }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, background: barColor }}
                    />
                  </div>
                  <span className="font-mono text-xs whitespace-nowrap" style={{ color: TEXT_BODY }}>
                    {task.completed}/{task.target}
                  </span>
                </div>

                {/* Trạng thái (chip) + hạn chót + CTA */}
                <div className="w-full lg:w-5/12 flex items-center justify-between gap-3">
                  {isDone ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ color: CHIP_SUCCESS_TEXT, background: CHIP_SUCCESS_BG, border: `1px solid ${CHIP_SUCCESS_BORDER}` }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: SUCCESS }} /> Hoàn thành
                    </span>
                  ) : percent >= 50 ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ color: CHIP_SUCCESS_TEXT, background: CHIP_SUCCESS_BG, border: `1px solid ${CHIP_SUCCESS_BORDER}` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: SUCCESS }} /> Đang thực hiện
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ color: CHIP_WARNING_TEXT, background: CHIP_WARNING_BG, border: `1px solid ${CHIP_WARNING_BORDER}` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: WARNING }} /> Đang thực hiện
                    </span>
                  )}
                  <div className="text-right hidden sm:block">
                    <p className="text-[10.5px] font-semibold" style={{ color: TEXT_BODY }}>Hạn chót</p>
                    <p className="font-mono text-xs font-semibold" style={{ color: TEXT_HEADING }}>{task.deadline}</p>
                  </div>
                  {isDone ? (
                    <button
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                      style={{ color: ACCENT, background: `${ACCENT}0D`, border: `1px solid ${ACCENT}33` }}
                    >
                      Xem lại
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                      style={{ background: ACCENT, color: TEXT_ON_DARK_PRIMARY }}
                    >
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