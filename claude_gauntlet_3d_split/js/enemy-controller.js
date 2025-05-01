// Create a random enemy at a specific location
function createRandomEnemy(x, z, specificType = null) {
    let type;
    if (specificType && ENEMY_TYPES[specificType]) type = specificType;
    else {
        let possibleTypes = []; 
        let weightSum = 0;
        let weights = { 
            GHOST: 20 - currentLevel, 
            GRUNT: 30 + currentLevel, 
            DEMON: (currentLevel > 2) ? 15 + currentLevel : 0, 
            SORCERER: (currentLevel > 3) ? 10 + currentLevel : 0, 
            DEATH: (currentLevel > 5) ? 5 + currentLevel * 0.5 : 0 
        };
        
        for (const key in weights) { 
            if (weights[key] > 0) { 
                possibleTypes.push({ type: key, weight: weights[key] }); 
                weightSum += weights[key]; 
            } 
        }
        
        if (weightSum === 0 || possibleTypes.length === 0) type = 'GHOST';
        else { 
            let rand = Math.random() * weightSum; 
            let cumulativeWeight = 0; 
            for(let item of possibleTypes) { 
                cumulativeWeight += item.weight; 
                if (rand < cumulativeWeight) { 
                    type = item.type; 
                    break; 
                } 
            } 
            if (!type) type = possibleTypes[possibleTypes.length - 1].type; 
        }
    }
    
    let enemyData = ENEMY_TYPES[type]; 
    if (!enemyData) { 
        type = 'GRUNT'; 
        enemyData = ENEMY_TYPES[type]; 
    }
    
    let enemyMesh; 
    let meshHeight = 1.5; 
    let meshName = "enemy_" + type + "_" + BABYLON.Tools.RandomId();
    
    if (enemyData.meshType === 'box') { 
        enemyMesh = BABYLON.MeshBuilder.CreateBox(meshName, {width: enemyData.size[0], height: enemyData.size[1], depth: enemyData.size[2]}, scene); 
        meshHeight = enemyData.size[1]; 
    } else if (enemyData.meshType === 'cylinder') { 
        enemyMesh = BABYLON.MeshBuilder.CreateCylinder(meshName, {diameter: enemyData.size.diameter, height: enemyData.size.height, tessellation: 12}, scene); 
        meshHeight = enemyData.size.height; 
    } else { 
        enemyMesh = BABYLON.MeshBuilder.CreateSphere(meshName, {diameter: enemyData.size, segments: 12}, scene); 
        meshHeight = enemyData.size; 
    }
    
    enemyMesh.position = new BABYLON.Vector3(x, meshHeight / 2 + 0.05, z);
    
    let enemyMaterial = new BABYLON.StandardMaterial("enemyMat_" + meshName, scene);
    enemyMaterial.diffuseColor = enemyData.color.clone(); 
    enemyMaterial.specularColor = enemyData.color.scale(0.3);
    
    if (enemyData.alpha && enemyData.alpha < 1.0) enemyMaterial.alpha = enemyData.alpha;
    enemyMesh.material = enemyMaterial;
    enemyMesh.checkCollisions = true;
    
    if (scene.isPhysicsEnabled) {
        let impostorType;
        if (enemyData.meshType === 'sphere') impostorType = BABYLON.PhysicsImpostor.SphereImpostor;
        else if (enemyData.meshType === 'cylinder') impostorType = BABYLON.PhysicsImpostor.CylinderImpostor;
        else impostorType = BABYLON.PhysicsImpostor.BoxImpostor;
        
        enemyMesh.physicsImpostor = new BABYLON.PhysicsImpostor(enemyMesh, impostorType, { mass: 40 + Math.random() * 20, friction: 0.4, restitution: 0.1 }, scene);
        
        if (enemyMesh.physicsImpostor.physicsBody) {
            enemyMesh.physicsImpostor.physicsBody.angularDamping = 0.98;
            if (impostorType !== BABYLON.PhysicsImpostor.SphereImpostor) { 
                enemyMesh.physicsImpostor.physicsBody.fixedRotation = true; 
                enemyMesh.physicsImpostor.physicsBody.updateMassProperties(); 
            }
        }
    }
    
    let health = enemyData.health + Math.floor(currentLevel * enemyData.health * 0.1);
    let attack = enemyData.attack + Math.floor(currentLevel * enemyData.attack * 0.08);
    let speed = enemyData.speed * (1 + Math.min(0.5, currentLevel * 0.03));
    
    let enemy = { 
        mesh: enemyMesh, 
        id: "enemy_" + BABYLON.Tools.RandomId(), 
        type: type, 
        x: x, 
        z: z, 
        health: health, 
        maxHealth: health, 
        attack: attack, 
        speed: speed, 
        lastAttackTime: 0, 
        lastShotTime: 0, 
        shootCooldown: enemyData.shootCooldown || 2000, 
        shootRange: enemyData.shootRange || 0, 
        canShoot: enemyData.canShoot || false, 
        isInvulnerable: enemyData.isInvulnerable || false, 
        specialAttack: enemyData.specialAttack || false, 
        score: enemyData.score, 
        state: 'idle', 
        targetPosition: null, 
        healthBar: null, 
        healthBarFill: null, 
        markedForDeath: false 
    };
    
    enemies.push(enemy);
    createEnemyHealthBar(enemy);
}

