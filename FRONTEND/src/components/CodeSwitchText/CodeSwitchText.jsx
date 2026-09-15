import React, { useMemo } from 'react';

/**
 * Tách chuỗi dạng "[vi]Em nên [en]scan [vi]tài liệu..." thành mảng đoạn.
 * Trả về: [{ lang: 'vi', text: 'Em nên ' }, { lang: 'en', text: 'scan ' }, ...]
 */
export function parseCodeSwitch(transcript = '') {
  const segments = [];
  const regex = /\[(vi|en)\]([^[]*)/g;
  let match;

  while ((match = regex.exec(transcript)) !== null) {
    const [, lang, text] = match;
    if (text) segments.push({ lang, text });
  }

  // Nếu chuỗi không có thẻ nào, coi toàn bộ là tiếng Việt
  if (segments.length === 0 && transcript) {
    segments.push({ lang: 'vi', text: transcript });
  }

  return segments;
}

/** Bỏ hết thẻ [vi]/[en], lấy câu thuần để so sánh hoặc đọc */
export function stripTags(transcript = '') {
  return transcript.replace(/\[(vi|en)\]/g, '');
}

/**
 * Hiển thị câu code-switch: đoạn tiếng Anh được tô màu chữ,
 * hover vào hiện nghĩa thuần Việt lấy từ mảng alignment.
 */
export default function CodeSwitchText({
  transcript,
  alignment = [],
  accent = '#FF4B2E',
  className = '',
}) {
  const segments = useMemo(() => parseCodeSwitch(transcript), [transcript]);

  // Tra nhanh: từ tiếng Anh -> bản dịch thuần Việt
  const alignMap = useMemo(() => {
    const map = new Map();
    alignment.forEach((a) => {
      if (a.source) map.set(a.source.toLowerCase().trim(), a.target);
    });
    return map;
  }, [alignment]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.lang === 'vi') return <span key={i}>{seg.text}</span>;

        // Đoạn tiếng Anh: tách phần chữ và khoảng trắng đuôi để không tô cả khoảng trắng
        const trailing = seg.text.match(/\s*$/)[0];
        const word = seg.text.slice(0, seg.text.length - trailing.length);
        const viMeaning = alignMap.get(word.toLowerCase().trim());

        return (
          <React.Fragment key={i}>
            <span
              className="relative inline-block group cursor-help"
              style={{
                color: accent,
                borderBottom: `2px dotted ${accent}80`,
                paddingBottom: 1,
              }}
            >
              {word}
              {viMeaning && (
                <span
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-lg bg-[#16171C] px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  style={{ fontFamily: 'inherit' }}
                >
                  {viMeaning}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-[#16171C]" />
                </span>
              )}
            </span>
            {trailing}
          </React.Fragment>
        );
      })}
    </span>
  );
}