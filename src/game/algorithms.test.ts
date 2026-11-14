import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runBFS,
  runDFS,
  generateLabyrinth,
  computeEnemyTurn,
  TileType,
  LevelConfig,
} from './algorithms';

const sampleGrid: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'crystal', 'wall', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

test('BFS finds the guaranteed shortest path in a braided grid', () => {
  const res = runBFS(
    sampleGrid,
    { x: 1, y: 1 },
    (c, tile) => tile === 'crystal',
    { recordSteps: true }
  );

  assert.equal(res.found, true);
  assert.deepEqual(res.target, { x: 3, y: 3 });
  // Shortest path: (1,1) -> (1,2) -> (1,3) -> (2,3) -> (3,3) = 5 nodes (distance 4)
  assert.equal(res.shortestPath.length, 5);
  assert.equal(res.depthMap['3,3'], 4);
  assert.ok(res.steps.length > 0);
});

test('DFS explores deeply along a branch and finds the target with step history', () => {
  const res = runDFS(
    sampleGrid,
    { x: 1, y: 1 },
    (c, tile) => tile === 'crystal',
    { recordSteps: true, preferredDirIndex: 1 } // Prefer Right first: goes all the way around top-right!
  );

  assert.equal(res.found, true);
  assert.deepEqual(res.target, { x: 3, y: 3 });
  // Because DFS preferred Right (1,1 -> 2,1 -> 3,1 -> 4,1 -> 5,1 -> 5,2 -> 5,3 -> 5,4 -> 4,4 -> 3,4 -> 3,3),
  // its discovered path is longer than BFS's shortest path!
  assert.ok(
    res.shortestPath.length > 5,
    `Expected DFS path (${res.shortestPath.length}) to be longer than BFS shortest path (5)`
  );
});

test('generateLabyrinth creates a solvable level with reachable crystals and portal', () => {
  const config: LevelConfig = {
    id: 1,
    title: 'Sanctuary of Queue',
    subtitle: 'Level 1',
    algorithmFocus: 'BFS vs DFS',
    width: 15,
    height: 11,
    crystalsRequired: 3,
    parMoves: 30,
    seed: 101,
    description: 'Test',
    tip: 'Test tip',
  };

  const level = generateLabyrinth(config);
  assert.equal(level.grid.length, 11);
  assert.equal(level.grid[0].length, 15);
  assert.equal(level.crystals.length, 3);

  // Verify portal is reachable via BFS
  const bfsToPortal = runBFS(
    level.grid,
    level.playerStart,
    (c) => c.x === level.portalCoord.x && c.y === level.portalCoord.y,
    { recordSteps: false }
  );
  assert.equal(bfsToPortal.found, true);

  // Verify player spawns with at least 2 open neighbor tiles
  const openNeighbors = [
    level.grid[1][2],
    level.grid[2][1],
  ].filter((t) => t !== 'wall' && t !== 'water');
  assert.ok(openNeighbors.length >= 2);
});

test('computeEnemyTurn advances BFS stalker along shortest path toward player', () => {
  const enemy = {
    id: 'e1',
    name: 'Queue Hound',
    archetype: 'bfs_stalker' as const,
    x: 5,
    y: 1,
    renderX: 5,
    renderY: 1,
    hp: 2,
    maxHp: 2,
    intentPath: [],
    visitedPreview: [],
    frontierPreview: [],
    stunnedTurns: 0,
    patrolDir: 0,
    dfsVisitedMemory: {},
    dfsBacktrackStack: [],
    alerted: false,
    hitFlash: 0,
  };

  const next = computeEnemyTurn(enemy, sampleGrid, { x: 1, y: 1 }, [enemy]);
  assert.equal(next.x, 4);
  assert.equal(next.y, 1);
  assert.equal(next.alerted, true);
});
