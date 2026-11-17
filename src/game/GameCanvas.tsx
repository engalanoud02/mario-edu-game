import React, { useEffect, useRef } from 'react';
import { retroAudio } from '../audio/retroAudio';
import {
  BrickBounce,
  CheckpointEntity,
  CoinEntity,
  DifficultyMode,
  EnemyEntity,
  FloatingText,
  GameState,
  HudSnapshot,
  Particle,
  QuestionBlockEntity,
  BonusBlockEntity,
  TileKind,
} from '../types/game';
import {
  buildClassicLevel,
  BuiltLevel,
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  LEVEL_ZONES,
  TILE_SIZE,
} from './levelData';
import {
  drawCheckpoint,
  drawCoin,
  drawEnemy,
  drawFlagpoleAndCastle,
  drawHero,
  drawSkyAndParallax,
  drawTile,
  getZoneNameForTile,
  isSolidTile,
  isTileInBounds,
} from './sprites';

interface GameCanvasProps {
  gameState: GameState;
  difficulty: DifficultyMode;
  runId: number;
  continueFromCheckpointTrigger: number;
  warpToNearestQuestionTrigger: number;
  lastCorrectQuestionId: number | null;
  onTriggerQuestion: (questionIndex: number) => void;
  onHudUpdate: (hud: HudSnapshot) => void;
  onStartCelebration: () => void;
  onVictory: (finalHud: HudSnapshot) => void;
  onGameOver: (finalHud: HudSnapshot) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

const VIRTUAL_HEIGHT = LEVEL_HEIGHT * TILE_SIZE; // 640px

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  difficulty,
  runId,
  continueFromCheckpointTrigger,
  warpToNearestQuestionTrigger,
  lastCorrectQuestionId,
  onTriggerQuestion,
  onHudUpdate,
  onStartCelebration,
  onVictory,
  onGameOver,
  onTogglePause,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;
  const difficultyRef = useRef<DifficultyMode>(difficulty);
  difficultyRef.current = difficulty;

  const callbacksRef = useRef({
    onTriggerQuestion,
    onHudUpdate,
    onStartCelebration,
    onVictory,
    onGameOver,
    onTogglePause,
    onToggleMute,
  });
  callbacksRef.current = {
    onTriggerQuestion,
    onHudUpdate,
    onStartCelebration,
    onVictory,
    onGameOver,
    onTogglePause,
    onToggleMute,
  };

