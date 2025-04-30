// core/input.js - Handles all user input
import { scene, camera, controls } from './setup.js';
import { gameState } from '../main.js';
import { checkInteractions } from '../player/movement.js';
import { attack } from '../player/combat.js';
import { selectToolFromActionBar, toggleInventory, closeInventory } from '../player/inventory.js';
import { showOptionsMenu, pauseGame, exitToMenu, handleEscapeKey } from './ui.js';
import { selectTool, closeCraftingMenu, closeBuildingMenu } from '../building/building.js';
import { placeBuilding, exitBuildMode, enterBuildMode, isBuildMode, buildingRotation, buildingPreview } from '../building/building.js';

// Input state
export const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false,
    inventory: false,
    block: false, // Added for potential blocking mechanic
};

export function setupInput() {
    // Pointer Lock Handling
    const instructions = document.getElementById('instructions');
    const blocker = document.getElementById('blocker');

    const lockHandler = () => {
        console.log("Pointer Locked");
        gameState.isGameActive = true;
        if (instructions) instructions.style.display = 'none';
        if (blocker) blocker.style.display = 'none';
        resetMovementState();
    };

    const unlockHandler = () => {
        console.log("Pointer Unlocked");
        gameState.isGameActive = false;
        if (blocker) blocker.style.display = 'flex';
        // Only show instructions if no other menu is open
        if (instructions &&
            document.getElementById('main-menu')?.style.display === 'none' &&
            document.getElementById('pause-menu')?.style.display === 'none' &&
            document.getElementById('options-menu')?.style.display === 'none'
            ) {
             instructions.style.display = '';
        }
        resetMovementState();
        // Hide build preview if build mode was active
        if (isBuildMode) {
            exitBuildMode(false);
        }
    };

    controls.addEventListener('lock', lockHandler);
    controls.addEventListener('unlock', unlockHandler);

    // Click to lock pointer
    const clickTarget = instructions || blocker || renderer.domElement;
    clickTarget.addEventListener('click', () => {
        // Only try to lock if game is not showing a major menu
        if (!controls.isLocked &&
            document.getElementById('main-menu')?.style.display === 'none' &&
            document.getElementById('options-menu')?.style.display === 'none' &&
            document.getElementById('multiplayer-menu')?.style.display === 'none' &&
            !isBuildMode // Don't lock if trying to click build menu items etc.
            ) {
            controls.lock();
        }
    }, false);

    // Keyboard Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse Listeners
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    // Prevent Context Menu
    document.addEventListener('contextmenu', (event) => {
        // Only prevent during gameplay (when pointer is locked)
        if (controls.isLocked) {
            event.preventDefault();
        }
    });
}

export function onKeyDown(event) {
    // Allow default browser actions if modifier keys are held (e.g., Ctrl+R)
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // If typing in an input field, don't process game keys (except maybe Escape)
    const activeElement = document.activeElement;
    const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');

    if (isTyping && event.code !== 'Escape') {
        return;
    }

    // Handle menu toggles first (inventory, build, map, etc.) or Escape
    switch (event.code) {
        case 'Tab':
        case 'KeyI':
            event.preventDefault();
            toggleInventory();
            return;
        case 'KeyB':
            event.preventDefault();
            if (!isBuildMode) {
                selectTool('hammer');
            } else {
                exitBuildMode();
            }
            return;
        case 'KeyM':
            // toggleMap(); // Future: Toggle a larger map view
            return;
        case 'Escape':
            event.preventDefault();
            handleEscapeKey();
            return;
    }

    // Handle build mode specific keys (Rotation)
    if (isBuildMode) {
        if (event.code === 'KeyR') {
            event.preventDefault();
            // Rotate building preview
            buildingRotation = (buildingRotation + Math.PI / 2) % (Math.PI * 2);
            if (buildingPreview) {
                buildingPreview.rotation.y = buildingRotation;
            }
        }
    }

    // Handle movement and action keys only if controls are locked
    if (!controls.isLocked) return;

    switch (event.code) {
        // Movement
        case 'ArrowUp':
        case 'KeyW':
            keys.forward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.backward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
        case 'Space':
            if (!keys.jump) {
                keys.jump = true;
            }
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            keys.sprint = true;
            break;

        // Actions
        case 'KeyE':
            if (!keys.interact) {
                keys.interact = true;
                checkInteractions();
            }
            break;
        // Action bar keys
        case 'Digit1': selectToolFromActionBar(0); break;
        case 'Digit2': selectToolFromActionBar(1); break;
        case 'Digit3': selectToolFromActionBar(2); break;
        case 'Digit4': selectToolFromActionBar(3); break;
        case 'Digit5': selectToolFromActionBar(4); break;
        case 'Digit6': selectToolFromActionBar(5); break;
        case 'Digit7': selectToolFromActionBar(6); break;
        case 'Digit8': selectToolFromActionBar(7); break;
    }
}

export function onKeyUp(event) {
    // Don't interfere with input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
        return;
    }

    switch (event.code) {
        // Movement
        case 'ArrowUp':
        case 'KeyW':
            keys.forward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.backward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'Space':
            keys.jump = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            keys.sprint = false;
            break;

        // Actions
        case 'KeyE':
            keys.interact = false;
            break;
        case 'KeyF':
            keys.block = false;
            break;
    }
}

export function onMouseDown(event) {
    // Ignore clicks if controls not locked
    if (!controls.isLocked) return;

    // Ignore clicks if interacting with UI elements
    if (event.target !== renderer.domElement) {
        if (event.target.closest('#game-ui') && !event.target.closest('#action-bar')) {
            return;
        }
    }

    switch (event.button) {
        case 0: // Left Mouse Button
            if (isBuildMode) {
                placeBuilding();
            } else {
                attack();
            }
            break;
        case 1: // Middle Mouse Button
            // Ping? Alt attack?
            break;
        case 2: // Right Mouse Button
            if (isBuildMode) {
                exitBuildMode();
            } else {
                keys.block = true;
            }
            break;
    }
}

export function onMouseUp(event) {
    // Ignore if controls not locked
    if (!controls.isLocked) return;

    switch (event.button) {
        case 0: // Left Mouse Button
            // Stop continuous actions if any
            break;
        case 2: // Right Mouse Button
            keys.block = false;
            break;
    }
}

export function resetMovementState() {
    // Reset keys
    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
    keys.jump = false;
    keys.sprint = false;
    keys.interact = false;
    keys.block = false;
    // Reset velocity
    gameState.player.velocity.set(0, 0, 0);
    gameState.player.isRunning = false;
}
