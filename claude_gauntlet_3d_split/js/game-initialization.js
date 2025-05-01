// Initialize BabylonJS
window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('renderCanvas');
    playerStatsDiv = document.getElementById('playerStats');
    messageLogDiv = document.getElementById('messageLog');
    gameOverScreen = document.getElementById('gameOverScreen');
    levelCompleteScreen = document.getElementById('levelCompleteScreen');
    startScreen = document.getElementById('startScreen');
    loadingScreen = document.getElementById('loadingScreen');

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    loadGame();

    // Use engine's delta time for game time updates within the render loop
    engine.runRenderLoop(function() {
        try {
            if (scene && !scene.isDisposed && gameState !== GAME_STATES.LOADING) {
                let deltaTime = engine.getDeltaTime();
                gameTime += deltaTime;

                if (gameState === GAME_STATES.PLAYING) {
                    updateGame(deltaTime);
                }
                
                if (scene && !scene.isDisposed && scene.activeCamera) {
                    scene.render();
                }
            }
        } catch (e) {
            console.error("Error in render loop:", e);
        }
    });

    window.addEventListener('resize', function() {
        engine.resize();
    });
});

// Register input with named handler functions
function handleKeyDown(e) { 
    inputMap[e.key.toLowerCase()] = true; 
}

function handleKeyUp(e) { 
    inputMap[e.key.toLowerCase()] = false; 
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// Load game assets and setup
async function loadGame() {
    gameState = GAME_STATES.LOADING;
    loadingScreen.style.display = 'flex';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    levelCompleteScreen.style.display = 'none';

    let loadingProgress = document.getElementById('loadingProgress');
    let loadingText = document.getElementById('loadingText');
    let progress = 0;

    try {
        // Simulate loading steps with progress updates
        await new Promise(resolve => activeTimeouts.push(setTimeout(resolve, 300)));
        loadingText.innerText = 'Loading Sounds (Placeholders)...';
        await loadSounds();
        progress = 30;
        loadingProgress.style.width = progress + '%';
        await new Promise(resolve => activeTimeouts.push(setTimeout(resolve, 300)));

        loadingText.innerText = 'Initializing Engine...';
        await setupEngine();
        progress = 60;
        loadingProgress.style.width = progress + '%';
        await new Promise(resolve => activeTimeouts.push(setTimeout(resolve, 300)));

        loadingText.innerText = 'Setting up UI Listeners...';
        setupUIListeners();
        progress = 100;
        loadingProgress.style.width = progress + '%';
        await new Promise(resolve => activeTimeouts.push(setTimeout(resolve, 500)));

        loadingScreen.style.display = 'none';
        startScreen.style.display = 'flex';
        gameState = GAME_STATES.START_SCREEN;

    } catch (error) {
        console.error("Error during game loading:", error);
        loadingText.innerText = 'Error loading game! Please refresh.';
    }
}

// Load sound effects (Placeholders only)
function loadSounds() {
  return new Promise((resolve) => {
    console.warn("SOUND SYSTEM: Using placeholder URLs ('#'). NO SOUNDS WILL PLAY.");
    sounds = {
        background: new Howl({ src: ['#'], loop: true, volume: 0.3, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        attack_melee: new Howl({ src: ['#'], volume: 0.4, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        attack_ranged: new Howl({ src: ['#'], volume: 0.4, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        hit_player: new Howl({ src: ['#'], volume: 0.5, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        hit_enemy: new Howl({ src: ['#'], volume: 0.3, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        death_enemy: new Howl({ src: ['#'], volume: 0.5, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        pickup_item: new Howl({ src: ['#'], volume: 0.6, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        pickup_key: new Howl({ src: ['#'], volume: 0.7, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        door_open: new Howl({ src: ['#'], volume: 0.5, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        door_locked: new Howl({ src: ['#'], volume: 0.5, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        special_warrior: new Howl({ src: ['#'], volume: 0.7, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        special_valkyrie: new Howl({ src: ['#'], volume: 0.7, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        special_wizard: new Howl({ src: ['#'], volume: 0.8, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        special_elf: new Howl({ src: ['#'], volume: 0.6, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        levelComplete: new Howl({ src: ['#'], volume: 0.8, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        gameOver: new Howl({ src: ['#'], volume: 0.8, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() }),
        potion_use: new Howl({ src: ['#'], volume: 0.6, onload: checkSoundsLoaded, onloaderror: () => checkSoundsLoaded() })
    };

    let loadedCount = 0;
    const totalSounds = Object.keys(sounds).length;
    let resolved = false;

    function checkSoundsLoaded() {
      loadedCount++;
      if (!resolved && loadedCount >= totalSounds) {
        console.log("All sound placeholders processed.");
        resolved = true;
        resolve();
      }
    }
    
    activeTimeouts.push(setTimeout(() => { 
      if (!resolved) { 
        console.warn(`Sound placeholder processing timed out.`); 
        resolved = true; 
        resolve(); 
      } 
    }, 5000));
  });
}

function setupUIListeners() {
    // Set up character selection
    let characterCards = document.querySelectorAll('.characterCard');
    characterCards.forEach(card => {
        card.addEventListener('click', function() {
            let type = this.getAttribute('data-type');
            if (gameState === GAME_STATES.START_SCREEN) {
                selectCharacter(type);
            }
        });
    });

    // Set up restart button
    document.getElementById('restartButton').addEventListener('click', function() {
        if (gameState === GAME_STATES.GAME_OVER) {
            restartGame();
        }
    });

    // Set up next level button
    document.getElementById('nextLevelButton').addEventListener('click', function() {
        if (gameState === GAME_STATES.LEVEL_COMPLETE) {
            loadNextLevel();
        }
    });
}

// Set up game scene
function setupEngine() {
  return new Promise((resolve) => {
    // Dispose previous scene if exists
    if (scene) {
        console.log("Disposing previous scene...");
        scene.dispose();
        scene = null;
    }
    // Dispose previous GUI texture if it exists
    if(advancedTextureGUI) {
        console.log("Disposing previous GUI Texture...");
        advancedTextureGUI.dispose();
        advancedTextureGUI = null;
    }

    console.log("Creating new scene...");
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -9.81 * 2.5, 0);

    // Set up lighting
    light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    light.diffuse = new BABYLON.Color3(0.8, 0.8, 1);
    light.groundColor = new BABYLON.Color3(0.4, 0.4, 0.5);

    // Add some fog for atmosphere
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.015;
    scene.fogColor = new BABYLON.Color3(0.1, 0.1, 0.15);

    // Setup physics
    if (window.CANNON) {
        scene.enablePhysics(scene.gravity, new BABYLON.CannonJSPlugin());
        console.log("Physics enabled.");
    } else {
        console.error("Cannon.js physics engine not found!");
    }

    // Create the GUI texture
    advancedTextureGUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    console.log("Fullscreen GUI Texture created.");

    console.log("Engine setup complete.");
    resolve();
  });
}

// Select character and start game
async function selectCharacter(type) {
    if (!CHARACTER_CLASSES[type]) {
        console.error(`Invalid character type selected: ${type}`);
        return;
    }
    startScreen.style.display = 'none';
    playerClassInfo = CHARACTER_CLASSES[type];

    resetFullGameState();
    await setupEngine();
    startGameLevel();
}

// Clean up to prevent memory leaks
function cleanupGame() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    Howler.stop();
    
    if (scene) {
        scene.materials.forEach(material => {
            if (material) material.dispose();
        });
    }
    
    activeTimeouts.forEach(clearTimeout);
    activeIntervals.forEach(clearInterval);
    activeTimeouts = [];
    activeIntervals = [];
}