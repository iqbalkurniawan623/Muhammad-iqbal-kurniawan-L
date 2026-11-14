export type TileType = 'wall' | 'floor' | 'water' | 'bramble' | 'crystal' | 'shrine' | 'portal';

export interface GridCoord {
  x: number;
  y: number;
}

export interface AlgorithmStep {
  current: GridCoord;
  frontier: GridCoord[]; // Queue for BFS, Stack for DFS
  visited: GridCoord[];
  parentMap: Record<string, GridCoord | null>;
  depthMap: Record<string, number>;
  foundTarget?: GridCoord;
  actionDescription: string;
}

export interface SearchResult {
  algorithm: 'BFS' | 'DFS';
  start: GridCoord;
  target: GridCoord | null;
  steps: AlgorithmStep[];
  shortestPath: GridCoord[]; // Or discovered path in DFS
  visitedOrder: GridCoord[];
  depthMap: Record<string, number>;
  parentMap: Record<string, GridCoord | null>;
  nodesExpanded: number;
  maxFrontierSize: number;
  found: boolean;
}

export type EnemyArchetype = 'bfs_stalker' | 'dfs_weaver' | 'echo_warden';

export interface EnemyEntity {
  id: string;
  name: string;
  archetype: EnemyArchetype;
  x: number; // grid x
  y: number; // grid y
  renderX: number; // smooth pixel interpolation
  renderY: number;
  hp: number;
  maxHp: number;
  intentPath: GridCoord[];
  visitedPreview: GridCoord[];
  frontierPreview: GridCoord[];
  stunnedTurns: number;
  patrolDir: number; // index of direction for DFS weaver
  dfsVisitedMemory: Record<string, boolean>;
  dfsBacktrackStack: GridCoord[];
  alerted: boolean;
  hitFlash: number;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  algorithmFocus: string;
  width: number;
  height: number;
  crystalsRequired: number;
  parMoves: number;
  seed: number;
  description: string;
  tip: string;
}

export function coordKey(c: GridCoord): string {
  return `${c.x},${c.y}`;
}

export function parseCoordKey(key: string): GridCoord {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function manhattanDist(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export const DIRS_4: GridCoord[] = [
  { x: 0, y: -1 }, // Up
  { x: 1, y: 0 },  // Right
  { x: 0, y: 1 },  // Down
  { x: -1, y: 0 }, // Left
];

export function isWalkable(tile: TileType, canCrossBramble = false): boolean {
  if (tile === 'wall' || tile === 'water') return false;
  if (tile === 'bramble' && !canCrossBramble) return false;
  return true;
}

/**
 * Pure Breadth-First Search (BFS) using a FIFO Queue.
 * Guarantees shortest path in unweighted grids and explores in concentric ripples.
 */
export function runBFS(
  grid: TileType[][],
  start: GridCoord,
  targetPredicate: (coord: GridCoord, tile: TileType) => boolean,
  options: { maxDepth?: number; canCrossBramble?: boolean; recordSteps?: boolean } = {}
): SearchResult {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const maxDepth = options.maxDepth ?? Infinity;
  const canCrossBramble = options.canCrossBramble ?? false;
  const recordSteps = options.recordSteps ?? true;

  const queue: GridCoord[] = [start];
  const visitedSet = new Set<string>([coordKey(start)]);
  const visitedOrder: GridCoord[] = [];
  const parentMap: Record<string, GridCoord | null> = { [coordKey(start)]: null };
  const depthMap: Record<string, number> = { [coordKey(start)]: 0 };
  const steps: AlgorithmStep[] = [];

  let foundTarget: GridCoord | null = null;
  let maxFrontierSize = 1;

  while (queue.length > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, queue.length);
    // FIFO Dequeue from front
    const current = queue.shift()!;
    const cKey = coordKey(current);
    const currentDepth = depthMap[cKey] ?? 0;
    visitedOrder.push(current);

    const tile = grid[current.y]?.[current.x];
    const isTarget =
      (current.x !== start.x || current.y !== start.y) &&
      tile !== undefined &&
      targetPredicate(current, tile);

    if (recordSteps) {
      steps.push({
        current,
        frontier: [...queue],
        visited: [...visitedOrder],
        parentMap: { ...parentMap },
        depthMap: { ...depthMap },
        foundTarget: isTarget ? current : undefined,
        actionDescription: isTarget
          ? `BFS menemukan target di (${current.x}, ${current.y}) pada jarak ${currentDepth} langkah!`
          : `Dequeue (${current.x}, ${current.y}) [Lapis ${currentDepth}] dari depan Queue.`,
      });
    }

    if (isTarget) {
      foundTarget = current;
      break;
    }

    if (currentDepth >= maxDepth) {
      continue;
    }

    for (const d of DIRS_4) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nKey = `${nx},${ny}`;
      if (visitedSet.has(nKey)) continue;

      const nTile = grid[ny][nx];
      if (!isWalkable(nTile, canCrossBramble)) continue;

      visitedSet.add(nKey);
      parentMap[nKey] = current;
      depthMap[nKey] = currentDepth + 1;
      queue.push({ x: nx, y: ny });
    }
  }

  const shortestPath: GridCoord[] = [];
  if (foundTarget) {
    let curr: GridCoord | null = foundTarget;
    while (curr) {
      shortestPath.unshift(curr);
      curr = parentMap[coordKey(curr)] ?? null;
    }
  }

  return {
    algorithm: 'BFS',
    start,
    target: foundTarget,
    steps,
    shortestPath,
    visitedOrder,
    depthMap,
    parentMap,
    nodesExpanded: visitedOrder.length,
    maxFrontierSize,
    found: foundTarget !== null,
  };
}

