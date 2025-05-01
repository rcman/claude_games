// game/infected.js
// Manages AI behavior for all infected creatures.

import * as THREE from '../libs/three.module.js';
import * as World from './world.js'; // To check mist status
import * as Player from './player.js'; // To get player position
import * as UIManager from './ui.js'; // Optional: for debug messages

// --- State ---
let infectedList = []; // Array to hold all active infected data and meshes
let sceneRef = null; // Reference to the THREE.js scene
let nextSpawnTime = 5; // Time until next potential spawn check
const SPAWN_INTERVAL_MIN = 15; // Minimum seconds between spawns
const SPAWN_INTERVAL_MAX = 40;
const MAX_INFECTED = 15; // Max infected allowed in the world at once

// --- Initialization ---
export function init(scene, loadData = null) {
    console.log("Initializing Infected Manager...");
    sceneRef = scene;
    infectedList = []; // Clear list on init

    if (loadData && loadData.infected) {
        // TODO: Re-spawn infected based on saved data
        loadData.infected.forEach(infData => spawnInfected(infData.position, infData.state, infData.health));
        console.log(`Infected state loaded (${infectedList.length} individuals).`);
    } else {
        // Spawn initial infected
        const initialSpawns = 3;
        for (let i = 0; i < initialSpawns; i++) {
            spawnInfected(); // Spawn with random defaults
        }
    }
}

// --- Update Loop ---
/**
 * Updates the state and position of all infected.
 * @param {number} dt Delta time in real seconds.
 * @param {object} playerMesh The player's 3D mesh for position tracking.
 */
export function update(dt, playerMesh) {
    if (!sceneRef || !playerMesh) return;

    // Update Spawning
    nextSpawnTime -= dt;
    if (nextSpawnTime <= 0 && infectedList.length < MAX_INFECTED) {
        spawnInfected(); // TODO: Add more sophisticated spawn logic (locations, conditions)
        const worldState = World.getWorldState(); // Need world module for this
        const multiplier = worldState.isMistActive ? 0.5 : (worldState.nightRatio > 0.5 ? 0.7 : 1.0); // Faster spawns in mist/night
        nextSpawnTime = (SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN)) * multiplier;
    }

    // Update individual infected AI
    const isMistActive = World.getIsMistActive();
    const nightRatio = World.getNightRatio();
    const playerPos = playerMesh.position;

    // Iterate backwards for safe removal
    for (let i = infectedList.length - 1; i >= 0; i--) {
        const inf = infectedList[i];
        updateInfectedAI(inf, dt, playerPos, isMistActive, nightRatio);

        // TODO: Implement health and death
        if (inf.health <= 0) {
            handleInfectedDeath(inf, i);
        }
    }
}

