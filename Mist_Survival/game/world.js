// game/world.js
// Manages environment, time, weather, mist events, maybe terrain/world objects.

import * as THREE from '../libs/three.module.js';

// --- State ---
let gameTime = 8 * 60 * 60; // Start at 8:00 AM (in seconds)
// Export the time scale constant so main.js can access it
export const secondsPerTick = 60; // How many game seconds pass per real second (adjust for desired speed)
let isMistActive = false;
let mistTimer = 0;
let nextMistCheck = Math.random() * 100 + 50; // Time until next potential mist (real seconds)
const MIST_DURATION_MIN = 20;
const MIST_DURATION_MAX = 60;
let currentMistDuration = 0;
const MIST_CHANCE = 0.3;
let currentHour = 8;
let dayRatio = 0.5; // Placeholder ratio (0=night, 1=day peak)
let nightRatio = 0.5;

let environmentObjects = []; // List of trees, rocks, resource nodes etc.

// --- Initialization ---
export function init(scene, loadData = null) {
    console.log("Initializing World...");
    if (loadData && loadData.world) {
        gameTime = loadData.world.gameTime ?? gameTime;
        isMistActive = loadData.world.isMistActive ?? isMistActive;
        // ... load other world state
        console.log("World state loaded.");
    }
    // TODO: Load initial environment objects (trees, rocks, etc.)
    // Example: spawnInitialResources(scene);
}

// --- Update Loop (called by main.js) ---
/**
 * Updates world time, weather, mist, and environment effects.
 * @param {number} dt Delta time in real seconds.
 * @param {object} scene The THREE.js scene object.
 */
export function update(dt, scene) {
    // --- Update Game Time ---
    gameTime += dt * secondsPerTick;
    currentHour = (gameTime / 3600) % 24;

    // Calculate day/night ratios (example, can be more complex)
    dayRatio = (Math.cos(((currentHour - 12) / 12) * Math.PI) + 1) / 2;
    nightRatio = 1.0 - dayRatio;

    // --- Update Mist ---
    mistTimer += dt;
    if (!isMistActive) {
        if (mistTimer > nextMistCheck) {
            if (Math.random() < MIST_CHANCE) {
                isMistActive = true;
                currentMistDuration = MIST_DURATION_MIN + Math.random() * (MIST_DURATION_MAX - MIST_DURATION_MIN);
                mistTimer = 0;
                 // TODO: Trigger visual/audio cues for mist start via UIManager/AudioManager
                console.log("World: Mist started."); // Use UIManager.addLogMessage ideally
            } else {
                mistTimer = 0;
                nextMistCheck = (Math.random() * 100 + 50) * (nightRatio + 0.5); // Check more often at night?
            }
        }
    } else { // Mist is active
        if (mistTimer > currentMistDuration) {
            isMistActive = false;
            mistTimer = 0;
            nextMistCheck = (Math.random() * 100 + 50) * (nightRatio + 0.5);
            // TODO: Trigger visual/audio cues for mist end
            console.log("World: Mist ended."); // Use UIManager.addLogMessage ideally
        }
    }

    // Update scene visuals if scene is provided
    if (scene) {
        updateSceneBackground(scene);
    }

    // TODO: Update other weather effects (rain, wind visuals/audio)
    // TODO: Update dynamic environment (e.g., resource respawning)
}

/**
 * Returns comprehensive world state for main loop
 * @returns {object} World state object with all relevant properties
 */
export function getWorldState() {
    return {
        gameTime: gameTime,
        isMistActive: isMistActive,
        mistTimer: mistTimer,
        dayRatio: dayRatio,
        nightRatio: nightRatio,
        // Fog and lighting settings for renderer
        fogNear: isMistActive ? 10 : 50, // Shorter visibility in mist
        fogFar: isMistActive ? 40 : 150,
        fogColor: new THREE.Color(
            isMistActive ? 0x557788 : (nightRatio > 0.7 ? 0x111122 : 0x88aaff)
        ),
        ambientIntensity: dayRatio * 0.3 + 0.1, // 0.1 at night, 0.4 at day
        directionalIntensity: dayRatio * 0.8 + 0.1, // 0.1 at night, 0.9 at day
        // Could add sun position calculation here
    };
}

/**
 * Updates scene background based on time of day and mist
 * @param {THREE.Scene} scene The scene to update
 * @returns {THREE.Color} The new background color
 */
export function updateSceneBackground(scene) {
    if (!scene) return;
    
    // Update scene background based on time of day and mist
    let bgColor;
    if (isMistActive) {
        bgColor = new THREE.Color(0x557788); // Misty blue-gray
    } else if (nightRatio > 0.7) {
        bgColor = new THREE.Color(0x111122); // Dark night blue
    } else if (dayRatio > 0.7) {
        bgColor = new THREE.Color(0x88aaff); // Daytime sky blue
    } else {
        // Dawn/dusk gradient
        const dawnDuskColor = new THREE.Color(0xaa8866);
        const dayColor = new THREE.Color(0x88aaff);
        const nightColor = new THREE.Color(0x111122);
        
        if (currentHour < 12) { // Dawn
            bgColor = dawnDuskColor.clone().lerp(dayColor, dayRatio * 1.3);
        } else { // Dusk
            bgColor = dawnDuskColor.clone().lerp(nightColor, nightRatio * 1.3);
        }
    }
    
    scene.background.copy(bgColor);
    return bgColor; // Return for fog color matching
}

// --- Getters ---
export function getCurrentTime() {
    return gameTime;
}

export function getHour() {
    return currentHour;
}

export function getDayRatio() {
    return dayRatio;
}
export function getNightRatio() {
    return nightRatio;
}

export function getIsMistActive() {
    return isMistActive;
}

export function getEnvironmentObjects() {
    return [...environmentObjects]; // Return a copy
}

// --- Modifiers ---
export function addEnvironmentObject(objData) {
    // TODO: Add object to world, potentially with reference to its 3D mesh
    environmentObjects.push(objData);
    console.log("World: Added environment object", objData.id);
}

export function removeEnvironmentObject(objectId) {
    // TODO: Remove object from world, potentially remove its 3D mesh from scene
    environmentObjects = environmentObjects.filter(obj => obj.id !== objectId);
    console.log("World: Removed environment object", objectId);
}

// --- Persistence ---
export function getState() {
    return {
        gameTime,
        isMistActive,
        mistTimer,
        nextMistCheck,
        currentMistDuration,
        environmentObjects // Note: Need a way to serialize/deserialize object state properly
    };
}