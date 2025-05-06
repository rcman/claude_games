import * as THREE from './three.min.js';
import { Water } from './Water.js'; // Make sure path is correct
// GLTFLoader for models (you'll need to include it or manage it)
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; 

export class World {
    constructor(scene, collidables) {
        this.scene = scene;
        this.collidables = collidables;
        this.worldSize = 1000;
        this.waterLevel = 5; // Y-coordinate for water

        // Placeholder for models - you'd use GLTFLoader
        this.treeGeometry = new THREE.CylinderGeometry(0.5, 1, 10, 8);
        this.treeMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2d15 });
        this.rockGeometry = new THREE.SphereGeometry(1, 8, 6); // More like a D&D die
        this.rockMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        // this.loader = new GLTFLoader(); // Initialize if using

        this.terrainMesh = null;

        this.generateTerrain();
        this.addWater();
        this.populateWorld();
        this.addFog();
        this.addBuildingsAndLoot();
    }

    generateTerrain() {
        const terrainSize = this.worldSize;
        const segments = 100; // Fewer segments for performance, more for detail
        const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
        geometry.rotateX(-Math.PI / 2);

        const vertices = geometry.attributes.position.array;
        // Simple sine wave hills for example - replace with Perlin noise or heightmap
        for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
            const x = vertices[j];
            const z = vertices[j + 2];
            // Basic hills and flat areas
            vertices[j + 1] = 
                (Math.sin(x / 50) * Math.cos(z / 50) * 5) + // General rolling hills
                (Math.max(0, 10 - Math.sqrt(x*x + z*z)/20)) + // Central hill
                (Math.random() * 0.5); // Some noise
            
            // Ensure some flat areas by clamping elevation in certain regions
            if (Math.abs(x) < 100 && Math.abs(z) < 100 && Math.random() > 0.7) {
                vertices[j+1] = Math.min(vertices[j+1], 2); // Lower some areas to make them flatter
            }
            // Ensure water areas are low
            if (vertices[j+1] < this.waterLevel + 1) { // Areas near water level become lower
                 vertices[j+1] = Math.max(0, vertices[j+1] - 2);
            }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        const terrainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x669933, 
            wireframe: false, // Set to true for debugging
            flatShading: false // Smooth shading
        });
        this.terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);
        this.collidables.push(this.terrainMesh); // Terrain is collidable
    }

    getHeightAt(x, z) {
        // Simple raycasting down to find terrain height. Inefficient for many calls.
        // A more performant way would be to interpolate from geometry vertices if regular grid
        // or use a precomputed heightmap.
        if (!this.terrainMesh) return 0;
        const raycaster = new THREE.Raycaster(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObject(this.terrainMesh);
        return intersects.length > 0 ? intersects[0].point.y : 0;
    }

    addWater() {
        const waterGeometry = new THREE.PlaneGeometry(this.worldSize * 1.5, this.worldSize * 1.5); // Make it larger than terrain
        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('assets/textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined
        });
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = this.waterLevel; 
        this.scene.add(this.water);
    }

    addFog() { // Already in game.js, but could be configured here
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.0015); // Adjust density
    }
    
    populateWorld() {
        // TREES (Using InstancedMesh for performance)
        const treeCount = 1000;
        // Placeholder: use proper GLTF models eventually
        const treeMesh = new THREE.Mesh(this.treeGeometry, this.treeMaterial); 
        const instancedTrees = new THREE.InstancedMesh(treeMesh.geometry, treeMesh.material, treeCount);
        instancedTrees.castShadow = true;
        instancedTrees.receiveShadow = true;

        for (let i = 0; i < treeCount; i++) {
            const x = Math.random() * this.worldSize - this.worldSize / 2;
            const z = Math.random() * this.worldSize - this.worldSize / 2;
            const y = this.getHeightAt(x, z);

            if (y > this.waterLevel + 0.5) { // Don't spawn in water
                const dummy = new THREE.Object3D();
                dummy.position.set(x, y, z);
                dummy.scale.set(
                    0.8 + Math.random() * 0.4, // Random width
                    1.0 + Math.random() * 0.5, // Random height
                    0.8 + Math.random() * 0.4  // Random depth
                );
                dummy.updateMatrix();
                instancedTrees.setMatrixAt(i, dummy.matrix);

                // For collision, you'd ideally use simpler collision shapes (e.g., cylinders)
                // Storing individual colliders for instanced meshes is tricky.
                // A common approach is a spatial hash grid or octree to query nearby instances
                // For simplicity here, we might only add colliders for trees near the player,
                // or use a physics engine that handles instanced static bodies well.
                // For now, we'll add a simplified bounding box for each instance to the collidables array.
                // THIS IS NOT EFFICIENT FOR 1000+ TREES. A physics engine or spatial partitioning is needed.
                const treeCollider = new THREE.Mesh(
                    new THREE.CylinderGeometry(1 * dummy.scale.x, 1.5 * dummy.scale.x, 10 * dummy.scale.y, 8),
                    new THREE.MeshBasicMaterial({ visible: false }) // Invisible collider
                );
                treeCollider.position.copy(dummy.position);
                treeCollider.position.y += (10 * dummy.scale.y) / 2; // Center collider
                treeCollider.userData = { type: 'tree', health: 100, woodAmount: 5 + Math.floor(Math.random()*5) };
                //this.scene.add(treeCollider); // For visualizing colliders
                this.collidables.push(treeCollider);
            }
        }
        this.scene.add(instancedTrees);

        // ROCKS (Similar instancing approach)
        const rockCount = 1000;
        const rockMesh = new THREE.Mesh(this.rockGeometry, this.rockMaterial);
        const instancedRocks = new THREE.InstancedMesh(rockMesh.geometry, rockMesh.material, rockCount);
        instancedRocks.castShadow = true;
        // ... (similar loop as trees, adjusting positions, scales, and adding colliders)
        // For rocks: userData = { type: 'rock', health: 150, stoneAmount: 3 + Math.floor(Math.random()*3) };
        // this.collidables.push(rockCollider);
        // this.scene.add(instancedRocks);


        // Tall Grass (Use planes with alpha textures, or particles)
        // Scrap Metal, Nails (Small distinct meshes, perhaps also instanced or strategically placed)
    }

    addBuildingsAndLoot() {
        const buildingCount = 10; // Example
        // Placeholder: Load a GLB model for a building shell
        const buildingGeometry = new THREE.BoxGeometry(20, 15, 30); // Large shell
        const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

        for (let i = 0; i < buildingCount; i++) {
            const x = (Math.random() - 0.5) * (this.worldSize * 0.8); // Avoid edges
            const z = (Math.random() - 0.5) * (this.worldSize * 0.8);
            const y = this.getHeightAt(x, z);

            if (y > this.waterLevel + 1) {
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                building.position.set(x, y + 7.5, z); // Adjust Y based on model origin
                building.castShadow = true;
                building.receiveShadow = true;
                building.userData = { type: 'building' };
                this.scene.add(building);
                this.collidables.push(building);

                // Add Crates inside (simple boxes for now)
                const crateCount = Math.floor(Math.random() * 3) + 2;
                for (let j = 0; j < crateCount; j++) {
                    const crate = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 1),
                        new THREE.MeshStandardMaterial({ color: 0x8B4513 }) // Brown
                    );
                    // Position crate randomly inside building bounds
                    crate.position.set(
                        x + (Math.random() - 0.5) * 15,
                        y + 0.5, // On the floor
                        z + (Math.random() - 0.5) * 25
                    );
                    crate.userData = { type: 'crate', searched: false, lootTable: ['scrap_metal', 'nails', 'canteen', 'rope'] };
                    this.scene.add(crate);
                    this.collidables.push(crate); // Crates are collidable
                }
            }
        }

        // Barrels (scattered)
        const barrelCount = 50;
        const barrelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 12);
        const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        for (let i = 0; i < barrelCount; i++) {
            const x = (Math.random() - 0.5) * this.worldSize;
            const z = (Math.random() - 0.5) * this.worldSize;
            const y = this.getHeightAt(x, z);
             if (y > this.waterLevel + 0.2) {
                const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
                barrel.position.set(x, y + 0.6, z);
                barrel.castShadow = true;
                barrel.userData = { type: 'barrel', searched: false, lootTable: ['fiber', 'scrap_metal', 'small_stone'] };
                this.scene.add(barrel);
                this.collidables.push(barrel);
             }
        }
    }


    update(deltaTime) {
        if (this.water) {
            this.water.material.uniforms['time'].value += deltaTime / 2; // Animate water
        }
    }
}