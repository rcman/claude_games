<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Survival Game</title>
    <style>
        body { 
            margin: 0; 
            overflow: hidden; 
            font-family: Arial, sans-serif;
        }
        canvas { 
            display: block; 
        }
        #loadingScreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            z-index: 1000;
        }
        #progressBar {
            width: 50%;
            height: 20px;
            background-color: #333;
            border-radius: 10px;
            margin: 20px 0;
            overflow: hidden;
        }
        #progressFill {
            height: 100%;
            background-color: #4CAF50;
            width: 0%;
            transition: width 0.3s;
        }
        #inventory, #craftingMenu, #buildingMenu, #storageMenu { /* Added #storageMenu */
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.85); /* Slightly more opaque */
            color: white;
            padding: 20px;
            border-radius: 5px;
            display: none;
            z-index: 100;
            width: 70%;
            max-width: 600px; /* Max width for larger screens */
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }
        .inventory-grid, .crafting-grid, .building-grid, .storage-grid { /* Added .storage-grid */
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); /* Responsive columns */
            gap: 10px;
            margin-top: 10px;
        }
        .inventory-slot, .crafting-item, .building-item {
            width: 60px;
            height: 60px;
            background-color: #333;
            border: 1px solid #555;
            display: flex;
            flex-direction: column; /* Allow text below image */
            justify-content: center;
            align-items: center;
            position: relative;
            cursor: pointer;
            font-size: 10px; /* For item names below image */
            overflow: hidden; /* Prevent text overflow */
            text-align: center;
        }
        .inventory-slot:hover, .crafting-item:hover, .building-item:hover {
            border-color: #888;
            background-color: #444;
        }
        .inventory-slot img, .crafting-item img, .building-item img {
            max-width: 40px; /* Smaller image for text */
            max-height: 40px;
            margin-bottom: 2px;
        }
        .item-name-tooltip { /* For items that only show icon in grid */
            display: none;
            position: absolute;
            bottom: 100%; /* Position above the slot */
            left: 50%;
            transform: translateX(-50%) translateY(-5px); /* Adjust as needed */
            background-color: rgba(0,0,0,0.9);
            color: white;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 10px;
            white-space: nowrap;
            z-index: 1002;
        }
        .inventory-slot:hover .item-name-tooltip {
            display: block;
        }
        .unavailable {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .tooltip-text { /* For crafting/building requirements */
            display: none;
            position: fixed; /* Use fixed to avoid being clipped by parent */
            background-color: rgba(0,0,0,0.9);
            color: white;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1002; /* High z-index */
            pointer-events: none; /* Prevent tooltip from capturing mouse events */
            border: 1px solid #555;
        }
        .item-count {
            position: absolute;
            bottom: 2px;
            right: 2px;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 2px 4px;
            font-size: 10px;
            border-radius: 3px;
        }
        #quickBar {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 5px;
            z-index: 10;
        }
        .quick-slot {
            width: 60px;
            height: 60px;
            background-color: rgba(0, 0, 0, 0.6);
            border: 1px solid #555;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }
        .quick-slot img {
            max-width: 50px;
            max-height: 50px;
        }
        .selected {
            border: 2px solid #4CAF50 !important; /* Ensure it overrides other borders */
        }
        #interactionPrompt {
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7); /* More visible */
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            display: none;
            z-index: 10;
            font-size: 14px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
        #playerStats {
            position: absolute;
            top: 20px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10;
        }
        .stat-bar {
            width: 150px;
            height: 15px;
            background-color: #333;
            border-radius: 7px;
            margin: 5px 0;
            overflow: hidden;
            border: 1px solid #222;
        }
        .stat-fill {
            height: 100%;
            border-radius: 7px 0 0 7px; /* Round only left if not full */
            transition: width 0.3s ease-out;
        }
        #health-fill { background-color: #e74c3c; }
        #hunger-fill { background-color: #f39c12; }
        #thirst-fill { background-color: #3498db; }

        #campfireMenu, #craftingTableMenu, #forgeMenu { /* Can be combined with main menu styles */
            /* These are mostly covered by the general #inventory, #craftingMenu styles now */
        }
        .structure-slots {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); /* Larger slots for structures */
            gap: 10px;
            margin-top: 15px;
        }
        .structure-slots .inventory-slot { /* Override for structure slots if needed */
            width: 80px;
            height: 80px;
        }
        .structure-slots .inventory-slot img {
            max-width: 60px;
            max-height: 60px;
        }

        .progress-circle {
            position: absolute;
            width: 100%; /* Fill slot */
            height: 100%;
            transform: rotate(-90deg);
            top: 0; left: 0;
        }
        .progress-circle circle {
            fill: none;
            stroke-width: 8; /* Thicker progress */
        }
        .progress-bg { stroke: #555; } /* Darker bg */
        .progress-fill {
            stroke: #4CAF50;
            stroke-dasharray: 157; /* 2π × 25 (radius of circle in SVG viewport) */
            stroke-dashoffset: 157; 
            transition: stroke-dashoffset 0.1s linear;
        }
        /* Close button for menus */
        .close-menu-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            font-size: 16px;
            line-height: 25px;
            text-align: center;
            cursor: pointer;
        }
        .close-menu-btn:hover {
            background: #c0392b;
        }
        /* Recipe option in popup */
        .recipe-option {
            padding: 8px;
            cursor: pointer;
            border-bottom: 1px solid #444;
            display: flex;
            align-items: center;
        }
        .recipe-option:last-child {
            border-bottom: none;
        }
        .recipe-option:hover {
            background-color: #555;
        }

        /* Storage Menu Specific */
        #storageMenu .inventory-grid { /* Player's inventory side */
            margin-bottom: 20px;
            border-bottom: 1px solid #555;
            padding-bottom: 20px;
        }
        #storageMenu h3 {
            margin-top: 0;
        }
    </style>
</head>
<body>
    <div id="loadingScreen">
        <h1>Loading Survival Game</h1>
        <div id="progressBar">
            <div id="progressFill"></div>
        </div>
        <p id="loadingText">Preparing world...</p>
    </div>

    <div id="playerStats">
        <div>Health</div>
        <div class="stat-bar">
            <div id="health-fill" class="stat-fill" style="width: 100%"></div>
        </div>
        <div>Hunger</div>
        <div class="stat-bar">
            <div id="hunger-fill" class="stat-fill" style="width: 100%"></div>
        </div>
        <div>Thirst</div>
        <div class="stat-bar">
            <div id="thirst-fill" class="stat-fill" style="width: 100%"></div>
        </div>
    </div>

    <div id="quickBar"></div>
    <div id="interactionPrompt"></div>

    <div id="inventory">
        <button class="close-menu-btn" onclick="gameInstance.ui.toggleInventory()">X</button>
        <h2>Inventory</h2>
        <div class="inventory-grid" id="inventoryGrid"></div>
    </div>

    <div id="craftingMenu">
        <button class="close-menu-btn" onclick="gameInstance.ui.toggleCraftingMenu()">X</button>
        <h2>Crafting</h2>
        <div class="crafting-grid" id="craftingGrid"></div>
    </div>

    <div id="buildingMenu">
        <button class="close-menu-btn" onclick="gameInstance.ui.toggleBuildingMenu()">X</button>
        <h2>Building</h2>
        <div class="building-grid" id="buildingGrid"></div>
    </div>
    
    <!-- Storage Menu -->
    <div id="storageMenu">
        <!-- Content will be generated by UI.js -->
    </div>


    <div id="campfireMenu">
        <!-- Content generated by StructuresSystem/UI.js -->
    </div>

    <div id="craftingTableMenu">
        <!-- This might be unused if craftingMenu is repurposed, or can be its own structure -->
        <!-- Content generated by StructuresSystem/UI.js -->
    </div>

    <div id="forgeMenu">
        <!-- Content generated by StructuresSystem/UI.js -->
    </div>

    <!-- Load libraries -->
    <script src="three.min.js"></script>
    <script src="Stats.min.js"></script>

    <!-- Load game modules -->
    <script src="js/utils.js"></script>
    <script src="js/items.js"></script> <!-- Moved items.js up -->
    <script src="js/water.js"></script>
    <script src="js/world.js"></script>
    <script src="js/resources.js" type="module"></script> <!-- Added type="module" for GLTFLoader import -->
    <script src="js/player.js" type="module"></script> <!-- Added type="module" for PointerLockControls import -->
    <script src="js/inventory.js"></script>
    <script src="js/crafting.js"></script>
    <script src="js/building.js" type="module"></script> <!-- Added type="module" for GLTFLoader import -->
    <script src="js/animals.js" type="module"></script> <!-- Added type="module" for GLTFLoader import -->
    <script src="js/structures.js"></script>
    <script src="js/ui.js"></script>
    <script src="js/game.js" type="module"></script> <!-- game.js might import from module files or use globals -->
</body>
</html>
```
**Changes in `index.html`:**
*   Moved `js/items.js` to be loaded earlier.
*   Added `type="module"` to script tags for `player.js`, `building.js`, `resources.js`, `animals.js`, and `game.js` because they will use ES6 module `import` statements (for `PointerLockControls`, `GLTFLoader`, or if `game.js` imports from other modules).
*   Added `#storageMenu` div for the storage UI.
*   Added `.close-menu-btn` styling and example buttons to menus.
*   Minor style enhancements for UI elements (shadows, responsive grids, tooltips).

--- START OF FILE utils.js ---
```javascript
// Utility functions for the game

// Helper function for random number generation
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simplex Noise contribution from Stefan Gustavson's paper
// Adapted for this project
class Noise {
    constructor(random) {
        if (random === undefined) random = Math.random;
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);

        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }

        for (let i = 255; i > 0; i--) {
            const r = Math.floor(random() * (i + 1));
            const tmp = this.p[i];
            this.p[i] = this.p[r];
            this.p[r] = tmp;
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    static grad3 = new Float32Array([
        1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
        1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
        0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
    ]);

    static F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    static G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    static F3 = 1.0 / 3.0;
    static G3 = 1.0 / 6.0;

    dot(g, x, y) { return g[0] * x + g[1] * y; }
    dot3D(g, x, y, z) { return g[0] * x + g[1] * y + g[2] * z; }


    noise2D(xin, yin) {
        let n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        const s = (xin + yin) * Noise.F2; // Hairy factor for 2D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * Noise.G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = xin - X0; // The x,y distances from the cell origin
        const y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second corner of simplex in (i,j) coords
        if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1; }      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + Noise.G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + Noise.G2;
        const x2 = x0 - 1.0 + 2.0 * Noise.G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * Noise.G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
            n0 = t0 * t0 * this.dot3D(Noise.grad3.slice(gi0, gi0 + 3), x0, y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
            n1 = t1 * t1 * this.dot3D(Noise.grad3.slice(gi1, gi1 + 3), x1, y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;
            n2 = t2 * t2 * this.dot3D(Noise.grad3.slice(gi2, gi2 + 3), x2, y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
    // Add 3D noise if needed, similar structure.
}


// Load a texture and return a promise
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            path,
            texture => resolve(texture),
            undefined,
            error => {
                console.error(`Failed to load texture: ${path}`, error);
                reject(error);
            }
        );
    });
}

// Load a 3D model (GLTF) and return a promise
function loadGLTFModel(path, loaderInstance) { // Pass GLTFLoader instance
    return new Promise((resolve, reject) => {
        loaderInstance.load(
            path,
            gltf => resolve(gltf), // Resolve with the full GLTF object
            undefined,
            error => {
                console.error(`Failed to load GLTF model: ${path}`, error);
                reject(error);
            }
        );
    });
}


// Check if a ray intersects with a box (AABB)
function rayIntersectsBox(ray, box) {
    // box is THREE.Box3
    return ray.intersectsBox(box); // Three.js Ray has this method
}

// Collision detection between two objects with bounding boxes
function checkCollision(obj1, obj2) {
    obj1.updateMatrixWorld(); // Ensure world matrices are up to date
    obj2.updateMatrixWorld();

    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    
    return box1.intersectsBox(box2);
}

// Distance between two 3D points (Vector3)
function distance(point1, point2) {
    return point1.distanceTo(point2);
}

// Generate a random position within the world bounds
function randomPosition(worldSize) {
    return new THREE.Vector3(
        (Math.random() * worldSize) - worldSize / 2,
        0, // Y will be set based on terrain height
        (Math.random() * worldSize) - worldSize / 2
    );
}

// Check if a point is in water
function isInWater(position, waterLevel) {
    return position.y < waterLevel;
}

// Debug helper - add a sphere at a position
function addDebugSphere(scene, position, color = 0xff0000, size = 0.5) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    scene.add(sphere);
    return sphere;
}


// Generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Global event bus (simple implementation)
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    
    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }
    
    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}
const eventBus = new EventEmitter();


// Keep track of loaded assets (Simplified for this context, full GLTFLoader handled per-module)
const AssetLoader = {
    textures: {},
    loadingPromises: [], // Array of promises for texture loading
    
    // Note: GLTF models are often loaded directly in their respective systems (Building, Resources, Animals)
    // because they might need specific setup or access to the full GLTF object.

    loadTexture: function(name, path) {
        const promise = loadTexture(path).then(texture => {
            this.textures[name] = texture;
            console.log(`Texture loaded: ${name}`);
            return texture;
        }).catch(err => {
            console.warn(`Failed to load texture ${name} from ${path}`);
            // Optionally return a placeholder texture or re-throw
            return null; 
        });
        this.loadingPromises.push(promise);
        return promise;
    },
    
    getTexture: function(name) {
        return this.textures[name];
    },
    
    loadAllTextures: function() { // Specific for textures managed here
        return Promise.all(this.loadingPromises);
    }
};
```
**Changes in `utils.js`:**
*   Replaced the previous `Noise` class with a more standard Simplex Noise implementation. `world.js` will use this.
*   Renamed `loadModel` to `loadGLTFModel` and it now expects a `GLTFLoader` instance to be passed in, resolving with the full GLTF object (scene, animations, etc.). This is more flexible.
*   `rayIntersectsBox`: Simplified to use Three.js built-in `Ray.intersectsBox()`.
*   `distance`: Simplified to use Three.js `Vector3.distanceTo()`.
*   `AssetLoader`: Clarified that it's mainly for textures here; complex models like GLTF are usually loaded within the systems that use them, passing a `GLTFLoader` instance. `loadAllTextures` method added.
*   Error handling in `loadTexture` and `loadGLTFModel`.

--- START OF FILE items.js ---
```javascript
// js/items.js

const ItemData = {
    // Resources
    'wood': { name: 'Wood', icon: 'assets/items/wood.png', stack: 50, type: 'resource' },
    'stone': { name: 'Stone', icon: 'assets/items/stone.png', stack: 50, type: 'resource' },
    'stick': { name: 'Stick', icon: 'assets/items/stick.png', stack: 50, type: 'resource' }, // Often a byproduct or specific harvest
    'fiber': { name: 'Fiber', icon: 'assets/items/fiber.png', stack: 50, type: 'resource' },
    'iron_ore': { name: 'Iron Ore', icon: 'assets/items/iron_ore.png', stack: 50, type: 'resource' },
    'flint': { name: 'Flint', icon: 'assets/items/flint.png', stack: 50, type: 'resource' },
    'leather': { name: 'Leather', icon: 'assets/items/leather.png', stack: 20, type: 'material' },
    'wolf_pelt': { name: 'Wolf Pelt', icon: 'assets/items/wolf_pelt.png', stack: 10, type: 'material' },
    'wolf_fang': { name: 'Wolf Fang', icon: 'assets/items/wolf_fang.png', stack: 10, type: 'material' },
    'rabbit_fur': { name: 'Rabbit Fur', icon: 'assets/items/rabbit_fur.png', stack: 20, type: 'material' },
    'bear_pelt': { name: 'Bear Pelt', icon: 'assets/items/bear_pelt.png', stack: 5, type: 'material' },
    'bear_claw': { name: 'Bear Claw', icon: 'assets/items/bear_claw.png', stack: 10, type: 'material' },
    'feather': { name: 'Feather', icon: 'assets/items/feather.png', stack: 50, type: 'material' },
    'iron_ingot': { name: 'Iron Ingot', icon: 'assets/items/iron_ingot.png', stack: 30, type: 'material' },
    'rope': { name: 'Rope', icon: 'assets/items/rope.png', stack: 20, type: 'material' },
    'herbs': { name: 'Herbs', icon: 'assets/items/herbs.png', stack: 20, type: 'material' }, // For tea

    // Food
    'apple': { name: 'Apple', icon: 'assets/items/apple.png', stack: 10, type: 'food', hungerValue: 10, thirstValue: 2 },
    'berries': { name: 'Berries', icon: 'assets/items/berries.png', stack: 20, type: 'food', hungerValue: 5, thirstValue: 1 },
    'raw_meat': { name: 'Raw Meat', icon: 'assets/items/raw_meat.png', stack: 10, type: 'food', hungerValue: 5, healthValue: -5 }, // Eating raw meat is bad
    'raw_fish': { name: 'Raw Fish', icon: 'assets/items/raw_fish.png', stack: 10, type: 'food', hungerValue: 4, healthValue: -3 },
    'cooked_meat': { name: 'Cooked Meat', icon: 'assets/items/cooked_meat.png', stack: 10, type: 'food', hungerValue: 25, healthValue: 5 },
    'cooked_fish': { name: 'Cooked Fish', icon: 'assets/items/cooked_fish.png', stack: 10, type: 'food', hungerValue: 20, healthValue: 3 },
    
    // Consumables (Drinks, Potions)
    'empty_water_container': { name: 'Empty Water Container', icon: 'assets/items/empty_water_container.png', stack: 5, type: 'container'},
    'filled_water_container': { name: 'Water Container (Full)', icon: 'assets/items/water_container.png', stack: 1, type: 'consumable', thirstValue: 30, emptyTo: 'empty_water_container' },
    'herb_tea': { name: 'Herb Tea', icon: 'assets/items/herb_tea.png', stack: 5, type: 'consumable', thirstValue: 20, healthValue: 10, emptyTo: 'empty_water_container' },


    // Tools
    'wooden_axe': { name: 'Wooden Axe', icon: 'assets/items/wooden_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 2, durability: 50, maxDurability: 50 },
    'wooden_pickaxe': { name: 'Wooden Pickaxe', icon: 'assets/items/wooden_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 2, durability: 50, maxDurability: 50 },
    'stone_axe': { name: 'Stone Axe', icon: 'assets/items/stone_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 4, durability: 100, maxDurability: 100 },
    'stone_pickaxe': { name: 'Stone Pickaxe', icon: 'assets/items/stone_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 4, durability: 100, maxDurability: 100 },
    'iron_axe': { name: 'Iron Axe', icon: 'assets/items/iron_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 8, durability: 200, maxDurability: 200 },
    'iron_pickaxe': { name: 'Iron Pickaxe', icon: 'assets/items/iron_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 8, durability: 200, maxDurability: 200 },
    'torch': { name: 'Torch', icon: 'assets/items/torch.png', stack: 10, type: 'tool', equippable: true, lightSource: { color: 0xffaa33, intensity: 0.8, distance: 12, decay: 2 } }, // Added decay for PointLight

    // Weapons
    'wooden_sword': { name: 'Wooden Sword', icon: 'assets/items/wooden_sword.png', stack: 1, type: 'weapon', damage: 5, durability: 60, maxDurability: 60 },
    'stone_sword': { name: 'Stone Sword', icon: 'assets/items/stone_sword.png', stack: 1, type: 'weapon', damage: 8, durability: 120, maxDurability: 120 },
    'iron_sword': { name: 'Iron Sword', icon: 'assets/items/iron_sword.png', stack: 1, type: 'weapon', damage: 15, durability: 250, maxDurability: 250 },
    'bow': { name: 'Bow', icon: 'assets/items/bow.png', stack: 1, type: 'weapon', damage: 10, range: 30, durability: 80, maxDurability: 80, requiresAmmo: 'arrow' },
    'arrow': { name: 'Arrow', icon: 'assets/items/arrow.png', stack: 20, type: 'ammo' },

    // Armor
    'leather_armor': { name: 'Leather Armor', icon: 'assets/items/leather_armor.png', stack: 1, type: 'armor', defense: 5, slot: 'body', durability: 100, maxDurability: 100 },
    'iron_armor': { name: 'Iron Armor', icon: 'assets/items/iron_armor.png', stack: 1, type: 'armor', defense: 10, slot: 'body', durability: 200, maxDurability: 200 },

    // Placeables / Structures (these are crafted into inventory then placed)
    // The 'id' here is the item ID. 'buildableId' links to BuildingSystem config.
    'campfire_item': { name: 'Campfire Kit', icon: 'assets/structures/campfire.png', stack: 5, type: 'placeable', buildableId: 'campfire' },
    'crafting_table_item': { name: 'Crafting Table Kit', icon: 'assets/structures/crafting_table.png', stack: 5, type: 'placeable', buildableId: 'crafting_table' },
    'forge_item': { name: 'Forge Kit', icon: 'assets/structures/forge.png', stack: 5, type: 'placeable', buildableId: 'forge' },
    'wooden_wall_item': { name: 'Wooden Wall Section', icon: 'assets/structures/wooden_wall.png', stack: 20, type: 'placeable', buildableId: 'wooden_wall' },
    'wooden_floor_item': { name: 'Wooden Floor Section', icon: 'assets/structures/wooden_floor.png', stack: 20, type: 'placeable', buildableId: 'wooden_floor' },
    'wooden_door_item': { name: 'Wooden Doorway', icon: 'assets/structures/wooden_door.png', stack: 5, type: 'placeable', buildableId: 'wooden_door' },
    'storage_box_item': { name: 'Storage Box Kit', icon: 'assets/structures/storage_box.png', stack: 5, type: 'placeable', buildableId: 'storage_box' },

    // Default/Error item
    'unknown': { name: 'Unknown Item', icon: 'assets/items/unknown.png', stack: 1, type: 'unknown' }
};

function getItemData(itemId) {
    const data = ItemData[itemId];
    if (data) {
        // Return a copy to prevent accidental modification of the original data, especially for durability
        return { ...data }; 
    }
    console.warn(`ItemData not found for ID: ${itemId}. Returning 'unknown'.`);
    return { ...ItemData['unknown'] }; // Return a copy of unknown
}
```
**Changes in `items.js`:**
*   Added `maxDurability` to tools, weapons, armor.
*   Differentiated item IDs for placeable structures (e.g., `campfire_item`) from their `buildableId` (e.g., `campfire`) to avoid conflicts if an item and a buildable structure definition shared an ID. The crafting recipes should output these `_item` suffixed IDs.
*   Added `empty_water_container` and `filled_water_container` and `emptyTo` property for consumables that leave an empty container.
*   `getItemData` now returns a shallow copy of the item's data. This is crucial for items with instance-specific properties like durability, so modifying one instance in an inventory slot doesn't affect the base template or other instances.

