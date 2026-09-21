import React, { useState, useRef, useEffect, useCallback } from 'react';
import TaskStepper from '../../../components/TaskStepper/TaskStepper';
import { Mic, RotateCcw, Play, Pause, Check, ArrowRight, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaveSurfer from 'wavesurfer.js';
import { parseCodeSwitch } from '../../../components/CodeSwitchText/CodeSwitchText';
import {
  SPEAKER_ACCENT as ACCENT,
  AUDIO_PRIMARY,
  AUDIO_WAVE_IDLE, AUDIO_WAVE_PROGRESS, AUDIO_SHADOW,
  TEXT_HEADING, TEXT_BODY, TEXT_FAINT,
  BORDER_LIGHT, SURFACE_MUTED,
} from '../../../constants/theme';

const HISTORY_LEN = 60;
const WAVEFORM_INTERVAL_MS = 80;
// Sóng phẳng tĩnh hiển thị khi chưa ghi âm - để card giữ đúng chiều cao như lúc đang ghi/đã ghi
const IDLE_WAVE = Array.from({ length: HISTORY_LEN }, (_, i) => 6 + 3 * Math.sin(i / 4));

// TODO: thay bằng dữ liệu thật từ API
const SENTENCE_CS = '[vi]Em nên [en]scan [vi]tài liệu này rồi gửi qua [en]email [vi]cho tôi.';
const SENTENCE_VI = 'Em nên quét tài liệu này rồi gửi qua thư điện tử cho tôi.';

function stripLangTags(text) {
  return text.replace(/\[(vi|en)\]/g, '').trim();
}

/**
 * 1 card = 1 câu cần ghi âm, độc lập hoàn toàn với card kia.
 * Người dùng có thể ghi câu nào trước cũng được — không ép thứ tự.
 * 3 trạng thái nội bộ: idle (chưa ghi) -> recording (đang ghi, sóng realtime)
 * -> recorded (đã ghi, chuyển sang WaveSurfer để nghe lại + có thể ghi lại).
 */
function SentenceCard({ id, label, contentNode, recordingCardId, setRecordingCardId, onRecordedChange }) {
  const [status, setStatus] = useState('idle'); // idle | recording | recorded
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveHistory, setWaveHistory] = useState(Array(HISTORY_LEN).fill(3));
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const waveIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const waveContainerRef = useRef(null);
  const waveSurferRef = useRef(null);

  const isThisRecording = recordingCardId === id;
  const canStart = recordingCardId === null; // chỉ 1 card được ghi cùng lúc

  const cleanupRecordingResources = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    if (!canStart) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setRecordingCardId(id);
      setStatus('recording');
      setRecordingTime(0);
      setWaveHistory(Array(HISTORY_LEN).fill(3));

      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);

      // RMS trên time-domain data cho biên độ tự nhiên hơn (giống hình dạng giọng nói thật)
      // thay vì lấy trung bình cộng phổ tần số (cho ra sóng đều đều, ít biến thiên).
      const dataArray = new Uint8Array(analyser.fftSize);
      waveIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128; // -1..1
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length); // 0..1
        // Scale phi tuyến (căn bậc) để phần nhỏ tiếng vẫn nhích lên chút,
        // còn âm tiết to thì nhô cao rõ rệt -> tạo hình dạng lớn nhỏ tự nhiên.
        const level = Math.max(4, Math.min(100, Math.pow(rms, 0.55) * 130));
        setWaveHistory((prev) => [...prev.slice(1), level]);
      }, WAVEFORM_INTERVAL_MS);
    } catch (err) {
      alert('Không thể kết nối Microphone! Vui lòng cho phép trình duyệt truy cập Micro.');
      console.error(err);
    }
  };

  const stopAndFinish = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        cleanupRecordingResources();
        setRecordingCardId(null);
        setStatus('recorded');
        setAudioUrl(url);
        onRecordedChange(id, true, url);
      };
      recorder.stop();
    }
  };

  const reRecord = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setStatus('idle');
    onRecordedChange(id, false, null);
  };

  // Khởi tạo WaveSurfer khi đã có bản ghi
  useEffect(() => {
    if (status !== 'recorded' || !audioUrl || !waveContainerRef.current) return;

    const ws = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: AUDIO_WAVE_IDLE,
      progressColor: AUDIO_WAVE_PROGRESS,
      cursorColor: AUDIO_PRIMARY,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: 44,
      normalize: true,
      backend: 'WebAudio',
    });
    ws.load(audioUrl);
    ws.on('ready', () => setDuration(ws.getDuration()));
    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('seeking', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    waveSurferRef.current = ws;

    return () => ws.destroy();
  }, [status, audioUrl]);

  useEffect(() => () => cleanupRecordingResources(), []);

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.floor(Math.abs(s) % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        border: status === 'recording' ? `1.5px solid ${AUDIO_PRIMARY}` : `1px solid ${BORDER_LIGHT}`,
        boxShadow: '0 1px 3px rgba(16,17,20,0.04)',
      }}
    >
      {/* Header trạng thái */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: status === 'idle' ? AUDIO_PRIMARY : status === 'recording' ? AUDIO_PRIMARY : '#1DB954' }}
        />
        <span className="text-[11.5px] font-bold" style={{ color: status === 'recorded' ? '#1DB954' : AUDIO_PRIMARY }}>
          {label}
          {status === 'idle' && ' · chưa ghi'}
          {status === 'recording' && ' · đang ghi'}
          {status === 'recorded' && ` · đã ghi ${formatTime(duration)}`}
        </span>
      </div>

      {/* Nội dung câu */}
      <p className="text-lg font-bold leading-relaxed mb-4" style={{ color: TEXT_HEADING }}>
        {contentNode}
      </p>

      {/* Cả 3 trạng thái dùng chung 1 khung: waveform row -> time row -> button row.
          Giữ đúng cùng chiều cao ở mỗi hàng để card không đổi kích thước khi chuyển trạng thái -> tránh giật layout/scroll. */}
      <div className="space-y-2.5">
        {/* Waveform row - h-11 cố định cho cả 3 trạng thái */}
        <div
          className="relative w-full h-11 rounded-lg overflow-hidden flex items-center px-2"
          style={{ background: SURFACE_MUTED }}
        >
          {status === 'recorded' ? (
            <div ref={waveContainerRef} className="w-full" />
          ) : (
            <div className="w-full h-full flex items-center gap-[2px]">
              {(status === 'recording' ? waveHistory : IDLE_WAVE).map((level, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[2px] rounded-full transition-[height] duration-75"
                  style={{
                    height: `${level}%`,
                    background: status === 'recording' ? AUDIO_WAVE_PROGRESS : AUDIO_WAVE_IDLE,
                    // Đậm nhạt theo biên độ (tiếng to -> đậm, tiếng nhỏ -> nhạt) thay vì theo vị trí cột
                    opacity: status === 'recording' ? 0.3 + 0.7 * (level / 100) : 0.6,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Time row - luôn cùng 1 hàng text nhỏ, chỉ đổi nội dung */}
        <div className="flex justify-between font-mono text-[11px] font-semibold">
          {status === 'idle' && (
            <>
              <span style={{ color: TEXT_FAINT }}>0:00</span>
              <span style={{ color: TEXT_FAINT }}>--:--</span>
            </>
          )}
          {status === 'recording' && (
            <>
              <span style={{ color: AUDIO_PRIMARY }}>{formatTime(recordingTime)}</span>
              <span className="flex items-center gap-1.5" style={{ color: AUDIO_PRIMARY }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: AUDIO_PRIMARY }} /> Đang ghi
              </span>
            </>
          )}
          {status === 'recorded' && (
            <>
              <span style={{ color: TEXT_HEADING }}>{formatTime(currentTime)}</span>
              <span style={{ color: TEXT_BODY }}>-{formatTime(duration - currentTime)}</span>
            </>
          )}
        </div>

        {/* Button row - luôn cao h-11, chỉ đổi nội dung/hành vi */}
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <button
              onClick={startRecording}
              disabled={!canStart}
              className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 text-[13px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: AUDIO_PRIMARY, boxShadow: canStart ? `0 6px 16px ${AUDIO_SHADOW}` : 'none' }}
            >
              <Mic className="w-4 h-4" /> Ghi âm câu này
            </button>
          )}
          {status === 'recording' && (
            <button
              onClick={stopAndFinish}
              className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 text-[13px] font-bold text-white transition-all"
              style={{ background: AUDIO_PRIMARY, boxShadow: `0 6px 16px ${AUDIO_SHADOW}` }}
            >
              <span className="w-3 h-3 rounded-sm bg-white" /> Dừng ghi
            </button>
          )}
          {status === 'recorded' && (
            <>
              <button
                onClick={() => waveSurferRef.current?.playPause()}
                className="flex-1 h-11 rounded-lg flex items-center justify-center gap-2 text-[13px] font-bold text-white transition-all"
                style={{ background: AUDIO_PRIMARY }}
              >
                {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                {isPlaying ? 'Tạm dừng' : 'Nghe lại'}
              </button>
              <button
                onClick={reRecord}
                className="w-11 h-11 rounded-lg flex items-center justify-center transition-all shrink-0"
                style={{ background: SURFACE_MUTED, border: `1px solid ${BORDER_LIGHT}`, color: TEXT_BODY }}
                title="Ghi âm lại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecordSpeech() {
  const navigate = useNavigate();
  const [csDone, setCsDone] = useState(false);
  const [viDone, setViDone] = useState(false);
  const [csUrl, setCsUrl] = useState(null);
  const [viUrl, setViUrl] = useState(null);
  const [recordingCardId, setRecordingCardId] = useState(null);

  const onRecordedChange = useCallback((id, done, url) => {
    if (id === 'cs') { setCsDone(done); setCsUrl(url); }
    if (id === 'vi') { setViDone(done); setViUrl(url); }
  }, []);

  const bothDone = csDone && viDone;
  const sentenceSegments = parseCodeSwitch(SENTENCE_CS);

  return (
    <div className="space-y-4 text-left pb-6 max-w-3xl mx-auto font-sans">
      <TaskStepper currentStep={2} />

      {/* 2 card độc lập */}
      <SentenceCard
        id="cs"
        label="Câu Việt-Anh"
        contentNode={sentenceSegments.map((seg, i) =>
          seg.lang === 'en' ? <span key={i} style={{ color: ACCENT }}>{seg.text}</span> : <span key={i}>{seg.text}</span>
        )}
        recordingCardId={recordingCardId}
        setRecordingCardId={setRecordingCardId}
        onRecordedChange={onRecordedChange}
      />
      <SentenceCard
        id="vi"
        label="Câu tiếng Việt"
        contentNode={stripLangTags(SENTENCE_VI)}
        recordingCardId={recordingCardId}
        setRecordingCardId={setRecordingCardId}
        onRecordedChange={onRecordedChange}
      />

      {/* Lưu ý */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center gap-x-5 gap-y-2"
        style={{ background: '#FFFFFF', border: `1px solid ${BORDER_LIGHT}`, boxShadow: '0 1px 3px rgba(16,17,20,0.04)' }}
      >
        <span className="text-[12.5px] font-bold flex items-center gap-1.5 shrink-0" style={{ color: TEXT_HEADING }}>
          <HelpCircle className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Lưu ý
        </span>
        <span className="text-[12.5px]" style={{ color: TEXT_BODY }}>Đọc tự nhiên như hội thoại</span>
        <span className="w-1 h-1 rounded-full" style={{ background: BORDER_LIGHT }} />
        <span className="text-[12.5px]" style={{ color: TEXT_BODY }}>Cách mic 15-20cm</span>
        <span className="w-1 h-1 rounded-full" style={{ background: BORDER_LIGHT }} />
        <span className="text-[12.5px]" style={{ color: TEXT_BODY }}>Không gian yên tĩnh</span>
      </div>

      {/* Nộp bài — sticky đáy khung cuộn, có nền mờ dần để không dính sát mép màn hình
          và luôn dễ bấm mà không cần cuộn hết trang. */}
      <div
        className="sticky bottom-0 left-0 right-0 pt-6 pb-5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ background: 'linear-gradient(to top, #F7F5EF 55%, rgba(247,245,239,0))' }}
      >
        <button
          onClick={() =>
            bothDone &&
            navigate('/submit-task', {
              state: {
                csAudioUrl: csUrl,
                viAudioUrl: viUrl,
                csTranscript: SENTENCE_CS,
                viTranscript: SENTENCE_VI,
              },
            })
          }
          disabled={!bothDone}
          className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
          style={{
            background: bothDone ? ACCENT : SURFACE_MUTED,
            color: bothDone ? '#FFFFFF' : TEXT_FAINT,
            boxShadow: bothDone ? `0 10px 24px ${ACCENT}40` : 'none',
          }}
        >
          <Check className="w-4 h-4" /> Nộp bài <ArrowRight className="w-4 h-4" />
        </button>
        {!bothDone && (
          <p className="text-[11.5px] text-center mt-2" style={{ color: TEXT_FAINT }}>
            Ghi xong cả 2 câu để nộp bài
          </p>
        )}
      </div>
    </div>
  );
}