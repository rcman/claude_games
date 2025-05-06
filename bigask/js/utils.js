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

// Noise generator for terrain
class Noise {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        
        // To remove the need for index wrapping, double the permutation table length
        this.perm = new Array(512);
        this.gradP = new Array(512);
        
        this.seed(this.seed);
    }

    seed(seed) {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }

        for (let i = 0; i < 256; i++) {
            let v;
            if (i & 1) {
                v = this.p[i] ^ (seed & 255);
            } else {
                v = this.p[i] ^ ((seed >> 8) & 255);
            }

            this.perm[i] = this.perm[i + 256] = v;
            this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
        }
    }

    // 2D simplex noise
    noise2D(x, y) {
        // Find unit grid cell containing point
        let X = Math.floor(x), Y = Math.floor(y);
        // Get relative xy coordinates of point within that cell
        x = x - X; y = y - Y;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255;

        // Calculate noise contributions from each of the four corners
        let n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
        let n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
        let n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
        let n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

        // Compute the fade curve value for x
        let u = this.fade(x);

        // Interpolate the four results
        return this.lerp(
            this.lerp(n00, n10, u),
            this.lerp(n01, n11, u),
            this.fade(y));
    }

    // 3D simplex noise
    noise3D(x, y, z) {
        // Find the unit cube containing the point
        let X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        // Get relative xyz coordinates of point within that cube
        x = x - X; y = y - Y; z = z - Z;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255; Z = Z & 255;

        // Calculate noise contributions from each of the eight corners
        let n000 = this.gradP[X + this.perm[Y + this.perm[Z]]].dot3(x, y, z);
        let n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]].dot3(x, y, z - 1);
        let n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]].dot3(x, y - 1, z);
        let n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(x, y - 1, z - 1);
        let n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]].dot3(x - 1, y, z);
        let n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]].dot3(x - 1, y, z - 1);
        let n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]].dot3(x - 1, y - 1, z);
        let n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

        // Compute the fade curve value for x, y, z
        let u = this.fade(x);
        let v = this.fade(y);
        let w = this.fade(z);

        // Interpolate
        return this.lerp(
            this.lerp(
                this.lerp(n000, n100, u),
                this.lerp(n001, n101, u), w),
            this.lerp(
                this.lerp(n010, n110, u),
                this.lerp(n011, n111, u), w),
            v);
    }

    // Utility functions for Perlin noise
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }
}

// Add dot product methods to the grad3 arrays
Noise.prototype.dot2 = function(x, y) {
    return this[0] * x + this[1] * y;
};

Noise.prototype.dot3 = function(x, y, z) {
    return this[0] * x + this[1] * y + this[2] * z;
};

// Add these methods to the array prototype
Array.prototype.dot2 = function(x, y) {
    return this[0] * x + this[1] * y;
};

Array.prototype.dot3 = function(x, y, z) {
    return this[0] * x + this[1] * y + this[2] * z;
};

// Check if a ray intersects with a box
function rayIntersectsBox(ray, box) {
    const tMin = new THREE.Vector3();
    const tMax = new THREE.Vector3();
    
    const boxMin = box.min;
    const boxMax = box.max;
    
    // Check for intersection on the x-axis
    const invDirX = 1 / ray.direction.x;
    if (invDirX >= 0) {
        tMin.x = (boxMin.x - ray.origin.x) * invDirX;
        tMax.x = (boxMax.x - ray.origin.x) * invDirX;
    } else {
        tMin.x = (boxMax.x - ray.origin.x) * invDirX;
        tMax.x = (boxMin.x - ray.origin.x) * invDirX;
    }
    
    // Check for intersection on the y-axis
    const invDirY = 1 / ray.direction.y;
    if (invDirY >= 0) {
        tMin.y = (boxMin.y - ray.origin.y) * invDirY;
        tMax.y = (boxMax.y - ray.origin.y) * invDirY;
    } else {
        tMin.y = (boxMax.y - ray.origin.y) * invDirY;
        tMax.y = (boxMin.y - ray.origin.y) * invDirY;
    }
    
    // Check for intersection on the z-axis
    const invDirZ = 1 / ray.direction.z;
    if (invDirZ >= 0) {
        tMin.z = (boxMin.z - ray.origin.z) * invDirZ;
        tMax.z = (boxMax.z - ray.origin.z) * invDirZ;
    } else {
        tMin.z = (boxMax.z - ray.origin.z) * invDirZ;
        tMax.z = (boxMin.z - ray.origin.z) * invDirZ;
    }
    
    // Find the largest entry point
    const tEnter = Math.max(tMin.x, Math.max(tMin.y, tMin.z));
    // Find the smallest exit point
    const tExit = Math.min(tMax.x, Math.min(tMax.y, tMax.z));
    
    // If the largest entry is greater than the smallest exit, there's no intersection
    if (tEnter > tExit || tExit < 0) {
        return false;
    }
    
    return tEnter;
}