--- START OF FILE game.js ---
```javascript
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
```
**Changes in `game.js`:**
*   Corrected class instantiations (e.g., `CraftingSystem`).
*   Made `loadAssetsAndStart` async and added more structure for asset loading phases.
*   Refined `onGlobalKeyDown` for 'E' key interaction to first check `getInteractableObject`.
*   `getInteractableObject` improved to traverse up the parent hierarchy for GLTF models to find `userData.type`.
*   `checkInteractionFocus` and `interactWithFocusedObject` use the name from the respective system's config (building, resources, animals).
*   Moved day/night cycle logic into `updateGameLogic` and passed relevant params to `world.update`.
*   Basic mouse button state tracking.
*   `animate` loop structure slightly adjusted for pause handling.
*   `renderer.domElement.addEventListener('click', ...)` refined for placing buildings.
*   Error handling in `loadAssetsAndStart`.

--- START OF FILE player.js ---
```javascript
// js/player.js
import { PointerLockControls } from './libs/PointerLockControls.js'; // Adjust path as needed

class Player {
    constructor(game) {
        this.game = game;
        
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.maxHunger = 100;
        this.thirst = 100;
        this.maxThirst = 100;
        
        this.moveSpeed = 4.5; // Slightly increased
        this.runSpeed = 7.5;
        this.jumpStrength = 8.0; // Impulse strength for jump
        this.gravity = -25; 
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isOnGround = false;
        this.isRunning = false;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = true; // Replaces wantsToJump, simpler for direct jump on space
        
        this.playerHeight = 1.8; // Actual height of player capsule
        this.eyeLevel = 1.6;   // Camera height from feet
        this.radius = 0.4;
        
        // Player object (capsule/collision body, origin at feet)
        this.playerObject = new THREE.Object3D();
        // Camera is a child of playerObject, positioned at eye level
        this.game.camera.position.set(0, this.eyeLevel, 0);
        this.playerObject.add(this.game.camera);
        this.game.scene.add(this.playerObject);
        
        this.position = this.playerObject.position; // Player's base (feet) position
        
        this.controls = new PointerLockControls(this.game.camera, this.game.renderer.domElement);
        
        this.hungerDecreaseRate = 0.1; // Per second (slower)
        this.thirstDecreaseRate = 0.15; // Per second (slower)
        
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackCooldownTime = 0.5; // Seconds
        this.toolSwingAnimation = null; // To manage ongoing animation
        
        this.equippedItem = null; // Full item object from inventory {id, count, durability?}
        this.equippedItemData = null; // Static data from ItemData
        this.toolMesh = null; 
        this.createToolModel();

        this.raycaster = new THREE.Raycaster(); // Player's own raycaster for actions
        this.interactionDistance = 3.5; 
        this.attackDistance = 2.8; 
    }

    createToolModel() {
        const toolGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1); // Basic stick shape
        const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.2 });
        this.toolMesh = new THREE.Mesh(toolGeometry, toolMaterial);
        this.toolMesh.castShadow = true;
        // Position relative to camera - slightly to the right and forward
        this.toolMesh.position.set(0.35, -0.3, -0.5); 
        this.toolMesh.rotation.z = Math.PI / 8; // Slight angle
        this.toolMesh.visible = false;
        this.game.camera.add(this.toolMesh); 
    }

    spawn() {
        const spawnPos = this.findSpawnPosition();
        this.playerObject.position.copy(spawnPos);
        // PlayerObject origin is at feet, so Y is terrain height
        
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        this.velocity.set(0,0,0);
        
        this.updateStatsUI();
        if (!this.controls.isLocked && !this.game.ui.isAnyMenuOpen()) {
            this.controls.lock();
        }
    }

    findSpawnPosition() {
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;
        for (let i = 0; i < 50; i++) { 
            const x = getRandomFloat(-worldSize / 2 + 5, worldSize / 2 - 5); // Avoid edges
            const z = getRandomFloat(-worldSize / 2 + 5, worldSize / 2 - 5);
            const y = this.game.world.getHeightAt(x, z);
            if (y > waterLevel + 0.5) { 
                return new THREE.Vector3(x, y, z);
            }
        }
        // Fallback: Center of the map, hope it's land
        const fallbackY = this.game.world.getHeightAt(0,0);
        return new THREE.Vector3(0, fallbackY > waterLevel ? fallbackY : waterLevel + 0.5, 0);
    }

    onKeyDown(event) {
        // Movement keys are captured by PointerLockControls internally for camera,
        // but we still need to set our move flags.
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
            case 'Space': 
                if (this.isOnGround && this.canJump && this.controls.isLocked) {
                    this.velocity.y = this.jumpStrength;
                    this.isOnGround = false;
                    this.canJump = false; // Prevent double jump until key up
                }
                break;
            case 'ShiftLeft': 
                if (this.controls.isLocked) this.isRunning = true; 
                break;
            case 'KeyR': 
                if (this.game.building.ghostObject && this.controls.isLocked) {
                    this.game.building.rotateGhost();
                }
                break;
            // KeyF for primary action is often handled by mousedown or specific game.js global keydown
            // This is for player-specific non-movement, non-UI actions triggered by player.js itself
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
            case 'ShiftLeft': this.isRunning = false; break;
            case 'Space': this.canJump = true; break; // Allow jumping again
        }
    }
    
    performPrimaryAction() { // Corresponds to left mouse click or a dedicated action key
        if (this.game.ui.isAnyMenuOpen() || this.game.paused) return; // Don't act if menu open or game paused

        if (this.game.building.ghostObject && this.game.building.selectedBuildable) {
            if (this.game.building.placeBuildable()) { // placeBuildable will consume item
                // Notification is good, maybe a sound
                // Check if player has more items to continue building
                const itemToBuildWith = this.game.building.selectedBuildable.item; // The item used for building
                if (!this.game.inventory.hasItem(itemToBuildWith.id, 1)) {
                     this.game.building.cancelPlacement();
                } else {
                    this.game.building.updateGhostPosition(); // Refresh ghost for next placement
                }
            } else {
                this.game.ui.showNotification("Cannot place here.");
            }
            return;
        }
        
        if (this.attackCooldown > 0) return;
        this.isAttacking = true;
        this.attackCooldown = this.attackCooldownTime;
        this.animateToolSwing();

        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.game.camera);
        
        // Collect all potential targets: resources and animals
        const potentialTargets = [...this.game.resources.activeResources, ...this.game.animals.animals.map(a => a.mesh)];
        const intersects = this.raycaster.intersectObjects(potentialTargets, true); // true for recursive

        let targetHit = false;
        if (intersects.length > 0) {
            for (const hit of intersects) {
                if (hit.object === this.playerObject || (this.toolMesh && hit.object === this.toolMesh)) continue;
                if (hit.object.userData.isWater) continue;

                let actualHitObject = hit.object;
                // Traverse up to find the parent with actual game data if part of complex model
                while (actualHitObject.parent && !actualHitObject.userData.type) {
                    if (actualHitObject.parent === this.game.scene) break; // Stop at scene root
                    actualHitObject = actualHitObject.parent;
                }

                const distance = hit.distance; // Distance to the actual intersected face
                const objectUserData = actualHitObject.userData;

                if (objectUserData.type === 'resource' && distance <= this.interactionDistance) {
                    this.game.resources.harvestResource(actualHitObject, hit.point, this.equippedItem); // Pass full item
                    targetHit = true;
                    break; 
                } else if (objectUserData.type === 'animal' && objectUserData.animalInstanceId && distance <= this.attackDistance) {
                    const damage = this.equippedItemData ? (this.equippedItemData.damage || 1) : 1;
                    this.game.animals.attackAnimalById(objectUserData.animalInstanceId, damage);
                    targetHit = true;
                    break;
                }
                // Prevent interacting through walls by breaking on first "solid" non-target hit
                if (distance <= Math.min(this.interactionDistance, this.attackDistance)) break;
            }
        }
         if (!targetHit && this.equippedItemData && (this.equippedItemData.type === 'tool' || this.equippedItemData.type === 'weapon')) {
             // Play an air swing sound
         }
    }
    
    performSecondaryAction() { // E.g., Right mouse click
        if (this.game.ui.isAnyMenuOpen() || this.game.paused) return;
        // Example: Aiming, blocking, alternative tool use
        // if (this.equippedItemData && this.equippedItemData.id === 'bow') // Aim bow
        this.game.ui.showNotification("Secondary action (not implemented)");
    }

    animateToolSwing() {
        if (!this.toolMesh || !this.toolMesh.visible || this.toolSwingAnimation) return;

        const startRotation = this.toolMesh.rotation.clone();
        const startPosition = this.toolMesh.position.clone();
        const swingAngleX = -Math.PI / 1.5; 
        const swingAngleZ = Math.PI / 4;
        const forwardOffset = -0.2;

        let progress = 0;
        const duration = this.attackCooldownTime * 0.7; 

        const animate = () => {
            const deltaTime = this.game.clock.getDelta(); // Use game clock's delta
            progress += deltaTime / duration;

            if (progress >= 1) {
                this.toolMesh.rotation.copy(startRotation);
                this.toolMesh.position.copy(startPosition);
                this.isAttacking = false;
                this.toolSwingAnimation = null;
                return;
            }
            
            const easedProgress = Math.sin(progress * Math.PI); // Sin wave for smooth in-out
            this.toolMesh.rotation.x = startRotation.x + easedProgress * swingAngleX;
            this.toolMesh.rotation.z = startRotation.z - easedProgress * swingAngleZ; // Swing a bit sideways too
            this.toolMesh.position.z = startPosition.z + easedProgress * forwardOffset;


            this.toolSwingAnimation = requestAnimationFrame(animate);
        };
        this.toolSwingAnimation = requestAnimationFrame(animate);
    }

    updateMovement(deltaTime) {
        const currentSpeed = (this.isRunning ? this.runSpeed : this.moveSpeed);
        
        // Apply gravity
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * deltaTime;
        }

        this.direction.set(0, 0, 0);
        if (this.moveForward) this.direction.z = -1;
        if (this.moveBackward) this.direction.z = 1;
        if (this.moveLeft) this.direction.x = -1;
        if (this.moveRight) this.direction.x = 1;

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
            // Get camera's forward and right vectors, ignore Y component for planar movement
            const forward = new THREE.Vector3();
            this.game.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3().crossVectors(this.game.camera.up, forward).normalize(); // Right is up X forward

            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(forward, -this.direction.z); // Negate Z because camera forward is -Z
            moveDirection.addScaledVector(right, this.direction.x);
            moveDirection.normalize();
            
            this.velocity.x = moveDirection.x * currentSpeed;
            this.velocity.z = moveDirection.z * currentSpeed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        this.playerObject.position.x += this.velocity.x * deltaTime;
        this.playerObject.position.y += this.velocity.y * deltaTime;
        this.playerObject.position.z += this.velocity.z * deltaTime;


        // Ground collision and stepping (very basic)
        const groundHeight = this.game.world.getHeightAt(this.playerObject.position.x, this.playerObject.position.z);
        const stepHeight = 0.5; // How high player can step up

        if (this.playerObject.position.y < groundHeight) {
            if (this.velocity.y < 0 && groundHeight - this.playerObject.position.y < stepHeight) { // Stepping up
                this.playerObject.position.y = groundHeight;
                this.velocity.y = 0;
                this.isOnGround = true;
            } else if (this.velocity.y < 0) { // Fell below terrain or hit a wall from underneath
                this.playerObject.position.y = groundHeight; // Snap to ground
                this.velocity.y = 0;
                this.isOnGround = true;
            }
        } else if (this.playerObject.position.y - groundHeight < 0.1 && this.velocity.y <=0) { // Close to ground and not moving up
             this.playerObject.position.y = groundHeight;
             this.velocity.y = 0;
             this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }


        // World bounds collision
        const worldBoundary = this.game.world.size / 2 - this.radius;
        this.playerObject.position.x = Math.max(-worldBoundary, Math.min(worldBoundary, this.playerObject.position.x));
        this.playerObject.position.z = Math.max(-worldBoundary, Math.min(worldBoundary, this.playerObject.position.z));

        if (this.isRunning && this.direction.lengthSq() > 0) {
            this.hunger -= this.hungerDecreaseRate * 2.0 * deltaTime; 
            this.thirst -= this.thirstDecreaseRate * 2.0 * deltaTime;
        }
    }


    updateStats(deltaTime) {
        this.hunger = Math.max(0, this.hunger - this.hungerDecreaseRate * deltaTime);
        this.thirst = Math.max(0, this.thirst - this.thirstDecreaseRate * deltaTime);
        
        if (this.hunger <= 0) {
            this.takeDamage(1 * deltaTime, "starvation"); // Damage per second
        }
        if (this.thirst <= 0) {
            this.takeDamage(1.5 * deltaTime, "dehydration"); 
        }
        
        // Slow health regeneration if hunger/thirst are high
        if (this.health < this.maxHealth && this.hunger > 70 && this.thirst > 70) {
            this.health = Math.min(this.maxHealth, this.health + 1 * deltaTime);
        }

        if (this.health <= 0 && !this.game.paused) { 
            this.die();
        }
        this.updateStatsUI();
    }

    updateStatsUI() {
        const healthFill = document.getElementById('health-fill');
        const hungerFill = document.getElementById('hunger-fill');
        const thirstFill = document.getElementById('thirst-fill');

        if (healthFill) healthFill.style.width = `${Math.max(0,(this.health / this.maxHealth) * 100)}%`;
        if (hungerFill) hungerFill.style.width = `${Math.max(0,(this.hunger / this.maxHunger) * 100)}%`;
        if (thirstFill) thirstFill.style.width = `${Math.max(0,(this.thirst / this.maxThirst) * 100)}%`;
    }
    
    updateEquippedItem() {
        this.equippedItem = this.game.inventory.getSelectedItem(); // This is {id, count, durability?}
        
        if (this.equippedItem) {
            this.equippedItemData = getItemData(this.equippedItem.id); // This is from ItemData template
            this.toolMesh.visible = true;
            
            // TODO: Change toolMesh geometry/material based on equippedItemData.id
            // For now, placeholder color changes
            if (this.equippedItemData.type === 'tool') this.toolMesh.material.color.setHex(0xA0522D); // Sienna
            else if (this.equippedItemData.type === 'weapon') this.toolMesh.material.color.setHex(0x657383); // Slate Gray Darker
            else if (this.equippedItemData.type === 'placeable') this.toolMesh.material.color.setHex(0x556B2F); // DarkOliveGreen
            else this.toolMesh.material.color.setHex(0xD2B48C); // Tan (default for other equippables)

            // Handle light source on equipped item (e.g., torch)
            const lightData = this.equippedItemData.lightSource;
            if (lightData) {
                if (!this.toolMesh.userData.light) {
                    const light = new THREE.PointLight(
                        lightData.color,
                        lightData.intensity,
                        lightData.distance,
                        lightData.decay !== undefined ? lightData.decay : 1 // Default decay if not specified
                    );
                    light.castShadow = false; // Handheld lights usually don't cast shadows for performance
                    this.toolMesh.add(light); 
                    this.toolMesh.userData.light = light;
                } else {
                     this.toolMesh.userData.light.color.setHex(lightData.color);
                     this.toolMesh.userData.light.intensity = lightData.intensity;
                     this.toolMesh.userData.light.distance = lightData.distance;
                }
                this.toolMesh.userData.light.visible = true;
            } else if (this.toolMesh.userData.light) {
                this.toolMesh.userData.light.visible = false;
            }

        } else {
            this.equippedItemData = null;
            this.toolMesh.visible = false;
            if (this.toolMesh.userData.light) {
                this.toolMesh.userData.light.visible = false;
            }
        }
    }


    eat(foodItemData) { // foodItemData is from ItemData
        this.hunger = Math.min(this.maxHunger, this.hunger + (foodItemData.hungerValue || 0));
        this.thirst = Math.min(this.maxThirst, this.thirst + (foodItemData.thirstValue || 0));
        this.health = Math.min(this.maxHealth, this.health + (foodItemData.healthValue || 0));
        if (foodItemData.healthValue < 0) this.flashDamage(true); // Special flash for self-inflicted damage
        this.updateStatsUI();
    }

    drink(beverageItemData) { // beverageItemData is from ItemData
        this.thirst = Math.min(this.maxThirst, this.thirst + (beverageItemData.thirstValue || 0));
        this.hunger = Math.min(this.maxHunger, this.hunger + (beverageItemData.hungerValue || 0)); // Some drinks might affect hunger
        this.health = Math.min(this.maxHealth, this.health + (beverageItemData.healthValue || 0));
        if (beverageItemData.healthValue < 0) this.flashDamage(true);
        this.updateStatsUI();
    }

    takeDamage(amount, source = "unknown") {
        if (this.health <= 0) return; // Already dead

        // Apply armor reduction if implemented
        // let actualDamage = amount;
        // if (this.game.inventory.equippedArmor) actualDamage -= this.game.inventory.equippedArmor.defense;
        // actualDamage = Math.max(0, actualDamage);

        this.health = Math.max(0, this.health - amount); // Use amount directly for now
        this.flashDamage();
        this.updateStatsUI();
        // this.game.ui.showNotification(`Took ${amount.toFixed(1)} damage from ${source}. Health: ${this.health.toFixed(0)}`);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    flashDamage(subtle = false) {
        const existingOverlay = document.getElementById('damageOverlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = "damageOverlay";
        overlay.style.position = 'fixed'; 
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = subtle ? 'rgba(255, 150, 0, 0.2)' : 'rgba(255, 0, 0, 0.3)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9998'; // Below menus but above game
        overlay.style.opacity = '1';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                     overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }, 50);
    }

    die() {
        if (this.game.paused) return; // Avoid multiple death screens if already paused by it

        console.log("Player died.");
        this.game.ui.showNotification("You have perished!");
        this.game.paused = true;
        this.controls.unlock();
        
        const existingScreen = document.getElementById('gameOverScreen');
        if(existingScreen) existingScreen.remove();

        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = "gameOverScreen";
        // Styles from index.html are fine, but can override here too
        gameOverDiv.style.position = 'fixed';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.padding = '40px';
        gameOverDiv.style.border = '2px solid #400';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.zIndex = '10001'; // Above everything
        gameOverDiv.innerHTML = `
            <h2 style="color: #c00; font-size: 2.5em; margin-bottom: 20px;">YOU DIED</h2>
            <p style="font-size: 1.2em;">You survived for ${Math.floor(this.game.gameTime / 60)} minutes and ${Math.floor(this.game.gameTime) % 60} seconds.</p>
            <button id="respawnButton" style="padding: 15px 30px; margin-top: 30px; cursor: pointer; background-color: #006400; color: white; border: none; border-radius: 5px; font-size: 1.1em; text-transform: uppercase;">Respawn</button>
        `;
        document.body.appendChild(gameOverDiv);
        
        const respawnButton = document.getElementById('respawnButton');
        if(respawnButton) {
            respawnButton.addEventListener('click', () => {
                if (gameOverDiv.parentNode) {
                    gameOverDiv.parentNode.removeChild(gameOverDiv);
                }
                this.respawn();
            }, { once: true });
        }
    }

    respawn() {
        this.game.paused = false; // Unpause first
        this.spawn(); // Resets stats and position, re-locks controls
    }

    update(deltaTime) {
        if (this.game.paused && !document.getElementById('gameOverScreen')) { // If paused by user, not by death
             if (this.controls.isLocked) this.controls.unlock(); // Unlock controls if paused manually
             return;
        }
        if (!this.controls.isLocked && !this.game.ui.isAnyMenuOpen() && !this.game.paused) {
            // If game isn't paused by menu/death but controls got unlocked, attempt to re-lock
            // This can happen if user presses Esc without a menu open
            // this.controls.lock(); 
            // Or, perhaps game should pause if controls are not locked and no menu is open
        }


        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        } else if (this.isAttacking && this.toolSwingAnimation == null) { // Reset if attack done and animation finished
            this.isAttacking = false;
        }
        
        if (this.controls.isLocked) {
            this.updateMovement(deltaTime);
        }
        this.updateStats(deltaTime); // Update stats regardless of control lock (hunger/thirst decrease)
    }
}
```
**Changes in `player.js`:**
*   Import `PointerLockControls` from a local path (you'll need to create `js/libs/` and place the file there or adjust the path).
*   Clarified player positioning: `playerObject` is at feet level, camera is at `eyeLevel` relative to `playerObject`.
*   Jump logic changed to apply impulse on key press and use `canJump` to prevent holding space for continuous jumps.
*   `performPrimaryAction`: Raycasting targets refined. `attackAnimalById` used. Tool swing animation call.
*   `animateToolSwing`: Improved animation logic using `requestAnimationFrame` and game clock's delta time.
*   `updateMovement`: Movement logic now uses camera's world direction for correct FPS-style movement. Basic ground collision and stepping logic.
*   `updateEquippedItem`: Handles point lights on tools like torches.
*   `takeDamage`: Added notification (commented out), calls `die` if health <= 0.
*   `flashDamage`: Overlay CSS refined.
*   `die`/`respawn`: Improved game over screen and respawn logic.
*   `update`: Handle pause state more gracefully, e.g., unlock controls if game is paused manually.

--- START OF FILE world.js ---
```javascript
// World Generation and Management
class World {
    constructor(game) {
        this.game = game;
        
        this.size = 256; // Power of 2 is often good for terrain algorithms
        this.segments = 128; // Number of segments for the main terrain plane (less than size for performance)
        
        this.maxHeight = 25;
        this.waterLevel = 1.5; // Adjusted water level
        
        this.heightMap = []; // Stores [x][z] = y
        this.terrainMesh = null; // Single mesh for terrain for simplicity, or chunks for larger worlds
        
        // For biome colors
        this.simplex = new Noise(Math.random()); // Noise for biome variation too
    }

    generate() {
        this.createLighting();
        this.generateHeightMap();
        this.createTerrain();
        // Skybox is now dynamic based on day/night cycle (see update method)
    }

    createLighting() {
        // Ambient light will be controlled by day/night cycle
        this.game.scene.userData.ambientLight = new THREE.AmbientLight(0x101020); // Dark initial
        this.game.scene.add(this.game.scene.userData.ambientLight);
        
        this.game.scene.userData.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.game.scene.userData.sunLight.position.set(50, 80, 30); // Initial sun position
        this.game.scene.userData.sunLight.castShadow = true;
        this.game.scene.userData.sunLight.shadow.mapSize.width = 2048; // Shadow map res
        this.game.scene.userData.sunLight.shadow.mapSize.height = 2048;
        const shadowRange = this.size / 2;
        this.game.scene.userData.sunLight.shadow.camera.near = 0.5;
        this.game.scene.userData.sunLight.shadow.camera.far = 500;
        this.game.scene.userData.sunLight.shadow.camera.left = -shadowRange;
        this.game.scene.userData.sunLight.shadow.camera.right = shadowRange;
        this.game.scene.userData.sunLight.shadow.camera.top = shadowRange;
        this.game.scene.userData.sunLight.shadow.camera.bottom = -shadowRange;
        this.game.scene.userData.sunLight.shadow.bias = -0.0005; // Adjust to reduce shadow acne
        this.game.scene.add(this.game.scene.userData.sunLight);

        // Hemisphere light for softer overall lighting
        this.game.scene.userData.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3c6e47, 0.3); // Sky, Ground, Intensity
        this.game.scene.add(this.game.scene.userData.hemiLight);
    }

    generateHeightMap() {
        const noise = new Noise(Math.random()); // Use the SimplexNoise from utils.js
        this.heightMap = new Array(this.segments + 1);
        for (let i = 0; i <= this.segments; i++) {
            this.heightMap[i] = new Array(this.segments + 1);
            for (let j = 0; j <= this.segments; j++) {
                const x = (i / this.segments) * this.size; // World coordinates
                const z = (j / this.segments) * this.size;

                let height = 0;
                let amplitude = 1;
                let frequency = 0.008; // Controls "zoom" level of noise
                let lacunarity = 2.0; // How much detail is added with each octave
                let persistence = 0.5; // How much each octave contributes

                for (let octave = 0; octave < 6; octave++) { // More octaves for detail
                    const sampleX = x * frequency;
                    const sampleZ = z * frequency;
                    const perlinValue = noise.noise2D(sampleX, sampleZ); // Range -1 to 1
                    height += perlinValue * amplitude;
                    amplitude *= persistence;
                    frequency *= lacunarity;
                }
                // Normalize height to 0-1 range then scale by maxHeight
                height = (height * 0.5 + 0.5) * this.maxHeight; // Adjusted normalization
                
                // Ensure some flat areas and prevent negative heights after manipulation
                height = Math.max(0, height);

                // Gentle slope towards edges to create an "island" feel (optional)
                // const distToCenter = Math.sqrt(Math.pow(x - this.size / 2, 2) + Math.pow(z - this.size / 2, 2));
                // const edgeFactor = Math.max(0, 1 - (distToCenter / (this.size * 0.6))); // Fade out further from center
                // height *= edgeFactor * edgeFactor;


                this.heightMap[i][j] = Math.max(0, height); // Ensure non-negative height
            }
        }
    }

    createTerrain() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2);
        
        const positions = geometry.attributes.position;
        const colors = []; // Vertex colors

        const sandColor = new THREE.Color(0xC2B280);
        const grassColor = new THREE.Color(0x3c6e47);
        const rockColor = new THREE.Color(0x708090); // Slate gray
        const snowColor = new THREE.Color(0xFFFAFA);

        for (let i = 0; i < positions.count; i++) {
            const xIndex = i % (this.segments + 1);
            const zIndex = Math.floor(i / (this.segments + 1));
            
            const height = this.heightMap[xIndex][zIndex];
            positions.setY(i, height);

            // Determine color based on height and biome noise
            let color = new THREE.Color();
            const biomeNoiseVal = (this.simplex.noise2D(xIndex * 0.05, zIndex * 0.05) + 1) * 0.5; // 0-1

            if (height < this.waterLevel + 0.5) {
                color.copy(sandColor);
            } else if (height < this.maxHeight * 0.6) {
                color.lerpColors(grassColor, new THREE.Color(0x556B2F), biomeNoiseVal); // DarkOliveGreen variation
            } else if (height < this.maxHeight * 0.85) {
                color.lerpColors(rockColor, new THREE.Color(0x5A5A5A), biomeNoiseVal);
            } else {
                color.copy(snowColor);
            }
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true, // Enable vertex colors
            // map: grassTexture, // Optional base texture blended with vertex colors
            // flatShading: true, // For a low-poly look
        });
        
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = true; // Terrain can cast shadows on itself and other objects
        this.terrainMesh.userData.isTerrain = true;
        this.game.scene.add(this.terrainMesh);
    }


    getHeightAt(x, z) {
        // Convert world coords to normalized 0-1 range relative to terrain plane
        const normX = (x + this.size / 2) / this.size;
        const normZ = (z + this.size / 2) / this.size;

        // Convert normalized coords to heightMap indices
        const i = Math.floor(normX * this.segments);
        const j = Math.floor(normZ * this.segments);

        // Bilinear interpolation for smoother height transitions
        const i0 = Math.max(0, Math.min(this.segments, i));
        const j0 = Math.max(0, Math.min(this.segments, j));
        const i1 = Math.max(0, Math.min(this.segments, i0 + 1));
        const j1 = Math.max(0, Math.min(this.segments, j0 + 1));

        const h00 = (this.heightMap[i0] && this.heightMap[i0][j0] !== undefined) ? this.heightMap[i0][j0] : 0;
        const h10 = (this.heightMap[i1] && this.heightMap[i1][j0] !== undefined) ? this.heightMap[i1][j0] : 0;
        const h01 = (this.heightMap[i0] && this.heightMap[i0][j1] !== undefined) ? this.heightMap[i0][j1] : 0;
        const h11 = (this.heightMap[i1] && this.heightMap[i1][j1] !== undefined) ? this.heightMap[i1][j1] : 0;

        const tx = (normX * this.segments) - i0;
        const tz = (normZ * this.segments) - j0;

        const h0 = h00 * (1 - tx) + h10 * tx;
        const h1 = h01 * (1 - tx) + h11 * tx;
        
        return h0 * (1 - tz) + h1 * tz;
    }


    getBiomeAt(worldPos) { // worldPos is a THREE.Vector3
        const height = this.getHeightAt(worldPos.x, worldPos.z);
        
        if (height < this.waterLevel) return 'water';
        if (height < this.waterLevel + 0.7) return 'beach'; // Slightly larger beach

        // Use another layer of noise for biome variety within height bands
        const biomeNoise = (this.simplex.noise2D(worldPos.x * 0.005, worldPos.z * 0.005) + 1) * 0.5; // Slower frequency for larger biomes

        if (height < this.maxHeight * 0.4) {
            return biomeNoise < 0.6 ? 'plains' : 'forest';
        } else if (height < this.maxHeight * 0.75) {
            return biomeNoise < 0.4 ? 'forest' : 'mountains_foot'; // Foothills or sparser forest
        } else {
            return 'mountains';
        }
    }

    getCollisionObjects() {
        return this.terrainMesh ? [this.terrainMesh] : [];
    }

    update(deltaTime, dayNightCycle, fog, ambientLight, sunLight) {
        // Update lighting and fog based on day/night cycle
        const sunAngle = dayNightCycle * Math.PI * 2 - Math.PI / 2; // -PI/2 to start sunrise at east

        sunLight.position.set(
            Math.cos(sunAngle) * this.size * 0.7, // Sun distance
            Math.sin(sunAngle) * this.size * 0.5,
            this.size * 0.3 // Slight offset to Z to avoid sun directly overhead along one axis
        );
        sunLight.position.y = Math.max(5, sunLight.position.y); // Keep sun above horizon somewhat

        // Intensity based on sun height (sin of angle above horizon)
        let sunIntensityFactor = Math.max(0, Math.sin(sunAngle + Math.PI / 2)); // Sun is highest at PI/2 (noon)
        
        sunLight.intensity = sunIntensityFactor * 1.2 + 0.1; // Base intensity + sun factor
        ambientLight.intensity = sunIntensityFactor * 0.3 + 0.05; // Ambient also changes
        if (this.game.scene.userData.hemiLight) {
            this.game.scene.userData.hemiLight.intensity = sunIntensityFactor * 0.4 + 0.1;
        }


        // Sky and Fog color transition
        const daySkyColor = new THREE.Color(0x87CEEB);
        const nightSkyColor = new THREE.Color(0x050515); // Very dark blue/purple
        const sunsetSkyColor = new THREE.Color(0xFF8C00); // Orange for sunset/sunrise

        const horizonColorDay = new THREE.Color(0xFFFFFF); // Bright horizon
        const horizonColorNight = new THREE.Color(0x101020);

        let currentSky = new THREE.Color();
        let currentFog = new THREE.Color();

        if (sunIntensityFactor > 0.1) { // Daytime
            currentSky.lerpColors(sunsetSkyColor, daySkyColor, Math.min(1, sunIntensityFactor * 2));
            currentFog.lerpColors(new THREE.Color(0xFFDAB9), new THREE.Color(0xD0E0F0), Math.min(1, sunIntensityFactor * 1.5)); // Peach to light blue fog
        } else { // Nighttime or deep twilight
            const nightFactor = 1 - (sunIntensityFactor / 0.1); // How much into night
            currentSky.lerpColors(sunsetSkyColor, nightSkyColor, nightFactor);
            currentFog.lerpColors(new THREE.Color(0xFF8C00), new THREE.Color(0x080810), nightFactor);
        }
        
        this.game.scene.background = currentSky;
        fog.color.copy(currentFog);
        fog.near = this.size * 0.1;
        fog.far = this.size * (0.8 - sunIntensityFactor * 0.3); // Fog closer at night
        if(this.game.scene.userData.hemiLight) this.game.scene.userData.hemiLight.groundColor.copy(currentFog);


        // If using a skybox mesh, update its material color
        // if (this.skybox) this.skybox.material.color = currentSky;
    }
}
```
**Changes in `world.js`:**
*   Uses `new Noise()` from `utils.js`.
*   Simpler terrain: one large `PlaneGeometry` with vertex colors for biomes instead of multiple materials. This is generally more performant for basic terrain.
*   `generateHeightMap`: More octaves, added lacunarity and persistence parameters for noise generation. Optional "island" effect commented out.
*   `getHeightAt`: Implemented bilinear interpolation for smoother height values between grid points. Corrected indexing for heightMap.
*   `getBiomeAt`: Added more biome variety using another noise layer.
*   `createLighting`: Added HemisphereLight.
*   `update`: Now takes `dayNightCycle` and lighting/fog objects as parameters (passed from `game.js`). Implements dynamic sky color, fog color/density, and light intensities based on time of day.

--- START OF FILE water.js ---
```javascript
// js/water.js

class Water {
    constructor(game) {
        this.game = game;
        this.waterMesh = null;
        this.clock = new THREE.Clock(); 
        this.originalVertices = null; // Store original Z positions for plane geometry
    }

    createWaterPlane() {
        const worldSize = this.game.world.size; // Use world size
        const waterLevel = this.game.world.waterLevel;

        // More segments for smoother waves, but balance performance
        const segments = Math.min(64, Math.floor(worldSize / 8)); 
        const waterGeometry = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
        
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x336699, // A nice water blue
            transparent: true,
            opacity: 0.80,
            roughness: 0.2, // Smoother reflections
            metalness: 0.1,
            envMapIntensity: 0.6, // Reflect sky a bit more
            side: THREE.DoubleSide, // Render both sides (optional, but good if camera can go under)
        });
        
        // Store original Z-coordinates (which become Y after rotation) for wave displacement
        this.originalVertices = new Float32Array(waterGeometry.attributes.position.array);

        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.waterMesh.position.y = waterLevel;
        this.waterMesh.receiveShadow = true; // Water can receive shadows
        this.waterMesh.userData.isWater = true; // For identification in raycasts
        
        this.game.scene.add(this.waterMesh);
    }
    
    update(deltaTime) {
        if (this.waterMesh && this.originalVertices) {
            const time = this.clock.getElapsedTime();
            const positions = this.waterMesh.geometry.attributes.position;
            
            // The original Z values of the PlaneGeometry are at index `i * 3 + 2`
            // After rotation, these effectively become local Y values for wave calculation.
            // But we operate on the BufferAttribute which is still in local space before mesh rotation.
            // So, positions.getY(i) is the current height, positions.getX(i) and positions.getZ(i) are plane coords.
            // We modify positions.getY(i) for the wave effect on the unrotated plane.

            for (let i = 0; i < positions.count; i++) {
                // Use original X and Z (which are X and Y in the unrotated plane geometry)
                // The PlaneGeometry is created in XY plane, Z is 0.
                // originalVertices has (x, y, 0, x, y, 0, ...)
                // After rotation X -> -Math.PI/2, original Y becomes world Z, original X is world X.
                // We need the vertex positions in the plane's local space for consistent wave patterns.
                const ox = this.originalVertices[i * 3 + 0]; // Original local X
                const oy = this.originalVertices[i * 3 + 1]; // Original local Y (becomes Z in world)

                const waveSpeed = 0.8;
                const waveHeight = 0.15;
                const waveFrequency = 0.05;

                const wave1 = Math.sin((ox * waveFrequency + time * waveSpeed)) * waveHeight;
                const wave2 = Math.cos((oy * waveFrequency * 0.8 + time * waveSpeed * 0.7)) * waveHeight * 0.7;
                const smallRipple = Math.sin((ox * 0.2 + oy * 0.1 + time * 1.5)) * waveHeight * 0.2;

                // The PlaneGeometry vertices are (x, y, z=0). After rotation by -PI/2 around X,
                // the new y is original -z, and new z is original y.
                // So we need to set the 'y' component of the BufferAttribute, which corresponds to height.
                // This is confusing because PlaneGeometry is created in XY plane.
                // Let's assume PlaneGeometry vertices are (x, z, y=0) for horizontal plane.
                // Then we'd modify Y.
                // The default PlaneGeometry is (x, y, z=0). If we rotate it -PI/2 on X,
                // original Y becomes world Z, original X stays world X. Height is world Y.
                // This means we should be modifying the original Z values.
                // However, buffer positions are (x,y,z, x,y,z...). We're setting the Y component (index 1).
                // This is correct IF the plane is NOT rotated and Y is up.
                // Since it IS rotated, `positions.setY(i, newHeight)` modifies the buffer's Y.
                // For a plane rotated -PI/2 around X, its local Y axis points towards world -Z.
                // Its local Z axis points towards world Y.
                // So, to make waves go "up" in world space, we need to modify the local Z component.
                // Original code: positions.setY(i, wave1 + wave2 + smallRipple);
                // This will move vertices along the plane's local Y axis.
                // After rotation, this means waves move along world's negative Z axis if player is looking along positive Z.
                // To make waves go up/down (world Y): modify the component that becomes world Y after rotation.
                // That is the local Z component of the PlaneGeometry.
                // The original code `positions.setY` applied to a PlaneGeometry (which is in X,Y plane)
                // and then rotated, meant the waves were displacing along the plane's local Y axis.
                // After -PI/2 rotation on X, local Y becomes world -Z. So waves were horizontal.
                // For vertical waves (on world Y axis), we need to displace along the plane's local Z axis.
                // But PlaneGeometry is flat on Z, so all original Z are 0.
                // Correct approach: Plane is (width, height, widthSegments, heightSegments).
                // Its vertices are (x,y,0). We rotate it.
                // The values in `positions` are (local_x, local_y, local_z).
                // `positions.setY(i, val)` changes `local_y`.
                // If plane is horizontal via rotation:
                // `waterMesh.rotation.x = -Math.PI / 2;` means local Y becomes world -Z, local Z becomes world Y.
                // So we should change local Z component: `positions.setZ(i, wave1 + wave2 + smallRipple);`

                // Let's re-verify PlaneGeometry construction:
                // It's built in the XY plane. So vertices are (x, y, 0).
                // If we rotate this plane to be horizontal (terrain-like): `rotation.x = -Math.PI / 2`.
                // World X = Local X
                // World Y = Local -Z (if local Z was non-zero)
                // World Z = Local Y
                // To make waves go up in World Y, we need to modify Local Z.
                // Original Z is 0. So we set it.
                positions.setZ(i, wave1 + wave2 + smallRipple);
            }
            positions.needsUpdate = true;
            // Only compute normals if lighting is very sensitive to it or waves are large
            // this.waterMesh.geometry.computeVertexNormals(); 
        }
    }
    
    isPointInWater(point) { // point is THREE.Vector3
        return point.y < (this.game.world.waterLevel + 0.1); // Add a small buffer for waves
    }
}
```
**Changes in `water.js`:**
*   Corrected vertex displacement logic for waves. `PlaneGeometry` is created in the XY plane; when rotated to be horizontal, its local Z-axis aligns with the world's Y-axis (up). So, to make waves go up and down, we displace vertices along their local Z-coordinate.
*   Simplified wave calculation slightly.
*   Adjusted water color and material properties.
*   `isPointInWater` adds a small buffer to account for wave height.

--- START OF FILE resources.js ---
```javascript
// js/resources.js
import { GLTFLoader } from './libs/GLTFLoader.js'; // Adjust path as needed

class Resources {
    constructor(game) {
        this.game = game;
        
        this.resourceTypes = {
            'tree': {
                name: 'Tree',
                modelPath: 'assets/models/tree_pineDefault.glb', // Example path
                icon: 'assets/items/wood.png',
                tool: 'axe', 
                yields: [
                    { item: 'wood', amountMin: 3, amountMax: 6, chance: 1.0 },
                    { item: 'stick', amountMin: 1, amountMax: 4, chance: 0.6 },
                    { item: 'apple', amountMin: 0, amountMax: 2, chance: 0.1 }
                ],
                health: 60, 
                respawnTime: 300, // 5 minutes
                biomes: ['plains', 'forest', 'mountains_foot'],
                minDistance: 6, // Min distance between same type
                scale: { x:1.2, y:1.2, z:1.2 },
                yOffset: 0 // For models whose origin isn't at the base
            },
            'rock_formation': { // Renamed from 'rock' to avoid 'rock' item confusion
                name: 'Rock Formation',
                modelPath: 'assets/models/rock_largeA.glb',
                icon: 'assets/items/stone.png',
                tool: 'pickaxe',
                yields: [
                    { item: 'stone', amountMin: 4, amountMax: 8, chance: 1.0 },
                    { item: 'flint', amountMin: 0, amountMax: 2, chance: 0.4 },
                    { item: 'iron_ore', amountMin: 0, amountMax: 1, chance: 0.15 } 
                ],
                health: 80,
                respawnTime: 450,
                biomes: ['plains', 'forest', 'mountains', 'mountains_foot', 'beach'],
                minDistance: 8,
                scale: { x:1, y:1, z:1 },
                yOffset: 0
            },
            'berry_bush': {
                name: 'Berry Bush',
                modelPath: 'assets/models/bush_berries.glb',
                icon: 'assets/items/berries.png',
                tool: null, 
                yields: [
                    { item: 'berries', amountMin: 2, amountMax: 5, chance: 1.0 },
                    { item: 'fiber', amountMin: 1, amountMax: 3, chance: 0.7 },
                    { item: 'stick', amountMin: 0, amountMax: 1, chance: 0.4 }
                ],
                health: 25,
                respawnTime: 180,
                biomes: ['plains', 'forest'],
                minDistance: 3,
                scale: { x:0.9, y:0.9, z:0.9 },
                yOffset: 0
            },
            'iron_vein_rock': { 
                name: 'Iron Vein',
                modelPath: 'assets/models/rock_ironVein.glb',
                icon: 'assets/items/iron_ore.png',
                tool: 'pickaxe',
                yields: [
                    { item: 'iron_ore', amountMin: 3, amountMax: 6, chance: 1.0 },
                    { item: 'stone', amountMin: 1, amountMax: 3, chance: 0.6 }
                ],
                health: 120,
                respawnTime: 600, // 10 minutes
                biomes: ['mountains', 'caves', 'mountains_foot'], 
                minDistance: 10,
                scale: { x:1, y:1, z:1 },
                yOffset: 0
            }
        };
        
        this.activeResources = []; 
        this.respawningResources = [];
        this.gltfLoader = new GLTFLoader(); 
    }

    spawnInitialResources() {
        const resourceCounts = {
            'tree': 60,
            'rock_formation': 50,
            'berry_bush': 40,
            'iron_vein_rock': 25
        };
        
        Object.entries(resourceCounts).forEach(([typeKey, count]) => {
            for (let i = 0; i < count; i++) {
                this.spawnResource(typeKey); // This is now async due to model loading
            }
        });
        console.log("Initial resource spawning initiated.");
    }

    async spawnResource(typeKey, predefinedPosition = null) {
        const resourceDef = this.resourceTypes[typeKey];
        if (!resourceDef) {
            console.warn("Unknown resource type for spawning:", typeKey);
            return null;
        }
        
        const position = predefinedPosition || this.findResourcePosition(resourceDef);
        if (!position) {
            // console.warn(`Could not find valid position for ${typeKey}`);
            return null;
        }
        
        position.y += resourceDef.yOffset || 0; // Apply y-offset

        try {
            if (resourceDef.modelPath) {
                const gltf = await loadGLTFModel(resourceDef.modelPath, this.gltfLoader);
                const model = gltf.scene;
                model.position.copy(position);
                if (resourceDef.scale) model.scale.set(resourceDef.scale.x, resourceDef.scale.y, resourceDef.scale.z);
                
                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.parentResource = model; // Link child mesh to parent model for easier hit detection
                    }
                });

                this._finalizeResource(model, typeKey, resourceDef, position);
            } else {
               this.createPlaceholderResource(typeKey, position, resourceDef);
            }
        } catch (error) {
            console.error(`Failed to load or spawn resource ${typeKey} at ${resourceDef.modelPath}:`, error);
            this.createPlaceholderResource(typeKey, position, resourceDef); // Fallback
        }
    }
    
    _finalizeResource(mesh, typeKey, resourceDef, position) {
        mesh.userData = {
            type: 'resource',
            resourceId: typeKey,
            health: resourceDef.health,
            maxHealth: resourceDef.health,
            config: resourceDef, // Store full config for easier access
            originalPosition: position.clone()
        };
        this.game.scene.add(mesh);
        this.activeResources.push(mesh);
    }

    createPlaceholderResource(typeKey, position, resourceDef) {
        let geometry, color;
        const s = resourceDef.scale ? Math.max(resourceDef.scale.x, resourceDef.scale.y, resourceDef.scale.z) * 0.5 : 0.5;
        switch (typeKey) {
            case 'tree': geometry = new THREE.ConeGeometry(s*0.8, s*4, 8); color = 0x228B22; break; // Tall cone for tree
            case 'rock_formation': geometry = new THREE.DodecahedronGeometry(s*1.2, 0); color = 0x808080; break;
            case 'berry_bush': geometry = new THREE.SphereGeometry(s, 8, 6); color = 0x556B2F; break; // DarkOliveGreen
            case 'iron_vein_rock': geometry = new THREE.BoxGeometry(s*1.5, s*1.5, s*1.5); color = 0xA52A2A; break;
            default: geometry = new THREE.BoxGeometry(s,s,s); color = 0xFF00FF;
        }
        const material = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.copy(position);
        if (typeKey === 'tree') mesh.position.y += s*2; // Adjust placeholder tree position
        else mesh.position.y += s;

        this._finalizeResource(mesh, typeKey, resourceDef, position);
        console.warn(`Using placeholder for resource: ${typeKey}`);
    }


    findResourcePosition(resourceDef) {
        const maxAttempts = 50;
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = getRandomFloat(-worldSize / 2 + resourceDef.minDistance, worldSize / 2 - resourceDef.minDistance);
            const z = getRandomFloat(-worldSize / 2 + resourceDef.minDistance, worldSize / 2 - resourceDef.minDistance);
            const terrainHeight = this.game.world.getHeightAt(x, z);
            
            if (terrainHeight < waterLevel + 0.3) continue; // Avoid spawning in/too close to water
            
            const currentBiome = this.game.world.getBiomeAt(new THREE.Vector3(x, terrainHeight, z));
            if (!resourceDef.biomes.includes(currentBiome)) continue;
            
            const position = new THREE.Vector3(x, terrainHeight, z);
            let tooClose = false;
            for (const existing of this.activeResources) {
                if (existing.userData.resourceId === resourceDef.name || // Check against name in config
                    existing.userData.resourceId === resourceDef.resourceId) { // Check against key
                    if (position.distanceTo(existing.position) < resourceDef.minDistance) {
                        tooClose = true;
                        break;
                    }
                }
            }
            if (tooClose) continue;
            
            return position;
        }
        return null; // Could not find a suitable position
    }

    harvestResource(resourceObject, hitPoint, toolInventoryItem) { // toolInventoryItem is {id, count, durability?}
        const resUserData = resourceObject.userData;
        if (!resUserData || resUserData.type !== 'resource' || resUserData.health <= 0) return;

        const resourceConfig = resUserData.config; // Full config stored in userData
        const requiredToolType = resourceConfig.tool;
        let damage = 1; // Base damage (e.g., hands)
        let toolUsedSuccessfully = false;

        if (toolInventoryItem) {
            const toolData = getItemData(toolInventoryItem.id); // Get fresh data
            if (requiredToolType && toolData.toolType === requiredToolType) {
                damage = toolData.toolStrength || 5;
                toolUsedSuccessfully = true;
            } else if (!requiredToolType) { 
                damage = toolData.toolStrength || 2;
                toolUsedSuccessfully = true; // Even a generic tool can be "successful" on a no-req harvest
            } else {
                this.game.ui.showNotification(`Ineffective tool for ${resourceConfig.name}!`);
                damage = 0.5; 
            }
        } else if (requiredToolType) {
             this.game.ui.showNotification(`You need a ${requiredToolType} to harvest ${resourceConfig.name}.`);
             return; 
        }

        resUserData.health -= damage;
        this.createHitEffect(hitPoint || resourceObject.position, resourceObject);

        // Handle tool durability
        if (toolUsedSuccessfully && toolInventoryItem) {
            toolInventoryItem.durability = (toolInventoryItem.durability || getItemData(toolInventoryItem.id).maxDurability) - 1;
            if (toolInventoryItem.durability <= 0) {
                this.game.ui.showNotification(`${getItemData(toolInventoryItem.id).name} broke!`);
                this.game.inventory.removeItem(toolInventoryItem.id, 1); // Assumes selected item slot update
                this.game.player.updateEquippedItem(); // Refresh player's equipped item
            } else {
                // If inventory stores copies, we need to update the specific slot
                // This depends on how inventory manages item instances.
                // For now, assume selectedItem() in inventory gives a reference that can be modified.
                // If not, inventory needs a method like `updateItemDurability(slotIndex, newDurability)`.
                this.game.ui.updateQuickBar(); // To show durability change if visible
            }
        }


        if (resUserData.health <= 0) {
            this.addResourcesToInventory(resourceConfig.yields);
            this.createHarvestEffect(hitPoint || resourceObject.position, resourceConfig.icon); // Use icon for effect
            
            this.game.scene.remove(resourceObject);
            // Dispose geometry and material of the removed object
            resourceObject.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });

            const index = this.activeResources.indexOf(resourceObject);
            if (index > -1) this.activeResources.splice(index, 1);
            
            this.scheduleRespawn(resUserData.resourceId, resUserData.originalPosition, resourceConfig.respawnTime);
        }
    }

    addResourcesToInventory(yieldsArray) {
        yieldsArray.forEach(y => {
            if (Math.random() <= y.chance) {
                const amount = getRandomInt(y.amountMin, y.amountMax);
                if (amount > 0) {
                    this.game.inventory.addItem(y.item, amount);
                    this.game.ui.showNotification(`+${amount} ${getItemData(y.item).name}`);
                }
            }
        });
    }
    
    scheduleRespawn(resourceId, position, respawnTime) {
        this.respawningResources.push({
            resourceId: resourceId, // The key from resourceTypes
            position: position.clone(),
            respawnAtGameTime: this.game.gameTime + respawnTime 
        });
    }

    update(deltaTime) {
        for (let i = this.respawningResources.length - 1; i >= 0; i--) {
            const respawnInfo = this.respawningResources[i];
            if (this.game.gameTime >= respawnInfo.respawnAtGameTime) {
                this.spawnResource(respawnInfo.resourceId, respawnInfo.position); 
                this.respawningResources.splice(i, 1);
            }
        }
    }

    createHitEffect(position, resourceMesh) {
        // Simple particle effect
        const particleCount = 5;
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xAAAAAA,
            size: 0.15,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
        });
        const vertices = [];
        for (let i = 0; i < particleCount; i++) {
            vertices.push(
                position.x + (Math.random() - 0.5) * 0.3,
                position.y + (Math.random() - 0.5) * 0.3,
                position.z + (Math.random() - 0.5) * 0.3
            );
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.game.scene.add(particles);
        
        const life = 0.3 + Math.random() * 0.2;
        setTimeout(() => {
            this.game.scene.remove(particles);
            particleGeometry.dispose();
            particleMaterial.dispose();
        }, life * 1000);

        // Shake effect (if model is complex, might be expensive)
        if (resourceMesh) {
            if (resourceMesh.userData.isShaking) return;
            resourceMesh.userData.isShaking = true;
            const originalRotation = resourceMesh.rotation.clone();
            const shakeIntensity = 0.02;
            let shakeTime = 0;
            const shakeDuration = 0.15;

            const doShake = () => {
                shakeTime += this.game.clock.getDelta(); // Use game clock for consistency
                if (shakeTime < shakeDuration) {
                    resourceMesh.rotation.x = originalRotation.x + (Math.random() - 0.5) * shakeIntensity;
                    resourceMesh.rotation.z = originalRotation.z + (Math.random() - 0.5) * shakeIntensity;
                    requestAnimationFrame(doShake);
                } else {
                    resourceMesh.rotation.copy(originalRotation);
                    resourceMesh.userData.isShaking = false;
                }
            };
            requestAnimationFrame(doShake);
        }
    }

    createHarvestEffect(position, itemIconPath) {
        // Particles using item icon (if texture loads successfully)
        AssetLoader.loadTexture(`harvest_${itemIconPath}`, itemIconPath).then(texture => {
            if (!texture) return; // Texture failed to load

            const particleCount = 8;
            const particleMaterial = new THREE.PointsMaterial({
                map: texture,
                size: 0.5,
                transparent: true,
                opacity: 1.0,
                alphaTest: 0.1, // Don't render fully transparent parts of icon
                sizeAttenuation: true,
            });
            const vertices = [];
            const velocities = []; // For simple upward motion

            for (let i = 0; i < particleCount; i++) {
                 vertices.push(
                    position.x + (Math.random() - 0.5) * 0.2, // Spawn close to point
                    position.y,
                    position.z + (Math.random() - 0.5) * 0.2
                );
                velocities.push(
                    (Math.random() - 0.5) * 0.5, // Spread out
                    Math.random() * 1 + 0.5,      // Move up
                    (Math.random() - 0.5) * 0.5
                );
            }
            const particleGeometry = new THREE.BufferGeometry();
            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const particles = new THREE.Points(particleGeometry, particleMaterial);
            this.game.scene.add(particles);

            let life = 0;
            const maxLife = 1.0 + Math.random() * 0.5; // 1 to 1.5 seconds
            const animateParticles = () => {
                const dt = this.game.clock.getDelta();
                life += dt;
                if (life >= maxLife) {
                    this.game.scene.remove(particles);
                    particleGeometry.dispose();
                    particleMaterial.map.dispose(); // Dispose texture if it was loaded just for this
                    particleMaterial.dispose();
                    return;
                }
                const positions = particleGeometry.attributes.position;
                for(let i=0; i < particleCount; ++i) {
                    positions.array[i*3+0] += velocities[i*3+0] * dt;
                    positions.array[i*3+1] += velocities[i*3+1] * dt;
                    positions.array[i*3+2] += velocities[i*3+2] * dt;
                    velocities[i*3+1] -= 2.0 * dt; // Gravity on particles
                }
                positions.needsUpdate = true;
                particles.material.opacity = 1.0 - (life / maxLife);
                requestAnimationFrame(animateParticles);
            };
            requestAnimationFrame(animateParticles);

        }).catch(err => console.warn("Harvest effect texture load failed:", err));
    }
}
```
**Changes in `resources.js`:**
*   Import `GLTFLoader` and create an instance. `loadGLTFModel` from `utils.js` is now used.
*   `spawnResource` is now `async` due to model loading.
*   `_finalizeResource` helper method created.
*   `resourceTypes`: Renamed some keys (e.g., `rock` to `rock_formation`) for clarity. Added `yOffset` and refined biome distribution.
*   `harvestResource`: Now takes the full `toolInventoryItem` to manage durability. Added basic durability logic.
*   Resource cleanup: Added `dispose()` calls for geometry and materials when a resource is harvested to free up memory.
*   Particle effects (`createHitEffect`, `createHarvestEffect`) are more fleshed out with animation and texture usage. `AssetLoader` is used for the harvest effect texture.

--- START OF FILE inventory.js ---
```javascript
// js/inventory.js

class Inventory {
    constructor(game) {
        this.game = game;
        this.size = 20; // Total inventory slots
        this.items = new Array(this.size).fill(null); // Each item: { id, count, durability? (if applicable) }
        this.quickBarSize = 5;
        this.selectedQuickSlot = 0; // Index 0-4
    }

    addItem(itemId, count = 1, itemProps = {}) { // itemProps for durability, etc.
        const itemData = getItemData(itemId); // Base data from ItemData
        if (!itemData || itemData.type === 'unknown') {
            console.warn(`Attempted to add unknown item: ${itemId}`);
            return false;
        }

        let remainingCount = count;

        // Try to stack with existing items (if stackable and same properties, e.g. full durability)
        if (itemData.stack > 1) {
            for (let i = 0; i < this.size; i++) {
                if (this.items[i] && this.items[i].id === itemId && this.items[i].count < itemData.stack) {
                    // For items with durability, only stack if current item is full durability
                    // and new item is also full (or doesn't have durability).
                    const existingIsFullDurability = !this.items[i].hasOwnProperty('durability') || this.items[i].durability === itemData.maxDurability;
                    const newIsFullDurability = !itemProps.hasOwnProperty('durability') || itemProps.durability === itemData.maxDurability;

                    if (itemData.type !== 'tool' && itemData.type !== 'weapon' && itemData.type !== 'armor' || (existingIsFullDurability && newIsFullDurability)) {
                        const canAdd = itemData.stack - this.items[i].count;
                        const toAdd = Math.min(remainingCount, canAdd);
                        this.items[i].count += toAdd;
                        remainingCount -= toAdd;
                        if (remainingCount === 0) {
                            this.game.ui.updateInventory();
                            return true;
                        }
                    }
                }
            }
        }

        // Try to add to an empty slot
        for (let i = 0; i < this.size; i++) {
            if (!this.items[i]) {
                const toAdd = Math.min(remainingCount, itemData.stack);
                this.items[i] = { 
                    id: itemId, 
                    count: toAdd,
                    // Assign durability if applicable, from itemProps or default to max
                    ...( (itemData.type === 'tool' || itemData.type === 'weapon' || itemData.type === 'armor') && 
                         { durability: itemProps.durability !== undefined ? itemProps.durability : itemData.maxDurability }
                       )
                };
                remainingCount -= toAdd;
                if (remainingCount === 0) {
                    this.game.ui.updateInventory();
                    return true;
                }
            }
        }

        if (remainingCount > 0) {
            this.game.ui.showNotification("Inventory full!");
        }
        this.game.ui.updateInventory(); // Update even if full to show partial adds
        return remainingCount === 0;
    }

    removeItem(itemId, count = 1, slotIndex = -1) { // slotIndex optional for specific slot removal
        let removedCount = 0;
        if (slotIndex !== -1 && this.items[slotIndex] && this.items[slotIndex].id === itemId) {
            const toRemove = Math.min(count, this.items[slotIndex].count);
            this.items[slotIndex].count -= toRemove;
            removedCount += toRemove;
            if (this.items[slotIndex].count <= 0) {
                this.items[slotIndex] = null;
            }
        } else { // General removal from any slot
            for (let i = this.items.length - 1; i >= 0; i--) {
                if (this.items[i] && this.items[i].id === itemId) {
                    const canRemoveFromSlot = Math.min(count - removedCount, this.items[i].count);
                    this.items[i].count -= canRemoveFromSlot;
                    removedCount += canRemoveFromSlot;

                    if (this.items[i].count <= 0) {
                        this.items[i] = null;
                    }
                    if (removedCount >= count) break;
                }
            }
        }
        
        if (removedCount > 0) {
            this.game.ui.updateInventory();
            this.game.player.updateEquippedItem(); 
        }
        return removedCount >= count;
    }

    // New method to remove item from a specific slot, regardless of itemId (for dropping, etc.)
    removeItemFromSlot(slotIndex, count = 1) {
        if (slotIndex < 0 || slotIndex >= this.size || !this.items[slotIndex]) return null;

        const itemInSlot = this.items[slotIndex];
        const actualCountToRemove = Math.min(count, itemInSlot.count);
        
        const removedItem = { ...itemInSlot, count: actualCountToRemove }; // Copy of what's removed

        itemInSlot.count -= actualCountToRemove;
        if (itemInSlot.count <= 0) {
            this.items[slotIndex] = null;
        }

        this.game.ui.updateInventory();
        this.game.player.updateEquippedItem();
        return removedItem;
    }


    hasItem(itemId, count = 1) {
        let totalCount = 0;
        for (const item of this.items) {
            if (item && item.id === itemId) {
                totalCount += item.count;
            }
        }
        return totalCount >= count;
    }

    getItemCount(itemId) {
        let totalCount = 0;
        for (const item of this.items) {
            if (item && item.id === itemId) {
                totalCount += item.count;
            }
        }
        return totalCount;
    }

    getQuickBarItems() {
        return this.items.slice(0, this.quickBarSize);
    }

    selectQuickSlot(index) {
        if (index >= 0 && index < this.quickBarSize) {
            if (this.game.building.ghostObject) { // If in build mode, cancel it before switching item
                this.game.building.cancelPlacement();
            }
            this.selectedQuickSlot = index;
            this.game.player.updateEquippedItem();
            this.game.ui.updateQuickBar(); // updateInventory also calls this, but direct call is fine
        }
    }

    getSelectedItem() { // Returns the actual item object from the inventory slot
        return this.items[this.selectedQuickSlot];
    }

    // Use item from inventory UI click
    useItemFromSlot(slotIndex) {
        const item = this.items[slotIndex];
        if (!item) return;

        const itemData = getItemData(item.id); // Base data

        if (itemData.type === 'food' || itemData.type === 'consumable') {
            this.consumeItem(item, itemData, slotIndex);
        } else if (itemData.type === 'tool' || itemData.type === 'weapon' || itemData.type === 'placeable' || itemData.equippable) {
            if (slotIndex < this.quickBarSize) { // Clicked item in quickbar
                this.selectQuickSlot(slotIndex);
            } else { // Clicked item in main inventory, move to selected quickslot
                const quickBarSlotItem = this.items[this.selectedQuickSlot];
                this.items[this.selectedQuickSlot] = this.items[slotIndex]; // Move item to quickbar
                this.items[slotIndex] = quickBarSlotItem; // Move quickbar item (if any) to main inventory
                
                this.game.player.updateEquippedItem();
                this.game.ui.updateInventory(); 
            }
            this.game.ui.showNotification(`Equipped ${itemData.name}`);
        } else {
            this.game.ui.showNotification(`Cannot use ${itemData.name} this way.`);
        }
        this.game.ui.closeAllMenus(); // Close inventory after action
    }
    
    consumeItem(itemInstance, itemData, slotIndex = -1) { // itemInstance is the actual object in inventory
        if (itemData.hungerValue) this.game.player.eat(itemData);
        if (itemData.thirstValue && !itemData.hungerValue) this.game.player.drink(itemData); // If primarily a drink
        
        if (itemData.emptyTo) { // If it leaves an empty container
            itemInstance.count--;
            if (itemInstance.count <= 0) this.items[slotIndex !== -1 ? slotIndex : this.selectedQuickSlot] = null;
            this.addItem(itemData.emptyTo, 1);
        } else {
            // This needs to use the correct slot index if called from useItemFromSlot
            const currentSlot = slotIndex !== -1 ? slotIndex : this.selectedQuickSlot;
            this.removeItem(itemInstance.id, 1, currentSlot); 
        }
        this.game.ui.showNotification(`Used ${itemData.name}`);
        // No need to update inventory explicitly, removeItem/addItem does it
        // this.game.player.updateEquippedItem(); // In case it was the last one
    }


    // Called when using the currently equipped quickbar item (e.g., player's primary action)
    useEquippedItem() {
        const itemInstance = this.getSelectedItem(); // The actual item object from inventory
        if (!itemInstance) {
            this.game.player.performPrimaryAction(); // Bare hands action
            return;
        }

        const itemData = getItemData(itemInstance.id); // Static data

        if (itemData.type === 'food' || itemData.type === 'consumable') {
             this.consumeItem(itemInstance, itemData); // Will use selectedQuickSlot by default
        } else if (itemData.type === 'placeable') {
            // Building system selection is done by player's primary action if ghost is not active
            // If ghost is active, primary action places it.
            // If no ghost, primary action *could* select it.
            if (this.game.building.selectBuildable(itemInstance.id)) { // Pass item ID to selectBuildable
                 this.game.ui.closeAllMenus();
                 // Notification is in BuildingSystem or player
            } else {
                this.game.ui.showNotification(`Cannot select ${itemData.name} for building.`);
            }
        } else if (itemData.type === 'tool' || itemData.type === 'weapon') {
            // Action is handled by player.performPrimaryAction() via raycast
            this.game.player.performPrimaryAction();
        } else if (itemData.id === 'filled_water_container' && this.game.player.controls.isLocked) {
            // Allow drinking water with primary action if equipped
             this.consumeItem(itemInstance, itemData);
        } else {
            this.game.ui.showNotification(`Cannot use ${itemData.name} with primary action.`);
        }
    }

    // For Storage Interaction
    transferItemToStorage(playerSlotIndex, storageId, storageSlotIndex) {
        const playerItem = this.items[playerSlotIndex];
        if (!playerItem) return false;

        const storageSystem = this.game.structures;
        if (!storageSystem.transferToStorage(storageId, storageSlotIndex, playerItem)) {
            // this.game.ui.showNotification("Storage slot occupied or storage full.");
            return false; // Structure system will show notification
        }
        
        // If successfully transferred, remove from player inventory
        this.items[playerSlotIndex] = null; // Remove entire stack
        
        this.game.ui.updateInventory();
        this.game.player.updateEquippedItem(); // If it was an equipped item
        storageSystem.updateStorageUI(storageId); // Refresh storage UI
        return true;
    }

    transferItemFromStorage(storageId, storageSlotIndex, playerSlotIndex = -1) {
        const storageSystem = this.game.structures;
        const itemFromStorage = storageSystem.peekItemInStorage(storageId, storageSlotIndex);

        if (!itemFromStorage) return false;

        // Try to add to player's inventory (playerSlotIndex is preferred, otherwise any)
        // This addItem needs to handle specific slot placement or find empty/stackable.
        // For simplicity, current addItem finds first available.
        if (this.addItem(itemFromStorage.id, itemFromStorage.count, itemFromStorage)) { // Pass full item properties
            // If successfully added, remove from storage
            storageSystem.removeFromStorage(storageId, storageSlotIndex, itemFromStorage.count);
            
            this.game.ui.updateInventory();
            storageSystem.updateStorageUI(storageId);
            return true;
        } else {
            this.game.ui.showNotification("Player inventory full!");
            return false;
        }
    }
}
```
**Changes in `inventory.js`:**
*   `addItem`: Now accepts `itemProps` to correctly initialize items with durability. Handles stacking for non-tool/weapon/armor items, or for tools/weapons/armor if they are at full durability.
*   `removeItem`: Added optional `slotIndex` parameter for targeted removal.
*   `removeItemFromSlot`: New method to remove any item from a specific slot.
*   `useItemFromSlot`: When moving an item from main inventory to quickbar, it now swaps with the item currently in the selected quickbar slot.
*   `consumeItem`: New helper method to handle consumption logic, including items that leave an empty container (like `filled_water_container` becoming `empty_water_container`).
*   `useEquippedItem`: Calls `consumeItem`. Allows drinking water directly.
*   `transferItemToStorage` and `transferItemFromStorage`: Added methods to interact with `StructuresSystem` for storage containers. These are called by the UI.

--- START OF FILE crafting.js ---
```javascript
// crafting.js - Handles all crafting recipes and crafting mechanics

class CraftingSystem {
    constructor(game) {
        this.game = game;
        this.recipes = this.setupRecipes(); // Player crafting
        this.craftingTableRecipes = this.setupCraftingTableRecipes(); // Crafting Table
        this.forgeRecipes = this.setupForgeRecipes(); // Forge
        // Campfire recipes are in StructuresSystem as they are more about processing
    }

    setupRecipes() { // Basic recipes (available from player inventory)
        return [
            {
                id: 'wooden_axe_craft', // Suffix with _craft to distinguish from item ID if needed
                name: 'Wooden Axe',
                icon: 'assets/items/wooden_axe.png', // Icon of the result
                ingredients: [{ item: 'wood', count: 3 }, { item: 'stick', count: 2 }],
                result: { item: 'wooden_axe', count: 1 },
                category: 'tools'
            },
            {
                id: 'wooden_pickaxe_craft',
                name: 'Wooden Pickaxe',
                icon: 'assets/items/wooden_pickaxe.png',
                ingredients: [{ item: 'wood', count: 3 }, { item: 'stick', count: 2 }],
                result: { item: 'wooden_pickaxe', count: 1 },
                category: 'tools'
            },
            {
                id: 'torch_craft',
                name: 'Torch',
                icon: 'assets/items/torch.png',
                ingredients: [{ item: 'stick', count: 1 }, { item: 'fiber', count: 1 }/*, { item: 'coal' or 'resin', count: 1 } optional */],
                result: { item: 'torch', count: 3 }, // Craft multiple torches
                category: 'tools'
            },
            {
                id: 'rope_craft',
                name: 'Rope',
                icon: 'assets/items/rope.png',
                ingredients: [{ item: 'fiber', count: 4 }],
                result: { item: 'rope', count: 1 },
                category: 'materials'
            },
            {
                id: 'campfire_kit_craft',
                name: 'Campfire Kit',
                icon: 'assets/structures/campfire.png',
                ingredients: [{ item: 'wood', count: 5 }, { item: 'stone', count: 3 }],
                result: { item: 'campfire_item', count: 1 }, // Result is the placeable item
                category: 'structures'
            },
            // Basic building components might be craftable by hand too
            {
                id: 'wooden_wall_item_craft',
                name: 'Wooden Wall Section',
                icon: 'assets/structures/wooden_wall.png',
                ingredients: [{ item: 'wood', count: 4 }], // Reduced cost
                result: { item: 'wooden_wall_item', count: 1 },
                category: 'building'
            },
            {
                id: 'wooden_floor_item_craft',
                name: 'Wooden Floor Section',
                icon: 'assets/structures/wooden_floor.png',
                ingredients: [{ item: 'wood', count: 3 }], // Reduced cost
                result: { item: 'wooden_floor_item', count: 1 },
                category: 'building'
            },
        ];
    }

    setupCraftingTableRecipes() { // Requires crafting table
        return [
            {
                id: 'crafting_table_kit_craft', // Craft another table, if needed
                name: 'Crafting Table Kit',
                icon: 'assets/structures/crafting_table.png',
                ingredients: [{ item: 'wood', count: 6 }],
                result: { item: 'crafting_table_item', count: 1 },
                category: 'structures'
            },
            {
                id: 'stone_axe_craft',
                name: 'Stone Axe',
                icon: 'assets/items/stone_axe.png',
                ingredients: [{ item: 'stick', count: 2 }, { item: 'stone', count: 3 }, { item: 'rope', count: 1 }],
                result: { item: 'stone_axe', count: 1 },
                category: 'tools'
            },
            {
                id: 'stone_pickaxe_craft',
                name: 'Stone Pickaxe',
                icon: 'assets/items/stone_pickaxe.png',
                ingredients: [{ item: 'stick', count: 2 }, { item: 'stone', count: 3 }, { item: 'rope', count: 1 }],
                result: { item: 'stone_pickaxe', count: 1 },
                category: 'tools'
            },
            {
                id: 'bow_craft',
                name: 'Bow',
                icon: 'assets/items/bow.png',
                ingredients: [{ item: 'stick', count: 3 }, { item: 'rope', count: 1 } ], // Simplified
                result: { item: 'bow', count: 1 },
                category: 'weapons'
            },
            {
                id: 'arrow_craft',
                name: 'Arrow',
                icon: 'assets/items/arrow.png',
                ingredients: [{ item: 'stick', count: 1 }, { item: 'flint', count: 1 }, { item: 'feather', count: 1 }],
                result: { item: 'arrow', count: 4 },
                category: 'ammo' // Changed category
            },
            {
                id: 'storage_box_kit_craft',
                name: 'Storage Box Kit',
                icon: 'assets/structures/storage_box.png',
                ingredients: [{ item: 'wood', count: 10 }, { item: 'stick', count: 4 }], // Alternative recipe
                result: { item: 'storage_box_item', count: 1 },
                category: 'structures'
            },
            {
                id: 'wooden_door_item_craft',
                name: 'Wooden Doorway',
                icon: 'assets/structures/wooden_door.png',
                ingredients: [{ item: 'wood', count: 5 }, {item: 'rope', count: 1}],
                result: { item: 'wooden_door_item', count: 1},
                category: 'building'
            },
            {
                id: 'forge_kit_craft',
                name: 'Forge Kit',
                icon: 'assets/structures/forge.png',
                ingredients: [{ item: 'stone', count: 20 }, {item: 'wood', count: 5} /* Clay would be good here */],
                result: { item: 'forge_item', count: 1},
                category: 'structures'
            }
            // ... more advanced tools, weapons, armor
        ];
    }

    setupForgeRecipes() { // Requires forge & fuel (fuel handled by StructuresSystem)
        return [
            {
                id: 'iron_ingot_smelt',
                name: 'Iron Ingot',
                icon: 'assets/items/iron_ingot.png',
                ingredients: [{ item: 'iron_ore', count: 2 }], // Fuel is separate
                fuel: { item: 'wood', count: 1, perCycle: true }, // Example: 1 wood per smelt cycle
                result: { item: 'iron_ingot', count: 1 },
                category: 'materials',
                time: 10 // Seconds to craft one cycle
            },
            {
                id: 'iron_axe_craft_forge', // Requires ingots, effectively made at forge
                name: 'Iron Axe',
                icon: 'assets/items/iron_axe.png',
                ingredients: [{ item: 'iron_ingot', count: 3 }, { item: 'stick', count: 2 }],
                // This might not need "time" if ingots are the timed part. Or it's an assembly time.
                result: { item: 'iron_axe', count: 1 },
                category: 'tools',
                time: 15 // Assembly time at forge
            },
             {
                id: 'iron_pickaxe_craft_forge',
                name: 'Iron Pickaxe',
                icon: 'assets/items/iron_pickaxe.png',
                ingredients: [{ item: 'iron_ingot', count: 3 }, { item: 'stick', count: 2 }],
                result: { item: 'iron_pickaxe', count: 1 },
                category: 'tools',
                time: 15
            },
            // ... more iron tools, weapons, armor
        ];
    }

    // Checks if ingredients are available in the provided inventory (player's or a container)
    canCraft(recipe, inventoryInstance = this.game.inventory) {
        if (!recipe || !recipe.ingredients) return false;
        for (const ingredient of recipe.ingredients) {
            if (!inventoryInstance.hasItem(ingredient.item, ingredient.count)) {
                return false;
            }
        }
        // For timed recipes with fuel, StructuresSystem will handle fuel check separately before starting.
        return true;
    }

    // Attempts to craft an item.
    // 'stationType' can be null (hand craft), 'crafting_table', 'forge'.
    craft(recipeId, stationType = null) {
        let recipeList;
        if (!stationType) recipeList = this.recipes;
        else if (stationType === 'crafting_table') recipeList = this.craftingTableRecipes;
        else if (stationType === 'forge') recipeList = this.forgeRecipes;
        else {
            console.error('Invalid crafting station type:', stationType);
            return { success: false, message: 'Invalid station' };
        }

        const recipe = recipeList.find(r => r.id === recipeId);
        
        if (!recipe) {
            console.error('Recipe not found:', recipeId, "in station:", stationType);
            return { success: false, message: 'Recipe not found' };
        }
        
        if (!this.canCraft(recipe, this.game.inventory)) { // Always crafts from player inventory
            return { success: false, message: 'Missing ingredients' };
        }
        
        // If it's a timed recipe (like forge smelting or campfire cooking),
        // this method might just validate. The actual process is handled by StructuresSystem.
        if (recipe.time && (stationType === 'forge' || stationType === 'campfire')) {
            // The StructuresSystem will call this, consume items, and start its timed process.
            // For now, we assume this `craft` call is from a UI that already confirmed with StructureSystem
            // or it's an instant craft at a station.
            // Let's make forge recipes (non-smelting) instant if they don't list fuel.
            if (stationType === 'forge' && !recipe.fuel) {
                // Instant craft at forge (e.g. assembling iron tools from ingots)
            } else {
                 return { 
                    success: true, 
                    recipe: recipe, // Return recipe for StructureSystem to handle
                    type: 'timed_station_craft_initiated' 
                };
            }
        }
        
        // Consume ingredients from player inventory
        for (const ingredient of recipe.ingredients) {
            this.game.inventory.removeItem(ingredient.item, ingredient.count);
        }
        
        // Add result to player inventory
        // Items like tools/weapons are created with full durability here
        const resultItemData = getItemData(recipe.result.item);
        const itemProps = {};
        if (resultItemData.maxDurability) {
            itemProps.durability = resultItemData.maxDurability;
        }
        this.game.inventory.addItem(recipe.result.item, recipe.result.count, itemProps);
        
        return { 
            success: true, 
            message: `Crafted ${recipe.name}`,
            result: recipe.result
        };
    }
}
```
**Changes in `crafting.js`:**
*   Recipe IDs suffixed with `_craft`, `_smelt` etc., to avoid clashes with item IDs. Result items refer to the correct item IDs (e.g., `campfire_item`).
*   Simplified some recipes (e.g., bow, torch).
*   `canCraft` now defaults to checking player's inventory.
*   `craft` method:
    *   Takes `stationType`.
    *   Always consumes ingredients from player's inventory.
    *   Adds crafted items (tools/weapons) with full durability.
    *   For timed station crafts (forge/campfire), it can return a specific type so `StructuresSystem` can handle the timing. However, for simplicity in this pass, direct crafting at stations is assumed to be instant if not a "processing" type recipe (like smelting/cooking).
    *   Forge recipes for tools (e.g., Iron Axe) are treated as instant assembly if they don't specify fuel. Smelting (`iron_ingot_smelt`) is timed and fuel-based, handled by `StructuresSystem`.

--- START OF FILE building.js ---
```javascript
// building.js
import { GLTFLoader } from './libs/GLTFLoader.js'; // Adjust path as needed

class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.selectedBuildable = null; // Will be { item: ItemData, config: BuildableConfig }
        this.placementValid = false;
        this.buildables = this.setupBuildables(); 
        
        this.gridSize = 1.0; 
        this.ghostMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00ff00, transparent: true, opacity: 0.5, emissive: 0x003300 
        });
        this.invalidMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000, transparent: true, opacity: 0.5, emissive: 0x330000
        });
        
        this.ghostObject = null; // The visual ghost mesh
        this.placedBuildings = []; // Array of { id, mesh, buildableId, position, rotation, data, config }
        this.gltfLoader = new GLTFLoader();
        this.maxPlacementDistance = 10; // How far player can build
    }
    
    setupBuildables() { // Defines properties of *placed* structures
        return {
            'wooden_wall': {
                name: 'Wooden Wall',
                modelPath: 'assets/models/structures/wooden_wall.glb', 
                icon: 'assets/ui/icons/wooden_wall_icon.png', // UI Icon (might be same as item icon)
                collisionSize: { width: 2, height: 3, depth: 0.2 }, // Matches typical wall dimensions
                offset: { x: 0, y: 1.5, z: 0 }, // Offset from grid point to center of model base
                rotatable: true, snapsToGrid: true, category: 'wall'
            },
            'wooden_floor': {
                name: 'Wooden Floor',
                modelPath: 'assets/models/structures/wooden_floor.glb',
                icon: 'assets/ui/icons/wooden_floor_icon.png',
                collisionSize: { width: 2, height: 0.2, depth: 2 },
                offset: { x: 0, y: 0.1, z: 0 },
                rotatable: false, snapsToGrid: true, category: 'floor'
            },
            'wooden_door': { // This is the door *frame* with the door itself
                name: 'Wooden Door',
                modelPath: 'assets/models/structures/wooden_door_animated.glb', // Assume model has door as separate object for animation
                icon: 'assets/ui/icons/wooden_door_icon.png',
                collisionSize: { width: 2, height: 2.8, depth: 0.3 }, 
                offset: { x: 0, y: 1.4, z: 0 },
                rotatable: true, interactive: true, action: 'toggleDoor',
                snapsToGrid: true, category: 'door'
            },
            'campfire': {
                name: 'Campfire',
                modelPath: 'assets/models/structures/campfire_lit.glb', 
                icon: 'assets/ui/icons/campfire_icon.png',
                collisionSize: { radius: 0.5, height: 0.5 }, // Cylindrical
                offset: { x: 0, y: 0.25, z: 0 },
                rotatable: false, interactive: true, action: 'openCampfire',
                snapsToGrid: false, 
                lightSource: { color: 0xffaa33, intensity: 1.8, distance: 12, height: 0.6, decay: 1.5 },
                category: 'utility'
            },
             'crafting_table': {
                name: 'Crafting Table',
                modelPath: 'assets/models/structures/crafting_table.glb',
                icon: 'assets/ui/icons/crafting_table_icon.png',
                collisionSize: { width: 1.2, height: 1, depth: 0.7 },
                offset: { x: 0, y: 0.5, z: 0 },
                rotatable: true, interactive: true, action: 'openCraftingTable',
                snapsToGrid: false, category: 'utility'
            },
            'forge': {
                name: 'Forge',
                modelPath: 'assets/models/structures/forge.glb',
                icon: 'assets/ui/icons/forge_icon.png',
                collisionSize: { width: 1.0, height: 1.5, depth: 1.0 },
                offset: { x: 0, y: 0.75, z: 0 },
                rotatable: true, interactive: true, action: 'openForge',
                snapsToGrid: false,
                lightSource: { color: 0xff6020, intensity: 1.5, distance: 8, height: 0.8, decay: 1.5, activeOnlyWhenUsed: true },
                category: 'utility'
            },
            'storage_box': {
                name: 'Storage Box',
                modelPath: 'assets/models/structures/storage_box_A.glb',
                icon: 'assets/ui/icons/storage_box_icon.png',
                collisionSize: { width: 0.8, height: 0.8, depth: 0.6 },
                offset: { x: 0, y: 0.4, z: 0 }, // Origin at base center
                rotatable: true, interactive: true, action: 'openStorage',
                snapsToGrid: false, category: 'utility', storageSlots: 16
            }
        };
    }
    
    // Call this when player selects a placeable item from inventory/build menu
    selectBuildable(itemId) { // itemId is like 'wooden_wall_item'
        this.cancelPlacement(); 

        const itemData = getItemData(itemId); // ItemData for the item used to build
        if (!itemData || !itemData.buildableId) {
            console.warn("Item is not a valid buildable:", itemId);
            return false;
        }

        const buildableConfig = this.buildables[itemData.buildableId]; // Config for the actual structure
        if (!buildableConfig) {
            console.warn("No buildable config for buildableId:", itemData.buildableId);
            return false;
        }

        this.selectedBuildable = { item: itemData, config: buildableConfig };
        this.createGhostObject(this.selectedBuildable);
        this.game.ui.showNotification(`Building: ${buildableConfig.name}. Left-Click: Place, R: Rotate, Esc: Cancel`);
        return true;
    }
    
    async createGhostObject(selectedData) { // selectedData is {item, config}
        const config = selectedData.config;
        const collision = config.collisionSize;
        let geometry;

        if (config.modelPath) { // Try to use actual model for ghost if simple enough
            try {
                const gltf = await loadGLTFModel(config.modelPath, this.gltfLoader);
                this.ghostObject = gltf.scene;
                this.ghostObject.traverse(child => {
                    if (child.isMesh) {
                        child.material = this.ghostMaterial.clone(); // Use ghost material
                        child.castShadow = false;
                        child.receiveShadow = false;
                    }
                });
                if(config.scale) this.ghostObject.scale.set(config.scale.x, config.scale.y, config.scale.z);

            } catch (e) {
                console.warn("Ghost model load failed, using placeholder:", e);
                // Fallback to simple geometry
                if (collision.radius) geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16);
                else geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth);
                this.ghostObject = new THREE.Mesh(geometry, this.ghostMaterial);
            }
        } else {
            if (collision.radius) geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16);
            else geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth);
            this.ghostObject = new THREE.Mesh(geometry, this.ghostMaterial);
        }
        
        this.ghostObject.userData.buildableId = selectedData.item.buildableId;
        this.ghostObject.userData.rotationY = 0; 
        this.game.scene.add(this.ghostObject);
        this.updateGhostPosition(); 
    }
    
    updateGhostPosition() {
        if (!this.ghostObject || !this.selectedBuildable) return;
        
        const config = this.selectedBuildable.config;
        const raycaster = this.game.player.raycaster; // Use player's raycaster
        raycaster.setFromCamera({x: 0, y: 0}, this.game.camera); // Ray from center of screen
        
        // Intersect with terrain and existing buildings (that are collidable)
        const collidables = [this.game.world.terrainMesh, ...this.placedBuildings.map(b => b.mesh)];
        const intersects = raycaster.intersectObjects(collidables, true);
        
        let hitPoint = null;
        let hitObject = null;

        if (intersects.length > 0) {
            for (const hit of intersects) {
                if (hit.object === this.ghostObject) continue; // Don't hit self
                if (hit.distance > this.maxPlacementDistance) break; 
                
                hitPoint = hit.point.clone();
                hitObject = hit.object;
                break; 
            }
        }

        if (hitPoint) {
            this.ghostObject.visible = true;
            let placementPos = hitPoint.clone();

            if (config.snapsToGrid) {
                placementPos.x = Math.round(hitPoint.x / this.gridSize) * this.gridSize;
                placementPos.z = Math.round(hitPoint.z / this.gridSize) * this.gridSize;
                placementPos.y = this.game.world.getHeightAt(placementPos.x, placementPos.z); // Snap Y to terrain grid point
            } else {
                 // For non-grid items, place on surface of hit object or terrain
                 placementPos.y = hitPoint.y; // Use exact hit y for non-grid
                 if (hitObject.userData.isTerrain) { // Ensure it's on terrain height if hit terrain
                    placementPos.y = this.game.world.getHeightAt(hitPoint.x, hitPoint.z);
                 }
            }
            
            this.ghostObject.position.set(
                placementPos.x + (config.offset ? config.offset.x : 0),
                placementPos.y + (config.offset ? config.offset.y : 0),
                placementPos.z + (config.offset ? config.offset.z : 0)
            );
            this.ghostObject.rotation.y = this.ghostObject.userData.rotationY;

            this.placementValid = this.checkPlacementValidity(this.ghostObject, config);

            // Update material for all meshes in ghostObject if it's a model
            this.ghostObject.traverse(child => {
                if (child.isMesh && child.material) {
                    // Only replace if it's one of the ghost materials
                    if (child.material === this.ghostMaterial || child.material === this.invalidMaterial || 
                        (child.material.uuid === this.ghostMaterial.uuid || child.material.uuid === this.invalidMaterial.uuid)) {
                         child.material = this.placementValid ? this.ghostMaterial : this.invalidMaterial;
                    } else if (child.material.userData && child.material.userData.isGhostBase) { // If a cloned material
                        child.material.color.set(this.placementValid ? 0x00ff00 : 0xff0000);
                        child.material.emissive.set(this.placementValid ? 0x003300 : 0x330000);
                    }
                }
            });


        } else {
            this.ghostObject.visible = false; 
            this.placementValid = false;
        }
    }
    
    rotateGhost() {
        if (!this.ghostObject || !this.selectedBuildable || !this.selectedBuildable.config.rotatable) return;
        this.ghostObject.userData.rotationY = (this.ghostObject.userData.rotationY + Math.PI / 2) % (Math.PI * 2);
        // updateGhostPosition will apply the rotation
    }
    
    checkPlacementValidity(ghostObjToCheck, buildableConfig) {
        const terrainHeight = this.game.world.getHeightAt(ghostObjToCheck.position.x, ghostObjToCheck.position.z);
        // Check if placement position y is reasonably close to terrain height (considering offset)
        const expectedBaseY = terrainHeight + (buildableConfig.offset ? buildableConfig.offset.y : 0) - (buildableConfig.collisionSize.height/2);
        if (Math.abs(ghostObjToCheck.position.y - (expectedBaseY + buildableConfig.collisionSize.height/2) ) > 1.0 ) { // Allow some tolerance
            // console.log("Too high or low from terrain", ghostObjToCheck.position.y, expectedBaseY);
            // return false; // This check can be tricky with offsets
        }
        if (this.game.world.getBiomeAt(ghostObjToCheck.position) === 'water' && buildableConfig.category !== 'water_structure') { // Assuming you might have water structures
            return false;
        }

        const ghostBox = new THREE.Box3().setFromObject(ghostObjToCheck);
        for (const building of this.placedBuildings) {
            const buildingBox = new THREE.Box3().setFromObject(building.mesh);
            if (ghostBox.intersectsBox(buildingBox)) {
                return false;
            }
        }
        // Check collision with resources (optional, can be expensive)
        // for (const resource of this.game.resources.activeResources) {
        //    const resourceBox = new THREE.Box3().setFromObject(resource);
        //    if (ghostBox.intersectsBox(resourceBox)) return false;
        // }
        return true;
    }
        
    placeBuildable() {
        if (!this.ghostObject || !this.placementValid || !this.selectedBuildable) return false;
        
        const itemToConsumeId = this.selectedBuildable.item.id; 
        const buildableId = this.ghostObject.userData.buildableId;
        const config = this.buildables[buildableId];

        if (!this.game.inventory.hasItem(itemToConsumeId, 1)) {
            this.game.ui.showNotification(`You don't have ${getItemData(itemToConsumeId).name}.`);
            this.cancelPlacement();
            return false;
        }
        
        this.game.inventory.removeItem(itemToConsumeId, 1);
        
        const position = this.ghostObject.position.clone();
        const rotationY = this.ghostObject.userData.rotationY;
        
        // Actual creation is async due to model loading
        this.createBuilding(buildableId, position, rotationY, config).then(() => {
            this.game.ui.showNotification(`Placed ${config.name}`);
        }).catch(err => {
            console.error("Failed to place building:", err);
            this.game.ui.showNotification(`Failed to place ${config.name}.`);
            // Refund item if placement failed after consumption (tricky, depends on error point)
            this.game.inventory.addItem(itemToConsumeId, 1); 
        });
        
        if (!this.game.inventory.hasItem(itemToConsumeId, 1)) {
            this.cancelPlacement(); // No more items to build with
        } else {
            this.updateGhostPosition(); // Refresh for next placement
        }
        return true; // Placement initiated
    }
    
    async createBuilding(buildableId, position, rotationY, config) {
        try {
            if (config.modelPath) {
                 const gltf = await loadGLTFModel(config.modelPath, this.gltfLoader);
                 const model = gltf.scene;
                 if(config.scale) model.scale.set(config.scale.x, config.scale.y, config.scale.z);

                 model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                         // Optional: if model parts need individual interaction data
                        // child.userData.parentStructure = model; 
                    }
                });
                this._finalizeBuilding(model, buildableId, position, rotationY, config);
            } else {
                this._createPlaceholderBuilding(buildableId, position, rotationY, config);
            }
        } catch (error) {
            console.error(`Failed to load/create building model ${config.modelPath || buildableId}:`, error);
            this._createPlaceholderBuilding(buildableId, position, rotationY, config); // Fallback
            throw error; // Re-throw to be caught by placeBuildable
        }
    }

    _createPlaceholderBuilding(buildableId, position, rotationY, config) {
        const collision = config.collisionSize;
        let geometry;
        if (collision.radius) { geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16); }
        else { geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth); }
        
        const material = new THREE.MeshLambertMaterial({ 
            color: buildableId.includes('wooden') ? 0x966F33 : 
                   buildableId === 'campfire' ? 0x505050 : 
                   0xAAAAAA 
        });
        const mesh = new THREE.Mesh(geometry, material);
        this._finalizeBuilding(mesh, buildableId, position, rotationY, config);
        console.warn("Using placeholder for building:", buildableId);
    }

    _finalizeBuilding(mesh, buildableId, position, rotationY, config) {
        mesh.position.copy(position);
        mesh.rotation.y = rotationY;
        
        mesh.userData = {
            type: 'structure', 
            buildableId: buildableId,
            interactive: config.interactive || false,
            action: config.action || null,
            state: config.initialState || 'closed', // For doors, etc.
            config: config // Store config on mesh for easy access during interaction
        };

        if (config.storageSlots) {
            mesh.userData.storageId = `storage_${generateUUID()}`; // Use util function
            this.game.structures.initializeStorage(mesh.userData.storageId, config.storageSlots);
        }
        
        this.game.scene.add(mesh);
        const placedBuildingEntry = {
            id: generateUUID(), 
            mesh: mesh,
            buildableId: buildableId,
            position: position.clone(),
            rotation: rotationY,
            config: config 
        };
        this.placedBuildings.push(placedBuildingEntry);
        
        if (config.lightSource) {
            const light = new THREE.PointLight(
                config.lightSource.color,
                config.lightSource.intensity,
                config.lightSource.distance,
                config.lightSource.decay !== undefined ? config.lightSource.decay : 1
            );
            light.castShadow = false; // Structure lights usually don't cast shadows for perf
            // Position light relative to the building mesh (at its offset height)
            const lightOffset = new THREE.Vector3(0, config.lightSource.height || 0.5, 0);
            mesh.add(light); 
            light.position.copy(lightOffset);
            
            mesh.userData.light = light;
            light.visible = !config.lightSource.activeOnlyWhenUsed;
        }
    }
    
    cancelPlacement() {
        if (this.ghostObject) {
            this.game.scene.remove(this.ghostObject);
            this.ghostObject.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    // Materials on ghost are shared or simple, dispose if complex/unique per ghost
                    // if (child.material) child.material.dispose(); 
                }
            });
            this.ghostObject = null;
        }
        this.selectedBuildable = null;
        this.placementValid = false;
        // this.game.ui.hideInteractionPrompt(); // Or a specific build mode prompt if one exists
    }
    
    interactWithBuilding(buildingMesh) { 
        if (!buildingMesh || !buildingMesh.userData || !buildingMesh.userData.interactive) return;
        
        const action = buildingMesh.userData.action;
        // const buildableId = buildingMesh.userData.buildableId;
        // const config = this.buildables[buildableId]; // or buildingMesh.userData.config

        switch(action) {
            case 'toggleDoor': this.toggleDoor(buildingMesh); break;
            case 'openCampfire': this.game.structures.openCampfire(buildingMesh); break;
            case 'openCraftingTable': this.game.structures.openCraftingTable(buildingMesh); break;
            case 'openForge': this.game.structures.openForge(buildingMesh); break;
            case 'openStorage': this.game.structures.openStorage(buildingMesh); break;
            default:
                 console.log("Interacted with unhandled structure action:", action, buildingMesh.userData.buildableId);
        }
    }
    
    toggleDoor(doorMesh) {
        // This assumes the door model is designed for this simple rotation.
        // E.g. door is a child of the frame, and its origin is at the hinge.
        // If door is part of main mesh, need to find it by name.
        let actualDoorObject = doorMesh.getObjectByName('DoorPivot'); // Or whatever the door mesh is named in GLTF
        if (!actualDoorObject) actualDoorObject = doorMesh; // Fallback to main mesh if no named part

        const isOpen = actualDoorObject.userData.state === 'open';
        const openAngle = Math.PI / 2; // 90 degrees

        if (isOpen) {
            actualDoorObject.rotation.y -= openAngle; 
            actualDoorObject.userData.state = 'closed';
        } else {
            actualDoorObject.rotation.y += openAngle;
            actualDoorObject.userData.state = 'open';
        }
        // TODO: Add door opening/closing sounds
    }
    
    update(deltaTime) {
        if (this.ghostObject) {
            this.updateGhostPosition();
        }
        this.placedBuildings.forEach(building => {
            if (building.mesh.userData.light && building.config.lightSource && !building.config.lightSource.activeOnlyWhenUsed) {
                if (building.buildableId === 'campfire') { 
                    building.mesh.userData.light.intensity = building.config.lightSource.intensity * 
                        (1 + Math.sin(this.game.gameTime * 8 + building.id.charCodeAt(0)) * 0.15); // Unique flicker per campfire
                }
            }
        });
    }
    
    saveBuildings() {
        return this.placedBuildings.map(b => ({
            buildableId: b.buildableId,
            position: { x: b.position.x, y: b.position.y, z: b.position.z },
            rotation: b.rotation,
            state: b.mesh.userData.state || 'closed',
            storageId: b.mesh.userData.storageId,
            uniqueId: b.id // Save unique ID for tracking active processes if needed
        }));
    }
    
    async loadBuildings(buildingsData) {
        // Clear existing visually, actual array cleared after all loaded
        this.placedBuildings.forEach(b => {
            if (b.mesh.userData.light) b.mesh.remove(b.mesh.userData.light);
            this.game.scene.remove(b.mesh);
             b.mesh.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
        });
        const oldBuildings = this.placedBuildings;
        this.placedBuildings = [];
        
        const loadPromises = buildingsData.map(data => {
            const config = this.buildables[data.buildableId];
            if (config) {
                // createBuilding is async, returns a promise when _finalizeBuilding is done
                return this.createBuilding(data.buildableId, new THREE.Vector3(data.position.x, data.position.y, data.position.z), data.rotation, config)
                    .then(() => {
                        // Find the newly created building (it's now in this.placedBuildings)
                        // This relies on createBuilding adding to placedBuildings synchronously,
                        // or need a more robust way to get the created mesh.
                        // Let's assume _finalizeBuilding populates mesh.userData and adds to this.placedBuildings.
                        const foundBuildingEntry = this.placedBuildings.find(pb => 
                            pb.position.distanceTo(new THREE.Vector3(data.position.x, data.position.y, data.position.z)) < 0.1 &&
                            pb.buildableId === data.buildableId &&
                            (!data.uniqueId || pb.id === data.uniqueId) // Match by uniqueId if available
                        );

                        if (foundBuildingEntry && foundBuildingEntry.mesh) {
                            const mesh = foundBuildingEntry.mesh;
                            if (data.state) mesh.userData.state = data.state;
                            
                            // Special handling for door state restoration
                            if (mesh.userData.action === 'toggleDoor') {
                                let actualDoorObject = mesh.getObjectByName('DoorPivot') || mesh;
                                actualDoorObject.userData.state = 'closed'; // Assume closed initially
                                if (data.state === 'open') {
                                    this.toggleDoor(mesh); // Call toggle to set correct open state/rotation
                                }
                            }
                            if(data.storageId && mesh.userData) {
                                mesh.userData.storageId = data.storageId;
                                // Storage contents are loaded by StructuresSystem separately using this ID
                            }
                            if(data.uniqueId) { // Restore unique ID if saved
                                foundBuildingEntry.id = data.uniqueId;
                                mesh.uuid = data.uniqueId; // Override Three.js UUID if necessary for process tracking
                            }
                        } else {
                            console.warn("Could not find loaded building to apply state:", data);
                        }
                    });
            }
            return Promise.resolve(); // Skip if no config
        });

        await Promise.all(loadPromises);
        console.log("All buildings loaded and states applied.");
    }
}
```
**Changes in `building.js`:**
*   Import `GLTFLoader` and create an instance. `loadGLTFModel` from `utils.js` used.
*   `selectBuildable`: Takes item ID (e.g., `wooden_wall_item`) and uses `itemData.buildableId` to get the structure's config.
*   `createGhostObject`: Now `async` and attempts to load the actual model for the ghost, falling back to simple geometry.
*   `updateGhostPosition`: Improved material update for ghost models.
*   `placeBuildable`: Calls `createBuilding` (async) and handles promise for UI feedback/error handling. Item refund on error.
*   `createBuilding`: Now `async` to handle model loading.
*   `_finalizeBuilding`: Added `decay` to PointLight. Stores full `config` in `mesh.userData`.
*   `toggleDoor`: Attempts to find a sub-object named 'DoorPivot' for more accurate door animation.
*   `saveBuildings`: Added `uniqueId` for better tracking.
*   `loadBuildings`: Made `async` and uses `Promise.all` to wait for all buildings to be created before attempting to apply states. More robust state application. Relies on unique IDs if present.
*   Model paths updated to be more specific, e.g., `assets/models/structures/`.

--- START OF FILE animals.js ---
```javascript
// animals.js - Handles AI-controlled animals and creatures
import { GLTFLoader } from './libs/GLTFLoader.js'; // Adjust path as needed