/**
 * Pure Depth-First Search (DFS) using an explicit LIFO Stack.
 * Dives deep along a single branch before backtracking.
 */
export function runDFS(
  grid: TileType[][],
  start: GridCoord,
  targetPredicate: (coord: GridCoord, tile: TileType) => boolean,
  options: {
    maxDepth?: number;
    canCrossBramble?: boolean;
    recordSteps?: boolean;
    preferredDirIndex?: number;
  } = {}
): SearchResult {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const maxDepth = options.maxDepth ?? Infinity;
  const canCrossBramble = options.canCrossBramble ?? false;
  const recordSteps = options.recordSteps ?? true;
  const preferredDirIndex = options.preferredDirIndex ?? 0;

  const stack: GridCoord[] = [start];
  const visitedSet = new Set<string>();
  const visitedOrder: GridCoord[] = [];
  const parentMap: Record<string, GridCoord | null> = { [coordKey(start)]: null };
  const depthMap: Record<string, number> = { [coordKey(start)]: 0 };
  const steps: AlgorithmStep[] = [];

  let foundTarget: GridCoord | null = null;
  let maxFrontierSize = 1;

  // Order directions so preferred direction is pushed LAST (and therefore popped FIRST in LIFO Stack)
  const orderedDirs: GridCoord[] = [];
  for (let i = 3; i >= 0; i--) {
    orderedDirs.push(DIRS_4[(preferredDirIndex + i) % 4]);
  }

  while (stack.length > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, stack.length);
    // LIFO Pop from top of stack
    const current = stack.pop()!;
    const cKey = coordKey(current);

    if (visitedSet.has(cKey)) continue;
    visitedSet.add(cKey);
    visitedOrder.push(current);

    const currentDepth = depthMap[cKey] ?? 0;
    const tile = grid[current.y]?.[current.x];
    const isTarget =
      (current.x !== start.x || current.y !== start.y) &&
      tile !== undefined &&
      targetPredicate(current, tile);

    if (recordSteps) {
      steps.push({
        current,
        frontier: [...stack],
        visited: [...visitedOrder],
        parentMap: { ...parentMap },
        depthMap: { ...depthMap },
        foundTarget: isTarget ? current : undefined,
        actionDescription: isTarget
          ? `DFS menembus target di (${current.x}, ${current.y}) pada kedalaman ${currentDepth}!`
          : `Pop (${current.x}, ${current.y}) [Kedalaman ${currentDepth}] dari puncak Stack.`,
      });
    }

    if (isTarget) {
      foundTarget = current;
      break;
    }

    if (currentDepth >= maxDepth) {
      continue;
    }

    for (const d of orderedDirs) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nKey = `${nx},${ny}`;
      if (visitedSet.has(nKey)) continue;

      const nTile = grid[ny][nx];
      if (!isWalkable(nTile, canCrossBramble)) continue;

      if (!(nKey in parentMap)) {
        parentMap[nKey] = current;
        depthMap[nKey] = currentDepth + 1;
      }
      // Remove any earlier instance in stack so top of stack reflects most recent discovery without duplicate clutter
      const existingIdx = stack.findIndex((item) => item.x === nx && item.y === ny);
      if (existingIdx !== -1) {
        stack.splice(existingIdx, 1);
      }
      stack.push({ x: nx, y: ny });
    }
  }

  const discoveredPath: GridCoord[] = [];
  if (foundTarget) {
    let curr: GridCoord | null = foundTarget;
    const guard = new Set<string>();
    while (curr && !guard.has(coordKey(curr))) {
      guard.add(coordKey(curr));
      discoveredPath.unshift(curr);
      curr = parentMap[coordKey(curr)] ?? null;
    }
  }

  return {
    algorithm: 'DFS',
    start,
    target: foundTarget,
    steps,
    shortestPath: discoveredPath,
    visitedOrder,
    depthMap,
    parentMap,
    nodesExpanded: visitedOrder.length,
    maxFrontierSize,
    found: foundTarget !== null,
  };
}

