// --- START OF FILE Game.js ---

class Game {
    constructor() {
        // Keep: clock (optional), running state, deltaTime, elapsedTime, dayNightCycle, isGodMode, saveSlot, settings
        this.clock = new BABYLON.Clock(); // Use Babylon's clock if needed, or manage time manually
        this.running = false;
        this.deltaTime = 0; // Will be updated by Babylon
        this.elapsedTime = 0;
        this.dayNightCycle = 0.5;
        this.isGodMode = false;
        this.saveSlot = 'saveGameData_babylon'; // Changed key slightly
        this.settings = window.gameSettings || {};

        // Babylon Core Components
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.sunLight = null;
        this.ambientLight = null; // Will use HemisphericLight

        // Systems (keep placeholders)
        this.assetLoader = null; this.terrain = null; this.resourceManager = null;
        this.entityManager = null; this.playerController = null; this.characterStats = null;
        this.inventory = null; this.craftingSystem = null; this.buildingSystem = null;
        this.weather = null; this.networkManager = null; this.worldGenerator = null;
        this.uiManager = null;

        this.initialize().catch(error => {
            console.error("FATAL: Failed to initialize game:", error);
            alert("Failed to initialize game. Check console (F12) for errors.");
            document.body.innerHTML = `<div style="color: red; font-size: 20px; padding: 40px;">Failed to initialize game: ${error.message}. Check console (F12) for details.</div>`;
        });
    }

    toggleGodMode() { /* Keep logic */ }