class AnimalSystem {
    constructor(game) {
        this.game = game;
        this.animals = []; // Array of Animal instances
        this.animalTypes = this.setupAnimalTypes();
        this.maxAnimalsInWorld = 30; 
        this.spawnRadiusFromPlayer = 60; 
        this.despawnRadiusFromPlayer = 100;
        this.spawnCheckInterval = 8; // Seconds
        this.timeSinceLastSpawnCheck = 0;
        this.gltfLoader = new GLTFLoader();
        this.nextAnimalInstanceId = 0;
    }
    
    setupAnimalTypes() { // Defines the properties of animal species
        return {
            'deer': {
                name: 'Deer', modelPath: 'assets/models/animals/deer.glb', scale: 0.9,
                speed: 3.5, health: 40,
                drops: [
                    { item: 'raw_meat', count: { min: 2, max: 4 }, chance: 1.0 },
                    { item: 'leather', count: { min: 1, max: 2 }, chance: 0.8 }
                ],
                behavior: 'passive_flee', fleeDistance: 12, detectionRange: 20,
                spawnChance: 0.4, minGroup: 1, maxGroup: 3, biomes: ['forest', 'plains', 'mountains_foot']
            },
            'wolf': {
                name: 'Wolf', modelPath: 'assets/models/animals/wolf.glb', scale: 0.75,
                speed: 4.5, health: 50, damage: 8, attackRange: 1.8, attackSpeed: 1.2, // Attacks per second
                drops: [
                    { item: 'raw_meat', count: { min: 1, max: 3 }, chance: 1.0 },
                    { item: 'wolf_pelt', count: { min: 1, max: 1 }, chance: 0.7 },
                    { item: 'wolf_fang', count: { min: 0, max: 2 }, chance: 0.3 }
                ],
                behavior: 'aggressive_hunt', detectionRange: 25,
                spawnChance: 0.2, minGroup: 2, maxGroup: 4, biomes: ['forest', 'mountains']
            },
            'rabbit': {
                name: 'Rabbit', modelPath: 'assets/models/animals/rabbit.glb', scale: 0.3,
                speed: 5, health: 15,
                drops: [
                    { item: 'raw_meat', count: { min: 1, max: 1 }, chance: 1.0 }, // Tiny meat
                    { item: 'rabbit_fur', count: { min: 1, max: 1 }, chance: 0.9 }
                ],
                behavior: 'skittish_flee', fleeDistance: 10, detectionRange: 15,
                spawnChance: 0.5, minGroup: 1, maxGroup: 2, biomes: ['plains', 'forest']
            },
            // Add more animals
        };
    }
    
