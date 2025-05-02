// --- START OF FILE BuildingSystem.js ---

class BuildingSystem {
    constructor(game) {
        this.game = game;

        // Building components from Constants
        this.buildingComponents = Constants.BUILDING.COMPONENTS;

        // List of all placed buildings in the world
        this.buildings = [];

        // Snapping distance from Constants
        this.snapDistance = Constants.BUILDING.SNAP_DISTANCE;

        // Grid size for snapping (usually foundation size) from Constants
        this.gridSize = Constants.BUILDING.GRID_SIZE;
    }

    // Get all defined building component types
    getBuildingComponents() {
        return this.buildingComponents;
    }

    // Get a specific building component definition by its ID
    getBuildingComponent(componentId) {
        return this.buildingComponents.find(comp => comp.id === componentId);
    }

    // Check if the player has enough resources in their inventory for a component
    canBuildComponent(componentId) {
        const component = this.getBuildingComponent(componentId);
        if (!component) return false;
        // Delegate the check to the inventory system
        const canAfford = this.game.inventory.checkResources(component.requirements);
        // Optional detailed log:
        // console.log(`canBuildComponent (${componentId}): ${canAfford}. Req: ${JSON.stringify(component.requirements)}. Inv Check: ${/* Log inventory counts if needed */}`);
        return canAfford;
    }

    // Create a visual preview mesh for a building component
    createBuildingPreview(componentId) {
        const component = this.getBuildingComponent(componentId);
        if (!component) {
            console.error(`Building component not found: ${componentId}`);
            return null;
        }

        // --- FIXED: Use AssetLoader and Babylon Materials ---
        // Get base mesh/node from AssetLoader
        let previewMeshBase = this.game.assetLoader.getModel(componentId);
        if (!previewMeshBase || !(previewMeshBase instanceof BABYLON.Node)) {
            console.error(`Preview geometry for ${componentId} not found or invalid! Using fallback.`);
            // Fallback box using Babylon
            previewMeshBase = BABYLON.MeshBuilder.CreateBox(`fallback_preview_${componentId}`, { size: 1 }, this.game.scene);
        }

        // Create a unique material instance for the preview
        const matName = "buildPreviewMat_" + componentId + Date.now(); // Ensure unique name
        const previewMat = new BABYLON.PBRMaterial(matName, this.game.scene); // Use PBR for better compatibility with standard materials
        previewMat.albedoColor = new BABYLON.Color3(0, 1, 0); // Default green (valid placement)
        previewMat.alpha = 0.6; // Make it see-through
        previewMat.metallic = 0.1;
        previewMat.roughness = 0.8;
        previewMat.zOffset = -2; // Help prevent z-fighting
        previewMat.disableLighting = false; // Ensure it's affected by light somewhat

        // Apply material to all meshes in the hierarchy
        const applyMaterial = (node) => {
            if (node instanceof BABYLON.Mesh) {
                node.material = previewMat;
                node.isPickable = false; // Prevent interaction with preview
            }
        };
        previewMeshBase.getChildMeshes(false).forEach(applyMaterial);
        if (previewMeshBase instanceof BABYLON.Mesh) { applyMaterial(previewMeshBase); }

        return previewMeshBase; // Return the root node (Mesh or TransformNode)
        // --- END FIX ---
    }

