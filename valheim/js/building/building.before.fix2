// building/building.js - Building and crafting system
import * as THREE from 'three';
import { scene, camera, controls } from '../core/setup.js';
import { gameState } from '../main.js';
import { getTerrainHeight } from '../world/terrain.js';
import { showGameMessage } from '../utils/helpers.js';

// Building System State
export let isBuildMode = false;
export let selectedBuilding = null;
export let buildingPreview = null;
export let buildingRotation = 0;
export let buildings = [];
export const BUILD_GRID_SIZE = 2; // Size of building grid snap
export const MAX_BUILD_DISTANCE = 10; // How far the player can place things

// Forward declarations to avoid circular dependencies
let terrain; // Will be set from setup.js
let removeItemFromInventory, closeInventory, closeCraftingMenu, addItemToInventory;
let checkCraftingResources, countItemInInventory;
let isInitialized = false;

// Function to set external references
export function initBuilding(terrainRef, invFunctions) {
    terrain = terrainRef;
    
    // Set inventory functions from the inventory module
    if (invFunctions) {
        removeItemFromInventory = invFunctions.removeItemFromInventory;
        closeInventory = invFunctions.closeInventory;
        closeCraftingMenu = invFunctions.closeCraftingMenu;
        addItemToInventory = invFunctions.addItemToInventory;
        checkCraftingResources = invFunctions.checkCraftingResources;
        countItemInInventory = invFunctions.countItemInInventory;
        
        // Mark as initialized when all references are set
        isInitialized = true;
        console.log("Building system initialized");
    } else {
        console.warn("Building system initialized without inventory functions");
    }
}

// Helper to safely get DOM elements
function safeGetElement(id) {
    const element = document.getElementById(id);
    return element;
}

// Building data
export const buildingComponents = {
    foundations: ['wood_foundation', 'stone_foundation'],
    walls: ['wood_wall', 'stone_wall', 'wood_wall_window'],
    roofs: ['thatch_roof', 'wood_roof', 'stone_roof'],
    doors: ['wood_door', 'iron_door'],
    furniture: ['workbench', 'forge', 'chest', 'bed'],
    decorations: []
};

export const buildingData = {
    'wood_foundation': { health: 200, resources: { wood: 10 } },
    'stone_foundation': { health: 500, resources: { stone: 15 } },
    'wood_wall': { health: 150, resources: { wood: 5 } },
    'stone_wall': { health: 400, resources: { stone: 10 } },
    'wood_wall_window': { health: 120, resources: { wood: 4 } },
    'thatch_roof': { health: 100, resources: { wood: 3 } },
    'wood_roof': { health: 180, resources: { wood: 8 } },
    'stone_roof': { health: 450, resources: { stone: 12 } },
    'wood_door': { health: 100, resources: { wood: 4 }, interactable: true, interactionType: 'door' },
    'iron_door': { health: 300, resources: { iron: 6 }, interactable: true, interactionType: 'door' },
    'workbench': { health: 100, resources: { wood: 10 }, interactable: true, interactionType: 'crafting', stationType: 'workbench' },
    'forge': { health: 150, resources: { stone: 10, wood: 5 }, interactable: true, interactionType: 'crafting', stationType: 'forge' },
    'chest': { health: 80, resources: { wood: 10 }, interactable: true, interactionType: 'storage', inventorySize: 20 },
    'bed': { health: 50, resources: { wood: 5 }, interactable: true, interactionType: 'sleep' }
};