    spawnInitialAnimals() {
        const initialSpawnCount = Math.floor(this.maxAnimalsInWorld * 0.6);
        for (let i = 0; i < initialSpawnCount; i++) {
            this.trySpawnGroup();
        }
        console.log("Initial animal spawning process started.");
    }

    trySpawnGroup() {
        if (this.animals.length >= this.maxAnimalsInWorld) return;

        const playerPos = this.game.player.position;
        const biomeAtPlayer = this.game.world.getBiomeAt(playerPos);
        
        const eligibleTypes = Object.entries(this.animalTypes).filter(([_, data]) => 
            data.biomes.includes(biomeAtPlayer) || data.biomes.includes('any') // 'any' for widespread animals
        );
        if (eligibleTypes.length === 0) return;
        
        const [chosenTypeId, chosenTypeData] = this.chooseRandomAnimalType(eligibleTypes);
        if (!chosenTypeId) return;
        
        const groupSize = getRandomInt(chosenTypeData.minGroup, chosenTypeData.maxGroup);
        
        // Attempt to find a spawn point for the group leader
        const leaderSpawnPos = this.findSpawnPosition(playerPos, chosenTypeData, this.spawnRadiusFromPlayer, 20); // Min 20 units away
        if (!leaderSpawnPos) return;

        for (let i = 0; i < groupSize; i++) {
            if (this.animals.length >= this.maxAnimalsInWorld) break;
            let spawnPos = leaderSpawnPos.clone();
            if (i > 0) { // Offset followers
                spawnPos.x += getRandomFloat(-5, 5);
                spawnPos.z += getRandomFloat(-5, 5);
                spawnPos.y = this.game.world.getHeightAt(spawnPos.x, spawnPos.z);
            }
            // Final check for follower position validity
            if (spawnPos.y < this.game.world.waterLevel + 0.2) continue; 
            
            this.createAndAddAnimal(chosenTypeId, spawnPos);
        }
    }
    
