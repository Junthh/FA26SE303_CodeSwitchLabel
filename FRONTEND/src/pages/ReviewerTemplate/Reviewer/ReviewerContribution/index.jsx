import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Search, Filter, AlertTriangle, FolderKanban, X, Eye } from 'lucide-react';
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

export default function ReviewerContribution() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [selectedItem, setSelectedItem] = useState(null); // form từ chối
  const [viewItem, setViewItem] = useState(null); // popup xem full câu
  const [rejectCategory, setRejectCategory] = useState('grammar');
  const [rejectReason, setRejectReason] = useState('');

  const pageSize = 10;

  // Nội dung để dạng nhãn [vi]/[en] - hiện nguyên chuỗi, không parse
  const [activeQueue, setActiveQueue] = useState([
    { id: 'TXT-3001', category: 'Hội thoại hàng ngày', author: 'Đặng Mai Phương', time: '05/09/2026 - 14:20', text: '[vi]Chiều nay mình đi cà phê rồi [en]check-in [vi]chỗ mới nha.' },
    { id: 'TXT-3002', category: 'Hội thoại hàng ngày', author: 'Nguyễn Mạnh Lực', time: '05/09/2026 - 10:10', text: '[vi]Tối nay có [en]sale [vi]lớn, mình đi [en]shopping [vi]chút đi.' },
    { id: 'TXT-3003', category: 'Công nghệ thông tin', author: 'Lê Hoàng Nam', time: '04/09/2026 - 09:30', text: '[vi]Bạn [en]deploy [vi]bản mới lên [en]server [vi]chưa vậy?' },
    { id: 'TXT-3004', category: 'Công nghệ thông tin', author: 'Hoàng Quốc Bảo', time: '03/09/2026 - 11:45', text: '[vi]Cái [en]bug [vi]này mình [en]fix [vi]xong rồi, chờ [en]review [vi]thôi.' },
    { id: 'TXT-3005', category: 'Giáo dục', author: 'Phạm Thu Thảo', time: '02/09/2026 - 16:15', text: '[vi]Hạn nộp [en]assignment [vi]là thứ sáu tuần này nha.' },
    { id: 'TXT-3006', category: 'Giáo dục', author: 'Trần Minh Tâm', time: '01/09/2026 - 14:05', text: '[vi]Mai có buổi [en]workshop [vi]về kỹ năng [en]presentation [vi]đó.' },
    { id: 'TXT-3007', category: 'Hội thoại hàng ngày', author: 'Nguyễn Mạnh Lực', time: '31/08/2026 - 20:30', text: '[vi]Nhớ [en]order [vi]đồ ăn trước khi hết giờ [en]happy hour [vi]nha.' },
    { id: 'TXT-3008', category: 'Công nghệ thông tin', author: 'Lê Hoàng Nam', time: '30/08/2026 - 08:20', text: '[vi]Con [en]model [vi]này [en]train [vi]xong chưa, cho mình xem [en]result [vi]với.' },
    { id: 'TXT-3009', category: 'Giáo dục', author: 'Đặng Mai Phương', time: '29/08/2026 - 13:10', text: '[vi]Nhớ ôn kỹ trước khi thi [en]final [vi]nhé, đề khó lắm.' },
    { id: 'TXT-3010', category: 'Hội thoại hàng ngày', author: 'Phạm Thu Thảo', time: '28/08/2026 - 17:00', text: '[vi]Cuối tuần đi [en]camping [vi]với team không?' },
  ]);

  const filteredQueue = useMemo(() => {
    return activeQueue.filter((it) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = it.id.toLowerCase().includes(q) || it.text.toLowerCase().includes(q) ||
        it.author.toLowerCase().includes(q) || it.category.toLowerCase().includes(q);
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

      {/* Bảng */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F5EF] text-[11px] uppercase tracking-wider text-[#9A9CA3] border-b border-[#E5E2D8] font-bold">
                <th className="py-3 px-4 text-center w-[5%]">STT</th>
                <th className="py-3 px-4 text-left w-[20%]">Phân loại</th>
                <th className="py-3 px-4 text-left w-[16%]">Người đóng góp</th>
                <th className="py-3 px-4 text-left w-[14%]">Thời gian</th>
                <th className="py-3 px-4 text-left w-[30%]">Nội dung câu</th>
                <th className="py-3 px-5 text-left w-[15%]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {paginatedQueue.length > 0 ? paginatedQueue.map((it, idx) => (
                <tr key={it.id} className="hover:bg-[#F7F5EF]/70 transition-colors">
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * pageSize + idx + 1}</span>
                  </td>
                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border" style={{ background: catStyle(it.category).bg, color: catStyle(it.category).text, borderColor: catStyle(it.category).border }}>{it.category}</span>
                  </td>
                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <p className="font-semibold text-[#16171C]">{it.author}</p>
                  </td>
                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <span className="text-[#6E7078] font-mono text-[11px]">{it.time}</span>
                  </td>
                  <td className="py-3.5 px-4 text-left">
                    <div className="flex items-center gap-2 max-w-[320px]">
                      <p className="font-semibold text-[#16171C] truncate">{it.text}</p>
                      <button
                        onClick={() => setViewItem(it)}
                        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors"
                        title="Xem toàn bộ câu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-left whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(it.id)}
                        className="px-3 py-1.5 bg-[#EAF7EF] border border-[#C5E8D3] text-[#1F5C3F] rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#DCF0E5] transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button
                        onClick={() => setSelectedItem(it)}
                        className="px-3 py-1.5 bg-[#FDEAEA] border border-[#F3C9C9] text-[#C63B3B] rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#FBDADA] transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#9A9CA3] text-xs space-y-1">
                    <p className="font-bold text-[#16171C] text-sm">Tuyệt vời! Bạn đã xử lý hết hàng đợi chờ duyệt.</p>
                    <p>Các câu đã thao tác sẽ được ghi nhận tại mục Lịch sử kiểm duyệt.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 border-t border-[#E5E2D8] bg-white">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} accent={ACCENT} />
        </div>
      </div>

      {/* POPUP XEM TOÀN BỘ CÂU */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 w-full" style={{ background: ACCENT }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}1A` }}>
                    <Eye className="w-[18px] h-[18px]" style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[16px] font-bold text-[#16171C]">Nội dung câu</span>
                </div>
                <button onClick={() => setViewItem(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border" style={{ background: catStyle(viewItem.category).bg, color: catStyle(viewItem.category).text, borderColor: catStyle(viewItem.category).border }}>{viewItem.category}</span>
                <span className="text-[11px] text-[#9A9CA3] font-mono">{viewItem.author} · {viewItem.time}</span>
              </div>
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-4">
                <p className="text-sm font-medium text-[#16171C] leading-relaxed break-words">{viewItem.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]">
            <div className="h-1.5 w-full bg-[#C63B3B]" />
            <div className="p-6">
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

              {/* Câu đang xét (dạng nhãn) */}
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3 mb-4">
                <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-1">Câu văn</p>
                <p className="text-[12.5px] text-[#16171C] leading-relaxed break-words">{selectedItem.text}</p>
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