export function selectTool(toolName) {
    // Only change tool if it's different
    if (gameState.player.selectedTool === toolName && toolName !== 'hammer') return;

    console.log(`Selected tool: ${toolName}`);
    gameState.player.selectedTool = toolName;

    // Update action bar visuals - check if DOM is ready first
    const slots = document.querySelectorAll('.action-slot');
    if (slots && slots.length > 0) {
        slots.forEach(slot => {
            if (slot.getAttribute('data-item') === toolName) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }

    // Exit build mode if selecting a non-hammer tool
    if (isBuildMode && toolName !== 'hammer') {
        exitBuildMode();
    }

    // Handle specific tool logic (mainly hammer for build mode)
    if (toolName === 'hammer') {
        showGameMessage("Hammer selected. Press [B] to open build menu.", "info");
        const buildModeIndicator = safeGetElement('build-mode-indicator');
        if (buildModeIndicator) buildModeIndicator.style.display = 'block';
    } else {
        // Close build menu if another tool is selected
        closeBuildingMenu(false);
        const buildModeIndicator = safeGetElement('build-mode-indicator');
        if (buildModeIndicator) buildModeIndicator.style.display = 'none';
    }
}

export function toggleBuildingMenu() {
    const buildingMenu = safeGetElement('building-menu');
    if (!buildingMenu) return;

    const isOpen = buildingMenu.style.display === 'block';
    if (isOpen) {
        closeBuildingMenu();
    } else {
        // Ensure hammer is selected
        if (gameState.player.selectedTool !== 'hammer') {
            showGameMessage("Select the Hammer first!", "error");
            return;
        }

        buildingMenu.style.display = 'block';
        if (controls && controls.isLocked) controls.unlock();
        if (closeInventory) closeInventory();
        if (closeCraftingMenu) closeCraftingMenu(false);
        
        // Ensure default category selected and items updated
        const categoryButtons = buildingMenu.querySelectorAll('.category-btn');
        let selectedFound = false;
        categoryButtons.forEach(btn => { if(btn.classList.contains('selected')) selectedFound = true; });
        if (!selectedFound && categoryButtons.length > 0) {
            categoryButtons[0].classList.add('selected');
        }
        
        const currentCategory = buildingMenu.querySelector('.category-btn.selected')?.getAttribute('data-category') || 'foundations';
        updateBuildingItems(currentCategory);
        
        // Hide interaction prompt while build menu open
        const interactionPrompt = safeGetElement('interaction-prompt');
        if (interactionPrompt) interactionPrompt.style.display = 'none';
    }
}

export function closeBuildingMenu(lockControls = true) {
    const buildingMenu = safeGetElement('building-menu');
    if (buildingMenu) buildingMenu.style.display = 'none';

    // If we were selecting an item, exiting menu cancels build mode selection
    if (selectedBuilding) {
        exitBuildMode(lockControls);
    }
    // Re-lock controls if appropriate
    else if (lockControls && gameState.isGameActive &&
        (!safeGetElement('inventory') || safeGetElement('inventory').style.display !== 'block') &&
        (!safeGetElement('crafting') || safeGetElement('crafting').style.display !== 'block') &&
        (!safeGetElement('pause-menu') || safeGetElement('pause-menu').style.display !== 'block') &&
        (!safeGetElement('options-menu') || safeGetElement('options-menu').style.display !== 'block')
    ) {
        if (controls && !controls.isLocked) controls.lock();
    }
}

export function updateBuildingItems(category) {
    const itemsContainer = document.querySelector('#building-menu .building-items');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';
    const itemsInCategory = buildingComponents[category] || [];

    itemsInCategory.forEach(itemName => {
        const itemData = buildingData[itemName];
        if (!itemData) {
            console.warn(`No data found for building item: ${itemName}`);
            return;
        }

        const itemElement = document.createElement('div');
        itemElement.className = 'building-item';
        itemElement.setAttribute('data-item', itemName);

        // Check resources
        const canAfford = checkCraftingResources ? 
            checkCraftingResources(itemData.resources) : 
            true; // If checkCraftingResources isn't available yet, assume can afford
        
        let resourceString = '';
        for (const resName in itemData.resources) {
            const required = itemData.resources[resName];
            const playerHas = countItemInInventory ? 
                countItemInInventory(resName) : 
                0; // If countItemInInventory isn't available yet
            const color = playerHas >= required ? '#afc' : '#fcc';
            resourceString += `<span style="color: ${color};">${resName} x${required} (${playerHas})</span> `;
        }

        itemElement.innerHTML = `
            <div class="item-icon">${getItemIcon(itemName)}</div>
            <div class="item-name">${itemName.replace(/_/g, ' ')}</div>
            <div class="item-cost">${resourceString.trim()}</div>
        `;

        if (!canAfford) {
            itemElement.classList.add('cannot-afford');
        }

        itemElement.addEventListener('click', () => {
            if (canAfford) {
                selectBuildingItem(itemName);
            } else {
                showGameMessage("Not enough resources.", 'error');
            }
        });
        
        itemsContainer.appendChild(itemElement);
    });
}

function selectBuildingItem(itemName) {
    console.log(`Selected building item: ${itemName}`);
    selectedBuilding = itemName;
    buildingRotation = 0; // Reset rotation on new selection
    closeBuildingMenu(false); // Close menu but don't lock controls yet
    enterBuildMode();
}

export function enterBuildMode() {
    if (!selectedBuilding || gameState.player.selectedTool !== 'hammer') return;
    
    console.log("Entering build mode...");
    isBuildMode = true;
    createBuildingPreview();
    
    // Lock controls if they aren't already
    if (controls && !controls.isLocked && gameState.isGameActive) {
        controls.lock();
    }
    
    // Show build mode indicator
    const buildModeIndicator = safeGetElement('build-mode-indicator');
    if (buildModeIndicator) buildModeIndicator.style.display = 'block';
    
    // Hide interaction prompt while building
    const interactionPrompt = safeGetElement('interaction-prompt');
    if (interactionPrompt) interactionPrompt.style.display = 'none';
}

export function exitBuildMode(lockControls = true) {
    if (!isBuildMode) return;
    
    console.log("Exiting build mode.");
    isBuildMode = false;
    selectedBuilding = null;
    buildingRotation = 0;
    removeBuildingPreview();
    
    const buildModeIndicator = safeGetElement('build-mode-indicator');
    if (buildModeIndicator) buildModeIndicator.style.display = 'none';

    // Re-lock controls if needed and no other menu is open
    if (lockControls && gameState.isGameActive &&
        (!safeGetElement('inventory') || safeGetElement('inventory').style.display !== 'block') &&
        (!safeGetElement('crafting') || safeGetElement('crafting').style.display !== 'block') &&
        (!safeGetElement('pause-menu') || safeGetElement('pause-menu').style.display !== 'block') &&
        (!safeGetElement('options-menu') || safeGetElement('options-menu').style.display !== 'block')
    ) {
        if (controls && !controls.isLocked) controls.lock();
    }
}

function createBuildingPreview() {
    removeBuildingPreview(); // Remove old one if exists
    if (!selectedBuilding || !scene) return;

    const itemData = buildingData[selectedBuilding];
    if (!itemData) return;

    // Use placeholder geometry for preview
    let geometry;
    let sizeX = 1, sizeY = 1, sizeZ = 1; // Default
    
    if (selectedBuilding.includes('foundation') || selectedBuilding.includes('roof')) {
        sizeX = 4; sizeY = 0.2; sizeZ = 4;
    } else if (selectedBuilding.includes('wall')) {
        sizeX = 4; sizeY = 4; sizeZ = 0.2;
    } else if (selectedBuilding.includes('door')) {
        sizeX = 1.5; sizeY = 3; sizeZ = 0.2;
    } else if (selectedBuilding === 'workbench' || selectedBuilding === 'forge') {
        sizeX = 2; sizeY = 1; sizeZ = 1;
    } else if (selectedBuilding === 'chest') {
        sizeX = 1; sizeY = 0.8; sizeZ = 0.6;
    }
    
    geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);

    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // Start green (valid placement)
        transparent: true,
        opacity: 0.5,
        wireframe: true,
        depthTest: false, // Render preview on top slightly
    });

    buildingPreview = new THREE.Mesh(geometry, material);
    buildingPreview.rotation.y = buildingRotation; // Apply current rotation
    scene.add(buildingPreview);
}