// Create GUI health bar for an enemy
function createEnemyHealthBar(enemy) {
    if (!advancedTextureGUI) { 
        console.error("Cannot create enemy health bar, advancedTextureGUI is not initialized."); 
        return; 
    }
    
    let healthBar = new BABYLON.GUI.Rectangle(enemy.id + "_bar");
    healthBar.width = "50px"; 
    healthBar.height = "5px"; 
    healthBar.cornerRadius = 2; 
    healthBar.color = "#300"; 
    healthBar.thickness = 1; 
    healthBar.background = "#500";
    healthBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    let healthFill = new BABYLON.GUI.Rectangle(enemy.id + "_fill");
    healthFill.width = 1.0; 
    healthFill.height = 1.0; 
    healthFill.cornerRadius = 2; 
    healthFill.color = "transparent"; 
    healthFill.background = "#f00";
    healthFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    
    healthBar.addControl(healthFill);
    advancedTextureGUI.addControl(healthBar);
    healthBar.linkWithMesh(enemy.mesh);
    
    let meshHeight = enemy.mesh.getBoundingInfo().boundingBox.extendSize.y * 2;
    healthBar.linkOffsetY = -(meshHeight * 10 + 8);
    
    enemy.healthBar = healthBar; 
    enemy.healthBarFill = healthFill;
    enemyHealthBars.set(enemy.id, enemy);
    healthBar.isVisible = false;
}

// Update enemy health bar display
function updateEnemyHealthBar(enemy) {
    if (enemy && enemy.healthBar && !enemy.healthBar.isDisposed && enemy.healthBarFill) {
        let healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
        enemy.healthBarFill.width = healthPercent;
        enemy.healthBarFill.isVisible = (healthPercent > 0 && healthPercent < 1);
    }
}

