import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Search, FolderKanban, X, AlertTriangle, ArrowRight } from 'lucide-react';
import Pagination from '../../../../components/Pagination/Pagination';
import { REVIEWER_ACCENT as ACCENT } from '../../../../constants/theme';

const CATEGORIES = ['Hội thoại hàng ngày', 'Công nghệ thông tin', 'Giáo dục'];

// Màu phân loại (bộ A) - xanh dương / hổ phách / hồng magenta, tránh màu status
const CATEGORY_COLORS = {
  'Hội thoại hàng ngày': { bg: '#E6F0FE', text: '#1E40AF', border: '#C9DEFB' },
  'Công nghệ thông tin': { bg: '#FBF0DA', text: '#92600A', border: '#F3E0B5' },
  'Giáo dục': { bg: '#FCE7F0', text: '#9D2662', border: '#F8CFE0' },
};
const catStyle = (cat) => CATEGORY_COLORS[cat] || { bg: '#F7F5EF', text: '#6E7078', border: '#E5E2D8' };

// Nhãn pill (VI-EN / VI) đứng đầu mỗi câu - đồng bộ với InlineLabel bên trang Kiểm duyệt ghi âm.
// cs (câu có xen [vi]/[en]) dùng ACCENT, vi (câu thuần Việt) dùng xám trung tính.
function InlineLabel({ variant }) {
  const bg = variant === 'cs' ? ACCENT : '#8B8D95';
  return (
    <span
      className="text-[9px] font-bold w-9 h-[18px] text-center shrink-0 rounded-md inline-flex items-center justify-center text-white"
      style={{ background: bg, letterSpacing: '0.02em' }}
    >
      {variant === 'cs' ? 'VI-EN' : 'VI'}
    </span>
  );
}

