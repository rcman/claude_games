// Game Constants
const GAME_STATES = {
    LOADING: 0,
    START_SCREEN: 1,
    PLAYING: 2,
    GAME_OVER: 3,
    LEVEL_COMPLETE: 4
};

// Character classes
const CHARACTER_CLASSES = {
    WARRIOR: { name: "Warrior", health: 800, attack: 40, magic: 10, speed: 5, special: "Whirlwind Attack", color: new BABYLON.Color3(0.8, 0.1, 0.1), shotCooldown: 600, specialCooldown: 12000 },
    VALKYRIE: { name: "Valkyrie", health: 600, attack: 30, magic: 20, speed: 7, special: "Shield Bash", color: new BABYLON.Color3(0.1, 0.6, 0.8), shotCooldown: 500, specialCooldown: 10000 },
    WIZARD: { name: "Wizard", health: 400, attack: 10, magic: 50, speed: 5, special: "Arcane Nova", color: new BABYLON.Color3(0.6, 0.1, 0.8), shotCooldown: 700, specialCooldown: 15000 },
    ELF: { name: "Elf", health: 450, attack: 25, magic: 30, speed: 10, special: "Rapid Fire", color: new BABYLON.Color3(0.1, 0.8, 0.3), shotCooldown: 350, specialCooldown: 8000 }
};

// Enemy types
const ENEMY_TYPES = {
    GHOST: { name: "Ghost", health: 60, attack: 15, speed: 3.5, color: new BABYLON.Color3(0.85, 0.85, 0.95), score: 10, meshType: 'sphere', size: 0.8, alpha: 0.7 },
    GRUNT: { name: "Grunt", health: 120, attack: 20, speed: 2.8, color: new BABYLON.Color3(0.8, 0.4, 0), score: 20, meshType: 'box', size: [0.8, 1.2, 0.8] },
    DEMON: { name: "Demon", health: 180, attack: 30, speed: 2.2, color: new BABYLON.Color3(0.9, 0.1, 0), score: 30, meshType: 'box', size: [1, 1.5, 1] },
    SORCERER: { name: "Sorcerer", health: 90, attack: 35, speed: 3.0, color: new BABYLON.Color3(0.5, 0, 0.5), score: 40, meshType: 'cylinder', size: { diameter: 0.8, height: 1.5 }, canShoot: true, shootRange: 15, shootCooldown: 2500 },
    DEATH: { name: "Death", health: 400, attack: 50, speed: 1.8, color: new BABYLON.Color3(0.1, 0.1, 0.1), score: 100, meshType: 'box', size: [1.2, 2, 1.2], isInvulnerable: false, specialAttack: false, alpha: 0.8 }
};

// Item types
const ITEM_TYPES = {
    FOOD: { name: "Food", health: 100, color: new BABYLON.Color3(0, 0.8, 0), meshType: 'box', size: [0.8, 0.3, 0.8], score: 5 },
    POTION: { name: "Potion", special: "potion", color: new BABYLON.Color3(0, 0.5, 0.8), meshType: 'cylinder', size: { diameter: 0.5, height: 0.8 }, score: 10 },
    KEY: { name: "Key", special: "key", color: new BABYLON.Color3(0.8, 0.8, 0), meshType: 'box', size: [0.5, 0.5, 0.1], score: 20 },
    TREASURE: { name: "Treasure", score: 50, color: new BABYLON.Color3(0.9, 0.7, 0.1), meshType: 'sphere', size: 0.6 }
};

// Map generation constants
const TILE_SIZE = 4;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

// Global game state variables
let gameState = GAME_STATES.LOADING;
let currentLevel = 1;
let player = null;
let playerClassInfo = null;
let enemies = [];
let projectiles = [];
let items = [];
let doors = [];
let walls = [];
let generators = [];
let exitKey = null;
let exitDoor = null;
let score = 0;
let keys = 0;
let potions = 0;
let hasExitKey = false;

// Game engine variables
let canvas, engine, scene;
let camera, light;
let inputMap = {};
let gameTime = 0;
let lastMessageTime = 0;

// Sound effects
let sounds = {};

// Dungeon array
let dungeon = [];

// UI Elements
let playerHealthBarFill;
let enemyHealthBars = new Map();
let generatorHealthBars = new Map();
let playerStatsDiv, messageLogDiv, gameOverScreen, levelCompleteScreen, startScreen, loadingScreen;
let advancedTextureGUI;

// For tracking timeouts and intervals
let activeTimeouts = [];
let activeIntervals = [];