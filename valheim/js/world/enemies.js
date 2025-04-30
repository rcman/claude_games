// world/enemies.js - Enemy generation and AI
import * as THREE from 'three';
import { scene, GRAVITY } from '../core/setup.js';
import { gameState } from '../main.js';
import { biomeNoise, getTerrainHeight, biomeParams } from './terrain.js';
import { damagePlayer } from '../player/movement.js';

export let enemies = [];

// Enemy types
export const enemyTypes = [
    { name: 'draugr',   health: 80,  damage: 15, speed: 2.5, aggro: 15, biomes: ['swamp', 'forest'], drops: ['entrails', 'draugr_trophy'] },
    { name: 'skeleton', health: 40,  damage: 10, speed: 3.0, aggro: 20, biomes: ['forest', 'mountains'], drops: ['bone_fragments', 'skeleton_trophy'] },
    { name: 'wolf',     health: 50,  damage: 12, speed: 4.5, aggro: 25, biomes: ['mountains', 'plains', 'forest'], drops: ['wolf_meat', 'wolf_pelt', 'wolf_fang'] },
    { name: 'troll',    health: 250, damage: 40, speed: 2.0, aggro: 30, biomes: ['forest'], drops: ['troll_hide', 'troll_trophy', 'coins'] },
];

export function generateEnemies() {
    console.log("Generating enemies...");
    const count = 50; // Number of enemies to attempt placing
    const worldSize = 1000;
    const waterLevel = biomeParams.ocean.baseHeight + 1;

    enemies = []; // Clear existing enemies

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * worldSize * 2;
        const z = (Math.random() - 0.5) * worldSize * 2;

        // Get height and biome
        const y = getTerrainHeight(x, z);
        const biomeValue = biomeNoise.noise2D(x * 0.001, z * 0.001);
        let biome = 'meadows';
        if (biomeValue < -0.6) biome = 'ocean';
        else if (biomeValue < -0.3) biome = 'swamp';
        else if (biomeValue < 0.1) biome = 'meadows';
        else if (biomeValue < 0.4) biome = 'forest';
        else if (biomeValue < 0.7) biome = 'plains';
        else biome = 'mountains';

        // Skip if underwater or in ocean
        if (y < waterLevel || biome === 'ocean') continue;

        // Find possible enemy types for this biome
        const possibleEnemies = enemyTypes.filter(enemy => enemy.biomes.includes(biome));

        if (possibleEnemies.length > 0) {
            // Add spawn chance?
            if (Math.random() < 0.3) { // 30% chance to spawn an enemy here if possible
                const enemyTypeData = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
                addEnemy(x, y, z, enemyTypeData);
            }
        }
    }
    console.log(`Generated ${enemies.length} enemies.`);
}

function addEnemy(x, y, z, enemyTypeData) {
    // --- Placeholder Enemy Meshes ---
    let geometry, color, height;
    switch (enemyTypeData.name) {
        case 'draugr':
            geometry = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8); // Capsule = cylinder + spheres
            color = 0x2d5c4a; height = 1.8;
            break;
        case 'skeleton':
            geometry = new THREE.CapsuleGeometry(0.3, 1.1, 4, 8);
            color = 0xdedede; height = 1.7;
            break;
        case 'wolf':
            geometry = new THREE.BoxGeometry(0.6, 0.6, 1.2); // Like a log
            color = 0x666666; height = 0.6;
            break;
        case 'troll':
            geometry = new THREE.CapsuleGeometry(1.0, 2.0, 4, 8);
            color = 0x4a7a8c; height = 4.0;
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1.5, 1); // Default box
            color = 0xaa5522; height = 1.5;
    }

    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
    const mesh = new THREE.Mesh(geometry, material);
    const yOffset = height / 2; // Place base at y
    mesh.position.set(x, y + yOffset, z);
    mesh.castShadow = true;
    scene.add(mesh);

    // --- Enemy State Data ---
    enemies.push({
        id: THREE.MathUtils.generateUUID(),
        type: enemyTypeData.name,
        velocity: new THREE.Vector3(),
        health: enemyTypeData.health,
        maxHealth: enemyTypeData.health,
        damage: enemyTypeData.damage,
        speed: enemyTypeData.speed,
        aggro: enemyTypeData.aggro,
        aggroTarget: null,
        state: 'idle', // Initial state
        lastAttack: 0,
        onGround: true, // Assume starts on ground
        mesh: mesh, // Reference to the visual mesh
        drops: enemyTypeData.drops || [],
    });
}

