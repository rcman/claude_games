// player/inventory.js - Inventory management
import { gameState } from '../main.js';
import { controls } from '../core/setup.js';
import { showGameMessage, getItemIcon } from '../utils/helpers.js';
import { selectTool } from '../building/building.js';

export function generateInventorySlots() {
    const inventoryGrid = document.querySelector('#inventory .inventory-grid');
    if (!inventoryGrid) return;

    inventoryGrid.innerHTML = ''; // Clear existing slots
    const inventorySize = gameState.player.inventory.length;

    for (let i = 0; i < inventorySize; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.setAttribute('data-slot-index', i);

        const item = gameState.player.inventory[i];
        if (item) {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `<span class="item-icon">${getItemIcon(item)}</span> <span class="item-name">${item}</span>`;
            slot.appendChild(itemElement);
        }
        inventoryGrid.appendChild(slot);
    }
}

export function addItemToInventory(itemName, quantity = 1) {
    // Basic: Find first empty slot
    // TODO: Implement stacking
    const emptySlotIndex = gameState.player.inventory.findIndex(slot => slot === null);

    if (emptySlotIndex !== -1) {
        gameState.player.inventory[emptySlotIndex] = itemName;
        console.log(`Added ${itemName} to inventory slot ${emptySlotIndex}`);
        // Update UI if inventory is open
        if (document.getElementById('inventory')?.style.display === 'block') {
            generateInventorySlots();
        }
        showGameMessage(`+1 ${itemName}`);
        return true;
    } else {
        console.log('Inventory full!');
        showGameMessage('Inventory full!', 'error');
        // Drop item on ground?
        return false;
    }
}

export function removeItemFromInventory(itemName, quantity = 1) {
    // Basic: Find first slot with the item
    const itemSlotIndex = gameState.player.inventory.findIndex(slot => slot === itemName);

    if (itemSlotIndex !== -1) {
        gameState.player.inventory[itemSlotIndex] = null;
        console.log(`Removed ${itemName} from inventory slot ${itemSlotIndex}`);
        // Update UI if inventory is open
        if (document.getElementById('inventory')?.style.display === 'block') {
            generateInventorySlots();
        }
        return true;
    } else {
        console.log(`Item ${itemName} not found in inventory!`);
        return false;
    }
}

export function hasItemInInventory(itemName, quantity = 1) {
    // Basic check if item exists
    let count = 0;
    for (const slotItem of gameState.player.inventory) {
        if (slotItem === itemName) {
            count++;
        }
    }
    return count >= quantity;
}

export function countItemInInventory(itemName) {
    // Basic count
    let count = 0;
    for (const slotItem of gameState.player.inventory) {
        if (slotItem === itemName) {
            count++;
        }
    }
    return count;
}

export function toggleInventory() {
    const inventoryUI = document.getElementById('inventory');
    if (!inventoryUI) return;

    const isOpen = inventoryUI.style.display === 'block';
    if (isOpen) {
        closeInventory();
    } else {
        inventoryUI.style.display = 'block';
        generateInventorySlots(); // Update slots when opening
        if (controls.isLocked) controls.unlock(); // Unlock controls when opening inventory
        // Ensure other menus are closed
        closeBuildingMenu(false);
        closeCraftingMenu(false);
        // Hide interaction prompt while inventory open
        document.getElementById('interaction-prompt').style.display = 'none';
    }
}

export function closeInventory() {
    const inventoryUI = document.getElementById('inventory');
    if (inventoryUI) inventoryUI.style.display = 'none';
    // Re-lock controls only if the game was active and no *other* major menu is open
    if (gameState.isGameActive &&
        document.getElementById('building-menu')?.style.display !== 'block' &&
        document.getElementById('crafting')?.style.display !== 'block' &&
        document.getElementById('pause-menu')?.style.display !== 'block' &&
        document.getElementById('options-menu')?.style.display !== 'block' &&
        document.getElementById('boss-altar')?.style.display !== 'block'
        ) {
       if(!controls.isLocked) controls.lock();
    }
}

export function selectToolFromActionBar(index) {
    const slots = document.querySelectorAll('.action-slot');
    if (index >= 0 && index < slots.length) {
        const selectedSlot = slots[index];
        const tool = selectedSlot.getAttribute('data-item');
        if (tool) {
            selectTool(tool); // Call the main function to handle selection logic
        }
    }
}

