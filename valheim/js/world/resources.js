// world/resources.js - Resource generation and management
import * as THREE from 'three';
import { scene, controls } from '../core/setup.js';
import { gameState } from '../main.js';
import { biomeNoise, detailNoise, getTerrainHeight, biomeParams } from './terrain.js';
import { showGameMessage, addItemToInventory } from '../utils/helpers.js';

export let resources = [];

// Resource types
export const resourceTypes = [
    { name: 'stone', health: 50, dropItem: 'stone' },
    { name: 'flint', health: 20, dropItem: 'flint' },
    { name: 'wood', health: 60, dropItem: 'wood'}, // Assumed wood comes from trees
    { name: 'copper', health: 80, dropItem: 'copper_ore' },
    { name: 'iron', health: 100, dropItem: 'iron_ore' },
    { name: 'silver', health: 120, dropItem: 'silver_ore' },
];

export function generateResources() {
    console.log("Generating resources...");
    const count = 500; // Number of resource nodes/trees to attempt placing
    const worldSize = 1000; // Area to spawn in (radius from center)
    const waterLevel = biomeParams.ocean.baseHeight + 1;

    resources = []; // Clear existing resources before generating new ones

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * worldSize * 2;
        const z = (Math.random() - 0.5) * worldSize * 2;

        // Get height and biome at this position
        const y = getTerrainHeight(x, z);
        const biomeValue = biomeNoise.noise2D(x * 0.001, z * 0.001);
        let biome = 'meadows';
        if (biomeValue < -0.6) biome = 'ocean';
        else if (biomeValue < -0.3) biome = 'swamp';
        else if (biomeValue < 0.1) biome = 'meadows';
        else if (biomeValue < 0.4) biome = 'forest';
        else if (biomeValue < 0.7) biome = 'plains';
        else biome = 'mountains';

        const params = biomeParams[biome];

        // Skip if underwater or in ocean biome generally
        if (y < waterLevel || biome === 'ocean') continue;

        const resourceRoll = Math.random();

        // Trees
        if (params.trees && resourceRoll < params.trees.density && params.trees.types.length > 0) {
            const treeType = params.trees.types[Math.floor(Math.random() * params.trees.types.length)];
            addTree(x, y, z, treeType);
        }
        // Other resources (stones, ores, etc.)
        else if (params.resources && params.resources.length > 0) {
            // Add density check for non-tree resources? Assume 10% chance for now if not tree
            if (Math.random() < 0.1) {
                const resourceType = params.resources[Math.floor(Math.random() * params.resources.length)];
                // Only spawn ores in mountains/caves(future)
                if ((resourceType === 'iron' || resourceType === 'silver' || resourceType === 'copper') && biome !== 'mountains') {
                    // Maybe spawn stone instead?
                    if (params.resources.includes('stone')) addResourceNode(x, y, z, 'stone');
                } else {
                    addResourceNode(x, y, z, resourceType);
                }
            }
        }
    }
    console.log(`Generated ${resources.length} resource nodes/trees.`);
}

