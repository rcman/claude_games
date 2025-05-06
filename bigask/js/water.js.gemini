// js/water.js

class Water {
    constructor(game) { // Game instance is passed
        this.game = game;
        this.waterMesh = null;
        this.clock = new THREE.Clock(); // Keep its own clock if shader uses it a lot
    }

    createWaterPlane() {
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;

        const waterGeometry = new THREE.PlaneGeometry(worldSize, worldSize, 64, 64); // More segments for smoother waves
        
        // Simpler water material for better performance and compatibility
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x206080, // Deep blue
            transparent: true,
            opacity: 0.85,
            roughness: 0.1,
            metalness: 0.3,
            envMapIntensity: 0.5, // Reflect skybox a bit
            side: THREE.DoubleSide,
        });
        // To make it wavy, we can displace vertices in JS or use a vertex shader
        // For JS displacement:
        this.originalVertices = new Float32Array(waterGeometry.attributes.position.array);


        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = waterLevel;
        this.waterMesh.receiveShadow = true; // Water can receive shadows
        this.waterMesh.userData.isWater = true; // For identification
        
        this.game.scene.add(this.waterMesh);
    }
    
    update(deltaTime) {
        if (this.waterMesh) {
            const time = this.clock.getElapsedTime();
            const positions = this.waterMesh.geometry.attributes.position;
            const original = this.originalVertices;

            for (let i = 0; i < positions.count; i++) {
                const ox = original[i * 3];
                const oz = original[i * 3 + 2];

                // Simple sine waves
                const wave1 = Math.sin((ox + time * 0.5) * 0.1) * 0.1; // Smaller amplitude
                const wave2 = Math.sin((oz + time * 0.3) * 0.15) * 0.1;
                const wave3 = Math.cos((ox * 0.05 + oz * 0.03 + time * 0.2)) * 0.05; // More complex wave

                positions.setY(i, wave1 + wave2 + wave3);
            }
            positions.needsUpdate = true;
            // this.waterMesh.geometry.computeVertexNormals(); // Recalculate normals for lighting if waves are significant
        }
    }
    
    isPointInWater(point) { // point is THREE.Vector3
        return point.y < this.game.world.waterLevel;
    }
}
```

**11. Update `js/game.js` (Main Controller)**

```javascript
// js/game.js
// Ensure PointerLockControls is imported in player.js

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        // Add fog - its color will be updated by world.update
        this.scene.fog = new THREE.Fog(0xaaaaaa, 50, 150);


        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Camera is now controlled by Player class (PointerLockControls)

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        document.body.appendChild(this.renderer.domElement);

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.clock = new THREE.Clock();
        this.paused = true; // Start paused until loading finishes
        this.gameTime = 0;
        this.dayNightCycle = 0.25; // Start at morning (0 = midnight, 0.25 = sunrise, 0.5 = noon)
        this.dayDuration = 240; // 4 minutes for a full day-night cycle (testing)
        
        this.mouse = { x: 0, y: 0, buttons: 0 }; // Track mouse state for player attack

        this.initModules();
        this.setupEventListeners();
        this.loadAssetsAndStart();
    }

    initModules() {
        this.world = new World(this);
        this.water = new Water(this); // Pass game instance
        this.resources = new Resources(this);
        this.player = new Player(this); // Player now manages its own camera controls
        this.inventory = new Inventory(this);
        this.crafting = new CraftingSystem(this); // Renamed for clarity
        this.building = new BuildingSystem(this);
        this.animals = new AnimalSystem(this);
        this.structures = new StructuresSystem(this);
        this.ui = new UI(this);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        // Player class handles its own keydown/keyup for movement via PointerLockControls
        // Global key events for UI:
        document.addEventListener('keydown', this.onGlobalKeyDown.bind(this));
        document.addEventListener('keyup', this.onGlobalKeyUp.bind(this)); // For player specific non-movement keys

        this.renderer.domElement.addEventListener('click', () => {
            if (!this.paused && !this.player.controls.isLocked) {
                this.player.controls.lock();
            } else if (this.player.controls.isLocked && this.game.building.ghostObject) {
                 this.player.performPrimaryAction(); // Place building on click
            }
        });
        
        // Handle mouse down/up for continuous actions like attacking
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.player.controls.isLocked) { // Left mouse button
                this.player.performPrimaryAction();
            }
        });
    }

    async loadAssetsAndStart() {
        // Example asset loading (replace with actual asset paths from ItemData, AnimalData etc.)
        // AssetLoader.loadTexture('wood_icon', 'assets/items/wood.png');
        // AssetLoader.loadModel('tree_model', 'assets/models/tree.glb');
        // ... add all your assets
        
        // Simulate loading for now
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('progressFill');
        const loadingText = document.getElementById('loadingText');
        
        loadingText.textContent = "Loading assets...";
        await AssetLoader.loadAll().catch(err => console.error("Asset loading error:", err)); // Wait for all promises
        
        // Simulate world generation time
        loadingText.textContent = "Generating world...";
        progressBar.style.width = '33%';
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        this.world.generate();
        progressBar.style.width = '66%';
        await new Promise(resolve => setTimeout(resolve, 200));

        this.resources.spawnInitialResources();
        this.animals.spawnInitialAnimals();
        this.player.spawn();
        this.inventory.addItem('wooden_axe', 1); // Start with an axe
        this.inventory.addItem('wood', 10);
        this.inventory.addItem('stone', 5);
        this.inventory.addItem('apple', 3);
        this.ui.updateInventory();
        this.player.updateEquippedItem(); // Equip first item if any

        progressBar.style.width = '100%';
        loadingText.textContent = "Game ready!";
        await new Promise(resolve => setTimeout(resolve, 500));

        loadingScreen.style.display = 'none';
        this.paused = false;
        if (!this.player.controls.isLocked) {
            this.player.controls.lock(); // Lock controls when game starts
        }
        this.animate();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onGlobalKeyDown(event) {
        // Handle UI toggles first, only if game is not paused for death screen
        if (this.paused && !document.getElementById('gameOverScreen')) return; // Allow Esc for death screen if needed
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return; // Don't process game keys if typing in an input
        }


        // Player movement keys are handled by PointerLockControls and player class
        this.player.onKeyDown(event); // Pass for non-movement keys like R, F

        switch(event.key.toLowerCase()) {
            case 'e':
                if(this.player.controls.isLocked && this.getInteractableObject()) {
                    this.interactWithFocusedObject();
                } else {
                    this.ui.toggleInventory();
                }
                break;
            case 'c': this.ui.toggleCraftingMenu(); break;
            case 'b': this.ui.toggleBuildingMenu(); break;
            case 'escape':
                if (this.building.ghostObject) {
                    this.building.cancelPlacement();
                } else {
                    this.ui.closeAllMenus(); // This will also lock controls if no menu is open
                }
                break;
            // Quick slots 1-5
            case '1': case '2': case '3': case '4': case '5':
                this.inventory.selectQuickSlot(parseInt(event.key) - 1);
                break;
        }
    }
    onGlobalKeyUp(event) {
        // Pass to player for its key up logic (e.g., stop running)
        this.player.onKeyUp(event);
    }


    updateDayNightCycle(deltaTime) {
        this.gameTime += deltaTime;
        this.dayNightCycle = (this.gameTime % this.dayDuration) / this.dayDuration;
        // World update will handle lighting based on dayNightCycle
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        if (this.paused) { // Only update UI elements that should work when paused (e.g. death screen)
             this.stats.update(); // Update FPS counter
             return;
        }
        
        this.stats.begin();
        
        this.updateDayNightCycle(deltaTime);
        
        this.world.update(deltaTime); // Updates lighting, fog, etc.
        this.player.update(deltaTime);
        this.water.update(deltaTime);
        this.resources.update(deltaTime);
        this.animals.update(deltaTime);
        this.structures.update(deltaTime);
        this.building.update(deltaTime); // For ghost object updates
        
        this.checkInteractionFocus();
        
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
    }

    getInteractableObject() {
        if (!this.player.controls.isLocked) return null;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x: 0, y: 0 }, this.camera); // Center of screen
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        for (const hit of intersects) {
            // Ignore player, tool, ghost building object, water
            if (hit.object === this.player.playerObject || 
                (this.player.toolMesh && hit.object === this.player.toolMesh) ||
                (this.building.ghostObject && hit.object === this.building.ghostObject) ||
                hit.object.userData.isWater) continue;

            if (hit.distance <= this.player.interactionDistance) {
                 // Handle GLTF hierarchy: actual user data might be on parent
                let interactable = hit.object;
                if (interactable.parent && interactable.parent.userData && interactable.parent.userData.type) {
                    interactable = interactable.parent;
                }

                if (interactable.userData.type === 'resource' || 
                    interactable.userData.type === 'animal' || // For looting dead animals?
                    (interactable.userData.type === 'structure' && interactable.userData.interactive)) {
                    return interactable;
                }
            }
             // Important: if the first "real" object hit is not interactable or too far, stop.
            // This prevents interacting through walls.
            if (hit.distance > this.player.interactionDistance || 
                (hit.object !== this.player.playerObject && hit.object !== this.player.toolMesh)) {
                break;
            }
        }
        return null;
    }

    checkInteractionFocus() {
        const interactable = this.getInteractableObject();
        if (interactable) {
            let promptText = "Interact";
            if (interactable.userData.type === 'resource') promptText = `Harvest ${getItemData(interactable.userData.resourceId).name}`;
            else if (interactable.userData.type === 'structure') promptText = `Use ${this.building.buildables[interactable.userData.buildableId].name}`;
            else if (interactable.userData.type === 'animal' && interactable.userData.parentInstance.state === 'dead') promptText = `Loot ${interactable.userData.parentInstance.data.name}`;
            
            if (promptText !== "Interact" || (interactable.userData.type === 'structure' && interactable.userData.interactive)) {
                 this.ui.showInteractionPrompt(promptText);
            } else {
                this.ui.hideInteractionPrompt();
            }

        } else {
            this.ui.hideInteractionPrompt();
        }
    }

    interactWithFocusedObject() {
        const object = this.getInteractableObject();
        if (!object) return;

        if (object.userData.type === 'structure' && object.userData.interactive) {
            this.building.interactWithBuilding(object);
        } else if (object.userData.type === 'animal' && object.userData.parentInstance.state === 'dead') {
            // Looting already happens on kill, this could be for picking up a loot bag if implemented
            // this.animals.lootAnimal(object.userData.parentInstance);
            this.game.ui.showNotification(`Looted ${object.userData.parentInstance.data.name}.`); // Or specific items
        }
        // Harvesting is done via left-click/performPrimaryAction
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    window.gameInstance = game; // For debugging
});