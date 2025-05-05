const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.clearColor = new BABYLON.Color4(0.5, 0.8, 1, 1); // Light blue background for debugging

    // Camera
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 20, -10), scene); // Raised camera position
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 2, 1);

    // Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -1), scene);
    sun.position = new BABYLON.Vector3(50, 100, 50);

    // Day-night cycle
    let time = 0;
    scene.registerBeforeRender(() => {
        time += 0.001;
        sun.intensity = Math.sin(time) * 0.5 + 0.5;
        light.intensity = sun.intensity;
    });

    // Initialize systems
    console.log("Initializing world...");
    initWorld(scene);
    console.log("Initializing player...");
    initPlayer(scene, camera);
    console.log("Initializing crafting...");
    initCrafting(scene);
    console.log("Initializing building...");
    initBuilding(scene);

    return scene;
};

try {
    console.log("Creating scene...");
    const scene = createScene();
    console.log("Starting render loop...");
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
} catch (e) {
    console.error("Error initializing game:", e);
}