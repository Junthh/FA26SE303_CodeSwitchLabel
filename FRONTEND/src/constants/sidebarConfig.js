import {
  LayoutDashboard, CheckSquare, Headphones,
  History, Home, PlusCircle, Mic, FileText, ClipboardCheck,
} from 'lucide-react';
import {
  SIDEBAR_BG_SPEAKER,
  SIDEBAR_IDLE_TEXT_SPEAKER,
  SIDEBAR_BG_REVIEWER,
  TEXT_ON_DARK_SECONDARY,
  SPEAKER_ACCENT_ACTIVE_ICON,
  SPEAKER_ACCENT_SOFT_BG,
  REVIEWER_ACCENT,
  REVIEWER_ACCENT_ACTIVE_ICON,
  REVIEWER_ACCENT_SOFT_BG,
} from './theme';

export const SIDEBAR_CONFIG = {
  speaker: {
    background: SIDEBAR_BG_SPEAKER,
    idleText: SIDEBAR_IDLE_TEXT_SPEAKER,
    // Vạch trái của mục đang chọn dùng bản sáng của accent để nổi trên nền xanh đá
    accent: SPEAKER_ACCENT_ACTIVE_ICON,
    accentIcon: SPEAKER_ACCENT_ACTIVE_ICON,
    accentSoftBg: SPEAKER_ACCENT_SOFT_BG,
    logoVariant: 'light',
    // Menu chia nhóm, phẳng (không dropdown) - tên gọi hướng tới tình nguyện viên
    sections: [
      {
        title: 'Đóng góp',
        items: [
          { name: 'Trang chủ', to: '/', icon: Home, end: true },
          // activeOn: vẫn sáng mục này khi đang ở các bước sau của luồng Duyệt -> Ghi âm -> Gửi
          {
            name: 'Câu chờ ghi âm', to: '/review-text', icon: CheckSquare,
            activeOn: ['/record-speech', '/submit-task'],
          },
          { name: 'Đóng góp văn bản', to: '/contribute', icon: PlusCircle },
        ],
      },
      {
        title: 'Của bạn',
        items: [
          { name: 'Lịch sử ghi âm', to: '/recording-history', icon: Headphones },
          { name: 'Lịch sử đóng góp', to: '/contribution-history', icon: FileText },
        ],
      },
    ],
    promo: {
      icon: Mic,
      title: 'Vì sao giọng nói của bạn quan trọng',
      description: 'Mỗi phút ghi âm giúp AI nhận diện tiếng Việt chính xác hơn.',
    },
  },

  reviewer: {
    background: SIDEBAR_BG_REVIEWER,
    idleText: TEXT_ON_DARK_SECONDARY,
    accent: REVIEWER_ACCENT,
    accentIcon: REVIEWER_ACCENT_ACTIVE_ICON,
    accentSoftBg: REVIEWER_ACCENT_SOFT_BG,
    logoVariant: 'light',
    items: [
      { name: 'Tổng quan & Tiến độ', to: '/reviewer', icon: LayoutDashboard, end: true },
      { name: 'Nhiệm vụ', to: '/reviewer/task', icon: CheckSquare },
      {
        name: 'Kiểm duyệt',
        icon: ClipboardCheck,
        children: [
          { to: '/reviewer/recording', label: 'Ghi âm', icon: Headphones },
          // Đề xuất câu = câu đóng góp + câu báo lỗi gộp chung 1 danh sách.
          // Câu báo lỗi tạm dừng: route /reviewer/script vẫn giữ nhưng không hiện trên sidebar.
          { to: '/reviewer/contribution', label: 'Đề xuất câu', icon: FileText },
        ],
      },
      {
        name: 'Lịch sử kiểm duyệt',
        icon: History,
        children: [
          { to: '/reviewer/history-recording', label: 'Ghi âm', icon: Headphones },
          { to: '/reviewer/history-contribution', label: 'Đề xuất câu', icon: FileText },
        ],
      },
    ],
    promo: null,
  },
};
