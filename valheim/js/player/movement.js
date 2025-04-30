// player/movement.js - Player movement and physics
import * as THREE from 'three';
import { scene, camera, controls, PLAYER_HEIGHT, WALK_SPEED, RUN_SPEED, JUMP_FORCE, GRAVITY, STAMINA_SPRINT_COST, STAMINA_JUMP_COST, STAMINA_REGEN } from '../core/setup.js';
import { gameState } from '../main.js';
import { keys } from '../core/input.js';
import { getTerrainHeight } from '../world/terrain.js';
import { checkResourceCollection } from '../world/resources.js';
import { checkEnemyCombat } from './combat.js';
import { buildings } from '../building/building.js';
import { showGameMessage, addItemToInventory } from '../utils/helpers.js';
import { exitToMenu } from '../core/ui.js';
import { resources } from '../world/resources.js';

export function updatePlayer(delta) {
    // --- Cooldowns ---
    for (const key in gameState.player.cooldowns) {
        if (gameState.player.cooldowns[key] > 0) {
            gameState.player.cooldowns[key] -= delta * 1000; // Cooldowns in ms
        }
    }

    // --- Velocity Calculations ---
    const speed = (keys.sprint && gameState.player.stamina > 0) ? RUN_SPEED : WALK_SPEED;
    const currentVelocity = gameState.player.velocity;
    const onGround = gameState.player.onGround;

    // Apply friction/damping (more realistic)
    const damping = onGround ? 15.0 : 2.0; // More damping on ground
    currentVelocity.x -= currentVelocity.x * damping * delta;
    currentVelocity.z -= currentVelocity.z * damping * delta;

    // Stop small movements (prevents drifting)
    if (Math.abs(currentVelocity.x) < 0.01) currentVelocity.x = 0;
    if (Math.abs(currentVelocity.z) < 0.01) currentVelocity.z = 0;

    // --- Input Direction ---
    // Get camera direction vectors only once per frame
    const cameraObject = controls.getObject();
    const forwardVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();
    cameraObject.getWorldDirection(forwardVector);
    forwardVector.y = 0;
    forwardVector.normalize();
    // Calculate right vector using cross product with world up (0,1,0)
    sideVector.crossVectors(cameraObject.up, forwardVector).normalize();

    let moveX = 0;
    let moveZ = 0;
    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    const wishDir = new THREE.Vector3();
    // Add movement vectors scaled by input (-1, 0, or 1)
    wishDir.addScaledVector(forwardVector, moveZ);
    wishDir.addScaledVector(sideVector, moveX);

    // Only normalize if there's input, otherwise wishDir is (0,0,0)
    if (moveX !== 0 || moveZ !== 0) {
        wishDir.normalize();
    }

    // Apply movement impulse
    const acceleration = onGround ? 40.0 : 15.0; // Faster acceleration on ground
    // Calculate acceleration vector based on wish direction and speed
    const accelVec = wishDir.clone().multiplyScalar(acceleration * speed);

    // Apply acceleration to velocity, considering delta time
    currentVelocity.addScaledVector(accelVec, delta);

    // Cap horizontal speed
    const horizontalSpeed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.z * currentVelocity.z);
    const maxSpeed = (keys.sprint && gameState.player.stamina > 0) ? RUN_SPEED : WALK_SPEED;
    if (horizontalSpeed > maxSpeed) {
        const scale = maxSpeed / horizontalSpeed;
        currentVelocity.x *= scale;
        currentVelocity.z *= scale;
    }

    // --- Jumping ---
    if (keys.jump && onGround && gameState.player.stamina >= STAMINA_JUMP_COST && gameState.player.cooldowns.jump <= 0) {
        currentVelocity.y = JUMP_FORCE;
        gameState.player.stamina -= STAMINA_JUMP_COST;
        gameState.player.onGround = false;
        gameState.player.cooldowns.jump = 300; // Short jump cooldown
        keys.jump = false; // Consume jump input immediately
        // playSound('jump'); // Add sound effect
    }

    // --- Apply Gravity ---
    if (!onGround) {
        currentVelocity.y -= GRAVITY * delta;
    }

    // --- Stamina Handling ---
    gameState.player.isRunning = keys.sprint && (keys.forward || keys.backward || keys.left || keys.right) && horizontalSpeed > 0.1 && onGround;
    if (gameState.player.isRunning) {
        gameState.player.stamina = Math.max(0, gameState.player.stamina - STAMINA_SPRINT_COST * delta);
        if (gameState.player.stamina === 0) {
            keys.sprint = false; // Force stop sprinting if out of stamina
            gameState.player.isRunning = false;
        }
    } else if (!gameState.player.isAttacking && onGround) { // Regen only when not attacking/sprinting and on ground
        gameState.player.stamina = Math.min(gameState.player.maxStamina, gameState.player.stamina + STAMINA_REGEN * delta);
    }

    // --- Apply Movement to Controls Object ---
    const deltaPosition = currentVelocity.clone().multiplyScalar(delta);
    // Move the controls object (which holds the camera)
    cameraObject.position.add(deltaPosition);

    // --- Ground Collision & Update Position ---
    const playerPos = cameraObject.position;
    const terrainY = getTerrainHeight(playerPos.x, playerPos.z);
    const groundThreshold = terrainY + PLAYER_HEIGHT;

    if (playerPos.y < groundThreshold) {
        playerPos.y = groundThreshold;
        currentVelocity.y = 0; // Stop vertical velocity
        gameState.player.onGround = true;
    } else {
        gameState.player.onGround = false;
    }

    // Update game state position (useful for other systems like minimap)
    gameState.player.position.copy(playerPos);

    // --- Attack Animation & Logic ---
    if (gameState.player.isAttacking) {
        const attackDuration = 500; // ms
        const elapsed = performance.now() - gameState.player.attackStartTime;

        if (elapsed > attackDuration) {
            gameState.player.isAttacking = false;
            // Reset weapon visual if any
        } else {
            // Simple attack logic check (can be refined)
            if (elapsed > 100 && elapsed < 400) { // Hit window
                checkResourceCollection();
                checkEnemyCombat(true); // Pass flag indicating player is attacking
            }
            // Add visual weapon swing animation here if needed
        }
    }
}