export function updateEnemies(delta) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy || !enemy.mesh) continue; // Safety check

        const enemyPos = enemy.mesh.position; // Use mesh position as source of truth for enemies
        const playerPos = gameState.player.position;
        const distanceToPlayer = enemyPos.distanceTo(playerPos);

        // Simple optimization: skip updates if very far away
        if (distanceToPlayer > gameState.settings.renderDistance * 0.8) { // Only update if within 80% of render distance
            // Maybe despawn logic here?
            continue;
        }

        const onGround = enemy.onGround; // Need to track enemy ground state

        // Apply friction/damping
        const damping = onGround ? 10.0 : 1.0;
        enemy.velocity.x -= enemy.velocity.x * damping * delta;
        enemy.velocity.z -= enemy.velocity.z * damping * delta;

        // --- State Machine ---
        switch (enemy.state) {
            case 'idle':
                // Check for player aggro
                if (distanceToPlayer < enemy.aggro) {
                    enemy.state = 'chase';
                    enemy.aggroTarget = gameState.player; // Target the player state
                } else {
                    // Optional: Random wandering
                    if (Math.random() < 0.01 * delta * 60) { // Adjust frequency based on delta
                        const wanderAngle = Math.random() * Math.PI * 2;
                        enemy.velocity.x = Math.sin(wanderAngle) * enemy.speed * 0.5;
                        enemy.velocity.z = Math.cos(wanderAngle) * enemy.speed * 0.5;
                        // Face wander direction
                        if (enemy.velocity.lengthSq() > 0.01) {
                            enemy.mesh.rotation.y = Math.atan2(enemy.velocity.x, enemy.velocity.z);
                        }
                    }
                }
                break;

            case 'chase':
                if (distanceToPlayer < 1.8) { // Attack range
                    enemy.state = 'attack';
                    enemy.velocity.x = 0; // Stop moving to attack
                    enemy.velocity.z = 0;
                    enemy.lastAttack = performance.now() + (Math.random() * 500); // Add slight delay variability
                } else if (distanceToPlayer > enemy.aggro * 1.5) { // De-aggro range
                    enemy.state = 'idle';
                    enemy.aggroTarget = null;
                    enemy.velocity.x = 0; // Stop chasing
                    enemy.velocity.z = 0;
                } else {
                    // Move towards player
                    const direction = new THREE.Vector3().subVectors(playerPos, enemyPos);
                    direction.y = 0; // Move along XZ plane
                    direction.normalize();
                    enemy.velocity.addScaledVector(direction, enemy.speed * 15.0 * delta); // Apply acceleration
                    // Cap speed
                    const currentSpeedSq = enemy.velocity.x * enemy.velocity.x + enemy.velocity.z * enemy.velocity.z;
                    if (currentSpeedSq > enemy.speed * enemy.speed) {
                        const currentSpeed = Math.sqrt(currentSpeedSq);
                        const scale = enemy.speed / currentSpeed;
                        enemy.velocity.x *= scale;
                        enemy.velocity.z *= scale;
                    }
                    // Face the player
                    enemy.mesh.rotation.y = Math.atan2(direction.x, direction.z);
                }
                break;

            case 'attack':
                // Face the player
                const directionToPlayer = new THREE.Vector3().subVectors(playerPos, enemyPos);
                directionToPlayer.y = 0; // Only consider horizontal rotation
                // Check if direction is valid before calculating angle
                if (directionToPlayer.lengthSq() > 0.001) {
                    directionToPlayer.normalize();
                    enemy.mesh.rotation.y = Math.atan2(directionToPlayer.x, directionToPlayer.z);
                }

                // Attack cooldown logic
                const attackCooldown = 2000; // ms
                if (performance.now() > enemy.lastAttack + attackCooldown) {
                    if (distanceToPlayer < 2.2) { // Check range again before actual hit
                        // Attack animation start (visual only for now)
                        console.log(`${enemy.type} attacks!`);
                        damagePlayer(enemy.damage);
                        enemy.lastAttack = performance.now(); // Reset cooldown timer
                    } else {
                        // Player moved out of range, go back to chase
                        enemy.state = 'chase';
                    }
                } else if (distanceToPlayer > 2.5) {
                    // Player moved away during cooldown, go back to chase
                    enemy.state = 'chase';
                }
                break;
        }

        // Apply Gravity
        if (!onGround) {
            enemy.velocity.y -= GRAVITY * delta;
        }

        // Apply position delta
        enemyPos.addScaledVector(enemy.velocity, delta);

        // Ground Collision
        const terrainY = getTerrainHeight(enemyPos.x, enemyPos.z);
        // Approximate enemy height from geometry if possible
        let enemyHeight = 1.0; // Default height
        if (enemy.mesh.geometry.parameters) {
            if (enemy.mesh.geometry.parameters.height) {
                enemyHeight = enemy.mesh.geometry.parameters.height;
            } else if (enemy.mesh.geometry.parameters.radius) {
                enemyHeight = enemy.mesh.geometry.parameters.radius * 2; // Approximation for spheres/capsules
            }
        }
        const enemyGroundThreshold = terrainY + enemyHeight * 0.5; // Base at feet approx

        if (enemyPos.y < enemyGroundThreshold) {
            enemyPos.y = enemyGroundThreshold;
            enemy.velocity.y = 0;
            enemy.onGround = true;
        } else {
            enemy.onGround = false;
        }
    }
}

export function clearEnemies() {
    if (Array.isArray(enemies)) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (enemy && enemy.mesh instanceof THREE.Mesh) {
                if (enemy.mesh.geometry) enemy.mesh.geometry.dispose();
                if (enemy.mesh.material) {
                    if (enemy.mesh.material.map) enemy.mesh.material.map.dispose();
                    enemy.mesh.material.dispose();
                }
                scene.remove(enemy.mesh);
            } else if (enemy && !enemy.mesh) {
                console.warn("Enemy object found without a mesh:", enemy);
            }
        }
    } else {
        console.warn("`enemies` is not an array during clear.");
    }
    enemies = [];
}