// Crafting functionality (could be moved to a separate crafting.js module)
export function updateCraftingItems(category, stationType) {
    const itemsContainer = document.querySelector('#crafting .crafting-items');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = ''; // Clear previous items

    // --- Filter recipes based on station and category ---
    const recipes = getAvailableRecipes(stationType, category); // Implement this function

    if (recipes.length === 0) {
        itemsContainer.innerHTML = '<p>No recipes available for this category/station.</p>';
        return;
    }

    recipes.forEach(recipe => {
        const itemElement = document.createElement('div');
        itemElement.className = 'crafting-item';

        const canCraft = checkCraftingResources(recipe.resources); // Check if player has ingredients

        let resourceString = '';
        for (const resName in recipe.resources) {
            const required = recipe.resources[resName];
            const playerHas = countItemInInventory(resName); // Need inventory count function
            const color = playerHas >= required ? '#afc' : '#fcc'; // Green if can afford, Red if not
            resourceString += `<span style="color: ${color};">${resName} x${required} (${playerHas})</span><br>`;
        }

        itemElement.innerHTML = `
            <div class="item-icon">${getItemIcon(recipe.result)}</div>
            <div>
                <div class="item-name">${recipe.result}</div>
                <div class="item-cost">${resourceString.trim()}</div>
            </div>
            <button class="craft-btn" ${!canCraft ? 'disabled' : ''}>Craft</button>
        `;

        itemElement.querySelector('.craft-btn').addEventListener('click', () => {
            if (canCraft) {
                craftItem(recipe);
            } else {
                showGameMessage("Not enough resources!", 'error');
            }
        });

        itemsContainer.appendChild(itemElement);
    });
}

export function getAvailableRecipes(stationType, category) {
    // --- Placeholder Recipe Data ---
    // Structure: { result: "ItemName", station: "workbench|forge|none", category: "tools|...", resources: { "res1": count, "res2": count } }
    const allRecipes = [
        // Workbench - Tools
        { result: "Stone Axe", station: "workbench", category: "tools", resources: { wood: 3, stone: 5 } },
        { result: "Stone Pickaxe", station: "workbench", category: "tools", resources: { wood: 3, stone: 5 } },
        { result: "Hammer", station: "workbench", category: "tools", resources: { wood: 2, stone: 1 } },
        // Workbench - Weapons
        { result: "Club", station: "workbench", category: "weapons", resources: { wood: 3 } },
        { result: "Wood Shield", station: "workbench", category: "weapons", resources: { wood: 8 } },
        // Workbench - Misc
        { result: "Torch", station: "workbench", category: "misc", resources: { wood: 1 } },
        { result: "Chest", station: "workbench", category: "misc", resources: { wood: 10 } },

        // Forge - Tools (Example)
        { result: "Iron Axe", station: "forge", category: "tools", resources: { wood: 4, iron_ore: 5 } },
        // Forge - Weapons (Example)
        { result: "Iron Sword", station: "forge", category: "weapons", resources: { wood: 2, iron_ore: 8 } },
    ];

    return allRecipes.filter(recipe => {
        return recipe.station === stationType && recipe.category === category;
    });
}

export function checkCraftingResources(requiredResources) {
    for (const resName in requiredResources) {
        if (!hasItemInInventory(resName, requiredResources[resName])) {
            return false; // Missing at least one resource
        }
    }
    return true; // Has all required resources
}

export function craftItem(recipe) {
    console.log(`Attempting to craft: ${recipe.result}`);

    // Double-check resources (though button should be disabled if check failed)
    if (!checkCraftingResources(recipe.resources)) {
        showGameMessage("Missing resources!", 'error');
        return;
    }

    // Consume resources
    let consumedSuccessfully = true;
    const consumedItems = {}; // Track what was consumed in case rollback needed
    for (const resName in recipe.resources) {
        const needed = recipe.resources[resName];
        if (removeItemFromInventory(resName, needed)) {
            consumedItems[resName] = needed;
        } else {
            consumedSuccessfully = false;
            console.error(`Failed to remove required resource: ${resName}`);
            showGameMessage("Crafting failed: Could not consume resources.", 'error');
            break; // Stop consuming if one fails
        }
    }

    // If consumption failed, rollback
    if (!consumedSuccessfully) {
        for (const itemName in consumedItems) {
            addItemToInventory(itemName, consumedItems[itemName]); // Add back consumed items
        }
        return; // Stop crafting process
    }

    // Add result item to inventory
    if (addItemToInventory(recipe.result)) {
        console.log(`Successfully crafted ${recipe.result}`);
        showGameMessage(`Crafted ${recipe.result}`);
        // playSound('craft_success');

        // Update crafting UI to reflect new resource counts
        updateCraftingItems(recipe.category, recipe.station);
    } else {
        console.error(`Crafting failed: Inventory full for ${recipe.result}.`);
        showGameMessage("Crafting failed: Inventory full!", 'error');
        // IMPORTANT: Give back the consumed resources if adding fails!
        for (const itemName in consumedItems) {
            addItemToInventory(itemName, consumedItems[itemName]); // Add back consumed items
        }
    }
}

export function closeCraftingMenu(lockControls = true) {
    const craftingMenu = document.getElementById('crafting');
    if (craftingMenu) craftingMenu.style.display = 'none';
    if (lockControls && gameState.isGameActive &&
        document.getElementById('inventory')?.style.display !== 'block' &&
        document.getElementById('pause-menu')?.style.display !== 'block' &&
        document.getElementById('options-menu')?.style.display !== 'block'
        ) {
        if(!controls.isLocked) controls.lock();
    }
}
