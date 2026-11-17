import React from 'react';
import { BookOpen, Edit3, Heart, Play, Volume2, VolumeX } from 'lucide-react';
import { DifficultyMode } from '../types/game';

interface TitleScreenProps {
  customQuestionsCount: number;
  difficulty: DifficultyMode;
  onSelectDifficulty: (mode: DifficultyMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPlayPython: () => void;
  onPlayCustom: () => void;
  onOpenEditor: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  customQuestionsCount,
  difficulty,
  onSelectDifficulty,
  isMuted,
  onToggleMute,
  onPlayPython,
  onPlayCustom,
  onOpenEditor,
}) => {
  const hasReadyCustom = customQuestionsCount === 5;

  return (
    <div className="absolute inset-0 z-20 w-full h-full overflow-hidden flex flex-col justify-between px-4 sm:px-8 py-[clamp(0.65rem,1.8dvh,1.5rem)] bg-gradient-to-b from-slate-950/60 via-slate-950/35 to-slate-950/75">
      {/* Top Bar: Compact Sound Toggle */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <div className="text-xs sm:text-sm font-bold text-amber-200 tracking-wide whitespace-nowrap">
          مغامرة تعليمية تفاعلية
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800 transition-colors text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
          aria-label={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{isMuted ? 'الصوت مكتوم' : 'الصوت مفعل'}</span>
        </button>
      </div>

      {/* Main Content: Fluid Flexbox Stack fitting 100% inside 100dvh without scrolling */}
      <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto flex flex-col items-center justify-center text-center gap-[clamp(0.45rem,1.5dvh,1rem)]">
        {/* Hero Emblem + Title + Concise Description */}
        <div className="flex flex-col items-center">
          <div className="mb-[clamp(0.2rem,0.8dvh,0.5rem)]" aria-hidden="true">
            <svg
              viewBox="0 0 84 68"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[clamp(52px,7.5dvh,76px)] h-auto drop-shadow-[0_5px_0_rgba(15,23,42,0.7)]"
            >
              <rect x="4" y="14" width="32" height="32" rx="5" fill="#F59E0B" stroke="#78350F" strokeWidth="3" />
              <rect x="8" y="18" width="24" height="4" fill="#FDE047" />
              <text x="20" y="37" textAnchor="middle" fill="#FFFBEB" fontSize="19" fontWeight="900" fontFamily="Cairo, sans-serif">؟</text>
              <rect x="42" y="10" width="34" height="12" rx="6" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2.5" />
              <rect x="56" y="18" width="24" height="5" rx="2" fill="#B91C1C" />
              <rect x="55" y="13" width="8" height="5" rx="1" fill="#FACC15" />
              <rect x="44" y="22" width="28" height="16" rx="4" fill="#FDBA74" />
              <rect x="63" y="25" width="4" height="5" fill="#0F172A" />
              <rect x="58" y="31" width="14" height="4" rx="1" fill="#451A03" />
              <rect x="43" y="38" width="30" height="18" rx="3" fill="#1D4ED8" />
              <rect x="47" y="42" width="4" height="4" fill="#FACC15" />
              <rect x="63" y="42" width="4" height="4" fill="#FACC15" />
            </svg>
          </div>

          <h1
            className="text-[clamp(1.65rem,4.4dvh,3rem)] font-black text-white tracking-tight leading-[1.15] drop-shadow-[0_4px_0_rgba(15,23,42,0.85)]"
            style={{ textWrap: 'balance' }}
          >
            مغامرة البطل التعليمية
          </h1>
          <p className="mt-[clamp(0.25rem,0.8dvh,0.5rem)] text-[clamp(0.82rem,1.85dvh,1.05rem)] font-semibold text-slate-100 max-w-xl leading-snug drop-shadow">
            اقفز عبر المنصات، تخطَّ العقبات، واضرب صناديق الاستفهام الخمسة من الأسفل للإجابة عن الأسئلة والوصول إلى القلعة.
          </p>
        </div>

        {/* Compact Difficulty Selector: سهل / عادي */}
        <div className="flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900/95 border border-slate-700 shadow-md">
            <button
              type="button"
              onClick={() => onSelectDifficulty('easy')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap ${
                difficulty === 'easy'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${difficulty === 'easy' ? 'fill-slate-950' : ''}`} />
              <span>سهل (للمبتدئات)</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDifficulty('normal')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap ${
                difficulty === 'normal'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>عادي</span>
            </button>
          </div>
          <div className="text-[clamp(0.7rem,1.5dvh,0.82rem)] font-bold text-slate-200 drop-shadow">
            {difficulty === 'easy'
              ? '5 قلوب · حفر أقل ومنصات متقاربة · أعداء أبطأ · نقاط حفظ تلقائية'
              : '3 قلوب · التحدي الكلاسيكي السلس · نقاط حفظ تلقائية'}
          </div>
        </div>

        {/* Side-by-Side Teacher Cards in Lower Center */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl items-stretch">
          {/* Card 1: Play with Ready Python Questions */}
          <div className="flex flex-col justify-between text-right p-[clamp(0.75rem,1.9dvh,1.25rem)] rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 border-2 border-amber-200 shadow-[0_5px_0_#92400E]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950/15 text-slate-950 shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-amber-950 whitespace-nowrap">
                  5 أسئلة · Python
                </span>
              </div>
              <div className="text-[clamp(0.98rem,2.3dvh,1.3rem)] font-black leading-tight mb-1">
                العب بالأسئلة الجاهزة
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900/85 leading-snug mb-3">
                ابدأ المغامرة فورًا بخمسة أسئلة مبسطة في أساسيات لغة بايثون.
              </p>
            </div>
            <button
              type="button"
              onClick={onPlayPython}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 font-black text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>ابدأ اللعب الآن</span>
            </button>
          </div>

          {/* Card 2: Add / Edit Custom Questions */}
          <div className="flex flex-col justify-between text-right p-[clamp(0.75rem,1.9dvh,1.25rem)] rounded-2xl bg-slate-900/95 text-white border-2 border-slate-700 shadow-[0_5px_0_#0F172A]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 tabular-nums whitespace-nowrap">
                  {customQuestionsCount} / 5 محفوظة
                </span>
              </div>
              <div className="text-[clamp(0.98rem,2.3dvh,1.3rem)] font-black leading-tight mb-1">
                أضيفي أسئلتك
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-snug mb-3">
                اكتبي خمسة أسئلة من أي مادة دراسية واحفظيها في المتصفح.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasReadyCustom ? (
                <>
                  <button
                    type="button"
                    onClick={onPlayCustom}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>ابدأ بأسئلتك</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEditor}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onOpenEditor}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>إضافة وإدارة الأسئلة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Concise Bottom Control Hint */}
      <div className="shrink-0 text-center text-[clamp(0.7rem,1.45dvh,0.85rem)] font-bold text-slate-200 tracking-wide truncate">
        الأسهم / WASD للحركة · مسافة للقفز · Shift للجري · Esc إيقاف · M كتم الصوت
      </div>
    </div>
  );
};
