// js/resources.js

class Resources {
    constructor(game) {
        this.game = game;
        
        // Resource definition
        this.resourceTypes = {
            'tree': {
                name: 'Tree',
                modelPath: 'assets/models/tree.glb', // Example path
                icon: 'assets/items/wood.png', // For UI if needed
                tool: 'axe', // Required tool type
                yields: [
                    { item: 'wood', amountMin: 2, amountMax: 5, chance: 1.0 },
                    { item: 'stick', amountMin: 1, amountMax: 3, chance: 0.5 },
                    { item: 'apple', amountMin: 0, amountMax: 1, chance: 0.2 }
                ],
                health: 50, // More health for resources
                respawnTime: 300, 
                biomes: ['plains', 'forest'],
                minDistance: 5,
                scale: { x:1, y:1, z:1 }
            },
            'rock': { // Renamed from 'stone' to avoid confusion with 'stone' item
                name: 'Rock',
                modelPath: 'assets/models/rock.glb',
                icon: 'assets/items/stone.png',
                tool: 'pickaxe',
                yields: [
                    { item: 'stone', amountMin: 3, amountMax: 6, chance: 1.0 },
                    { item: 'flint', amountMin: 0, amountMax: 2, chance: 0.3 },
                    { item: 'iron_ore', amountMin: 0, amountMax: 1, chance: 0.1 } // Small chance from surface rocks
                ],
                health: 70,
                respawnTime: 400,
                biomes: ['plains', 'forest', 'mountains'],
                minDistance: 4,
                scale: { x:1, y:1, z:1 }
            },
            'bush': {
                name: 'Berry Bush',
                modelPath: 'assets/models/bush.glb',
                icon: 'assets/items/berries.png',
                tool: null, // Can be harvested by hand
                yields: [
                    { item: 'berries', amountMin: 2, amountMax: 4, chance: 1.0 },
                    { item: 'fiber', amountMin: 1, amountMax: 3, chance: 0.6 },
                    { item: 'stick', amountMin: 0, amountMax: 2, chance: 0.3 }
                ],
                health: 20,
                respawnTime: 200,
                biomes: ['plains', 'forest'],
                minDistance: 3,
                scale: { x:0.8, y:0.8, z:0.8 }
            },
            'iron_vein': { // More specific than ironOre
                name: 'Iron Vein',
                modelPath: 'assets/models/iron_vein.glb', // A rock model with iron veins
                icon: 'assets/items/iron_ore.png',
                tool: 'pickaxe',
                yields: [
                    { item: 'iron_ore', amountMin: 2, amountMax: 5, chance: 1.0 },
                    { item: 'stone', amountMin: 1, amountMax: 3, chance: 0.5 }
                ],
                health: 100,
                respawnTime: 600,
                biomes: ['mountains', 'caves'], // Caves would be a new biome
                minDistance: 8,
                scale: { x:1.2, y:1.2, z:1.2 }
            }
            // Add more like 'clay_deposit', 'coal_vein', 'tall_grass' (for fiber)
        };
        
        this.activeResources = []; // Renamed from 'resources'
        this.respawningResources = [];
        this.loader = new THREE.GLTFLoader(); // For loading models
    }

    spawnInitialResources() {
        const resourceCounts = {
            'tree': 50, // Reduced for testing
            'rock': 40,
            'bush': 30,
            'iron_vein': 20
        };
        
        for (const [typeKey, count] of Object.entries(resourceCounts)) {
            for (let i = 0; i < count; i++) {
                this.spawnResource(typeKey);
            }
        }
    }

    spawnResource(typeKey) {
        const resourceDef = this.resourceTypes[typeKey];
        if (!resourceDef) {
            console.warn("Unknown resource type:", typeKey);
            return null;
        }
        
        const position = this.findResourcePosition(resourceDef);
        if (!position) return null; 
        
        // Load model or use placeholder
        if (resourceDef.modelPath) {
            this.loader.load(resourceDef.modelPath, (gltf) => {
                const model = gltf.scene;
                model.position.copy(position);
                if(resourceDef.scale) model.scale.set(resourceDef.scale.x, resourceDef.scale.y, resourceDef.scale.z);
                
                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                model.userData = {
                    type: 'resource',
                    resourceId: typeKey, // Use the key for consistency
                    health: resourceDef.health,
                    maxHealth: resourceDef.health,
                    yields: resourceDef.yields,
                    respawnTime: resourceDef.respawnTime,
                    tool: resourceDef.tool,
                    originalPosition: position.clone() // For respawning
                };
                this.game.scene.add(model);
                this.activeResources.push(model);
            }, undefined, (error) => {
                console.error(`Failed to load resource model ${resourceDef.modelPath}:`, error);
                this.createPlaceholderResource(typeKey, position, resourceDef); // Fallback
            });
        } else {
           this.createPlaceholderResource(typeKey, position, resourceDef);
        }
    }
    
