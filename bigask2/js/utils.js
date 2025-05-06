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