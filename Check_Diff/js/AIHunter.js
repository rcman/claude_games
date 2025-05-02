// --- START OF FILE AIHunter.js ---

class AIHunter {
    constructor(game, position) { // Position should be simple {x, y, z}
        this.game = game;
        this.scene = game.scene; // Store scene reference

        // Hunter properties
        this.id = `hunter_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.type = 'hunter';
        this.name = 'Hunter';
        this.health = Constants.HUNTERS.HEALTH;
        this.maxHealth = Constants.HUNTERS.HEALTH;
        this.damage = Constants.HUNTERS.DAMAGE;
        this.speed = Constants.HUNTERS.SPEED;
        this.sightRange = Constants.HUNTERS.SIGHT_RANGE;
        this.attackRange = Constants.HUNTERS.ATTACK_RANGE;
        this.patrolRadius = Constants.HUNTERS.PATROL_RADIUS;
        this.drops = Constants.HUNTERS.DROPS;

        // Position and movement (Use BABYLON Vectors)
        this.position = new BABYLON.Vector3(position.x, position.y, position.z);
        this.spawnPosition = new BABYLON.Vector3(position.x, position.y, position.z);
        this.rotationY = 0; // Store Y rotation
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.targetPosition = null; // Will be BABYLON.Vector3

        // Combat properties
        this.weapon = {
            type: 'rifle',
            damage: 15,
            range: this.attackRange, // Use hunter's attack range
            cooldown: Constants.HUNTERS.WEAPON_COOLDOWN, // Use constant
            lastFired: 0
        };

        // State
        this.state = 'patrol';
        this.stateTimer = 0;
        this.stateData = {};
        this.isAlive = true;
        this.onGround = false;

        // Pathing
        this.patrolPoints = []; // Will store BABYLON.Vector3
        this.currentPatrolPoint = 0;

        // Visual representation (Babylon Node)
        this.model = null; // Will be the Babylon Node (Mesh or TransformNode)
        this.weaponMesh = null; // Reference to the weapon part for animation

        try {
            this.createModel(); // Needs adaptation
            this.generatePatrolPath(); // Needs adaptation
        } catch (error) {
             console.error(`Error creating model/path for hunter ${this.id}:`, error);
             this.model?.dispose?.(false, true);
             this.model = null;
        }
    }

    createModel() {
        // --- Use Babylon MeshBuilder ---
        this.model = new BABYLON.TransformNode(`hunter_root_${this.id}`, this.scene); // Use TransformNode as root

        // Materials
        const bodyMaterial = new BABYLON.StandardMaterial("hunterBodyMat", this.scene);
        bodyMaterial.diffuseColor = new BABYLON.Color3(0.53, 0.33, 0.06); // Brown
        bodyMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        const headMaterial = new BABYLON.StandardMaterial("hunterHeadMat", this.scene);
        headMaterial.diffuseColor = new BABYLON.Color3(0.88, 0.67, 0.41); // Skin tone
        headMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        const weaponMaterial = new BABYLON.StandardMaterial("hunterWeaponMat", this.scene);
        weaponMaterial.diffuseColor = new BABYLON.Color3(0.13, 0.13, 0.13); // Dark grey
        weaponMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3); // More specular for metal

        // Create meshes and parent them to the root node
        // Body
        const body = BABYLON.MeshBuilder.CreateCylinder("hunterBody", { height: 1.8, diameter: 0.9, tessellation: 8 }, this.scene);
        body.material = bodyMaterial;
        body.position.y = 0.9; // Position relative to root
        body.parent = this.model;
        body.castShadow = true;

        // Head
        const head = BABYLON.MeshBuilder.CreateSphere("hunterHead", { diameter: 0.6, segments: 8 }, this.scene);
        head.material = headMaterial;
        head.position.y = 2.0; // Relative to root (body top + radius)
        head.parent = this.model;
        head.castShadow = true;

        // Arms
        const arm = BABYLON.MeshBuilder.CreateCylinder("hunterArm", { height: 0.8, diameter: 0.2, tessellation: 8 }, this.scene);
        arm.material = bodyMaterial;
        const leftArm = arm; // Use instance for right arm
        const rightArm = arm.createInstance("hunterArm_R");
        leftArm.position.set(0.55, 1.2, 0);
        leftArm.rotation.z = -Math.PI / 6;
        rightArm.position.set(-0.55, 1.2, 0);
        rightArm.rotation.z = Math.PI / 6;
        leftArm.parent = this.model;
        rightArm.parent = this.model;
        leftArm.castShadow = true;
        rightArm.castShadow = true;

        // Legs
        const leg = BABYLON.MeshBuilder.CreateCylinder("hunterLeg", { height: 0.9, diameter: 0.3, tessellation: 8 }, this.scene);
        leg.material = bodyMaterial;
        const leftLeg = leg;
        const rightLeg = leg.createInstance("hunterLeg_R");
        leftLeg.position.set(0.25, 0.45, 0);
        rightLeg.position.set(-0.25, 0.45, 0);
        leftLeg.parent = this.model;
        rightLeg.parent = this.model;
        leftLeg.castShadow = true;
        rightLeg.castShadow = true;

        // Weapon (rifle)
        const rifle = BABYLON.MeshBuilder.CreateBox("hunterRifle", { width: 0.1, height: 0.1, depth: 1.2 }, this.scene);
        rifle.material = weaponMaterial;
        rifle.position.set(-0.6, 1.3, 0.5); // Position relative to root
        rifle.rotation.x = Math.PI / 2;
        rifle.parent = this.model;
        rifle.castShadow = true;
        this.weaponMesh = rifle; // Store reference

        // Position model root at spawn location
        this.model.position = this.position.clone();
        this.model.name = `hunter_${this.id}`; // Name the root node
        this.model.metadata = { entityId: this.id }; // Link model to entity

        // Enable shadows for all meshes (using getChildMeshes)
        this.model.getChildMeshes(false).forEach(m => {
             m.receiveShadows = true;
             this.game.shadowGenerator?.getShadowMap()?.renderList?.push(m);
        });
    }

    generatePatrolPath() {
        const numPoints = Utils.random(3, 6);
        this.patrolPoints = []; // Clear existing

        for (let i = 0; i < numPoints; i++) {
            let point = null;
            let attempts = 0;
            while (!point && attempts < 20) {
                attempts++;
                 const angle = (i / numPoints) * Math.PI * 2 + Utils.randomFloat(-0.3, 0.3); // Add randomness
                 const radius = Utils.randomFloat(this.patrolRadius * 0.5, this.patrolRadius);
                 const x = this.spawnPosition.x + Math.cos(angle) * radius;
                 const z = this.spawnPosition.z + Math.sin(angle) * radius;
                 const y = this.game.terrain?.getHeightAt(x, z);

                 // Check if point is valid (on terrain, not too deep in water)
                 if (y !== undefined && y > (Constants.WORLD.WATER_LEVEL ?? 2) - 1) {
                     // Optional: Check if too close to a cave entrance
                     const avoidRadiusSq = (Constants.HUNTERS.AVOID_CAVE_ENTRANCE_RADIUS ?? 20)**2;
                     const tooCloseToCave = this.game.terrain.caveEntrances.some(entrance => {
                         const dx = x - entrance.x; const dz = z - entrance.z;
                         return (dx * dx + dz * dz < avoidRadiusSq);
                     });

                     if (!tooCloseToCave) {
                        point = new BABYLON.Vector3(x, y, z); // Use Babylon Vector3
                     }
                 }
             }
             if (point) {
                 this.patrolPoints.push(point);
             } else {
                console.warn(`Hunter ${this.id} failed to generate patrol point ${i+1}.`);
             }
        }
         // Fallback if no points generated
         if(this.patrolPoints.length === 0) {
            this.patrolPoints.push(this.spawnPosition.clone());
            console.warn(`Hunter ${this.id} using only spawn position for patrol.`);
         }
        this.currentPatrolPoint = 0;
    }

    update(deltaTime) {
        if (!this.isAlive || !this.model) return; // Check model exists

        this.updateState(deltaTime);
        this.updateMovement(deltaTime);
        this.checkTerrainCollisions(deltaTime); // Check collisions and update Y position
        this.updateModel(); // Update model position/rotation after physics
    }

    updateState(deltaTime) {
        this.stateTimer -= deltaTime;

        // Check for state transitions
        if (this.stateTimer <= 0 && this.state !== 'chase' && this.state !== 'attack') {
             this.chooseNewState();
        }

        // Check perception regardless of timer
        this.checkForPlayer();

        // Handle current state logic
        switch (this.state) {
            case 'patrol':
                if (!this.targetPosition || this.hasReachedTarget()) {
                     if (this.patrolPoints.length > 0) {
                         this.currentPatrolPoint = (this.currentPatrolPoint + 1) % this.patrolPoints.length;
                         this.targetPosition = this.patrolPoints[this.currentPatrolPoint].clone();
                     } else {
                         this.targetPosition = this.spawnPosition.clone(); // Fallback to spawn
                         this.state = 'idle'; // No path, just idle
                         this.stateTimer = 5;
                     }
                }
                break;

            case 'chase':
                if (this.stateData.target) {
                    this.targetPosition = this.stateData.target.position.clone(); // Keep chasing player pos
                    const distToTarget = BABYLON.Vector3.Distance(this.position, this.stateData.target.position);

                    if (distToTarget < this.attackRange) {
                        this.state = 'attack';
                        this.stateTimer = 0.2; // Short timer to initiate attack logic
                        this.targetPosition = null; // Stop moving towards target, face instead
                        this.velocity.scaleInPlace(0.1); // Slow down quickly
                    } else if (distToTarget > this.sightRange * 1.2) { // Lose target if too far
                        this.state = 'search';
                        this.stateTimer = 10; // Search for 10 seconds
                        this.stateData.lastKnownPosition = this.targetPosition.clone(); // Store last known pos
                        this.targetPosition = this.stateData.lastKnownPosition; // Go to last known pos first
                    }
                } else {
                    this.state = 'patrol'; // Target lost/invalidated
                    this.stateTimer = 0;
                }
                break;

            case 'attack':
                 if (this.stateData.target) {
                     this.faceTarget(this.stateData.target.position); // Keep facing target
                     const distToTarget = BABYLON.Vector3.Distance(this.position, this.stateData.target.position);

                     // If target moved out of range, chase again
                     if (distToTarget > this.attackRange * 1.1) { // Add buffer
                         this.state = 'chase';
                         this.stateTimer = 0;
                         break;
                     }

                     // Attack if cooldown expired
                     const now = performance.now(); // Use performance.now for higher precision
                     if (now - this.weapon.lastFired > this.weapon.cooldown * 1000) {
                         this.attackTarget(this.stateData.target);
                         this.weapon.lastFired = now;
                         this.stateTimer = this.weapon.cooldown; // Reset timer to cooldown
                     } else {
                         // If still on cooldown, stay in attack state but maybe add a slight delay before checking again
                         this.stateTimer = 0.1; // Check frequently while waiting for cooldown
                     }

                 } else {
                     this.state = 'patrol'; // Target lost
                     this.stateTimer = 0;
                 }
                 break;

            case 'search':
                if (!this.targetPosition || this.hasReachedTarget()) {
                    if (this.stateData.lastKnownPosition) {
                        // Generate a new random search point near last known position
                        const searchRadius = 15;
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * searchRadius;
                        const searchX = this.stateData.lastKnownPosition.x + Math.cos(angle) * distance;
                        const searchZ = this.stateData.lastKnownPosition.z + Math.sin(angle) * distance;
                        const searchY = this.game.terrain?.getHeightAt(searchX, searchZ);
                        if (searchY !== undefined && searchY > (Constants.WORLD.WATER_LEVEL ?? 2) - 1) {
                            this.targetPosition = new BABYLON.Vector3(searchX, searchY, searchZ);
                        } else {
                            // If random point invalid, just head towards last known general direction
                            this.targetPosition = this.stateData.lastKnownPosition.clone();
                             this.stateData.lastKnownPosition = null; // Avoid getting stuck recalculating invalid points
                        }
                    } else {
                        // No last known position, return to patrol
                        this.state = 'patrol';
                        this.stateTimer = 0;
                    }
                }
                // If search time expired, go back to patrol
                if (this.stateTimer <= 0) {
                    this.state = 'patrol';
                    this.stateTimer = 0;
                }
                break;

            case 'idle':
                // Do nothing, wait for timer
                this.velocity.scaleInPlace(0.8); // Apply friction
                break;
        }
    }

    chooseNewState() {
        // Default to patrol if patrol points exist
        if (this.patrolPoints.length > 0) {
             this.state = 'patrol';
             this.stateTimer = Utils.randomFloat(5, 10);
         } else {
             this.state = 'idle'; // Idle if no patrol path
             this.stateTimer = Utils.randomFloat(3, 6);
         }
        this.stateData = {}; // Clear state data
    }

    updateMovement(deltaTime) {
        // Only move if we have a target and are not in attack state
        if (!this.targetPosition || this.state === 'attack') {
            this.velocity.x *= 0.9; // Apply friction
            this.velocity.z *= 0.9;
            // Keep gravity effect if needed (handled in checkTerrainCollisions)
            return;
        }

        // Calculate direction to target (horizontal plane)
        const direction = this.targetPosition.subtract(this.position);
        direction.y = 0; // Ignore vertical difference for movement direction
        if (direction.lengthSquared() < 0.1 * 0.1) {
             // Close enough, stop applying force
             this.velocity.x *= 0.9;
             this.velocity.z *= 0.9;
             return;
         }
        direction.normalize();

        // Calculate speed based on state
        let speed = this.speed;
        if (this.state === 'chase') {
            speed = this.speed * 1.3; // Chase faster
        } else if (this.state === 'patrol') {
            speed = this.speed * 0.8; // Patrol slower
        } else if (this.state === 'search') {
             speed = this.speed * 1.1; // Search bit faster than patrol
        }


        // Apply movement force (consider acceleration/friction model)
        const acceleration = 10.0; // Adjust as needed
        this.velocity.x += direction.x * acceleration * deltaTime;
        this.velocity.z += direction.z * acceleration * deltaTime;

        // Clamp velocity to max speed
        const currentSpeedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
        if (currentSpeedSq > speed * speed) {
            const currentSpeed = Math.sqrt(currentSpeedSq);
            this.velocity.x = (this.velocity.x / currentSpeed) * speed;
            this.velocity.z = (this.velocity.z / currentSpeed) * speed;
        }

        // Update rotation to face movement direction (unless attacking)
        if (this.velocity.lengthSquared() > 0.1 * 0.1 && this.state !== 'attack') {
            const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
             let deltaRot = targetRotation - this.rotationY;
             while (deltaRot > Math.PI) deltaRot -= Math.PI * 2;
             while (deltaRot < -Math.PI) deltaRot += Math.PI * 2;
             this.rotationY += deltaRot * 8.0 * deltaTime; // Adjust turning speed
        }
    }


    updateModel() {
        if (!this.model) return;
        this.model.position = this.position.clone(); // Sync root node position
        this.model.rotation.y = this.rotationY; // Sync root node rotation

        // TODO: Add simple walk/idle animation switching if needed
        // Based on velocity magnitude?
    }

    checkTerrainCollisions(deltaTime) {
        if (!this.isAlive) return;

        const gravity = Constants?.WORLD?.GRAVITY ?? 9.8;
        let terrainHeight = this.position.y - 1.0;

        if (this.game.terrain?.getHeightAt) {
             try {
                 terrainHeight = this.game.terrain.getHeightAt(this.position.x, this.position.z);
                  if (terrainHeight === undefined) { terrainHeight = this.position.y - 1.0; }
             } catch (e) { /*...*/ terrainHeight = this.position.y - 1.0; }
         }

        const groundCheckOffset = 0.1;

        if (!this.onGround) {
            this.velocity.y -= gravity * deltaTime;
        }

        this.position.y += this.velocity.y * deltaTime;

        if (this.position.y <= terrainHeight + groundCheckOffset) {
            this.position.y = terrainHeight;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Water avoidance (move target if hunter enters water)
        const waterLevel = Constants?.WORLD?.WATER_LEVEL ?? 2;
         if (this.position.y < waterLevel && this.state !== 'flee') { // Don't override flee target
             console.log(`Hunter ${this.id} entered water, seeking dry land.`);
             let bestTarget = null; let minDistSq = Infinity;
             for (let i = 0; i < 8; i++) {
                 const angle = i * Math.PI / 4; const dist = 15;
                 const tX = this.position.x + Math.cos(angle) * dist; const tZ = this.position.z + Math.sin(angle) * dist;
                 if (this.game.terrain) {
                     const tY = this.game.terrain.getHeightAt(tX, tZ);
                      if (tY !== undefined && tY >= waterLevel) {
                          const dx = tX - this.position.x; const dz = tZ - this.position.z; const dSq = dx * dx + dz * dz;
                          if (dSq < minDistSq) { minDistSq = dSq; bestTarget = new BABYLON.Vector3(tX, tY, tZ); }
                      }
                  }
             }
             if (bestTarget) { this.targetPosition = bestTarget; }
             else { // No dry land nearby? Head back towards spawn
                 this.targetPosition = this.spawnPosition.clone();
             }
             // Optionally change state? Maybe just override target is enough.
             // this.state = 'flee'; this.stateTimer = 5;
         }
    }

    checkForPlayer() {
        const player = this.game.playerController;
        if (!player || !player.position) return; // Player might not be initialized yet

        const distToPlayer = BABYLON.Vector3.Distance(this.position, player.position);

        if (distToPlayer <= this.sightRange) {
            // Basic Line of Sight Check (Raycast)
            const isVisible = this.isTargetVisible(player.position);

            if (isVisible) {
                // If currently patrolling or searching, switch to chase
                if (this.state === 'patrol' || this.state === 'search' || this.state === 'idle') {
                    this.state = 'chase';
                    this.stateTimer = 10; // Chase for at least 10 seconds before possibly losing target
                    this.stateData.target = player;
                }
                 // If already chasing, update target (handled in state logic) and check attack range
                 else if (this.state === 'chase') {
                    this.stateData.target = player; // Ensure target is current
                     if (distToPlayer < this.attackRange) {
                        this.state = 'attack';
                        this.stateTimer = 0.2; // Initiate attack logic quickly
                        this.targetPosition = null;
                        this.velocity.scaleInPlace(0.1);
                    }
                }
                 // If attacking, visibility check is implicitly handled by range checks
            }
        }
    }

    isTargetVisible(targetPosition) {
        if (!this.model) return false;
        // Raycast from hunter's eye level towards target eye level
        const eyeOffset = 1.8; // Approximate eye height from hunter's base position
        const origin = this.position.add(new BABYLON.Vector3(0, eyeOffset, 0));
        const targetOrigin = targetPosition.add(new BABYLON.Vector3(0, Constants.PLAYER.CAM_HEIGHT - 0.2, 0)); // Target head height approx

        const direction = targetOrigin.subtract(origin).normalize();
        const distance = BABYLON.Vector3.Distance(origin, targetOrigin);

        const ray = new BABYLON.Ray(origin, direction, distance);

        // Pick terrain and potentially other obstacles (e.g., buildings)
        const predicate = (mesh) => mesh.isPickable && mesh.isEnabled() && mesh !== this.model && !this.model.isDescendantOf(mesh) && mesh !== this.game.playerController?.playerModel; // Exclude self and player collider

        const pickInfo = this.scene.pickWithRay(ray, predicate);

        // If no hit or hit is farther than the target, target is visible
        return !(pickInfo && pickInfo.hit && pickInfo.distance < distance * 0.98); // Add tolerance
    }

    faceTarget(targetPosition) {
        if (!targetPosition || !(targetPosition instanceof BABYLON.Vector3)) return;
        const targetRotation = Math.atan2(targetPosition.x - this.position.x, targetPosition.z - this.position.z);
        let deltaRot = targetRotation - this.rotationY;
        while (deltaRot > Math.PI) deltaRot -= Math.PI * 2;
        while (deltaRot < -Math.PI) deltaRot += Math.PI * 2;
        // Faster turning when attacking
        this.rotationY += deltaRot * 12.0 * (this.game.deltaTime || 0.016);
    }

    attackTarget(target) {
        // Play attack animation (recoil)
        this.playAttackAnimation();

        // Simulate projectile (instant hit for now)
        if (target === this.game.playerController) {
            // Deal damage to player
            this.game.characterStats?.takeDamage(this.weapon.damage, 'hunter');
            console.log(`Hunter attacked player for ${this.weapon.damage} damage`);
             // TODO: Play gunshot sound effect
         }
        // TODO: Could attack other entities?
    }

    playAttackAnimation() {
        if (!this.weaponMesh) return;
        const weapon = this.weaponMesh;

        // Use Babylon animation system for recoil
        const startZ = 0.5; // Original relative Z
        const recoilZ = 0.3;
        const durationFrames = 12; // ~0.2 seconds at 60fps

        // Create Animation objects
        const recoilAnim = new BABYLON.Animation(
            `hunter_recoil_${this.id}`, "position.z", 60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Animation keys: Frame, Value
        const keys = [];
        keys.push({ frame: 0, value: startZ });
        keys.push({ frame: durationFrames / 2, value: recoilZ }); // Move back quickly
        keys.push({ frame: durationFrames, value: startZ }); // Return to start

        recoilAnim.setKeys(keys);

        // Apply easing (optional)
         const easingFunction = new BABYLON.QuadraticEase();
         easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
         recoilAnim.setEasingFunction(easingFunction);

        // Stop previous animation and start new one
        this.scene.stopAnimation(weapon);
        this.scene.beginDirectAnimation(weapon, [recoilAnim], 0, durationFrames, false);
    }


    hasReachedTarget() {
        if (!this.targetPosition) return true;
        // Check distance using only XZ plane
        const dx = this.position.x - this.targetPosition.x;
        const dz = this.position.z - this.targetPosition.z;
        return (dx * dx + dz * dz) < 1.5 * 1.5; // Increased tolerance for reaching patrol points
    }

    takeDamage(amount, source) {
        if (!this.isAlive) return false;
        this.health -= amount;
         // TODO: Add visual feedback

        if (this.health <= 0) {
            this.die();
            return true; // Died
        }

        // Aggro logic
        if (source === 'player') {
             const player = this.game.playerController;
             if (player && this.state !== 'chase' && this.state !== 'attack') {
                 this.state = 'chase';
                 this.stateTimer = 15; // Chase for longer if attacked
                 this.stateData.target = player;
                 this.targetPosition = null; // Stop current movement goal
                 console.log(`Hunter ${this.id} damaged by player, switching to CHASE.`);
             } else if (player && this.state === 'patrol') { // If patrolling, switch to chase immediately
                 this.state = 'chase';
                 this.stateTimer = 15;
                 this.stateData.target = player;
                 this.targetPosition = null;
             }
        }

        return false; // Survived
    }

    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.state = 'dead';
        this.velocity.set(0, 0, 0);
        console.log('Hunter died');

        // Play death animation/ragdoll (simple rotation)
        if (this.model) {
             const targetRotX = -Math.PI / 2;
             const targetRotZ = Math.random() * 0.5 - 0.25;
             BABYLON.Animation.CreateAndStartAnimation(
                 `death_rot_${this.id}`, this.model, 'rotation', 60, 30,
                 this.model.rotation.clone(),
                 new BABYLON.Vector3(targetRotX, this.model.rotation.y, targetRotZ),
                 BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                 new BABYLON.ExponentialEase()
             );
             // Disable collisions for the dead model
             this.model.checkCollisions = false;
             // Make non-pickable
             this.model.isPickable = false;
             this.model.getChildMeshes(false).forEach(m => {
                m.isPickable = false;
                // Maybe remove from shadow map? Optional.
                // const shadowMap = this.game.shadowGenerator?.getShadowMap();
                // const renderList = shadowMap?.renderList;
                // if (renderList) {
                //     const index = renderList.indexOf(m);
                //     if (index > -1) renderList.splice(index, 1);
                // }
             });
        }

        // Spawn drops (add to inventory directly for now)
        this.spawnDrops();

        // Delay removal
        setTimeout(() => {
            if (this.model) {
                this.model.dispose(false, true); // Dispose node and its children/meshes
                this.model = null;
            }
            // Notify entity manager AFTER delay
            this.game.entityManager.removeEntity(this.id);
        }, 5000); // Keep body for 5 seconds
    }

    spawnDrops() {
        if (!this.drops || !this.game.inventory) return;
        this.drops.forEach(drop => {
            if (Math.random() <= drop.chance) {
                let amount;
                if (Array.isArray(drop.amount)) {
                    amount = Utils.random(drop.amount[0], drop.amount[1]);
                } else {
                    amount = drop.amount;
                }
                if (amount > 0) {
                    // TODO: Drop item on ground
                    console.log(`[DROPS] Hunter dropping ${amount}x ${drop.id} (Not Implemented)`);
                    // Placeholder: Add to inventory
                    this.game.inventory.addItem(drop.id, amount);
                     this.game.uiManager?.showNotification(`Looted ${drop.id} x${amount}`, 2000);
                }
            }
        });
    }
}

// --- END OF FILE AIHunter.js ---