/**
 * Deterministic PRNG for procedural level generation
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates an organic pixel-art labyrinth using Randomized Recursive Backtracker (DFS)
 * plus room carving, crystal placement, bramble shortcuts (for DFS Dash), and BFS solvability verification.
 */
export function generateLabyrinth(config: LevelConfig): {
  grid: TileType[][];
  playerStart: GridCoord;
  portalCoord: GridCoord;
  crystals: GridCoord[];
  shrines: GridCoord[];
  enemies: EnemyEntity[];
} {
  const { width, height, seed, crystalsRequired } = config;
  const rng = createSeededRandom(seed);

  // Initialize with walls
  const grid: TileType[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'wall' as TileType)
  );

  // Carve maze on odd coordinates using Randomized DFS
  const startCell: GridCoord = { x: 1, y: 1 };
  grid[startCell.y][startCell.x] = 'floor';
  const stack: GridCoord[] = [startCell];

  while (stack.length > 0) {
    const curr = stack[stack.length - 1];
    const unvisitedNeighbors: { next: GridCoord; between: GridCoord }[] = [];

    for (const d of DIRS_4) {
      const nx = curr.x + d.x * 2;
      const ny = curr.y + d.y * 2;
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
        if (grid[ny][nx] === 'wall') {
          unvisitedNeighbors.push({
            next: { x: nx, y: ny },
            between: { x: curr.x + d.x, y: curr.y + d.y },
          });
        }
      }
    }

    if (unvisitedNeighbors.length > 0) {
      const idx = Math.floor(rng() * unvisitedNeighbors.length);
      const chosen = unvisitedNeighbors[idx];
      grid[chosen.between.y][chosen.between.x] = 'floor';
      grid[chosen.next.y][chosen.next.x] = 'floor';
      stack.push(chosen.next);
    } else {
      stack.pop();
    }
  }

  // Ensure player start (1,1) has at least 2 open neighbor tiles so player never spawns facing a dead-end wall
  grid[1][1] = 'floor';
  grid[1][2] = 'floor';
  grid[2][1] = 'floor';
  grid[2][2] = 'floor';

  // Add braided loops (open ~28% of internal walls) so BFS vs DFS path differences are visually dramatic!
  // In a tree maze there is only 1 unique path; in a braided labyrinth with loops, DFS takes long winding paths while BFS finds the true shortest path!
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (grid[y][x] === 'wall') {
        const horizFloor = grid[y][x - 1] === 'floor' && grid[y][x + 1] === 'floor';
        const vertFloor = grid[y - 1][x] === 'floor' && grid[y + 1][x] === 'floor';
        if ((horizFloor || vertFloor) && rng() < 0.34) {
          grid[y][x] = rng() < 0.22 ? 'bramble' : 'floor';
        }
      }
    }
  }

  // Carve 2 small sanctuary rooms (2x2 or 3x3) for visual breathing room and tactical play
  const rooms = [
    { cx: Math.floor(width / 2), cy: Math.floor(height / 2) },
    { cx: width - 4, cy: 3 },
  ];
  for (const r of rooms) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const rx = Math.max(1, Math.min(width - 2, r.cx + dx));
        const ry = Math.max(1, Math.min(height - 2, r.cy + dy));
        grid[ry][rx] = 'floor';
      }
    }
  }

  // Place some underground glowing water pools in corners of walls that don't block connectivity
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (grid[y][x] === 'wall' && rng() < 0.14) {
        grid[y][x] = 'water';
      }
    }
  }

  const playerStart: GridCoord = { x: 1, y: 1 };

  // Run BFS from playerStart to find all reachable floor tiles and their exact shortest distances
  const allReachable = runBFS(grid, playerStart, () => false, { recordSteps: false });
  const reachableCoords = allReachable.visitedOrder.filter(
    (c) => (c.x !== playerStart.x || c.y !== playerStart.y) && grid[c.y][c.x] === 'floor'
  );

  // Sort reachable coords by distance from start
  reachableCoords.sort((a, b) => {
    const da = allReachable.depthMap[coordKey(a)] ?? 0;
    const db = allReachable.depthMap[coordKey(b)] ?? 0;
    return db - da; // Farthest first
  });

  // Portal is at the farthest reachable coordinate
  const portalCoord = reachableCoords[0] ?? { x: width - 2, y: height - 2 };
  grid[portalCoord.y][portalCoord.x] = 'portal';

  // Pick crystals spread across different regions of the labyrinth
  const crystals: GridCoord[] = [];
  const stepStride = Math.max(1, Math.floor((reachableCoords.length - 4) / (crystalsRequired + 1)));
  for (let i = 1; i <= crystalsRequired; i++) {
    const candidateIdx = Math.min(reachableCoords.length - 1, i * stepStride);
    const c = reachableCoords[candidateIdx];
    if (c && (c.x !== portalCoord.x || c.y !== portalCoord.y)) {
      grid[c.y][c.x] = 'crystal';
      crystals.push(c);
    }
  }

  // Place 2 Lumen Shrines (refills energy & stuns nearby enemies)
  const shrines: GridCoord[] = [];
  const shrineIndices = [
    Math.floor(reachableCoords.length * 0.35),
    Math.floor(reachableCoords.length * 0.68),
  ];
  for (const idx of shrineIndices) {
    const c = reachableCoords[idx];
    if (
      c &&
      grid[c.y][c.x] === 'floor' &&
      manhattanDist(c, playerStart) > 3
    ) {
      grid[c.y][c.x] = 'shrine';
      shrines.push(c);
    }
  }

  // Spawn enemies based on level id
  const enemies: EnemyEntity[] = [];
  const enemyConfigs: { archetype: EnemyArchetype; name: string; ratio: number }[] = [
    { archetype: 'bfs_stalker', name: 'Queue Hound (BFS)', ratio: 0.25 },
    { archetype: 'dfs_weaver', name: 'Stack Weaver (DFS)', ratio: 0.55 },
  ];
  if (config.id >= 2) {
    enemyConfigs.push({ archetype: 'echo_warden', name: 'Echo Warden (Radius BFS)', ratio: 0.15 });
  }
  if (config.id >= 3) {
    enemyConfigs.push({ archetype: 'bfs_stalker', name: 'Abyss Stalker (BFS)', ratio: 0.42 });
  }

  enemyConfigs.forEach((ec, index) => {
    const idx = Math.min(reachableCoords.length - 1, Math.floor(reachableCoords.length * ec.ratio) + index);
    const spawn = reachableCoords[idx];
    if (spawn && manhattanDist(spawn, playerStart) >= 5) {
      enemies.push({
        id: `enemy-${config.id}-${index}`,
        name: ec.name,
        archetype: ec.archetype,
        x: spawn.x,
        y: spawn.y,
        renderX: spawn.x,
        renderY: spawn.y,
        hp: 2,
        maxHp: 2,
        intentPath: [],
        visitedPreview: [],
        frontierPreview: [],
        stunnedTurns: 0,
        patrolDir: index % 4,
        dfsVisitedMemory: { [coordKey(spawn)]: true },
        dfsBacktrackStack: [spawn],
        alerted: false,
        hitFlash: 0,
      });
    }
  });

  return {
    grid,
    playerStart,
    portalCoord,
    crystals,
    shrines,
    enemies,
  };
}

