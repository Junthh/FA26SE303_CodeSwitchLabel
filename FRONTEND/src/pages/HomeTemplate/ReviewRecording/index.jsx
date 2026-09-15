import React, { useState, useRef, useCallback } from 'react';
import TaskStepper from '../../../components/TaskStepper/TaskStepper';
import { Play, Pause, RotateCcw, RotateCw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SPEAKER_ACCENT as ACCENT } from '../../../constants/theme';

export default function ReviewRecording({ audioUrl }) {
  const navigate = useNavigate();

  // TODO: thay bằng URL thật từ API của bạn (hoặc truyền qua props/state khi điều hướng)
  const src = audioUrl || '/demo-recording.wav';

  const audioRef = useRef(null);
  const trackRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Đồng bộ trạng thái phát từ thẻ <audio> thật
  React.useEffect(() => {
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

  // Phát liên tục từ đầu đến cuối - không có tua nhanh/lùi, chỉ 1 nút play/pause duy nhất
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const seekToEvent = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const seekBy = (delta) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.min(duration, Math.max(0, audio.currentTime + delta));
  };

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.floor(Math.abs(s) % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const playedFraction = duration ? currentTime / duration : 0;

  return (
    <div className="space-y-5 pb-6 text-left max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={3} />

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <div className="bg-white rounded-[24px] border border-[#E5E2D8] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="font-bold text-[#16171C] text-[15px]">Nghe lại bản ghi của bạn</h3>
          <p className="text-[12.5px] text-[#6E7078] mt-0.5">Đảm bảo giọng đọc rõ ràng, đúng câu trước khi nộp bài.</p>
        </div>

        {/* Sân khấu nghe lại - thanh trượt + nút tua ±3 giây, không còn vạch trang trí */}
        <div className="bg-[#F7F5EF] border border-[#E5E2D8] rounded-2xl px-5 sm:px-7 py-5 space-y-2.5">
          <div
            ref={trackRef}
            onClick={seekToEvent}
            className="relative h-2 rounded-full bg-[#E5E2D8] cursor-pointer"
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${playedFraction * 100}%`, background: ACCENT }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 shadow-[0_1px_3px_rgba(16,17,20,0.2)]"
              style={{ left: `calc(${playedFraction * 100}% - 7px)`, borderColor: ACCENT }}
            />
          </div>

          <div className="flex justify-between font-mono text-[12px] text-[#6E7078] font-semibold !mt-3">
            <span className="text-[#16171C]">{formatTime(currentTime)}</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>

          {/* Play/pause chính giữa, kèm 2 nút tua lùi/tới 3 giây - to hơn cho dễ bấm/dễ nhìn */}
          <div className="flex items-center justify-center gap-6 !mt-3.5">
            <button
              onClick={() => seekBy(-3)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-[#6E7078] hover:text-[#16171C] hover:bg-[#E9E6DA] transition-all"
              title="Lùi 3 giây"
            >
              <RotateCcw className="w-6 h-6" strokeWidth={1.75} />
              <span className="absolute font-mono text-[9px] font-bold mt-[1px]">3</span>
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_22px_rgba(255,75,46,0.28)] hover:scale-105 active:scale-95 transition-transform"
              style={{ background: ACCENT }}
            >
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>

            <button
              onClick={() => seekBy(3)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-[#6E7078] hover:text-[#16171C] hover:bg-[#E9E6DA] transition-all"
              title="Tới 3 giây"
            >
              <RotateCw className="w-6 h-6" strokeWidth={1.75} />
              <span className="absolute font-mono text-[9px] font-bold mt-[1px]">3</span>
            </button>
          </div>
        </div>

        <div className="border-t border-[#E5E2D8] pt-6 text-center space-y-4">
          <p className="text-[15px] font-bold text-[#16171C]">Bạn có hài lòng với bản ghi âm này không?</p>
          <div className="flex flex-col sm:flex-row-reverse items-center justify-center gap-3">
            <button
              onClick={() => navigate('/submit-task')}
              className="min-w-[150px] px-8 py-3.5 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-[0_10px_24px_rgba(255,75,46,0.25)]"
              style={{ background: ACCENT }}
            >
              <Check className="w-4 h-4" /> Lưu
            </button>
            <button
              onClick={() => navigate('/record-speech')}
              className="min-w-[150px] py-3.5 px-8 bg-white border border-[#E5E2D8] text-[#6E7078] hover:text-[#16171C] rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_10px_rgba(85,86,91,0.15)] transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Ghi âm lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}