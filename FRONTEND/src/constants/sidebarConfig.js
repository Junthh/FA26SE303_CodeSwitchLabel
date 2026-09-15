import {
  LayoutDashboard,
  CheckSquare,
  Headphones,
  History,
  Home,
  PlusCircle,
  Mic,
  FileText,
} from "lucide-react";
import {
  SPEAKER_ACCENT,
  SPEAKER_ACCENT_ACTIVE_ICON,
  SPEAKER_ACCENT_SOFT_BG,
  REVIEWER_ACCENT,
  REVIEWER_ACCENT_ACTIVE_ICON,
  REVIEWER_ACCENT_SOFT_BG,
} from "./theme";

/**
 * Cấu hình sidebar theo từng role. Sidebar.jsx (component dùng chung) chỉ đọc object
 * này và render ra, không có logic riêng cho từng role trong component.
 *
 * Thêm role mới (Manager, Admin...) -> chỉ cần thêm 1 object mới vào đây, KHÔNG cần
 * tạo file component sidebar riêng.
 *
 * Mỗi mục trong `items`:
 *   - Mục phẳng: { name, to, icon, end? }
 *   - Mục có dropdown con: { name, icon, children: [{ to, label, icon }] }
 */
export const SIDEBAR_CONFIG = {
  speaker: {
    background: "#16171C",
    idleText: "#A8A19E",
    accent: SPEAKER_ACCENT,
    accentIcon: SPEAKER_ACCENT_ACTIVE_ICON,
    accentSoftBg: SPEAKER_ACCENT_SOFT_BG,
    items: [
      { name: "Trang chủ", to: "/", icon: Home, end: true },
      { name: "Nhiệm vụ của tôi", to: "/review-text", icon: CheckSquare },
      { name: "Đóng góp văn bản", to: "/contribute", icon: PlusCircle },
      {
        name: "Lịch sử của tôi",
        icon: History,
        children: [
          {
            to: "/recording-history",
            label: "Lịch sử ghi âm",
            icon: Headphones,
          },
          {
            to: "/contribution-history",
            label: "Lịch sử đóng góp",
            icon: FileText,
          },
        ],
      },
    ],
    // Thẻ nhắc nhở nhỏ cuối sidebar - để null nếu role không cần
    promo: {
      icon: Mic,
      title: "Vì sao giọng nói của bạn quan trọng",
      description:
        "Mỗi phút ghi âm giúp AI nhận diện tiếng Việt chính xác hơn.",
    },
  },

  reviewer: {
    background: "#1A1E28",
    idleText: "#9EA6B8",
    accent: REVIEWER_ACCENT,
    accentIcon: REVIEWER_ACCENT_ACTIVE_ICON,
    accentSoftBg: REVIEWER_ACCENT_SOFT_BG,
    items: [
      {
        name: "Tổng quan & Tiến độ",
        to: "/reviewer",
        icon: LayoutDashboard,
        end: true,
      },
      { name: "Nhiệm vụ", to: "/reviewer/task", icon: CheckSquare },
      {
        name: "Kiểm duyệt",
        icon: Headphones,
        children: [
          { to: "/reviewer/recording", label: "Ghi âm", icon: Mic },
          {
            to: "/reviewer/contribution",
            label: "Câu đóng góp",
            icon: FileText,
          },
        ],
      },
      {
        name: "Lịch sử kiểm duyệt",
        icon: History,
        children: [
          { to: "/reviewer/history-recording", label: "Ghi âm", icon: Mic },
          {
            to: "/reviewer/history-contribution",
            label: "Câu đóng góp",
            icon: FileText,
          },
        ],
      },
    ],
    promo: null,
  },

  // manager: { ... }  -> thêm khi làm Task Manager
  // admin:   { ... }  -> thêm khi làm Admin
};
