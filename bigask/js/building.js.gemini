// building.js

class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.selectedBuildable = null; // This will be the ItemData object for the buildable
        this.placementValid = false;
        this.buildables = this.setupBuildables(); // This is config for actual placed structures
        
        this.gridSize = 1.0; 
        this.ghostMaterial = new THREE.MeshLambertMaterial({ // Use Lambert for ghost for now
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6,
            emissive: 0x00ff00, // Make it glow a bit
            emissiveIntensity: 0.3
        });
        this.invalidMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.6,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        this.ghostObject = null;
        this.placedBuildings = []; // Array of { id, mesh, buildableId, position, rotation, data (e.g. for storage) }
        this.loader = new THREE.GLTFLoader();
    }
    
    // buildables defines the properties of placed structures
    setupBuildables() {
        return {
            'wooden_wall': {
                name: 'Wooden Wall',
                modelPath: 'assets/models/wooden_wall.glb', // Path to the actual model
                icon: 'assets/ui/icons/wooden_wall_icon.png', // UI Icon
                collisionSize: { width: 0.2, height: 3, depth: 2 }, // Size for collision and ghost
                offset: { x: 0, y: 1.5, z: 0 }, // Offset from grid point to center of model base
                rotatable: true,
                snapsToGrid: true,
                category: 'wall'
            },
            'wooden_floor': {
                name: 'Wooden Floor',
                modelPath: 'assets/models/wooden_floor.glb',
                icon: 'assets/ui/icons/wooden_floor_icon.png',
                collisionSize: { width: 2, height: 0.2, depth: 2 },
                offset: { x: 0, y: 0.1, z: 0 },
                rotatable: false,
                snapsToGrid: true,
                category: 'floor'
            },
            'wooden_door': {
                name: 'Wooden Door',
                modelPath: 'assets/models/wooden_door.glb',
                icon: 'assets/ui/icons/wooden_door_icon.png',
                collisionSize: { width: 0.2, height: 2.8, depth: 1.8 }, // slightly smaller than wall for frame
                offset: { x: 0, y: 1.4, z: 0 },
                rotatable: true,
                interactive: true, action: 'toggleDoor',
                snapsToGrid: true,
                category: 'door'
            },
            'campfire': {
                name: 'Campfire',
                modelPath: 'assets/models/campfire_lit.glb', // Or have a lit/unlit version
                icon: 'assets/ui/icons/campfire_icon.png',
                collisionSize: { radius: 0.6, height: 0.5 }, // Cylindrical
                offset: { x: 0, y: 0.25, z: 0 },
                rotatable: false,
                interactive: true, action: 'openCampfire',
                snapsToGrid: false, // Usually placed more freely
                lightSource: { color: 0xff8800, intensity: 1.5, distance: 10, height: 0.5 },
                category: 'utility'
            },
             'crafting_table': {
                name: 'Crafting Table',
                modelPath: 'assets/models/crafting_table.glb',
                icon: 'assets/ui/icons/crafting_table_icon.png',
                collisionSize: { width: 1.5, height: 1, depth: 0.8 },
                offset: { x: 0, y: 0.5, z: 0 },
                rotatable: true,
                interactive: true, action: 'openCraftingTable',
                snapsToGrid: false,
                category: 'utility'
            },
            'forge': {
                name: 'Forge',
                modelPath: 'assets/models/forge.glb',
                icon: 'assets/ui/icons/forge_icon.png',
                collisionSize: { width: 1.2, height: 1.5, depth: 1.2 }, // Approx
                offset: { x: 0, y: 0.75, z: 0 },
                rotatable: true,
                interactive: true, action: 'openForge',
                snapsToGrid: false,
                lightSource: { color: 0xff4500, intensity: 1.2, distance: 6, height: 0.8, activeOnlyWhenUsed: true },
                category: 'utility'
            },
            'storage_box': {
                name: 'Storage Box',
                modelPath: 'assets/models/storage_box.glb',
                icon: 'assets/ui/icons/storage_box_icon.png',
                collisionSize: { width: 1, height: 1, depth: 0.7 },
                offset: { x: 0, y: 0.5, z: 0 },
                rotatable: true,
                interactive: true, action: 'openStorage',
                snapsToGrid: false,
                category: 'utility',
                storageSlots: 15
            }
            // Add more: foundations, roofs, windows, stairs, defensive structures etc.
        };
    }
    
    selectBuildable(itemId) { // itemId is from ItemData, e.g., 'wooden_wall_item'
        this.cancelPlacement(); // Clear any previous ghost

        const itemData = getItemData(itemId); // Get data for the item used to build
        if (!itemData || !itemData.buildableId) {
            console.warn("Item is not a valid buildable:", itemId);
            return false;
        }

        const buildableConfig = this.buildables[itemData.buildableId]; // Get config for the structure itself
        if (!buildableConfig) {
            console.warn("No buildable config for:", itemData.buildableId);
            return false;
        }

        this.selectedBuildable = { item: itemData, config: buildableConfig }; // Store both
        this.createGhostObject(this.selectedBuildable);
        this.game.ui.showNotification(`Building: ${buildableConfig.name}. Left-Click: Place, R: Rotate, Esc: Cancel`);
        return true;
    }
    
    createGhostObject(selectedBuildableData) {
        const config = selectedBuildableData.config;
        const collision = config.collisionSize;
        let geometry;

        if (collision.radius) { // Cylindrical
            geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16);
        } else { // Box
            geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth);
        }
        
        this.ghostObject = new THREE.Mesh(geometry, this.ghostMaterial);
        this.ghostObject.userData.buildableId = selectedBuildableData.item.buildableId; // Store the ID of the structure config
        this.ghostObject.userData.rotationY = 0; // Store rotation separately
        
        this.game.scene.add(this.ghostObject);
        // Initial update to position it
        this.updateGhostPosition(); 
    }
    
    updateGhostPosition() {
        if (!this.ghostObject || !this.selectedBuildable) return;
        
        const config = this.selectedBuildable.config;
        const player = this.game.player;
        const raycaster = new THREE.Raycaster();
        
        // Raycast from camera center
        raycaster.setFromCamera({x: 0, y: 0}, this.game.camera);
        
        // Intersect with terrain and existing buildings
        const collidables = [...this.game.world.getCollisionObjects(), ...this.placedBuildings.map(b => b.mesh)];
        const intersects = raycaster.intersectObjects(collidables, true); // Recursive true for complex models
        
        let hitPoint = null;
        const maxPlacementDistance = 8; // How far player can build

        if (intersects.length > 0) {
            for (const hit of intersects) {
                // Ignore self or tool if they get in the ray
                if (hit.object === player.playerObject || (player.toolMesh && hit.object === player.toolMesh) || hit.object === this.ghostObject) continue;
                if (hit.distance > maxPlacementDistance) break; // Too far
                
                hitPoint = hit.point.clone();
                break; 
            }
        }

        if (hitPoint) {
            this.ghostObject.visible = true;
            let placementPos = hitPoint;
            if (config.snapsToGrid) {
                placementPos.x = Math.round(hitPoint.x / this.gridSize) * this.gridSize;
                placementPos.z = Math.round(hitPoint.z / this.gridSize) * this.gridSize;
                // Y position should be on terrain or snapped to other structures if applicable (more complex)
                placementPos.y = this.game.world.getHeightAt(placementPos.x, placementPos.z); 
            } else {
                 placementPos.y = this.game.world.getHeightAt(hitPoint.x, hitPoint.z);
            }
            
            // Apply offset from config
            this.ghostObject.position.set(
                placementPos.x + (config.offset ? config.offset.x : 0),
                placementPos.y + (config.offset ? config.offset.y : 0),
                placementPos.z + (config.offset ? config.offset.z : 0)
            );
            this.ghostObject.rotation.y = this.ghostObject.userData.rotationY;

            this.placementValid = this.checkPlacementValidity(this.ghostObject.position, config);
            this.ghostObject.material = this.placementValid ? this.ghostMaterial : this.invalidMaterial;

        } else {
            this.ghostObject.visible = false; // Can't find valid placement point
            this.placementValid = false;
        }
    }
    
    rotateGhost() {
        if (!this.ghostObject || !this.selectedBuildable || !this.selectedBuildable.config.rotatable) return;
        this.ghostObject.userData.rotationY = (this.ghostObject.userData.rotationY + Math.PI / 2) % (Math.PI * 2);
        // Update position will apply rotation
    }
    
    checkPlacementValidity(position, buildableConfig) {
        // Check terrain (not in water, not too steep)
        const terrainHeight = this.game.world.getHeightAt(position.x, position.z);
        if (terrainHeight < this.game.world.waterLevel) return false;
        // Add slope check if needed: this.game.world.getSlopeAt(position.x, position.z)

        // Check collision with other buildings
        const ghostBox = new THREE.Box3().setFromObject(this.ghostObject); // Use ghost's current AABB
        for (const building of this.placedBuildings) {
            const buildingBox = new THREE.Box3().setFromObject(building.mesh);
            if (ghostBox.intersectsBox(buildingBox)) {
                return false;
            }
        }
        // Check collision with resources (optional)
        // for (const resource of this.game.resources.activeResources) {
        //    const resourceBox = new THREE.Box3().setFromObject(resource);
        //    if (ghostBox.intersectsBox(resourceBox)) return false;
        // }
        return true;
    }
        
    placeBuildable() {
        if (!this.ghostObject || !this.placementValid || !this.selectedBuildable) return false;
        
        const itemToConsume = this.selectedBuildable.item.id; // The item ID from inventory
        const buildableId = this.ghostObject.userData.buildableId; // The ID for buildables config
        const config = this.buildables[buildableId];

        if (!this.game.inventory.hasItem(itemToConsume, 1)) {
            this.game.ui.showNotification(`You don't have ${getItemData(itemToConsume).name}.`);
            this.cancelPlacement();
            return false;
        }
        
        this.game.inventory.removeItem(itemToConsume, 1);
        
        const position = this.ghostObject.position.clone();
        const rotationY = this.ghostObject.userData.rotationY;
        
        this.createBuilding(buildableId, position, rotationY, config);
        
        // If player has more of the item, keep ghost active, otherwise cancel.
        if (!this.game.inventory.hasItem(itemToConsume, 1)) {
            this.cancelPlacement();
        } else {
            // Refresh ghost validity for next placement
            this.updateGhostPosition();
        }
        return true;
    }
    
    createBuilding(buildableId, position, rotationY, config) {
        // Load model or use placeholder
        if (config.modelPath) {
             this.loader.load(config.modelPath, (gltf) => {
                const model = gltf.scene;
                this._finalizeBuilding(model, buildableId, position, rotationY, config);
            }, undefined, (error) => {
                console.error(`Failed to load building model ${config.modelPath}:`, error);
                this._createPlaceholderBuilding(buildableId, position, rotationY, config);
            });
        } else {
            this._createPlaceholderBuilding(buildableId, position, rotationY, config);
        }
    }

    _createPlaceholderBuilding(buildableId, position, rotationY, config) {
        const collision = config.collisionSize;
        let geometry;
        if (collision.radius) { geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16); }
        else { geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth); }
        
        const material = new THREE.MeshLambertMaterial({ 
            color: buildableId.includes('wooden') ? 0x966F33 : // Lighter wood
                   buildableId === 'campfire' ? 0x505050 : 
                   0xAAAAAA 
        });
        const mesh = new THREE.Mesh(geometry, material);
        this._finalizeBuilding(mesh, buildableId, position, rotationY, config);
        console.warn("Using placeholder for building:", buildableId);
    }

    _finalizeBuilding(mesh, buildableId, position, rotationY, config) {
        mesh.position.copy(position);
        mesh.rotation.y = rotationY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            type: 'structure', // Important for raycasting interactions
            buildableId: buildableId,
            interactive: config.interactive || false,
            action: config.action || null,
            state: 'closed', // For doors, etc.
            // Add specific data if needed, e.g., for storage
        };
        if (config.storageSlots) {
            mesh.userData.storageId = `storage_${generateUUID()}`;
            this.game.structures.initializeStorage(mesh.userData.storageId, config.storageSlots);
        }
        
        this.game.scene.add(mesh);
        const placedBuildingEntry = {
            id: generateUUID(), 
            mesh: mesh,
            buildableId: buildableId,
            position: position.clone(),
            rotation: rotationY,
            config: config // Store config for easy access
        };
        this.placedBuildings.push(placedBuildingEntry);
        
        if (config.lightSource) {
            const light = new THREE.PointLight(
                config.lightSource.color,
                config.lightSource.intensity,
                config.lightSource.distance
            );
            // Position light relative to the building mesh
            const lightOffset = new THREE.Vector3(0, config.lightSource.height || 0.5, 0);
            mesh.add(light); // Add light as a child of the mesh
            light.position.copy(lightOffset); // Position relative to parent
            
            mesh.userData.light = light;
            if (config.lightSource.activeOnlyWhenUsed) {
                light.visible = false; // e.g. forge light only when smelting
            }
        }
         // Add to world collision objects if it's substantial (e.g., walls, not small items)
        if (config.category === 'wall' || config.category === 'floor' || config.category === 'door') {
            //this.game.world.addCollisionObject(mesh); // Needs world method
        }
    }
    
    cancelPlacement() {
        if (this.ghostObject) {
            this.game.scene.remove(this.ghostObject);
            if (this.ghostObject.geometry) this.ghostObject.geometry.dispose();
            if (this.ghostObject.material) this.ghostObject.material.dispose();
            this.ghostObject = null;
        }
        this.selectedBuildable = null;
        this.placementValid = false;
        this.game.ui.hideInteractionPrompt(); // Or a specific build mode prompt
    }
    
    interactWithBuilding(buildingMesh) { // buildingMesh is the THREE.Mesh object
        if (!buildingMesh || !buildingMesh.userData || !buildingMesh.userData.interactive) return;
        
        const action = buildingMesh.userData.action;
        const buildableId = buildingMesh.userData.buildableId;
        const config = this.buildables[buildableId];

        switch(action) {
            case 'toggleDoor': this.toggleDoor(buildingMesh); break;
            case 'openCampfire': this.game.structures.openCampfire(buildingMesh); break;
            case 'openCraftingTable': this.game.structures.openCraftingTable(buildingMesh); break;
            case 'openForge': this.game.structures.openForge(buildingMesh); break;
            case 'openStorage': this.game.structures.openStorage(buildingMesh); break;
            // Default:
            //     console.log("Interacted with structure:", buildingMesh.userData.buildableId);
        }
    }
    
    toggleDoor(doorMesh) {
        const isOpen = doorMesh.userData.state === 'open';
        const pivotOffset = doorMesh.geometry.parameters.depth / 2; // Assuming door pivots at one edge

        if (isOpen) {
            doorMesh.rotation.y -= Math.PI / 2;
            // Adjust position if pivot is not centered
            // doorMesh.position.x += Math.cos(doorMesh.rotation.y + Math.PI/2) * pivotOffset;
            // doorMesh.position.z += Math.sin(doorMesh.rotation.y + Math.PI/2) * pivotOffset;
            doorMesh.userData.state = 'closed';
        } else {
            doorMesh.rotation.y += Math.PI / 2;
            // doorMesh.position.x -= Math.cos(doorMesh.rotation.y) * pivotOffset;
            // doorMesh.position.z -= Math.sin(doorMesh.rotation.y) * pivotOffset;
            doorMesh.userData.state = 'open';
        }
    }
    
    update(deltaTime) {
        if (this.ghostObject) {
            this.updateGhostPosition();
        }
        // Update lights on structures (e.g. flickering campfire)
        this.placedBuildings.forEach(building => {
            if (building.mesh.userData.light && building.config.lightSource && !building.config.lightSource.activeOnlyWhenUsed) {
                if (building.buildableId === 'campfire') { // Flickering effect
                    building.mesh.userData.light.intensity = building.config.lightSource.intensity * (1 + Math.sin(this.game.gameTime * 5) * 0.1);
                }
            }
        });
    }
    
    // (Keep save/load methods, adapt them to store mesh.userData.storageId if present)
    saveBuildings() {
        return this.placedBuildings.map(b => ({
            buildableId: b.buildableId,
            position: { x: b.position.x, y: b.position.y, z: b.position.z },
            rotation: b.rotation,
            state: b.mesh.userData.state || 'closed',
            storageId: b.mesh.userData.storageId // Save storage ID
        }));
    }
    
    loadBuildings(buildingsData) {
        this.placedBuildings.forEach(b => {
            this.game.scene.remove(b.mesh);
            if (b.mesh.userData.light) b.mesh.remove(b.mesh.userData.light); // Light is child
        });
        this.placedBuildings = [];
        
        buildingsData.forEach(data => {
            const config = this.buildables[data.buildableId];
            if (config) {
                const buildingMesh = this.createBuilding(data.buildableId, new THREE.Vector3(data.position.x, data.position.y, data.position.z), data.rotation, config);
                // The actual mesh creation is async if models are loaded.
                // We need a way to apply state AFTER the mesh is created. This is tricky.
                // For now, assume _finalizeBuilding applies basic state. More complex state needs callbacks or promises.
                // A temporary solution:
                setTimeout(() => {
                    const foundBuilding = this.placedBuildings.find(pb => pb.position.x === data.position.x && pb.position.z === data.position.z && pb.buildableId === data.buildableId);
                    if (foundBuilding && foundBuilding.mesh) {
                        if (data.state) foundBuilding.mesh.userData.state = data.state;
                        if (data.buildableId === 'wooden_door' && data.state === 'open') {
                             this.toggleDoor(foundBuilding.mesh); // Call toggle to correctly set rotation based on current state
                        }
                        if(data.storageId && foundBuilding.mesh.userData) { // Restore storageId
                            foundBuilding.mesh.userData.storageId = data.storageId;
                        }
                    }
                }, 1000); // Delay to allow model loading
            }
        });
    }
}