function removeBuildingPreview() {
    if (!buildingPreview || !scene) return;
    
    scene.remove(buildingPreview);
    // Dispose geometry and material to free memory
    if (buildingPreview.geometry) buildingPreview.geometry.dispose();
    if (buildingPreview.material) buildingPreview.material.dispose();
    buildingPreview = null;
}

export function updateBuildingPreview() {
    if (!buildingPreview || !isBuildMode || !selectedBuilding || !scene || !terrain) {
        removeBuildingPreview(); // Clean up if state is invalid
        return;
    }

    // Check if camera is initialized
    if (!camera) {
        console.warn("Camera not initialized in updateBuildingPreview");
        return;
    }

    // Raycast from camera center to find placement point
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    raycaster.far = MAX_BUILD_DISTANCE;

    // Intersect with terrain AND existing buildings
    const targets = [terrain, ...buildings.filter(b => b !== buildingPreview)];
    const intersects = raycaster.intersectObjects(targets, false);

    let placementPoint = null;
    let targetObject = null;

    if (intersects.length > 0) {
        const intersection = intersects[0];
        placementPoint = intersection.point;
        targetObject = intersection.object;

        // If aiming too close to player, invalidate?
        if (controls && controls.getObject()) {
            const playerPos = controls.getObject().position;
            if (placementPoint.distanceToSquared(playerPos) < 1.0 * 1.0) { // Too close (e.g., 1 meter)
                placementPoint = null; // Invalidate placement
            }
        }
    } else {
        // No intersection within range, hide preview
        if (buildingPreview.parent) scene.remove(buildingPreview);
        return; // Stop update if nothing is hit
    }

    // If placement is invalid, hide and return
    if (!placementPoint) {
        if (buildingPreview.parent) scene.remove(buildingPreview);
        return;
    }

    // Make preview visible if it was hidden
    if (!buildingPreview.parent) scene.add(buildingPreview);

    // --- Snapping Logic ---
    const snappedPosition = placementPoint.clone();
    const isFoundation = selectedBuilding.includes('foundation');
    const isWall = selectedBuilding.includes('wall');
    const isRoof = selectedBuilding.includes('roof');
    const isFurniture = buildingComponents.furniture.includes(selectedBuilding);

    // Snap to grid based on target and piece type
    if (targetObject === terrain && (isFoundation || isFurniture)) {
        // Snap foundations and furniture to grid on terrain
        snappedPosition.x = Math.round(snappedPosition.x / BUILD_GRID_SIZE) * BUILD_GRID_SIZE;
        snappedPosition.z = Math.round(snappedPosition.z / BUILD_GRID_SIZE) * BUILD_GRID_SIZE;
        snappedPosition.y = getTerrainHeight(snappedPosition.x, snappedPosition.z); // Adjust Y to terrain at snapped pos
    } else if (targetObject !== terrain) {
        // Snap to existing building piece (more complex - basic grid snap for now)
        snappedPosition.x = Math.round(snappedPosition.x / (BUILD_GRID_SIZE / 2)) * (BUILD_GRID_SIZE / 2);
        snappedPosition.z = Math.round(snappedPosition.z / (BUILD_GRID_SIZE / 2)) * (BUILD_GRID_SIZE / 2);
        // Adjust Y based on target building's top/connection point?
        // For now, just use the intersection point Y
        snappedPosition.y = placementPoint.y;
    } else {
        // If placing wall/roof on terrain (less common), just use intersection point, maybe snap Y?
        snappedPosition.y = getTerrainHeight(snappedPosition.x, snappedPosition.z);
    }

    // --- Adjust Y position based on piece type and geometry ---
    buildingPreview.geometry.computeBoundingBox(); // Ensure bounding box is calculated
    const previewBox = buildingPreview.geometry.boundingBox;
    if (!previewBox) {
        console.warn("Failed to compute bounding box for building preview");
        return;
    }
    
    const previewHeight = previewBox.max.y - previewBox.min.y;
    // Box geometry origin is center, so offset by half height
    const yOffset = previewHeight / 2;

    if (isFoundation) {
        snappedPosition.y += yOffset; // Place center at adjusted Y
    } else if (isFurniture) {
        snappedPosition.y += yOffset + 0.01; // Place furniture slightly above surface
    } else { // Walls, roofs, doors - try to place base near snapped Y
        snappedPosition.y += yOffset + 0.01; // Adjust Y so base is near target surface
    }

    // Apply snapped position and current rotation
    buildingPreview.position.copy(snappedPosition);
    buildingPreview.rotation.y = buildingRotation;

    // --- Placement Validity Check ---
    const canPlace = checkCanPlaceBuilding();
    if (buildingPreview.material) {
        buildingPreview.material.color.setHex(canPlace ? 0x00ff00 : 0xff0000); // Green if valid, Red if not
        buildingPreview.material.opacity = canPlace ? 0.5 : 0.3;
    }
}

