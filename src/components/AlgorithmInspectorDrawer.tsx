import React from 'react';
import { AlgorithmStep, SearchResult } from '../game/algorithms';

interface AlgorithmInspectorDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  activeAlgorithm: 'BFS' | 'DFS' | 'COMPARE' | null;
  activeStep: AlgorithmStep | null;
  stepIndex: number;
  totalSteps: number;
  isPlayingAnim: boolean;
  onPlayPauseAnim: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  bfsResult: SearchResult | null;
  dfsResult: SearchResult | null;
}

export const AlgorithmInspectorDrawer: React.FC<AlgorithmInspectorDrawerProps> = ({
  isOpen,
  onToggle,
  activeAlgorithm,
  activeStep,
  stepIndex,
  totalSteps,
  isPlayingAnim,
  onPlayPauseAnim,
  onStepForward,
  onStepBackward,
  bfsResult,
  dfsResult,
}) => {
  if (!isOpen) {
    return (
      <div className="fixed right-4 top-20 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={onToggle}
          className="px-3.5 py-2 pixel-panel text-xs font-pixel text-pink-200 hover:border-pink-400 cursor-pointer whitespace-nowrap"
        >
          JURNAL BOTANI BFS / DFS [I]
        </button>
      </div>
    );
  }

  const frontierList = activeStep?.frontier ?? [];
  const isBfs = activeAlgorithm === 'BFS';

  return (
    <aside
      aria-label="Jurnal Botani Struktur Data BFS dan DFS"
      className="fixed right-4 top-20 bottom-24 z-20 w-80 pixel-panel p-4 flex flex-col justify-between pointer-events-auto overflow-hidden"
    >
      <div className="space-y-3 overflow-y-auto pr-1">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
          <div>
            <div className="text-[10px] font-mono-num text-pink-300">
              JURNAL STRUKTUR DATA TAMAN
            </div>
            <h2 className="font-pixel text-xs text-white">
              {activeAlgorithm === 'COMPARE'
                ? 'AIR BFS VS AKAR DFS'
                : activeAlgorithm === 'DFS'
                ? 'SULUR AKAR — STACK (LIFO)'
                : 'EMBUN AIR — QUEUE (FIFO)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Sembunyikan Jurnal"
            className="px-2 py-1 bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            [I] ×
          </button>
        </div>

        {/* Step Controls */}
        {activeAlgorithm && activeAlgorithm !== 'COMPARE' && totalSteps > 0 && (
          <div className="p-2.5 bg-slate-900/90 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-num">
              <span className="text-slate-300">LANGKAH TUMBUH</span>
              <span className="text-white font-semibold">
                {stepIndex + 1} / {totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onStepBackward}
                disabled={stepIndex <= 0}
                className="flex-1 py-1 bg-slate-800 border border-slate-600 text-xs text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={onPlayPauseAnim}
                className="flex-1 py-1 bg-pink-950 border border-pink-400 text-xs text-pink-200 font-semibold cursor-pointer"
              >
                {isPlayingAnim ? '❚❚ Jeda' : '▶ Putar'}
              </button>
              <button
                type="button"
                onClick={onStepForward}
                disabled={stepIndex >= totalSteps - 1}
                className="flex-1 py-1 bg-slate-800 border border-slate-600 text-xs text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Next ▶
              </button>
            </div>

            {activeStep && (
              <p className="text-[11px] text-slate-200 leading-snug pt-1 border-t border-slate-700">
                {activeStep.actionDescription}
              </p>
            )}
          </div>
        )}

        {/* Live Queue (FIFO) or Stack (LIFO) Contents */}
        {activeAlgorithm !== 'COMPARE' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-num">
              <span className={isBfs ? 'text-sky-300' : 'text-pink-300'}>
                {isBfs ? 'ANTREAN AIR — QUEUE (FIFO)' : 'TUMPUKAN AKAR — STACK (LIFO)'}
              </span>
              <span className="text-slate-300">{frontierList.length} petak</span>
            </div>

            <div className="text-[11px] text-slate-300">
              {isBfs
                ? 'Dequeue dari DEPAN (Kiri) · Enqueue ke BELAKANG (Kanan)'
                : 'Pop & Push pada PUNCAK STACK (Atas)'}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#111827] border border-slate-700">
              {frontierList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Tekan [1] Siram Air BFS atau [2] Sulur Akar DFS untuk melihat proses Queue/Stack...
                </span>
              ) : (
                (isBfs ? frontierList : [...frontierList].reverse()).slice(0, 18).map((c, idx) => (
                  <span
                    key={`${c.x},${c.y}-${idx}`}
                    className={`px-1.5 py-0.5 text-[11px] font-mono-num border ${
                      idx === 0
                        ? isBfs
                          ? 'bg-sky-500/30 border-sky-400 text-white font-bold'
                          : 'bg-pink-500/30 border-pink-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {idx === 0 ? (isBfs ? 'FRONT ' : 'TOP ') : ''}({c.x},{c.y})
                  </span>
                ))
              )}
            </div>
          </div>
        ) : null}

        {/* Side-by-Side Metrics Comparison Table */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-mono-num text-slate-200">
            PERBANDINGAN METRIK EKOSISTEM
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
            <div className="p-2.5 bg-sky-950/40 border border-sky-700/70">
              <div className="text-sky-300 font-bold mb-1">Air BFS (Queue)</div>
              <div className="flex justify-between text-slate-200">
                <span>Jarak Rute:</span>
                <span className="text-white font-bold">
                  {bfsResult && bfsResult.shortestPath.length > 0
                    ? bfsResult.shortestPath.length - 1
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between text-slate-200 mt-0.5">
                <span>Petak Mekar:</span>
                <span className="text-white">{bfsResult ? bfsResult.nodesExpanded : '-'}</span>
              </div>
              <div className="flex justify-between text-slate-200 mt-0.5">
                <span>Maks Queue:</span>
                <span className="text-white">{bfsResult ? bfsResult.maxFrontierSize : '-'}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-sky-200">
                Jalur Terpendek: YA
              </div>
            </div>

            <div className="p-2.5 bg-pink-950/40 border border-pink-700/70">
              <div className="text-pink-300 font-bold mb-1">Akar DFS (Stack)</div>
              <div className="flex justify-between text-slate-200">
                <span>Jarak Rute:</span>
                <span className="text-white font-bold">
                  {dfsResult && dfsResult.shortestPath.length > 0
                    ? dfsResult.shortestPath.length - 1
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between text-slate-200 mt-0.5">
                <span>Petak Mekar:</span>
                <span className="text-white">{dfsResult ? dfsResult.nodesExpanded : '-'}</span>
              </div>
              <div className="flex justify-between text-slate-200 mt-0.5">
                <span>Maks Stack:</span>
                <span className="text-white">{dfsResult ? dfsResult.maxFrontierSize : '-'}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-pink-200">
                Jalur Terpendek: TIDAK
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="pt-2.5 border-t border-slate-700 text-[11px] text-slate-300 space-y-1">
        <div className="flex items-center justify-between">
          <span>Angka pada petak rumput:</span>
          <span className="font-mono-num text-white">Jarak / Kedalaman (d)</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Garis Putus-Putus:</span>
          <span className="font-mono-num text-white">Arah Roh Kabut (BFS/DFS)</span>
        </div>
      </div>
    </aside>
  );
};