    // Check if a given position is valid for placing a specific component
    isValidBuildPosition(position, componentId, rotation) {
        const component = this.getBuildingComponent(componentId);
        if (!component || !position) return false;

        const terrainHeight = this.game.terrain.getHeightAt(position.x, position.z);
        const waterLevel = this.game.terrain.waterLevel;

        // Use a small tolerance for placement checks near water level
        if (position.y < waterLevel + 0.05) {
            // console.log("isValidBuildPosition: FAILED - Position underwater"); // LOG
            return false;
        }

        // --- FIXED: Bounding Box Check using Babylon ---
        const previewSize = this.getComponentSize(componentId); // Use Babylon-compatible size getter
        const previewCenter = position.clone(); // Babylon vectors clone directly
        // Adjust center based on component geometry origin if needed (BoxBuilder creates centered boxes)
        // No adjustment needed for BoxBuilder created previews if position is intended center.

        // Create a temporary bounding box for the preview position/size
        const previewBounds = new BABYLON.BoundingBox(
            previewCenter.subtract(previewSize.scale(0.5)), // min = center - size/2
            previewCenter.add(previewSize.scale(0.5))     // max = center + size/2
        );

        for (const building of this.buildings) {
            if (!building.meshes || !building.meshes[0]) continue;
            const existingMesh = building.meshes[0];
            // Ensure world matrix is computed for accurate bounding info
            existingMesh.computeWorldMatrix(true);
            const existingBounds = existingMesh.getBoundingInfo().boundingBox; // Get world bounding box

            if (previewBounds.intersects(existingBounds)) { // Use Babylon's intersects
                // Check how much they intersect - more complex with Babylon BoundingBox
                // For simplicity, allow minor overlap if snapping, disallow otherwise
                // A simple check: if intersection is not just touching faces
                const intersectionMin = BABYLON.Vector3.Maximize(previewBounds.minimumWorld, existingBounds.minimumWorld);
                const intersectionMax = BABYLON.Vector3.Minimize(previewBounds.maximumWorld, existingBounds.maximumWorld);
                if (intersectionMax.x - intersectionMin.x > 0.1 ||
                    intersectionMax.y - intersectionMin.y > 0.1 ||
                    intersectionMax.z - intersectionMin.z > 0.1) {
                    // console.log("isValidBuildPosition: FAILED - Intersection with existing building", building.id); // LOG
                    return false;
                }
            }
        }
        // --- END FIX ---

        // --- Component-specific validation ---
        switch (componentId) {
            case 'foundation':
                // Foundation shouldn't be too high off the ground or too embedded
                 // Adjust check based on position being center vs bottom
                 if (terrainHeight === undefined || Math.abs(position.y - (previewSize.y / 2) - terrainHeight) > 0.6) { // Assuming position is center
                    // console.log(`isValidBuildPosition: FAILED - Foundation height invalid (Pos Y: ${position.y.toFixed(2)}, Terrain H: ${terrainHeight?.toFixed(2)}, Size Y: ${previewSize.y.toFixed(2)})`); // LOG
                    return false;
                }
                // Check slope (more robust check)
                const halfGrid = this.gridSize / 2;
                const corners = [
                    this.game.terrain.getHeightAt(position.x - halfGrid, position.z - halfGrid),
                    this.game.terrain.getHeightAt(position.x + halfGrid, position.z - halfGrid),
                    this.game.terrain.getHeightAt(position.x - halfGrid, position.z + halfGrid),
                    this.game.terrain.getHeightAt(position.x + halfGrid, position.z + halfGrid)
                ];
                 if (corners.some(h => h === undefined)) { /* console.log("isValidBuildPosition: FAILED - Corner height invalid"); */ return false; } // LOG
                 const minH = Math.min(...corners);
                 const maxH = Math.max(...corners);
                 if (maxH - minH > 1.0) { /* console.log("isValidBuildPosition: FAILED - Slope too steep"); */ return false; } // LOG

                return true; // Passed foundation checks

            case 'wall':
            case 'window':
                 // Walls need valid support below or valid adjacent connection
                 // --- FIXED: Use Babylon Vectors ---
                 const supportBelow = this.findSnapTarget(position.clone(), ['foundation', 'ceiling', 'wall', 'window'], 'below', rotation, componentId);
                 // --- END FIX ---
                 // Adjacent check might be less reliable depending on snap point generation
                 // const adjacentSupport = this.findSnapTarget(position, ['wall', 'window'], 'adjacent', rotation, componentId);
                 // Prioritize support below
                 if (!supportBelow) {
                     // console.log("isValidBuildPosition: FAILED - Wall has no support below"); // LOG
                     return false;
                 }
                 return true; // Passed wall checks

            case 'ceiling':
                 // Ceiling needs valid support below (from walls/windows) or adjacent ceiling
                 // --- FIXED: Use Babylon Vectors ---
                 const wallSupport = this.findSnapTarget(position.clone(), ['wall', 'window'], 'below', rotation, componentId);
                 // --- END FIX ---
                 // Adjacent ceiling check might be less reliable
                 // const adjacentCeiling = this.findSnapTarget(position, ['ceiling'], 'adjacent', rotation, componentId);
                 if (!wallSupport) {
                     // console.log("isValidBuildPosition: FAILED - Ceiling has no wall support"); // LOG
                     return false;
                 }
                 return true; // Passed ceiling checks

            default:
                // console.warn(`isValidBuildPosition: Unknown componentId ${componentId}`); // LOG
                return false; // Unknown component type
        }
    }

