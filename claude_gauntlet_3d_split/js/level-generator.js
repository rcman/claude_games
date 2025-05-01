// Generate a random dungeon level
function generateLevel() {
    console.log("Generating dungeon layout...");
    dungeon = new Array(MAP_HEIGHT).fill(0).map(() => new Array(MAP_WIDTH).fill(1)); // Start with all walls
    let rooms = [];
    const maxRooms = 5 + Math.floor(currentLevel * 1.5);
    const minRoomSize = 3;
    const maxRoomSize = 6 + Math.min(5, Math.floor(currentLevel / 2));
    const maxTries = maxRooms * 10;
    
    for (let i = 0; i < maxTries && rooms.length < maxRooms; i++) {
        let w = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
        let h = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
        let x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
        let y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));
        if (x < 1 || y < 1 || x+w >= MAP_WIDTH-1 || y+h >= MAP_HEIGHT-1) continue;
        
        let newRoom = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };
        let overlaps = false;
        
        for (let existingRoom of rooms) { 
            if (x < existingRoom.x + existingRoom.w + 1 && 
                x + w + 1 > existingRoom.x && 
                y < existingRoom.y + existingRoom.h + 1 && 
                y + h + 1 > existingRoom.y) { 
                overlaps = true; 
                break; 
            } 
        }
        
        if (!overlaps) {
            for (let ry = y; ry < y + h; ry++) { 
                for (let rx = x; rx < x + w; rx++) { 
                    if (ry >= 0 && ry < MAP_HEIGHT && rx >=0 && rx < MAP_WIDTH) 
                        dungeon[ry][rx] = 0; 
                } 
            }
            rooms.push(newRoom);
        }
    }
    
    // Fallback if no rooms were generated
    if (rooms.length === 0) {
        console.warn("Room generation failed, creating failsafe room.");
        let w = 5, h = 5; 
        let x = Math.max(1, Math.floor(MAP_WIDTH/2 - w/2)); 
        let y = Math.max(1, Math.floor(MAP_HEIGHT/2 - h/2));
        let newRoom = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };
        
        for (let ry = y; ry < y + h; ry++) { 
            for (let rx = x; rx < x + w; rx++) { 
                if (ry >= 0 && ry < MAP_HEIGHT && rx >=0 && rx < MAP_WIDTH) 
                    dungeon[ry][rx] = 0; 
            } 
        }
        rooms.push(newRoom);
    }
    
    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        let c1 = rooms[i]; 
        let c2 = rooms[i + 1]; 
        let x1 = c1.cx, y1 = c1.cy; 
        let x2 = c2.cx, y2 = c2.cy;
        
       if (Math.random() > 0.5) { 
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { 
                if (y1 >= 0 && y1 < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) 
                    dungeon[y1][x] = 0; 
            } 
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { 
                if (y >= 0 && y < MAP_HEIGHT && x2 >= 0 && x2 < MAP_WIDTH) 
                    dungeon[y][x2] = 0; 
            }
        } else { 
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { 
                if (y >= 0 && y < MAP_HEIGHT && x1 >= 0 && x1 < MAP_WIDTH) 
                    dungeon[y][x1] = 0; 
            } 
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { 
                if (y2 >= 0 && y2 < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) 
                    dungeon[y2][x] = 0; 
            } 
        }
    }
    
    // Add doors
    let placedDoors = 0; 
    let doorCandidates = [];
    
    for (let y = 1; y < MAP_HEIGHT - 1; y++) { 
        for (let x = 1; x < MAP_WIDTH - 1; x++) { 
            if (dungeon[y][x] === 1) { 
                if (dungeon[y][x - 1] === 0 && dungeon[y][x + 1] === 0 && 
                    dungeon[y - 1][x] === 1 && dungeon[y + 1][x] === 1) 
                    doorCandidates.push({x, y}); 
                else if (dungeon[y - 1][x] === 0 && dungeon[y + 1][x] === 0 && 
                         dungeon[y][x - 1] === 1 && dungeon[y][x + 1] === 1) 
                    doorCandidates.push({x, y}); 
            } 
        } 
    }
    
    shuffleArray(doorCandidates); 
    let numDoorsToPlace = Math.min(doorCandidates.length, rooms.length + Math.floor(currentLevel / 2));
    
    for(let i=0; i < numDoorsToPlace; i++) { 
        let pos = doorCandidates[i]; 
        dungeon[pos.y][pos.x] = 2; 
        placedDoors++; 
    }
    
    // Set up player start, exit and key positions
    let playerStartRoom = rooms[0]; 
    let startX = playerStartRoom.cx; 
    let startY = playerStartRoom.cy;
    
    if (player) { 
        player.startX = startX; 
        player.startY = startY; 
    } else { 
        player = { startX: startX, startY: startY }; 
    }
    
    let exitRoomIndex = rooms.length > 1 ? rooms.length - 1 : 0; 
    let keyRoomIndex = 0;
    
    if (rooms.length > 2) { 
        keyRoomIndex = Math.floor(1 + Math.random() * (rooms.length - 2)); 
        if (keyRoomIndex === exitRoomIndex) { 
            keyRoomIndex = (exitRoomIndex > 1) ? exitRoomIndex - 1 : 1; 
        } 
    } else if (rooms.length > 1) { 
        keyRoomIndex = 1; 
        if (keyRoomIndex === exitRoomIndex) keyRoomIndex = 0; 
    }
    
    keyRoomIndex = Math.max(0, Math.min(rooms.length - 1, keyRoomIndex)); 
    if (keyRoomIndex === 0 && exitRoomIndex === 0 && rooms.length > 1) { 
        exitRoomIndex = 1; 
    }
    
    let exitRoom = rooms[exitRoomIndex]; 
    let keyRoom = rooms[keyRoomIndex];
    
    dungeon[exitRoom.cy][exitRoom.cx] = 5; // Exit door
    dungeon[keyRoom.cy][keyRoom.cx] = 4;   // Key
    
    // Add enemies, generators, and items
    let floorTiles = [];
    for (let y = 1; y < MAP_HEIGHT - 1; y++) { 
        for (let x = 1; x < MAP_WIDTH - 1; x++) { 
            if (dungeon[y][x] === 0) { 
                let distPlayer = Math.abs(x - startX) + Math.abs(y - startY); 
                let distExit = Math.abs(x - exitRoom.cx) + Math.abs(y - exitRoom.cy); 
                let distKey = Math.abs(x - keyRoom.cx) + Math.abs(y - keyRoom.cy); 
                if(distPlayer > 3 && distExit > 0 && distKey > 0) 
                    floorTiles.push({x, y}); 
            } 
        } 
    }
    
    shuffleArray(floorTiles);
    
    // Add generators
    let numGenerators = Math.min(floorTiles.length, 1 + Math.floor(currentLevel / 3));
    for(let i=0; i < numGenerators && floorTiles.length > 0; i++) { 
        let pos = floorTiles.pop(); 
        dungeon[pos.y][pos.x] = 3; 
    }
    
    // Add items
    let numItems = Math.min(floorTiles.length, 4 + Math.floor(currentLevel * 1.2));
    for(let i=0; i < numItems && floorTiles.length > 0; i++) { 
        let pos = floorTiles.pop(); 
        dungeon[pos.y][pos.x] = 6; 
    }
    
    // Add enemies
    let numEnemies = Math.min(floorTiles.length, 3 + Math.floor(currentLevel * 1.5));
    for(let i=0; i < numEnemies && floorTiles.length > 0; i++) { 
        let pos = floorTiles.pop(); 
        dungeon[pos.y][pos.x] = 7; 
    }
    
    // Build 3D level from dungeon grid
    console.log("Building 3D level geometry (using colors only)...");
    buildLevel();
    console.log("Level generation complete.");
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Build the 3D level from the dungeon grid
function buildLevel() {
    // Materials (Define once for efficiency)
    let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.35, 0.25);
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    let ceilingMaterial = new BABYLON.StandardMaterial("ceilingMat", scene);
    ceilingMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
    ceilingMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ceilingMaterial.backFaceCulling = false;

    let wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.55);
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Create ground plane
    let ground = BABYLON.MeshBuilder.CreateGround("ground", {width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE}, scene);
    ground.position.y = 0;
    ground.material = groundMaterial;
    ground.checkCollisions = true;
    if (scene.isPhysicsEnabled) {
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.8, restitution: 0.1 }, scene);
    }

    // Create ceiling plane
    let ceiling = BABYLON.MeshBuilder.CreatePlane("ceiling", {width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE}, scene);
    ceiling.position.y = TILE_SIZE;
    ceiling.rotation.x = Math.PI;
    ceiling.material = ceilingMaterial;
    ceiling.checkCollisions = true;

    // Process each cell in the dungeon grid
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let worldX = (x - MAP_WIDTH / 2 + 0.5) * TILE_SIZE;
            let worldZ = (y - MAP_HEIGHT / 2 + 0.5) * TILE_SIZE;
            switch (dungeon[y][x]) {
                case 1: createWall(worldX, worldZ, wallMaterial); break;
                case 2: createDoor(worldX, worldZ); break;
                case 3: createGenerator(worldX, worldZ); break;
                case 4: createExitKey(worldX, worldZ); break;
                case 5: createExitDoor(worldX, worldZ); break;
                case 6: createRandomItem(worldX, worldZ); break;
                case 7: createRandomEnemy(worldX, worldZ); break;
            }
        }
    }
    console.log(`Created ${walls.length} walls, ${doors.length} doors, ${generators.length} generators, ${items.length} items, ${enemies.length} enemies.`);
}