    chooseRandomAnimalType(eligibleAnimalTypes) { // eligible is array of [id, data]
        const totalChance = eligibleAnimalTypes.reduce((sum, [_, data]) => sum + data.spawnChance, 0);
        let randomVal = Math.random() * totalChance;
        for (const [typeId, data] of eligibleAnimalTypes) {
            randomVal -= data.spawnChance;
            if (randomVal <= 0) return [typeId, data];
        }
        return eligibleAnimalTypes.length > 0 ? eligibleAnimalTypes[0] : [null, null]; // Fallback
    }
    
    findSpawnPosition(centerPos, animalData, maxRadius, minRadius = 0) {
        for (let attempt = 0; attempt < 20; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = getRandomFloat(minRadius, maxRadius);
            const x = centerPos.x + Math.cos(angle) * radius;
            const z = centerPos.z + Math.sin(angle) * radius;
            
            const y = this.game.world.getHeightAt(x, z);
            if (y < this.game.world.waterLevel + 0.2) continue; // Avoid water
            if (Math.abs(x) > this.game.world.size / 2 || Math.abs(z) > this.game.world.size / 2) continue; // Out of bounds

            const biome = this.game.world.getBiomeAt(new THREE.Vector3(x,y,z));
            if(!animalData.biomes.includes(biome) && !animalData.biomes.includes('any')) continue;

            // Optional: Check proximity to other animals or structures
            return new THREE.Vector3(x, y, z);
        }
        return null;
    }
    
