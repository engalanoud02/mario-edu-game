import React from 'react';
import { Check, Compass, Heart, Pause, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../types/game';

interface HudOverlayProps {
  hud: HudSnapshot;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onWarpToQuestion: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  isMuted,
  onToggleMute,
  onPause,
  onWarpToQuestion,
}) => {
  const answeredSet = new Set(hud.answeredQuestions);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
      {/* Top Perimeter Status Clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Start Cluster: Score, Coins, Zone & 5 Question Boxes */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/85 border border-slate-700/90 text-white shadow-lg">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400">النقاط</span>
            <span className="text-lg font-black tabular-nums text-amber-300 leading-none">
              {String(hud.score).padStart(5, '0')}
            </span>
          </div>

          <span className="text-slate-700 font-bold" aria-hidden="true">|</span>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400">العملات</span>
            <span className="text-lg font-black tabular-nums text-yellow-300 leading-none">
              {hud.coins}
            </span>
          </div>

          <span className="text-slate-700 font-bold" aria-hidden="true">|</span>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400">المنطقة</span>
            <span className="text-sm font-extrabold text-sky-200 leading-tight">
              {hud.zoneName}
            </span>
          </div>

          <span className="text-slate-700 font-bold" aria-hidden="true">|</span>

          {/* 5 Question Block Progress Boxes */}
          <div className="flex items-center gap-1.5" aria-label={`الأسئلة المجابة ${hud.answeredQuestions.length} من 5`}>
            {[0, 1, 2, 3, 4].map((qIdx) => {
              const done = answeredSet.has(qIdx);
              return (
                <div
                  key={qIdx}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-black border-2 transition-colors tabular-nums ${
                    done
                      ? 'bg-emerald-500 border-emerald-300 text-slate-950'
                      : 'bg-amber-500 border-amber-300 text-slate-950'
                  }`}
                  title={done ? `السؤال ${qIdx + 1}: مكتمل` : `السؤال ${qIdx + 1}: غير مجاب`}
                >
                  {done ? <Check className="w-4 h-4 stroke-[3]" /> : '؟'}
                </div>
              );
            })}
          </div>
        </div>

        {/* End Cluster: Lives, Timer, Mute & Pause Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/85 border border-slate-700/90 text-white shadow-lg">
          {/* Hearts */}
          <div className="flex items-center gap-1 pl-2" aria-label={`الأرواح المتبقية ${hud.lives}`}>
            {Array.from({ length: hud.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < hud.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          <span className="text-slate-700 font-bold" aria-hidden="true">|</span>

          <div className="text-sm font-extrabold tabular-nums text-slate-200 px-1">
            {formatTime(hud.elapsedSeconds)}
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            aria-label={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            title="كتم / تفعيل الصوت (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            aria-label="إيقاف مؤقت"
            title="إيقاف مؤقت (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Castle Hint Banner (only shown if player reaches castle before answering all 5 questions) */}
      {hud.castleHint && (
        <div className="pointer-events-auto mx-auto mb-2 px-5 py-3 rounded-xl bg-slate-950/95 border-2 border-amber-400 text-white shadow-xl flex flex-wrap items-center justify-center gap-4">
          <span className="text-sm sm:text-base font-extrabold text-amber-300">
            {hud.castleHint}
          </span>
          <button
            type="button"
            onClick={onWarpToQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>الانتقال لأقرب سؤال (R)</span>
          </button>
        </div>
      )}
    </div>
  );
};
