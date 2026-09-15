import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Headphones, History, X, ChevronDown, Mic, FileText } from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import { REVIEWER_ACCENT as ACCENT, REVIEWER_ACCENT_ACTIVE_ICON as ACCENT_ICON, REVIEWER_ACCENT_SOFT_BG as ACCENT_SOFT_BG } from '../../constants/theme';

export default function ReviewerSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const path = location.pathname;

  // Mục phẳng (không dropdown)
  const topItems = [
    { name: 'Tổng quan & Tiến độ', to: '/reviewer', icon: LayoutDashboard, end: true },
    { name: 'Nhiệm vụ', to: '/reviewer/task', icon: CheckSquare },
  ];

  // Nhóm Kiểm duyệt
  const reviewChildren = [
    { to: '/reviewer/recording', label: 'Ghi âm', icon: Mic },
    { to: '/reviewer/contribution', label: 'Câu đóng góp', icon: FileText },
  ];
  const isReviewActive = path === '/reviewer/recording' || path === '/reviewer/contribution';

  // Nhóm Lịch sử kiểm duyệt
  const historyChildren = [
    { to: '/reviewer/history-recording', label: 'Ghi âm', icon: Mic },
    { to: '/reviewer/history-contribution', label: 'Câu đóng góp', icon: FileText },
  ];
  // FIX: khớp đúng với `to` của mục con (gạch ngang), trước đây dùng gạch chéo nên không bao giờ khớp
  const isHistoryActive =
    path === '/reviewer/history-recording' || path === '/reviewer/history-contribution';

  const [reviewOpen, setReviewOpen] = useState(isReviewActive);
  const [historyOpen, setHistoryOpen] = useState(isHistoryActive);

  const itemBase = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all';
  const idleCls = 'text-[#9EA6B8] hover:bg-white/[0.06] hover:text-white';
  const parentActiveStyle = { background: ACCENT_SOFT_BG, borderColor: ACCENT };

  // Render 1 nhóm dropdown (cha + list con)
  const renderGroup = ({ icon: Icon, label, children, isActive, open, setOpen }) => (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`${itemBase} w-full justify-between ${isActive ? 'text-white border border-l-[3px]' : idleCls}`}
        style={isActive ? parentActiveStyle : {}}
      >
        <span className="flex items-center gap-3">
          <Icon className="w-4 h-4 shrink-0" style={isActive ? { color: ACCENT_ICON } : {}} />
          <span>{label}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="ml-4 pl-3 border-l border-white/10 space-y-1">
          {children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onClose}
                className={({ isActive: a }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
                    a ? 'bg-white/[0.06] text-white' : 'text-[#9EA6B8] hover:bg-white/[0.06] hover:text-white'
                  }`
                }
              >
                {({ isActive: a }) => (
                  <>
                    <ChildIcon className="w-3.5 h-3.5 shrink-0" style={a ? { color: ACCENT_ICON } : {}} />
                    <span>{child.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 w-64 flex flex-col p-5 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{ background: '#1A1E28' }}
    >
      <div className="flex items-center justify-between mb-5">
        <Logo variant="light" size={40} />
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-[#9B9BB0] hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="space-y-1 text-left">
        {topItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `${itemBase} ${isActive ? 'text-white border border-l-[3px]' : idleCls}`}
              style={({ isActive }) => (isActive ? parentActiveStyle : {})}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" style={isActive ? { color: ACCENT_ICON } : {}} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {renderGroup({ icon: Headphones, label: 'Kiểm duyệt', children: reviewChildren, isActive: isReviewActive, open: reviewOpen, setOpen: setReviewOpen })}
        {renderGroup({ icon: History, label: 'Lịch sử kiểm duyệt', children: historyChildren, isActive: isHistoryActive, open: historyOpen, setOpen: setHistoryOpen })}
      </nav>
    </aside>
  );
}