// --- START OF FILE AssetLoader.js ---

class AssetLoader {
    constructor(scene) { // Pass the scene
        this.scene = scene; // Store the scene reference
        if (!scene) {
            console.error("AssetLoader requires a valid Babylon scene!");
            throw new Error("AssetLoader requires a valid Babylon scene!");
        }
        this.assets = {
            textures: {},
            models: {}, // Store loaded meshes/nodes/skeletons/animations
            sounds: {}
        };

        // GLB model paths - ADD YOUR ACTUAL PATHS HERE
        this.glbModelPaths = {
            // Example: Make sure these paths are correct relative to your HTML file
             'barrel': 'models/barrel.glb', // Example path, ADJUST AS NEEDED
             'chicken': 'models/chicken.glb', // Example path, ADJUST AS NEEDED
             'rabbit': 'models/rabbit.glb', // Example path, ADJUST AS NEEDED
             'deer': 'models/deer.glb', // Example path, ADJUST AS NEEDED
             'wolf': 'models/wolf.glb', // Example path, ADJUST AS NEEDED
             'bear': 'models/bear.glb', // Example path, ADJUST AS NEEDED
             'cougar': 'models/cougar.glb' // Example path, ADJUST AS NEEDED
            // Add other models as needed
        };

        try {
            this.createDefaultTextures();
        } catch (error) { console.error("Error during createDefaultTextures:", error); }
    }

    createDefaultTextures() {
        // Default white texture
        const defaultCanvas = document.createElement('canvas');
        defaultCanvas.width = 1; defaultCanvas.height = 1;
        const defaultCtx = defaultCanvas.getContext('2d');
        if (!defaultCtx) { throw new Error("Failed to get 2D context for default texture"); }
        defaultCtx.fillStyle = '#FFFFFF'; defaultCtx.fillRect(0, 0, 1, 1);
        this.assets.textures['default'] = new BABYLON.DynamicTexture('defaultTex', defaultCanvas, this.scene, false);
        this.assets.textures['default'].name = 'default';

        // Color textures
        const colors = {
            'wood': '#8B4513', // SaddleBrown
            'stone': '#808080', // Gray
            'grass': '#228B22', // ForestGreen
            'water': '#1E90FF' // DodgerBlue
            // Add other common colors if needed
        };
        for (const [name, color] of Object.entries(colors)) {
            if (this.assets.textures[name]) continue;
            const colorCanvas = document.createElement('canvas'); colorCanvas.width = 4; colorCanvas.height = 4;
            const colorCtx = colorCanvas.getContext('2d'); if (!colorCtx) continue;
            colorCtx.fillStyle = color; colorCtx.fillRect(0, 0, 4, 4);
            const colorTexture = new BABYLON.DynamicTexture(`${name}Tex`, colorCanvas, this.scene, false);
            colorTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            colorTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            colorTexture.samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE;
            colorTexture.name = name;
            this.assets.textures[name] = colorTexture;
        }
    }

    async loadAssets() {
        console.log("Initializing assets (Babylon.js)...");
        if (Object.keys(this.assets.textures).length === 0) { this.createDefaultTextures(); }

        // --- Load GLB Models ---
        console.log("Loading GLB models (Babylon.js)...");
        const modelPromises = [];
        for (const key of Object.keys(this.glbModelPaths)) {
            const path = this.glbModelPaths[key];
            console.log(` - Starting load for ${key} from ${path}`);
            const promise = BABYLON.SceneLoader.ImportMeshAsync(null, path, "", this.scene)
                .then(result => {
                    console.log(`   Successfully loaded ${key}`);
                    if (result.meshes.length === 0) {
                        console.warn(`   Loaded ${key} but it contained no meshes.`);
                        this.assets.models[key] = null; // Mark as failed if no meshes
                        return;
                    }
                    // Disable meshes initially
                    result.meshes.forEach(m => m.setEnabled(false));

                    // Find the __root__ node or use the first mesh as the main entry point
                    const rootNode = result.meshes.find(m => m.name === "__root__") || result.meshes[0];

                    // Store required data
                    this.assets.models[key] = {
                        meshes: result.meshes,
                        skeletons: result.skeletons,
                        animationGroups: result.animationGroups,
                        rootNode: rootNode // Store the identified root node
                    };
                    console.log(`   Stored ${key} model data. Root: ${rootNode?.name}, Meshes: ${result.meshes.length}, Anims: ${result.animationGroups.length}`);
                })
                .catch(error => {
                    console.error(`   Failed to load GLB model ${key} from ${path}:`, error);
                    this.assets.models[key] = null; // Mark as failed
                });
            modelPromises.push(promise);
        }

        try {
            await Promise.all(modelPromises);
            console.log("All requested GLB models processed.");
        } catch (error) { console.error("Error during bulk GLB model loading:", error); }
        // --- End GLB Loading ---

        console.log("Asset initialization finished.");
        return true;
    }