// Update enemy behavior (AI)
function updateEnemies(deltaTime) {
    if (!player || !player.mesh || player.mesh.isDisposed() || player.health <= 0) return;
    let playerPos = player.mesh.getAbsolutePosition();
    
    enemies.forEach((enemy, index) => {
        if (!enemy || !enemy.mesh || enemy.mesh.isDisposed() || enemy.health <= 0 || !enemy.mesh.isEnabled()) return;
        if (!enemy.mesh.physicsImpostor || !enemy.mesh.physicsImpostor.physicsBody) return;
        
        let enemyPos = enemy.mesh.getAbsolutePosition();
        let distanceToPlayerSqr = BABYLON.Vector3.DistanceSquared(playerPos, enemyPos);
        let detectionRangeSqr = 20 * 20;
        let attackRange = (enemy.canShoot ? enemy.shootRange : 1.6);
        let attackRangeSqr = attackRange * attackRange;
        
        if (distanceToPlayerSqr > detectionRangeSqr) enemy.state = 'idle';
        else if (distanceToPlayerSqr <= attackRangeSqr) enemy.state = 'attacking';
        else enemy.state = 'chasing';
        
        let currentVelocity = enemy.mesh.physicsImpostor.getLinearVelocity(); 
        if (!currentVelocity) return;
        
        let directionToPlayer = playerPos.subtract(enemyPos); 
        directionToPlayer.y = 0;
        
        if ((enemy.state === 'chasing' || enemy.state === 'attacking') && directionToPlayer.lengthSquared() > 0.01) {
            let directionNormalized = directionToPlayer.normalize(); 
            let targetAngle = Math.atan2(directionNormalized.x, directionNormalized.z);
            enemy.mesh.rotation.y = targetAngle;
        }
        
        if (enemy.state === 'chasing') {
            if (directionToPlayer.lengthSquared() > 0.01) {
                let directionNormalized = directionToPlayer.normalize(); 
                let targetVelocity = directionNormalized.scale(enemy.speed);
                enemy.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(targetVelocity.x, currentVelocity.y, targetVelocity.z));
            }
        } else if (enemy.state === 'attacking') {
           enemy.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, currentVelocity.y, 0));
            let attackCooldown = enemy.canShoot ? enemy.shootCooldown : 1500;
            
            if (gameTime > enemy.lastAttackTime + attackCooldown) {
                enemy.lastAttackTime = gameTime;
                
                if (enemy.canShoot) {
                    if (directionToPlayer.lengthSquared() > 0.01) {
                        let directionNormalized = directionToPlayer.normalize();
                        let projectileStartPos = enemyPos.add(new BABYLON.Vector3(0,1,0)).add(directionNormalized.scale(0.5));
                        createProjectile(projectileStartPos, directionNormalized, false, enemy.attack, enemy.type);
                    }
                } else { // Melee
                    if (BABYLON.Vector3.DistanceSquared(playerPos, enemyPos) < (attackRange + 0.5) * (attackRange + 0.5)) {
                        damagePlayer(enemy.attack);
                        if (player.mesh && player.mesh.physicsImpostor) {
                            let knockbackDir = playerPos.subtract(enemyPos);
                            if(knockbackDir.lengthSquared() > 0.001) { 
                                knockbackDir.normalize(); 
                                player.mesh.physicsImpostor.applyImpulse(knockbackDir.scale(30), playerPos); 
                            }
                        }
                    }
                }
            }
        } else { // Idle
            let dampingFactor = 0.85;
            enemy.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(currentVelocity.x * dampingFactor, currentVelocity.y, currentVelocity.z * dampingFactor));
        }
        
        updateEnemyHealthBar(enemy);
    });
}

// Damage an enemy
function damageEnemy(enemy, amount) {
    if (!enemy || !enemy.mesh || enemy.mesh.isDisposed() || enemy.isInvulnerable || enemy.health <= 0 || !enemy.mesh.isEnabled() || enemy.markedForDeath) return;
    
    let damageAmount = Math.max(1, Math.round(amount)); 
    enemy.health -= damageAmount;
    
    if (sounds.hit_enemy && sounds.hit_enemy.state() === 'loaded') sounds.hit_enemy.play();
    updateEnemyHealthBar(enemy);
    
    if (enemy.mesh.material) {
        let originalEmissive = enemy.mesh.material.emissiveColor?.clone() || new BABYLON.Color3(0,0,0);
        enemy.mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        activeTimeouts.push(setTimeout(() => { 
            if (enemy.mesh && !enemy.mesh.isDisposed() && enemy.mesh.material) 
                enemy.mesh.material.emissiveColor = originalEmissive; 
        }, 100));
    }
    
    if (enemy.health <= 0) { 
        if (!enemy.markedForDeath) { 
            enemy.markedForDeath = true; 
            enemyDeath(enemy); 
        } 
    } else { 
        if (enemy.state === 'idle') enemy.state = 'chasing'; 
    }
}

