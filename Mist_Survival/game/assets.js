// game/assets.js
// Handles loading 3D models, textures, sounds. Uses Promises for async operations.

import * as THREE from '../libs/three.module.js';

// Comment out loader imports until we verify the correct import syntax
// For now, we'll use THREE's built-in functionality

let loadingManager = null;
let textureLoader = null;
let gltfLoader = null;
let audioLoader = null;
let audioListener = null; // Needs to be attached to the camera

// --- State ---
const assets = {
    models: {},
    textures: {},
    sounds: {},
};

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
            updateLoadingProgress();
        },
        // onError callback
        (url) => {
            console.error(`Error loading asset: ${url}`);
        }
    );

    textureLoader = new THREE.TextureLoader(loadingManager);
    
    // Try to use THREE's built-in loaders instead of separate modules for now
    // We'll comment out the GLTF loading until we have proper imports
    
    // Audio Setup also commented out until needed
    // audioListener = new THREE.AudioListener();
    // camera.add(audioListener);
    // audioLoader = new THREE.AudioLoader(loadingManager);

    // Define initial assets to load - empty for now
    const initialAssets = [];

    totalAssetsToLoad = initialAssets.length;
    assetsLoaded = 0;
    console.log(`Starting load of ${totalAssetsToLoad} initial assets...`);

    // Load any initial assets
    initialAssets.forEach(asset => loadAsset(asset.type, asset.id, asset.path));

    // Return a promise that resolves when loading is complete
    return new Promise((resolve) => {
        if (totalAssetsToLoad === 0) {
            resolve(); // Nothing to load
            return;
        }
        const checkLoad = () => {
            document.removeEventListener('assetsLoaded', checkLoad);
            resolve();
        };
        document.addEventListener('assetsLoaded', checkLoad);
    });
}

function updateLoadingProgress() {
    assetsLoaded++;
    const progress = totalAssetsToLoad > 0 ? (assetsLoaded / totalAssetsToLoad) * 100 : 100;
    console.log(`Loading progress: ${assetsLoaded}/${totalAssetsToLoad} (${Math.round(progress)}%)`);
}

// --- Loading Functions ---

function loadAsset(type, id, path) {
    switch (type) {
        case 'texture':
            return loadTexture(id, path);
        // Commenting out model and sound loading until imports are fixed
        // case 'model':
        //     return loadModel(id, path);
        // case 'sound':
        //     return loadSound(id, path);
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
                assets.textures[id] = texture;
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

// Commented out until we resolve import issues
// export function loadModel(id, path) {
//     // Model loading implementation
// }

// export function loadSound(id, path) {
//     // Sound loading implementation
// }

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

export function createAudioInstance(soundId) {
    if (!audioListener) return null;
    const buffer = getSoundBuffer(soundId);
    if (buffer) {
        const sound = new THREE.Audio(audioListener);
        sound.setBuffer(buffer);
        return sound;
    }
    return null;
}