function addTree(x, y, z, treeType) {
    // --- Placeholder Tree Meshes ---
    let trunkHeight = 5 + (Math.random() - 0.5) * 2;
    let trunkRadius = 0.3 + (Math.random()) * 0.4;
    let foliageShape, foliageSize, foliageColor, foliageYOffset;

    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + trunkHeight / 2, z); // Position base at y
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    switch (treeType) {
        case 'pine':
        case 'fir':
            foliageShape = new THREE.ConeGeometry(trunkRadius * 4, trunkHeight * 1.2, 8);
            foliageColor = 0x2d4c2a; // Dark green
            foliageYOffset = trunkHeight * 0.7;
            break;
        case 'birch':
            foliageShape = new THREE.SphereGeometry(trunkRadius * 4, 8, 6);
            foliageColor = 0x76b349; // Lighter green
            foliageYOffset = trunkHeight * 0.9;
            trunkMaterial.color.set(0xf0f0e1); // Birch trunk color
            break;
        case 'oak':
        default:
            foliageShape = new THREE.SphereGeometry(trunkRadius * 5, 8, 6);
            foliageColor = 0x4a7c34; // Standard green
            foliageYOffset = trunkHeight * 0.85;
            break;
    }

    const foliageMaterial = new THREE.MeshStandardMaterial({ color: foliageColor });
    const foliage = new THREE.Mesh(foliageShape, foliageMaterial);
    foliage.position.set(x, y + foliageYOffset, z);
    foliage.castShadow = true;
    scene.add(foliage);

    // --- Resource Data ---
    const resourceData = resourceTypes.find(r => r.name === 'wood'); // Assuming trees drop 'wood'
    resources.push({
        id: THREE.MathUtils.generateUUID(), // Unique ID
        type: 'tree',
        subType: treeType,
        position: new THREE.Vector3(x, y, z), // Base position
        health: resourceData ? resourceData.health : 50,
        maxHealth: resourceData ? resourceData.health : 50,
        meshes: [trunk, foliage], // Keep track of meshes
        drops: resourceData ? [resourceData.dropItem] : ['wood'], // What it drops
        interactable: true, // Can be targeted
    });
}

function addResourceNode(x, y, z, resourceType) {
    const resourceData = resourceTypes.find(r => r.name === resourceType);
    if (!resourceData) {
        console.warn(`Resource type ${resourceType} not found in resourceTypes.`);
        return;
    }

    let geometry, nodeColor, nodeScale;
    const baseScale = 0.8;

    switch (resourceType) {
        case 'stone':
            geometry = new THREE.DodecahedronGeometry(baseScale + Math.random() * 0.4, 0); // More facets
            nodeColor = 0x888888;
            break;
        case 'flint':
            geometry = new THREE.TetrahedronGeometry(baseScale * 0.6 + Math.random() * 0.2, 0);
            nodeColor = 0x555555;
            break;
        case 'copper': // Example ore colors
        case 'iron':
        case 'silver':
             geometry = new THREE.IcosahedronGeometry(baseScale * 1.1 + Math.random() * 0.5, 0); // Different shape for ores
             // Base rock color with ore veins/color lerp
             nodeColor = new THREE.Color(0x888888);
             let oreColor = 0xffffff;
             if(resourceType === 'copper') oreColor = 0xcd7f32;
             if(resourceType === 'iron') oreColor = 0x9c644d; // Rusty brown/grey
             if(resourceType === 'silver') oreColor = 0xc0c0c0;
             nodeColor.lerp(new THREE.Color(oreColor), 0.4); // Mix base rock with ore color
            break;
        default: // Should not happen if resourceData found, but include fallback
            geometry = new THREE.SphereGeometry(baseScale, 6, 4); // Simple sphere fallback
            nodeColor = 0xaaaaaa;
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: nodeColor, 
        roughness: 0.8, 
        metalness: (resourceType !== 'stone' && resourceType !== 'flint') ? 0.4 : 0.1 
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    // Calculate y offset based on geometry bounding sphere/box if available
    geometry.computeBoundingSphere();
    const yOffset = geometry.boundingSphere.radius * 0.5; // Place roughly half into ground

    mesh.position.set(x, y + yOffset, z);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI); // Random rotation
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // --- Resource Data ---
    resources.push({
        id: THREE.MathUtils.generateUUID(),
        type: 'node', // Generic type for non-tree resources
        subType: resourceType,
        position: mesh.position.clone(), // Center position
        health: resourceData.health,
        maxHealth: resourceData.health,
        meshes: [mesh],
        drops: [resourceData.dropItem],
        interactable: true, // Can be targeted/picked up
    });
}

