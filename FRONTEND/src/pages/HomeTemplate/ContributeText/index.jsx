import { useState, useMemo } from 'react';
import { Send, Check, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  SPEAKER_ACCENT as ACCENT,
  SUCCESS, WARNING,
  TEXT_HEADING, TEXT_BODY, TEXT_FAINT,
  BORDER_LIGHT, SURFACE_PAGE,
} from '../../../constants/theme';

const CATEGORIES = ['Hội thoại hàng ngày', 'Công nghệ thông tin', 'Giáo dục'];
const WORD_COUNT_OPTIONS = [1, 2, 3];
const MAX_PAIRS = 3;

/** Ô tick vuông dùng chung cho cả "Chủ đề" và "Số từ tiếng Anh" - single-select, hiển thị dạng checkbox thay vì chip/select. */
function TickOption({ selected, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${className}`}
      style={{
        background: selected ? `${ACCENT}0D` : '#FFFFFF',
        border: `1.5px solid ${selected ? ACCENT : BORDER_LIGHT}`,
      }}
    >
      <span
        className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 transition-all"
        style={{
          background: selected ? ACCENT : '#FFFFFF',
          border: `1.5px solid ${selected ? ACCENT : '#C7C4B8'}`,
        }}
      >
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
      </span>
      <span className="text-[13px] font-semibold" style={{ color: selected ? TEXT_HEADING : TEXT_BODY }}>
        {label}
      </span>
    </button>
  );
}

export default function ContributeText() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [wordCount, setWordCount] = useState(2);
  const [csTranscript, setCsTranscript] = useState('');
  const [viEquivalent, setViEquivalent] = useState('');
  // Luôn giữ mảng 3 phần tử, chỉ dùng slice(0, wordCount) khi render/gửi - tránh phải resize mảng khi đổi wordCount
  const [pairs, setPairs] = useState(Array.from({ length: MAX_PAIRS }, () => ({ source: '', target: '' })));

  const updatePair = (index, field, value) => {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const checks = useMemo(() => {
    const csTrimmed = csTranscript.trim();
    const csStripped = csTrimmed.replace(/\[(vi|en)\]/g, '').trim();
    const words = csStripped ? csStripped.split(/\s+/) : [];

    const viTrimmed = viEquivalent.trim();
    const viStripped = viTrimmed.replace(/\[(vi|en)\]/g, '').trim();

    const activePairs = pairs.slice(0, wordCount);
    const pairsOk = activePairs.every((p) => p.source.trim() && p.target.trim());

    return {
      wordCount: words.length,
      lengthOk: words.length >= 5 && words.length <= 20,
      mixedOk: /\[vi\]/.test(csTrimmed) && /\[en\]/.test(csTrimmed),
      endOk: /[.!?…]$/.test(csStripped),
      viOk: /\[vi\]/.test(viTrimmed) && viStripped.length > 0,
      pairsOk,
    };
  }, [csTranscript, viEquivalent, pairs, wordCount]);

  const allValid = checks.lengthOk && checks.mixedOk && checks.endOk && checks.viOk && checks.pairsOk;

  const handleSubmit = () => {
    if (!allValid) return;
    // TODO: id do backend cấp - Date.now() chỉ là placeholder tạm thời
    const payload = {
      id: String(Date.now()),
      domain: category,
      cs_transcript: csTranscript.trim(),
      vi_equivalent: viEquivalent.trim(),
      alignment: pairs.slice(0, wordCount).map((p) => ({
        source: p.source.trim(),
        source_lang: 'en',
        target: p.target.trim(),
        target_lang: 'vi',
        relation: 'semantic_equivalent',
      })),
    };
    // TODO: nối API gửi đóng góp thật, thay cho console.log mô phỏng này
    console.log('Payload gửi API (mẫu, xoá console.log này khi nối API thật):', payload);
    toast.success('Đã gửi đóng góp!', { description: 'Câu của bạn đang chờ duyệt.' });

    setCsTranscript('');
    setViEquivalent('');
    setPairs(Array.from({ length: MAX_PAIRS }, () => ({ source: '', target: '' })));
  };

  const rules = [
    { ok: checks.lengthOk, label: 'Câu Việt-Anh dài 5-20 từ', hint: `${checks.wordCount} từ` },
    { ok: checks.mixedOk, label: 'Câu Việt-Anh có gắn nhãn [vi] và [en]', hint: 'bắt buộc' },
    { ok: checks.endOk, label: 'Câu Việt-Anh kết thúc bằng dấu câu', hint: '. ! ?' },
    { ok: checks.viOk, label: 'Có câu tiếng Việt tương đương', hint: '[vi]...' },
    { ok: checks.pairsOk, label: `Điền đủ ${wordCount} cặp từ đối chiếu`, hint: `${wordCount} cặp` },
  ];

  return (
    <div className="max-w-6xl mx-auto -mt-2 text-left font-sans space-y-3">

      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: TEXT_HEADING }}>Đóng góp văn bản</h1>
        <p className="text-[13px] mt-1" style={{ color: TEXT_BODY }}>
          Viết câu tiếng Việt có xen từ tiếng Anh, gắn thẻ{' '}
          <span className="font-mono font-semibold" style={{ color: TEXT_HEADING }}>[vi]</span> và{' '}
          <span className="font-mono font-semibold" style={{ color: TEXT_HEADING }}>[en]</span> trước mỗi đoạn,
          kèm câu tiếng Việt tương đương và nghĩa của từng từ tiếng Anh.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: `1px solid ${BORDER_LIGHT}`, boxShadow: '0 1px 3px rgba(16,17,20,0.04)' }}>

        {/* Chủ đề - dạng tick box thay vì select/chip */}
        <div className="px-4 sm:px-5 pt-2">
          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: TEXT_HEADING }}>Chủ đề của câu</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <TickOption key={c} selected={category === c} label={c} onClick={() => setCategory(c)} className="flex-1" />
            ))}
          </div>
        </div>

        {/* Số từ tiếng Anh trong câu - sinh ra đúng số ô đối chiếu bên dưới */}
        <div className="px-4 sm:px-5 pt-2">
          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: TEXT_HEADING }}>Số từ tiếng Anh trong câu</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {WORD_COUNT_OPTIONS.map((n) => (
              <TickOption key={n} selected={wordCount === n} label={`${n} từ tiếng Anh`} onClick={() => setWordCount(n)} className="flex-1 justify-center" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 sm:px-5 pt-3">
        {/* Ô câu Việt-Anh có nhãn [vi]/[en] */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor="contribution-cs" className="text-[12.5px] font-bold" style={{ color: TEXT_HEADING }}>Câu Việt-Anh</label>
            <span
              className="font-mono text-[12px] font-semibold"
              style={{ color: checks.lengthOk ? SUCCESS : checks.wordCount > 20 ? WARNING : TEXT_FAINT }}
            >
              {checks.wordCount}/20 từ
            </span>
          </div>
          <textarea
            id="contribution-cs"
            rows={3}
            value={csTranscript}
            onChange={(e) => setCsTranscript(e.target.value)}
            placeholder="Ví dụ: [vi]Bạn gửi file này qua [en]email [vi]giúp mình nhé."
            className="block w-full h-20 p-3 text-[14px] leading-relaxed font-medium font-mono rounded-xl outline-none resize-none transition-all placeholder:font-normal"
            style={{ color: TEXT_HEADING, background: SURFACE_PAGE, border: `1px solid ${BORDER_LIGHT}` }}
            onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.background = '#FFFFFF'; }}
            onBlur={(e) => { e.target.style.borderColor = BORDER_LIGHT; e.target.style.background = SURFACE_PAGE; }}
          />
        </div>

        {/* Ô câu tiếng Việt tương đương - dạng [vi] */}
        <div className="min-w-0">
          <label htmlFor="contribution-vi" className="block text-[12.5px] font-bold mb-1.5" style={{ color: TEXT_HEADING }}>Câu tiếng Việt tương đương</label>
          <textarea
            id="contribution-vi"
            rows={2}
            value={viEquivalent}
            onChange={(e) => setViEquivalent(e.target.value)}
            placeholder="Ví dụ: [vi]Bạn gửi file này qua thư điện tử giúp mình nhé."
            className="block w-full h-20 p-3 text-[14px] leading-relaxed font-medium font-mono rounded-xl outline-none resize-none transition-all placeholder:font-normal"
            style={{ color: TEXT_HEADING, background: SURFACE_PAGE, border: `1px solid ${BORDER_LIGHT}` }}
            onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.background = '#FFFFFF'; }}
            onBlur={(e) => { e.target.style.borderColor = BORDER_LIGHT; e.target.style.background = SURFACE_PAGE; }}
          />
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mx-4 sm:mx-5 mt-3 py-2 border-t" style={{ borderColor: BORDER_LIGHT }}>
        {/* Các cặp từ đối chiếu Anh-Việt - số lượng sinh theo wordCount đã chọn */}
        <div className="min-w-0 space-y-2">
          <label className="block text-[12.5px] font-bold" style={{ color: TEXT_HEADING }}>
            Nghĩa tiếng Việt của {wordCount === 1 ? 'từ' : 'các từ'} tiếng Anh
          </label>
          <div className="space-y-2 md:min-h-[130px]">
          {Array.from({ length: wordCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                aria-label={`Từ tiếng Anh ${i + 1}`}
                value={pairs[i].source}
                onChange={(e) => updatePair(i, 'source', e.target.value)}
                placeholder="từ tiếng Anh"
                className="min-w-0 flex-1 px-3 py-2 text-[13.5px] font-mono font-semibold rounded-lg outline-none transition-all"
                style={{ color: ACCENT, background: SURFACE_PAGE, border: `1px solid ${BORDER_LIGHT}` }}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e) => { e.target.style.borderColor = BORDER_LIGHT; }}
              />
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: TEXT_FAINT }} />
              <input
                type="text"
                aria-label={`Nghĩa tiếng Việt ${i + 1}`}
                value={pairs[i].target}
                onChange={(e) => updatePair(i, 'target', e.target.value)}
                placeholder="nghĩa tiếng Việt"
                className="min-w-0 flex-1 px-3 py-2 text-[13.5px] font-medium rounded-lg outline-none transition-all"
                style={{ color: TEXT_HEADING, background: SURFACE_PAGE, border: `1px solid ${BORDER_LIGHT}` }}
                onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                onBlur={(e) => { e.target.style.borderColor = BORDER_LIGHT; }}
              />
            </div>
          ))}
          </div>
        </div>

      <aside className="min-w-0 border-t pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4" style={{ borderColor: BORDER_LIGHT }}>
        {/* Checklist kiểm tra động */}
        <div className="space-y-1">
          <p className="text-[12.5px] font-bold" style={{ color: TEXT_HEADING }}>Tiêu chuẩn cần đạt</p>
          {rules.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              <span
                className="w-4 h-4 mt-0.5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: r.ok ? SUCCESS : '#FFFFFF', border: r.ok ? 'none' : '1.5px solid #C7C4B8' }}
              >
                {r.ok && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
              </span>
              <span className="text-[12px] font-medium leading-5" style={{ color: r.ok ? TEXT_HEADING : TEXT_FAINT }}>
                {r.label}
              </span>
              <span className="font-mono text-[11px] ml-auto shrink-0 leading-5" style={{ color: TEXT_FAINT }}>{r.hint}</span>
            </div>
          ))}
          <p className="text-[11.5px] pt-1 leading-relaxed" style={{ color: TEXT_FAINT }}>
            Ngoài ra câu cần tự nhiên, đúng ngữ cảnh và không chứa nội dung nhạy cảm — phần này sẽ do đội duyệt kiểm tra.
          </p>
        </div>
      </aside>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-2 border-t" style={{ background: SURFACE_PAGE, borderColor: BORDER_LIGHT }}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[12px] font-semibold" aria-live="polite" style={{ color: allValid ? SUCCESS : TEXT_BODY }}>
            Đã đạt {rules.filter((rule) => rule.ok).length}/{rules.length} tiêu chuẩn
          </span>
          {(csTranscript || viEquivalent || pairs.some((pair) => pair.source || pair.target)) && (
            <button
              onClick={() => {
                setCsTranscript('');
                setViEquivalent('');
                setPairs(Array.from({ length: MAX_PAIRS }, () => ({ source: '', target: '' })));
              }}
              className="text-[12px] font-semibold flex items-center gap-1 transition-colors"
              style={{ color: TEXT_BODY }}
            >
              <X className="w-3.5 h-3.5" /> Xoá toàn bộ nội dung
            </button>
          )}
        </div>
      <button
        onClick={handleSubmit}
        disabled={!allValid}
        className="w-full sm:w-auto shrink-0 px-4 py-2.5 text-white font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all"
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
      </div>
    </div>
  );
}
