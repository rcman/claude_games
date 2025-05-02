// main.js - Main Game Orchestrator

import * as THREE from './libs/three.module.js'; // Assuming you use the module version in libs
// If using the global three.min.js, remove the line above and use `THREE.` directly.

// Import Game Modules
import * as World from './game/world.js';
import * as Player from './game/player.js';
import * as InfectedManager from './game/infected.js';
import * as Crafting from './game/crafting.js';
import * as Building from './game/building.js';
import * as UIManager from './game/ui.js';
import * as Assets from './game/assets.js'; // Assuming assets.js uses module exports
import * as Persistence from './game/persistence.js';
import * as Vehicles from './game/vehicles.js';
import * as PhysicsPlaceholder from './game/physics_placeholder.js'; // Added physics placeholder

// --- Global Scope Variables ---
let scene, camera, renderer, clock;
let inputState = {
    keys: {},
    mouseDelta: { x: 0, y: 0 },
    isPointerLocked: false,
};
let gamePaused = false;
let physicsWorld = null; // Placeholder for physics engine instance
let playerMesh; // Reference managed by Player module, but needed here for main loop logic

// --- Initialization ---

function initEngine() {
    console.log("Initializing Engine...");
    // Basic Three.js Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Start dark, world update will change it
    scene.fog = new THREE.Fog(0x111111, 50, 150); // Basic fog

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    clock = new THREE.Clock();

    // Basic Lighting (World module might adjust this)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    scene.userData.directionalLight = directionalLight; // Make accessible to World module
    scene.userData.ambientLight = ambientLight;     // Make accessible to World module

     // Basic Ground (could be moved to World.init)
     const planeGeometry = new THREE.PlaneGeometry(200, 200);
     const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x446644, roughness: 0.9 });
     const ground = new THREE.Mesh(planeGeometry, planeMaterial);
     ground.rotation.x = -Math.PI / 2;
     ground.receiveShadow = true;
     ground.name = "GroundMesh"; // Name for raycasting in Building module
     scene.add(ground);

    // Initialize simple physics world
    physicsWorld = new PhysicsPlaceholder.World();
    if (physicsWorld && typeof physicsWorld.setGravity === 'function') {
        physicsWorld.setGravity(new THREE.Vector3(0, -9.81, 0));
    }

    // Initialize UI Manager First (for logging etc.)
    UIManager.init();

    setupEventListeners();

    console.log("Engine Initialized.");
}

async function initGame() {
    console.log("Initializing Game Modules...");
    if (UIManager && typeof UIManager.showLoadingScreen === 'function') {
        UIManager.showLoadingScreen("Loading Assets...");
    }

    try {
        // Initialize Asset Manager and wait for essential assets
        // Pass camera for audio listener attachment
        await Assets.init(camera); // Assets.init should return a Promise
        if (UIManager && typeof UIManager.showLoadingScreen === 'function') {
            UIManager.showLoadingScreen("Assets Loaded. Initializing World...");
        }

        // Try loading saved game data
        let loadedData = null;
        if (Persistence && typeof Persistence.hasSaveGame === 'function' && Persistence.hasSaveGame()) {
            if (UIManager && typeof UIManager.showLoadingScreen === 'function') {
                UIManager.showLoadingScreen("Loading Save Game...");
            }
            if (typeof Persistence.loadGame === 'function') {
                loadedData = Persistence.loadGame();
                if (!loadedData) {
                    if (UIManager && typeof UIManager.addLogMessage === 'function') {
                        UIManager.addLogMessage("Failed to load save game, starting new game.");
                    }
                }
            }
        }

        // Initialize core modules, passing loaded data if available
        World.init(scene, loadedData);
        Player.init(scene, camera, loadedData); // Player needs scene and camera
        playerMesh = Player.getPlayerMesh(); // Get reference after player init
        InfectedManager.init(scene, loadedData); // Infected needs scene
        Crafting.init(loadedData);
        Building.init(scene, camera, playerMesh, loadedData); // Building needs refs
        Vehicles.init(scene, physicsWorld, loadedData); // Vehicles needs scene & physics
        // Persistence doesn't need init unless loading settings etc.

        if (UIManager && typeof UIManager.addLogMessage === 'function') {
            UIManager.addLogMessage("Game Initialized.");
            if(loadedData) UIManager.addLogMessage("Save game loaded successfully.");
        }

        if (UIManager && typeof UIManager.hideLoadingScreen === 'function') {
            UIManager.hideLoadingScreen();
        }
        startGameLoop();

    } catch (error) {
        console.error("Critical error during game initialization:", error);
        if (UIManager && typeof UIManager.showLoadingScreen === 'function') {
            UIManager.showLoadingScreen("Error initializing game!", true); // Show error state
        }
    }
}

