// Crafting system
// Use IIFE to avoid polluting global scope and prevent duplicate declarations
(function() {
    // Only define if not already defined
    if (typeof window.gameRecipes !== 'undefined') {
        return; // Script already loaded, exit early
    }

    const recipes = [
        {
            name: 'Wooden Axe',
            requirements: { wood: 5, stone: 2 },
            result: { type: 'tool', name: 'Wooden Axe', damage: 10, durability: 100 }
        },
        {
            name: 'Wooden Club',
            requirements: { wood: 3 },
            result: { type: 'weapon', name: 'Wooden Club', damage: 5, durability: 50 }
        },
        {
            name: 'Stone Hammer',
            requirements: { wood: 3, stone: 5 },
            result: { type: 'tool', name: 'Stone Hammer', damage: 8, durability: 150 }
        },
        {
            name: 'Stone Pickaxe',
            requirements: { wood: 4, stone: 6 },
            result: { type: 'tool', name: 'Stone Pickaxe', damage: 12, durability: 120 }
        },
        {
            name: 'Flint Knife',
            requirements: { wood: 2, flint: 2 },
            result: { type: 'weapon', name: 'Flint Knife', damage: 15, durability: 80 }
        },
        {
            name: 'Campfire',
            requirements: { wood: 10, stone: 5 },
            result: { type: 'placeable', name: 'Campfire', function: 'cooking' }
        },
        {
            name: 'Workbench',
            requirements: { wood: 20 },
            result: { type: 'placeable', name: 'Workbench', function: 'crafting' }
        },
        {
            name: 'Chest',
            requirements: { wood: 15 },
            result: { type: 'placeable', name: 'Chest', function: 'storage' }
        },
        {
            name: 'Bronze Axe',
            requirements: { core_wood: 5, bronze: 3 },
            result: { type: 'tool', name: 'Bronze Axe', damage: 25, durability: 200 }
        },
        {
            name: 'Bronze Sword',
            requirements: { core_wood: 2, bronze: 5 },
            result: { type: 'weapon', name: 'Bronze Sword', damage: 30, durability: 180 }
        },
        {
            name: 'Bronze',
            requirements: { copper: 2, tin: 1 },
            result: { type: 'material', name: 'Bronze', count: 3 }
        }
    ];

    // Expose recipes to global scope through window object
    window.gameRecipes = recipes;

    window.populateCraftingMenu = function() {
        const recipeList = document.getElementById('recipe-list');
        recipeList.innerHTML = '';
        
        recipes.forEach(recipe => {
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe';
            
            // Create recipe HTML
            recipeElement.innerHTML = `
                <h3>${recipe.name}</h3>
                <div class="requirements">
                    ${Object.entries(recipe.requirements)
                        .map(([item, count]) => `${item}: ${count}`)
                        .join(', ')}
                </div>
                <button class="craft-button">Craft</button>
            `;
            
            // Add craft button event
            const craftButton = recipeElement.querySelector('.craft-button');
            craftButton.addEventListener('click', () => {
                craftItem(recipe);
            });
            
            recipeList.appendChild(recipeElement);
        });
    }

    window.craftItem = function(recipe) {
        // Check if player has required materials
        const canCraft = Object.entries(recipe.requirements).every(([item, count]) => {
            const playerHas = gameState.player.inventory.filter(i => i.type === item)
                .reduce((total, i) => total + i.count, 0);
            return playerHas >= count;
        });
        
        if (canCraft) {
            // Remove materials from inventory
            Object.entries(recipe.requirements).forEach(([item, count]) => {
                let remainingToRemove = count;
                
                for (let i = 0; i < gameState.player.inventory.length; i++) {
                    const inventoryItem = gameState.player.inventory[i];
                    
                    if (inventoryItem.type === item) {
                        const amountToRemove = Math.min(remainingToRemove, inventoryItem.count);
                        inventoryItem.count -= amountToRemove;
                        remainingToRemove -= amountToRemove;
                        
                        // Remove item if count is 0
                        if (inventoryItem.count <= 0) {
                            gameState.player.inventory.splice(i, 1);
                            i--;
                        }
                        
                        if (remainingToRemove <= 0) break;
                    }
                }
            });
            
            // Add crafted item to inventory
            const craftedItem = {
                ...recipe.result,
                count: recipe.result.count || 1
            };
            
            // Check if it's a stackable item that already exists
            if (craftedItem.type === 'material') {
                const existingItemIndex = gameState.player.inventory.findIndex(item => 
                    item.type === craftedItem.type && item.name === craftedItem.name
                );
                
                if (existingItemIndex !== -1) {
                    // Add to existing stack
                    gameState.player.inventory[existingItemIndex].count += craftedItem.count;
                } else {
                    // Add as new item
                    gameState.player.inventory.push(craftedItem);
                }
            } else {
                // Non-stackable items always go in as new items
                gameState.player.inventory.push(craftedItem);
            }
            
            // Update UI
            updateInventoryDisplay();
            showGameMessage(`Crafted: ${recipe.name}`);
        } else {
            showGameMessage("Not enough materials!");
        }
    }

    // Cooking function - for campfire use
    window.cookFood = function(foodType) {
        // Define cooking recipes
        const cookingRecipes = {
            'raw_meat': {
                result: { type: 'food', name: 'Cooked Meat', health: 20, stamina: 15, count: 1 },
                cookTime: 5 // seconds
            },
            'raw_fish': {
                result: { type: 'food', name: 'Cooked Fish', health: 15, stamina: 25, count: 1 },
                cookTime: 4 // seconds
            }
        };
        
        if (cookingRecipes[foodType]) {
            const recipe = cookingRecipes[foodType];
            
            // Remove raw food from inventory
            const rawFoodIndex = gameState.player.inventory.findIndex(item => item.type === foodType);
            
            if (rawFoodIndex !== -1) {
                gameState.player.inventory[rawFoodIndex].count--;
                
                // Remove item if count is 0
                if (gameState.player.inventory[rawFoodIndex].count <= 0) {
                    gameState.player.inventory.splice(rawFoodIndex, 1);
                }
                
                // Show cooking progress
                showGameMessage(`Cooking ${foodType.replace('raw_', '')}...`);
                
                // Add cooked food after cook time
                setTimeout(() => {
                    const cookedFood = { ...recipe.result };
                    
                    // Check if player already has this food
                    const existingFoodIndex = gameState.player.inventory.findIndex(item => 
                        item.type === 'food' && item.name === cookedFood.name
                    );
                    
                    if (existingFoodIndex !== -1) {
                        // Add to existing stack
                        gameState.player.inventory[existingFoodIndex].count += cookedFood.count;
                    } else {
                        // Add as new item
                        gameState.player.inventory.push(cookedFood);
                    }
                    
                    // Update UI
                    updateInventoryDisplay();
                    showGameMessage(`Cooked: ${cookedFood.name}`);
                }, recipe.cookTime * 1000);
                
                return true;
            } else {
                showGameMessage("No raw food to cook!");
                return false;
            }
        } else {
            showGameMessage("Can't cook that!");
            return false;
        }
    }

    // Food consumption
    window.eatFood = function(inventoryIndex) {
        const food = gameState.player.inventory[inventoryIndex];
        
        if (food && food.type === 'food') {
            // Apply food buffs
            if (food.health) {
                gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + food.health);
            }
            
            if (food.stamina) {
                gameState.player.stamina = Math.min(gameState.player.maxStamina, gameState.player.stamina + food.stamina);
            }
            
            // Restore hunger
            gameState.player.hunger = Math.min(100, gameState.player.hunger + 20);
            
            // Remove one from stack
            food.count--;
            
            // Remove item if count is 0
            if (food.count <= 0) {
                gameState.player.inventory.splice(inventoryIndex, 1);
                
                // If this was the equipped item, unequip
                if (gameState.player.equipped === inventoryIndex) {
                    gameState.player.equipped = null;
                }
            }
            
            // Update UI
            updateInventoryDisplay();
            updatePlayerUI();
            
            showGameMessage(`Consumed: ${food.name}`);
            return true;
        }
        
        return false;
    }

    // List of available foods with stats
    const foods = [
        { name: 'Berries', health: 10, stamina: 15 },
        { name: 'Mushroom', health: 8, stamina: 20 },
        { name: 'Cooked Meat', health: 20, stamina: 15 },
        { name: 'Cooked Fish', health: 15, stamina: 25 },
        { name: 'Carrot', health: 12, stamina: 18 },
        { name: 'Turnip', health: 15, stamina: 10 },
        { name: 'Bread', health: 25, stamina: 30 }
    ];

    // Expose foods to global scope if needed
    window.gameFoods = foods;

    // Update food buffs
    window.updateFoodBuffs = function(deltaTime) {
        // Decrease hunger over time
        gameState.player.hunger = Math.max(0, gameState.player.hunger - (2 * deltaTime)); // 2% per second
        
        // Effects of hunger
        if (gameState.player.hunger < 30) {
            // Slow stamina regeneration
            gameState.player.staminaRegenRate = 0.5; // 50% normal rate
            
            if (gameState.player.hunger < 10) {
                // Start losing health when very hungry
                gameState.player.health = Math.max(1, gameState.player.health - (1 * deltaTime)); // 1 health per second
            }
        } else {
            // Normal stamina regeneration
            gameState.player.staminaRegenRate = 1.0;
        }
        
        // Update UI
        updatePlayerUI();
    }
})();