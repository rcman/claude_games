import * as THREE from './three.min.js';

export class BuildingSystem {
    constructor(scene, camera, collidables, player, uiManager) {
        this.scene = scene;
        this.camera = camera;
        this.collidables = collidables;
        this.player = player; // To check resources
        this.uiManager = uiManager;

        this.buildMode = false;
        this.selectedBuildItem = null; // e.g., { name: 'Foundation', material: 'wood', cost: { wood: 10 } }
        this.ghostMesh = null;
        this.gridSize = 2; // Foundations snap to this world grid size
        this.wallHeight = 3; // Standard wall height

        this.raycaster = new THREE.Raycaster();

        this.buildableItems = {
            'Foundation': { cost: { Wood: 10 }, size: [this.gridSize, 0.5, this.gridSize], type: 'foundation' },
            'Wall': { cost: { Wood: 5 }, size: [this.gridSize, this.wallHeight, 0.2], type: 'wall' },
            'WallWithWindow': { cost: { Wood: 6 }, size: [this.gridSize, this.wallHeight, 0.2], type: 'wall' },
            'WallWithDoorway': { cost: { Wood: 4 }, size: [this.gridSize, this.wallHeight, 0.2], type: 'wall' },
            'Door': { cost: { Wood: 3 }, size: [this.gridSize * 0.8, this.wallHeight * 0.9, 0.1], type: 'door' }, // Smaller for doorway
            'Ceiling': { cost: { Wood: 8 }, size: [this.gridSize, 0.2, this.gridSize], type: 'ceiling' }
        };

        document.addEventListener('wheel', (event) => this.onMouseWheel(event), false);
        document.addEventListener('mousedown', (event) => this.onMouseDown(event), false);
    }

    enterBuildMode() {
        this.buildMode = true;
        console.log("Entered build mode");
        this.uiManager.populateBuildMenu(this.getBuildableItemsWithCosts());
        // Player controls might need to be unlocked or handled differently
    }

    exitBuildMode() {
        this.buildMode = false;
        this.selectedBuildItem = null;
        if (this.ghostMesh) {
            this.scene.remove(this.ghostMesh);
            this.ghostMesh.geometry.dispose();
            this.ghostMesh.material.dispose();
            this.ghostMesh = null;
        }
        console.log("Exited build mode");
        this.uiManager.closeBuildingMenu();
    }

