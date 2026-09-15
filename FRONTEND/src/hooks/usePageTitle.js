import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Tự đổi tiêu đề tab trình duyệt theo route hiện tại (kiểu GitHub: favicon giữ nguyên,
 * chỉ chữ trên tab đổi). Gọi 1 LẦN DUY NHẤT ở component layout cấp cao nhất (nơi có <Outlet />),
 * KHÔNG cần gọi lại trong từng trang con.
 *
 * Thêm route mới -> chỉ cần thêm 1 dòng vào PAGE_TITLES bên dưới.
 */

const SITE_NAME = 'CodeSwitchLabel';

const PAGE_TITLES = {
  // Speaker
  '/': 'Trang chủ',
  '/review-text': 'Duyệt văn bản',
  '/record-speech': 'Ghi âm',
  '/review-recording': 'Nghe lại',
  '/submit-task': 'Nộp bài',
  '/contribute': 'Đóng góp văn bản',
  '/profile': 'Hồ sơ cá nhân',
  '/recording-history': 'Lịch sử ghi âm',
  '/contribution-history': 'Lịch sử đóng góp',

  // Reviewer
  '/reviewer': 'Tổng quan & Tiến độ',
  '/reviewer/task': 'Nhiệm vụ',
  '/reviewer/recording': 'Kiểm duyệt ghi âm',
  '/reviewer/contribution': 'Kiểm duyệt câu đóng góp',
  '/reviewer/history-recording': 'Lịch sử kiểm duyệt ghi âm',
  '/reviewer/history-contribution': 'Lịch sử kiểm duyệt câu đóng góp',
};

export default function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const pageName = PAGE_TITLES[location.pathname];
    document.title = pageName ? `${pageName} · ${SITE_NAME}` : SITE_NAME;
  }, [location.pathname]);
}