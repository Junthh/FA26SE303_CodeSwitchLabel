import { useState, useMemo } from 'react';
import { Search, Filter, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination/Pagination';
import { REVIEWER_ACCENT as ACCENT } from '../../../constants/theme';

// Thứ tự ưu tiên hiển thị theo nhóm trạng thái
const STATUS_ORDER = { 'in-progress': 0, 'pending': 1, 'completed': 2 };

export default function ReviewTasks() {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const pageSize = 10;

  const assignedTasks = [
    { id: '1', title: 'Nhiệm vụ ghi âm hàng ngày', assignedBy: 'Admin - Nguyễn Hoàng', target: 100, reviewed: 65, deadline: '28/05/2025', status: 'Đang thực hiện', statusType: 'in-progress' },
    { id: '2', title: 'Nhiệm vụ ghi âm cuối tuần', assignedBy: 'Manager - Trần Anh', target: 80, reviewed: 80, deadline: '25/05/2025', status: 'Hoàn thành', statusType: 'completed' },
    { id: '3', title: 'Chủ đề công nghệ & AI', assignedBy: 'Admin - Nguyễn Hoàng', target: 150, reviewed: 135, deadline: '05/06/2025', status: 'Đang thực hiện', statusType: 'in-progress' },
    { id: '4', title: 'Chủ đề đặc biệt: Giáo dục', assignedBy: 'Manager - Trần Anh', target: 120, reviewed: 0, deadline: '10/06/2025', status: 'Chưa bắt đầu', statusType: 'pending' },
    { id: '5', title: 'Thu âm hội thoại công sở', assignedBy: 'Admin - Nguyễn Hoàng', target: 60, reviewed: 60, deadline: '15/06/2025', status: 'Hoàn thành', statusType: 'completed' },
    { id: '6', title: 'Hội thoại đời sống thường nhật', assignedBy: 'Manager - Trần Anh', target: 110, reviewed: 30, deadline: '20/06/2025', status: 'Đang thực hiện', statusType: 'in-progress' },
    { id: '7', title: 'Bản tin kinh tế tài chính', assignedBy: 'Admin - Nguyễn Hoàng', target: 90, reviewed: 0, deadline: '25/06/2025', status: 'Chưa bắt đầu', statusType: 'pending' },
    { id: '8', title: 'Khảo sát giọng nói vùng miền', assignedBy: 'Manager - Trần Anh', target: 130, reviewed: 130, deadline: '30/06/2025', status: 'Hoàn thành', statusType: 'completed' },
    { id: '9', title: 'Đọc văn bản văn học cổ điển', assignedBy: 'Admin - Nguyễn Hoàng', target: 140, reviewed: 45, deadline: '05/07/2025', status: 'Đang thực hiện', statusType: 'in-progress' },
    { id: '10', title: 'Thu âm thuật toán nâng cao', assignedBy: 'Manager - Trần Anh', target: 85, reviewed: 0, deadline: '10/07/2025', status: 'Chưa bắt đầu', statusType: 'pending' },
  ];

  const filteredTasks = useMemo(() => {
    const list = assignedTasks.filter((task) => {
      const matchSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAssignee = filterAssignee === 'all' || task.assignedBy.includes(filterAssignee);
      const matchStatus = filterStatus === 'all' || task.statusType === filterStatus;
      return matchSearch && matchAssignee && matchStatus;
    });
    // Sắp xếp: Đang thực hiện -> Chưa bắt đầu -> Hoàn thành (giữ thứ tự gốc trong từng nhóm)
    return [...list].sort((a, b) => STATUS_ORDER[a.statusType] - STATUS_ORDER[b.statusType]);
  }, [assignedTasks, searchTerm, filterAssignee, filterStatus]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage]);

  // Style trạng thái theo hệ màu app
  const statusStyle = (type) => {
    if (type === 'completed') return { chip: 'bg-[#3FA66B]/10 text-[#1F5C3F]', dot: '#3FA66B' };
    if (type === 'in-progress') return { chip: 'text-[#4C4D9E]', dot: ACCENT, chipBg: 'rgba(129,140,248,0.14)' };
    return { chip: 'bg-[#F0EEE6] text-[#6E7078]', dot: '#B7B4A9' };
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
            placeholder="Tìm theo tên nhiệm vụ..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#E5E2D8] rounded-xl outline-none focus:border-[#818CF8] focus:ring-4 focus:ring-[#818CF8]/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#9A9CA3]" />
            <select
              value={filterAssignee}
              onChange={(e) => { setFilterAssignee(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-[#E5E2D8] rounded-xl px-3 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
            >
              <option value="all">Tất cả người giao</option>
              <option value="Nguyễn Hoàng">Admin - Nguyễn Hoàng</option>
              <option value="Trần Anh">Manager - Trần Anh</option>
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="text-xs border border-[#E5E2D8] rounded-xl px-3 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in-progress">Đang thực hiện</option>
            <option value="pending">Chưa bắt đầu</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F5EF] text-[11px] uppercase tracking-wider text-[#9A9CA3] border-b border-[#E5E2D8] font-bold">
                <th className="py-3 px-4 text-center w-[6%]">STT</th>
                <th className="py-3 px-6 text-left w-[28%]">Nhiệm vụ</th>
                <th className="py-3 px-4 text-left w-[18%]">Người giao task</th>
                <th className="py-3 px-4 text-left w-[18%]">Mục tiêu (Target)</th>
                <th className="py-3 px-4 text-left w-[12%]">Hạn chót</th>
                <th className="py-3 px-4 text-left w-[12%]">Trạng thái</th>
                <th className="py-3 px-6 text-left w-[16%]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {paginatedTasks.length > 0 ? paginatedTasks.map((task, idx) => {
                const percent = Math.round((task.reviewed / task.target) * 100);
                const st = statusStyle(task.statusType);
                return (
                  <tr key={task.id} className="hover:bg-[#F7F5EF]/70 transition-colors">
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * pageSize + idx + 1}</span>
                    </td>
                    <td className="py-4 px-6 text-left whitespace-nowrap">
                      <p className="font-bold text-[#16171C] truncate max-w-[180px] md:max-w-[220px]" title={task.title}>{task.title}</p>
                    </td>
                    <td className="py-4 px-4 text-left whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-[#16171C] font-semibold">
                        <UserCheck className="w-3.5 h-3.5 text-[#9A9CA3]" /> {task.assignedBy}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <div className="flex flex-col gap-1 max-w-[140px]">
                        <div className="flex justify-between text-[11px] text-[#6E7078] font-medium">
                          <span>{task.reviewed}/{task.target} bản</span>
                          <span className="font-bold text-[#16171C] font-mono">{percent}%</span>
                        </div>
                        <div className="w-full bg-[#F0EEE6] h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%`, background: task.statusType === 'completed' ? '#3FA66B' : ACCENT }} className="h-full rounded-full transition-all duration-300" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-left whitespace-nowrap">
                      <span className="text-[11px] text-[#6E7078] font-mono bg-[#F7F5EF] px-2 py-1 rounded border border-[#E5E2D8] inline-block">{task.deadline}</span>
                    </td>
                    <td className="py-4 px-4 text-left whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.chip}`} style={st.chipBg ? { background: st.chipBg } : {}}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {task.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-left whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/reviewer/recording?task=${encodeURIComponent(task.title)}`)}
                        className="px-3 py-1.5 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
                        style={{ background: ACCENT }}
                      >
                        Vào kiểm duyệt <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9A9CA3] text-xs">Không tìm thấy nhiệm vụ nào phù hợp với bộ lọc.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-3 border-t border-[#E5E2D8]">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} accent={ACCENT} />
        </div>
      </div>
    </div>
  );
}