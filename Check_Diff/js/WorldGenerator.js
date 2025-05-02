// --- START OF FILE WorldGenerator.js ---

class WorldGenerator {
    constructor(game) {
        this.game = game;
        this.terrain = game.terrain;
        this.resourceManager = null; // Will be assigned in generateWorld
    }

    async generateWorld() {
        console.log("[WorldGenerator] Starting world generation..."); // <<< LOGGING
        await this.terrain.generate();
        this.resourceManager = this.game.resourceManager;
        await this.generateCaveResources();
        await this.generateTrees();
        await this.generateStones();
        await this.generatePlants();
        await this.generateBarrels();
        await this.generateSimpleBuildings();
        await this.game.entityManager.spawnInitialAnimals();
        await this.game.entityManager.spawnInitialHunters();
        console.log("[WorldGenerator] World generation complete."); // <<< LOGGING
        return true;
    }

    async generateCaveResources() {
        console.log("[WorldGenerator] Generating cave resources..."); // <<< LOGGING
        if (!this.terrain.caveEntrances || this.terrain.caveEntrances.length === 0) {
            console.log("[WorldGenerator] No cave entrances found to populate."); // <<< LOGGING
            return;
        }
        const oreTypes = ['iron', 'copper', 'zinc'];
        const oreModelGeo = this.game.assetLoader.getModel('rock');
        if (!oreModelGeo) {
            console.error("[WorldGenerator] Rock geometry failed to load for cave ores."); // <<< LOGGING
            return;
        }
        const oreMaterials = {
            'iron': new THREE.MeshStandardMaterial({ map: this.game.assetLoader.getTexture('stone'), color: 0xa19d94, roughness: 0.8, metalness: 0.3 }),
            'copper': new THREE.MeshStandardMaterial({ map: this.game.assetLoader.getTexture('stone'), color: 0xb87333, roughness: 0.8, metalness: 0.4 }),
            'zinc': new THREE.MeshStandardMaterial({ map: this.game.assetLoader.getTexture('stone'), color: 0xd3d4d5, roughness: 0.7, metalness: 0.5 })
        };
        let totalCaveOres = 0;
        for (const entrance of this.terrain.caveEntrances) {
            const oresInThisCave = Math.floor(Constants.WORLD.MAX_CAVE_ORES * Constants.WORLD.CAVE_ORE_DENSITY);
            let spawnedInCave = 0;
            const spawnRadius = Constants.WORLD.CAVE_ORE_SPAWN_RADIUS;
            for (let i = 0; i < oresInThisCave; i++) {
                let oreX, oreZ, oreY, attempts = 0;
                let placeable = false;
                while (attempts < 30 && !placeable) {
                    attempts++;
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Utils.randomFloat(entrance.radius * 0.5, spawnRadius);
                    oreX = entrance.x + Math.cos(angle) * radius;
                    oreZ = entrance.z + Math.sin(angle) * radius;
                    oreY = this.terrain.getHeightAt(oreX, oreZ);
                    if (oreY !== undefined && oreY < entrance.y - 1.5 && oreY > this.terrain.waterLevel + 0.5) {
                        placeable = true;
                    }
                }
                if (placeable) {
                    const scale = Utils.randomFloat(0.6, 1.8);
                    const oreType = oreTypes[Math.floor(Math.random() * oreTypes.length)];
                    const oreMesh = new THREE.Mesh(oreModelGeo.clone(), oreMaterials[oreType]);
                    oreMesh.position.set(oreX, oreY + scale * 0.2, oreZ);
                    oreMesh.scale.set(scale, scale, scale);
                    oreMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
                    oreMesh.castShadow = true;
                    oreMesh.receiveShadow = true;

                    console.log(`[WorldGenerator - Cave] Adding cave ore '${oreType}' model. Position:`, oreMesh.position, "Scale:", oreMesh.scale); // <<< LOGGING
                    this.game.scene.add(oreMesh);

                    const oreResource = {
                        id: `cave_ore_${totalCaveOres}`, type: oreType, name: `${oreType.charAt(0).toUpperCase() + oreType.slice(1)} Node (Cave)`,
                        health: Constants.RESOURCES.STONE_HEALTH, maxHealth: Constants.RESOURCES.STONE_HEALTH,
                        position: { x: oreX, y: oreY + scale * 0.2, z: oreZ }, scale: scale, meshes: [oreMesh],
                        resources: { stone: Math.max(1, Math.floor(Utils.random(1, 3) * scale)), [`${oreType}ore`]: Math.max(1, Math.floor(Utils.random(2, 5) * scale)) },
                        regrowTime: null, isCaveResource: true
                    };
                    this.resourceManager.registerResource(oreResource);
                    spawnedInCave++;
                    totalCaveOres++;
                }
            }
            // console.log(`[WorldGenerator] Spawned ${spawnedInCave} ore nodes in cave near ${entrance.x.toFixed(0)}, ${entrance.z.toFixed(0)}`); // Optional detail log
        }
        console.log(`[WorldGenerator] Generated ${totalCaveOres} total cave ore nodes.`); // <<< LOGGING
    }

