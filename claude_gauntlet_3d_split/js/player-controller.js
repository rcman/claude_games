// Create player character
function createPlayer() {
    if (!playerClassInfo) { 
        console.error("Player class not selected! Cannot create player."); 
        return; 
    }
    
    if (!player || player.startX === undefined || player.startY === undefined) { 
        console.error("Player start position not defined!"); 
        player = { startX: Math.floor(MAP_WIDTH/2), startY: Math.floor(MAP_HEIGHT/2) }; 
    }
    
    let worldX = (player.startX - MAP_WIDTH / 2 + 0.5) * TILE_SIZE;
    let worldZ = (player.startY - MAP_HEIGHT / 2 + 0.5) * TILE_SIZE;
    
    // Use sphere instead of capsule for better physics compatibility
    let playerMesh = BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1.0 }, scene);
    playerMesh.position = new BABYLON.Vector3(worldX, 1.0, worldZ);
    
    let playerMaterial = new BABYLON.StandardMaterial("playerMat", scene);
    playerMaterial.diffuseColor = playerClassInfo.color;
    playerMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    playerMesh.material = playerMaterial;
    playerMesh.checkCollisions = true;
    
    if (scene.isPhysicsEnabled) {
        playerMesh.physicsImpostor = new BABYLON.PhysicsImpostor(playerMesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 70, friction: 0.5, restitution: 0.1 }, scene);
        
        if (playerMesh.physicsImpostor.physicsBody) {
            playerMesh.physicsImpostor.physicsBody.angularDamping = 0.999;
            playerMesh.physicsImpostor.physicsBody.fixedRotation = true;
            playerMesh.physicsImpostor.physicsBody.updateMassProperties();
        } else { 
            console.warn("Player physics body not created immediately."); 
        }
    }
    
    let startingHealth = playerClassInfo.health; 
    let currentScore = 0; 
    let currentKeys = 0; 
    let currentPotions = 3;
    
    if (player) {
        startingHealth = player.health !== undefined ? player.health : playerClassInfo.health;
        currentScore = player.score || 0; 
        currentKeys = player.keys || 0; 
        currentPotions = player.potions !== undefined ? player.potions : 3;
    }
    
    player = { 
        mesh: playerMesh, 
        type: playerClassInfo.name, 
        health: startingHealth, 
        maxHealth: playerClassInfo.health, 
        attack: playerClassInfo.attack, 
        magic: playerClassInfo.magic, 
        speed: playerClassInfo.speed, 
        special: playerClassInfo.special, 
        keys: currentKeys, 
        potions: currentPotions, 
        score: currentScore, 
        lastShotTime: 0, 
        lastSpecialTime: 0, 
        invulnerableUntil: 0, 
        shotCooldown: playerClassInfo.shotCooldown, 
        specialCooldown: playerClassInfo.specialCooldown 
    };
    
    score = player.score; 
    keys = player.keys; 
    potions = player.potions;
    
    let playerLight = new BABYLON.PointLight("playerLight", new BABYLON.Vector3(0, 1.5, 0), scene);
    playerLight.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);
    playerLight.specular = new BABYLON.Color3(0.5, 0.5, 0.7);
    playerLight.intensity = 0.5;
    playerLight.range = 10;
    playerLight.parent = playerMesh;
}

// Setup player camera
function setupPlayerCamera() {
    if (!player || !player.mesh || player.mesh.isDisposed()) { 
        console.error("Cannot setup camera, player mesh not found."); 
        return; 
    }
    
    if (camera) camera.detachControl(canvas);
    
    if (!camera) {
        camera = new BABYLON.FollowCamera("playerCamera", player.mesh.position.add(new BABYLON.Vector3(0, 5, -7)), scene);
    } else {
        camera.lockedTarget = player.mesh;
    }
    
    camera.radius = 12;
    camera.heightOffset = 8;
    camera.rotationOffset = 0;
    camera.cameraAcceleration = 0.08;
    camera.maxCameraSpeed = 15;
    camera.attachControl(canvas, true);
    camera.lockedTarget = player.mesh;
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 25;
    camera.lowerHeightOffsetLimit = 4;
    camera.upperHeightOffsetLimit = 15;
    camera.checkCollisions = true;
    camera.collisionRadius = new BABYLON.Vector3(0.8, 0.8, 0.8);
}

