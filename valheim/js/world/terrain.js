// world/terrain.js - Terrain generation and management
import * as THREE from 'three';
import { scene, terrainNoise, biomeNoise, detailNoise } from '../core/setup.js';

export let terrain;

// Define biome parameters
export const biomeParams = {
    ocean:     { baseHeight: -10, heightVariation: 5,  roughness: 0.1, color: new THREE.Color(0x3366aa), trees: { density: 0, types: [] }, resources: [] },
    swamp:     { baseHeight: 0.5, heightVariation: 2,  roughness: 0.5, color: new THREE.Color(0x557755), trees: { density: 0.1, types: ['pine'] }, resources: ['flint'] },
    meadows:   { baseHeight: 1,   heightVariation: 5,  roughness: 0.3, color: new THREE.Color(0x88bb44), trees: { density: 0.05, types: ['birch', 'oak'] }, resources: ['stone', 'flint'] },
    forest:    { baseHeight: 2,   heightVariation: 10, roughness: 0.6, color: new THREE.Color(0x228833), trees: { density: 0.3, types: ['pine', 'oak', 'fir'] }, resources: ['stone', 'wood'] },
    plains:    { baseHeight: 3,   heightVariation: 3,  roughness: 0.2, color: new THREE.Color(0xddcc55), trees: { density: 0.01, types: ['oak'] }, resources: ['stone', 'flint'] },
    mountains: { baseHeight: 20,  heightVariation: 40, roughness: 1.5, color: new THREE.Color(0xaaaaaa), trees: { density: 0.02, types: ['pine', 'fir'] }, resources: ['stone', 'iron', 'silver'] },
};

export function generateTerrain() {
    console.log("Generating terrain...");
    const size = 2000; // Larger terrain
    const resolution = 128; // Segments along width/height
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);

    const vertices = geometry.attributes.position.array;
    const colors = [];

    for (let i = 0, j = 0; i < vertices.length; i += 3, j += 1) {
        const x = vertices[i];
        const z = vertices[i + 2];

        // Determine biome
        const biomeValue = biomeNoise.noise2D(x * 0.001, z * 0.001);
        let biome = 'meadows'; // Default
        if (biomeValue < -0.6) biome = 'ocean';
        else if (biomeValue < -0.3) biome = 'swamp';
        else if (biomeValue < 0.1) biome = 'meadows';
        else if (biomeValue < 0.4) biome = 'forest';
        else if (biomeValue < 0.7) biome = 'plains';
        else biome = 'mountains';

        const params = biomeParams[biome] || biomeParams.meadows;

        // Calculate height
        const height = getTerrainHeight(x, z); // Use the helper function
        vertices[i + 1] = height;

        // Calculate color based on biome and height
        const color = params.color.clone();
        const waterLevel = biomeParams.ocean.baseHeight + 1; // Approx water surface level

        if (biome === 'mountains' && height > 45) { // Snow line
            color.lerp(new THREE.Color(1, 1, 1), Math.min((height - 45) / 20, 1));
        } else if (height < waterLevel + 1.5 && height >= waterLevel - 0.5 && biome !== 'ocean') { // Shoreline/Beach
            color.lerp(new THREE.Color(0xc2b280), Math.min(1 - (height - waterLevel) / 2.0, 0.8)); // Sandy color, blend based on height near water
        } else if (biome === 'swamp') {
            // Darken swamp color slightly based on detail noise for variation
            const detail = detailNoise.noise2D(x * 0.05, z * 0.05);
            color.lerp(new THREE.Color(0x4a412a), Math.max(0, detail * 0.3)); // Add some mud color variation
        }

        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals(); // Important for lighting

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.1,
    });

    terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2; // Rotate plane to be horizontal
    terrain.receiveShadow = true;
    scene.add(terrain);
    console.log("Terrain generated.");
}

export function getTerrainHeight(x, z) {
    if (!terrainNoise || !biomeNoise || !detailNoise) return 0; // Safety check

    // Determine biome (ensure biome keys match biomeParams)
    const biomeValue = biomeNoise.noise2D(x * 0.001, z * 0.001);
    let biome = 'meadows'; // Default biome
    if (biomeValue < -0.6) biome = 'ocean';
    else if (biomeValue < -0.3) biome = 'swamp';
    else if (biomeValue < 0.1) biome = 'meadows';
    else if (biomeValue < 0.4) biome = 'forest';
    else if (biomeValue < 0.7) biome = 'plains';
    else biome = 'mountains';

    const params = biomeParams[biome] || biomeParams.meadows; // Fallback

    // Calculate height using noise layers
    const baseNoise = terrainNoise.noise2D(x * 0.003, z * 0.003); // Wider features
    const detailValue = detailNoise.noise2D(x * 0.02, z * 0.02); // Finer details

    let height = params.baseHeight;
    height += baseNoise * params.heightVariation;
    height += detailValue * params.roughness * 10; // Adjust multiplier for detail intensity

    // Ensure ocean floor isn't excessively deep or shallow relative to base height
    if (biome === 'ocean') {
        height = Math.max(params.baseHeight - params.heightVariation * 0.8, height); // Prevent super deep spots
        height = Math.min(params.baseHeight + params.heightVariation * 0.5, height); // Prevent high peaks in ocean
    }

    return height;
}
