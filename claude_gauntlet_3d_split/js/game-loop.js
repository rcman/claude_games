// Main game update loop
function updateGame(deltaTime) {
    try {
        if (!player || !player.mesh || player.mesh.isDisposed() || !scene || scene.isDisposed) return;
        
        handlePlayerInput(deltaTime);
        updateEnemies(deltaTime);
        updateGenerators(deltaTime);
        updateProjectiles(deltaTime);
        checkCollisions();
        updateUI();
    } catch (error) { 
        console.error("Error during game update:", error);
        // Attempt to recover gracefully instead of crashing
        if (error.toString().includes("disposed") || error.toString().includes("null")) {
            console.warn("Detected reference to disposed object, attempting recovery...");
            // Don't call game over immediately, just try to keep running
        } else {
            // For other serious errors, might need to restart level
            gameOver("An error occurred. Please try again.");
        }
    }
}

// Starts or restarts the game at the current level
function startGameLevel() {
    if (!scene) {
      console.error("Scene not initialized! Cannot start level.");
      return;
    }
    console.log(`Starting Level ${currentLevel}`);
    clearLevel();       // Clear meshes, arrays from previous level (if any)
    generateLevel();    // Create dungeon layout data and meshes
    createPlayer();     // Create the player mesh and data object
    setupPlayerCamera(); // Set up the camera after player exists
    setupUI();          // Initialize UI text/stats display
    lastMessageTime = 0; // Reset message timer
    inputMap = {};       // Reset input map to prevent stuck keys

    // Background sound is placeholder, so no actual music will play
    if (sounds.background && sounds.background.state() === 'loaded') {
         // sounds.background.play(); // Don't attempt to play the placeholder
         console.log("Background sound placeholder loaded (no audio).");
    } else {
        console.warn("Background sound placeholder not loaded or failed.");
    }

    gameState = GAME_STATES.PLAYING;
    showMessage(`${playerClassInfo.name} enters the dungeon! LEVEL ${currentLevel}`, 5000);
}

// Reset game state for a completely new game
function resetFullGameState() {
    console.log("Resetting full game state.");
    score = 0;
    keys = 0;
    potions = 3; // Start with 3 potions
    currentLevel = 1;
    hasExitKey = false;
    gameTime = 0; // Reset game timer as well
}

// Game Over
function gameOver(optionalMessage = "") {
    if (gameState === GAME_STATES.GAME_OVER) return;
    console.log("GAME OVER triggered."); 
    gameState = GAME_STATES.GAME_OVER;
    
    Howler.stop(); // Stop all sounds (placeholders wouldn't be playing anyway)
    if (sounds.gameOver && sounds.gameOver.state() === 'loaded') sounds.gameOver.play();
    
    if(player && player.mesh && !player.mesh.isDisposed()) {
        if (player.mesh.physicsImpostor) { 
            player.mesh.physicsImpostor.dispose(); 
            player.mesh.physicsImpostor = null; 
        }
    }
    
    if (camera) camera.detachControl(canvas); 
    inputMap = {};
    
    let finalMessage = optionalMessage || `Your quest ended on level ${currentLevel} with a score of ${player?.score || 0}.`;
    document.getElementById('gameOverMessage').innerText = finalMessage;
    gameOverScreen.style.display = 'flex';
}

// Restart Game
function restartGame() {
    if (gameState !== GAME_STATES.GAME_OVER) return;
    console.log("Cleaning up and restarting game...");
    gameOverScreen.style.display = 'none';
    cleanupGame();
    loadGame(); // This is better than reloading the page
}

// Level Complete
function levelComplete() {
    if (gameState === GAME_STATES.LEVEL_COMPLETE || gameState === GAME_STATES.GAME_OVER) return;
    console.log(`Level ${currentLevel} Complete! Score: ${player?.score || 0}`); 
    gameState = GAME_STATES.LEVEL_COMPLETE;
    
    if (sounds.background && sounds.background.playing()) sounds.background.stop();
    if (sounds.levelComplete && sounds.levelComplete.state() === 'loaded') sounds.levelComplete.play();
    
    if(player && player.mesh && !player.mesh.isDisposed() && player.mesh.physicsImpostor) { 
        player.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero()); 
        player.mesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero()); 
    }
    
    if (camera) camera.detachControl(canvas); 
    inputMap = {};
    
    document.getElementById('finalLevelScore').innerText = player?.score || 0;
    levelCompleteScreen.style.display = 'flex';
}

// Load Next Level
async function loadNextLevel() {
    if (gameState !== GAME_STATES.LEVEL_COMPLETE) return;
    console.log("Loading next level..."); 
    levelCompleteScreen.style.display = 'none'; 
    currentLevel++;
    
    if (player) {
        let healthBonus = player.maxHealth * 0.25; 
        player.health = Math.min(player.maxHealth, player.health + healthBonus);
        score = player.score; 
        keys = player.keys; 
        potions = player.potions;
    } else { 
        gameOver("Error loading next level - Player lost!"); 
        return; 
    }
    
    hasExitKey = false;
    console.log("Preparing to start next level...");
    await setupEngine(); // Re-initialize the engine to avoid issues
    startGameLevel(); // Re-initializes the level using existing scene/engine
}