    async generateTrees() {
        console.log("[WorldGenerator] Generating trees..."); // <<< LOGGING
        const worldSize = Constants.WORLD.SIZE;
        const maxTrees = this.game.settings?.maxTrees ?? Constants.WORLD.MAX_TREES; // Use setting
        const treeDensity = Constants.WORLD.TREE_DENSITY;
        const treesToSpawn = Math.floor(maxTrees * treeDensity);
        const treeModel = this.game.assetLoader.getModel('tree');
        if (!treeModel || !treeModel.trunk || !treeModel.leaves) {
            console.error("[WorldGenerator] Tree model geometry not loaded correctly."); // <<< LOGGING
            return;
        }
        const trunkGeo = treeModel.trunk;
        const leavesGeo = treeModel.leaves;
        const barkTexture = this.game.assetLoader.getTexture('tree_bark');
        const leafTexture = this.game.assetLoader.getTexture('leaves');
        const trunkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, roughness: 0.9, metalness: 0.1 });
        const leavesMaterial = new THREE.MeshStandardMaterial({ map: leafTexture, roughness: 0.8, metalness: 0.1, side: THREE.DoubleSide, alphaTest: 0.5 });
        const halfSize = worldSize / 2;
        let spawnedCount = 0;
        for (let i = 0; i < treesToSpawn; i++) {
            let x, z, biome, height, attempts = 0;
            do {
                x = Utils.randomFloat(-halfSize, halfSize);
                z = Utils.randomFloat(-halfSize, halfSize);
                height = this.terrain.getHeightAt(x, z);
                if (height === undefined) { attempts++; continue; }
                biome = this.terrain.getBiomeAt(x, z);
                attempts++;
                if (attempts > 100) break;
            } while (biome < 2 || height < this.terrain.waterLevel + 0.5); // Biome 2 (Plains) or higher

            if (attempts > 100) continue;
            const scale = Utils.randomFloat(0.8, 1.5);
            const rotation = Utils.randomFloat(0, Math.PI * 2);
            const trunk = new THREE.Mesh(trunkGeo.clone(), trunkMaterial);
            trunk.position.set(x, height, z);
            trunk.scale.set(scale, scale, scale);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            const leaves = new THREE.Mesh(leavesGeo.clone(), leavesMaterial);
            leaves.position.set(x, height + 5 * scale, z); // Adjust leaf height based on scale
            leaves.scale.set(scale, scale, scale);
            leaves.rotation.y = rotation;
            leaves.castShadow = true; // Leaves can cast shadows too

            console.log(`[WorldGenerator - Tree] Adding tree model. Pos:`, trunk.position, `Scale: ${scale.toFixed(2)}`); // <<< LOGGING
            this.game.scene.add(trunk);
            this.game.scene.add(leaves);

            const treeResource = {
                id: `tree_${spawnedCount}`, type: 'tree', name: 'Tree',
                health: Constants.RESOURCES.TREE_HEALTH, maxHealth: Constants.RESOURCES.TREE_HEALTH,
                position: { x, y: height, z }, scale: scale, meshes: [trunk, leaves],
                resources: { wood: Math.max(1, Math.floor(Utils.random(3, 6) * scale)), fiber: Math.max(0, Math.floor(Utils.random(0, 2) * scale)) },
                regrowTime: null
            };
            this.resourceManager.registerResource(treeResource);
            spawnedCount++;
        }
        console.log(`[WorldGenerator] Generated ${spawnedCount} trees.`); // <<< LOGGING
    }

    async generateStones() {
        console.log("[WorldGenerator] Generating surface stones..."); // <<< LOGGING
        const worldSize = Constants.WORLD.SIZE;
        const maxStones = this.game.settings?.maxRocks ?? Constants.WORLD.MAX_STONES; // Use setting
        const stoneDensity = Constants.WORLD.STONE_DENSITY;
        const stonesToSpawn = Math.floor(maxStones * stoneDensity);
        const stoneGeo = this.game.assetLoader.getModel('rock');
        if (!stoneGeo) {
            console.error("[WorldGenerator] Rock model geometry not loaded."); // <<< LOGGING
            return;
        }
        const stoneTexture = this.game.assetLoader.getTexture('stone');
        const stoneMaterials = {
            'stone': new THREE.MeshStandardMaterial({ map: stoneTexture, roughness: 0.9, metalness: 0.1 }),
            'iron': new THREE.MeshStandardMaterial({ map: stoneTexture, color: 0xa19d94, roughness: 0.8, metalness: 0.3 }),
            'copper': new THREE.MeshStandardMaterial({ map: stoneTexture, color: 0xb87333, roughness: 0.8, metalness: 0.4 }),
            'zinc': new THREE.MeshStandardMaterial({ map: stoneTexture, color: 0xd3d4d5, roughness: 0.7, metalness: 0.5 })
        };
        const halfSize = worldSize / 2;
        let spawnedCount = 0;
        const checkRadiusSq = Constants.WORLD.CAVE_ENTRANCE_RADIUS * Constants.WORLD.CAVE_ENTRANCE_RADIUS;

        for (let i = 0; i < stonesToSpawn; i++) {
            let x, z, biome, height, attempts = 0;
            let tooCloseToCave = false;
            do {
                x = Utils.randomFloat(-halfSize, halfSize);
                z = Utils.randomFloat(-halfSize, halfSize);
                height = this.terrain.getHeightAt(x, z);
                if (height === undefined) { attempts++; continue; }
                biome = this.terrain.getBiomeAt(x, z);
                attempts++;
                if (attempts > 100) break;
                tooCloseToCave = this.terrain.caveEntrances.some(entrance => {
                    const dx = x - entrance.x; const dz = z - entrance.z;
                    return (dx * dx + dz * dz < checkRadiusSq * 1.5); // Slightly larger exclusion zone
                });
            } while (biome === 0 || height < this.terrain.waterLevel || tooCloseToCave); // Exclude water and near caves

            if (attempts > 100 || tooCloseToCave) continue;

            const scale = Utils.randomFloat(0.5, 2.5);
            const rotation = Utils.randomFloat(0, Math.PI * 2);
            const posY = height + (scale * 0.2); // Place slightly embedded

            let stoneType = 'stone';
            const oreChance = biome === 4 ? 0.5 : 0.2; // Higher chance in mountains
            if (Math.random() < oreChance) {
                const oreRoll = Math.random();
                if (oreRoll < 0.6) stoneType = 'iron';
                else if (oreRoll < 0.85) stoneType = 'copper';
                else stoneType = 'zinc';
            }

            const stoneMesh = new THREE.Mesh(stoneGeo.clone(), stoneMaterials[stoneType]);
            stoneMesh.position.set(x, posY, z);
            stoneMesh.scale.set(scale, scale, scale);
            stoneMesh.rotation.set(Utils.randomFloat(0, 0.3), rotation, Utils.randomFloat(0, 0.3)); // Slight random tilt
            stoneMesh.castShadow = true;
            stoneMesh.receiveShadow = true;

            console.log(`[WorldGenerator - Stone] Adding stone/ore '${stoneType}' model. Position:`, stoneMesh.position, "Scale:", stoneMesh.scale); // <<< LOGGING
            this.game.scene.add(stoneMesh);

            const stoneResource = {
                id: `stone_${spawnedCount}`, type: stoneType, name: `${stoneType.charAt(0).toUpperCase() + stoneType.slice(1)} Node`,
                health: Constants.RESOURCES.STONE_HEALTH, maxHealth: Constants.RESOURCES.STONE_HEALTH,
                position: { x, y: posY, z }, scale: scale, meshes: [stoneMesh], resources: {}, regrowTime: null
            };
            const stoneYield = Math.max(1, Math.floor(Utils.random(2, 5) * scale));
            stoneResource.resources.stone = stoneYield;
            if (stoneType === 'iron') stoneResource.resources.ironore = Math.max(1, Math.floor(Utils.random(1, 3) * scale));
            else if (stoneType === 'copper') stoneResource.resources.copperore = Math.max(1, Math.floor(Utils.random(1, 3) * scale));
            else if (stoneType === 'zinc') stoneResource.resources.zincore = Math.max(1, Math.floor(Utils.random(1, 3) * scale));

            this.resourceManager.registerResource(stoneResource);
            spawnedCount++;
        }
        console.log(`[WorldGenerator] Generated ${spawnedCount} surface stones/ore nodes.`); // <<< LOGGING
    }

    async generatePlants() {
        console.log("[WorldGenerator] Generating plants..."); // <<< LOGGING
        const worldSize = Constants.WORLD.SIZE;
        const maxPlants = this.game.settings?.maxFiber ?? Constants.WORLD.MAX_FIBER_PLANTS; // Use setting
        const plantDensity = Constants.WORLD.FIBER_DENSITY;
        const plantsToSpawn = Math.floor(maxPlants * plantDensity);
        const plantGeo = this.game.assetLoader.getModel('plant');
        if (!plantGeo) {
            console.error("[WorldGenerator] Plant model geometry not loaded."); // <<< LOGGING
            return;
        }
        // Ensure all potential plant types are included
        const plantTypes = Constants.ITEMS.RESOURCES.filter(item =>
            item && ['fiber', 'blueberry', 'carrot', 'onion', 'medicinalherb', 'cloth'].includes(item.id) // Include cloth here
        );
        if (plantTypes.length === 0) {
            console.warn("[WorldGenerator] No plant types defined for generation."); // <<< LOGGING
            return;
        }
        const plantMaterials = {};
        plantTypes.forEach(type => {
            let color = 0x556b2f; // Default fiber/plant color
            if (type.color) { color = type.color; }
            else if (type.id === 'cloth') { color = 0xFFFAF0; } // Specific color for cloth
            plantMaterials[type.id] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide }); // DoubleSide for plants
        });

        const halfSize = worldSize / 2;
        let spawnedCount = 0;
        const checkRadiusSq = Constants.WORLD.CAVE_ENTRANCE_RADIUS * Constants.WORLD.CAVE_ENTRANCE_RADIUS;

        for (let i = 0; i < plantsToSpawn; i++) {
            let x, z, biome, height, attempts = 0;
            let tooCloseToCave = false;
            do {
                x = Utils.randomFloat(-halfSize, halfSize);
                z = Utils.randomFloat(-halfSize, halfSize);
                height = this.terrain.getHeightAt(x, z);
                if (height === undefined) { attempts++; continue; }
                biome = this.terrain.getBiomeAt(x, z);
                attempts++;
                if (attempts > 100) break;
                tooCloseToCave = this.terrain.caveEntrances.some(entrance => {
                    const dx = x - entrance.x; const dz = z - entrance.z;
                    return (dx * dx + dz * dz < checkRadiusSq);
                });
            } while (biome === 0 || height < this.terrain.waterLevel || tooCloseToCave); // Exclude water and caves

            if (attempts > 100 || tooCloseToCave) continue;

            // Determine plant type based on biome (Simplified logic)
            let plantTypeDef = plantTypes.find(p => p.id === 'fiber') || plantTypes[0]; // Default fiber
            const roll = Math.random();
            if (biome === 1) { // Beach
                 if (roll < 0.8) plantTypeDef = plantTypes.find(p=>p.id==='fiber') || plantTypes[0];
                 else plantTypeDef = plantTypes.find(p=>p.id==='cloth') || plantTypes[0]; // Cloth on beaches?
             } else if (biome === 2) { // Plains
                 if (roll < 0.6) plantTypeDef = plantTypes.find(p=>p.id==='fiber') || plantTypes[0];
                 else if (roll < 0.8) plantTypeDef = plantTypes.find(p=>p.id==='carrot') || plantTypes[0];
                 else plantTypeDef = plantTypes.find(p=>p.id==='onion') || plantTypes[0];
             } else if (biome === 3) { // Forest
                 if (roll < 0.5) plantTypeDef = plantTypes.find(p=>p.id==='fiber') || plantTypes[0];
                 else if (roll < 0.7) plantTypeDef = plantTypes.find(p=>p.id==='blueberry') || plantTypes[0];
                 else plantTypeDef = plantTypes.find(p=>p.id==='medicinalherb') || plantTypes[0];
             } else { // Mountains
                 if (roll < 0.7) plantTypeDef = plantTypes.find(p=>p.id==='fiber') || plantTypes[0];
                 else plantTypeDef = plantTypes.find(p=>p.id==='medicinalherb') || plantTypes[0];
             }
             if (!plantTypeDef) plantTypeDef = plantTypes[0]; // Fallback

             const scale = Utils.randomFloat(0.3, 0.8);
             const plantMaterial = plantMaterials[plantTypeDef.id] || plantMaterials[plantTypes[0].id];
             if (!plantMaterial) { console.warn(`No material for plant type ${plantTypeDef.id}`); continue; }

            let currentGeo = plantGeo; // Use default plant geo unless it's cloth
            let posYOffset = 0;
            if(plantTypeDef.id === 'cloth') {
                 const clothGeo = this.game.assetLoader.getModel('cloth'); // Attempt to get specific cloth geo
                 if(clothGeo) currentGeo = clothGeo;
                 posYOffset = 0.05; // Place slightly above ground
            }

             const plantMesh = new THREE.Mesh(currentGeo.clone(), plantMaterial);
             plantMesh.position.set(x, height + posYOffset, z);
             plantMesh.scale.set(scale, scale, scale);
             plantMesh.rotation.y = Utils.randomFloat(0, Math.PI * 2);
             plantMesh.castShadow = false; // Plants usually don't cast strong shadows
             plantMesh.receiveShadow = true;
             // Rotate cloth flat if using specific geometry
             if(plantTypeDef.id === 'cloth' && currentGeo !== plantGeo) {
                plantMesh.rotation.x = -Math.PI / 2;
             }

             console.log(`[WorldGenerator - Plant] Adding plant '${plantTypeDef.id}' model. Position:`, plantMesh.position, "Scale:", plantMesh.scale); // <<< LOGGING
             this.game.scene.add(plantMesh);

            const plantResource = {
                id: `plant_${spawnedCount}`, type: plantTypeDef.id, name: plantTypeDef.name,
                health: 10, maxHealth: 10, // Plants are usually one-hit harvest
                position: { x, y: height + posYOffset, z }, scale: scale, meshes: [plantMesh],
                resources: {}, regrowTime: Constants.RESOURCES.PLANT_REGROW_TIME * 60 * 1000
            };
            // Define yield
            if (plantTypeDef.id === 'fiber') plantResource.resources.fiber = Utils.random(1, 3);
            else if (plantTypeDef.id === 'cloth') plantResource.resources.cloth = Utils.random(1, 2);
            else if (['blueberry', 'carrot', 'onion'].includes(plantTypeDef.id)) { plantResource.resources[plantTypeDef.id] = Utils.random(1, 2); if (Math.random() < 0.5) plantResource.resources.fiber = 1; }
            else if (plantTypeDef.id === 'medicinalherb') { plantResource.resources.medicinalherb = Utils.random(1, 2); if (Math.random() < 0.3) plantResource.resources.fiber = 1; }

            this.resourceManager.registerResource(plantResource);
            spawnedCount++;
        }
        console.log(`[WorldGenerator] Generated ${spawnedCount} plants.`); // <<< LOGGING
    }

    async generateBarrels() {
        console.log("[WorldGenerator] Generating barrels..."); // <<< LOGGING
        const worldSize = Constants.WORLD.SIZE;
        const maxBarrels = 150;
        const barrelDensity = 0.6;
        const barrelsToSpawn = Math.floor(maxBarrels * barrelDensity);

        const barrelModelObject = this.game.assetLoader.getModel('barrel');
        // --- Added more robust check ---
        if (!barrelModelObject || !(barrelModelObject instanceof THREE.Object3D) || !barrelModelObject.children.length) {
            console.error("[WorldGenerator] Barrel GLB model not loaded correctly, is invalid, or has no children. Cannot spawn barrels."); // <<< LOGGING
            return;
        }
        // ---

        const halfSize = worldSize / 2;
        let spawnedCount = 0;
        const checkRadiusSq = Constants.WORLD.CAVE_ENTRANCE_RADIUS * Constants.WORLD.CAVE_ENTRANCE_RADIUS;

        for (let i = 0; i < barrelsToSpawn; i++) {
            let x, z, biome, height, attempts = 0;
            let tooCloseToCave = false;
            let onSteepSlope = false;
            do {
                x = Utils.randomFloat(-halfSize, halfSize);
                z = Utils.randomFloat(-halfSize, halfSize);
                height = this.terrain.getHeightAt(x, z);
                attempts++; if (attempts > 100) break;

                if (height === undefined || height < this.terrain.waterLevel + 0.1) continue;
                biome = this.terrain.getBiomeAt(x, z);

                tooCloseToCave = this.terrain.caveEntrances.some(entrance => {
                    const dx = x - entrance.x; const dz = z - entrance.z;
                    return (dx * dx + dz * dz < checkRadiusSq);
                });

                // Check slope more carefully
                const h_dx = this.terrain.getHeightAt(x + 0.1, z);
                const h_dz = this.terrain.getHeightAt(x, z + 0.1);
                if (h_dx === undefined || h_dz === undefined) { onSteepSlope = true; continue; } // Treat undefined height as steep
                const slope = Math.abs(h_dx - height) + Math.abs(h_dz - height);
                onSteepSlope = slope > 0.3; // Allow slightly steeper slopes for barrels?

            } while (biome === 0 || tooCloseToCave || onSteepSlope); // Exclude water, caves, steep slopes

            if (attempts > 100) continue;

            const barrelMesh = barrelModelObject.clone(); // Clone the loaded model group

            const scale = Utils.randomFloat(0.8, 1.2);
            barrelMesh.position.set(x, height, z); // Position at ground level
            barrelMesh.scale.set(scale, scale, scale);
            barrelMesh.rotation.y = Utils.randomFloat(0, Math.PI * 2);

            barrelMesh.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            console.log(`[WorldGenerator - Barrel] Adding barrel model. Position:`, barrelMesh.position, "Scale:", barrelMesh.scale); // <<< LOGGING
            this.game.scene.add(barrelMesh);

            const barrelResource = {
                id: `barrel_${spawnedCount}`,
                type: 'barrel', name: 'Barrel',
                health: 10, maxHealth: 10, // Barrels are typically searchable, low health
                position: { x: barrelMesh.position.x, y: barrelMesh.position.y, z: barrelMesh.position.z }, // Store plain object
                scale: scale,
                meshes: [barrelMesh],
                resources: {}, // Loot is handled by lootTable
                regrowTime: null,
                lootTable: 'BARREL_COMMON',
                searched: false
            };
            this.resourceManager.registerResource(barrelResource);
            spawnedCount++;
        }
        console.log(`[WorldGenerator] Generated ${spawnedCount} barrels.`); // <<< LOGGING
    }


    async generateSimpleBuildings() {
        console.log("[WorldGenerator] Generating simple buildings..."); // <<< LOGGING
        const worldSize = Constants.WORLD.SIZE;
        const buildingCount = 30; // Number of buildings to attempt
        const buildingSize = Constants.BUILDING.FOUNDATION_SIZE;
        const halfSize = worldSize / 2;
        let buildingsSpawned = 0;

        // Load assets
        const wallMaterial = new THREE.MeshStandardMaterial({ map: this.game.assetLoader.getTexture('wood'), roughness: 0.8, metalness: 0.2 });
        const wallGeo = this.game.assetLoader.getModel('wall');
        const containerGeo = this.game.assetLoader.getModel('crate'); // Using crate model for container
        const containerMaterial = new THREE.MeshStandardMaterial({ map: this.game.assetLoader.getTexture('wood'), color: 0xCD853F, roughness: 0.8 });

        if (!wallGeo) { console.error("[WorldGenerator] Wall geometry not loaded for buildings."); return; }
        if (!containerGeo) { console.error("[WorldGenerator] Crate geometry not loaded for building containers."); return; }

        for (let i = 0; i < buildingCount; i++) {
            let attempts = 0;
            let placeable = false;
            let centerX, centerZ, avgHeight;

            while (attempts < 100 && !placeable) {
                attempts++;
                centerX = Utils.randomFloat(-halfSize * 0.8, halfSize * 0.8);
                centerZ = Utils.randomFloat(-halfSize * 0.8, halfSize * 0.8);

                // Check corners and center for height and slope
                const corners = [
                    { x: centerX - buildingSize / 2, z: centerZ - buildingSize / 2 },
                    { x: centerX + buildingSize / 2, z: centerZ - buildingSize / 2 },
                    { x: centerX - buildingSize / 2, z: centerZ + buildingSize / 2 },
                    { x: centerX + buildingSize / 2, z: centerZ + buildingSize / 2 },
                    { x: centerX, z: centerZ }
                ];
                let minH = Infinity, maxH = -Infinity, totalH = 0;
                let validHeights = true;
                for (const corner of corners) {
                    const h = this.terrain.getHeightAt(corner.x, corner.z);
                    if (h === undefined || h < this.terrain.waterLevel + 0.2) {
                        validHeights = false; break;
                    }
                    minH = Math.min(minH, h);
                    maxH = Math.max(maxH, h);
                    totalH += h;
                }
                if (!validHeights) continue;

                const heightDiff = maxH - minH; // Check slope

                // Check proximity to cave entrances
                const tooCloseToCave = this.terrain.caveEntrances.some(entrance => {
                    const dx = centerX - entrance.x; const dz = centerZ - entrance.z;
                    return (dx * dx + dz * dz < (Constants.WORLD.CAVE_ENTRANCE_RADIUS * 3) ** 2); // Exclude wider radius around caves
                });

                if (heightDiff < 1.0 && !tooCloseToCave) { // Check slope is reasonable and not too close to cave
                    placeable = true;
                    avgHeight = totalH / corners.length;
                }
            }

            if (placeable) {
                // Create a simple 4-wall structure with one side open as a door
                const doorSideIndex = Utils.random(0, 3); // 0:N, 1:S, 2:E, 3:W
                const wallPositions = [
                    { side: 'N', x: centerX, z: centerZ - buildingSize / 2, rot: 0 }, // North wall
                    { side: 'S', x: centerX, z: centerZ + buildingSize / 2, rot: Math.PI }, // South wall
                    { side: 'E', x: centerX + buildingSize / 2, z: centerZ, rot: Math.PI / 2 }, // East wall
                    { side: 'W', x: centerX - buildingSize / 2, z: centerZ, rot: -Math.PI / 2 } // West wall
                ];

                const structureMeshes = []; // Store meshes for the structure resource
                let doorPosition = null; // Store position info for container placement

                for (const [index, wPos] of wallPositions.entries()) {
                    if (index === doorSideIndex) {
                        doorPosition = wPos; // Skip wall for door side
                        continue;
                    }
                    const wallMesh = new THREE.Mesh(wallGeo.clone(), wallMaterial.clone());
                    const wallY = avgHeight + Constants.BUILDING.WALL_HEIGHT / 2; // Position wall vertically centered on avg ground height
                    wallMesh.position.set(wPos.x, wallY, wPos.z);
                    wallMesh.rotation.y = wPos.rot;
                    wallMesh.castShadow = true;
                    wallMesh.receiveShadow = true;
                    console.log(`[WorldGenerator - Building] Adding wall mesh. Position:`, wallMesh.position); // <<< LOGGING
                    this.game.scene.add(wallMesh);
                    structureMeshes.push(wallMesh); // Add to structure's mesh list
                }

                // Place a container inside, opposite the door
                let crateOffsetX = 0, crateOffsetZ = 0;
                if (doorPosition) {
                    if (doorPosition.side === 'N') crateOffsetZ = buildingSize * 0.3; // Opposite north door
                    if (doorPosition.side === 'S') crateOffsetZ = -buildingSize * 0.3; // Opposite south door
                    if (doorPosition.side === 'E') crateOffsetX = -buildingSize * 0.3; // Opposite east door
                    if (doorPosition.side === 'W') crateOffsetX = buildingSize * 0.3; // Opposite west door
                }

                const containerScale = Utils.randomFloat(0.8, 1.2);
                const containerMesh = new THREE.Mesh(containerGeo.clone(), containerMaterial.clone());
                containerMesh.position.set(centerX + crateOffsetX, avgHeight + containerScale * 0.5, centerZ + crateOffsetZ); // Place on ground + half height
                containerMesh.scale.set(containerScale, containerScale, containerScale);
                containerMesh.castShadow = true;
                containerMesh.receiveShadow = true;
                console.log(`[WorldGenerator - Building] Adding container mesh. Position:`, containerMesh.position); // <<< LOGGING
                this.game.scene.add(containerMesh);

                // Register container as a searchable resource
                const containerResource = {
                    id: `building_cache_${buildingsSpawned}`, type: 'crate', name: 'Storage Crate',
                    health: 10, maxHealth: 10,
                    position: { x: containerMesh.position.x, y: containerMesh.position.y, z: containerMesh.position.z },
                    scale: containerScale, meshes: [containerMesh], resources: {},
                    regrowTime: null, lootTable: 'BUILDING_CACHE', searched: false
                };
                this.resourceManager.registerResource(containerResource);

                // Register the building walls as a single "structure" resource (optional, for potential destruction)
                const structureResource = {
                     id: `simple_building_${buildingsSpawned}`, type: 'structure', name: 'Abandoned Shack',
                     position: { x: centerX, y: avgHeight, z: centerZ }, // Center position
                     meshes: structureMeshes, health: 200, maxHealth: 200, // Give structure health
                     resources: { wood: Utils.random(5, 15), metalscrap: Utils.random(1, 5) }, // Resources on destruction
                     regrowTime: null
                 };
                 this.resourceManager.registerResource(structureResource);

                buildingsSpawned++;
            }
        }
        console.log(`[WorldGenerator] Generated ${buildingsSpawned} simple buildings.`); // <<< LOGGING
    }
}

// --- END OF FILE WorldGenerator.js ---