function updateInfectedAI(inf, dt, playerPos, isMistActive, nightRatio) {
    const infectedPos = inf.mesh.position;
    const distanceToPlayer = infectedPos.distanceTo(playerPos);

    // AI Parameters affected by environment
    let detectionRange = (isMistActive ? 35 : 18) * (nightRatio > 0.5 ? 1.2 : 1.0);
    let attackRange = 1.8;
    let infectedSpeed = inf.baseSpeed * (isMistActive ? 1.5 : 1.0) * (nightRatio > 0.5 ? 1.1 : 1.0);

    // --- State Logic ---
    const currentState = inf.state;
    let nextState = currentState;

    // Simple state transitions (same as main.js example for now)
    if (distanceToPlayer < attackRange) {
        nextState = 'attacking';
    } else if (distanceToPlayer < detectionRange) {
         if (currentState === 'idle' || currentState === 'wandering') {
             nextState = 'chasing';
             // UIManager.addLogMessage(`Infected ${inf.id} spotted player!`); // Too spammy
         } else if (currentState === 'attacking') {
              nextState = 'chasing';
         }
    } else {
         if (currentState === 'chasing' || currentState === 'attacking') {
             nextState = 'wandering'; // Lose sight
             inf.wanderTarget = playerPos.clone(); // Head towards last known pos
             // UIManager.addLogMessage(`Infected ${inf.id} lost sight.`); // Too spammy
         } else if (currentState === 'wandering') {
             if (!inf.wanderTarget || infectedPos.distanceTo(inf.wanderTarget) < 1.0 || Math.random() < 0.005 / dt) { // Time-adjusted chance
                 nextState = 'idle';
                 inf.wanderTarget = null;
             }
         } else { // Idle
             if (Math.random() < 0.01 / dt) { // Time-adjusted chance
                nextState = 'wandering';
                inf.wanderTarget = getRandomWanderTarget(infectedPos);
             }
         }
    }
    inf.state = nextState;

    // --- Action Logic ---
    switch (inf.state) {
        case 'attacking':
            inf.mesh.material.color.setHex(0xff0000);
            inf.mesh.lookAt(playerPos.x, inf.mesh.position.y, playerPos.z);
            inf.attackCooldown -= dt;
            if (inf.attackCooldown <= 0) {
                // Perform attack (damage applied in Player module via raycast/collision checks ideally)
                // Here, we just trigger damage directly for simplicity
                Player.applyDamage(inf.attackDamage * (isMistActive ? 1.5 : 1.0));
                inf.attackCooldown = inf.attackSpeed; // Reset cooldown
                 // TODO: Play attack sound/animation
            }
            break;
        case 'chasing':
            inf.mesh.material.color.setHex(0xffa500);
            const directionToPlayer = new THREE.Vector3().subVectors(playerPos, infectedPos).normalize();
            directionToPlayer.y = 0;
            moveInfected(inf, directionToPlayer, infectedSpeed * dt);
            inf.mesh.lookAt(playerPos.x, inf.mesh.position.y, playerPos.z);
             inf.attackCooldown = inf.attackSpeed; // Reset attack timer when chasing
            break;
        case 'wandering':
             inf.mesh.material.color.setHex(0xffff00);
             if (inf.wanderTarget) {
                 const directionToTarget = new THREE.Vector3().subVectors(inf.wanderTarget, infectedPos).normalize();
                 directionToTarget.y = 0;
                 if (infectedPos.distanceTo(inf.wanderTarget) > 1.0) {
                     moveInfected(inf, directionToTarget, (infectedSpeed * 0.5) * dt); // Wander slower
                     inf.mesh.lookAt(inf.wanderTarget.x, inf.mesh.position.y, inf.wanderTarget.z);
                 } else {
                     inf.state = 'idle'; // Reached target
                     inf.wanderTarget = null;
                 }
             } else {
                  inf.state = 'idle';
             }
              inf.attackCooldown = inf.attackSpeed; // Reset attack timer
            break;
        case 'idle':
        default:
            inf.mesh.material.color.setHex(0x8B0000);
             inf.attackCooldown = inf.attackSpeed; // Reset attack timer
            // TODO: Idle animation/behavior
            break;
    }

     // Keep infected on the ground (simple) - Physics engine ideal
     inf.mesh.position.y = inf.height / 2;

     // Prevent going out of bounds
     const boundary = 98;
     inf.mesh.position.x = Math.max(-boundary, Math.min(boundary, inf.mesh.position.x));
     inf.mesh.position.z = Math.max(-boundary, Math.min(boundary, inf.mesh.position.z));
}

function moveInfected(inf, direction, distance) {
     // !!! TODO: Implement collision detection against world objects and other infected
     // Simple move for now:
     inf.mesh.position.addScaledVector(direction, distance);
}


function getRandomWanderTarget(currentPos) {
     const wanderDist = 20;
     const target = new THREE.Vector3(
         currentPos.x + (Math.random() - 0.5) * wanderDist * 2,
         currentPos.y, // Keep y the same
         currentPos.z + (Math.random() - 0.5) * wanderDist * 2
     );
     // Clamp to bounds
     const boundary = 98;
     target.x = Math.max(-boundary, Math.min(boundary, target.x));
     target.z = Math.max(-boundary, Math.min(boundary, target.z));
     return target;
}