// Handle enemy death sequence
function enemyDeath(enemy) {
    if (!enemy || !enemy.mesh || enemy.mesh.isDisposed() || !enemy.mesh.isEnabled()) {
        if(enemy) enemyHealthBars.delete(enemy.id);
        return;
    }
    
    enemy.mesh.setEnabled(false); 
    enemy.mesh.checkCollisions = false;
    
    if (sounds.death_enemy && sounds.death_enemy.state() === 'loaded') sounds.death_enemy.play();
    
    if(player) { 
        player.score += enemy.score; 
        score = player.score; 
        updatePlayerStats(); 
    }
    
    if (Math.random() < 0.20) { 
        let dropRand = Math.random(); 
        let dropType = (dropRand < 0.50) ? 'FOOD' : (dropRand < 0.75) ? 'TREASURE' : (dropRand < 0.90) ? 'POTION' : 'KEY'; 
        createRandomItem(enemy.mesh.position.x, enemy.mesh.position.z); 
    }
    
    if (enemy.healthBar && !enemy.healthBar.isDisposed) { 
        if(advancedTextureGUI) advancedTextureGUI.removeControl(enemy.healthBar); 
        enemy.healthBar.dispose(); 
        enemy.healthBar = null; 
    }
    
    enemyHealthBars.delete(enemy.id);
    
    if (enemy.mesh.physicsImpostor) { 
        enemy.mesh.physicsImpostor.dispose(); 
        enemy.mesh.physicsImpostor = null; 
    }
    
    // Death animation (no texture needed for particles)
    let deathAnimDuration = 15;
    let scaleAnim = new BABYLON.Animation("deathScale", "scaling", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); 
    scaleAnim.setKeys([
        { frame: 0, value: enemy.mesh.scaling.clone() }, 
        { frame: deathAnimDuration, value: BABYLON.Vector3.Zero()}
    ]);
    
    let fadeAnim = new BABYLON.Animation("deathFade", "material.alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); 
    let startAlpha = (enemy.mesh.material && enemy.mesh.material.alpha !== undefined) ? enemy.mesh.material.alpha : 1.0; 
    fadeAnim.setKeys([
        { frame: 0, value: startAlpha }, 
        { frame: deathAnimDuration, value: 0 }
    ]);
    
    scene.beginDirectAnimation(enemy.mesh, [scaleAnim, fadeAnim], 0, deathAnimDuration, false, 1, () => {
        let enemyId = enemy.id;
        try {
            if (enemy.mesh && !enemy.mesh.isDisposed()) { 
                if (enemy.mesh.physicsImpostor) {
                    enemy.mesh.physicsImpostor.dispose();
                }
                enemy.mesh.dispose(); 
                enemy.mesh = null; 
            }
            let index = enemies.findIndex(e => e && e.id === enemyId); 
            if (index !== -1) enemies.splice(index, 1);
        } catch(e) {
            console.error("Error in enemyDeath animation completion:", e);
        }
    });
}

// Create an enemy generator
function createGenerator(x, z) {
    let genMesh = BABYLON.MeshBuilder.CreateCylinder("generator_" + x + "_" + z, {diameter: 1.5, height: 1.5, tessellation: 12}, scene);
    genMesh.position = new BABYLON.Vector3(x, 0.75, z);
    
    let genMaterial = new BABYLON.StandardMaterial("genMat_" + x + "_" + z, scene);
    genMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.1, 0.7); 
    genMaterial.emissiveColor = new BABYLON.Color3(0.4, 0, 0.4);
    genMaterial.specularColor = new BABYLON.Color3(0.2, 0, 0.2);
    genMesh.material = genMaterial;
    genMesh.checkCollisions = true;
    
    if (scene.isPhysicsEnabled) {
        genMesh.physicsImpostor = new BABYLON.PhysicsImpostor(genMesh, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.5, restitution: 0.3 }, scene);
    }
    
    let health = 150 + currentLevel * 30;
    let generator = { 
        mesh: genMesh, 
        x: x, 
        z: z, 
        health: health, 
        maxHealth: health, 
        lastSpawnTime: gameTime, 
        spawnRate: Math.max(3000, 8000 - currentLevel * 500), 
        isDestroyed: false, 
        id: "gen_" + BABYLON.Tools.RandomId() 
    };
    
    generators.push(generator);
    createGeneratorHealthBar(generator);
}

// Create GUI health bar for a generator
function createGeneratorHealthBar(generator) {
    if (!advancedTextureGUI) { 
        console.error("Cannot create generator health bar, advancedTextureGUI is not initialized."); 
        return; 
    }
    
    let healthBar = new BABYLON.GUI.Rectangle(generator.id + "_bar");
    healthBar.width = "60px"; 
    healthBar.height = "6px"; 
    healthBar.cornerRadius = 3; 
    healthBar.color = "#111"; 
    healthBar.thickness = 1; 
    healthBar.background = "#333";
    healthBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    let healthFill = new BABYLON.GUI.Rectangle(generator.id + "_fill");
    healthFill.width = 1.0; 
    healthFill.height = 1.0; 
    healthFill.cornerRadius = 3; 
    healthFill.color = "transparent"; 
    healthFill.background = "#ff00ff";
    healthFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    
    healthBar.addControl(healthFill);
    advancedTextureGUI.addControl(healthBar);
    healthBar.linkWithMesh(generator.mesh);
    
    let meshHeight = 1.5;
    healthBar.linkOffsetY = -(meshHeight * 10 + 10);
    
    generator.healthBar = healthBar; 
    generator.healthBarFill = healthFill;
    generatorHealthBars.set(generator.id, generator);
    healthBar.isVisible = false;
}