    getTexture(name) {
        // Logic remains similar, return texture object or default
        const texture = this.assets.textures[name]
            || (name === 'tree_bark' && this.assets.textures['wood'])
            || (name === 'leaves' && this.assets.textures['grass'])
            || this.assets.textures['stone'] // Use stone as a more common fallback than wood?
            || this.assets.textures['default'];

        if (!texture) {
             console.error(`Texture '${name}' not found, and default/fallbacks are missing!`);
             const canvas = document.createElement('canvas'); canvas.width=1;canvas.height=1; const ctx=canvas.getContext('2d'); if(ctx){ctx.fillStyle='#F0F';ctx.fillRect(0,0,1,1);}
             return new BABYLON.DynamicTexture('emergency_default', canvas, this.scene, false);
        }
        // Clone the texture if it's going to be modified per instance (e.g., tiling)
        // return texture.clone(); // Usually not needed unless modifying texture props per mesh
        return texture;
    }

    // --- MODIFIED: getModel handles Babylon primitives and GLTF ---
    getModel(name) {
        const modelData = this.assets.models[name];

        // --- Handle GLB Models ---
        if (modelData && modelData.rootNode) {
            try {
                // IMPORTANT: Cloning complex hierarchies with skeletons/animations might need manual retargeting.
                // Instancing is preferred for performance if only transform changes.
                // Let's try cloning first.
                let clonedRoot = null;
                 if (modelData.rootNode instanceof BABYLON.Mesh) {
                    clonedRoot = modelData.rootNode.clone(`${name}_clone_${Date.now()}`, null, true, false); // Clone hierarchy, but NOT skeletons initially
                 } else if (modelData.rootNode instanceof BABYLON.TransformNode && modelData.meshes.length > 0) {
                    // If root is a TransformNode, clone it and manually parent cloned meshes
                    clonedRoot = new BABYLON.TransformNode(`${name}_clone_${Date.now()}`, this.scene);
                    modelData.meshes.forEach(mesh => {
                        if (mesh.parent === modelData.rootNode) { // Clone only top-level meshes under root
                           const clonedMesh = mesh.clone(mesh.name, clonedRoot, true, false);
                           if (!clonedMesh) {
                               console.warn(`Failed to clone child mesh ${mesh.name} for ${name}`);
                           }
                        }
                    });
                 }

                if (!clonedRoot || (clonedRoot instanceof BABYLON.TransformNode && clonedRoot.getChildMeshes(false).length === 0)) {
                     console.warn(`Cloning failed or resulted in empty node for GLB root of ${name}. Trying first mesh directly.`);
                     if (modelData.meshes[0] instanceof BABYLON.Mesh) {
                         clonedRoot = modelData.meshes[0].clone(`${name}_clone_mesh0_${Date.now()}`, null, true, false);
                     }
                     if (!clonedRoot) { throw new Error("No valid mesh found to clone."); }
                }

                clonedRoot.setEnabled(true); // Enable the cloned mesh/hierarchy
                clonedRoot.name = name; // Set base name for easier identification

                 // --- Animation & Skeleton Handling (Basic Example) ---
                 // This is complex. For simple cases, cloning might work.
                 // For complex skeletons, you often need to clone the skeleton separately
                 // and retarget the animation groups to the new skeleton/meshes.
                 // Instancing is often easier if animations are shared.
                 // We'll return the node and let the caller handle animation setup for now.
                 // Example: Caller would find animationGroups in this.assets.models[name].animationGroups
                 // and target them to the clonedRoot/its children.

                // Return the cloned root node (Mesh or TransformNode)
                // Maybe wrap it for consistency?
                const animalDef = Constants?.ANIMALS?.TYPES?.find(a => a.id === name);
                const scale = animalDef?.scale ?? 1.0;

                return {
                    modelGroup: clonedRoot, // The cloned node
                    scale: scale, // Include scale hint
                    animationGroups: modelData.animationGroups // Pass along animation groups
                };


            } catch (error) {
                console.error(`Error cloning GLB model '${name}':`, error);
                // Fallback to primitive box if cloning fails
                const fallbackMesh = BABYLON.MeshBuilder.CreateBox(`error_fallback_${name}`, { size: 1 }, this.scene);
                fallbackMesh.name = name;
                return fallbackMesh; // Return the mesh directly
            }
        }

        // --- Handle Primitive Models (Create on demand) ---
        // Returns the BABYLON.Mesh directly for primitives
        try {
            let mesh;
            switch (name) {
                // Resources
                case 'tree': // Special case: Return structure with parts
                     const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", { height: 5, diameterTop: 0.5, diameterBottom: 0.8, tessellation: 8 }, this.scene);
                     const leaves = BABYLON.MeshBuilder.CreateCone("leaves", { height: 6, diameterTop: 0, diameterBottom: 6, tessellation: 8 }, this.scene);
                     trunk.setEnabled(false); leaves.setEnabled(false); // Keep disabled until placed
                     return { trunk: trunk, leaves: leaves }; // Return object with parts
                case 'rock':
                    mesh = BABYLON.MeshBuilder.CreatePolyhedron(name, { type: 3, size: 1 }, this.scene); break;
                case 'plant':
                     mesh = BABYLON.MeshBuilder.CreatePlane(name, {width: 0.5, height: 0.7, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene);
                     mesh.rotation.x = -Math.PI / 12; // Slight angle
                     break;
                case 'cloth':
                     mesh = BABYLON.MeshBuilder.CreatePlane(name, {width: 0.5, height: 0.5, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this.scene); break;
                case 'crate':
                     mesh = BABYLON.MeshBuilder.CreateBox(name, {size: 1}, this.scene); break;
                case 'barrel': // Added primitive fallback for barrel
                     mesh = BABYLON.MeshBuilder.CreateCylinder(name, {height: 1.0, diameter: 0.7, tessellation: 12}, this.scene); break;

                // Building Components
                case 'foundation':
                    mesh = BABYLON.MeshBuilder.CreateBox(name, { width: Constants.BUILDING.FOUNDATION_SIZE, depth: Constants.BUILDING.FOUNDATION_SIZE, height: 0.5 }, this.scene); break;
                case 'wall':
                case 'window':
                    mesh = BABYLON.MeshBuilder.CreateBox(name, { width: Constants.BUILDING.FOUNDATION_SIZE, height: Constants.BUILDING.WALL_HEIGHT, depth: 0.2 }, this.scene); break;
                case 'ceiling':
                    mesh = BABYLON.MeshBuilder.CreateBox(name, { width: Constants.BUILDING.FOUNDATION_SIZE, depth: Constants.BUILDING.FOUNDATION_SIZE, height: 0.3 }, this.scene); break;

                // Items (Used for build preview mainly)
                case 'axe':
                case 'pickaxe':
                    mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.2, height: 0.6, depth: 0.1 }, this.scene); break;
                case 'knife':
                     mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.1, height: 0.4, depth: 0.05 }, this.scene); break;
                case 'canteen':
                     mesh = BABYLON.MeshBuilder.CreateCylinder(name, {height: 0.4, diameter: 0.3, tessellation: 8}, this.scene); break;
                case 'rifle':
                     mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.1, height: 0.1, depth: 1.0 }, this.scene); break;

                // Animals (Fallback primitives if GLB fails or not requested)
                case 'chicken': mesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 0.6 }, this.scene); break;
                case 'rabbit': mesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 0.5 }, this.scene); break;
                case 'deer': mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.8, height: 1.2, depth: 1.5 }, this.scene); break;
                case 'wolf': mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.6, height: 0.9, depth: 1.2 }, this.scene); break;
                case 'bear': mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 1, height: 1.5, depth: 2.0 }, this.scene); break;
                case 'cougar': mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.7, height: 0.8, depth: 1.4 }, this.scene); break;

                default:
                    console.warn(`Primitive model requested for unknown type: '${name}'. Returning default box.`);
                    mesh = BABYLON.MeshBuilder.CreateBox(`default_fallback_${name}`, { size: 1 }, this.scene);
            }
            mesh.name = name; // Assign name
            mesh.setEnabled(false); // Keep disabled until placed/used
            return mesh; // Return the mesh directly

        } catch (error) {
            console.error(`Error creating primitive model '${name}':`, error);
            const fallbackMesh = BABYLON.MeshBuilder.CreateBox(`error_fallback_${name}`, { size: 1 }, this.scene);
            fallbackMesh.name = name;
            return fallbackMesh;
        }
    }
}

// --- END OF FILE AssetLoader.js ---