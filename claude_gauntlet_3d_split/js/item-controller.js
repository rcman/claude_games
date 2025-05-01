// Create a random item based on type percentages
function createRandomItem(x, z) {
    let rand = Math.random(); 
    let type;
    
    if (rand < 0.50) type = 'FOOD'; 
    else if (rand < 0.75) type = 'TREASURE'; 
    else if (rand < 0.90) type = 'POTION'; 
    else type = 'KEY';
    
    let itemData = ITEM_TYPES[type]; 
    if (!itemData) return;
    
    let itemMesh; 
    let meshName = type + "_" + BABYLON.Tools.RandomId();
    
    if (itemData.meshType === 'box') 
        itemMesh = BABYLON.MeshBuilder.CreateBox(meshName, {width: itemData.size[0], height: itemData.size[1], depth: itemData.size[2]}, scene);
    else if (itemData.meshType === 'cylinder') 
        itemMesh = BABYLON.MeshBuilder.CreateCylinder(meshName, {diameter: itemData.size.diameter, height: itemData.size.height, tessellation: 12}, scene);
    else 
        itemMesh = BABYLON.MeshBuilder.CreateSphere(meshName, {diameter: itemData.size, segments: 12}, scene);
    
    let baseY = (itemData.meshType === 'box' ? itemData.size[1] : (itemData.meshType === 'cylinder' ? itemData.size.height : itemData.size)) / 2 + 0.1;
    itemMesh.position = new BABYLON.Vector3(x, baseY, z);
    
    if (type === 'KEY') itemMesh.rotation.y = Math.PI / 4 + Math.random() * Math.PI / 2;
    
    let itemMaterial = new BABYLON.StandardMaterial("itemMat_" + meshName, scene);
    itemMaterial.diffuseColor = itemData.color.clone(); 
    itemMaterial.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    
    if (type === 'TREASURE' || type === 'POTION' || type === 'KEY') 
        itemMaterial.emissiveColor = itemData.color.scale(0.3);
    
    itemMesh.material = itemMaterial;
    itemMesh.checkCollisions = false; 
    itemMesh.isPickable = false;
    
    itemMesh.animations = [];
    let bobAnim = new BABYLON.Animation("itemBob", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    let startY = itemMesh.position.y;
    bobAnim.setKeys([ 
        { frame: 0, value: startY - 0.1 }, 
        { frame: 30, value: startY + 0.1 }, 
        { frame: 60, value: startY - 0.1 } 
    ]);
    itemMesh.animations.push(bobAnim);
    
    if (type === 'KEY' || type === 'POTION' || type === 'TREASURE') {
        let rotateAnim = new BABYLON.Animation("itemRotate", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        let startRotY = itemMesh.rotation.y;
        rotateAnim.setKeys([ 
            { frame: 0, value: startRotY }, 
            { frame: 90, value: startRotY + 2 * Math.PI }
        ]);
        itemMesh.animations.push(rotateAnim);
    }
    
    scene.beginAnimation(itemMesh, 0, 90, true);
    items.push({ 
        mesh: itemMesh, 
        type: type, 
        x: x, 
        z: z, 
        health: itemData.health || 0, 
        special: itemData.special || null, 
        score: itemData.score || 0 
    });
}

// Create a projectile
function createProjectile(position, direction, isPlayerProjectile, damage, ownerType) {
    let projectileMesh = BABYLON.MeshBuilder.CreateSphere("projectile_" + BABYLON.Tools.RandomId(), {diameter: 0.3, segments: 6}, scene);
    projectileMesh.position = position.clone();
    
    let mat = new BABYLON.StandardMaterial("projMat_" + projectileMesh.name, scene);
    mat.specularColor = new BABYLON.Color3(0,0,0); 
    mat.disableLighting = true;
    
    if (isPlayerProjectile) {
        let baseColor = CHARACTER_CLASSES[ownerType]?.color || new BABYLON.Color3(1,1,1);
        mat.diffuseColor = baseColor.scale(1.2); 
        mat.emissiveColor = baseColor;
    } else { 
        mat.diffuseColor = new BABYLON.Color3(1, 0.2, 0); 
        mat.emissiveColor = mat.diffuseColor.scale(0.8); 
    }
    
    projectileMesh.material = mat;
    projectileMesh.checkCollisions = false; 
    projectileMesh.isPickable = false;
    
    let projectile = { 
        mesh: projectileMesh, 
        direction: direction.normalize(), 
        speed: isPlayerProjectile ? 25 : 18, 
        damage: damage, 
        isPlayerProjectile: isPlayerProjectile, 
        spawnTime: gameTime, 
        lifeTime: 3000 
    };
    
    projectiles.push(projectile);
}

// Update projectiles using Raycasting
function updateProjectiles(deltaTime) {
    let dt = deltaTime / 1000.0;
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let proj = projectiles[i];
        
        if (!proj || !proj.mesh || proj.mesh.isDisposed()) { 
            projectiles.splice(i, 1); 
            continue; 
        }
        
        if (gameTime > proj.spawnTime + proj.lifeTime) { 
            createImpactEffect(proj.mesh.position); 
            proj.mesh.dispose(); 
            projectiles.splice(i, 1); 
            continue; 
        }
        
        let currentPos = proj.mesh.position.clone(); 
        let moveVector = proj.direction.scale(proj.speed * dt);
        let nextPos = currentPos.add(moveVector); 
        let rayLength = moveVector.length();
        
        if (rayLength < 0.001) continue;
        
        let ray = new BABYLON.Ray(currentPos, proj.direction, rayLength);
        let predicate = function (mesh) {
            if (!mesh || mesh.isDisposed() || !mesh.isEnabled()) return false;
            if (mesh === proj.mesh || mesh.name.startsWith("projectile_")) return false;
            if (mesh.name.startsWith("FOOD_") || mesh.name.startsWith("POTION_") || 
                mesh.name.startsWith("KEY_") || mesh.name.startsWith("TREASURE_") || 
                mesh.name === "exitKey") return false;
            if (mesh.name === "ground" || mesh.name === "ceiling") return false;
            if (proj.isPlayerProjectile && mesh.name === "player") return false;
            if (!proj.isPlayerProjectile && (mesh.name.startsWith("enemy_") || 
                                            mesh.name.startsWith("generator_"))) return false;
            return true;
        };
        
        let pickInfo = scene.pickWithRay(ray, predicate, true);
        
        if (pickInfo && pickInfo.hit && pickInfo.pickedMesh && !pickInfo.pickedMesh.isDisposed()) {
            let hitMesh = pickInfo.pickedMesh; 
            let hitPoint = pickInfo.pickedPoint;
            
            let impactColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            if (hitMesh.material && hitMesh.material.diffuseColor) 
                impactColor = hitMesh.material.diffuseColor.scale(1.2);
            else if (hitMesh.name === "player" && playerClassInfo) 
                impactColor = playerClassInfo.color.scale(1.2);
            
            createImpactEffect(hitPoint, impactColor);
            
            if (hitMesh.name.startsWith("wall")) {}
            else if (hitMesh.name.startsWith("door")) {}
            else if (hitMesh.name.startsWith("generator")) { 
                let gen = generators.find(g => g.mesh === hitMesh); 
                if (gen && !gen.isDestroyed) damageGenerator(gen, proj.damage); 
            }
            else if (hitMesh.name.startsWith("enemy_")) { 
                let enemy = enemies.find(e => e.mesh === hitMesh); 
                if (enemy && enemy.health > 0) damageEnemy(enemy, proj.damage); 
            }
            else if (hitMesh.name === "player") { 
                if (player && player.health > 0) damagePlayer(proj.damage); 
            }
            else if (hitMesh.name === "exitDoor") {}
            
            proj.mesh.dispose(); 
            projectiles.splice(i, 1);
        } else { 
            proj.mesh.position = nextPos; 
        }
    }
}

// Create particle effect for projectile impact (no texture)
function createImpactEffect(position, color) {
    let C = color || new BABYLON.Color3(0.8, 0.8, 0.8);
    
    let particleSystem = new BABYLON.ParticleSystem("impactParticles", 100, scene);
    // particleSystem.particleTexture = ...; // REMOVED
    particleSystem.emitter = position.clone();
    particleSystem.minEmitBox = BABYLON.Vector3.Zero(); 
    particleSystem.maxEmitBox = BABYLON.Vector3.Zero();
    particleSystem.color1 = new BABYLON.Color4(C.r, C.g, C.b, 0.9); 
    particleSystem.color2 = new BABYLON.Color4(C.r * 0.8, C.g * 0.8, C.b * 0.8, 0.6); 
    particleSystem.colorDead = new BABYLON.Color4(C.r * 0.5, C.g * 0.5, C.b * 0.5, 0.0);
    particleSystem.minSize = 0.1; 
    particleSystem.maxSize = 0.3; 
    particleSystem.minLifeTime = 0.1; 
    particleSystem.maxLifeTime = 0.3;
    particleSystem.emitRate = 600; 
    particleSystem.manualEmitCount = 50;
	particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, -2.0, 0); 
    particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1); 
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    particleSystem.minEmitPower = 1; 
    particleSystem.maxEmitPower = 4; 
    particleSystem.updateSpeed = 0.01;
    particleSystem.start();
    
    activeTimeouts.push(setTimeout(() => { 
        if(particleSystem) particleSystem.dispose(); 
    }, 500));
}

