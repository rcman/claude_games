import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 15, 20); // Start camera further back

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
// Configure shadow properties for better quality (optional)
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);
scene.add(directionalLight.target); // Needed for positioning target

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smoother camera movement
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0); // Look at the center initially

// --- Ground ---
const groundSize = 100;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide }); // Forest green
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2; // Rotate to be flat
groundPlane.receiveShadow = true;
scene.add(groundPlane);

// --- Grid Helper ---
const gridSize = 2; // Size of one grid cell
const gridDivisions = groundSize / gridSize;
const gridHelper = new THREE.GridHelper(groundSize, gridDivisions);
scene.add(gridHelper);

// --- Building System Variables ---
const buildMenu = document.getElementById('build-menu');
let isBuildMode = false;
let selectedBuildItemType = null;
let buildPreviewMesh = null; // Ghost object for placement preview
const placedObjects = []; // Keep track of placed objects

const wallHeight = 3;
const wallThickness = 0.2; // Make walls thinner than foundations

// Materials for different build items
const materials = {
    foundation: new THREE.MeshStandardMaterial({ color: 0x888888 }), // Grey
    wall: new THREE.MeshStandardMaterial({ color: 0xcccccc }), // Light Grey
    wall_window: new THREE.MeshStandardMaterial({ color: 0xaaaaff }), // Bluish tint
    wall_doorway: new THREE.MeshStandardMaterial({ color: 0xffccaa }), // Orangish tint
    door: new THREE.MeshStandardMaterial({ color: 0x8B4513 }), // Brown
    ceiling: new THREE.MeshStandardMaterial({ color: 0xbbbbbb }), // Slightly different grey
    preview: new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 }) // Green preview
};

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- Functions ---

function toggleBuildMode() {
    isBuildMode = !isBuildMode;
    buildMenu.classList.toggle('hidden', !isBuildMode);
    if (!isBuildMode) {
        // Exit build mode: hide preview, clear selection
        deselectBuildItem();
    }
}

function selectBuildItem(type) {
    if (type === 'cancel') {
         deselectBuildItem();
         return;
    }
    selectedBuildItemType = type;
    console.log("Selected:", selectedBuildItemType);

    // Create or update preview mesh
    createOrUpdatePreviewMesh();

    // Hide build menu briefly or keep it open? User preference. Let's keep it open.
    // buildMenu.classList.add('hidden');
}

function deselectBuildItem() {
     selectedBuildItemType = null;
     if (buildPreviewMesh) {
        buildPreviewMesh.visible = false;
    }
    console.log("Deselected");
}

function createOrUpdatePreviewMesh() {
    if (!selectedBuildItemType) return;

    let geometry;
    const size = gridSize; // Use grid size for dimensions

    switch (selectedBuildItemType) {
        case 'foundation':
            geometry = new THREE.BoxGeometry(size, 0.3, size); // Short foundation
            break;
        case 'wall':
        case 'wall_window':
        case 'wall_doorway':
        case 'door': // Treat door placement like a wall section for simplicity
            // Walls are placed on edges, so width is thickness, length is grid size
            geometry = new THREE.BoxGeometry(size, wallHeight, wallThickness);
            break;
        case 'ceiling':
             geometry = new THREE.BoxGeometry(size, 0.2, size); // Thin ceiling
            break;
        default:
            return; // Unknown type
    }

    if (!buildPreviewMesh) {
        buildPreviewMesh = new THREE.Mesh(geometry, materials.preview);
        scene.add(buildPreviewMesh);
    } else {
        buildPreviewMesh.geometry.dispose(); // Dispose old geometry
        buildPreviewMesh.geometry = geometry;
        buildPreviewMesh.material = materials.preview; // Ensure preview material
        buildPreviewMesh.visible = true;
    }
     // Initial position update might be needed if mouse isn't moving
     updatePreviewPosition(mouse.x, mouse.y);
}


