import *ాలుTHREE from './three.min.js';
import { PointerLockControls } from './PointerLockControls.js';

// Basic Inventory System (can be expanded)
class Inventory {
    constructor(uiManager, quickBarSlots = 5, mainSlots = 20) {
        this.uiManager = uiManager;
        this.quickBar = new Array(quickBarSlots).fill(null);
        this.mainInventory = new Array(mainSlots).fill(null);
        this.items = {}; // For stacking: { 'wood': {item_details, quantity: 10}, ... }
    }

    // Simplified addItem - assumes items stack if they have same name
    addItem(item) { // item = { name: 'Wood', quantity: 1, ...other_props }
        // Try quick bar first
        for (let i = 0; i < this.quickBar.length; i++) {
            if (!this.quickBar[i]) {
                this.quickBar[i] = { ...item };
                this.uiManager.updateQuickBar();
                this.uiManager.updateInventory();
                return true;
            } else if (this.quickBar[i].name === item.name && this.quickBar[i].stackable !== false) {
                this.quickBar[i].quantity = (this.quickBar[i].quantity || 1) + item.quantity;
                this.uiManager.updateQuickBar();
                this.uiManager.updateInventory();
                return true;
            }
        }
        // Then main inventory
        for (let i = 0; i < this.mainInventory.length; i++) {
            if (!this.mainInventory[i]) {
                this.mainInventory[i] = { ...item };
                this.uiManager.updateInventory();
                return true;
            } else if (this.mainInventory[i].name === item.name && this.mainInventory[i].stackable !== false) {
                this.mainInventory[i].quantity = (this.mainInventory[i].quantity || 1) + item.quantity;
                this.uiManager.updateInventory();
                return true;
            }
        }
        console.warn("Inventory full, item not added:", item);
        return false; // Inventory full
    }

    removeItem(itemName, quantity = 1, fromQuickBar = true, specificSlot = -1) {
        let source = fromQuickBar ? this.quickBar : this.mainInventory;
        
        if (specificSlot !== -1 && source[specificSlot] && source[specificSlot].name === itemName) {
            if (source[specificSlot].quantity > quantity) {
                source[specificSlot].quantity -= quantity;
            } else {
                source[specificSlot] = null;
            }
            this.uiManager.updateQuickBar();
            this.uiManager.updateInventory();
            return true;
        }

        for (let i = 0; i < source.length; i++) {
            if (source[i] && source[i].name === itemName) {
                if (source[i].quantity > quantity) {
                    source[i].quantity -= quantity;
                } else {
                    source[i] = null;
                }
                this.uiManager.updateQuickBar();
                this.uiManager.updateInventory();
                return true;
            }
        }
        // If not found in preferred, check other
        source = !fromQuickBar ? this.quickBar : this.mainInventory;
         for (let i = 0; i < source.length; i++) {
            if (source[i] && source[i].name === itemName) {
                if (source[i].quantity > quantity) {
                    source[i].quantity -= quantity;
                } else {
                    source[i] = null;
                }
                this.uiManager.updateQuickBar();
                this.uiManager.updateInventory();
                return true;
            }
        }
        return false; // Item not found or not enough
    }

    countItem(itemName) {
        let count = 0;
        [...this.quickBar, ...this.mainInventory].forEach(slot => {
            if (slot && slot.name === itemName) {
                count += slot.quantity || 1;
            }
        });
        return count;
    }

    // More methods: moveItem, getItem, etc.
}


