// core/ui.js - Handles UI updates and interactions
import * as THREE from 'three';
import { scene, camera, controls } from './setup.js';
import { gameState } from '../main.js';
import { selectToolFromActionBar } from '../player/inventory.js';
import { selectTool, updateBuildingItems, closeBuildingMenu, closeCraftingMenu } from '../building/building.js';
import { generateInventorySlots, updateCraftingItems, closeInventory } from '../player/inventory.js';
import { respawnPlayer } from '../player/movement.js';
import { exitToMenu as mainExitToMenu } from '../main.js';
import { isBuildMode } from '../building/building.js';
import { updateMiniMap, updateInteractionPrompt } from '../utils/helpers.js';

export function setupUI() {
    // --- Action Bar ---
    const actionSlots = document.querySelectorAll('.action-slot');
    actionSlots.forEach((slot, index) => {
        // Add number display (optional)
        slot.setAttribute('data-slot-number', index + 1);

        slot.addEventListener('click', () => {
            selectToolFromActionBar(index);
        });
    });

    // --- Inventory ---
    document.getElementById('close-inventory')?.addEventListener('click', closeInventory);

    // --- Building Menu ---
    const buildingMenu = document.getElementById('building-menu');
    if (buildingMenu) {
        document.getElementById('close-building')?.addEventListener('click', closeBuildingMenu);
        const categoryButtons = buildingMenu.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                const category = button.getAttribute('data-category');
                if (category) updateBuildingItems(category);
            });
        });
    }

    // --- Crafting Menu ---
    const craftingMenu = document.getElementById('crafting');
    if (craftingMenu) {
        document.getElementById('close-crafting')?.addEventListener('click', () => {
            closeCraftingMenu(true);
        });
        const categoryButtons = craftingMenu.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                const category = button.getAttribute('data-category');
                const stationType = craftingMenu.getAttribute('data-station') || 'workbench';
                if (category) updateCraftingItems(category, stationType);
            });
        });
    }

    // --- Boss Altar ---
    const bossAltar = document.getElementById('boss-altar');
    if (bossAltar) {
        document.getElementById('close-altar')?.addEventListener('click', () => {
            bossAltar.style.display = 'none';
            if (gameState.isGameActive) controls.lock();
        });
        document.getElementById('summon-boss')?.addEventListener('click', () => {
            console.log("Attempting to summon boss...");
        });
    }

    // --- Multiplayer Menu Buttons ---
    document.getElementById('host-game-btn')?.addEventListener('click', showHostConfig);
    document.getElementById('join-game-btn')?.addEventListener('click', showJoinServer);
    document.getElementById('back-to-main')?.addEventListener('click', hideMultiplayerMenu);
    document.getElementById('start-host-btn')?.addEventListener('click', startHostedGame);
    document.getElementById('connect-btn')?.addEventListener('click', connectToServer);

    // --- Initial UI State ---
    generateInventorySlots(); // Generate initial empty slots
    updateUI(); // Initial update for health, stamina etc.
}

export function updateUI() {
    // Health and Stamina Bars
    const healthBar = document.getElementById('health');
    const staminaBar = document.getElementById('stamina');
    if (healthBar) healthBar.style.width = Math.max(0, (gameState.player.health / gameState.player.maxHealth * 100)) + '%';
    if (staminaBar) staminaBar.style.width = Math.max(0, (gameState.player.stamina / gameState.player.maxStamina * 100)) + '%';

    // Interaction Prompt (Check proximity to interactable objects)
    // Only update if not in a menu or build mode
    if (controls.isLocked && !isBuildMode) {
        updateInteractionPrompt();
    } else {
        // Hide prompt if controls aren't locked or in build mode
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) prompt.style.display = 'none';
    }

    // Mini-map
    updateMiniMap();
}

export function showOptionsMenu() {
    const optionsMenu = document.getElementById('options-menu');
    if (!optionsMenu) {
        console.error("Options menu element not found in HTML.");
        return;
    }

    // Populate fields with current gameState values
    document.getElementById('graphics-quality').value = gameState.settings.graphicsQuality;
    document.getElementById('render-distance').value = gameState.settings.renderDistance;
    document.getElementById('distance-value').textContent = gameState.settings.renderDistance;
    document.getElementById('sound-volume').value = gameState.settings.soundVolume;
    document.getElementById('music-volume').value = gameState.settings.musicVolume;
    document.getElementById('mouse-sensitivity').value = gameState.settings.sensitivityX; // Assuming X/Y are same
    document.getElementById('invert-y').checked = gameState.settings.invertY;

    optionsMenu.style.display = 'block';
    if (controls.isLocked) controls.unlock();

    // Add listeners if not already added
    document.getElementById('apply-options')?.removeEventListener('click', applyOptions);
    document.getElementById('apply-options')?.addEventListener('click', applyOptions);
    document.getElementById('close-options')?.removeEventListener('click', closeOptionsMenu);
    document.getElementById('close-options')?.addEventListener('click', closeOptionsMenu);
    document.getElementById('render-distance')?.removeEventListener('input', updateDistanceValue);
    document.getElementById('render-distance')?.addEventListener('input', updateDistanceValue);
}

function updateDistanceValue(e) {
    document.getElementById('distance-value').textContent = e.target.value;
}

