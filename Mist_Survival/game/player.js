// game/player.js
// Manages the player character: stats, inventory, position, actions, input processing.

import * as THREE from '../libs/three.module.js'; // Assuming Three.js is modular
import * as UIManager from './ui.js'; // To display messages, update UI
import * as World from './world.js'; // To interact with environment objects
// Import other modules as needed (Crafting, Building, etc.)
import * as Vehicles from './vehicles.js'; // Added import for vehicle interactions

// --- Player State ---
let playerMesh = null; // Reference to the player's 3D mesh
let camera = null; // Reference to the game camera
let playerStats = {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    fatigue: 0,
    maxFatigue: 100,
    hunger: 10,
    maxHunger: 100,
    thirst: 15,
    maxThirst: 100,
    // Rates (adjust these based on game balance)
    staminaRegenRate: 5,
    staminaDrainRate: 15,
    hungerRate: 0.1, // Per game minute
    thirstRate: 0.2, // Per game minute
    healthRegenRate: 0.1, // Slow base regen if not hungry/thirsty
};
let inventory = [];
let equippedItem = null;
let isSprinting = false;
let isMoving = false;
let deathTimeout = null; // Timeout handle for respawn delay
let playerActive = true; // New state variable for vehicle integration

const playerHeight = 1.8;
const playerRadius = 0.4;