// --- Game Loop ---
function startGameLoop() {
    console.log("Starting Game Loop...");
    animate();
}

function animate() {
    // Schedule next frame
    requestAnimationFrame(animate);

    // Calculate delta time
    const dt = clock.getDelta();
    // Cap delta time to prevent large jumps after focus loss
    const cappedDt = Math.min(dt, 0.1);

    // --- Input Handling (before updates) ---
    handlePlayerMovement(cappedDt); // Calculate movement vector based on input

    // --- Game Logic Updates ---
    if (!gamePaused) {
        try {
            const gameDt = cappedDt * World.secondsPerTick; // Get scaled game time delta from World
            
            // Update world first to set environment state
            World.update(cappedDt, scene); 
            
            // Get world state once and use it throughout the frame
            const worldState = World.getWorldState();
            
            // Apply world changes to renderer (fog, lighting)
            const bgColor = World.updateSceneBackground(scene);
            if (scene.fog) {
                scene.fog.color.copy(bgColor); // Match fog and background
                scene.fog.near = worldState.fogNear ?? scene.fog.near;
                scene.fog.far = worldState.fogFar ?? scene.fog.far;
            }
            
            if (scene.userData.ambientLight) {
                scene.userData.ambientLight.intensity = worldState.ambientIntensity ?? scene.userData.ambientLight.intensity;
            }
            
            if (scene.userData.directionalLight) {
                scene.userData.directionalLight.intensity = worldState.directionalIntensity ?? scene.userData.directionalLight.intensity;
            }
            
            // First check if player is in a vehicle - this affects other updates
            const playerInVehicle = Vehicles.getPlayerVehicle() !== null;
            
            // Update modules that depend on player position *after* movement is applied
            if (playerMesh) {
                InfectedManager.update(cappedDt, playerMesh); // AI needs current player position
            }
            
            Vehicles.update(cappedDt, inputState); // Update vehicle physics/state
            
            // Update Player AFTER movement/collisions applied, using gameDt for stats
            Player.update(cappedDt, gameDt, inputState);
            
            Crafting.update(cappedDt); // Update crafting timers
            Building.update(cappedDt, inputState.isPointerLocked); // Update ghost mesh placement
            
            // --- Physics Update ---
            if (physicsWorld && typeof physicsWorld.step === 'function') {
                physicsWorld.step(cappedDt); // Step the physics simulation
                // Sync physics bodies <-> THREE meshes AFTER physics step
                // Update mesh positions for player, infected, vehicles based on physics results
            }
        } catch (error) {
            console.error("Error in game update loop:", error);
        }
    }

    // --- UI Updates (Last) ---
    try {
        if (typeof Player.getPlayerStats === 'function') {
            const playerStats = Player.getPlayerStats();
            if (UIManager && typeof UIManager.updateStatsUI === 'function') {
                UIManager.updateStatsUI(playerStats);
            }
        }
        
        // Pass state needed for world UI update
        if (UIManager && typeof UIManager.updateWorldUI === 'function') {
            UIManager.updateWorldUI({
                gameTime: World.getCurrentTime(),
                isMistActive: World.getIsMistActive(),
            });
        }
        
        if (UIManager && typeof UIManager.updateBuildModeUI === 'function' && 
            typeof Building.isBuildModeActive === 'function' && 
            typeof Building.getCurrentBuildableName === 'function') {
            UIManager.updateBuildModeUI(Building.isBuildModeActive(), Building.getCurrentBuildableName());
        }
        
        if (UIManager && typeof UIManager.updateEquippedUI === 'function' && 
            typeof Player.getEquippedItem === 'function') {
            UIManager.updateEquippedUI(Player.getEquippedItem());
        }
        
        // Update vehicle UI only if player is in a vehicle
        const playerVehicle = Vehicles.getPlayerVehicle();
        if (playerVehicle && UIManager && typeof UIManager.updateVehicleUI === 'function') {
            // Calculate vehicle speed (placeholder - should be from physics)
            const speed = 0; // Replace with actual speed calculation
            UIManager.updateVehicleUI(playerVehicle.stats, speed);
        }
    } catch (uiError) {
        console.error("Error updating UI:", uiError);
    }

    // --- Rendering ---
    renderer.render(scene, camera);

    // Reset mouse delta after processing frame
    inputState.mouseDelta = { x: 0, y: 0 };
}

