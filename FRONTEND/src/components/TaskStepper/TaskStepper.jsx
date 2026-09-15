import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck2, Mic, Headphones, UploadCloud, Check } from 'lucide-react';
import { SPEAKER_ACCENT as ACCENT } from '../../constants/theme';

const STEPS = [
  { number: 1, label: 'Duyệt văn bản', path: '/review-text', icon: FileCheck2 },
  { number: 2, label: 'Ghi âm', path: '/record-speech', icon: Mic },
  { number: 3, label: 'Nghe lại', path: '/review-recording', icon: Headphones },
  { number: 4, label: 'Nộp bài', path: '/submit-task', icon: UploadCloud },
];

export default function TaskStepper({ currentStep = 2 }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start mb-8 font-sans select-none">
      {STEPS.map((step, idx) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isLocked = step.number > currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.number}>
            <button
              onClick={() => !isLocked && navigate(step.path)}
              disabled={isLocked}
              className={`flex flex-col items-center gap-2.5 shrink-0 ${
                isLocked ? 'cursor-not-allowed' : 'cursor-pointer group'
              }`}
            >
              <span className="relative w-12 h-12 flex items-center justify-center">
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full animate-pulse" style={{ background: `${ACCENT}33` }} />
                )}
                <span
                  className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: isCurrent ? ACCENT : isCompleted ? '#16171C' : '#FFFFFF',
                    border: isLocked ? '1.5px solid #E5E2D8' : 'none',
                    boxShadow: isCurrent ? `0 6px 16px ${ACCENT}59` : 'none',
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-[18px] h-[18px] text-white" />
                  ) : (
                    <Icon className="w-[18px] h-[18px]" style={{ color: isCurrent ? '#FFFFFF' : '#C2BFB4' }} />
                  )}
                </span>
              </span>
              <span
                className="text-[12px] font-bold text-center leading-tight whitespace-nowrap"
                style={{ color: isCurrent ? '#16171C' : isCompleted ? '#6E7078' : '#B7B4A9' }}
              >
                {step.label}
              </span>
            </button>

            {idx < STEPS.length - 1 && (
              <span
                className="flex-1 h-[3px] rounded-full mt-[23px] mx-2 transition-colors"
                style={{ background: isCompleted ? '#16171C' : '#E5E2D8' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}