    async createAndAddAnimal(typeId, position) {
        const animalData = this.animalTypes[typeId];
        if (!animalData) return;

        const instanceId = `animal_${this.nextAnimalInstanceId++}`;
        const animalInstance = new Animal(this.game, instanceId, typeId, animalData, position);
        this.animals.push(animalInstance);

        try {
            await animalInstance.loadModel(this.gltfLoader);
        } catch (error) {
            console.error(`Failed to load model for ${typeId}:`, error);
            // Animal instance still exists, will use placeholder
        }
    }

    update(deltaTime) {
        this.timeSinceLastSpawnCheck += deltaTime;
        if (this.timeSinceLastSpawnCheck > this.spawnCheckInterval) {
            this.trySpawnGroup();
            this.timeSinceLastSpawnCheck = 0;
        }

        const playerPos = this.game.player.position;
        for (let i = this.animals.length - 1; i >= 0; i--) {
            const animal = this.animals[i];
            animal.update(deltaTime, playerPos, this.game.world);

            // Despawn if too far or dead and looted
            const distToPlayer = animal.mesh.position.distanceTo(playerPos);
            if (distToPlayer > this.despawnRadiusFromPlayer || (animal.state === 'dead' && animal.looted)) {
                animal.removeFromScene();
                this.animals.splice(i, 1);
            }
        }
    }

