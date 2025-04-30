// Sailing and ocean systems
function createOcean() {
    // Ocean plane
    const oceanGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    oceanGeometry.rotateX(-Math.PI / 2);
    
    // Ocean material with wave animation
    const oceanMaterial = new THREE.MeshStandardMaterial({
        color: 0x0066FF,
        transparent: true,
        opacity: 0.8
    });
    
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.position.y = -5; // Ocean level below most terrain
    
    // Add to scene
    scene.add(ocean);
    
    // Return ocean for animations
    return ocean;
}

function createShip() {
    const ship = new THREE.Group();
    
    // Ship hull
    const hullGeometry = new THREE.BoxGeometry(3, 1, 8);
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 0.5;
    ship.add(hull);
    
    // Ship mast
    const mastGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 3;
    ship.add(mast);
    
    // Ship sail
    const sailGeometry = new THREE.PlaneGeometry(2, 4);
    const sailMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.y = 3;
    sail.position.z = -1;
    sail.rotation.y = Math.PI / 2;
    ship.add(sail);
    
    // Ship properties
    ship.userData = {
        type: 'ship',
        speed: 0,
        maxSpeed: 10,
        rotationSpeed: 0.5,
        durability: 100
    };
    
    return ship;
}

function boardShip(ship) {
    isOnShip = true;
    playerShip = ship;
    
    // Adjust camera and controls
    camera.position.y += 1.5; // Raise camera to ship deck level
    
    showGameMessage("Boarded ship");
    console.log("Boarded ship");
}

function leaveShip() {
    isOnShip = false;
    
    // Position player near ship
    camera.position.x = playerShip.position.x + 2;
    camera.position.z = playerShip.position.z;
    camera.position.y = getTerrainHeight(camera.position.x, camera.position.z) + 1.7;
    
    showGameMessage("Left ship");
    console.log("Left ship");
}

function controlShip(deltaTime) {
    if (!isOnShip || !playerShip) return;
    
    // Ship controls
    if (keyboard['KeyW']) {
        // Increase speed
        playerShip.userData.speed += 2 * deltaTime;
        playerShip.userData.speed = Math.min(playerShip.userData.speed, playerShip.userData.maxSpeed);
    } else if (keyboard['KeyS']) {
        // Decrease speed / reverse
        playerShip.userData.speed -= 2 * deltaTime;
        playerShip.userData.speed = Math.max(playerShip.userData.speed, -playerShip.userData.maxSpeed / 2);
    } else {
        // Slow down naturally
        playerShip.userData.speed *= 0.99;
    }
    
    // Turning
    if (keyboard['KeyA']) {
        playerShip.rotation.y += playerShip.userData.rotationSpeed * deltaTime;
    } else if (keyboard['KeyD']) {
        playerShip.rotation.y -= playerShip.userData.rotationSpeed * deltaTime;
    }
    
    // Move ship forward in its facing direction
    const moveVector = new THREE.Vector3(0, 0, -playerShip.userData.speed * deltaTime);
    moveVector.applyQuaternion(playerShip.quaternion);
    playerShip.position.add(moveVector);
    
    // Update player position with ship
    camera.position.x = playerShip.position.x;
    camera.position.z = playerShip.position.z;
    camera.position.y = playerShip.position.y + 1.7 + Math.sin(Date.now() * 0.002) * 0.1; // Add slight bobbing
}