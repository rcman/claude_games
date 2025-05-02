// --- START OF FILE Terrain.js ---

class Terrain {
    constructor(game) {
        this.game = game;
        this.size = Constants.WORLD.SIZE;
        this.resolution = Constants.WORLD.TERRAIN_RESOLUTION;
        this.waterLevel = Constants.WORLD.WATER_LEVEL;
        this.heightData = null; // Keep height data
        this.biomeData = null; // Keep biome data
        this.caveEntrances = []; // Keep cave data
        this.terrainMesh = null; // Will be Babylon Mesh
        this.waterMesh = null; // Will be Babylon Mesh
    }

    async generate() { // Make async if using async asset loading within
        console.log("Generating terrain (Babylon.js)...");
        const heightFactor = this.game.settings?.mapHeightFactor ?? 1.0;
        this.heightData = Utils.terrain.generateHeightmap(this.resolution, heightFactor); // Keep noise generation
        this.generateBiomes(); // Generate biome data based on height
        this.findAndDepressCaveEntrances(); // Modify heightData for caves

        // --- Create Ground Mesh using Babylon.js ---
        this.terrainMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
            "terrain", // Name
            null, // URL to heightmap image (we'll update vertices manually)
            {
                width: this.size,
                height: this.size,
                subdivisions: this.resolution - 1, // Subdivisions = resolution - 1
                minHeight: 0, // We'll set heights manually
                maxHeight: 1, // We'll set heights manually
                scene: this.game.scene,
                updatable: true // IMPORTANT: Make vertices updatable
            },
            this.game.scene
        );

        if (!this.terrainMesh) {
             throw new Error("Failed to create terrain mesh.");
        }

