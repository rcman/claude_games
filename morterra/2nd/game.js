import * as THREE from 'three';

let scene, camera, renderer;
let player, ground;
let resources = [];
const playerSpeed = 0.1;
const keys = {}; // To track pressed keys

const inventory = {
    wood: 0,
    stone: 0
};

// Camera control variables
let isRightMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let cameraOrbitAngleYaw = Math.PI; // Start looking towards negative Z
let cameraOrbitAnglePitch = Math.PI / 7; // Start slightly tilted down
const cameraDistance = 6;
const cameraRotationSensitivity = 0.005;
const minPitch = -Math.PI / 2.8; // Limit looking almost straight down
const maxPitch = Math.PI / 3;   // Limit looking too high up
const MIN_CAMERA_Y = 0.5;       // Camera should not go below this y-value (ADDED)

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Initial position will be set by updateCameraOrbit

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Player (make it slightly non-square to see orientation)
    const playerGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.5); // Width, Height, Depth
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.9; // Half of height to sit on ground
    player.castShadow = true;
    scene.add(player);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be flat
    ground.receiveShadow = true;
    scene.add(ground);

    // Add some resource objects
    addResource(new THREE.Vector3(3, 0.5, -2), 'wood');
    addResource(new THREE.Vector3(-2, 0.5, 1), 'stone');
    addResource(new THREE.Vector3(0, 0.25, 3), 'wood', 0.5); // Smaller wood

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // Mouse events on the canvas
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false); // Listen on document to catch mouseup outside canvas
    document.addEventListener('mousemove', onMouseMove, false); // Listen on document for smoother drag
    renderer.domElement.addEventListener('click', onClick, false); // For left-click interactions
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault()); // Prevent context menu

    updateInventoryUI();
    updateCameraOrbit(); // Set initial camera position
    animate();
}

function addResource(position, type, size = 1) {
    let geometry, material, color;
    let yOffset = 0;
    if (type === 'wood') {
        geometry = new THREE.BoxGeometry(size * 0.8, size * 2, size * 0.8);
        color = 0x8B4513; // Brown
        yOffset = size; // Trunk base on ground
    } else if (type === 'stone') {
        geometry = new THREE.SphereGeometry(size * 0.7, 8, 6);
        color = 0x808080; // Grey
        yOffset = size * 0.7; // Sphere base on ground
    } else {
        return;
    }
    material = new THREE.MeshStandardMaterial({ color: color });
    const resource = new THREE.Mesh(geometry, material);
    resource.position.copy(position);
    resource.position.y = yOffset; // Set correct Y position based on object type and size

    resource.castShadow = true;
    resource.receiveShadow = true;
    resource.userData = { type: type, interactable: true }; // Custom data
    scene.add(resource);
    resources.push(resource);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    keys[event.code] = true;
}

function onKeyUp(event) {
    keys[event.code] = false;
}

function onMouseDown(event) {
    if (event.button === 2) { // Right mouse button
        isRightMouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        renderer.domElement.style.cursor = 'grabbing';
    }
}

function onMouseUp(event) {
    if (event.button === 2 && isRightMouseDown) { // Right mouse button was released
        isRightMouseDown = false;
        renderer.domElement.style.cursor = 'default';
    }
}

function onMouseMove(event) {
    if (isRightMouseDown) {
        const deltaX = event.clientX - lastMouseX;
        const deltaY = event.clientY - lastMouseY;

        cameraOrbitAngleYaw -= deltaX * cameraRotationSensitivity;
        cameraOrbitAnglePitch -= deltaY * cameraRotationSensitivity;

        // Clamp pitch
        cameraOrbitAnglePitch = Math.max(minPitch, Math.min(maxPitch, cameraOrbitAnglePitch));

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        updateCameraOrbit();
    }
}

