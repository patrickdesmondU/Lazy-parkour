import { Level, CosmeticItem, Achievement } from './types';

// Let's create handcrafted levels with precise platforms, obstacles, collectibles and checkpoints.
// All dimensions are scaled appropriately for our 2.5D physical engine.
export const LEVELS: Level[] = [
  {
    id: 'lvl_1',
    name: '1. The Reluctant Awakening',
    description: 'Get out of bed and face the soft concrete blocks. Remember to walk before you jog.',
    width: 2500,
    height: 700,
    backgroundColor: '#e6e4df', // dusty concrete light gray
    ambientColor: '#c5c2bb',
    startX: 120,
    startY: 400,
    goalX: 2350,
    goalY: 400,
    introMessage: "Yawn... do we really have to jump? Walk with WASD, hold SHIFT to jog (if you must).",
    platforms: [
      { id: 'p1_1', x: 0, y: 500, width: 400, height: 200, color: '#a3a099', type: 'concrete', label: 'My Cozy Bedroom' },
      { id: 'p1_2', x: 500, y: 450, width: 150, height: 250, color: '#b2afa8', type: 'floating_island' },
      { id: 'p1_3', x: 750, y: 380, width: 180, height: 320, color: '#a3a099', type: 'concrete' },
      { id: 'p1_4', x: 1050, y: 440, width: 250, height: 260, color: '#9e9b94', type: 'concrete', label: 'Snooze Zone' },
      { id: 'p1_5', x: 1400, y: 320, width: 200, height: 380, color: '#b2afa8', type: 'floating_island' },
      { id: 'p1_6', x: 1700, y: 420, width: 300, height: 280, color: '#a3a099', type: 'concrete' },
      { id: 'p1_7', x: 2100, y: 500, width: 400, height: 200, color: '#a3a099', type: 'concrete', label: 'Nap Destination' }
    ],
    obstacles: [
      // Easy giant beanbag in the middle of a gap to launch player safely
      { id: 'o1_1', type: 'beanbag', x: 1300, y: 580, width: 100, height: 60, color: '#cf9e7a', bounceMultiplier: 1.8 },
      { id: 'o1_2', type: 'sofa', x: 1750, y: 370, width: 120, height: 50, color: '#7a8e8f', bounceMultiplier: 1.5 }
    ],
    checkpoints: [
      { id: 'cp1_1', x: 1100, y: 440, isActivated: false },
      { id: 'cp1_2', x: 1850, y: 420, isActivated: false }
    ],
    collectibles: [
      { id: 'c1_1', x: 570, y: 350, type: 'coffee', isCollected: false },
      { id: 'c1_2', x: 840, y: 280, type: 'zzz', isCollected: false },
      { id: 'c1_3', x: 1500, y: 220, type: 'coffee', isCollected: false },
      { id: 'c1_4', x: 2150, y: 400, type: 'zzz', isCollected: false }
    ],
    ropes: []
  },
  {
    id: 'lvl_2',
    name: '2. Soft Beanbag Valley',
    description: 'Bouncing takes absolutely zero effort. Let gravity and beanbags do all the work.',
    width: 3200,
    height: 800,
    backgroundColor: '#dbd8d0',
    ambientColor: '#bbb7af',
    startX: 100,
    startY: 300,
    goalX: 3050,
    goalY: 450,
    introMessage: "Land on soft beanbags to bounce. Hold Crouch (CTRL) mid-air to dive and roll on landing!",
    platforms: [
      { id: 'p2_1', x: 0, y: 450, width: 300, height: 350, color: '#939088', type: 'concrete', label: 'High Lounge' },
      { id: 'p2_2', x: 450, y: 550, width: 250, height: 250, color: '#9d9991', type: 'concrete' },
      { id: 'p2_3', x: 800, y: 400, width: 300, height: 400, color: '#939088', type: 'concrete', label: 'Cushion Point' },
      { id: 'p2_4', x: 1250, y: 350, width: 200, height: 450, color: '#a29e96', type: 'floating_island' },
      { id: 'p2_5', x: 1550, y: 500, width: 350, height: 300, color: '#939088', type: 'concrete' },
      { id: 'p2_6', x: 2000, y: 300, width: 250, height: 500, color: '#a29e96', type: 'floating_island' },
      { id: 'p2_7', x: 2400, y: 520, width: 300, height: 280, color: '#9d9991', type: 'concrete' },
      { id: 'p2_8', x: 2850, y: 550, width: 350, height: 250, color: '#939088', type: 'concrete', label: 'Bedtime' }
    ],
    obstacles: [
      { id: 'o2_1', type: 'beanbag', x: 330, y: 720, width: 90, height: 80, color: '#cf9e7a', bounceMultiplier: 2.1 },
      { id: 'o2_2', type: 'beanbag', x: 720, y: 700, width: 80, height: 100, color: '#cf9e7a', bounceMultiplier: 2.3 },
      { id: 'o2_3', type: 'pillow_roller', x: 1000, y: 340, width: 45, height: 45, color: '#88a895', speed: 1.5, startX: 850, range: 200 },
      { id: 'o2_4', type: 'sofa', x: 1650, y: 430, width: 140, height: 70, color: '#7a8e8f', bounceMultiplier: 1.6 },
      { id: 'o2_5', type: 'beanbag', x: 2280, y: 720, width: 90, height: 80, color: '#cf9e7a', bounceMultiplier: 2.2 }
    ],
    checkpoints: [
      { id: 'cp2_1', x: 950, y: 400, isActivated: false },
      { id: 'cp2_2', x: 1600, y: 500, isActivated: false },
      { id: 'cp2_2b', x: 2100, y: 300, isActivated: false }
    ],
    collectibles: [
      { id: 'c2_1', x: 375, y: 500, type: 'coffee', isCollected: false },
      { id: 'c2_2', x: 760, y: 420, type: 'coffee', isCollected: false },
      { id: 'c2_3', x: 1350, y: 230, type: 'zzz', isCollected: false },
      { id: 'c2_4', x: 1850, y: 380, type: 'coffee', isCollected: false },
      { id: 'c2_5', x: 2320, y: 450, type: 'zzz', isCollected: false },
      { id: 'c2_6', x: 2950, y: 420, type: 'coffee', isCollected: false }
    ],
    ropes: [
      { id: 'r2_1', anchorX: 1500, anchorY: 100, length: 220, angle: 0, angularVelocity: 0 }
    ]
  },
  {
    id: 'lvl_3',
    name: '3. Sleepy Conveyors',
    description: 'Use the conveyor belts to ride effortlessly. Or try to fight them if you actually care about speed.',
    width: 3600,
    height: 850,
    backgroundColor: '#ccc9c0',
    ambientColor: '#aca89f',
    startX: 120,
    startY: 350,
    goalX: 3450,
    goalY: 400,
    introMessage: "Conveyor belts will roll you along! Stand on them to glide lazily.",
    platforms: [
      { id: 'p3_1', x: 0, y: 450, width: 300, height: 400, color: '#88857e', type: 'concrete', label: 'Factory Entrance' },
      { id: 'p3_2', x: 400, y: 400, width: 450, height: 450, color: '#928e87', type: 'concrete' },
      { id: 'p3_3', x: 950, y: 350, width: 250, height: 500, color: '#88857e', type: 'concrete' },
      { id: 'p3_4', x: 1300, y: 500, width: 400, height: 350, color: '#9c9890', type: 'floating_island' },
      { id: 'p3_5', x: 1800, y: 420, width: 300, height: 430, color: '#88857e', type: 'concrete', label: 'Slow Lift Area' },
      { id: 'p3_6', x: 2450, y: 380, width: 400, height: 470, color: '#9c9890', type: 'floating_island' },
      { id: 'p3_7', x: 2950, y: 450, width: 200, height: 400, color: '#928e87', type: 'concrete' },
      { id: 'p3_8', x: 3250, y: 500, width: 400, height: 350, color: '#88857e', type: 'concrete', label: 'Snooze Lounge' }
    ],
    obstacles: [
      // Left conveyor on p3_2
      { id: 'o3_1', type: 'conveyor', x: 450, y: 390, width: 350, height: 20, color: '#cf9c7a', speed: 1.2, direction: 1 },
      // Obstacle on conveyor
      { id: 'o3_2', type: 'bookshelf', x: 600, y: 340, width: 60, height: 50, color: '#8a6e54' },
      // Slow elevator in the gap
      { id: 'o3_3', type: 'elevator', x: 1210, y: 400, width: 80, height: 30, color: '#687d7e', speed: 0.8, range: 250, startY: 250, direction: 1 },
      // Conveyor pushing backwards (left)
      { id: 'o3_4', type: 'conveyor', x: 1350, y: 490, width: 300, height: 20, color: '#d9a785', speed: -1.0, direction: -1 },
      // Giant pendulum swinging
      { id: 'o3_5', type: 'pendulum', x: 2200, y: 200, width: 100, height: 100, color: '#7b9c92', speed: 0.02, angle: 0, range: 45 },
      // Conveyor at the end
      { id: 'o3_6', type: 'conveyor', x: 2480, y: 370, width: 340, height: 20, color: '#cf9c7a', speed: 1.5, direction: 1 }
    ],
    checkpoints: [
      { id: 'cp3_1', x: 1050, y: 350, isActivated: false },
      { id: 'cp3_2', x: 1950, y: 420, isActivated: false },
      { id: 'cp3_3', x: 3050, y: 450, isActivated: false }
    ],
    collectibles: [
      { id: 'c3_1', x: 500, y: 320, type: 'zzz', isCollected: false },
      { id: 'c3_2', x: 750, y: 250, type: 'coffee', isCollected: false },
      { id: 'c3_3', x: 1250, y: 200, type: 'coffee', isCollected: false },
      { id: 'c3_4', x: 1500, y: 400, type: 'zzz', isCollected: false },
      { id: 'c3_5', x: 2200, y: 450, type: 'coffee', isCollected: false },
      { id: 'c3_6', x: 2650, y: 250, type: 'coffee', isCollected: false }
    ],
    ropes: [
      { id: 'r3_1', anchorX: 2300, anchorY: 100, length: 250, angle: 0, angularVelocity: 0 }
    ]
  },
  {
    id: 'lvl_4',
    name: '4. Crumbling Cardboard Bridges',
    description: 'Walk quickly or watch your step. Cardboard bridges crumble under lazy feet, and spinning sofas block the path.',
    width: 3800,
    height: 900,
    backgroundColor: '#bfae9c', // softer cardboard brownish hue
    ambientColor: '#a19180',
    startX: 120,
    startY: 400,
    goalX: 3600,
    goalY: 450,
    introMessage: "Careful! Red cardboard platforms fall apart quickly after standing on them.",
    platforms: [
      { id: 'p4_1', x: 0, y: 500, width: 300, height: 400, color: '#7a6a58', type: 'concrete', label: 'Safe Ground' },
      { id: 'p4_2', x: 750, y: 400, width: 250, height: 500, color: '#857563', type: 'floating_island' },
      { id: 'p4_3', x: 1400, y: 450, width: 300, height: 450, color: '#7a6a58', type: 'concrete', label: 'Couch Corner' },
      { id: 'p4_4', x: 1850, y: 350, width: 200, height: 550, color: '#857563', type: 'floating_island' },
      { id: 'p4_5', x: 2450, y: 500, width: 250, height: 400, color: '#7a6a58', type: 'concrete' },
      { id: 'p4_6', x: 3000, y: 400, width: 200, height: 500, color: '#857563', type: 'floating_island' },
      { id: 'p4_7', x: 3350, y: 550, width: 500, height: 350, color: '#7a6a58', type: 'concrete', label: 'Final Sofa' }
    ],
    obstacles: [
      // Cardboard bridges in gaps
      { id: 'o4_1', type: 'cardboard_bridge', x: 300, y: 500, width: 140, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false },
      { id: 'o4_2', type: 'cardboard_bridge', x: 440, y: 450, width: 140, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false },
      { id: 'o4_3', type: 'cardboard_bridge', x: 580, y: 400, width: 170, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false },
      
      // Moving obstacle
      { id: 'o4_4', type: 'pillow_roller', x: 850, y: 360, width: 50, height: 50, color: '#94a180', speed: 2.0, startX: 750, range: 200 },
      
      // More cardboard bridges
      { id: 'o4_5', type: 'cardboard_bridge', x: 1000, y: 400, width: 200, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false },
      { id: 'o4_6', type: 'cardboard_bridge', x: 1200, y: 450, width: 200, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false },

      // Rotating sofa in intermediate zones
      { id: 'o4_7', type: 'sofa', x: 1450, y: 370, width: 140, height: 80, color: '#687e85', bounceMultiplier: 1.7 },
      
      // Swinging Pendulum over the void
      { id: 'o4_8', type: 'pendulum', x: 2150, y: 150, width: 90, height: 90, color: '#9ca180', speed: 0.025, angle: 0, range: 50 },
      
      // Cardboard bridges at the end
      { id: 'o4_9', type: 'cardboard_bridge', x: 2700, y: 500, width: 300, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false }
    ],
    checkpoints: [
      { id: 'cp4_1', x: 850, y: 400, isActivated: false },
      { id: 'cp4_2', x: 1500, y: 450, isActivated: false },
      { id: 'cp4_3', x: 2550, y: 500, isActivated: false }
    ],
    collectibles: [
      { id: 'c4_1', x: 370, y: 420, type: 'coffee', isCollected: false },
      { id: 'c4_2', x: 510, y: 350, type: 'coffee', isCollected: false },
      { id: 'c4_3', x: 920, y: 300, type: 'zzz', isCollected: false },
      { id: 'c4_4', x: 1100, y: 300, type: 'coffee', isCollected: false },
      { id: 'c4_5', x: 1750, y: 220, type: 'zzz', isCollected: false },
      { id: 'c4_6', x: 2050, y: 320, type: 'coffee', isCollected: false },
      { id: 'c4_7', x: 3100, y: 250, type: 'coffee', isCollected: false }
    ],
    ropes: [
      { id: 'r4_1', anchorX: 1750, anchorY: 100, length: 220, angle: 0, angularVelocity: 0 },
      { id: 'r4_2', anchorX: 2350, anchorY: 100, length: 260, angle: 0, angularVelocity: 0 }
    ]
  },
  {
    id: 'lvl_5',
    name: '5. The Floating Slumber Island',
    description: 'The ultimate lazy challenge. Moving conveyor belts, elevators, active fans pushing you up, and giant bouncing sofas.',
    width: 4500,
    height: 1000,
    backgroundColor: '#b0bfa3', // muted sage olive green
    ambientColor: '#93a187',
    startX: 120,
    startY: 450,
    goalX: 4300,
    goalY: 350,
    introMessage: "You made it to Slumber Island. Use the massive updraft fans to float effortlessly over the voids!",
    platforms: [
      { id: 'p5_1', x: 0, y: 550, width: 350, height: 450, color: '#5f6b54', type: 'concrete', label: 'Grand Departure' },
      { id: 'p5_2', x: 500, y: 450, width: 300, height: 550, color: '#68755c', type: 'floating_island' },
      { id: 'p5_3', x: 950, y: 300, width: 400, height: 700, color: '#5f6b54', type: 'concrete', label: 'Updraft Heights' },
      { id: 'p5_4', x: 1550, y: 500, width: 300, height: 500, color: '#68755c', type: 'floating_island' },
      { id: 'p5_5', x: 2000, y: 350, width: 400, height: 650, color: '#5f6b54', type: 'concrete' },
      { id: 'p5_6', x: 2600, y: 400, width: 300, height: 600, color: '#68755c', type: 'floating_island' },
      { id: 'p5_7', x: 3100, y: 500, width: 400, height: 500, color: '#5f6b54', type: 'concrete', label: 'The Final Slog' },
      { id: 'p5_8', x: 3650, y: 420, width: 250, height: 580, color: '#68755c', type: 'floating_island' },
      { id: 'p5_9', x: 4050, y: 450, width: 500, height: 550, color: '#5f6b54', type: 'concrete', label: 'The Golden Mattress' }
    ],
    obstacles: [
      // Fan in the first gap to float the player
      { id: 'o5_1', type: 'fan', x: 350, y: 700, width: 150, height: 40, color: '#8aa381', speed: 4.5 },
      
      // Moving roller
      { id: 'o5_2', type: 'pillow_roller', x: 1050, y: 260, width: 50, height: 50, color: '#cf9e7a', speed: 1.8, startX: 950, range: 300 },
      
      // Conveyor belt on height
      { id: 'o5_3', type: 'conveyor', x: 1000, y: 290, width: 300, height: 15, color: '#88a679', speed: 1.3, direction: 1 },
      
      // Elevator down to valley
      { id: 'o5_4', type: 'elevator', x: 1400, y: 350, width: 100, height: 30, color: '#687e85', speed: 1.1, range: 350, startY: 200, direction: 1 },
      
      // Bouncing beanbags
      { id: 'o5_5', type: 'beanbag', x: 1650, y: 440, width: 100, height: 60, color: '#cf9e7a', bounceMultiplier: 1.9 },
      
      // Giant swinging couch/pendulum
      { id: 'o5_6', type: 'pendulum', x: 2450, y: 150, width: 110, height: 110, color: '#8da681', speed: 0.02, angle: 0, range: 45 },
      
      // High-altitude conveyor
      { id: 'o5_7', type: 'conveyor', x: 2620, y: 390, width: 260, height: 15, color: '#88a679', speed: -1.2, direction: -1 },

      // Giant fan pushing up to the final cloud platform
      { id: 'o5_8', type: 'fan', x: 2900, y: 750, width: 200, height: 40, color: '#8aa381', speed: 5.5 },

      // More cardboard crumble before the goal
      { id: 'o5_9', type: 'cardboard_bridge', x: 3500, y: 500, width: 150, height: 20, color: '#ad5243', timer: 0, maxTimer: 60, isTriggered: false },
      
      // Comedic couch block at the very end
      { id: 'o5_10', type: 'sofa', x: 4150, y: 380, width: 120, height: 70, color: '#7a8e8f', bounceMultiplier: 1.6 }
    ],
    checkpoints: [
      { id: 'cp5_1', x: 650, y: 450, isActivated: false },
      { id: 'cp5_2', x: 1150, y: 300, isActivated: false },
      { id: 'cp5_3', x: 2150, y: 350, isActivated: false },
      { id: 'cp5_4', x: 3250, y: 500, isActivated: false }
    ],
    collectibles: [
      { id: 'c5_1', x: 425, y: 350, type: 'coffee', isCollected: false },
      { id: 'c5_2', x: 700, y: 320, type: 'zzz', isCollected: false },
      { id: 'c5_3', x: 1100, y: 180, type: 'coffee', isCollected: false },
      { id: 'c5_4', x: 1450, y: 150, type: 'coffee', isCollected: false },
      { id: 'c5_5', x: 1700, y: 320, type: 'zzz', isCollected: false },
      { id: 'c5_6', x: 2450, y: 300, type: 'coffee', isCollected: false },
      { id: 'c5_7', x: 2800, y: 220, type: 'zzz', isCollected: false },
      { id: 'c5_8', x: 3000, y: 450, type: 'coffee', isCollected: false },
      { id: 'c5_9', x: 3770, y: 300, type: 'coffee', isCollected: false },
      { id: 'c5_10', x: 4200, y: 250, type: 'zzz', isCollected: false }
    ],
    ropes: [
      { id: 'r5_1', anchorX: 2000, anchorY: 100, length: 240, angle: 0, angularVelocity: 0 },
      { id: 'r5_2', anchorX: 3000, anchorY: 100, length: 280, angle: 0, angularVelocity: 0 }
    ]
  }
];

