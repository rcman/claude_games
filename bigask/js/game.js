// Main Game Controller
class Game {
    constructor() {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Performance stats (optional)
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);

        // Game clock
        this.clock = new THREE.Clock();
        
        // Game state
        this.paused = false;
        this.gameTime = 0;
        this.dayNightCycle = 0; // 0-1 value representing time of day
        this.dayDuration = 600; // seconds for a full day-night cycle
        
        // Mouse control variables
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.selectedObject = null;
        this.interactionDistance = 5; // Distance player can interact with objects
        
        // Bind methods
        this.onWindowResize = this.onWindowResize.bind(this);
        this.animate = this.animate.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        // Initialize modules
        this.initModules();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start loading assets
        this.loadAssets();
    }

    initModules() {
        // Initialize world generation
        this.world = new World(this);
        
        // Initialize water system
        this.water = new Water(this);
        
        // Initialize resource manager
        this.resources = new Resources(this);
        
        // Initialize player
        this.player = new Player(this);
        
        // Initialize inventory system
        this.inventory = new Inventory(this);
        
        // Initialize crafting system
        this.crafting = new Crafting(this);
        
        // Initialize building system
        this.building = new Building(this);
        
        // Initialize animal/wildlife system
        this.animals = new Animals(this);
        
        // Initialize structures system (campfire, crafting table, etc.)
        this.structures = new Structures(this);
        
        // Initialize UI
        this.ui = new UI(this);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onWindowResize);
        
        // Mouse and keyboard events
        document.addEventListener('click', this.onClick);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Lock pointer for first-person controls
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
    }

    loadAssets() {
        // Simple asset loading simulation
        const totalAssets = 10;
        let loadedAssets = 0;
        
        const updateProgress = () => {
            loadedAssets++;
            const progress = (loadedAssets / totalAssets) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('loadingText').textContent = `Loading assets: ${loadedAssets}/${totalAssets}`;
            
            if (loadedAssets >= totalAssets) {
                setTimeout(() => {
                    document.getElementById('loadingScreen').style.display = 'none';
                    this.start();
                }, 500);
            } else {
                // Simulate loading time for next asset
                setTimeout(updateProgress, 200);
            }
        };
        
        // Start loading process
        updateProgress();
    }

    start() {
        // Initialize world
        this.world.generate();
        
        // Add water
        this.water.create();
        
        // Spawn resources
        this.resources.spawnInitialResources();
        
        // Spawn animals
        this.animals.spawnInitialAnimals();
        
        // Position player
        this.player.spawn();
        
        // Start game loop
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onClick(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const firstHit = intersects[0];
            
            // Check if hit is within interaction distance
            if (firstHit.distance <= this.interactionDistance) {
                const object = firstHit.object;
                
                // Check what type of object was hit and handle accordingly
                if (object.userData.type === 'resource') {
                    this.resources.harvestResource(object, firstHit.point);
                } else if (object.userData.type === 'animal') {
                    this.animals.attackAnimal(object);
                } else if (object.userData.type === 'structure') {
                    this.structures.interactWithStructure(object);
                } else if (this.building.isBuilding) {
                    this.building.placeStructure(firstHit.point, firstHit.face.normal);
                }
            }
        }
    }

    onKeyDown(event) {
        switch(event.code) {
            case 'KeyE':
                // Toggle inventory
                this.ui.toggleInventory();
                break;
            case 'KeyC':
                // Toggle crafting menu
                this.ui.toggleCraftingMenu();
                break;
            case 'KeyB':
                // Toggle building menu
                this.ui.toggleBuildingMenu();
                break;
            case 'Escape':
                // Close all menus
                this.ui.closeAllMenus();
                break;
            case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
                // Quick slot selection (1-5)
                const slotIndex = parseInt(event.code.replace('Digit', '')) - 1;
                this.inventory.selectQuickSlot(slotIndex);
                break;
        }
        
        // Pass key press to player for movement
        this.player.onKeyDown(event);
    }

    onKeyUp(event) {
        // Pass key release to player for movement
        this.player.onKeyUp(event);
    }

    updateDayNightCycle(deltaTime) {
        // Update day/night cycle
        this.gameTime += deltaTime;
        this.dayNightCycle = (this.gameTime % this.dayDuration) / this.dayDuration;
        
        // Update lighting based on time of day
        const sunIntensity = Math.sin(Math.PI * this.dayNightCycle);
        
        // Update directional light (sun)
        if (this.world.sunLight) {
            this.world.sunLight.intensity = Math.max(0.1, sunIntensity);
            
            // Update sun position
            const sunAngle = Math.PI * this.dayNightCycle;
            this.world.sunLight.position.x = Math.cos(sunAngle) * 100;
            this.world.sunLight.position.y = Math.sin(sunAngle) * 100;
        }
        
        // Change sky color based on time of day
        const nightColor = new THREE.Color(0x0a0a2a); // Dark blue
        const dayColor = new THREE.Color(0x87CEEB);   // Sky blue
        
        const skyColor = new THREE.Color();
        skyColor.lerpColors(nightColor, dayColor, Math.max(0, sunIntensity));
        this.scene.background = skyColor;
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        if (this.paused) return;
        
        // Start performance monitoring
        this.stats.begin();
        
        // Calculate delta time
        const deltaTime = this.clock.getDelta();
        
        // Update day/night cycle
        this.updateDayNightCycle(deltaTime);
        
        // Update all game systems
        this.player.update(deltaTime);
        this.water.update(deltaTime);
        this.resources.update(deltaTime);
        this.animals.update(deltaTime);
        this.structures.update(deltaTime);
        
        // Check for nearby interactable objects
        this.checkInteractions();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // End performance monitoring
        this.stats.end();
    }

    checkInteractions() {
        // Create a forward-facing raycaster from player's position
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.raycaster.set(this.player.position, direction);
        
        // Check for interactable objects
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        let foundInteractable = false;
        
        for (const hit of intersects) {
            if (hit.distance <= this.interactionDistance) {
                const object = hit.object;
                
                if (object.userData.type === 'resource' || 
                    object.userData.type === 'animal' || 
                    object.userData.type === 'structure') {
                    
                    // Show interaction prompt
                    this.ui.showInteractionPrompt(object.userData.name);
                    foundInteractable = true;
                    break;
                }
            }
        }
        
        if (!foundInteractable) {
            this.ui.hideInteractionPrompt();
        }
    }
}

// Initialize the game when window loads
window.addEventListener('load', () => {
    const game = new Game();
    window.gameInstance = game; // Store game instance globally for debugging
});