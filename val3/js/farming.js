// Farming system
const crops = {
    carrot: {
        name: 'Carrot',
        growthTime: 300, // seconds
        stages: 4,
        harvestYield: { type: 'carrot', count: 3 },
        seedCost: { type: 'carrot_seeds', count: 1 }
    },
    turnip: {
        name: 'Turnip',
        growthTime: 400,
        stages: 4,
        harvestYield: { type: 'turnip', count: 3 },
        seedCost: { type: 'turnip_seeds', count: 1 }
    },
    barley: {
        name: 'Barley',
        growthTime: 600,
        stages: 5,
        harvestYield: { type: 'barley', count: 2 },
        seedCost: { type: 'barley_seeds', count: 1 }
    }
};

class CropPlot {
    constructor(position, cropType) {
        this.object = new THREE.Group();
        this.object.position.copy(position);
        this.cropType = cropType;
        this.growthStage = 0;
        this.growthProgress = 0;
        this.isWatered = false;
        
        // Create crop plot visuals
        this.createVisuals();
        
        // Add to world
        scene.add(this.object);
        gameState.world.entities.push(this.object);
        
        // Set crop data
        this.object.userData = {
            type: 'crop',
            cropType: this.cropType,
            cropRef: this
        };
    }
    
    createVisuals() {
        // Plot soil
        const soilGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x3E2723 });
        const soil = new THREE.Mesh(soilGeometry, soilMaterial);
        soil.position.y = 0.05;
        this.object.add(soil);
        
        // Crop plant (will update as it grows)
        this.plantMesh = new THREE.Group();
        this.object.add(this.plantMesh);
        
        // Update plant visuals for stage 0
        this.updatePlantVisuals();
    }
    
    updatePlantVisuals() {
        // Remove old plant mesh
        while (this.plantMesh.children.length > 0) {
            this.plantMesh.remove(this.plantMesh.children[0]);
        }
        
        // Skip if not planted
        if (this.growthStage === 0) return;
        
        // Create new plant based on growth stage
        const cropData = crops[this.cropType];
        const stageHeight = (this.growthStage / cropData.stages) * 1;
        
        // Plant stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, stageHeight, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x33691E });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = stageHeight / 2 + 0.05;
        this.plantMesh.add(stem);
        
        // Plant leaves
        if (this.growthStage > 1) {
            for (let i = 0; i < this.growthStage; i++) {
                const leafGeometry = new THREE.PlaneGeometry(0.2, 0.1);
                const leafMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x558B2F,
                    side: THREE.DoubleSide
                });
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                
                // Position leaves along stem
                const height = (i + 1) / (this.growthStage + 1) * stageHeight;
                leaf.position.y = height + 0.05;
                
                // Rotate leaves in different directions
                leaf.rotation.y = i * Math.PI / 2;
                leaf.rotation.x = Math.PI / 4;
                
                this.plantMesh.add(leaf);
            }
        }
        
        // Crop specific visuals for final stage
        if (this.growthStage === cropData.stages) {
            let fruitMesh;
            
            switch (this.cropType) {
                case 'carrot':
                    // Carrot top
                    const topGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x8BC34A });
                    fruitMesh = new THREE.Mesh(topGeometry, topMaterial);
                    fruitMesh.position.y = stageHeight + 0.05;
                    break;
                case 'turnip':
                    // Turnip bulb
                    const bulbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                    const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
                    fruitMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);
                    fruitMesh.position.y = stageHeight + 0.05;
                    break;
                case 'barley':
                    // Barley head
                    const headGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.2, 8);
                    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFEB3B });
                    fruitMesh = new THREE.Mesh(headGeometry, headMaterial);
                    fruitMesh.position.y = stageHeight + 0.1;
                    break;
            }
            
            if (fruitMesh) {
                this.plantMesh.add(fruitMesh);
            }
        }
    }
    
    grow(deltaTime) {
        const cropData = crops[this.cropType];
        
        // Skip if fully grown
        if (this.growthStage >= cropData.stages) return;
        
        // Growth rate modified by watered status
        const growthRate = this.isWatered ? 1 : 0.5;
        
        // Update growth progress
        this.growthProgress += deltaTime * growthRate;
        
        // Check if reached next stage
        const timePerStage = cropData.growthTime / cropData.stages;
        if (this.growthProgress >= timePerStage) {
            this.growthProgress = 0;
            this.growthStage++;
            
            // Update visuals for new stage
            this.updatePlantVisuals();
            
            console.log(`Crop ${cropData.name} advanced to stage ${this.growthStage}/${cropData.stages}`);
            
            // Check if fully grown
            if (this.growthStage === cropData.stages) {
                console.log(`${cropData.name} is ready to harvest!`);
            }
        }
    }
    
    water() {
        if (!this.isWatered) {
            this.isWatered = true;
            
            // Update soil color
            this.object.children[0].material.color.setHex(0x5D4037);
            
            console.log(`Watered ${crops[this.cropType].name}`);
            
            // Watering effect lasts for 1 day
            setTimeout(() => {
                this.isWatered = false;
                this.object.children[0].material.color.setHex(0x3E2723);
            }, 60 * 1000); // 1 minute = 1 game day
        }
    }
    
    harvest() {
        const cropData = crops[this.cropType];
        
        // Only harvest if fully grown
        if (this.growthStage === cropData.stages) {
            // Add harvested items to inventory
            collectResource({
                type: cropData.harvestYield.type,
                name: cropData.name,
                count: cropData.harvestYield.count
            });
            
            // Random chance to get seeds
            if (Math.random() < 0.5) {
                collectResource({
                    type: cropData.seedCost.type,
                    name: `${cropData.name} Seeds`,
                    count: 1
                });
            }
            
            // Reset crop to unplanted state
            this.growthStage = 0;
            this.growthProgress = 0;
            
            // Update visuals
            this.updatePlantVisuals();
            
            console.log(`Harvested ${cropData.name}`);
            return true;
        } else {
            console.log(`${cropData.name} is not ready to harvest yet`);
            return false;
        }
    }
}

