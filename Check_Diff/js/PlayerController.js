// --- START OF FILE PlayerController.js ---

class PlayerController {
    constructor(game) {
        this.game = game;
        this.scene = game.scene; // Store scene reference
        this.camera = game.camera; // Get camera from game
        this.canvas = game.canvas; // Get canvas for input

        // Use Babylon Vectors
        this.position = new BABYLON.Vector3(0, 10, 0); // Initial position, will be set by Game.js
        this.velocity = new BABYLON.Vector3(0, 0, 0);

        // Rotation: Babylon FreeCamera handles pitch/yaw internally via rotationQuaternion or rotation
        // Store player's Y rotation separately for movement calculations relative to body.
        this.rotationY = 0;
        // Camera pitch (X rotation) is read from camera.rotation.x

        // Keep constants
        this.moveSpeed = Constants.PLAYER.MOVE_SPEED;
        this.sprintSpeed = Constants.PLAYER.SPRINT_SPEED;
        this.jumpForce = Constants.PLAYER.JUMP_FORCE;
        this.interactionRange = Constants.PLAYER.INTERACTION_RANGE;
        this.cameraHeight = Constants.PLAYER.CAM_HEIGHT; // Offset from player feet
        this.reloadTime = Constants.PLAYER.RELOAD_TIME;

        // Movement state (keep similar)
        this.moveForward = false; this.moveBackward = false;
        this.moveLeft = false; this.moveRight = false;
        this.isSprinting = false; this.isJumping = false;
        this.onGround = false; this.isMoving = false;

        // Interaction/Building state (keep similar structure)
        this.buildMode = false; this.selectedBuildItem = null;
        this.buildPreview = null; // Will be a Babylon Mesh/Node
        this.buildRotation = 0;

        // Weapon state (keep similar)
        this.weaponCooldownTimer = 0; this.isReloading = false; this.reloadTimer = 0;

        // Flashlight State
        this.flashlight = null; // Will be a Babylon SpotLight
        this.isFlashlightOn = false;

        // Player model (Placeholder - can be a simple capsule or loaded GLB)
        this.playerModel = null; // Will be a Babylon Mesh/Node
        this.createPlayerModel(); // Create the collision capsule
    }

    createPlayerModel() {
        // Create a capsule for collisions. It will be invisible.
        // Height calculation: Total height = cylinder part + 2 * radius cap
        // Let capsule height be total height - 2*radius
        const radius = 0.4;
        const totalHeight = 1.8;
        const capsuleHeight = totalHeight - (2 * radius);

        this.playerModel = BABYLON.MeshBuilder.CreateCapsule("playerCollider", {
             radius: radius,
             height: capsuleHeight, // Height of the cylindrical part + caps
             tessellation: 16
        }, this.scene);

        this.playerModel.position = this.position.clone(); // Initial sync
        this.playerModel.isVisible = false; // Invisible collider
        this.playerModel.checkCollisions = true; // Enable collision checking

        // Ellipsoid for collision detection (radius, half-height of CYLINDER part, radius)
        // Half-height needs careful calculation: it's the distance from center to the start of the cap.
        // Center of capsule mesh is at the center of the cylindrical part.
        const cylinderHalfHeight = capsuleHeight / 2;
        this.playerModel.ellipsoid = new BABYLON.Vector3(radius, cylinderHalfHeight + radius, radius); // Use total half-height for ellipsoid Y
        // Offset from the mesh center (which is center of cylinder part) down to the feet.
        this.playerModel.ellipsoidOffset = new BABYLON.Vector3(0, -(cylinderHalfHeight + radius), 0);
        // this.playerModel.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0); // Center ellipsoid on mesh origin


        console.log("Player Collider Capsule created.");
        console.log("Ellipsoid:", this.playerModel.ellipsoid);
        console.log("Offset:", this.playerModel.ellipsoidOffset);
    }


