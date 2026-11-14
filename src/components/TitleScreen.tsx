import React from 'react';
import { LEVELS } from '../game/levels';

interface TitleScreenProps {
  selectedLevelIdx: number;
  onSelectLevel: (idx: number) => void;
  onStartGame: () => void;
  onOpenPresentationModal: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedLevelIdx,
  onSelectLevel,
  onStartGame,
  onOpenPresentationModal,
}) => {
  const currentLevel = LEVELS[selectedLevelIdx] ?? LEVELS[0];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-between px-8 lg:px-16 py-10 pointer-events-none">
      {/* Left Calm Negative Space Card for Botanical Title & Controls */}
      <div
        className="w-full max-w-xl p-7 lg:p-9 rounded-none pointer-events-auto flex flex-col justify-between"
        style={{
          background:
            'linear-gradient(135deg, rgba(24, 34, 56, 0.96) 0%, rgba(30, 41, 59, 0.93) 100%)',
          border: '2px solid #F472B6',
          boxShadow: '0 12px 0 #0F172A, 0 0 40px rgba(15, 23, 42, 0.8)',
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-3 text-xs font-mono-num text-pink-300">
            <span>TUGAS BESAR ALGORITMA GRAF</span>
            <span aria-hidden="true">·</span>
            <span>BFS (QUEUE) &amp; DFS (STACK)</span>
          </div>

          {/* Bespoke Inline SVG Pixel-Art Sakura Tree & Sky Island Title Lockup */}
          <svg
            viewBox="0 0 520 112"
            className="w-full h-auto mb-4 select-none"
            role="img"
            aria-label="Komorebi: Cloud Island Bloom"
          >
            {/* Pixel Art Blooming Sakura Tree on Floating Island Emblem */}
            <g transform="translate(6, 8)">
              {/* Floating grass & terracotta island base */}
              <rect x="12" y="66" width="56" height="8" fill="#4ADE80" />
              <rect x="16" y="74" width="48" height="10" fill="#7C4D3B" />
              <rect x="24" y="84" width="32" height="8" fill="#5C3A2E" />
              {/* Tree trunk */}
              <rect x="34" y="38" width="12" height="28" fill="#7C4D3B" />
              {/* Sakura pink blossom canopy */}
              <rect x="14" y="16" width="52" height="24" fill="#F472B6" />
              <rect x="22" y="8" width="36" height="14" fill="#FBCFE8" />
              <rect x="28" y="22" width="24" height="12" fill="#FEF08A" />
              {/* Flowing BFS Aqua Stream & DFS Pink Vine nodes */}
              <rect x="4" y="68" width="10" height="10" fill="#38BDF8" />
              <rect x="66" y="68" width="10" height="10" fill="#F472B6" />
            </g>

            {/* Pixel Typography Lockup */}
            <text
              x="98"
              y="52"
              fill="#BE185D"
              fontFamily="'Silkscreen', monospace"
              fontWeight="700"
              fontSize="42"
            >
              KOMOREBI
            </text>
            <text
              x="95"
              y="49"
              fill="#FFFDF9"
              fontFamily="'Silkscreen', monospace"
              fontWeight="700"
              fontSize="42"
            >
              KOMOREBI
            </text>
            <text
              x="98"
              y="80"
              fill="#FBCFE8"
              fontFamily="'Silkscreen', monospace"
              fontWeight="400"
              fontSize="15"
              letterSpacing="2"
            >
              CLOUD ISLAND BLOOM
            </text>
            <text
              x="98"
              y="100"
              fill="#7DD3FC"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="600"
              fontSize="11"
            >
              COZY BOTANICAL BFS (WATER QUEUE) &amp; DFS (VINE STACK) PUZZLE
            </text>
          </svg>

          <p className="text-sm text-slate-200 leading-relaxed mb-5">
            Rawat taman pulau melayang bersama <strong className="text-amber-200">Hana</strong>!
            Alirkan <strong className="text-sky-300">Siram Embun BFS (Queue FIFO)</strong> untuk
            menyiram bunga secara melebar dan menemukan rute terpendek, atau tumbuhkan{' '}
            <strong className="text-pink-300">Sulur Akar DFS (Stack LIFO)</strong> untuk membuka
            semak ranting kering.
          </p>

          {/* Island Selector Tabs */}
          <div className="mb-5">
            <div className="text-xs font-mono-num text-slate-300 mb-2">
              PILIH PULAU TAMAN LANGIT
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl, idx) => {
                const active = idx === selectedLevelIdx;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onSelectLevel(idx)}
                    className={`px-3 py-2.5 text-left transition-transform cursor-pointer border-2 ${
                      active
                        ? 'bg-pink-950/70 border-pink-400 text-white'
                        : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-pixel text-xs text-pink-300 whitespace-nowrap truncate">
                      PULAU 0{lvl.id}
                    </div>
                    <div className="text-xs font-medium text-slate-200 truncate mt-0.5">
                      {lvl.algorithmFocus.split(' ')[0]} ({lvl.width}×{lvl.height})
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 p-3 bg-slate-900/85 border border-slate-700 text-xs text-slate-200">
              <div className="font-semibold text-pink-300 mb-0.5">{currentLevel.title}</div>
              <div>{currentLevel.description}</div>
            </div>
          </div>
        </div>

        {/* Primary CTA & Tugas Besar Guide Button */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStartGame}
              className="flex-1 py-3.5 px-6 bg-pink-400 hover:bg-pink-300 text-slate-950 font-pixel text-sm font-bold tracking-wider cursor-pointer pixel-button whitespace-nowrap shrink-0 text-center"
            >
              MULAI BERKEBUN [ENTER]
            </button>

            <button
              type="button"
              onClick={onOpenPresentationModal}
              className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-amber-200 border-2 border-amber-300/80 font-pixel text-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              PANDUAN VIDEO 7 MENIT
            </button>
          </div>

          {/* Single flat control-hint line */}
          <div className="pt-2 text-xs font-mono-num text-slate-300 text-center sm:text-left">
            WASD / Klik Petak Bergerak · [1] Air BFS · [2] Akar DFS · [3] Bandingkan · Esc Jeda
          </div>
        </div>
      </div>

      {/* Right side shows the live blooming floating island */}
      <div className="hidden xl:flex flex-col items-end justify-end h-full pointer-events-none pb-4">
        <div className="px-4 py-2.5 bg-[#182238]/90 border border-slate-700 text-xs font-mono-num text-slate-200">
          <span>Pulau Interaktif: </span>
          <span className="text-sky-300">Air Embun BFS (Biru)</span>
          <span> vs </span>
          <span className="text-pink-300">Sulur Akar DFS (Sakura)</span>
        </div>
      </div>
    </div>
  );
};
