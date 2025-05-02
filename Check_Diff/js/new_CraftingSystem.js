// --- START OF FILE CraftingSystem.js ---

class CraftingSystem {
    constructor(game) {
        this.game = game;

        // Recipe categories
        this.recipeCategories = {
            basic: Constants.ITEMS.CRAFTABLES,
            workbench: Constants.ITEMS.WORKBENCH_CRAFTABLES,
            forge: Constants.ITEMS.FORGE_CRAFTABLES
        };

        // Crafting station being used (null for basic crafting)
        this.currentStation = null;
    }

    // Get recipes for a specific category
    getRecipes(category = 'basic') {
        return this.recipeCategories[category] || [];
    }

    // Check if a recipe can be crafted
    canCraftRecipe(recipe) {
        // Check if player has required resources
        return this.game.inventory.checkResources(recipe.requirements);
    }

    // Get craftable recipes based on current station and available resources
    getCraftableRecipes(stationType = 'basic') {
        const recipes = this.getRecipes(stationType);
        return recipes.filter(recipe => this.canCraftRecipe(recipe));
    }

    // Craft an item
    craftItem(itemId, quantity = 1, stationType = 'basic') {
        // Find the recipe
        const recipes = this.getRecipes(stationType);
        const recipe = recipes.find(r => r.id === itemId);

        if (!recipe) {
            console.error(`Recipe not found for item: ${itemId}`);
            return false;
        }

        // Check if player has required resources
        const hasResources = this.game.inventory.checkResources(recipe.requirements);

        if (!hasResources) {
            console.log(`Not enough resources to craft ${recipe.name}`);
            this.game.uiManager.showNotification(`Not enough resources to craft ${recipe.name}`);
            return false;
        }

        // Consume resources
        recipe.requirements.forEach(req => {
            this.game.inventory.removeItem(req.id, req.amount * quantity);
        });

        // Add crafted item to inventory
        const added = this.game.inventory.addItem(itemId, quantity);

        if (added) {
            console.log(`Crafted ${quantity} ${recipe.name}`);
            this.game.uiManager.showNotification(`Crafted ${quantity} ${recipe.name}`);

            // Play crafting sound if available
            // this.game.audio.playSfx('craft');
        } else {
            // If could not add to inventory (full), refund resources
            recipe.requirements.forEach(req => {
                this.game.inventory.addItem(req.id, req.amount * quantity);
            });

            console.log("Inventory full! Could not craft item.");
            this.game.uiManager.showNotification("Inventory full! Could not craft item.");
            return false;
        }

        return true;
    }

    // Set current crafting station
    setCraftingStation(stationType) {
        this.currentStation = stationType;
    }

    // Craft an item at the current station
    craftAtCurrentStation(itemId, quantity = 1) {
        const stationType = this.currentStation || 'basic';
        return this.craftItem(itemId, quantity, stationType);
    }

    // Get requirements for a specific recipe
    getRecipeRequirements(itemId, stationType = 'basic') {
        const recipes = this.getRecipes(stationType);
        const recipe = recipes.find(r => r.id === itemId);

        if (!recipe) {
            return [];
        }

        return recipe.requirements || [];
    }

    // Check if player has a specific crafting station
    hasStation(stationType) {
        // For basic crafting, always return true
        if (stationType === 'basic') {
            return true;
        }

        // Check if player has built this station
        const stations = this.game.resourceManager.resources.crafting;
        return stations.some(station => station.type === stationType);
    }

    // Find the nearest crafting station of a type
    findNearestStation(stationType) {
        if (stationType === 'basic') {
            return { position: this.game.playerController.position };
        }

        const stations = this.game.resourceManager.resources.crafting.filter(
            station => station.type === stationType
        );

        if (stations.length === 0) {
            return null;
        }

        // Find the closest one
        const playerPos = this.game.playerController.position;

        let nearest = null;
        let minDistance = Infinity;

        stations.forEach(station => {
            const distance = Utils.distance(
                playerPos.x, playerPos.z,
                station.position.x, station.position.z
            );

            if (distance < minDistance) {
                nearest = station;
                minDistance = distance;
            }
        });

        return nearest;
    }

    // Check if player is near a crafting station
    isNearStation(stationType) {
        if (stationType === 'basic') {
            return true; // Basic crafting can be done anywhere
        }

        const nearestStation = this.findNearestStation(stationType);

        if (!nearestStation) {
            return false;
        }

        // Check if player is within range
        const playerPos = this.game.playerController.position;
        const distance = Utils.distance(
            playerPos.x, playerPos.z,
            nearestStation.position.x, nearestStation.position.z
        );

        return distance <= Constants.PLAYER.INTERACTION_RANGE;
    }

    // Place a crafted station in the world
    placeStation(stationType, position) {
        // --- FIXED: Use Babylon.js MeshBuilder and Materials ---
        let stationMesh = null;
        const scene = this.game.scene;
        let stationMaterial = null; // Declare outside switch

        try {
            switch (stationType) {
                case 'workbench':
                    stationMesh = BABYLON.MeshBuilder.CreateBox(stationType, { width: 1.5, height: 0.8, depth: 1 }, scene);
                    stationMaterial = new BABYLON.StandardMaterial("workbenchMat", scene);
                    stationMaterial.diffuseTexture = this.game.assetLoader.getTexture('wood');
                    stationMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                    break;

                case 'forge':
                    stationMesh = BABYLON.MeshBuilder.CreateCylinder(stationType, { height: 0.8, diameterTop: 0.7, diameterBottom: 1, tessellation: 8 }, scene);
                    stationMaterial = new BABYLON.StandardMaterial("forgeMat", scene);
                    stationMaterial.diffuseTexture = this.game.assetLoader.getTexture('stone');
                    stationMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                    break;

                case 'campfire':
                    stationMesh = BABYLON.MeshBuilder.CreateCylinder(stationType, { height: 0.3, diameterTop: 0.5, diameterBottom: 0.8, tessellation: 8 }, scene);
                    stationMaterial = new BABYLON.StandardMaterial("campfireMat", scene);
                    stationMaterial.diffuseTexture = this.game.assetLoader.getTexture('stone');
                    stationMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                    break;

                default:
                    console.error(`Unknown station type: ${stationType}`);
                    return false;
            }

            if (stationMesh && stationMaterial) {
                stationMesh.material = stationMaterial;
                stationMesh.position = position; // Assumes position is already a BABYLON.Vector3
                stationMesh.checkCollisions = true; // Enable collisions for placed stations
                stationMesh.receiveShadows = true;
                if (this.game.shadowGenerator) {
                    this.game.shadowGenerator.getShadowMap().renderList.push(stationMesh);
                }

                // Add metadata for interaction
                stationMesh.metadata = {
                    stationType: stationType,
                    resourceId: `${stationType}_${Date.now()}` // Use this ID for RM registration
                };

            } else if (!stationMesh) {
                 console.error(`Failed to create mesh for station type: ${stationType}`);
                 return false;
            }

        } catch (error) {
            console.error(`Error creating station mesh '${stationType}':`, error);
            return false;
        }
        // --- END FIX ---


        // Create station object
        const station = {
            id: stationMesh.metadata.resourceId, // Use the generated ID
            type: stationType,
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            meshes: [stationMesh], // Store Babylon mesh
            health: 100, // Stations can potentially be destroyed
            maxHealth: 100,
            isPlaceable: true // Add flag if needed
        };

        // Register with resource manager
        this.game.resourceManager.registerResource(station);

        console.log(`Placed ${stationType} at`, position);
        return true;
    }
}
// --- END OF FILE CraftingSystem.js ---