export class Player {
    constructor(scene, camera, domElement, collidables, uiManager, gameInstance) {
        this.scene = scene;
        this.camera = camera;
        this.collidables = collidables;
        this.uiManager = uiManager;
        this.game = gameInstance; // For accessing crafting, etc.

        this.height = 1.8;
        this.radius = 0.4;
        this.speed = 5.0;
        this.jumpHeight = 8.0;
        this.onGround = false;
        this.velocity = new THREE.Vector3();
        this.input = { forward: 0, backward: 0, left: 0, right: 0, jump: false };

        // Player representation (collider)
        const playerGeometry = new THREE.CapsuleGeometry(this.radius, this.height - 2 * this.radius, 8);
        const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false }); // Visible for debug
        this.playerCollider = new THREE.Mesh(playerGeometry, playerMaterial);
        this.playerCollider.position.set(0, this.height / 2 + 10, 0); // Start higher and fall
        this.scene.add(this.playerCollider);

        // Third-person camera setup
        this.cameraOffset = new THREE.Vector3(0, 2, -5); // Offset from player's head
        this.cameraTarget = new THREE.Vector3(); // Point camera looks at (player's head)
        
        this.controls = new PointerLockControls(this.camera, domElement);
        // For third person, we don't directly add camera to controls.
        // Instead, we move a "camera rig" or "camera holder" object with PointerLock,
        // and position the actual camera relative to that rig.
        // Or, simpler: player mesh is separate from controls.object, controls.object is invisible pivot.

        // Let's try a simpler third-person: camera follows playerCollider
        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.position.copy(this.playerCollider.position);
        this.scene.add(this.cameraHolder); // Add to scene, not player
        this.controls = new PointerLockControls(this.cameraHolder, domElement); // Control the holder
        domElement.addEventListener('click', () => {
            if (!this.uiManager.isAnyPanelOpen()) {
                this.controls.lock();
            }
        });
        
        this.controls.addEventListener('lock', () => console.log('Pointer locked'));
        this.controls.addEventListener('unlock', () => console.log('Pointer unlocked'));

        this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10); // For interaction
        this.interactionDistance = 3;

        this.inventory = new Inventory(this.uiManager);
        this.selectedQuickBarSlot = 0; // 0-indexed
    }

    handleKeyDown(key) {
        switch (key) {
            case 'w': this.input.forward = 1; break;
            case 's': this.input.backward = 1; break;
            case 'a': this.input.left = 1; break;
            case 'd': this.input.right = 1; break;
            case ' ': if (this.onGround) this.input.jump = true; break;
            case 'e': this.interact(); break;
            // Quick bar selection (1-5 for slots 0-4)
            case '1': case '2': case '3': case '4': case '5':
                this.selectedQuickBarSlot = parseInt(key) - 1;
                this.uiManager.updateQuickBar(this.selectedQuickBarSlot); // Highlight selected
                console.log("Selected slot:", this.selectedQuickBarSlot, this.inventory.quickBar[this.selectedQuickBarSlot]);
                break;
        }
    }

    handleKeyUp(key) {
        switch (key) {
            case 'w': this.input.forward = 0; break;
            case 's': this.input.backward = 0; break;
            case 'a': this.input.left = 0; break;
            case 'd': this.input.right = 0; break;
        }
    }

    interact() {
        if (!this.controls.isLocked && !this.game.uiManager.isAnyPanelOpen()) return; // Only interact if controls locked or a relevant UI is open (like campfire)

        // If Campfire UI is open, interaction might be placing items
        if (this.uiManager.isCampfireOpen()) {
            // Logic to add item from player inventory to campfire slot via UI interaction
            // This part would be handled by ui.js click handlers
            console.log("Attempting to interact with open campfire UI");
            return;
        }

        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera); // Ray from center of screen
        const intersects = this.raycaster.intersectObjects(this.collidables, false); // false = don't check children

        if (intersects.length > 0) {
            const closest = intersects[0];
            if (closest.distance < this.interactionDistance) {
                const object = closest.object;
                const userData = object.userData;

                if (userData.type === 'tree' || userData.type === 'rock') {
                    this.gatherResource(object);
                } else if (userData.type === 'crate' || userData.type === 'barrel') {
                    this.searchLootContainer(object);
                } else if (userData.type === 'campfire_placed') { // Custom type for placed campfires
                     this.uiManager.openCampfireMenu(object); // Pass campfire object to UI
                } else if (userData.type === 'water_surface') { // A conceptual object or check
                    const canteen = this.inventory.quickBar.find(item => item && item.name === 'Canteen') ||
                                    this.inventory.mainInventory.find(item => item && item.name === 'Canteen');
                    if (canteen) {
                        canteen.water = canteen.capacity;
                        canteen.isBoiled = false; // Fresh water needs boiling
                        this.uiManager.showTemporaryMessage("Canteen filled with dirty water.");
                        this.uiManager.updateInventory(); // Refresh UI if canteen details change
                    }
                }
                // ... other interactions (e.g., fiber, scrap metal on ground)
            }
        }
    }

    gatherResource(resourceObject) {
        const selectedItem = this.inventory.quickBar[this.selectedQuickBarSlot];
        if (!selectedItem) {
             this.uiManager.showTemporaryMessage("Select a tool.");
             return;
        }

        const userData = resourceObject.userData;
        let canGather = false;
        let toolNeeded = "";
        let resourceName = "";
        let resourceAmount = 0;

        if (userData.type === 'tree' && selectedItem.name === 'Axe') {
            canGather = true;
            toolNeeded = "Axe";
            resourceName = "Wood";
            resourceAmount = userData.woodAmount;
        } else if (userData.type === 'rock' && selectedItem.name === 'Pickaxe') {
            canGather = true;
            toolNeeded = "Pickaxe";
            resourceName = "Stone";
            resourceAmount = userData.stoneAmount;
        }
        // Add Fiber harvesting (e.g., if target is 'fiber_plant' and tool is 'Hand' or 'Knife')

        if (canGather) {
            userData.health -= 25; // Example damage
            this.uiManager.showTemporaryMessage(`Hit ${userData.type} with ${selectedItem.name}. Health: ${userData.health}`);
            if (userData.health <= 0) {
                this.inventory.addItem({ name: resourceName, quantity: resourceAmount });
                this.uiManager.showTemporaryMessage(`Collected ${resourceAmount} ${resourceName}!`);
                
                // Remove object from scene and collidables
                this.scene.remove(resourceObject);
                const index = this.collidables.indexOf(resourceObject);
                if (index > -1) this.collidables.splice(index, 1);
                // Note: For instanced meshes, you can't remove one instance easily.
                // You'd set its scale to 0 or move it, and manage a list of "destroyed" instances.
                // This simple removal works for non-instanced objects.
            }
        } else if (userData.type === 'tree' || userData.type === 'rock') {
            this.uiManager.showTemporaryMessage(`Need a ${userData.type === 'tree' ? 'Axe' : 'Pickaxe'} to gather from ${userData.type}.`);
        }
    }

    searchLootContainer(containerObject) {
        const userData = containerObject.userData;
        if (userData.searched) {
            this.uiManager.showTemporaryMessage(`${userData.type} is empty.`);
            return;
        }
        userData.searched = true; // Mark as searched
        
        const lootCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
        let foundLoot = "";
        for (let i = 0; i < lootCount; i++) {
            if (userData.lootTable && userData.lootTable.length > 0) {
                const lootName = userData.lootTable[Math.floor(Math.random() * userData.lootTable.length)];
                const quantity = (lootName === 'nails' || lootName === 'scrap_metal' || lootName === 'small_stone') ? Math.floor(Math.random()*5)+1 : 1;
                this.inventory.addItem({ name: lootName, quantity: quantity });
                foundLoot += `${quantity} ${lootName}, `;
            }
        }
        if (foundLoot) {
            this.uiManager.showTemporaryMessage(`Found: ${foundLoot.slice(0, -2)}.`);
        } else {
            this.uiManager.showTemporaryMessage(`${userData.type} was empty.`);
        }
    }


    update(deltaTime, terrain) {
        const prevPosition = this.playerCollider.position.clone();
        const gravity = 30.0;

        // Apply gravity
        if (!this.onGround) {
            this.velocity.y -= gravity * deltaTime;
        }

        // Jump
        if (this.input.jump) {
            this.velocity.y = this.jumpHeight;
            this.onGround = false;
            this.input.jump = false;
        }

        // Movement direction based on camera
        const moveDirection = new THREE.Vector3();
        this.cameraHolder.getWorldDirection(moveDirection); // Get direction camera holder is facing
        moveDirection.y = 0; // We only want horizontal movement relative to camera
        moveDirection.normalize();

        const rightDirection = new THREE.Vector3();
        rightDirection.crossVectors(this.cameraHolder.up, moveDirection).normalize(); // Get right vector relative to camera holder

        let effectiveSpeed = this.speed;

        // Calculate intended movement
        let moveX = (this.input.right - this.input.left) * effectiveSpeed * deltaTime;
        let moveZ = (this.input.forward - this.input.backward) * effectiveSpeed * deltaTime;
        
        // Apply movement based on camera direction
        this.velocity.x = moveDirection.x * moveZ + rightDirection.x * moveX;
        this.velocity.z = moveDirection.z * moveZ + rightDirection.z * moveX;
       
        // Apply velocity to position (potential new position)
        this.playerCollider.position.x += this.velocity.x * deltaTime;
        this.playerCollider.position.y += this.velocity.y * deltaTime;
        this.playerCollider.position.z += this.velocity.z * deltaTime;

        // Collision Detection & Response (Simplified AABB vs AABB or Sphere vs AABB)
        this.onGround = false;
        const playerBox = new THREE.Box3().setFromObject(this.playerCollider);

        // Terrain collision (simple ground check)
        // This needs to be more robust, checking actual terrain mesh below player.
        const groundY = this.game.world.getHeightAt(this.playerCollider.position.x, this.playerCollider.position.z);
        const playerFeetY = this.playerCollider.position.y - this.height / 2;

        if (playerFeetY <= groundY) {
            this.playerCollider.position.y = groundY + this.height / 2;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Collision with other objects
        this.collidables.forEach(collidable => {
            if (collidable === this.playerCollider || collidable === terrain) return; // Don't collide with self or terrain handled above
            if (!collidable.geometry) return; // Skip if no geometry (e.g. it was removed)

            const objectBox = new THREE.Box3().setFromObject(collidable);
            if (playerBox.intersectsBox(objectBox)) {
                // Basic resolution: push player back to previous position component-wise
                // This is very basic and can be glitchy. A proper physics engine is better.
                const overlap = playerBox.intersect(objectBox); // Get intersection box
                const overlapSize = new THREE.Vector3();
                overlap.getSize(overlapSize);

                // Determine pushback direction
                // A simple way: find which axis has smallest overlap and push back along that axis.
                // More robust: use the player's velocity vector against the collision normal.
                
                // Simplified pushback:
                // Check X collision
                this.playerCollider.position.x = prevPosition.x; 
                playerBox.setFromObject(this.playerCollider); // Update playerBox
                if (playerBox.intersectsBox(objectBox)) { // Still colliding after X correction?
                    this.playerCollider.position.x += this.velocity.x * deltaTime; // Revert X to current attempt
                    // Check Z collision
                    this.playerCollider.position.z = prevPosition.z;
                    playerBox.setFromObject(this.playerCollider);
                     if (playerBox.intersectsBox(objectBox)) { // Still colliding after Z correction?
                        this.playerCollider.position.z += this.velocity.z * deltaTime; // Revert Z
                        // Check Y collision (if necessary, e.g. hitting underside of something)
                        this.playerCollider.position.y = prevPosition.y;
                    }
                }
                 this.velocity.x = 0; // Stop movement in that direction
                 this.velocity.z = 0; // Stop movement in that direction
            }
        });


        // Update Camera Holder to follow player smoothly
        this.cameraHolder.position.lerp(this.playerCollider.position, 0.2); // Smooth follow
        
        // Update actual camera position relative to the (now PointerLock controlled) cameraHolder
        // The camera itself doesn't rotate with mouse, the holder does. Camera maintains offset.
        const worldOffset = this.cameraOffset.clone().applyQuaternion(this.cameraHolder.quaternion);
        this.camera.position.copy(this.cameraHolder.position).add(worldOffset);
        this.cameraTarget.copy(this.cameraHolder.position).add(new THREE.Vector3(0, this.height * 0.3, 0)); // Look slightly above base
        this.camera.lookAt(this.cameraTarget);

        // Update interaction prompt
        this.updateInteractionPrompt();
    }

    updateInteractionPrompt() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.raycaster.intersectObjects(this.collidables, false);
        let promptText = "";

        if (intersects.length > 0) {
            const closest = intersects[0];
            if (closest.distance < this.interactionDistance) {
                const userData = closest.object.userData;
                if (userData.type === 'tree') promptText = "Press E to Chop (Axe)";
                else if (userData.type === 'rock') promptText = "Press E to Mine (Pickaxe)";
                else if ((userData.type === 'crate' || userData.type === 'barrel') && !userData.searched) promptText = "Press E to Search";
                else if ((userData.type === 'crate' || userData.type === 'barrel') && userData.searched) promptText = `${userData.type} (Empty)`;
                else if (userData.type === 'campfire_placed') promptText = "Press E to Open Campfire";
                // ... other prompts
            }
        }
        this.uiManager.setInteractionPrompt(promptText);
    }
}