// Check Player Collisions with items, doors, exit
function checkCollisions() {
    if (!player || !player.mesh || player.mesh.isDisposed() || player.health <= 0) return;
    
    // Items Pickup
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        if (item && item.mesh && !item.mesh.isDisposed() && player.mesh.intersectsMesh(item.mesh, false)) {
            let message = `Picked up ${item.type}`; 
            let playSound = sounds.pickup_item;
            
            if (item.type === 'FOOD') { 
                if (player.health < player.maxHealth) { 
                    let healthBefore = player.health;
                    player.health = Math.min(player.maxHealth, player.health + item.health);
                    let healedAmount = Math.round(player.health - healthBefore);
                    message += ` (+${healedAmount} Health)`;
                } else { 
                    message += " (Health Full)"; 
                } 
            }
            else if (item.type === 'POTION') { 
                player.potions++; 
                potions = player.potions; 
                message += "!"; 
            }
            else if (item.type === 'KEY') { 
                player.keys++; 
                keys = player.keys; 
                message += "!"; 
                playSound = sounds.pickup_key; 
            }
            else if (item.type === 'TREASURE') { 
                message += ` (+${item.score} Score)`; 
            }
            
            player.score += item.score; 
            score = player.score; 
            showMessage(message, 1500); 
            updatePlayerStats();
            
            if (playSound && playSound.state() === 'loaded') playSound.play();
            item.mesh.dispose(); 
            items.splice(i, 1);
        }
    }
    
    // Doors Interaction
    doors.forEach(door => { 
        if (!door.isOpen && !door.isOpening && door.mesh && !door.mesh.isDisposed() && player.mesh.intersectsMesh(door.mesh, true)) { 
            openDoor(door); 
        } 
    });
    
    // Exit Key Pickup
    if (exitKey && !exitKey.collected && exitKey.mesh && !exitKey.mesh.isDisposed() && player.mesh.intersectsMesh(exitKey.mesh, false)) {
        exitKey.collected = true; 
        hasExitKey = true;
        if (sounds.pickup_key && sounds.pickup_key.state() === 'loaded') sounds.pickup_key.play();
        showMessage("Picked up the EXIT KEY!", 3000); 
        player.score += 100; 
        score = player.score; 
        updatePlayerStats();
        
        let scaleAnim = new BABYLON.Animation("keyCollectScale", "scaling", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        scaleAnim.setKeys([
            { frame: 0, value: exitKey.mesh.scaling }, 
            { frame: 15, value: BABYLON.Vector3.Zero()}
        ]);
        
        scene.beginDirectAnimation(exitKey.mesh, [scaleAnim], 0, 15, false, 1, () => { 
            if (exitKey && exitKey.mesh && !exitKey.mesh.isDisposed()) { 
                exitKey.mesh.dispose(); 
                exitKey.mesh = null; 
            } 
        });
    }
    
    // Exit Door Interaction
    if (exitDoor && exitDoor.mesh && !exitDoor.mesh.isDisposed() && player.mesh.intersectsMesh(exitDoor.mesh, true)) {
        if (hasExitKey) { 
            levelComplete(); 
        } else { 
            if (gameTime > lastMessageTime + 2500) { 
                showMessage("The exit is locked. Find the key!", 2500); 
                if (sounds.door_locked && sounds.door_locked.state() === 'loaded') sounds.door_locked.play(); 
            } 
        } 
    }
}