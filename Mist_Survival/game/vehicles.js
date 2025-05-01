// game/vehicles.js
// Handles vehicle mechanics, physics (simplified), state, and player interaction.
// NOTE: This is highly complex and would likely require a physics engine integration (like Ammo.js or Rapier) for realistic behavior.

import * as THREE from '../libs/three.module.js';
import * as Player from './player.js';
import * as UIManager from './ui.js';
import * as World from './world.js'; // Needed for checking exit position?
// import Physics // Would import physics engine bindings

// --- State ---
let vehicles = []; // List of active vehicles in the world { id, mesh, physicsBody, stats: { health, fuel } }
let sceneRef = null;
let physicsWorldRef = null; // Reference to the physics engine world
let playerInVehicle = null; // Reference to the vehicle the player is currently in

// --- Vehicle Definitions (Placeholder - Load from Data) ---
const vehicleDefinitions = {
    'pickup_truck': {
        name: 'Pickup Truck',
        modelId: 'pickup_truck_model', // Asset ID for AssetManager
        size: { x: 2.2, y: 1.8, z: 5.0 },
        color: 0xcc4444, // Reddish
        maxHealth: 150,
        maxFuel: 80,
        fuelRate: 0.15, // Units per second while engine on
        seats: [
            { pos: { x: -0.5, y: 0.6, z: 0.9 }, role: 'driver' }, // Driver seat offset
            { pos: { x: 0.5, y: 0.6, z: 0.9 }, role: 'passenger' } // Passenger seat
        ],
        driverSeatIndex: 0,
        exitPoints: [ // Offset relative to vehicle center to check for exit
            { x: -1.5, y: 0, z: 0.9 }, // Driver side door
            { x: 1.5, y: 0, z: 0.9 }  // Passenger side door
        ]
    },
     'sedan': {
        name: 'Sedan',
        modelId: 'sedan_model',
        size: { x: 1.8, y: 1.4, z: 4.5 },
        color: 0x5555cc, // Bluish
        maxHealth: 100,
        maxFuel: 60,
        fuelRate: 0.1,
        seats: [
            { pos: { x: -0.4, y: 0.4, z: 0.7 }, role: 'driver' },
            { pos: { x: 0.4, y: 0.4, z: 0.7 }, role: 'passenger' },
            { pos: { x: -0.4, y: 0.4, z: -0.8 }, role: 'passenger_rear' },
            { pos: { x: 0.4, y: 0.4, z: -0.8 }, role: 'passenger_rear' }
        ],
        driverSeatIndex: 0,
         exitPoints: [
            { x: -1.3, y: 0, z: 0.7 }, // Front Left
            { x: 1.3, y: 0, z: 0.7 },  // Front Right
            { x: -1.3, y: 0, z: -0.8 }, // Rear Left
            { x: 1.3, y: 0, z: -0.8 }  // Rear Right
        ]
    }
    // Add more vehicle types
};

function getVehicleDefinition(typeId) {
    return vehicleDefinitions[typeId] || null;
}


// --- Initialization ---
export function init(scene, physicsWorld, loadData = null) {
    console.log("Initializing Vehicle Manager...");
    sceneRef = scene;
    physicsWorldRef = physicsWorld; // Assuming physics is initialized elsewhere
    vehicles = [];
    playerInVehicle = null;

    if (loadData && loadData.vehicles) {
        loadData.vehicles.forEach(vData => spawnVehicle(vData.typeId, vData.position, vData.rotation, vData.stats));
         console.log(`Vehicle state loaded (${vehicles.length} vehicles).`);
    } else {
        // Spawn a default vehicle for testing?
        spawnVehicle('pickup_truck', new THREE.Vector3(10, 1, 10)); // Needs height adjusted based on actual physics/model
        spawnVehicle('sedan', new THREE.Vector3(-10, 1, 10));
    }
}

// --- Update Loop ---
/**
 * Updates vehicle physics simulation and state.
 * @param {number} dt Delta time in real seconds.
 * @param {object} inputState Current player input state.
 */