// --- Initialization ---
export function init(scene, gameCamera, loadData = null) {
    console.log("Initializing Player...");
    camera = gameCamera;

    // Create player mesh (cylinder for now)
    const geometry = new THREE.CylinderGeometry(playerRadius, playerRadius, playerHeight, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
    playerMesh = new THREE.Mesh(geometry, material);
    playerMesh.castShadow = true;
    playerMesh.position.y = playerHeight / 2;
    playerMesh.name = "Player"; // Useful for debugging/raycasting
    scene.add(playerMesh);

    if (loadData && loadData.player) {
        playerStats = { ...playerStats, ...loadData.player.stats }; // Merge loaded stats
        inventory = loadData.player.inventory ? [...loadData.player.inventory] : [];
        // Find equipped item from loaded inventory if ID matches
        equippedItem = inventory.find(item => item.id === loadData.player.equippedItemId) || null;
        playerMesh.position.set(
            loadData.player.position?.x ?? 0,
            loadData.player.position?.y ?? playerHeight / 2,
            loadData.player.position?.z ?? 5 // Default start Z
        );
        // TODO: Load player rotation/camera rotation
        console.log("Player state loaded.");
    } else {
        // Default starting inventory
        inventory = [
            { id: 'stone_axe', name: 'Stone Axe', quantity: 1, type: 'tool' },
            { id: 'bandage', name: 'Bandage', quantity: 3, type: 'consumable' },
        ];
        equipItem(inventory[0]); // Equip the first item
        playerMesh.position.z = 5; // Default starting position
    }

    // Initial camera position
    updateCameraPosition();
    camera.lookAt(playerMesh.position);
}

// --- Update Loop ---
/**
 * Updates player stats based on time and actions.
 * @param {number} dt Delta time in real seconds.
 * @param {number} gameDt Delta time in game seconds.
 * @param {object} inputState Current state of keyboard/mouse inputs.
 */
export function update(dt, gameDt, inputState) {
    if (!playerMesh || !playerActive) return; // Not initialized or inactive (in vehicle)

    // --- Update Stats ---
    updatePlayerStats(dt, gameDt);

    // --- Process Actions/Input ---
    // Movement/sprinting logic is now handled in main loop using player state
    isSprinting = inputState.keys['ShiftLeft'] && playerStats.stamina > 1;
    // Determine if moving based on WASD keys
    isMoving = inputState.keys['KeyW'] || inputState.keys['KeyS'] || inputState.keys['KeyA'] || inputState.keys['KeyD'];

    // Update camera position to follow player AFTER movement calculations in main.js
    updateCameraPosition();

    // Handle fatigue (placeholder)
    if (isSprinting || playerStats.stamina <= 0) {
        playerStats.fatigue += dt * 0.5;
    } else if (isMoving) {
         playerStats.fatigue += dt * 0.1;
    } else {
         playerStats.fatigue -= dt * 1.0; // Recover fatigue when idle
    }
    playerStats.fatigue = Math.max(0, Math.min(playerStats.fatigue, playerStats.maxFatigue));

    // Check for death state
    if (playerStats.health <= 0 && !deathTimeout) {
        handleDeath();
    }
}


function updatePlayerStats(dt, gameDt) {
    const gameMinutesPassed = gameDt / 60;

    // Hunger & Thirst increase over time
    playerStats.hunger += playerStats.hungerRate * gameMinutesPassed;
    playerStats.thirst += playerStats.thirstRate * gameMinutesPassed;
    playerStats.hunger = Math.min(playerStats.hunger, playerStats.maxHunger);
    playerStats.thirst = Math.min(playerStats.thirst, playerStats.maxThirst);

    // Stamina regen/drain (handled based on isSprinting in main loop now)
    // Placeholder: Regen moved to main loop, just handle caps here
    playerStats.stamina = Math.max(0, Math.min(playerStats.stamina, playerStats.maxStamina));


    // Health effects
    let healthChange = 0;
    // Starvation/Dehydration damage
    if (playerStats.hunger >= playerStats.maxHunger) healthChange -= dt * 0.5;
    if (playerStats.thirst >= playerStats.maxThirst) healthChange -= dt * 1.0;
    // Base health regen if well-fed/hydrated and not fatigued
    if (playerStats.hunger < 80 && playerStats.thirst < 80 && playerStats.fatigue < 70 && playerStats.health < playerStats.maxHealth) {
        healthChange += playerStats.healthRegenRate * dt;
    }

    applyHealthChange(healthChange);
}


function updateCameraPosition() {
    if (playerMesh && camera) {
         // Offset from player's feet position + eye height adjustment
        const cameraOffset = new THREE.Vector3(0, playerHeight * 0.85, 0); // Closer to top of cylinder
        camera.position.copy(playerMesh.position).add(cameraOffset);
    }
}


// --- Actions ---

export function applyDamage(amount) {
    applyHealthChange(-amount);
    UIManager.showDamageIndicator(); // Example UI feedback
    console.log(`Player took ${amount} damage.`);
}

function applyHealthChange(amount) {
     if (playerStats.health <= 0) return; // Already dead

     playerStats.health += amount;
     playerStats.health = Math.max(0, Math.min(playerStats.health, playerStats.maxHealth)); // Clamp health
}


function handleDeath() {
    UIManager.addLogMessage("YOU DIED");
    // TODO: Play death sound, fade screen?
    // Force pointer unlock if needed: document.exitPointerLock();
    if (!deathTimeout) {
        deathTimeout = setTimeout(() => {
            respawn();
            deathTimeout = null;
        }, 5000); // 5 second respawn delay
    }
}

function respawn() {
     UIManager.addLogMessage("Respawning...");
     playerStats.health = playerStats.maxHealth * 0.75; // Respawn with partial health
     playerStats.hunger = 50;
     playerStats.thirst = 50;
     playerStats.stamina = playerStats.maxStamina * 0.5;
     playerStats.fatigue = 0;
     // Move player to spawn point (e.g., origin or saved base location)
     playerMesh.position.set(0, playerHeight / 2, 5);
     updateCameraPosition(); // Snap camera to new position
     // TODO: Clear negative status effects? Drop some inventory?
}

export function interact() {
    if (!playerMesh || !camera) return;
    UIManager.addLogMessage("Interacting...");
    // Raycast forward to find interactable objects
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, camera); // Center screen
    const interactDistance = 2.5;
    raycaster.far = interactDistance;

    // TODO: Get list of interactable objects from World or other managers
    const interactableMeshes = World.getEnvironmentObjects().map(obj => obj.mesh).filter(mesh => mesh); // Example
    // const interactableMeshes = [...World.getInteractables(), ...Building.getStations(), ...VehicleManager.getVehicles()];

    const intersects = raycaster.intersectObjects(scene.children, true); // Check all scene children for simplicity (inefficient)

    if (intersects.length > 0) {
        let closestInteractable = null;
        for(const intersect of intersects) {
            // Find the first object with an interaction handler or type
            if (intersect.object.userData?.interact) {
                closestInteractable = intersect.object;
                break;
            }
            // Could check object names, types etc.
             if (intersect.object.name.includes("ResourceNode")) { // Example check
                 closestInteractable = intersect.object;
                 break;
             }
        }


        if (closestInteractable) {
            console.log("Interacting with:", closestInteractable.name);
            if (closestInteractable.userData.interact) {
                 closestInteractable.userData.interact(playerMesh); // Call object's interaction function
            } else {
                // Default interaction? (e.g., harvest node)
                UIManager.addLogMessage(`Used ${equippedItem?.name || 'hands'} on ${closestInteractable.name}.`);
                 // TODO: Implement harvesting logic (check tool, add resources to inventory)
                 // Example: if (equippedItem?.type === 'tool') { harvest(closestInteractable); }
            }
        } else {
            UIManager.addLogMessage("Nothing useful to interact with there.");
        }
    } else {
         UIManager.addLogMessage("Nothing close enough to interact with.");
    }
}

