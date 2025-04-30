// Main game initialization and loop
function init() {
    // Initialize Three.js scene
    initScene();
    
    // Set up window resize handler
    handleResize();
    
    // Initialize perlin noise seed
    perlin.seed(Math.random());
    
    // Add some initial items to inventory
    gameState.player.inventory.push({ type: 'wood', name: 'Wood', count: 20 });
    gameState.player.inventory.push({ type: 'stone', name: 'Stone', count: 10 });
    gameState.player.inventory.push({ type: 'meat', name: 'Meat', count: 5 });
    gameState.player.inventory.push({ type: 'berries', name: 'Berries', count: 8 });
    
    // Create and add a simple starter weapon
    const weapon = {
        type: 'weapon',
        name: 'Stone Axe',
        damage: 5,
        durability: 100,
        count: 1
    };
    
    gameState.player.inventory.push(weapon);
    gameState.player.equipped = 4; // Equip the weapon
    
    // Create ocean
    ocean = createOcean();
    
    // Create player ship
    playerShip = createShip();
    playerShip.position.set(10, 0, 10);
    scene.add(playerShip);
    gameState.world.entities.push(playerShip);
    
    // Create some test portals
    const portal1 = new Portal(new THREE.Vector3(20, 0, 20), "Meadows");
    const portal2 = new Portal(new THREE.Vector3(-20, 0, -20), "Forest");
    
    // Link portals
    portal1.linkTo(portal2);
    
    // Create some test crops
    createCropPlot(new THREE.Vector3(5, 0, 5), 'carrot');
    createCropPlot(new THREE.Vector3(6, 0, 5), 'turnip');
    createCropPlot(new THREE.Vector3(7, 0, 5), 'barley');
    
    // Populate UI elements
    updateInventoryDisplay();
    populateCraftingMenu();
    populateBuildingMenu();
    
    // Initial game message
    showGameMessage("Welcome to Viking Survival!");
    
    // Start game loop
    animate(0);
    
    console.log('Game initialized');
}

// Main game loop
function animate(time) {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    deltaTime = (time - lastTime) / 1000; // Convert to seconds
    lastTime = time;
    
    // Limit delta time to prevent large jumps
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    // Only update game when controls are locked (game is active)
    if (controls.isLocked) {
        // Update player
        updatePlayer(deltaTime);
        
        // Update food buffs
        updateFoodBuffs(deltaTime);
        
        // Load/unload chunks around player
        loadChunks();
        
        // Update building preview if in building mode
        if (selectedBuildingPiece) {
            updateBuildingPreview();
        }
        
        // Update enemies
        updateEnemies(deltaTime);
        
        // Spawn new enemies
        spawnEnemies();
        
        // Update boss if active
        if (activeBoss) {
            updateBoss(deltaTime);
        }
        
        // Check for random events
        checkForRandomEvents(deltaTime);
        
        // Check for portal interactions
        checkPortalInteraction();
        
        // Check for crop interactions
        checkCropInteraction();
        
        // Update crops
        gameState.world.entities.forEach(entity => {
            if (entity.userData && entity.userData.type === 'crop') {
                entity.userData.cropRef.grow(deltaTime);
            }
        });
        
        // Update portals
        gameState.world.entities.forEach(entity => {
            if (entity.userData && entity.userData.type === 'portal') {
                entity.userData.portalRef.update(deltaTime);
            }
        });
        
        // Update ship controls if player is on ship
        if (isOnShip) {
            controlShip(deltaTime);
        }
        
        // Animate ocean waves
        if (ocean) {
            const vertices = ocean.geometry.attributes.position.array;
            const time = Date.now() * 0.001;
            
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const z = vertices[i + 2];
                
                // Create wave pattern
                vertices[i + 1] = Math.sin(x * 0.1 + time) * 0.5 + 
                                  Math.cos(z * 0.1 + time * 0.8) * 0.5;
            }
            
            ocean.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update day/night cycle
        updateDayNightCycle(deltaTime);
        
        // Update weather particles
        updateWeatherParticles();
        
        // Update player skills
        updateSkills();
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the game
init();