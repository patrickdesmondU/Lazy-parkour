export type GameMode = 'story' | 'relax' | 'trial' | 'challenge' | 'endless';

export interface KeyBindings {
  left: string;
  right: string;
  jump: string;
  jog: string;
  crouch: string;
  interact: string;
  respawn: string;
}

export interface PlayerStats {
  levelIndex: number;
  unlockedLevels: number[];
  coffeeMugs: number;
  highScores: Record<string, number>; // levelId -> time (ms)
  completedAchievements: string[];
  unlockedCosmetics: string[]; // ids of unlocked cosmetics
  activeCosmetics: {
    outfit: string;
    hat: string;
    slippers: string;
    backpack: string;
  };
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'outfit' | 'hat' | 'slippers' | 'backpack';
  price: number;
  color: string; // Tailwind bg color or hex
  accentColor?: string;
  description: string;
  emoji?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: number; // Coffee mugs
  condition: (stats: any, gameProgress: any) => boolean;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  type: 'conveyor' | 'sofa' | 'beanbag' | 'pendulum' | 'bookshelf' | 'pillow_roller' | 'elevator' | 'platform_wobble' | 'cardboard_bridge' | 'fan';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  // Dynamic properties:
  speed?: number;
  direction?: number; // 1 or -1
  range?: number; // elevator or pendulum movement range
  startX?: number;
  startY?: number;
  angle?: number;
  bounceMultiplier?: number;
  isTriggered?: boolean;
  timer?: number;
  maxTimer?: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'concrete' | 'soft_ramp' | 'cushion_pad' | 'rope_anchor' | 'floating_island' | 'staircase';
  label?: string;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  isActivated: boolean;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'coffee' | 'zzz';
  isCollected: boolean;
}

export interface Rope {
  id: string;
  anchorX: number;
  anchorY: number;
  length: number;
  angle: number;
  angularVelocity: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  ambientColor: string;
  platforms: Platform[];
  obstacles: Obstacle[];
  checkpoints: Checkpoint[];
  collectibles: Collectible[];
  ropes: Rope[];
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  introMessage?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'yawn' | 'zzz' | 'sweat' | 'coffee_steam' | 'sparkle';
  text?: string;
}
