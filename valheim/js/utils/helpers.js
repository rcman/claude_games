// utils/helpers.js - Utility functions used throughout the game
import * as THREE from 'three';
import { scene, controls } from '../core/setup.js';
import { gameState } from '../main.js';
import { resources } from '../world/resources.js';
import { enemies } from '../world/enemies.js';
import { buildings } from '../building/building.js';
import { biomeNoise } from '../world/terrain.js';

export function showGameMessage(message, type = 'info') {
    const messageArea = document.getElementById('game-messages');
    if (!messageArea) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;

    messageArea.appendChild(messageElement);

    // Automatically remove the message after a delay
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => messageElement.remove(), 500); // Remove from DOM after fade
    }, 3000); // Show message for 3 seconds
}

export function getItemIcon(itemName) {
    // Map item names to simple icons
    const iconMap = {
        'wood': '🌳', 'stone': '🪨', 'flint': '🔪', 'hand': '✋',
        'Stone Axe': '🪓', 'Stone Pickaxe': '⛏️', 'Hammer': '🔨', 'axe': '🪓', 'pickaxe': '⛏️', 'hammer': '🔨',
        'Club': '🏏', 'Wood Shield': '🛡️', 'Torch': '🔥', 'Chest': '📦', 'shield': '🛡️',
        'iron_ore': '🔩', 'copper_ore': '🥉', 'silver_ore': '🥈', 'iron': '🔩',
        'Iron Axe': '🪓', 'Iron Sword': '⚔️', 'sword': '⚔️',
        'wood_foundation': '🟫', 'stone_foundation': '⬜',
        'wood_wall': '🧱', 'stone_wall': '🏰', 'wood_wall_window': '🪟',
        'thatch_roof': '🛖', 'wood_roof': '🏠', 'stone_roof': '🏛️',
        'wood_door': '🚪', 'iron_door': '🚪',
        'workbench': '🛠️', 'forge': '🔥', 'bed': '🛏️',
        'food': '🍖',
        'wolf_meat': '🍖', 'bone_fragments': '🦴', 'entrails': '🧠', 'wolf_pelt': '🧥', 'troll_hide': '🧥', 'coins': '💰',
        'wolf_fang': '🦷',
        'draugr_trophy': '🏆', 'skeleton_trophy': '🏆', 'troll_trophy': '🏆', 'wolf_trophy': '🏆',
        'bow': '🏹',
        'default': '❓'
    };
    
    const key = itemName || 'default';
    return iconMap[key] || iconMap['default'];
}

export function updateMiniMap() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const mapSize = canvas.width; // Use canvas size
    const mapRadius = mapSize / 2;
    const mapScale = 0.5; // World Units per pixel (lower value = more zoomed in)
    const viewRange = mapRadius / mapScale; // World units visible from center to edge

    const playerX = gameState.player.position.x;
    const playerZ = gameState.player.position.z;

    // Player direction for rotation
    const playerDir = new THREE.Vector3();
    controls.getObject().getWorldDirection(playerDir); // Use camera direction

    // Calculate rotation angle for map content (so North is always up on the map canvas)
    const mapRotation = Math.atan2(playerDir.x, playerDir.z);

    // Clear canvas
    ctx.clearRect(0, 0, mapSize, mapSize);

    // --- Draw Map Content ---
    ctx.save(); // Save context state
    // Translate to center and rotate opposite to player direction
    ctx.translate(mapRadius, mapRadius);
    ctx.rotate(-mapRotation);

    // Draw background (slightly transparent biome colors)
    const step = 10; // World units per grid cell for terrain background
    const drawSize = step * mapScale;
    for (let dx = -viewRange - step; dx <= viewRange + step; dx += step) {
        for (let dz = -viewRange - step; dz <= viewRange + step; dz += step) {
            // World coordinates of the cell center
            const worldX = playerX + dx;
            const worldZ = playerZ + dz;

            // Screen coordinates relative to rotated center
            const screenX = dx * mapScale;
            const screenZ = dz * mapScale;

            // Rough check if cell is potentially visible (optimization)
            if (Math.abs(screenX) > mapRadius + drawSize || Math.abs(screenZ) > mapRadius + drawSize) continue;

            // Get biome color
            const biomeValue = biomeNoise.noise2D(worldX * 0.001, worldZ * 0.001);
            let biomeColor = 'rgba(136, 187, 68, 0.5)'; // Default meadows with alpha
            if (biomeValue < -0.6) biomeColor = 'rgba(51, 102, 170, 0.5)'; // ocean
            else if (biomeValue < -0.3) biomeColor = 'rgba(85, 119, 85, 0.5)'; // swamp
            else if (biomeValue < 0.1) biomeColor = 'rgba(136, 187, 68, 0.5)'; // meadows
            else if (biomeValue < 0.4) biomeColor = 'rgba(34, 136, 51, 0.5)'; // forest
            else if (biomeValue < 0.7) biomeColor = 'rgba(221, 204, 85, 0.5)'; // plains
            else biomeColor = 'rgba(170, 170, 170, 0.5)'; // mountains

            ctx.fillStyle = biomeColor;
            ctx.fillRect(screenX - drawSize / 2, screenZ - drawSize / 2, drawSize, drawSize);
        }
    }

    // Draw map icons (enemies, resources, buildings) - relative to rotated center
    drawMapIcons(ctx, playerX, playerZ, mapScale, viewRange, mapRadius);

    ctx.restore(); // Restore context state (removes rotation/translation)

    // --- Draw Player Marker (Always at center, pointing up) ---
    // Player marker (triangle shape)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mapRadius, mapRadius - 6); // Top point slightly higher
    ctx.lineTo(mapRadius - 4, mapRadius + 4); // Bottom left
    ctx.lineTo(mapRadius + 4, mapRadius + 4); // Bottom right
    ctx.closePath();
    ctx.fill();
    ctx.stroke(); // Add outline
}