// Create a wall - Accepts shared material
function createWall(x, z, material) {
    let wall = BABYLON.MeshBuilder.CreateBox("wall_" + x + "_" + z, {width: TILE_SIZE, height: TILE_SIZE, depth: TILE_SIZE}, scene);
    wall.position = new BABYLON.Vector3(x, TILE_SIZE / 2, z);
    wall.material = material;
    wall.checkCollisions = true;
    if (scene.isPhysicsEnabled) {
        wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.6, restitution: 0.2 }, scene);
    }
    walls.push({ mesh: wall, x: x, z: z });
}

// Create a door
function createDoor(x, z) {
    const doorHeight = TILE_SIZE * 0.9;
    const doorWidth = TILE_SIZE * 0.9;
    const doorDepth = 0.3;
    let door = BABYLON.MeshBuilder.CreateBox("door_" + x + "_" + z, {width: doorWidth, height: doorHeight, depth: doorDepth}, scene);
    door.position = new BABYLON.Vector3(x, doorHeight / 2, z);
    let doorMaterial = new BABYLON.StandardMaterial("doorMat_" + x + "_" + z, scene);
    doorMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1);
    doorMaterial.specularColor = new BABYLON.Color3(0.1, 0.05, 0);
    door.material = doorMaterial;
    door.checkCollisions = true;
    if (scene.isPhysicsEnabled) {
        door.physicsImpostor = new BABYLON.PhysicsImpostor(door, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.3 }, scene);
    }
    let requiresKey = Math.random() < Math.min(0.6, 0.15 + currentLevel * 0.05);
    let doorData = { mesh: door, x: x, z: z, isOpen: false, isOpening: false, requiresKey: requiresKey, originalY: door.position.y };
    doors.push(doorData);
    if (requiresKey) { 
        doorMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0); 
    }
}

