import {
  CheckpointEntity,
  CoinEntity,
  EnemyEntity,
  QuestionBlockEntity,
  TileKind,
} from '../types/game';
import { LEVEL_HEIGHT, LEVEL_WIDTH, TILE_SIZE } from './levelData';

export interface PlayerRenderState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  animTime: number;
  invincibleTimer: number;
  scaleX: number;
  scaleY: number;
  celebrating: boolean;
}

export function drawSkyAndParallax(
  ctx: CanvasRenderingContext2D,
  camX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  // Classic vibrant sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  skyGrad.addColorStop(0, '#4A88F5');
  skyGrad.addColorStop(0.7, '#6BA3FF');
  skyGrad.addColorStop(1, '#A5CBFF');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // Distant rolling hills (0.2x parallax)
  const hillSpacing = 480;
  const hillStart = Math.floor((camX * 0.2) / hillSpacing) - 1;
  const hillEnd = hillStart + Math.ceil(viewW / hillSpacing) + 3;
  for (let i = hillStart; i <= hillEnd; i++) {
    const hx = i * hillSpacing - camX * 0.2;
    const isTall = Math.abs(i) % 2 === 0;
    const hw = isTall ? 260 : 180;
    const hh = isTall ? 130 : 85;
    const baseY = viewH - 120;

    ctx.fillStyle = isTall ? '#3B9E52' : '#4BB362';
    ctx.beginPath();
    ctx.moveTo(hx, baseY);
    ctx.quadraticCurveTo(hx + hw / 2, baseY - hh * 1.65, hx + hw, baseY);
    ctx.closePath();
    ctx.fill();

    // Subtle hill highlight
    ctx.fillStyle = isTall ? '#4AB464' : '#5EC475';
    ctx.beginPath();
    ctx.arc(hx + hw * 0.42, baseY - hh * 0.55, 10, 0, Math.PI * 2);
    ctx.arc(hx + hw * 0.58, baseY - hh * 0.35, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fluffy layered pixel clouds (0.35x parallax + gentle drift)
  const cloudSpacing = 340;
  const drift = time * 8;
  const cloudStart = Math.floor((camX * 0.35 + drift) / cloudSpacing) - 1;
  const cloudEnd = cloudStart + Math.ceil(viewW / cloudSpacing) + 3;
  for (let i = cloudStart; i <= cloudEnd; i++) {
    const cx = i * cloudSpacing - (camX * 0.35 + drift);
    const cy = 62 + ((Math.abs(i * 73) % 3) * 44);
    const scale = Math.abs(i) % 2 === 0 ? 1.15 : 0.85;
    drawCloud(ctx, cx, cy, scale);
  }

  // Midground bushes (0.65x parallax)
  const bushSpacing = 420;
  const bushStart = Math.floor((camX * 0.65) / bushSpacing) - 1;
  const bushEnd = bushStart + Math.ceil(viewW / bushSpacing) + 3;
  for (let i = bushStart; i <= bushEnd; i++) {
    const bx = i * bushSpacing - camX * 0.65 + 80;
    const by = viewH - 120;
    drawBush(ctx, bx, by, (Math.abs(i) % 2) + 1);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft shadow bottom
  ctx.fillStyle = '#D8ECFF';
  ctx.beginPath();
  ctx.roundRect(0, 14, 92, 24, 12);
  ctx.fill();

  // Bright cloud puffs
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(22, 18, 16, 0, Math.PI * 2);
  ctx.arc(44, 12, 21, 0, Math.PI * 2);
  ctx.arc(68, 18, 15, 0, Math.PI * 2);
  ctx.roundRect(6, 12, 78, 20, 10);
  ctx.fill();

  ctx.restore();
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, puffs: number): void {
  ctx.save();
  ctx.fillStyle = '#248A3D';
  for (let i = 0; i <= puffs; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 24, y - 8, 18, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = '#34B252';
  for (let i = 0; i <= puffs; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 24, y - 6, 14, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  kind: TileKind,
  x: number,
  y: number,
  time: number,
  questionBlock?: QuestionBlockEntity,
  bonusRemaining?: number
): void {
  const s = TILE_SIZE;

  switch (kind) {
    case 'GROUND': {
      ctx.fillStyle = '#8F4F24';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#753D18';
      ctx.fillRect(x + 4, y + 6, 8, 6);
      ctx.fillRect(x + 24, y + 20, 10, 7);
      ctx.fillStyle = '#A66232';
      ctx.fillRect(x + 16, y + 8, 6, 4);
      ctx.fillRect(x + 6, y + 26, 7, 5);
      break;
    }

    case 'GRASS': {
      // Dirt base
      ctx.fillStyle = '#8F4F24';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#753D18';
      ctx.fillRect(x + 6, y + 20, 9, 6);
      ctx.fillRect(x + 24, y + 26, 8, 5);
      // Green turf cap
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(x, y, s, 14);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(x, y, s, 9);
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(x, y, s, 3);
      // Scalloped overhangs
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(x + 4, y + 14, 8, 4);
      ctx.fillRect(x + 22, y + 14, 10, 5);
      break;
    }

    case 'BRICK': {
      ctx.fillStyle = '#C84C0C';
      ctx.fillRect(x, y, s, s);
      // Highlight
      ctx.fillStyle = '#E66B2C';
      ctx.fillRect(x, y, s, 3);
      // Mortar lines
      ctx.fillStyle = '#4A1D08';
      ctx.fillRect(x, y + 18, s, 3);
      ctx.fillRect(x, y + 37, s, 3);
      ctx.fillRect(x + 18, y, 3, 18);
      ctx.fillRect(x + 37, y + 21, 3, 16);
      ctx.fillRect(x + 7, y + 21, 3, 16);
      break;
    }

    case 'STONE': {
      ctx.fillStyle = '#64748B';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(x + 2, y + 2, s - 4, 4);
      ctx.fillRect(x + 2, y + 2, 4, s - 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 2, y + s - 5, s - 4, 3);
      ctx.fillRect(x + s - 5, y + 2, 3, s - 4);
      break;
    }

    case 'COIN_BLOCK': {
      const hasCoins = (bonusRemaining ?? 0) > 0;
      ctx.fillStyle = hasCoins ? '#B45309' : '#78350F';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = hasCoins ? '#D97706' : '#92400E';
      ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
      // Corner rivets
      ctx.fillStyle = '#451A03';
      ctx.fillRect(x + 5, y + 5, 4, 4);
      ctx.fillRect(x + s - 9, y + 5, 4, 4);
      ctx.fillRect(x + 5, y + s - 9, 4, 4);
      ctx.fillRect(x + s - 9, y + s - 9, 4, 4);
      if (hasCoins) {
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(x + 16, y + 11, 8, 18);
      }
      break;
    }

    case 'QUESTION_BLOCK': {
      const answered = questionBlock?.answered ?? false;
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);

      if (answered) {
        // Answered block: calm bronze with checkmark
        ctx.fillStyle = '#57534E';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#78716C';
        ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 11, y + 21);
        ctx.lineTo(x + 18, y + 28);
        ctx.lineTo(x + 30, y + 13);
        ctx.stroke();
      } else {
        // Glowing golden Question Block!
        ctx.save();
        ctx.shadowColor = `rgba(250, 204, 21, ${0.45 + pulse * 0.4})`;
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.fillStyle = '#B45309';
        ctx.fillRect(x, y, s, s);
        ctx.restore();

        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = pulse > 0.5 ? '#FDE047' : '#FBBF24';
        ctx.fillRect(x + 4, y + 4, s - 8, 4);
        ctx.fillRect(x + 4, y + 4, 4, s - 8);

        // Corner bolts
        ctx.fillStyle = '#78350F';
        ctx.fillRect(x + 5, y + 5, 3, 3);
        ctx.fillRect(x + s - 8, y + 5, 3, 3);
        ctx.fillRect(x + 5, y + s - 8, 3, 3);
        ctx.fillRect(x + s - 8, y + s - 8, 3, 3);

        // Bold '?' mark
        ctx.fillStyle = '#78350F';
        ctx.font = '900 24px "Cairo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('؟', x + s / 2 + 1, y + s / 2 + 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.fillText('؟', x + s / 2, y + s / 2 + 1);

        // Question index badge in corner (1..5)
        if (questionBlock) {
          ctx.fillStyle = '#991B1B';
          ctx.fillRect(x + s - 13, y + 2, 11, 12);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 9px "JetBrains Mono", monospace';
          ctx.fillText(String(questionBlock.id + 1), x + s - 7.5, y + 8.5);
        }
      }
      break;
    }

    case 'USED_BLOCK': {
      ctx.fillStyle = '#44403C';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#78716C';
      ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
      break;
    }

    case 'PIPE_TOP_L': {
      ctx.fillStyle = '#15803D';
      ctx.fillRect(x - 3, y, s + 3, 18);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(x - 1, y + 2, s, 14);
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(x + 5, y + 2, 8, 14);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(x - 3, y, s + 3, 2);
      ctx.fillRect(x - 3, y + 16, s + 3, 3);
      // Lower neck
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(x + 2, y + 19, s - 2, s - 19);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(x + 8, y + 19, 7, s - 19);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(x + 2, y + 19, 2, s - 19);
      break;
    }

    case 'PIPE_TOP_R': {
      ctx.fillStyle = '#15803D';
      ctx.fillRect(x, y, s + 3, 18);
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(x, y + 2, s, 14);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(x + s - 4, y + 2, 6, 14);
      ctx.fillRect(x, y, s + 3, 2);
      ctx.fillRect(x, y + 16, s + 3, 3);
      // Lower neck
      ctx.fillStyle = '#15803D';
      ctx.fillRect(x, y + 19, s - 2, s - 19);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(x + s - 6, y + 19, 4, s - 19);
      break;
    }

    case 'PIPE_BODY_L': {
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(x + 2, y, s - 2, s);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(x + 8, y, 7, s);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(x + 2, y, 2, s);
      break;
    }

    case 'PIPE_BODY_R': {
      ctx.fillStyle = '#15803D';
      ctx.fillRect(x, y, s - 2, s);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(x + s - 6, y, 4, s);
      break;
    }

    default:
      break;
  }
}

export function drawCoin(ctx: CanvasRenderingContext2D, coin: CoinEntity, camX: number, time: number): void {
  if (coin.collected) return;
  const sx = coin.x - camX;
  const bob = Math.sin(time * 5 + coin.bobPhase) * 3;
  const sy = coin.y + bob;
  const spinWidth = Math.max(0.28, Math.abs(Math.cos(time * 5.5 + coin.bobPhase)));

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(spinWidth, 1);

  // Outer gold rim
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner bright gold
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.5, 11.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shine slit
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-2, -6, 4, 12);

  ctx.restore();
}

export function drawCheckpoint(
  ctx: CanvasRenderingContext2D,
  cp: CheckpointEntity,
  camX: number,
  time: number
): void {
  const x = cp.tx * TILE_SIZE + TILE_SIZE / 2 - camX;
  const baseY = cp.ty * TILE_SIZE;

  // Pole
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(x - 2, baseY - 70, 4, 70);
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(x, baseY - 72, 5, 0, Math.PI * 2);
  ctx.fill();

  // Waving flag
  const wave = Math.sin(time * 7 + cp.id) * 2.5;
  ctx.fillStyle = cp.activated ? '#22C55E' : '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(x + 2, baseY - 68);
  ctx.lineTo(x + 30, baseY - 58 + wave);
  ctx.lineTo(x + 2, baseY - 46);
  ctx.closePath();
  ctx.fill();
}

export function drawFlagpoleAndCastle(
  ctx: CanvasRenderingContext2D,
  flagpoleTx: number,
  castleTx: number,
  camX: number,
  flagProgress: number, // 0 = top, 1 = bottom
  victoryFlagLift: number, // 0..1
  allQuestionsAnswered: boolean,
  time: number
): void {
  // Flagpole
  const px = flagpoleTx * TILE_SIZE + TILE_SIZE / 2 - camX;
  const groundY = 12 * TILE_SIZE; // top of base stone block
  const topY = 3.5 * TILE_SIZE;

  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(px - 3, topY, 6, groundY - topY);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(px + 1, topY, 2, groundY - topY);

  // Golden finial
  ctx.fillStyle = allQuestionsAnswered ? '#FACC15' : '#94A3B8';
  ctx.beginPath();
  ctx.arc(px, topY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FEF9C3';
  ctx.beginPath();
  ctx.arc(px - 2, topY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Banner flag on pole
  const flagY = topY + 14 + flagProgress * (groundY - topY - 52);
  const wave = Math.sin(time * 6) * 3;
  ctx.fillStyle = allQuestionsAnswered ? '#EF4444' : '#64748B';
  ctx.beginPath();
  ctx.moveTo(px - 3, flagY);
  ctx.lineTo(px - 44, flagY + 14 + wave);
  ctx.lineTo(px - 3, flagY + 28);
  ctx.closePath();
  ctx.fill();

  // Star on flag
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(px - 19, flagY + 14 + wave * 0.4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Grand Castle
  const cx = castleTx * TILE_SIZE - camX;
  const cy = 13 * TILE_SIZE; // sits on ground surface

  // Victory flag rising from castle roof
  if (victoryFlagLift > 0) {
    const roofPoleX = cx + 100;
    const roofBaseY = cy - 200;
    const raisedY = roofBaseY - victoryFlagLift * 44;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(roofPoleX - 2, roofBaseY - 46, 4, 46);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(roofPoleX + 2, raisedY, 34, 22);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(roofPoleX + 19, raisedY + 11, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main castle body (width 200px, height 130px)
  ctx.fillStyle = '#B45309';
  ctx.fillRect(cx, cy - 130, 200, 130);
  // Brick stone shading
  ctx.fillStyle = '#C85A17';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const bx = cx + col * 40 + (row % 2 === 0 ? 4 : 18);
      const by = cy - 124 + row * 21;
      if (bx + 26 < cx + 200) {
        ctx.fillRect(bx, by, 26, 12);
      }
    }
  }

  // Upper central keep (width 110px, height 70px above main body)
  ctx.fillStyle = '#9A3412';
  ctx.fillRect(cx + 45, cy - 200, 110, 70);
  ctx.fillStyle = '#C85A17';
  ctx.fillRect(cx + 51, cy - 194, 98, 58);

  // Battlements on lower wall
  ctx.fillStyle = '#7C2D12';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(cx + i * 36, cy - 146, 20, 18);
  }
  // Battlements on upper keep
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(cx + 45 + i * 30, cy - 216, 18, 18);
  }

  // Arched Castle Gate
  ctx.fillStyle = allQuestionsAnswered ? '#1E293B' : '#451A03';
  ctx.beginPath();
  ctx.roundRect(cx + 76, cy - 68, 48, 68, [24, 24, 0, 0]);
  ctx.fill();

  if (allQuestionsAnswered) {
    // Warm golden glow inside open gate
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(cx + 84, cy - 58, 32, 58, [16, 16, 0, 0]);
    ctx.fill();
  } else {
    // Closed wooden bars if questions remain
    ctx.fillStyle = '#78350F';
    ctx.fillRect(cx + 88, cy - 64, 5, 64);
    ctx.fillRect(cx + 105, cy - 64, 5, 64);
  }

  // Windows
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(cx + 22, cy - 95, 20, 26);
  ctx.fillRect(cx + 158, cy - 95, 20, 26);
  ctx.fillRect(cx + 90, cy - 175, 20, 26);
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyEntity,
  camX: number,
  time: number
): void {
  if (!enemy.alive && enemy.squashedTimer <= 0) return;

  const sx = enemy.x - camX;
  const sy = enemy.y;

  if (enemy.kind === 'PIRANHA') {
    if (enemy.pipeState === 'HIDDEN') return;
    const chomp = Math.sin(time * 12) > 0;
    ctx.save();
    // Clip above pipe rim
    if (enemy.baseY !== undefined) {
      ctx.beginPath();
      ctx.rect(sx - 10, 0, enemy.w + 20, enemy.baseY);
      ctx.clip();
    }
    // Green stem
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(sx + 11, sy + 20, 10, 26);
    // Red head with white spots
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 14, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sx + 9, sy + 14, 3, 0, Math.PI * 2);
    ctx.arc(sx + 23, sy + 14, 3, 0, Math.PI * 2);
    ctx.fill();
    // Teeth / mouth gap
    ctx.fillStyle = '#0F172A';
    const mouthGap = chomp ? 8 : 3;
    ctx.fillRect(sx + 8, sy, 16, mouthGap);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 9, sy, 4, 4);
    ctx.fillRect(sx + 19, sy, 4, 4);
    ctx.restore();
    return;
  }

  if (enemy.kind === 'MUSHROOM') {
    if (!enemy.alive) {
      // Squashed flat
      ctx.fillStyle = '#7C2D12';
      ctx.fillRect(sx + 2, sy + 22, 28, 10);
      ctx.fillStyle = '#FDBA74';
      ctx.fillRect(sx + 8, sy + 26, 16, 6);
      return;
    }
    const step = Math.sin(time * 12 + enemy.id) * 2;
    // Cap
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.roundRect(sx + 2, sy + 2, 28, 19, [14, 14, 4, 4]);
    ctx.fill();
    // Face
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(sx + 7, sy + 16, 18, 10);
    // Grumpy eyes
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(sx + 9, sy + 14, 4, 6);
    ctx.fillRect(sx + 19, sy + 14, 4, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 10, sy + 15, 2, 2);
    ctx.fillRect(sx + 20, sy + 15, 2, 2);
    // Feet
    ctx.fillStyle = '#451A03';
    ctx.fillRect(sx + 4, sy + 25 + step, 10, 7);
    ctx.fillRect(sx + 18, sy + 25 - step, 10, 7);
    return;
  }

  if (enemy.kind === 'BEETLE') {
    const facing = enemy.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(sx + enemy.w / 2, sy + enemy.h / 2);
    ctx.scale(facing, 1);
    const ox = -enemy.w / 2;
    const oy = -enemy.h / 2;

    if (enemy.shellMode) {
      // Retracted emerald shell
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.roundRect(ox + 2, oy + 8, 28, 22, [12, 12, 6, 6]);
      ctx.fill();
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(ox + 7, oy + 12, 18, 6);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(ox + 3, oy + 26, 26, 4);
    } else {
      const step = Math.sin(time * 10 + enemy.id) * 2;
      // Shell
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.roundRect(ox + 2, oy + 5, 22, 20, [11, 11, 4, 4]);
      ctx.fill();
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(ox + 6, oy + 9, 14, 5);
      // Head
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(ox + 25, oy + 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(ox + 26, oy + 11, 3, 4);
      // Feet
      ctx.fillStyle = '#CA8A04';
      ctx.fillRect(ox + 4, oy + 25 + step, 8, 7);
      ctx.fillRect(ox + 15, oy + 25 - step, 8, 7);
    }
    ctx.restore();
  }
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  p: PlayerRenderState,
  camX: number
): void {
  // Blink during invincibility
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 18) % 2 === 0) {
    return;
  }

  const centerX = p.x - camX + p.w / 2;
  const bottomY = p.y + p.h;

  ctx.save();
  ctx.translate(centerX, bottomY);
  ctx.scale(p.facing * p.scaleX, p.scaleY);

  const isMoving = Math.abs(p.vx) > 15;
  const runCycle = isMoving && p.grounded ? Math.sin(p.animTime * 18) : 0;
  const ox = -15;
  const oy = -38;

  // Boots
  ctx.fillStyle = '#78350F';
  if (!p.grounded) {
    ctx.fillRect(ox + 3, oy + 30, 10, 7);
    ctx.fillRect(ox + 17, oy + 27, 10, 7);
  } else {
    ctx.fillRect(ox + 4 + runCycle * 4, oy + 31, 10, 7);
    ctx.fillRect(ox + 16 - runCycle * 4, oy + 31, 10, 7);
  }

  // Blue overalls body
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(ox + 5, oy + 19, 20, 13);

  // Red shirt sleeves & chest
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(ox + 4, oy + 14, 22, 8);

  // Overall straps & gold buttons
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(ox + 7, oy + 14, 4, 8);
  ctx.fillRect(ox + 19, oy + 14, 4, 8);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(ox + 8, oy + 20, 3, 3);
  ctx.fillRect(ox + 19, oy + 20, 3, 3);

  // Arm pose
  ctx.fillStyle = '#DC2626';
  if (!p.grounded || p.celebrating) {
    // Raised victorious / jump arm
    ctx.fillRect(ox + 22, oy + 6, 6, 11);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(ox + 22, oy + 3, 6, 4);
  } else {
    ctx.fillRect(ox + 2 + runCycle * 3, oy + 16, 5, 9);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(ox + 2 + runCycle * 3, oy + 23, 5, 4);
  }

  // Head (warm skin)
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.roundRect(ox + 6, oy + 4, 18, 12, 4);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(ox + 18, oy + 7, 3, 4);

  // Classic Mustache
  ctx.fillStyle = '#451A03';
  ctx.fillRect(ox + 15, oy + 11, 10, 3);

  // Red Cap with front visor & Gold Star emblem
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.roundRect(ox + 4, oy - 1, 21, 7, [6, 6, 1, 1]);
  ctx.fill();
  // Cap brim
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(ox + 15, oy + 3, 12, 3);
  // Gold emblem
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(ox + 13, oy + 0.5, 4, 3);

  ctx.restore();
}

export function getZoneNameForTile(tx: number, zones: Array<{ startTx: number; endTx: number; name: string }>): string {
  for (const z of zones) {
    if (tx >= z.startTx && tx <= z.endTx) return z.name;
  }
  return zones[zones.length - 1].name;
}

export function isSolidTile(kind: TileKind): boolean {
  return (
    kind === 'GROUND' ||
    kind === 'GRASS' ||
    kind === 'BRICK' ||
    kind === 'STONE' ||
    kind === 'COIN_BLOCK' ||
    kind === 'USED_BLOCK' ||
    kind === 'QUESTION_BLOCK' ||
    kind === 'PIPE_TOP_L' ||
    kind === 'PIPE_TOP_R' ||
    kind === 'PIPE_BODY_L' ||
    kind === 'PIPE_BODY_R'
  );
}

export function isTileInBounds(tx: number, ty: number): boolean {
  return tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT;
}
