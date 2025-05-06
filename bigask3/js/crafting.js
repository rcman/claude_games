export class CraftingSystem {
    constructor(gameInstance) {
        this.game = gameInstance; // To access player inventory
        this.recipes = {
            'Axe': { wood: 3, stone: 2, craftTime: 5 },
            'Pickaxe': { wood: 3, stone: 3, craftTime: 5 },
            'Campfire': { wood: 5, stone: 3, craftTime: 8 },
            'Crafting Table': { wood: 10, stone: 5, craftTime: 15 },
            'Forge': { stone: 20, wood: 5, 'clay?': 5, craftTime: 20 }, // Clay not implemented
            'Rope': { fiber: 3, craftTime: 3 },
        };
        this.craftingQueue = []; // { itemName, timeRemaining }
    }

    getAvailableCrafts() {
        const available = [];
        for (const itemName in this.recipes) {
            if (this.canCraft(itemName)) {
                available.push({ name: itemName, recipe: this.recipes[itemName] });
            }
        }
        return available;
    }

    canCraft(itemName) {
        const recipe = this.recipes[itemName];
        if (!recipe) return false;
        for (const resource in recipe) {
            if (resource === 'craftTime') continue;
            if (this.game.player.inventory.countItem(resource) < recipe[resource]) {
                return false;
            }
        }
        return true;
    }

    craftItem(itemName) {
        if (!this.canCraft(itemName)) {
            this.game.uiManager.showTemporaryMessage(`Not enough resources for ${itemName}.`);
            return false;
        }

        const recipe = this.recipes[itemName];
        // Consume resources
        for (const resource in recipe) {
            if (resource === 'craftTime') continue;
            this.game.player.inventory.removeItem(resource, recipe[resource]); // Check both inv and quickbar
        }

        // Add to crafting queue or directly to inventory if instant
        // For simplicity, let's assume instant craft for now. Timed crafting adds complexity.
        const success = this.game.player.inventory.addItem({ name: itemName, quantity: 1 });
        if (success) {
            this.game.uiManager.showTemporaryMessage(`Crafted ${itemName}.`);
            this.game.uiManager.updateCraftingMenu(); // Refresh list
            this.game.uiManager.updateInventory();
            this.game.uiManager.updateQuickBar();
        } else {
            this.game.uiManager.showTemporaryMessage(`Inventory full, ${itemName} not crafted.`);
            // Ideally, refund resources here if inventory is full AFTER consumption
        }
        return success;
    }

    // Campfire specific logic
    startCampfireProcess(campfireObject, slotIndex, itemToProcess) {
        // itemToProcess = { name: 'Raw Meat', quantity: 1 } or { name: 'Canteen', isBoiled: false, water: 100 }
        const campfireData = campfireObject.userData.inventory; // { slots: [null, null, null, null], fuel: 0 }
        if (!campfireData.slots[slotIndex] && campfireData.fuel > 0) { // Check fuel
            let processTime = 0;
            let outputItem = null;

            if (itemToProcess.name === 'Raw Meat') {
                processTime = 15; // seconds
                outputItem = { name: 'Cooked Meat', quantity: 1 };
            } else if (itemToProcess.name === 'Canteen' && itemToProcess.water > 0 && !itemToProcess.isBoiled) {
                processTime = 15; // seconds
                outputItem = { ...itemToProcess, isBoiled: true, name: 'Canteen (Boiled)' };
            } else {
                this.game.uiManager.showTemporaryMessage("Cannot process this item here.");
                return false;
            }
            
            campfireData.slots[slotIndex] = { 
                processing: itemToProcess, 
                output: outputItem, 
                timeRemaining: processTime,
                startTime: Date.now()
            };
            this.game.player.inventory.removeItem(itemToProcess.name, 1); // Remove from player
            this.game.uiManager.updateCampfireMenu();
            this.game.uiManager.showTemporaryMessage(`Started processing ${itemToProcess.name}.`);
            return true;
        } else if (campfireData.fuel <= 0) {
            this.game.uiManager.showTemporaryMessage("Campfire needs fuel.");
        }
        return false;
    }

    updateCampfireProcesses(deltaTime, campfireObject) {
        const campfireData = campfireObject.userData.inventory;
        let changed = false;
        for (let i = 0; i < campfireData.slots.length; i++) {
            const slot = campfireData.slots[i];
            if (slot && slot.processing) {
                slot.timeRemaining -= deltaTime;
                if (slot.timeRemaining <= 0) {
                    // Process finished, move to output or give to player if campfire UI is open and player clicks
                    // For simplicity, let's auto-add to player inventory if possible
                    const added = this.game.player.inventory.addItem(slot.output);
                    if (added) {
                        this.game.uiManager.showTemporaryMessage(`${slot.output.name} is ready!`);
                        campfireData.slots[i] = null; // Clear slot
                    } else {
                        // Output is ready, but inventory full. Keep it in campfire slot as "output ready"
                        campfireData.slots[i] = { outputReady: slot.output }; 
                        this.game.uiManager.showTemporaryMessage(`${slot.output.name} ready, inventory full.`);
                    }
                    changed = true;
                }
            }
        }
        if (changed) {
            this.game.uiManager.updateCampfireMenu(); // Refresh UI if something changed
        }
        // Handle fuel consumption if implemented
    }
}