export function update(dt, inputState) {
    if (!sceneRef) return;
    
    // Update physics for all vehicles
    vehicles.forEach(vehicle => {
        // Sync THREE.js mesh position/rotation with physics body IF using physics engine
        if (vehicle.physicsBody && physicsWorldRef) {
            updateMeshFromPhysics(vehicle.mesh, vehicle.physicsBody);
        }

        // If player is driving this vehicle, apply controls
        if (playerInVehicle === vehicle) {
            applyVehicleControls(vehicle, inputState, dt);

            // Update vehicle UI (only for the driven vehicle)
            // Calculate approximate speed
            let speed = 0;
            if (vehicle.lastPosition) {
                const distance = vehicle.mesh.position.distanceTo(vehicle.lastPosition);
                speed = (distance / dt) * 3.6; // Convert to km/h
            }
            vehicle.lastPosition = vehicle.mesh.position.clone();
            
            UIManager.updateVehicleUI(vehicle.stats, speed);
        }

        // Update vehicle stats (fuel consumption if engine is on)
        if (vehicle.engineOn && vehicle.stats.fuel > 0) {
            vehicle.stats.fuel -= dt * vehicle.fuelConsumptionRate;
            if (vehicle.stats.fuel <= 0) {
                vehicle.stats.fuel = 0;
                toggleEngine(vehicle); // Turn off engine
                UIManager.addLogMessage(`${vehicle.name} ran out of fuel!`);
            }
        }
    });
}

