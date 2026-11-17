import {
  BonusBlockEntity,
  CheckpointEntity,
  CoinEntity,
  DifficultyMode,
  EnemyEntity,
  QuestionBlockEntity,
  TileKind,
} from '../types/game';

export const TILE_SIZE = 40;
export const LEVEL_WIDTH = 112;
export const LEVEL_HEIGHT = 16;

export interface ZoneRange {
  startTx: number;
  endTx: number;
  name: string;
}

export const LEVEL_ZONES: ZoneRange[] = [
  { startTx: 0, endTx: 22, name: 'السهل الأخضر' },
  { startTx: 23, endTx: 42, name: 'وادي الأنابيب' },
  { startTx: 43, endTx: 62, name: 'جسر السماء' },
  { startTx: 63, endTx: 82, name: 'تلال التحدي' },
  { startTx: 83, endTx: 112, name: 'بوابة القلعة' },
];

export interface BuiltLevel {
  tiles: TileKind[][];
  questionBlocks: QuestionBlockEntity[];
  bonusBlocks: BonusBlockEntity[];
  coins: CoinEntity[];
  enemies: EnemyEntity[];
  checkpoints: CheckpointEntity[];
  flagpoleTx: number;
  castleTx: number;
}

export function buildClassicLevel(difficulty: DifficultyMode = 'easy'): BuiltLevel {
  const isEasy = difficulty === 'easy';

  const tiles: TileKind[][] = Array.from({ length: LEVEL_HEIGHT }, () =>
    Array<TileKind>(LEVEL_WIDTH).fill('EMPTY')
  );

  const setTile = (tx: number, ty: number, kind: TileKind) => {
    if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
      tiles[ty][tx] = kind;
    }
  };

  const fillGround = (startTx: number, endTx: number, surfaceTy: number = 13) => {
    for (let tx = startTx; tx <= endTx; tx++) {
      setTile(tx, surfaceTy, 'GRASS');
      for (let ty = surfaceTy + 1; ty < LEVEL_HEIGHT; ty++) {
        setTile(tx, ty, 'GROUND');
      }
    }
  };

  const addPipe = (tx: number, groundTy: number, heightTiles: number) => {
    const topTy = groundTy - heightTiles;
    setTile(tx, topTy, 'PIPE_TOP_L');
    setTile(tx + 1, topTy, 'PIPE_TOP_R');
    for (let ty = topTy + 1; ty < groundTy; ty++) {
      setTile(tx, ty, 'PIPE_BODY_L');
      setTile(tx + 1, ty, 'PIPE_BODY_R');
    }
  };

  const addStoneStair = (startTx: number, groundTy: number, steps: number) => {
    for (let i = 0; i < steps; i++) {
      const tx = startTx + i;
      const h = i + 1;
      for (let s = 1; s <= h; s++) {
        setTile(tx, groundTy - s, 'STONE');
      }
    }
  };

  // --- COMPACT 2-3 MINUTE GROUND LAYOUT (~10s between questions) ---
  if (isEasy) {
    // Easy mode: gentle continuous path with 2 very small 2-tile pits
    fillGround(0, 38, 13);
    // Small 2-tile pit at tx 39..40 (with overhead brick bridge)
    fillGround(41, 61, 13);
    // Small 2-tile pit at tx 62..63
    fillGround(64, 111, 13);
  } else {
    // Normal mode: compact classic pits (2-3 tiles) with close platforms
    fillGround(0, 23, 13);
    // Pit 1: tx 24..25 (2 tiles)
    fillGround(26, 38, 13);
    // Pit 2: tx 39..41 (3 tiles, brick bridge overhead)
    fillGround(42, 60, 13);
    // Pit 3: tx 61..63 (3 tiles)
    fillGround(64, 77, 13);
    // Pit 4: tx 78..79 (2 tiles)
    fillGround(80, 111, 13);
  }

  // --- SECTION 1: السهل الأخضر (0 - 22) -> Q1 very close to start! ---
  setTile(8, 9, 'BRICK');
  setTile(9, 9, 'COIN_BLOCK');
  setTile(10, 9, 'BRICK');

  // Question Block #1 right near the start!
  setTile(13, 9, 'BRICK');
  setTile(14, 9, 'QUESTION_BLOCK');
  setTile(15, 9, 'BRICK');

  addPipe(19, 13, 2);

  // --- SECTION 2: وادي الأنابيب (23 - 42) -> Q2 (~10s from Q1) ---
  addPipe(27, 13, isEasy ? 2 : 3);

  // Question Block #2
  setTile(31, 9, 'BRICK');
  setTile(32, 9, 'QUESTION_BLOCK');
  setTile(33, 9, 'BRICK');
  setTile(34, 9, 'COIN_BLOCK');

  // Overhead brick bridge across tx 38..42
  for (let tx = 38; tx <= 42; tx++) {
    setTile(tx, 9, 'BRICK');
  }
  setTile(40, 9, 'COIN_BLOCK');

  // --- SECTION 3: جسر السماء (43 - 62) -> Q3 (~10s from Q2) ---
  setTile(45, 10, 'BRICK');
  setTile(46, 10, 'BRICK');

  // Question Block #3
  setTile(50, 9, 'BRICK');
  setTile(51, 9, 'QUESTION_BLOCK');
  setTile(52, 9, 'BRICK');

  addPipe(56, 13, 2);

  // --- SECTION 4: تلال التحدي (63 - 82) -> Q4 (~10s from Q3) ---
  setTile(65, 10, 'BRICK');
  setTile(66, 10, 'COIN_BLOCK');
  setTile(67, 10, 'BRICK');

  // Question Block #4
  setTile(70, 9, 'BRICK');
  setTile(71, 9, 'QUESTION_BLOCK');
  setTile(72, 9, 'BRICK');

  addPipe(75, 13, isEasy ? 2 : 3);

  // --- SECTION 5: بوابة القلعة (83 - 111) -> Q5 then Castle right after! ---
  setTile(82, 9, 'BRICK');
  setTile(83, 9, 'COIN_BLOCK');
  setTile(84, 9, 'BRICK');

  // Question Block #5
  setTile(86, 9, 'BRICK');
  setTile(87, 9, 'QUESTION_BLOCK');
  setTile(88, 9, 'BRICK');

  // Short ascending staircase right after Question #5
  const stairSteps = isEasy ? 4 : 5;
  addStoneStair(91, 13, stairSteps);
  for (let s = 1; s <= stairSteps; s++) {
    setTile(91 + stairSteps, 13 - s, 'STONE');
  }

  // Flagpole & Castle right after the staircase
  const flagpoleTx = 99;
  setTile(flagpoleTx, 12, 'STONE');

  const castleTx = 104;

  // Collect Question Blocks & Bonus Blocks
  const questionBlocks: QuestionBlockEntity[] = [];
  const bonusBlocks: BonusBlockEntity[] = [];
  let qId = 0;

  for (let tx = 0; tx < LEVEL_WIDTH; tx++) {
    for (let ty = 0; ty < LEVEL_HEIGHT; ty++) {
      if (tiles[ty][tx] === 'QUESTION_BLOCK') {
        questionBlocks.push({
          id: qId++,
          tx,
          ty,
          answered: false,
          bumpOffset: 0,
          bumpVel: 0,
        });
      } else if (tiles[ty][tx] === 'COIN_BLOCK') {
        bonusBlocks.push({
          tx,
          ty,
          remainingCoins: 3,
          bumpOffset: 0,
          bumpVel: 0,
        });
      }
    }
  }

  // --- FUN & ACCESSIBLE COINS ALONG THE COMPACT ROUTE ---
  const coins: CoinEntity[] = [];
  let coinId = 0;
  const addCoin = (tx: number, ty: number) => {
    coins.push({
      id: coinId++,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      collected: false,
      bobPhase: tx * 0.6,
    });
  };

  [6, 7].forEach((tx) => addCoin(tx, 11));
  [8, 9, 10].forEach((tx) => addCoin(tx, 7));
  [13, 14, 15].forEach((tx) => addCoin(tx, 7));
  [19, 20].forEach((tx) => addCoin(tx, 9));
  [23, 24, 25].forEach((tx) => addCoin(tx, 10));
  [27, 28].forEach((tx) => addCoin(tx, 8));
  [31, 32, 33, 34].forEach((tx) => addCoin(tx, 7));
  [39, 40, 41].forEach((tx) => addCoin(tx, 7));
  [45, 46].forEach((tx) => addCoin(tx, 8));
  [50, 51, 52].forEach((tx) => addCoin(tx, 7));
  [56, 57].forEach((tx) => addCoin(tx, 9));
  [61, 62, 63].forEach((tx) => addCoin(tx, 10));
  [65, 66, 67].forEach((tx) => addCoin(tx, 8));
  [70, 71, 72].forEach((tx) => addCoin(tx, 7));
  [78, 79].forEach((tx) => addCoin(tx, 10));
  [82, 83, 84].forEach((tx) => addCoin(tx, 7));
  [86, 87, 88].forEach((tx) => addCoin(tx, 7));
  [92, 93, 94].forEach((tx, i) => addCoin(tx, 10 - i));

  // --- ENEMIES (Balanced for compact fun) ---
  const enemies: EnemyEntity[] = [];
  let enemyId = 0;

  const mushroomSpeed = isEasy ? 34 : 52;
  const beetleSpeed = isEasy ? 40 : 60;

  const addWalker = (kind: 'MUSHROOM' | 'BEETLE', tx: number, groundTy: number, dir: -1 | 1 = -1) => {
    enemies.push({
      id: enemyId++,
      kind,
      x: tx * TILE_SIZE + 4,
      y: groundTy * TILE_SIZE - 32,
      w: 32,
      h: 32,
      vx: dir * (kind === 'BEETLE' ? beetleSpeed : mushroomSpeed),
      vy: 0,
      alive: true,
      squashedTimer: 0,
      shellMode: false,
      shellMoving: false,
    });
  };

  const addPiranha = (pipeLeftTx: number, pipeTopTy: number) => {
    const baseY = pipeTopTy * TILE_SIZE;
    enemies.push({
      id: enemyId++,
      kind: 'PIRANHA',
      x: pipeLeftTx * TILE_SIZE + TILE_SIZE - 16,
      y: baseY + 6,
      w: 32,
      h: 40,
      vx: 0,
      vy: 0,
      alive: true,
      squashedTimer: 0,
      baseY,
      pipeTimer: Math.random() * 1.2,
      pipeState: 'HIDDEN',
    });
  };

  // Compact encounter pacing across the 5 sections
  addWalker('MUSHROOM', 17, 13, -1);
  addWalker('MUSHROOM', 29, 13, -1);
  if (!isEasy) addPiranha(27, 10);
  addWalker('BEETLE', 48, 13, -1);
  addPiranha(56, 11);
  addWalker('MUSHROOM', 68, 13, -1);
  if (!isEasy) addWalker('BEETLE', 73, 13, -1);
  addWalker('MUSHROOM', 89, 13, -1);

  // --- CHECKPOINTS ---
  const checkpoints: CheckpointEntity[] = [
    { id: 1, tx: 36, ty: 13, activated: false },
    { id: 2, tx: 54, ty: 13, activated: false },
    { id: 3, tx: 74, ty: 13, activated: false },
  ];

  return {
    tiles,
    questionBlocks,
    bonusBlocks,
    coins,
    enemies,
    checkpoints,
    flagpoleTx,
    castleTx,
  };
}