function drawMapIcons(ctx, playerX, playerZ, mapScale, viewRange, mapRadius) {
    const iconRadiusSq = mapRadius * mapRadius; // Use squared radius for checks

    // Enemies (Red dots)
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        if (!enemy || !enemy.mesh) return;
        const dx = enemy.mesh.position.x - playerX;
        const dz = enemy.mesh.position.z - playerZ;
        const screenX = dx * mapScale;
        const screenZ = dz * mapScale;
        // Check if the icon center is within the map circle
        if (screenX * screenX + screenZ * screenZ <= iconRadiusSq) {
            ctx.beginPath();
            ctx.arc(screenX, screenZ, 3, 0, Math.PI * 2); // Small circle
            ctx.fill();
        }
    });

    // Resources (e.g., Green for trees, Grey for stone)
    resources.forEach(resource => {
        if (!resource || !resource.position) return;
        const dx = resource.position.x - playerX;
        const dz = resource.position.z - playerZ;
        const screenX = dx * mapScale;
        const screenZ = dz * mapScale;
        if (screenX * screenX + screenZ * screenZ <= iconRadiusSq) {
            ctx.fillStyle = resource.type === 'tree' ? '#006400' : '#888888'; // DarkGreen or Grey
            ctx.beginPath();
            ctx.arc(screenX, screenZ, 2, 0, Math.PI * 2); // Smaller circle
            ctx.fill();
        }
    });

    // Buildings (e.g., Brown squares)
    ctx.fillStyle = '#8B4513'; // Brown
    buildings.forEach(building => {
        if (!building) return;
        const dx = building.position.x - playerX;
        const dz = building.position.z - playerZ;
        const screenX = dx * mapScale;
        const screenZ = dz * mapScale;
        if (screenX * screenX + screenZ * screenZ <= iconRadiusSq) {
            // Draw different icons based on type? For now, just squares.
            if (building.userData && building.userData.type === 'bed') ctx.fillStyle = '#ffaaaa'; // Light red for bed
            else if (building.userData && (building.userData.type === 'workbench' || building.userData.type === 'forge')) ctx.fillStyle = '#ffffaa'; // Yellow for stations
            else ctx.fillStyle = '#8B4513'; // Default brown

            ctx.fillRect(screenX - 2, screenZ - 2, 4, 4); // Small square
        }
    });
}

export function updateInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (!prompt) return;

    const checkDistSq = 2.5 * 2.5;
    const playerPos = gameState.player.position;
    let closestInteractable = null;
    let minDistSq = checkDistSq;
    let interactText = '';

    // Check buildings first
    for (const building of buildings) {
        if (building.userData && building.userData.interactable) {
            const distSq = building.position.distanceToSquared(playerPos);
            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestInteractable = building;
                // Determine interaction text based on type
                switch(building.userData.interactionType) {
                    case 'crafting': interactText = `Use ${building.userData.stationType}`; break;
                    case 'storage': interactText = `Open Chest`; break;
                    case 'sleep': interactText = `Sleep`; break;
                    case 'door': interactText = `Use Door`; break;
                    case 'boss_altar': interactText = `Use Altar`; break;
                    default: interactText = `Interact with ${building.userData.type}`;
                }
            }
        }
    }

    // Check resources if no building found or if resource is closer
    for (const resource of resources) {
        // Only check specific types for direct pickup (e.g., flint)
        if (resource.subType === 'flint' && resource.type === 'node') {
            const distSq = resource.position.distanceToSquared(playerPos);
            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestInteractable = resource; // Mark resource as closest
                interactText = `Pick up ${resource.subType}`;
            }
        }
    }

    // Show/hide prompt
    if (closestInteractable) {
        prompt.textContent = `[E] ${interactText}`;
        prompt.style.display = 'block';
    } else {
        prompt.style.display = 'none';
    }
}

// Export any inventory helper functions that were duplicated elsewhere
export function addItemToInventory(itemName, quantity = 1) {
    // Import the proper function from player/inventory
    // This is a temporary solution to circular dependencies
    if (typeof window.addItemToInventory === 'function') {
        return window.addItemToInventory(itemName, quantity);
    }
    
    // Otherwise provide basic implementation
    const emptySlotIndex = gameState.player.inventory.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
        gameState.player.inventory[emptySlotIndex] = itemName;
        console.log(`Added ${itemName} to inventory slot ${emptySlotIndex}`);
        showGameMessage(`+1 ${itemName}`);
        return true;
    } else {
        console.log('Inventory full!');
        showGameMessage('Inventory full!', 'error');
        return false;
    }
}