// Handle player input
function handlePlayerInput(deltaTime) {
    if (!player || !player.mesh || player.mesh.isDisposed() || !player.mesh.physicsImpostor || player.health <= 0) return;
    
    let currentVelocity = player.mesh.physicsImpostor.getLinearVelocity(); 
    if (!currentVelocity) return;
    
    let camForward = camera.getDirection(BABYLON.Axis.Z); 
    camForward.y = 0; 
    camForward.normalize();
    
    let camRight = camera.getDirection(BABYLON.Axis.X); 
    camRight.y = 0; 
    camRight.normalize();
    
    let moveDirection = BABYLON.Vector3.Zero();
    
    if (inputMap['w'] || inputMap['arrowup']) moveDirection.addInPlace(camForward);
    if (inputMap['s'] || inputMap['arrowdown']) moveDirection.subtractInPlace(camForward);
    if (inputMap['a'] || inputMap['arrowleft']) moveDirection.subtractInPlace(camRight);
    if (inputMap['d'] || inputMap['arrowright']) moveDirection.addInPlace(camRight);
    
    if (moveDirection.lengthSquared() > 0.001) {
        moveDirection.normalize();
        let targetVelocity = moveDirection.scale(player.speed);
        player.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(targetVelocity.x, currentVelocity.y, targetVelocity.z));
    } else {
        let dampingFactor = 0.85;
        player.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(currentVelocity.x * dampingFactor, currentVelocity.y, currentVelocity.z * dampingFactor));
    }
    
    let pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name === "ground");
    if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
        let targetPoint = pickInfo.pickedPoint; 
        let direction = targetPoint.subtract(player.mesh.getAbsolutePosition()); 
        direction.y = 0;
        if (direction.lengthSquared() > 0.01) { 
            let targetAngle = Math.atan2(direction.x, direction.z); 
            player.mesh.rotation.y = targetAngle; 
        }
    }
    
    if (inputMap[' '] && gameTime > player.lastShotTime + player.shotCooldown) playerAttack();
    if (inputMap['f'] && gameTime > player.lastSpecialTime + player.specialCooldown) playerSpecialAttack();
    if (inputMap['e']) { usePotion(); inputMap['e'] = false; }
}