    attackAnimalById(animalInstanceId, damage) {
        const animal = this.animals.find(a => a.instanceId === animalInstanceId);
        if (animal && animal.state !== 'dead') {
            animal.takeDamage(damage);
        }
    }

    lootAnimal(animalInstanceId) {
        const animal = this.animals.find(a => a.instanceId === animalInstanceId);
        if (animal && animal.state === 'dead' && !animal.looted) {
            animal.dropLoot();
            this.game.ui.showNotification(`Looted ${animal.config.name}.`);
        }
    }
}


class Animal {
    constructor(game, instanceId, typeId, config, position) {
        this.game = game;
        this.instanceId = instanceId;
        this.typeId = typeId;
        this.config = config; // From animalTypes
        
        this.mesh = null; // THREE.Group or Mesh
        this.mixer = null; // For animations
        this.animations = {}; // Store animation actions

        this.state = 'idle'; // idle, wander, flee, chase, attack, dead
        this.health = config.health;
        this.targetPosition = position.clone(); // For wander state
        this.stateTimer = 0;
        this.looted = false;

        this.currentPosition = position.clone(); // Initial position
    }

    async loadModel(loader) {
        try {
            if (this.config.modelPath) {
                const gltf = await loadGLTFModel(this.config.modelPath, loader);
                this.mesh = gltf.scene;
                this.mesh.scale.set(this.config.scale, this.config.scale, this.config.scale);
                this.mesh.position.copy(this.currentPosition);
                this.mesh.rotation.y = Math.random() * Math.PI * 2; // Random initial orientation

                this.mesh.userData = { 
                    type: 'animal', 
                    animalId: this.typeId, // Species ID
                    animalInstanceId: this.instanceId, // Unique instance ID
                    state: this.state, // Keep mesh userData synced
                    config: this.config // Direct access to config from mesh if needed
                };
                this.mesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData = this.mesh.userData; // Propagate main data to child meshes
                    }
                });
                this.game.scene.add(this.mesh);

                // Basic animation setup (if model has animations)
                if (gltf.animations && gltf.animations.length) {
                    this.mixer = new THREE.AnimationMixer(this.mesh);
                    // Example: find idle, walk, run animations
                    // gltf.animations.forEach(clip => {
                    //    this.animations[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
                    // });
                    // if (this.animations.idle) this.animations.idle.play();
                    // else if (this.animations.walk && this.state === 'wander') this.animations.walk.play();
                }

            } else {
                this.createPlaceholder();
            }
        } catch (err) {
            console.error(`Error loading animal model ${this.config.modelPath}:`, err);
            this.createPlaceholder();
        }
    }

    createPlaceholder() {
        const s = this.config.scale * 0.5;
        const geometry = new THREE.BoxGeometry(s, s * 1.2, s * 2); // elongated box
        const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.currentPosition);
        this.mesh.userData = { type: 'animal', animalId: this.typeId, animalInstanceId: this.instanceId, state: this.state, config: this.config };
        this.game.scene.add(this.mesh);
        console.warn(`Using placeholder for animal: ${this.typeId}`);
    }

    update(deltaTime, playerPos, world) {
        if (!this.mesh || this.state === 'dead') {
            if (this.mixer && this.state === 'dead') this.mixer.update(deltaTime); // Update death animation
            return;
        }

        this.stateTimer -= deltaTime;
        const distToPlayer = this.mesh.position.distanceTo(playerPos);

        // State transitions
        switch (this.config.behavior) {
            case 'passive_flee':
            case 'skittish_flee':
                if (distToPlayer < this.config.fleeDistance && this.state !== 'flee') {
                    this.setState('flee');
                } else if (this.state === 'flee' && distToPlayer > this.config.detectionRange * 1.5) {
                    this.setState('idle'); // Stop fleeing if far enough
                }
                break;
            case 'aggressive_hunt':
                if (this.state !== 'chase' && this.state !== 'attack' && distToPlayer < this.config.detectionRange) {
                    this.setState('chase');
                } else if (this.state === 'chase' && distToPlayer > this.config.detectionRange * 1.5) {
                     this.setState('idle'); // Lost player
                }
                if ((this.state === 'chase' || this.state === 'attack') && distToPlayer < this.config.attackRange) {
                    this.setState('attack');
                } else if (this.state === 'attack' && distToPlayer > this.config.attackRange * 1.2) {
                    this.setState('chase'); // Player moved out of attack range
                }
                break;
        }
        
        if (this.stateTimer <= 0) {
            if (this.state === 'idle' || this.state === 'wander') {
                this.setState(Math.random() < 0.3 ? 'idle' : 'wander');
            }
        }

        // State actions
        switch (this.state) {
            case 'idle':
                // Play idle animation
                // this.playAnimation('idle');
                break;
            case 'wander':
                // this.playAnimation('walk');
                if (this.mesh.position.distanceTo(this.targetPosition) < 1.0) {
                    this.setState('idle'); // Reached destination
                } else {
                    this.moveTowards(this.targetPosition, this.config.speed * 0.7, deltaTime, world);
                }
                break;
            case 'flee':
                // this.playAnimation('run');
                const fleeDirection = this.mesh.position.clone().sub(playerPos).normalize();
                const fleeTarget = this.mesh.position.clone().addScaledVector(fleeDirection, 10);
                this.moveTowards(fleeTarget, this.config.speed * 1.2, deltaTime, world);
                break;
            case 'chase':
                // this.playAnimation('run');
                this.moveTowards(playerPos, this.config.speed, deltaTime, world);
                break;
            case 'attack':
                // this.playAnimation('attack');
                this.mesh.lookAt(playerPos); // Face player
                if (this.stateTimer <=0 ) { // Cooldown for attack
                     this.game.player.takeDamage(this.config.damage, this.config.name);
                     this.stateTimer = 1 / this.config.attackSpeed; // Reset attack cooldown
                }
                break;
        }
        
        if (this.mixer) this.mixer.update(deltaTime);
        this.mesh.userData.state = this.state; // Keep mesh userData synced
    }

    setState(newState) {
        if (this.state === newState) return;
        // console.log(`${this.instanceId} (${this.typeId}) changing from ${this.state} to ${newState}`);
        this.state = newState;
        this.mesh.userData.state = newState; // Sync with mesh
        
        switch (newState) {
            case 'idle':
                this.stateTimer = getRandomFloat(2, 5); // Idle for 2-5 seconds
                // Stop previous animation, play idle
                break;
            case 'wander':
                const wanderDistance = getRandomFloat(5, 15);
                const angle = Math.random() * Math.PI * 2;
                this.targetPosition.set(
                    this.mesh.position.x + Math.cos(angle) * wanderDistance,
                    this.mesh.position.y, // Y will be adjusted by moveTowards
                    this.mesh.position.z + Math.sin(angle) * wanderDistance
                );
                this.stateTimer = wanderDistance / (this.config.speed * 0.5); // Time to reach target
                // Play walk animation
                break;
            case 'flee':
                 this.stateTimer = getRandomFloat(3, 6); // Flee for some time or until safe
                 // Play run animation
                break;
            case 'chase':
                this.stateTimer = 10; // Chase for max 10 seconds if player not re-detected
                // Play run animation
                break;
            case 'attack':
                this.stateTimer = 1 / this.config.attackSpeed; // Initial attack cooldown
                // Play attack animation
                break;
            case 'dead':
                // Play death animation, then stop updating movement
                // if (this.animations.death) this.animations.death.play();
                // else if (this.animations.idle) { this.animations.idle.stop(); this.animations.idle.reset(); }
                // Make mesh fall to ground or ragdoll (simplified: just stop)
                setTimeout(() => this.dropLoot(), 500); // Drop loot after a short delay
                break;
        }
    }

    moveTowards(target, speed, deltaTime, world) {
        if (!this.mesh) return;
        const direction = target.clone().sub(this.mesh.position);
        direction.y = 0; // Move mainly on XZ plane
        if (direction.lengthSq() < 0.01) return; // Already at target
        direction.normalize();

        const moveDistance = speed * deltaTime;
        const nextX = this.mesh.position.x + direction.x * moveDistance;
        const nextZ = this.mesh.position.z + direction.z * moveDistance;
        const nextY = world.getHeightAt(nextX, nextZ); // Get terrain height at next pos

        // Basic collision avoidance with terrain (don't go into steep slopes if not mountain animal)
        // float targetSlope = world.getSlopeAt(nextX, nextZ);
        // if (targetSlope > animal.maxSlope) return;
        
        this.mesh.position.set(nextX, nextY, nextZ);
        
        // Smoothly look towards movement direction
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0,0,1), // Model's default forward
            direction
        );
        this.mesh.quaternion.slerp(targetQuaternion, 0.1); // Adjust slerp factor for turn speed
    }

    takeDamage(amount) {
        if (this.state === 'dead') return;
        this.health -= amount;
        // TODO: visual/audio feedback (flash red, sound)
        // this.game.ui.showFloatingText(this.mesh.position, `-${amount}`, 'red');
        
        if (this.health <= 0) {
            this.health = 0;
            this.setState('dead');
        } else {
            // Aggro if attacked (if not already aggressive)
            if (this.config.behavior === 'passive_flee' && this.config.name !== 'Rabbit') { // Deer might fight back briefly or just flee faster
                 this.setState('flee'); // Ensure it flees
            } else if (this.config.behavior !== 'aggressive_hunt' && this.config.behavior !== 'skittish_flee') {
                // Territorial or defensive animals might turn aggressive
                // this.setState('chase'); 
            }
        }
    }

    dropLoot() {
        if (this.looted) return;
        this.config.drops.forEach(drop => {
            if (Math.random() < drop.chance) {
                const count = getRandomInt(drop.count.min, drop.count.max);
                if (count > 0) {
                    this.game.inventory.addItem(drop.item, count);
                     // No individual notification here, one "Looted X" from system
                }
            }
        });
        this.looted = true;
        // Optionally, change mesh appearance (e.g., disappear, become a skeleton)
        // For now, it will just get despawned if looted.
    }

    removeFromScene() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
}
```
**Changes in `animals.js`:**
*   Import `GLTFLoader` and create an instance.
*   `spawnInitialAnimals` and `trySpawnGroup` provide basic logic for spawning groups.
*   `chooseRandomAnimalType` and `findSpawnPosition` implemented.
*   `createAndAddAnimal` instantiates `Animal` class and calls its `loadModel`.
*   `Animal` class:
    *   `loadModel` is `async` and handles GLTF loading and basic animation setup (conceptual). Placeholder creation on failure.
    *   `update`: Basic state machine logic (idle, wander, flee, chase, attack). Transitions and actions are rudimentary.
    *   `setState`: Manages state transitions and timers.
    *   `moveTowards`: Basic movement and orientation logic.
    *   `takeDamage`: Reduces health, changes state to 'dead' if health is 0.
    *   `dropLoot`: Adds items to player inventory based on `drops` config.
    *   `removeFromScene`: Cleans up mesh, geometry, materials.
*   Unique `instanceId` for each animal. `attackAnimalById` and `lootAnimal` use this.

--- START OF FILE structures.js ---
```javascript
// js/structures.js

