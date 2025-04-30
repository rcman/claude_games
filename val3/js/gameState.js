// Game state
const gameState = {
    player: {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        hunger: 100,
        position: new THREE.Vector3(0, 10, 0),
        inventory: [],
        equipped: null,
        skills: {
            woodcutting: 1,
            mining: 1,
            building: 1,
            combat: 1
        },
        hasItem: function(itemType) {
            return this.inventory.some(item => item.type === itemType);
        }
    },
    world: {
        chunks: {},
        entities: [],
        time: 0, // 0-1 day cycle
        weather: 'clear'
    },
    settings: {
        renderDistance: 3
    }
};

// Global variables
let scene, camera, renderer, controls;
let directionalLight, ambientLight;
let lastTime = 0;
let deltaTime = 0;
let playerIsDead = false;
let keyboard = {};
let activeBoss = null;
let activeEvent = null;
let eventTimeRemaining = 0;
let ocean;
let playerShip = null;
let isOnShip = false;
let selectedBuildingPiece = null;
let buildingPreview = null;

// Initialize Three.js scene
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(gameState.player.position);
    camera.position.y += 1.7; // Player height
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Lighting
    ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Controls
    controls = new THREE.PointerLockControls(camera, document.body);
    
    document.addEventListener('click', () => {
        controls.lock();
    });
    
    controls.addEventListener('lock', () => {
        // Game playing state
    });
    
    controls.addEventListener('unlock', () => {
        // Game paused state
    });
    
    // Set up input handlers
    setupInputHandlers();
}

// Handle window resize
function handleResize() {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Player death
function playerDeath() {
    playerIsDead = true;
    showGameMessage("You Died!");
    
    // Reset player stats after a short delay
    setTimeout(() => {
        gameState.player.health = gameState.player.maxHealth;
        gameState.player.stamina = gameState.player.maxStamina;
        
        // Respawn at starting position
        camera.position.set(0, 10, 0);
        camera.position.y = getTerrainHeight(camera.position.x, camera.position.z) + 1.7;
        
        playerIsDead = false;
        showGameMessage("Respawned");
    }, 3000);
}