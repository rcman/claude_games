// crafting.js - Handles all crafting recipes and crafting mechanics

class CraftingSystem {
    constructor(game) {
        this.game = game;
        this.recipes = this.setupRecipes();
        this.craftingTableRecipes = this.setupCraftingTableRecipes();
        this.forgeRecipes = this.setupForgeRecipes();
    }

    setupRecipes() {
        // Basic crafting recipes (available without any crafting station)
        return [
            {
                id: 'wooden_axe',
                name: 'Wooden Axe',
                icon: 'assets/items/wooden_axe.png',
                ingredients: [
                    { item: 'wood', count: 3 },
                    { item: 'stone', count: 2 }
                ],
                result: { item: 'wooden_axe', count: 1 },
                category: 'tools'
            },
            {
                id: 'wooden_pickaxe',
                name: 'Wooden Pickaxe',
                icon: 'assets/items/wooden_pickaxe.png',
                ingredients: [
                    { item: 'wood', count: 3 },
                    { item: 'stone', count: 3 }
                ],
                result: { item: 'wooden_pickaxe', count: 1 },
                category: 'tools'
            },
            {
                id: 'campfire',
                name: 'Campfire',
                icon: 'assets/structures/campfire.png',
                ingredients: [
                    { item: 'wood', count: 5 },
                    { item: 'stone', count: 3 }
                ],
                result: { item: 'campfire', count: 1 },
                category: 'structures'
            },
            {
                id: 'crafting_table',
                name: 'Crafting Table',
                icon: 'assets/structures/crafting_table.png',
                ingredients: [
                    { item: 'wood', count: 8 }
                ],
                result: { item: 'crafting_table', count: 1 },
                category: 'structures'
            },
            {
                id: 'torch',
                name: 'Torch',
                icon: 'assets/items/torch.png',
                ingredients: [
                    { item: 'wood', count: 1 },
                    { item: 'fiber', count: 2 }
                ],
                result: { item: 'torch', count: 4 },
                category: 'tools'
            },
            {
                id: 'rope',
                name: 'Rope',
                icon: 'assets/items/rope.png',
                ingredients: [
                    { item: 'fiber', count: 5 }
                ],
                result: { item: 'rope', count: 1 },
                category: 'materials'
            },
            {
                id: 'wooden_wall',
                name: 'Wooden Wall',
                icon: 'assets/structures/wooden_wall.png',
                ingredients: [
                    { item: 'wood', count: 6 }
                ],
                result: { item: 'wooden_wall', count: 1 },
                category: 'building'
            },
            {
                id: 'wooden_floor',
                name: 'Wooden Floor',
                icon: 'assets/structures/wooden_floor.png',
                ingredients: [
                    { item: 'wood', count: 4 }
                ],
                result: { item: 'wooden_floor', count: 1 },
                category: 'building'
            },
            {
                id: 'wooden_door',
                name: 'Wooden Door',
                icon: 'assets/structures/wooden_door.png',
                ingredients: [
                    { item: 'wood', count: 6 },
                    { item: 'rope', count: 1 }
                ],
                result: { item: 'wooden_door', count: 1 },
                category: 'building'
            }
        ];
    }

    setupCraftingTableRecipes() {
        // Advanced crafting recipes (requires crafting table)
        return [
            {
                id: 'stone_axe',
                name: 'Stone Axe',
                icon: 'assets/items/stone_axe.png',
                ingredients: [
                    { item: 'wood', count: 2 },
                    { item: 'stone', count: 5 },
                    { item: 'rope', count: 1 }
                ],
                result: { item: 'stone_axe', count: 1 },
                category: 'tools'
            },
            {
                id: 'stone_pickaxe',
                name: 'Stone Pickaxe',
                icon: 'assets/items/stone_pickaxe.png',
                ingredients: [
                    { item: 'wood', count: 2 },
                    { item: 'stone', count: 6 },
                    { item: 'rope', count: 1 }
                ],
                result: { item: 'stone_pickaxe', count: 1 },
                category: 'tools'
            },
            {
                id: 'bow',
                name: 'Bow',
                icon: 'assets/items/bow.png',
                ingredients: [
                    { item: 'wood', count: 5 },
                    { item: 'rope', count: 2 }
                ],
                result: { item: 'bow', count: 1 },
                category: 'weapons'
            },
            {
                id: 'arrow',
                name: 'Arrow',
                icon: 'assets/items/arrow.png',
                ingredients: [
                    { item: 'wood', count: 1 },
                    { item: 'stone', count: 1 },
                    { item: 'feather', count: 1 }
                ],
                result: { item: 'arrow', count: 5 },
                category: 'weapons'
            },
            {
                id: 'leather_armor',
                name: 'Leather Armor',
                icon: 'assets/items/leather_armor.png',
                ingredients: [
                    { item: 'leather', count: 10 },
                    { item: 'rope', count: 2 }
                ],
                result: { item: 'leather_armor', count: 1 },
                category: 'armor'
            },
            {
                id: 'forge',
                name: 'Forge',
                icon: 'assets/structures/forge.png',
                ingredients: [
                    { item: 'stone', count: 15 },
                    { item: 'iron_ore', count: 3 }
                ],
                result: { item: 'forge', count: 1 },
                category: 'structures'
            },
            {
                id: 'storage_box',
                name: 'Storage Box',
                icon: 'assets/structures/storage_box.png',
                ingredients: [
                    { item: 'wood', count: 12 },
                    { item: 'rope', count: 2 }
                ],
                result: { item: 'storage_box', count: 1 },
                category: 'structures'
            }
        ];
    }

