//import * as THREE from './three.min.js';
//import { PointerLockControls } from './PointerLockControls.js';
// import { OrbitControls } from './OrbitControls.js'; // For debugging
import { World } from './world.js';
import { Player } from './player.js';
import { AnimalManager } from './animals.js';
import { UIManager } from './ui.js';
import { BuildingSystem } from './building.js';
import { CraftingSystem } from './crafting.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.collidables = []; // Array to store all collidable objects

        this.world = null;
        this.player = null;
        this.animalManager = null;
        this.uiManager = null;
        this.buildingSystem = null;
        this.craftingSystem = null;

        this.isPaused = false; // For menus

        this.init();
        this.animate();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Fog
        this.scene.fog = new THREE.Fog(0xcccccc, 100, 700); // color, near, far

        // Initialize Managers
        this.uiManager = new UIManager(this);
        this.craftingSystem = new CraftingSystem(this); // Pass game for player inventory access

        this.world = new World(this.scene, this.collidables);
        this.player = new Player(this.scene, this.camera, this.renderer.domElement, this.collidables, this.uiManager, this);
        this.animalManager = new AnimalManager(this.scene, this.collidables, this.world.waterLevel); // Pass water level
        this.buildingSystem = new BuildingSystem(this.scene, this.camera, this.collidables, this.player, this.uiManager);

        // Add initial player items
        this.player.inventory.addItem({ name: 'Axe', type: 'tool', quantity: 1 });
        this.player.inventory.addItem({ name: 'Pickaxe', type: 'tool', quantity: 1 });
        this.player.inventory.addItem({ name: 'Knife', type: 'tool', quantity: 1 });
        this.player.inventory.addItem({ name: 'Canteen', type: 'tool', quantity: 1, water: 0, capacity: 100 });
        this.uiManager.updateQuickBar();
        this.uiManager.updateInventory();


        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        document.addEventListener('keyup', (event) => this.onKeyUp(event), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onKeyDown(event) {
        this.player.handleKeyDown(event.key.toLowerCase());
        this.buildingSystem.handleKeyDown(event.key.toLowerCase());

        if (event.key.toLowerCase() === 'i') {
            if (this.uiManager.isInventoryOpen()) {
                this.uiManager.closeInventory();
                this.player.controls.lock();
                this.isPaused = false;
            } else {
                this.uiManager.openInventory();
                this.player.controls.unlock();
                this.isPaused = true;
            }
        }
        if (event.key.toLowerCase() === 'b') {
             if (this.uiManager.isBuildingMenuOpen()) {
                this.uiManager.closeBuildingMenu();
                this.buildingSystem.exitBuildMode();
                this.player.controls.lock();
                this.isPaused = false;
            } else {
                this.uiManager.openBuildingMenu();
                this.buildingSystem.enterBuildMode(); // A method to prepare for building
                this.player.controls.unlock(); // Might need controls unlocked or a special build mode
                this.isPaused = true;
            }
        }
        // 'E' for interaction is handled in player.js update via raycasting
    }

    onKeyUp(event) {
        this.player.handleKeyUp(event.key.toLowerCase());
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();

        if (!this.isPaused) {
            this.player.update(deltaTime, this.world.terrainMesh); // Pass terrain for ground collision
            this.animalManager.update(deltaTime, this.player.playerCollider.position, this.world.terrainMesh);
            this.world.update(deltaTime); // For animated water
            this.buildingSystem.updatePreview(); // If in build mode
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();