// --- Spawning ---
let nextVehicleId = 0;
export function spawnVehicle(typeId, position, rotationData = null, stats = null) {
    if (!sceneRef) {
        console.error("Cannot spawn vehicle: Scene not initialized.");
        return null;
    }
    const vehicleDef = getVehicleDefinition(typeId);
    if (!vehicleDef) {
        console.error(`Cannot spawn vehicle: Definition not found for typeId '${typeId}'.`);
        return null;
    }
    console.log(`Spawning vehicle type: ${typeId}`);


    // 1. Load Model (Placeholder - use AssetManager ideally)
    // const model = AssetManager.getModel(vehicleDef.modelId);
    // if (!model) { console.error(`Model not found: ${vehicleDef.modelId}`); return null; }
    const geometry = new THREE.BoxGeometry(vehicleDef.size.x, vehicleDef.size.y, vehicleDef.size.z);
    const material = new THREE.MeshStandardMaterial({ color: vehicleDef.color || 0x0000ff });
    const mesh = new THREE.Mesh(geometry, material);

    // Set initial transform
    mesh.position.copy(position);
    // Make sure Y position is correct relative to ground/physics
    mesh.position.y = vehicleDef.size.y / 2; // Adjust if needed based on physics/model origin
    if (rotationData) {
         mesh.rotation.set(rotationData.x, rotationData.y, rotationData.z, rotationData.order || 'XYZ');
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `Vehicle_${typeId}_${nextVehicleId}`;
    sceneRef.add(mesh);

    // 2. Create Physics Body (Placeholder)
    const physicsBody = createVehiclePhysicsBody(mesh, vehicleDef);

    // 3. Create Vehicle Data Object
    const vehicleData = {
        id: nextVehicleId++,
        typeId: typeId,
        name: vehicleDef.name,
        definition: vehicleDef, // Store definition for easy access
        mesh: mesh,
        physicsBody: physicsBody,
        stats: { // Merge saved stats with defaults
            health: stats?.health ?? vehicleDef.maxHealth ?? 100,
            maxHealth: vehicleDef.maxHealth ?? 100,
            fuel: stats?.fuel ?? vehicleDef.maxFuel ?? 50,
            maxFuel: vehicleDef.maxFuel ?? 50,
        },
        fuelConsumptionRate: vehicleDef.fuelRate || 0.1,
        engineOn: false,
        passengers: new Array(vehicleDef.seats.length).fill(null), // Array matching seats, null if empty
        driverSeatIndex: vehicleDef.driverSeatIndex || 0,
        lastPosition: position.clone(), // For speed calculation
    };
    mesh.userData.vehicleId = vehicleData.id; // Link mesh back to data
    mesh.userData.interact = tryEnterVehicle; // Assign interaction function

    vehicles.push(vehicleData);
    return vehicleData;
}

// --- Physics (Placeholders - Needs Real Implementation) ---
function createVehiclePhysicsBody(mesh, definition) {
    if (!physicsWorldRef) {
        // console.warn("Physics world not available, skipping physics body creation for vehicle.");
        return null; // Return null if no physics
    }
    console.warn("Placeholder physics body created for vehicle. Needs real physics engine integration.");
    // In a real engine (e.g., Ammo.js):
    // - Create a compound shape for the chassis, wheels.
    // - Create a RaycastVehicle or equivalent rigid body with constraints.
    // - Add it to the physicsWorldRef.
    // - Store references to wheels for applying forces/steering.
    return {
        // Mock physics body properties and methods
        position: mesh.position, // Link directly for placeholder
        rotation: mesh.rotation,
        quaternion: mesh.quaternion,
        applyEngineForce: (force, wheelIndex) => { /* Mock */ },
        setSteeringValue: (value, wheelIndex) => { /* Mock */ },
        setBrake: (force, wheelIndex) => { /* Mock */ },
        getWorldTransform: () => ({ // Mock function
            getOrigin: () => mesh.position, // Return mesh position
            getRotation: () => mesh.quaternion, // Return mesh quaternion
        }),
        // ... other physics controls
    };
}

function updateMeshFromPhysics(mesh, body) {
     if (!body || !physicsWorldRef) return; // Only run if using physics
    // In a real engine:
    // const transform = body.getWorldTransform(); // Get transform from physics body
    // mesh.position.copy(transform.getOrigin());
    // mesh.quaternion.copy(transform.getRotation());
    // Also update wheel mesh transforms if separate.
}

// --- Controls ---
function applyVehicleControls(vehicle, inputState, dt) {
    if (!vehicle.engineOn && !inputState.keys['KeyX']) { // Allow starting engine even if off
         if (inputState.keys['KeyW'] || inputState.keys['KeyS'] || inputState.keys['KeyA'] || inputState.keys['KeyD'] || inputState.keys['Space']) {
            UIManager.addLogMessage(`${vehicle.name} engine is off. Press 'X' to start.`);
         }
        return; // Don't process controls if engine off
    }
    if(!vehicle.engineOn && inputState.keys['KeyX']) {
        // Handled by toggleEngine called from key handler now
        return;
    }


    // --- Placeholder Movement (No Physics) ---
    if (!physicsWorldRef) {
         const moveSpeed = 10.0; // units per second
         const turnSpeed = 1.5;  // radians per second
         let moving = false;

         if (inputState.keys['KeyW']) {
             const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(vehicle.mesh.quaternion);
             vehicle.mesh.position.addScaledVector(forward, moveSpeed * dt);
             moving = true;
         }
         if (inputState.keys['KeyS']) {
             const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(vehicle.mesh.quaternion);
             vehicle.mesh.position.addScaledVector(forward, -moveSpeed * 0.5 * dt); // Slower reverse
             moving = true;
         }
         if (inputState.keys['KeyA']) {
             vehicle.mesh.rotation.y += turnSpeed * dt;
             moving = true;
         }
         if (inputState.keys['KeyD']) {
             vehicle.mesh.rotation.y -= turnSpeed * dt;
             moving = true;
         }
         // Basic sound placeholder
         // if (moving && !vehicle.moveSound?.isPlaying) vehicle.moveSound?.play();
         // else if (!moving && vehicle.moveSound?.isPlaying) vehicle.moveSound?.stop();

    } else {
         // --- TODO: Implement Realistic Vehicle Controls using Physics Engine ---
        const body = vehicle.physicsBody;
        const maxSteerVal = 0.6;
        const maxForce = 1000; // Engine force (adjust per vehicle)
        const brakeForce = 100; // Adjust per vehicle

        let engineForce = 0;
        let steeringValue = 0;
        let breakingForce = 0;

        // Acceleration/Reverse
        if (inputState.keys['KeyW']) engineForce = maxForce;
        else if (inputState.keys['KeyS']) engineForce = -maxForce / 2;

        // Steering
        if (inputState.keys['KeyA']) steeringValue = maxSteerVal;
        else if (inputState.keys['KeyD']) steeringValue = -maxSteerVal;
        // TODO: Add gradual return to center for steering?

        // Braking (Spacebar)
        if (inputState.keys['Space']) {
            breakingForce = brakeForce;
            engineForce = 0; // Don't accelerate while braking
        }

        // Apply forces/steering to physics wheels (indices depend on setup)
        // Example for a 4-wheel car:
        // body.applyEngineForce(engineForce, 2); // Rear wheel drive
        // body.applyEngineForce(engineForce, 3);
        // body.setSteeringValue(steeringValue, 0); // Front wheels steer
        // body.setSteeringValue(steeringValue, 1);
        // body.setBrake(breakingForce, 0);
        // body.setBrake(breakingForce, 1);
        // body.setBrake(breakingForce, 2);
        // body.setBrake(breakingForce, 3);
        // console.log(`Vehicle Controls: F=${engineForce.toFixed(0)}, S=${steeringValue.toFixed(2)}, B=${breakingForce.toFixed(0)}`); // Debug
    }
}

// --- Player Interaction ---
function tryEnterVehicle(playerMeshWhoInteracted) {
    if (playerInVehicle) {
        UIManager.addLogMessage("Already in a vehicle.");
        return;
    }
    
    // 'this' should be the vehicle mesh that was interacted with
    const vehicleId = this.userData?.vehicleId;
    if (vehicleId === undefined) {
        console.error("Vehicle interaction without proper vehicleId in userData");
        return;
    }
    
    const vehicle = vehicles.find(v => v.id === vehicleId);

    if (vehicle) {
        // Find nearest available seat
        const playerPos = playerMeshWhoInteracted.position;
        let bestSeat = -1;
        let minDistSq = Infinity;

        for(let i = 0; i < vehicle.definition.seats.length; i++) {
            if (!vehicle.passengers[i]) { // Check if seat is empty
                const seatOffset = vehicle.definition.seats[i].pos;
                // Convert local seat offset to world position
                const seatWorldPos = new THREE.Vector3(seatOffset.x, seatOffset.y, seatOffset.z);
                vehicle.mesh.localToWorld(seatWorldPos);
                const distSq = playerPos.distanceToSquared(seatWorldPos);

                if (distSq < minDistSq && distSq < 4*4) { // Must be reasonably close (e.g., 4 units)
                    minDistSq = distSq;
                    bestSeat = i;
                }
            }
        }

        if (bestSeat !== -1) {
            enterVehicle(vehicle, playerMeshWhoInteracted, bestSeat);
        } else {
            UIManager.addLogMessage("No available seats or too far.");
        }
    } else {
        console.error(`Vehicle with ID ${vehicleId} not found.`);
    }
}

export function enterVehicle(vehicle, playerMesh, seatIndex) {
    const playerRef = Player.getPlayerReference(); // Assume Player module provides a reference or ID
    if (!playerRef) {
        console.error("Could not get player reference to enter vehicle.");
        return;
    }

    console.log(`Player entering vehicle ${vehicle.id} seat ${seatIndex}`);
    playerInVehicle = vehicle;
    vehicle.passengers[seatIndex] = playerRef; // Store player reference/ID

    // Hide player mesh & disable player physics/collision
    playerMesh.visible = false;
    Player.setActive(false); // Tell Player module to disable its updates/physics


    // Attach camera? Or switch to vehicle camera? Depends on design.
    // Simplest: Keep camera logic in main loop, but it follows vehicle now.
    // OR: camera.position.set(...) // Set to a chase cam position relative to vehicle

    UIManager.addLogMessage(`Entered ${vehicle.name}. Press 'F' to exit, 'X' to toggle engine.`);
    UIManager.showVehicleUI(); // Show speed, fuel etc.

    // Auto-start engine only if entering driver seat?
    if(seatIndex === vehicle.driverSeatIndex && !vehicle.engineOn) {
        toggleEngine(vehicle);
    }
}

export function tryExitVehicle() {
    if (!playerInVehicle) return;

    const vehicle = playerInVehicle;
    const playerMesh = Player.getPlayerMesh(); // Get player mesh reference
    const playerRef = Player.getPlayerReference(); // Get player ID/ref

    // Find which seat the player is in
    const seatIndex = vehicle.passengers.findIndex(p => p === playerRef);
    if (seatIndex === -1) {
        console.error("Player trying to exit vehicle they aren't in?");
        return; // Should not happen
    }

    // Find a suitable exit position near the appropriate door
    // Use exitPoints defined in vehicle definition
    let exitPos = null;
    const exitPoints = vehicle.definition.exitPoints || [{ x: 1.5, y: 0, z: 0 }]; // Default exit point

    for (const point of exitPoints) {
         const localExit = new THREE.Vector3(point.x, point.y, point.z);
         const worldExit = vehicle.mesh.localToWorld(localExit.clone());
         worldExit.y = Player.getPlayerHeight() / 2; // Set Y to player base height

         // --- TODO: Check if worldExit position is valid ---
         // - Raycast down slightly from worldExit to confirm ground beneath.
         // - Check for collisions at worldExit using a small bounding box/sphere against world objects.
         // Example placeholder check:
         const isValidExit = isPositionClear(worldExit);

         if (isValidExit) {
             exitPos = worldExit;
             break; // Found a valid spot
         }
    }

    if (!exitPos) {
        // If no defined exit point is clear, try a default offset as fallback
        const fallbackOffset = new THREE.Vector3(1.5, 0, 0); // Default right side
        exitPos = vehicle.mesh.localToWorld(fallbackOffset);
        exitPos.y = Player.getPlayerHeight() / 2;
        if (!isPositionClear(exitPos)) {
             UIManager.addLogMessage("Cannot exit vehicle: Exit blocked!");
             return; // Completely blocked
        }
    }

    // --- Perform Exit ---
    console.log(`Player exiting vehicle ${vehicle.id} from seat ${seatIndex}`);

    // Move player mesh to exit position
    playerMesh.position.copy(exitPos);
    playerMesh.rotation.copy(vehicle.mesh.rotation); // Align player with vehicle initially? Or face away?
    playerMesh.visible = true;

    // Re-enable player physics/controls
    Player.setActive(true);

    // Clear player from vehicle seat
    vehicle.passengers[seatIndex] = null;
    playerInVehicle = null;

    // Stop engine? Optional, maybe leave it running.
    // if (vehicle.engineOn) { toggleEngine(vehicle); }

    UIManager.hideVehicleUI();
    UIManager.addLogMessage(`Exited ${vehicle.name}.`);
}

// Helper function to check if a position is clear (basic placeholder)
function isPositionClear(pos) {
    // TODO: Implement real collision check here using Physics engine or bounding box checks
    // Check against other vehicles, placed structures, world geometry etc.
    // For now, just check basic bounds
    const boundary = 99;
    if (pos.x < -boundary || pos.x > boundary || pos.z < -boundary || pos.z > boundary) {
        return false; // Outside world bounds
    }
    // Check distance to other large objects?

    return true; // Assume clear for now
}


export function toggleEngine(vehicle = null) {
    const targetVehicle = vehicle || playerInVehicle; // Target current vehicle if null passed
    if (!targetVehicle) return;

    if (targetVehicle.engineOn) {
        targetVehicle.engineOn = false;
        UIManager.addLogMessage(`${targetVehicle.name} engine OFF.`);
        // TODO: Stop engine sound
         // if (targetVehicle.engineSound?.isPlaying) targetVehicle.engineSound.stop();
    } else {
        if (targetVehicle.stats.fuel > 0) {
            targetVehicle.engineOn = true;
            UIManager.addLogMessage(`${targetVehicle.name} engine ON.`);
            // TODO: Play engine start/loop sound
             // if (!targetVehicle.engineSound?.isPlaying) targetVehicle.engineSound.play();
        } else {
             UIManager.addLogMessage(`${targetVehicle.name} is out of fuel!`);
        }
    }
}

// --- Getters ---
export function getPlayerVehicle() {
    return playerInVehicle;
}

export function getVehicles() {
     return vehicles.map(v => ({ ...v })); // Return shallow copies of data
}

// --- Persistence ---
export function getState() {
    // Save data *without* THREE.Mesh or physicsBody references
    return vehicles.map(v => ({
        id: v.id, // Only needed if matching instances across saves is important
        typeId: v.typeId,
        position: { x: v.mesh.position.x, y: v.mesh.position.y, z: v.mesh.position.z },
        rotation: { x: v.mesh.rotation.x, y: v.mesh.rotation.y, z: v.mesh.rotation.z, order: v.mesh.rotation.order },
        stats: { ...v.stats },
        engineOn: v.engineOn,
        passengers: [...v.passengers], // Save who is in which seat (using Player IDs)
    }));
}