// Open a door
function openDoor(door) {
    if (!door || door.isOpen || door.isOpening || !door.mesh || door.mesh.isDisposed()) return;
    if (door.requiresKey) {
        if (player && player.keys > 0) {
            player.keys--; keys = player.keys; 
            showMessage("Used a key to open the door.", 2000);
            if (door.mesh.material) door.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        } else {
            showMessage("This door requires a key!", 2000);
            if (sounds.door_locked && sounds.door_locked.state() === 'loaded') sounds.door_locked.play();
            return;
        }
    } else { 
        showMessage("Door opened.", 1500); 
    }
    
    door.isOpening = true;
    if (sounds.door_open && sounds.door_open.state() === 'loaded') sounds.door_open.play();
    updatePlayerStats();
    
    let targetY = door.originalY + TILE_SIZE;
    let animation = new BABYLON.Animation("doorOpenAnim", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    animation.setKeys([{ frame: 0, value: door.mesh.position.y }, { frame: 30, value: targetY }]);
    scene.beginDirectAnimation(door.mesh, [animation], 0, 30, false, 1, () => {
        if (door.mesh && !door.mesh.isDisposed()) {
            door.mesh.checkCollisions = false;
            if (door.mesh.physicsImpostor) { 
                door.mesh.physicsImpostor.dispose(); 
                door.mesh.physicsImpostor = null; 
            }
            door.isOpen = true;
        }
        door.isOpening = false;
    });
}

// Create the exit key
function createExitKey(x, z) {
    let keyMesh = BABYLON.MeshBuilder.CreateBox("exitKey", {width: 0.5, height: 0.5, depth: 0.1}, scene);
    keyMesh.position = new BABYLON.Vector3(x, 0.6, z); 
    keyMesh.rotation.y = Math.PI / 4;
    
    let keyMaterial = new BABYLON.StandardMaterial("keyMat", scene);
    keyMaterial.diffuseColor = new BABYLON.Color3(1, 0.85, 0); 
    keyMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0); 
    keyMaterial.specularColor = new BABYLON.Color3(1, 1, 0.7);
    keyMesh.material = keyMaterial;
    keyMesh.checkCollisions = false; 
    keyMesh.isPickable = false;
    
    let rotateAnim = new BABYLON.Animation("keyRotate", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    rotateAnim.setKeys([ 
        { frame: 0, value: keyMesh.rotation.y }, 
        { frame: 60, value: keyMesh.rotation.y + 2 * Math.PI }
    ]);
    
    let bobAnim = new BABYLON.Animation("keyBob", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    let startY = keyMesh.position.y;
    bobAnim.setKeys([ 
        { frame: 0, value: startY - 0.1 }, 
        { frame: 30, value: startY + 0.1 }, 
        { frame: 60, value: startY - 0.1 } 
    ]);
    
    keyMesh.animations = [rotateAnim, bobAnim];
    scene.beginAnimation(keyMesh, 0, 60, true);
    exitKey = { mesh: keyMesh, x: x, z: z, collected: false };
}

// Create the exit door
function createExitDoor(x, z) {
    let doorMesh = BABYLON.MeshBuilder.CreateBox("exitDoor", {width: TILE_SIZE * 0.8, height: TILE_SIZE * 0.9, depth: 0.4}, scene);
    doorMesh.position = new BABYLON.Vector3(x, TILE_SIZE * 0.9 / 2, z);
    
    let doorMaterial = new BABYLON.StandardMaterial("exitDoorMat", scene);
    doorMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.7, 0.1); 
    doorMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0); 
    doorMaterial.specularColor = new BABYLON.Color3(0.2, 0.5, 0.2);
    doorMesh.material = doorMaterial;
    doorMesh.checkCollisions = true;
    
    if (scene.isPhysicsEnabled) {
        doorMesh.physicsImpostor = new BABYLON.PhysicsImpostor(doorMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.3 }, scene);
    }
    
    exitDoor = { mesh: doorMesh, x: x, z: z, isOpen: false };
}