export function applyOptions() {
    console.log("Applying options...");
    // Read values from form
    gameState.settings.graphicsQuality = document.getElementById('graphics-quality').value;
    gameState.settings.renderDistance = parseInt(document.getElementById('render-distance').value);
    gameState.settings.soundVolume = parseFloat(document.getElementById('sound-volume').value);
    gameState.settings.musicVolume = parseFloat(document.getElementById('music-volume').value);
    const sensitivity = parseFloat(document.getElementById('mouse-sensitivity').value);
    gameState.settings.sensitivityX = sensitivity;
    gameState.settings.sensitivityY = sensitivity; // Apply to both for simplicity
    gameState.settings.invertY = document.getElementById('invert-y').checked;

    // Apply settings that have immediate effect
    controls.pointerSpeed = sensitivity;
    scene.fog.far = gameState.settings.renderDistance;
    camera.far = gameState.settings.renderDistance * 1.2;
    camera.updateProjectionMatrix();

    console.log("Options applied:", gameState.settings);
    closeOptionsMenu();
}

export function closeOptionsMenu() {
    const optionsMenu = document.getElementById('options-menu');
    if (optionsMenu) optionsMenu.style.display = 'none';

    // Decide whether to return to main menu or game
    const wasPaused = document.getElementById('pause-menu')?.style.display === 'block';

    if (wasPaused) {
        // If options opened from pause menu, re-show pause menu
        document.getElementById('pause-menu').style.display = 'block';
    } else if (gameState.isGameActive) {
        // If game was active, try to re-lock controls
        if(!controls.isLocked) controls.lock();
    } else {
        // Otherwise, assume we came from main menu (or game wasn't started)
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('blocker').style.display = 'flex';
    }
}

export function pauseGame() {
    if (!gameState.isGameActive || document.getElementById('pause-menu')?.style.display === 'block') return;

    console.log("Game Paused");
    const pauseMenu = document.getElementById('pause-menu');
    if (!pauseMenu) {
        console.error("Pause menu element not found!");
        return;
    }
    pauseMenu.style.display = 'block';
    if (controls.isLocked) controls.unlock();

    // Add listeners if not already added
    document.getElementById('resume-btn')?.removeEventListener('click', resumeGame);
    document.getElementById('resume-btn')?.addEventListener('click', resumeGame);
    document.getElementById('options-pause-btn')?.removeEventListener('click', showOptionsMenuFromPause);
    document.getElementById('options-pause-btn')?.addEventListener('click', showOptionsMenuFromPause);
    document.getElementById('exit-to-menu-btn')?.removeEventListener('click', exitToMenu);
    document.getElementById('exit-to-menu-btn')?.addEventListener('click', exitToMenu);
}

export function resumeGame() {
    console.log("Game Resumed");
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.style.display = 'none';
    // Only lock controls if game should be active (was running before pause)
    if (gameState.isGameActive) {
        if (!controls.isLocked) controls.lock();
    }
}

export function showOptionsMenuFromPause() {
    // Hide pause menu temporarily
    document.getElementById('pause-menu').style.display = 'none';
    showOptionsMenu();
}

export function exitToMenu() {
    console.log("Exiting to main menu...");
    
    // Hide all game screens
    document.getElementById('pause-menu')?.style.display = 'none';
    document.getElementById('death-screen')?.style.display = 'none';
    document.getElementById('options-menu')?.style.display = 'none';
    document.getElementById('inventory')?.style.display = 'none';
    document.getElementById('crafting')?.style.display = 'none';
    document.getElementById('building-menu')?.style.display = 'none';

    // Mark game as inactive
    gameState.isGameActive = false;
    if (controls.isLocked) controls.unlock();

    // Show main menu and blocker
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('blocker').style.display = 'flex';
}

export function handleEscapeKey() {
    // Priority: Close modals/menus first
    if (document.getElementById('options-menu')?.style.display === 'block') {
        closeOptionsMenu();
    } else if (document.getElementById('pause-menu')?.style.display === 'block') {
        resumeGame();
    } else if (document.getElementById('inventory')?.style.display === 'block') {
        closeInventory();
    } else if (document.getElementById('building-menu')?.style.display === 'block') {
        closeBuildingMenu();
    } else if (document.getElementById('crafting')?.style.display === 'block') {
        closeCraftingMenu();
    } else if (document.getElementById('boss-altar')?.style.display === 'block') {
        document.getElementById('boss-altar').style.display = 'none';
        if(gameState.isGameActive) controls.lock();
    } else if (isBuildMode) {
        exitBuildMode();
    } else if (controls.isLocked) {
        // If in game and no menus open, open pause menu
        pauseGame();
    } else if (!controls.isLocked) {
        // If pointer is unlocked, maybe do nothing on Escape unless main menu is shown
        if(document.getElementById('main-menu')?.style.display === 'flex'){
            // At main menu, Escape usually does nothing
        } else if (document.getElementById('instructions')?.style.display === 'block') {
            // If only instructions are shown, maybe hide them or go back to main menu?
            exitToMenu();
        }
    }
}

// Functions for multiplayer menu - these would need to be properly implemented
export function showHostConfig() { 
    console.warn("Multiplayer not fully implemented."); 
    document.getElementById('server-config').style.display = 'block'; 
    document.getElementById('join-server').style.display = 'none'; 
}

export function showJoinServer() { 
    console.warn("Multiplayer not fully implemented."); 
    document.getElementById('server-config').style.display = 'none'; 
    document.getElementById('join-server').style.display = 'block';
}

export function hideMultiplayerMenu() { 
    document.getElementById('multiplayer-menu').style.display = 'none'; 
    document.getElementById('main-menu').style.display = 'flex';
}

export function startHostedGame() { 
    console.warn("Multiplayer not fully implemented."); 
    alert("Hosting not implemented."); 
    hideMultiplayerMenu(); 
}

export function connectToServer() { 
    console.warn("Multiplayer not fully implemented."); 
    alert("Connecting not implemented."); 
    hideMultiplayerMenu(); 
}
