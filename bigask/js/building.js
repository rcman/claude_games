// building.js - Handles building placement, grid system, and collision detection

class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.selectedBuildable = null;
        this.placementValid = false;
        this.buildables = this.setupBuildables();
        
        // Building grid properties
        this.gridSize = 1.0; // Size of grid cells
        this.ghostMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });
        this.invalidMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        
        this.ghostObject = null;
        this.placedBuildings = [];
    }
    
    setupBuildables() {
        return {
            'wooden_wall': {
                name: 'Wooden Wall',
                model: 'assets/models/wooden_wall.glb',
                icon: 'assets/structures/wooden_wall.png',
                collision: { width: 0.2, height: 3, depth: 3 },
                offset: { x: 0, y: 1.5, z: 0 },
                rotatable: true,
                category: 'building'
            },
            'wooden_floor': {
                name: 'Wooden Floor',
                model: 'assets/models/wooden_floor.glb',
                icon: 'assets/structures/wooden_floor.png',
                collision: { width: 3, height: 0.2, depth: 3 },
                offset: { x: 0, y: 0, z: 0 },
                rotatable: false,
                category: 'building'
            },
            'wooden_door': {
                name: 'Wooden Door',
                model: 'assets/models/wooden_door.glb',
                icon: 'assets/structures/wooden_door.png',
                collision: { width: 0.2, height: 3, depth: 1.5 },
                offset: { x: 0, y: 1.5, z: 0 },
                rotatable: true,
                interactive: true,
                action: 'toggleDoor',
                category: 'building'
            },
            'campfire': {
                name: 'Campfire',
                model: 'assets/models/campfire.glb',
                icon: 'assets/structures/campfire.png',
                collision: { width: 1.5, height: 0.5, depth: 1.5 },
                offset: { x: 0, y: 0.25, z: 0 },
                rotatable: false,
                interactive: true,
                action: 'openCampfire',
                category: 'structures',
                lightSource: {
                    color: 0xff6a00,
                    intensity: 1,
                    distance: 8,
                    height: 0.5
                }
            },
            'crafting_table': {
                name: 'Crafting Table',
                model: 'assets/models/crafting_table.glb',
                icon: 'assets/structures/crafting_table.png',
                collision: { width: 2, height: 1.5, depth: 2 },
                offset: { x: 0, y: 0.75, z: 0 },
                rotatable: true,
                interactive: true,
                action: 'openCraftingTable',
                category: 'structures'
            },
            'forge': {
                name: 'Forge',
                model: 'assets/models/forge.glb',
                icon: 'assets/structures/forge.png',
                collision: { width: 2.5, height: 2, depth: 2.5 },
                offset: { x: 0, y: 1, z: 0 },
                rotatable: true,
                interactive: true,
                action: 'openForge',
                category: 'structures',
                lightSource: {
                    color: 0xff4500,
                    intensity: 1.2,
                    distance: 6,
                    height: 1
                }
            },
            'storage_box': {
                name: 'Storage Box',
                model: 'assets/models/storage_box.glb',
                icon: 'assets/structures/storage_box.png',
                collision: { width: 1.5, height: 1, depth: 1.5 },
                offset: { x: 0, y: 0.5, z: 0 },
                rotatable: true,
                interactive: true,
                action: 'openStorage',
                category: 'structures'
            }
        };
    }
    
    selectBuildable(itemId) {
        if (this.ghostObject) {
            this.game.scene.remove(this.ghostObject);
            this.ghostObject = null;
        }
        
        const buildable = this.buildables[itemId];
        if (!buildable) return false;
        
        this.selectedBuildable = buildable;
        this.createGhostObject(itemId);
        return true;
    }
    
    createGhostObject(itemId) {
        const buildable = this.buildables[itemId];
        
        // Create a simplified ghost mesh
        let geometry;
        const collision = buildable.collision;
        
        if (buildable.category === 'building') {
            // Use BoxGeometry for building pieces
            geometry = new THREE.BoxGeometry(
                collision.width, 
                collision.height, 
                collision.depth
            );
        } else {
            // Use cylindrical geometry for structures like campfire
            geometry = new THREE.CylinderGeometry(
                collision.width / 2, 
                collision.width / 2, 
                collision.height, 
                8
            );
        }
        
        this.ghostObject = new THREE.Mesh(geometry, this.ghostMaterial);
        this.ghostObject.userData.buildableId = itemId;
        this.ghostObject.userData.rotation = 0;
        
        // Apply offset
        if (buildable.offset) {
            this.ghostObject.position.y += buildable.offset.y;
        }
        
        this.game.scene.add(this.ghostObject);
    }
    
    updateGhostPosition(mouse, camera) {
        if (!this.ghostObject || !this.selectedBuildable) return;
        
        // Cast a ray from the camera to the ground
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // Check for intersections with the terrain
        const intersects = raycaster.intersectObjects(this.game.world.getCollisionObjects());
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const position = intersection.point.clone();
            
            // Snap to grid
            position.x = Math.round(position.x / this.gridSize) * this.gridSize;
            position.z = Math.round(position.z / this.gridSize) * this.gridSize;
            
            // Apply position
            this.ghostObject.position.x = position.x;
            this.ghostObject.position.z = position.z;
            
            // Check if placement is valid
            this.placementValid = this.checkPlacementValidity(position);
            
            // Set material based on validity
            this.ghostObject.material = this.placementValid ? 
                this.ghostMaterial : this.invalidMaterial;
        }
    }
    
    rotateGhost() {
        if (!this.ghostObject || !this.selectedBuildable || !this.selectedBuildable.rotatable) return;
        
        // Rotate 90 degrees around Y axis
        this.ghostObject.userData.rotation = (this.ghostObject.userData.rotation + Math.PI/2) % (Math.PI*2);
        this.ghostObject.rotation.y = this.ghostObject.userData.rotation;
    }
    
    checkPlacementValidity(position) {
        if (!this.selectedBuildable) return false;
        
        // Check terrain compatibility (can't build on water)
        if (position.y < this.game.world.waterLevel) {
            return false;
        }
        
        // Check collision with other buildings
        for (const building of this.placedBuildings) {
            if (this.checkBuildingCollision(position, building.position, this.selectedBuildable, building.buildableId)) {
                return false;
            }
        }
        
        // Add more checks as needed (e.g., distance from player, required foundation, etc.)
        
        return true;
    }
    
    checkBuildingCollision(pos1, pos2, buildable1, buildable2Id) {
        // Get collision box for the second building
        const buildable2 = typeof buildable2Id === 'string' ? 
            this.buildables[buildable2Id] : buildable2Id;
        
        // Simple box collision check
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        const dz = Math.abs(pos1.z - pos2.z);
        
        const sumWidth = (buildable1.collision.width + buildable2.collision.width) / 2;
        const sumHeight = (buildable1.collision.height + buildable2.collision.height) / 2;
        const sumDepth = (buildable1.collision.depth + buildable2.collision.depth) / 2;
        
        return dx < sumWidth && dy < sumHeight && dz < sumDepth;
    }
    
    placeBuildable() {
        if (!this.ghostObject || !this.placementValid || !this.selectedBuildable) return false;
        
        const buildableId = this.ghostObject.userData.buildableId;
        const rotation = this.ghostObject.userData.rotation;
        const position = this.ghostObject.position.clone();
        
        // Check if player has the item in inventory
        if (!this.game.inventory.hasItem(buildableId, 1)) {
            this.game.ui.showNotification('You don\'t have this item in your inventory');
            return false;
        }
        
        // Remove item from inventory
        this.game.inventory.removeItem(buildableId, 1);
        
        // Create a new real building
        this.createBuilding(buildableId, position, rotation);
        
        return true;
    }
    
    createBuilding(buildableId, position, rotation = 0) {
        const buildable = this.buildables[buildableId];
        
        // Create a real building object
        // In a real implementation, this would load the actual model
        // For this example, we'll create a simple mesh
        let geometry;
        const collision = buildable.collision;
        
        if (buildable.category === 'building') {
            geometry = new THREE.BoxGeometry(
                collision.width, 
                collision.height, 
                collision.depth
            );
        } else {
            geometry = new THREE.CylinderGeometry(
                collision.width / 2, 
                collision.width / 2, 
                collision.height, 
                8
            );
        }
        
        const material = new THREE.MeshLambertMaterial({ 
            color: buildableId.includes('wooden') ? 0x8B4513 : 0x888888 
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.rotation.y = rotation;
        
        // Store building data
        mesh.userData = {
            buildableId: buildableId,
            interactive: buildable.interactive || false,
            action: buildable.action || null,
            rotation: rotation,
            state: 'closed' // For doors and other stateful objects
        };
        
        // Add to scene and tracking arrays
        this.game.scene.add(mesh);
        this.placedBuildings.push({
            id: Date.now(), // Unique ID for the building
            mesh: mesh,
            buildableId: buildableId,
            position: position,
            rotation: rotation
        });
        
        // Add light if it's a light source
        if (buildable.lightSource) {
            const light = new THREE.PointLight(
                buildable.lightSource.color,
                buildable.lightSource.intensity,
                buildable.lightSource.distance
            );
            light.position.copy(position);
            light.position.y += buildable.lightSource.height || 0;
            
            mesh.userData.light = light;
            this.game.scene.add(light);
        }
        
        return mesh;
    }
    
    cancelPlacement() {
        if (this.ghostObject) {
            this.game.scene.remove(this.ghostObject);
            this.ghostObject = null;
            this.selectedBuildable = null;
        }
    }
    
    interactWithBuilding(building) {
        if (!building || !building.userData || !building.userData.interactive) return;
        
        const action = building.userData.action;
        
        switch(action) {
            case 'toggleDoor':
                this.toggleDoor(building);
                break;
            case 'openCampfire':
                this.game.structures.openCampfire();
                break;
            case 'openCraftingTable':
                this.game.structures.openCraftingTable();
                break;
            case 'openForge':
                this.game.structures.openForge();
                break;
            case 'openStorage':
                this.game.structures.openStorage(building);
                break;
        }
    }
    
    toggleDoor(door) {
        if (!door) return;
        
        const currentState = door.userData.state;
        const newState = currentState === 'closed' ? 'open' : 'closed';
        
        if (newState === 'open') {
            // Rotate door 90 degrees to open
            door.rotation.y += Math.PI/2;
        } else {
            // Rotate back to close
            door.rotation.y -= Math.PI/2;
        }
        
        door.userData.state = newState;
    }
    
    update(deltaTime) {
        // Check for day/night transition to handle lights
        for (const building of this.placedBuildings) {
            if (building.mesh.userData.light) {
                // Can implement logic to turn on/off lights based on time of day
            }
        }
    }
    
    getBuildingAtPosition(position, radius = 2) {
        // Find the closest building within interaction radius
        let closestBuilding = null;
        let closestDistance = radius;
        
        for (const building of this.placedBuildings) {
            const distance = position.distanceTo(building.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestBuilding = building.mesh;
            }
        }
        
        return closestBuilding;
    }
    
    // Save/load building data for world persistence
    saveBuildings() {
        return this.placedBuildings.map(building => ({
            buildableId: building.buildableId,
            position: {
                x: building.position.x,
                y: building.position.y,
                z: building.position.z
            },
            rotation: building.rotation,
            state: building.mesh.userData.state || 'closed'
        }));
    }
    
    loadBuildings(buildingsData) {
        // Clear existing buildings
        for (const building of this.placedBuildings) {
            this.game.scene.remove(building.mesh);
            if (building.mesh.userData.light) {
                this.game.scene.remove(building.mesh.userData.light);
            }
        }
        
        this.placedBuildings = [];
        
        // Load buildings from saved data
        for (const data of buildingsData) {
            const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
            const building = this.createBuilding(data.buildableId, position, data.rotation);
            
            // Restore state (like door open/closed)
            if (data.state) {
                building.userData.state = data.state;
                
                // Apply visual state (like door rotation)
                if (data.buildableId === 'wooden_door' && data.state === 'open') {
                    building.rotation.y += Math.PI/2;
                }
            }
        }
    }
}