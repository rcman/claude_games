// game/building.js
// Handles base building mode, placement logic, and managing placed structures.

import * as THREE from '../libs/three.module.js';
import * as Player from './player.js';
import * as UIManager from './ui.js';
import * as World from './world.js'; // To add placed structures to the world state
import * as Vehicles from './vehicles.js'; // Added for vehicle integration

// --- State ---
let buildModeActive = false;
let currentBuildableData = null; // Data of the item selected for building
let ghostMesh = null; // The transparent placement preview mesh
let sceneRef = null;
let cameraRef = null;
let playerMeshRef = null;
let placedStructures = []; // Array holding data about structures placed in the world

// --- Buildable Items Data (Example) ---
// Should be loaded from data file ideally
const buildables = [
    {
        id: 'wood_wall',
        name: 'Wooden Wall',
        description: 'A simple defensive wall.',
        requires: [{ item: 'planks', count: 5 }],
        category: 'defense',
        // Dimensions needed for ghost mesh and collision
        size: { x: 2, y: 2.5, z: 0.2 },
        // TODO: Add reference to the actual 3D model asset ID
        // modelId: 'wood_wall_model'
    },
    {
        id: 'workbench',
        name: 'Workbench',
        description: 'Allows crafting advanced tools and items.',
        requires: [{ item: 'wood', count: 10 }, { item: 'scrap_metal', count: 2 }],
        category: 'crafting_station',
        size: { x: 1.5, y: 1, z: 0.8 },
        isStation: true, // Flag indicating it's a usable station
        // modelId: 'workbench_model'
    },
    {
         id: 'wood_foundation',
         name: 'Wooden Foundation',
         description: 'Provides a stable base for building.',
         requires: [{ item: 'log', count: 4 }, { item: 'planks', count: 8 }],
         category: 'structure',
         size: { x: 3, y: 0.3, z: 3 },
         // modelId: 'wood_foundation_model'
     },
    // ... Add foundations, roofs, doors, gates, storage, crafting stations etc.
];

// --- Initialization ---
export function init(scene, camera, playerMesh, loadData = null) {
    console.log("Initializing Building System...");
    sceneRef = scene;
    cameraRef = camera;
    playerMeshRef = playerMesh;
    placedStructures = [];

    if (loadData && loadData.building) {
        // Recreate placed structures from saved data
        loadData.building.placedStructures?.forEach(data => {
             placeStructureFromLoad(data);
        });
         console.log(`Building state loaded (${placedStructures.length} structures).`);
    }
}

// --- Update Loop ---
export function update(dt, isPointerLocked) {
    if (buildModeActive && ghostMesh && isPointerLocked) {
        updateGhostMeshPlacement();
    }
}

// --- Build Mode Control ---
export function enterBuildMode() {
    // Check if player is in a vehicle - don't allow building from vehicles
    if (buildModeActive || Player.isInVehicle()) return;
    
    buildModeActive = true;
    // TODO: Show Building UI (categories, items) via UIManager
    UIManager.showBuildUI(getBuildableCategories());
    UIManager.addLogMessage("Entered build mode. Select item and click to place.");
    // Don't create ghost mesh until an item is selected
}

export function exitBuildMode() {
    if (!buildModeActive) return;
    buildModeActive = false;
    removeGhostMesh();
    currentBuildableData = null;
    UIManager.hideBuildUI();
    UIManager.addLogMessage("Exited build mode.");
}

export function isBuildModeActive() {
    return buildModeActive;
}

/**
 * Called when the player selects a buildable item from the UI.
 * @param {string} buildableId The ID of the item to build.
 */
export function selectBuildable(buildableId) {
    if (!buildModeActive) return;

    const data = buildables.find(b => b.id === buildableId);
    if (data) {
        currentBuildableData = data;
        createGhostMesh(currentBuildableData);
        UIManager.addLogMessage(`Selected ${currentBuildableData.name}.`);
    } else {
        console.error(`Buildable item with ID ${buildableId} not found!`);
        currentBuildableData = null;
        removeGhostMesh();
    }
}

// --- Ghost Mesh Logic ---
function createGhostMesh(buildableData) {
    removeGhostMesh(); // Remove previous one if any

    // TODO: Load appropriate model using AssetManager based on buildableData.modelId
    // For now, use BoxGeometry based on size data
    const size = buildableData.size || { x: 1, y: 1, z: 1 };
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        wireframe: false, // Or true for clearer structure
        depthWrite: false // Prevents visual glitches with transparency
     });
    ghostMesh = new THREE.Mesh(geometry, material);
    ghostMesh.userData.canPlace = false; // Flag for placement validity
    // Initial position slightly ahead so it's visible (will be updated)
    sceneRef.add(ghostMesh);
}

function removeGhostMesh() {
    if (ghostMesh) {
        sceneRef.remove(ghostMesh);
        ghostMesh.geometry.dispose();
        ghostMesh.material.dispose();
        ghostMesh = null;
    }
}

