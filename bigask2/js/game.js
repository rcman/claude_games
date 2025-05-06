// Main Game Controller
// Make sure PointerLockControls and GLTFLoader are available (e.g., in js/libs/)
// import { PointerLockControls } from './libs/PointerLockControls.js'; // Example local path
// import { GLTFLoader } from './libs/GLTFLoader.js'; // Example local path

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        this.scene.fog = new THREE.Fog(0xaaaaaa, 50, 200); // Initial fog

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Camera is positioned and controlled by Player class

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.stats = new Stats();
        this.stats.showPanel(0); 
        document.body.appendChild(this.stats.dom);

        this.clock = new THREE.Clock();
        this.paused = true; // Start paused until loading finishes
        this.gameTime = 0;
        this.dayNightCycle = 0.25; // 0-1 value (0.25 = morning)
        this.dayDuration = 600; // seconds for a full day-night cycle (10 minutes)
        
        this.mouse = { x: 0, y: 0, buttons: { left: false, right: false, middle: false } };
        this.raycaster = new THREE.Raycaster(); // General raycaster, player might have its own
        
        this.initModules();
        this.setupEventListeners();
        this.loadAssetsAndStart(); // Changed to async
    }

    initModules() {
        this.world = new World(this);
        this.water = new Water(this);
        this.resources = new Resources(this);
        this.player = new Player(this);
        this.inventory = new Inventory(this);
        this.crafting = new CraftingSystem(this); // Corrected class name
        this.building = new BuildingSystem(this); // Corrected class name
        this.animals = new AnimalSystem(this);   // Corrected class name
        this.structures = new StructuresSystem(this); // Corrected class name
        this.ui = new UI(this);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        document.addEventListener('keydown', this.onGlobalKeyDown.bind(this));
        document.addEventListener('keyup', this.onGlobalKeyUp.bind(this));
        
        this.renderer.domElement.addEventListener('click', () => {
            if (this.paused && !document.getElementById('gameOverScreen')) return;

            if (!this.player.controls.isLocked) {
                this.player.controls.lock();
            } else {
                // If building, primary action (click) places the building
                if (this.building.ghostObject && this.building.selectedBuildable) {
                    this.player.performPrimaryAction(); 
                }
                // Other click interactions could be here if not covered by primary action
            }
        });

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (this.player.controls.isLocked) {
                if (event.button === 0) { // Left mouse button
                    this.mouse.buttons.left = true;
                    this.player.performPrimaryAction(); // Trigger action on mousedown
                } else if (event.button === 2) { // Right mouse button
                    this.mouse.buttons.right = true;
                    this.player.performSecondaryAction(); // For aiming or alternative use
                }
            }
        });
        this.renderer.domElement.addEventListener('mouseup', (event) => {
            if (event.button === 0) this.mouse.buttons.left = false;
            if (event.button === 2) this.mouse.buttons.right = false;
        });

        // Prevent context menu on right click
        this.renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    async loadAssetsAndStart() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('progressFill');
        const loadingText = document.getElementById('loadingText');

        try {
            loadingText.textContent = "Loading textures...";
            // Example: AssetLoader.loadTexture('grass_diffuse', 'assets/textures/grass.png');
            await AssetLoader.loadAllTextures(); // Wait for all textures defined in AssetLoader
            progressBar.style.width = '20%';

            // Models are loaded by their respective systems (Building, Resources, Animals)
            // We can add a global loading manager if systems register their loading promises
            loadingText.textContent = "Initializing systems...";
            // Simulate system specific loading (e.g. pre-loading some critical models)
            // For a full system, each module (resources, animals, building) would have a `preloadModels`
            // method that returns a promise, and we'd Promise.all them here.
            await new Promise(resolve => setTimeout(resolve, 300)); // Placeholder
            progressBar.style.width = '40%';

            loadingText.textContent = "Generating world...";
            this.world.generate();
            this.water.createWaterPlane(); // Create water plane after world generation
            progressBar.style.width = '70%';
            await new Promise(resolve => setTimeout(resolve, 200));

            this.resources.spawnInitialResources();
            this.animals.spawnInitialAnimals(); // This will start async model loading
            
            // Wait for any critical models if necessary, or let them pop in.
            // For example, wait for animal models if spawnInitialAnimals returns promises:
            // await this.animals.preloadModels(); 
            progressBar.style.width = '90%';

            this.player.spawn();
            this.inventory.addItem('wooden_axe', 1);
            this.inventory.addItem('wooden_pickaxe', 1);
            this.inventory.addItem('apple', 3);
            this.inventory.addItem('campfire_item', 1); // Give a campfire kit to start
            this.inventory.addItem('wooden_wall_item', 10);

            this.ui.updateInventory(); // This also updates quickbar
            this.player.updateEquippedItem();

            loadingText.textContent = "Game ready!";
            progressBar.style.width = '100%';
            await new Promise(resolve => setTimeout(resolve, 500));

            loadingScreen.style.display = 'none';
            this.paused = false;
            if (!this.player.controls.isLocked) {
                this.player.controls.lock();
            }
            this.animate();

        } catch (error) {
            console.error("Error during game initialization:", error);
            loadingText.textContent = "Error loading game. See console for details.";
            // Potentially show a more user-friendly error message on screen
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onGlobalKeyDown(event) {
        if (this.paused && !document.getElementById('gameOverScreen')) { // Allow Esc for death/pause screen
             if (event.key === 'Escape' && this.ui.isAnyMenuOpen()) {
                this.ui.closeAllMenus();
             } else if (event.key === 'Escape' && this.paused && document.getElementById('pauseMenu')) { // Example pause menu
                // this.ui.togglePauseMenu(); // or resumeGame()
             }
            return;
        }
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return; 
        }

        // Player movement/action keys are handled by Player class
        this.player.onKeyDown(event); 

        switch(event.key.toLowerCase()) {
            case 'e':
                // Interaction logic: E key tries to interact with focused object,
                // otherwise toggles inventory.
                const interactable = this.getInteractableObject();
                if (interactable && this.player.controls.isLocked) {
                    this.interactWithFocusedObject(interactable);
                } else if (!this.building.ghostObject) { // Don't open inventory if in build mode
                    this.ui.toggleInventory();
                }
                break;
            case 'c': 
                if (!this.building.ghostObject) this.ui.toggleCraftingMenu();
                break;
            case 'b': 
                if (!this.building.ghostObject) this.ui.toggleBuildingMenu();
                break;
            case 'escape':
                if (this.building.ghostObject) {
                    this.building.cancelPlacement();
                } else if (this.ui.isAnyMenuOpen()) {
                    this.ui.closeAllMenus();
                } else {
                    // Optional: Implement a pause menu
                    // this.ui.togglePauseMenu();
                    console.log("Game paused (conceptual)");
                    // this.paused = !this.paused; // Simple pause
                    // if(this.paused) this.player.controls.unlock(); else this.player.controls.lock();
                }
                break;
            case '1': case '2': case '3': case '4': case '5':
                this.inventory.selectQuickSlot(parseInt(event.key) - 1);
                break;
        }
    }

    onGlobalKeyUp(event) {
        this.player.onKeyUp(event);
    }

    updateGameLogic(deltaTime) {
        this.gameTime += deltaTime;
        this.dayNightCycle = (this.gameTime % this.dayDuration) / this.dayDuration;
        
        this.world.update(deltaTime, this.dayNightCycle, this.scene.fog, this.ambientLight, this.sunLight);
        this.player.update(deltaTime);
        this.water.update(deltaTime); // Water might need gameTime or its own clock
        this.resources.update(deltaTime);
        this.animals.update(deltaTime);
        this.structures.update(deltaTime);
        this.building.update(deltaTime);
        
        this.checkInteractionFocus();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();
        
        this.stats.begin(); // Moved here to always update stats

        if (this.paused && !document.getElementById('gameOverScreen')) {
            // Update UI elements that might need it even when paused (e.g., progress in a menu)
            // For now, just render and update stats
            if (this.ui.isAnyMenuOpen()) { // If a menu is open, render it (e.g. inventory)
                 // Potentially update specific UI animations if any
            }
        } else if (!this.paused) { // Game is running
             this.updateGameLogic(deltaTime);
        }
        
        // Always render, even if "paused" by a menu, to see the background
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
    }

    getInteractableObject() {
        if (!this.player.controls.isLocked && !this.ui.isAnyMenuOpen()) return null; // Allow interaction checks if menu is open for context

        // Raycast from camera center
        this.raycaster.setFromCamera({x: 0, y: 0}, this.camera);
        
        const collidables = [];
        this.scene.traverseVisible(child => {
            if (child.isMesh && child.userData.type && 
                child !== this.player.playerObject && 
                (!this.player.toolMesh || child !== this.player.toolMesh) &&
                (!this.building.ghostObject || child !== this.building.ghostObject) &&
                !child.userData.isWater) {
                collidables.push(child);
            }
        });

        const intersects = this.raycaster.intersectObjects(collidables, false); // false for non-recursive on direct scene children (if models are structured well)

        for (const hit of intersects) {
            if (hit.distance > this.player.interactionDistance) continue;

            let interactableObject = hit.object;
            // Ascend the hierarchy to find the object with userData.type if it's part of a GLTF model
            while (interactableObject && !interactableObject.userData.type && interactableObject.parent && interactableObject.parent !== this.scene) {
                interactableObject = interactableObject.parent;
            }
            
            if (interactableObject && interactableObject.userData.type) {
                if (interactableObject.userData.type === 'resource' ||
                    (interactableObject.userData.type === 'animal' && interactableObject.userData.state === 'dead') || // For looting
                    (interactableObject.userData.type === 'structure' && interactableObject.userData.interactive)) {
                    return interactableObject; // Return the object with the userData.type
                }
            }
            // If the first hit is not interactable but within range, stop to prevent interacting through it.
            if (hit.distance <= this.player.interactionDistance) break; 
        }
        return null;
    }

    checkInteractionFocus() {
        if (this.building.ghostObject) { // Don't show interaction prompts if placing a building
            this.ui.hideInteractionPrompt();
            return;
        }

        const interactable = this.getInteractableObject();
        if (interactable) {
            let promptText = "Interact"; // Default
            const objUserData = interactable.userData;
            const objConfig = objUserData.config || (this.building.buildables ? this.building.buildables[objUserData.buildableId] : null) || 
                              (this.resources.resourceTypes ? this.resources.resourceTypes[objUserData.resourceId] : null) ||
                              (this.animals.animalTypes ? this.animals.animalTypes[objUserData.animalId] : null);


            if (objUserData.type === 'resource' && objConfig) {
                promptText = `Harvest ${objConfig.name}`;
            } else if (objUserData.type === 'structure' && objUserData.interactive && objConfig) {
                promptText = `Use ${objConfig.name}`; // Use name from building system config
            } else if (objUserData.type === 'animal' && objUserData.state === 'dead' && objConfig) {
                 promptText = `Loot ${objConfig.name}`;
            }
            
            this.ui.showInteractionPrompt(promptText);
        } else {
            this.ui.hideInteractionPrompt();
        }
    }

    interactWithFocusedObject(object) { // Object is passed from onGlobalKeyDown
        if (!object || !object.userData.interactive) return; // Ensure it's truly interactive

        if (object.userData.type === 'structure') {
            this.building.interactWithBuilding(object); // BuildingSystem handles its own specific interactions
        } else if (object.userData.type === 'animal' && object.userData.state === 'dead') {
            // Looting action
            this.animals.lootAnimal(object.userData.animalInstanceId); // Pass animal's unique ID
        }
    }
}

window.addEventListener('load', () => {
    // Ensure THREE is available globally if not using modules everywhere for it
    if (typeof THREE === 'undefined') {
        console.error("THREE.js library not loaded!");
        document.getElementById('loadingText').textContent = "Error: THREE.js failed to load.";
        return;
    }
    window.gameInstance = new Game(); // Make it global for easy access from HTML event handlers like close buttons
});