    setupForgeRecipes() {
        // Forge recipes (requires forge)
        return [
            {
                id: 'iron_ingot',
                name: 'Iron Ingot',
                icon: 'assets/items/iron_ingot.png',
                ingredients: [
                    { item: 'iron_ore', count: 2 },
                    { item: 'wood', count: 1 }  // Fuel
                ],
                result: { item: 'iron_ingot', count: 1 },
                category: 'materials',
                time: 15  // Seconds to craft
            },
            {
                id: 'iron_axe',
                name: 'Iron Axe',
                icon: 'assets/items/iron_axe.png',
                ingredients: [
                    { item: 'iron_ingot', count: 3 },
                    { item: 'wood', count: 2 },
                    { item: 'wood', count: 2 }  // Fuel
                ],
                result: { item: 'iron_axe', count: 1 },
                category: 'tools',
                time: 20
            },
            {
                id: 'iron_pickaxe',
                name: 'Iron Pickaxe',
                icon: 'assets/items/iron_pickaxe.png',
                ingredients: [
                    { item: 'iron_ingot', count: 3 },
                    { item: 'wood', count: 2 },
                    { item: 'wood', count: 2 }  // Fuel
                ],
                result: { item: 'iron_pickaxe', count: 1 },
                category: 'tools',
                time: 20
            },
            {
                id: 'iron_sword',
                name: 'Iron Sword',
                icon: 'assets/items/iron_sword.png',
                ingredients: [
                    { item: 'iron_ingot', count: 4 },
                    { item: 'wood', count: 1 },
                    { item: 'wood', count: 3 }  // Fuel
                ],
                result: { item: 'iron_sword', count: 1 },
                category: 'weapons',
                time: 25
            },
            {
                id: 'iron_armor',
                name: 'Iron Armor',
                icon: 'assets/items/iron_armor.png',
                ingredients: [
                    { item: 'iron_ingot', count: 8 },
                    { item: 'leather', count: 4 },
                    { item: 'wood', count: 5 }  // Fuel
                ],
                result: { item: 'iron_armor', count: 1 },
                category: 'armor',
                time: 40
            }
        ];
    }

    canCraft(recipe, inventory) {
        for (const ingredient of recipe.ingredients) {
            const inventoryItem = inventory.find(item => item && item.id === ingredient.item);
            if (!inventoryItem || inventoryItem.count < ingredient.count) {
                return false;
            }
        }
        return true;
    }

    craft(recipeId, inventory, station = null) {
        let recipe = null;
        
        // Find the recipe based on the station
        if (!station) {
            recipe = this.recipes.find(r => r.id === recipeId);
        } else if (station === 'crafting_table') {
            recipe = this.craftingTableRecipes.find(r => r.id === recipeId);
        } else if (station === 'forge') {
            recipe = this.forgeRecipes.find(r => r.id === recipeId);
        }
        
        if (!recipe) {
            console.error('Recipe not found:', recipeId);
            return { success: false, message: 'Recipe not found' };
        }
        
        if (!this.canCraft(recipe, inventory)) {
            return { success: false, message: 'Missing ingredients' };
        }
        
        // If it's a forge recipe, return info for the progress-based crafting
        if (station === 'forge' && recipe.time) {
            return { 
                success: true, 
                recipe: recipe,
                type: 'progress',
                time: recipe.time
            };
        }
        
        // Otherwise, craft immediately
        // Remove ingredients from inventory
        for (const ingredient of recipe.ingredients) {
            this.game.inventory.removeItem(ingredient.item, ingredient.count);
        }
        
        // Add result to inventory
        this.game.inventory.addItem(recipe.result.item, recipe.result.count);
        
        return { 
            success: true, 
            message: `Crafted ${recipe.name}`,
            result: recipe.result
        };
    }
    
    // Start crafting process for time-based recipes (like forge)
    startCrafting(recipeId, slotIndex) {
        const recipe = this.forgeRecipes.find(r => r.id === recipeId);
        if (!recipe) return { success: false, message: 'Recipe not found' };
        
        // Check if player has ingredients
        if (!this.canCraft(recipe, this.game.inventory.items)) {
            return { success: false, message: 'Missing ingredients' };
        }
        
        // Remove ingredients from inventory
        for (const ingredient of recipe.ingredients) {
            this.game.inventory.removeItem(ingredient.item, ingredient.count);
        }
        
        // Set up the crafting progress
        const craftingProcess = {
            recipe: recipe,
            progress: 0,
            totalTime: recipe.time,
            slotIndex: slotIndex
        };
        
        // Return the crafting process object
        return {
            success: true,
            craftingProcess: craftingProcess
        };
    }
    
    // Update crafting progress
    updateCraftingProgress(craftingProcess, deltaTime) {
        craftingProcess.progress += deltaTime;
        
        // Calculate progress percentage
        const progressPercent = Math.min(craftingProcess.progress / craftingProcess.totalTime, 1);
        
        // Check if crafting is complete
        if (progressPercent >= 1) {
            // Add result to inventory
            this.game.inventory.addItem(
                craftingProcess.recipe.result.item, 
                craftingProcess.recipe.result.count
            );
            
            return {
                completed: true,
                result: craftingProcess.recipe.result,
                message: `Crafted ${craftingProcess.recipe.name}`
            };
        }
        
        return {
            completed: false,
            progressPercent: progressPercent
        };
    }
}