     // Find potential snapping targets near a position
     // relation: 'any', 'below', 'adjacent'
     // targetRotation/targetComponentId: Info about the piece being placed
    findSnapTarget(position, allowedTargetTypes, relation = 'any', targetRotation = 0, targetComponentId = null) {
        let bestTarget = null;
        let minDistanceSq = this.snapDistance * this.snapDistance;

        for (const building of this.buildings) {
            // Filter by allowed type
            if (!allowedTargetTypes.includes(building.buildingType)) continue;
            if (!building.meshes || !building.meshes[0]) continue; // Skip if mesh missing

            // --- FIXED: Use Babylon Vectors ---
            // Generate potential snap points ON the existing building where the NEW piece might attach
            const snapPoints = this.generateSnapPoints(building, targetComponentId, targetRotation); // Returns Babylon Vectors

            // Find the closest valid snap point on this building
            for (const point of snapPoints) {
                const distSq = BABYLON.Vector3.DistanceSquared(point, position); // Use Babylon DistanceSquared

                if (distSq < minDistanceSq) {
                    // Basic proximity check passed, now check relation if specified
                    let relationMatch = false;
                    if (relation === 'any') {
                        relationMatch = true;
                    } else if (relation === 'below') {
                        // Check if the snap point 'point' is roughly below the placement 'position'
                        const yDifference = position.y - point.y;
                        const xzDistSq = (point.x - position.x)**2 + (point.z - position.z)**2;
                        // Expect positive yDifference (position is above point)
                        // Check if XZ distance is small and Y difference is correct
                         let expectedYDiff = 0;
                         const existingSize = this.getComponentSize(building.buildingType);
                         const targetSize = this.getComponentSize(targetComponentId);
                         if (targetComponentId === 'wall' || targetComponentId === 'window') expectedYDiff = targetSize.y / 2 + existingSize.y / 2; // Wall on foundation/ceiling/wall top
                         else if (targetComponentId === 'ceiling') expectedYDiff = targetSize.y / 2 + existingSize.y / 2; // Ceiling on wall top

                         if (xzDistSq < 0.5*0.5 && Math.abs(yDifference - expectedYDiff) < 0.2) { // Allow small tolerance
                             relationMatch = true;
                         }

                    } else if (relation === 'adjacent') {
                        // Check if XZ distance matches grid size and Y is similar
                        const yDifference = Math.abs(position.y - point.y);
                        const xzDist = Math.sqrt((point.x - position.x)**2 + (point.z - position.z)**2);
                        if (yDifference < 0.5 && Math.abs(xzDist - this.gridSize) < 0.5) { // Allow tolerance
                            // TODO: Add stricter alignment check based on rotations?
                            relationMatch = true;
                        }
                    }

                    if (relationMatch) {
                         minDistanceSq = distSq;
                         bestTarget = building; // Return the building it snaps to
                    }
                }
            }
            // --- END FIX ---
        }
        return bestTarget; // Return the building object found, or null
    }

    // Helper to get approximate size of a component based on its geometry
    getComponentSize(componentId) {
        // --- FIXED: Use Babylon Bounding Info ---
        const modelNode = this.game.assetLoader.getModel(componentId); // Returns a BABYLON.Node
        if (!modelNode) return new BABYLON.Vector3(1, 1, 1); // Fallback

        let totalBounds = null;

        // Function to merge bounding boxes
        const mergeBounds = (node) => {
            if (node instanceof BABYLON.AbstractMesh) {
                node.computeWorldMatrix(true); // Ensure world matrix is up-to-date
                const bounds = node.getBoundingInfo().boundingBox;
                if (bounds) {
                     if (!totalBounds) {
                         totalBounds = new BABYLON.BoundingBox(bounds.minimumWorld, bounds.maximumWorld);
                     } else {
                         totalBounds.reConstruct(
                            BABYLON.Vector3.Minimize(totalBounds.minimumWorld, bounds.minimumWorld),
                            BABYLON.Vector3.Maximize(totalBounds.maximumWorld, bounds.maximumWorld)
                         );
                     }
                }
            }
        };

        // Get bounds from all child meshes
        modelNode.getChildMeshes(false).forEach(mergeBounds);
        // Include the root node itself if it's a mesh
        if (modelNode instanceof BABYLON.AbstractMesh) { mergeBounds(modelNode); }


        if (totalBounds) {
             // size = max - min
            return totalBounds.maximumWorld.subtract(totalBounds.minimumWorld);
        } else {
            return new BABYLON.Vector3(1, 1, 1); // Fallback if no bounds found
        }
        // --- END FIX ---
    }


