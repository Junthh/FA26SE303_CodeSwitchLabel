import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Play, Pause, CheckCircle2, XCircle, Search, Filter, AlertTriangle, FolderKanban, Headphones, X, Eye } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../../../components/Pagination/Pagination';
import { REVIEWER_ACCENT as ACCENT } from '../../../../constants/theme';

export default function ReviewerRecording() {
  const [searchParams] = useSearchParams();
  const taskQuery = searchParams.get('task');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpeaker, setFilterSpeaker] = useState('all');
  const [filterTask, setFilterTask] = useState(taskQuery || 'all');

  const [selectedRecording, setSelectedRecording] = useState(null); // form từ chối
  const [rejectCategory, setRejectCategory] = useState('pronunciation');
  const [rejectReason, setRejectReason] = useState('');

  const [listenItem, setListenItem] = useState(null); // popup nghe
  const [viewItem, setViewItem] = useState(null); // popup xem full câu

  const pageSize = 10;

  const [activeQueue, setActiveQueue] = useState([
    { id: 'REC-2025-001', taskName: 'Nhiệm vụ ghi âm hàng ngày', speaker: 'Nguyễn Mạnh Lực', time: '08/09/2026 - 08:30', text: 'Em nhớ upload tài liệu trước deadline nhé.', duration: '00:04' },
    { id: 'REC-2025-002', taskName: 'Nhiệm vụ ghi âm cuối tuần', speaker: 'Trần Minh Tâm', time: '07/09/2026 - 17:15', text: 'Gửi cho mình slide báo cáo trước 5h chiều nhé.', duration: '00:05' },
    { id: 'REC-2025-003', taskName: 'Chủ đề công nghệ & AI', speaker: 'Lê Hoàng Nam', time: '07/09/2026 - 15:30', text: 'Cần fix bug này gấp trước khi release bản mới.', duration: '00:06' },
    { id: 'REC-2025-004', taskName: 'Chủ đề đặc biệt: Giáo dục', speaker: 'Nguyễn Mạnh Lực', time: '07/09/2026 - 14:10', text: 'Thầy vừa gửi link zoom qua email lớp rồi.', duration: '00:04' },
    { id: 'REC-2025-005', taskName: 'Thu âm hội thoại công sở', speaker: 'Phạm Thu Thảo', time: '06/09/2026 - 13:45', text: 'Cuối tuần này cả team đi workshop ở Quận 1 nhé.', duration: '00:05' },
    { id: 'REC-2025-006', taskName: 'Chủ đề công nghệ & AI', speaker: 'Hoàng Quốc Bảo', time: '06/09/2026 - 11:20', text: 'Mô hình AI này xử lý prompt rất nhanh.', duration: '00:05' },
    { id: 'REC-2025-007', taskName: 'Nhiệm vụ ghi âm hàng ngày', speaker: 'Đặng Mai Phương', time: '06/09/2026 - 10:05', text: 'Bạn đã book lịch họp với khách hàng chưa?', duration: '00:04' },
    { id: 'REC-2025-008', taskName: 'Thu âm hội thoại công sở', speaker: 'Trần Minh Tâm', time: '06/09/2026 - 09:45', text: 'Tối nay order đồ ăn ở quán cũ nhé.', duration: '00:03' },
    { id: 'REC-2025-009', taskName: 'Chủ đề đặc biệt: Giáo dục', speaker: 'Lê Hoàng Nam', time: '05/09/2026 - 16:00', text: 'Hạn nộp assignment là cuối tuần này.', duration: '00:04' },
    { id: 'REC-2025-010', taskName: 'Nhiệm vụ ghi âm cuối tuần', speaker: 'Phạm Thu Thảo', time: '03/09/2026 - 15:45', text: 'Bộ phim mới ra mắt có rating rất cao.', duration: '00:05' },
  ]);

  const filteredQueue = useMemo(() => {
    return activeQueue.filter((rec) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = rec.id.toLowerCase().includes(q) || rec.text.toLowerCase().includes(q) ||
        rec.speaker.toLowerCase().includes(q) || rec.taskName.toLowerCase().includes(q);
      const matchSpeaker = filterSpeaker === 'all' || rec.speaker === filterSpeaker;
      const matchTask = filterTask === 'all' || rec.taskName === filterTask;
      return matchSearch && matchSpeaker && matchTask;
    });
  }, [activeQueue, searchTerm, filterSpeaker, filterTask]);

  const totalPages = Math.ceil(filteredQueue.length / pageSize) || 1;
  const paginatedQueue = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, currentPage]);

  const handleApprove = (id) => setActiveQueue((prev) => prev.filter((rec) => rec.id !== id));

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedRecording) return;
    setActiveQueue((prev) => prev.filter((rec) => rec.id !== selectedRecording.id));
    setSelectedRecording(null);
    setRejectReason('');
    setRejectCategory('pronunciation');
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
            placeholder="Tìm theo nhiệm vụ, speaker, nội dung..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#E5E2D8] rounded-xl outline-none focus:border-[#818CF8] focus:ring-4 focus:ring-[#818CF8]/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-[#9A9CA3]" />
            <select
              value={filterTask}
              onChange={(e) => { setFilterTask(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-[#E5E2D8] rounded-xl px-3 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
            >
              <option value="all">Tất cả nhiệm vụ</option>
              <option value="Nhiệm vụ ghi âm hàng ngày">Nhiệm vụ ghi âm hàng ngày</option>
              <option value="Nhiệm vụ ghi âm cuối tuần">Nhiệm vụ ghi âm cuối tuần</option>
              <option value="Chủ đề công nghệ & AI">Chủ đề công nghệ & AI</option>
              <option value="Chủ đề đặc biệt: Giáo dục">Chủ đề đặc biệt: Giáo dục</option>
              <option value="Thu âm hội thoại công sở">Thu âm hội thoại công sở</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#9A9CA3]" />
            <select
              value={filterSpeaker}
              onChange={(e) => { setFilterSpeaker(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-[#E5E2D8] rounded-xl px-3 py-2 bg-white text-[#16171C] font-medium outline-none focus:border-[#818CF8]"
            >
              <option value="all">Tất cả speaker</option>
              <option value="Nguyễn Mạnh Lực">Nguyễn Mạnh Lực</option>
              <option value="Trần Minh Tâm">Trần Minh Tâm</option>
              <option value="Lê Hoàng Nam">Lê Hoàng Nam</option>
              <option value="Phạm Thu Thảo">Phạm Thu Thảo</option>
              <option value="Hoàng Quốc Bảo">Hoàng Quốc Bảo</option>
              <option value="Đặng Mai Phương">Đặng Mai Phương</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F5EF] text-[11px] uppercase tracking-wider text-[#9A9CA3] border-b border-[#E5E2D8] font-bold">
                <th className="py-3 px-4 text-center w-[5%]">STT</th>
                <th className="py-3 px-5 text-left w-[20%]">Nhiệm vụ</th>
                <th className="py-3 px-4 text-left w-[14%]">Speaker</th>
                <th className="py-3 px-4 text-left w-[13%]">Thời gian</th>
                <th className="py-3 px-4 text-left w-[22%]">Nội dung câu</th>
                <th className="py-3 px-4 text-left w-[11%]">Nghe</th>
                <th className="py-3 px-5 text-left w-[15%]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEE6] text-xs font-medium">
              {paginatedQueue.length > 0 ? paginatedQueue.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-[#F7F5EF]/70 transition-colors">
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="text-[#9A9CA3] font-medium font-mono text-xs">{(currentPage - 1) * pageSize + idx + 1}</span>
                  </td>
                  <td className="py-3.5 px-5 text-left whitespace-nowrap">
                    <p className="font-bold text-[#16171C] truncate max-w-[180px]" title={rec.taskName}>{rec.taskName}</p>
                  </td>
                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <p className="font-semibold text-[#16171C]">{rec.speaker}</p>
                  </td>
                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <span className="text-[#6E7078] font-mono text-[11px]">{rec.time}</span>
                  </td>
                  <td className="py-3.5 px-4 text-left">
                    <div className="flex items-center gap-2 max-w-[240px]">
                      <p className="font-semibold text-[#16171C] truncate">"{rec.text}"</p>
                      <button
                        onClick={() => setViewItem(rec)}
                        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9A9CA3] hover:text-[#16171C] hover:bg-[#F0EEE6] transition-colors"
                        title="Xem toàn bộ câu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => setListenItem(rec)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ background: ACCENT }}
                    >
                      <Play className="w-3 h-3 fill-current" /><span>{rec.duration}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-left whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(rec.id)}
                        className="px-3 py-1.5 bg-[#EAF7EF] border border-[#C5E8D3] text-[#1F5C3F] rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#DCF0E5] transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button
                        onClick={() => setSelectedRecording(rec)}
                        className="px-3 py-1.5 bg-[#FDEAEA] border border-[#F3C9C9] text-[#C63B3B] rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#FBDADA] transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A9CA3] text-xs space-y-1">
                    <p className="font-bold text-[#16171C] text-sm">Tuyệt vời! Bạn đã xử lý hết hàng đợi chờ duyệt.</p>
                    <p>Các bản ghi đã thao tác sẽ được ghi nhận tại mục Lịch sử kiểm duyệt.</p>
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
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F7F5EF] text-[#6E7078] border border-[#E5E2D8]">{viewItem.taskName}</span>
                <span className="text-[11px] text-[#9A9CA3] font-mono">{viewItem.speaker} · {viewItem.time}</span>
              </div>
              <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-4">
                <p className="text-sm font-medium text-[#16171C] leading-relaxed break-words">"{viewItem.text}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NGHE BẢN GHI ÂM */}
      {listenItem && <ListenModal item={listenItem} onClose={() => setListenItem(null)} />}

      {/* MODAL TỪ CHỐI */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]">
            <div className="h-1.5 w-full bg-[#C63B3B]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FDEAEA] flex-shrink-0">
                    <AlertTriangle className="w-[18px] h-[18px] text-[#C63B3B]" />
                  </div>
                  <span className="text-[15px] font-bold text-[#16171C]">Từ chối bản ghi · {selectedRecording.speaker}</span>
                </div>
                <button onClick={() => setSelectedRecording(null)} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
                  <X className="w-[18px] h-[18px] text-[#6E7078]" />
                </button>
              </div>
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">Loại lỗi kiểm duyệt</label>
                  <select
                    value={rejectCategory}
                    onChange={(e) => setRejectCategory(e.target.value)}
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-2.5 bg-white text-[#16171C] font-medium outline-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  >
                    <option value="pronunciation">Phát âm sai từ Tiếng Anh / Code-Switching</option>
                    <option value="noise">Tạp âm / Rè tiếng / Nhỏ tiếng</option>
                    <option value="wrong_text">Đọc sai hoặc thiếu từ so với văn bản</option>
                    <option value="other">Lỗi khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#16171C] mb-1.5">Mô tả lý do từ chối chi tiết</label>
                  <textarea
                    required rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Phát âm từ 'deadline' chưa rõ, bị nuốt âm đuôi..."
                    className="w-full text-xs border border-[#E5E2D8] rounded-xl p-3 outline-none resize-none focus:border-[#C63B3B] focus:ring-4 focus:ring-[#C63B3B]/10 transition-all"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setSelectedRecording(null)} className="flex-1 py-2.5 border border-[#E5E2D8] text-[#55565B] rounded-xl text-xs font-bold hover:bg-[#F7F5EF] transition-colors">
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

// Popup nghe - trình phát thật với thẻ <audio> ẩn
function ListenModal({ item, onClose }) {
  const src = item.audioUrl || '/demo-recording.wav'; // TODO: URL thật
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.floor(Math.abs(s) % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64" style={{ background: 'rgba(22,23,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} onClick={onClose}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(16,17,20,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-full" style={{ background: ACCENT }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}1A` }}>
                <Headphones className="w-[18px] h-[18px]" style={{ color: ACCENT }} />
              </div>
              <span className="text-[16px] font-bold text-[#16171C]">Nghe bản ghi âm</span>
            </div>
            <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F0EEE6] transition-colors flex-shrink-0">
              <X className="w-[18px] h-[18px] text-[#6E7078]" />
            </button>
          </div>

          <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-xl p-3.5 mb-5">
            <p className="text-[10px] font-bold text-[#9A9CA3] uppercase tracking-wider mb-1">Nội dung câu</p>
            <p className="text-sm font-medium text-[#16171C] leading-relaxed">"{item.text}"</p>
          </div>

          <div ref={trackRef} onClick={seek} className="relative h-2 rounded-full bg-[#E5E2D8] cursor-pointer">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 shadow-[0_1px_3px_rgba(16,17,20,0.2)]" style={{ left: `calc(${pct}% - 7px)`, borderColor: ACCENT }} />
          </div>
          <div className="flex justify-between font-mono text-[12px] text-[#6E7078] font-semibold mt-2.5">
            <span className="text-[#16171C]">{fmt(currentTime)}</span>
            <span>-{fmt(duration - currentTime)}</span>
          </div>

          <div className="flex items-center justify-center mt-4">
            <button onClick={togglePlay} className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_22px_rgba(129,140,248,0.3)] hover:scale-105 active:scale-95 transition-transform" style={{ background: ACCENT }}>
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}