function createCropPlot(position, cropType) {
    return new CropPlot(position, cropType);
}

// Function to check crops for interaction
function checkCropInteraction() {
    // Get all crop entities
    const crops = gameState.world.entities.filter(
        entity => entity.userData && entity.userData.type === 'crop'
    );
    
    // Check player proximity
    for (const crop of crops) {
        const distance = camera.position.distanceTo(crop.position);
        
        // If player is close enough to interact with crop
        if (distance < 2) {
            const cropRef = crop.userData.cropRef;
            const cropData = window.crops[cropRef.cropType];
            
            // Show different prompts based on crop state
            if (cropRef.growthStage === 0) {
                // Unplanted - check for seeds
                const seedType = cropData.seedCost.type;
                const hasSeeds = gameState.player.inventory.some(
                    item => item.type === seedType && item.count >= cropData.seedCost.count
                );
                
                if (hasSeeds) {
                    showInteractionPrompt(`Press E to plant ${cropData.name}`);
                    
                    if (keyboard['KeyE']) {
                        // Find and use seeds
                        for (let i = 0; i < gameState.player.inventory.length; i++) {
                            const item = gameState.player.inventory[i];
                            if (item.type === seedType) {
                                item.count -= cropData.seedCost.count;
                                
                                if (item.count <= 0) {
                                    gameState.player.inventory.splice(i, 1);
                                }
                                
                                // Plant crop
                                cropRef.growthStage = 1;
                                cropRef.updatePlantVisuals();
                                
                                // Update inventory display
                                updateInventoryDisplay();
                                
                                console.log(`Planted ${cropData.name}`);
                                break;
                            }
                        }
                        
                        // Prevent multiple interactions
                        keyboard['KeyE'] = false;
                    }
                } else {
                    showInteractionPrompt(`Need ${cropData.seedCost.count} ${seedType} to plant`);
                }
            } else if (cropRef.growthStage === cropData.stages) {
                // Ready to harvest
                showInteractionPrompt(`Press E to harvest ${cropData.name}`);
                
                if (keyboard['KeyE']) {
                    cropRef.harvest();
                    
                    // Prevent multiple interactions
                    keyboard['KeyE'] = false;
                }
            } else {
                // Growing
                if (!cropRef.isWatered) {
                    showInteractionPrompt(`Press E to water ${cropData.name}`);
                    
                    if (keyboard['KeyE']) {
                        cropRef.water();
                        
                        // Prevent multiple interactions
                        keyboard['KeyE'] = false;
                    }
                } else {
                    showInteractionPrompt(`${cropData.name} is growing (${cropRef.growthStage}/${cropData.stages})`);
                }
            }
            
            return; // Only interact with closest crop
        }
    }
}