// --- Input Processing ---
function handlePlayerMovement(dt) {
    if (!inputState.isPointerLocked || !playerMesh || gamePaused) return;
    
    // Check if player is in a vehicle - if so, don't handle player movement
    if (Vehicles.getPlayerVehicle() !== null) return;
    
    const moveSpeed = 3.0;
    const sprintMultiplier = 1.8;
    let currentSpeed = moveSpeed;
    let isMoving = false;
    
    // Get current stats
    const playerStats = typeof Player.getPlayerStats === 'function' ? Player.getPlayerStats() : { 
        stamina: 100, 
        maxStamina: 100,
        staminaDrainRate: 10,
        staminaRegenRate: 5,
        hunger: 0,
        thirst: 0
    };

    // Sprinting Check (using Player module's state)
    const canSprint = playerStats.stamina > 1;
    const isTryingToSprint = inputState.keys && inputState.keys['ShiftLeft'];
    if (isTryingToSprint && canSprint) {
        currentSpeed *= sprintMultiplier;
        // Stamina drain logic might be inside Player.update or here
        if (typeof Player.modifyStamina === 'function') {
            Player.modifyStamina(-playerStats.staminaDrainRate * dt); // Example direct modification
        }
    } else if (playerStats.stamina < playerStats.maxStamina && !isTryingToSprint) {
        // Stamina regen logic might be inside Player.update or here
        const regenMultiplier = (playerStats.hunger < 80 && playerStats.thirst < 80) ? 1.0 : 0.3;
        if (typeof Player.modifyStamina === 'function') {
            Player.modifyStamina(playerStats.staminaRegenRate * regenMultiplier * dt); // Example direct modification
        }
    }

    // Calculate Movement Direction based on Camera
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(camera.up, forward).normalize();

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (inputState.keys && inputState.keys['KeyW']) { moveDirection.add(forward); isMoving = true; }
    if (inputState.keys && inputState.keys['KeyS']) { moveDirection.sub(forward); isMoving = true; }
    if (inputState.keys && inputState.keys['KeyA']) { moveDirection.sub(right); isMoving = true; }
    if (inputState.keys && inputState.keys['KeyD']) { moveDirection.add(right); isMoving = true; }

    if (isMoving) {
        moveDirection.normalize();
        const moveVector = moveDirection.multiplyScalar(currentSpeed * dt);
        const targetPosition = playerMesh.position.clone().add(moveVector);

        // --- Collision Detection (Placeholder) ---
        // TODO: Implement collision check using physics engine or manual checks
        // bool canMove = checkCollision(playerMesh, targetPosition);
        const canMove = true; // Assume can move for now

        if (canMove) {
            playerMesh.position.copy(targetPosition);
        } else {
            // Handle collision response (e.g., slide along wall)
        }

        // Simple Boundary Check
        const boundary = 98;
        playerMesh.position.x = Math.max(-boundary, Math.min(boundary, playerMesh.position.x));
        playerMesh.position.z = Math.max(-boundary, Math.min(boundary, playerMesh.position.z));
    }

    // Keep player on ground (simple) - physics handles this better
    if (!physicsWorld) {
        const playerHeight = typeof Player.getPlayerHeight === 'function' ? Player.getPlayerHeight() : 1.8;
        playerMesh.position.y = playerHeight / 2;
    }
}

