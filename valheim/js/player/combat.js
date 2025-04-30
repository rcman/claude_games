// player/combat.js - Player combat system
import * as THREE from 'three';
import { gameState } from '../main.js';
import { controls, STAMINA_ATTACK_COST } from '../core/setup.js';
import { enemies } from '../world/enemies.js';
import { addItemToInventory } from '../utils/helpers.js';
import { isBuildMode } from '../building/building.js';

export function attack() {
    // Check cooldown and stamina
    if (gameState.player.cooldowns.attack > 0 || gameState.player.stamina < STAMINA_ATTACK_COST) {
        // playSound('swing_miss'); // Optional: sound for failed attack
        return;
    }
    if (isBuildMode) return; // Don't attack while building

    gameState.player.isAttacking = true;
    gameState.player.attackStartTime = performance.now();
    gameState.player.cooldowns.attack = 500; // Attack cooldown in ms
    gameState.player.stamina -= STAMINA_ATTACK_COST;

    console.log("Player attacks!");
    // playSound('swing'); // Attack sound

    // Actual hit detection happens over the next few frames in updatePlayer
}

export function checkEnemyCombat(playerIsAttacking) {
    const attackRangeSq = 2.5 * 2.5; // Player melee range squared
    const attackAngle = Math.PI / 3; // 60 degree arc

    const playerPos = gameState.player.position;
    const playerDir = new THREE.Vector3();
    controls.getObject().getWorldDirection(playerDir);
    playerDir.y = 0;
    playerDir.normalize();

    let hitEnemy = false;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy || !enemy.mesh) continue;
        const enemyPos = enemy.mesh.position;

        // --- Player attacking enemy ---
        if (playerIsAttacking && playerPos.distanceToSquared(enemyPos) < attackRangeSq) {
            const dirToEnemy = new THREE.Vector3().subVectors(enemyPos, playerPos);
            dirToEnemy.y = 0;
            if (dirToEnemy.lengthSq() < 0.001) continue;
            dirToEnemy.normalize();
            const angle = playerDir.angleTo(dirToEnemy);

            if (angle < attackAngle / 2) {
                // Hit the enemy!
                // Determine damage based on tool/weapon
                let damageAmount = 8; // Base hand damage
                const tool = gameState.player.selectedTool;
                if (tool === 'club') damageAmount = 15;
                else if (tool === 'stone_axe') damageAmount = 12; // Axe can be weapon
                else if (tool === 'sword' || tool === 'iron_sword') damageAmount = 25; // Swords better

                console.log(`Player hit ${enemy.type} for ${damageAmount} damage.`);
                enemy.health -= damageAmount;
                hitEnemy = true;
                // playSound('hit_flesh');
                // showHitEffect(enemyPos);
                // showDamageNumber(enemyPos, damageAmount);

                // Make enemy aggro if hit
                if (enemy.state === 'idle') {
                    enemy.state = 'chase';
                    enemy.aggroTarget = gameState.player;
                }

                if (enemy.health <= 0) {
                    console.log(`${enemy.type} defeated!`);
                    // playSound('enemy_death');
                    // Remove mesh
                    if (enemy.mesh.geometry) enemy.mesh.geometry.dispose();
                    if (enemy.mesh.material) enemy.mesh.material.dispose();
                    scene.remove(enemy.mesh);

                    // Add loot drops
                    enemy.drops.forEach(dropName => {
                        if (Math.random() < 0.5) { // Example: 50% drop chance per item
                            addItemToInventory(dropName);
                            // Or spawn dropped item entity
                        }
                    });
                    // Remove from enemies array
                    enemies.splice(i, 1);
                }
                // Only hit one enemy per swing for now
                break; // Exit loop after hitting one enemy
            }
        }
    }
}
