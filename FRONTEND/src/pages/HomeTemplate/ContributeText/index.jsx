import React, { useState, useMemo } from 'react';
import { Send, Check, Circle, Lightbulb, X } from 'lucide-react';
import { toast } from 'sonner';
import { SPEAKER_ACCENT as ACCENT, SUCCESS } from '../../../constants/theme';

const CATEGORIES = [
  'Hội thoại hàng ngày',
  'Công nghệ thông tin',
  'Giáo dục',
];

// Gợi ý mẫu theo từng chủ đề - đã có sẵn thẻ [vi]/[en], bấm vào là điền luôn đúng format
const SAMPLES = {
  'Hội thoại hàng ngày': '[vi]Chiều nay mình đi cà phê rồi [en]check-in [vi]chỗ mới nha.',
  'Công nghệ thông tin': '[en]Model [vi]này [en]train [vi]xong chưa, cho mình xem kết quả với.',
  'Giáo dục': '[en]Deadline [vi]nộp [en]assignment [vi]là thứ sáu tuần này.',
};

export default function ContributeText() {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Yêu cầu người dùng tự gắn thẻ [vi]/[en] trong câu - không auto-detect nữa
  const checks = useMemo(() => {
    const trimmed = text.trim();
    const stripped = trimmed.replace(/\[(vi|en)\]/g, '').trim();
    const words = stripped ? stripped.split(/\s+/) : [];
    const hasViTag = /\[vi\]/.test(trimmed);
    const hasEnTag = /\[en\]/.test(trimmed);

    return {
      wordCount: words.length,
      lengthOk: words.length >= 5 && words.length <= 20,
      mixedOk: hasViTag && hasEnTag,
      endOk: /[.!?…]$/.test(stripped),
    };
  }, [text]);

  const allValid = checks.lengthOk && checks.mixedOk && checks.endOk;

  const handleSubmit = () => {
    if (!allValid) return;
    // TODO: nối API gửi đóng góp thật - text đã có sẵn thẻ [vi]/[en] do người dùng tự gõ
    const payload = { transcript: text.trim(), category };
    console.log('Payload gửi API (mẫu, xoá console.log này khi nối API thật):', payload);
    toast.success('Đã gửi đóng góp!', {
      description: 'Câu của bạn đang chờ duyệt.',
    });
    setText('');
  };

  const rules = [
    { ok: checks.lengthOk, label: 'Độ dài từ 5 đến 20 từ', hint: `${checks.wordCount} từ` },
    { ok: checks.mixedOk, label: 'Có gắn nhãn [vi] và [en]', hint: 'bắt buộc' },
    { ok: checks.endOk, label: 'Kết thúc bằng dấu câu', hint: '. ! ?' },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-10 text-left font-sans space-y-5">

      {/* Tiêu đề trang - thay cho 4 ô thống kê đã bỏ */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16171C] tracking-tight">Đóng góp văn bản</h1>
        <p className="text-[13px] text-[#6E7078] mt-1">
          Viết câu tiếng Việt có xen từ tiếng Anh, tự gắn thẻ <span className="font-mono font-semibold text-[#16171C]">[vi]</span> và <span className="font-mono font-semibold text-[#16171C]">[en]</span> trước mỗi đoạn để đánh dấu ngôn ngữ. Câu được duyệt sẽ vào kho ghi âm chung.
        </p>
      </div>

      {/* Khối nhập chính */}
      <div className="bg-white rounded-[24px] border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] overflow-hidden">
        {/* Chọn chủ đề dạng chip - nhanh hơn dropdown, thấy hết lựa chọn cùng lúc */}
        <div className="px-5 sm:px-7 pt-6">
          <label className="block text-[12.5px] font-bold text-[#16171C] mb-2.5">Chủ đề của câu</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-3.5 py-2 rounded-full text-[12.5px] font-semibold transition-all"
                  style={{
                    background: active ? '#16171C' : '#F7F5EF',
                    color: active ? '#FFFFFF' : '#6E7078',
                    border: active ? '1px solid #16171C' : '1px solid #E5E2D8',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ô nhập lớn, chữ to dễ đọc */}
        <div className="px-5 sm:px-7 pt-6">
          <div className="flex items-baseline justify-between mb-2.5">
            <label className="text-[12.5px] font-bold text-[#16171C]">Câu văn của bạn</label>
            <span
              className="font-mono text-[12px] font-semibold"
              style={{ color: checks.lengthOk ? SUCCESS : checks.wordCount > 20 ? ACCENT : '#B7B4A9' }}
            >
              {checks.wordCount}/20 từ
            </span>
          </div>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: [vi]Bạn gửi file này qua [en]email [vi]giúp mình nhé."
            className="w-full p-4 text-[14px] leading-relaxed font-medium text-[#16171C] bg-[#F7F5EF] border border-[#E5E2D8] rounded-2xl outline-none resize-none transition-all focus:border-[#FF4B2E] focus:bg-white placeholder:text-[#B7B4A9] placeholder:font-normal font-mono"
          />
          {text && (
            <button
              onClick={() => setText('')}
              className="mt-2 text-[12px] font-semibold text-[#6E7078] hover:text-[#16171C] flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Xoá nội dung
            </button>
          )}
        </div>

        {/* Gợi ý mẫu theo chủ đề đang chọn - đã có sẵn thẻ [vi]/[en] */}
        <div className="px-5 sm:px-7 pt-4">
          <button
            onClick={() => setText(SAMPLES[category])}
            className="w-full text-left p-3.5 rounded-xl bg-[#FF4B2E]/[0.06] border border-[#FF4B2E]/20 hover:bg-[#FF4B2E]/10 transition-colors group"
          >
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#FF4B2E] mb-1">
              <Lightbulb className="w-3.5 h-3.5" /> Gợi ý cho chủ đề này — bấm để dùng
            </span>
            <span className="text-[13.5px] text-[#2B2C31] font-medium font-mono">{SAMPLES[category]}</span>
          </button>
        </div>

        {/* Checklist kiểm tra động */}
        <div className="px-5 sm:px-7 py-6 mt-5 bg-[#F7F5EF] border-t border-[#E5E2D8] space-y-2.5">
          <p className="text-[12.5px] font-bold text-[#16171C]">Tiêu chuẩn cần đạt</p>
          {rules.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5">
              {r.ok ? (
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: SUCCESS }}>
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                </span>
              ) : (
                <Circle className="w-4 h-4 text-[#C2BFB4] shrink-0" strokeWidth={2} />
              )}
              <span
                className="text-[13px] font-medium"
                style={{ color: r.ok ? '#2B2C31' : '#8A8D98' }}
              >
                {r.label}
              </span>
              <span className="font-mono text-[11px] text-[#B7B4A9] ml-auto">{r.hint}</span>
            </div>
          ))}
          <p className="text-[11.5px] text-[#8A8D98] pt-1.5 leading-relaxed">
            Ngoài ra câu cần tự nhiên, đúng ngữ cảnh và không chứa nội dung nhạy cảm — phần này sẽ do đội duyệt kiểm tra.
          </p>
        </div>
      </div>

      {/* Nút gửi - khoá cho đến khi đạt chuẩn */}
      <button
        onClick={handleSubmit}
        disabled={!allValid}
        className="w-full py-4 text-white font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 transition-all"
        style={{
          background: allValid ? ACCENT : '#DCD9CE',
          cursor: allValid ? 'pointer' : 'not-allowed',
          boxShadow: allValid ? `0 10px 24px ${ACCENT}40` : 'none',
        }}
      >
        <Send className="w-4 h-4" />
        {allValid ? 'Gửi đóng góp để duyệt' : 'Hoàn thành các tiêu chuẩn để gửi'}
      </button>
    </div>
  );
}