    setupInputHandlers() {
        // Using document listeners for now

        const handleKeyDown = (e) => {
            // Prevent game actions if UI is focused or specific menus are open
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                 // Allow Escape even when input focused
                 if (e.key === 'Escape') {
                    if (this.game.uiManager?.isInventoryOpen) this.game.uiManager.toggleInventory();
                    else if (this.buildMode) this.toggleBuildMode(); // Use toggle to clean up build mode state
                    else if (this.game.uiManager?.isCraftingMenuOpen) this.game.uiManager.closeCraftingMenu();
                    else if (this.game.uiManager?.isDebugMenuOpen) this.game.uiManager.toggleDebugMenu();
                    else if (this.game.uiManager?.isPauseMenuOpen) this.game.resume();
                    document.activeElement.blur(); // Remove focus
                }
                return; // Don't process other game keys
            }

            // Don't process movement etc. if certain UI is blocking interaction
            if (this.game.uiManager?.isInventoryOpen || this.game.uiManager?.isCraftingMenuOpen || this.game.uiManager?.isBuildMenuOpen || this.game.uiManager?.isPauseMenuOpen || this.game.uiManager?.isDebugMenuOpen) {
                // Allow Escape here too, handled by UIManager's listener generally
                // Allow number keys for quickbar selection even if UI is open? No, usually disabled.
                return;
            }


             // --- Movement ---
             switch (e.key.toLowerCase()) {
                 case 'w': this.moveForward = true; break;
                 case 's': this.moveBackward = true; break;
                 case 'a': this.moveLeft = true; break;
                 case 'd': this.moveRight = true; break;
                 case ' ': if (this.onGround && !this.isJumping) this.jump(); break; // Added break
                 case 'shift': this.isSprinting = true; break;
                 // --- Actions ---
                 case 'e': this.interact(); break;
                 case 'b': this.toggleBuildMode(); break;
                 case 'r':
                      if (!this.buildMode) this.reloadWeapon();
                      else this.rotateBuildPreview();
                      break; // Added break
                 case 'f': this.toggleFlashlight(); break;
                 case 'g': this.game.toggleGodMode(); break;
                 // --- UI Toggles are handled by UIManager listener ---
             }
             this.isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        };

        const handleKeyUp = (e) => {
             // No need to check for focused input on keyup usually
             switch (e.key.toLowerCase()) {
                 case 'w': this.moveForward = false; break;
                 case 's': this.moveBackward = false; break;
                 case 'a': this.moveLeft = false; break;
                 case 'd': this.moveRight = false; break;
                 case 'shift': this.isSprinting = false; break;
             }
             this.isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        };