export function performAttack() {
     if (!equippedItem || equippedItem.type !== 'tool' || playerStats.stamina < 5) { // Basic check
        UIManager.addLogMessage("Cannot attack (No tool/too tired).");
        return;
     }
     UIManager.addLogMessage(`Attacking with ${equippedItem.name}...`);
     playerStats.stamina -= 10; // Stamina cost for attack

     // TODO: Play attack animation/sound

     // Raycast forward for hit detection
     const raycaster = new THREE.Raycaster();
     raycaster.setFromCamera({ x: 0, y: 0 }, camera);
     const attackRange = equippedItem.range || 2.0; // Get range from item data?
     raycaster.far = attackRange;

     // TODO: Get list of attackable targets (Infected primarily)
     // const attackableMeshes = InfectedManager.getInfectedMeshes();
     const intersects = raycaster.intersectObjects(scene.children, true); // Inefficient check

      if (intersects.length > 0) {
        let hitTarget = null;
         for(const intersect of intersects) {
            // Check if hit object is an infected (or other attackable)
            // Example: if (InfectedManager.isMeshInfected(intersect.object)) { ... }
            if (intersect.object.name.toLowerCase().includes("infected_")) { // Simple name check
                 hitTarget = intersect.object;
                 break;
            }
            // Could also hit resources like trees/rocks
             if (intersect.object.name.includes("ResourceNode")) {
                  hitTarget = intersect.object;
                  break;
             }
         }

         if(hitTarget) {
             console.log("Hit:", hitTarget.name);
              UIManager.addLogMessage(`Hit ${hitTarget.name}!`);
             // TODO: Apply damage to infected or gather resource from node
             // Example: InfectedManager.applyDamage(hitTarget.userData.id, equippedItem.damage);
             // Example: World.harvestResource(hitTarget.userData.id, equippedItem.type);
         }
      }
}

// --- Inventory Management ---
export function getInventory() {
    return [...inventory]; // Return copy
}

export function addItem(itemData) {
    // TODO: Implement stacking logic
    const existingItem = inventory.find(item => item.id === itemData.id && item.stackable); // Assuming 'stackable' property
    if (existingItem) {
        existingItem.quantity += itemData.quantity;
    } else {
        inventory.push({ ...itemData }); // Add as new item object
    }
    UIManager.addLogMessage(`Added ${itemData.quantity}x ${itemData.name}.`);
    UIManager.updateInventoryUI(inventory); // Update UI
}

