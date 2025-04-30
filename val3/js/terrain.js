// Terrain and world generation
function generateTerrain(chunkX, chunkZ) {
    const chunk = new THREE.Group();
    chunk.name = `chunk_${chunkX}_${chunkZ}`;
    
    // Ground geometry
    const groundGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 16, 16);
    groundGeometry.rotateX(-Math.PI / 2);
    
    // Generate terrain heights using Perlin noise
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i] + chunkX * CHUNK_SIZE;
        const z = vertices[i + 2] + chunkZ * CHUNK_SIZE;
        
        // Use perlin instead of simplex noise as requested
        vertices[i + 1] = getTerrainHeight(x, z);
    }
    
    groundGeometry.computeVertexNormals();
    
    // Get biome at this chunk's center
    const biome = getBiomeAt(chunkX * CHUNK_SIZE, chunkZ * CHUNK_SIZE);
    
    // Apply texture based on biome
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: biome.color,
        flatShading: false
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    chunk.add(ground);
    
    // Add trees, rocks, and resources
    addNaturalResources(chunk, chunkX, chunkZ, biome);
    
    return chunk;
}

function getTerrainHeight(x, z) {
    // Use Perlin noise for terrain height
    // Scale coordinates and combine different frequencies of noise
    const scale1 = 0.01;
    const scale2 = 0.05;
    const scale3 = 0.2;
    
    const h1 = perlin.perlin2(x * scale1, z * scale1) * 10;
    const h2 = perlin.perlin2(x * scale2, z * scale2) * 5;
    const h3 = perlin.perlin2(x * scale3, z * scale3) * 2;
    
    // Biome specific modifications
    const biome = getBiomeAt(x, z);
    let modifier = 0;
    
    if (biome === biomes.mountain) {
        modifier = 20; // Higher terrain for mountains
    } else if (biome === biomes.plains) {
        modifier = -5; // Flatter terrain for plains
    }
    
    return h1 + h2 + h3 + modifier;
}

// Load and manage chunks
function loadChunks() {
    const playerChunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
    
    const rd = gameState.settings.renderDistance;
    
    // Load chunks in render distance
    for (let x = playerChunkX - rd; x <= playerChunkX + rd; x++) {
        for (let z = playerChunkZ - rd; z <= playerChunkZ + rd; z++) {
            const chunkId = `${x},${z}`;
            
            if (!gameState.world.chunks[chunkId]) {
                const chunk = generateTerrain(x, z);
                scene.add(chunk);
                gameState.world.chunks[chunkId] = chunk;
            }
        }
    }
    
    // Unload chunks outside render distance
    for (const chunkId in gameState.world.chunks) {
        const [x, z] = chunkId.split(',').map(Number);
        
        if (x < playerChunkX - rd - 1 || x > playerChunkX + rd + 1 ||
            z < playerChunkZ - rd - 1 || z > playerChunkZ + rd + 1) {
            scene.remove(gameState.world.chunks[chunkId]);
            delete gameState.world.chunks[chunkId];
        }
    }
}