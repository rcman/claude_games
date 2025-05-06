import * as THREE from './three.min.js';
// GLTFLoader for models

export class AnimalManager {
    constructor(scene, collidables, waterLevel) {
        this.scene = scene;
        this.collidables = collidables; // For animal vs environment collision
        this.waterLevel = waterLevel;
        this.animals = [];
        // this.loader = new GLTFLoader(); // If using GLTF

        this.spawnAnimals();
    }

    spawnAnimals() {
        // Placeholder geometries/materials
        const chickenGeo = new THREE.SphereGeometry(0.3, 8, 6);
        const chickenMat = new THREE.MeshStandardMaterial({ color: 0xfffafa });
        const rabbitGeo = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8);
        const rabbitMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        // ... Wolf, Bear

        const animalTypes = [
            { type: 'chicken', count: 10, geo: chickenGeo, mat: chickenMat, speed: 1, health: 10, loot: [{name: 'Raw Meat', quantity:1}, {name: 'Feather', quantity: 2}]},
            { type: 'rabbit', count: 10, geo: rabbitGeo, mat: rabbitMat, speed: 2, health: 10, loot: [{name: 'Raw Meat', quantity:1}, {name: 'Leather Scrap', quantity: 1}]},
            // { type: 'wolf', count: 5, ... aggro: true, damage: 5, chaseDist: 30 },
            // { type: 'bear', count: 2, ... aggro: true, damage: 10, chaseDist: 40 },
        ];

        animalTypes.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                // This is a placeholder: load actual models with animations
                const animalMesh = new THREE.Mesh(config.geo, config.mat);
                animalMesh.castShadow = true;
                
                // Find valid spawn point (on land)
                let spawnX, spawnZ, spawnY;
                do {
                    spawnX = (Math.random() - 0.5) * 800; // worldSize - buffer
                    spawnZ = (Math.random() - 0.5) * 800;
                    spawnY = this.getTerrainHeight(spawnX, spawnZ); // Helper needed
                } while (spawnY <= this.waterLevel);