function onClick(event) {
    if (event.button !== 0) return; // Only process left-clicks for interaction

    // Raycasting to detect clicked objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(resources);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.interactable) {
            const distanceToPlayer = player.position.distanceTo(clickedObject.position);
            if (distanceToPlayer < 4) {
                console.log("Gathered:", clickedObject.userData.type);
                inventory[clickedObject.userData.type]++;
                updateInventoryUI();

                scene.remove(clickedObject);
                resources = resources.filter(res => res !== clickedObject);
                clickedObject.geometry.dispose();
                clickedObject.material.dispose();
            } else {
                console.log("Too far to gather.");
            }
        }
    }
}


function updateCameraOrbit() {
    if (!player || !camera) return;

    // Target for camera to look at (player's approximate head/chest area)
    const lookAtTargetPosition = new THREE.Vector3(
        player.position.x,
        player.position.y + 1.0,
        player.position.z
    );

    // Calculate camera position using spherical coordinates
    let camX = lookAtTargetPosition.x + cameraDistance * Math.sin(cameraOrbitAngleYaw) * Math.cos(cameraOrbitAnglePitch);
    let camY = lookAtTargetPosition.y + cameraDistance * Math.sin(cameraOrbitAnglePitch);
    let camZ = lookAtTargetPosition.z + cameraDistance * Math.cos(cameraOrbitAngleYaw) * Math.cos(cameraOrbitAnglePitch);

    // --- MODIFIED SECTION: Prevent camera from going below the ground ---
    if (camY < MIN_CAMERA_Y) {
        camY = MIN_CAMERA_Y;
        // Optionally, you could adjust pitch here if the camera hits the "floor"
        // to try and keep the lookAtTarget in view, but this simple clamp works for now.
    }
    // --- END OF MODIFIED SECTION ---

    camera.position.set(camX, camY, camZ);
    camera.lookAt(lookAtTargetPosition);
}

function updatePlayerAndCamera() {
    const moveDirectionInput = new THREE.Vector3();
    let isMoving = false;

    if (keys['KeyW'] || keys['ArrowUp']) { moveDirectionInput.z = -1; isMoving = true; }
    if (keys['KeyS'] || keys['ArrowDown']) { moveDirectionInput.z = 1; isMoving = true; }
    if (keys['KeyA'] || keys['ArrowLeft']) { moveDirectionInput.x = -1; isMoving = true; }
    if (keys['KeyD'] || keys['ArrowRight']) { moveDirectionInput.x = 1; isMoving = true; }

    if (isMoving) {
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;
        cameraForward.normalize();

        const cameraLeft = new THREE.Vector3().crossVectors(camera.up, cameraForward).normalize();
        const cameraRight = cameraLeft.clone().negate();

        const finalMove = new THREE.Vector3();
        finalMove.addScaledVector(cameraForward, -moveDirectionInput.z);
        finalMove.addScaledVector(cameraRight, moveDirectionInput.x);

        if (finalMove.lengthSq() > 0) {
            finalMove.normalize().multiplyScalar(playerSpeed);
        }
        player.position.add(finalMove);
    }

    // Keep player on the ground (very basic)
    player.position.y = 0.9;

    // Make player model face the camera's horizontal direction
    const playerLookDirection = new THREE.Vector3();
    camera.getWorldDirection(playerLookDirection);
    playerLookDirection.y = 0;
    playerLookDirection.normalize();

    if (playerLookDirection.lengthSq() > 0.0001) {
        const lookAtPos = player.position.clone().add(playerLookDirection);
        player.lookAt(lookAtPos);
    }

    // Update camera orbit to follow player
    updateCameraOrbit();
}


function updateInventoryUI() {
    document.getElementById('inv-wood').textContent = `Wood: ${inventory.wood}`;
    document.getElementById('inv-stone').textContent = `Stone: ${inventory.stone}`;
}

function animate() {
    requestAnimationFrame(animate);
    updatePlayerAndCamera();
    renderer.render(scene, camera);
}

init();