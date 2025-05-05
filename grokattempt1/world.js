function initWorld(scene) {
    try {
        console.log("Generating height map...");
        let heightMapURL;
        try {
            // Handle potential errors with height map generation
            heightMapURL = window.getHeightMapDataURL();
            console.log("Height map URL generated successfully");
        } catch (e) {
            console.error("Failed to generate height map:", e);
            // Fallback to flat ground
            createFlatGround(scene);
            // Continue with other world objects
            createWorldObjects(scene);
            return;
        }

        // Terrain
        console.log("Creating terrain...");
        const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", heightMapURL, {
            width: 1000,
            height: 1000,
            subdivisions: 100,
            minHeight: 0,
            maxHeight: 50,
            onReady: () => {
                console.log("Terrain loaded successfully");
                // Add metadata to ground for building system
                ground.metadata = { type: "ground" };
            },
            updatable: false
        }, scene);
        
        ground.checkCollisions = true;
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
        ground.material = groundMaterial;
        
        // Create the rest of the world objects
        createWorldObjects(scene);

    } catch (e) {
        console.error("Error in initWorld:", e);
        // Fallback to safe initialization
        createFlatGround(scene);
        createWorldObjects(scene);
    }
}

// Helper functions for world creation
function createFlatGround(scene) {
    console.log("Using fallback flat ground...");
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
    ground.checkCollisions = true;
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
    ground.material = groundMaterial;
    ground.metadata = { type: "ground" };
}

function createWorldObjects(scene) {
    // Water
    console.log("Creating water...");
    const water = BABYLON.MeshBuilder.CreateGround("water", { width: 1000, height: 1000 }, scene);
    water.position.y = 2;
    const waterMaterial = new BABYLON.StandardMaterial("waterMat", scene);
    waterMaterial.diffuseColor = new BABYLON.Color3(0, 0.3, 0.8);
    waterMaterial.alpha = 0.6;
    water.material = waterMaterial;

    // Trees
    console.log("Creating trees...");
    for (let i = 0; i < 100; i++) {
        try {
            const treeHeight = 5 + Math.random() * 5;
            const treeWidth = 2 + Math.random() * 1;
            
            // Create tree trunk
            const tree = BABYLON.MeshBuilder.CreateCylinder("tree" + i, { 
                height: treeHeight,
                diameter: treeWidth
            }, scene);
            
            // Position avoiding water level
            const posX = Math.random() * 900 - 450;
            const posZ = Math.random() * 900 - 450;
            let posY = 2.5; // Default height
            
            // Cast ray to find ground height
            const startVec = new BABYLON.Vector3(posX, 100, posZ);
            const direction = new BABYLON.Vector3(0, -1, 0);
            const ray = new BABYLON.Ray(startVec, direction, 150);
            const hit = scene.pickWithRay(ray);
            
            if (hit.hit) {
                posY = hit.pickedPoint.y + (treeHeight / 2);
            }
            
            tree.position = new BABYLON.Vector3(posX, posY, posZ);
            tree.checkCollisions = true;
            
            // Create tree foliage
            const foliage = BABYLON.MeshBuilder.CreateSphere("foliage" + i, { 
                diameter: treeWidth * 3 
            }, scene);
            foliage.position = new BABYLON.Vector3(
                tree.position.x, 
                tree.position.y + (treeHeight / 2), 
                tree.position.z
            );
            
            // Materials
            const trunkMaterial = new BABYLON.StandardMaterial("trunkMat", scene);
            trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
            tree.material = trunkMaterial;
            
            const foliageMaterial = new BABYLON.StandardMaterial("foliageMat", scene);
            foliageMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.1);
            foliage.material = foliageMaterial;
            
            // Metadata
            tree.metadata = { type: "tree", wood: 10 };
            foliage.metadata = { type: "tree", wood: 5 };
        } catch (e) {
            console.error("Error creating tree:", e);
        }
    }
    
    // Create other world objects
    createRocks(scene);
    createGrass(scene);
    createScrapMetal(scene);
    createBarrels(scene);
    createBuildings(scene);
    createWildlife(scene);
    
    // Fog
    console.log("Enabling fog...");
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.005;
    scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    
    console.log("World initialization complete.");
}

function createRocks(scene) {
    console.log("Creating rocks...");
    for (let i = 0; i < 50; i++) {
        try {
            const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, { diameter: 3 }, scene);
            rock.position = new BABYLON.Vector3(Math.random() * 900 - 450, 5, Math.random() * 900 - 450);
            rock.checkCollisions = true;
            rock.metadata = { type: "rock", stone: 5 };
            
            const rockMaterial = new BABYLON.StandardMaterial("rockMat" + i, scene);
            rockMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            rock.material = rockMaterial;
        } catch (e) {
            console.error("Error creating rock:", e);
        }
    }
}

