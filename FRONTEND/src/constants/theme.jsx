/**
 * Bảng màu tập trung cho toàn bộ theme của app.
 * Phong cách lấy cảm hứng từ Spotify: xanh accent dùng tiết kiệm, chỉ ở CTA và trạng thái.
 *
 * Đổi palette → chỉ sửa ở ĐÂY, không sửa rải rác trong từng component.
 */

// ═══════════════════════════════════════════════════
// SURFACE — nền trang & card (giữ sáng cho content area)
// ═══════════════════════════════════════════════════
export const SURFACE_PAGE = '#F7F5EF';           // nền Outlet / content area
export const SURFACE_CARD = '#FFFFFF';            // card nhiệm vụ, panel
export const SURFACE_HERO = '#16171C';            // hero leaderboard (dark block)
export const SURFACE_HERO_ROW = '#1F2129';        // row bên trong hero
export const SURFACE_MUTED = '#F0EEE6';           // track progress bar, nền phụ nhẹ

// ═══════════════════════════════════════════════════
// TEXT — trên nền sáng (content area)
// ═══════════════════════════════════════════════════
export const TEXT_HEADING = '#2B2C31';
export const TEXT_BODY = '#6E7078';
export const TEXT_FAINT = '#9A9CA6';

// ═══════════════════════════════════════════════════
// TEXT — trên nền tối (hero, sidebar)
// ═══════════════════════════════════════════════════
export const TEXT_ON_DARK_PRIMARY = '#FFFFFF';
export const TEXT_ON_DARK_SECONDARY = '#B3B3B3';
export const TEXT_ON_DARK_TERTIARY = '#7C7C7C';

// ═══════════════════════════════════════════════════
// BORDER
// ═══════════════════════════════════════════════════
export const BORDER_LIGHT = '#E5E2D8';            // viền card / header trên nền sáng
export const BORDER_DARK_SUBTLE = 'rgba(255,255,255,0.07)';
export const BORDER_DARK_DEFAULT = 'rgba(255,255,255,0.12)';
export const BORDER_DARK_STRONG = 'rgba(255,255,255,0.2)';

// ═══════════════════════════════════════════════════
// SPEAKER ACCENT — Spotify green
// ═══════════════════════════════════════════════════
export const SPEAKER_ACCENT = '#2563EB';
export const SPEAKER_ACCENT_HOVER = '#1D4ED8';
export const SPEAKER_ACCENT_ACTIVE_ICON = '#60A5FA';
export const SPEAKER_ACCENT_SOFT_BG = '#191414';
export const SPEAKER_ACCENT_TEXT_ON = '#121212';   // chữ ĐẶT TRÊN nền accent (nút CTA)

// ═══════════════════════════════════════════════════
// REVIEWER / MANAGER / ADMIN
// ═══════════════════════════════════════════════════
export const REVIEWER_ACCENT = '#0052CC';
export const REVIEWER_ACCENT_ACTIVE_ICON = '#5B8DEF';
export const REVIEWER_ACCENT_SOFT_BG = 'rgba(0,82,204,0.14)';

// ═══════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════
export const SIDEBAR_BG_SPEAKER = '#000000';
export const SIDEBAR_BG_REVIEWER = '#0A0E1A';

// ═══════════════════════════════════════════════════
// MÀU TRẠNG THÁI — dùng chung toàn app
// ═══════════════════════════════════════════════════
export const SUCCESS = '#1ED760';
export const DANGER = '#F3727F';
export const WARNING = '#FFA42B';
export const INFO = '#539DF5';

// ═══════════════════════════════════════════════════
// CHIP / BADGE backgrounds (trên nền sáng)
// ═══════════════════════════════════════════════════
export const CHIP_SUCCESS_BG = '#EAF7EF';
export const CHIP_SUCCESS_BORDER = '#C5E8D3';
export const CHIP_SUCCESS_TEXT = '#1F5C3F';

export const CHIP_WARNING_BG = '#FFF4E5';
export const CHIP_WARNING_BORDER = '#FFE0B2';
export const CHIP_WARNING_TEXT = '#8B5E0F';

export const CHIP_DANGER_BG = '#FDECE8';
export const CHIP_DANGER_BORDER = '#F8D3C9';
export const CHIP_DANGER_TEXT = '#C0442B';

// ═══════════════════════════════════════════════════
// AUDIO — ghi âm & nghe lại (tách riêng khỏi accent chính)
// ═══════════════════════════════════════════════════
export const AUDIO_PRIMARY = '#2563EB';              // nút mic, play/pause, waveform đã phát, ring tiến độ
export const AUDIO_PRIMARY_LIGHT = 'rgba(37,99,235,0.08)';  // vòng sáng quanh nút mic khi ghi
export const AUDIO_PRIMARY_GLOW = 'rgba(37,99,235,0.14)';   // radial glow nền khi ghi
export const AUDIO_WAVE_IDLE = '#D8D5C9';            // sóng chưa ghi (ghi âm) / chưa phát (nghe lại)
export const AUDIO_WAVE_PROGRESS = '#2563EB';        // sóng đã ghi / đã phát
export const AUDIO_SHADOW = 'rgba(37,99,235,0.25)';  // shadow nút mic & play

// ═══════════════════════════════════════════════════
// LEADERBOARD — rank vàng
// ═══════════════════════════════════════════════════
export const RANK_GOLD = '#D9A441';
export const RANK_GOLD_BG = 'linear-gradient(90deg, rgba(217,164,65,0.18), rgba(217,164,65,0.04))';
export const RANK_GOLD_BORDER = 'rgba(217,164,65,0.45)';