export function damagePlayer(amount) {
    if (!gameState.isGameActive || gameState.player.health <= 0) return;

    // Add armor calculation here later
    const actualDamage = Math.max(1, Math.round(amount));

    gameState.player.health = Math.max(0, gameState.player.health - actualDamage);
    console.log(`Player took ${actualDamage} damage. Health: ${gameState.player.health}`);

    // Visual/Audio Feedback
    // playSound('player_hurt');
    const damageOverlay = document.getElementById('damage-overlay');
    if (damageOverlay) {
        damageOverlay.style.opacity = 0.7;
        setTimeout(() => { damageOverlay.style.opacity = 0; }, 150);
    }

    if (gameState.player.health <= 0) {
        playerDeath();
    }
}

export function playerDeath() {
    console.log("Player Died!");
    gameState.isGameActive = false; // Stop game updates
    if (controls.isLocked) controls.unlock(); // Force unlock controls

    // Show Death Screen/Message
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
        deathScreen.style.display = 'flex';
        // Add listeners if not already added
        deathScreen.querySelector('#respawn-btn')?.removeEventListener('click', respawnPlayer);
        deathScreen.querySelector('#respawn-btn')?.addEventListener('click', respawnPlayer);
        deathScreen.querySelector('#exit-death-btn')?.removeEventListener('click', exitToMenu);
        deathScreen.querySelector('#exit-death-btn')?.addEventListener('click', exitToMenu);
    } else {
        alert('You died! Game Over.');
        exitToMenu();
    }
}

export function respawnPlayer() {
    console.log("Respawning player...");
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) deathScreen.style.display = 'none';

    // Reset player state
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.stamina = gameState.player.maxStamina;
    gameState.player.velocity.set(0,0,0);
    // Reset position to spawn point (e.g., world origin or last bed used)
    const spawnPoint = new THREE.Vector3(0, 10, 5); // Example spawn
    controls.getObject().position.copy(spawnPoint);
    const groundY = getTerrainHeight(spawnPoint.x, spawnPoint.z);
    controls.getObject().position.y = groundY + PLAYER_HEIGHT; // Ensure spawn is above ground
    gameState.player.position.copy(controls.getObject().position);
    gameState.player.onGround = true; // Assume spawn is on ground

    // Hide death screen, maybe show instructions again briefly?
    const instructions = document.getElementById('instructions');
    if (instructions) instructions.style.display = ''; // Show click prompt again

    // Game state remains inactive until user clicks to lock controls
    gameState.isGameActive = false;
}