export const COSMETIC_SHOP: CosmeticItem[] = [
  // Outfits
  { id: 'outfit_hoodie_gray', name: 'Pastel Cozy Hoodie', category: 'outfit', price: 0, color: '#e2e8f0', description: 'Extremely soft and slightly stained with coffee.', emoji: '🧥' },
  { id: 'outfit_robe', name: 'Plush Bathrobe', category: 'outfit', price: 15, color: '#f5e6d3', description: 'Hotel-quality bathrobe. Proves you do not plan on leaving the house.', emoji: '👘' },
  { id: 'outfit_onesie', name: 'Dinosaur Onesie', category: 'outfit', price: 30, color: '#cedbb2', description: 'Cozy dinosaur scales. Warm, green, and completely unpretentious.', emoji: '🦎' },
  { id: 'outfit_suit', name: 'Work pajamas', category: 'outfit', price: 50, color: '#b2c0cc', description: 'Business formal shirt with fuzzy flannel pajama bottoms.', emoji: '👔' },
  
  // Hats
  { id: 'hat_none', name: 'Bed Head', category: 'hat', price: 0, color: 'transparent', description: 'A masterpiece of gravity-defying morning hair.', emoji: '🧑‍🦱' },
  { id: 'hat_mask', name: 'Sleeping Mask', category: 'hat', price: 8, color: '#4a5568', description: 'Worn on the forehead so you are always 0.5 seconds away from a nap.', emoji: '🥽' },
  { id: 'hat_beanie', name: 'Slouchy Beanie', category: 'hat', price: 15, color: '#8c7d6c', description: 'Keeps your lazy thoughts warm.', emoji: '🧢' },
  { id: 'hat_nightcap', name: 'Pom-Pom Nightcap', category: 'hat', price: 25, color: '#ad7e8a', description: 'The choice of professional sleepers.', emoji: '👒' },
  { id: 'hat_crown', name: 'Tiny Slumber Crown', category: 'hat', price: 60, color: '#d4af37', description: 'The absolute ruler of sleeping in on Sundays.', emoji: '👑' },

  // Slippers
  { id: 'slipper_socks', name: 'Fuzzy Grip Socks', category: 'slippers', price: 0, color: '#cbd5e1', description: 'Warm hospital-style grip socks.', emoji: '🧦' },
  { id: 'slipper_hotel', name: 'Flimsy Hotel Slippers', category: 'slippers', price: 10, color: '#ffffff', description: 'One-size-fits-all, thin, paper-like paperweight shoes.', emoji: '🩴' },
  { id: 'slipper_bunny', name: 'Fuzzy Bunny Slippers', category: 'slippers', price: 25, color: '#fbcfe8', description: 'Has small floppy ears that wobble on impact.', emoji: '🐰' },
  { id: 'slipper_bear', name: 'Bear Paw Slippers', category: 'slippers', price: 40, color: '#78350f', description: 'Huge, clunky, and delightfully slow-sounding.', emoji: '🐻' },

  // Backpacks
  { id: 'backpack_none', name: 'Sweaty Back', category: 'backpack', price: 0, color: 'transparent', description: 'Just standard clothes and back sweat.', emoji: '🍃' },
  { id: 'backpack_pillow', name: 'Emergency Pillow', category: 'backpack', price: 12, color: '#f1f5f9', description: 'Strapped tightly to your back. Any floor is now a mattress.', emoji: '🛌' },
  { id: 'backpack_bag', name: 'Sleeping Bag Roll', category: 'backpack', price: 25, color: '#7c2d12', description: 'Ready to camp out right here on this ledge.', emoji: '🎒' },
  { id: 'backpack_clock', name: 'Snoozed Alarm Clock', category: 'backpack', price: 40, color: '#b91c1c', description: 'Displays a permanent 07:00 AM, perpetually snoozed.', emoji: '⏰' },
  { id: 'backpack_cat', name: 'Sleepy Cat-Pack', category: 'backpack', price: 75, color: '#f97316', description: 'A cute orange cat sleeping soundly in a transparent bubble.', emoji: '🐱' }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_wake',
    title: 'Reluctant Awakening',
    description: 'Complete the first level and leave your cozy bedroom.',
    icon: '🌅',
    reward: 10,
    condition: (stats) => stats.unlockedLevels.includes(1)
  },
  {
    id: 'ach_cozy',
    title: 'Snooze Button King',
    description: 'Stand completely still for more than 15 seconds.',
    icon: '🛏️',
    reward: 15,
    condition: (_, gameProgress) => gameProgress.maxIdleTime > 15
  },
  {
    id: 'ach_mugs',
    title: 'Caffeine Rush',
    description: 'Collect 10 mugs of hot, delicious coffee.',
    icon: '☕',
    reward: 20,
    condition: (stats) => stats.coffeeMugs >= 10
  },
  {
    id: 'ach_gravity',
    title: 'Gravity Tester',
    description: 'Fall into the endless abyss 15 times.',
    icon: '🪂',
    reward: 15,
    condition: (_, gameProgress) => gameProgress.falls >= 15
  },
  {
    id: 'ach_couch',
    title: 'Professional Couch Potato',
    description: 'Bounce on a comfortable sofa or beanbag 30 times.',
    icon: '🛋️',
    reward: 25,
    condition: (_, gameProgress) => gameProgress.bounces >= 30
  },
  {
    id: 'ach_slippers',
    title: 'First-Class Comfort',
    description: 'Unlock any premium cosmetic item in the Slumber Shop.',
    icon: '✨',
    reward: 15,
    condition: (stats) => stats.unlockedCosmetics.length > 4 // 4 are default
  },
  {
    id: 'ach_island',
    title: 'Slumber Island Master',
    description: 'Complete all 5 handcrafted levels in Story mode.',
    icon: '🏝️',
    reward: 50,
    condition: (stats) => stats.unlockedLevels.length >= 5 && stats.highScores['lvl_5'] !== undefined
  },
  {
    id: 'ach_lazy_run',
    title: 'Super Slowrun',
    description: 'Complete any level with a time longer than 3 minutes (absolute chill).',
    icon: '🦥',
    reward: 20,
    condition: (_, gameProgress) => gameProgress.slowRunCompleted
  }
];