    selectBuildItem(itemName) {
        if (!this.buildableItems[itemName]) {
            console.error("Unknown build item:", itemName);
            return;
        }
        this.selectedBuildItem = { name: itemName, ...this.buildableItems[itemName] };
        
        if (this.ghostMesh) {
            this.scene.remove(this.ghostMesh);
            this.ghostMesh.geometry.dispose();
            this.ghostMesh.material.dispose();
        }

        const size = this.selectedBuildItem.size;
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, wireframe: true });
        this.ghostMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.ghostMesh);
        console.log("Selected build item:", itemName);
    }

    getBuildableItemsWithCosts() {
        return Object.entries(this.buildableItems).map(([name, data]) => ({ name, cost: data.cost }));
    }

    onMouseWheel(event) {
        if (this.buildMode && this.ghostMesh) {
            this.ghostMesh.rotation.y += Math.sign(event.deltaY) * (Math.PI / 2); // Rotate 90 degrees
        }
    }

    onMouseDown(event) {
        if (event.button === 0 && this.buildMode && this.ghostMesh && this.selectedBuildItem) { // Left click
           if (this.isValidPlacement(this.ghostMesh.position, this.selectedBuildItem)) {
                this.placeItem();
           } else {
                this.player.uiManager.showTemporaryMessage("Cannot place here.");
           }
        } else if (event.button === 2 && this.buildMode) { // Right click to cancel/exit
            this.exitBuildMode();
        }
    }

    updatePreview() {
        if (!this.buildMode || !this.ghostMesh || !this.player.controls.isLocked) return; // Only update if controls locked (i.e., not in UI)

        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera); // Center of screen
        const intersects = this.raycaster.intersectObjects([...this.collidables, ...this.scene.children.filter(c => c.userData.isBuildingPart)], true); // Check existing building parts too

        let placementPosition = null;
        let canPlace = false;

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const point = intersection.point;
            const normal = intersection.face.normal.clone().transformDirection(intersection.object.matrixWorld).normalize();

            if (this.selectedBuildItem.type === 'foundation') {
                // Snap to world grid, on terrain
                if (intersection.object.userData.type !== 'building' && intersection.object.userData.type !== 'water') { // Avoid placing on existing complex structures or water
                    placementPosition = new THREE.Vector3(
                        Math.round(point.x / this.gridSize) * this.gridSize,
                        this.player.game.world.getHeightAt(Math.round(point.x / this.gridSize) * this.gridSize, Math.round(point.z / this.gridSize) * this.gridSize) + this.selectedBuildItem.size[1] / 2,
                        Math.round(point.z / this.gridSize) * this.gridSize
                    );
                }
            } else if (this.selectedBuildItem.type === 'wall') {
                // Snap to foundation edges
                if (intersection.object.userData.buildType === 'foundation') {
                    const foundationPos = intersection.object.position;
                    const foundationSize = intersection.object.geometry.parameters; // width, height, depth
                    
                    // Determine which edge of foundation is closest to intersection point and normal
                    // This logic needs to be quite robust
                    // Simplified: align to major axis based on normal
                    if (Math.abs(normal.x) > Math.abs(normal.z)) { // Side facing X
                        placementPosition = new THREE.Vector3(
                            foundationPos.x + Math.sign(normal.x) * foundationSize.width / 2,
                            foundationPos.y + foundationSize.height / 2 + this.selectedBuildItem.size[1] / 2,
                            Math.round(point.z / this.gridSize) * this.gridSize // Snap Z to grid for now
                        );
                        this.ghostMesh.rotation.y = Math.PI / 2; // Align with Z axis
                    } else { // Side facing Z
                         placementPosition = new THREE.Vector3(
                            Math.round(point.x / this.gridSize) * this.gridSize, // Snap X
                            foundationPos.y + foundationSize.height / 2 + this.selectedBuildItem.size[1] / 2,
                            foundationPos.z + Math.sign(normal.z) * foundationSize.depth / 2
                        );
                        this.ghostMesh.rotation.y = 0; // Align with X axis
                    }
                }
            } else if (this.selectedBuildItem.type === 'ceiling') {
                // Snap like foundations but at wall height, check for supporting walls
                 if (intersection.object.userData.buildType === 'wall') {
                    // Place on top of the wall
                    placementPosition = new THREE.Vector3(
                        Math.round(intersection.object.position.x / this.gridSize) * this.gridSize, // Align to grid center
                        intersection.object.position.y + intersection.object.geometry.parameters.height / 2 + this.selectedBuildItem.size[1] / 2,
                        Math.round(intersection.object.position.z / this.gridSize) * this.gridSize  // Align to grid center
                    );
                 } else if (intersection.object.userData.buildType === 'foundation') { // Or place on foundation if no walls yet (acting as floor)
                    placementPosition = new THREE.Vector3(
                        intersection.object.position.x,
                        intersection.object.position.y + intersection.object.geometry.parameters.height/2 + this.wallHeight + this.selectedBuildItem.size[1]/2, // Assume wall height above foundation
                        intersection.object.position.z
                    );
                 }
            }
            // Add 'door' snapping logic if type is 'wall_with_doorway'

            if (placementPosition) {
                this.ghostMesh.position.copy(placementPosition);
                canPlace = this.isValidPlacement(placementPosition, this.selectedBuildItem);
                this.ghostMesh.material.color.set(canPlace ? 0x00ff00 : 0xff0000); // Green if valid, red if not
            } else {
                 this.ghostMesh.material.color.set(0xff0000); // Cannot determine placement
            }

        } else {
            this.ghostMesh.material.color.set(0xff0000); // Pointing at sky or too far
        }
    }

    isValidPlacement(position, itemData) {
        // Check 1: Cost
        for (const resource in itemData.cost) {
            if (this.player.inventory.countItem(resource) < itemData.cost[resource]) {
                return false; // Not enough resources
            }
        }
        // Check 2: Collision with existing objects (except terrain for foundations)
        const ghostBox = new THREE.Box3().setFromObject(this.ghostMesh);
        for (const collidable of this.collidables) {
            if (collidable === this.player.playerCollider) continue; // Ignore player
            if (itemData.type === 'foundation' && collidable === this.player.game.world.terrainMesh) continue; // Foundations can intersect terrain
            if (collidable.userData.isBuildingPart && this.canSnapTo(itemData, collidable.userData)) continue; // Allow snapping

            const objectBox = new THREE.Box3().setFromObject(collidable);
            if (ghostBox.intersectsBox(objectBox)) {
                return false; // Overlapping
            }
        }
        // Check 3: Specific placement rules (e.g., walls need foundation)
        if (itemData.type === 'wall' || itemData.type === 'ceiling') {
            // Requires raycasting downwards or checking nearby objects for valid support
            let hasSupport = false;
            const supportCheckRay = new THREE.Raycaster(position, new THREE.Vector3(0,-1,0), 0, itemData.size[1]);
            const supports = supportCheckRay.intersectObjects(this.scene.children.filter(c => c.userData.isBuildingPart), true);
            supports.forEach(sup => {
                if (itemData.type === 'wall' && sup.object.userData.buildType === 'foundation') hasSupport = true;
                if (itemData.type === 'ceiling' && (sup.object.userData.buildType === 'wall' || sup.object.userData.buildType === 'foundation')) hasSupport = true;
            });
            if (!hasSupport) return false;
        }

        return true;
    }
    
    canSnapTo(currentItemData, targetItemData) {
        // Logic to determine if currentItem can snap to targetItem
        if (currentItemData.type === 'wall' && targetItemData.buildType === 'foundation') return true;
        if (currentItemData.type === 'ceiling' && (targetItemData.buildType === 'wall' || targetItemData.buildType === 'foundation')) return true;
        if (currentItemData.type === 'door' && targetItemData.buildType === 'wall_with_doorway') return true;
        return false;
    }

    placeItem() {
        if (!this.selectedBuildItem || !this.ghostMesh) return;

        // Deduct resources
        for (const resource in this.selectedBuildItem.cost) {
            this.player.inventory.removeItem(resource, this.selectedBuildItem.cost[resource]);
        }
        this.player.uiManager.updateInventory(); // Refresh UI

        const size = this.selectedBuildItem.size;
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Wood color
        // TODO: Use different materials/colors based on item (e.g. window part transparent)

        const newBuildingPart = new THREE.Mesh(geometry, material);
        newBuildingPart.position.copy(this.ghostMesh.position);
        newBuildingPart.rotation.copy(this.ghostMesh.rotation);
        newBuildingPart.castShadow = true;
        newBuildingPart.receiveShadow = true;
        newBuildingPart.userData = { 
            isBuildingPart: true, 
            buildType: this.selectedBuildItem.type, // 'foundation', 'wall', 'ceiling'
            name: this.selectedBuildItem.name 
        };

        this.scene.add(newBuildingPart);
        this.collidables.push(newBuildingPart); // Add to collidables for player and future building parts

        this.player.uiManager.showTemporaryMessage(`Placed ${this.selectedBuildItem.name}.`);
        this.uiManager.populateBuildMenu(this.getBuildableItemsWithCosts()); // Update build menu for resource changes
        
        // If player wants to place multiple, keep selectedBuildItem and ghostMesh active
        // For now, deselect after placement
        // this.selectedBuildItem = null;
        // this.scene.remove(this.ghostMesh);
        // this.ghostMesh.geometry.dispose();
        // this.ghostMesh.material.dispose();
        // this.ghostMesh = null;
    }

     handleKeyDown(key) { // Called from game.js
        if (key === 'escape' && this.buildMode) {
            this.exitBuildMode();
        }
    }
}