function updateGhostMeshPlacement() {
    if (!ghostMesh || !cameraRef || !playerMeshRef || !currentBuildableData) return;

    const placeDistance = 4; // Max distance player can place from self
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, cameraRef); // Center screen

    // TODO: Raycast against ground AND existing structures (from placedStructures list)
    // For now, only raycast against ground object named 'GroundMesh' (adjust name if needed)
    const ground = sceneRef.getObjectByName("GroundMesh"); // Assuming ground mesh is named
    const intersects = ground ? raycaster.intersectObject(ground) : [];

    let targetPosition = null;
    let surfaceNormal = new THREE.Vector3(0, 1, 0); // Default up

    if (intersects.length > 0 && intersects[0].distance <= placeDistance) {
        targetPosition = intersects[0].point;
        surfaceNormal = intersects[0].face.normal; // Get normal of the ground face hit
    } else {
        // If no hit or too far, place at max distance in front of player
        const forward = new THREE.Vector3();
        cameraRef.getWorldDirection(forward);
        targetPosition = playerMeshRef.position.clone().addScaledVector(forward, placeDistance);
        targetPosition.y = 0; // Assume flat ground if no hit
    }

    // --- Placement Logic ---
    // 1. Snapping (Grid, Rotation, Surface)
    // Grid Snap:
    const gridSize = 0.5; // Snap to 0.5 unit grid
    targetPosition.x = Math.round(targetPosition.x / gridSize) * gridSize;
    targetPosition.y = Math.round(targetPosition.y / gridSize) * gridSize; // Optional Y snap
    targetPosition.z = Math.round(targetPosition.z / gridSize) * gridSize;

    // Adjust Y position based on object height (place base on target)
    const objectHeight = currentBuildableData.size?.y || 1;
    targetPosition.y += objectHeight / 2;

    // Rotation Snap (e.g., 90 degrees) - TODO: Add keybinds for rotation (Q/E?)
    // ghostMesh.rotation.y = Math.round(playerMeshRef.rotation.y / (Math.PI / 2)) * (Math.PI / 2);

    // Align to surface normal (optional, good for walls on slopes?)
    // ghostMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceNormal);

    ghostMesh.position.copy(targetPosition);

    // 2. Validation Check
    const isValidPlacement = checkPlacementValidity(ghostMesh);
    ghostMesh.userData.canPlace = isValidPlacement;
    ghostMesh.material.color.setHex(isValidPlacement ? 0x00ff00 : 0xff0000);
    ghostMesh.material.opacity = isValidPlacement ? 0.6 : 0.3;
}

function checkPlacementValidity(meshToCheck) {
    // TODO: Implement more robust checks:
    // 1. Collision check: Use meshToCheck's bounding box/sphere against bounding boxes of:
    //    - Player
    //    - Other placed structures (from placedStructures)
    //    - Key environment objects (trees, rocks - from World)
    //    - Infected?
    // 2. Terrain check: Slope angle, allowed terrain types (e.g., cannot place in water).
    // 3. Structural integrity check (optional, advanced): Requires connection to foundation/other supports?

    // Simple check: Not too close to player
    if (playerMeshRef.position.distanceTo(meshToCheck.position) < Player.playerRadius + 0.5) {
        return false;
    }

    // Simple check: Bounding box intersection with other structures
    const ghostBox = new THREE.Box3().setFromObject(meshToCheck);
    for (const structure of placedStructures) {
        if (structure.mesh) { // Ensure mesh exists
            const structureBox = new THREE.Box3().setFromObject(structure.mesh);
            if (ghostBox.intersectsBox(structureBox)) {
                return false; // Overlapping another structure
            }
        }
    }


    return true; // Placeholder: assume valid for now if basic checks pass
}

// --- Placing Structures ---
/**
 * Called when the player confirms placement (e.g., clicks).
 */
export function tryPlaceStructure() {
    if (!buildModeActive || !ghostMesh || !currentBuildableData || !ghostMesh.userData.canPlace) {
        UIManager.addLogMessage("Cannot place structure here.");
        return false;
    }

    // 1. Check materials
    let hasMaterials = true;
    for (const req of currentBuildableData.requires) {
        if (!Player.hasItem(req.item, req.count)) {
            hasMaterials = false;
            UIManager.addLogMessage(`Missing ${req.count}x ${req.item}.`);
            break;
        }
    }
    if (!hasMaterials) return false;

    // 2. Consume materials
    let consumedOk = true;
    for (const req of currentBuildableData.requires) {
        if (!Player.removeItem(req.item, req.count)) {
            console.error(`Building Error: Failed to remove item ${req.item}.`);
             // TODO: Rollback consumed items if needed
            consumedOk = false;
            break;
        }
    }
    if (!consumedOk) {
        UIManager.addLogMessage("Error consuming materials. Placement cancelled.");
        return false;
    }


    // 3. Create the actual structure
    placeActualStructure(currentBuildableData, ghostMesh.position.clone(), ghostMesh.rotation.clone());

    UIManager.addLogMessage(`Placed ${currentBuildableData.name}!`);
    // TODO: Play placement sound

    // Keep build mode active with the same item selected for faster building?
    // Or exit build mode: exitBuildMode();
    return true;
}