    async initialize() {
        console.log("Initializing game (Babylon.js)...");

        // --- Babylon.js Setup ---
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error("Canvas element with ID 'game-canvas' not found.");
        }
        // Anti-aliasing is enabled by default in Engine options
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: false, // Often false for performance
            stencil: false              // Often false unless needed
        }, true); // Adapt to device ratio

        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1); // Initial sky blue (RGBA)

        // Camera (Using FreeCamera for FPS-like control)
        // Initial position will be set after terrain generation
        this.camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 10, -10), this.scene);
        this.camera.fov = BABYLON.Tools.ToRadians(75); // Convert degrees to radians
        this.camera.minZ = 0.1; // Near plane
        this.camera.maxZ = (Constants?.WORLD?.SIZE ?? 1000) * 1.5; // Far plane
        this.camera.attachControl(this.canvas, false); // Attach input controls, but don't prevent default actions yet
        this.camera.speed = 0; // We'll handle movement manually in PlayerController
        this.camera.angularSensibility = 4000; // Adjust mouse sensitivity
        this.camera.inertia = 0.9; // Smooth movement/rotation (optional)
        this.camera.keysUp = []; this.camera.keysDown = []; this.camera.keysLeft = []; this.camera.keysRight = []; // Disable built-in WASD

        // Lights
        // Hemispheric Light (replaces AmbientLight, provides sky/ground colors)
        this.ambientLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.ambientLight.intensity = 0.8;
        this.ambientLight.diffuse = new BABYLON.Color3(0.8, 0.8, 0.9); // Slightly bluish sky
        this.ambientLight.groundColor = new BABYLON.Color3(0.4, 0.35, 0.3); // Earthy ground

        // Directional Light (Sun)
        this.sunLight = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-0.5, -1, -0.75), this.scene); // Initial direction
        this.sunLight.intensity = 1.2;
        this.sunLight.position = new BABYLON.Vector3(50, 150, 75); // Set source position for shadows

        // Shadows (More involved in Babylon)
        this.shadowGenerator = new BABYLON.ShadowGenerator(2048, this.sunLight); // Map size and light source
        this.shadowGenerator.useExponentialShadowMap = true; // Common shadow map type
        // this.shadowGenerator.useBlurExponentialShadowMap = true; // Smoother shadows, more costly
        // this.shadowGenerator.blurKernel = 32;
        this.shadowGenerator.darkness = 0.3; // Adjust shadow intensity
        // Meshes that cast shadows need `mesh.receiveShadows = true;`
        // Meshes that receive shadows need `shadowGenerator.getShadowMap().renderList.push(mesh);`

        // --- End Babylon.js Setup ---

        // Load Assets
        this.assetLoader = new AssetLoader(this.scene); // Pass the scene to AssetLoader
        await this.assetLoader.loadAssets();
        console.log("Assets loaded/initialized.");

        // Initialize Game Systems (Order matters)
        this.setupSystems();
        console.log("Game systems setup.");

        // Generate World Content
        if (this.worldGenerator) {
            console.log("Starting world generation...");
            await this.worldGenerator.generateWorld(); // Needs to be adapted for Babylon
            console.log("World generation process completed.");
        } else { throw new Error("WorldGenerator failed to initialize."); }

        // Set Player Spawn Position (Adjust for camera height in PlayerController later)
        if (this.playerController && this.terrain) {
            const spawnX = 0; const spawnZ = 0;
            const spawnY = typeof this.terrain.getHeightAt === 'function'
                ? this.terrain.getHeightAt(spawnX, spawnZ) + Constants.PLAYER.CAM_HEIGHT // Start slightly above ground
                : 10.0;
            this.playerController.position = new BABYLON.Vector3(spawnX, spawnY, spawnZ); // Set initial position in controller
            this.camera.position = this.playerController.position.clone(); // Initial camera sync
            console.log(`PlayerController position set at ${spawnX.toFixed(2)}, ${spawnY.toFixed(2)}, ${spawnZ.toFixed(2)}`);
        } else { throw new Error("Player/Terrain failed to initialize."); }

        // Add Starting Inventory Items (Keep logic, may need adjustment later)
        if (this.inventory?.addItem) {
            // ... (keep existing item adding logic for now) ...
             console.log("Adding starting items...");
             try {
                  this.inventory.addItem('axe', 1); this.inventory.addItem('pickaxe', 1);
                  this.inventory.addItem('knife', 1); this.inventory.addItem('canteen', 1);
                  this.inventory.addItem('rifle', 1); this.inventory.addItem('rifleround', 100);
                  this.inventory.addItem('woodplanks', 100); this.inventory.addItem('nail', 100);
                  this.inventory.addItem('rope', 100); this.inventory.addItem('fiber', 100);
                 // Move to quickbar - logic assumes inventory slots are filled immediately
                 // Might need small delay or ensure UI updates before moving
                  // await new Promise(resolve => setTimeout(resolve, 50)); // Delay if needed
                  const findSlot = (id) => this.inventory.inventorySlots.findIndex(item => item?.id === id);
                  const axe=findSlot('axe'), pick=findSlot('pickaxe'), rifle=findSlot('rifle'), knife=findSlot('knife'), canteen=findSlot('canteen');
                  if(axe!==-1)this.inventory.moveToQuickBar(axe,0); if(pick!==-1)this.inventory.moveToQuickBar(pick,1);
                  if(knife!==-1)this.inventory.moveToQuickBar(knife,2); if(rifle!==-1)this.inventory.moveToQuickBar(rifle,3);
                  if(canteen!==-1)this.inventory.moveToQuickBar(canteen,4);
                  console.log("Starting items added & potentially equipped.");
             } catch (itemError) { console.error("Error adding starting item:", itemError); }
        } else { console.error("Inventory system not available for starting items."); }


        // Initialize UI Manager (Keep logic)
        if (this.uiManager) {
            if (typeof this.uiManager.init === 'function') { this.uiManager.init(); }
            // ... (keep initial UI updates) ...
            console.log("UIManager initialized & initial UI updated.");
        } else { console.error("UIManager not initialized."); }

        // Setup Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());
        // Pointer lock will be handled differently (likely via canvas click or PlayerController)

        // Start Game Loop
        console.log("Starting game loop...");
        this.startGameLoop();
        console.log("Game initialization sequence completed successfully.");
    }

    setupSystems() {
        // Order matters for dependencies
        // Pass the Babylon scene where needed
        this.terrain = new Terrain(this);
        this.resourceManager = new ResourceManager(this);
        this.entityManager = new EntityManager(this);
        this.inventory = new Inventory(this); // Less scene dependent
        this.characterStats = new CharacterStats(this); // Less scene dependent
        this.craftingSystem = new CraftingSystem(this); // Less scene dependent
        this.buildingSystem = new BuildingSystem(this); // Needs scene for previews/building
        this.weather = new Weather(this); // Needs scene for effects
        this.networkManager = new NetworkManager(this); // Less scene dependent
        this.uiManager = new UIManager(this); // Less scene dependent
        this.playerController = new PlayerController(this); // Needs scene, camera, input
        this.worldGenerator = new WorldGenerator(this); // Needs scene, terrain, RM, EM, AssetLoader
    }

    startGameLoop() {
        if (this.running) return;
        this.running = true;
        // Use Babylon's render loop
        this.engine.runRenderLoop(() => {
            if (!this.running) {
                // If paused externally, stop the render loop
                // this.engine.stopRenderLoop(); // Or just return
                return;
            }
            // Get delta time in seconds
            this.deltaTime = this.engine.getDeltaTime() / 1000.0;
            this.elapsedTime += this.deltaTime;

            // Update day/night cycle logic (keep similar)
            const dayLen = Constants?.WORLD?.DAY_LENGTH ?? 1200;
             if (!(this.uiManager?.isDebugMenuOpen)) {
                 this.dayNightCycle = (this.elapsedTime % dayLen) / dayLen;
             }
            this.updateDayNightCycle(); // Update lighting

            // Update game logic
            this.update(this.deltaTime);

            // Render the scene
            if (this.scene) {
                this.scene.render();
            }
        });
    }

    update(deltaTime) {
        if (!this.running) return; // Check if paused

        // Update systems (order may need adjustment based on dependencies)
        this.weather?.update(deltaTime);
        this.entityManager?.update(deltaTime); // Update entity positions/states
        this.resourceManager?.update(deltaTime); // Process respawns
        this.playerController?.update(deltaTime); // Update player movement, camera, interactions
        this.characterStats?.update(deltaTime); // Update player stats
        this.inventory?.update(deltaTime); // Check spoiling items
        this.buildingSystem?.update(deltaTime); // Update build previews etc.
        this.networkManager?.update(deltaTime); // Send/receive network data
        this.uiManager?.update(deltaTime); // Update UI elements if needed
        this.terrain?.update(deltaTime); // Update water animation
    }

    updateDayNightCycle() {
        // --- Babylon.js Lighting Update ---
        if (!this.sunLight || !this.ambientLight || !this.scene) return;

        const angle = this.dayNightCycle * Math.PI * 2;
        const sunDist = (Constants?.WORLD?.SIZE ?? 1000) * 0.8;
        const visuals = Constants?.WORLD?.DAY_NIGHT_CYCLE_VISUALS ?? { MIN_SUN_Y_FACTOR: -0.2, BASE_SUN_INTENSITY: 0.1, MAX_SUN_INTENSITY: 1.2, MIN_AMBIENT_INTENSITY: 0.2, MAX_AMBIENT_INTENSITY: 0.8, DAWN_DUSK_PHASE: 0.1 };

        // Calculate sun direction/position
        const sunY = Math.sin(angle) * sunDist;
        const sunZ = Math.cos(angle) * sunDist;
        // Clamp sun position
        const clampedSunY = Math.max(sunDist * visuals.MIN_SUN_Y_FACTOR, sunY);
        this.sunLight.position = new BABYLON.Vector3(0, clampedSunY, sunZ); // Set position for shadow calc
        this.sunLight.direction = new BABYLON.Vector3(0, -1, 0).subtract(this.sunLight.position).normalize(); // Point towards origin from position

        // Intensity and color logic
        const sunRatio = Math.max(0, Math.sin(angle));
        let currentSunIntensity, currentAmbientIntensity;
        let useCalculatedColors = true;

        if (this.uiManager?.isDebugMenuOpen) {
            currentSunIntensity = this.sunLight.intensity;
            currentAmbientIntensity = this.ambientLight.intensity;
        } else {
            currentSunIntensity = visuals.BASE_SUN_INTENSITY + sunRatio * (visuals.MAX_SUN_INTENSITY - visuals.BASE_SUN_INTENSITY);
            currentAmbientIntensity = visuals.MIN_AMBIENT_INTENSITY + sunRatio * (visuals.MAX_AMBIENT_INTENSITY - visuals.MIN_AMBIENT_INTENSITY);
            this.sunLight.intensity = currentSunIntensity;
            this.ambientLight.intensity = currentAmbientIntensity; // Update hemi intensity
        }

        // Cave Darkness Check (keep similar logic)
        let insideCave = false;
         if (this.playerController && this.terrain && typeof this.terrain.isInsideCave === 'function') {
              insideCave = this.terrain.isInsideCave(this.playerController.position); // Needs PlayerController.position
             if (insideCave) {
                 this.sunLight.intensity = currentSunIntensity * 0.05;
                 this.ambientLight.intensity = currentAmbientIntensity * 0.1;
                 useCalculatedColors = false;
                 // Fog: Babylon.js scene fog
                 if (this.scene.fogMode === BABYLON.Scene.FOGMODE_NONE) {
                      this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
                      this.scene.fogColor = new BABYLON.Color3(0.02, 0.02, 0.03);
                      this.scene.fogDensity = 0.08; // Adjust cave fog density
                  }
             } else {
                  // Remove fog if not in cave and weather allows
                  if (this.scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.weather?.currentWeather !== 'fog') {
                       this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
                   }
             }
         }

        // Update sky color (scene.clearColor)
        if (useCalculatedColors && this.weather && (this.weather.currentWeather === 'clear' || this.weather.currentWeather === 'cloudy')) {
            const nightC = new BABYLON.Color3(0.03, 0.05, 0.1); // Babylon Color3
            const dawnDuskC = new BABYLON.Color3(1.0, 0.55, 0.41);
            const dayC = new BABYLON.Color3(0.37, 0.67, 0.98); // More blue
            const noonC = new BABYLON.Color3(0.48, 0.78, 0.96);

            let skyC = new BABYLON.Color3();
            const phase = visuals.DAWN_DUSK_PHASE;

            // Lerp logic adapted for Babylon.Color3.Lerp
             if(sunRatio<=0){skyC = nightC;}
             else if(sunRatio<phase){skyC = BABYLON.Color3.Lerp(nightC, dawnDuskC, sunRatio/phase);}
             else if(sunRatio<(0.5-phase)){skyC = BABYLON.Color3.Lerp(dawnDuskC, dayC, (sunRatio-phase)/(0.5-2*phase));}
             else if(sunRatio<=0.5){skyC = BABYLON.Color3.Lerp(dayC, noonC, (sunRatio-(0.5-phase))/phase);}
             else if(sunRatio<(0.5+phase)){skyC = BABYLON.Color3.Lerp(noonC, dayC, (sunRatio-0.5)/phase);}
             else if(sunRatio<(1.0-phase)){skyC = BABYLON.Color3.Lerp(dayC, dawnDuskC, (sunRatio-(0.5+phase))/(0.5-2*phase));}
             else {skyC = BABYLON.Color3.Lerp(dawnDuskC, nightC, Math.max(0,(sunRatio-(1.0-phase))/phase));}


            // Update scene background color (clearColor uses Color4 including alpha)
            this.scene.clearColor = new BABYLON.Color4(skyC.r, skyC.g, skyC.b, 1.0);

            // Update HemisphericLight diffuse color based on sky
            this.ambientLight.diffuse = skyC;

             // Handle weather fog color
             if (this.scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                 this.scene.fogColor = skyC;
             }
        }
        // --- End Babylon.js Lighting Update ---
    }

    onWindowResize() {
        if (this.engine) {
            this.engine.resize();
        }
    }

    pause() {
        if (!this.running) return;
        this.running = false; // Render loop will check this flag
        this.engine.stopRenderLoop(); // Explicitly stop loop

        // Exit pointer lock if active
        if (this.engine.isPointerLock) {
             this.engine.exitPointerlock();
        }
        console.log("Game paused");
        this.uiManager?.showPauseMenu();
    }

    resume() {
        if (this.running) return;
        this.running = true;

        // Request pointer lock IF no menus are open (handled by UI Manager toggle logic ideally)
         if (this.canvas && !this.uiManager?.isInventoryOpen && !this.uiManager?.isBuildMenuOpen && !this.uiManager?.isCraftingMenuOpen && !this.isDebugMenuOpen && !this.isPauseMenuOpen) {
            this.engine.enterPointerlock();
        }

        this.startGameLoop(); // Restart render loop
        console.log("Game resumed");
        this.uiManager?.hidePauseMenu();
    }

    // --- Save/Load Functions ---
    // These need significant adaptation for Babylon.js object structures.
    // We'll just add placeholders for now.
    saveGame() {
        console.warn("Game.saveGame() - Not fully implemented for Babylon.js yet.");
        if (!this.playerController /*... other checks ...*/ ) {
             console.error("Cannot save game: Core systems not initialized.");
             this.uiManager?.showNotification("Save Failed: Systems not ready", 3000);
             return false;
         }
         try {
             // --- Create saveData object ---
             const saveData = {
                version: 1.1, // Indicate Babylon version
                timestamp: Date.now(),
                elapsedTime: this.elapsedTime,
                dayNightCycle: this.dayNightCycle,
                weather: this.weather?.currentWeather ?? 'clear',
                isGodMode: this.isGodMode,
                player: {
                     // Use Babylon vectors, convert to array for JSON
                     position: this.playerController.position.asArray(),
                     // PlayerController needs separate rotation/pitch storage
                     rotationY: this.playerController.rotationY, // Example, needs implementation
                     rotationX: this.camera.rotation.x // Camera pitch
                 },
                 stats: { /* ... keep similar ... */ },
                 inventory: { /* ... keep similar ... */ },
                 // --- Entities: Need Babylon positions ---
                 entities: Array.from(this.entityManager.entities.values()).map(e => {
                     // Need access to the Babylon mesh/node position
                     const mesh = e.model; // Assuming e.model is the Babylon mesh/node
                     if (!mesh) return null; // Skip entities without models?
                     return {
                        id: e.id, type: e.type,
                        position: mesh.position.asArray(),
                        rotation: mesh.rotation.y, // Save Y rotation
                        health: e.health, state: e.state, isAlive: e.isAlive,
                     };
                 }).filter(e => e !== null),
                 // --- Resources: Need Babylon positions ---
                 resources: Array.from(this.resourceManager.resourceMap.values())
                     .filter(r => !r.regrowTime && r.meshes && r.meshes[0]) // Only save non-respawning with models
                     .map(r => ({
                         id: r.id, type: r.type,
                         position: r.meshes[0].position.asArray(),
                         // Babylon uses .scaling not .scale
                         scaling: r.meshes[0].scaling.asArray(),
                         health: r.health, searched: r.searched, lootTable: r.lootTable,
                     })),
                // --- Buildings: Need Babylon positions ---
                 buildings: this.buildingSystem.buildings
                     .filter(b => b.meshes && b.meshes[0])
                     .map(b => ({
                         id: b.id, type: b.buildingType,
                         position: b.meshes[0].position.asArray(),
                         rotation: b.meshes[0].rotation.y,
                         health: b.health,
                     })),
             };

             const jsonData = JSON.stringify(saveData);
             localStorage.setItem(this.saveSlot, jsonData);
             console.log(`Game saved successfully to slot '${this.saveSlot}'. Size: ${(jsonData.length / 1024).toFixed(2)} KB`);
             return true;

         } catch (error) {
             console.error("Error during game save:", error);
             this.uiManager?.showNotification("Save Failed! Check console.", 3000);
             return false;
         }
    }

    loadGame() {
         console.warn("Game.loadGame() - Not fully implemented for Babylon.js yet.");
         const jsonData = localStorage.getItem(this.saveSlot);
         if (!jsonData) { /* ... keep */ return false; }
         console.log("Loading game from slot:", this.saveSlot);
         this.pause();

         try {
             const saveData = JSON.parse(jsonData);

             // --- PRE-LOAD RESET ---
             // Dispose existing dynamic objects cleanly
             this.entityManager.entities.forEach(entity => entity.model?.dispose()); // Dispose mesh
             this.entityManager.entities.clear(); this.entityManager.animals = []; this.entityManager.hunters = []; this.entityManager.spatialGrid.clear();

             this.resourceManager.resourceMap.forEach(resource => resource.meshes?.forEach(m => m?.dispose()));
             this.resourceManager.resourceMap.clear(); this.resourceManager.resources = { trees: [], stones: [], plants: [], animals: [], buildings: [], crafting: [], crates: [], barrels: [], structures: [] }; this.resourceManager.spatialMap.clear(); this.resourceManager.respawnQueue = [];

             this.buildingSystem.buildings.forEach(building => building.meshes?.forEach(m => m?.dispose()));
             this.buildingSystem.buildings = [];
             // Clear other things like particles?
             this.scene.meshes.forEach(m => { // More aggressive clear if needed
                 if (m.metadata?.isDynamic) m.dispose();
             });
             // --- END RESET ---

            // Restore Game State (keep similar)
             this.elapsedTime = saveData.elapsedTime ?? 0; this.dayNightCycle = saveData.dayNightCycle ?? 0.5;
             this.weather?.setWeather(saveData.weather ?? 'clear'); this.isGodMode = saveData.isGodMode ?? false;

             // Restore Player
             this.playerController.position = BABYLON.Vector3.FromArray(saveData.player.position);
             this.playerController.rotationY = saveData.player.rotationY; // Restore player rotation
             this.camera.rotation.x = saveData.player.rotationX;      // Restore camera pitch
             this.camera.rotation.y = this.playerController.rotationY; // Sync camera yaw
             this.camera.position = this.playerController.position.clone(); // Sync camera position
             // Reset velocity/state in player controller
             this.playerController.velocity = new BABYLON.Vector3(0,0,0);
             this.playerController.onGround = false; // Force re-check

             // Restore Stats (keep similar)
             // Restore Inventory (keep similar, check item definitions)

             // --- Restore Entities ---
             // This requires AssetLoader to be working to recreate models
             saveData.entities.forEach(entityData => {
                 if (!entityData || !entityData.isAlive) return;
                 const pos = BABYLON.Vector3.FromArray(entityData.position);
                 let entity = null;
                 try {
                     // Recreate based on type - ASSUMES constructors are adapted!
                     if (Constants.ANIMALS.TYPES.some(a => a.id === entityData.type)) {
                         entity = new Animal(this, entityData.type, pos); // Constructor needs adaptation
                     } else if (entityData.type === 'hunter') {
                         entity = new AIHunter(this, pos); // Constructor needs adaptation
                     }
                     if (entity && entity.model) { // Check if model creation succeeded
                         entity.model.rotation.y = entityData.rotation;
                         entity.health = entityData.health;
                         entity.state = entityData.state; // Might need state data restoration
                         // Add metadata to mesh for easier lookup?
                         entity.model.metadata = { entityId: entity.id };
                         this.entityManager.registerEntity(entity);
                     } else if (entity) {
                        console.warn(`Entity ${entityData.id} loaded but model creation failed.`);
                     }
                 } catch (e) { console.error("Error recreating entity on load:", e); }
             });

             // --- Restore Resources ---
             // Requires AssetLoader
             saveData.resources.forEach(resData => {
                 const pos = BABYLON.Vector3.FromArray(resData.position);
                 const scaling = BABYLON.Vector3.FromArray(resData.scaling);
                 let mesh = null;
                 try {
                     // Recreate mesh based on type (Needs AssetLoader adaptation)
                     const modelData = this.assetLoader.getModel(resData.type); // Needs adaptation
                     if (modelData instanceof BABYLON.Mesh) { // Simple primitive case
                        mesh = modelData.clone(`${resData.type}_${resData.id}`); // Clone and name
                        mesh.position = pos;
                        mesh.scaling = scaling;
                        // Apply material etc. based on type
                     } else { // Handle GLTF or other complex types
                        // Logic to clone/instance loaded GLTF needed here
                     }

                     if (mesh) {
                        mesh.receiveShadows = true;
                        this.shadowGenerator?.getShadowMap().renderList.push(mesh);
                        mesh.metadata = { resourceId: resData.id }; // Link mesh to resource
                        // Recreate resource data structure
                         const resource = {
                             id: resData.id, type: resData.type,
                             name: resData.type.charAt(0).toUpperCase() + resData.type.slice(1),
                             position: {x:pos.x, y:pos.y, z:pos.z}, // Keep plain object?
                             scale: scaling.x, // Store single scale?
                             health: resData.health,
                             maxHealth: resData.type === 'tree' ? Constants.RESOURCES.TREE_HEALTH : Constants.RESOURCES.STONE_HEALTH,
                             meshes: [mesh], // Store Babylon mesh
                             resources: {}, // Populate based on type/scale if needed
                             regrowTime: null, searched: resData.searched, lootTable: resData.lootTable,
                         };
                         this.resourceManager.registerResource(resource);
                          // Handle searched visual state
                         if(resData.searched && mesh.material) {
                             mesh.material.alpha = 0.6; // Example visual change
                         }
                     }
                 } catch(e) { console.error("Error recreating resource mesh on load:", e); }
             });

             // --- Restore Buildings ---
             // Requires AssetLoader
             saveData.buildings.forEach(bldgData => {
                 const pos = BABYLON.Vector3.FromArray(bldgData.position);
                 let mesh = null;
                  try {
                      // Recreate mesh - Needs AssetLoader adaptation
                     const modelData = this.assetLoader.getModel(bldgData.type); // Needs adaptation
                     if (modelData instanceof BABYLON.Mesh) { // Simple primitive case
                         mesh = modelData.clone(`${bldgData.type}_${bldgData.id}`);
                         mesh.position = pos;
                         mesh.rotation.y = bldgData.rotation;
                         mesh.receiveShadows = true;
                         this.shadowGenerator?.getShadowMap().renderList.push(mesh);
                         mesh.metadata = { buildingId: bldgData.id };

                        // Recreate building data structure
                         const building = {
                             id: bldgData.id, type: 'building', buildingType: bldgData.type,
                             position: {x:pos.x, y:pos.y, z:pos.z},
                             rotation: bldgData.rotation, health: bldgData.health,
                             maxHealth: Constants.BUILDING.COMPONENTS.find(c=>c.id===bldgData.type)?.health || 100,
                             meshes: [mesh], // Store Babylon mesh
                         };
                         this.buildingSystem.buildings.push(building);
                         // Re-register if destructible? Might need different handling
                         // if (building.health < building.maxHealth) {
                         //    this.resourceManager.registerResource(building);
                         // }
                     } else { /* Handle complex models */ }
                  } catch(e) { console.error("Error recreating building mesh on load:", e); }
             });


            // Update UI
            this.uiManager?.updateInventoryUI(this.game.inventory);
            this.uiManager?.updateQuickBarUI(this.game.inventory);
            // ... other UI updates ...
            this.characterStats?.updateUI();

            console.log("Game loaded successfully (Babylon).");
            // Should we resume here or let the user do it?
            // this.resume();
            return true;

         } catch (error) {
             console.error("Error loading game:", error);
             alert("Failed to load save game. Save data might be corrupted. Check console.");
             return false;
         }
    }
    // --- END Save/Load ---

}
// --- END OF FILE Game.js ---