function checkCanPlaceBuilding() {
    if (!buildingPreview || !isInitialized) return false;

    // 1. Check if player has resources
    const itemData = buildingData[selectedBuilding];
    if (!itemData) return false;
    
    if (checkCraftingResources && !checkCraftingResources(itemData.resources)) {
        return false;
    }

    // 2. Check for collisions with existing buildings
    buildingPreview.updateMatrixWorld(); // Ensure world matrix is up to date
    const previewBox = new THREE.Box3().setFromObject(buildingPreview, true); // Use precise box
    // Shrink box slightly to allow pieces to touch without colliding
    previewBox.expandByScalar(-0.02);

    for (const building of buildings) {
        if (!building) continue;
        building.updateMatrixWorld(); // Ensure target matrix is up to date
        const existingBox = new THREE.Box3().setFromObject(building, true);
        if (previewBox.intersectsBox(existingBox)) {
            return false; // Collision detected
        }
    }

    // If all checks pass
    return true;
}

export function placeBuilding() {
    if (!buildingPreview || !isBuildMode || !selectedBuilding || !buildingPreview.parent || !isInitialized) {
        return;
    }

    // Final check for validity
    if (!checkCanPlaceBuilding()) {
        showGameMessage("Cannot place building here!", 'error');
        return;
    }

    const itemData = buildingData[selectedBuilding];
    if (!itemData) return;

    // Consume resources FIRST (only if removeItemFromInventory is available)
    if (removeItemFromInventory) {
        const consumedItems = {};
        let consumptionSuccess = true;
        for (const resName in itemData.resources) {
            const needed = itemData.resources[resName];
            if (removeItemFromInventory(resName, needed)) {
                consumedItems[resName] = needed;
            } else {
                consumptionSuccess = false;
                console.error(`Failed to remove resource ${resName} during placement!`);
                showGameMessage("Crafting failed: Resource error.", 'error');
                // Rollback consumed items if any failed
                for (const consumedName in consumedItems) {
                    if (addItemToInventory) addItemToInventory(consumedName, consumedItems[consumedName]);
                }
                return;
            }
        }
    }

    // Create the actual building mesh (clone preview's geometry/transform)
    const materialMap = {
        wood: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.1 }),
        stone: new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.9, metalness: 0.1 }),
        iron: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.6 }),
        thatch: new THREE.MeshStandardMaterial({ color: 0xc2b280, roughness: 0.9, metalness: 0.0 }),
        default: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7, metalness: 0.1 })
    };
    
    let materialKey = 'default';
    if (selectedBuilding.includes('wood')) materialKey = 'wood';
    else if (selectedBuilding.includes('stone')) materialKey = 'stone';
    else if (selectedBuilding.includes('iron')) materialKey = 'iron';
    else if (selectedBuilding.includes('thatch')) materialKey = 'thatch';

    const finalMaterial = materialMap[materialKey] || materialMap.default;

    const finalBuilding = new THREE.Mesh(buildingPreview.geometry.clone(), finalMaterial);
    finalBuilding.position.copy(buildingPreview.position);
    finalBuilding.rotation.copy(buildingPreview.rotation);
    finalBuilding.castShadow = true;
    finalBuilding.receiveShadow = true;

    // Add user data for interaction, health, etc.
    finalBuilding.userData = {
        id: THREE.MathUtils.generateUUID(),
        type: selectedBuilding,
        health: itemData.health,
        maxHealth: itemData.health,
        placedTime: Date.now(),
        interactable: itemData.interactable || false,
        interactionType: itemData.interactionType || null,
        stationType: itemData.stationType || null,
        // Add inventory for chests etc.
        ...(itemData.interactionType === 'storage' && { inventory: Array(itemData.inventorySize || 10).fill(null) })
    };

    // Add to scene and buildings array
    scene.add(finalBuilding);
    buildings.push(finalBuilding);

    console.log(`Placed ${selectedBuilding} at ${finalBuilding.position.x.toFixed(1)}, ${finalBuilding.position.y.toFixed(1)}, ${finalBuilding.position.z.toFixed(1)}`);

    // Refresh building item list to show updated resource counts
    const currentCategory = document.querySelector('#building-menu .category-btn.selected')?.getAttribute('data-category');
    if (currentCategory) updateBuildingItems(currentCategory);

    // Recreate preview for next placement
    createBuildingPreview();
}

export function clearBuildings() {
    if (!scene) {
        console.warn("Scene not available during clearBuildings");
        return;
    }
    
    if (Array.isArray(buildings)) {
        for (let i = buildings.length - 1; i >= 0; i--) {
            const building = buildings[i];
            if (building instanceof THREE.Mesh) {
                if (building.geometry) building.geometry.dispose();
                if (building.material) {
                    // Dispose material textures
                    if (building.material.map) building.material.map.dispose();
                    building.material.dispose();
                }
                scene.remove(building);
            } else {
                console.warn("Item in buildings array is not a THREE.Mesh:", building);
            }
        }
    } else {
        console.warn("`buildings` is not an array during clear.");
    }
    buildings = [];
}

/**
 * Maps item names to emoji icons
 * @param {string} itemName - The name of the item to get an icon for
 * @returns {string} The emoji icon for the item
 */
function getItemIcon(itemName) {
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
