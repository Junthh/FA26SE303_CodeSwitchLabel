import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  CheckSquare,
  PlusCircle,
  HelpCircle,
  X,
  History,
  Mic,
  ChevronDown,
  Headphones,
  FileText,
} from "lucide-react";
import Logo from "../Logo/Logo";
import {
  SPEAKER_ACCENT as ACCENT,
  SPEAKER_ACCENT_ACTIVE_ICON as ACCENT_ICON,
  SPEAKER_ACCENT_SOFT_BG as ACCENT_SOFT_BG,
} from "../../constants/theme";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Trang chủ", icon: Home },
    { path: "/review-text", label: "Nhiệm vụ của tôi", icon: CheckSquare },
    { path: "/contribute", label: "Đóng góp văn bản", icon: PlusCircle },
  ];

  const historyChildren = [
    { to: "/recording-history", label: "Ghi âm", icon: Headphones },
    { to: "/contribution-history", label: "Đóng góp", icon: FileText },
  ];

  const isHistoryActive =
    location.pathname === "/recording-history" || location.pathname === "/contribution-history";
  const [historyOpen, setHistoryOpen] = useState(isHistoryActive);

  // style dùng chung cho item cấp 1
  const itemBase =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all";
  const idleCls = "text-[#A8A19E] hover:bg-white/[0.06] hover:text-white";
  const activeStyle = { background: ACCENT_SOFT_BG, borderColor: ACCENT };

  return (
    <aside
      className={`w-64 bg-[#16171C] font-sans h-screen fixed left-0 top-0 flex flex-col justify-between p-5 z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="space-y-5 flex-1 text-left flex flex-col">
        {/* Header Sidebar (Logo) */}
        <div className="flex items-center justify-between">
          <Logo variant="light" size={40} />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#A8A19E] hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Điều hướng */}
        <nav className="space-y-1 text-left">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `${itemBase} ${isActive ? "text-white border border-l-[3px]" : idleCls}`
                }
                style={({ isActive }) => (isActive ? activeStyle : {})}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 shrink-0" style={isActive ? { color: ACCENT_ICON } : {}} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Lịch sử của tôi - dropdown xổ 2 mục con */}
          <div>
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className={`${itemBase} w-full justify-between ${isHistoryActive ? "text-white border border-l-[3px]" : idleCls}`}
              style={isHistoryActive ? activeStyle : {}}
            >
              <span className="flex items-center gap-3">
                <History className="w-4 h-4 shrink-0" style={isHistoryActive ? { color: ACCENT_ICON } : {}} />
                <span>Lịch sử của tôi</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Luôn render để có animation trượt - đóng thì max-height:0 + mờ đi */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                historyOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-4 pl-3 border-l border-white/10 space-y-1">
                {historyChildren.map((child) => {
                  const ChildIcon = child.icon;
                  return (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
                          isActive ? "bg-white/[0.06] text-white" : "text-[#A8A19E] hover:bg-white/[0.06] hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <ChildIcon className="w-3.5 h-3.5 shrink-0" style={isActive ? { color: ACCENT_ICON } : {}} />
                          <span>{child.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Thẻ nhắc mục đích, thay cho promo AI gradient */}
        <div className="mt-auto mb-2 bg-white/[0.04] p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-xs font-bold text-white">Vì sao giọng nói của bạn quan trọng</span>
          </div>
          <p className="text-xs text-[#A8A19E] leading-relaxed">
            Mỗi phút ghi âm giúp AI nhận diện tiếng Việt chính xác hơn.
          </p>
        </div>
      </div>

      {/* Footer Sidebar - chỉ còn Trung tâm hỗ trợ, Đăng xuất đã chuyển lên Header */}
      <div className="space-y-1 pt-4 border-t border-white/10 text-left shrink-0">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full text-[13px] font-semibold text-[#A8A19E] hover:bg-white/[0.06] hover:text-white rounded-lg transition-colors cursor-pointer">
          <HelpCircle className="w-4 h-4 shrink-0" /> Trung tâm hỗ trợ
        </button>
      </div>
    </aside>
  );
}