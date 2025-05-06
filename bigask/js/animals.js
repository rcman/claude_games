// animals.js - Handles AI-controlled animals and creatures

class AnimalSystem {
    constructor(game) {
        this.game = game;
        this.animals = [];
        this.animalTypes = this.setupAnimalTypes();
        this.maxAnimals = 20; // Maximum number of animals in the world
        this.spawnRadius = 50; // Max distance from player to spawn animals
        this.despawnRadius = 80; // Distance at which animals despawn
        this.spawnInterval = 10; // Seconds between spawn attempts
        this.timeSinceLastSpawn = 0;
    }
    
    setupAnimalTypes() {
        return {
            'deer': {
                name: 'Deer',
                model: 'assets/models/deer.glb',
                scale: 0.8,
                speed: 3,
                health: 30,
                drops: [
                    { item: 'raw_meat', count: { min: 2, max: 4 }, chance: 1.0 },
                    { item: 'leather', count: { min: 1, max: 2 }, chance: 0.8 }
                ],
                behavior: 'passive', // Will run away when attacked
                spawnChance: 0.4,
                minGroupSize: 1,
                maxGroupSize: 3,
                biomes: ['forest', 'plains']
            },
            'wolf': {
                name: 'Wolf',
                model: 'assets/models/wolf.glb',
                scale: 0.7,
                speed: 5,
                health: 40,
                damage: 10,
                attackRange: 1.5,
                attackSpeed: 1.5, // Attacks per second
                drops: [
                    { item: 'raw_meat', count: { min: 1, max: 3 }, chance: 1.0 },
                    { item: 'wolf_pelt', count: { min: 1, max: 1 }, chance: 0.7 },
                    { item: 'wolf_fang', count: { min: 0, max: 2 }, chance: 0.3 }
                ],
                behavior: 'aggressive', // Will attack player if within detection range
                detectionRange: 15,
                spawnChance: 0.2,
                minGroupSize: 2,
                maxGroupSize: 4,
                biomes: ['forest', 'mountains']
            },
            'rabbit': {
                name: 'Rabbit',
                model: 'assets/models/rabbit.glb',
                scale: 0.4,
                speed: 4,
                health: 10,
                drops: [
                    { item: 'raw_meat', count: { min: 1, max: 1 }, chance: 1.0 },
                    { item: 'rabbit_fur', count: { min: 1, max: 1 }, chance: 0.9 }
                ],
                behavior: 'skittish', // Runs away when player gets close
                fleeDistance: 8,
                spawnChance: 0.5,
                minGroupSize: 1,
                maxGroupSize: 3,
                biomes: ['plains', 'forest']
            },
            'bear': {
                name: 'Bear',
                model: 'assets/models/bear.glb',
                scale: 1.2,
                speed: 4,
                health: 100,
                damage: 20,
                attackRange: 2,
                attackSpeed: 1, // Attacks per second
                drops: [
                    { item: 'raw_meat', count: { min: 4, max: 8 }, chance: 1.0 },
                    { item: 'bear_pelt', count: { min: 1, max: 1 }, chance: 0.9 },
                    { item: 'bear_claw', count: { min: 1, max: 3 }, chance: 0.6 }
                ],
                behavior: 'territorial', // Only attacks if player gets too close
                territoryRange: 10,
                spawnChance: 0.05,
                minGroupSize: 1,
                maxGroupSize: 1,
                biomes: ['forest', 'mountains']
            },
            'fish': {
                name: 'Fish',
                model: 'assets/models/fish.glb',
                scale: 0.5,
                speed: 2,
                health: 5,
                drops: [
                    { item: 'raw_fish', count: { min: 1, max: 1 }, chance: 1.0 }
                ],
                behavior: 'water', // Swims in water
                spawnChance: 0.6,
                minGroupSize: 3,
                maxGroupSize: 8,
                biomes: ['water']
            },
            'boar': {
                name: 'Boar',
                model: 'assets/models/boar.glb',
                scale: 0.7,
                speed: 3.5,
                health: 50,
                damage: 15,
                attackRange: 1.5,
                attackSpeed: 1.2,
                drops: [
                    { item: 'raw_meat', count: { min: 2, max: 5 }, chance: 1.0 },
                    { item: 'leather', count: { min: 1, max: 2 }, chance: 0.7 }
                ],
                behavior: 'defensive', // Only attacks if attacked first
                spawnChance: 0.3,
                minGroupSize: 1,
                maxGroupSize: 2,
                biomes: ['forest', 'plains']
            }
        };
    }
    
    spawnAnimals() {
        // Don't spawn if we've reached the limit
        if (this.animals.length >= this.maxAnimals) return;
        
        // Get player position
        const playerPosition = this.game.player.position.clone();
        
        // Determine biome at player's position for biome-specific spawning
        const biome = this.game.world.getBiomeAt(playerPosition);
        
        // Filter animal types that can spawn in this biome
        const eligibleAnimalTypes = Object.entries(this.animalTypes).filter(([_, data]) => 
            data.biomes.includes(biome) || data.biomes.includes('any')
        );
        
        if (eligibleAnimalTypes.length === 0) return;
        
        // Choose a random animal type based on spawn chance
        const animalType = this.chooseRandomAnimalType(eligibleAnimalTypes);
        if (!animalType) return;
        
        const animalData = this.animalTypes[animalType];
        
        // Determine group size
        const groupSize = Math.floor(
            Math.random() * (animalData.maxGroupSize - animalData.minGroupSize + 1) + 
            animalData.minGroupSize
        );
        
        // Find a valid spawn position
        const spawnPosition = this.findSpawnPosition(playerPosition, animalData);
        if (!spawnPosition) return;
        
        // Spawn the group of animals
        for (let i = 0; i < groupSize; i++) {
            // Add some randomness to position within group
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 5, 
                0, 
                (Math.random() - 0.5) * 5
            );
            const position = spawnPosition.clone().add(offset);
            
            // Make sure the position is on the ground
            const groundHeight = this.game.world.getHeightAt(position.x, position.z);
            position.y = groundHeight;
            
            // Special case for fish to be in water
            if (animalType === 'fish') {
                if (position.y > this.game.world.waterLevel - 1) {
                    // Skip if not deep enough water
                    continue;
                }
                position.y = this.game.world.waterLevel - 1 - Math.random();
            } else if (position.y < this.game.world.waterLevel) {
                // Skip land animals in water
                continue;
            }
            
            this.createAnimal(animalType, position);
        }
    }
    
    chooseRandomAnimalType(eligibleAnimalTypes) {
        // Calculate total spawn chance
        const totalChance = eligibleAnimalTypes.reduce((sum, [_, data]) => sum + data.spawnChance, 0);
        
        // Random value between 0 and total chance
        let random = Math.random() * totalChance;
        
        // Select a type based on spawn chance
        for (const [type, data] of eligibleAnimalTypes) {
            random -= data.spawnChance;
            if (random <= 0) {
                return type;
            }
        }
        
        // Fallback
        return eligibleAnimalTypes[0][0];
    }
    
    findSpawnPosition(playerPosition, animalData) {
        // Determine min and max spawn distance based on animal type
        let minDistance = 20; // Don't spawn too close to player
        
        // Aggressive animals might spawn closer
        if (animalData.behavior === 'aggressive') {
            minDistance = 15;
        }