// Player normal attack
function playerAttack() {
    if (!player || !player.mesh || player.mesh.isDisposed() || player.health <= 0) return;
    player.lastShotTime = gameTime;
    let forward = player.mesh.forward.scale(-1); // Assumed player facing

    if (player.type === 'Warrior') {
        if (sounds.attack_melee && sounds.attack_melee.state() === 'loaded') sounds.attack_melee.play();
        let attackRange = 1.8; 
        let attackArcDegrees = 120; 
        let attackArcRadians = BABYLON.Tools.ToRadians(attackArcDegrees / 2); 
        let playerPos = player.mesh.getAbsolutePosition();
        let hitSomething = false;
        
        enemies.forEach(enemy => {
            if (enemy && enemy.mesh && !enemy.mesh.isDisposed() && enemy.health > 0 && enemy.mesh.isEnabled()) {
                let enemyPos = enemy.mesh.getAbsolutePosition(); 
                let vecToEnemy = enemyPos.subtract(playerPos); 
                let distSqr = vecToEnemy.lengthSquared();
                
                if (distSqr < attackRange * attackRange) {
                    vecToEnemy.y = 0; 
                    if (vecToEnemy.lengthSquared() < 0.001) return; 
                    vecToEnemy.normalize();
                    
                    let forwardHorizontal = forward.clone(); 
                    forwardHorizontal.y = 0; 
                    forwardHorizontal.normalize();
                    
                    let dotProduct = BABYLON.Vector3.Dot(forwardHorizontal, vecToEnemy);
                    if (dotProduct > Math.cos(attackArcRadians)) {
                        damageEnemy(enemy, player.attack); 
                        hitSomething = true;
                      if(enemy.mesh.physicsImpostor) { 
                            enemy.mesh.physicsImpostor.applyImpulse(vecToEnemy.scale(50), enemyPos); 
                        }
                    }
                }
            }
        });
         
        generators.forEach(gen => {
            if (gen && !gen.isDestroyed && gen.mesh && !gen.mesh.isDisposed() && gen.mesh.isEnabled()) {
                let genPos = gen.mesh.getAbsolutePosition(); 
                let vecToGen = genPos.subtract(playerPos); 
                let distSqr = vecToGen.lengthSquared();
                
                if (distSqr < attackRange * attackRange) {
                    vecToGen.y = 0; 
                    if (vecToGen.lengthSquared() < 0.001) return; 
                    vecToGen.normalize();
                    
                    let forwardHorizontal = forward.clone(); 
                    forwardHorizontal.y = 0; 
                    forwardHorizontal.normalize();
                    
                    let dotProduct = BABYLON.Vector3.Dot(forwardHorizontal, vecToGen);
                    if (dotProduct > Math.cos(attackArcRadians)) { 
                        damageGenerator(gen, player.attack); 
                        hitSomething = true; 
                    }
                }
            }
        });
        
        if (hitSomething) { // Simple visual effect (no texture needed)
            let slash = BABYLON.MeshBuilder.CreateTorus("slash", {diameter: attackRange * 1.2, thickness: 0.1, tessellation: 16}, scene);
            slash.position = playerPos.add(forward.scale(attackRange * 0.5)).add(new BABYLON.Vector3(0, 1.0, 0));
            slash.rotation.x = Math.PI / 2; 
            slash.rotation.y = player.mesh.rotation.y; 
            slash.isPickable = false;
            
            let slashMat = new BABYLON.StandardMaterial("slashMat", scene);
            slashMat.diffuseColor = new BABYLON.Color3(1, 1, 0.8); 
            slashMat.emissiveColor = new BABYLON.Color3(1, 1, 0.5); 
            slashMat.alpha = 0.8; 
            slashMat.disableLighting = true;
            slash.material = slashMat;
            
            let fadeAnim = new BABYLON.Animation("fade", "material.alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            fadeAnim.setKeys([{ frame: 0, value: 0.8 }, { frame: 6, value: 0 }]);
            
            let scaleAnim = new BABYLON.Animation("scale", "scaling.x", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            scaleAnim.setKeys([{ frame: 0, value: 0.5 }, { frame: 4, value: 1.2 }]);
            
            let scaleAnimZ = new BABYLON.Animation("scaleZ", "scaling.z", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            scaleAnimZ.setKeys([{ frame: 0, value: 0.5 }, { frame: 4, value: 1.2 }]);
            
            scene.beginDirectAnimation(slash, [fadeAnim, scaleAnim, scaleAnimZ], 0, 6, false, 1, () => { 
                if (slash && !slash.isDisposed()) slash.dispose(); 
            });
        }
    } else { // Ranged Attack
        if (sounds.attack_ranged && sounds.attack_ranged.state() === 'loaded') sounds.attack_ranged.play();
        let projectileStartPos = player.mesh.getAbsolutePosition().add(new BABYLON.Vector3(0, 1.0, 0)).add(forward.scale(0.6));
        let damage = player.attack;
        
        if (player.type === 'Wizard') damage = player.magic * 1.2;
        else if (player.type === 'Elf') damage = player.attack * 0.8 + player.magic * 0.4;
        else if (player.type === 'Valkyrie') damage = player.attack * 1.1 + player.magic * 0.2;
        
        createProjectile(projectileStartPos, forward, true, damage, player.type);
    }
}

// Player special attack
function playerSpecialAttack() {
    if (!player || !player.mesh || player.mesh.isDisposed() || player.health <= 0) return;
    player.lastSpecialTime = gameTime; 
    showMessage(`${player.special}!`, 2000); 
    updatePlayerStats();

    if (player.type === 'Warrior') {
        if (sounds.special_warrior && sounds.special_warrior.state() === 'loaded') sounds.special_warrior.play();
        let range = 4.0; 
        let rangeSqr = range * range; 
        let damage = player.attack * 2.0; 
        let playerPos = player.mesh.getAbsolutePosition();
        
        let whirl = BABYLON.MeshBuilder.CreateTorus("whirl", {diameter: 0.2, thickness: 0.3, tessellation: 32}, scene);
        whirl.position = playerPos.add(new BABYLON.Vector3(0, 0.5, 0));
        
        let mat = new BABYLON.StandardMaterial("whirlMat", scene); 
        mat.diffuseColor = new BABYLON.Color3(1, 0.4, 0.4); 
        mat.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.2); 
        mat.alpha = 0.7; 
        mat.disableLighting = true;
        whirl.material = mat; 
        whirl.rotation.x = Math.PI / 2; 
        whirl.isPickable = false;
        
        enemies.forEach(enemy => { 
            if (enemy && enemy.mesh && !enemy.mesh.isDisposed() && enemy.health > 0 && enemy.mesh.isEnabled()) { 
                let enemyPos = enemy.mesh.getAbsolutePosition(); 
                if (BABYLON.Vector3.DistanceSquared(playerPos, enemyPos) < rangeSqr) { 
                    damageEnemy(enemy, damage); 
                    if (enemy.mesh.physicsImpostor) { 
                        let knockbackDir = enemyPos.subtract(playerPos).normalize(); 
                        enemy.mesh.physicsImpostor.applyImpulse(knockbackDir.scale(150), enemyPos); 
                    } 
                } 
            } 
        });
        
        generators.forEach(gen => { 
            if (gen && !gen.isDestroyed && gen.mesh && !gen.mesh.isDisposed() && gen.mesh.isEnabled()) { 
                let genPos = gen.mesh.getAbsolutePosition(); 
                if (BABYLON.Vector3.DistanceSquared(playerPos, genPos) < rangeSqr) { 
                    damageGenerator(gen, damage); 
                } 
            } 
        });
        
        let scaleAnim = new BABYLON.Animation("whirlScale", "scaling", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); 
        scaleAnim.setKeys([
            { frame: 0, value: new BABYLON.Vector3(0.1, 0.1, 0.1)}, 
            { frame: 15, value: new BABYLON.Vector3(range * 2, range * 2, 1)}
        ]);
        
        let fadeAnim = new BABYLON.Animation("whirlFade", "material.alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); 
        fadeAnim.setKeys([
            { frame: 5, value: 0.7 }, 
            { frame: 20, value: 0 }
        ]);
        
        scene.beginDirectAnimation(whirl, [scaleAnim, fadeAnim], 0, 20, false, 1, () => { 
            if (whirl && !whirl.isDisposed()) whirl.dispose(); 
        });

    } else if (player.type === 'Valkyrie') {
        if (sounds.special_valkyrie && sounds.special_valkyrie.state() === 'loaded') sounds.special_valkyrie.play();
        let dashForce = player.speed * 150; 
        let dashDuration = 300; 
        let damage = player.attack * 1.5; 
        let forward = player.mesh.forward.scale(-1);
        
        if (player.mesh.physicsImpostor) player.mesh.physicsImpostor.applyImpulse(forward.scale(dashForce), player.mesh.getAbsolutePosition());
        player.invulnerableUntil = gameTime + dashDuration + 100;
        
        let checkInterval = 50; 
        let checksDone = 0; 
        let maxChecks = Math.floor(dashDuration / checkInterval); 
        let hitEnemy = null;
        
        let intervalId = activeIntervals.push(setInterval(() => {
            if (gameState !== GAME_STATES.PLAYING || !player || !player.mesh || player.mesh.isDisposed() || checksDone >= maxChecks || hitEnemy) { 
                clearInterval(intervalId); 
                return; 
            }
            
            checksDone++; 
            let checkRange = 2.0; 
            let playerPos = player.mesh.getAbsolutePosition(); 
            let checkPos = playerPos.add(forward.scale(checkRange * 0.5));
            
            enemies.forEach(enemy => { 
                if (!hitEnemy && enemy && enemy.mesh && !enemy.mesh.isDisposed() && enemy.health > 0 && enemy.mesh.isEnabled()) { 
                    let enemyPos = enemy.mesh.getAbsolutePosition(); 
                    if (BABYLON.Vector3.DistanceSquared(checkPos, enemyPos) < (checkRange * checkRange)) { 
                        let dirToEnemy = enemyPos.subtract(playerPos); 
                        if(dirToEnemy.lengthSquared() < 0.001) return; 
                        dirToEnemy.normalize(); 
                        if (BABYLON.Vector3.Dot(forward, dirToEnemy) > 0.7) { 
                            damageEnemy(enemy, damage); 
                            if (enemy.mesh.physicsImpostor) enemy.mesh.physicsImpostor.applyImpulse(dirToEnemy.scale(250), enemyPos); 
                            hitEnemy = enemy; 
                        } 
                    } 
                } 
            });
        }, checkInterval));

    } else if (player.type === 'Wizard') {
        if (sounds.special_wizard && sounds.special_wizard.state() === 'loaded') sounds.special_wizard.play();
        let range = 5.0; 
        let rangeSqr = range * range; 
        let damage = player.magic * 2.5; 
        let playerPos = player.mesh.getAbsolutePosition();
        
        let nova = BABYLON.MeshBuilder.CreateSphere("nova", {diameter: 0.2, segments: 16}, scene); 
        nova.position = playerPos.add(new BABYLON.Vector3(0, 1.0, 0));
        
        let mat = new BABYLON.StandardMaterial("novaMat", scene); 
        mat.diffuseColor = playerClassInfo.color.scale(0.8); 
        mat.emissiveColor = playerClassInfo.color; 
        mat.alpha = 0.8; 
        mat.disableLighting = true; 
        nova.material = mat; 
        nova.isPickable = false;
        
        enemies.forEach(enemy => { 
            if (enemy && enemy.mesh && !enemy.mesh.isDisposed() && enemy.health > 0 && enemy.mesh.isEnabled()) { 
                let enemyPos = enemy.mesh.getAbsolutePosition(); 
                if (BABYLON.Vector3.DistanceSquared(playerPos, enemyPos) < rangeSqr) 
                    damageEnemy(enemy, damage); 
            } 
        });
        
        generators.forEach(gen => { 
            if (gen && !gen.isDestroyed && gen.mesh && !gen.mesh.isDisposed() && gen.mesh.isEnabled()) { 
                let genPos = gen.mesh.getAbsolutePosition(); 
                if (BABYLON.Vector3.DistanceSquared(playerPos, genPos) < rangeSqr) 
                    damageGenerator(gen, damage); 
            } 
        });
        
        let novaDiameter = range * 2; 
        let scaleFactor = novaDiameter / 0.2;
        
        let scaleAnim = new BABYLON.Animation("novaScale", "scaling", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); 
        scaleAnim.setKeys([
            { frame: 0, value: new BABYLON.Vector3(1, 1, 1)}, 
            { frame: 20, value: new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor)}
        ]);
        
        let fadeAnim = new BABYLON.Animation("novaFade", "material.alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); 
        fadeAnim.setKeys([
            { frame: 5, value: 0.8 }, 
            { frame: 25, value: 0 }
        ]);
        
        scene.beginDirectAnimation(nova, [scaleAnim, fadeAnim], 0, 25, false, 1, () => { 
            if (nova && !nova.isDisposed()) nova.dispose(); 
        });

    } else if (player.type === 'Elf') {
        if (sounds.special_elf && sounds.special_elf.state() === 'loaded') sounds.special_elf.play();
        let numShots = 5; 
        let shotDelay = 80; 
        let damagePerShot = (player.attack + player.magic * 0.5) * 0.7; 
        let spreadAngle = 5;
        let baseForward = player.mesh.forward.scale(-1);
        
        for (let i = 0; i < numShots; i++) {
            let timeoutId = activeTimeouts.push(setTimeout(() => {
                if (gameState === GAME_STATES.PLAYING && player && player.mesh && !player.mesh.isDisposed() && player.health > 0) {
                    let angleOffset = BABYLON.Tools.ToRadians((Math.random() - 0.5) * spreadAngle);
                    let finalDirection = baseForward.clone();
                    let rotationQuaternion = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, angleOffset);
                    finalDirection.rotateByQuaternionToRef(rotationQuaternion, finalDirection);
                    let projectileStartPos = player.mesh.getAbsolutePosition().add(new BABYLON.Vector3(0, 1.0, 0)).add(finalDirection.scale(0.6));
                    createProjectile(projectileStartPos, finalDirection, true, damagePerShot, player.type);
                    if (sounds.attack_ranged && sounds.attack_ranged.state() === 'loaded') sounds.attack_ranged.play();
                }
            }, i * shotDelay));
        }
        
        player.lastShotTime = gameTime + numShots * shotDelay;
    }
}

// Use a health potion
function usePotion() {
    if (!player || player.health <= 0) return;
    if (player.potions > 0 && player.health < player.maxHealth) {
        if (sounds.potion_use && sounds.potion_use.state() === 'loaded') sounds.potion_use.play();
        player.potions--; 
        potions = player.potions;
        let healAmount = player.maxHealth * 0.5; 
        let healthBefore = player.health;
        player.health = Math.min(player.maxHealth, player.health + healAmount);
        let healedAmount = Math.round(player.health - healthBefore);
        showMessage(`Used a potion! +${healedAmount} Health`, 2000); 
        updatePlayerStats();
        
        if (player.mesh && !player.mesh.isDisposed()) { // Particle effect (no texture)
            let particleSystem = new BABYLON.ParticleSystem("potionParticles", 500, scene);
            // particleSystem.particleTexture = ...; // REMOVED
            particleSystem.emitter = player.mesh;
            particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, 0, -0.3); 
            particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 1.5, 0.3);
            particleSystem.color1 = new BABYLON.Color4(0.2, 1, 0.2, 1.0); 
            particleSystem.color2 = new BABYLON.Color4(0.5, 1, 0.5, 0.8); 
            particleSystem.colorDead = new BABYLON.Color4(0, 0.5, 0, 0.0);
            particleSystem.minSize = 0.1; 
            particleSystem.maxSize = 0.3; 
            particleSystem.minLifeTime = 0.4; 
            particleSystem.maxLifeTime = 0.9;
            particleSystem.emitRate = 400; 
            particleSystem.manualEmitCount = 200; 
            particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            particleSystem.gravity = new BABYLON.Vector3(0, 2.0, 0); 
            particleSystem.minEmitPower = 0.5; 
            particleSystem.maxEmitPower = 1.5; 
            particleSystem.updateSpeed = 0.01;
            particleSystem.start();
            activeTimeouts.push(setTimeout(() => { 
                if (particleSystem) particleSystem.dispose(); 
            }, (particleSystem.maxLifeTime * 1000) + 200));
        }
    } else if (player.potions <= 0) { 
        showMessage("No potions left!", 1500); 
    } else { 
        showMessage("Health is already full!", 1500); 
    }
}

// Damage the player
function damagePlayer(amount) {
    if (!player || player.health <= 0 || gameState !== GAME_STATES.PLAYING || gameTime < player.invulnerableUntil) return;
    let damageAmount = Math.max(1, Math.round(amount)); 
    player.health -= damageAmount;
    
    if (sounds.hit_player && sounds.hit_player.state() === 'loaded') sounds.hit_player.play();
    updatePlayerStats(); 
    player.invulnerableUntil = gameTime + 300;
    
    if (camera) {
        let redFlash = new BABYLON.ImageProcessingPostProcess("redFlash", 1.0, camera);
        redFlash.vignetteEnabled = true; 
        redFlash.vignetteWeight = 2.5; 
        redFlash.vignetteColor = new BABYLON.Color4(1, 0, 0, 0.3); 
        redFlash.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
        activeTimeouts.push(setTimeout(() => { 
            if (redFlash) redFlash.dispose(); 
        }, 150));
    }
    
    if (player.health <= 0) { 
        player.health = 0; 
        updatePlayerStats(); 
        gameOver(); 
    }
}