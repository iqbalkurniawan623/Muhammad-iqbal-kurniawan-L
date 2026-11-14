import {
  TileType,
  GridCoord,
  EnemyEntity,
  AlgorithmStep,
  SearchResult,
  coordKey,
} from './algorithms';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface RippleWave {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export class PixelArtRenderer {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private ripples: RippleWave[] = [];
  private sakuraPetals: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    phase: number;
    size: number;
    color: string;
  }[] = [];
  private clouds: { x: number; y: number; w: number; h: number; speed: number }[] = [];

  constructor() {
    // Pre-allocated particle pool (120 particles)
    for (let i = 0; i < 120; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        color: '#F472B6',
        size: 3,
      });
    }

    for (let i = 0; i < 24; i++) {
      this.floatingTexts.push({
        active: false,
        x: 0,
        y: 0,
        vy: -22,
        text: '',
        color: '#FEF08A',
        life: 0,
        maxLife: 1,
      });
    }

    for (let i = 0; i < 16; i++) {
      this.ripples.push({
        active: false,
        x: 0,
        y: 0,
        radius: 4,
        maxRadius: 64,
        color: '#38BDF8',
        life: 0,
        maxLife: 0.6,
      });
    }

    // Floating Sakura Petals across the sky island
    for (let i = 0; i < 42; i++) {
      this.sakuraPetals.push({
        x: Math.random(),
        y: Math.random(),
        vx: 0.015 + Math.random() * 0.02,
        vy: 0.02 + Math.random() * 0.025,
        phase: Math.random() * Math.PI * 2,
        size: i % 3 === 0 ? 4 : 3,
        color:
          i % 4 === 0
            ? '#FBCFE8'
            : i % 4 === 1
            ? '#F472B6'
            : i % 4 === 2
            ? '#FEF08A'
            : '#A7F3D0',
      });
    }

    // Drifting fluff clouds in the sky backdrop
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: (i / 8) + Math.random() * 0.08,
        y: 0.08 + (i % 4) * 0.22,
        w: 90 + (i % 3) * 45,
        h: 28 + (i % 2) * 14,
        speed: 0.004 + (i % 3) * 0.002,
      });
    }
  }

  public spawnParticles(
    worldX: number,
    worldY: number,
    count: number,
    color: string,
    speed = 55
  ) {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.5;
        const mag = speed * (0.45 + Math.random() * 0.75);
        p.active = true;
        p.x = worldX;
        p.y = worldY;
        p.vx = Math.cos(angle) * mag;
        p.vy = Math.sin(angle) * mag;
        p.life = 0;
        p.maxLife = 0.35 + Math.random() * 0.35;
        p.color = color;
        p.size = Math.random() > 0.4 ? 4 : 3;
        spawned++;
      }
    }
  }

  public spawnFloatingText(worldX: number, worldY: number, text: string, color: string) {
    for (const ft of this.floatingTexts) {
      if (!ft.active) {
        ft.active = true;
        ft.x = worldX;
        ft.y = worldY;
        ft.vy = -28;
        ft.text = text;
        ft.color = color;
        ft.life = 0;
        ft.maxLife = 0.95;
        break;
      }
    }
  }

  public spawnRipple(worldX: number, worldY: number, maxRadius: number, color: string) {
    for (const r of this.ripples) {
      if (!r.active) {
        r.active = true;
        r.x = worldX;
        r.y = worldY;
        r.radius = 6;
        r.maxRadius = maxRadius;
        r.color = color;
        r.life = 0;
        r.maxLife = 0.55;
        break;
      }
    }
  }

  public updateEffects(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }

    for (const ft of this.floatingTexts) {
      if (!ft.active) continue;
      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        ft.active = false;
        continue;
      }
      ft.y += ft.vy * dt;
    }

    for (const r of this.ripples) {
      if (!r.active) continue;
      r.life += dt;
      if (r.life >= r.maxLife) {
        r.active = false;
        continue;
      }
      const progress = r.life / r.maxLife;
      r.radius = 6 + (r.maxRadius - 6) * (1 - Math.pow(1 - progress, 3));
    }
  }

  public renderScene(
    ctx: CanvasRenderingContext2D,
    params: {
      width: number;
      height: number;
      time: number;
      grid: TileType[][];
      playerRenderPos: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        facing: number;
        hitFlash: number;
      };
      portalCoord: GridCoord;
      crystalsRemaining: number;
      enemies: EnemyEntity[];
      activeStep: AlgorithmStep | null;
      activeAlgorithm: 'BFS' | 'DFS' | 'COMPARE' | null;
      bfsCompareResult: SearchResult | null;
      dfsCompareResult: SearchResult | null;
      activeShortestPath: GridCoord[];
      hoveredTile: GridCoord | null;
      cameraShake: { x: number; y: number };
      showEnemyIntent: boolean;
      rightMarginPx?: number;
      leftMarginPx?: number;
    }
  ) {
    const {
      width,
      height,
      time,
      grid,
      playerRenderPos,
      portalCoord,
      crystalsRemaining,
      enemies,
      activeStep,
      activeAlgorithm,
      bfsCompareResult,
      dfsCompareResult,
      activeShortestPath,
      hoveredTile,
      cameraShake,
      showEnemyIntent,
      rightMarginPx = 36,
      leftMarginPx = 36,
    } = params;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 1. Ghibli Sky & Sunset Cloud Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#1D2B53');
    skyGrad.addColorStop(0.55, '#334E7B');
    skyGrad.addColorStop(1, '#5C4B7D');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw drifting pixel clouds in the sky
    for (const c of this.clouds) {
      const cx = ((c.x + time * c.speed) % 1.2 - 0.1) * width;
      const cy = c.y * height;
      ctx.fillStyle = 'rgba(255, 241, 242, 0.12)';
      ctx.fillRect(Math.round(cx), Math.round(cy), c.w, c.h);
      ctx.fillRect(Math.round(cx + 14), Math.round(cy - 8), c.w - 28, 8);
    }

    const rows = grid.length;
    const cols = grid[0]?.length ?? 1;

    // Reserve safe padding around the floating island
    const padTop = 76;
    const padBottom = 104;
    const availW = Math.max(240, width - leftMarginPx - rightMarginPx);
    const availH = Math.max(200, height - padTop - padBottom);

    const rawTile = Math.min(availW / cols, availH / rows);
    const tileSize = Math.max(22, Math.min(52, Math.floor(rawTile / 2) * 2));

    const boardW = cols * tileSize;
    const boardH = rows * tileSize;
    const offsetX = Math.floor(leftMarginPx + (availW - boardW) / 2 + cameraShake.x);
    const offsetY = Math.floor(padTop + (availH - boardH) / 2 + cameraShake.y);

    // 2. Floating Sky-Island 3D Pixel Cliff Edge Underneath the Board!
    // Deep shadow in the clouds
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(offsetX - 8, offsetY + 12, boardW + 16, boardH + 22);

    // Terracotta earth cliff layers below the island
    ctx.fillStyle = '#5C3A2E';
    ctx.fillRect(offsetX - 4, offsetY + boardH, boardW + 8, 16);
    ctx.fillStyle = '#7C4D3B';
    ctx.fillRect(offsetX - 2, offsetY + boardH, boardW + 4, 9);
    // Hanging pixel vines along the cliff bottom
    for (let vx = 0; vx < cols; vx += 2) {
      const px = offsetX + vx * tileSize + 8;
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(px, offsetY + boardH, 6, 12);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(px + 1, offsetY + boardH, 4, 7);
    }

    // Outer grassy rim border around the floating island
    ctx.strokeStyle = '#86EFAC';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX - 2, offsetY - 2, boardW + 4, boardH + 4);

    // Precompute lookup sets for active algorithm visualization
    const visitedSet = new Set<string>();
    const frontierSet = new Set<string>();
    const pathSet = new Set<string>();

    if (activeStep) {
      activeStep.visited.forEach((c) => visitedSet.add(coordKey(c)));
      activeStep.frontier.forEach((c) => frontierSet.add(coordKey(c)));
    }
    activeShortestPath.forEach((c) => pathSet.add(coordKey(c)));

    const bfsCompareVisited = new Set<string>();
    const dfsCompareVisited = new Set<string>();
    if (activeAlgorithm === 'COMPARE') {
      bfsCompareResult?.visitedOrder.forEach((c) => bfsCompareVisited.add(coordKey(c)));
      dfsCompareResult?.visitedOrder.forEach((c) => dfsCompareVisited.add(coordKey(c)));
    }

    // 3. Draw Botanical Island Tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = grid[y][x];
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;
        const key = `${x},${y}`;

        this.drawBotanicalTile(ctx, tile, x, y, px, py, tileSize, time);

        // Dual Compare overlay (Aqua Dew BFS vs Sakura Vine DFS)
        if (activeAlgorithm === 'COMPARE') {
          const inBfs = bfsCompareVisited.has(key);
          const inDfs = dfsCompareVisited.has(key);
          if (inBfs && inDfs) {
            ctx.fillStyle = 'rgba(192, 132, 252, 0.34)';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
          } else if (inBfs) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.34)';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
          } else if (inDfs) {
            ctx.fillStyle = 'rgba(244, 114, 182, 0.34)';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
          }
        }

        // Single Algorithm Step Overlay (Watered Dew Tiles & Blooming Flowers!)
        if (activeStep && activeAlgorithm !== 'COMPARE') {
          const isBfs = activeAlgorithm === 'BFS';
          const depth = activeStep.depthMap[key];

          if (visitedSet.has(key)) {
            // Lush watered tile tint + tiny sprouted pixel blossom!
            ctx.fillStyle = isBfs
              ? 'rgba(14, 165, 233, 0.34)' // Crystal Aqua Dew
              : 'rgba(244, 114, 182, 0.34)'; // Sakura Pink Vine
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

            // Sprouted micro-flower in the top-left of every visited tile!
            ctx.fillStyle = isBfs ? '#7DD3FC' : '#FBCFE8';
            ctx.fillRect(px + 4, py + 4, 5, 5);
            ctx.fillStyle = '#FEF08A';
            ctx.fillRect(px + 5, py + 5, 3, 3);
          }

          if (frontierSet.has(key)) {
            const pulse = 0.6 + 0.35 * Math.sin(time * 8);
            ctx.strokeStyle = isBfs
              ? `rgba(125, 211, 252, ${pulse})`
              : `rgba(251, 207, 232, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 3, py + 3, tileSize - 6, tileSize - 6);
          }

          if (activeStep.current.x === x && activeStep.current.y === y) {
            ctx.fillStyle = isBfs ? 'rgba(56, 189, 248, 0.58)' : 'rgba(244, 114, 182, 0.58)';
            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
          }

          // Render distance / depth number inside tile
          if (depth !== undefined && (visitedSet.has(key) || frontierSet.has(key))) {
            ctx.fillStyle = '#0F172A';
            ctx.font = `bold ${Math.max(9, Math.floor(tileSize * 0.27))}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${depth}`, px + tileSize - 3, py + tileSize - 2);
            ctx.fillStyle = isBfs ? '#E0F2FE' : '#FCE7F3';
            ctx.fillText(`${depth}`, px + tileSize - 4, py + tileSize - 3);
          }
        }

        // Highlight discovered / shortest path with golden-blossom stepping stones
        if (pathSet.has(key)) {
          const isBfs = activeAlgorithm === 'BFS';
          ctx.fillStyle = isBfs
            ? 'rgba(56, 189, 248, 0.42)'
            : 'rgba(244, 114, 182, 0.42)';
          ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
        }

        // Hovered interactive tile cursor
        if (hoveredTile && hoveredTile.x === x && hoveredTile.y === y && tile !== 'wall') {
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        }
      }
    }

    // 4. Draw Dual-Compare or Single Shortest Path Streams / Vines
    if (activeAlgorithm === 'COMPARE') {
      if (bfsCompareResult && bfsCompareResult.shortestPath.length > 1) {
        this.drawPathLine(
          ctx,
          bfsCompareResult.shortestPath,
          offsetX,
          offsetY,
          tileSize,
          '#38BDF8',
          -3
        );
      }
      if (dfsCompareResult && dfsCompareResult.shortestPath.length > 1) {
        this.drawPathLine(
          ctx,
          dfsCompareResult.shortestPath,
          offsetX,
          offsetY,
          tileSize,
          '#F472B6',
          3
        );
      }
    } else if (activeShortestPath.length > 1) {
      this.drawPathLine(
        ctx,
        activeShortestPath,
        offsetX,
        offsetY,
        tileSize,
        activeAlgorithm === 'DFS' ? '#F472B6' : '#38BDF8',
        0
      );
    }

    // 5. Draw Forest Spirit Intent Paths (BFS / DFS AI Telegraphs)
    if (showEnemyIntent) {
      for (const enemy of enemies) {
        if (enemy.stunnedTurns > 0 || enemy.intentPath.length === 0) continue;
        const color =
          enemy.archetype === 'bfs_stalker'
            ? 'rgba(251, 113, 133, 0.75)'
            : enemy.archetype === 'dfs_weaver'
            ? 'rgba(192, 132, 252, 0.75)'
            : 'rgba(253, 224, 71, 0.75)';
        const fullIntent = [{ x: enemy.x, y: enemy.y }, ...enemy.intentPath];
        this.drawPathLine(ctx, fullIntent, offsetX, offsetY, tileSize, color, 0, true);
      }
    }

    // 6. Draw Collectible Sakura Lotus Buds, Sun Wells (Shrines), and Grand Sakura Tree (Portal)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = grid[y][x];
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;
        if (tile === 'crystal') {
          this.drawSakuraBudSprite(ctx, px, py, tileSize, time, x + y);
        } else if (tile === 'shrine') {
          this.drawSunWellSprite(ctx, px, py, tileSize, time);
        } else if (tile === 'portal') {
          this.drawGrandSakuraPortal(
            ctx,
            px,
            py,
            tileSize,
            time,
            crystalsRemaining === 0
          );
        }
      }
    }

    // 7. Draw Forest Spirits (Kodama / Soot Sprites)
    for (const enemy of enemies) {
      const ex = offsetX + enemy.renderX * tileSize;
      const ey = offsetY + enemy.renderY * tileSize;
      this.drawSpiritSprite(ctx, enemy, ex, ey, tileSize, time);
    }

    // 8. Draw Player Sprite (Hana the Cloud Gardener with Straw Hat & Watering Orb)
    const playerPx = offsetX + playerRenderPos.x * tileSize;
    const playerPy = offsetY + playerRenderPos.y * tileSize;
    this.drawGardenerSprite(ctx, playerPx, playerPy, tileSize, time, playerRenderPos);

    // 9. Draw Ripples, Particles & Drifting Sakura Petals
    for (const r of this.ripples) {
      if (!r.active) continue;
      const alpha = Math.max(0, 1 - r.life / r.maxLife);
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(offsetX + r.x * tileSize, offsetY + r.y * tileSize, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(
        Math.round(offsetX + p.x * tileSize - p.size / 2),
        Math.round(offsetY + p.y * tileSize - p.size / 2),
        p.size,
        p.size
      );
    }
    ctx.globalAlpha = 1;

    // Gentle Falling Sakura Petals across the island
    for (const sp of this.sakuraPetals) {
      const sx =
        offsetX +
        ((sp.x + time * sp.vx + Math.sin(time * 1.5 + sp.phase) * 0.03) % 1) * boardW;
      const sy = offsetY + ((sp.y + time * sp.vy) % 1) * boardH;
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(Math.round(sx), Math.round(sy), sp.size, sp.size);
    }
    ctx.globalAlpha = 1;

    // Floating Discovery Text
    for (const ft of this.floatingTexts) {
      if (!ft.active) continue;
      const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 12px "Silkscreen", monospace';
      ctx.textAlign = 'center';
      const tx = offsetX + ft.x * tileSize;
      const ty = offsetY + ft.y * tileSize - (ft.life / ft.maxLife) * 24;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(ft.text, tx + 1, ty + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, tx, ty);
      ctx.restore();
    }

    ctx.restore();

    return { offsetX, offsetY, tileSize, boardW, boardH };
  }

  private drawBotanicalTile(
    ctx: CanvasRenderingContext2D,
    tile: TileType,
    gx: number,
    gy: number,
    px: number,
    py: number,
    s: number,
    time: number
  ) {
    const checker = (gx + gy) % 2 === 0;

    if (tile === 'wall') {
      // Cozy Mossy Garden Hedge / Ancient Totoro Stone Block with Tiny Pink Blossoms
      ctx.fillStyle = '#1E3A2F';
      ctx.fillRect(px, py, s, s);
      // Lush canopy top
      ctx.fillStyle = checker ? '#2D5A43' : '#264E3A';
      ctx.fillRect(px + 2, py + 2, s - 4, s - 6);
      // Sunlit leaf crown highlight
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(px + 4, py + 3, s - 10, 4);
      // Bottom hedge shadow
      ctx.fillStyle = '#13261E';
      ctx.fillRect(px, py + s - 4, s, 4);

      // Decorative tiny pink sakura blossom or warm stone lantern detail on hedges
      if ((gx * 5 + gy * 9) % 4 === 0) {
        ctx.fillStyle = '#F472B6';
        ctx.fillRect(px + s - 10, py + 6, 4, 4);
        ctx.fillStyle = '#FBCFE8';
        ctx.fillRect(px + 6, py + s - 12, 4, 4);
      }
      return;
    }

    if (tile === 'water') {
      // Sparkling Sky-Mirror Pond with Lilypad
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
      const waveOffset = Math.floor(Math.sin(time * 3 + gx + gy) * 2);
      // Tiny green lilypad
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(px + 7 + waveOffset, py + Math.floor(s * 0.4), 7, 5);
      // White water sparkle
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(px + s - 10 - waveOffset, py + 6, 5, 2);
      return;
    }

    // Lush Sunlit Meadow Grass Floor (Warm Sage & Matcha Green)
    ctx.fillStyle = checker ? '#365E48' : '#2F5440';
    ctx.fillRect(px, py, s, s);

    // Subtle grass blade pixel texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

    if ((gx * 3 + gy * 7) % 3 === 0) {
      ctx.fillStyle = '#487A5E';
      ctx.fillRect(px + 5, py + 6, 3, 2);
      ctx.fillRect(px + 7, py + 4, 2, 3);
    }

    if (tile === 'bramble') {
      // Tangled Dry Thorny Vines that turn into blooming grass when cleaved by DFS Root Vine [2]!
      ctx.fillStyle = '#5C3A2E';
      ctx.fillRect(px + 4, py + 4, s - 8, s - 8);
      ctx.fillStyle = '#9A634E';
      ctx.fillRect(px + 6, py + 7, s - 12, 4);
      ctx.fillRect(px + 6, py + s - 11, s - 12, 4);
      ctx.fillStyle = '#FDBA74';
      ctx.fillRect(px + 9, py + 9, 4, 4);
      ctx.fillRect(px + s - 13, py + s - 13, 4, 4);
    }
  }

  private drawSakuraBudSprite(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    s: number,
    time: number,
    phaseOffset: number
  ) {
    const bob = Math.round(Math.sin(time * 4 + phaseOffset) * 2.5);
    const cx = px + Math.floor(s / 2);
    const cy = py + Math.floor(s / 2) + bob;
    const r = Math.floor(s * 0.3);

    // Emerald lilypad base
    ctx.fillStyle = '#15803D';
    ctx.fillRect(cx - r - 2, cy + r - 4, (r + 2) * 2, 5);

    // Glowing Sakura Lotus Blossom
    ctx.fillStyle = '#DB2777';
    ctx.fillRect(cx - r, cy - r + 2, r * 2, r * 2 - 4);
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(cx - r + 2, cy - r, r * 2 - 4, r * 2 - 2);
    ctx.fillStyle = '#FBCFE8';
    ctx.fillRect(cx - r + 4, cy - r + 2, r * 2 - 8, r - 1);
    // Golden pollen heart
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(cx - 3, cy - 3, 6, 5);
  }

  private drawSunWellSprite(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    s: number,
    time: number
  ) {
    const cx = px + Math.floor(s / 2);
    const cy = py + Math.floor(s / 2);
    const pulse = 0.65 + 0.35 * Math.sin(time * 5);

    ctx.fillStyle = `rgba(56, 189, 248, ${0.28 * pulse})`;
    ctx.fillRect(px + 4, py + 4, s - 8, s - 8);

    // Wooden bucket / stone well rim
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(cx - 8, cy - 6, 16, 12);
    // Pure aqua spring water
    ctx.fillStyle = '#0EA5E9';
    ctx.fillRect(cx - 6, cy - 4, 12, 8);
    ctx.fillStyle = '#E0F2FE';
    ctx.fillRect(cx - 3, cy - 2, 6, 4);
  }

  private drawGrandSakuraPortal(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    s: number,
    time: number,
    unlocked: boolean
  ) {
    const cx = px + Math.floor(s / 2);
    const cy = py + Math.floor(s / 2);
    const r = Math.floor(s * 0.38);

    // Traditional Torii / Grand Sakura Sanctuary Arch
    ctx.fillStyle = unlocked ? '#F43F5E' : '#64748B';
    // Top lintel beams
    ctx.fillRect(cx - r - 2, cy - r, (r + 2) * 2, 4);
    ctx.fillRect(cx - r, cy - r + 5, r * 2, 3);
    // Two pillars
    ctx.fillRect(cx - r + 2, cy - r + 4, 4, r * 2 - 4);
    ctx.fillRect(cx + r - 6, cy - r + 4, 4, r * 2 - 4);

    if (unlocked) {
      const pulse = Math.floor(Math.sin(time * 5) * 2);
      ctx.fillStyle = '#FBCFE8';
      ctx.fillRect(cx - 5, cy - 3 + pulse, 10, 10);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(cx - 3, cy - 1 + pulse, 6, 6);
    }
  }

  private drawGardenerSprite(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    s: number,
    time: number,
    playerState: { scaleX: number; scaleY: number; facing: number; hitFlash: number }
  ) {
    const cx = px + s / 2;
    const cy = py + s / 2;
    const breath = Math.sin(time * 5) * 1.2;

    ctx.save();
    ctx.translate(cx, cy + breath);
    ctx.scale(playerState.scaleX, playerState.scaleY);

    const w = Math.floor(s * 0.64);
    const h = Math.floor(s * 0.68);

    // Soft shadow on grass
    ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.fillRect(-w / 2 + 2, h / 2 - 3, w - 4, 5);

    if (playerState.hitFlash > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

    // Gardener Tunic (Cozy Cream & Sky Blue Apron)
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(-w / 2 + 2, -h / 4, w - 4, h * 0.7);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-w / 2 + 4, -h / 4 + 3, w - 8, h * 0.55);

    // Cute Face
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(-w / 2 + 3, -h / 2 + 4, w - 6, h * 0.34);
    ctx.fillStyle = '#1E293B';
    const eyeOffset = playerState.facing === 1 ? 2 : playerState.facing === 3 ? -2 : 0;
    ctx.fillRect(-4 + eyeOffset, -h / 2 + 7, 2, 3);
    ctx.fillRect(2 + eyeOffset, -h / 2 + 7, 2, 3);

    // Golden Sun Straw Hat with Pink Sakura Ribbon!
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-w / 2 - 3, -h / 2 + 1, w + 6, 4);
    ctx.fillRect(-w / 2 + 1, -h / 2 - 3, w - 2, 5);
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, 2);

    // Watering Can / Dew Orb held in hand
    ctx.fillStyle = '#7DD3FC';
    ctx.fillRect(w / 2 - 1, -2, 5, 5);

    ctx.restore();
  }

  private drawSpiritSprite(
    ctx: CanvasRenderingContext2D,
    enemy: EnemyEntity,
    px: number,
    py: number,
    s: number,
    time: number
  ) {
    const cx = px + s / 2;
    const cy = py + s / 2;
    const hover = Math.sin(time * 6 + enemy.x) * 2.2;

    ctx.save();
    ctx.translate(cx, cy + hover);

    const w = Math.floor(s * 0.58);
    const h = Math.floor(s * 0.58);

    // Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(-w / 2 + 2, h / 2 - 1, w - 4, 4);

    // Cute Soot-Sprite / Kodama Forest Spirit colors
    const badgeColor =
      enemy.archetype === 'bfs_stalker'
        ? '#38BDF8' // Aqua BFS Spirit
        : enemy.archetype === 'dfs_weaver'
        ? '#F472B6' // Pink DFS Spirit
        : '#FACC15'; // Golden Radius Spirit

    // Fluffy dark-indigo spirit body
    ctx.fillStyle = enemy.stunnedTurns > 0 ? '#64748B' : '#1E1B4B';
    ctx.fillRect(-w / 2, -h / 2 + 2, w, h - 4);
    ctx.fillRect(-w / 2 + 2, -h / 2, w - 4, h);

    // Little leaf or sprout on top of the spirit's head!
    ctx.fillStyle = badgeColor;
    ctx.fillRect(-2, -h / 2 - 4, 5, 4);

    // Big expressive studio Ghibli soot-sprite eyes!
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-6, -3, 5, 5);
    ctx.fillRect(1, -3, 5, 5);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-4, -1, 2, 2);
    ctx.fillRect(3, -1, 2, 2);

    // Algorithm tag above spirit ('BFS' or 'DFS')
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const badge =
      enemy.archetype === 'bfs_stalker'
        ? 'BFS'
        : enemy.archetype === 'dfs_weaver'
        ? 'DFS'
        : 'R-BFS';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(-14, -h / 2 - 14, 28, 10);
    ctx.fillStyle = badgeColor;
    ctx.fillText(badge, 0, -h / 2 - 6);

    if (enemy.stunnedTurns > 0) {
      ctx.fillStyle = '#FEF08A';
      ctx.fillText(`TENANG:${enemy.stunnedTurns}`, 0, h / 2 + 9);
    }

    ctx.restore();
  }

  private drawPathLine(
    ctx: CanvasRenderingContext2D,
    path: GridCoord[],
    offsetX: number,
    offsetY: number,
    tileSize: number,
    color: string,
    pixelShift = 0,
    dashed = false
  ) {
    if (path.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = dashed ? 2 : 4;
    if (dashed) {
      ctx.setLineDash([5, 5]);
    }
    ctx.beginPath();
    path.forEach((c, idx) => {
      const x = offsetX + c.x * tileSize + tileSize / 2 + pixelShift;
      const y = offsetY + c.y * tileSize + tileSize / 2 + pixelShift;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }
}
