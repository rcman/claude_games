// Enemy systems
function spawnEnemies() {
    // Spawn enemies based on day/night cycle and position
    if (gameState.world.time > 0.5 && Math.random() < ENEMY_SPAWN_RATE) {
        // Spawn enemies at night with higher probability
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        
        const spawnX = camera.position.x + Math.cos(angle) * distance;
        const spawnZ = camera.position.z + Math.sin(angle) * distance;
        const spawnY = getTerrainHeight(spawnX, spawnZ);
        
        // Get biome to determine enemy type
        const biome = getBiomeAt(spawnX, spawnZ);
        let enemyType;
        
        if (activeEvent) {
            // Use event enemy types during events
            enemyType = activeEvent.enemyTypes[
                Math.floor(Math.random() * activeEvent.enemyTypes.length)
            ];
        } else {
            // Use biome enemy types normally
            enemyType = biome.enemies[
                Math.floor(Math.random() * biome.enemies.length)
            ];
        }
        
        const enemy = createEnemy(
            new THREE.Vector3(spawnX, spawnY, spawnZ),
            enemyType
        );
        
        scene.add(enemy);
        gameState.world.entities.push(enemy);
    }
}

function createEnemy(position, enemyType = 'greyling') {
    const enemy = new THREE.Group();
    enemy.position.copy(position);
    
    let color, scale, health, damage, speed;
    
    // Enemy properties based on type
    switch (enemyType) {
        case 'greyling':
            color = 0x333333;
            scale = 1;
            health = 100;
            damage = 10;
            speed = 2;
            break;
        case 'greydwarf':
            color = 0x445544;
            scale = 1.2;
            health = 150;
            damage = 15;
            speed = 1.8;
            break;
        case 'troll':
            color = 0x0000AA;
            scale = 2.5;
            health = 500;
            damage = 40;
            speed = 1.5;
            break;
        case 'draugr':
            color = 0x336633;
            scale = 1.1;
            health = 200;
            damage = 25;
            speed = 1.5;
            break;
        case 'wolf':
            color = 0x777777;
            scale = 0.9;
            health = 120;
            damage = 20;
            speed = 3;
            break;
        case 'drake':
            color = 0x99CCFF;
            scale = 1.3;
            health = 250;
            damage = 30;
            speed = 2.2;
            break;
        case 'fuling':
            color = 0x99CC33;
            scale = 0.8;
            health = 180;
            damage = 35;
            speed = 2.5;
            break;
        case 'lox':
            color = 0x996633;
            scale = 2;
            health = 400;
            damage = 40;
            speed = 1.4;
            break;
        case 'boar':
            color = 0x663300;
            scale = 0.8;
            health = 80;
            damage = 5;
            speed = 2.5;
            break;
        case 'deer':
            color = 0x996600;
            scale = 1;
            health = 60;
            damage = 0;
            speed = 3.5;
            break;
        case 'leech':
            color = 0x663366;
            scale = 0.7;
            health = 90;
            damage = 15;
            speed = 1;
            break;
        default:
            color = 0x333333;
            scale = 1;
            health = 100;
            damage = 10;
            speed = 2;
    }
    
    // Enemy body (simple shape for now)
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.scale.set(scale, scale, scale);
    enemy.add(body);
    
    // Eyes (to make it look more menacing)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.2, 1.5, 0.3);
    leftEye.scale.set(scale, scale, scale);
    enemy.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.2, 1.5, 0.3);
    rightEye.scale.set(scale, scale, scale);
    enemy.add(rightEye);
    
    // Add enemy properties
    enemy.userData.type = 'enemy';
    enemy.userData.enemyType = enemyType;
    enemy.userData.health = health;
    enemy.userData.maxHealth = health;
    enemy.userData.damage = damage;
    enemy.userData.speed = speed;
    enemy.userData.isAggressive = enemyType !== 'deer'; // Deer aren't aggressive
    
    return enemy;
}

function updateEnemies(deltaTime) {
    for (let i = 0; i < gameState.world.entities.length; i++) {
        const entity = gameState.world.entities[i];
        
        if (entity.userData.type === 'enemy') {
            const distanceToPlayer = entity.position.distanceTo(camera.position);
            
            // Enemy AI behavior
            if (distanceToPlayer < 20 && entity.userData.isAggressive) {
                // Move towards player
                const direction = new THREE.Vector3()
                    .subVectors(camera.position, entity.position)
                    .normalize();
                
                // Keep enemy on ground
                direction.y = 0;
                
                // Move enemy
                entity.position.add(
                    direction.multiplyScalar(entity.userData.speed * deltaTime)
                );
                
                // Rotate to face player
                entity.lookAt(camera.position);
                
                // Attack player if close enough
                if (distanceToPlayer < 2) {
                    // Only attack every second
                    if (Math.floor(gameState.world.time * 10) % 2 === 0) {
                        gameState.player.health -= entity.userData.damage * deltaTime;
                        
                        // Prevent health from going below 0
                        if (gameState.player.health < 0) {
                            gameState.player.health = 0;
                            // Handle player death
                            if (!playerIsDead) {
                                playerDeath();
                            }
                        }
                    }
                }
            } else if (distanceToPlayer < 20 && !entity.userData.isAggressive) {
                // Non-aggressive animals run away
                const direction = new THREE.Vector3()
                    .subVectors(entity.position, camera.position)
                    .normalize();
                
                // Keep enemy on ground
                direction.y = 0;
                
                // Move enemy away from player
                entity.position.add(
                    direction.multiplyScalar(entity.userData.speed * deltaTime)
                );
                
                // Rotate to face away from player
                const lookPos = new THREE.Vector3()
                    .copy(entity.position)
                    .add(direction);
                entity.lookAt(lookPos);
            } else {
                // Random movement when player is far away
                if (Math.random() < 0.01) {
                    entity.userData.randomDirection = new THREE.Vector3(
                        Math.random() * 2 - 1,
                        0,
                        Math.random() * 2 - 1
                    ).normalize();
                    
                    // Create a random target to look at
                    entity.userData.randomTarget = new THREE.Vector3()
                        .copy(entity.position)
                        .add(entity.userData.randomDirection);
                }
                
                if (entity.userData.randomDirection) {
                    // Move in random direction
                    entity.position.add(
                        entity.userData.randomDirection.clone()
                            .multiplyScalar(entity.userData.speed * 0.3 * deltaTime)
                    );
                    
                    // Look in direction of movement
                    entity.lookAt(entity.userData.randomTarget);
                }
            }
            
            // Update enemy position on terrain
            const groundY = getTerrainHeight(entity.position.x, entity.position.z);
            entity.position.y = groundY;
        }
    }
}