    // Check if there's a nearby building component (less specific than findSnapTarget)
    hasNearbyBuilding(position, type, distance) {
        const targetTypes = Array.isArray(type) ? type : [type];
        // --- FIXED: Use Babylon Vector ---
        return !!this.findSnapTarget(position.clone(), targetTypes, 'any'); // Use findSnapTarget for proximity check
        // --- END FIX ---
    }

    // Find the most likely snapping point based on raycast hit and nearby buildings
    findSnappingPoint(position, componentId, rotation) {
        // --- FIXED: Use Babylon Vectors ---
        const posVec = position instanceof BABYLON.Vector3 ? position : new BABYLON.Vector3(position.x, position.y, position.z);

        // Special grid snapping for foundations
        if (componentId === 'foundation') {
            const snappedX = Math.round(posVec.x / this.gridSize) * this.gridSize;
            const snappedZ = Math.round(posVec.z / this.gridSize) * this.gridSize;
            let snappedY = posVec.y; // Start with raycast hit Y

            const terrainHeight = this.game.terrain.getHeightAt(snappedX, snappedZ);
            if (terrainHeight !== undefined) {
                 snappedY = Math.max(terrainHeight, this.game.terrain.waterLevel + 0.05);
                 snappedY += this.getComponentSize('foundation').y / 2;
            } else {
                 snappedY += this.getComponentSize('foundation').y / 2; // Adjust based on size even if terrain fails
            }

            return new BABYLON.Vector3(snappedX, snappedY, snappedZ);
        }

        // For other components, find the best snap point on existing structures
        let closestSnapPoint = posVec.clone(); // Default to original position if no snap
        let minDistanceSq = this.snapDistance * this.snapDistance;

        for (const building of this.buildings) {
            if (!building.meshes || !building.meshes[0]) continue; // Skip buildings without mesh

            let isValidTarget = false;
            if ((componentId === 'wall' || componentId === 'window') && ['foundation', 'wall', 'window', 'ceiling'].includes(building.buildingType)) isValidTarget = true;
            if (componentId === 'ceiling' && ['wall', 'window', 'ceiling'].includes(building.buildingType)) isValidTarget = true;

            if (!isValidTarget) continue;

            const snapPoints = this.generateSnapPoints(building, componentId, rotation); // Returns Babylon Vectors

            for (const point of snapPoints) {
                const distSq = BABYLON.Vector3.DistanceSquared(point, posVec); // Babylon distance check
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestSnapPoint = point.clone(); // Found a better snap point
                }
            }
        }
        return closestSnapPoint; // Return the best snap point found, or original position
        // --- END FIX ---
    }

    // Generate potential snap points ON an existing building structure
    // where a NEW component (targetComponentId) could attach.
    generateSnapPoints(existingBuilding, targetComponentId, targetRotation) {
        const points = [];
        // --- FIXED: Use Babylon Vectors ---
        const pos = new BABYLON.Vector3(existingBuilding.position.x, existingBuilding.position.y, existingBuilding.position.z); // Center position of the existing building mesh
        const bldgRot = existingBuilding.rotation || 0; // Rotation of existing building
        const bldgType = existingBuilding.buildingType;
        const bldgSize = this.getComponentSize(bldgType); // Size of the existing building part
        const targetSize = this.getComponentSize(targetComponentId); // Size of the NEW part being placed

        const halfGrid = this.gridSize / 2; // Assuming gridSize is relevant edge length
        const wallH = Constants.BUILDING.WALL_HEIGHT; // Use height from constants

        // Helper to create a point relative to the existing building's center and rotation
        const addPoint = (offsetX, offsetY, offsetZ) => {
             const pointOffset = new BABYLON.Vector3(offsetX, offsetY, offsetZ);
             // Rotate offset around Y axis using Quaternion rotation
             const rotationQuaternion = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, bldgRot);
             const rotatedOffset = pointOffset.rotateByQuaternionToRef(rotationQuaternion, new BABYLON.Vector3());
             const finalPoint = pos.add(rotatedOffset); // Add offset to building's center position
             points.push(finalPoint);
        };
        // --- END FIX ---

        switch (bldgType) {
            case 'foundation':
                 if (targetComponentId === 'wall' || targetComponentId === 'window') {
                     // Place walls on top edges of foundation
                     const wallY = bldgSize.y / 2 + targetSize.y / 2; // Foundation top + half wall height
                     addPoint(halfGrid, wallY, 0);  // +X Edge Center
                     addPoint(-halfGrid, wallY, 0); // -X Edge Center
                     addPoint(0, wallY, halfGrid);  // +Z Edge Center
                     addPoint(0, wallY, -halfGrid); // -Z Edge Center
                 }
                 break;

            case 'wall':
            case 'window':
                 if (targetComponentId === 'ceiling') {
                     // Place ceiling centered on top of wall
                     const ceilY = bldgSize.y / 2 + targetSize.y / 2; // Wall top + half ceiling height
                     addPoint(0, ceilY, 0);
                 } else if (targetComponentId === 'wall' || targetComponentId === 'window') {
                      // Place adjacent walls at the ends (assuming walls align with X-axis in local space)
                      const sideY = 0; // Walls are vertically centered relative to their own origin
                      addPoint(halfGrid, sideY, 0); // +Local X end
                      addPoint(-halfGrid, sideY, 0); // -Local X end
                      // Place walls on TOP of this wall
                      const topY = bldgSize.y / 2 + targetSize.y / 2;
                      addPoint(0, topY, 0); // Center Top
                 }
                 break;

            case 'ceiling':
                 if (targetComponentId === 'wall' || targetComponentId === 'window') {
                     // Place walls on edges below ceiling
                     const wallY = -bldgSize.y / 2 - targetSize.y / 2; // Ceiling bottom - half wall height
                     addPoint(halfGrid, wallY, 0);  // +X Edge Center
                     addPoint(-halfGrid, wallY, 0); // -X Edge Center
                     addPoint(0, wallY, halfGrid);  // +Z Edge Center
                     addPoint(0, wallY, -halfGrid); // -Z Edge Center
                 } else if (targetComponentId === 'ceiling') {
                      // Place adjacent ceilings
                      const ceilY = 0; // Same level
                      addPoint(this.gridSize, ceilY, 0);  // +X Adjacent Center
                      addPoint(-this.gridSize, ceilY, 0); // -X Adjacent Center
                      addPoint(0, ceilY, this.gridSize);  // +Z Adjacent Center
                      addPoint(0, ceilY, -this.gridSize); // -Z Adjacent Center
                 }
                 break;
        }

        return points;
    }


    // Build a component at the specified position
    buildComponent(componentId, position, rotation) {
        // console.log(`Attempting to build ${componentId} at initial pos:`, position); // DEBUG

        const component = this.getComponentComponent(componentId); // Typo fix
        if (!component) { console.error(`Build failed: Component def not found: ${componentId}`); return false; }

        // --- FIXED: Use Babylon Vectors ---
        // 1. Find Snapping Point
        const snapPos = this.findSnappingPoint(position, componentId, rotation); // Returns Babylon Vector
        // console.log(`Calculated snap position:`, snapPos); // DEBUG

        // 2. Validate Snapped Position
        if (!this.isValidBuildPosition(snapPos, componentId, rotation)) { // Accepts Babylon Vector
            // console.log(`Build failed: Invalid snapped position for ${componentId}`);
            this.game.uiManager?.showNotification("Cannot build there!", 2000);
            return false;
        }
        // --- END FIX ---

        // 3. Check Resources (Final Check)
        if (!this.canBuildComponent(componentId)) {
            // console.log(`Build failed: Not enough resources for ${component.name}`);
            this.game.uiManager?.showNotification("Not enough resources!", 2000);
            return false;
        }

        // 4. Consume Resources
        // console.log('Consuming resources:', component.requirements);
        let consumptionSuccess = true;
        component.requirements.forEach(req => {
            if (!this.game.inventory.removeItem(req.id, req.amount)) {
                console.error(`Build failed: Failed to consume ${req.amount} of ${req.id}! Inventory inconsistency?`);
                consumptionSuccess = false;
            }
        });
        if (!consumptionSuccess) {
            // Attempting to refund is complicated; better to prevent reaching here if checkResources was accurate.
            console.error("Build failed due to resource consumption error.");
            return false;
        }
        // console.log('Resources consumed.');

        // --- FIXED: Create Babylon Mesh ---
        // 5. Create Mesh
        let buildingMesh = this.game.assetLoader.getModel(componentId); // Get model node
        if (!buildingMesh || !(buildingMesh instanceof BABYLON.Node)) {
            console.error(`Build failed: Geometry not found or invalid for ${componentId}`);
            /* TODO: Refund resources? */ return false;
        }

        // Clone if it's from the asset pool (to avoid modifying the original)
        // AssetLoader's getModel should ideally return a clone already for GLBs. For primitives, it creates new ones.
        // If AssetLoader *doesn't* clone GLBs, clone here: buildingMesh = buildingMesh.clone();

        const material = new BABYLON.StandardMaterial(componentId + "_mat", this.game.scene);
        material.diffuseTexture = this.game.assetLoader.getTexture('wood'); // Assuming wood for now
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        // Apply material to all child meshes if it's a complex model
        const applyMat = (node) => { if(node instanceof BABYLON.Mesh) node.material = material; };
        buildingMesh.getChildMeshes(false).forEach(applyMat);
        if(buildingMesh instanceof BABYLON.Mesh) applyMat(buildingMesh);

        buildingMesh.position = snapPos; // Set Babylon Vector position
        buildingMesh.rotation.y = rotation || 0;

        // Enable collisions for placed buildings
        buildingMesh.checkCollisions = true;
        buildingMesh.getChildMeshes(false).forEach(m => m.checkCollisions = true); // Enable on children too

        // Shadows
        const applyShadows = (node) => {
            if (node instanceof BABYLON.Mesh) {
                 node.receiveShadows = true;
                 if (this.game.shadowGenerator) {
                     this.game.shadowGenerator.addShadowCaster(node, true); // Cast shadows too
                 }
            }
        };
        applyShadows(buildingMesh);
        buildingMesh.getChildMeshes(false).forEach(applyShadows);


        // 6. Add to Scene (Babylon nodes are typically added automatically by builders/loaders)
        // If the mesh wasn't added by AssetLoader, add it explicitly:
        // if (!buildingMesh.parent) this.game.scene.addMesh(buildingMesh); // Or addNode if it's a TransformNode

        // --- END FIX ---

        // 7. Create Building Data Object
        const building = {
            id: `building_${Date.now()}_${this.buildings.length}`,
            type: 'building', // Consistent type for category/destruction?
            buildingType: componentId, // Specific type
            position: { x: snapPos.x, y: snapPos.y, z: snapPos.z }, // Store plain object for saving
            rotation: rotation || 0,
            meshes: [buildingMesh], // Store reference to the Babylon Node
            health: component.health || 100, // Default health if not specified
            maxHealth: component.health || 100,
            resources: component.resources || {} // Resources dropped on destruction
        };

        // Add metadata to mesh for lookups (e.g., interaction, destruction)
        buildingMesh.metadata = {
            buildingId: building.id,
            resourceId: building.id, // Also treat as resource for harvesting/destruction
            isBuildableSurface: true // Flag for placing things on top?
        };
        buildingMesh.getChildMeshes(false).forEach(m => m.metadata = buildingMesh.metadata); // Apply to children too


        // 8. Add to Internal List & Register if Destructible
        this.buildings.push(building);
        if (component.health > 0) {
             this.game.resourceManager.registerResource(building); // RM needs to handle 'building' type
             console.log(`Registered destructible building ${building.id} with ResourceManager.`);
        }

        console.log(`Successfully built ${component.name} at`, snapPos);
        this.game.uiManager?.buildingUI?.updateBuildMenu(); // Update UI resource counts
        this.game.uiManager?.updateCraftingMenu();
        return true;
    }


    // Remove a building (e.g., by player action or integrity check)
    removeBuilding(buildingId) {
        const index = this.buildings.findIndex(b => b.id === buildingId);
        if (index === -1) {
            // console.warn(`Building not found for removal: ${buildingId}`);
            return false;
        }
        const building = this.buildings[index];

        // Remove from resource manager FIRST (handles mesh removal/disposal)
        this.game.resourceManager.removeResource(buildingId); // RM needs to handle 'building' type

        // Remove from internal list AFTER ResourceManager handled disposal
        this.buildings.splice(index, 1);

        // console.log(`Removed building: ${buildingId}`);

        // Trigger integrity check after removal as structure might change
        // Debounce this or call it less frequently to avoid performance hits
        // requestAnimationFrame(() => this.checkBuildingIntegrity());

        return true;
    }

    // Get all currently placed building objects
    getAllBuildings() {
        return this.buildings;
    }

    // Get placed buildings of a specific type (e.g., 'wall')
    getBuildingsByType(type) {
        return this.buildings.filter(b => b.buildingType === type);
    }

    // Check structural integrity (e.g., remove floating pieces)
    checkBuildingIntegrity() {
        // More robust check needed - BFS/DFS from foundations?
        // Simple check for now: Remove floating non-foundations
        const buildingsToRemove = [];
        let changed = true; // Keep checking until no changes occur in a pass

         while(changed) {
             changed = false;
             const currentBuildings = [...this.buildings]; // Work on a snapshot
             const stableSet = new Set(currentBuildings.filter(b => b.buildingType === 'foundation').map(b => b.id)); // Start with foundations as stable

             let newlyStable = true;
             while (newlyStable) {
                 newlyStable = false;
                 for (const building of currentBuildings) {
                     if (stableSet.has(building.id)) continue; // Already known stable

                     let isSupported = false;
                     switch (building.buildingType) {
                         case 'wall': case 'window':
                              // --- FIXED: Use Babylon Vectors ---
                              if (this.findSupportStructure(building, ['foundation', 'ceiling', 'wall', 'window'], 'below', stableSet) ||
                                  this.findSupportStructure(building, ['wall', 'window'], 'adjacent', stableSet)) {
                                  isSupported = true;
                              }
                              // --- END FIX ---
                              break;
                         case 'ceiling':
                              // --- FIXED: Use Babylon Vectors ---
                              if (this.findSupportStructure(building, ['wall', 'window'], 'below', stableSet) ||
                                  this.findSupportStructure(building, ['ceiling'], 'adjacent', stableSet)) {
                                  isSupported = true;
                              }
                              // --- END FIX ---
                              break;
                         default: // Foundations already handled
                              isSupported = true; break;
                     }

                     if (isSupported) {
                         stableSet.add(building.id);
                         newlyStable = true; // Found a newly stable piece, might stabilize others
                     }
                 }
             }

             // Identify buildings not in the stable set
             currentBuildings.forEach(b => {
                 if (b.buildingType !== 'foundation' && !stableSet.has(b.id)) {
                      if (!buildingsToRemove.includes(b.id)) {
                          buildingsToRemove.push(b.id);
                          changed = true; // Mark for removal, potentially need another pass
                      }
                 }
             });

             // Remove unstable buildings found in this pass
             if (changed) {
                 console.log("Integrity Check: Removing unstable buildings:", buildingsToRemove);
                 buildingsToRemove.forEach(id => this.removeBuilding(id)); // removeBuilding handles scene/RM removal
                 buildingsToRemove.length = 0; // Clear for potential next pass (though loop condition handles it)
             }
         }
    }

    // Helper for integrity check: Find if a building is supported by a stable structure
    findSupportStructure(building, allowedSupportTypes, relation, stableSet) {
        // --- FIXED: Use Babylon Vectors ---
        const checkPosition = new BABYLON.Vector3(building.position.x, building.position.y, building.position.z);

        for (const potentialSupport of this.buildings) {
            // Check if the potential support is stable and of the allowed type
            if (!stableSet.has(potentialSupport.id) || !allowedSupportTypes.includes(potentialSupport.buildingType)) {
                continue;
            }
            // Convert support position to Vector3 for distance check
            const supportPosVec = new BABYLON.Vector3(potentialSupport.position.x, potentialSupport.position.y, potentialSupport.position.z);

            // Check proximity and relationship (Simplified)
            const distSq = BABYLON.Vector3.DistanceSquared(checkPosition, supportPosVec);
            const maxDist = (this.snapDistance + this.gridSize) * (this.snapDistance + this.gridSize); // Generous check radius

            if (distSq < maxDist) {
                // Basic proximity is enough for this simplified check
                // A more accurate check would verify relative positions based on 'relation'
                return true; // Found a stable support nearby
            }
        }
        // --- END FIX ---
        return false; // No stable support found
    }


    // Update method called each frame (optional)
    update(deltaTime) {
        // Periodically check building integrity (e.g., every few seconds)
        // if ((this.game.elapsedTime || 0) % 5 < deltaTime) { // Check roughly every 5 seconds
        //     this.checkBuildingIntegrity();
        // }
    }
}

// Fix typo in buildComponent
BuildingSystem.prototype.getBuildingComponentComponent = BuildingSystem.prototype.getBuildingComponent;

// --- END OF FILE BuildingSystem.js ---