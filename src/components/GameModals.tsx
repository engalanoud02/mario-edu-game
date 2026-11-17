import React from 'react';
import { Home, Play, RotateCcw, Trophy } from 'lucide-react';
import { HudSnapshot } from '../types/game';

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/75">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-7 text-center text-white shadow-2xl space-y-6">
        <h2 className="text-3xl font-black text-amber-300">اللعبة متوقفة مؤقتًا</h2>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base transition-colors cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>متابعة المغامرة</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-base transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>إعادة المرحلة من البداية</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-base transition-colors cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>العودة إلى القائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: HudSnapshot;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-amber-400 p-8 text-center text-white shadow-2xl space-y-6">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
          <Trophy className="w-11 h-11" />
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-amber-300">
            مبارك الفوز والوصول إلى القلعة!
          </h2>
          <p className="mt-2 text-base font-bold text-slate-300">
            أجبت عن جميع الأسئلة الخمسة بنجاح وأكملت المغامرة الكاملة.
          </p>
        </div>

        {/* Clean Tabular Summary Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-400">مجموع النقاط</div>
            <div className="text-2xl font-black text-amber-300 tabular-nums mt-1">
              {stats.score}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">العملات الذهبية</div>
            <div className="text-2xl font-black text-yellow-300 tabular-nums mt-1">
              {stats.coins}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">الزمن المستغرق</div>
            <div className="text-2xl font-black text-emerald-300 tabular-nums mt-1">
              {formatTime(stats.elapsedSeconds)}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-5 h-5" />
            <span>العب مرة أخرى</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-5 h-5" />
            <span>القائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: HudSnapshot;
  onContinueCheckpoint: () => void;
  onRestartFull: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onContinueCheckpoint,
  onRestartFull,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-rose-500/80 p-7 text-center text-white shadow-2xl space-y-6">
        <div>
          <h2 className="text-3xl font-black text-rose-400">انتهت المحاولات!</h2>
          <p className="mt-2 text-sm sm:text-base font-semibold text-slate-300">
            تمكنت من الإجابة عن {stats.answeredQuestions.length} من 5 أسئلة حتى الآن.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onContinueCheckpoint}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base transition-colors cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>المتابعة من آخر نقطة حفظ</span>
          </button>
          <button
            type="button"
            onClick={onRestartFull}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-base transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>إعادة المرحلة من البداية</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-base transition-colors cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>القائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