function placeActualStructure(data, position, rotation) {
     // TODO: Load actual model via AssetManager
     const size = data.size || { x: 1, y: 1, z: 1 };
     const geometry = new THREE.BoxGeometry(size.x, size.y, size.z); // Use ghost geometry? Clone it.
     // TODO: Use appropriate material (wood, metal, etc.)
     const material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

     const actualMesh = new THREE.Mesh(geometry, material);
     actualMesh.position.copy(position);
     actualMesh.rotation.copy(rotation);
     actualMesh.castShadow = true;
     actualMesh.receiveShadow = true;
     actualMesh.name = `Structure_${data.id}`; // Identify placed structure
     sceneRef.add(actualMesh);

     // Store data about the placed structure
     const structureData = {
         id: `${data.id}_${Date.now()}`, // Unique ID for this instance
         typeId: data.id, // Original buildable ID
         position: { x: position.x, y: position.y, z: position.z },
         rotation: { x: rotation.x, y: rotation.y, z: rotation.z, order: rotation.order },
         health: 100, // Example: give structures health
         isStation: data.isStation || false,
         mesh: actualMesh, // Keep reference to the mesh (careful with saving this)
     };
     placedStructures.push(structureData);

     // Add structure info to the world module if needed for broader interactions/saving
     World.addEnvironmentObject({ ...structureData, objectType: 'structure' });

     // Make mesh interactive if it's a station
     if (structureData.isStation) {
         actualMesh.userData.interact = (player) => {
             UIManager.addLogMessage(`Using ${data.name}...`);
             // TODO: Open the specific crafting station UI via UIManager
             // UIManager.openCraftingStationUI(data.id); // Pass station type ID
         };
     }

     return actualMesh;
}

// Function to recreate structure meshes when loading a saved game
function placeStructureFromLoad(savedData) {
    const definition = buildables.find(b => b.id === savedData.typeId);
    if (!definition) {
        console.warn(`Could not find buildable definition for loaded structure type: ${savedData.typeId}`);
        return;
    }

    // Combine definition data with saved instance data
    const fullData = { ...definition, ...savedData };

    const position = new THREE.Vector3(savedData.position.x, savedData.position.y, savedData.position.z);
    const rotation = new THREE.Euler(savedData.rotation.x, savedData.rotation.y, savedData.rotation.z, savedData.rotation.order);

    // Call the same function that places a new structure
    // This re-adds the mesh to the scene and the placedStructures array
    placeActualStructure(fullData, position, rotation);
    // Note: This duplicates the entry in placedStructures if not handled carefully.
    // It might be better to have placeActualStructure check if the ID already exists
    // or modify this function to just create mesh and add, not call placeActualStructure.
     // Let's refine: recreate mesh directly
    /*
    const size = definition.size || { x: 1, y: 1, z: 1 };
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `Structure_${definition.id}`;
    sceneRef.add(mesh);

    const structureData = { ...savedData, mesh: mesh }; // Add mesh reference back
    placedStructures.push(structureData);
    World.addEnvironmentObject({ ...structureData, objectType: 'structure' });
    */

    console.log(`Recreated structure: ${definition.name}`);
}


// --- Getters ---
export function getBuildableList() {
    return [...buildables]; // Return copy
}

export function getBuildableCategories() {
    const categories = {};
    buildables.forEach(b => {
        const cat = b.category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(b);
    });
    return categories;
}

export function getPlacedStructures() {
    return [...placedStructures];
}

/**
 * Returns the name of the currently selected buildable item
 * @returns {string} The name of the current buildable or empty string if none selected
 */
export function getCurrentBuildableName() {
    return currentBuildableData ? currentBuildableData.name : '';
}

/**
 * Checks if player is near a crafting station and returns it
 * @returns {object|null} The station data or null if none nearby
 */
export function getStationPlayerIsNear() {
    if (!playerMeshRef) return null;
    
    // Filter placed structures to just stations
    const stations = placedStructures.filter(s => s.isStation);
    
    // Find closest station within interaction range
    const interactionRange = 3.0; // Maximum distance to interact
    let closestStation = null;
    let closestDistance = interactionRange;
    
    for (const station of stations) {
        const distance = playerMeshRef.position.distanceTo(station.mesh.position);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestStation = station;
        }
    }
    
    return closestStation;
}

// --- Persistence ---
export function getState() {
    // Save data *without* the THREE.Mesh references
    const savedStructures = placedStructures.map(s => ({
        id: s.id,
        typeId: s.typeId,
        position: { x: s.position.x, y: s.position.y, z: s.position.z },
        rotation: { x: s.rotation.x, y: s.rotation.y, z: s.rotation.z, order: s.rotation.order },
        health: s.health,
        // Save any other persistent state for the structure
    }));
    return {
        placedStructures: savedStructures
    };
}