// Update generator health bar display
function updateGeneratorHealthBar(generator) {
    if (generator && generator.healthBar && !generator.healthBar.isDisposed && generator.healthBarFill) {
        let healthPercent = Math.max(0, generator.health / generator.maxHealth);
        generator.healthBarFill.width = healthPercent;
        generator.healthBar.isVisible = (healthPercent > 0 && healthPercent < 1);
    }
}

// Update enemy generators
function updateGenerators(deltaTime) {
    generators.forEach((gen, index) => {
        if (!gen || gen.isDestroyed || !gen.mesh || gen.mesh.isDisposed() || !gen.mesh.isEnabled()) return;
        
        if (gameTime > gen.lastSpawnTime + gen.spawnRate) {
            gen.lastSpawnTime = gameTime;
            
            if (!player || !player.mesh || player.mesh.isDisposed()) return;
            
            let genPos = gen.mesh.getAbsolutePosition(); 
            let playerPos = player.mesh.getAbsolutePosition();
            let distanceToPlayerSqr = BABYLON.Vector3.DistanceSquared(playerPos, genPos); 
            let minSpawnDistSqr = 4 * 4;
            let maxEnemies = 20 + currentLevel * 2;
            
            if (enemies.length < maxEnemies && distanceToPlayerSqr > minSpawnDistSqr) {
                let validSpawnFound = false; 
                let spawnPos = new BABYLON.Vector3.Zero();
                
                for (let tryCount = 0; tryCount < 5 && !validSpawnFound; tryCount++) {
                    let offsetX = (Math.random() - 0.5) * TILE_SIZE * 1.8; 
                    let offsetZ = (Math.random() - 0.5) * TILE_SIZE * 1.8;
                    let spawnX = genPos.x + offsetX; 
                    let spawnZ = genPos.z + offsetZ;
                    let gridX = Math.floor((spawnX / TILE_SIZE) + MAP_WIDTH / 2); 
                    let gridY = Math.floor((spawnZ / TILE_SIZE) + MAP_HEIGHT / 2);
                    
                    if (gridX >= 1 && gridX < MAP_WIDTH - 1 && gridY >= 1 && gridY < MAP_HEIGHT - 1 && dungeon[gridY][gridX] === 0) {
                        spawnPos.set(spawnX, 1.0, spawnZ); 
                        validSpawnFound = true;
                    }
                }
                
                if (validSpawnFound) {
                    createRandomEnemy(spawnPos.x, spawnPos.z);
                    // Spawn particle effect (no texture)
                    let spawnEffect = new BABYLON.ParticleSystem("spawnParticles", 300, scene);
                    // spawnEffect.particleTexture = ...; // REMOVED
                    spawnEffect.emitter = genPos.add(new BABYLON.Vector3(0, 0.5, 0));
                    spawnEffect.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5); 
                    spawnEffect.maxEmitBox = new BABYLON.Vector3(0.5, 1, 0.5);
                    spawnEffect.color1 = new BABYLON.Color4(0.8, 0.2, 0.8, 1.0); 
                    spawnEffect.color2 = new BABYLON.Color4(1, 0.5, 1, 1.0); 
                    spawnEffect.colorDead = new BABYLON.Color4(0.5, 0, 0.5, 0.0);
                    spawnEffect.minSize = 0.2; 
                    spawnEffect.maxSize = 0.5; 
                    spawnEffect.minLifeTime = 0.4; 
                    spawnEffect.maxLifeTime = 1.0;
                    spawnEffect.emitRate = 400; 
                    spawnEffect.manualEmitCount = 150; 
                    spawnEffect.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                    spawnEffect.gravity = new BABYLON.Vector3(0, 3.0, 0); 
                    spawnEffect.minEmitPower = 1; 
                    spawnEffect.maxEmitPower = 4; 
                    spawnEffect.updateSpeed = 0.01;
                    spawnEffect.start();
                    activeTimeouts.push(setTimeout(() => { 
                        if (spawnEffect) spawnEffect.dispose(); 
                    }, (spawnEffect.maxLifeTime * 1000) + 200));
                }
            }
        }
        
        updateGeneratorHealthBar(gen);
    });
}

