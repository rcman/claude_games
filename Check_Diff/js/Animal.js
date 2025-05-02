// --- START OF FILE Animal.js ---

class Animal {
    constructor(game, type, position) { // Position should be a simple {x, y, z} object initially
        this.game = game;
        this.scene = game.scene; // Store scene reference

        let animalDef = Constants?.ANIMALS?.TYPES?.find(a => a.id === type);
        if (!animalDef) {
            console.error(`Unknown or undefined animal type in Constants: ${type}`);
            animalDef = Constants?.ANIMALS?.TYPES?.find(a => a.id === 'rabbit') || {
                 id: 'unknown', name: 'Unknown Animal', health: 10, damage: 0, speed: 1, drops: [], aggressive: false, scale: 0.5 // Provide default scale
             };
             console.warn(`Using fallback definition: ${animalDef.name}`);
        }
        this.type = animalDef.id;
        this.name = animalDef.name;
        this.health = animalDef.health;
        this.maxHealth = animalDef.health;
        this.damage = animalDef.damage;
        this.speed = animalDef.speed;
        this.drops = animalDef.drops || [];
        this.isAggressive = animalDef.aggressive || false;
        this.scale = animalDef.scale || 1.0; // Get scale from definition

        this.id = `animal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Position and movement state (Use BABYLON vectors)
        this.position = new BABYLON.Vector3(position.x, position.y, position.z);
        this.rotationY = Math.random() * Math.PI * 2; // Store Y rotation
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.targetPosition = null;
        this.onGround = false;

        // AI State
        this.state = 'idle';
        this.stateTimer = Utils.randomFloat(2, 7);
        this.stateData = {};
        this.isAlive = true;

        // Perception settings
        this.sightRange = 20;
        this.aggroRange = this.isAggressive ? 15 : 0;
        this.fleeRange = 8;

        // Visuals (Babylon Node - Mesh or TransformNode)
        this.model = null;
        this.animationGroups = []; // Store animation groups for controlling GLB animations

        try {
            this.createModel(); // Needs adaptation
        } catch (error) {
            console.error(`Error creating model for animal ${this.type} (${this.id}):`, error);
            if (this.model?.dispose) { // Check if model exists and has dispose method
                 this.model.dispose(false, true); // Dispose hierarchy and meshes
            }
            this.model = null;
        }
    }

    // --- MODIFIED TO HANDLE BABYLON MESHES/NODES ---
    createModel() {
        const modelAsset = this.game.assetLoader.getModel(this.type); // Returns { modelGroup, scale, animationGroups } or BABYLON.Mesh

        if (!modelAsset) {
            console.error(`Model asset is null or undefined for animal type: ${this.type}.`);
            this.createFallbackModel(); // Create a simple fallback
            return;
        }

        if (modelAsset instanceof BABYLON.Mesh) {
             // It's a primitive fallback from AssetLoader
             console.warn(`Using primitive fallback model for animal type: ${this.type}`);
             this.model = modelAsset;
             this.model.scaling.setAll(this.scale); // Apply scale definition
             // Apply a basic material if needed (AssetLoader might not add one)
             if (!this.model.material) {
                 this.model.material = new BABYLON.StandardMaterial(this.type + "_mat", this.scene);
                 this.model.material.diffuseColor = BABYLON.Color3.Gray(); // Simple grey
             }
         } else if (modelAsset.modelGroup instanceof BABYLON.Node) {
            // It's a GLB model structure
            this.model = modelAsset.modelGroup; // Assign the cloned node/hierarchy
            this.model.scaling.setAll(this.scale); // Apply scale from definition
            this.animationGroups = modelAsset.animationGroups || []; // Store animation groups

            // Optionally override materials (can be complex for GLBs)
            // For now, let's assume GLB materials are okay or need external setup
            this.model.setEnabled(true); // Ensure it's enabled (AssetLoader clones disabled)
             // Ensure all child meshes are enabled too
             this.model.getChildMeshes(false).forEach(m => {
                 m.setEnabled(true);
                 m.castShadow = true; // Enable shadows
                 m.receiveShadows = true;
                 // Add to shadow generator render list
                 this.game.shadowGenerator?.getShadowMap()?.renderList?.push(m);
             });

         } else {
             console.error(`Unexpected model data structure received for animal type: ${this.type}.`, modelAsset);
             this.createFallbackModel(); // Create a simple fallback
             return;
         }


        // Common setup for any model created
        if (!this.model) {
             console.error("Model creation failed unexpectedly for", this.type);
             return;
         }

        this.model.position = this.position.clone(); // Use Babylon vectors
        this.model.rotation.y = this.rotationY;
        this.model.name = `animal_${this.type}_${this.id}`; // Set name for debugging
        this.model.metadata = { entityId: this.id }; // Link model to entity ID

        // Add to scene (Babylon automatically parents to scene root if no parent specified)
        // No explicit scene.add needed if the model was created with the scene context

        this.checkTerrainCollisions(0.01);
        if (!this.onGround) {
             const initialHeight = this.game.terrain?.getHeightAt(this.position.x, this.position.z);
             if (initialHeight !== undefined && initialHeight !== null) {
                 this.position.y = initialHeight + 0.1;
             } else {
                 this.position.y = (Constants?.WORLD?.WATER_LEVEL ?? 2) + this.scale; // Adjust height based on scale
             }
             this.model.position.y = this.position.y;
             console.warn(`Animal ${this.id} (${this.type}) spawned slightly above ground.`);
        }

         // Start default animation (e.g., idle) if available
         this.playAnimation('idle', true); // Loop idle animation
    }

    createFallbackModel() {
         console.warn(`Creating primitive fallback model for ${this.type}`);
         this.model = BABYLON.MeshBuilder.CreateBox(`fallback_${this.type}_${this.id}`, { size: 1 }, this.scene);
         this.model.scaling.setAll(this.scale);
         this.model.material = new BABYLON.StandardMaterial(this.type + "_fallback_mat", this.scene);
         this.model.material.diffuseColor = BABYLON.Color3.Magenta(); // Bright color for visibility
         this.model.setEnabled(true);
         this.model.castShadow = true;
         this.model.receiveShadow = true;
         this.game.shadowGenerator?.getShadowMap()?.renderList?.push(this.model);
    }

    // --- Animation Helper ---
    playAnimation(name, loop = false, speed = 1.0) {
        if (!this.model || this.animationGroups.length === 0) return;

        // Stop all other animations first
        this.animationGroups.forEach(ag => ag.stop());

        // Find the animation group by name (adjust matching logic if needed)
        const animGroup = this.animationGroups.find(ag => ag.name.toLowerCase().includes(name.toLowerCase()));

        if (animGroup) {
            // console.log(`Playing animation '${animGroup.name}' for ${this.id}`); // DEBUG
            animGroup.start(loop, speed); // Start the animation
        } else {
            // console.warn(`Animation '${name}' not found for ${this.id}`); // DEBUG
            // Optionally play a default animation like 'idle' if the requested one isn't found
            const idleAnim = this.animationGroups.find(ag => ag.name.toLowerCase().includes('idle'));
            if (idleAnim && name !== 'idle') { // Avoid infinite loop if idle is missing
                idleAnim.start(true, 1.0);
            }
        }
    }

    // --- UPDATE METHODS ---
    update(deltaTime) {
        if (!this.isAlive || !this.model) return; // Check model exists
        this.updateState(deltaTime);
        this.updateMovement(deltaTime);
        this.checkTerrainCollisions(deltaTime);
        this.updateModel();
    }

    updateState(deltaTime) {
        this.stateTimer -= deltaTime;
        this.checkPerception();

        let targetAnim = 'idle'; // Default animation

        if (this.stateTimer <= 0 && this.state !== 'chase' && this.state !== 'flee' && this.state !== 'attack') {
            this.chooseNewState();
        }

        switch (this.state) {
            case 'idle':
                this.velocity.x *= 0.8; this.velocity.z *= 0.8;
                targetAnim = 'idle';
                 break;
            case 'wander':
                if (this.hasReachedTarget()) { this.targetPosition = null; this.chooseNewState(); }
                else if (!this.targetPosition) { this.setRandomTargetPosition(); }
                targetAnim = 'walk'; // Or 'run' depending on speed
                 break;
            case 'flee':
                if (this.stateData.threat) {
                    // Flee logic using BABYLON vectors
                     const fleeDir = this.position.subtract(this.stateData.threat.position).normalize(); fleeDir.y = 0; // Use Babylon methods
                    if (this.stateTimer <= 0 || !this.targetPosition) { const d = 20; this.targetPosition = this.position.add(fleeDir.scale(d)); this.stateTimer = 1.0; }
                    const dist = BABYLON.Vector3.Distance(this.position, this.stateData.threat.position);
                    if (dist > this.sightRange * 1.5) { this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null; }
                    targetAnim = 'run';
                } else { this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null; }
                 break;
            case 'chase':
                if (this.stateData.target) {
                    this.targetPosition = this.stateData.target.position.clone(); // Use Babylon clone
                    const dist = BABYLON.Vector3.Distance(this.position, this.stateData.target.position);
                    const range = 2.0 * (this.scale || 1.0); // Attack range based on scale
                    if (dist < range) { this.attack(this.stateData.target); targetAnim = 'attack';} // Trigger attack animation
                    else if (dist > this.sightRange * 1.2) { this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null; }
                    else { targetAnim = 'run'; }
                } else { this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null; }
                 break;
            case 'attack':
                 if (this.stateData.target) { this.faceTarget(this.stateData.target.position); this.velocity.x *= 0.5; this.velocity.z *= 0.5; }
                 if (this.stateTimer <= 0) {
                    if (this.stateData.target) {
                         const dist = BABYLON.Vector3.Distance(this.position, this.stateData.target.position);
                         const range = 2.0 * (this.scale || 1.0);
                         this.state = (dist > range * 1.2) ? 'chase' : 'attack'; // Keep attacking if still close
                         this.stateTimer = (dist > range * 1.2) ? 0.5 : 0.2; // Re-evaluate chase/attack
                         targetAnim = this.state === 'chase' ? 'run' : 'attack';
                     }
                    else { this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null; }
                 } else {
                    targetAnim = 'attack'; // Stay in attack animation
                 }
                 break;
        }

         // Play the determined animation
         this.playAnimation(targetAnim, true); // Loop walk/idle/run/attack
    }

    chooseNewState() {
        if (Math.random() < 0.7) { this.state = 'wander'; this.stateTimer = Utils.randomFloat(8, 15); this.setRandomTargetPosition(); }
        else { this.state = 'idle'; this.stateTimer = Utils.randomFloat(3, 8); this.targetPosition = null; }
        this.stateData = {};
    }

    setRandomTargetPosition() {
        const radius = 20; const angle = Math.random() * Math.PI * 2; const dist = Utils.randomFloat(5, radius);
        const tX = this.position.x + Math.cos(angle) * dist; const tZ = this.position.z + Math.sin(angle) * dist;
        const size = Constants?.WORLD?.SIZE ?? 1000;
        const half = size / 2 - 5; const cX = Math.max(-half, Math.min(half, tX)); const cZ = Math.max(-half, Math.min(half, tZ));
        let tY = this.position.y;
        if (this.game.terrain?.getHeightAt) {
             tY = this.game.terrain.getHeightAt(cX, cZ);
             if (tY === undefined) { tY = this.position.y; console.warn("Failed to get target height for wander.");}
             else if (tY < (Constants?.WORLD?.WATER_LEVEL ?? 2) - 0.5) {
                 this.targetPosition = null; this.state = 'idle'; this.stateTimer = 0.5; return; // Don't wander into deep water
             }
        }
        this.targetPosition = new BABYLON.Vector3(cX, tY, cZ); // Use Babylon Vector3
    }

    hasReachedTarget() {
        if (!this.targetPosition) return true;
        // Check distance using only XZ plane for reaching target
        const dx = this.position.x - this.targetPosition.x;
        const dz = this.position.z - this.targetPosition.z;
        return (dx * dx + dz * dz) < 1.0 * 1.0; // Use squared distance
    }

    updateMovement(deltaTime) {
        const targetSpeed = this.calculateTargetSpeed();

        if (this.targetPosition && this.state !== 'idle' && this.state !== 'attack') {
            // Use Babylon vectors
            const dir = this.targetPosition.subtract(this.position);
            dir.y = 0; // Keep movement horizontal

            if (dir.lengthSquared() > 0.1 * 0.1) { // Check against squared small threshold
                dir.normalize();
                const accel = 15.0;
                // Use Babylon vector methods for velocity update
                 this.velocity.x += dir.x * accel * deltaTime;
                 this.velocity.z += dir.z * accel * deltaTime;

                 // Clamp speed
                 const speedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
                 if (targetSpeed > 0 && speedSq > targetSpeed * targetSpeed) {
                     const currentSpeed = Math.sqrt(speedSq);
                     this.velocity.x = (this.velocity.x / currentSpeed) * targetSpeed;
                     this.velocity.z = (this.velocity.z / currentSpeed) * targetSpeed;
                 }
            } else {
                 this.velocity.x *= (1 - 10 * deltaTime);
                 this.velocity.z *= (1 - 10 * deltaTime);
            }
             // Update rotation smoothly
             if (this.velocity.lengthSquared() > 0.05 * 0.05) {
                 const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
                 let deltaRot = targetRotation - this.rotationY;
                 while (deltaRot > Math.PI) deltaRot -= Math.PI * 2;
                 while (deltaRot < -Math.PI) deltaRot += Math.PI * 2;
                 // Adjust rotation speed (smaller values = slower turn)
                 this.rotationY += deltaRot * 6.0 * deltaTime;
             }
        } else {
            // Apply friction if idle or attacking
            this.velocity.x *= (1 - 8 * deltaTime);
            this.velocity.z *= (1 - 8 * deltaTime);
        }

        if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
        if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;

        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        // Gravity and Y position update happens in checkTerrainCollisions
    }

    calculateTargetSpeed() { /* ... (logic remains the same) ... */ }

    updateModel() {
        if (!this.model) return;
        this.model.position.copyFrom(this.position); // Sync model position
        // Normalize rotation
        while (this.rotationY > Math.PI) this.rotationY -= Math.PI * 2;
        while (this.rotationY < -Math.PI) this.rotationY += Math.PI * 2;
        this.model.rotation.y = this.rotationY; // Sync model rotation

        // Animation state transitions handled in updateState
    }

    checkTerrainCollisions(deltaTime) {
        if (!this.isAlive || !this.model) return; // Check model exists

        const gravity = Constants?.WORLD?.GRAVITY ?? 9.8;
        let terrainHeight = this.position.y - 1.0; // Default below current pos
        let isOverWater = true;

        if (this.game.terrain?.getHeightAt) {
             try {
                 terrainHeight = this.game.terrain.getHeightAt(this.position.x, this.position.z);
                 if (terrainHeight === undefined) {
                     console.warn(`Terrain height undefined for ${this.id} at ${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}`);
                     terrainHeight = this.position.y - 1.0; // Use fallback
                 } else {
                    isOverWater = terrainHeight < (Constants?.WORLD?.WATER_LEVEL ?? 2);
                 }
             } catch (e) { console.error(`Error getting terrain height for ${this.id}:`, e); terrainHeight = this.position.y - 1.0; }
         }

        const groundCheckOffset = 0.1 * this.scale; // Adjust offset by scale

        // Apply gravity if not on ground
        if (!this.onGround) {
            this.velocity.y -= gravity * deltaTime;
        }

        // Update Y position based on velocity
        this.position.y += this.velocity.y * deltaTime;

        // Check for ground collision
        if (this.position.y <= terrainHeight + groundCheckOffset) {
            this.position.y = terrainHeight; // Snap to terrain height
            this.velocity.y = 0; // Stop vertical movement
            this.onGround = true;
            this.isJumping = false; // Landed
        } else {
            this.onGround = false;
        }

        // Water avoidance logic (remains similar, ensure targetPosition is Babylon.Vector3)
         const waterLevel = Constants?.WORLD?.WATER_LEVEL ?? 2;
         const feetUnderwater = this.position.y < waterLevel;
         if (feetUnderwater && this.state !== 'flee') {
            console.log(`${this.id} entered water, fleeing.`); // DEBUG
            this.state = 'flee'; this.stateTimer = 5; let bestTarget = null; let minDistSq = Infinity;
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
            else { this.setRandomTargetPosition(); } // Find any random spot if no dry land found nearby
         }
    }

    checkPerception() {
         if (!this.isAlive) return;
        if (this.state === 'flee' && this.stateData.threat) { const dist = BABYLON.Vector3.Distance(this.position, this.stateData.threat.position); if (dist > this.sightRange * 1.5) { this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null; } return; }
         if (this.state === 'attack') return;
        if (!this.game.playerController) return; const player = this.game.playerController; const dist = BABYLON.Vector3.Distance(this.position, player.position);
        if (dist <= this.sightRange) {
             // TODO: Add Line of Sight check (Raycast)
             const canSeePlayer = true; // Placeholder
             if (canSeePlayer) {
                 if (this.isAggressive && dist <= this.aggroRange) { if (this.state !== 'chase') { this.state = 'chase'; this.stateTimer = 15; this.stateData.target = player; this.targetPosition = null; } }
                 else if (!this.isAggressive && dist <= this.fleeRange) { if (this.state !== 'flee') { this.state = 'flee'; this.stateTimer = 8; this.stateData.threat = player; this.targetPosition = null; } }
             }
         } else {
             // Lose chase if target gets too far
             if (this.state === 'chase' && this.stateData.target === player) {
                 this.state = 'wander'; this.stateTimer = Utils.randomFloat(5, 10); this.stateData = {}; this.targetPosition = null;
             }
         }
    }


    faceTarget(targetPosition) {
        if (!targetPosition || !(targetPosition instanceof BABYLON.Vector3)) return;
        const targetRotation = Math.atan2(targetPosition.x - this.position.x, targetPosition.z - this.position.z);
        let deltaRot = targetRotation - this.rotationY;
        while (deltaRot > Math.PI) deltaRot -= Math.PI * 2;
        while (deltaRot < -Math.PI) deltaRot += Math.PI * 2;
        // Faster turning when attacking/facing
        this.rotationY += deltaRot * 15.0 * (this.game.deltaTime || 0.016); // Use game deltaTime
    }

    attack(target) {
        if (!this.isAlive || this.state === 'attack') return; this.state = 'attack'; this.stateTimer = 1.0; this.stateData.target = target; this.targetPosition = null; this.velocity.x = 0; this.velocity.z = 0; // Stop moving
        this.faceTarget(target.position);
        // Trigger attack animation (already handled in updateState)
        // Damage dealt after a short delay
        setTimeout(() => {
             if (!this.isAlive || this.state !== 'attack' || this.stateData.target !== target || !target) return;
             const dist = BABYLON.Vector3.Distance(this.position, target.position);
             const range = 2.5 * (this.scale || 1.0);
             if (dist < range) {
                 if (target === this.game.playerController && this.game.characterStats) {
                     this.game.characterStats.takeDamage(this.damage, this.type);
                 }
             } else {
                // Target moved out of range during wind-up, switch back to chase
                this.state = 'chase'; this.stateTimer = 0.1;
             }
            // Reset state timer after attack attempt delay, so it can re-evaluate in updateState
             // this.stateTimer = 0; // No, let updateState handle transition based on distance
        }, 300); // Delay attack damage slightly
    }

    takeDamage(amount, source) {
         if (!this.isAlive) return false; this.health -= amount;
         // TODO: Add visual feedback (flash red?)
         if (this.health <= 0) { this.die(source); return true; }
          // Aggro logic
          if (source === 'player' || source === 'hunter') {
             const attacker = (source === 'player') ? this.game.playerController : this.game.entityManager?.getEntity(source); // Find hunter entity if source is 'hunter'
             if (attacker) {
                 if (this.isAggressive) {
                    if (this.state !== 'chase') { this.state = 'chase'; this.stateTimer = 20; this.stateData.target = attacker; this.targetPosition = null; }
                 } else {
                    if (this.state !== 'flee') { this.state = 'flee'; this.stateTimer = 10; this.stateData.threat = attacker; this.targetPosition = null; }
                 }
             }
         } return false;
     }


    die(source = 'unknown') {
        if (!this.isAlive) return;
        this.isAlive = false; this.state = 'dead'; this.velocity.set(0, 0, 0);
        console.log(`${this.name} (${this.id}) died (killed by ${source})`);

        // Stop animations
         this.animationGroups.forEach(ag => ag.stop());

        // Play death animation/ragdoll (simple rotation for now)
        if (this.model) {
            // Rotate onto side - might need adjustment based on model orientation
            const targetRotX = -Math.PI / 2;
            const targetRotZ = Math.random() * 0.5 - 0.25; // Slight random Z tilt
            // Animate using Babylon's animation system for smoother results
            BABYLON.Animation.CreateAndStartAnimation(
                `death_rot_${this.id}`, this.model, 'rotation', 60, 30, // name, target, prop, fps, frames
                this.model.rotation.clone(), // from value
                new BABYLON.Vector3(targetRotX, this.model.rotation.y, targetRotZ), // to value
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                new BABYLON.ExponentialEase()
            );
             // Disable collisions for the dead model
             this.model.checkCollisions = false;
             // Make non-pickable
             this.model.isPickable = false;
        }

        if (this.game.inventory) { this.spawnDrops(); } else { console.warn("Inventory system not available for drops."); }

        // Delay removal and cleanup
        setTimeout(() => {
             if (this.model) {
                 this.model.dispose(false, true); // Dispose mesh and hierarchy
                 this.model = null;
             }
             this.game.entityManager?.removeEntity(this.id); // Notify manager AFTER delay
         }, 5000); // Keep body for 5 seconds
    }

    spawnDrops() {
        if (!this.drops || !this.game.inventory) return;
        this.drops.forEach(drop => {
             if(!drop || !drop.id || !drop.amount) return; let amount = 0;
             if (Array.isArray(drop.amount)) { const min = Number(drop.amount[0]) || 0; const max = Number(drop.amount[1]) || min; amount = Utils.random(min, Math.max(min, max)); }
             else { amount = Number(drop.amount) || 0; }
             if (amount > 0) {
                 // TODO: Implement dropping items on the ground instead of direct inventory add
                 console.log(`[DROPS] Spawning ${amount}x ${drop.id} at animal position (Not Implemented)`);
                 // Placeholder: Add directly to inventory
                 this.game.inventory.addItem(drop.id, amount);
                 this.game.uiManager?.showNotification(`Harvested ${drop.id} x${amount}`, 2000);
             }
        });
    }
}

// --- END OF FILE Animal.js ---