// Clear current level entities and scene elements
function clearLevel() {
    if (!scene) {
        console.warn("Attempted to clear level, but scene does not exist.");
        return;
    }
    console.log("Clearing level entities...");

    // First dispose GUI elements
    if (advancedTextureGUI) {
        try {
            enemyHealthBars.forEach(enemyData => {
                if (enemyData && enemyData.healthBar && !enemyData.healthBar.isDisposed) {
                    advancedTextureGUI.removeControl(enemyData.healthBar);
                    enemyData.healthBar.dispose();
                }
            });
            enemyHealthBars.clear();

            generatorHealthBars.forEach(genData => {
                if (genData && genData.healthBar && !genData.healthBar.isDisposed) {
                    advancedTextureGUI.removeControl(genData.healthBar);
                    genData.healthBar.dispose();
                }
            });
            generatorHealthBars.clear();
        } catch(e) {
            console.error("Error disposing GUI elements:", e);
        }
    }

    // Helper function to safely dispose an entity
    function safeDispose(entity) {
        if (!entity || !entity.mesh) return;
        
        try {
            if (entity.mesh.physicsImpostor) {
                entity.mesh.physicsImpostor.dispose();
                entity.mesh.physicsImpostor = null;
            }
            
            if (!entity.mesh.isDisposed()) {
                entity.mesh.dispose();
            }
            entity.mesh = null;
        } catch(e) {
            console.error("Error disposing entity:", e);
        }
    }

    // Dispose all entities
    [enemies, projectiles, items, walls, doors, generators].forEach(arr => {
        for(let i = arr.length - 1; i >= 0; i--) {
            safeDispose(arr[i]);
        }
        arr.length = 0;
    });

    safeDispose(exitKey);
    exitKey = null;

    safeDispose(exitDoor);
    exitDoor = null;

    safeDispose(player);
    player = null;

    // Dispose ground and ceiling
    let ground = scene.getMeshByName("ground");
    safeDispose({mesh: ground});
    
    let ceiling = scene.getMeshByName("ceiling");
    safeDispose({mesh: ceiling});

    dungeon = [];
    hasExitKey = false;
    console.log("Level clear complete.");
}