/**
 * Computes next enemy move & intent visualization using genuine BFS or DFS
 */
export function computeEnemyTurn(
  enemy: EnemyEntity,
  grid: TileType[][],
  playerPos: GridCoord,
  allEnemies: EnemyEntity[]
): EnemyEntity {
  if (enemy.stunnedTurns > 0) {
    return {
      ...enemy,
      stunnedTurns: enemy.stunnedTurns - 1,
      intentPath: [],
      visitedPreview: [],
      frontierPreview: [],
    };
  }

  const occupiedByOthers = new Set<string>(
    allEnemies.filter((e) => e.id !== enemy.id).map((e) => `${e.x},${e.y}`)
  );

  if (enemy.archetype === 'bfs_stalker') {
    // Uses true BFS shortest path toward player
    const bfsRes = runBFS(
      grid,
      { x: enemy.x, y: enemy.y },
      (c) => c.x === playerPos.x && c.y === playerPos.y,
      { maxDepth: 12, recordSteps: false }
    );

    const path = bfsRes.shortestPath;
    let nextCoord = { x: enemy.x, y: enemy.y };
    if (path.length >= 2) {
      const stepCandidate = path[1];
      if (!occupiedByOthers.has(coordKey(stepCandidate))) {
        nextCoord = stepCandidate;
      }
    }

    return {
      ...enemy,
      x: nextCoord.x,
      y: nextCoord.y,
      intentPath: path.slice(1, 6),
      visitedPreview: bfsRes.visitedOrder.slice(0, 18),
      frontierPreview: [],
      alerted: bfsRes.found && path.length <= 7,
    };
  }

  if (enemy.archetype === 'dfs_weaver') {
    // Uses true DFS exploration: dives deep down corridors before backtracking
    const dfsRes = runDFS(
      grid,
      { x: enemy.x, y: enemy.y },
      (c) => c.x === playerPos.x && c.y === playerPos.y,
      { maxDepth: 10, recordSteps: false, preferredDirIndex: enemy.patrolDir }
    );

    // Choose next tile using explicit DFS memory stack so it patrols like a real DFS traversal
    const currentCoord = { x: enemy.x, y: enemy.y };
    const newVisited = { ...enemy.dfsVisitedMemory, [coordKey(currentCoord)]: true };
    const newStack = [...enemy.dfsBacktrackStack];

    let nextCoord: GridCoord | null = null;
    let nextDir = enemy.patrolDir;

    for (let i = 0; i < 4; i++) {
      const dirIdx = (enemy.patrolDir + i) % 4;
      const d = DIRS_4[dirIdx];
      const nx = enemy.x + d.x;
      const ny = enemy.y + d.y;
      const nKey = `${nx},${ny}`;
      if (
        ny >= 0 &&
        ny < grid.length &&
        nx >= 0 &&
        nx < grid[0].length &&
        isWalkable(grid[ny][nx], false) &&
        !newVisited[nKey] &&
        !occupiedByOthers.has(nKey)
      ) {
        nextCoord = { x: nx, y: ny };
        nextDir = dirIdx;
        break;
      }
    }

    if (nextCoord) {
      newStack.push(nextCoord);
    } else if (newStack.length > 1) {
      // Backtrack along stack!
      newStack.pop();
      const backtrackCandidate = newStack[newStack.length - 1];
      if (!occupiedByOthers.has(coordKey(backtrackCandidate))) {
        nextCoord = backtrackCandidate;
      }
    } else {
      // Reset memory once full component explored
      const resetNeighbors = DIRS_4.map((d, idx) => ({
        c: { x: enemy.x + d.x, y: enemy.y + d.y },
        idx,
      })).filter(
        ({ c }) =>
          c.y >= 0 &&
          c.y < grid.length &&
          c.x >= 0 &&
          c.x < grid[0].length &&
          isWalkable(grid[c.y][c.x], false)
      );
      if (resetNeighbors.length > 0) {
        nextCoord = resetNeighbors[0].c;
        nextDir = resetNeighbors[0].idx;
      }
      return {
        ...enemy,
        x: nextCoord?.x ?? enemy.x,
        y: nextCoord?.y ?? enemy.y,
        patrolDir: nextDir,
        dfsVisitedMemory: { [coordKey(nextCoord ?? currentCoord)]: true },
        dfsBacktrackStack: [nextCoord ?? currentCoord],
        intentPath: dfsRes.visitedOrder.slice(1, 6),
        visitedPreview: dfsRes.visitedOrder.slice(0, 14),
        alerted: dfsRes.found,
      };
    }

    const finalCoord = nextCoord ?? currentCoord;
    return {
      ...enemy,
      x: finalCoord.x,
      y: finalCoord.y,
      patrolDir: nextDir,
      dfsVisitedMemory: newVisited,
      dfsBacktrackStack: newStack,
      intentPath: dfsRes.shortestPath.length > 1 ? dfsRes.shortestPath.slice(1, 6) : dfsRes.visitedOrder.slice(1, 5),
      visitedPreview: dfsRes.visitedOrder.slice(0, 16),
      alerted: manhattanDist(finalCoord, playerPos) <= 4,
    };
  }

  // 'echo_warden': Area-denial Sentinel using Depth-Limited BFS Radius (Depth <= 4)
  const wardenBfs = runBFS(
    grid,
    { x: enemy.x, y: enemy.y },
    (c) => c.x === playerPos.x && c.y === playerPos.y,
    { maxDepth: 4, recordSteps: false }
  );

  let nextCoord = { x: enemy.x, y: enemy.y };
  if (wardenBfs.found && wardenBfs.shortestPath.length >= 2) {
    const candidate = wardenBfs.shortestPath[1];
    if (!occupiedByOthers.has(coordKey(candidate))) {
      nextCoord = candidate;
    }
  }

  return {
    ...enemy,
    x: nextCoord.x,
    y: nextCoord.y,
    intentPath: wardenBfs.shortestPath.slice(1),
    visitedPreview: wardenBfs.visitedOrder,
    alerted: wardenBfs.found,
  };
}
