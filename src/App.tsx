import { useCallback, useState } from 'react';
import { retroAudio } from './audio/retroAudio';
import { GameOverModal, PauseModal, VictoryModal } from './components/GameModals';
import { HudOverlay } from './components/HudOverlay';
import { QuestionManagerModal } from './components/QuestionManagerModal';
import { QuizModal } from './components/QuizModal';
import { TitleScreen } from './components/TitleScreen';
import {
  DEFAULT_PYTHON_QUESTIONS,
  loadCustomQuestions,
  saveCustomQuestions,
  saveQuestionMode,
} from './data/defaultQuestions';
import { GameCanvas } from './game/GameCanvas';
import { LEVEL_ZONES } from './game/levelData';
import { DifficultyMode, GameState, HudSnapshot, Question, QuestionMode } from './types/game';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  coins: 0,
  lives: 5,
  maxLives: 5,
  elapsedSeconds: 0,
  answeredQuestions: [],
  totalQuestions: 5,
  zoneName: LEVEL_ZONES[0].name,
  castleHint: null,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('easy');
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => loadCustomQuestions());
  const [activeMode, setActiveMode] = useState<QuestionMode>('python');
  const [runId, setRunId] = useState<number>(1);
  const [continueTrigger, setContinueTrigger] = useState<number>(0);
  const [warpTrigger, setWarpTrigger] = useState<number>(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [lastCorrectQuestionId, setLastCorrectQuestionId] = useState<number | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [finalStats, setFinalStats] = useState<HudSnapshot>(INITIAL_HUD);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const activeQuestions =
    activeMode === 'custom' && customQuestions.length === 5
      ? customQuestions
      : DEFAULT_PYTHON_QUESTIONS;

  const handleToggleMute = useCallback(() => {
    const nextMuted = retroAudio.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handlePlayPython = useCallback(() => {
    retroAudio.unlock();
    setActiveMode('python');
    saveQuestionMode('python');
    setActiveQuestionIndex(null);
    setLastCorrectQuestionId(null);
    setRunId((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handlePlayCustom = useCallback(() => {
    if (customQuestions.length !== 5) {
      setGameState('QUESTION_EDITOR');
      return;
    }
    retroAudio.unlock();
    setActiveMode('custom');
    saveQuestionMode('custom');
    setActiveQuestionIndex(null);
    setLastCorrectQuestionId(null);
    setRunId((n) => n + 1);
    setGameState('PLAYING');
  }, [customQuestions.length]);

  const handleSaveCustomQuestions = useCallback((next: Question[]) => {
    setCustomQuestions(next);
    saveCustomQuestions(next);
  }, []);

  const handleSaveAndPlayCustom = useCallback((next: Question[]) => {
    setCustomQuestions(next);
    saveCustomQuestions(next);
    if (next.length === 5) {
      retroAudio.unlock();
      setActiveMode('custom');
      saveQuestionMode('custom');
      setActiveQuestionIndex(null);
      setLastCorrectQuestionId(null);
      setRunId((n) => n + 1);
      setGameState('PLAYING');
    }
  }, []);

  const handleTriggerQuestion = useCallback((qIdx: number) => {
    setActiveQuestionIndex(qIdx);
    setGameState('QUIZ_MODAL');
  }, []);

  const handleQuestionSuccessResume = useCallback((qIdx: number) => {
    setLastCorrectQuestionId(qIdx);
    setActiveQuestionIndex(null);
    setGameState('PLAYING');
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleRestartFull = useCallback(() => {
    retroAudio.unlock();
    setActiveQuestionIndex(null);
    setLastCorrectQuestionId(null);
    setRunId((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleContinueCheckpoint = useCallback(() => {
    retroAudio.unlock();
    setContinueTrigger((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleStartCelebration = useCallback(() => {
    setGameState('CASTLE_CELEBRATION');
  }, []);

  const handleVictory = useCallback((stats: HudSnapshot) => {
    setFinalStats(stats);
    setGameState('VICTORY');
  }, []);

  const handleGameOver = useCallback((stats: HudSnapshot) => {
    setFinalStats(stats);
    setGameState('GAME_OVER');
  }, []);

  const handleMainMenu = useCallback(() => {
    setActiveQuestionIndex(null);
    setLastCorrectQuestionId(null);
    setGameState('TITLE_MENU');
  }, []);

  const currentQuestion =
    activeQuestionIndex !== null
      ? activeQuestions[activeQuestionIndex] ?? DEFAULT_PYTHON_QUESTIONS[0]
      : null;

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-[#0b1220] select-none">
      {/* Isolated Full-Viewport 60fps Game Canvas */}
      <div className="w-full h-full">
        <GameCanvas
          gameState={gameState}
          difficulty={difficulty}
          runId={runId}
          continueFromCheckpointTrigger={continueTrigger}
          warpToNearestQuestionTrigger={warpTrigger}
          lastCorrectQuestionId={lastCorrectQuestionId}
          onTriggerQuestion={handleTriggerQuestion}
          onHudUpdate={setHud}
          onStartCelebration={handleStartCelebration}
          onVictory={handleVictory}
          onGameOver={handleGameOver}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
        />
      </div>

      {/* Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          customQuestionsCount={customQuestions.length}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPlayPython={handlePlayPython}
          onPlayCustom={handlePlayCustom}
          onOpenEditor={() => setGameState('QUESTION_EDITOR')}
        />
      )}

      {/* Teacher Custom Question Manager */}
      {gameState === 'QUESTION_EDITOR' && (
        <QuestionManagerModal
          initialQuestions={customQuestions}
          onSaveQuestions={handleSaveCustomQuestions}
          onSaveAndPlay={handleSaveAndPlayCustom}
          onClose={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* Active Gameplay HUD */}
      {(gameState === 'PLAYING' ||
        gameState === 'PAUSED' ||
        gameState === 'QUIZ_MODAL' ||
        gameState === 'CASTLE_CELEBRATION') && (
        <HudOverlay
          hud={hud}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
          onWarpToQuestion={() => setWarpTrigger((n) => n + 1)}
        />
      )}

      {/* Question Modal triggered by hitting a ? block from below */}
      {gameState === 'QUIZ_MODAL' && activeQuestionIndex !== null && currentQuestion && (
        <QuizModal
          key={`${runId}-${activeQuestionIndex}`}
          questionIndex={activeQuestionIndex}
          question={currentQuestion}
          onSuccessResume={handleQuestionSuccessResume}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => setGameState('PLAYING')}
          onRestart={handleRestartFull}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Victory Screen */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          stats={finalStats}
          onPlayAgain={handleRestartFull}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={finalStats}
          onContinueCheckpoint={handleContinueCheckpoint}
          onRestartFull={handleRestartFull}
          onMainMenu={handleMainMenu}
        />
      )}
    </main>
  );
}
