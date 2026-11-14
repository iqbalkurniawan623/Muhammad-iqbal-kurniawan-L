import React from 'react';
import { PRESENTATION_SLIDES } from '../game/levels';

interface PresentationModalProps {
  isOpen: boolean;
  activeSlideIdx: number;
  onSelectSlide: (idx: number) => void;
  onClose: () => void;
  onTriggerLiveDemo: (demoType: 'bfs' | 'dfs' | 'compare' | 'enemy') => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  activeSlideIdx,
  onSelectSlide,
  onClose,
  onTriggerLiveDemo,
}) => {
  if (!isOpen) return null;

  const slide = PRESENTATION_SLIDES[activeSlideIdx] ?? PRESENTATION_SLIDES[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-black/80 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="presentation-guide-title"
    >
      <div className="w-full max-w-4xl pixel-panel p-6 lg:p-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono-num text-amber-300 mb-1">
              TUGAS BESAR: DFS &amp; BFS (100 POIN) · PANDUAN PRESENTASI VIDEO MAKSIMAL 7 MENIT
            </div>
            <h2 id="presentation-guide-title" className="font-pixel text-lg lg:text-xl text-white">
              Alur Penjelasan Cara Permainan &amp; Algoritma BFS / DFS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Panduan Presentasi"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-pixel text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            TUTUP [ESC]
          </button>
        </div>

        {/* Slide Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 shrink-0">
          {PRESENTATION_SLIDES.map((s, idx) => {
            const isActive = idx === activeSlideIdx;
            return (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => onSelectSlide(idx)}
                className={`p-2.5 text-left border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/90 border-cyan-400 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-mono-num text-cyan-300">
                  BAGIAN {s.stepNumber} · {s.timeRange}
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{s.title}</div>
              </button>
            );
          })}
        </div>

        {/* Slide Body */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Talking Points */}
          <div className="lg:col-span-7 space-y-3">
            <div>
              <div className="text-xs font-mono-num text-amber-300">{slide.timeRange}</div>
              <h3 className="text-base font-bold text-white mt-0.5">{slide.title}</h3>
              <p className="text-xs text-slate-400">{slide.subtitle}</p>
            </div>

            <div className="text-xs font-mono-num text-slate-400 pt-1">
              POIN PENJELASAN SUARA SENDIRI (VOICEOVER):
            </div>
            <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
              {slide.talkingPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="font-mono-num text-xs text-cyan-400 mt-1 shrink-0">
                    0{i + 1}.
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code & Complexity Reference */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-3.5 bg-[#070913] border border-slate-800">
              <div className="text-xs font-mono-num text-cyan-300 mb-2">
                IMPLEMENTASI KODE ASLI DI GAME:
              </div>
              <pre className="text-xs font-mono-num text-slate-300 overflow-x-auto leading-relaxed">
                <code>{slide.codeSnippet}</code>
              </pre>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
              <div className="font-semibold text-white">Tabel Ringkas BFS vs DFS di Game:</div>
              <div className="text-slate-300">
                <strong className="text-cyan-300">BFS (Queue FIFO):</strong> Menjamin jalur
                terpendek (Shortest Path), menyebar lapis demi lapis. Digunakan oleh{' '}
                <em>BFS Pulse [1]</em> &amp; <em>Queue Hound AI</em>.
              </div>
              <div className="text-slate-300">
                <strong className="text-amber-300">DFS (Stack LIFO):</strong> Menelusuri satu cabang
                sampai mentok lalu Backtracking. Digunakan oleh <em>DFS Pierce [2]</em>,{' '}
                <em>Maze Generator</em>, &amp; <em>Stack Weaver AI</em>.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeSlideIdx === 0}
              onClick={() => onSelectSlide(Math.max(0, activeSlideIdx - 1))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              ← Bagian Sebelumnya
            </button>
            <button
              type="button"
              disabled={activeSlideIdx === PRESENTATION_SLIDES.length - 1}
              onClick={() =>
                onSelectSlide(Math.min(PRESENTATION_SLIDES.length - 1, activeSlideIdx + 1))
              }
              className="px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              Bagian Berikutnya →
            </button>
          </div>

          <button
            type="button"
            onClick={() => onTriggerLiveDemo(slide.demoType)}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-pixel text-xs font-bold cursor-pointer pixel-button whitespace-nowrap"
          >
            {slide.liveDemoActionLabel} →
          </button>
        </div>
      </div>
    </div>
  );
};
