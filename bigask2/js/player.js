// js/player.js
import { PointerLockControls } from './libs/PointerLockControls.js'; // Adjust path as needed

class Player {
    constructor(game) {
        this.game = game;
        
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.maxHunger = 100;
        this.thirst = 100;
        this.maxThirst = 100;
        
        this.moveSpeed = 4.5; // Slightly increased
        this.runSpeed = 7.5;
        this.jumpStrength = 8.0; // Impulse strength for jump
        this.gravity = -25; 
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isOnGround = false;
        this.isRunning = false;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true; // Replaces wantsToJump, simpler for direct jump on space
        
        this.playerHeight = 1.8; // Actual height of player capsule
        this.eyeLevel = 1.6;   // Camera height from feet
        this.radius = 0.4;
        
        // Player object (capsule/collision body, origin at feet)
        this.playerObject = new THREE.Object3D();
        // Camera is a child of playerObject, positioned at eye level
        this.game.camera.position.set(0, this.eyeLevel, 0);
        this.playerObject.add(this.game.camera);
        this.game.scene.add(this.playerObject);
        
        this.position = this.playerObject.position; // Player's base (feet) position
        
        this.controls = new PointerLockControls(this.game.camera, this.game.renderer.domElement);
        
        this.hungerDecreaseRate = 0.1; // Per second (slower)
        this.thirstDecreaseRate = 0.15; // Per second (slower)
        
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackCooldownTime = 0.5; // Seconds
        this.toolSwingAnimation = null; // To manage ongoing animation
        
        this.equippedItem = null; // Full item object from inventory {id, count, durability?}
        this.equippedItemData = null; // Static data from ItemData
        this.toolMesh = null; 
        this.createToolModel();

        this.raycaster = new THREE.Raycaster(); // Player's own raycaster for actions
        this.interactionDistance = 3.5; 
        this.attackDistance = 2.8; 
    }

