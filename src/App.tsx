import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TileType,
  GridCoord,
  EnemyEntity,
  SearchResult,
  runBFS,
  runDFS,
  generateLabyrinth,
  computeEnemyTurn,
  isWalkable,
  manhattanDist,
  DIRS_4,
} from './game/algorithms';
import { LEVELS } from './game/levels';
import { soundEngine } from './game/audio';
import { PixelArtRenderer } from './game/renderer';
import { TitleScreen } from './components/TitleScreen';
import { PresentationModal } from './components/PresentationModal';
import { AlgorithmInspectorDrawer } from './components/AlgorithmInspectorDrawer';
import { StatusModals } from './components/StatusModals';

type GameShellState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  // Check ?autostart=1 on boot
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<GameShellState>(
    initialAutostart ? 'playing' : 'title'
  );
  const [outcome, setOutcome] = useState<'victory' | 'defeat' | null>(null);
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(0);

  // HUD Reactive State (only discrete turn/action changes, never 60Hz!)
  const [hp, setHp] = useState<number>(3);
  const [maxHp] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(5);
  const [maxEnergy] = useState<number>(5);
  const [moves, setMoves] = useState<number>(0);
  const [crystalsCollected, setCrystalsCollected] = useState<number>(0);
  const [crystalsRequired, setCrystalsRequired] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [bfsUses, setBfsUses] = useState<number>(0);
  const [dfsUses, setDfsUses] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [showEnemyIntent, setShowEnemyIntent] = useState<boolean>(true);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [presentationModalOpen, setPresentationModalOpen] = useState<boolean>(false);
  const [presentationSlideIdx, setPresentationSlideIdx] = useState<number>(0);

  // Active Algorithm Step-by-Step Visualization State
  const [activeAlgorithm, setActiveAlgorithm] = useState<'BFS' | 'DFS' | 'COMPARE' | null>(null);
  const [bfsResult, setBfsResult] = useState<SearchResult | null>(null);
  const [dfsResult, setDfsResult] = useState<SearchResult | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);
  const [statusBannerText, setStatusBannerText] = useState<string>(
    'Gunakan WASD / Panah atau klik petak untuk bergerak. Tekan [1] BFS Pulse atau [2] DFS Pierce.'
  );

  // End-of-run immutable snapshot for Victory/Defeat modal
  const [statsSnapshot, setStatsSnapshot] = useState({
    moves: 0,
    crystalsCollected: 0,
    crystalsRequired: 3,
    bfsUses: 0,
    dfsUses: 0,
    score: 0,
    bestScore: 0,
  });

  // Mutable Simulation Refs for 60FPS Canvas Loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelArtRenderer>(new PixelArtRenderer());
  const boardMetricsRef = useRef({
    offsetX: 0,
    offsetY: 0,
    tileSize: 36,
    boardW: 540,
    boardH: 396,
  });

  const simRef = useRef<{
    grid: TileType[][];
    playerPos: GridCoord;
    playerRenderPos: {
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      facing: number;
      hitFlash: number;
    };
    portalCoord: GridCoord;
    enemies: EnemyEntity[];
    crystalsRemaining: number;
    hoveredTile: GridCoord | null;
    cameraShake: { x: number; y: number; trauma: number };
    hitstop: number;
    titleDemoTimer: number;
  }>({
    grid: [[]],
    playerPos: { x: 1, y: 1 },
    playerRenderPos: { x: 1, y: 1, scaleX: 1, scaleY: 1, facing: 1, hitFlash: 0 },
    portalCoord: { x: 5, y: 5 },
    enemies: [],
    crystalsRemaining: 3,
    hoveredTile: null,
    cameraShake: { x: 0, y: 0, trauma: 0 },
    hitstop: 0,
    titleDemoTimer: 0,
  });

  // Keep latest state in refs for event listeners & rAF loop
  const stateRef = useRef({
    gameState,
    selectedLevelIdx,
    hp,
    energy,
    moves,
    crystalsCollected,
    crystalsRequired,
    score,
    bestScore,
    bfsUses,
    dfsUses,
    activeAlgorithm,
    bfsResult,
    dfsResult,
    stepIndex,
    isPlayingAnim,
    showEnemyIntent,
    presentationModalOpen,
    inspectorOpen,
  });
  stateRef.current = {
    gameState,
    selectedLevelIdx,
    hp,
    energy,
    moves,
    crystalsCollected,
    crystalsRequired,
    score,
    bestScore,
    bfsUses,
    dfsUses,
    activeAlgorithm,
    bfsResult,
    dfsResult,
    stepIndex,
    isPlayingAnim,
    showEnemyIntent,
    presentationModalOpen,
    inspectorOpen,
  };

  // Sync document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Initialize or reset level
  const loadLevel = useCallback((lvlIdx: number) => {
    const config = LEVELS[lvlIdx] ?? LEVELS[0];
    const generated = generateLabyrinth(config);

    simRef.current.grid = generated.grid;
    simRef.current.playerPos = { ...generated.playerStart };
    simRef.current.playerRenderPos = {
      x: generated.playerStart.x,
      y: generated.playerStart.y,
      scaleX: 1,
      scaleY: 1,
      facing: 1,
      hitFlash: 0,
    };
    simRef.current.portalCoord = generated.portalCoord;
    simRef.current.enemies = generated.enemies;
    simRef.current.crystalsRemaining = generated.crystals.length;
    simRef.current.cameraShake = { x: 0, y: 0, trauma: 0 };
    simRef.current.hitstop = 0;

    setHp(3);
    setEnergy(5);
    setMoves(0);
    setCrystalsCollected(0);
    setCrystalsRequired(generated.crystals.length);
    setBfsUses(0);
    setDfsUses(0);
    setOutcome(null);

    // Pre-compute initial BFS & DFS from start to nearest crystal or portal so Title screen & Inspector have immediate rich data
    const initialTargetPred = (_c: GridCoord, t: TileType) =>
      t === 'crystal' || t === 'portal';
    const initBfs = runBFS(generated.grid, generated.playerStart, initialTargetPred);
    const initDfs = runDFS(generated.grid, generated.playerStart, initialTargetPred, {
      preferredDirIndex: 1,
    });
    setBfsResult(initBfs);
    setDfsResult(initDfs);
    setActiveAlgorithm('BFS');
    setStepIndex(Math.max(0, initBfs.steps.length - 1));
    setIsPlayingAnim(false);
    setStatusBannerText(
      `${config.title} — Mekarkan ${generated.crystals.length} Kuncup Sakura lalu masuki Gerbang Pohon Sakura Agung.`
    );
  }, []);

  useEffect(() => {
    loadLevel(selectedLevelIdx);
  }, [selectedLevelIdx, loadLevel]);

  // Step-by-step animation timer when `isPlayingAnim` is active
  useEffect(() => {
    if (!isPlayingAnim) return;
    const activeRes =
      activeAlgorithm === 'DFS' ? dfsResult : bfsResult;
    if (!activeRes || activeRes.steps.length === 0) {
      setIsPlayingAnim(false);
      return;
    }

    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev < activeRes.steps.length - 1) {
          const nextIdx = prev + 1;
          const step = activeRes.steps[nextIdx];
          if (step) {
            if (activeAlgorithm === 'BFS') {
              const depth = step.depthMap[`${step.current.x},${step.current.y}`] ?? 0;
              if (nextIdx % 2 === 0) soundEngine.playBfsPulse(depth);
            } else if (activeAlgorithm === 'DFS') {
              const depth = step.depthMap[`${step.current.x},${step.current.y}`] ?? 0;
              if (nextIdx % 2 === 0) soundEngine.playDfsPierce(depth);
            }
          }
          return nextIdx;
        } else {
          setIsPlayingAnim(false);
          return prev;
        }
      });
    }, 85);

    return () => window.clearInterval(timer);
  }, [isPlayingAnim, activeAlgorithm, bfsResult, dfsResult]);

  // Trigger BFS Pulse [1]
  const triggerBfsPulse = useCallback(() => {
    const { grid, playerPos, crystalsRemaining, portalCoord } = simRef.current;
    const targetPred = (c: GridCoord, tile: TileType) =>
      crystalsRemaining > 0
        ? tile === 'crystal'
        : c.x === portalCoord.x && c.y === portalCoord.y;

    const bfsRes = runBFS(grid, playerPos, targetPred, { recordSteps: true });
    const dfsRes = runDFS(grid, playerPos, targetPred, {
      recordSteps: true,
      preferredDirIndex: 1,
    });

    setBfsResult(bfsRes);
    setDfsResult(dfsRes);
    setActiveAlgorithm('BFS');
    setStepIndex(0);
    setIsPlayingAnim(true);
    setBfsUses((u) => u + 1);

    soundEngine.playBfsPulse(0);
    rendererRef.current.spawnRipple(
      playerPos.x + 0.5,
      playerPos.y + 0.5,
      160,
      '#38BDF8'
    );
    rendererRef.current.spawnFloatingText(
      playerPos.x + 0.5,
      playerPos.y,
      'SIRAM EMBUN BFS!',
      '#7DD3FC'
    );

    const dist = Math.max(0, bfsRes.shortestPath.length - 1);
    setStatusBannerText(
      `Siram Embun BFS (Queue FIFO): Menemukan aliran air terpendek ${dist} petak (${bfsRes.nodesExpanded} petak disiram).`
    );
  }, []);

  // Trigger DFS Pierce [2] — Also cleaves Bramble tiles & stuns enemies along initial branch!
  const triggerDfsPierce = useCallback(() => {
    const { grid, playerPos, crystalsRemaining, portalCoord, playerRenderPos } =
      simRef.current;
    const targetPred = (c: GridCoord, tile: TileType) =>
      crystalsRemaining > 0
        ? tile === 'crystal'
        : c.x === portalCoord.x && c.y === portalCoord.y;

    const dfsRes = runDFS(grid, playerPos, targetPred, {
      recordSteps: true,
      canCrossBramble: true,
      preferredDirIndex: playerRenderPos.facing,
    });
    const bfsRes = runBFS(grid, playerPos, targetPred, { recordSteps: true });

    // Cleave any bramble tiles along the discovered DFS path and stun enemies on that path
    let cleavedCount = 0;
    let stunnedCount = 0;
    const pathCoords = dfsRes.shortestPath.slice(0, 7);
    for (const c of pathCoords) {
      if (grid[c.y]?.[c.x] === 'bramble') {
        grid[c.y][c.x] = 'floor';
        cleavedCount++;
        rendererRef.current.spawnParticles(c.x + 0.5, c.y + 0.5, 12, '#F472B6', 65);
      }
      simRef.current.enemies = simRef.current.enemies.map((en) => {
        if (en.x === c.x && en.y === c.y) {
          stunnedCount++;
          return { ...en, stunnedTurns: 3 };
        }
        return en;
      });
    }

    setDfsResult(dfsRes);
    setBfsResult(bfsRes);
    setActiveAlgorithm('DFS');
    setStepIndex(0);
    setIsPlayingAnim(true);
    setDfsUses((u) => u + 1);

    soundEngine.playDfsPierce(2);
    rendererRef.current.spawnRipple(
      playerPos.x + 0.5,
      playerPos.y + 0.5,
      140,
      '#F472B6'
    );
    rendererRef.current.spawnFloatingText(
      playerPos.x + 0.5,
      playerPos.y,
      'SULUR AKAR DFS!',
      '#FBCFE8'
    );

    const dist = Math.max(0, dfsRes.shortestPath.length - 1);
    const extraMsg =
      cleavedCount > 0 || stunnedCount > 0
        ? ` (${cleavedCount} Ranting mekar, ${stunnedCount} Roh Kabut tenang!)`
        : '';
    setStatusBannerText(
      `Sulur Akar DFS (Stack LIFO): Menjalar sedalam ${dist} petak (${dfsRes.nodesExpanded} petak diperiksa).${extraMsg}`
    );
  }, []);

  // Trigger Dual-Compare [3]
  const triggerDualCompare = useCallback(() => {
    const { grid, playerPos, crystalsRemaining, portalCoord } = simRef.current;
    const targetPred = (c: GridCoord, tile: TileType) =>
      crystalsRemaining > 0
        ? tile === 'crystal'
        : c.x === portalCoord.x && c.y === portalCoord.y;

    const bfsRes = runBFS(grid, playerPos, targetPred, { recordSteps: true });
    const dfsRes = runDFS(grid, playerPos, targetPred, {
      recordSteps: true,
      preferredDirIndex: 1,
    });

    setBfsResult(bfsRes);
    setDfsResult(dfsRes);
    setActiveAlgorithm('COMPARE');
    setIsPlayingAnim(false);
    setInspectorOpen(true);

    soundEngine.playBfsPulse(3);
    const bfsLen = Math.max(0, bfsRes.shortestPath.length - 1);
    const dfsLen = Math.max(0, dfsRes.shortestPath.length - 1);
    setStatusBannerText(
      `Perbandingan Langsung: Rute BFS = ${bfsLen} langkah (${bfsRes.nodesExpanded} simpul) vs Rute DFS = ${dfsLen} langkah (${dfsRes.nodesExpanded} simpul).`
    );
  }, []);

  // Auto-Step along BFS Shortest Path [Space / E]
  const stepPlayerTo = useCallback(
    (nx: number, ny: number, facingDir = 1) => {
      if (stateRef.current.gameState !== 'playing') return;
      const { grid, portalCoord } = simRef.current;
      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) return;

      const targetTile = grid[ny][nx];
      if (!isWalkable(targetTile, false)) {
        // Bump feedback
        simRef.current.cameraShake.trauma = 0.25;
        soundEngine.playStep(0.6);
        return;
      }

      // Move player
      simRef.current.playerPos = { x: nx, y: ny };
      simRef.current.playerRenderPos.scaleX = 1.22;
      simRef.current.playerRenderPos.scaleY = 0.78;
      simRef.current.playerRenderPos.facing = facingDir;
      soundEngine.playStep(1.0);
      rendererRef.current.spawnParticles(nx + 0.5, ny + 0.5, 5, '#38BDF8', 35);

      const newMoves = stateRef.current.moves + 1;
      setMoves(newMoves);

      let currentHp = stateRef.current.hp;
      let currentScore = stateRef.current.score;
      let currentCrystals = stateRef.current.crystalsCollected;
      const reqCrystals = stateRef.current.crystalsRequired;

      // Check Crystal pickup
      if (targetTile === 'crystal') {
        grid[ny][nx] = 'floor';
        currentCrystals += 1;
        simRef.current.crystalsRemaining = Math.max(0, reqCrystals - currentCrystals);
        currentScore += 250;
        setCrystalsCollected(currentCrystals);
        setScore(currentScore);
        soundEngine.playCrystalPickup();
        rendererRef.current.spawnParticles(nx + 0.5, ny + 0.5, 22, '#FDE047', 85);
        rendererRef.current.spawnRipple(nx + 0.5, ny + 0.5, 95, '#FDE047');
        rendererRef.current.spawnFloatingText(
          nx + 0.5,
          ny,
          '+250 SAKURA MEKAR!',
          '#FBCFE8'
        );

        if (currentCrystals >= reqCrystals) {
          setStatusBannerText(
            'Seluruh Kuncup Sakura telah mekar! Gerbang Pohon Sakura Agung terbuka — tekan [1] Air BFS untuk rute tercepat!'
          );
        }
      }

      // Check Shrine pickup
      if (targetTile === 'shrine') {
        grid[ny][nx] = 'floor';
        setEnergy(maxEnergy);
        currentScore += 100;
        setScore(currentScore);
        // Stun all enemies within Manhattan distance 5
        simRef.current.enemies = simRef.current.enemies.map((e) =>
          manhattanDist({ x: e.x, y: e.y }, { x: nx, y: ny }) <= 5
            ? { ...e, stunnedTurns: 3 }
            : e
        );
        soundEngine.playCrystalPickup();
        rendererRef.current.spawnRipple(nx + 0.5, ny + 0.5, 130, '#38BDF8');
        rendererRef.current.spawnFloatingText(
          nx + 0.5,
          ny,
          'SUMUR EMBUN: ROH TENANG!',
          '#7DD3FC'
        );
      }

      // Check Portal Victory
      if (
        nx === portalCoord.x &&
        ny === portalCoord.y &&
        currentCrystals >= reqCrystals
      ) {
        const levelCfg = LEVELS[stateRef.current.selectedLevelIdx] ?? LEVELS[0];
        const efficiencyBonus = Math.max(0, (levelCfg.parMoves - newMoves) * 15);
        const finalScore = currentScore + 500 + efficiencyBonus;
        const newBest = Math.max(stateRef.current.bestScore, finalScore);
        setScore(finalScore);
        setBestScore(newBest);
        setStatsSnapshot({
          moves: newMoves,
          crystalsCollected: currentCrystals,
          crystalsRequired: reqCrystals,
          bfsUses: stateRef.current.bfsUses,
          dfsUses: stateRef.current.dfsUses,
          score: finalScore,
          bestScore: newBest,
        });
        soundEngine.playVictoryFanfare();
        setOutcome('victory');
        setGameState('gameover');
        return;
      }

      // Advance Enemy AI Turns (BFS Stalker, DFS Weaver, Echo Warden)
      const updatedEnemies: EnemyEntity[] = [];
      for (const enemy of simRef.current.enemies) {
        const nextEnemy = computeEnemyTurn(
          enemy,
          grid,
          { x: nx, y: ny },
          simRef.current.enemies
        );

        // Check collision with player
        if (nextEnemy.x === nx && nextEnemy.y === ny) {
          currentHp = Math.max(0, currentHp - 1);
          setHp(currentHp);
          simRef.current.playerRenderPos.hitFlash = 0.15;
          simRef.current.hitstop = 0.06;
          simRef.current.cameraShake.trauma = 0.65;
          soundEngine.playHitDamage();
          rendererRef.current.spawnParticles(nx + 0.5, ny + 0.5, 24, '#F43F5E', 95);
          rendererRef.current.spawnFloatingText(
            nx + 0.5,
            ny,
            `-1 HP (${nextEnemy.name.split(' ')[0]})!`,
            '#F43F5E'
          );
          // Push enemy back slightly or stun 1 turn after hit so it doesn't perma-lock
          updatedEnemies.push({
            ...nextEnemy,
            x: enemy.x,
            y: enemy.y,
            stunnedTurns: 1,
          });
        } else {
          updatedEnemies.push(nextEnemy);
        }
      }
      simRef.current.enemies = updatedEnemies;

      // Check Defeat
      if (currentHp <= 0) {
        setStatsSnapshot({
          moves: newMoves,
          crystalsCollected: currentCrystals,
          crystalsRequired: reqCrystals,
          bfsUses: stateRef.current.bfsUses,
          dfsUses: stateRef.current.dfsUses,
          score: currentScore,
          bestScore: stateRef.current.bestScore,
        });
        setOutcome('defeat');
        setGameState('gameover');
        return;
      }

      // Update live BFS & DFS preview from new position
      const nextTargetPred = (c: GridCoord, tile: TileType) =>
        simRef.current.crystalsRemaining > 0
          ? tile === 'crystal'
          : c.x === portalCoord.x && c.y === portalCoord.y;
      const nextBfs = runBFS(grid, { x: nx, y: ny }, nextTargetPred);
      const nextDfs = runDFS(grid, { x: nx, y: ny }, nextTargetPred, {
        preferredDirIndex: facingDir,
      });
      setBfsResult(nextBfs);
      setDfsResult(nextDfs);
      if (stateRef.current.activeAlgorithm === 'BFS') {
        setStepIndex(Math.max(0, nextBfs.steps.length - 1));
      } else if (stateRef.current.activeAlgorithm === 'DFS') {
        setStepIndex(Math.max(0, nextDfs.steps.length - 1));
      }
    },
    [maxEnergy]
  );

  // Follow 1 step along BFS shortest path automatically
  const stepAlongBfsShortestPath = useCallback(() => {
    const { grid, playerPos, crystalsRemaining, portalCoord } = simRef.current;
    const targetPred = (c: GridCoord, tile: TileType) =>
      crystalsRemaining > 0
        ? tile === 'crystal'
        : c.x === portalCoord.x && c.y === portalCoord.y;
    const bfsRes = runBFS(grid, playerPos, targetPred, { recordSteps: false });
    if (bfsRes.shortestPath.length >= 2) {
      const nextStep = bfsRes.shortestPath[1];
      stepPlayerTo(nextStep.x, nextStep.y, 1);
    }
  }, [stepPlayerTo]);

  // Start Game Handshake
  const handleStartGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    loadLevel(stateRef.current.selectedLevelIdx);
    setGameState('playing');
    document.body.dataset.state = 'playing';
  }, [loadLevel]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current.gameState;

      if (stateRef.current.presentationModalOpen) {
        if (e.key === 'Escape') {
          setPresentationModalOpen(false);
        }
        return;
      }

      if (st === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (st === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (st !== 'playing') return;

      const { x, y } = simRef.current.playerPos;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        stepPlayerTo(x, y - 1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        stepPlayerTo(x + 1, y, 1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stepPlayerTo(x, y + 1, 2);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        stepPlayerTo(x - 1, y, 3);
      } else if (e.key === '1') {
        e.preventDefault();
        triggerBfsPulse();
      } else if (e.key === '2') {
        e.preventDefault();
        triggerDfsPierce();
      } else if (e.key === '3') {
        e.preventDefault();
        triggerDualCompare();
      } else if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        stepAlongBfsShortestPath();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setInspectorOpen((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        loadLevel(stateRef.current.selectedLevelIdx);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMuted((prev) => {
          soundEngine.muted = !prev;
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleStartGame,
    stepPlayerTo,
    triggerBfsPulse,
    triggerDfsPierce,
    triggerDualCompare,
    stepAlongBfsShortestPath,
    loadLevel,
  ]);

  // 60 FPS Canvas Rendering & Smooth Interpolation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let lastTime = performance.now();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const timeSec = now / 1000;

      const sim = simRef.current;
      const st = stateRef.current;

      // Hitstop & Camera Shake decay
      if (sim.hitstop > 0) {
        sim.hitstop = Math.max(0, sim.hitstop - dt);
      } else {
        // Smooth exponential damping for player & enemy positions
        const damp = 1 - Math.exp(-18 * dt);
        sim.playerRenderPos.x += (sim.playerPos.x - sim.playerRenderPos.x) * damp;
        sim.playerRenderPos.y += (sim.playerPos.y - sim.playerRenderPos.y) * damp;
        sim.playerRenderPos.scaleX += (1 - sim.playerRenderPos.scaleX) * damp;
        sim.playerRenderPos.scaleY += (1 - sim.playerRenderPos.scaleY) * damp;
        if (sim.playerRenderPos.hitFlash > 0) {
          sim.playerRenderPos.hitFlash = Math.max(0, sim.playerRenderPos.hitFlash - dt);
        }

        for (const en of sim.enemies) {
          en.renderX += (en.x - en.renderX) * damp;
          en.renderY += (en.y - en.renderY) * damp;
        }

        rendererRef.current.updateEffects(dt);
      }

      if (sim.cameraShake.trauma > 0) {
        sim.cameraShake.trauma = Math.max(0, sim.cameraShake.trauma - dt * 2.2);
        const shakeAmt = sim.cameraShake.trauma * sim.cameraShake.trauma * 10;
        sim.cameraShake.x = (Math.random() * 2 - 1) * shakeAmt;
        sim.cameraShake.y = (Math.random() * 2 - 1) * shakeAmt;
      } else {
        sim.cameraShake.x = 0;
        sim.cameraShake.y = 0;
      }

      // Determine active algorithm step to render
      const activeRes =
        st.activeAlgorithm === 'DFS' ? st.dfsResult : st.bfsResult;
      const activeStep =
        activeRes && activeRes.steps.length > 0
          ? activeRes.steps[Math.min(st.stepIndex, activeRes.steps.length - 1)]
          : null;

      const activeShortestPath =
        activeRes && (!st.isPlayingAnim || st.stepIndex >= activeRes.steps.length - 1)
          ? activeRes.shortestPath
          : [];

      const isDesktop = canvas.width >= 1100;
      const leftMarginPx =
        st.gameState === 'title' && isDesktop ? 590 : 36;
      const rightMarginPx =
        st.gameState === 'playing' && st.inspectorOpen && isDesktop ? 352 : 36;

      const metrics = rendererRef.current.renderScene(ctx, {
        width: canvas.width,
        height: canvas.height,
        time: timeSec,
        grid: sim.grid,
        playerRenderPos: sim.playerRenderPos,
        portalCoord: sim.portalCoord,
        crystalsRemaining: sim.crystalsRemaining,
        enemies: sim.enemies,
        activeStep,
        activeAlgorithm: st.activeAlgorithm,
        bfsCompareResult: st.bfsResult,
        dfsCompareResult: st.dfsResult,
        activeShortestPath,
        hoveredTile: sim.hoveredTile,
        cameraShake: sim.cameraShake,
        showEnemyIntent: st.showEnemyIntent,
        leftMarginPx,
        rightMarginPx,
      });

      boardMetricsRef.current = metrics;
      timerId = window.setTimeout(() => {
        animationFrameId = requestAnimationFrame(renderLoop);
      }, 16);
    };

    let timerId = 0;
    animationFrameId = requestAnimationFrame(renderLoop);
    return () => {
      window.clearTimeout(timerId);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Canvas Pointer Interaction (Click adjacent tile to move, or click any reachable tile to BFS-path towards it!)
  const screenToGrid = (clientX: number, clientY: number): GridCoord | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const { offsetX, offsetY, tileSize } = boardMetricsRef.current;
    const gx = Math.floor((px - offsetX) / tileSize);
    const gy = Math.floor((py - offsetY) / tileSize);
    const rows = simRef.current.grid.length;
    const cols = simRef.current.grid[0]?.length ?? 0;
    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
      return { x: gx, y: gy };
    }
    return null;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    simRef.current.hoveredTile = screenToGrid(e.clientX, e.clientY);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const clicked = screenToGrid(e.clientX, e.clientY);
    if (!clicked) return;

    const { playerPos, grid } = simRef.current;
    const dist = manhattanDist(playerPos, clicked);
    if (dist === 1) {
      const dirIdx = DIRS_4.findIndex(
        (d) => playerPos.x + d.x === clicked.x && playerPos.y + d.y === clicked.y
      );
      stepPlayerTo(clicked.x, clicked.y, dirIdx >= 0 ? dirIdx : 1);
    } else if (dist > 1 && isWalkable(grid[clicked.y]?.[clicked.x], false)) {
      // Find shortest path via BFS to the clicked tile and advance 1 step along it!
      const bfsToClick = runBFS(
        grid,
        playerPos,
        (c) => c.x === clicked.x && c.y === clicked.y,
        { recordSteps: true }
      );
      if (bfsToClick.found && bfsToClick.shortestPath.length >= 2) {
        setBfsResult(bfsToClick);
        setActiveAlgorithm('BFS');
        setStepIndex(bfsToClick.steps.length - 1);
        const firstStep = bfsToClick.shortestPath[1];
        stepPlayerTo(firstStep.x, firstStep.y, 1);
      }
    }
  };

  const currentLevelConfig = LEVELS[selectedLevelIdx] ?? LEVELS[0];
  const activeRes = activeAlgorithm === 'DFS' ? dfsResult : bfsResult;
  const currentStepObj =
    activeRes && activeRes.steps.length > 0
      ? activeRes.steps[Math.min(stepIndex, activeRes.steps.length - 1)]
      : null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070810] select-none">
      {/* Isolated Full-Viewport Pixel Art Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="labyrinth-canvas"
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        className="block w-full h-full pixel-canvas cursor-pointer"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          selectedLevelIdx={selectedLevelIdx}
          onSelectLevel={(idx) => setSelectedLevelIdx(idx)}
          onStartGame={handleStartGame}
          onOpenPresentationModal={() => setPresentationModalOpen(true)}
        />
      )}

      {/* World-Matched Low-Occlusion Perimeter HUD during Playing State */}
      {gameState === 'playing' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3.5 lg:px-6 lg:py-4">
          {/* Top Perimeter Bar: Left Vitality & Objectives | Center Level & Status | Right Utility Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Top-Left Cluster: HP Pips, Crystals, Moves */}
            <div className="pixel-panel px-4 py-2 flex items-center gap-5 pointer-events-auto">
              {/* Vitality Pips */}
              <div>
                <div className="text-[10px] font-mono-num text-slate-400">VITALITAS</div>
                <div className="flex items-center gap-1.5 mt-0.5" aria-label={`HP ${hp} dari ${maxHp}`}>
                  {Array.from({ length: maxHp }).map((_, i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      aria-hidden="true"
                    >
                      <polygon
                        points="12,2 22,9 18,21 6,21 2,9"
                        fill={i < hp ? '#F43F5E' : '#1E293B'}
                        stroke="#090A12"
                        strokeWidth="2"
                      />
                      {i < hp && (
                        <polygon points="12,5 17,9 15,15 9,15 7,9" fill="#FDA4AF" />
                      )}
                    </svg>
                  ))}
                </div>
              </div>

              <div className="h-7 w-px bg-slate-800" />

              {/* Crystals Counter */}
              <div>
                <div className="text-[10px] font-mono-num text-pink-300 whitespace-nowrap">
                  BUNGA SAKURA
                </div>
                <div className="text-lg font-mono-num font-bold text-white leading-tight whitespace-nowrap">
                  {crystalsCollected} <span className="text-xs text-slate-300">/ {crystalsRequired}</span>
                </div>
              </div>

              <div className="h-7 w-px bg-slate-700" />

              {/* Moves Counter */}
              <div>
                <div className="text-[10px] font-mono-num text-amber-300 whitespace-nowrap">
                  LANGKAH
                </div>
                <div className="text-lg font-mono-num font-bold text-white leading-tight whitespace-nowrap">
                  {Math.round(moves)}{' '}
                  <span className="text-xs text-slate-300">· PAR {currentLevelConfig.parMoves}</span>
                </div>
              </div>
            </div>

            {/* Top-Center Live Algorithm Telemetry Banner */}
            <div className="hidden xl:flex pixel-panel px-4 py-2 items-center gap-3 max-w-lg pointer-events-auto">
              <span className="font-pixel text-xs text-pink-300 shrink-0">
                PULAU 0{currentLevelConfig.id}
              </span>
              <span className="text-slate-500" aria-hidden="true">
                ·
              </span>
              <p className="text-xs text-slate-100 truncate">{statusBannerText}</p>
            </div>

            {/* Top-Right Utility Controls */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setPresentationModalOpen(true)}
                className="pixel-panel px-3 py-2 text-xs font-pixel text-amber-200 hover:border-amber-300 cursor-pointer whitespace-nowrap"
              >
                PANDUAN VIDEO [7M]
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setMuted((prev) => {
                    soundEngine.muted = !prev;
                    return !prev;
                  });
                }}
                className="pixel-panel px-3 py-2 text-xs font-mono-num text-slate-200 hover:border-pink-400 cursor-pointer whitespace-nowrap"
              >
                {muted ? 'MUTE [M]' : 'SFX [M]'}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Ulangi Pulau"
                onClick={(e) => {
                  e.currentTarget.blur();
                  loadLevel(selectedLevelIdx);
                }}
                className="pixel-panel px-3 py-2 text-xs font-mono-num text-slate-200 hover:border-pink-400 cursor-pointer whitespace-nowrap"
              >
                RESET [R]
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Jeda Permainan"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setStatsSnapshot({
                    moves,
                    crystalsCollected,
                    crystalsRequired,
                    bfsUses,
                    dfsUses,
                    score,
                    bestScore,
                  });
                  setGameState('paused');
                }}
                className="pixel-panel px-3 py-2 text-xs font-mono-num text-slate-200 hover:border-pink-400 cursor-pointer whitespace-nowrap"
              >
                JEDA [P]
              </button>
            </div>
          </div>

          {/* Bottom Unified Dock: Botanical Algorithm Abilities & Step Controls */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            {/* Left D-Pad & Quick Auto-Step */}
            <div className="pixel-panel p-2 flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                aria-label="Gerak Kiri"
                onClick={() =>
                  stepPlayerTo(
                    simRef.current.playerPos.x - 1,
                    simRef.current.playerPos.y,
                    3
                  )
                }
                className="w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-600 text-xs font-mono-num text-white cursor-pointer"
              >
                ◀
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label="Gerak Atas"
                  onClick={() =>
                    stepPlayerTo(
                      simRef.current.playerPos.x,
                      simRef.current.playerPos.y - 1,
                      0
                    )
                  }
                  className="w-9 h-8 bg-slate-900 hover:bg-slate-800 border border-slate-600 text-xs font-mono-num text-white cursor-pointer"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Gerak Bawah"
                  onClick={() =>
                    stepPlayerTo(
                      simRef.current.playerPos.x,
                      simRef.current.playerPos.y + 1,
                      2
                    )
                  }
                  className="w-9 h-8 bg-slate-900 hover:bg-slate-800 border border-slate-600 text-xs font-mono-num text-white cursor-pointer"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                aria-label="Gerak Kanan"
                onClick={() =>
                  stepPlayerTo(
                    simRef.current.playerPos.x + 1,
                    simRef.current.playerPos.y,
                    1
                  )
                }
                className="w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-600 text-xs font-mono-num text-white cursor-pointer"
              >
                ▶
              </button>

              <button
                type="button"
                onClick={stepAlongBfsShortestPath}
                className="ml-1 px-3 py-2 bg-sky-950/90 hover:bg-sky-900 border border-sky-400/80 text-xs font-mono-num text-sky-200 cursor-pointer whitespace-nowrap"
              >
                JALAN TERPENDEK BFS [SPACE]
              </button>
            </div>

            {/* Center Botanical Algorithm Deck */}
            <div className="pixel-panel p-2 flex flex-wrap items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={triggerBfsPulse}
                className={`px-3.5 py-2 border text-left transition-colors cursor-pointer ${
                  activeAlgorithm === 'BFS'
                    ? 'bg-sky-950 border-sky-400 text-white'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-sky-400'
                }`}
              >
                <div className="text-xs font-pixel text-sky-300 whitespace-nowrap">
                  [1] SIRAM EMBUN BFS · QUEUE
                </div>
                <div className="text-[11px] text-slate-200 whitespace-nowrap">
                  Riak Air Melebar &amp; Rute Terpendek (FIFO)
                </div>
              </button>

              <button
                type="button"
                onClick={triggerDfsPierce}
                className={`px-3.5 py-2 border text-left transition-colors cursor-pointer ${
                  activeAlgorithm === 'DFS'
                    ? 'bg-pink-950 border-pink-400 text-white'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-pink-400'
                }`}
              >
                <div className="text-xs font-pixel text-pink-300 whitespace-nowrap">
                  [2] SULUR AKAR DFS · STACK
                </div>
                <div className="text-[11px] text-slate-200 whitespace-nowrap">
                  Akar Menjalar &amp; Buka Ranting Kering (LIFO)
                </div>
              </button>

              <button
                type="button"
                onClick={triggerDualCompare}
                className={`px-3.5 py-2 border text-left transition-colors cursor-pointer ${
                  activeAlgorithm === 'COMPARE'
                    ? 'bg-purple-950 border-purple-400 text-white'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-purple-400'
                }`}
              >
                <div className="text-xs font-pixel text-purple-300 whitespace-nowrap">
                  [3] BANDINGKAN AIR VS AKAR
                </div>
                <div className="text-[11px] text-slate-200 whitespace-nowrap">
                  Bandingkan Sebaran BFS &amp; DFS Langsung
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowEnemyIntent((prev) => !prev)}
                className={`px-3 py-2 border text-xs font-mono-num cursor-pointer whitespace-nowrap ${
                  showEnemyIntent
                    ? 'bg-amber-950/70 border-amber-400/80 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                ARAH ROH KABUT: {showEnemyIntent ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Data Structure Inspector Drawer (Queue FIFO vs Stack LIFO) */}
      {gameState === 'playing' && (
        <AlgorithmInspectorDrawer
          isOpen={inspectorOpen}
          onToggle={() => setInspectorOpen((o) => !o)}
          activeAlgorithm={activeAlgorithm}
          activeStep={currentStepObj}
          stepIndex={stepIndex}
          totalSteps={activeRes?.steps.length ?? 0}
          isPlayingAnim={isPlayingAnim}
          onPlayPauseAnim={() => setIsPlayingAnim((p) => !p)}
          onStepForward={() =>
            setStepIndex((i) => Math.min((activeRes?.steps.length ?? 1) - 1, i + 1))
          }
          onStepBackward={() => setStepIndex((i) => Math.max(0, i - 1))}
          bfsResult={bfsResult}
          dfsResult={dfsResult}
        />
      )}

      {/* Pause, Victory, and Game Over Status Modals */}
      <StatusModals
        gameState={gameState}
        outcome={outcome}
        levelConfig={currentLevelConfig}
        statsSnapshot={statsSnapshot}
        onResume={() => setGameState('playing')}
        onRestart={() => {
          loadLevel(selectedLevelIdx);
          setGameState('playing');
        }}
        onNextLevel={() => {
          const nextIdx = (selectedLevelIdx + 1) % LEVELS.length;
          setSelectedLevelIdx(nextIdx);
          loadLevel(nextIdx);
          setGameState('playing');
        }}
        onReturnTitle={() => {
          loadLevel(selectedLevelIdx);
          setGameState('title');
        }}
        hasNextLevel={selectedLevelIdx < LEVELS.length - 1}
      />

      {/* Interactive 7-Minute Video Presentation Guide Modal */}
      <PresentationModal
        isOpen={presentationModalOpen}
        activeSlideIdx={presentationSlideIdx}
        onSelectSlide={(idx) => setPresentationSlideIdx(idx)}
        onClose={() => setPresentationModalOpen(false)}
        onTriggerLiveDemo={(demoType) => {
          setPresentationModalOpen(false);
          if (gameState !== 'playing') {
            setGameState('playing');
          }
          setInspectorOpen(true);
          if (demoType === 'bfs') {
            triggerBfsPulse();
          } else if (demoType === 'dfs') {
            triggerDfsPierce();
          } else {
            triggerDualCompare();
          }
        }}
      />
    </main>
  );
}
