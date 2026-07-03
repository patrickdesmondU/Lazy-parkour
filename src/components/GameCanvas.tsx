import React, { useRef, useEffect, useState } from 'react';
import { GameMode, KeyBindings, PlayerStats, Level, Platform, Obstacle, Checkpoint, Collectible, Rope, Particle, Vector2D } from '../types';
import { LEVELS, COSMETIC_SHOP } from '../data';
import { audioEngine } from './AudioEngine';
import { Coffee, RotateCcw, Volume2, VolumeX, Eye, EyeOff, Play, Pause, Compass, Zap, Sparkles } from 'lucide-react';

interface GameCanvasProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  mode: GameMode;
  levelIndex: number;
  setLevelIndex: (idx: number) => void;
  keyBindings: KeyBindings;
  onGameStatsUpdate: (falls: number, bounces: number, idleTime: number, slowRunCompleted: boolean) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stats,
  setStats,
  mode,
  levelIndex,
  setLevelIndex,
  keyBindings,
  onGameStatsUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game execution states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [level, setLevel] = useState<Level>(LEVELS[levelIndex]);
  const [timer, setTimer] = useState<number>(0);
  const [coinsCollectedThisRun, setCoinsCollectedThisRun] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'normal' | 'cinematic'>('normal');
  const [showControlGuide, setShowControlGuide] = useState<boolean>(true);
  
  // Game loop tracking variables (held in refs to avoid React re-render lags)
  const stateRef = useRef({
    player: {
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 34,
      height: 52,
      isGrounded: false,
      isCrouching: false,
      isGrabbingLedge: false,
      grabbedLedgeId: '',
      grabXSide: 0, // -1 for left side of platform, 1 for right side
      isSwinging: false,
      swingingRopeId: '',
      swingAngle: 0,
      swingLength: 200,
      swingSpeed: 0,
      doubleJumpsLeft: 1,
      facing: 1 as 1 | -1, // 1 = right, -1 = left
      animFrame: 0,
      state: 'idle' as 'idle' | 'walk' | 'jog' | 'jump' | 'fall' | 'crouch' | 'crawl' | 'grab' | 'swing' | 'slide' | 'roll' | 'ragdoll',
      lazySighTimer: 0,
      lastActionTime: Date.now(),
      idleYawnTriggered: false,
      sighPromptText: '',
      sighPromptTimer: 0,
      isRolling: false,
      rollAngle: 0,
      ragdollTimer: 0,
      activeIdleAnim: '',
      idleAnimTimer: 0,
      idleAnimNextTriggerTime: 0,
      activeEmote: '',
      emoteTimer: 0
    },
    camera: {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetZoom: 1.0
    },
    keys: {} as Record<string, boolean>,
    particles: [] as Particle[],
    platforms: [] as Platform[],
    obstacles: [] as Obstacle[],
    checkpoints: [] as Checkpoint[],
    collectibles: [] as Collectible[],
    ropes: [] as Rope[],
    levelWidth: 2500,
    levelHeight: 700,
    goal: { x: 2350, y: 400, width: 80, height: 100 },
    
    // Stats accumulators
    runStartTime: 0,
    fallsCount: 0,
    bouncesCount: 0,
    maxIdleDuration: 0,
    checkpointX: 100,
    checkpointY: 400,
    conveyorSpeedAdded: 0
  });

  // Track level index prop changes
  useEffect(() => {
    resetLevelState(levelIndex);
  }, [levelIndex, mode]);

  // Audio mute sync
  const toggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsAudioMuted(muted);
  };

  // Reset the current level completely
  const resetLevelState = (idx: number) => {
    const activeLevel = LEVELS[idx];
    if (!activeLevel) return;
    setLevel(activeLevel);
    
    // Clone level structures to avoid mutation of shared data
    const platforms = JSON.parse(JSON.stringify(activeLevel.platforms));
    const obstacles = JSON.parse(JSON.stringify(activeLevel.obstacles));
    const checkpoints = JSON.parse(JSON.stringify(activeLevel.checkpoints));
    const collectibles = JSON.parse(JSON.stringify(activeLevel.collectibles));
    const ropes = JSON.parse(JSON.stringify(activeLevel.ropes));

    const state = stateRef.current;
    state.levelWidth = activeLevel.width;
    state.levelHeight = activeLevel.height;
    state.platforms = platforms;
    state.obstacles = obstacles;
    state.checkpoints = checkpoints;
    state.collectibles = collectibles;
    state.ropes = ropes;
    state.goal = { x: activeLevel.goalX, y: activeLevel.goalY, width: 80, height: 100 };
    
    // Set starting position
    state.checkpointX = activeLevel.startX;
    state.checkpointY = activeLevel.startY;
    
    state.player.x = activeLevel.startX;
    state.player.y = activeLevel.startY;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.isGrounded = false;
    state.player.isGrabbingLedge = false;
    state.player.isSwinging = false;
    state.player.isCrouching = false;
    state.player.isRolling = false;
    state.player.ragdollTimer = 0;
    state.player.state = 'idle';
    state.player.lastActionTime = Date.now();
    state.player.sighPromptText = activeLevel.introMessage || 'Ah, another day of standing...';
    state.player.sighPromptTimer = 180; // 3 seconds at 60 FPS
    
    state.particles = [];
    state.runStartTime = Date.now();
    setTimer(0);
    setCoinsCollectedThisRun(0);
    setIsPaused(false);
  };

  // Respawn from last checkpoint
  const respawnPlayer = (playSfx = true) => {
    const state = stateRef.current;
    state.player.x = state.checkpointX;
    state.player.y = state.checkpointY - 10;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.isGrounded = false;
    state.player.isGrabbingLedge = false;
    state.player.isSwinging = false;
    state.player.isCrouching = false;
    state.player.isRolling = false;
    state.player.ragdollTimer = 0;
    state.player.state = 'idle';
    state.player.lastActionTime = Date.now();
    
    // Sputter funny dialogue on fail
    const excuses = [
      "I did that on purpose. I needed a break.",
      "Is gravity stronger today?",
      "Can we just sleep here instead?",
      "This concrete looks surprisingly comfy.",
      "My slippers slipped.",
      "Sigh, walking is overrated.",
      "Just five more minutes...",
      "Ouch, my lazy back."
    ];
    state.player.sighPromptText = excuses[Math.floor(Math.random() * excuses.length)];
    state.player.sighPromptTimer = 150;

    // Spawn funny Zzz/sweat particles
    for (let i = 0; i < 15; i++) {
      state.particles.push({
        x: state.player.x,
        y: state.player.y - 20,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: Math.random() * 8 + 4,
        color: '#bfae9c',
        alpha: 0.8,
        life: 0,
        maxLife: 40 + Math.random() * 20,
        type: 'dust'
      });
    }

    if (playSfx) {
      audioEngine.playSplat();
    }
    
    state.fallsCount++;
    onGameStatsUpdate(state.fallsCount, state.bouncesCount, Math.floor(state.maxIdleDuration / 1000), false);
  };

  // Trigger one of the 5 funny, unique emotes
  const triggerEmote = (emoteId: string) => {
    const state = stateRef.current;
    const p = state.player;
    if (!isPlaying || isPaused) return;

    p.activeEmote = emoteId;
    p.emoteTimer = 180; // 3 seconds at 60 FPS
    p.activeIdleAnim = ''; // cancel any idle animation
    p.idleAnimTimer = 0;
    p.lastActionTime = Date.now(); // reset action time to prevent instant idle trigger

    // Trigger comedic dialogue, particles, and audio effects
    if (emoteId === 'sigh_despair') {
      p.sighPromptText = [
        "*Heavy Sigh* Why must there be platforms?",
        "Can we just sleep here instead?",
        "*Sigh* Walking is too much effort."
      ][Math.floor(Math.random() * 3)];
      p.sighPromptTimer = 150;
      audioEngine.playSigh();

      // Spawn sleepy gray dust falling down from shoulders
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x: p.x + (Math.random() - 0.5) * 15,
          y: p.y - p.height + 25,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 1 + Math.random() * 1.5,
          size: Math.random() * 2 + 3,
          color: '#a3a099',
          alpha: 0.7,
          life: 0,
          maxLife: 40,
          type: 'dust'
        });
      }
    } else if (emoteId === 'power_nap') {
      p.sighPromptText = [
        "*Snore* Just 5 more minutes...",
        "*Zzz* This floor is surprisingly comfy.",
        "*Dreaming of soft cushions*"
      ][Math.floor(Math.random() * 3)];
      p.sighPromptTimer = 150;
      audioEngine.playSigh();

      // Spawn sleepy "Zzz" bubble particles floating up
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: p.x + (Math.random() - 0.5) * 10,
          y: p.y - 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1 - Math.random() * 1.5,
          size: Math.random() * 3 + 10,
          color: '#c5b5f2',
          alpha: 0.8,
          life: 0,
          maxLife: 60,
          type: 'zzz',
          text: 'Z'
        });
      }
    } else if (emoteId === 'facepalm') {
      p.sighPromptText = [
        "*Facepalm* This is an absolute effort emergency.",
        "My posture is weeping...",
        "Unbelievable amount of walking."
      ][Math.floor(Math.random() * 3)];
      p.sighPromptTimer = 120;
      audioEngine.playSigh();
    } else if (emoteId === 'sip_coffee') {
      p.sighPromptText = [
        "*Slurp* Ah, liquid energy...",
        "*Sip* Cozy bean water is life.",
        "*Gulp* Okay, I can stand for 10 more seconds."
      ][Math.floor(Math.random() * 3)];
      p.sighPromptTimer = 150;
      audioEngine.playCollect();

      // Spawn warm coffee steam
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: p.x,
          y: p.y - p.height + 15,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1.5 - Math.random() * 1,
          size: Math.random() * 2 + 3,
          color: '#a1836a',
          alpha: 0.9,
          life: 0,
          maxLife: 40,
          type: 'coffee_steam'
        });
      }
    } else if (emoteId === 'lazy_stretch') {
      p.sighPromptText = [
        "*Streeeeetch* ... Almost exercised.",
        "Creak! My lazy spine...",
        "Phew, that was way too close to a workout."
      ][Math.floor(Math.random() * 3)];
      p.sighPromptTimer = 150;
      audioEngine.playSigh();

      // Spawn sweat drops of excessive stretching exertion
      for (let i = 0; i < 4; i++) {
        state.particles.push({
          x: p.x + (Math.random() - 0.5) * 20,
          y: p.y - p.height + 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 1,
          size: Math.random() * 2 + 2,
          color: '#a2c4c9',
          alpha: 0.8,
          life: 0,
          maxLife: 30,
          type: 'sweat'
        });
      }
    }
  };

  // Main Canvas loop and resize management
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = 600; // Fixed aesthetic height
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Key Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      
      // Standard controls and customizable bindings support
      if (k === ' ' || e.key === ' ' || k === keyBindings.jump.toLowerCase()) {
        stateRef.current.keys['jump'] = true;
      } else if (k === 'a' || k === 'arrowleft' || k === keyBindings.left.toLowerCase()) {
        stateRef.current.keys['left'] = true;
      } else if (k === 'd' || k === 'arrowright' || k === keyBindings.right.toLowerCase()) {
        stateRef.current.keys['right'] = true;
      } else if (k === 's' || k === 'arrowdown' || k === keyBindings.crouch.toLowerCase() || e.key === 'Control') {
        stateRef.current.keys['crouch'] = true;
      } else if (k === 'w' || k === 'arrowup') {
        stateRef.current.keys['up'] = true;
      } else if (k === 'shift' || k === keyBindings.jog.toLowerCase()) {
        stateRef.current.keys['jog'] = true;
      } else if (k === 'e' || k === keyBindings.interact.toLowerCase()) {
        stateRef.current.keys['interact'] = true;
        // Grab rope manual toggle
        handleRopeInteractToggle();
      } else if (k === 'r' || k === keyBindings.respawn.toLowerCase()) {
        respawnPlayer();
      } else if (k === '1') {
        triggerEmote('sigh_despair');
      } else if (k === '2') {
        triggerEmote('power_nap');
      } else if (k === '3') {
        triggerEmote('facepalm');
      } else if (k === '4') {
        triggerEmote('sip_coffee');
      } else if (k === '5') {
        triggerEmote('lazy_stretch');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ' || e.key === ' ' || k === keyBindings.jump.toLowerCase()) {
        stateRef.current.keys['jump'] = false;
      } else if (k === 'a' || k === 'arrowleft' || k === keyBindings.left.toLowerCase()) {
        stateRef.current.keys['left'] = false;
      } else if (k === 'd' || k === 'arrowright' || k === keyBindings.right.toLowerCase()) {
        stateRef.current.keys['right'] = false;
      } else if (k === 's' || k === 'arrowdown' || k === keyBindings.crouch.toLowerCase() || e.key === 'Control') {
        stateRef.current.keys['crouch'] = false;
      } else if (k === 'w' || k === 'arrowup') {
        stateRef.current.keys['up'] = false;
      } else if (k === 'shift' || k === keyBindings.jog.toLowerCase()) {
        stateRef.current.keys['jog'] = false;
      } else if (k === 'e' || k === keyBindings.interact.toLowerCase()) {
        stateRef.current.keys['interact'] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Rope Grab manual toggle logic
    const handleRopeInteractToggle = () => {
      const state = stateRef.current;
      const p = state.player;

      if (p.isSwinging) {
        // Drop off rope
        p.isSwinging = false;
        p.vx = Math.sin(p.swingAngle) * p.swingSpeed * 2.5;
        p.vy = -Math.cos(p.swingAngle) * p.swingSpeed * 2.5;
        p.lastActionTime = Date.now();
      } else {
        // Try to grab nearby rope
        for (const r of state.ropes) {
          const ropeEndX = r.anchorX + Math.sin(r.angle) * r.length;
          const ropeEndY = r.anchorY + Math.cos(r.angle) * r.length;
          const dist = Math.hypot(p.x - ropeEndX, (p.y - p.height / 2) - ropeEndY);
          if (dist < 45) {
            p.isSwinging = true;
            p.swingingRopeId = r.id;
            p.swingAngle = r.angle;
            p.swingLength = r.length;
            p.swingSpeed = r.angularVelocity;
            p.isGrabbingLedge = false;
            audioEngine.playFootstep();
            break;
          }
        }
      }
    };

    // --- Core Game Loop ---
    const update = () => {
      if (!isPlaying || isPaused) {
        animationId = requestAnimationFrame(update);
        return;
      }

      const state = stateRef.current;
      const p = state.player;
      const keys = state.keys;

      // Increment elapsed timer
      setTimer(Date.now() - state.runStartTime);

      // Handle Idle state tracking
      const now = Date.now();
      const idleDuration = now - p.lastActionTime;
      if (idleDuration > state.maxIdleDuration) {
        state.maxIdleDuration = idleDuration;
        onGameStatsUpdate(state.fallsCount, state.bouncesCount, Math.floor(state.maxIdleDuration / 1000), false);
      }

      // Interrupt active idle animation or emote if the player moves or is in the air
      const isMoving = Math.abs(p.vx) > 0.1 || !p.isGrounded;
      if (isMoving) {
        if (p.activeIdleAnim) {
          p.activeIdleAnim = '';
          p.idleAnimTimer = 0;
        }
        if (p.activeEmote) {
          p.activeEmote = '';
          p.emoteTimer = 0;
        }
      }

      // Handle Emote Timer countdown
      if (p.activeEmote && p.emoteTimer > 0) {
        p.emoteTimer--;
        if (p.emoteTimer <= 0) {
          p.activeEmote = '';
        }
      }

      // Handle 10 dynamic, random idle animations when stationary
      if (p.isGrounded && Math.abs(p.vx) < 0.1 && !p.isCrouching && !p.isSwinging && !p.isGrabbingLedge && !p.activeEmote) {
        if (!p.activeIdleAnim) {
          if (!p.idleAnimNextTriggerTime) {
            p.idleAnimNextTriggerTime = now + 4000 + Math.random() * 4000;
          }
          if (now > p.idleAnimNextTriggerTime) {
            const idleAnims = [
              'yawn', 'check_watch', 'nod_off', 'scratch', 'slump',
              'nails', 'bubble', 'shrug', 'tie_slipper', 'sleep_sit'
            ];
            p.activeIdleAnim = idleAnims[Math.floor(Math.random() * idleAnims.length)];
            p.idleAnimTimer = 180; // 3 seconds at 60 FPS
            p.idleAnimNextTriggerTime = now + 8000 + Math.random() * 6000; // 8-14 seconds till next one

            // Custom dialogue, audio, and particles based on chosen idle animation
            if (p.activeIdleAnim === 'yawn') {
              p.sighPromptText = ["*Yawwwwn*... Walking is so much work.", "*Yawwwwn*... Extremely sleepy...", "Time for a quick nap?"][Math.floor(Math.random() * 3)];
              p.sighPromptTimer = 150;
              audioEngine.playSigh();
              
              // Spawn Zzz particles
              for (let i = 0; i < 3; i++) {
                state.particles.push({
                  x: p.x + 10,
                  y: p.y - p.height - 10,
                  vx: 0.2 + Math.random() * 0.4,
                  vy: -0.5 - Math.random() * 0.5,
                  size: Math.random() * 3 + 12,
                  color: '#c5b5f2',
                  alpha: 1.0,
                  life: 0,
                  maxLife: 120,
                  type: 'zzz',
                  text: 'Z'
                });
              }
            } else if (p.activeIdleAnim === 'check_watch') {
              p.sighPromptText = ["Is it bedtime yet?", "Snooze timer check: Still early.", "Checking my non-existent watch... Yup, nap time."][Math.floor(Math.random() * 3)];
              p.sighPromptTimer = 120;
            } else if (p.activeIdleAnim === 'nod_off') {
              p.sighPromptText = ["Zzz... Zzz... Huh? Wide awake!", "Just resting... my eyes... Whew!", "*Nods off*... Who's there?!"][Math.floor(Math.random() * 3)];
              p.sighPromptTimer = 150;
              state.particles.push({
                x: p.x + 8,
                y: p.y - p.height - 5,
                vx: 0.1,
                vy: -0.4,
                size: 9,
                color: '#c5b5f2',
                alpha: 0.9,
                life: 0,
                maxLife: 90,
                type: 'zzz',
                text: 'z'
              });
            } else if (p.activeIdleAnim === 'scratch') {
              p.sighPromptText = "This cozy pajama is slightly itchy...";
              p.sighPromptTimer = 120;
            } else if (p.activeIdleAnim === 'slump') {
              p.sighPromptText = ["Gravity is extra strong today.", "My posture is melting.", "Can my skeleton liquefy?"][Math.floor(Math.random() * 3)];
              p.sighPromptTimer = 120;
            } else if (p.activeIdleAnim === 'nails') {
              p.sighPromptText = "Hmm, very lazy fingernails today.";
              p.sighPromptTimer = 120;
            } else if (p.activeIdleAnim === 'bubble') {
              p.sighPromptText = "*Inhaling sleepy nose bubble...*";
              p.sighPromptTimer = 150;
            } else if (p.activeIdleAnim === 'shrug') {
              p.sighPromptText = ["Move forward? Meh.", "Jump? Too much calculus.", "Should I care? Not today."][Math.floor(Math.random() * 3)];
              p.sighPromptTimer = 120;
            } else if (p.activeIdleAnim === 'tie_slipper') {
              p.sighPromptText = "Adjusting bunny slippers for maximum relaxation...";
              p.sighPromptTimer = 120;
            } else if (p.activeIdleAnim === 'sleep_sit') {
              p.sighPromptText = ["*Snore*... Just resting my back.", "*Zzz* Comfy sitting spot right here...", "Sitting down is a form of standing."][Math.floor(Math.random() * 3)];
              p.sighPromptTimer = 150;
              audioEngine.playSigh();
              
              for (let i = 0; i < 3; i++) {
                state.particles.push({
                  x: p.x + 5,
                  y: p.y - 15,
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: -0.5 - Math.random() * 0.5,
                  size: 11,
                  color: '#c5b5f2',
                  alpha: 1.0,
                  life: 0,
                  maxLife: 100,
                  type: 'zzz',
                  text: 'Z'
                });
              }
            }
          }
        } else {
          p.idleAnimTimer--;
          if (p.idleAnimTimer <= 0) {
            p.activeIdleAnim = '';
          }
        }
      } else {
        p.activeIdleAnim = '';
        p.idleAnimTimer = 0;
      }

      // Decrease Dialogue prompts
      if (p.sighPromptTimer > 0) {
        p.sighPromptTimer--;
      }

      // --- 1. Horizontal Movement & Input Handling ---
      let moveSpeed = keys['jog'] ? 3.4 : 1.8; // Jog vs casual lazy stroll
      p.isCrouching = keys['crouch'] && p.isGrounded;

      if (p.isCrouching) {
        moveSpeed = 0.8; // extremely slow crawl
        p.height = 24; // smaller hitbox
      } else {
        p.height = 52;
      }

      // Physics states
      if (p.ragdollTimer > 0) {
        p.ragdollTimer--;
        p.state = 'ragdoll';
        // tumble rolling
        p.rollAngle += p.vx * 0.08;
      } else if (p.isSwinging) {
        p.state = 'swing';
      } else if (p.isGrabbingLedge) {
        p.state = 'grab';
      } else if (p.isRolling) {
        p.state = 'roll';
      } else if (p.isCrouching) {
        p.state = moveSpeed > 1 ? 'crouch' : 'crawl';
      } else if (!p.isGrounded) {
        p.state = p.vy < 0 ? 'jump' : 'fall';
      } else if (Math.abs(p.vx) > 0.4) {
        p.state = keys['jog'] ? 'jog' : 'walk';
      } else {
        p.state = 'idle';
      }

      // Input logic
      if (p.ragdollTimer === 0 && !p.isSwinging && !p.isGrabbingLedge) {
        if (keys['left']) {
          p.vx -= 0.25;
          if (p.vx < -moveSpeed) p.vx = -moveSpeed;
          p.facing = -1;
          p.lastActionTime = now;
        } else if (keys['right']) {
          p.vx += 0.25;
          if (p.vx > moveSpeed) p.vx = moveSpeed;
          p.facing = 1;
          p.lastActionTime = now;
        } else {
          // Decelerate lazily
          p.vx *= 0.82;
        }
      }

      // --- 2. Gravity and Jump Logic ---
      if (!p.isGrounded && !p.isSwinging && !p.isGrabbingLedge) {
        p.vy += 0.38; // Gravity
        if (p.vy > 12) p.vy = 12; // Terminal velocity
      }

      // Jump mechanics
      if (keys['jump']) {
        p.lastActionTime = now;
        if (p.isGrabbingLedge) {
          // Pull up climb
          p.isGrabbingLedge = false;
          p.vy = -6.8;
          p.vx = p.grabXSide * 2.5;
          audioEngine.playJump();
          keys['jump'] = false;
        } else if (p.isSwinging) {
          // Launch off rope
          p.isSwinging = false;
          p.vy = -Math.cos(p.swingAngle) * p.swingSpeed * 2.5 - 4.5;
          p.vx = Math.sin(p.swingAngle) * p.swingSpeed * 2.5;
          audioEngine.playJump();
          keys['jump'] = false;
        } else if (p.isGrounded) {
          // Reluctant first jump
          p.vy = keys['jog'] ? -8.2 : -6.8;
          p.isGrounded = false;
          audioEngine.playJump();
          
          // Small prompt of complaint
          if (Math.random() > 0.6) {
            p.sighPromptText = ["Hup!", "Ugh...", "Why?", "Work..."][Math.floor(Math.random() * 4)];
            p.sighPromptTimer = 60;
          }

          // Small sweat particles
          state.particles.push({
            x: p.x,
            y: p.y - 10,
            vx: -p.vx * 0.5,
            vy: -1,
            size: Math.random() * 3 + 2,
            color: '#93a187',
            alpha: 0.7,
            life: 0,
            maxLife: 30,
            type: 'sweat'
          });

          keys['jump'] = false;
        } else if (p.doubleJumpsLeft > 0) {
          // Comical Double Jump (Reluctant extra effort)
          p.vy = -5.8;
          p.doubleJumpsLeft--;
          audioEngine.playSigh();
          p.sighPromptText = "*Sigh* ... Fine.";
          p.sighPromptTimer = 90;
          
          // Fart sleepy clouds
          for (let i = 0; i < 6; i++) {
            state.particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 2,
              vy: 1 + Math.random() * 1.5,
              size: Math.random() * 4 + 10,
              color: '#cbd5e1',
              alpha: 0.8,
              life: 0,
              maxLife: 50,
              type: 'zzz',
              text: 'Z'
            });
          }
          keys['jump'] = false;
        }
      }

      // --- 3. Rope Swinging Physics ---
      if (p.isSwinging) {
        const rope = state.ropes.find(r => r.id === p.swingingRopeId);
        if (rope) {
          // Swing physics
          const gravityForce = -0.015 * Math.sin(p.swingAngle);
          p.swingSpeed += gravityForce;
          
          // Pump swing lazily with inputs
          if (keys['left']) {
            p.swingSpeed -= 0.003;
          }
          if (keys['right']) {
            p.swingSpeed += 0.003;
          }
          
          // Friction
          p.swingSpeed *= 0.995;
          p.swingAngle += p.swingSpeed;
          
          // Set player coordinates to rope end
          const ropeEndX = rope.anchorX + Math.sin(p.swingAngle) * p.swingLength;
          const ropeEndY = rope.anchorY + Math.cos(p.swingAngle) * p.swingLength;
          
          p.x = ropeEndX;
          p.y = ropeEndY + p.height / 2;
          p.vx = 0;
          p.vy = 0;

          // Propagate rotation back to rope model
          rope.angle = p.swingAngle;
          rope.angularVelocity = p.swingSpeed;
        }
      }

      // --- 4. Conveyor speeds and Platform Updates ---
      state.conveyorSpeedAdded = 0;
      
      // Update dynamic obstacles
      state.obstacles.forEach((o) => {
        // Elevators
        if (o.type === 'elevator' && o.speed && o.range && o.startY) {
          if (!o.timer) o.timer = 0;
          o.timer += o.speed * (o.direction || 1);
          
          if (Math.abs(o.timer) > o.range) {
            o.direction = -(o.direction || 1);
          }
          o.y = o.startY + o.timer;
        }
        
        // Pillow rollers moving back & forth
        if (o.type === 'pillow_roller' && o.speed && o.range && o.startX) {
          if (!o.timer) o.timer = 0;
          o.timer += o.speed * (o.direction || 1);
          if (o.timer > o.range || o.timer < 0) {
            o.direction = -(o.direction || 1);
          }
          o.x = o.startX + o.timer;

          // Tick down squish timer
          if (o.isTriggered) {
            if (o.maxTimer === undefined) o.maxTimer = 15;
            o.maxTimer--;
            if (o.maxTimer <= 0) {
              o.isTriggered = false;
              o.maxTimer = 15;
            }
          }
        }

        // Beanbag dynamic deflation / recovery
        if (o.type === 'beanbag') {
          if (o.timer === undefined) o.timer = 0;
          const playerLeft = p.x - p.width / 2;
          const playerRight = p.x + p.width / 2;
          const playerBottom = p.y;
          // Player is standing directly on this beanbag
          const isPlayerOnBeanbag = p.isGrounded && (playerRight > o.x && playerLeft < o.x + o.width) && Math.abs(playerBottom - o.y) < 15;
          if (isPlayerOnBeanbag) {
            o.timer = Math.min(0.7, o.timer + 0.015); // slowly deflate
            // sink player slightly
            p.y = o.y + (o.height * o.timer * 0.15);
            if (Math.random() > 0.85) {
              state.particles.push({
                x: o.x + Math.random() * o.width,
                y: o.y + 10,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 1,
                size: Math.random() * 3 + 3,
                color: '#cbd5e1',
                alpha: 0.5,
                life: 0,
                maxLife: 30,
                type: 'dust'
              });
            }
          } else {
            o.timer = Math.max(0, o.timer - 0.008); // slowly recover
          }
        }

        // Sofa fatigue/rotation speed update
        if (o.type === 'sofa') {
          if (o.angle === undefined) o.angle = 0;
          if (o.speed === undefined) o.speed = 0.015;
          if (o.maxTimer === undefined) o.maxTimer = 0.015; // default max spin speed

          o.angle += o.speed;

          // Check contact
          const playerLeft = p.x - p.width / 2;
          const playerRight = p.x + p.width / 2;
          const playerTop = p.y - p.height;
          const playerBottom = p.y;
          const isPlayerInContact = (playerRight > o.x && playerLeft < o.x + o.width && playerBottom > o.y && playerTop < o.y + o.height);

          if (isPlayerInContact) {
            o.speed = Math.max(0.001, o.speed - 0.0004); // gets tired/exhausted!
            if (Math.random() > 0.88) {
              state.particles.push({
                x: o.x + Math.random() * o.width,
                y: o.y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -2,
                size: Math.random() * 2 + 2,
                color: '#38bdf8', // sweat blue
                alpha: 0.8,
                life: 0,
                maxLife: 25,
                type: 'sweat'
              });
            }
          } else {
            o.speed = Math.min(o.maxTimer, o.speed + 0.0001); // recovers energy
          }
        }

        // Pendulum rotation
        if (o.type === 'pendulum' && o.speed && o.range) {
          if (!o.timer) o.timer = 0;
          o.timer += o.speed;
          o.angle = Math.sin(o.timer) * (o.range * Math.PI / 180);
        }

        // Cardboard bridges crumbling down
        if (o.type === 'cardboard_bridge' && o.isTriggered && o.timer !== undefined) {
          o.timer++;
          if (o.timer >= (o.maxTimer || 60)) {
            // Crumble! move offscreen
            o.y = -9999;
            o.isTriggered = false;
            // Respawn trigger timer
            setTimeout(() => {
              o.y = activeBridgeY(o.id);
              o.timer = 0;
            }, 3000);
          }
        }
      });

      function activeBridgeY(id: string): number {
        const originalLvl = LEVELS[levelIndex];
        const originalObstacle = originalLvl.obstacles.find(ob => ob.id === id);
        return originalObstacle ? originalObstacle.y : 500;
      }

      // --- 5. Collision Detection & Resolution ---
      if (!p.isSwinging) {
        let wasGrounded = p.isGrounded;
        p.isGrounded = false;
        
        const nextX = p.x + p.vx;
        const nextY = p.y + p.vy;

        // Collision Check loop
        state.platforms.forEach((plat) => {
          // Resolve vertical collisions
          const playerLeft = p.x - p.width / 2;
          const playerRight = p.x + p.width / 2;
          const platLeft = plat.x;
          const platRight = plat.x + plat.width;

          if (playerRight > platLeft && playerLeft < platRight) {
            // Standing on top of platform
            if (p.y <= plat.y && nextY >= plat.y) {
              p.y = plat.y;
              p.vy = 0;
              p.isGrounded = true;
              p.doubleJumpsLeft = 1;
              p.isGrabbingLedge = false;
              
              if (!wasGrounded) {
                // Landed heavy! play footsteps or soft boing
                audioEngine.playFootstep();
                
                // Spawn dust particles
                for (let i = 0; i < 5; i++) {
                  state.particles.push({
                    x: p.x + (Math.random() - 0.5) * p.width,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 2,
                    size: Math.random() * 4 + 3,
                    color: '#c5c2bb',
                    alpha: 0.6,
                    life: 0,
                    maxLife: 30,
                    type: 'dust'
                  });
                }
              }
            }
            // Hitting bottom of platform
            else if (p.y - p.height >= plat.y + plat.height && nextY - p.height <= plat.y + plat.height) {
              p.y = plat.y + plat.height + p.height;
              p.vy = 0.5; // push down softly
            }
          }
        });

        // Resolve Horizontal collisions with platforms
        p.x += p.vx;
        state.platforms.forEach((plat) => {
          const playerBottom = p.y;
          const playerTop = p.y - p.height;
          const platBottom = plat.y + plat.height;
          const platTop = plat.y;

          if (playerBottom > platTop && playerTop < platBottom) {
            const playerLeft = p.x - p.width / 2;
            const playerRight = p.x + p.width / 2;
            const platLeft = plat.x;
            const platRight = plat.x + plat.width;

            if (playerRight > platLeft && playerLeft < platRight) {
              // Hit wall from left
              if (p.vx > 0 && playerLeft < platLeft) {
                p.x = platLeft - p.width / 2;
                p.vx = 0;
                
                // Ledge Grabbing Check
                if (!p.isGrounded && Math.abs(p.y - platTop) < 16 && p.vy >= 0) {
                  p.isGrabbingLedge = true;
                  p.grabbedLedgeId = plat.id;
                  p.grabXSide = -1; // hanging on left side
                  p.y = platTop + 10;
                  p.vy = 0;
                }
              }
              // Hit wall from right
              else if (p.vx < 0 && playerRight > platRight) {
                p.x = platRight + p.width / 2;
                p.vx = 0;

                // Ledge Grabbing Check
                if (!p.isGrounded && Math.abs(p.y - platTop) < 16 && p.vy >= 0) {
                  p.isGrabbingLedge = true;
                  p.grabbedLedgeId = plat.id;
                  p.grabXSide = 1; // hanging on right side
                  p.y = platTop + 10;
                  p.vy = 0;
                }
              }
            }
          }
        });

        p.y += p.vy;

        // --- 6. Obstacle Collisions ---
        state.obstacles.forEach((o) => {
          // Skip if crumbled cardboard
          if (o.y === -9999) return;

          const playerLeft = p.x - p.width / 2;
          const playerRight = p.x + p.width / 2;
          const playerTop = p.y - p.height;
          const playerBottom = p.y;

          const oLeft = o.x;
          const oRight = o.x + o.width;
          const oTop = o.y;
          const oBottom = o.y + o.height;

          // Check overlap
          if (playerRight > oLeft && playerLeft < oRight && playerBottom > oTop && playerTop < oBottom) {
            
            // Conveyor Belt
            if (o.type === 'conveyor') {
              if (playerBottom <= oTop + 12) {
                state.conveyorSpeedAdded = o.speed || 0;
                p.isGrounded = true;
                p.doubleJumpsLeft = 1;
              }
            }

            // Sofa / Beanbag - Comical high bounce!
            else if (o.type === 'sofa' || o.type === 'beanbag') {
              if (p.vy > 0 && playerBottom <= oTop + 25) {
                p.y = oTop;
                p.vy = -p.vy * (o.bounceMultiplier || 1.6);
                if (p.vy > -4) p.vy = -6; // minimum bounce
                if (p.vy < -12) p.vy = -12; // maximum bounce cap

                audioEngine.playBounce();
                state.bouncesCount++;

                // Spawn bouncy sparkles
                for (let i = 0; i < 8; i++) {
                  state.particles.push({
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -Math.random() * 4 - 2,
                    size: Math.random() * 4 + 3,
                    color: o.color,
                    alpha: 0.9,
                    life: 0,
                    maxLife: 40,
                    type: 'sparkle'
                  });
                }
                
                p.sighPromptText = ["Booooing!", "Wheeeee...", "Lazy launch!"][Math.floor(Math.random() * 3)];
                p.sighPromptTimer = 80;
                onGameStatsUpdate(state.fallsCount, state.bouncesCount, Math.floor(state.maxIdleDuration / 1000), false);
              }
            }

            // Cardboard bridge triggering crumble
            else if (o.type === 'cardboard_bridge') {
              if (playerBottom <= oTop + 12) {
                o.isTriggered = true;
                p.isGrounded = true;
                p.doubleJumpsLeft = 1;
              }
            }

            // Pillow Roller - Comically gentle nudge instead of aggressive hit!
            else if (o.type === 'pillow_roller') {
              const isJogging = keys['jog'];
              o.direction = p.x < o.x + o.width / 2 ? 1 : -1; // reverse rolling direction
              o.isTriggered = true; // start squish trigger

              if (isJogging) {
                p.vx = p.x < o.x + o.width / 2 ? -2.8 : 2.8;
                p.vy = -2.2;
                p.ragdollTimer = 25; // short daze
                audioEngine.playBounce();
                p.sighPromptText = "Oof! Soft pillow nudge!";
                p.sighPromptTimer = 70;
              } else {
                p.vx = p.x < o.x + o.width / 2 ? -1.6 : 1.6;
                p.vy = -1.0;
                // No dazed tumble! Just a gentle bounce back
                audioEngine.playBounce();
                p.sighPromptText = [
                  "*Poof!* Comfy bump.",
                  "*Nudge...* Pillow fight?",
                  "Excuse me, trying to nap here."
                ][Math.floor(Math.random() * 3)];
                p.sighPromptTimer = 60;
              }

              // Spawn soft fluffy white feathers / particles
              for (let i = 0; i < 6; i++) {
                state.particles.push({
                  x: p.x,
                  y: p.y - 15,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -Math.random() * 2,
                  size: Math.random() * 3 + 4,
                  color: '#ffffff', // feather color
                  alpha: 0.8,
                  life: 0,
                  maxLife: 30,
                  type: 'dust'
                });
              }
            }

            // Pendulums and bookshelf push the player back comically
            else if (o.type === 'pendulum' || o.type === 'bookshelf') {
              p.vx = p.x < o.x + o.width / 2 ? -4 : 4;
              p.vy = -3.5;
              p.ragdollTimer = 60; // enter dazed tumble mode for 1 second
              audioEngine.playSplat();
              p.sighPromptText = "*Ouch!* Too fast...";
              p.sighPromptTimer = 90;
            }

            // Updraft fans lift the player slowly
            else if (o.type === 'fan') {
              p.vy -= 0.65;
              if (p.vy < -4.5) p.vy = -4.5; // terminal rise limit
              p.isGrounded = false;
              
              // floaty draft particles
              if (Math.random() > 0.4) {
                state.particles.push({
                  x: o.x + Math.random() * o.width,
                  y: o.y,
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: -3 - Math.random() * 2,
                  size: Math.random() * 2 + 1,
                  color: '#ffffff',
                  alpha: 0.5,
                  life: 0,
                  maxLife: 50,
                  type: 'dust'
                });
              }
            }
          }
        });
      }

      // Add conveyor speed
      p.x += state.conveyorSpeedAdded;

      // Bound player inside Level boundaries
      if (p.x < 20) {
        p.x = 20;
        p.vx = 0;
      }
      if (p.x > state.levelWidth - 20) {
        p.x = state.levelWidth - 20;
        p.vx = 0;
      }

      // Check Fall into Abyss (FAIL)
      if (p.y > state.levelHeight + 100) {
        respawnPlayer();
      }

      // --- 7. Checkpoints, Collectibles & Goals ---
      state.checkpoints.forEach((cp) => {
        const dist = Math.abs(p.x - cp.x);
        if (dist < 40 && Math.abs(p.y - cp.y) < 60) {
          if (!cp.isActivated) {
            cp.isActivated = true;
            state.checkpointX = cp.x;
            state.checkpointY = cp.y;
            audioEngine.playCheckpoint();
            
            // floating Zzz checkpoint indicators
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: cp.x,
                y: cp.y - 10,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                size: Math.random() * 3 + 8,
                color: '#93a187',
                alpha: 0.9,
                life: 0,
                maxLife: 60,
                type: 'zzz',
                text: 'Z'
              });
            }

            p.sighPromptText = "Phew, checkpoint! I can sleep here now.";
            p.sighPromptTimer = 120;
          }
        }
      });

      // Collect Mugs
      state.collectibles.forEach((c) => {
        if (!c.isCollected) {
          const dist = Math.hypot(p.x - c.x, (p.y - p.height/2) - c.y);
          if (dist < 32) {
            c.isCollected = true;
            audioEngine.playCollect();
            setCoinsCollectedThisRun(prev => prev + 1);
            
            // Add to stats
            setStats(prev => {
              const mugs = prev.coffeeMugs + 1;
              const unlocked = [...prev.unlockedCosmetics];
              return {
                ...prev,
                coffeeMugs: mugs
              };
            });

            // Particles
            for (let i = 0; i < 6; i++) {
              state.particles.push({
                x: c.x,
                y: c.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 2 + 3,
                color: '#a1836a', // brown coffee steam
                alpha: 0.9,
                life: 0,
                maxLife: 30,
                type: 'coffee_steam'
              });
            }
          }
        }
      });

      // Goal / Level Completion
      const distToGoalX = Math.abs(p.x - state.goal.x);
      const distToGoalY = Math.abs(p.y - state.goal.y);
      if (distToGoalX < 60 && distToGoalY < 90) {
        handleLevelComplete();
      }

      // --- 8. Particle Dynamics ---
      state.particles.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;
        part.alpha = 1.0 - (part.life / part.maxLife);
        
        if (part.type === 'zzz' && Math.random() > 0.4) {
          part.vx += (Math.random() - 0.5) * 0.2; // drifting wobble
        }

        if (part.life >= part.maxLife) {
          state.particles.splice(index, 1);
        }
      });

      // --- 9. Smooth Camera Tracking ---
      const cam = state.camera;
      const targetCamX = p.x - canvas.width / 2;
      const targetCamY = p.y - canvas.height / 2 - 40;

      cam.x = cam.x * 0.88 + targetCamX * 0.12;
      cam.y = cam.y * 0.88 + targetCamY * 0.12;

      // Clamp camera
      const maxCamX = state.levelWidth - canvas.width;
      const maxCamY = state.levelHeight - canvas.height;
      
      if (cam.x < 0) cam.x = 0;
      if (cam.x > maxCamX && maxCamX > 0) cam.x = maxCamX;
      if (cam.y < 0) cam.y = 0;
      if (cam.y > maxCamY && maxCamY > 0) cam.y = maxCamY;

      // Dynamic zoom pacing: zoom out slightly during falls or high momentum swings
      if (Math.abs(p.vy) > 6 || p.isSwinging) {
        cam.targetZoom = 0.88;
      } else {
        cam.targetZoom = 1.0;
      }
      cam.zoom = cam.zoom * 0.95 + cam.targetZoom * 0.05;

      // --- 10. RENDER DRAWING SCENE ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      
      // Multi-depth camera zoom projection
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.translate(-cam.x, -cam.y);

      // A. Abstract low-poly background layers (Parallax)
      drawParallaxBackground(ctx, cam.x);

      // B. Render Platforms with 3D Cabinet projection (concrete block look)
      state.platforms.forEach((plat) => {
        drawPlatform3D(ctx, plat);
      });

      // C. Render Checkpoint indicators (flags or pillows)
      state.checkpoints.forEach((cp) => {
        drawCheckpointFlag(ctx, cp);
      });

      // D. Render Ropes
      state.ropes.forEach((r) => {
        drawRope(ctx, r);
      });

      // E. Render Obstacles
      state.obstacles.forEach((o) => {
        if (o.y !== -9999) {
          drawObstacle3D(ctx, o);
        }
      });

      // F. Render Collectibles
      state.collectibles.forEach((c) => {
        if (!c.isCollected) {
          drawCollectible(ctx, c);
        }
      });

      // G. Render Goal mattress
      drawGoalBed(ctx, state.goal);

      // H. Render Cozy Character
      drawCharacter(ctx, p);

      // I. Render Particles
      state.particles.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;

        if (part.type === 'zzz') {
          ctx.font = `bold ${part.size}px "JetBrains Mono"`;
          ctx.fillText(part.text || 'Z', part.x, part.y);
        } else if (part.type === 'coffee_steam') {
          ctx.font = `${part.size}px "Inter"`;
          ctx.fillText('☕', part.x, part.y);
        } else {
          ctx.beginPath();
          ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      ctx.restore(); // end camera transformation

      // Request next frame
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, levelIndex, keyBindings, mode]);

  // Level Completion handling
  const handleLevelComplete = () => {
    setIsPlaying(false);
    const runTime = Date.now() - stateRef.current.runStartTime;
    const isSlowrun = runTime > 180000; // 3 minutes for slowrun

    audioEngine.playCheckpoint();

    setStats(prev => {
      const activeLvlId = level.id;
      const currentBest = prev.highScores[activeLvlId];
      const newScores = { ...prev.highScores };
      
      if (currentBest === undefined || runTime < currentBest) {
        newScores[activeLvlId] = runTime;
      }

      // Unlock next level
      let nextIdx = levelIndex + 1;
      const unlocked = [...prev.unlockedLevels];
      if (nextIdx < LEVELS.length && !unlocked.includes(nextIdx)) {
        unlocked.push(nextIdx);
      }

      return {
        ...prev,
        highScores: newScores,
        unlockedLevels: unlocked,
        coffeeMugs: prev.coffeeMugs + 10 // bonus mugs for finish
      };
    });

    onGameStatsUpdate(stateRef.current.fallsCount, stateRef.current.bouncesCount, Math.floor(stateRef.current.maxIdleDuration / 1000), isSlowrun);
  };

  // --- Rendering Helpers ---

  // Parallax abstract environment layers
  const drawParallaxBackground = (ctx: CanvasRenderingContext2D, camX: number) => {
    const state = stateRef.current;
    ctx.save();
    
    // Layer 1 (Distant clouds / mountains) - moves at 10% speed
    ctx.fillStyle = '#dbd8d0';
    ctx.beginPath();
    for (let i = -1000; i < state.levelWidth + 1000; i += 600) {
      const startX = i - camX * 0.1;
      ctx.moveTo(startX, state.levelHeight);
      ctx.quadraticCurveTo(startX + 300, state.levelHeight - 350, startX + 600, state.levelHeight);
    }
    ctx.fill();

    // Layer 2 (Concrete geometric cubes floating in the air) - moves at 25% speed
    ctx.fillStyle = '#cbbaa9';
    for (let i = 100; i < state.levelWidth; i += 400) {
      const floatX = i - camX * 0.25;
      const floatY = 150 + Math.sin(i * 0.05) * 60;
      // Draw a 3D box
      drawLowPolyCube(ctx, floatX, floatY, 80, '#9a8a7a', '#cbbaa9', '#857563');
    }

    ctx.restore();
  };

  // 3D Isometric concrete blocks
  const drawPlatform3D = (ctx: CanvasRenderingContext2D, plat: Platform) => {
    const depth = 22; // 3D Extrusion height
    
    ctx.save();
    
    // Main base face (Front side)
    ctx.fillStyle = plat.color;
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    // Top extruded face (light reflection)
    ctx.fillStyle = adjustBrightness(plat.color, 15);
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + depth, plat.y - depth);
    ctx.lineTo(plat.x + plat.width + depth, plat.y - depth);
    ctx.lineTo(plat.x + plat.width, plat.y);
    ctx.closePath();
    ctx.fill();

    // Right side extruded face (shadows)
    ctx.fillStyle = adjustBrightness(plat.color, -25);
    ctx.beginPath();
    ctx.moveTo(plat.x + plat.width, plat.y);
    ctx.lineTo(plat.x + plat.width + depth, plat.y - depth);
    ctx.lineTo(plat.x + plat.width + depth, plat.y + plat.height - depth);
    ctx.lineTo(plat.x + plat.width, plat.y + plat.height);
    ctx.closePath();
    ctx.fill();

    // Soft drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.07)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(plat.x - 5, plat.y + plat.height, plat.width + 10, 10);

    // Optional textual label on the concrete block
    if (plat.label) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 11px "JetBrains Mono"';
      ctx.fillText(plat.label.toUpperCase(), plat.x + 12, plat.y + 24);
    }

    ctx.restore();
  };

  // Helper cube
  const drawLowPolyCube = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, cFace: string, cTop: string, cSide: string) => {
    const d = size * 0.4;
    ctx.save();
    
    // Front face
    ctx.fillStyle = cFace;
    ctx.fillRect(x, y, size, size);

    // Top face
    ctx.fillStyle = cTop;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + size + d, y - d);
    ctx.lineTo(x + size, y);
    ctx.closePath();
    ctx.fill();

    // Side face
    ctx.fillStyle = cSide;
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size + d, y - d);
    ctx.lineTo(x + size + d, y + size - d);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Dynamic Obstacle Drawing
  const drawObstacle3D = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
    ctx.save();
    
    const depth = 16;

    if (o.type === 'conveyor') {
      // Base
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      
      // Top belt details
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(o.x, o.y, o.width, 4);

      // Draw rollers rotating on conveyer
      ctx.fillStyle = '#2d3748';
      const spacing = 40;
      const rollOffset = (Date.now() * 0.08 * (o.speed || 1)) % spacing;
      for (let rx = o.x + rollOffset; rx < o.x + o.width; rx += spacing) {
        ctx.beginPath();
        ctx.arc(rx, o.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    else if (o.type === 'beanbag') {
      const defl = o.timer || 0;
      // Beanbag sinks vertically and bulges horizontally
      const hX = o.x - o.width * defl * 0.12;
      const hY = o.y + o.height * defl * 0.45;
      const hW = o.width * (1 + defl * 0.24);
      const hH = o.height * (1 - defl * 0.45);
      const rad = hW / 2;
      const controlY = hH;

      ctx.fillStyle = o.color;
      // Draw cushion arc
      ctx.beginPath();
      ctx.moveTo(hX, hY + hH);
      ctx.quadraticCurveTo(hX + rad, hY - controlY * 0.5, hX + hW, hY + hH);
      ctx.closePath();
      ctx.fill();

      // Extruded side shade
      ctx.fillStyle = adjustBrightness(o.color, -20);
      ctx.beginPath();
      ctx.moveTo(hX + hW, hY + hH);
      ctx.lineTo(hX + hW + depth, hY + hH - depth);
      ctx.quadraticCurveTo(hX + rad + depth, hY - controlY * 0.5 - depth, hX + depth, hY + hH - depth);
      ctx.closePath();
      ctx.fill();

      // Top soft cushion fluffiness lines
      ctx.strokeStyle = adjustBrightness(o.color, 15);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hX + 10, hY + hH - 10);
      ctx.quadraticCurveTo(hX + rad, hY + 12, hX + hW - 10, hY + hH - 10);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = 'bold 9px "JetBrains Mono"';
      ctx.fillText(defl > 0.1 ? `BEANBAG (DEFLATING ${Math.floor(defl * 100)}%)` : 'BEANBAG', hX + 12, hY + hH - 16);
    }

    else if (o.type === 'sofa') {
      const angle = o.angle || 0;
      const speed = o.speed !== undefined ? o.speed : 0;
      const maxSpd = o.maxTimer !== undefined ? o.maxTimer : 0.015;
      const fatigue = Math.max(0, 1 - (speed / (maxSpd || 0.015)));

      ctx.save();
      // Translate to the center of the sofa
      ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
      ctx.rotate(angle);

      // Coordinates relative to center
      const sX = -o.width / 2;
      const sY = -o.height / 2;
      const rad = o.width / 2;
      const controlY = o.height * 0.4;

      ctx.fillStyle = o.color;
      // Draw cushion arc
      ctx.beginPath();
      ctx.moveTo(sX, sY + o.height);
      ctx.quadraticCurveTo(sX + rad, sY - controlY * 0.5, sX + o.width, sY + o.height);
      ctx.closePath();
      ctx.fill();

      // Extruded side shade
      ctx.fillStyle = adjustBrightness(o.color, -20);
      ctx.beginPath();
      ctx.moveTo(sX + o.width, sY + o.height);
      ctx.lineTo(sX + o.width + depth, sY + o.height - depth);
      ctx.quadraticCurveTo(sX + rad + depth, sY - controlY * 0.5 - depth, sX + depth, sY + o.height - depth);
      ctx.closePath();
      ctx.fill();

      // Top soft lines
      ctx.strokeStyle = adjustBrightness(o.color, 15);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sX + 10, sY + o.height - 10);
      ctx.quadraticCurveTo(sX + rad, sY + 12, sX + o.width - 10, sY + o.height - 10);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = 'bold 9px "JetBrains Mono"';
      ctx.fillText(fatigue > 0.4 ? `TIRED COUCH (${Math.floor(fatigue * 100)}%)` : 'LAZY COUCH', sX + 12, sY + o.height - 16);

      ctx.restore();
    }

    else if (o.type === 'cardboard_bridge') {
      // Draw brown cardboard sheet
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);

      // Cardboard strip lines
      ctx.strokeStyle = adjustBrightness(o.color, -15);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let bx = o.x + 15; bx < o.x + o.width; bx += 25) {
        ctx.moveTo(bx, o.y);
        ctx.lineTo(bx - 5, o.y + o.height);
      }
      ctx.stroke();

      // Crumbling vibration shake
      if (o.isTriggered && o.timer) {
        const shake = (o.timer % 4 > 2) ? 2 : -2;
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(o.x + shake, o.y, o.width, o.height);
      }
    }

    else if (o.type === 'pillow_roller') {
      // Giant green cylinders
      ctx.save();
      ctx.translate(o.x + o.width/2, o.y + o.height/2);
      ctx.rotate((Date.now() * 0.005) * (o.speed || 1));

      // Comical squash scale if triggered by collision
      if (o.isTriggered) {
        ctx.scale(1.25, 0.75);
      }
      
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(0, 0, o.width/2, 0, Math.PI * 2);
      ctx.fill();

      // Concentric lines to show rotation
      ctx.strokeStyle = adjustBrightness(o.color, 25);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, o.width/3, 0, Math.PI);
      ctx.stroke();
      
      ctx.restore();
    }

    else if (o.type === 'pendulum') {
      // A swinging wire with a heavy concrete ball at the end
      const anchorX = o.x + o.width/2;
      const anchorY = o.y - 100; // anchor is up
      const currentAngle = o.angle || 0;
      const ropeLength = 150;

      const bobX = anchorX + Math.sin(currentAngle) * ropeLength;
      const bobY = anchorY + Math.cos(currentAngle) * ropeLength;

      // Draw Rope
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob ball (pillow)
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(bobX, bobY, o.width/2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = adjustBrightness(o.color, 20);
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    else if (o.type === 'elevator') {
      // Draw moving platform elevator
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);

      // Support steel cords
      ctx.strokeStyle = '#718096';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(o.x + 10, o.y);
      ctx.lineTo(o.x + 10, 0);
      ctx.moveTo(o.x + o.width - 10, o.y);
      ctx.lineTo(o.x + o.width - 10, 0);
      ctx.stroke();
    }

    else if (o.type === 'fan') {
      // Ground fan with turning blade
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(o.x, o.y, o.width, o.height);
      
      // Wind Column (Semi-transparent)
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(o.x, o.y - 300, o.width, 300);

      // Blade spinning
      ctx.fillStyle = o.color;
      ctx.save();
      ctx.translate(o.x + o.width/2, o.y + 10);
      ctx.rotate(Date.now() * 0.05);
      ctx.fillRect(-o.width/3, -3, o.width/1.5, 6);
      ctx.restore();
    }

    else {
      // Bookshelves/Normal blocks
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    }

    ctx.restore();
  };

  // Rope rendering
  const drawRope = (ctx: CanvasRenderingContext2D, r: Rope) => {
    ctx.save();
    
    // Draw attachment bracket
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.arc(r.anchorX, r.anchorY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Rope line
    const endX = r.anchorX + Math.sin(r.angle) * r.length;
    const endY = r.anchorY + Math.cos(r.angle) * r.length;

    ctx.strokeStyle = '#856449';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.anchorX, r.anchorY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Comical red handle loop
    ctx.fillStyle = '#9c3d32';
    ctx.beginPath();
    ctx.arc(endX, endY, 12, 0, Math.PI * 2);
    ctx.arc(endX, endY, 7, 0, Math.PI * 2, true); // donut punchout
    ctx.fill();

    ctx.restore();
  };

  // Checkpoint Flag
  const drawCheckpointFlag = (ctx: CanvasRenderingContext2D, cp: Checkpoint) => {
    ctx.save();
    const h = 50;

    // Pole
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y);
    ctx.lineTo(cp.x, cp.y - h);
    ctx.stroke();

    // Base pillow/concrete
    ctx.fillStyle = '#bbb7af';
    ctx.fillRect(cp.x - 12, cp.y - 10, 24, 10);

    // Flag banner (unlocked = soft green, locked = soft purple)
    ctx.fillStyle = cp.isActivated ? '#8da681' : '#ad7e8a';
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y - h);
    ctx.lineTo(cp.x + 25, cp.y - h + 10);
    ctx.lineTo(cp.x, cp.y - h + 20);
    ctx.closePath();
    ctx.fill();

    // Draw little letters "ZZZ" if active
    if (cp.isActivated) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono"';
      ctx.fillText('ZZZ', cp.x + 3, cp.y - h + 12);
    }

    ctx.restore();
  };

  // Collectible coffee and zzz mugs
  const drawCollectible = (ctx: CanvasRenderingContext2D, c: Collectible) => {
    ctx.save();
    
    // Floating bounce offset
    const floatY = Math.sin(Date.now() * 0.005 + c.x * 0.1) * 6;

    if (c.type === 'coffee') {
      // Draw cute hot coffee cup
      ctx.fillStyle = '#cf9e7a'; // beige ceramic
      ctx.beginPath();
      ctx.arc(c.x, c.y + floatY, 12, 0, Math.PI, false);
      ctx.lineTo(c.x - 12, c.y + floatY - 12);
      ctx.lineTo(c.x + 12, c.y + floatY - 12);
      ctx.closePath();
      ctx.fill();

      // Handle
      ctx.strokeStyle = '#cf9e7a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x + 12, c.y + floatY - 6, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Coffee content inside
      ctx.fillStyle = '#4a3b32';
      ctx.fillRect(c.x - 8, c.y + floatY - 11, 16, 4);

      // Steam puffs rising
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      const steamShift = (Date.now() * 0.02) % 15;
      ctx.beginPath();
      ctx.moveTo(c.x - 4, c.y + floatY - 15 - steamShift);
      ctx.bezierCurveTo(c.x - 6, c.y + floatY - 20 - steamShift, c.x - 2, c.y + floatY - 25 - steamShift, c.x - 4, c.y + floatY - 30 - steamShift);
      ctx.moveTo(c.x + 4, c.y + floatY - 15 - steamShift);
      ctx.bezierCurveTo(c.x + 2, c.y + floatY - 20 - steamShift, c.x + 6, c.y + floatY - 25 - steamShift, c.x + 4, c.y + floatY - 30 - steamShift);
      ctx.stroke();
    } else {
      // Bubble Zzz
      ctx.fillStyle = '#c5b5f2';
      ctx.beginPath();
      ctx.arc(c.x, c.y + floatY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText('Zzz', c.x, c.y + floatY + 4);
    }

    ctx.restore();
  };

  // Goal bed / final mattress
  const drawGoalBed = (ctx: CanvasRenderingContext2D, goal: { x: number; y: number; width: number; height: number }) => {
    ctx.save();
    
    // Draw wood frame of mattress
    ctx.fillStyle = '#a38a71';
    ctx.fillRect(goal.x, goal.y + 40, goal.width, 20);

    // Mattress soft layer
    ctx.fillStyle = '#f1ebd9';
    ctx.fillRect(goal.x + 4, goal.y + 15, goal.width - 8, 25);

    // Fluffy pillows
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(goal.x + 10, goal.y + 5, 20, 12);
    ctx.fillRect(goal.x + goal.width - 30, goal.y + 5, 20, 12);

    // Warm blanket draped over
    ctx.fillStyle = '#8ca1a3';
    ctx.fillRect(goal.x + 25, goal.y + 15, goal.width - 50, 25);

    // Draw little sleeping crown overhead
    ctx.fillStyle = '#d4af37';
    const crownBounce = Math.sin(Date.now() * 0.003) * 5;
    ctx.beginPath();
    ctx.moveTo(goal.x + goal.width / 2 - 12, goal.y - 20 + crownBounce);
    ctx.lineTo(goal.x + goal.width / 2 - 12, goal.y - 10 + crownBounce);
    ctx.lineTo(goal.x + goal.width / 2 + 12, goal.y - 10 + crownBounce);
    ctx.lineTo(goal.x + goal.width / 2 + 12, goal.y - 20 + crownBounce);
    ctx.lineTo(goal.x + goal.width / 2 + 6, goal.y - 14 + crownBounce);
    ctx.lineTo(goal.x + goal.width / 2, goal.y - 24 + crownBounce);
    ctx.lineTo(goal.x + goal.width / 2 - 6, goal.y - 14 + crownBounce);
    ctx.closePath();
    ctx.fill();

    // Flag text "GO TO BED"
    ctx.fillStyle = '#313330';
    ctx.font = 'bold 10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH MATTRESS', goal.x + goal.width / 2, goal.y - 35 + crownBounce);

    ctx.restore();
  };

  // --- Procedural Lazy Character Engine ---
  const drawCharacter = (ctx: CanvasRenderingContext2D, p: typeof stateRef.current.player) => {
    ctx.save();

    // Apply roll angle or power nap lay flat
    if (p.state === 'roll' || p.state === 'ragdoll' || p.activeEmote === 'power_nap') {
      ctx.translate(p.x, p.y - p.height / 2);
      const angle = p.activeEmote === 'power_nap' ? Math.PI / 2 : p.rollAngle;
      ctx.rotate(angle);
      ctx.translate(-p.x, -(p.y - p.height / 2));
      
      if (p.activeEmote === 'power_nap') {
        ctx.translate(0, 10);
      }
    }

    // Horizontal direction flipping (scale -1 on x-axis)
    if (p.facing === -1) {
      ctx.translate(p.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-p.x, 0);
    }

    const outfitId = stats.activeCosmetics.outfit;
    const outfitItem = COSMETIC_SHOP.find(c => c.id === outfitId) || COSMETIC_SHOP[0];
    const hoodieColor = outfitItem.color;

    // Head base position
    const headX = p.x;
    let headY = p.y - p.height + 15;

    // Crouch deformation
    if (p.isCrouching) {
      headY = p.y - p.height + 10;
    }

    // Base adjustments for custom idle animations and emotes
    let bodySquashHeight = p.isCrouching ? 16 : 28;
    let customArmAngleLeft = 0;
    let customArmAngleRight = 0;
    let forceEyesClosed = false;
    let forceEyesWideOpen = false;
    let forceMouthYawn = false;
    let forceMouthFlat = false;

    // Apply idle animation visual transforms
    if (p.activeIdleAnim) {
      const progress = 180 - p.idleAnimTimer;
      if (p.activeIdleAnim === 'yawn') {
        forceMouthYawn = true;
        forceEyesClosed = true;
        // Raise arms slowly
        customArmAngleLeft = -60 + Math.sin(progress * 0.1) * 15;
        customArmAngleRight = 60 - Math.sin(progress * 0.1) * 15;
        headY += Math.sin(progress * 0.08) * 1.5;
      } else if (p.activeIdleAnim === 'check_watch') {
        // Bent left arm up to face
        customArmAngleLeft = -115;
        customArmAngleRight = 10;
        headY += 2; // tilt head down
      } else if (p.activeIdleAnim === 'nod_off') {
        if (progress < 140) {
          // Slowly slumping down, eyes closed
          forceEyesClosed = true;
          headY += Math.min(6, progress * 0.05);
        } else {
          // Suddenly snap up with eyes wide open!
          forceEyesWideOpen = true;
          headY -= 2;
        }
      } else if (p.activeIdleAnim === 'scratch') {
        // rapid right arm movement
        customArmAngleLeft = 10;
        customArmAngleRight = -110 + Math.sin(progress * 0.6) * 15;
      } else if (p.activeIdleAnim === 'slump') {
        // slump torso and shoulders
        bodySquashHeight = 22;
        headY += 6;
        customArmAngleLeft = 5;
        customArmAngleRight = -5;
      } else if (p.activeIdleAnim === 'nails') {
        customArmAngleLeft = -105;
        customArmAngleRight = 5;
        headY += 1.5;
      } else if (p.activeIdleAnim === 'bubble') {
        forceEyesClosed = true;
      } else if (p.activeIdleAnim === 'shrug') {
        customArmAngleLeft = -35;
        customArmAngleRight = 35;
        forceMouthFlat = true;
      } else if (p.activeIdleAnim === 'tie_slipper') {
        // Bend way down
        bodySquashHeight = 18;
        headY += 14;
        customArmAngleLeft = -25;
        customArmAngleRight = 25;
      } else if (p.activeIdleAnim === 'sleep_sit') {
        // Sitting flat on the floor
        bodySquashHeight = 20;
        headY += 14;
        forceEyesClosed = true;
        customArmAngleLeft = -15;
        customArmAngleRight = 15;
      }
    }

    // Apply Emote visual transforms
    if (p.activeEmote) {
      if (p.activeEmote === 'sigh_despair') {
        customArmAngleLeft = 5;
        customArmAngleRight = -5;
        headY += 4;
        forceMouthFlat = true;
      } else if (p.activeEmote === 'power_nap') {
        forceEyesClosed = true;
        customArmAngleLeft = -160;
        customArmAngleRight = -165;
      } else if (p.activeEmote === 'facepalm') {
        customArmAngleLeft = -130; // left hand on face
        customArmAngleRight = 10;
        headY += 2;
        forceEyesClosed = true;
      } else if (p.activeEmote === 'sip_coffee') {
        customArmAngleLeft = -110; // Left hand to mouth
        customArmAngleRight = 10;
      } else if (p.activeEmote === 'lazy_stretch') {
        customArmAngleLeft = -155;
        customArmAngleRight = 155;
        headY -= 2;
        forceEyesClosed = true;
      }
    }

    // Draw Backpack First (behind body)
    const bpId = stats.activeCosmetics.backpack;
    const bpItem = COSMETIC_SHOP.find(c => c.id === bpId);
    if (bpItem && bpId !== 'backpack_none') {
      ctx.fillStyle = bpItem.color;
      if (bpId === 'backpack_pillow') {
        // Soft white pillowy backpack
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(p.x - 22, headY + 12, 14, 28, 4);
        ctx.fill();
        ctx.stroke();

        // draw small cozy quilt button details
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(p.x - 18, headY + 20, 2, 2);
        ctx.fillRect(p.x - 18, headY + 28, 2, 2);
      } else if (bpId === 'backpack_bag') {
        // Red rolled sleeping bag
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(p.x - 24, headY + 15, 12, 22);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(p.x - 24, headY + 12, 12, 3);
        ctx.fillRect(p.x - 24, headY + 37, 12, 3);
      } else if (bpId === 'backpack_clock') {
        // Snoozed alarm clock
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(p.x - 16, headY + 24, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - 16, headY + 24, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 6px sans-serif';
        ctx.fillText('07:00', p.x - 23, headY + 26);
      } else if (bpId === 'backpack_cat') {
        // Cute sleeping cat in astronaut window backpack
        ctx.fillStyle = '#f97316'; // orange cat body
        ctx.beginPath();
        ctx.roundRect(p.x - 22, headY + 14, 12, 24, 6);
        ctx.fill();
        // astronaut bubble window
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(p.x - 14, headY + 24, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        // sleeping cat whiskers inside
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(p.x - 14, headY + 25, 3, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // --- Draw Body / Torso (Oversized Hoodie) ---
    ctx.fillStyle = hoodieColor;
    ctx.beginPath();
    // cozy floppy curve
    ctx.roundRect(p.x - 15, headY + 10, 26, bodySquashHeight, 10);
    ctx.fill();

    // Hoodie front pocket pouch
    ctx.strokeStyle = adjustBrightness(hoodieColor, -12);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x - 6, headY + 24);
    ctx.quadraticCurveTo(p.x + 2, headY + 32, p.x + 8, headY + 24);
    ctx.stroke();

    // --- Draw Limbs (Procedural Joint Rotations) ---
    // Leg joints
    const walkSwing = Math.sin(Date.now() * 0.007) * 12;
    const jogSwing = Math.sin(Date.now() * 0.015) * 22;
    const legAngle = p.state === 'walk' ? walkSwing : p.state === 'jog' ? jogSwing : 0;

    const slipId = stats.activeCosmetics.slippers;
    const slipperItem = COSMETIC_SHOP.find(c => c.id === slipId) || COSMETIC_SHOP[0];

    const drawLeg = (offsetX: number, angleOffset: number) => {
      ctx.save();
      ctx.translate(p.x + offsetX, headY + (p.isCrouching ? 20 : 34));
      ctx.rotate(angleOffset * Math.PI / 180);
      
      // Sweatpant leg segment
      ctx.strokeStyle = hoodieColor;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, p.isCrouching ? 10 : 15);
      ctx.stroke();

      // Foot wearing Slippers
      ctx.fillStyle = slipperItem.color;
      const slipperY = p.isCrouching ? 10 : 15;
      
      if (slipId === 'slipper_socks') {
        // Simple grey socks
        ctx.fillRect(-3, slipperY, 9, 5);
      } else if (slipId === 'slipper_hotel') {
        // Thin white flat hotel slippers
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, slipperY, 11, 4);
      } else if (slipId === 'slipper_bunny') {
        // Pink fluffy bunny slippers
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(-5, slipperY - 2, 12, 7);
        // little ears
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(4, slipperY - 6, 2, 4);
      } else if (slipId === 'slipper_bear') {
        // Huge bear claws
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-6, slipperY - 3, 14, 8);
        ctx.fillStyle = '#ffffff'; // white claws
        ctx.fillRect(5, slipperY, 2, 2);
        ctx.fillRect(2, slipperY, 2, 2);
      } else {
        // Bare feet with band-aid
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-3, slipperY, 8, 5);
      }

      ctx.restore();
    };

    // Draw two legs staggered (or sitting down flat)
    if (p.activeIdleAnim === 'sleep_sit') {
      drawLeg(-6, -90);
      drawLeg(5, 90);
    } else {
      drawLeg(-5, legAngle);
      drawLeg(4, -legAngle);
    }

    // --- Draw Arms ---
    let armAngle = 0;
    if (p.state === 'fall' || p.state === 'jump') {
      armAngle = -120; // flailing upward
    } else if (p.state === 'grab') {
      armAngle = -150; // straight up to ledge
    } else if (p.state === 'walk') {
      armAngle = -legAngle; // inverse swing of walk
    } else if (p.state === 'jog') {
      armAngle = -legAngle * 0.8;
    } else if (p.state === 'idle') {
      armAngle = Math.sin(Date.now() * 0.002) * 5; // lazy breathing
    }

    let armAngleLeft = armAngle;
    let armAngleRight = -armAngle * 0.5;

    if (p.activeIdleAnim || p.activeEmote) {
      armAngleLeft = customArmAngleLeft;
      armAngleRight = customArmAngleRight;
    }

    const drawArm = (offsetX: number, angle: number) => {
      ctx.save();
      ctx.translate(p.x + offsetX, headY + 14);
      ctx.rotate(angle * Math.PI / 180);
      
      ctx.strokeStyle = hoodieColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 14);
      ctx.stroke();

      // Hand skin tone
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, 15, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // If sipping coffee, draw mug in left hand
      if (p.activeEmote === 'sip_coffee' && offsetX < 0) {
        ctx.fillStyle = '#f1ebd9'; // porcelain cup
        ctx.fillRect(-5, 12, 10, 8);
        ctx.fillStyle = '#4a3b32'; // dark coffee liquid
        ctx.fillRect(-3, 13, 6, 2);
        ctx.strokeStyle = '#f1ebd9'; // handle
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-5, 16, 2.5, -Math.PI/2, Math.PI/2);
        ctx.stroke();
      }

      ctx.restore();
    };

    drawArm(-8, armAngleLeft);
    drawArm(8, armAngleRight);

    // --- Draw Head & Face ---
    ctx.fillStyle = '#fed7aa'; // soft warm skin tone
    ctx.beginPath();
    ctx.arc(headX, headY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Sleepy blinking eyes
    const isBlinking = Date.now() % 5000 < 150;
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2.0;

    if (isBlinking || p.state === 'ragdoll' || forceEyesClosed) {
      // closed / dizzy cross eyes
      ctx.beginPath();
      if (p.state === 'ragdoll') {
        // Comical cross eyes
        ctx.moveTo(headX + 2, headY - 3);
        ctx.lineTo(headX + 6, headY + 1);
        ctx.moveTo(headX + 6, headY - 3);
        ctx.lineTo(headX + 2, headY + 1);
      } else {
        ctx.moveTo(headX + 2, headY);
        ctx.lineTo(headX + 8, headY);
      }
      ctx.stroke();
    } else if (forceEyesWideOpen) {
      // Exaggerated wide open eyes
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(headX + 5, headY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(headX + 5, headY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cozy, sleepy half-closed eyelid arches
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(headX + 5, headY, 3, Math.PI, 0, false);
      ctx.fill();
      // tiny black pupils looking weary
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(headX + 5, headY - 1, 1, 0, Math.PI*2);
      ctx.fill();
    }

    // Lazy mouth
    ctx.fillStyle = '#2d3748';
    if ((p.sighPromptTimer > 0 && p.sighPromptText.includes('Yawn')) || forceMouthYawn) {
      // huge circular yawn mouth
      ctx.beginPath();
      ctx.arc(headX + 7, headY + 5, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (forceMouthFlat) {
      // flat straight bored line
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(headX + 3, headY + 6);
      ctx.lineTo(headX + 9, headY + 6);
      ctx.stroke();
    } else {
      // standard slight bored down-curve smile
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(headX + 6, headY + 7, 3, Math.PI, 0, true);
      ctx.stroke();
    }

    // Pink cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.beginPath();
    ctx.arc(headX + 9, headY + 4, 3, 0, Math.PI*2);
    ctx.fill();

    // --- Draw Hats ---
    const hatId = stats.activeCosmetics.hat;
    const hatItem = COSMETIC_SHOP.find(c => c.id === hatId);
    if (hatItem && hatId !== 'hat_none') {
      ctx.fillStyle = hatItem.color;
      if (hatId === 'hat_beanie') {
        // Soft slouchy beanie
        ctx.beginPath();
        ctx.roundRect(headX - 14, headY - 18, 26, 12, 6);
        ctx.fill();
        // pompom
        ctx.fillStyle = adjustBrightness(hatItem.color, 15);
        ctx.beginPath();
        ctx.arc(headX - 10, headY - 17, 4, 0, Math.PI*2);
        ctx.fill();
      } else if (hatId === 'hat_mask') {
        // Sleeping mask on forehead
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.roundRect(headX - 12, headY - 10, 24, 7, 3);
        ctx.fill();
        // cute closed eyes on the mask
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY - 6);
        ctx.lineTo(headX - 2, headY - 6);
        ctx.moveTo(headX + 2, headY - 6);
        ctx.lineTo(headX + 6, headY - 6);
        ctx.stroke();
      } else if (hatId === 'hat_nightcap') {
        // Drooping cone pom-pom nightcap
        ctx.beginPath();
        ctx.moveTo(headX - 13, headY - 11);
        ctx.bezierCurveTo(headX - 5, headY - 26, headX - 10, headY - 32, headX - 22, headY - 18);
        ctx.lineTo(headX - 13, headY - 5);
        ctx.closePath();
        ctx.fill();
        // white pompom puff at the fold end
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX - 23, headY - 17, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (hatId === 'hat_crown') {
        // Cute gold crown
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(headX - 10, headY - 11);
        ctx.lineTo(headX - 10, headY - 20);
        ctx.lineTo(headX - 5, headY - 15);
        ctx.lineTo(headX, headY - 24);
        ctx.lineTo(headX + 5, headY - 15);
        ctx.lineTo(headX + 10, headY - 20);
        ctx.lineTo(headX + 10, headY - 11);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw sleepy bubble if active
    if (p.activeIdleAnim === 'bubble') {
      const progress = 180 - p.idleAnimTimer;
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      if (progress < 160) {
        // Grow bubble
        const bubbleRad = Math.min(10, progress * 0.08);
        ctx.beginPath();
        ctx.arc(headX + 11, headY + 2, bubbleRad, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
      } else if (progress >= 160 && progress < 164) {
        // Popping splash!
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(headX + 11 + Math.cos(angle) * 12, headY + 2 + Math.sin(angle) * 12, 2, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.restore(); // restore joint mapping transformations // restore joint mapping transformations

    // --- Render Comic Bubble Dialogue Prompts overhead ---
    if (p.sighPromptTimer > 0) {
      ctx.save();
      ctx.translate(0, 0); // screen-relative or world-relative? World-relative!
      
      const bubX = p.x + 35;
      const bubY = headY - 30;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2.0;
      
      // Bubble box
      ctx.font = 'bold 11px "Inter"';
      const textWidth = ctx.measureText(p.sighPromptText).width;
      const bubW = textWidth + 18;
      const bubH = 26;

      ctx.beginPath();
      ctx.roundRect(bubX - bubW/2, bubY - bubH/2, bubW, bubH, 8);
      ctx.fill();
      ctx.stroke();

      // Tail pointing to player head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(p.x + 12, headY - 10);
      ctx.lineTo(bubX - 10, bubY + bubH/2 - 1);
      ctx.lineTo(bubX, bubY + bubH/2 - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // re-fill tail center to mask border
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(p.x + 13, headY - 9);
      ctx.lineTo(bubX - 8, bubY + bubH/2 - 2);
      ctx.lineTo(bubX + 2, bubY + bubH/2 - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1a202c';
      ctx.textAlign = 'center';
      ctx.fillText(p.sighPromptText, bubX, bubY + 4);

      ctx.restore();
    }
  };

  // Helper brightener
  const adjustBrightness = (hex: string, percent: number): string => {
    if (hex === 'transparent') return 'transparent';
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt(((R * (100 + percent)) / 100).toString());
    G = parseInt(((G * (100 + percent)) / 100).toString());
    B = parseInt(((B * (100 + percent)) / 100).toString());

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    R = R > 0 ? R : 0;
    G = G > 0 ? G : 0;
    B = B > 0 ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  // Run controls UI triggers
  const startStopGame = () => {
    // Unlocks context on click
    audioEngine.init();
    if (!isPlaying) {
      stateRef.current.runStartTime = Date.now() - timer;
      audioEngine.startMusic();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      audioEngine.stopMusic();
      setIsPlaying(false);
    }
  };

  const handlePauseToggle = () => {
    if (!isPlaying) return;
    if (isPaused) {
      stateRef.current.runStartTime = Date.now() - timer;
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const formatTimer = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    const dec = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${dec}`;
  };

  const activeLevelCompletionPercent = (): number => {
    const p = stateRef.current.player;
    const start = level.startX;
    const end = level.goalX;
    const total = end - start;
    const current = p.x - start;
    const percentage = Math.max(0, Math.min(100, (current / total) * 100));
    return Math.floor(percentage);
  };  return (
    <div className="flex flex-col w-full h-full bg-[#F5F2ED] rounded-none border border-[#BCB9B4] overflow-hidden" id="game-main-area">
      {/* Top Game Panel Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#E4E3E0] border-b border-[#BCB9B4]" id="game-controls-header">
        <div className="flex items-center gap-3">
          <div className="bg-[#2C2C2B] text-[#F5F2ED] font-sans text-[10px] tracking-wider px-2.5 py-1 rounded-none uppercase" id="game-badge">
            LIVE PREVIEW
          </div>
          <h2 className="text-sm font-sans font-bold text-[#2C2C2B]" id="level-title-display">
            {level.name}
          </h2>
        </div>

        {/* HUD Statistics */}
        <div className="flex items-center gap-4 text-xs font-sans text-[#2C2C2B]" id="hud-stats">
          <div className="flex items-center gap-1.5" title="Coffee Mugs collected in this level">
            <Coffee className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span className="text-[11px] font-sans tracking-wide">{coinsCollectedThisRun} collected</span>
          </div>
          <div className="bg-[#F5F2ED] px-2 py-0.5 border border-[#BCB9B4] text-[10px] uppercase font-sans tracking-wider">
            Progress: <span className="font-bold text-[#2C2C2B]">{activeLevelCompletionPercent()}%</span>
          </div>
          <div className="bg-[#F5F2ED] px-2.5 py-1 font-sans font-bold text-[#2C2C2B] text-xs border border-[#BCB9B4] min-w-[70px] text-center" id="level-timer">
            {formatTimer(timer)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Unmute Lo-Fi synth triggers */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-none border transition-all text-[10px] font-sans tracking-wider flex items-center gap-1.5 ${
              isAudioMuted
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-[#F5F2ED] text-[#2C2C2B] border-[#BCB9B4] hover:bg-[#E4E3E0]'
            }`}
            id="audio-mute-toggle"
            title="Toggle lo-fi ambient tracks & comedic sound effects"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isAudioMuted ? 'MUTE ON' : 'MUTE OFF'}</span>
          </button>

          {/* Quick Respawn */}
          <button
            onClick={() => respawnPlayer()}
            className="p-2 rounded-none bg-[#F5F2ED] border border-[#BCB9B4] text-[#2C2C2B] hover:bg-[#E4E3E0] transition-all text-[10px] font-sans tracking-wider flex items-center gap-1"
            title="Respawn at last checkpoint"
            id="quick-respawn-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESPAWN (R)</span>
          </button>

          {/* Play / Stop Trigger */}
          <button
            onClick={startStopGame}
            className={`px-4 py-2 rounded-none font-sans text-[10px] tracking-wider font-bold text-[#F5F2ED] transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 border border-amber-700'
                : 'bg-[#5A5A40] hover:bg-opacity-95 border border-[#5A5A40]'
            }`}
            id="start-stop-trigger"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> STOP
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> START GAME
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 min-h-[400px] w-full bg-[#fcfbfa] flex items-center justify-center overflow-hidden" ref={containerRef}>
        
        {/* The actual physics-driven Canvas */}
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair focus:outline-none"
          id="physics-game-canvas"
        />

        {/* Idle Start Overlay Screen */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6" id="welcome-overlay">
            <div className="max-w-md bg-[#E4E3E0] rounded-none p-6 border-2 border-[#BCB9B4] shadow-2xl animate-fade-in text-[#2C2C2B]">
              <span className="text-4xl block mb-2">🥱</span>
              <h3 className="text-3xl font-serif italic font-light tracking-wide text-[#2C2C2B]">
                Lazy Parkour
              </h3>
              <p className="text-xs text-[#2C2C2B]/75 mt-3 font-sans leading-relaxed">
                A highly relaxed 2.5D physical platformer. No extreme timers, no hyper-pressured movement. Just cozy cushions, rotating sofas, coffee mugs, and comically reluctant jumps.
              </p>

              <div className="mt-5 p-4 bg-[#F5F2ED] rounded-none border border-[#BCB9B4] text-left text-[11px] font-mono text-[#2C2C2B]/80 space-y-1.5">
                <div className="font-sans font-bold uppercase tracking-wider text-[#2C2C2B] border-b border-[#BCB9B4]/30 pb-1.5 mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#5A5A40]" /> CONTROLS GUIDE:
                </div>
                <div>• <span className="font-sans font-bold text-[#2C2C2B]">A / D / Arrow Keys</span>: Move Left / Right</div>
                <div>• <span className="font-sans font-bold text-[#2C2C2B]">SPACEBAR</span>: Jump / Pull Up / Swing Launch</div>
                <div>• <span className="font-sans font-bold text-[#2C2C2B]">SHIFT</span>: Lazy Jog (Default is Casual Walk)</div>
                <div>• <span className="font-sans font-bold text-[#2C2C2B]">S</span>: Couch slide & crawling</div>
                <div>• <span className="font-sans font-bold text-[#2C2C2B]">E</span>: Grab or Swing on ropes</div>
                <div>• <span className="font-sans font-bold text-[#2C2C2B]">R</span>: Instant Respawn from checkpoint</div>
              </div>

              <button
                onClick={startStopGame}
                className="mt-6 w-full bg-[#5A5A40] text-[#F5F2ED] py-3 px-4 rounded-none font-sans font-bold text-[10px] tracking-widest uppercase hover:bg-opacity-95 transition-all"
                id="play-overlay-btn"
              >
                UNMUTE CHILL LO-FI SYNTH & START GAME
              </button>
            </div>
          </div>
        )}

        {/* Custom Pause overlay */}
        {isPlaying && isPaused && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-[#E4E3E0] p-6 rounded-none border border-[#BCB9B4] shadow-2xl text-center max-w-xs text-[#2C2C2B]">
              <h4 className="text-xl font-serif italic text-[#2C2C2B]">Game Paused</h4>
              <p className="text-xs text-[#2C2C2B]/75 mt-2">Take a quick nap. Your coffee stays warm.</p>
              <button
                onClick={handlePauseToggle}
                className="mt-5 w-full bg-[#5A5A40] text-[#F5F2ED] py-2.5 rounded-none font-sans text-[10px] tracking-widest uppercase font-bold hover:bg-opacity-95"
              >
                RESUME PLAYING
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Under-canvas instructions and HUD indicators */}
      <div className="bg-[#E4E3E0] px-4 py-2 border-t border-[#BCB9B4] flex flex-wrap items-center justify-between text-[11px] font-sans text-[#2C2C2B]/80" id="hud-lower-footer">
        <div className="flex items-center gap-3">
          <span>Active Slippers: <span className="font-bold text-[#2C2C2B]">{COSMETIC_SHOP.find(c => c.id === stats.activeCosmetics.slippers)?.name}</span></span>
          <span className="text-[#BCB9B4]">|</span>
          <span>Backpack: <span className="font-bold text-[#2C2C2B]">{COSMETIC_SHOP.find(c => c.id === stats.activeCosmetics.backpack)?.name}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-[#2C2C2B]/60">
          <Sparkles className="w-3 h-3 text-[#5A5A40]" />
          <span>Tip: Complete levels to earn mugs of Coffee to spend in the Slumber Shop.</span>
        </div>
      </div>
    </div>
  );
};