function createGrass(scene) {
    console.log("Creating grass...");
    for (let i = 0; i < 200; i++) {
        try {
            const grass = BABYLON.MeshBuilder.CreateBox("grass" + i, { width: 1, height: 2, depth: 1 }, scene);
            grass.position = new BABYLON.Vector3(Math.random() * 900 - 450, 5, Math.random() * 900 - 450);
            grass.metadata = { type: "grass", fiber: 2 };
            
            const grassMaterial = new BABYLON.StandardMaterial("grassMat" + i, scene);
            grassMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.2);
            grass.material = grassMaterial;
        } catch (e) {
            console.error("Error creating grass:", e);
        }
    }
}

function createScrapMetal(scene) {
    console.log("Creating scrap metal...");
    for (let i = 0; i < 50; i++) {
        try {
            const scrap = BABYLON.MeshBuilder.CreateBox("scrap" + i, { size: 1 }, scene);
            scrap.position = new BABYLON.Vector3(Math.random() * 900 - 450, 5, Math.random() * 900 - 450);
            scrap.metadata = { type: "scrap", metal: 3 };
            
            const scrapMaterial = new BABYLON.StandardMaterial("scrapMat" + i, scene);
            scrapMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
            scrap.material = scrapMaterial;
        } catch (e) {
            console.error("Error creating scrap:", e);
        }
    }
}

function createBarrels(scene) {
    console.log("Creating barrels...");
    for (let i = 0; i < 20; i++) {
        try {
            const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel" + i, { height: 2, diameter: 1 }, scene);
            barrel.position = new BABYLON.Vector3(Math.random() * 900 - 450, 5, Math.random() * 900 - 450);
            barrel.metadata = { type: "barrel", loot: ["wood", "stone", "metal"] };
            
            const barrelMaterial = new BABYLON.StandardMaterial("barrelMat" + i, scene);
            barrelMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.3);
            barrel.material = barrelMaterial;
        } catch (e) {
            console.error("Error creating barrel:", e);
        }
    }
}

function createBuildings(scene) {
    console.log("Creating buildings...");
    for (let i = 0; i < 5; i++) {
        try {
            const building = BABYLON.MeshBuilder.CreateBox("building" + i, { width: 10, height: 5, depth: 10 }, scene);
            building.position = new BABYLON.Vector3(Math.random() * 900 - 450, 5, Math.random() * 900 - 450);
            building.checkCollisions = true;
            
            const buildingMaterial = new BABYLON.StandardMaterial("buildingMat" + i, scene);
            buildingMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.7);
            building.material = buildingMaterial;
            
            const crate = BABYLON.MeshBuilder.CreateBox("crate" + i, { size: 2 }, scene);
            crate.position = new BABYLON.Vector3(
                building.position.x, 
                building.position.y + 3, 
                building.position.z
            );
            crate.metadata = { type: "crate", loot: ["wood", "stone", "metal"] };
            
            const crateMaterial = new BABYLON.StandardMaterial("crateMat" + i, scene);
            crateMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
            crate.material = crateMaterial;
        } catch (e) {
            console.error("Error creating building:", e);
        }
    }
}

function createWildlife(scene) {
    console.log("Creating animals...");
    for (let i = 0; i < 10; i++) {
        try {
            const animal = BABYLON.MeshBuilder.CreateSphere("animal" + i, { diameter: 2 }, scene);
            animal.position = new BABYLON.Vector3(Math.random() * 900 - 450, 5, Math.random() * 900 - 450);
            animal.metadata = { type: "animal", meat: 5, leather: 3, fat: 2 };
            
            const animalMaterial = new BABYLON.StandardMaterial("animalMat" + i, scene);
            animalMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1);
            animal.material = animalMaterial;
            
            // Simple animal movement
            scene.registerBeforeRender(() => {
                animal.position.x += Math.sin(Date.now() * 0.001 + i) * 0.05;
                animal.position.z += Math.cos(Date.now() * 0.001 + i) * 0.05;
                
                // Keep animals above ground
                const ray = new BABYLON.Ray(
                    new BABYLON.Vector3(animal.position.x, 10, animal.position.z),
                    new BABYLON.Vector3(0, -1, 0),
                    15
                );
                const hit = scene.pickWithRay(ray);
                if (hit.hit && hit.pickedPoint) {
                    animal.position.y = hit.pickedPoint.y + 1;
                }
            });
        } catch (e) {
            console.error("Error creating animal:", e);
        }
    }
}