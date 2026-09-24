/**
 * Dữ liệu mẫu trang Câu lỗi cũ (/reviewer/script) - có câu gốc + câu đề xuất sửa.
 * Trang này đang ẩn khỏi sidebar; tab "Câu báo lỗi" trong Đề xuất câu dùng REPORT_QUEUE (mocks/reviewer/proposals).
 * TODO: thay bằng dữ liệu từ API rồi xoá file này.
 */

export const SCRIPT_REPORTS = [
  {
    id: 'ERR-024', author: 'Nguyễn Mạnh Lực', time: '07/09/2026 · 10:15', type: 'Đề xuất sửa', reason: 'Sai chính tả',
    original: {
      cs: '[vi]Em nên [en]scan [vi]tài liệu này rồi gửi qua [en]emial [vi]cho tôi.',
      vi: '[vi]Em nên quét tài liệu này rồi gửi qua thư điện tử cho tôi.',
      words: [{ source: 'scan', target: 'quét' }, { source: 'emial', target: 'thư điện tử' }],
    },
    proposal: {
      cs: '[vi]Em nên [en]scan [vi]tài liệu này rồi gửi qua [en]email [vi]cho tôi.',
      vi: '[vi]Em nên quét tài liệu này rồi gửi qua thư điện tử cho tôi.',
    },
  },
  {
    id: 'ERR-023', author: 'Đặng Mai Phương', time: '07/09/2026 · 09:42', type: 'Báo lỗi', reason: 'Sai ngữ nghĩa',
    original: {
      cs: '[vi]Tối nay có [en]sale [vi]lớn, mình đi [en]shopping [vi]chút đi.',
      vi: '[vi]Tối nay có giảm giá lớn, mình đi mua sắm chút đi.',
      words: [{ source: 'sale', target: 'giảm giá' }, { source: 'shopping', target: 'mua sắm' }],
    },
  },
  {
    id: 'ERR-022', author: 'Lê Hoàng Nam', time: '06/09/2026 · 16:30', type: 'Đề xuất sửa', reason: 'Sai ngữ pháp',
    original: {
      cs: '[vi]Bạn [en]deploy [vi]bản mới lên [en]server [vi]chưa vậy?',
      vi: '[vi]Bạn triển khai bản mới lên máy chủ chưa vậy?',
      words: [{ source: 'deploy', target: 'triển khai' }, { source: 'server', target: 'máy chủ' }],
    },
    proposal: {
      cs: '[vi]Bạn đã [en]deploy [vi]bản mới lên [en]server [vi]chưa?',
      vi: '[vi]Bạn đã triển khai bản mới lên máy chủ chưa?',
    },
  },
  {
    id: 'ERR-021', author: 'Phạm Thu Thảo', time: '06/09/2026 · 14:05', type: 'Báo lỗi', reason: 'Khác',
    original: {
      cs: '[vi]Mai có [en]workshop [vi]về [en]presentation [vi]đó.',
      vi: '[vi]Mai có hội thảo về kỹ năng thuyết trình đó.',
      words: [{ source: 'workshop', target: 'hội thảo' }, { source: 'presentation', target: 'thuyết trình' }],
    },
  },
];
