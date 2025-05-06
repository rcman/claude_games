// World Generation and Management
class World {
    constructor(game) {
        this.game = game;
        
        // World size
        this.size = 200;
        this.chunks = 10; // Number of chunks per side
        this.chunkSize = this.size / this.chunks;
        
        // Terrain properties
        this.maxHeight = 20;
        this.waterLevel = 2;
        
        // Store terrain data
        this.heightMap = [];
        this.terrainMeshes = [];
        
        // Lighting
        this.ambientLight = null;
        this.sunLight = null;
    }

    generate() {
        // Create lighting
        this.createLighting();
        
        // Generate heightmap for terrain
        this.generateHeightMap();
        
        // Create terrain meshes
        this.createTerrain();
        
        // Add skybox
        this.createSkybox();
    }

    createLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040);
        this.game.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 0);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        
        this.game.scene.add(this.sunLight);
    }

    generateHeightMap() {
        // Generate a simple heightmap using perlin noise
        const simplex = new Utils.SimplexNoise();
        
        // Initialize height map array
        this.heightMap = new Array(this.size + 1);
        for (let i = 0; i <= this.size; i++) {
            this.heightMap[i] = new Array(this.size + 1);
            for (let j = 0; j <= this.size; j++) {
                // Generate height using multiple octaves of noise
                let height = 0;
                let amplitude = 1;
                let frequency = 0.01;
                
                for (let octave = 0; octave < 4; octave++) {
                    const x = i * frequency;
                    const z = j * frequency;
                    
                    height += simplex.noise2D(x, z) * amplitude;
                    
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Scale height to desired range
                height = (height + 1) * 0.5 * this.maxHeight;
                
                // Store in height map
                this.heightMap[i][j] = height;
            }
        }
    }

    createTerrain() {
        // Create terrain in chunks for better performance
        for (let cx = 0; cx < this.chunks; cx++) {
            for (let cz = 0; cz < this.chunks; cz++) {
                this.createTerrainChunk(cx, cz);
            }
        }
    }

    createTerrainChunk(chunkX, chunkZ) {
        // Calculate chunk boundaries
        const startX = chunkX * this.chunkSize;
        const startZ = chunkZ * this.chunkSize;
        const endX = startX + this.chunkSize;
        const endZ = startZ + this.chunkSize;
        
        // Create geometry for this chunk
        const geometry = new THREE.PlaneGeometry(
            this.chunkSize, 
            this.chunkSize, 
            this.chunkSize, 
            this.chunkSize
        );
        
        // Rotate plane to be horizontal
        geometry.rotateX(-Math.PI / 2);
        
        // Apply height map to vertices
        const vertices = geometry.attributes.position.array;
        
        for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
            const x = (j % (this.chunkSize + 1)) + startX;
            const z = Math.floor(j / (this.chunkSize + 1)) + startZ;
            
            // Get height from heightmap
            const height = this.heightMap[x][z];
            
            // Set vertex height
            vertices[i + 1] = height;
        }
        
        // Generate normals after modifying vertices
        geometry.computeVertexNormals();
        
        // Create different materials based on height
        const materials = [
            new THREE.MeshLambertMaterial({ color: 0x3c6e47 }), // Grass
            new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // Dirt
            new THREE.MeshLambertMaterial({ color: 0x808080 }), // Stone
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })  // Snow
        ];
        
        // Create mesh with materials
        const terrainMesh = new THREE.Mesh(geometry, materials[0]);
        terrainMesh.receiveShadow = true;
        terrainMesh.castShadow = true;
        
        // Set chunk position
        terrainMesh.position.set(
            startX - this.size / 2 + this.chunkSize / 2,
            0,
            startZ - this.size / 2 + this.chunkSize / 2
        );
        
        // Add to scene
        this.game.scene.add(terrainMesh);
        
        // Store for later reference
        this.terrainMeshes.push(terrainMesh);
    }

    createSkybox() {
        // Create a simple skybox using a large sphere
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            side: THREE.BackSide 
        });
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.game.scene.add(skybox);
    }

    getHeightAt(x, z) {
        // Convert from world coordinates to heightmap indices
        const i = Math.floor(x + this.size / 2);
        const j = Math.floor(z + this.size / 2);
        
        // Check if within bounds
        if (i >= 0 && i < this.size && j >= 0 && j < this.size) {
            return this.heightMap[i][j];
        }
        
        // Return default height if out of bounds
        return 0;
    }

    isWaterAt(x, z) {
        return this.getHeightAt(x, z) < this.waterLevel;
    }

    getBiomeAt(x, z) {
        const height = this.getHeightAt(x, z);
        
        if (height < this.waterLevel) {
            return 'water';
        } else if (height < this.waterLevel + 1) {
            return 'beach';
        } else if (height < this.maxHeight * 0.3) {
            return 'plains';
        } else if (height < this.maxHeight * 0.7) {
            return 'forest';
        } else {
            return 'mountain';
        }
    }

    update(deltaTime) {
        // Any periodic updates to the world
        // For example, updating dynamic elements, weather effects, etc.
    }
}