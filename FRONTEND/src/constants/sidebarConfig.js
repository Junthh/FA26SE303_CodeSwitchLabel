import {
  LayoutDashboard, CheckSquare, Headphones,
  History, Home, PlusCircle, Mic, FileText, ClipboardCheck,
} from 'lucide-react';
import {
  SIDEBAR_BG_SPEAKER,
  SIDEBAR_BG_REVIEWER,
  TEXT_ON_DARK_SECONDARY,
  SPEAKER_ACCENT,
  SPEAKER_ACCENT_ACTIVE_ICON,
  SPEAKER_ACCENT_SOFT_BG,
  REVIEWER_ACCENT,
  REVIEWER_ACCENT_ACTIVE_ICON,
  REVIEWER_ACCENT_SOFT_BG,
} from './theme';

export const SIDEBAR_CONFIG = {
  speaker: {
    background: SIDEBAR_BG_SPEAKER,
    idleText: TEXT_ON_DARK_SECONDARY,
    accent: SPEAKER_ACCENT,
    accentIcon: SPEAKER_ACCENT_ACTIVE_ICON,
    accentSoftBg: SPEAKER_ACCENT_SOFT_BG,
    logoVariant: 'light',
    items: [
      { name: 'Trang chủ', to: '/', icon: Home, end: true },
      { name: 'Nhiệm vụ của tôi', to: '/review-text', icon: CheckSquare },
      { name: 'Đóng góp văn bản', to: '/contribute', icon: PlusCircle },
      {
        name: 'Lịch sử của tôi',
        icon: History,
        children: [
          { to: '/recording-history', label: 'Lịch sử ghi âm', icon: Headphones },
          { to: '/contribution-history', label: 'Lịch sử đóng góp', icon: FileText },
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
          { to: '/reviewer/contribution', label: 'Câu đóng góp', icon: FileText },
        ],
      },
      {
        name: 'Lịch sử kiểm duyệt',
        icon: History,
        children: [
          { to: '/reviewer/history-recording', label: 'Ghi âm', icon: Headphones },
          { to: '/reviewer/history-contribution', label: 'Câu đóng góp', icon: FileText },
        ],
      },
    ],
    promo: null,
  },
};