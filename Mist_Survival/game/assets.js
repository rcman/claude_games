// game/assets.js
// Handles loading 3D models, textures, sounds. Uses Promises for async operations.

import * as THREE from '../libs/three.module.js';
// Import loaders separately if using modules and they aren't in the core
import { GLTFLoader } from '../libs/loaders/GLTFLoader.js'; // Adjust path as needed
import { DRACOLoader } from '../libs/loaders/DRACOLoader.js'; // If using Draco compression

// --- State ---
const assets = {
    models: {},
    textures: {},
    sounds: {},
};
let loadingManager = null;
let textureLoader = null;
let gltfLoader = null;
let audioLoader = null;
let audioListener = null; // Needs to be attached to the camera

let totalAssetsToLoad = 0;
let assetsLoaded = 0;

// --- Initialization ---
export function init(camera) {
    console.log("Initializing Asset Manager...");
    loadingManager = new THREE.LoadingManager(
        // onLoad callback
        () => {
            console.log(`Asset Loading Complete: ${assetsLoaded}/${totalAssetsToLoad}`);
            // Trigger event or callback indicating all initial assets are ready
            document.dispatchEvent(new CustomEvent('assetsLoaded'));
        },
        // onProgress callback
        (url, itemsLoaded, itemsTotal) => {
            // Note: This progress might only reflect the *current* loader batch
            // console.log(`Loading asset: ${url}. Overall progress approx: ${itemsLoaded}/${itemsTotal}`);
            // A custom counter might be more accurate
            updateLoadingProgress();
        },
        // onError callback
        (url) => {
            console.error(`Error loading asset: ${url}`);
        }
    );

    textureLoader = new THREE.TextureLoader(loadingManager);
    gltfLoader = new GLTFLoader(loadingManager);

    // Optional: Setup Draco Loader if your GLTF files use it
    // const dracoLoader = new DRACOLoader();
    // dracoLoader.setDecoderPath('/libs/draco/gltf/'); // Path to Draco decoder files
    // dracoLoader.setDecoderConfig({ type: 'js' }); // Use JS decoder
    // dracoLoader.preload();
    // gltfLoader.setDRACOLoader(dracoLoader);


    // Audio Setup
    // audioListener = new THREE.AudioListener();
    // camera.add(audioListener); // Attach listener to camera
    // audioLoader = new THREE.AudioLoader(loadingManager);

    // Define initial assets to load
    // This list would likely be much larger in a real game
    const initialAssets = [
        // { type: 'texture', id: 'grass_diffuse', path: 'assets/textures/grass_d.png' },
        // { type: 'texture', id: 'rock_normal', path: 'assets/textures/rock_n.png' },
        // { type: 'model', id: 'player_char', path: 'assets/models/player.glb' },
        // { type: 'model', id: 'zombie_char', path: 'assets/models/zombie.glb' },
        // { type: 'sound', id: 'footstep_grass', path: 'assets/audio/footstep_grass.wav' },
        // { type: 'sound', id: 'zombie_groan', path: 'assets/audio/zombie_groan.ogg' },
    ];

    totalAssetsToLoad = initialAssets.length;
    assetsLoaded = 0;
    console.log(`Starting load of ${totalAssetsToLoad} initial assets...`);

    // Start loading all initial assets
    // return Promise.all(initialAssets.map(asset => loadAsset(asset.type, asset.id, asset.path)));
    // Using LoadingManager, just call the load functions
    initialAssets.forEach(asset => loadAsset(asset.type, asset.id, asset.path));

    // Return a promise that resolves when the loading manager is done
    return new Promise((resolve, reject) => {
         if (totalAssetsToLoad === 0) {
             resolve(); // Nothing to load
             return;
         }
        const checkLoad = (event) => {
            document.removeEventListener('assetsLoaded', checkLoad);
            resolve();
        };
         document.addEventListener('assetsLoaded', checkLoad);
         // Safety timeout?
    });
}