// Damage a generator
function damageGenerator(gen, amount) {
    if (!gen || gen.isDestroyed || gen.health <= 0 || !gen.mesh || gen.mesh.isDisposed() || !gen.mesh.isEnabled()) return;
    
    let damageAmount = Math.max(1, Math.round(amount)); 
    gen.health -= damageAmount;
    
    if (sounds.hit_enemy && sounds.hit_enemy.state() === 'loaded') sounds.hit_enemy.play();
    updateGeneratorHealthBar(gen);
    
    if (gen.mesh.material) {
        let originalEmissive = gen.mesh.material.emissiveColor?.clone() || new BABYLON.Color3(0,0,0);
        gen.mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        activeTimeouts.push(setTimeout(() => { 
            if (gen.mesh && !gen.mesh.isDisposed() && gen.mesh.material) 
                gen.mesh.material.emissiveColor = originalEmissive; 
        }, 100));
    }
    
    if (gen.health <= 0) { 
        if (!gen.isDestroyed) { 
            generatorDestroyed(gen); 
        } 
    }
}

// Handle generator destruction sequence
function generatorDestroyed(gen) {
    if (!gen || !gen.mesh || gen.isDestroyed || gen.mesh.isDisposed() || !gen.mesh.isEnabled()) {
        if(gen) generatorHealthBars.delete(gen.id);
        return;
    }
    
    gen.isDestroyed = true; 
    gen.mesh.setEnabled(false); 
    gen.mesh.checkCollisions = false;
    
    showMessage("Generator destroyed!", 2000);
    
    if(player) { 
        player.score += 50; 
        score = player.score; 
        updatePlayerStats(); 
    }
    
    if (sounds.death_enemy && sounds.death_enemy.state() === 'loaded') sounds.death_enemy.play();
    
    if (gen.healthBar && !gen.healthBar.isDisposed) { 
        if(advancedTextureGUI) advancedTextureGUI.removeControl(gen.healthBar); 
        gen.healthBar.dispose(); 
        gen.healthBar = null; 
    }
    
    generatorHealthBars.delete(gen.id);
    
    // Destruction effect (no texture needed for particles)
    let particleSystem = new BABYLON.ParticleSystem("genDestroyParticles", 1000, scene);
    // particleSystem.particleTexture = ...; // REMOVED
    particleSystem.emitter = gen.mesh.position.clone();
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5); 
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 1, 0.5);
    particleSystem.color1 = new BABYLON.Color4(1, 0.2, 1, 1.0); 
    particleSystem.color2 = new BABYLON.Color4(1, 0.8, 1, 1.0); 
    particleSystem.colorDead = new BABYLON.Color4(0.5, 0, 0.5, 0.0);
    particleSystem.minSize = 0.2; 
    particleSystem.maxSize = 0.7; 
    particleSystem.minLifeTime = 0.5; 
    particleSystem.maxLifeTime = 1.5;
    particleSystem.emitRate = 1000; 
    particleSystem.manualEmitCount = 500; 
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, -6.0, 0); 
    particleSystem.direction1 = new BABYLON.Vector3(-1, 0.5, -1); 
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    particleSystem.minEmitPower = 3; 
    particleSystem.maxEmitPower = 8; 
    particleSystem.updateSpeed = 0.01;
    particleSystem.start();
    activeTimeouts.push(setTimeout(() => { 
        if (particleSystem) particleSystem.dispose(); 
    }, 2000));
    
    if (gen.mesh.physicsImpostor) { 
        gen.mesh.physicsImpostor.dispose(); 
        gen.mesh.physicsImpostor = null; 
    }
    
    activeTimeouts.push(setTimeout(() => {
        let genId = gen.id;
        if (gen.mesh && !gen.mesh.isDisposed()) { 
            gen.mesh.dispose(); 
            gen.mesh = null; 
        }
        let index = generators.findIndex(g => g && g.id === genId); 
        if (index !== -1) generators.splice(index, 1);
    }, 100));
}