function handlePlayerLook() {
    if (!inputState.isPointerLocked || !playerMesh || gamePaused) return;

    const lookSpeed = 0.002;
    const MAX_PITCH = Math.PI / 2 - 0.1;

    // Calculate new rotation based on mouse delta
    const currentYaw = playerMesh.rotation.y;
    const currentPitch = camera.rotation.x; // Camera handles pitch

    let newYaw = currentYaw - inputState.mouseDelta.x * lookSpeed;
    let newPitch = currentPitch - inputState.mouseDelta.y * lookSpeed;
    newPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, newPitch)); // Clamp pitch

    // Apply rotation
    playerMesh.rotation.y = newYaw;
    camera.rotation.x = newPitch;
    camera.rotation.y = newYaw; // Keep camera yaw aligned with player
}

// --- Event Listeners ---
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener('keydown', (event) => {
        inputState.keys[event.code] = true;
        handleKeyPress(event.code); // Handle immediate actions
    });
    document.addEventListener('keyup', (event) => {
        inputState.keys[event.code] = false;
    });

    // Pointer Lock and Mouse Look
    document.addEventListener('mousemove', (event) => {
        if (inputState.isPointerLocked) {
            inputState.mouseDelta.x += event.movementX || 0;
            inputState.mouseDelta.y += event.movementY || 0;
            handlePlayerLook(); // Update look immediately on mouse move
        }
    });

    document.addEventListener('pointerlockchange', () => {
        inputState.isPointerLocked = document.pointerLockElement === renderer.domElement;
        if (!inputState.isPointerLocked && !gamePaused) {
            // Pointer lock lost unexpectedly (e.g., Alt+Tab) - Pause game?
            // togglePause(true); // Force pause
            console.log("Pointer Lock Lost - Consider Pausing");
            if (UIManager && typeof UIManager.showPauseMenu === 'function') {
                UIManager.showPauseMenu(); // Show pause menu when lock lost
            }
        } else if (inputState.isPointerLocked) {
            if (UIManager && typeof UIManager.hidePauseMenu === 'function') {
                UIManager.hidePauseMenu(); // Hide pause menu when lock acquired
            }
            inputState.mouseDelta = {x: 0, y: 0}; // Reset delta on acquire/resume
        }
    });

    renderer.domElement.addEventListener('click', () => {
        if (!inputState.isPointerLocked) {
            renderer.domElement.requestPointerLock()
                .catch(err => console.error("Pointer lock request failed:", err));
        } else if (!gamePaused) {
            // Handle clicks when locked and not paused
            if (Building && typeof Building.isBuildModeActive === 'function' && Building.isBuildModeActive()) {
                if (typeof Building.tryPlaceStructure === 'function') {
                    Building.tryPlaceStructure();
                }
            } else {
                const equippedItem = typeof Player.getEquippedItem === 'function' ? Player.getEquippedItem() : null;
                if (equippedItem?.type === 'tool') { // Check player module for equipped item
                    if (typeof Player.performAttack === 'function') {
                        Player.performAttack();
                    }
                } else {
                    // Default click action?
                }
            }
        }
    });

    // Pause Menu Button Listeners (Example)
    const resumeBtn = document.getElementById('resume-button');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => togglePause(false));
    }
    
    const saveBtn = document.getElementById('save-button');
    if (saveBtn && typeof Persistence.saveGame === 'function') {
        saveBtn.addEventListener('click', Persistence.saveGame);
    }
    
    const loadBtn = document.getElementById('load-button');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            if (confirm("Load last save? Unsaved progress will be lost.")) {
                window.location.reload(); // Simplest way to reload the game state
            }
        });
    }
    // Add listeners for other pause menu buttons...
}