function updateLoadingProgress() {
    assetsLoaded++;
    const progress = totalAssetsToLoad > 0 ? (assetsLoaded / totalAssetsToLoad) * 100 : 100;
    console.log(`Loading progress: ${assetsLoaded}/${totalAssetsToLoad} (${Math.round(progress)}%)`);
    // TODO: Update a loading bar UI element via UIManager
    // UIManager.updateLoadingProgress(progress);
}

// --- Loading Functions ---

/**
 * Generic function to load an asset based on type.
 */
function loadAsset(type, id, path) {
    switch (type) {
        case 'texture':
            return loadTexture(id, path);
        case 'model':
            return loadModel(id, path);
        case 'sound':
            return loadSound(id, path);
        default:
            console.warn(`Unknown asset type: ${type}`);
            return Promise.reject(`Unknown asset type: ${type}`);
    }
}


export function loadTexture(id, path) {
    if (assets.textures[id]) return Promise.resolve(assets.textures[id]); // Already loaded

    return new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                console.log(`Texture loaded: ${id}`);
                texture.name = id;
                 // Common texture settings (optional)
                 // texture.wrapS = THREE.RepeatWrapping;
                 // texture.wrapT = THREE.RepeatWrapping;
                assets.textures[id] = texture;
                // updateLoadingProgress(); // Handled by LoadingManager now
                resolve(texture);
            },
            undefined, // onProgress - handled by manager
            (error) => {
                console.error(`Failed to load texture ${id} from ${path}`, error);
                reject(error);
            }
        );
    });
}

export function loadModel(id, path) {
    if (assets.models[id]) return Promise.resolve(assets.models[id]); // Already loaded

    return new Promise((resolve, reject) => {
        gltfLoader.load(
            path,
            (gltf) => {
                console.log(`Model loaded: ${id}`);
                // GLTF scene might contain camera, lights - usually want just the model mesh(es)
                const modelScene = gltf.scene || gltf.scenes[0];
                // Apply necessary settings? (e.g., traverse and enable shadows)
                modelScene.traverse( function ( child ) {
                    if ( child.isMesh ) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Optimize? child.material.depthWrite = true;
                    }
                });
                assets.models[id] = modelScene; // Store the scene/group
                // updateLoadingProgress(); // Handled by LoadingManager now
                resolve(modelScene);
            },
            undefined, // onProgress - handled by manager
            (error) => {
                console.error(`Failed to load model ${id} from ${path}`, error);
                reject(error);
            }
        );
    });
}

export function loadSound(id, path) {
    if (!audioLoader || !audioListener) {
         console.warn("Audio system not initialized, cannot load sound.");
         return Promise.reject("Audio system not initialized.");
    }
    if (assets.sounds[id]) return Promise.resolve(assets.sounds[id]); // Already loaded

    return new Promise((resolve, reject) => {
        audioLoader.load(
            path,
            (buffer) => {
                console.log(`Sound loaded: ${id}`);
                // Create an Audio object, but don't play it yet
                // Store the buffer, let game logic create Audio instances
                assets.sounds[id] = buffer;
                 // updateLoadingProgress(); // Handled by LoadingManager now
                resolve(buffer);
            },
            undefined, // onProgress - handled by manager
            (error) => {
                console.error(`Failed to load sound ${id} from ${path}`, error);
                reject(error);
            }
        );
    });
}

// --- Asset Getters ---

export function getTexture(id) {
    return assets.textures[id] || null;
}

export function getModel(id) {
    // Return a clone to prevent unintended modifications to the original loaded asset
    const original = assets.models[id];
    return original ? original.clone() : null;
}

export function getSoundBuffer(id) {
    return assets.sounds[id] || null;
}

/**
 * Creates a new Audio object ready to be played.
 * Requires audioListener to be set during init.
 */
export function createAudioInstance(soundId) {
    if (!audioListener) return null;
    const buffer = getSoundBuffer(soundId);
    if (buffer) {
        const sound = new THREE.Audio(audioListener);
        sound.setBuffer(buffer);
        return sound; // Caller needs to .play(), set volume, loop, etc.
    }
    return null;
}