// --- Spawning & Death ---
let nextInfectedId = 0;
function spawnInfected(position = null, initialState = 'idle', initialHealth = 100) {
    if (!sceneRef) return;

    const infectedHeight = 1.5 + (Math.random() - 0.5) * 0.4; // Vary height slightly
    const geometry = new THREE.BoxGeometry(0.8, infectedHeight, 0.8); // Use Box for now
     // TODO: Load actual infected model using AssetManager
    const material = new THREE.MeshStandardMaterial({ color: 0x8B0000 });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.name = `Infected_${nextInfectedId}`; // Unique name

    if (position) {
        mesh.position.copy(position);
    } else {
         // Default spawn position (random within an area)
         const spawnRadius = 60;
         mesh.position.set(
            (Math.random() - 0.5) * spawnRadius * 2,
            infectedHeight / 2,
            (Math.random() - 0.5) * spawnRadius * 2
         );
         // TODO: Check spawn location validity (not inside objects/player view?)
    }


    const infectedData = {
        id: nextInfectedId++,
        mesh: mesh,
        height: infectedHeight,
        health: initialHealth,
        maxHealth: initialHealth, // Or set a base max health
        state: initialState,
        baseSpeed: 1.0 + Math.random() * 0.5, // Vary base speed
        wanderTarget: null,
        attackDamage: 5 + Math.random() * 3,
        attackSpeed: 1.5 + Math.random() * 0.5, // Seconds between attacks
        attackCooldown: 0,
    };
    mesh.userData.infectedId = infectedData.id; // Link mesh back to data

    infectedList.push(infectedData);
    sceneRef.add(mesh);
    // console.log(`Spawned Infected ${infectedData.id}`); // Use UIManager?
}

function handleInfectedDeath(inf, index) {
    console.log(`Infected ${inf.id} died.`);
    // TODO: Play death animation/sound
    // TODO: Spawn loot? (e.g., World.spawnLoot(inf.mesh.position))

    // Remove mesh from scene
    sceneRef.remove(inf.mesh);
    inf.mesh.geometry.dispose(); // Cleanup geometry
    inf.mesh.material.dispose(); // Cleanup material

    // Remove data from list
    infectedList.splice(index, 1);
}

// --- Public Functions ---

export function applyDamageToInfected(infectedId, amount) {
     const inf = infectedList.find(i => i.id === infectedId);
     if (inf) {
         inf.health -= amount;
         console.log(`Infected ${infectedId} took ${amount} damage, health: ${inf.health}`);
         // TODO: Play hit sound/visual effect on infected mesh
         // Make infected aware (e.g., force state to 'chasing' if hit)
         if (inf.state === 'idle' || inf.state === 'wandering') {
             inf.state = 'chasing';
             UIManager.addLogMessage(`Infected ${inf.id} alerted by attack!`);
         }
         return true;
     }
     return false;
}

export function getInfectedList() {
    // Return data, not meshes directly unless needed
    return infectedList.map(inf => ({ id: inf.id, position: inf.mesh.position, state: inf.state, health: inf.health }));
}

export function isMeshInfected(mesh) {
     // Check if a given mesh belongs to an active infected
     return infectedList.some(inf => inf.mesh === mesh);
}

// --- Persistence ---
export function getState() {
    // Only save essential data to recreate them, not the THREE.Mesh objects
    return infectedList.map(inf => ({
        id: inf.id, // Not strictly needed if re-IDing on load
        position: { x: inf.mesh.position.x, y: inf.mesh.position.y, z: inf.mesh.position.z },
        health: inf.health,
        state: inf.state, // Might reset state on load?
        // Save other relevant persistent stats if needed
    }));
}