        // --- Apply Height Data to Vertices ---
        const vertices = this.terrainMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!vertices) {
             this.terrainMesh.dispose(); // Clean up if failed
             throw new Error("Failed to get terrain vertex data.");
        }

        // Vertex data is [x1, y1, z1, x2, y2, z2, ...]
        for (let i = 0; i < this.heightData.length; i++) {
            // The Y component is at index i * 3 + 1
            const vertexIndex = i * 3 + 1;
             if (vertexIndex < vertices.length) {
                 vertices[vertexIndex] = this.heightData[i]; // Apply height
             } else {
                 // This shouldn't happen if resolution matches subdivisions
                 console.warn(`Height data index ${i} out of bounds for vertices array.`);
             }
        }
        // Update the mesh with new vertex positions
        this.terrainMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, vertices);

        // Normals need recalculation after vertex update
        // Option 1: Built-in (might not be perfect on complex heightmaps)
        // this.terrainMesh.createNormals(true); // Simple recalculation

        // Option 2: Manual recalculation (more control if needed, complex)
        // BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        // this.terrainMesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

        // Re-calculate bounding info AFTER updating vertices
        this.terrainMesh.refreshBoundingInfo();

        // --- Apply Vertex Colors ---
        this.applyVertexColors(this.terrainMesh); // Pass the mesh

        // Create Material (Standard or PBR)
        const material = new BABYLON.StandardMaterial("terrainMat", this.game.scene);
        material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Reduce shininess
        material.roughness = 0.9; // PBR property if using PBRMaterial
        // Enable vertex colors
        material.useVertexColor = true;
        this.terrainMesh.material = material;

        // Shadows
        this.terrainMesh.receiveShadows = true;
        // Add to shadow generator render list (if shadows enabled in Game.js)
        if (this.game.shadowGenerator) {
             this.game.shadowGenerator.getShadowMap().renderList.push(this.terrainMesh);
        } else { console.warn("ShadowGenerator not initialized in Game.js when creating terrain."); }


        // Add to scene (already done by MeshBuilder)

        this.generateWater();

        console.log("Terrain generation complete (Babylon.js)");
        return true;
    }

    // --- findAndDepressCaveEntrances: Logic remains the same (modifies heightData) ---
    findAndDepressCaveEntrances() { /* Keep existing logic */ }

    // --- generateBiomes: Logic remains the same (populates biomeData) ---
    generateBiomes() { /* Keep existing logic */ }

    // --- applyVertexColors: Needs adaptation for Babylon.js mesh ---
    applyVertexColors(mesh) { // Accept mesh as parameter
         if (!this.biomeData) { /* ... error handling ... */ return; }
         if (!mesh || !mesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) { console.error("Invalid mesh or missing position data for vertex colors."); return; }

        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const vertexCount = positions.length / 3;
        const colors = new Float32Array(vertexCount * 4); // Use Float32Array(vertexCount * 4) for Color4

        const biomeColors = [ /* Keep THREE.Color definitions or use BABYLON.Color3 */
            new BABYLON.Color3(0.0, 0.467, 0.745), // Water
            new BABYLON.Color3(0.76, 0.698, 0.5),  // Beach
            new BABYLON.Color3(0.486, 0.988, 0.0), // Plains
            new BABYLON.Color3(0.133, 0.545, 0.133),// Forest
            new BABYLON.Color3(0.5, 0.5, 0.5)      // Mountains
        ];
        const fallbackColor = new BABYLON.Color3(1, 0, 1); // Magenta

        for (let i = 0; i < vertexCount; i++) {
            const vertexIndex = i * 3;
            // Need to map vertex index back to grid coordinates (this depends on how CreateGround orders vertices)
            // Assuming standard row-by-row ordering for a grid:
            const xCoord = i % this.resolution;
            const zCoord = Math.floor(i / this.resolution);
            const dataIndex = zCoord * this.resolution + xCoord;

            let biome = 0;
             if (dataIndex >= 0 && dataIndex < this.biomeData.length) {
                biome = this.biomeData[dataIndex];
            } else { /* console.warn */ }

            let baseColor = biomeColors[biome] || fallbackColor;
            let finalColor = baseColor.clone(); // Clone Babylon color

            // Cave darkening logic (keep similar, use positions array)
            const vertexY = positions[vertexIndex + 1];
            const vertexX = positions[vertexIndex];
            const vertexZ = positions[vertexIndex + 2];
            for (const entrance of this.caveEntrances) {
                 const dx = vertexX - entrance.x; const dz = vertexZ - entrance.z;
                 const distSq = dx * dx + dz * dz;
                 if (distSq < entrance.radius * entrance.radius && vertexY < entrance.y - 0.5) {
                      finalColor.scaleInPlace(0.5); // Use scaleInPlace for efficiency
                      break;
                 }
             }
            // Store RGBA values
            const colorIndex = i * 4;
            colors[colorIndex] = finalColor.r;
            colors[colorIndex + 1] = finalColor.g;
            colors[colorIndex + 2] = finalColor.b;
            colors[colorIndex + 3] = 1.0; // Alpha
        }

        // Set vertex color data
        mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors, true, 4); // Indicate vec4 color
        console.log("Vertex colors applied (Babylon.js).");
    }

    // --- generateWater: Use Babylon MeshBuilder ---
    generateWater() {
        this.waterMesh = BABYLON.MeshBuilder.CreateGround("water", {
            width: this.size, height: this.size, subdivisions: 1 // Simple plane for water
        }, this.game.scene);

        // Use StandardMaterial or WaterMaterial (WaterMaterial is more advanced)
        const waterMaterial = new BABYLON.StandardMaterial("waterMat", this.game.scene);
        waterMaterial.diffuseColor = new BABYLON.Color3(0.0, 0.4, 0.7); // Water color
        waterMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.5); // Reflection color
        waterMaterial.alpha = 0.7; // Transparency

        // Optional: Add reflection/refraction using RenderTargetTexture (more complex)
        // const reflector = new BABYLON.MirrorTexture("mirror", 512, this.game.scene, true);
        // reflector.mirrorPlane = new BABYLON.Plane(0, -1, 0, this.waterLevel); // Reflect based on water plane
        // reflector.renderList = [...]; // Add objects to reflect
        // waterMaterial.reflectionTexture = reflector;

        this.waterMesh.material = waterMaterial;
        this.waterMesh.position.y = this.waterLevel; // Set initial water level
        this.waterMesh.receiveShadows = true; // Water can receive shadows
        // Add water to shadow render list? Usually not needed unless it casts shadows itself.
    }

    // --- getHeightAt: Needs adaptation ---
    getHeightAt(x, z) {
        if (!this.terrainMesh || !this.heightData) return undefined; // Use heightData for interpolation

        // Method 1: Use ground mesh function (if available and accurate enough)
        // return this.terrainMesh.getHeightAtCoordinates(x, z); // May not exist or be precise enough

        // Method 2: Reuse bilinear interpolation on heightData (more reliable)
        return Utils.terrain.getHeightAt(x, z, this); // Pass 'this' (containing heightData, size, res)
    }

    // --- getBiomeAt: Logic remains the same (uses biomeData) ---
    getBiomeAt(x, z) { /* Keep existing logic */ }

    // --- isUnderwater: Logic remains the same ---
    isUnderwater(x, y, z) { return y < this.waterLevel; }

    // --- isInsideCave: Logic remains the same (uses caveEntrances data) ---
    isInsideCave(position) { /* Keep existing logic, ensure position is BABYLON.Vector3 */ }

    // --- update: Animate water level ---
    update(deltaTime) {
        if (!this.waterMesh) return;
        const time = this.game.elapsedTime || 0;
        const waveHeight = Math.sin(time * 0.5) * 0.1;
        // Only update Y position if not using advanced WaterMaterial waves
        this.waterMesh.position.y = this.waterLevel + waveHeight;
    }
}
// --- END OF FILE Terrain.js ---