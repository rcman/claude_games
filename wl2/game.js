// Ensure canvas element exists
const canvas = document.getElementById("renderCanvas");
if (!canvas) {
    console.error("FATAL ERROR: Canvas element with ID 'renderCanvas' not found!");
    alert("Error: Cannot find the game canvas. Check the HTML file.");
}

// Create BabylonJS Engine - check if canvas exists first
const engine = canvas ? new BABYLON.Engine(canvas, true, { stencil: true }) : null;
if (!engine) {
     console.error("FATAL ERROR: Babylon engine could not be created. Ensure WebGL is supported and canvas exists.");
     if (canvas) alert("Error: Could not start the graphics engine. Your browser might not support WebGL.");
}

// --- Constants ---
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.5;
const PLAYER_SPEED = 0.15; // Adjust for desired movement speed
const GRID_SIZE = 4;    // Foundations/Ceilings are GRID_SIZE x GRID_SIZE units
const WALL_HEIGHT = 3;    // Height of walls
const WALL_THICKNESS = 0.2; // Thickness of walls
const INTERACTION_DISTANCE = 2.5; // Max distance player can be to interact with objects (like doors)

// --- Game State Variables ---
let isBuildMode = false;        // Is the player currently in build mode?
let selectedBuildItem = null; // String identifier ('foundation', 'wall', etc.) or null
let ghostMesh = null;         // The semi-transparent preview mesh
const builtItems = [];        // Array to keep track of all placed meshes
const doors = [];             // Array to specifically keep track of placed door meshes for interaction

// --- HTML Elements ---
const buildMenu = document.getElementById('buildMenu');
const buildButtons = buildMenu ? buildMenu.querySelectorAll('button') : []; // Get all buttons inside the menu
if (!buildMenu) console.warn("Build menu element with ID 'buildMenu' not found in HTML.");