export function checkResourceCollection() {
    // Called during player attack swing
    const attackRangeSq = 2.5 * 2.5; // Use squared distance
    const attackAngle = Math.PI / 3; // 60 degree arc in front

    const playerPos = gameState.player.position;
    const playerDir = new THREE.Vector3();
    controls.getObject().getWorldDirection(playerDir); // Get camera direction
    playerDir.y = 0; // Project onto XZ plane
    playerDir.normalize();

    let hit = false; // Flag to ensure only one thing hit per swing

    for (let i = resources.length - 1; i >= 0; i--) {
        const resource = resources[i];
        if (!resource || !resource.position) continue; // Safety check
        const resourcePos = resource.position; // Use resource base/center position

        // Quick distance check
        if (playerPos.distanceToSquared(resourcePos) > attackRangeSq) continue;

        // Angle check (is it roughly in front?)
        const dirToResource = new THREE.Vector3().subVectors(resourcePos, playerPos);
        dirToResource.y = 0; // Check on XZ plane
        if (dirToResource.lengthSq() < 0.001) continue; // Skip if resource is exactly at player pos
        dirToResource.normalize();

        const angle = playerDir.angleTo(dirToResource);

        if (angle < attackAngle / 2) {
            // Hit the resource!
            // Determine damage based on tool (needs gameState.player.selectedTool)
            let damageAmount = 5; // Base hand damage
            const tool = gameState.player.selectedTool;
            const resourceMaterial = (resource.type === 'tree') ? 'wood' : (resource.subType === 'stone' || resource.subType === 'flint' ? 'stone' : 'ore');

            if (tool === 'axe' && resourceMaterial === 'wood') damageAmount = 20;
            else if (tool === 'pickaxe' && (resourceMaterial === 'stone' || resourceMaterial === 'ore')) damageAmount = 25;
            else if (tool === 'stone_axe' && resourceMaterial === 'wood') damageAmount = 15; // Tiered tools
            else if (tool === 'stone_pickaxe' && (resourceMaterial === 'stone' || resourceMaterial === 'ore')) damageAmount = 18;

            console.log(`Hit ${resource.subType || resource.type} with ${tool} for ${damageAmount} damage.`);
            resource.health -= damageAmount;
            hit = true;

            if (resource.health <= 0) {
                console.log(`${resource.subType || resource.type} destroyed!`);

                // Remove meshes from scene
                resource.meshes.forEach(mesh => {
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) mesh.material.dispose();
                    scene.remove(mesh);
                });

                // Add drops to inventory (or drop items in world)
                const dropCount = 1 + Math.floor(Math.random() * 3); // Drop 1-3 items
                for (let d = 0; d < dropCount; d++) {
                    if (resource.drops && resource.drops.length > 0) {
                        const dropItemName = resource.drops[Math.floor(Math.random() * resource.drops.length)]; // Get a random drop if multiple
                        addItemToInventory(dropItemName);
                    }
                }

                // Remove from resources array
                resources.splice(i, 1);
            }
            // Only hit one resource per swing for simplicity
            break; // Exit loop after hitting one resource
        }
    }
}

export function clearResources() {
    if (Array.isArray(resources)) {
        for (let i = resources.length - 1; i >= 0; i--) {
            const resource = resources[i];
            if (resource && Array.isArray(resource.meshes)) {
                resource.meshes.forEach(mesh => {
                    if (mesh instanceof THREE.Mesh) {
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) {
                            // Dispose material textures if they exist
                            if (mesh.material.map) mesh.material.map.dispose();
                            if (mesh.material.lightMap) mesh.material.lightMap.dispose();
                            if (mesh.material.bumpMap) mesh.material.bumpMap.dispose();
                            if (mesh.material.normalMap) mesh.material.normalMap.dispose();
                            if (mesh.material.specularMap) mesh.material.specularMap.dispose();
                            if (mesh.material.envMap) mesh.material.envMap.dispose();
                            // Dispose the material itself
                            mesh.material.dispose();
                        }
                        scene.remove(mesh);
                    } else {
                        console.warn("Item in resource meshes array is not a THREE.Mesh:", mesh);
                    }
                });
            }
        }
    } else {
        console.warn("`resources` is not an array during clear.");
    }
    resources = [];
}
