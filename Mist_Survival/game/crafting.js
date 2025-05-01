// game/crafting.js
// Handles crafting logic, recipe definitions, and crafting checks.

import * as Player from './player.js'; // To access inventory
import * as UIManager from './ui.js';

// --- State ---
let recipes = []; // Loaded recipes

// --- Recipe Data (Example Structure) ---
const defaultRecipes = [
    {
        id: 'bandage',
        name: 'Bandage',
        description: 'Stops bleeding and heals minor wounds.',
        requires: [{ item: 'cloth', count: 2 }],
        output: { item: 'bandage', count: 1 },
        station: null, // Craftable in inventory
        craftTime: 2, // Seconds
    },
    {
        id: 'stone_axe',
        name: 'Stone Axe',
        description: 'A basic axe for chopping wood.',
        requires: [{ item: 'wood', count: 3 }, { item: 'stone', count: 2 }, { item: 'plant_fiber', count: 5 }],
        output: { item: 'stone_axe', count: 1 },
        station: null, // Craftable in inventory (or maybe workbench?)
        craftTime: 5,
    },
     {
        id: 'torch',
        name: 'Torch',
        description: 'Provides light.',
        requires: [{ item: 'wood', count: 1 }, { item: 'cloth', count: 1 }], // Could require fuel?
        output: { item: 'torch', count: 1 },
        station: null,
        craftTime: 3,
    },
    {
        id: 'planks',
        name: 'Wooden Planks',
        description: 'Processed wood for building.',
        requires: [{ item: 'log', count: 1 }],
        output: { item: 'planks', count: 4 },
        station: 'sawmill', // Requires a specific station
        craftTime: 4,
    },
     {
        id: 'cooked_meat',
        name: 'Cooked Meat',
        description: 'Safer and more nutritious.',
        requires: [{ item: 'raw_meat', count: 1 }, { item: 'wood', count: 1 }], // Wood as fuel
        output: { item: 'cooked_meat', count: 1 },
        station: 'campfire', // Requires campfire or stove
        craftTime: 10,
    },
    // ... Add many more recipes (weapons, ammo, building parts, food, etc.)
];

let currentCraft = null; // { recipeId, startTime, duration }
let isCraftingPaused = false; // TODO: Pause crafting if player moves/is attacked?

// --- Initialization ---
export function init(loadData = null) {
    console.log("Initializing Crafting System...");
    // TODO: Load recipes from external data file (JSON?) instead of hardcoding
    recipes = [...defaultRecipes];

    if (loadData && loadData.crafting) {
        // Load ongoing craft progress if saved
        currentCraft = loadData.crafting.currentCraft ?? null;
        if (currentCraft) {
            // Adjust startTime based on time passed since saving? Complex.
            // For simplicity, might just cancel craft on load or restart timer.
             console.log("Loaded crafting state (craft progress might be reset).");
             currentCraft = null; // Resetting for now
        }
    }
}

// --- Update Loop ---
export function update(dt) {
    if (currentCraft && !isCraftingPaused) {
        // Check if crafting time is complete
        if (performance.now() >= currentCraft.startTime + currentCraft.duration * 1000) {
            finishCraft(currentCraft.recipeId);
            currentCraft = null;
            UIManager.updateCraftingProgress(0); // Clear progress bar
        } else {
             // Update progress UI
             const elapsed = performance.now() - currentCraft.startTime;
             const progress = elapsed / (currentCraft.duration * 1000);
             UIManager.updateCraftingProgress(progress);
        }
    }
}

// --- Crafting Logic ---

/**
 * Gets a list of recipes the player can potentially craft based on known recipes and available stations.
 * @param {string | null} currentStationId ID of the crafting station the player is interacting with (null for inventory crafting).
 * @returns {Array} List of available recipe objects.
 */
export function getAvailableRecipes(currentStationId = null) {
    return recipes.filter(recipe => recipe.station === currentStationId);
}

/**
 * Checks if the player has the required materials for a specific recipe.
 * @param {string} recipeId The ID of the recipe to check.
 * @returns {boolean} True if the player has the required materials, false otherwise.
 */
export function canCraft(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return false;

    for (const req of recipe.requires) {
        if (!Player.hasItem(req.item, req.count)) {
            return false; // Missing required item
        }
    }
    return true; // All requirements met
}

/**
 * Attempts to start crafting an item.
 * @param {string} recipeId The ID of the recipe to craft.
 * @returns {boolean} True if crafting started successfully, false otherwise.
 */
export function startCraft(recipeId) {
    if (currentCraft) {
        UIManager.addLogMessage("Already crafting something else.");
        return false;
    }

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
         UIManager.addLogMessage("Unknown recipe.");
         return false;
    }

    if (!canCraft(recipeId)) {
        UIManager.addLogMessage("Missing required materials.");
         // TODO: Highlight missing materials in UI
        return false;
    }

    // Consume materials
    let consumedOk = true;
    for (const req of recipe.requires) {
        if (!Player.removeItem(req.item, req.count)) {
             console.error(`Crafting Error: Failed to remove item ${req.item} even though canCraft passed.`);
             consumedOk = false;
             // TODO: Rollback any previously consumed items for this craft? Complex.
             break;
        }
    }

    if (!consumedOk) {
        UIManager.addLogMessage("Error consuming materials. Craft cancelled.");
         // Need to potentially refund items here if some were consumed.
        return false;
    }

    // Start crafting timer
    currentCraft = {
        recipeId: recipeId,
        startTime: performance.now(),
        duration: recipe.craftTime || 1, // Default 1 second if time not specified
    };
    isCraftingPaused = false; // Ensure not paused
    UIManager.addLogMessage(`Started crafting ${recipe.name}...`);
    // TODO: Play crafting start sound

    return true;
}

/**
 * Called when the crafting timer completes. Adds the item to the player's inventory.
 * @param {string} recipeId The ID of the completed recipe.
 */
function finishCraft(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return; // Should not happen if startCraft worked

    // Add output item(s) to player inventory
    Player.addItem(recipe.output);
    UIManager.addLogMessage(`Finished crafting ${recipe.output.quantity}x ${recipe.name}!`);
    // TODO: Play crafting complete sound
}

export function cancelCraft() {
    if (currentCraft) {
         UIManager.addLogMessage("Crafting cancelled.");
         // TODO: Refund consumed materials? (Depends on game design - maybe partial refund?)
         currentCraft = null;
         UIManager.updateCraftingProgress(0);
    }
}

export function isPlayerCrafting() {
    return !!currentCraft;
}

// --- Persistence ---
export function getState() {
    return {
        // Recipes usually don't need saving unless player learns them dynamically
        currentCraft: currentCraft ? { ...currentCraft } : null,
        // Note: startTime needs adjustment on load based on saved gameTime
    };
}