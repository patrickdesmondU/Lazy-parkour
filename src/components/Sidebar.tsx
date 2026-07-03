import React, { useState } from 'react';
import { GameMode, KeyBindings, PlayerStats, CosmeticItem, Achievement } from '../types';
import { LEVELS, COSMETIC_SHOP, ACHIEVEMENTS } from '../data';
import { Lock, Check, Coffee, Award, Sliders, Map, ShoppingBag, RotateCcw } from 'lucide-react';

interface SidebarProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  levelIndex: number;
  setLevelIndex: (idx: number) => void;
  keyBindings: KeyBindings;
  setKeyBindings: React.Dispatch<React.SetStateAction<KeyBindings>>;
  gameProgress: {
    falls: number;
    bounces: number;
    maxIdleTime: number;
    slowRunCompleted: boolean;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  stats,
  setStats,
  mode,
  setMode,
  levelIndex,
  setLevelIndex,
  keyBindings,
  setKeyBindings,
  gameProgress
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'shop' | 'achievements' | 'controls'>('levels');
  const [bindingKey, setBindingKey] = useState<keyof KeyBindings | null>(null);

  // Parse time to friendly text
  const formatTime = (ms: number | undefined): string => {
    if (ms === undefined) return 'No Time';
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s}s`;
  };

  // Cosmetic purchase logic
  const handlePurchaseCosmetic = (item: CosmeticItem) => {
    if (stats.unlockedCosmetics.includes(item.id)) {
      // Equip if already unlocked
      setStats(prev => ({
        ...prev,
        activeCosmetics: {
          ...prev.activeCosmetics,
          [item.category]: item.id
        }
      }));
      return;
    }

    if (stats.coffeeMugs >= item.price) {
      // Buy and equip
      setStats(prev => ({
        ...prev,
        coffeeMugs: prev.coffeeMugs - item.price,
        unlockedCosmetics: [...prev.unlockedCosmetics, item.id],
        activeCosmetics: {
          ...prev.activeCosmetics,
          [item.category]: item.id
        }
      }));
    } else {
      alert("You need more Coffee Mugs! Complete levels or achieve goals to brew more caffeine.");
    }
  };

  // Capture user key bindings
  const handleStartBinding = (key: keyof KeyBindings) => {
    setBindingKey(key);
  };

  const handleKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!bindingKey) return;
    e.preventDefault();
    const pressedKey = e.key === ' ' ? 'Space' : e.key;
    
    setKeyBindings(prev => ({
      ...prev,
      [bindingKey]: pressedKey
    }));
    setBindingKey(null);
  };

  const resetDefaultKeyBindings = () => {
    setKeyBindings({
      left: 'A',
      right: 'D',
      jump: 'Space',
      jog: 'Shift',
      crouch: 'S',
      interact: 'E',
      respawn: 'R'
    });
  };

  return (
    <div className="flex flex-col w-full md:w-80 lg:w-96 bg-[#DCD9D4] border-r border-[#BCB9B4] h-full overflow-hidden" id="sidebar-panel">
      {/* Sidebar Header showing Caffeine counter */}
      <div className="p-4 bg-[#E4E3E0] border-b border-[#BCB9B4] flex items-center justify-between" id="sidebar-header">
        <div>
          <h1 className="text-xs font-bold font-sans tracking-[0.2em] text-[#2C2C2B] uppercase">THE SLUMBER HUD</h1>
          <p className="text-[10px] text-[#2C2C2B]/60 font-serif italic mt-0.5">Low Effort, High Satisfaction</p>
        </div>
        
        {/* Coffee Mugs Counter */}
        <div className="flex items-center gap-1.5 bg-[#F5F2ED]/80 px-3 py-1.5 rounded-none border border-[#BCB9B4]" id="caffeine-counter">
          <Coffee className="w-3.5 h-3.5 text-[#5A5A40]" />
          <div className="text-right">
            <div className="text-[10px] font-sans font-bold tracking-wider text-[#2C2C2B]" id="coffee-mugs-count">
              {stats.coffeeMugs} MUGS
            </div>
            <p className="text-[8px] text-[#2C2C2B]/50 font-sans tracking-widest uppercase leading-none">Caffeine</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex bg-[#D1CECA] border-b border-[#BCB9B4]" id="sidebar-tabs">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex-1 py-3 text-[10px] font-sans tracking-[0.15em] font-bold flex flex-col items-center gap-1 transition-all rounded-none ${
            activeTab === 'levels'
              ? 'text-[#2C2C2B] bg-[#DCD9D4] border-b-2 border-[#2C2C2B]'
              : 'text-[#2C2C2B]/50 hover:text-[#2C2C2B] hover:bg-[#D4D1CC] border-b-2 border-transparent'
          }`}
          id="tab-levels"
        >
          <Map className="w-3.5 h-3.5" />
          <span>MAPS</span>
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-3 text-[10px] font-sans tracking-[0.15em] font-bold flex flex-col items-center gap-1 transition-all rounded-none ${
            activeTab === 'shop'
              ? 'text-[#2C2C2B] bg-[#DCD9D4] border-b-2 border-[#2C2C2B]'
              : 'text-[#2C2C2B]/50 hover:text-[#2C2C2B] hover:bg-[#D4D1CC] border-b-2 border-transparent'
          }`}
          id="tab-shop"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>SHOP</span>
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-3 text-[10px] font-sans tracking-[0.15em] font-bold flex flex-col items-center gap-1 transition-all rounded-none ${
            activeTab === 'achievements'
              ? 'text-[#2C2C2B] bg-[#DCD9D4] border-b-2 border-[#2C2C2B]'
              : 'text-[#2C2C2B]/50 hover:text-[#2C2C2B] hover:bg-[#D4D1CC] border-b-2 border-transparent'
          }`}
          id="tab-achieve"
        >
          <Award className="w-3.5 h-3.5" />
          <span>GOALS</span>
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex-1 py-3 text-[10px] font-sans tracking-[0.15em] font-bold flex flex-col items-center gap-1 transition-all rounded-none ${
            activeTab === 'controls'
              ? 'text-[#2C2C2B] bg-[#DCD9D4] border-b-2 border-[#2C2C2B]'
              : 'text-[#2C2C2B]/50 hover:text-[#2C2C2B] hover:bg-[#D4D1CC] border-b-2 border-transparent'
          }`}
          id="tab-controls"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>INPUTS</span>
        </button>
      </div>

      {/* Main tab content viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#DCD9D4]" id="sidebar-viewport">
        
        {/* TAB 1: Handcrafted Levels Select */}
        {activeTab === 'levels' && (
          <div className="space-y-4" id="panel-levels">
            <div className="bg-[#E4E3E0] border border-[#BCB9B4] p-3 rounded-none text-center">
              <span className="text-[9px] font-sans tracking-[0.15em] text-[#2C2C2B]/60 uppercase block">Game Play Mode</span>
              <div className="flex gap-2 mt-2 justify-center">
                {(['story', 'relax'] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-[9px] font-sans tracking-wider rounded-none border uppercase transition-all ${
                      mode === m
                        ? 'bg-[#5A5A40] text-[#F5F2ED] border-[#5A5A40]'
                        : 'bg-[#F5F2ED] text-[#2C2C2B]/70 border-[#BCB9B4] hover:bg-[#E4E3E0]'
                    }`}
                  >
                    {m === 'story' ? '🛌 Story' : '😴 Relax'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] font-bold font-sans tracking-[0.15em] text-[#2C2C2B]/70 uppercase px-1">Handcrafted Slumber Maps</div>
            <div className="space-y-2">
              {LEVELS.map((lvl, index) => {
                const isUnlocked = stats.unlockedLevels.includes(index);
                const isActive = levelIndex === index;
                const bestTime = stats.highScores[lvl.id];

                return (
                  <button
                    key={lvl.id}
                    disabled={!isUnlocked}
                    onClick={() => setLevelIndex(index)}
                    className={`w-full text-left p-3 rounded-none border transition-all relative flex flex-col gap-1 ${
                      isActive
                        ? 'bg-[#5A5A40] text-[#F5F2ED] border-[#5A5A40]'
                        : isUnlocked
                        ? 'bg-[#F5F2ED] border-[#BCB9B4] text-[#2C2C2B]'
                        : 'bg-[#D1CECA] border-[#BCB9B4]/40 text-[#2C2C2B]/40 cursor-not-allowed'
                    }`}
                  >
                    {!isUnlocked && (
                      <div className="absolute right-3 top-3 text-[#2C2C2B]/40">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="text-xs font-bold font-sans tracking-tight">{lvl.name}</div>
                    <div className="text-[10px] opacity-80 font-serif italic line-clamp-1">{lvl.description}</div>
                    
                    {/* Level High score stats */}
                    {isUnlocked && (
                      <div className="mt-2 flex items-center justify-between text-[9px] font-sans tracking-wider opacity-90 border-t border-current/10 pt-1.5">
                        <span className="opacity-70">EST. TIME TO BED:</span>
                        <span className="font-bold">{bestTime ? formatTime(bestTime) : 'NO RUN YET'}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Cozy Slumber Cosmetics Shop */}
        {activeTab === 'shop' && (
          <div className="space-y-4" id="panel-shop">
            <div className="bg-[#E4E3E0] p-3 rounded-none border border-[#BCB9B4] text-center text-[10px] text-[#2C2C2B]/70 font-sans leading-relaxed">
              Customize your sleepy avatar. Unlock premium pajamas, fluffy bunny slippers, nightcaps, and feline companions using Coffee Mugs collected in levels.
            </div>

            {/* Group shop by category */}
            {(['outfit', 'hat', 'slippers', 'backpack'] as const).map((cat) => {
              const catItems = COSMETIC_SHOP.filter(item => item.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <div className="text-[10px] font-bold font-sans tracking-[0.15em] text-[#2C2C2B]/70 uppercase px-1">{cat}S</div>
                  <div className="grid grid-cols-1 gap-2">
                    {catItems.map((item) => {
                      const isUnlocked = stats.unlockedCosmetics.includes(item.id);
                      const isActive = stats.activeCosmetics[cat] === item.id;
                      const canAfford = stats.coffeeMugs >= item.price;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-none border flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-[#E4E3E0] border-[#5A5A40]'
                              : 'bg-[#F5F2ED] border-[#BCB9B4] hover:border-[#2C2C2B]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.emoji || '🧸'}</span>
                            <div>
                              <div className="text-xs font-bold text-[#2C2C2B]">{item.name}</div>
                              <div className="text-[9px] text-[#2C2C2B]/60 font-serif italic mt-0.5 leading-snug">{item.description}</div>
                            </div>
                          </div>

                          {/* Purchase / Equip Button */}
                          <button
                            onClick={() => handlePurchaseCosmetic(item)}
                            className={`px-3 py-1.5 rounded-none font-sans text-[9px] tracking-wider font-bold flex items-center gap-1 transition-all ${
                              isActive
                                ? 'bg-[#5A5A40] text-[#F5F2ED]'
                                : isUnlocked
                                ? 'bg-[#DCD9D4] text-[#2C2C2B] hover:bg-[#D1CECA] border border-[#BCB9B4]'
                                : canAfford
                                ? 'bg-[#5A5A40]/10 text-[#5A5A40] hover:bg-[#5A5A40]/20 border border-[#5A5A40]'
                                : 'bg-[#DCD9D4]/40 text-[#2C2C2B]/40 border border-[#BCB9B4]/30 cursor-not-allowed'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-3 h-3" /> ACTIVE
                              </>
                            ) : isUnlocked ? (
                              'EQUIP'
                            ) : (
                              <>
                                ☕ {item.price}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: Comical Achievements list */}
        {activeTab === 'achievements' && (
          <div className="space-y-3 font-sans" id="panel-achievements">
            <div className="text-[10px] font-bold text-[#2C2C2B]/70 uppercase tracking-[0.15em] px-1">Snoozing Objectives</div>
            <div className="space-y-2">
              {ACHIEVEMENTS.map((ach) => {
                const isDone = stats.completedAchievements.includes(ach.id);
                // Dynamically evaluate
                const willUnlockNow = ach.condition(stats, gameProgress);

                // Auto claim reward side-effect during render (safe since completed check triggers state)
                if (willUnlockNow && !isDone) {
                  setTimeout(() => {
                    setStats(prev => {
                      if (prev.completedAchievements.includes(ach.id)) return prev;
                      return {
                        ...prev,
                        coffeeMugs: prev.coffeeMugs + ach.reward,
                        completedAchievements: [...prev.completedAchievements, ach.id]
                      };
                    });
                  }, 50);
                }

                const completed = isDone || willUnlockNow;

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-none border flex items-start gap-3 transition-all ${
                      completed
                        ? 'bg-[#E4E3E0] border-[#5A5A40]'
                        : 'bg-[#F5F2ED] border-[#BCB9B4]'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{ach.icon}</span>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${completed ? 'text-[#2C2C2B]' : 'text-[#2C2C2B]/80'}`}>
                        {ach.title}
                      </div>
                      <div className="text-[10px] text-[#2C2C2B]/60 mt-1 font-serif italic leading-relaxed">
                        {ach.description}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[8px] tracking-wider border-t border-dashed border-[#BCB9B4] pt-2">
                        <span className={completed ? 'text-[#5A5A40] font-bold uppercase' : 'text-[#2C2C2B]/40 uppercase'}>
                          {completed ? '✓ UNLOCKED' : '○ IN PROGRESS'}
                        </span>
                        <span className="bg-[#5A5A40]/10 text-[#5A5A40] px-1.5 py-0.5 rounded-none font-bold text-[8px]">
                          +☕ {ach.reward} MUGS
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Control Customizer Mapping */}
        {activeTab === 'controls' && (
          <div className="space-y-4" id="panel-controls">
            <div className="bg-[#E4E3E0] p-3 rounded-none border border-[#BCB9B4] text-center text-[10px] text-[#2C2C2B]/70 font-sans leading-relaxed">
              Click on a physical action button below, then press any key on your keyboard to map it dynamically.
            </div>

            <div
              className={`space-y-2 ${bindingKey ? 'ring-2 ring-[#5A5A40] bg-[#E4E3E0]/40 p-2.5 rounded-none' : ''}`}
              onKeyDown={handleKeyDownCapture}
              tabIndex={bindingKey ? 0 : -1}
              ref={(el) => { if (el && bindingKey) el.focus(); }}
            >
              {bindingKey && (
                <div className="text-[9px] tracking-widest font-bold text-[#5A5A40] animate-pulse text-center mb-2 font-sans uppercase">
                  Press any key to bind "{bindingKey}"...
                </div>
              )}

              {Object.entries(keyBindings).map(([action, boundKey]) => (
                <div key={action} className="bg-[#F5F2ED] p-2.5 rounded-none border border-[#BCB9B4] flex items-center justify-between font-sans text-xs">
                  <span className="font-bold text-[#2C2C2B]/80 uppercase tracking-wider">{action}:</span>
                  <button
                    onClick={() => handleStartBinding(action as keyof KeyBindings)}
                    className={`px-3 py-1.5 rounded-none font-bold border transition-all text-[11px] ${
                      bindingKey === action
                        ? 'bg-[#5A5A40] border-[#5A5A40] text-[#F5F2ED] animate-pulse'
                        : 'bg-[#DCD9D4] hover:bg-[#D1CECA] text-[#2C2C2B] border-[#BCB9B4]'
                    }`}
                  >
                    {boundKey}
                  </button>
                </div>
              ))}
            </div>

            {/* Reset Defaults button */}
            <button
              onClick={resetDefaultKeyBindings}
              className="w-full bg-[#F5F2ED] border border-[#BCB9B4] text-[#2C2C2B] hover:bg-[#E4E3E0] py-2 rounded-none text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>RESET INPUT DEFAULTS</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer detailing stats */}
      <div className="p-4 bg-[#E4E3E0] border-t border-[#BCB9B4] space-y-1.5 font-sans text-[10px] text-[#2C2C2B]/70" id="sidebar-footer">
        <div className="font-bold text-[#2C2C2B] uppercase tracking-wider text-[10px]">Current Run Session:</div>
        <div className="flex justify-between border-b border-[#BCB9B4]/20 pb-1">
          <span>💤 Bounces on Sofas:</span>
          <span className="font-bold text-[#2C2C2B]">{gameProgress.bounces}</span>
        </div>
        <div className="flex justify-between border-b border-[#BCB9B4]/20 pb-1">
          <span>🤕 Tumbles / Falls:</span>
          <span className="font-bold text-[#2C2C2B]">{gameProgress.falls}</span>
        </div>
        <div className="flex justify-between pb-1">
          <span>⏰ Longest Napping Idle:</span>
          <span className="font-bold text-[#2C2C2B]">{gameProgress.maxIdleTime}s</span>
        </div>
      </div>
    </div>
  );
};