  // Mutable simulation state held outside React render cycle
  const simRef = useRef<{
    level: BuiltLevel;
    player: {
      x: number;
      y: number;
      w: number;
      h: number;
      vx: number;
      vy: number;
      facing: 1 | -1;
      grounded: boolean;
      coyoteTimer: number;
      jumpBufferTimer: number;
      animTime: number;
      invincibleTimer: number;
      scaleX: number;
      scaleY: number;
      celebrating: boolean;
    };
    respawnPoint: { x: number; y: number };
    highestAutoCheckpointTx: number;
    maxLives: number;
    camX: number;
    demoCamX: number;
    demoDir: 1 | -1;
    shakeTimer: number;
    shakeIntensity: number;
    hitstopTimer: number;
    score: number;
    coins: number;
    lives: number;
    elapsedSeconds: number;
    answeredQuestions: Set<number>;
    particles: Particle[];
    floatingTexts: FloatingText[];
    brickBounces: BrickBounce[];
    celebrationPhase: 'NONE' | 'SLIDE' | 'WALK_CASTLE' | 'FIREWORKS';
    celebrationTimer: number;
    flagProgress: number;
    victoryFlagLift: number;
    fireworkCooldown: number;
    castleHint: string | null;
    lastHudSentAt: string;
    totalTime: number;
  } | null>(null);

  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    jumpHeld: boolean;
    jumpJustPressed: boolean;
    run: boolean;
  }>({
    left: false,
    right: false,
    jumpHeld: false,
    jumpJustPressed: false,
    run: false,
  });

  // Helper to initialize/reset simulation
  const initSimulation = (mode: DifficultyMode) => {
    const level = buildClassicLevel(mode);
    const maxLives = mode === 'easy' ? 5 : 3;
    simRef.current = {
      level,
      player: {
        x: 3 * TILE_SIZE,
        y: 11 * TILE_SIZE,
        w: 30,
        h: 38,
        vx: 0,
        vy: 0,
        facing: 1,
        grounded: false,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        animTime: 0,
        invincibleTimer: 0,
        scaleX: 1,
        scaleY: 1,
        celebrating: false,
      },
      respawnPoint: { x: 3 * TILE_SIZE, y: 11 * TILE_SIZE },
      highestAutoCheckpointTx: 3,
      maxLives,
      camX: 0,
      demoCamX: 120,
      demoDir: 1,
      shakeTimer: 0,
      shakeIntensity: 0,
      hitstopTimer: 0,
      score: 0,
      coins: 0,
      lives: maxLives,
      elapsedSeconds: 0,
      answeredQuestions: new Set<number>(),
      particles: [],
      floatingTexts: [],
      brickBounces: [],
      celebrationPhase: 'NONE',
      celebrationTimer: 0,
      flagProgress: 0,
      victoryFlagLift: 0,
      fireworkCooldown: 0,
      castleHint: null,
      lastHudSentAt: '',
      totalTime: 0,
    };
  };

  if (!simRef.current) {
    initSimulation(difficulty);
  }

  // Reset full level when runId or difficulty changes
  useEffect(() => {
    initSimulation(difficulty);
    const sim = simRef.current!;
    callbacksRef.current.onHudUpdate({
      score: 0,
      coins: 0,
      lives: sim.maxLives,
      maxLives: sim.maxLives,
      elapsedSeconds: 0,
      answeredQuestions: [],
      totalQuestions: 5,
      zoneName: LEVEL_ZONES[0].name,
      castleHint: null,
    });
  }, [runId, difficulty]);

  // Continue from last checkpoint after Game Over
  useEffect(() => {
    if (continueFromCheckpointTrigger === 0 || !simRef.current) return;
    const sim = simRef.current;
    sim.lives = sim.maxLives;
    sim.player.x = sim.respawnPoint.x;
    sim.player.y = sim.respawnPoint.y;
    sim.player.vx = 0;
    sim.player.vy = 0;
    sim.player.invincibleTimer = 2.0;
    sim.castleHint = null;
    sim.lastHudSentAt = '';
  }, [continueFromCheckpointTrigger]);

  // Warp player to nearest unanswered Question Block if stuck near castle
  useEffect(() => {
    if (warpToNearestQuestionTrigger === 0 || !simRef.current) return;
    const sim = simRef.current;
    const unanswered = sim.level.questionBlocks.find((qb) => !qb.answered);
    if (unanswered) {
      sim.player.x = Math.max(TILE_SIZE * 2, (unanswered.tx - 2) * TILE_SIZE);
      sim.player.y = 10 * TILE_SIZE;
      sim.player.vx = 0;
      sim.player.vy = 0;
      sim.player.invincibleTimer = 1.5;
      sim.castleHint = null;
      retroAudio.playCheckpoint();
    }
  }, [warpToNearestQuestionTrigger]);

  // Celebratory particles when a question is answered correctly
  useEffect(() => {
    if (lastCorrectQuestionId === null || !simRef.current) return;
    const sim = simRef.current;
    const qb = sim.level.questionBlocks.find((b) => b.id === lastCorrectQuestionId);
    if (qb && !qb.answered) {
      qb.answered = true;
      sim.answeredQuestions.add(qb.id);
      sim.score += 500;
      sim.castleHint = null;
      // Save automatic checkpoint near this Question Block
      if (qb.tx > sim.highestAutoCheckpointTx) {
        sim.highestAutoCheckpointTx = qb.tx;
        sim.respawnPoint = {
          x: Math.max(TILE_SIZE * 2, (qb.tx - 1) * TILE_SIZE),
          y: (qb.ty + 1) * TILE_SIZE,
        };
      }
      const cx = qb.tx * TILE_SIZE + TILE_SIZE / 2;
      const cy = qb.ty * TILE_SIZE;
      const colors = ['#FACC15', '#4ADE80', '#38BDF8', '#FB7185', '#FFFFFF'];
      for (let i = 0; i < 26; i++) {
        const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.25;
        const speed = 130 + Math.random() * 210;
        sim.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 120,
          size: 5 + Math.random() * 5,
          color: colors[i % colors.length],
          life: 0.9 + Math.random() * 0.4,
          maxLife: 1.3,
          gravity: 520,
          shape: i % 2 === 0 ? 'star' : 'square',
        });
      }
      sim.floatingTexts.push({
        x: cx,
        y: cy - 16,
        vy: -55,
        text: '+500 ★ أحسنت!',
        color: '#4ADE80',
        life: 1.3,
        maxLife: 1.3,
      });
      sim.lastHudSentAt = '';
    }
  }, [lastCorrectQuestionId]);

  // Music management tied to active gameplay
  useEffect(() => {
    if (gameState === 'PLAYING') {
      retroAudio.startMusic();
    } else {
      retroAudio.stopMusic();
    }
    return () => {
      retroAudio.stopMusic();
    };
  }, [gameState]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      // Ignore keyboard shortcuts when typing inside inputs/textareas
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'KeyM') {
        callbacksRef.current.onToggleMute();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state === 'PLAYING' || state === 'PAUSED') {
          e.preventDefault();
          callbacksRef.current.onTogglePause();
        }
        return;
      }

      if (state !== 'PLAYING') return;
      retroAudio.unlock();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.right = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysRef.current.run = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!keysRef.current.jumpHeld) {
          keysRef.current.jumpJustPressed = true;
        }
        keysRef.current.jumpHeld = true;
      }
      if (e.code === 'KeyR' && simRef.current?.castleHint) {
        const sim = simRef.current;
        const unanswered = sim.level.questionBlocks.find((qb) => !qb.answered);
        if (unanswered) {
          sim.player.x = Math.max(TILE_SIZE * 2, (unanswered.tx - 2) * TILE_SIZE);
          sim.player.y = 10 * TILE_SIZE;
          sim.player.vx = 0;
          sim.player.vy = 0;
          sim.player.invincibleTimer = 1.5;
          sim.castleHint = null;
          retroAudio.playCheckpoint();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.right = false;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysRef.current.run = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        keysRef.current.jumpHeld = false;
      }
    };

    const clearKeys = () => {
      keysRef.current.left = false;
      keysRef.current.right = false;
      keysRef.current.jumpHeld = false;
      keysRef.current.jumpJustPressed = false;
      keysRef.current.run = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);

  // Main 60fps simulation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const aspect = Math.max(1.2, rect.width / Math.max(1, rect.height));
      const logicalW = Math.round(VIRTUAL_HEIGHT * aspect);
      if (canvas.width !== logicalW || canvas.height !== VIRTUAL_HEIGHT) {
        canvas.width = logicalW;
        canvas.height = VIRTUAL_HEIGHT;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const spawnParticles = (
      x: number,
      y: number,
      count: number,
      color: string,
      speed: number = 180,
      shape: Particle['shape'] = 'square'
    ) => {
      const sim = simRef.current!;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const sp = speed * (0.4 + Math.random() * 0.7);
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * sp,
          vy: Math.sin(angle) * sp - 90,
          size: 4 + Math.random() * 4,
          color,
          life: 0.65 + Math.random() * 0.35,
          maxLife: 1,
          gravity: 650,
          shape,
        });
      }
    };

    const spawnFireworkBurst = (x: number, y: number) => {
      const sim = simRef.current!;
      const palette = ['#FACC15', '#EF4444', '#38BDF8', '#4ADE80', '#F472B6', '#FFFFFF'];
      const color = palette[Math.floor(Math.random() * palette.length)];
      retroAudio.playFirework();
      for (let i = 0; i < 32; i++) {
        const angle = (Math.PI * 2 * i) / 32;
        const sp = 110 + Math.random() * 140;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * sp,
          vy: Math.sin(angle) * sp,
          size: 4 + Math.random() * 4,
          color,
          life: 1.0 + Math.random() * 0.4,
          maxLife: 1.4,
          gravity: 160,
          shape: 'star',
        });
      }
    };

    const buildHudSnapshot = (): HudSnapshot => {
      const sim = simRef.current!;
      const pTx = Math.floor((sim.player.x + sim.player.w / 2) / TILE_SIZE);
      return {
        score: sim.score,
        coins: sim.coins,
        lives: sim.lives,
        maxLives: sim.maxLives,
        elapsedSeconds: Math.floor(sim.elapsedSeconds),
        answeredQuestions: Array.from(sim.answeredQuestions),
        totalQuestions: 5,
        zoneName: getZoneNameForTile(pTx, LEVEL_ZONES),
        castleHint: sim.castleHint,
      };
    };

    const hurtOrRespawn = (isPit: boolean) => {
      const sim = simRef.current!;
      const p = sim.player;
      if (!isPit && p.invincibleTimer > 0) return;

      sim.lives = Math.max(0, sim.lives - 1);
      retroAudio.playHurt();
      sim.shakeTimer = 0.25;
      sim.shakeIntensity = 7;

      if (sim.lives <= 0) {
        const snap = buildHudSnapshot();
        callbacksRef.current.onHudUpdate(snap);
        callbacksRef.current.onGameOver(snap);
        return;
      }

      if (isPit) {
        p.x = sim.respawnPoint.x;
        p.y = sim.respawnPoint.y;
        p.vx = 0;
        p.vy = 0;
        p.invincibleTimer = 2.0;
        sim.floatingTexts.push({
          x: p.x + p.w / 2,
          y: p.y - 10,
          vy: -40,
          text: 'انتبه من الحفرة!',
          color: '#FCA5A5',
          life: 1.3,
          maxLife: 1.3,
        });
      } else {
        p.vy = -380;
        p.vx = -p.facing * 180;
        p.invincibleTimer = 1.8;
      }
    };

    const handleHeadBump = (tx: number, ty: number) => {
      const sim = simRef.current!;
      const tiles = sim.level.tiles;
      const kind: TileKind = tiles[ty]?.[tx] ?? 'EMPTY';
      const cx = tx * TILE_SIZE + TILE_SIZE / 2;
      const cy = ty * TILE_SIZE;

      if (kind === 'QUESTION_BLOCK') {
        const qb = sim.level.questionBlocks.find((b) => b.tx === tx && b.ty === ty);
        if (!qb) return;
        qb.bumpVel = -180;
        sim.hitstopTimer = 0.05;
        sim.shakeTimer = 0.14;
        sim.shakeIntensity = 4;

        if (!qb.answered) {
          retroAudio.playQuestionTrigger();
          keysRef.current.left = false;
          keysRef.current.right = false;
          keysRef.current.jumpHeld = false;
          callbacksRef.current.onTriggerQuestion(qb.id);
        } else {
          retroAudio.playBump();
        }
        return;
      }

      if (kind === 'COIN_BLOCK') {
        const bb = sim.level.bonusBlocks.find((b) => b.tx === tx && b.ty === ty);
        if (bb && bb.remainingCoins > 0) {
          bb.remainingCoins--;
          bb.bumpVel = -160;
          sim.coins += 1;
          sim.score += 100;
          retroAudio.playCoin();
          sim.particles.push({
            x: cx,
            y: cy - 8,
            vx: 0,
            vy: -320,
            size: 10,
            color: '#FACC15',
            life: 0.45,
            maxLife: 0.45,
            gravity: 780,
            shape: 'coin',
          });
          sim.floatingTexts.push({
            x: cx,
            y: cy - 12,
            vy: -50,
            text: '+100',
            color: '#FDE047',
            life: 0.8,
            maxLife: 0.8,
          });
          if (bb.remainingCoins === 0) {
            tiles[ty][tx] = 'USED_BLOCK';
          }
        } else {
          retroAudio.playBump();
        }
        return;
      }

      if (kind === 'BRICK') {
        // Keep pit bridge bricks intact, bounce others or break decorative bricks
        const isBridge = tx >= 37 && tx <= 43;
        if (isBridge) {
          sim.brickBounces.push({ tx, ty, offset: 0, vel: -140 });
          retroAudio.playBump();
        } else {
          tiles[ty][tx] = 'EMPTY';
          sim.score += 50;
          retroAudio.playBreak();
          sim.shakeTimer = 0.1;
          sim.shakeIntensity = 3;
          spawnParticles(cx, cy + TILE_SIZE / 2, 10, '#C84C0C', 220, 'square');
          sim.floatingTexts.push({
            x: cx,
            y: cy,
            vy: -45,
            text: '+50',
            color: '#FDBA74',
            life: 0.7,
            maxLife: 0.7,
          });
        }
        return;
      }

      retroAudio.playBump();
    };

    const resolveTileCollisionsX = (ent: { x: number; y: number; w: number; h: number; vx: number }) => {
      const sim = simRef.current!;
      const tiles = sim.level.tiles;
      const topTy = Math.floor((ent.y + 3) / TILE_SIZE);
      const botTy = Math.floor((ent.y + ent.h - 3) / TILE_SIZE);

      if (ent.vx > 0) {
        const rightTx = Math.floor((ent.x + ent.w) / TILE_SIZE);
        for (let ty = topTy; ty <= botTy; ty++) {
          if (isTileInBounds(rightTx, ty) && isSolidTile(tiles[ty][rightTx])) {
            ent.x = rightTx * TILE_SIZE - ent.w;
            ent.vx = 0;
            return true;
          }
        }
      } else if (ent.vx < 0) {
        const leftTx = Math.floor(ent.x / TILE_SIZE);
        for (let ty = topTy; ty <= botTy; ty++) {
          if (isTileInBounds(leftTx, ty) && isSolidTile(tiles[ty][leftTx])) {
            ent.x = (leftTx + 1) * TILE_SIZE;
            ent.vx = 0;
            return true;
          }
        }
      }
      return false;
    };

    const resolveTileCollisionsY = (
      ent: { x: number; y: number; w: number; h: number; vy: number },
      isPlayer: boolean
    ): boolean => {
      const sim = simRef.current!;
      const tiles = sim.level.tiles;
      const leftTx = Math.floor((ent.x + 4) / TILE_SIZE);
      const rightTx = Math.floor((ent.x + ent.w - 4) / TILE_SIZE);

      if (ent.vy >= 0) {
        const botTy = Math.floor((ent.y + ent.h) / TILE_SIZE);
        for (let tx = leftTx; tx <= rightTx; tx++) {
          if (isTileInBounds(tx, botTy) && isSolidTile(tiles[botTy][tx])) {
            ent.y = botTy * TILE_SIZE - ent.h;
            ent.vy = 0;
            return true;
          }
        }
      } else if (ent.vy < 0) {
        const topTy = Math.floor(ent.y / TILE_SIZE);
        for (let tx = leftTx; tx <= rightTx; tx++) {
          if (isTileInBounds(tx, topTy) && isSolidTile(tiles[topTy][tx])) {
            ent.y = (topTy + 1) * TILE_SIZE;
            ent.vy = 0;
            if (isPlayer) {
              // Pick the tile closest to player center for head bump
              const centerTx = Math.floor((ent.x + ent.w / 2) / TILE_SIZE);
              const hitTx =
                isTileInBounds(centerTx, topTy) && isSolidTile(tiles[topTy][centerTx])
                  ? centerTx
                  : tx;
              handleHeadBump(hitTx, topTy);
            }
            return false;
          }
        }
      }
      return false;
    };

    const updateSimulation = (dt: number) => {
      const sim = simRef.current!;
      const state = gameStateRef.current;
      const viewW = canvas.width;
      const maxCamX = LEVEL_WIDTH * TILE_SIZE - viewW;
      sim.totalTime += dt;

      // Live panning world on Title Menu / Question Editor
      if (state === 'TITLE_MENU' || state === 'QUESTION_EDITOR') {
        const panMax = Math.max(0, Math.min(maxCamX, 1600));
        sim.demoCamX += sim.demoDir * 48 * dt;
        if (sim.demoCamX >= panMax) {
          sim.demoCamX = panMax;
          sim.demoDir = -1;
        } else if (sim.demoCamX <= 0) {
          sim.demoCamX = 0;
          sim.demoDir = 1;
        }
        return;
      }

      if (state === 'PAUSED' || state === 'QUIZ_MODAL' || state === 'VICTORY' || state === 'GAME_OVER') {
        return;
      }

      // Hitstop freeze frame on heavy impacts
      if (sim.hitstopTimer > 0) {
        sim.hitstopTimer -= dt;
        return;
      }

      // Update block bounce animations
      sim.level.questionBlocks.forEach((qb) => {
        if (qb.bumpOffset !== 0 || qb.bumpVel !== 0) {
          qb.bumpOffset += qb.bumpVel * dt;
          qb.bumpVel += 1100 * dt;
          if (qb.bumpOffset >= 0) {
            qb.bumpOffset = 0;
            qb.bumpVel = 0;
          }
        }
      });

      sim.level.bonusBlocks.forEach((bb) => {
        if (bb.bumpOffset !== 0 || bb.bumpVel !== 0) {
          bb.bumpOffset += bb.bumpVel * dt;
          bb.bumpVel += 1100 * dt;
          if (bb.bumpOffset >= 0) {
            bb.bumpOffset = 0;
            bb.bumpVel = 0;
          }
        }
      });

      sim.brickBounces = sim.brickBounces.filter((b) => {
        b.offset += b.vel * dt;
        b.vel += 1000 * dt;
        if (b.offset >= 0) {
          b.offset = 0;
          return false;
        }
        return true;
      });

      // Update particles & floating texts
      sim.particles = sim.particles.filter((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += pt.gravity * dt;
        pt.life -= dt;
        return pt.life > 0;
      });

      sim.floatingTexts = sim.floatingTexts.filter((ft) => {
        ft.y += ft.vy * dt;
        ft.life -= dt;
        return ft.life > 0;
      });

      if (sim.shakeTimer > 0) {
        sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
      }

      // Castle celebration sequence
      if (state === 'CASTLE_CELEBRATION') {
        const p = sim.player;
        sim.celebrationTimer += dt;
        if (sim.celebrationPhase === 'SLIDE') {
          sim.flagProgress = Math.min(1, sim.flagProgress + dt * 1.1);
          const targetY = 12 * TILE_SIZE - p.h;
          if (p.y < targetY) {
            p.y = Math.min(targetY, p.y + 240 * dt);
          }
          if (sim.flagProgress >= 1 && p.y >= targetY) {
            sim.celebrationPhase = 'WALK_CASTLE';
            p.grounded = true;
            p.facing = 1;
            retroAudio.playVictoryFanfare();
          }
        } else if (sim.celebrationPhase === 'WALK_CASTLE') {
          const gateX = (sim.level.castleTx + 2) * TILE_SIZE;
          p.vx = 140;
          p.animTime += dt;
          p.x += p.vx * dt;
          p.y = 13 * TILE_SIZE - p.h;
          if (p.x >= gateX) {
            p.vx = 0;
            p.celebrating = true;
            sim.celebrationPhase = 'FIREWORKS';
            sim.celebrationTimer = 0;
          }
        } else if (sim.celebrationPhase === 'FIREWORKS') {
          sim.victoryFlagLift = Math.min(1, sim.victoryFlagLift + dt * 1.4);
          sim.fireworkCooldown -= dt;
          if (sim.fireworkCooldown <= 0) {
            sim.fireworkCooldown = 0.42;
            const castleCenter = (sim.level.castleTx + 2.5) * TILE_SIZE;
            spawnFireworkBurst(
              castleCenter + (Math.random() - 0.5) * 260,
              120 + Math.random() * 140
            );
          }
          if (sim.celebrationTimer >= 2.6) {
            callbacksRef.current.onVictory(buildHudSnapshot());
          }
        }

        // Smooth camera to showcase castle
        const targetCam = Math.min(maxCamX, (sim.level.flagpoleTx - 6) * TILE_SIZE);
        sim.camX += (targetCam - sim.camX) * Math.min(1, dt * 4);
        return;
      }

      // --- ACTIVE PLAYING SIMULATION ---
      sim.elapsedSeconds += dt;
      const p = sim.player;
      const k = keysRef.current;

      if (p.invincibleTimer > 0) {
        p.invincibleTimer = Math.max(0, p.invincibleTimer - dt);
      }

      // Recover squash-and-stretch gently
      p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
      p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

      // Horizontal movement (smooth, responsive acceleration & crisp stopping for beginners)
      const maxSpeed = k.run ? 340 : 245;
      const accel = p.grounded ? 2200 : 1550;
      const friction = p.grounded ? 2100 : 420;

      if (k.left && !k.right) {
        p.vx = Math.max(-maxSpeed, p.vx - accel * dt);
        p.facing = -1;
      } else if (k.right && !k.left) {
        p.vx = Math.min(maxSpeed, p.vx + accel * dt);
        p.facing = 1;
      } else {
        if (Math.abs(p.vx) <= friction * dt) {
          p.vx = 0;
        } else {
          p.vx -= Math.sign(p.vx) * friction * dt;
        }
      }

      if (Math.abs(p.vx) > 12) {
        p.animTime += dt * (k.run ? 1.35 : 1);
      }

      // Generous coyote time & jump input buffering for easy pit crossing
      if (p.grounded) {
        p.coyoteTimer = 0.18;
      } else {
        p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
      }

      if (k.jumpJustPressed) {
        p.jumpBufferTimer = 0.16;
        k.jumpJustPressed = false;
      } else {
        p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
      }

      if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
        p.vy = k.run ? -750 : -710;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.scaleX = 0.8;
        p.scaleY = 1.24;
        retroAudio.playJump();
      }

      // Gentle variable jump cut when releasing jump early
      if (!k.jumpHeld && p.vy < -240) {
        p.vy *= 0.68;
      }

      // Slightly floatier gravity for easier pit traversal
      p.vy = Math.min(860, p.vy + 1460 * dt);

      // Integrate X
      p.x += p.vx * dt;
      if (p.x < 0) {
        p.x = 0;
        p.vx = 0;
      }
      if (p.x + p.w > LEVEL_WIDTH * TILE_SIZE) {
        p.x = LEVEL_WIDTH * TILE_SIZE - p.w;
        p.vx = 0;
      }
      resolveTileCollisionsX(p);

      // Integrate Y
      const wasGrounded = p.grounded;
      p.y += p.vy * dt;
      p.grounded = resolveTileCollisionsY(p, true);
      if (!wasGrounded && p.grounded) {
        p.scaleX = 1.22;
        p.scaleY = 0.78;
      }

      // Pit fall check
      if (p.y > LEVEL_HEIGHT * TILE_SIZE + 40) {
        hurtOrRespawn(true);
        return;
      }

      // Automatic safe-ground checkpoints every 14 tiles so players never return to start
      if (p.grounded) {
        const pTx = Math.floor((p.x + p.w / 2) / TILE_SIZE);
        const footTy = Math.floor((p.y + p.h + 4) / TILE_SIZE);
        const safeLeft = isTileInBounds(pTx - 1, footTy) && isSolidTile(sim.level.tiles[footTy][pTx - 1]);
        const safeRight = isTileInBounds(pTx + 1, footTy) && isSolidTile(sim.level.tiles[footTy][pTx + 1]);
        if (safeLeft && safeRight && pTx >= sim.highestAutoCheckpointTx + 14) {
          sim.highestAutoCheckpointTx = pTx;
          sim.respawnPoint = {
            x: p.x,
            y: p.y - 4,
          };
          sim.floatingTexts.push({
            x: p.x + p.w / 2,
            y: p.y - 16,
            vy: -35,
            text: 'حفظ تلقائي ✓',
            color: '#86EFAC',
            life: 1.0,
            maxLife: 1.0,
          });
        }
      }

      // Collect coins (generous 34px pickup radius so collecting coins feels effortless)
      for (const coin of sim.level.coins) {
        if (coin.collected) continue;
        const dx = p.x + p.w / 2 - coin.x;
        const dy = p.y + p.h / 2 - coin.y;
        if (dx * dx + dy * dy < 34 * 34) {
          coin.collected = true;
          sim.coins += 1;
          sim.score += 100;
          retroAudio.playCoin();
          spawnParticles(coin.x, coin.y, 7, '#FDE047', 130, 'star');
          sim.floatingTexts.push({
            x: coin.x,
            y: coin.y - 10,
            vy: -45,
            text: '+100',
            color: '#FEF08A',
            life: 0.65,
            maxLife: 0.65,
          });
        }
      }

      // Checkpoints
      for (const cp of sim.level.checkpoints) {
        if (!cp.activated && p.x + p.w / 2 >= cp.tx * TILE_SIZE) {
          cp.activated = true;
          if (cp.tx >= sim.highestAutoCheckpointTx) {
            sim.highestAutoCheckpointTx = cp.tx;
          }
          sim.respawnPoint = {
            x: cp.tx * TILE_SIZE - 8,
            y: (cp.ty - 2) * TILE_SIZE,
          };
          sim.score += 250;
          retroAudio.playCheckpoint();
          spawnParticles(cp.tx * TILE_SIZE + 20, cp.ty * TILE_SIZE - 50, 14, '#4ADE80', 160, 'star');
          sim.floatingTexts.push({
            x: cp.tx * TILE_SIZE + 20,
            y: cp.ty * TILE_SIZE - 75,
            vy: -40,
            text: 'نقطة حفظ!',
            color: '#4ADE80',
            life: 1.2,
            maxLife: 1.2,
          });
        }
      }

      // Update Enemies
      const activeWindowLeft = sim.camX - 280;
      const activeWindowRight = sim.camX + viewW + 280;
      const isEasyMode = difficultyRef.current === 'easy';

      for (const en of sim.level.enemies) {
        if (!en.alive) {
          if (en.squashedTimer > 0) en.squashedTimer -= dt;
          continue;
        }
        if (en.x < activeWindowLeft || en.x > activeWindowRight) continue;

        if (en.kind === 'PIRANHA') {
          en.pipeTimer = (en.pipeTimer ?? 0) + dt;
          const baseY = en.baseY ?? en.y;
          const safeDist = isEasyMode ? 72 : 58;
          const playerNearPipe = Math.abs(p.x + p.w / 2 - (en.x + en.w / 2)) < safeDist;
          const pipeSpeed = isEasyMode ? 40 : 52;
          const hiddenWait = isEasyMode ? 2.6 : 1.7;

          if (en.pipeState === 'HIDDEN') {
            en.y = baseY + 6;
            if ((en.pipeTimer ?? 0) > hiddenWait && !playerNearPipe) {
              en.pipeState = 'RISING';
              en.pipeTimer = 0;
            }
          } else if (en.pipeState === 'RISING') {
            en.y -= pipeSpeed * dt;
            if (en.y <= baseY - 38) {
              en.y = baseY - 38;
              en.pipeState = 'UP';
              en.pipeTimer = 0;
            }
          } else if (en.pipeState === 'UP') {
            if ((en.pipeTimer ?? 0) > (isEasyMode ? 1.0 : 1.2)) {
              en.pipeState = 'FALLING';
              en.pipeTimer = 0;
            }
          } else if (en.pipeState === 'FALLING') {
            en.y += pipeSpeed * dt;
            if (en.y >= baseY + 6) {
              en.y = baseY + 6;
              en.pipeState = 'HIDDEN';
              en.pipeTimer = 0;
            }
          }

          // Piranha collision (only when emerged)
          if (en.pipeState !== 'HIDDEN') {
            const overlap =
              p.x + 4 < en.x + en.w - 4 &&
              p.x + p.w - 4 > en.x + 4 &&
              p.y + 4 < en.y + en.h &&
              p.y + p.h > en.y + 4;
            if (overlap) {
              hurtOrRespawn(false);
            }
          }
          continue;
        }

        // Walking & Shell enemies
        en.vy = Math.min(800, en.vy + 1500 * dt);
        const prevVx = en.vx;
        en.x += en.vx * dt;
        const hitWall = resolveTileCollisionsX(en);
        if (hitWall) {
          en.vx = -prevVx;
        }
        en.y += en.vy * dt;
        const onFloor = resolveTileCollisionsY(en, false);

        // Turn walkers at platform edges (unless moving shell)
        if (onFloor && !en.shellMoving && Math.abs(en.vx) > 0) {
          const aheadX = en.vx > 0 ? en.x + en.w + 2 : en.x - 2;
          const aheadTx = Math.floor(aheadX / TILE_SIZE);
          const belowTy = Math.floor((en.y + en.h + 4) / TILE_SIZE);
          if (!isTileInBounds(aheadTx, belowTy) || !isSolidTile(sim.level.tiles[belowTy][aheadTx])) {
            en.vx = -en.vx;
          }
        }

        // Shell knocking out other enemies
        if (en.shellMode && en.shellMoving) {
          for (const other of sim.level.enemies) {
            if (other.id === en.id || !other.alive || other.kind === 'PIRANHA') continue;
            const hit =
              en.x < other.x + other.w &&
              en.x + en.w > other.x &&
              en.y < other.y + other.h &&
              en.y + en.h > other.y;
            if (hit) {
              other.alive = false;
              other.squashedTimer = 0.4;
              sim.score += 200;
              retroAudio.playStomp();
              spawnParticles(other.x + other.w / 2, other.y + 16, 10, '#FDBA74', 180);
            }
          }
        }

        // Player vs Enemy interaction
        const overlap =
          p.x + 3 < en.x + en.w - 3 &&
          p.x + p.w - 3 > en.x + 3 &&
          p.y + 3 < en.y + en.h &&
          p.y + p.h > en.y + 3;

        if (overlap) {
          const isStomp = p.vy > 0 && p.y + p.h - p.vy * dt <= en.y + 24;
          if (isStomp) {
            p.vy = -440;
            p.scaleX = 1.2;
            p.scaleY = 0.8;
            sim.hitstopTimer = 0.04;
            sim.shakeTimer = 0.1;
            sim.shakeIntensity = 3;
            retroAudio.playStomp();

            if (en.kind === 'MUSHROOM') {
              en.alive = false;
              en.squashedTimer = 0.45;
              sim.score += 200;
              spawnParticles(en.x + en.w / 2, en.y + 16, 8, '#FDBA74', 150);
              sim.floatingTexts.push({
                x: en.x + en.w / 2,
                y: en.y,
                vy: -45,
                text: '+200',
                color: '#FFFFFF',
                life: 0.7,
                maxLife: 0.7,
              });
            } else if (en.kind === 'BEETLE') {
              if (!en.shellMode) {
                en.shellMode = true;
                en.shellMoving = false;
                en.vx = 0;
                sim.score += 150;
              } else if (!en.shellMoving) {
                en.shellMoving = true;
                en.vx = p.x + p.w / 2 < en.x + en.w / 2 ? 320 : -320;
                sim.score += 150;
              } else {
                en.shellMoving = false;
                en.vx = 0;
              }
            }
          } else if (en.shellMode && !en.shellMoving) {
            // Kick stationary shell harmlessly!
            en.shellMoving = true;
            en.vx = p.x + p.w / 2 < en.x + en.w / 2 ? 320 : -320;
            retroAudio.playStomp();
          } else {
            hurtOrRespawn(false);
          }
        }
      }

      // Check Flagpole / Castle arrival
      const flagpoleX = sim.level.flagpoleTx * TILE_SIZE;
      if (p.x + p.w >= flagpoleX - 4) {
        if (sim.answeredQuestions.size >= 5) {
          sim.celebrationPhase = 'SLIDE';
          sim.celebrationTimer = 0;
          sim.score += 1000;
          p.x = flagpoleX - 18;
          p.vx = 0;
          p.vy = 0;
          retroAudio.playFlagpole();
          callbacksRef.current.onStartCelebration();
        } else {
          const remaining = 5 - sim.answeredQuestions.size;
          sim.castleHint = `تبقّى ${remaining} ${remaining === 1 ? 'سؤال' : 'أسئلة'}! أجب عن صناديق الاستفهام الخمسة أولاً لدخول القلعة.`;
          // Gently keep player in front of flagpole until answered
          if (p.x + p.w > flagpoleX + 20) {
            p.x = flagpoleX + 20 - p.w;
            p.vx = 0;
          }
        }
      } else if (p.x < flagpoleX - 240 && sim.castleHint) {
        sim.castleHint = null;
      }

      // Camera smooth follow with slight look-ahead
      const targetCam = Math.max(
        0,
        Math.min(maxCamX, p.x - viewW * 0.38 + p.facing * 45)
      );
      sim.camX += (targetCam - sim.camX) * Math.min(1, dt * 8);

      // Throttled HUD sync (only when integer display values change)
      const hudSnap = buildHudSnapshot();
      const key = `${hudSnap.score}|${hudSnap.coins}|${hudSnap.lives}|${hudSnap.elapsedSeconds}|${hudSnap.answeredQuestions.length}|${hudSnap.zoneName}|${hudSnap.castleHint ?? ''}`;
      if (key !== sim.lastHudSentAt) {
        sim.lastHudSentAt = key;
        callbacksRef.current.onHudUpdate(hudSnap);
      }
    };

    const render = () => {
      const sim = simRef.current!;
      const state = gameStateRef.current;
      const viewW = canvas.width;
      const viewH = canvas.height;
      const isMenuBg = state === 'TITLE_MENU' || state === 'QUESTION_EDITOR';
      let camX = isMenuBg ? sim.demoCamX : sim.camX;
      let shakeY = 0;

      if (sim.shakeTimer > 0) {
        const mag = sim.shakeIntensity * (sim.shakeTimer / 0.25);
        camX += (Math.random() - 0.5) * mag * 2;
        shakeY = (Math.random() - 0.5) * mag * 2;
      }

      ctx.save();
      ctx.translate(0, shakeY);

      // 1. Sky & Parallax Background
      drawSkyAndParallax(ctx, camX, viewW, viewH, sim.totalTime);

      // 2. Visible Tiles
      const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
      const endTx = Math.min(LEVEL_WIDTH - 1, Math.ceil((camX + viewW) / TILE_SIZE) + 1);

      for (let ty = 0; ty < LEVEL_HEIGHT; ty++) {
        for (let tx = startTx; tx <= endTx; tx++) {
          const kind = sim.level.tiles[ty][tx];
          if (kind === 'EMPTY') continue;

          let yOffset = 0;
          let qb: QuestionBlockEntity | undefined;
          let bonusRem: number | undefined;

          if (kind === 'QUESTION_BLOCK') {
            qb = sim.level.questionBlocks.find((b) => b.tx === tx && b.ty === ty);
            if (qb) yOffset = qb.bumpOffset;
          } else if (kind === 'COIN_BLOCK') {
            const bb = sim.level.bonusBlocks.find((b) => b.tx === tx && b.ty === ty);
            if (bb) {
              yOffset = bb.bumpOffset;
              bonusRem = bb.remainingCoins;
            }
          } else if (kind === 'BRICK') {
            const br = sim.brickBounces.find((b) => b.tx === tx && b.ty === ty);
            if (br) yOffset = br.offset;
          }

          drawTile(
            ctx,
            kind,
            tx * TILE_SIZE - camX,
            ty * TILE_SIZE + yOffset,
            sim.totalTime,
            qb,
            bonusRem
          );
        }
      }

      // Subtle floating indicator below unanswered Question Blocks when player is nearby
      if (!isMenuBg) {
        for (const qb of sim.level.questionBlocks) {
          if (qb.answered) continue;
          const qx = qb.tx * TILE_SIZE + TILE_SIZE / 2;
          if (Math.abs(sim.player.x - qx) < 260) {
            const bob = Math.sin(sim.totalTime * 6) * 4;
            const sx = qx - camX;
            const sy = (qb.ty + 1) * TILE_SIZE + 14 + bob;
            ctx.fillStyle = 'rgba(254, 240, 138, 0.92)';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 6);
            ctx.lineTo(sx - 6, sy + 2);
            ctx.lineTo(sx + 6, sy + 2);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // 3. Checkpoints
      for (const cp of sim.level.checkpoints) {
        if (cp.tx >= startTx - 2 && cp.tx <= endTx + 2) {
          drawCheckpoint(ctx, cp, camX, sim.totalTime);
        }
      }

      // 4. Flagpole & Castle
      drawFlagpoleAndCastle(
        ctx,
        sim.level.flagpoleTx,
        sim.level.castleTx,
        camX,
        sim.flagProgress,
        sim.victoryFlagLift,
        sim.answeredQuestions.size >= 5,
        sim.totalTime
      );

      // 5. Coins
      for (const coin of sim.level.coins) {
        if (!coin.collected && coin.x >= camX - 40 && coin.x <= camX + viewW + 40) {
          drawCoin(ctx, coin, camX, sim.totalTime);
        }
      }

      // 6. Enemies
      for (const en of sim.level.enemies) {
        if (en.x >= camX - 60 && en.x <= camX + viewW + 60) {
          drawEnemy(ctx, en, camX, sim.totalTime);
        }
      }

      // 7. Hero Player (hidden once inside castle gate during fireworks)
      if (!isMenuBg && sim.celebrationPhase !== 'FIREWORKS') {
        drawHero(ctx, sim.player, camX);
      }

      // 8. Particles
      for (const pt of sim.particles) {
        const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        const px = pt.x - camX;
        if (pt.shape === 'coin') {
          ctx.beginPath();
          ctx.ellipse(px, pt.y, 7, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.shape === 'star') {
          ctx.translate(px, pt.y);
          ctx.rotate(pt.life * 6);
          ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        } else {
          ctx.fillRect(px - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.restore();
      }

      // 9. Floating Texts
      for (const ft of sim.floatingTexts) {
        const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '800 16px "Cairo", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0F172A';
        ctx.fillText(ft.text, ft.x - camX + 1.5, ft.y + 1.5);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x - camX, ft.y);
        ctx.restore();
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      updateSimulation(dt);
      render();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full select-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
