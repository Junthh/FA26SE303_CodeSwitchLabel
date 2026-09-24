import React, { useRef } from 'react';
import TaskStepper from '../../../components/TaskStepper/TaskStepper';
import { Play, Pause, RotateCcw, RotateCw, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useWaveSurfer from '../../../hooks/useWaveSurfer';
import { formatTime } from '../../../utils/audio';
import {
  SPEAKER_ACCENT as ACCENT,
  AUDIO_PRIMARY, AUDIO_SHADOW,
  TEXT_HEADING, TEXT_BODY,
  BORDER_LIGHT, SURFACE_MUTED,
} from '../../../constants/theme';

export default function ReviewRecording({ audioUrl: propUrl }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Ưu tiên: navigate state (blob từ ghi âm thật) > prop > fallback demo
  const src = location.state?.audioUrl || propUrl || '/demo-recording.wav';

  const waveContainerRef = useRef(null);
  const { playing: isPlaying, currentTime, duration, playPause: togglePlay, seekBy } = useWaveSurfer(waveContainerRef, src, {
    cursorColor: AUDIO_PRIMARY,
    cursorWidth: 2,
    barWidth: 2,
    height: 64,
    backend: 'WebAudio',
  });

  return (
    <div className="space-y-5 pb-6 text-left max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={3} />

      <div
        className="rounded-[24px] shadow-[0_1px_3px_rgba(16,17,20,0.04)] p-6 sm:p-8 space-y-6"
        style={{ background: '#FFFFFF', border: `1px solid ${BORDER_LIGHT}` }}
      >
        <div>
          <h3 className="font-bold text-[15px]" style={{ color: TEXT_HEADING }}>Nghe lại bản ghi của bạn</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_BODY }}>Đảm bảo giọng đọc rõ ràng, đúng câu trước khi gửi.</p>
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