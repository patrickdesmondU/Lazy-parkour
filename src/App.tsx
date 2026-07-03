import React, { useState, useEffect } from 'react';
import { GameMode, KeyBindings, PlayerStats } from './types';
import { Sidebar } from './components/Sidebar';
import { GameCanvas } from './components/GameCanvas';
import { Coffee, Moon, Sun, Info, Sliders, Music, Award, HelpCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'lazy_parkour_stats_v1';
const KEY_BINDINGS_KEY = 'lazy_parkour_keys_v1';

const DEFAULT_STATS: PlayerStats = {
  levelIndex: 0,
  unlockedLevels: [0],
  coffeeMugs: 15, // Starts with some coffee mugs to let them browse
  highScores: {},
  completedAchievements: [],
  unlockedCosmetics: ['outfit_hoodie_gray', 'hat_none', 'slipper_socks', 'backpack_none'],
  activeCosmetics: {
    outfit: 'outfit_hoodie_gray',
    hat: 'hat_none',
    slippers: 'slipper_socks',
    backpack: 'backpack_none'
  }
};

const DEFAULT_KEY_BINDINGS: KeyBindings = {
  left: 'A',
  right: 'D',
  jump: 'Space',
  jog: 'Shift',
  crouch: 'S',
  interact: 'E',
  respawn: 'R'
};

export default function App() {
  // Load stats from LocalStorage or fallback to defaults
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read local storage:", e);
    }
    return DEFAULT_STATS;
  });

  // Load keybindings
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(() => {
    try {
      const savedKeys = localStorage.getItem(KEY_BINDINGS_KEY);
      if (savedKeys) {
        return JSON.parse(savedKeys);
      }
    } catch (e) {
      console.warn("Could not read keybindings:", e);
    }
    return DEFAULT_KEY_BINDINGS;
  });

  // Game execution modes
  const [mode, setMode] = useState<GameMode>('story');
  const [levelIndex, setLevelIndex] = useState<number>(stats.levelIndex || 0);

  // Runtime physical statistics for active level run session
  const [gameProgress, setGameProgress] = useState({
    falls: 0,
    bounces: 0,
    maxIdleTime: 0,
    slowRunCompleted: false
  });

  // Automatically save stats to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        ...stats,
        levelIndex // save last selected level
      }));
    } catch (e) {
      console.warn("Could not save to local storage:", e);
    }
  }, [stats, levelIndex]);

  // Save custom keybindings
  useEffect(() => {
    try {
      localStorage.setItem(KEY_BINDINGS_KEY, JSON.stringify(keyBindings));
    } catch (e) {
      console.warn("Could not save keybindings:", e);
    }
  }, [keyBindings]);

  // Callback to receive active statistics from physics loop inside canvas
  const handleGameStatsUpdate = (falls: number, bounces: number, idleTime: number, slowRunCompleted: boolean) => {
    setGameProgress({
      falls,
      bounces,
      maxIdleTime: idleTime,
      slowRunCompleted
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#DCD9D4] text-[#2C2C2B] flex flex-col font-sans selection:bg-[#cbdcca] border-[12px] border-[#BCB9B4] box-sizing-border" id="app-root">
      {/* Top Main Ambient Bar */}
      <header className="bg-[#E4E3E0] border-b border-[#BCB9B4] py-4 px-6 flex items-center justify-between" id="app-header">
        <div className="flex items-center gap-4">
          <div className="bg-[#2C2C2B] text-[#F5F2ED] w-10 h-10 rounded-none flex items-center justify-center font-serif italic text-xl font-bold" id="app-logo">
            Z
          </div>
          <div>
            <h1 className="text-xl font-serif italic font-light tracking-wide text-[#2C2C2B] leading-none" id="app-title">Lazy Parkour</h1>
            <p className="text-[10px] text-[#2C2C2B]/60 font-sans tracking-[0.2em] uppercase mt-1">THE LOW-EFFORT PC PLATFORMER</p>
          </div>
        </div>

        {/* Ambient Lo-fi Music Player Panel */}
        <div className="flex items-center gap-4 bg-[#F5F2ED]/60 px-4 py-2 rounded-none border border-[#BCB9B4]" id="lofi-tape-deck">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5A5A40] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5A5A40]"></span>
            </span>
            <div className="text-[9px] font-mono text-[#2C2C2B]/70 tracking-wider">
              TAPEDECK: <span className="font-bold uppercase text-[#2C2C2B]">Dreamy Pillow Beats</span>
            </div>
          </div>
          <Music className="w-3.5 h-3.5 text-[#5A5A40] animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Simple details */}
        <div className="flex items-center gap-2 text-xs font-sans tracking-widest text-[#2C2C2B]/70" id="header-details">
          <span className="uppercase text-[9px] tracking-[0.15em]">Editorial Edition</span>
          <Sun className="w-4 h-4 text-[#5A5A40]" />
        </div>
      </header>

      {/* Main Multi-panel split viewport */}
      <main className="flex-1 flex flex-col md:flex-row max-w-[1500px] w-full mx-auto p-4 md:p-6 gap-6 overflow-hidden" id="main-viewport">
        
        {/* Left Sidebar Menu */}
        <Sidebar
          stats={stats}
          setStats={setStats}
          mode={mode}
          setMode={setMode}
          levelIndex={levelIndex}
          setLevelIndex={(idx) => {
            setLevelIndex(idx);
            setGameProgress({ falls: 0, bounces: 0, maxIdleTime: 0, slowRunCompleted: false });
          }}
          keyBindings={keyBindings}
          setKeyBindings={setKeyBindings}
          gameProgress={gameProgress}
        />

        {/* Right Active Game Area */}
        <div className="flex-1 flex flex-col h-full gap-4" id="game-stage">
          
          <GameCanvas
            stats={stats}
            setStats={setStats}
            mode={mode}
            levelIndex={levelIndex}
            setLevelIndex={(idx) => {
              setLevelIndex(idx);
              setGameProgress({ falls: 0, bounces: 0, maxIdleTime: 0, slowRunCompleted: false });
            }}
            keyBindings={keyBindings}
            onGameStatsUpdate={handleGameStatsUpdate}
          />

          {/* Quick Informational Guide Cards (Bento style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="informational-bento">
            <div className="bg-[#E4E3E0] border border-[#BCB9B4] p-4 rounded-none flex items-start gap-3">
              <div className="text-xl">🛏️</div>
              <div>
                <h4 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#2C2C2B]/80 font-bold">Comical Laziness</h4>
                <p className="text-[11px] text-[#2C2C2B]/70 mt-1.5 leading-relaxed font-sans">
                  Every action has a lazy cost. Standing still for a few seconds lets your character sigh, take a nap, or yawn sleepily.
                </p>
              </div>
            </div>
            
            <div className="bg-[#E4E3E0] border border-[#BCB9B4] p-4 rounded-none flex items-start gap-3">
              <div className="text-xl">🛋️</div>
              <div>
                <h4 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#2C2C2B]/80 font-bold">Sofas & Coffee</h4>
                <p className="text-[11px] text-[#2C2C2B]/70 mt-1.5 leading-relaxed font-sans">
                  Bounce on plush sofas or sink into giant beanbags to rocket upward with zero foot strain. Sip coffee for energy.
                </p>
              </div>
            </div>

            <div className="bg-[#E4E3E0] border border-[#BCB9B4] p-4 rounded-none flex items-start gap-3">
              <div className="text-xl">👟</div>
              <div>
                <h4 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[#2C2C2B]/80 font-bold">Snooze Shop</h4>
                <p className="text-[11px] text-[#2C2C2B]/70 mt-1.5 leading-relaxed font-sans">
                  Unlock fluffy bunny slippers, oversized bathrobes, pom-pom nightcaps, or cute sleepy backpacks in the Shop tab!
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="bg-[#E4E3E0] py-4 text-center border-t border-[#BCB9B4] text-[9px] font-sans tracking-[0.2em] text-[#2C2C2B]/60 uppercase" id="global-footer">
        LAZY PARKOUR PC GAME • COMIC ABSTRACT 2.5D PHYSICS ENGINE • ZERO PRESSURE, ALL COMFORT
      </footer>
    </div>
  );
}