                animalMesh.position.set(spawnX, spawnY + 0.3, spawnZ); // Adjust Y based on model
                animalMesh.userData = { 
                    type: config.type, 
                    speed: config.speed,
                    health: config.health,
                    loot: config.loot,
                    state: 'roaming', // 'roaming', 'fleeing', 'chasing', 'dead'
                    targetPosition: new THREE.Vector3(),
                    isDrowning: false,
                    drownTimer: 0
                };
                this.scene.add(animalMesh);
                this.animals.push(animalMesh);
                // this.collidables.push(animalMesh); // Animals can be collidable too
            }
        });
    }
    
    getTerrainHeight(x,z, terrainMesh) { // Crude, assumes terrainMesh is available
        if (!terrainMesh) return this.waterLevel + 1; // fallback
        const raycaster = new THREE.Raycaster(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObject(terrainMesh);
        return intersects.length > 0 ? intersects[0].point.y : this.waterLevel + 1;
    }


    update(deltaTime, playerPosition, terrainMesh) {
        this.animals.forEach(animal => {
            if (animal.userData.state === 'dead') return;

            // Drowning logic
            if (animal.position.y < this.waterLevel) {
                animal.userData.isDrowning = true;
                animal.userData.drownTimer += deltaTime;
                animal.position.y -= 0.5 * deltaTime; // Sink slowly
                if (animal.userData.drownTimer > 5) { // Drown after 5 seconds
                    console.log(`${animal.userData.type} drowned.`);
                    animal.userData.state = 'dead';
                    // Could drop loot here or mark for later cleanup
                    // For now, just make it disappear after a bit
                    setTimeout(() => this.scene.remove(animal), 10000); 
                    const index = this.animals.indexOf(animal);
                    if (index > -1) this.animals.splice(index, 1); // Remove from active list
                    // Also remove from collidables if it was added
                    return;
                }
            } else {
                animal.userData.isDrowning = false;
                animal.userData.drownTimer = 0;
            }
            if (animal.userData.isDrowning) return; // Stop other AI if drowning


            // Simple AI: Roam or Flee/Chase
            const distToPlayer = animal.position.distanceTo(playerPosition);

            // Basic state machine (needs refinement)
            if (animal.userData.aggro && distToPlayer < animal.userData.chaseDist && animal.userData.state !== 'chasing') {
                animal.userData.state = 'chasing';
            } else if (!animal.userData.aggro && distToPlayer < 15 && animal.userData.state !== 'fleeing') { // Non-aggro animals flee
                animal.userData.state = 'fleeing';
            } else if (animal.userData.state === 'chasing' && distToPlayer > animal.userData.chaseDist * 1.5) {
                animal.userData.state = 'roaming'; // Lose interest
            } else if (animal.userData.state === 'fleeing' && distToPlayer > 30) {
                animal.userData.state = 'roaming'; // Stop fleeing
            }


            if (animal.userData.state === 'roaming') {
                if (animal.position.distanceTo(animal.userData.targetPosition) < 2 || Math.random() < 0.01) {
                    // New random target on land
                    let newX, newZ, newY;
                     do {
                        newX = animal.position.x + (Math.random() - 0.5) * 40;
                        newZ = animal.position.z + (Math.random() - 0.5) * 40;
                        newY = this.getTerrainHeight(newX, newZ, terrainMesh);
                    } while (newY <= this.waterLevel);
                    animal.userData.targetPosition.set(newX, newY + 0.3, newZ);
                }
            } else if (animal.userData.state === 'fleeing') {
                const fleeVector = new THREE.Vector3().subVectors(animal.position, playerPosition).normalize();
                animal.userData.targetPosition.addVectors(animal.position, fleeVector.multiplyScalar(10));
            } else if (animal.userData.state === 'chasing') {
                animal.userData.targetPosition.copy(playerPosition);
            }

            // Move towards target position (and stay on terrain)
            const direction = new THREE.Vector3().subVectors(animal.userData.targetPosition, animal.position);
            direction.y = 0; // Don't try to fly/dig initially
            direction.normalize();
            
            const moveDistance = animal.userData.speed * deltaTime;
            animal.position.addScaledVector(direction, moveDistance);
            
            // Adjust Y to terrain height
            const currentTerrainHeight = this.getTerrainHeight(animal.position.x, animal.position.z, terrainMesh);
            if (!animal.userData.isDrowning) { // Don't snap to terrain if going into water
                 animal.position.y = currentTerrainHeight + (animal.geometry.parameters.height ? animal.geometry.parameters.height/2 : 0.3); // Adjust based on model origin/size
            }


            // Look at target (simple)
            if (direction.lengthSq() > 0.001) {
                animal.lookAt(animal.position.x + direction.x, animal.position.y, animal.position.z + direction.z);
            }
            
            // TODO: Animation handling (e.g., play 'walk', 'run' animation)
            // TODO: Attack logic for wolves/bears
        });
    }
    
    // Called when player attacks an animal
    damageAnimal(animalObject, damage, player) {
        animalObject.userData.health -= damage;
        console.log(`${animalObject.userData.type} health: ${animalObject.userData.health}`);
        if (animalObject.userData.health <= 0) {
            animalObject.userData.state = 'dead';
            // Drop loot
            if (animalObject.userData.loot) {
                animalObject.userData.loot.forEach(lootItem => {
                    player.inventory.addItem(lootItem);
                });
                 player.uiManager.showTemporaryMessage(`Killed ${animalObject.userData.type}, collected loot.`);
            }

            // Remove from scene after a delay or replace with a "dead" model
            setTimeout(() => {
                this.scene.remove(animalObject);
                const index = this.animals.indexOf(animalObject);
                if (index > -1) this.animals.splice(index, 1);
                // remove from collidables too
            }, 1000);
            return true; // Is dead
        }
        // Make animal aggro if attacked (if not already)
        if (animalObject.userData.aggro === undefined || animalObject.userData.aggro === false) {
            animalObject.userData.aggro = true;
            animalObject.userData.chaseDist = 30; // Generic chase distance
            animalObject.userData.state = 'chasing';
        }
        return false; // Still alive
    }
}