// --- Scene Setup Function ---
const createScene = () => {
    // Exit if engine couldn't be created
    if (!engine) return null;

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.5, 0.8, 0.9); // Pleasant sky blue
    scene.collisionsEnabled = true; // Enable collision detection system
    scene.gravity = new BABYLON.Vector3(0, -9.81 / 60, 0); // Apply gravity (adjust factor for desired effect)

    // --- Camera (Third Person Arc Rotate) ---
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true); // Attach camera controls (mouse drag/scroll) initially
    camera.lowerRadiusLimit = 2.5;      // Min zoom distance
    camera.upperRadiusLimit = 25;       // Max zoom distance
    camera.checkCollisions = true;      // Prevent camera from going through objects
    camera.collisionRadius = new BABYLON.Vector3(0.3, 0.3, 0.3); // Small radius for camera collision
    camera.wheelPrecision = 20;        // Zoom speed sensitivity

    // --- Lighting ---
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0.5, 1, 0.25), scene);
    light.intensity = 0.9;
    // Optional: Add a directional light for shadows later
    // const dirLight = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
    // dirLight.position = new BABYLON.Vector3(20, 40, 20);

    // --- Ground ---
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene); // Larger ground
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.6, 0.8, 0.4); // Greenish ground
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Reduce shininess
    ground.material = groundMat;
    ground.checkCollisions = true; // Ground is collidable
    // ground.receiveShadows = true; // If using shadows

    // --- Player ---
    const player = BABYLON.MeshBuilder.CreateCapsule("player",
        { height: PLAYER_HEIGHT, radius: PLAYER_RADIUS, capSubdivisions: 6, subdivisions: 6 }, // Smoother capsule
        scene
    );
    player.position = new BABYLON.Vector3(0, PLAYER_HEIGHT / 2 + 1, 0); // Start slightly above ground
    const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2); // Red player
    player.material = playerMat;
    // Player collision ellipsoid - slightly smaller than visual mesh can help prevent snagging
    player.ellipsoid = new BABYLON.Vector3(PLAYER_RADIUS * 0.9, PLAYER_HEIGHT / 2, PLAYER_RADIUS * 0.9);
    player.checkCollisions = true; // Player collides with environment
    player.applyGravity = true; // Player is affected by scene gravity
    // player.ellipsoidOffset = new BABYLON.Vector3(0, PLAYER_HEIGHT / 2, 0); // Needed if capsule origin isn't at its base

    // Lock camera target to player for smooth following
    camera.lockedTarget = player;

    // --- Input Handling (Keyboard State) ---
    const inputMap = {}; // Object to track currently pressed keys
    scene.actionManager = new BABYLON.ActionManager(scene);

    // Register actions to update inputMap on key down/up
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
    }));

    // --- Global Key Listeners ---

    // Listener for 'B' key to toggle build mode
    window.addEventListener("keydown", (event) => {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        if (event.key.toLowerCase() === 'b') {
            toggleBuildMode();
        }
    });

    // Listener for 'E' key to interact with doors
    window.addEventListener("keydown", (event) => {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return; // Ignore if typing
        if (event.key.toLowerCase() === 'e') {
             // Cannot interact while in build mode
             if (isBuildMode) {
                console.log("Cannot interact while in build mode.");
                return;
             }

            // Find the closest door
            const nearestDoor = findClosestDoor(player.position);
            if (nearestDoor) {
                console.log("Trying to toggle door:", nearestDoor.name);
                toggleDoor(nearestDoor); // Attempt to open/close it
            } else {
                 console.log("No door within interaction range.");
            }
        }
    });


    // --- Pointer Handling (Mouse Click for Building Placement) ---
    scene.onPointerObservable.add((pointerInfo) => {
        // Check conditions for placing an item
        if (isBuildMode && selectedBuildItem && ghostMesh && ghostMesh.isVisible) {
            // Check for left mouse button down event
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
                // Ensure the click wasn't on a UI element overlaying the canvas
                if (pointerInfo.event.target === canvas) {
                    placeBuildItem(scene); // Call the updated placement function
                }
            }
        }
    });


    // --- Building System Functions ---

    function toggleBuildMode() {
        isBuildMode = !isBuildMode; // Flip the state
        if (buildMenu) {
            buildMenu.style.display = isBuildMode ? 'block' : 'none'; // Show/hide HTML menu
        }

        if (isBuildMode) {
            // Entering build mode
            camera.detachControl(canvas); // Disable camera movement via mouse
            selectBuildItem('cancel', null); // Ensure nothing is selected initially
        } else {
            // Exiting build mode
            if (ghostMesh) { // Clean up ghost mesh if it exists
                ghostMesh.dispose();
                ghostMesh = null;
            }
            selectedBuildItem = null; // No item selected
            updateSelectedButton();   // Clear UI button highlight
            camera.attachControl(canvas, true); // Re-enable camera movement via mouse
        }
    }

    function selectBuildItem(itemName, buttonElement) {
        if (itemName === 'cancel') {
            selectedBuildItem = null; // Deselect item
            if (ghostMesh) ghostMesh.dispose(); // Remove ghost
            ghostMesh = null;
        } else {
            selectedBuildItem = itemName; // Set the selected item
            createOrUpdateGhostMesh(scene); // Create/update the preview mesh
        }
        updateSelectedButton(buttonElement); // Update UI highlighting
    }

    // Updates CSS class on build menu buttons to show selection
    function updateSelectedButton(selectedButton = null) {
        buildButtons.forEach(btn => btn.classList.remove('selected'));
        if (selectedButton && selectedBuildItem && selectedBuildItem !== 'cancel') {
            selectedButton.classList.add('selected');
        }
    }

    // Attach event listeners to each button in the build menu
    if (buildMenu) {
        buildButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const item = button.getAttribute('data-item');
                selectBuildItem(item, button);
                event.stopPropagation(); // Prevent click from potentially triggering canvas click
            });
        });
    }

    // Creates or replaces the transparent ghost mesh for placement preview
    function createOrUpdateGhostMesh(scene) {
        if (ghostMesh) {
            ghostMesh.dispose(); // Remove the old ghost mesh
        }
        if (!selectedBuildItem) return; // Don't create if no item is selected

        // Material for the ghost mesh (semi-transparent green/red)
        const ghostMat = new BABYLON.StandardMaterial("ghostMat", scene);
        ghostMat.diffuseColor = new BABYLON.Color3(0.5, 1, 0.5); // Default to green (valid)
        ghostMat.alpha = 0.45; // Transparency
        ghostMat.wireframe = true; // See edges clearly

        // Create the basic shape based on the selected item
        switch (selectedBuildItem) {
            case 'foundation':
                ghostMesh = BABYLON.MeshBuilder.CreateBox("ghostFoundation", {
                    width: GRID_SIZE, depth: GRID_SIZE, height: 0.2
                }, scene);
                break;
            case 'wall':
            case 'wall_window':
            case 'wall_doorway':
            case 'door': // Doors use wall dimensions for ghost initially
                ghostMesh = BABYLON.MeshBuilder.CreateBox("ghostWall", {
                    width: GRID_SIZE, depth: WALL_THICKNESS, height: WALL_HEIGHT
                }, scene);
                break;
            case 'ceiling':
                ghostMesh = BABYLON.MeshBuilder.CreateBox("ghostCeiling", {
                    width: GRID_SIZE, depth: GRID_SIZE, height: 0.2
                }, scene);
                break;
            default:
                console.warn("Attempted to create ghost for unknown item:", selectedBuildItem);
                return; // Exit if item type isn't recognized
        }

        // Common ghost mesh properties
        if (ghostMesh) {
            ghostMesh.material = ghostMat;
            ghostMesh.isPickable = false;      // Ghost shouldn't block raycasts for placement
            ghostMesh.isVisible = false;       // Hide initially until a valid spot is found
            ghostMesh.checkCollisions = false; // Ghost doesn't collide
        }
    }

    // Helper function to identify if a mesh is a placed foundation or ceiling
    function isFoundationOrCeiling(mesh) {
        if (!mesh || !mesh.name) return false;
        // Check if mesh name starts with the prefix used during placement
        return mesh.name.startsWith("foundation_") || mesh.name.startsWith("ceiling_");
    }

    // This function runs every frame while in build mode to update the ghost mesh position
    function handleBuildMode(scene) {
        // Early exit conditions
        if (!isBuildMode || !selectedBuildItem || !ghostMesh) {
            if (ghostMesh && ghostMesh.isVisible) ghostMesh.isVisible = false; // Hide ghost if needed
            return;
        }

        // Cast a ray from the camera through the mouse pointer
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
            // Predicate: Only consider pickable meshes that aren't the player or the ghost itself
            return mesh.isPickable && mesh !== ghostMesh && mesh !== player;
        });

        let placementValid = false; // Assume invalid placement initially
        let targetPosition = new BABYLON.Vector3(); // Where the ghost should be placed
        let targetRotation = new BABYLON.Vector3(0, 0, 0); // Rotation of the ghost
        ghostMesh.isVisible = false; // Hide ghost by default this frame

        // Only proceed if the ray hit something
        if (pickInfo.hit) {
            const hitPoint = pickInfo.pickedPoint; // Exact 3D point of collision
            const pickedMesh = pickInfo.pickedMesh; // The mesh that was hit

            // --- Placement Logic based on selected item ---
            switch (selectedBuildItem) {
                case 'foundation':
                    targetPosition.x = Math.round(hitPoint.x / GRID_SIZE) * GRID_SIZE;
                    targetPosition.z = Math.round(hitPoint.z / GRID_SIZE) * GRID_SIZE;
                    let levelY = Math.floor(Math.max(0, hitPoint.y - 0.01) / (WALL_HEIGHT + 0.1));
                    targetPosition.y = levelY * (WALL_HEIGHT + 0.1) + 0.1;
                    placementValid = true;
                    break;

                case 'wall':
                case 'wall_window':
                case 'wall_doorway':
                case 'door':
                    // Walls/Doors must be placed on the edge of a foundation or ceiling
                    if (pickedMesh && isFoundationOrCeiling(pickedMesh)) {
                        const basePos = pickedMesh.position;
                        const halfGrid = GRID_SIZE / 2;
                        const relativeX = hitPoint.x - basePos.x;
                        const relativeZ = hitPoint.z - basePos.z;
                        let edgeAxis = (Math.abs(relativeX) > Math.abs(relativeZ)) ? 'X' : 'Z';
                        let edgeSign = (edgeAxis === 'X') ? Math.sign(relativeX) : Math.sign(relativeZ);
                        const tolerance = 0.3; // How far from the exact edge line is okay
                        const isOnEdge = (edgeAxis === 'X' && Math.abs(relativeZ) <= halfGrid + tolerance) ||
                                         (edgeAxis === 'Z' && Math.abs(relativeX) <= halfGrid + tolerance);

                        if (isOnEdge) {
                            const baseY = basePos.y + (pickedMesh.name.startsWith("foundation_") ? 0 : 0.1); // Slightly higher if on ceiling
                             // Wall Y position centered vertically
                            targetPosition.y = baseY + WALL_HEIGHT / 2;
                             // For doors, adjust Y to align bottom with foundation/ceiling surface
                            if (selectedBuildItem === 'door') {
                                 const doorwayHeight = WALL_HEIGHT * 0.8; // From placement logic
                                 const doorActualHeight = doorwayHeight * 0.98; // Match placement logic height
                                 targetPosition.y = baseY + doorActualHeight / 2; // Center the door vertically on the base surface
                            }

                            if (edgeAxis === 'X') { // Place on Left or Right (+/- X)
                                targetPosition.x = basePos.x + edgeSign * halfGrid;
                                targetPosition.z = basePos.z;
                                targetRotation.y = Math.PI / 2; // Rotate 90 deg
                                placementValid = true;
                            } else { // Place on Top or Bottom (+/- Z)
                                targetPosition.x = basePos.x;
                                targetPosition.z = basePos.z + edgeSign * halfGrid;
                                targetRotation.y = 0; // No rotation needed
                                placementValid = true;
                            }
                        }
                    }
                    break;

                case 'ceiling':
                    targetPosition.x = Math.round(hitPoint.x / GRID_SIZE) * GRID_SIZE;
                    targetPosition.z = Math.round(hitPoint.z / GRID_SIZE) * GRID_SIZE;
                    let levelCeiling = Math.floor(Math.max(0, hitPoint.y - 0.01) / WALL_HEIGHT);
                    targetPosition.y = (levelCeiling * WALL_HEIGHT) + WALL_HEIGHT + 0.1;
                    placementValid = true;
                    break;
            }
        } // End if (pickInfo.hit)

        // --- Update Ghost Mesh Visuals ---
        if (placementValid) {
            ghostMesh.position = targetPosition;
            ghostMesh.rotation = targetRotation;
            ghostMesh.isVisible = true; // Show the ghost

            // TODO: Implement overlap check and color ghost red if invalid
            // ghostMesh.material.diffuseColor = checkOverlap(...) ? RED : GREEN;

        } else {
            ghostMesh.isVisible = false; // Hide ghost if placement is invalid
        }
    } // End handleBuildMode


    // Creates the actual, solid mesh when the player clicks to place
    function placeBuildItem(scene) {
        // Double-check validity before placing
        if (!ghostMesh || !ghostMesh.isVisible || !selectedBuildItem) {
            console.warn("Placement attempted but ghost invalid or no item selected.");
            return;
        }

        // --- Define Opening Dimensions ---
        const doorwayHeight = WALL_HEIGHT * 0.8;
        const doorwayWidth = GRID_SIZE * 0.4;
        const windowHeight = WALL_HEIGHT * 0.4;
        const windowWidth = GRID_SIZE * 0.5;
        const windowBottomOffset = WALL_HEIGHT * 0.3;

        // --- Placeholder for the final mesh ---
        let newItem = null;

        // Create a unique material for the placed item
        const placedMat = new BABYLON.StandardMaterial("placedMat_" + selectedBuildItem + "_" + builtItems.length, scene);
        placedMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        placedMat.backFaceCulling = false; // For CSG results

        // Use ghost mesh's transform for positioning the final object initially
        const ghostPosition = ghostMesh.position.clone();
        const ghostRotation = ghostMesh.rotation.clone(); // Use Euler angles for now

        // --- Create Mesh based on selected item ---
        switch (selectedBuildItem) {
            case 'foundation':
                newItem = BABYLON.MeshBuilder.CreateBox("foundation_" + builtItems.length, {
                    width: GRID_SIZE, depth: GRID_SIZE, height: 0.2
                }, scene);
                placedMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
                newItem.material = placedMat;
                break;
            case 'wall':
                newItem = BABYLON.MeshBuilder.CreateBox("wall_" + builtItems.length, {
                    width: GRID_SIZE, depth: WALL_THICKNESS, height: WALL_HEIGHT
                }, scene);
                placedMat.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.5);
                newItem.material = placedMat;
                break;

            case 'wall_window': {
                placedMat.diffuseColor = new BABYLON.Color3(0.75, 0.65, 0.45);
                const baseWall = BABYLON.MeshBuilder.CreateBox("tempWall", { width: GRID_SIZE, height: WALL_HEIGHT, depth: WALL_THICKNESS }, scene);
                const hole = BABYLON.MeshBuilder.CreateBox("tempHole", { width: windowWidth, height: windowHeight, depth: WALL_THICKNESS * 1.5 }, scene);
                hole.position.y = windowBottomOffset + (windowHeight / 2) - (WALL_HEIGHT / 2);
                const wallCSG = BABYLON.CSG.FromMesh(baseWall);
                const holeCSG = BABYLON.CSG.FromMesh(hole);
                const windowWallCSG = wallCSG.subtract(holeCSG);
                newItem = windowWallCSG.toMesh("wall_window_" + builtItems.length, placedMat, scene);
                baseWall.dispose();
                hole.dispose();
                break;
            }

            case 'wall_doorway': {
                placedMat.diffuseColor = new BABYLON.Color3(0.7, 0.6, 0.4);
                const baseWall = BABYLON.MeshBuilder.CreateBox("tempWall", { width: GRID_SIZE, height: WALL_HEIGHT, depth: WALL_THICKNESS }, scene);
                const hole = BABYLON.MeshBuilder.CreateBox("tempHole", { width: doorwayWidth, height: doorwayHeight, depth: WALL_THICKNESS * 1.5 }, scene);
                hole.position.y = (doorwayHeight / 2) - (WALL_HEIGHT / 2);
                const wallCSG = BABYLON.CSG.FromMesh(baseWall);
                const holeCSG = BABYLON.CSG.FromMesh(hole);
                const doorwayWallCSG = wallCSG.subtract(holeCSG);
                newItem = doorwayWallCSG.toMesh("wall_doorway_" + builtItems.length, placedMat, scene);
                baseWall.dispose();
                hole.dispose();
                break;
            }

            // VVVVVV LATEST CORRECTED DOOR PLACEMENT CASE VVVVVV
            case 'door': { // Special handling for door placement and pivot
                const doorActualWidth = doorwayWidth * 0.95; // Slightly smaller than opening
                const doorActualHeight = doorwayHeight * 0.98; // Slightly shorter
                const doorActualDepth = WALL_THICKNESS * 0.7; // Thinner than wall

                newItem = BABYLON.MeshBuilder.CreateBox("door_" + doors.length, { // Use doors.length for unique name
                    width: doorActualWidth,
                    depth: doorActualDepth,
                    height: doorActualHeight
                }, scene);
                placedMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.2); // Dark brown
                newItem.material = placedMat;

                // --- Centered Placement + Pivot Offset ---

                // 1. Position the CENTER of the door mesh at the ghost position
                //    (handleBuildMode calculates the correct Y for the door ghost center)
                newItem.position = ghostPosition.clone();

                // 2. Apply the wall's rotation to the door
                const rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(ghostRotation.y, ghostRotation.x, ghostRotation.z);
                newItem.rotationQuaternion = rotationQuaternion;

                // 3. Set the Pivot Point relative to the door's CENTER.
                //    The pivot should be at the hinge edge. Assuming hinge is on the local left (-X side).
                //    The vector from the center (0,0,0) to the left edge (-W/2, 0, 0) is:
                const pivotPointLocal = new BABYLON.Vector3(-doorActualWidth / 2, 0, 0);
                newItem.setPivotPoint(pivotPointLocal, BABYLON.Space.LOCAL);


                // Add custom data to the door mesh for interaction state
                newItem.isOpen = false;
                newItem.isAnimating = false;

                doors.push(newItem); // Add to the specific doors array
                break; // End case 'door'
            }
             // ^^^^^^ END OF LATEST CORRECTED DOOR PLACEMENT CASE ^^^^^^


            case 'ceiling':
                newItem = BABYLON.MeshBuilder.CreateBox("ceiling_" + builtItems.length, {
                    width: GRID_SIZE, depth: GRID_SIZE, height: 0.2
                }, scene);
                placedMat.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.75);
                newItem.material = placedMat;
                break;

            default:
                 console.error("Attempted to place unknown item type:", selectedBuildItem);
                 return;
        }

        // --- Finalize Placement (Common for most items) ---
        if (newItem && selectedBuildItem !== 'door') { // Doors handle position/rotation specially
            newItem.position = ghostPosition;
            newItem.rotation = ghostRotation;
        }

        if (newItem) {
            newItem.checkCollisions = true; // Make the placed item solid
            builtItems.push(newItem); // Add to the general built items list
            console.log("Placed:", selectedBuildItem, "#" + (newItem.name.split('_').pop()), "at", newItem.position);
            handleBuildMode(scene); // Refresh ghost for next placement
        } else if (selectedBuildItem === 'wall_window' || selectedBuildItem === 'wall_doorway') {
             console.error("Failed to create CSG mesh for item:", selectedBuildItem);
        } else if (selectedBuildItem !== 'door') { // Door errors handled internally if newItem is null
             console.error("Failed to create mesh instance for item:", selectedBuildItem);
        }
    } // End placeBuildItem


    // --- Door Interaction Functions ---

    // Finds the closest door within interaction distance
    function findClosestDoor(playerPosition) {
        let closestDoor = null;
        let minDistanceSq = INTERACTION_DISTANCE * INTERACTION_DISTANCE; // Use squared distance

        doors.forEach(door => {
            if (door && !door.isDisposed()) { // Check if door exists and hasn't been removed
                // Use getAbsolutePivotPoint which reflects the hinge position in world space
                const pivotPointWorld = door.getAbsolutePivotPoint();
                const distanceSq = BABYLON.Vector3.DistanceSquared(playerPosition, pivotPointWorld);
                if (distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    closestDoor = door;
                }
            }
        });
        return closestDoor;
    }

    // Toggles the door open/closed state with animation
    function toggleDoor(doorMesh) {
        if (!doorMesh || doorMesh.isAnimating) {
            return; // Exit if no door provided or already moving
        }

        doorMesh.isAnimating = true; // Prevent spamming

        const frameRate = 30;
        const openAngle = -Math.PI / 1.9; // Open slightly more than 90 deg inward/outward (adjust sign/value)
        const closedAngle = 0;
        // Determine target angle based on current state
        const targetAngle = doorMesh.isOpen ? closedAngle : openAngle;
        // Get current rotation around Y axis (applied *after* pivot is set)
        const currentAngle = doorMesh.rotation.y;

        // Create Babylon Animation object
        const doorAnimation = new BABYLON.Animation(
            "doorSwingAnim_" + doorMesh.name, // Unique name
            "rotation.y",        // Animate the Y rotation (around the pivot)
            frameRate,           // Animation speed
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, // Data type
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT // Don't loop
        );

        // Define animation keyframes (frame, value)
        const keys = [];
        keys.push({ frame: 0, value: currentAngle });       // Start at current rotation
        keys.push({ frame: frameRate * 0.5, value: targetAngle }); // End at target angle after 0.5 seconds

        doorAnimation.setKeys(keys);

        // Optional: Add easing for smoother start/stop
        const easingFunction = new BABYLON.QuadraticEase(); // Example easing
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT); // Ease out looks nice
        doorAnimation.setEasingFunction(easingFunction);

        // Attach the animation to the specific door mesh
        doorMesh.animations = [doorAnimation]; // Replace any previous animations

        // Begin the animation
        scene.beginAnimation(
            doorMesh,   // Target mesh
            0,          // Start frame
            frameRate * 0.5, // End frame
            false,      // Don't loop
            1.0,        // Speed ratio (1.0 = normal)
            () => {     // Callback function when animation ends
                doorMesh.isOpen = !doorMesh.isOpen; // Update the door's state
                doorMesh.isAnimating = false;       // Allow interaction again
                console.log("Door", doorMesh.name, "animation finished. Is open:", doorMesh.isOpen);
            }
        );
    }


    // --- Player Movement Function ---
    function handlePlayerMovement(player, camera, inputMap) {
        // Get camera's forward and right vectors, projected onto XZ plane
        const cameraForward = camera.getForwardRay(1).direction;
        cameraForward.y = 0; // Ignore vertical component for movement
        cameraForward.normalize();

        const cameraRight = BABYLON.Vector3.Cross(BABYLON.Vector3.UpReadOnly, cameraForward).normalize(); // Use UpReadOnly for safety

        let moveDirection = BABYLON.Vector3.Zero(); // Reset movement vector each frame

        // Check WASD keys and add corresponding direction vector
        if (inputMap["w"]) {
            moveDirection.addInPlace(cameraForward);
        }
        if (inputMap["s"]) {
            moveDirection.addInPlace(cameraForward.scale(-1));
        }
        if (inputMap["a"]) {
            moveDirection.addInPlace(cameraRight.scale(-1));
        }
        if (inputMap["d"]) {
            moveDirection.addInPlace(cameraRight);
        }

        // Apply movement if any key is pressed
        if (moveDirection.lengthSquared() > 0.001) { // Use squared length and threshold for efficiency
            // Normalize the direction vector (length 1) and scale by speed
            moveDirection.normalize().scaleInPlace(PLAYER_SPEED);

            // Use Babylon's collision-aware movement function
            player.moveWithCollisions(moveDirection);

            // --- Player Rotation (Optional Visual) ---
            // Rotate player model to face the direction of movement
            if (Math.abs(moveDirection.x) > 0.01 || Math.abs(moveDirection.z) > 0.01) {
                let targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
                let currentAngle = player.rotation.y;
                let deltaAngle = BABYLON.Scalar.DeltaAngle(currentAngle, targetAngle);
                player.rotation.y += deltaAngle * 0.15; // Smooth rotation
            }
        }
    } // End handlePlayerMovement


    // --- Main Render Loop Logic (executed every frame) ---
    scene.onBeforeRenderObservable.add(() => {
        if (!isBuildMode) {
            // If not in build mode, handle player movement
            handlePlayerMovement(player, camera, inputMap);
        } else {
            // If in build mode, update the ghost placement preview
            handleBuildMode(scene);
        }
    });

    return scene; // Return the created scene
}; // End createScene


// --- Start the Game ---
// Ensure everything loaded and engine is ready before creating scene and running loop
if (engine) {
    const scene = createScene();

    if (scene) { // Check if scene creation was successful
        engine.runRenderLoop(() => {
            scene.render(); // Render the scene repeatedly
        });

        // Adjust canvas/engine size if browser window is resized
        window.addEventListener("resize", () => {
            engine.resize();
        });
    } else {
         console.error("Scene creation failed. Game cannot start.");
         alert("Error: Could not create the game scene.");
    }
} else {
     console.error("Engine not initialized. Game cannot start.");
     // Alert already shown if engine failed creation
}