function handleKeyPress(code) {
    // Actions that happen instantly on key press

    // Toggle Pause (Escape) - Allow even if pointer lock lost
    if (code === 'Escape') {
        togglePause(); // Toggle pause state
        if(Building && typeof Building.isBuildModeActive === 'function' && Building.isBuildModeActive()) {
            if (typeof Building.exitBuildMode === 'function') {
                Building.exitBuildMode(); // Also exit build mode on escape
            }
        }
        return; // Don't process other keys if pausing/unpausing
    }

    // Ignore game actions if paused or pointer not locked
    if (gamePaused || !inputState.isPointerLocked) return;

    // Check if player is in a vehicle first
    const playerInVehicle = Vehicles && typeof Vehicles.getPlayerVehicle === 'function' && Vehicles.getPlayerVehicle() !== null;

    // Game Actions (require pointer lock)
    switch (code) {
        case 'KeyE': // Interact
            if (playerInVehicle) {
                // Nothing for E in vehicle
            } else {
                if (typeof Player.interact === 'function') {
                    Player.interact();
                }
            }
            break;
        case 'KeyF': // Use 'F' for vehicle exit
            if (playerInVehicle) {
                if (typeof Vehicles.tryExitVehicle === 'function') {
                    Vehicles.tryExitVehicle();
                }
            }
            // Could 'F' also be flashlight toggle when not in vehicle?
            break;
        case 'KeyX': // Toggle Vehicle Engine
            if (playerInVehicle) {
                if (typeof Vehicles.toggleEngine === 'function') {
                    Vehicles.toggleEngine();
                }
            }
            break;
        case 'KeyI': // Inventory
            if (UIManager && typeof UIManager.toggleInventoryUI === 'function' && 
                typeof Player.getInventory === 'function') {
                UIManager.toggleInventoryUI(Player.getInventory());
            }
            break;
        case 'KeyC': // Crafting
            if (!playerInVehicle) {
                // Need to determine available recipes based on context (inventory vs station)
                const station = Building && typeof Building.getStationPlayerIsNear === 'function' ? 
                    Building.getStationPlayerIsNear() : null;
                const recipes = Crafting && typeof Crafting.getAvailableRecipes === 'function' ? 
                    Crafting.getAvailableRecipes(station?.typeId || null) : [];
                    
                if (UIManager && typeof UIManager.toggleCraftingUI === 'function') {
                    UIManager.toggleCraftingUI(recipes, Crafting.canCraft); // Pass check function
                }
            }
            break;
        case 'KeyB': // Build Menu / Mode
            if (!playerInVehicle) {
                if (Building && typeof Building.isBuildModeActive === 'function') {
                    if (Building.isBuildModeActive()) {
                        if (typeof Building.exitBuildMode === 'function') {
                            Building.exitBuildMode();
                        }
                    } else {
                        if (typeof Building.enterBuildMode === 'function') {
                            Building.enterBuildMode();
                        }
                    }
                }
            }
            break;
        case 'KeyR': // Reload Weapon (Example)
            if (!playerInVehicle) {
                const equippedItem = typeof Player.getEquippedItem === 'function' ? Player.getEquippedItem() : null;
                if (equippedItem?.type === 'weapon') {
                    // Player.reloadWeapon(); // Uncomment when implemented
                }
            }
            break;
        case 'Digit1': // Equip slot 1 (Example)
            // Player.equipItemFromSlot(0);
            break;
        case 'Digit2': // Equip slot 2
            // Player.equipItemFromSlot(1);
            break;
          // Add more keybinds...
    }
}

function togglePause(forceState = null) {
    const previouslyPaused = gamePaused;
    gamePaused = forceState !== null ? forceState : !gamePaused;

    if (gamePaused && !previouslyPaused) {
        console.log("Game Paused");
        if (UIManager && typeof UIManager.showPauseMenu === 'function') {
            UIManager.showPauseMenu();
        }
        if (inputState.isPointerLocked) {
             document.exitPointerLock(); // Release cursor when pausing
        }
    } else if (!gamePaused && previouslyPaused) {
        console.log("Game Resumed");
        if (UIManager && typeof UIManager.hidePauseMenu === 'function') {
            UIManager.hidePauseMenu();
        }
        // Attempt to re-acquire pointer lock if game canvas has focus
        if(document.activeElement === renderer.domElement) {
            renderer.domElement.requestPointerLock().catch(err => console.error("Pointer lock request failed:", err));
        }
    }
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// --- Start ---
initEngine();
initGame(); // Asynchronous function starts the game after setup