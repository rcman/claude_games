// Player mechanics
function updatePlayer(deltaTime) {
    // Movement speed
    const speed = 5.0 * deltaTime;
    const direction = new THREE.Vector3();
    
    // Calculate movement vector
    if (keyboard['KeyW']) direction.z -= 1;
    if (keyboard['KeyS']) direction.z += 1;
    if (keyboard['KeyA']) direction.x -= 1;
    if (keyboard['KeyD']) direction.x += 1;
    
    // Normalize direction vector
    if (direction.length() > 0) {
        direction.normalize();
        
        // Apply movement in the camera's local space
        direction.applyQuaternion(camera.quaternion);
        direction.y = 0; // Keep movement horizontal
        
        // Move controls
        controls.moveRight(direction.x * speed);
        controls.moveForward(-direction.z * speed);
        
        // Decrease stamina when moving
        gameState.player.stamina = Math.max(0, gameState.player.stamina - 1 * deltaTime);
    } else {
        // Regen stamina when not moving
        gameState.player.stamina = Math.min(
            gameState.player.maxStamina, 
            gameState.player.stamina + 5 * deltaTime
        );
    }
    
    // Gravity and collision
    // Simple gravity for now
    const playerHeight = 1.7;
    const groundY = getTerrainHeight(camera.position.x, camera.position.z);
    
    if (camera.position.y < groundY + playerHeight) {
        camera.position.y = groundY + playerHeight;
    }
    
    // Update player position in game state
    gameState.player.position.copy(camera.position);
    gameState.player.position.y -= playerHeight;
    
    // Update UI
    updatePlayerUI();
}

// Food system and player survival
const foods = [
    { name: 'Meat', health: 20, stamina: 10, duration: 600 },
    { name: 'Berries', health: 10, stamina: 15, duration: 300 },
    { name: 'Mushroom', health: 15, stamina: 5, duration: 400 },
    { name: 'Cooked Meat', health: 30, stamina: 20, duration: 800 },
    { name: 'Fish', health: 25, stamina: 15, duration: 500 }
];

// Player's active food buffs
const activeFoods = [];

function eatFood(foodIndex) {
    const food = gameState.player.inventory[foodIndex];
    
    // Check if the item is food
    const foodType = foods.find(f => f.name === food.name);
    if (!foodType) {
        console.log("This item is not edible");
        return;
    }
    
    // Add to active foods
    activeFoods.push({
        ...foodType,
        timeRemaining: foodType.duration
    });
    
    // Immediately apply the food buff
    gameState.player.maxHealth += foodType.health;
    gameState.player.health = Math.min(gameState.player.health + foodType.health, gameState.player.maxHealth);
    gameState.player.maxStamina += foodType.stamina;
    gameState.player.stamina = Math.min(gameState.player.stamina + foodType.stamina, gameState.player.maxStamina);
    
    // Remove one food item from inventory
    food.count--;
    if (food.count <= 0) {
        gameState.player.inventory.splice(foodIndex, 1);
    }
    
    // Update UI
    updateInventoryDisplay();
    updatePlayerUI();
    
    showGameMessage(`Ate ${foodType.name}`);
    console.log(`Ate ${foodType.name}`);
}

function updateFoodBuffs(deltaTime) {
    // Update all active food buffs
    for (let i = 0; i < activeFoods.length; i++) {
        const food = activeFoods[i];
        food.timeRemaining -= deltaTime;
        
        // Remove expired food buffs
        if (food.timeRemaining <= 0) {
            gameState.player.maxHealth -= food.health;
            gameState.player.health = Math.min(gameState.player.health, gameState.player.maxHealth);
            gameState.player.maxStamina -= food.stamina;
            gameState.player.stamina = Math.min(gameState.player.stamina, gameState.player.maxStamina);
            
            activeFoods.splice(i, 1);
            i--;
            
            // Update UI
            updatePlayerUI();
        }
    }
    
    // Hunger over time
    gameState.player.hunger -= 0.1 * deltaTime;
    if (gameState.player.hunger < 0) gameState.player.hunger = 0;
    
    // Health regeneration based on food/hunger
    if (gameState.player.hunger > 70) {
        gameState.player.health += 1 * deltaTime;
        gameState.player.health = Math.min(gameState.player.health, gameState.player.maxHealth);
    } else if (gameState.player.hunger < 20) {
        // Lose health when starving
        gameState.player.health -= 1 * deltaTime;
        
        // Check for death
        if (gameState.player.health <= 0 && !playerIsDead) {
            playerDeath();
        }
    }
}

// Player progression and skills
function updateSkills() {
    // Skill effects on player stats
    const woodcuttingBonus = Math.floor(gameState.player.skills.woodcutting);
    const miningBonus = Math.floor(gameState.player.skills.mining);
    const buildingBonus = Math.floor(gameState.player.skills.building);
    const combatBonus = Math.floor(gameState.player.skills.combat);
    
    // Apply skill bonuses
    // Woodcutting improves wood gathering efficiency
    // Mining improves stone gathering efficiency
    // Building improves building durability
    // Combat improves damage and reduces stamina consumption
    
    // Display skill levels in UI
    const skillsText = `Woodcutting: ${gameState.player.skills.woodcutting.toFixed(1)}\n` +
                      `Mining: ${gameState.player.skills.mining.toFixed(1)}\n` +
                      `Building: ${gameState.player.skills.building.toFixed(1)}\n` +
                      `Combat: ${gameState.player.skills.combat.toFixed(1)}`;
    
    // Add skill bonus information to tooltips
}