    createPlaceholderResource(typeKey, position, resourceDef) {
        let geometry, color;
        switch (typeKey) {
            case 'tree': geometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8); color = 0x8B4513; break;
            case 'rock': geometry = new THREE.DodecahedronGeometry(0.7); color = 0x808080; break;
            case 'bush': geometry = new THREE.SphereGeometry(0.5, 8, 8); color = 0x228B22; break;
            case 'iron_vein': geometry = new THREE.BoxGeometry(1, 1, 1); color = 0xA52A2A; break;
            default: geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); color = 0xFF00FF;
        }
        const material = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.copy(position);
        if (typeKey === 'tree') mesh.position.y += 1.5; // Adjust placeholder position
        else mesh.position.y += 0.5;


        mesh.userData = {
            type: 'resource',
            resourceId: typeKey,
            health: resourceDef.health,
            maxHealth: resourceDef.health,
            yields: resourceDef.yields,
            respawnTime: resourceDef.respawnTime,
            tool: resourceDef.tool,
            originalPosition: position.clone()
        };
        this.game.scene.add(mesh);
        this.activeResources.push(mesh);
         console.warn(`Using placeholder for ${typeKey}`);
    }


    findResourcePosition(resourceDef) {
        const maxAttempts = 50;
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = (Math.random() * worldSize) - (worldSize / 2);
            const z = (Math.random() * worldSize) - (worldSize / 2);
            const terrainHeight = this.game.world.getHeightAt(x, z);
            
            if (terrainHeight < waterLevel + 0.2) continue; // Avoid spawning in/too close to water
            
            const biome = this.game.world.getBiomeAt(new THREE.Vector3(x, terrainHeight, z));
            if (!resourceDef.biomes.includes(biome)) continue;
            
            const position = new THREE.Vector3(x, terrainHeight, z);
            let tooClose = false;
            for (const existing of this.activeResources) {
                if (existing.userData.resourceId === resourceDef.name) { // Check for same type
                    if (position.distanceTo(existing.position) < resourceDef.minDistance) {
                        tooClose = true;
                        break;
                    }
                }
            }
            if (tooClose) continue;
            
            return position;
        }
        console.warn(`Could not find position for resource ${resourceDef.name}`);
        return null;
    }


    harvestResource(resourceMesh, hitPoint, toolUsed) {
        const resData = resourceMesh.userData;
        if (resData.type !== 'resource' || resData.health <= 0) return;

        const requiredToolType = resData.tool;
        let damage = 1; // Base damage (e.g., hands)

        if (toolUsed) {
            const toolData = getItemData(toolUsed.id);
            if (requiredToolType && toolData.toolType === requiredToolType) {
                damage = toolData.toolStrength || 5; // Use tool strength if defined
            } else if (!requiredToolType) { // No specific tool needed (e.g. bush)
                damage = toolData.toolStrength || 2; // Tool still helps
            } else {
                this.game.ui.showNotification(`Wrong tool for ${getItemData(resData.resourceId).name}!`);
                damage = 0.5; // Penalty for wrong tool
            }
        } else if (requiredToolType) {
             this.game.ui.showNotification(`You need a ${requiredToolType} for ${getItemData(resData.resourceId).name}.`);
             return; // Can't harvest with hands if tool is required
        }


        resData.health -= damage;
        // Optional: Visual feedback (shake, particle)
        this.createHitEffect(hitPoint || resourceMesh.position, resourceMesh);


        if (resData.health <= 0) {
            this.addResourcesToInventory(resData);
            this.createHarvestEffect(hitPoint || resourceMesh.position, resData.resourceId);
            
            this.game.scene.remove(resourceMesh);
            const index = this.activeResources.indexOf(resourceMesh);
            if (index !== -1) this.activeResources.splice(index, 1);
            
            this.scheduleRespawn(resData.resourceId, resData.originalPosition, resData.respawnTime);
        } else {
             // Optional: Update visual state (e.g. cracks, less foliage)
        }
    }

    addResourcesToInventory(resourceData) {
        resourceData.yields.forEach(y => {
            if (Math.random() <= y.chance) {
                const amount = getRandomInt(y.amountMin, y.amountMax);
                if (amount > 0) {
                    this.game.inventory.addItem(y.item, amount);
                }
            }
        });
    }
    
    scheduleRespawn(resourceId, position, respawnTime) {
        this.respawningResources.push({
            id: resourceId,
            position: position.clone(),
            time: this.game.gameTime + respawnTime 
        });
    }

    update(deltaTime) {
        for (let i = this.respawningResources.length - 1; i >= 0; i--) {
            const respawn = this.respawningResources[i];
            if (this.game.gameTime >= respawn.time) {
                this.spawnResource(respawn.id, respawn.position); // Pass position to ensure it respawns at original spot
                this.respawningResources.splice(i, 1);
            }
        }
    }

    // Particle effects (simplified)
    createHitEffect(position, resourceMesh) {
        // Simple flash or small particles
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
        });
        const particleGeometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 5; i++) {
            vertices.push(
                position.x + (Math.random() - 0.5) * 0.2,
                position.y + (Math.random() - 0.5) * 0.2,
                position.z + (Math.random() - 0.5) * 0.2
            );
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.game.scene.add(particles);
        setTimeout(() => this.game.scene.remove(particles), 300);

        // Shake effect
        if (resourceMesh && resourceMesh.originalRotation === undefined) {
            resourceMesh.originalRotation = resourceMesh.rotation.clone();
        }
        if (resourceMesh) {
            const shakeIntensity = 0.05;
            resourceMesh.rotation.x += (Math.random() - 0.5) * shakeIntensity;
            resourceMesh.rotation.z += (Math.random() - 0.5) * shakeIntensity;
            setTimeout(() => {
                if (resourceMesh.originalRotation) {
                    resourceMesh.rotation.copy(resourceMesh.originalRotation);
                }
            }, 100);
        }
    }

    createHarvestEffect(position, resourceId) {
        const itemData = getItemData(resourceId);
        const particleMaterial = new THREE.PointsMaterial({
            map: AssetLoader.getTexture(itemData.icon) || new THREE.TextureLoader().load(itemData.icon), // Use item icon as particle
            size: 0.3,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
        });
        const particleGeometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 10; i++) {
             vertices.push(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + (Math.random()) * 0.5, // Tend to go up
                position.z + (Math.random() - 0.5) * 0.5
            );
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.game.scene.add(particles);
        setTimeout(() => this.game.scene.remove(particles), 1000);
    }
}