function updatePreviewPosition(mouseX, mouseY) {
    if (!buildPreviewMesh || !selectedBuildItemType) return;

    mouse.x = (mouseX / window.innerWidth) * 2 - 1;
    mouse.y = -(mouseY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Raycast against the ground plane
    const intersects = raycaster.intersectObject(groundPlane);

    if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        let targetPosition = new THREE.Vector3();
        let targetRotationY = 0;

        // Calculate snapped position based on item type
        switch (selectedBuildItemType) {
            case 'foundation':
            case 'ceiling':
                // Snap to grid center
                targetPosition.x = Math.round(intersectPoint.x / gridSize) * gridSize;
                targetPosition.z = Math.round(intersectPoint.z / gridSize) * gridSize;
                targetPosition.y = (selectedBuildItemType === 'ceiling') ? wallHeight : 0.15; // Foundation slightly raised, ceiling at wall height
                break;

            case 'wall':
            case 'wall_window':
            case 'wall_doorway':
            case 'door':
                 // Snap to grid *lines* (midpoints)
                 // Determine if closer to a vertical or horizontal grid line
                 const snapX = Math.round(intersectPoint.x / gridSize) * gridSize;
                 const snapZ = Math.round(intersectPoint.z / gridSize) * gridSize;
                 const diffX = Math.abs(intersectPoint.x - snapX);
                 const diffZ = Math.abs(intersectPoint.z - snapZ);

                 if (diffX < diffZ) { // Closer to vertical line (snap Z)
                     targetPosition.x = snapX;
                     targetPosition.z = Math.round((intersectPoint.z - gridSize / 2) / gridSize) * gridSize + gridSize / 2;
                     targetRotationY = 0; // Align with Z axis
                 } else { // Closer to horizontal line (snap X)
                     targetPosition.x = Math.round((intersectPoint.x - gridSize / 2) / gridSize) * gridSize + gridSize / 2;
                     targetPosition.z = snapZ;
                     targetRotationY = Math.PI / 2; // Align with X axis
                 }
                 targetPosition.y = wallHeight / 2; // Center vertically
                break;
        }

        buildPreviewMesh.position.copy(targetPosition);
        buildPreviewMesh.rotation.y = targetRotationY;
         // Update preview mesh material based on selection (optional, if colors differ)
        // buildPreviewMesh.material = materials.preview; // Redundant if set in createOrUpdate
    }
}

function placeBuildItem() {
    if (!buildPreviewMesh || !buildPreviewMesh.visible || !selectedBuildItemType) return;

    let geometry = buildPreviewMesh.geometry.clone(); // Use preview geometry
    let material = materials[selectedBuildItemType].clone(); // Use specific material
    const newMesh = new THREE.Mesh(geometry, material);

    newMesh.position.copy(buildPreviewMesh.position);
    newMesh.rotation.copy(buildPreviewMesh.rotation);

    newMesh.castShadow = true;
    newMesh.receiveShadow = true;

    scene.add(newMesh);
    placedObjects.push(newMesh); // Add to our list

    console.log(`Placed ${selectedBuildItemType} at`, newMesh.position);

    // Optional: Automatically deselect after placing?
    // deselectBuildItem();
}


// --- Event Listeners ---

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'b') {
        toggleBuildMode();
    }
     if (event.key === 'Escape' && isBuildMode) {
         deselectBuildItem();
     }
});

window.addEventListener('mousemove', (event) => {
    if (isBuildMode && selectedBuildItemType) {
        updatePreviewPosition(event.clientX, event.clientY);
    }
}, false);

window.addEventListener('mousedown', (event) => {
    // Check if the click was on the build menu itself
    if (buildMenu.contains(event.target)) {
        return; // Don't place if clicking the menu
    }

     // Left Click (Place)
    if (event.button === 0 && isBuildMode && selectedBuildItemType) {
        placeBuildItem();
    }
     // Right Click (Cancel placement)
     else if (event.button === 2 && isBuildMode) {
          event.preventDefault(); // Prevent context menu
          deselectBuildItem();
     }
}, false);

// Add listeners to build menu buttons
buildMenu.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        const type = button.getAttribute('data-type');
        selectBuildItem(type);
    });
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Only required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, camera);
}

// --- Initial Call ---
animate();