    createToolModel() {
        const toolGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1); // Basic stick shape
        const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.2 });
        this.toolMesh = new THREE.Mesh(toolGeometry, toolMaterial);
        this.toolMesh.castShadow = true;
        // Position relative to camera - slightly to the right and forward
        this.toolMesh.position.set(0.35, -0.3, -0.5); 
        this.toolMesh.rotation.z = Math.PI / 8; // Slight angle
        this.toolMesh.visible = false;
        this.game.camera.add(this.toolMesh); 
    }

    spawn() {
        const spawnPos = this.findSpawnPosition();
        this.playerObject.position.copy(spawnPos);
        // PlayerObject origin is at feet, so Y is terrain height
        
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        this.velocity.set(0,0,0);
        
        this.updateStatsUI();
        if (!this.controls.isLocked && !this.game.ui.isAnyMenuOpen()) {
            this.controls.lock();
        }
    }

    findSpawnPosition() {
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;
        for (let i = 0; i < 50; i++) { 
            const x = getRandomFloat(-worldSize / 2 + 5, worldSize / 2 - 5); // Avoid edges
            const z = getRandomFloat(-worldSize / 2 + 5, worldSize / 2 - 5);
            const y = this.game.world.getHeightAt(x, z);
            if (y > waterLevel + 0.5) { 
                return new THREE.Vector3(x, y, z);
            }
        }
        // Fallback: Center of the map, hope it's land
        const fallbackY = this.game.world.getHeightAt(0,0);
        return new THREE.Vector3(0, fallbackY > waterLevel ? fallbackY : waterLevel + 0.5, 0);
    }

    onKeyDown(event) {
        // Movement keys are captured by PointerLockControls internally for camera,
        // but we still need to set our move flags.
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
            case 'Space': 
                if (this.isOnGround && this.canJump && this.controls.isLocked) {
                    this.velocity.y = this.jumpStrength;
                    this.isOnGround = false;
                    this.canJump = false; // Prevent double jump until key up
                }
                break;
            case 'ShiftLeft': 
                if (this.controls.isLocked) this.isRunning = true; 
                break;
            case 'KeyR': 
                if (this.game.building.ghostObject && this.controls.isLocked) {
                    this.game.building.rotateGhost();
                }
                break;
            // KeyF for primary action is often handled by mousedown or specific game.js global keydown
            // This is for player-specific non-movement, non-UI actions triggered by player.js itself
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
            case 'ShiftLeft': this.isRunning = false; break;
            case 'Space': this.canJump = true; break; // Allow jumping again
        }
    }
    
    performPrimaryAction() { // Corresponds to left mouse click or a dedicated action key
        if (this.game.ui.isAnyMenuOpen() || this.game.paused) return; // Don't act if menu open or game paused

        if (this.game.building.ghostObject && this.game.building.selectedBuildable) {
            if (this.game.building.placeBuildable()) { // placeBuildable will consume item
                // Notification is good, maybe a sound
                // Check if player has more items to continue building
                const itemToBuildWith = this.game.building.selectedBuildable.item; // The item used for building
                if (!this.game.inventory.hasItem(itemToBuildWith.id, 1)) {
                     this.game.building.cancelPlacement();
                } else {
                    this.game.building.updateGhostPosition(); // Refresh ghost for next placement
                }
            } else {
                this.game.ui.showNotification("Cannot place here.");
            }
            return;
        }
        
        if (this.attackCooldown > 0) return;
        this.isAttacking = true;
        this.attackCooldown = this.attackCooldownTime;
        this.animateToolSwing();

        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.game.camera);
        
        // Collect all potential targets: resources and animals
        const potentialTargets = [...this.game.resources.activeResources, ...this.game.animals.animals.map(a => a.mesh)];
        const intersects = this.raycaster.intersectObjects(potentialTargets, true); // true for recursive

        let targetHit = false;
        if (intersects.length > 0) {
            for (const hit of intersects) {
                if (hit.object === this.playerObject || (this.toolMesh && hit.object === this.toolMesh)) continue;
                if (hit.object.userData.isWater) continue;

                let actualHitObject = hit.object;
                // Traverse up to find the parent with actual game data if part of complex model
                while (actualHitObject.parent && !actualHitObject.userData.type) {
                    if (actualHitObject.parent === this.game.scene) break; // Stop at scene root
                    actualHitObject = actualHitObject.parent;
                }

                const distance = hit.distance; // Distance to the actual intersected face
                const objectUserData = actualHitObject.userData;

                if (objectUserData.type === 'resource' && distance <= this.interactionDistance) {
                    this.game.resources.harvestResource(actualHitObject, hit.point, this.equippedItem); // Pass full item
                    targetHit = true;
                    break; 
                } else if (objectUserData.type === 'animal' && objectUserData.animalInstanceId && distance <= this.attackDistance) {
                    const damage = this.equippedItemData ? (this.equippedItemData.damage || 1) : 1;
                    this.game.animals.attackAnimalById(objectUserData.animalInstanceId, damage);
                    targetHit = true;
                    break;
                }
                // Prevent interacting through walls by breaking on first "solid" non-target hit
                if (distance <= Math.min(this.interactionDistance, this.attackDistance)) break;
            }
        }
         if (!targetHit && this.equippedItemData && (this.equippedItemData.type === 'tool' || this.equippedItemData.type === 'weapon')) {
             // Play an air swing sound
         }
    }
    
    performSecondaryAction() { // E.g., Right mouse click
        if (this.game.ui.isAnyMenuOpen() || this.game.paused) return;
        // Example: Aiming, blocking, alternative tool use
        // if (this.equippedItemData && this.equippedItemData.id === 'bow') // Aim bow
        this.game.ui.showNotification("Secondary action (not implemented)");
    }

    animateToolSwing() {
        if (!this.toolMesh || !this.toolMesh.visible || this.toolSwingAnimation) return;

        const startRotation = this.toolMesh.rotation.clone();
        const startPosition = this.toolMesh.position.clone();
        const swingAngleX = -Math.PI / 1.5; 
        const swingAngleZ = Math.PI / 4;
        const forwardOffset = -0.2;

        let progress = 0;
        const duration = this.attackCooldownTime * 0.7; 

        const animate = () => {
            const deltaTime = this.game.clock.getDelta(); // Use game clock's delta
            progress += deltaTime / duration;

            if (progress >= 1) {
                this.toolMesh.rotation.copy(startRotation);
                this.toolMesh.position.copy(startPosition);
                this.isAttacking = false;
                this.toolSwingAnimation = null;
                return;
            }
            
            const easedProgress = Math.sin(progress * Math.PI); // Sin wave for smooth in-out
            this.toolMesh.rotation.x = startRotation.x + easedProgress * swingAngleX;
            this.toolMesh.rotation.z = startRotation.z - easedProgress * swingAngleZ; // Swing a bit sideways too
            this.toolMesh.position.z = startPosition.z + easedProgress * forwardOffset;


            this.toolSwingAnimation = requestAnimationFrame(animate);
        };
        this.toolSwingAnimation = requestAnimationFrame(animate);
    }

    updateMovement(deltaTime) {
        const currentSpeed = (this.isRunning ? this.runSpeed : this.moveSpeed);
        
        // Apply gravity
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * deltaTime;
        }

        this.direction.set(0, 0, 0);
        if (this.moveForward) this.direction.z = -1;
        if (this.moveBackward) this.direction.z = 1;
        if (this.moveLeft) this.direction.x = -1;
        if (this.moveRight) this.direction.x = 1;

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
            // Get camera's forward and right vectors, ignore Y component for planar movement
            const forward = new THREE.Vector3();
            this.game.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3().crossVectors(this.game.camera.up, forward).normalize(); // Right is up X forward

            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(forward, -this.direction.z); // Negate Z because camera forward is -Z
            moveDirection.addScaledVector(right, this.direction.x);
            moveDirection.normalize();
            
            this.velocity.x = moveDirection.x * currentSpeed;
            this.velocity.z = moveDirection.z * currentSpeed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        this.playerObject.position.x += this.velocity.x * deltaTime;
        this.playerObject.position.y += this.velocity.y * deltaTime;
        this.playerObject.position.z += this.velocity.z * deltaTime;


        // Ground collision and stepping (very basic)
        const groundHeight = this.game.world.getHeightAt(this.playerObject.position.x, this.playerObject.position.z);
        const stepHeight = 0.5; // How high player can step up

        if (this.playerObject.position.y < groundHeight) {
            if (this.velocity.y < 0 && groundHeight - this.playerObject.position.y < stepHeight) { // Stepping up
                this.playerObject.position.y = groundHeight;
                this.velocity.y = 0;
                this.isOnGround = true;
            } else if (this.velocity.y < 0) { // Fell below terrain or hit a wall from underneath
                this.playerObject.position.y = groundHeight; // Snap to ground
                this.velocity.y = 0;
                this.isOnGround = true;
            }
        } else if (this.playerObject.position.y - groundHeight < 0.1 && this.velocity.y <=0) { // Close to ground and not moving up
             this.playerObject.position.y = groundHeight;
             this.velocity.y = 0;
             this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }


        // World bounds collision
        const worldBoundary = this.game.world.size / 2 - this.radius;
        this.playerObject.position.x = Math.max(-worldBoundary, Math.min(worldBoundary, this.playerObject.position.x));
        this.playerObject.position.z = Math.max(-worldBoundary, Math.min(worldBoundary, this.playerObject.position.z));

        if (this.isRunning && this.direction.lengthSq() > 0) {
            this.hunger -= this.hungerDecreaseRate * 2.0 * deltaTime; 
            this.thirst -= this.thirstDecreaseRate * 2.0 * deltaTime;
        }
    }


    updateStats(deltaTime) {
        this.hunger = Math.max(0, this.hunger - this.hungerDecreaseRate * deltaTime);
        this.thirst = Math.max(0, this.thirst - this.thirstDecreaseRate * deltaTime);
        
        if (this.hunger <= 0) {
            this.takeDamage(1 * deltaTime, "starvation"); // Damage per second
        }
        if (this.thirst <= 0) {
            this.takeDamage(1.5 * deltaTime, "dehydration"); 
        }
        
        // Slow health regeneration if hunger/thirst are high
        if (this.health < this.maxHealth && this.hunger > 70 && this.thirst > 70) {
            this.health = Math.min(this.maxHealth, this.health + 1 * deltaTime);
        }

        if (this.health <= 0 && !this.game.paused) { 
            this.die();
        }
        this.updateStatsUI();
    }

    updateStatsUI() {
        const healthFill = document.getElementById('health-fill');
        const hungerFill = document.getElementById('hunger-fill');
        const thirstFill = document.getElementById('thirst-fill');

        if (healthFill) healthFill.style.width = `${Math.max(0,(this.health / this.maxHealth) * 100)}%`;
        if (hungerFill) hungerFill.style.width = `${Math.max(0,(this.hunger / this.maxHunger) * 100)}%`;
        if (thirstFill) thirstFill.style.width = `${Math.max(0,(this.thirst / this.maxThirst) * 100)}%`;
    }
    
    updateEquippedItem() {
        this.equippedItem = this.game.inventory.getSelectedItem(); // This is {id, count, durability?}
        
        if (this.equippedItem) {
            this.equippedItemData = getItemData(this.equippedItem.id); // This is from ItemData template
            this.toolMesh.visible = true;
            
            // TODO: Change toolMesh geometry/material based on equippedItemData.id
            // For now, placeholder color changes
            if (this.equippedItemData.type === 'tool') this.toolMesh.material.color.setHex(0xA0522D); // Sienna
            else if (this.equippedItemData.type === 'weapon') this.toolMesh.material.color.setHex(0x657383); // Slate Gray Darker
            else if (this.equippedItemData.type === 'placeable') this.toolMesh.material.color.setHex(0x556B2F); // DarkOliveGreen
            else this.toolMesh.material.color.setHex(0xD2B48C); // Tan (default for other equippables)

            // Handle light source on equipped item (e.g., torch)
            const lightData = this.equippedItemData.lightSource;
            if (lightData) {
                if (!this.toolMesh.userData.light) {
                    const light = new THREE.PointLight(
                        lightData.color,
                        lightData.intensity,
                        lightData.distance,
                        lightData.decay !== undefined ? lightData.decay : 1 // Default decay if not specified
                    );
                    light.castShadow = false; // Handheld lights usually don't cast shadows for performance
                    this.toolMesh.add(light); 
                    this.toolMesh.userData.light = light;
                } else {
                     this.toolMesh.userData.light.color.setHex(lightData.color);
                     this.toolMesh.userData.light.intensity = lightData.intensity;
                     this.toolMesh.userData.light.distance = lightData.distance;
                }
                this.toolMesh.userData.light.visible = true;
            } else if (this.toolMesh.userData.light) {
                this.toolMesh.userData.light.visible = false;
            }

        } else {
            this.equippedItemData = null;
            this.toolMesh.visible = false;
            if (this.toolMesh.userData.light) {
                this.toolMesh.userData.light.visible = false;
            }
        }
    }


    eat(foodItemData) { // foodItemData is from ItemData
        this.hunger = Math.min(this.maxHunger, this.hunger + (foodItemData.hungerValue || 0));
        this.thirst = Math.min(this.maxThirst, this.thirst + (foodItemData.thirstValue || 0));
        this.health = Math.min(this.maxHealth, this.health + (foodItemData.healthValue || 0));
        if (foodItemData.healthValue < 0) this.flashDamage(true); // Special flash for self-inflicted damage
        this.updateStatsUI();
    }

    drink(beverageItemData) { // beverageItemData is from ItemData
        this.thirst = Math.min(this.maxThirst, this.thirst + (beverageItemData.thirstValue || 0));
        this.hunger = Math.min(this.maxHunger, this.hunger + (beverageItemData.hungerValue || 0)); // Some drinks might affect hunger
        this.health = Math.min(this.maxHealth, this.health + (beverageItemData.healthValue || 0));
        if (beverageItemData.healthValue < 0) this.flashDamage(true);
        this.updateStatsUI();
    }

    takeDamage(amount, source = "unknown") {
        if (this.health <= 0) return; // Already dead

        // Apply armor reduction if implemented
        // let actualDamage = amount;
        // if (this.game.inventory.equippedArmor) actualDamage -= this.game.inventory.equippedArmor.defense;
        // actualDamage = Math.max(0, actualDamage);

        this.health = Math.max(0, this.health - amount); // Use amount directly for now
        this.flashDamage();
        this.updateStatsUI();
        // this.game.ui.showNotification(`Took ${amount.toFixed(1)} damage from ${source}. Health: ${this.health.toFixed(0)}`);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    flashDamage(subtle = false) {
        const existingOverlay = document.getElementById('damageOverlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = "damageOverlay";
        overlay.style.position = 'fixed'; 
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = subtle ? 'rgba(255, 150, 0, 0.2)' : 'rgba(255, 0, 0, 0.3)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9998'; // Below menus but above game
        overlay.style.opacity = '1';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                     overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }, 50);
    }

    die() {
        if (this.game.paused) return; // Avoid multiple death screens if already paused by it

        console.log("Player died.");
        this.game.ui.showNotification("You have perished!");
        this.game.paused = true;
        this.controls.unlock();
        
        const existingScreen = document.getElementById('gameOverScreen');
        if(existingScreen) existingScreen.remove();

        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = "gameOverScreen";
        // Styles from index.html are fine, but can override here too
        gameOverDiv.style.position = 'fixed';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.padding = '40px';
        gameOverDiv.style.border = '2px solid #400';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.zIndex = '10001'; // Above everything
        gameOverDiv.innerHTML = `
            <h2 style="color: #c00; font-size: 2.5em; margin-bottom: 20px;">YOU DIED</h2>
            <p style="font-size: 1.2em;">You survived for ${Math.floor(this.game.gameTime / 60)} minutes and ${Math.floor(this.game.gameTime) % 60} seconds.</p>
            <button id="respawnButton" style="padding: 15px 30px; margin-top: 30px; cursor: pointer; background-color: #006400; color: white; border: none; border-radius: 5px; font-size: 1.1em; text-transform: uppercase;">Respawn</button>
        `;
        document.body.appendChild(gameOverDiv);
        
        const respawnButton = document.getElementById('respawnButton');
        if(respawnButton) {
            respawnButton.addEventListener('click', () => {
                if (gameOverDiv.parentNode) {
                    gameOverDiv.parentNode.removeChild(gameOverDiv);
                }
                this.respawn();
            }, { once: true });
        }
    }

    respawn() {
        this.game.paused = false; // Unpause first
        this.spawn(); // Resets stats and position, re-locks controls
    }

    update(deltaTime) {
        if (this.game.paused && !document.getElementById('gameOverScreen')) { // If paused by user, not by death
             if (this.controls.isLocked) this.controls.unlock(); // Unlock controls if paused manually
             return;
        }
        if (!this.controls.isLocked && !this.game.ui.isAnyMenuOpen() && !this.game.paused) {
            // If game isn't paused by menu/death but controls got unlocked, attempt to re-lock
            // This can happen if user presses Esc without a menu open
            // this.controls.lock(); 
            // Or, perhaps game should pause if controls are not locked and no menu is open
        }


        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        } else if (this.isAttacking && this.toolSwingAnimation == null) { // Reset if attack done and animation finished
            this.isAttacking = false;
        }
        
        if (this.controls.isLocked) {
            this.updateMovement(deltaTime);
        }
        this.updateStats(deltaTime); // Update stats regardless of control lock (hunger/thirst decrease)
    }
}