export function removeItem(itemId, quantity) {
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        inventory[itemIndex].quantity -= quantity;
        if (inventory[itemIndex].quantity <= 0) {
            // Unequip if it was equipped
            if (equippedItem && equippedItem.id === itemId) {
                equipItem(null);
            }
            inventory.splice(itemIndex, 1); // Remove item fully
        }
        UIManager.updateInventoryUI(inventory); // Update UI
        return true; // Item removed successfully
    }
    return false; // Item not found
}

export function hasItem(itemId, quantity = 1) {
    const item = inventory.find(item => item.id === itemId);
    return item && item.quantity >= quantity;
}

export function consumeItem(item) {
    if (!item || item.type !== 'consumable') return;

    UIManager.addLogMessage(`Using ${item.name}...`);
    // Apply item effects (needs data lookup for effects)
    // Example:
    if (item.id === 'bandage') {
        applyHealthChange(25); // Heal 25 health
        UIManager.addLogMessage(`Healed some health.`);
    } else if (item.id === 'canned_food') { // Example food item
         playerStats.hunger = Math.max(0, playerStats.hunger - 40);
         UIManager.addLogMessage(`Ate some food.`);
    } else if (item.id === 'water_bottle') { // Example water item
         playerStats.thirst = Math.max(0, playerStats.thirst - 50);
         UIManager.addLogMessage(`Drank some water.`);
    }

    // Remove one of the consumed item
    removeItem(item.id, 1);
}

export function equipItem(item) {
    if (item && item.type !== 'tool' && item.type !== 'weapon') {
        UIManager.addLogMessage(`Cannot equip ${item.name}.`);
        equippedItem = null;
    } else {
        equippedItem = item;
         UIManager.addLogMessage(`Equipped ${item ? item.name : 'nothing'}.`);
         // TODO: Update player model visually? Show item in hand?
    }
     UIManager.updateEquippedUI(equippedItem);
}

// --- Getters for main loop ---
export function getPlayerMesh() {
    return playerMesh;
}

export function getPlayerStats() {
    return { ...playerStats }; // Return copy
}

export function getPosition() {
    return playerMesh?.position.clone();
}

export function getRotationY() {
     return playerMesh?.rotation.y ?? 0;
}

export function isPlayerSprinting() {
    return isSprinting;
}

// --- New functions to handle integration with other modules ---

/**
 * Modifies player stamina and ensures it stays within limits
 * @param {number} amount Amount to modify stamina by (positive to add, negative to subtract)
 */
export function modifyStamina(amount) {
    playerStats.stamina += amount;
    playerStats.stamina = Math.max(0, Math.min(playerStats.stamina, playerStats.maxStamina));
}

/**
 * Returns the height of the player (for physics/camera calculations)
 */
export function getPlayerHeight() {
    return playerHeight;
}

/**
 * Returns the current equipped item
 */
export function getEquippedItem() {
    return equippedItem;
}

/**
 * Checks if player is currently in a vehicle
 */
export function isInVehicle() {
    // This should link to the VehicleManager's state
    return Vehicles.getPlayerVehicle() !== null;
}

/**
 * Returns a reference to the player for other modules to use
 */
export function getPlayerReference() {
    return {
        id: "player",
        mesh: playerMesh,
        // Add other references needed
    };
}

/**
 * Enable/disable player controls
 * @param {boolean} active Whether player should be active
 */
export function setActive(active) {
    // Disables player movement when in vehicle or otherwise incapacitated
    playerActive = active;
}

// --- Persistence ---
export function getState() {
    return {
        stats: { ...playerStats },
        inventory: [...inventory],
        equippedItemId: equippedItem?.id || null,
        position: { x: playerMesh.position.x, y: playerMesh.position.y, z: playerMesh.position.z },
        // TODO: Save rotation/camera state
    };
}