class StructuresSystem {
    constructor(game) {
        this.game = game;
        // activeStructureInstance is the MESH of the currently open structure UI (e.g., campfireMesh)
        this.activeStructureInstance = null; 
        
        // Keyed by structure's mesh.uuid or a custom persistent ID if available from save data.
        // Value: Array of process objects for that specific structure instance.
        this.activeCraftingProcesses = {}; 
        
        // Maps storageId (from buildingMesh.userData.storageId) to an array of item objects.
        this.storageContainers = new Map(); 
        
        this.cookingRecipes = this.setupCookingRecipes();
        // Forge recipes are in CraftingSystem but processed here if timed/fueled
    }

    initializeStorage(storageId, numSlots) {
        if (!this.storageContainers.has(storageId)) {
            this.storageContainers.set(storageId, new Array(numSlots).fill(null));
        }
    }
    
    setupCookingRecipes() { // Recipes for campfire
        return [
            {
                id: 'cook_raw_meat', name: 'Cook Raw Meat', icon: 'assets/items/cooked_meat.png',
                ingredients: [{ item: 'raw_meat', count: 1 }],
                fuel: { item: 'wood', count: 1, perCycle: true }, // 1 wood per raw_meat
                result: { item: 'cooked_meat', count: 1 }, time: 10 // seconds
            },
            {
                id: 'cook_raw_fish', name: 'Cook Raw Fish', icon: 'assets/items/cooked_fish.png',
                ingredients: [{ item: 'raw_fish', count: 1 }],
                fuel: { item: 'wood', count: 1, perCycle: true },
                result: { item: 'cooked_fish', count: 1 }, time: 8
            },
            {
                id: 'brew_herb_tea', name: 'Brew Herb Tea', icon: 'assets/items/herb_tea.png',
                ingredients: [ { item: 'herbs', count: 2 }, { item: 'filled_water_container', count: 1 } ],
                fuel: { item: 'wood', count: 1, perCycle: true },
                result: { item: 'herb_tea', count: 1 }, 
                byproducts: [{item: 'empty_water_container', count: 1}], // Returns empty container
                time: 12 
            }
        ];
    }
    
    openCampfire(campfireMesh) {
        this.activeStructureInstance = campfireMesh;
        this.game.ui.closeAllMenus(); // Close other main menus
        this.updateStationMenu('campfire', campfireMesh.uuid, this.cookingRecipes, 4, 'Campfire');
        this.game.ui.campfireMenu.style.display = 'block';
        this.game.player.controls.unlock();
    }

    openCraftingTable(tableMesh) {
        this.activeStructureInstance = tableMesh; // Track active instance if needed for future features
        this.game.ui.closeAllMenus();
        // Use the main crafting grid but populate with table recipes
        this.game.ui.updateCraftingMenu(this.game.crafting.craftingTableRecipes, 'crafting_table');
        // Ensure the craftingMenu (generic) is shown and titled correctly
        const craftingMenuDOM = document.getElementById('craftingMenu');
        craftingMenuDOM.querySelector('h2').textContent = "Crafting Table";
        craftingMenuDOM.style.display = 'block';
        this.game.player.controls.unlock();
    }

    openForge(forgeMesh) {
        this.activeStructureInstance = forgeMesh;
        this.game.ui.closeAllMenus();
        // Forge recipes for smelting are timed. Assembly recipes might be instant (handled by CraftingSystem.craft)
        // or also timed here. Let's assume all forge recipes are shown via station menu.
        this.updateStationMenu('forge', forgeMesh.uuid, this.game.crafting.forgeRecipes, 2, 'Forge'); // 2 slots for forge
        this.game.ui.forgeMenu.style.display = 'block';
        this.game.player.controls.unlock();
    }

    // Generic function to update a station's UI (Campfire, Forge)
    updateStationMenu(stationType, instanceId, recipesList, numSlots, title) {
        const menuElement = document.getElementById(`${stationType}Menu`);
        if (!menuElement) {
            console.error(`${stationType}Menu DOM element not found!`);
            return;
        }
        
        if (!this.activeCraftingProcesses[instanceId]) {
            this.activeCraftingProcesses[instanceId] = new Array(numSlots).fill(null);
        }
        const processes = this.activeCraftingProcesses[instanceId];

        const slotsContainerId = `${stationType}Slots`;
        let slotsContainer = document.getElementById(slotsContainerId);
        if (!slotsContainer) { // Create if not exists
            menuElement.innerHTML = `<button class="close-menu-btn" onclick="gameInstance.structures.closeStructureUI('${stationType}')">X</button>
                                     <h2>${title}</h2>
                                     <div class="structure-slots" id="${slotsContainerId}"></div>`;
            slotsContainer = document.getElementById(slotsContainerId);
        } else { // Clear previous slots but keep title and close button
             slotsContainer.innerHTML = '';
        }
        
        for (let i = 0; i < numSlots; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'inventory-slot interactive-slot'; // Use inventory-slot for consistent styling
            slotDiv.dataset.slotIndex = i;
            slotDiv.style.width = '80px'; slotDiv.style.height = '80px'; // Standard structure slot size

            const process = processes[i];
            if (process && process.recipe) {
                const itemIcon = getItemData(process.recipe.result.item).icon;
                slotDiv.innerHTML = `<img src="${itemIcon}" alt="${process.recipe.name}" style="max-width:50px; max-height:50px;">`;
                
                const progressSvg = this.createProgressCircleSVG(process.progress / process.totalTime);
                slotDiv.appendChild(progressSvg);
            } else {
                slotDiv.innerHTML = `<span style="font-size:12px;">Empty Slot</span>`; // Placeholder
                slotDiv.onclick = () => this.showRecipeSelectionPopup(recipesList, i, stationType, instanceId);
            }
            slotsContainer.appendChild(slotDiv);
        }
    }
    
    createProgressCircleSVG(progressFraction) { // progressFraction is 0.0 to 1.0
        const progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        progressSvg.classList.add('progress-circle');
        progressSvg.setAttribute('viewBox', '0 0 60 60'); // Ensure viewBox is set
        const radius = 25;
        const circumference = 2 * Math.PI * radius;
        const fillOffset = circumference * (1 - progressFraction);
        progressSvg.innerHTML = `
            <circle class="progress-bg" cx="30" cy="30" r="${radius}"/>
            <circle class="progress-fill" cx="30" cy="30" r="${radius}" 
                    stroke-dasharray="${circumference}" 
                    style="stroke-dashoffset: ${fillOffset}"/>`;
        return progressSvg;
    }


    showRecipeSelectionPopup(recipes, slotIndex, stationType, instanceId) {
        const availableRecipes = recipes.filter(r => {
            // Check main ingredients
            if (!this.game.crafting.canCraft(r, this.game.inventory)) return false;
            // Check fuel if recipe requires it
            if (r.fuel && !this.game.inventory.hasItem(r.fuel.item, r.fuel.count)) return false;
            return true;
        });

        if (availableRecipes.length === 0) {
            this.game.ui.showNotification("No recipes available or missing ingredients/fuel.");
            return;
        }

        const popupId = `${stationType}RecipePopup`;
        let popup = document.getElementById(popupId);
        if (popup) popup.remove(); // Remove old one if exists

        popup = this.game.ui.createModalDialog(popupId, `Select Recipe for Slot ${slotIndex + 1}`);
        
        availableRecipes.forEach(recipe => {
            const itemData = getItemData(recipe.result.item);
            const div = document.createElement('div');
            div.className = 'recipe-option'; 
            div.innerHTML = `<img src="${itemData.icon}" style="width:32px; height:32px; margin-right:10px;" alt="${itemData.name}"> 
                             <span>${itemData.name} (x${recipe.result.count})</span>`;
            // TODO: Show ingredients on hover/tooltip inside popup
            div.onclick = () => {
                this.startStationCrafting(recipe, slotIndex, stationType, instanceId);
                popup.remove();
            };
            popup.querySelector('.modal-content').appendChild(div);
        });
        document.body.appendChild(popup);
    }

    startStationCrafting(recipe, slotIndex, stationType, instanceId) {
        if (!this.activeStructureInstance || this.activeStructureInstance.uuid !== instanceId) {
            console.error("Mismatch in active structure instance for crafting.");
            return;
        }

        // Re-check canCraft and fuel (should be redundant if showRecipeSelectionPopup was accurate)
        if (!this.game.crafting.canCraft(recipe, this.game.inventory) ||
            (recipe.fuel && !this.game.inventory.hasItem(recipe.fuel.item, recipe.fuel.count))) {
             this.game.ui.showNotification("Cannot start: Missing ingredients or fuel.");
             return;
        }

        // Consume ingredients & fuel from player's inventory
        recipe.ingredients.forEach(ing => this.game.inventory.removeItem(ing.item, ing.count));
        if (recipe.fuel) {
            this.game.inventory.removeItem(recipe.fuel.item, recipe.fuel.count);
            // Store fuel in the process if it's consumed over time, or mark as consumed
        }
        
        this.activeCraftingProcesses[instanceId][slotIndex] = {
            recipe: recipe,
            progress: 0,
            totalTime: recipe.time,
        };

        // Update the specific station's menu
        if (stationType === 'campfire') this.updateStationMenu(stationType, instanceId, this.cookingRecipes, 4, 'Campfire');
        else if (stationType === 'forge') this.updateStationMenu(stationType, instanceId, this.game.crafting.forgeRecipes, 2, 'Forge');
    }

    closeStructureUI(stationType) {
        const menuElement = document.getElementById(`${stationType}Menu`);
        if (menuElement) menuElement.style.display = 'none';
        
        const popup = document.getElementById(`${stationType}RecipePopup`);
        if(popup) popup.remove();

        this.activeStructureInstance = null;
        if (this.game.player.controls && !this.game.ui.isAnyMenuOpen()) { // Only lock if no other main UI is open
            this.game.player.controls.lock();
        }
    }

    // --- Storage Box Methods ---
    openStorage(storageMesh) {
        this.activeStructureInstance = storageMesh;
        const storageId = storageMesh.userData.storageId;
        if (!storageId || !this.storageContainers.has(storageId)) {
            console.error("Storage not initialized for this container:", storageId, storageMesh);
            this.game.ui.showNotification("Error: Storage container data not found.");
            return;
        }
        this.game.ui.closeAllMenus();
        this.game.ui.showStorageMenu(storageId, this.storageContainers.get(storageId));
        this.game.player.controls.unlock();
    }
    
    updateStorageUI(storageId) { // Called after item transfer
        if (this.activeStructureInstance && this.activeStructureInstance.userData.storageId === storageId) {
            const items = this.storageContainers.get(storageId);
            this.game.ui.showStorageMenu(storageId, items, true); // True to indicate refresh
        }
    }

    // Methods for Inventory to call, to modify storage
    peekItemInStorage(storageId, slotIndex) {
        const container = this.storageContainers.get(storageId);
        return container ? container[slotIndex] : null;
    }

    transferToStorage(storageId, slotIndex, item) { // Item is {id, count, durability?}
        const container = this.storageContainers.get(storageId);
        if (!container) return false;

        const itemData = getItemData(item.id);

        // Try to stack
        if (itemData.stack > 1) {
            for (let i = 0; i < container.length; i++) {
                if (container[i] && container[i].id === item.id && container[i].count < itemData.stack) {
                    // Simplified stacking: assumes identical items (e.g. full durability tools would need more checks)
                     const canAdd = itemData.stack - container[i].count;
                     const toAdd = Math.min(item.count, canAdd);
                     container[i].count += toAdd;
                     item.count -= toAdd;
                     if (item.count === 0) {
                        this.game.ui.showNotification(`Added to existing stack in storage.`);
                        return true;
                     }
                }
            }
        }
        
        // Try to place in specified slot if empty, or find any empty slot
        if (slotIndex !== -1 && !container[slotIndex]) {
            container[slotIndex] = { ...item }; // Store a copy
            this.game.ui.showNotification(`Stored ${item.count}x ${itemData.name}.`);
            return true;
        } else { // Find first empty slot
            const emptyIdx = container.findIndex(s => s === null);
            if (emptyIdx !== -1) {
                container[emptyIdx] = { ...item };
                this.game.ui.showNotification(`Stored ${item.count}x ${itemData.name}.`);
                return true;
            }
        }
        this.game.ui.showNotification("Storage full or cannot stack.");
        return false;
    }

    removeFromStorage(storageId, slotIndex, count = -1) { // count = -1 means remove all from slot
        const container = this.storageContainers.get(storageId);
        if (!container || !container[slotIndex]) return null;

        const itemInSlot = container[slotIndex];
        const toRemove = (count === -1 || count >= itemInSlot.count) ? itemInSlot.count : count;
        
        const removedPortion = { ...itemInSlot, count: toRemove };
        
        itemInSlot.count -= toRemove;
        if (itemInSlot.count <= 0) {
            container[slotIndex] = null;
        }
        this.game.ui.showNotification(`Took ${toRemove}x ${getItemData(removedPortion.id).name} from storage.`);
        return removedPortion;
    }


    update(deltaTime) {
        let activeProcessesExist = false;
        for (const instanceId in this.activeCraftingProcesses) {
            const processes = this.activeCraftingProcesses[instanceId];
            let menuNeedsUpdateForThisInstance = false;
            for (let i = 0; i < processes.length; i++) {
                const process = processes[i];
                if (process && process.recipe) {
                    activeProcessesExist = true;
                    process.progress += deltaTime;
                    if (process.progress >= process.totalTime) {
                        this.game.inventory.addItem(process.recipe.result.item, process.recipe.result.count);
                        if (process.recipe.byproducts) {
                            process.recipe.byproducts.forEach(bp => {
                                this.game.inventory.addItem(bp.item, bp.count);
                            });
                        }
                        this.game.ui.showNotification(`Finished: ${process.recipe.name}`);
                        processes[i] = null; 
                        menuNeedsUpdateForThisInstance = true;
                    }
                }
            }
            // If the currently open UI corresponds to this instance, update it
            if (menuNeedsUpdateForThisInstance && this.activeStructureInstance && 
                (this.activeStructureInstance.uuid === instanceId || this.activeStructureInstance.userData.uniqueId === instanceId)) {
                const buildableId = this.activeStructureInstance.userData.buildableId;
                if (buildableId === 'campfire') this.updateStationMenu('campfire', instanceId, this.cookingRecipes, 4, 'Campfire');
                else if (buildableId === 'forge') this.updateStationMenu('forge', instanceId, this.game.crafting.forgeRecipes, 2, 'Forge');
            }
        }

        // Update lights on structures (e.g., forge light only when active)
        this.game.building.placedBuildings.forEach(buildingEntry => {
            if (buildingEntry.config.lightSource && buildingEntry.config.lightSource.activeOnlyWhenUsed && buildingEntry.mesh.userData.light) {
                const light = buildingEntry.mesh.userData.light;
                const processes = this.activeCraftingProcesses[buildingEntry.mesh.uuid] || this.activeCraftingProcesses[buildingEntry.id];
                const isActive = processes && processes.some(p => p !== null && p.recipe);
                light.visible = isActive;
            }
        });
    }

    saveStructuresData() {
        const serializableStorage = Array.from(this.storageContainers.entries());
        // Filter activeCraftingProcesses to only save valid processes
        const validCraftingProcesses = {};
        for (const key in this.activeCraftingProcesses) {
            if (this.activeCraftingProcesses[key] && this.activeCraftingProcesses[key].some(p => p && p.recipe)) {
                validCraftingProcesses[key] = this.activeCraftingProcesses[key];
            }
        }
        return {
            activeCraftingProcesses: validCraftingProcesses,
            storageContainers: serializableStorage,
        };
    }

    loadStructuresData(data) {
        if (data.activeCraftingProcesses) {
            this.activeCraftingProcesses = data.activeCraftingProcesses;
            // Ensure recipes are re-linked if they were just IDs (if full objects weren't saved)
            // This implementation saves full recipe objects, so should be fine.
        }
        if (data.storageContainers) {
            this.storageContainers = new Map(data.storageContainers);
            // Ensure all known storage boxes from BuildingSystem have their storage initialized
            this.game.building.placedBuildings.forEach(b => {
                if (b.config.storageSlots && b.mesh.userData.storageId) {
                    this.initializeStorage(b.mesh.userData.storageId, b.config.storageSlots);
                }
            });
        }
    }
}
```
**Changes in `structures.js`:**
*   `openCampfire`, `openForge`: Now use a generic `updateStationMenu` method.
*   `updateStationMenu`: Dynamically builds or updates the UI for stations like campfire/forge, including slots and progress circles. Handles close button and title.
*   `createProgressCircleSVG`: Helper to generate SVG for progress.
*   `showRecipeSelectionPopup`: Generic modal popup (uses `ui.js` helper) for selecting recipes at stations. Checks ingredients and fuel.
*   `startStationCrafting`: Consumes items, starts the timed process.
*   `closeStructureUI`: More robust closing logic.
*   Storage Methods:
    *   `openStorage`: Calls `ui.showStorageMenu`.
    *   `updateStorageUI`: For refreshing the UI after transfers.
    *   `peekItemInStorage`, `transferToStorage`, `removeFromStorage`: These are internal logic methods called by `Inventory` or `UI` to manage items in storage containers.
*   `update`: Iterates active processes. Updates lights for structures like the forge based on active use.
*   `save/loadStructuresData`: Basic serialization. Ensures storage containers are re-initialized on load if they exist on building meshes.

--- START OF FILE ui.js ---
```javascript
// js/ui.js

class UI {
    constructor(game) {
        this.game = game;
        // Main Menus
        this.inventoryMenu = document.getElementById('inventory');
        this.craftingMenu = document.getElementById('craftingMenu'); // Used for player and crafting table
        this.buildingMenu = document.getElementById('buildingMenu');
        this.storageMenu = document.getElementById('storageMenu'); 
        
        // Station-specific Menus (may just be containers within a main modal structure)
        this.campfireMenu = document.getElementById('campfireMenu');
        this.forgeMenu = document.getElementById('forgeMenu');
        // craftingTableMenu div might be redundant if craftingMenu is repurposed.

        // Grids & Bars
        this.quickBarElement = document.getElementById('quickBar');
        this.inventoryGrid = document.getElementById('inventoryGrid');
        this.craftingGrid = document.getElementById('craftingGrid');
        this.buildingGrid = document.getElementById('buildingGrid');
        // storageGrid will be created dynamically inside storageMenu

        this.interactionPrompt = document.getElementById('interactionPrompt');
        this.notificationElement = document.createElement('div'); // Dedicated notification element
        this.notificationElement.id = 'gameNotification';
        this.notificationElement.style.position = 'fixed';
        this.notificationElement.style.bottom = '150px'; // Above interaction prompt
        this.notificationElement.style.left = '50%';
        this.notificationElement.style.transform = 'translateX(-50%)';
        this.notificationElement.style.backgroundColor = 'rgba(0,0,0,0.75)';
        this.notificationElement.style.color = 'white';
        this.notificationElement.style.padding = '10px 15px';
        this.notificationElement.style.borderRadius = '5px';
        this.notificationElement.style.zIndex = '1005'; // High z-index
        this.notificationElement.style.display = 'none';
        this.notificationElement.style.opacity = '0';
        this.notificationElement.style.transition = 'opacity 0.3s ease-out';
        document.body.appendChild(this.notificationElement);
        this.notificationTimeout = null;


        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tooltip-text'; // Use style from index.html
        document.body.appendChild(this.tooltipElement);


        this.menus = [
            this.inventoryMenu, this.craftingMenu, this.buildingMenu, this.storageMenu,
            this.campfireMenu, this.forgeMenu 
            // this.craftingTableMenu, // Only if it's a distinct element
        ].filter(Boolean); // Filter out nulls if some IDs don't exist

        this.setupMenuCloseButtons();
    }

    setupMenuCloseButtons() {
        this.menus.forEach(menu => {
            const closeButton = menu.querySelector('.close-menu-btn');
            if (closeButton) {
                // The onclick is already set in HTML, this is just for reference
                // Or, add listeners dynamically if preferred:
                // closeButton.addEventListener('click', () => this.closeMenu(menu));
            }
        });
    }
    
    isAnyMenuOpen() {
        return this.menus.some(menu => menu.style.display === 'block');
    }

    updateInventory() {
        this.inventoryGrid.innerHTML = '';
        const items = this.game.inventory.items;

        for (let i = 0; i < this.game.inventory.size; i++) {
            const slot = this.createSlotDOM(items[i], i, 'player');
            slot.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent menu from closing if click
Model isn't available right now. Please wait a minute and try again.
600.3s