export default function ReviewContribution() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [selectedItem, setSelectedItem] = useState(null); // form từ chối
  const [rejectCategory, setRejectCategory] = useState('grammar');
  const [rejectReason, setRejectReason] = useState('');

  const pageSize = 6;

  // TODO: thay bằng dữ liệu thật từ API - đúng shape ContributeText: cs_transcript + vi_equivalent + alignment
  const [activeQueue, setActiveQueue] = useState([
    { id: 'TXT-3001', category: 'Hội thoại hàng ngày', author: 'Đặng Mai Phương', time: '05/09/2026 - 14:20',
      cs_transcript: '[vi]Chiều nay mình đi cà phê rồi [en]check-in [vi]chỗ mới nha.',
      vi_equivalent: '[vi]Chiều nay mình đi cà phê rồi đánh dấu vị trí chỗ mới nha.',
      alignment: [{ source: 'check-in', target: 'đánh dấu vị trí' }] },
    { id: 'TXT-3002', category: 'Hội thoại hàng ngày', author: 'Nguyễn Mạnh Lực', time: '05/09/2026 - 10:10',
      cs_transcript: '[vi]Tối nay có [en]sale [vi]lớn, mình đi [en]shopping [vi]chút đi.',
      vi_equivalent: '[vi]Tối nay có giảm giá lớn, mình đi mua sắm chút đi.',
      alignment: [{ source: 'sale', target: 'giảm giá' }, { source: 'shopping', target: 'mua sắm' }] },
    { id: 'TXT-3003', category: 'Công nghệ thông tin', author: 'Lê Hoàng Nam', time: '04/09/2026 - 09:30',
      cs_transcript: '[vi]Bạn [en]deploy [vi]bản mới lên [en]server [vi]chưa vậy?',
      vi_equivalent: '[vi]Bạn triển khai bản mới lên máy chủ chưa vậy?',
      alignment: [{ source: 'deploy', target: 'triển khai' }, { source: 'server', target: 'máy chủ' }] },
    { id: 'TXT-3004', category: 'Công nghệ thông tin', author: 'Hoàng Quốc Bảo', time: '03/09/2026 - 11:45',
      cs_transcript: '[vi]Cái [en]bug [vi]này mình [en]fix [vi]xong rồi, chờ [en]review [vi]thôi.',
      vi_equivalent: '[vi]Cái lỗi này mình sửa xong rồi, chờ xem xét thôi.',
      alignment: [{ source: 'bug', target: 'lỗi' }, { source: 'fix', target: 'sửa' }, { source: 'review', target: 'xem xét' }] },
    { id: 'TXT-3005', category: 'Giáo dục', author: 'Phạm Thu Thảo', time: '02/09/2026 - 16:15',
      cs_transcript: '[vi]Hạn nộp [en]assignment [vi]là thứ sáu tuần này nha.',
      vi_equivalent: '[vi]Hạn nộp bài tập là thứ sáu tuần này nha.',
      alignment: [{ source: 'assignment', target: 'bài tập' }] },
    { id: 'TXT-3006', category: 'Giáo dục', author: 'Trần Minh Tâm', time: '01/09/2026 - 14:05',
      cs_transcript: '[vi]Mai có buổi [en]workshop [vi]về kỹ năng [en]presentation [vi]đó.',
      vi_equivalent: '[vi]Mai có buổi hội thảo về kỹ năng thuyết trình đó.',
      alignment: [{ source: 'workshop', target: 'hội thảo' }, { source: 'presentation', target: 'thuyết trình' }] },
    { id: 'TXT-3007', category: 'Hội thoại hàng ngày', author: 'Nguyễn Mạnh Lực', time: '31/08/2026 - 20:30',
      cs_transcript: '[vi]Nhớ [en]order [vi]đồ ăn trước khi hết giờ [en]happy hour [vi]nha.',
      vi_equivalent: '[vi]Nhớ đặt đồ ăn trước khi hết giờ vàng nha.',
      alignment: [{ source: 'order', target: 'đặt' }, { source: 'happy hour', target: 'giờ vàng' }] },
    { id: 'TXT-3008', category: 'Công nghệ thông tin', author: 'Lê Hoàng Nam', time: '30/08/2026 - 08:20',
      cs_transcript: '[vi]Con [en]model [vi]này [en]train [vi]xong chưa, cho mình xem [en]result [vi]với.',
      vi_equivalent: '[vi]Con mô hình này huấn luyện xong chưa, cho mình xem kết quả với.',
      alignment: [{ source: 'model', target: 'mô hình' }, { source: 'train', target: 'huấn luyện' }, { source: 'result', target: 'kết quả' }] },
    { id: 'TXT-3009', category: 'Giáo dục', author: 'Đặng Mai Phương', time: '29/08/2026 - 13:10',
      cs_transcript: '[vi]Nhớ ôn kỹ trước khi thi [en]final [vi]nhé, đề khó lắm.',
      vi_equivalent: '[vi]Nhớ ôn kỹ trước khi thi cuối kỳ nhé, đề khó lắm.',
      alignment: [{ source: 'final', target: 'cuối kỳ' }] },
    { id: 'TXT-3010', category: 'Hội thoại hàng ngày', author: 'Phạm Thu Thảo', time: '28/08/2026 - 17:00',
      cs_transcript: '[vi]Cuối tuần đi [en]camping [vi]với team không?',
      vi_equivalent: '[vi]Cuối tuần đi cắm trại với team không?',
      alignment: [{ source: 'camping', target: 'cắm trại' }] },
  ]);

  const filteredQueue = useMemo(() => {
    return activeQueue.filter((it) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = it.id.toLowerCase().includes(q) ||
        it.cs_transcript.toLowerCase().includes(q) ||
        it.vi_equivalent.toLowerCase().includes(q) ||
        it.author.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || it.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [activeQueue, searchTerm, filterCategory]);

  const totalPages = Math.ceil(filteredQueue.length / pageSize) || 1;
  const paginatedQueue = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, currentPage]);

  const handleApprove = (id) => setActiveQueue((prev) => prev.filter((it) => it.id !== id));

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setActiveQueue((prev) => prev.filter((it) => it.id !== selectedItem.id));
    setSelectedItem(null);
    setRejectReason('');
    setRejectCategory('grammar');
  };

  return (
    <div className="space-y-4 pb-6 text-left font-sans">

      {/* Thanh lọc & tìm kiếm */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9A9CA3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo người đóng góp, nội dung..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#E5E2D8] rounded-xl outline-none focus:border-[#818CF8] focus:ring-4 focus:ring-[#818CF8]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <FolderKanban className="w-3.5 h-3.5 text-[#9A9CA3]" />
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="text-xs border border-[#E5E2D8] rounded-xl px-3 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
          >
            <option value="all">Tất cả phân loại</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Danh sách dạng card - đủ chỗ cho cả câu Việt-Anh, câu Việt, và nghĩa từng từ tiếng Anh */}
      {paginatedQueue.length > 0 ? (
        <div className="space-y-3">
          {paginatedQueue.map((it) => (
            <div key={it.id} className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-5">

              <div className="flex items-start justify-between gap-3 mb-3.5 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold border" style={{ background: catStyle(it.category).bg, color: catStyle(it.category).text, borderColor: catStyle(it.category).border }}>
                    {it.category}
                  </span>
                  <span className="text-xs font-semibold text-[#16171C]">{it.author}</span>
                  <span className="text-[11px] text-[#9A9CA3] font-mono">{it.time}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(it.id)}
                    className="px-3.5 py-2 bg-[#EAF7EF] border border-[#C5E8D3] text-[#1F5C3F] rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#DCF0E5] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={() => setSelectedItem(it)}
                    className="px-3.5 py-2 bg-[#FDEAEA] border border-[#F3C9C9] text-[#C63B3B] rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#FBDADA] transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </div>
              </div>

              {/* Câu Việt-Anh - nhãn pill VI-EN thay cho dòng chữ header, khớp InlineLabel bên trang ghi âm */}
              <div className="bg-[#F7F5EF] rounded-xl p-3.5 mb-2.5 flex items-center gap-2.5">
                <InlineLabel variant="cs" />
                <p className="text-sm font-semibold text-[#16171C] leading-relaxed min-w-0">
                  {it.cs_transcript}
                </p>
              </div>
              {/* Câu tiếng Việt - nhãn pill VI */}
              <div className="bg-[#F7F5EF] rounded-xl p-3.5 mb-3 flex items-center gap-2.5">
                <InlineLabel variant="vi" />
                <p className="text-sm font-semibold text-[#16171C] leading-relaxed min-w-0">{it.vi_equivalent}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-2">Nghĩa từ tiếng Anh</p>
                <div className="flex flex-wrap gap-2">
                  {it.alignment.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#F0EEE6] border border-[#E5E2D8] rounded-lg px-3 py-1.5">
                      <span className="text-xs font-bold font-mono" style={{ color: ACCENT }}>{a.source}</span>
                      <ArrowRight className="w-3 h-3 text-[#B7B4A9] shrink-0" />
                      <span className="text-xs font-semibold text-[#16171C]">{a.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] py-14 text-center">
          <p className="font-bold text-[#16171C] text-sm">Tuyệt vời! Bạn đã xử lý hết hàng đợi chờ duyệt.</p>
          <p className="text-[#9A9CA3] text-xs mt-1">Các câu đã thao tác sẽ được ghi nhận tại mục Lịch sử kiểm duyệt.</p>
        </div>
      )}

      {paginatedQueue.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] px-3">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} accent={ACCENT} />
        </div>
      )}

      {/* MODAL TỪ CHỐI */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)] max-h-[90vh] flex flex-col">
            <div className="h-1.5 w-full bg-[#C63B3B] shrink-0" />
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FDEAEA] flex-shrink-0">
                    <AlertTriangle className="w-[18px] h-[18px] text-[#C63B3B]" />
                  </div>
                  <span className="text-[15px] font-bold text-[#16171C]">Từ chối câu · {selectedItem.author}</span>
                </div>
                <button onClick={() => setSelectedItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>

              {/* Câu đang xét - cả 2 câu, cùng nhãn pill VI-EN/VI để reviewer nhớ lại ngữ cảnh khi viết lý do */}
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-2.5 flex items-center gap-2.5">
                <InlineLabel variant="cs" />
                <p className="text-[12.5px] text-[#16171C] leading-relaxed break-words min-w-0">
                  {selectedItem.cs_transcript}
                </p>
              </div>
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <InlineLabel variant="vi" />
                <p className="text-[12.5px] text-[#16171C] leading-relaxed break-words min-w-0">{selectedItem.vi_equivalent}</p>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">Loại lỗi kiểm duyệt</label>
                  <select
                    value={rejectCategory}
                    onChange={(e) => setRejectCategory(e.target.value)}
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-2.5 bg-white text-[#16171C] font-medium outline-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  >
                    <option value="grammar">Sai ngữ pháp / cấu trúc câu</option>
                    <option value="label">Gắn nhãn [vi]/[en] sai hoặc thiếu</option>
                    <option value="alignment">Nghĩa từ tiếng Anh không đúng</option>
                    <option value="abbr">Viết tắt / từ mượn không hợp lệ</option>
                    <option value="context">Thiếu ngữ cảnh / nghĩa không rõ</option>
                    <option value="other">Lỗi khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">Mô tả lý do từ chối chi tiết</label>
                  <textarea
                    required rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Từ 'check-in' chưa gắn nhãn [en]..."
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-3 outline-none resize-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setSelectedItem(null)} className="flex-1 py-2.5 border border-[#E5E2D8] text-[#55565B] rounded-xl text-xs font-bold hover:bg-[#F7F5EF] transition-colors">
                    Hủy bỏ
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#C63B3B] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                    Xác nhận từ chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}