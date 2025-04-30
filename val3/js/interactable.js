// Interaction system
function interactWithWorld() {
    // Cast a ray from the camera
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.unproject(camera);
    raycaster.set(camera.position, direction.sub(camera.position).normalize());
    
    // Get all objects that intersect with the ray
    const intersects = raycaster.intersectObjects(
        gameState.world.entities.concat(
            Object.values(gameState.world.chunks).flatMap(chunk => chunk.children)
        ),
        true
    );
    
    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const parent = intersected.parent;
        const object = parent.userData.type ? parent : intersected;
        
        // Max interaction distance
        if (intersects[0].distance > 3) return;
        
        const equipped = gameState.player.inventory[gameState.player.equipped];
        
        // Interaction based on object type
        if (object.userData.type === 'tree') {
            // Can only cut trees with an axe
            if (equipped && equipped.type === 'tool') {
                object.userData.health -= equipped.damage;
                
                // Create hit effect
                createHitEffect(intersects[0].point);
                
                // Tree falls when health depletes
                if (object.userData.health <= 0) {
                    // Add tree resources to inventory
                    const primaryResource = object.userData.treeType === 'pine' || object.userData.treeType === 'fir' 
                        ? 'core_wood' : (object.userData.treeType === 'ancient' ? 'ancient_bark' : 'wood');
                    
                    collectResource({ 
                        type: primaryResource, 
                        name: primaryResource.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        count: 5 + Math.floor(Math.random() * 3) 
                    });
                    
                    if (Math.random() < 0.3) {
                        collectResource({ type: 'resin', name: 'Resin', count: 1 });
                    }
                    
                    // Remove tree
                    const parentIndex = gameState.world.entities.indexOf(parent);
                    if (parentIndex !== -1) {
                        gameState.world.entities.splice(parentIndex, 1);
                    }
                    
                    scene.remove(parent);
                    
                    // Increase woodcutting skill
                    gameState.player.skills.woodcutting += 0.2;
                }
            } else {
                showGameMessage("You need an axe to chop down trees");
            }
        } else if (object.userData.type === 'rock') {
            // Can only mine rocks with a pickaxe or hammer
            if (equipped && equipped.type === 'tool') {
                object.userData.health -= equipped.damage;
                
                // Create hit effect
                createHitEffect(intersects[0].point);
                
                // Rock breaks when health depletes
                if (object.userData.health <= 0) {
                    // Add rock resources to inventory
                    collectResource({ 
                        type: 'stone', 
                        name: 'Stone',
                        count: 3 + Math.floor(Math.random() * 3)
                    });
                    
                    if (Math.random() < 0.3) {
                        collectResource({ 
                            type: 'flint', 
                            name: 'Flint',
                            count: 1 
                        });
                    }
                    
                    // Remove rock
                    const parentIndex = gameState.world.entities.indexOf(parent);
                    if (parentIndex !== -1) {
                        gameState.world.entities.splice(parentIndex, 1);
                    }
                    
                    scene.remove(parent);
                    
                    // Increase mining skill
                    gameState.player.skills.mining += 0.2;
                }
            } else {
                showGameMessage("You need a pickaxe to mine rocks");
            }
        } else if (object.userData.type === 'resource') {
            // Mining ore deposits
            if (equipped && equipped.type === 'tool') {
                object.userData.health -= equipped.damage;
                
                // Create hit effect
                createHitEffect(intersects[0].point);
                
                // Resource node breaks when health depletes
                if (object.userData.health <= 0) {
                    // Add resources to inventory
                    const resourceType = object.userData.resourceType;
                    
                    collectResource({ 
                        type: resourceType, 
                        name: resourceType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        count: 2 + Math.floor(Math.random() * 3)
                    });
                    
                    // Remove resource node
                    const nodeIndex = gameState.world.entities.indexOf(object);
                    if (nodeIndex !== -1) {
                        gameState.world.entities.splice(nodeIndex, 1);
                    }
                    
                    scene.remove(object);
                    
                    // Increase mining skill
                    gameState.player.skills.mining += 0.2;
                }
            } else {
                showGameMessage("You need a proper tool to mine this resource");
            }
        } else if (object.userData.type === 'enemy') {
            // Combat with enemies
            if (equipped && equipped.type === 'weapon') {
                object.userData.health -= equipped.damage;
                
                // Create hit effect
                createHitEffect(intersects[0].point);
                
                // Enemy dies when health depletes
                if (object.userData.health <= 0) {
                    // Add enemy drops to inventory
                    if (Math.random() < 0.7) {
                        collectResource({ 
                            type: 'leather_scraps', 
                            name: 'Leather Scraps',
                            count: 1 + Math.floor(Math.random() * 2)
                        });
                    }
                    
                    if (Math.random() < 0.3) {
                        collectResource({ 
                            type: 'trophy', 
                            name: `${object.userData.enemyType.replace(/\b\w/g, c => c.toUpperCase())} Trophy`,
                            count: 1 
                        });
                    }
                    
                    // Remove enemy
                    const entityIndex = gameState.world.entities.indexOf(object);
                    if (entityIndex !== -1) {
                        gameState.world.entities.splice(entityIndex, 1);
                    }
                    
                    scene.remove(object);
                    
                    // Increase combat skill
                    gameState.player.skills.combat += 0.3;
                }
            } else {
                showGameMessage("You need a weapon to attack enemies");
            }
        } else if (object.userData.type === 'boss') {
            // Combat with bosses
            if (equipped && equipped.type === 'weapon') {
                object.userData.currentHealth -= equipped.damage;
                
                // Create hit effect
                createHitEffect(intersects[0].point);
                
                // Update boss UI
                updateBossUI();
                
                // Boss dies when health depletes
                if (object.userData.currentHealth <= 0) {
                    defeatBoss();
                }
            }
        } else if (object.userData.type === 'building') {
            // Interact with player-built structures (repair, dismantle, etc.)
            if (equipped && equipped.type === 'tool' && keyboard['ShiftLeft']) {
                // Dismantle building piece
                object.userData.health -= equipped.damage;
                
                // Create hit effect
                createHitEffect(intersects[0].point);
                
                // Building piece breaks when health depletes
                if (object.userData.health <= 0) {
                    // Return some materials to inventory
                    if (object.userData.buildingType === 'wall' || object.userData.buildingType === 'floor') {
                        collectResource({ type: 'wood', name: 'Wood', count: 2 });
                    } else if (object.userData.buildingType === 'stone_wall') {
                        collectResource({ type: 'stone', name: 'Stone', count: 5 });
                    }
                    
                    // Remove building piece
                    const pieceIndex = gameState.world.entities.indexOf(object);
                    if (pieceIndex !== -1) {
                        gameState.world.entities.splice(pieceIndex, 1);
                    }
                    
                    scene.remove(object);
                }
            }
        }
    }
}

// Check for interactable objects nearby for prompts
function checkInteractables() {
    // Check portal interactions
    checkPortalInteraction();
    
    // Check crop interactions
    checkCropInteraction();
    
    // Check other interactables
    // e.g., workbenches, chests, etc.
}