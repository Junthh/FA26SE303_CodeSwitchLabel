import React, { useState, useRef, useEffect } from 'react';
import TaskStepper from '../../../components/TaskStepper/TaskStepper';
import { Play, Pause, RotateCcw, RotateCw, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import WaveSurfer from 'wavesurfer.js';
import {
  SPEAKER_ACCENT as ACCENT,
  AUDIO_PRIMARY, AUDIO_WAVE_IDLE, AUDIO_WAVE_PROGRESS, AUDIO_SHADOW,
  TEXT_HEADING, TEXT_BODY,
  BORDER_LIGHT, SURFACE_MUTED,
} from '../../../constants/theme';

export default function ReviewRecording({ audioUrl: propUrl }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Ưu tiên: navigate state (blob từ ghi âm thật) > prop > fallback demo
  const src = location.state?.audioUrl || propUrl || '/demo-recording.wav';

  const waveContainerRef = useRef(null);
  const waveSurferRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!waveContainerRef.current) return;

    const ws = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: AUDIO_WAVE_IDLE,
      progressColor: AUDIO_WAVE_PROGRESS,
      cursorColor: AUDIO_PRIMARY,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: 64,
      normalize: true,
      backend: 'WebAudio',
    });

    ws.load(src);

    ws.on('ready', () => setDuration(ws.getDuration()));
    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('seeking', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    waveSurferRef.current = ws;

    return () => ws.destroy();
  }, [src]);

  const togglePlay = () => {
    if (!waveSurferRef.current) return;
    waveSurferRef.current.playPause();
  };

  const seekBy = (delta) => {
    const ws = waveSurferRef.current;
    if (!ws || !duration) return;
    const newTime = Math.min(duration, Math.max(0, ws.getCurrentTime() + delta));
    ws.seekTo(newTime / duration);
  };

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.floor(Math.abs(s) % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 pb-6 text-left max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={3} />

      <div
        className="rounded-[24px] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-6 sm:p-8 space-y-6"
        style={{ background: '#FFFFFF', border: `1px solid ${BORDER_LIGHT}` }}
      >
        <div>
          <h3 className="font-bold text-[15px]" style={{ color: TEXT_HEADING }}>Nghe lại bản ghi của bạn</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_BODY }}>Đảm bảo giọng đọc rõ ràng, đúng câu trước khi nộp bài.</p>
        </div>

        {/* WaveSurfer waveform */}
        <div
          className="rounded-2xl px-5 sm:px-7 py-5 space-y-2.5"
          style={{ background: SURFACE_MUTED, border: `1px solid ${BORDER_LIGHT}` }}
        >
          <div ref={waveContainerRef} className="w-full" />

          <div className="flex justify-between font-mono text-[12px] font-semibold !mt-3">
            <span style={{ color: TEXT_HEADING }}>{formatTime(currentTime)}</span>
            <span style={{ color: TEXT_BODY }}>-{formatTime(duration - currentTime)}</span>
          </div>

          <div className="flex items-center justify-center gap-6 !mt-3.5">
            <button
              onClick={() => seekBy(-3)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full transition-all"
              style={{ color: TEXT_BODY }}
              title="Lùi 3 giây"
            >
              <RotateCcw className="w-6 h-6" strokeWidth={1.75} />
              <span className="absolute font-mono text-[9px] font-bold mt-[1px]">3</span>
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
              style={{ background: AUDIO_PRIMARY, boxShadow: `0 10px 22px ${AUDIO_SHADOW}` }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={() => seekBy(3)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full transition-all"
              style={{ color: TEXT_BODY }}
              title="Tới 3 giây"
            >
              <RotateCw className="w-6 h-6" strokeWidth={1.75} />
              <span className="absolute font-mono text-[9px] font-bold mt-[1px]">3</span>
            </button>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER_LIGHT}` }} className="pt-6 text-center space-y-4">
          <p className="text-[15px] font-bold" style={{ color: TEXT_HEADING }}>
            Bạn có hài lòng với bản ghi âm này không?
          </p>
          <div className="flex flex-col sm:flex-row-reverse items-center justify-center gap-3">
            <button
              onClick={() => navigate('/submit-task')}
              className="min-w-[150px] px-8 py-3.5 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all"
              style={{ background: ACCENT, boxShadow: `0 10px 24px ${ACCENT}40` }}
            >
              <Check className="w-4 h-4" /> Lưu
            </button>
            <button
              onClick={() => navigate('/record-speech')}
              className="min-w-[150px] py-3.5 px-8 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${BORDER_LIGHT}`,
                color: TEXT_BODY,
                boxShadow: '0 4px 10px rgba(85,86,91,0.15)',
              }}
            >
              <RotateCcw className="w-4 h-4" /> Ghi âm lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}