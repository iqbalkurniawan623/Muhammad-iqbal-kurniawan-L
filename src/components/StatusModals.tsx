import React from 'react';
import { LevelConfig } from '../game/algorithms';

interface StatusModalsProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  outcome: 'victory' | 'defeat' | null;
  levelConfig: LevelConfig;
  statsSnapshot: {
    moves: number;
    crystalsCollected: number;
    crystalsRequired: number;
    bfsUses: number;
    dfsUses: number;
    score: number;
    bestScore: number;
  };
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onReturnTitle: () => void;
  hasNextLevel: boolean;
}

export const StatusModals: React.FC<StatusModalsProps> = ({
  gameState,
  outcome,
  levelConfig,
  statsSnapshot,
  onResume,
  onRestart,
  onNextLevel,
  onReturnTitle,
  hasNextLevel,
}) => {
  if (gameState !== 'paused' && gameState !== 'gameover') return null;

  const isVictory = gameState === 'gameover' && outcome === 'victory';
  const isDefeat = gameState === 'gameover' && outcome === 'defeat';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-status-heading"
    >
      <div className="w-full max-w-md pixel-panel-warm p-7 text-center space-y-6">
        {gameState === 'paused' && (
          <>
            <div>
              <div className="text-xs font-mono-num text-pink-300 mb-1">
                ISTIRAHAT SEJENAK DI TAMAN AWAN
              </div>
              <h2 id="modal-status-heading" className="font-pixel text-2xl text-white">
                PERMAINAN DIJEDA
              </h2>
              <p className="text-xs text-slate-300 mt-1">{levelConfig.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-left">
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">LANGKAH</div>
                <div className="text-lg font-mono-num font-bold text-white mt-0.5">
                  {Math.round(statsSnapshot.moves)}
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">SAKURA</div>
                <div className="text-lg font-mono-num font-bold text-pink-300 mt-0.5">
                  {statsSnapshot.crystalsCollected}/{statsSnapshot.crystalsRequired}
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">BFS / DFS</div>
                <div className="text-lg font-mono-num font-bold text-sky-300 mt-0.5">
                  {statsSnapshot.bfsUses} / {statsSnapshot.dfsUses}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3 bg-pink-400 hover:bg-pink-300 text-slate-950 font-pixel text-xs font-bold cursor-pointer pixel-button"
              >
                LANJUTKAN BERKEBUN [ESC]
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-pixel text-xs cursor-pointer"
              >
                ULANGI PULAU INI [R]
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-pixel text-xs cursor-pointer"
              >
                KEMBALI KE LAYAR UTAMA
              </button>
            </div>
          </>
        )}

        {isVictory && (
          <>
            <div>
              <div className="text-xs font-mono-num text-emerald-300 mb-1">
                SELURUH SAKURA MEKAR SEMPURNA!
              </div>
              <h2 id="modal-status-heading" className="font-pixel text-2xl text-pink-300">
                PULAU BERsemi KEMBALI!
              </h2>
              <p className="text-xs text-slate-200 mt-1">{levelConfig.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-left">
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">SKOR HARMONI</div>
                <div className="text-lg font-mono-num font-bold text-amber-300 mt-0.5">
                  {Math.round(statsSnapshot.score)}
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">LANGKAH</div>
                <div className="text-lg font-mono-num font-bold text-white mt-0.5">
                  {Math.round(statsSnapshot.moves)}{' '}
                  <span className="text-xs text-slate-400">/ {levelConfig.parMoves}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">REKOR</div>
                <div className="text-lg font-mono-num font-bold text-sky-300 mt-0.5">
                  {Math.round(statsSnapshot.bestScore)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {hasNextLevel ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={onNextLevel}
                  className="w-full py-3.5 bg-pink-400 hover:bg-pink-300 text-slate-950 font-pixel text-xs font-bold cursor-pointer pixel-button"
                >
                  MENUJU PULAU BERIKUTNYA [ENTER]
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className="w-full py-3.5 bg-pink-400 hover:bg-pink-300 text-slate-950 font-pixel text-xs font-bold cursor-pointer pixel-button"
                >
                  RAWAT TAMAN LAGI [ENTER]
                </button>
              )}
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-pixel text-xs cursor-pointer"
              >
                MENU UTAMA
              </button>
            </div>
          </>
        )}

        {isDefeat && (
          <>
            <div>
              <div className="text-xs font-mono-num text-amber-300 mb-1">
                HANA KELELAHAN TERKEPUNG KABUT
              </div>
              <h2 id="modal-status-heading" className="font-pixel text-2xl text-rose-300">
                BELUM SEMUA BUNGA MEKAR
              </h2>
              <p className="text-xs text-slate-200 mt-1">
                Gunakan Air BFS [1] untuk mencari jalan tercepat atau Akar DFS [2] untuk menenangkan
                Roh Kabut!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-left">
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">SAKURA</div>
                <div className="text-lg font-mono-num font-bold text-pink-300 mt-0.5">
                  {statsSnapshot.crystalsCollected}/{statsSnapshot.crystalsRequired}
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">LANGKAH</div>
                <div className="text-lg font-mono-num font-bold text-white mt-0.5">
                  {Math.round(statsSnapshot.moves)}
                </div>
              </div>
              <div className="p-3 bg-slate-900/90 border border-slate-700">
                <div className="text-[10px] font-mono-num text-slate-300">SKOR</div>
                <div className="text-lg font-mono-num font-bold text-amber-300 mt-0.5">
                  {Math.round(statsSnapshot.score)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="w-full py-3.5 bg-pink-400 hover:bg-pink-300 text-slate-950 font-pixel text-xs font-bold cursor-pointer pixel-button"
              >
                COBA LAGI [ENTER]
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-pixel text-xs cursor-pointer"
              >
                KEMBALI KE LAYAR UTAMA
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