export function checkInteractions() {
    const interactionDist = 2.5; // How close player needs to be
    const playerPos = gameState.player.position;

    let closestInteractable = null;
    let minDistSq = interactionDist * interactionDist;

    // Find closest interactable building first
    for (const building of buildings) {
        if (building.userData.interactable) {
            const distSq = building.position.distanceToSquared(playerPos);
            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestInteractable = building;
            }
        }
    }

    // If a building is interactable, prioritize it
    if (closestInteractable) {
        const building = closestInteractable;
        console.log(`Interacting with building: ${building.userData.type}`);
        switch (building.userData.interactionType) {
            case 'crafting':
                showCraftingMenu(building.userData.stationType);
                break;
            case 'storage':
                console.log("Opening chest (not implemented)");
                showGameMessage("Chests not implemented yet", "info");
                break;
            case 'sleep':
                console.log("Trying to sleep (not implemented)");
                showGameMessage("Sleeping not implemented yet", "info");
                break;
            case 'door':
                console.log("Toggling door (not implemented)");
                showGameMessage("Doors not implemented yet", "info");
                break;
            case 'boss_altar':
                showBossAltar();
                break;
            default:
                console.warn("Unknown building interaction type:", building.userData.interactionType);
        }
        return; // Stop after interacting with the closest building
    }

    // If no building, check for pickupable resources
    closestInteractable = null;
    minDistSq = interactionDist * interactionDist; // Reset distance check

    for (let i = resources.length - 1; i >= 0; i--) {
        const resource = resources[i];
        // Only check specific types for direct pickup (e.g., flint)
        if (resource.subType === 'flint' && resource.type === 'node') {
            const distSq = resource.position.distanceToSquared(playerPos);
            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestInteractable = resource;
            }
        }
    }

    if (closestInteractable) {
        const resource = closestInteractable;
        console.log(`Picking up ${resource.subType}`);
        // Find the index again (since we only stored the object)
        const resourceIndex = resources.findIndex(r => r.id === resource.id);
        if (resourceIndex === -1) return; // Should not happen

        if (addItemToInventory(resource.subType)) { // Assuming drop item = subtype name
            // Remove resource from world
            resource.meshes.forEach(mesh => scene.remove(mesh));
            resources.splice(resourceIndex, 1);
            // playSound('pickup');
        }
        return; // Stop after picking up one item
    }
}

// Function to show the crafting menu - should be in building/crafting.js
export function showCraftingMenu(stationType = 'workbench') {
    const craftingMenu = document.getElementById('crafting');
    if (!craftingMenu) return;

    console.log(`Opening crafting at station: ${stationType}`);
    craftingMenu.style.display = 'block';
    craftingMenu.setAttribute('data-station', stationType);

    // Set title based on station
    const title = craftingMenu.querySelector('h2');
    if (title) title.textContent = `${stationType.charAt(0).toUpperCase() + stationType.slice(1)} Crafting`;

    // Select default category and update items
    const categoryButtons = craftingMenu.querySelectorAll('.category-btn');
    let selectedFound = false;
    categoryButtons.forEach(btn => {
        if(btn.classList.contains('selected')) selectedFound = true;
    });
    if (!selectedFound && categoryButtons.length > 0) {
        categoryButtons[0].classList.add('selected');
    }
    const currentCategory = craftingMenu.querySelector('.category-btn.selected')?.getAttribute('data-category') || 'tools';
    updateCraftingItems(currentCategory, stationType);

    if (controls.isLocked) controls.unlock();
    closeInventory();
    closeBuildingMenu(false);
    
    // Hide interaction prompt while crafting open
    document.getElementById('interaction-prompt').style.display = 'none';
}

// Function to show the boss altar menu - should be in its own module later
export function showBossAltar() {
    const bossAltar = document.getElementById('boss-altar');
    if (!bossAltar) return;
    
    bossAltar.style.display = 'block';
    if (controls.isLocked) controls.unlock();
    
    // Logic to check for required boss items and enable/disable summon button would go here
}
