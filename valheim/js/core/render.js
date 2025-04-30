// core/render.js - Main game loop and rendering
import * as THREE from 'three';
import { scene, camera, renderer, controls, clock } from './setup.js';
import { gameState } from '../main.js';
import { updatePlayer } from '../player/movement.js';
import { updateEnemies } from '../world/enemies.js';
import { updateBuildingPreview, isBuildMode, selectedBuilding, buildingPreview } from '../building/building.js';
import { updateSunPosition } from '../world/environment.js';
import { updateUI } from './ui.js';

// Main animation loop
let lastTime = performance.now();

export function startAnimationLoop() {
    // Start the animation loop
    animate();
}

function animate() {
    // requestAnimationFrame should be the first thing for smooth timing
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = Math.min(clock.getDelta(), 0.1); // Use THREE.Clock's delta, capped

    // --- Only run game logic updates if controls are locked ---
    if (controls && controls.isLocked === true && gameState.isGameActive) {

        // Update World Time and Environment
        gameState.world.time = (gameState.world.time + delta * 10) % 24000; // Faster time cycle for testing
        updateSunPosition();

        // Update Player (Movement, Stamina, Actions)
        updatePlayer(delta);

        // Update Enemies (AI, Movement)
        updateEnemies(delta);

        // Update Building Preview (if in build mode)
        if (isBuildMode && selectedBuilding && buildingPreview) {
            updateBuildingPreview();
        }
    }

    // --- Always update things that run even when paused/unlocked ---
    // Update water animation (if exists and has uniforms)
    const water = scene.userData.water;
    if (water && water.material?.uniforms?.['time']) {
        water.material.uniforms['time'].value += delta / 2; // Slower water time
    }

    // Always update UI elements (health bars, minimap, time display)
    updateUI();

    // Always render the scene
    try {
         if (renderer) renderer.render(scene, camera);
    } catch (e) {
        console.error("Error during rendering:", e);
    }
}
