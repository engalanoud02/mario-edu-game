import React, { useEffect, useState } from 'react';
import { CheckCircle2, HelpCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';
import { ChoiceIndex, Question } from '../types/game';

interface QuizModalProps {
  questionIndex: number;
  question: Question;
  onSuccessResume: (questionIndex: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  questionIndex,
  question,
  onSuccessResume,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<ChoiceIndex | null>(null);
  const [status, setStatus] = useState<'ASKING' | 'WRONG' | 'CORRECT'>('ASKING');
  const [canEnterConfirm, setCanEnterConfirm] = useState(false);

  const handleSelect = (idx: ChoiceIndex) => {
    if (status === 'CORRECT') return;
    setSelectedChoice(idx);

    if (idx === question.correctIndex) {
      setStatus('CORRECT');
      retroAudio.playCorrect();
      // Brief guard so a held Space jump doesn't auto-close celebration
      setTimeout(() => setCanEnterConfirm(true), 350);
    } else {
      setStatus('WRONG');
      retroAudio.playWrong();
    }
  };

  const handleRetry = () => {
    setSelectedChoice(null);
    setStatus('ASKING');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (status === 'CORRECT' && canEnterConfirm && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        onSuccessResume(questionIndex);
        return;
      }
      if (status === 'WRONG' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleRetry();
        return;
      }
      if (status !== 'CORRECT') {
        if (e.key === '1') handleSelect(0);
        if (e.key === '2') handleSelect(1);
        if (e.key === '3') handleSelect(2);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-question-heading"
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border-2 border-amber-400 text-white shadow-2xl overflow-hidden"
      >
        {/* Fixed Compact Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-400 text-slate-950">
          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle className="w-5 h-5 stroke-[2.5] shrink-0" />
            <span className="text-base sm:text-lg font-black tabular-nums truncate">
              صندوق الاستفهام {questionIndex + 1} من 5
            </span>
          </div>
          <span className="text-xs font-extrabold text-amber-950 whitespace-nowrap shrink-0">
            مفاتيح (1 · 2 · 3)
          </span>
        </div>

        {/* Scrollable Middle Area (allows long questions to scroll without clipping buttons) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-3">
          <h2
            id="quiz-question-heading"
            className="text-lg sm:text-xl font-black text-white leading-snug break-words"
          >
            {question.text}
          </h2>

          {question.codeSnippet && (
            <pre
              dir="ltr"
              className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono-code text-xs sm:text-sm overflow-x-auto leading-snug"
            >
              {question.codeSnippet}
            </pre>
          )}

          {/* 3 Equal Vertical Choices with non-overlapping numbers */}
          <div className="grid grid-cols-1 gap-2.5 pt-0.5">
            {question.choices.map((choiceText, idx) => {
              const choiceIdx = idx as ChoiceIndex;
              const isSelected = selectedChoice === choiceIdx;
              const isCorrectChoice = status === 'CORRECT' && isSelected;
              const isWrongChoice = status === 'WRONG' && isSelected;

              let btnStyle =
                'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white';
              if (isCorrectChoice) {
                btnStyle =
                  'bg-emerald-500 border-emerald-300 text-slate-950';
              } else if (isWrongChoice) {
                btnStyle =
                  'bg-rose-900/90 border-rose-400 text-rose-100 animate-shake';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={status === 'CORRECT'}
                  onClick={() => handleSelect(choiceIdx)}
                  className={`w-full min-h-[48px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-right transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${btnStyle}`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm tabular-nums shrink-0 ${
                      isCorrectChoice
                        ? 'bg-slate-950/20 text-slate-950'
                        : isWrongChoice
                        ? 'bg-rose-950 text-rose-200'
                        : 'bg-slate-900 text-amber-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-sm sm:text-base font-bold leading-snug break-words">
                    {choiceText}
                  </span>
                  {isCorrectChoice && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  {isWrongChoice && <XCircle className="w-5 h-5 shrink-0 text-rose-300" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Bottom Feedback & Action Footer (never overlaps choices) */}
        <div className="shrink-0 px-4 py-3 sm:px-5 border-t border-slate-800 bg-slate-950/90">
          {status === 'ASKING' && (
            <div className="text-xs sm:text-sm font-bold text-slate-400 text-center">
              اضغط على الإجابة الصحيحة أو اختر الرقم المناسب من لوحة المفاتيح.
            </div>
          )}

          {status === 'WRONG' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-rose-300">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>إجابة غير صحيحة! حاول مرة أخرى.</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs sm:text-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          {status === 'CORRECT' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base text-emerald-300">
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <span>أحسنت! إجابة صحيحة (+500 نقطة)</span>
              </div>
              <button
                type="button"
                onClick={() => onSuccessResume(questionIndex)}
                className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm sm:text-base transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                متابعة المغامرة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