        // Attach listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Mouse Clicks (using scene observable)
        this.scene.onPointerDown = (evt, pickInfo, type) => { // Added 'type' parameter
            // Check if pointer lock is active
            if (!this.game.engine.isPointerLock) {
                // If UI is not open, request pointer lock
                if (!this.game.uiManager?.isAnyMenuOpen()) { // Use helper function if available
                    console.log("Requesting pointer lock on click...");
                    this.game.engine.enterPointerlock();
                }
                return; // Don't process game actions if not locked
            }

            // Pointer is locked, process game actions based on button
             const button = evt.button; // 0: Left, 1: Middle, 2: Right

            if (button === 0) { // Left mouse
                if (this.buildMode && this.selectedBuildItem && this.buildPreview?.isEnabled()) {
                    this.build();
                } else if (!this.buildMode) {
                    this.shoot(); // Handles both shooting and harvesting
                }
            } else if (button === 2) { // Right mouse
                if (this.buildMode) {
                    this.toggleBuildMode(); // Exit build mode
                } else {
                    // Aim down sights or other action
                }
            }
        };
    }

    createFlashlight() {
        if (!this.flashlight) {
            this.flashlight = new BABYLON.SpotLight(
                "playerFlashlight",
                new BABYLON.Vector3(0.2, -0.3, 0.1), // Position relative to camera origin
                new BABYLON.Vector3(0, 0, 1),    // Direction relative to camera view (Z-forward)
                Constants.PLAYER.FLASHLIGHT_ANGLE, // Angle in radians
                Constants.PLAYER.FLASHLIGHT_PENUMBRA, // Exponent (controls softness)
                this.scene
            );
            this.flashlight.intensity = 0; // Start off
            this.flashlight.range = Constants.PLAYER.FLASHLIGHT_RANGE;
            this.flashlight.shadowEnabled = true; // Enable shadows if needed (can be expensive)
            // Link light direction to camera direction (will be updated)
            // Parenting is simpler:
            this.flashlight.parent = this.camera;
        }
    }

    toggleFlashlight() {
        if (!this.flashlight) { this.createFlashlight(); }
        if (this.flashlight) {
             this.isFlashlightOn = !this.isFlashlightOn;
             this.flashlight.intensity = this.isFlashlightOn ? Constants.PLAYER.FLASHLIGHT_INTENSITY : 0;
             this.game.uiManager?.showNotification(`Flashlight ${this.isFlashlightOn ? 'ON' : 'OFF'}`, 1000);
         } else { console.error("Failed to create flashlight."); }
    }

    update(deltaTime) {
        if (!deltaTime || deltaTime <= 0 || !this.game.running) return; // Added game running check

        if (this.weaponCooldownTimer > 0) { this.weaponCooldownTimer -= deltaTime; }
        if (this.isReloading) {
             this.reloadTimer -= deltaTime;
             if (this.reloadTimer <= 0) {
                 this.isReloading = false;
                 this.game.uiManager?.updateWeaponUI(this.getSelectedTool());
             }
         }

        this.updateMovement(deltaTime);
        this.updateCamera(); // Update camera AFTER position/movement calculations
        // this.updatePlayerModel(); // Sync invisible model position if using moveWithCollisions
    }

    updateMovement(deltaTime) {
        const currentMoveSpeed = (this.isSprinting && this.game.characterStats.stamina > 0) ? this.sprintSpeed : this.moveSpeed;
        const effectiveSpeed = this.game.isGodMode ? this.sprintSpeed * 1.5 : currentMoveSpeed;
        const gravity = Constants.WORLD.GRAVITY;

        // --- Calculate Move Direction based on Camera Rotation ---
        let inputDirection = BABYLON.Vector3.Zero();
        if (this.moveForward) inputDirection.z += 1;
        if (this.moveBackward) inputDirection.z -= 1;
        if (this.moveLeft) inputDirection.x -= 1;
        if (this.moveRight) inputDirection.x += 1;

        // Get camera's local rotation matrix
        const cameraRotationMatrix = this.camera.getWorldMatrix().getRotationMatrix();

        // Transform input direction by camera rotation
        let moveDirection = BABYLON.Vector3.Zero();
        if (inputDirection.lengthSquared() > 0) {
            inputDirection.normalize();
            moveDirection = BABYLON.Vector3.TransformNormal(inputDirection, cameraRotationMatrix);
            moveDirection.y = 0; // Keep movement horizontal
            moveDirection.normalize();

            // Apply speed
            this.velocity.x = moveDirection.x * effectiveSpeed;
            this.velocity.z = moveDirection.z * effectiveSpeed;

            // Sprinting stamina drain
            if (this.isSprinting && !this.game.isGodMode && this.game.characterStats.stamina > 0) {
                 this.game.characterStats?.useStamina(Constants.PLAYER.STAMINA_SPRINT_DRAIN * deltaTime);
                 if (this.game.characterStats.stamina <= 0) { this.isSprinting = false; }
             } else if (this.isSprinting && this.game.characterStats.stamina <=0) {
                this.isSprinting = false; // Stop sprinting if out of stamina
             }
        } else {
            // Apply friction
            const friction = this.onGround ? 15 : 2; // Increase air friction slightly
            this.velocity.x *= (1 - friction * deltaTime);
            this.velocity.z *= (1 - friction * deltaTime);
            // Clamp small velocities to zero
            if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
        }

         // Apply Gravity
         if (!this.onGround) {
             this.velocity.y -= gravity * deltaTime;
         }

        // --- Collision & Movement Application ---
        // Using moveWithCollisions on the invisible playerModel capsule
        if (this.playerModel && this.playerModel.checkCollisions) {
             const deltaMove = this.velocity.scale(deltaTime);
             // Before moving, update the collider's position to the logical position
             // Center of capsule needs to be at logical pos + offset
             this.playerModel.position.copyFrom(this.position).addInPlace(this.playerModel.ellipsoidOffset);

             this.playerModel.moveWithCollisions(deltaMove);

             // After moving, update the logical position based on the collider's new center
             this.position.copyFrom(this.playerModel.position).subtractInPlace(this.playerModel.ellipsoidOffset);

             // Check if collisions stopped vertical movement (landed)
             if (this.velocity.y < 0 && this.playerModel.position.y <= this.position.y + this.playerModel.ellipsoidOffset.y + 0.05) { // Check slightly above feet pos
                this.handleLanding();
             } else if (!this.playerModel.collisionsEnabled) { // Edge case if collisions get disabled?
                this.onGround = false;
             }
             // Re-check ground explicitly with raycast *after* moveWithCollisions for more reliability
             this.checkGroundCollision();

         } else {
             // Fallback: Direct position update (no collision)
             this.position.x += this.velocity.x * deltaTime;
             this.position.y += this.velocity.y * deltaTime;
             this.position.z += this.velocity.z * deltaTime;
             this.checkGroundCollision(); // Still need ground check
         }

    }

    handleLanding() {
        // Check for fall damage only if falling speed was significant *before* landing
        if (this.velocity.y < -15) {
            const fallDamage = Math.abs(this.velocity.y + 15) * 2; // Damage based on excess speed
            this.game.characterStats?.takeDamage(fallDamage, 'fall');
        }
        this.velocity.y = 0;
        this.onGround = true;
        this.isJumping = false;
    }

    checkGroundCollision() {
        // Raycast down specifically to check if we are standing on something solid
        // This is important even with moveWithCollisions, as it doesn't perfectly report ground state
        const rayOrigin = this.position.add(new BABYLON.Vector3(0, 0.1, 0)); // Start slightly above feet
        const rayDirection = BABYLON.Vector3.Down();
        const rayLength = 0.3; // Short ray
        const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);

        // Only pick terrain and potentially buildings/structures flagged as ground
        const predicate = (mesh) => mesh.isPickable && mesh.isEnabled() && (
            mesh === this.game.terrain?.terrainMesh || mesh.metadata?.isGround === true
        );
        const pickInfo = this.scene.pickWithRay(ray, predicate);

        if (pickInfo && pickInfo.hit) {
             const groundDist = pickInfo.distance;
             // If hit distance is very small, consider grounded
             if (groundDist < 0.2) { // Allow slightly larger tolerance
                 if (!this.onGround && this.velocity.y < 0) {
                      // If we were falling and just hit ground via raycast, handle landing
                      this.position.y = pickInfo.pickedPoint.y; // Snap feet to ground
                      this.handleLanding();
                 } else if (this.velocity.y <=0) {
                     // Already grounded or moving slowly down, ensure Y velocity is 0
                     this.onGround = true;
                     this.isJumping = false;
                     this.velocity.y = 0;
                      // Snap feet precisely if slightly off
                     if (Math.abs(this.position.y - pickInfo.pickedPoint.y) > 0.01) {
                          this.position.y = pickInfo.pickedPoint.y;
                     }
                 }
             } else {
                 this.onGround = false;
             }
        } else {
             this.onGround = false;
        }
    }


    updateCamera() {
        // Camera position is logical feet position + height offset
        this.camera.position.copyFrom(this.position);
        this.camera.position.y += this.cameraHeight;

        // Camera rotation (pitch/yaw) is handled by FreeCamera.attachControl
        // Player body rotation (for movement calculations) syncs with camera yaw
        this.rotationY = this.camera.rotation.y;
    }

    // updatePlayerModel() { } // Not needed if using moveWithCollisions correctly

    jump() {
        const staminaCost = Constants.PLAYER.STAMINA_JUMP_COST;
        if (!this.game.isGodMode && this.game.characterStats.stamina < staminaCost) {
             this.game.uiManager?.showNotification("Not enough stamina to jump!", 1500); return;
        }
        if (this.onGround) {
             this.isJumping = true;
             this.onGround = false;
             this.velocity.y = this.jumpForce;
             if (!this.game.isGodMode) { this.game.characterStats?.useStamina(staminaCost); }
        }
    }

    interact() {
        const ray = this.camera.getForwardRay(this.interactionRange);
        const predicate = (mesh) => mesh.isPickable && mesh.isEnabled() && (mesh.metadata?.resourceId || mesh.metadata?.buildingId || mesh.metadata?.stationType || mesh.metadata?.entityId);
        const pickInfo = this.scene.pickWithRay(ray, predicate);

        let promptText = null;
        let interactTarget = null;

        if (pickInfo && pickInfo.hit && pickInfo.pickedMesh) {
            const mesh = pickInfo.pickedMesh;
            const metadata = mesh.metadata || {};
            const resource = metadata.resourceId ? this.game.resourceManager.getResource(metadata.resourceId) : null;

            if (metadata.stationType) {
                const stationName = Constants.ITEMS.WORKBENCH_CRAFTABLES.find(s => s.id === metadata.stationType)?.name || metadata.stationType;
                promptText = `[E] Open ${stationName}`;
                interactTarget = { type: 'station', stationType: metadata.stationType };
            } else if (resource && ['crate', 'barrel'].includes(resource.type)) {
                if (!resource.searched) {
                    promptText = `[E] Search ${resource.name || resource.type}`;
                    interactTarget = { type: 'searchable', resourceId: resource.id };
                } else {
                    promptText = `${resource.name || resource.type} (Searched)`;
                }
            } else if (resource && !['workbench', 'forge', 'campfire', 'structure', 'building', 'crate', 'barrel'].includes(resource.type)) {
                 // It's a potentially harvestable resource (tree, rock, plant)
                 const toolNeeded = this.getRequiredTool(resource.type);
                 const toolText = toolNeeded ? ` (Requires ${toolNeeded})` : ' (Hand)';
                 promptText = `[LMB] Harvest ${resource.name || resource.type}${toolText}`;
                 // Harvest is via LMB, so no 'E' interactTarget
             }
            // Add other interactable types like doors, base controller, etc.
        }

        if (promptText) this.game.uiManager?.showInteractionPrompt(promptText);
        else this.game.uiManager?.hideInteractionPrompt();

        // Handle E key press action
        if (interactTarget) {
            switch (interactTarget.type) {
                case 'station':
                    if (interactTarget.stationType === 'workbench') this.game.uiManager?.openWorkbenchMenu();
                    else if (interactTarget.stationType === 'forge') this.game.uiManager?.openForgeMenu();
                    else if (interactTarget.stationType === 'campfire') this.game.uiManager?.openCookingMenu();
                    break;
                case 'searchable':
                    this.game.resourceManager?.searchResource(interactTarget.resourceId, this);
                    this.game.uiManager?.hideInteractionPrompt(); // Hide after searching
                    break;
            }
        }
    }

    shoot() {
        // Prevent action if UI is open or on cooldown/reloading
        if (this.buildMode || this.game.uiManager?.isAnyMenuOpen() || (!this.game.isGodMode && (this.isReloading || this.weaponCooldownTimer > 0))) {
            return;
        }

        const equippedItem = this.getSelectedTool();
        const range = equippedItem?.range || this.interactionRange; // Weapon range or interaction range
        const ray = this.camera.getForwardRay(range);

        let didHit = false;

        // Raycast predicate - find closest hit object first
        const predicate = (mesh) => mesh.isPickable && mesh.isEnabled() && (mesh.metadata?.entityId || mesh.metadata?.resourceId);
        const pickInfo = this.scene.pickWithRay(ray, predicate);

        if (pickInfo && pickInfo.hit && pickInfo.pickedMesh) {
            const mesh = pickInfo.pickedMesh;
            const metadata = mesh.metadata || {};

            // --- Prioritize Entity Hit (if holding weapon) ---
            if (metadata.entityId && equippedItem && equippedItem.type === 'weapon') {
                 const entity = this.game.entityManager.getEntity(metadata.entityId);
                 if (entity?.isAlive && typeof entity.takeDamage === 'function') {
                     const weaponDef = this.game.inventory.getItemById(equippedItem.id);
                     if (weaponDef && (this.game.isGodMode || (equippedItem.currentAmmo != null && equippedItem.currentAmmo > 0))) {
                          if (!this.game.isGodMode) equippedItem.currentAmmo--;
                          this.weaponCooldownTimer = this.game.isGodMode ? 0.05 : (weaponDef.fireRate || 0.5);
                          entity.takeDamage(weaponDef.damage || 10, 'player');
                          this.game.uiManager?.updateWeaponUI(equippedItem);
                          didHit = true;
                          // TODO: Play shot sound, muzzle flash effect
                      } else if (weaponDef) {
                          this.game.uiManager?.showNotification("Reload needed! (Press R)", 2000);
                          didHit = true; // Consumes the action even if out of ammo
                      }
                  }
            }
            // --- Else, Check Resource Hit (Harvest) ---
            else if (metadata.resourceId && !didHit) {
                const resource = this.game.resourceManager.getResource(metadata.resourceId);
                // Only harvest non-container/station types
                if (resource?.health > 0 && !['crate', 'barrel', 'workbench', 'forge', 'campfire', 'structure', 'building'].includes(resource.type)) {
                     const requiredTool = this.getRequiredTool(resource.type);
                     // Check if hand-harvestable or if correct tool is equipped
                     const canHarvest = !requiredTool || (equippedItem && equippedItem.id === requiredTool) || ['fiber', 'blueberry', 'carrot', 'onion', 'medicinalherb', 'cloth'].includes(resource.type);

                     if (canHarvest) {
                          const harvested = this.game.resourceManager.harvestResource(resource.id, this);
                          if (harvested && Object.keys(harvested).length > 0) {
                               this.game.uiManager?.showHarvestNotification(harvested);
                           }
                          // Use tool swing speed or default
                          const toolDef = equippedItem ? this.game.inventory.getItemById(equippedItem.id) : null;
                          this.weaponCooldownTimer = toolDef?.fireRate || 0.5;
                          didHit = true;
                          // TODO: Play harvest sound effect
                      } else {
                          const toolName = requiredTool || 'the correct tool';
                          this.game.uiManager?.showNotification(`Need ${toolName} to harvest this.`, 2000);
                          didHit = true; // Consumes the action
                      }
                 }
            }
        }

        // --- Punch/Empty Swing if nothing was hit ---
        if (!didHit) {
            // console.log("Empty Swing!");
            this.weaponCooldownTimer = 0.5; // Cooldown for empty swing
        }
    }

    getRequiredTool(resourceType) {
        // Keep logic the same
        switch (resourceType) {
            case 'tree': return 'axe';
            case 'stone': case 'iron': case 'copper': case 'zinc': return 'pickaxe';
            case 'building': case 'structure': return 'axe';
            case 'fiber': case 'blueberry': case 'carrot': case 'onion': case 'medicinalherb': case 'cloth': return null;
            case 'animal': return 'knife'; // For harvesting dead animals
            default: return null;
        }
    }

    // --- Building Methods ---
    toggleBuildMode() {
        this.buildMode = !this.buildMode;
        if (this.buildMode) {
            this.game.uiManager?.openBuildMenu();
            if (!this.selectedBuildItem && this.game.buildingSystem?.getBuildingComponents().length > 0) {
                 this.setBuildItem(this.game.buildingSystem.getBuildingComponents()[0].id);
            } else if(this.selectedBuildItem) {
                 this.createBuildPreview();
            }
        } else {
            this.game.uiManager?.closeBuildMenu();
            this.removeBuildPreview();
            this.selectedBuildItem = null;
        }
        this.game.uiManager?.updateBuildMode(this.buildMode, this.selectedBuildItem);
    }

    setBuildItem(itemId) {
        // Ensure build mode is active
        if (!this.buildMode) {
             this.toggleBuildMode();
             // Need a slight delay potentially for UI to open before setting? Usually not needed.
        }
        const component = this.game.buildingSystem.getBuildingComponent(itemId);
        if (component) {
             this.selectedBuildItem = itemId;
             this.createBuildPreview();
             this.game.uiManager?.updateBuildMode(this.buildMode, this.selectedBuildItem);
         }
        else { console.warn("Invalid build item selected:", itemId); }
    }

    createBuildPreview() {
        this.removeBuildPreview();
        if (!this.selectedBuildItem) return;

        // AssetLoader.getModel needs to return a Babylon Node (Mesh or TransformNode)
        const previewMeshBase = this.game.assetLoader.getModel(this.selectedBuildItem);
        if (!previewMeshBase || !(previewMeshBase instanceof BABYLON.Node)) {
             console.error("Failed to create build preview mesh base for:", this.selectedBuildItem);
             return;
        }

        // Create a unique material instance for the preview
        const matName = "buildPreviewMat_" + this.selectedBuildItem + Date.now(); // Ensure unique name
        const previewMat = new BABYLON.PBRMaterial(matName, this.scene);
        previewMat.albedoColor = new BABYLON.Color3(0, 1, 0);
        previewMat.alpha = 0.6;
        previewMat.metallic = 0.1;
        previewMat.roughness = 0.8;
        previewMat.zOffset = -2; // Help prevent z-fighting

        // Apply material to all meshes in the hierarchy
        const applyMaterial = (node) => {
             if (node instanceof BABYLON.Mesh) {
                 node.material = previewMat;
                 node.isPickable = false; // Prevent interaction with preview
             }
         };
        previewMeshBase.getChildMeshes(false).forEach(applyMaterial);
        if (previewMeshBase instanceof BABYLON.Mesh) { applyMaterial(previewMeshBase); }


        this.buildPreview = previewMeshBase;
        this.buildPreview.setEnabled(false); // Start hidden
    }

    removeBuildPreview() {
        if (this.buildPreview) {
            // Dispose material manually if it's unique to this preview
            const material = this.buildPreview.material || this.buildPreview.getChildMeshes(true)[0]?.material;
            if (material && material.name.startsWith("buildPreviewMat_")) {
                material.dispose();
            }
            this.buildPreview.dispose(false, true); // Dispose node hierarchy
            this.buildPreview = null;
        }
    }

    updateBuildPreview(deltaTime) {
        if (!this.buildMode || !this.selectedBuildItem || !this.buildPreview) {
            if (this.buildPreview) this.buildPreview.setEnabled(false);
            return;
        }

        const buildRay = this.camera.getForwardRay(this.interactionRange * 2.5);
        const predicate = (mesh) => mesh.isPickable && mesh.isEnabled() && (mesh === this.game.terrain?.terrainMesh || mesh.metadata?.isBuildableSurface === true); // Need metadata on buildings/structures

        const pickInfo = this.scene.pickWithRay(buildRay, predicate);

        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            this.buildPreview.setEnabled(true);
            const hitPoint = pickInfo.pickedPoint;

            // BuildingSystem needs adaptation for findSnappingPoint & isValidBuildPosition
            let buildPos = this.game.buildingSystem.findSnappingPoint(hitPoint, this.selectedBuildItem, this.buildRotation); // Needs Babylon adaptation
            if (!buildPos) buildPos = hitPoint; // Fallback

            this.buildPreview.position = buildPos;
            this.buildPreview.rotation.y = this.buildRotation;

            const isValid = this.game.buildingSystem.isValidBuildPosition(buildPos, this.selectedBuildItem, this.buildRotation); // Needs Babylon adaptation
            const canAfford = this.game.buildingSystem.canBuildComponent(this.selectedBuildItem);

            // Find the preview material (might be on root or child)
            let material = null;
            const findMat = (node) => { if(node.material?.name.startsWith("buildPreviewMat_")) material = node.material; return !!material; };
            this.buildPreview.getChildren(findMat, false);
            if (!material && this.buildPreview instanceof BABYLON.Mesh) material = this.buildPreview.material;

            if (material instanceof BABYLON.PBRMaterial || material instanceof BABYLON.StandardMaterial) {
                 const colorTarget = material.albedoColor || material.diffuseColor; // Handle both material types
                 if (colorTarget) {
                     if (!isValid) colorTarget.copyFrom(BABYLON.Color3.Red());
                     else colorTarget.copyFrom(canAfford ? BABYLON.Color3.Green() : BABYLON.Color3.Yellow());
                 }
             }

        } else {
            this.buildPreview.setEnabled(false);
        }
    }

    rotateBuildPreview() {
        if (!this.buildMode || !this.selectedBuildItem) return;
        this.buildRotation = (this.buildRotation + Math.PI / 2) % (Math.PI * 2);
        this.updateBuildPreview(0); // Force update
    }

    build() {
        if (!this.buildMode || !this.selectedBuildItem || !this.buildPreview || !this.buildPreview.isEnabled()) return;
        const buildPos = this.buildPreview.position.clone();

        // BuildingSystem validation and building needs Babylon adaptation
        const isValid = this.game.buildingSystem.isValidBuildPosition(buildPos, this.selectedBuildItem, this.buildRotation);
        const canAfford = this.game.buildingSystem.canBuildComponent(this.selectedBuildItem);

        if (isValid && canAfford) {
            const success = this.game.buildingSystem.buildComponent(this.selectedBuildItem, buildPos, this.buildRotation); // Needs Babylon adaptation
            if (success) {
                this.game.uiManager?.buildingUI?.updateBuildMenu();
                this.game.uiManager?.updateInventoryUI(this.game.inventory);
                this.game.uiManager?.updateQuickBarUI(this.game.inventory);
            } else { this.game.uiManager?.showNotification("Failed to build (Internal Error)", 2000); }
        } else if (isValid && !canAfford) {
            this.game.uiManager?.showNotification("Not enough resources!", 2000);
        } else {
            this.game.uiManager?.showNotification("Cannot build here!", 2000);
        }
    }

    // --- Weapon Methods ---
    getSelectedTool() {
        const item = this.game.inventory?.getSelectedItem();
        if (item && (item.type === 'tool' || item.type === 'weapon')) { return item; }
        return null;
    }

    reloadWeapon() {
        if (this.isReloading || this.buildMode || this.game.uiManager?.isAnyMenuOpen() || this.game.isGodMode) return;
        const equippedWeapon = this.getSelectedTool(); if (!equippedWeapon || equippedWeapon.type !== 'weapon') return;
        const weaponDef = this.game.inventory.getItemById(equippedWeapon.id); if (!weaponDef?.magazineSize) return;
        const magSize = weaponDef.magazineSize; const curAmmo = equippedWeapon.currentAmmo ?? 0; const needed = magSize - curAmmo;
        if (needed <= 0) { this.game.uiManager?.showNotification("Magazine full", 1500); return; }
        let ammoTypeId = null; if (equippedWeapon.id === 'rifle') ammoTypeId = 'rifleround'; else return; // Add other ammo types here
        if (!ammoTypeId) { console.warn("Cannot determine ammo type for weapon:", equippedWeapon.id); return; }
        const available = this.game.inventory.getItemCount(ammoTypeId); if (available <= 0) { this.game.uiManager?.showNotification(`No ${ammoTypeId} ammo!`, 2000); return; }
        const toReload = Math.min(needed, available);
        const quickBarIdx = this.game.inventory.selectedSlot; const invSlotIdx = this.game.inventory.quickBarSlots[quickBarIdx];

        if (invSlotIdx !== null && this.game.inventory.inventorySlots[invSlotIdx]?.id === equippedWeapon.id) {
            const invItem = this.game.inventory.inventorySlots[invSlotIdx];
             if (this.game.inventory.removeItem(ammoTypeId, toReload)) {
                 this.isReloading = true; this.reloadTimer = this.reloadTime;
                 if (invItem.currentAmmo === undefined || invItem.currentAmmo === null) { invItem.currentAmmo = 0; }
                 invItem.currentAmmo += toReload;
                 this.game.uiManager?.showNotification("Reloading...", this.reloadTime * 1000 - 100);
                 this.game.uiManager?.updateWeaponUI(invItem, true);
             } else { console.error("[Reload] Failed ammo removal"); this.game.uiManager?.showNotification("Reload Error!", 2000); }
         } else { console.error("[Reload] Inventory sync error"); this.game.uiManager?.showNotification("Reload Error!", 2000); }
    }

}
// --- END OF FILE PlayerController.js ---