// Load a texture and return a promise
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            path,
            texture => resolve(texture),
            undefined,
            error => reject(error)
        );
    });
}

// Load a 3D model and return a promise
function loadModel(path) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        loader.load(
            path,
            gltf => resolve(gltf.scene),
            undefined,
            error => reject(error)
        );
    });
}

// Collision detection between two objects with bounding boxes
function checkCollision(obj1, obj2) {
    // Create bounding boxes if they don't exist
    if (!obj1.boundingBox) {
        obj1.geometry.computeBoundingBox();
        obj1.boundingBox = obj1.geometry.boundingBox.clone();
    }
    
    if (!obj2.boundingBox) {
        obj2.geometry.computeBoundingBox();
        obj2.boundingBox = obj2.geometry.boundingBox.clone();
    }
    
    // Update bounding boxes to world space
    obj1.updateMatrixWorld();
    obj2.updateMatrixWorld();
    
    const box1 = obj1.boundingBox.clone().applyMatrix4(obj1.matrixWorld);
    const box2 = obj2.boundingBox.clone().applyMatrix4(obj2.matrixWorld);
    
    return box1.intersectsBox(box2);
}

// Distance between two 3D points
function distance(point1, point2) {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2) +
        Math.pow(point2.z - point1.z, 2)
    );
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

// Create a simple enemy AI state machine
class StateMachine {
    constructor(initialState) {
        this.currentState = initialState;
        this.states = {};
    }
    
    addState(name, state) {
        this.states[name] = state;
    }
    
    update(entity, deltaTime) {
        if (this.currentState && this.states[this.currentState]) {
            const nextState = this.states[this.currentState].update(entity, deltaTime);
            if (nextState && nextState !== this.currentState && this.states[nextState]) {
                if (this.states[this.currentState].exit) {
                    this.states[this.currentState].exit(entity);
                }
                this.currentState = nextState;
                if (this.states[this.currentState].enter) {
                    this.states[this.currentState].enter(entity);
                }
            }
        }
    }
}

// Generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Create a simple event system
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

// Global event bus
const eventBus = new EventEmitter();

// Check if a point is within the world bounds
function isWithinWorldBounds(position, worldSize) {
    const halfSize = worldSize / 2;
    return (
        position.x >= -halfSize && 
        position.x <= halfSize && 
        position.z >= -halfSize && 
        position.z <= halfSize
    );
}

// Snap a position to the world grid
function snapToGrid(position, gridSize) {
    return new THREE.Vector3(
        Math.round(position.x / gridSize) * gridSize,
        position.y,
        Math.round(position.z / gridSize) * gridSize
    );
}

// Create a simple raycaster for mouse picking
function createRaycaster(camera, mousePosition, objects) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(objects, true);
    return intersects.length > 0 ? intersects[0] : null;
}

// Calculate the cardinal direction (N, S, E, W) based on an angle
function getCardinalDirection(angle) {
    // Normalize angle to 0-360 degrees
    angle = (angle + 360) % 360;
    
    if (angle >= 315 || angle < 45) return 'N';
    if (angle >= 45 && angle < 135) return 'E';
    if (angle >= 135 && angle < 225) return 'S';
    if (angle >= 225 && angle < 315) return 'W';
    
    return 'N'; // Default
}

// Helper to generate a progress indicator
function createProgressIndicator(element, duration) {
    const startTime = performance.now();
    
    return {
        update: function() {
            const elapsedTime = performance.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            element.style.width = `${progress * 100}%`;
            return progress >= 1;
        }
    };
}

// Quick helper for loading images
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

// Global settings object
const Settings = {
    worldSize: 1000,
    gridSize: 4,
    waterLevel: 2,
    fogDensity: 0.003,
    fogColor: 0xaaaaaa,
    treeCount: 1000,
    rockCount: 1000,
    animalCount: {
        chicken: 20,
        rabbit: 30,
        wolf: 15,
        bear: 10
    },
    barrelCount: 50,
    buildingCount: 20,
    debug: false
};

// Keep track of loaded assets
const AssetLoader = {
    textures: {},
    models: {},
    loadingPromises: [],
    
    loadTexture: function(name, path) {
        const promise = loadTexture(path).then(texture => {
            this.textures[name] = texture;
            return texture;
        });
        this.loadingPromises.push(promise);
        return promise;
    },
    
    loadModel: function(name, path) {
        const promise = loadModel(path).then(model => {
            this.models[name] = model;
            return model;
        });
        this.loadingPromises.push(promise);
        return promise;
    },
    
    getTexture: function(name) {
        return this.textures[name];
    },
    
    getModel: function(name) {
        return this.models[name];
    },
    
    loadAll: function() {
        return Promise.all(this.loadingPromises);
    }
};