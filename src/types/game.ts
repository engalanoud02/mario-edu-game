export type ChoiceIndex = 0 | 1 | 2;

export interface Question {
  id: string;
  text: string;
  codeSnippet?: string;
  choices: [string, string, string];
  correctIndex: ChoiceIndex;
}

export type QuestionMode = 'python' | 'custom';

export type DifficultyMode = 'easy' | 'normal';

export type GameState =
  | 'TITLE_MENU'
  | 'QUESTION_EDITOR'
  | 'PLAYING'
  | 'PAUSED'
  | 'QUIZ_MODAL'
  | 'CASTLE_CELEBRATION'
  | 'VICTORY'
  | 'GAME_OVER';

export interface HudSnapshot {
  score: number;
  coins: number;
  lives: number;
  maxLives: number;
  elapsedSeconds: number;
  answeredQuestions: number[];
  totalQuestions: number;
  zoneName: string;
  castleHint: string | null;
}

export type TileKind =
  | 'EMPTY'
  | 'GROUND'
  | 'GRASS'
  | 'BRICK'
  | 'STONE'
  | 'COIN_BLOCK'
  | 'USED_BLOCK'
  | 'QUESTION_BLOCK'
  | 'PIPE_TOP_L'
  | 'PIPE_TOP_R'
  | 'PIPE_BODY_L'
  | 'PIPE_BODY_R';

export interface QuestionBlockEntity {
  id: number; // 0..4
  tx: number;
  ty: number;
  answered: boolean;
  bumpOffset: number;
  bumpVel: number;
}

export interface BonusBlockEntity {
  tx: number;
  ty: number;
  remainingCoins: number;
  bumpOffset: number;
  bumpVel: number;
}

export interface BrickBounce {
  tx: number;
  ty: number;
  offset: number;
  vel: number;
}

export interface CoinEntity {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  bobPhase: number;
}

export type EnemyKind = 'MUSHROOM' | 'BEETLE' | 'PIRANHA';

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  alive: boolean;
  squashedTimer: number;
  shellMode?: boolean;
  shellMoving?: boolean;
  // For Piranha pipe chompers:
  baseY?: number;
  pipeTimer?: number;
  pipeState?: 'HIDDEN' | 'RISING' | 'UP' | 'FALLING';
}

export interface CheckpointEntity {
  id: number;
  tx: number;
  ty: number;
  activated: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'square' | 'star' | 'coin';
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}
