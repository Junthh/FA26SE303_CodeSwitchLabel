import React, { useState, useRef, useEffect } from 'react';
import TaskStepper from '../../../components/TaskStepper/TaskStepper';
import { Mic, RotateCcw, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseCodeSwitch } from '../../../components/CodeSwitchText/CodeSwitchText';
import { SPEAKER_ACCENT as ACCENT } from '../../../constants/theme';

const TARGET_SECONDS = 30;
const HISTORY_LEN = 90; // số cột sóng hiển thị cùng lúc - cuộn liên tục như Voice Memos

// TODO: thay bằng dữ liệu thật từ API - giữ nguyên format có thẻ [vi]/[en]
const SENTENCE_TRANSCRIPT = '[vi]Em nên [en]scan [vi]tài liệu này rồi gửi qua [en]email [vi]cho tôi.';

export default function RecordSpeech() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Bộ đệm lịch sử biên độ - mỗi khung hình đẩy 1 giá trị mới vào cuối,
  // bỏ giá trị cũ nhất ở đầu => tạo hiệu ứng sóng "chạy" từ phải sang trái
  const [waveHistory, setWaveHistory] = useState(Array(HISTORY_LEN).fill(3));

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;

      setIsRecording(true);
      setRecordingTime(0);
      setWaveHistory(Array(HISTORY_LEN).fill(3));

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateWaveform = () => {
        analyser.getByteFrequencyData(dataArray);
        let total = 0;
        for (let i = 0; i < dataArray.length; i++) total += dataArray[i];
        const volume = total / dataArray.length;
        const level = Math.max(4, Math.min(100, (volume / 70) * 100));

        setWaveHistory((prev) => {
          const next = prev.slice(1);
          next.push(level);
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } catch (err) {
      alert("Không thể kết nối Microphone! Vui lòng cho phép trình duyệt truy cập Micro.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsRecording(false);
    setWaveHistory(Array(HISTORY_LEN).fill(3));
  };

  useEffect(() => () => stopRecording(), []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const ringPercent = Math.min(100, (recordingTime / TARGET_SECONDS) * 100);
  const RADIUS = 54;
  const CIRC = 2 * Math.PI * RADIUS;

  // Chỉ cần tô màu từ tiếng Anh, không cần box hay tooltip như ở bước duyệt văn bản
  const sentenceSegments = parseCodeSwitch(SENTENCE_TRANSCRIPT);

  return (
    <div className="space-y-4 text-left pb-6 max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={2} />

      {/* Câu văn thu gọn - đã xác nhận ở bước trước */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-5">
        <p className="text-[12px] font-semibold text-[#6E7078] mb-1">Đọc to câu sau</p>
        <p className="text-lg sm:text-xl font-bold text-[#16171C] leading-relaxed">
          {sentenceSegments.map((seg, i) =>
            seg.lang === 'en' ? (
              <span key={i} style={{ color: ACCENT }}>{seg.text}</span>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </p>
      </div>

      {/* SÂN KHẤU GHI ÂM - nền sáng đồng bộ với UI chung, chỉ dùng accent để nhấn chi tiết quan trọng */}
      <div className="relative bg-white rounded-[24px] border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-5 sm:p-7 overflow-hidden">
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${ACCENT}14, transparent 60%)`,
            opacity: isRecording ? 1 : 0.5,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Timer lớn kiểu đồng hồ ghi âm */}
          <p className="font-mono text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: isRecording ? ACCENT : '#16171C' }}>
            {formatTime(recordingTime)}
          </p>
          <p className="text-[11.5px] text-[#9A9CA3] font-semibold -mt-4">mục tiêu 00:{String(TARGET_SECONDS).padStart(2, '0')}</p>

          {/* Waveform cuộn liên tục - sóng mới vào từ phải, cũ trôi sang trái */}
          <div className="relative w-full h-16 sm:h-20 rounded-xl bg-[#F0EEE6] overflow-hidden flex items-center px-3">
            <div className="w-full h-full flex items-center gap-[2px]">
              {waveHistory.map((level, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[2px] rounded-full transition-none"
                  style={{
                    height: `${level}%`,
                    background: isRecording ? ACCENT : '#D8D5C9',
                    opacity: isRecording ? 0.4 + 0.6 * (i / HISTORY_LEN) : 1,
                  }}
                />
              ))}
            </div>
            {/* vạch "hiện tại" bên phải, giống playhead của app ghi âm thật */}
            <div className="absolute right-3 top-2 bottom-2 w-[2px] rounded-full" style={{ background: ACCENT, opacity: isRecording ? 1 : 0.3 }} />
          </div>

          {/* Mic to là điều khiển chính (bấm để ghi/dừng), nút reset phụ bên phải */}
          <div className="flex items-center justify-center gap-7 sm:gap-9">
            <div className="w-8 h-8" />

            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90 w-full h-full">
                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#F0EEE6" strokeWidth="4" />
                {isRecording && (
                  <circle
                    cx="60" cy="60" r={RADIUS} fill="none" stroke={ACCENT} strokeWidth="4"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - ringPercent / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                )}
              </svg>
              {isRecording && (
                <span className="absolute inset-1.5 rounded-full" style={{ background: `${ACCENT}26` }}>
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: `${ACCENT}40` }} />
                </span>
              )}
              <button
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                    navigate('/review-recording');
                  } else {
                    startRecording();
                  }
                }}
                style={{ background: ACCENT }}
                className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all active:scale-95"
              >
                {isRecording ? (
                  <span className="w-5 h-5 rounded-md bg-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            <button
              onClick={() => { stopRecording(); setRecordingTime(0); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F0EEE6] border border-[#E5E2D8] text-[#6E7078] hover:text-[#16171C] hover:bg-[#E9E6DA] transition-all"
              title="Thu âm lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[13px] font-semibold text-[#6E7078] -mt-1">
            {isRecording ? 'Đang ghi âm · nhấn để dừng và kiểm tra' : 'Nhấn mic để bắt đầu ghi âm'}
          </p>
        </div>
      </div>

      {/* Mẹo ghi âm - thu gọn, không cạnh tranh với sân khấu */}
      <div className="bg-white rounded-2xl border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[12.5px] font-bold text-[#16171C] flex items-center gap-1.5 shrink-0">
          <HelpCircle className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Lưu ý
        </span>
        <span className="text-[12.5px] text-[#6E7078]">Đọc tự nhiên như hội thoại</span>
        <span className="w-1 h-1 rounded-full bg-[#E5E2D8]" />
        <span className="text-[12.5px] text-[#6E7078]">Cách mic 15-20cm</span>
        <span className="w-1 h-1 rounded-full bg-[#E5E2D8]" />
        <span className="text-[12.5px] text-[#6E7078]">Không gian yên tĩnh</span>
      </div>
    </div>
  );
}