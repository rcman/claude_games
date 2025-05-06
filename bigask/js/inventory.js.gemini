// js/inventory.js

class Inventory {
    constructor(game) {
        this.game = game;
        this.size = 20; // Total inventory slots
        this.items = new Array(this.size).fill(null);
        this.quickBarSize = 5;
        this.selectedQuickSlot = 0; // Index 0-4
    }

    addItem(itemId, count = 1) {
        const itemData = getItemData(itemId);
        if (!itemData || itemData.type === 'unknown') {
            console.warn(`Attempted to add unknown item: ${itemId}`);
            return false;
        }

        // Try to stack with existing items
        for (let i = 0; i < this.size; i++) {
            if (this.items[i] && this.items[i].id === itemId && this.items[i].count < itemData.stack) {
                const canAdd = itemData.stack - this.items[i].count;
                const toAdd = Math.min(count, canAdd);
                this.items[i].count += toAdd;
                count -= toAdd;
                if (count === 0) {
                    this.game.ui.updateInventory();
                    return true;
                }
            }
        }

        // Try to add to an empty slot
        for (let i = 0; i < this.size; i++) {
            if (!this.items[i]) {
                const toAdd = Math.min(count, itemData.stack);
                this.items[i] = { id: itemId, count: toAdd };
                count -= toAdd;
                if (count === 0) {
                    this.game.ui.updateInventory();
                    return true;
                }
            }
        }

        this.game.ui.showNotification("Inventory full!");
        this.game.ui.updateInventory(); // Update even if full to show partial adds
        return false; // Not all items could be added
    }

    removeItem(itemId, count = 1) {
        for (let i = this.items.length - 1; i >= 0; i--) { // Iterate backwards for easier removal
            if (this.items[i] && this.items[i].id === itemId) {
                const toRemove = Math.min(count, this.items[i].count);
                this.items[i].count -= toRemove;
                count -= toRemove;

                if (this.items[i].count <= 0) {
                    this.items[i] = null;
                }
                if (count === 0) {
                    this.game.ui.updateInventory();
                    this.game.player.updateEquippedItem(); // If removed item was equipped
                    return true;
                }
            }
        }
        this.game.ui.updateInventory();
        this.game.player.updateEquippedItem();
        return false; // Not all items could be removed (or item not found)
    }

    hasItem(itemId, count = 1) {
        let totalCount = 0;
        for (const item of this.items) {
            if (item && item.id === itemId) {
                totalCount += item.count;
            }
        }
        return totalCount >= count;
    }

    getItemCount(itemId) {
        let totalCount = 0;
        for (const item of this.items) {
            if (item && item.id === itemId) {
                totalCount += item.count;
            }
        }
        return totalCount;
    }

    getQuickBarItems() {
        return this.items.slice(0, this.quickBarSize);
    }

    selectQuickSlot(index) {
        if (index >= 0 && index < this.quickBarSize) {
            this.selectedQuickSlot = index;
            this.game.player.updateEquippedItem();
            this.game.ui.updateQuickBar();
        }
    }

    getSelectedItem() {
        return this.items[this.selectedQuickSlot];
    }

    useItemFromSlot(slotIndex) {
        const item = this.items[slotIndex];
        if (!item) return;

        const itemData = getItemData(item.id);

        if (itemData.type === 'food' || itemData.type === 'consumable') {
            if (itemData.hungerValue) this.game.player.eat(itemData);
            if (itemData.thirstValue && !itemData.hungerValue) this.game.player.drink(itemData); // If only thirst, it's a drink
            this.removeItem(item.id, 1); // Consume one
            this.game.ui.showNotification(`Used ${itemData.name}`);
        } else if (itemData.type === 'tool' || itemData.type === 'weapon' || itemData.type === 'placeable' || itemData.equippable) {
            // If item is in quickbar, select it. Otherwise, swap with current quickbar item.
            if (slotIndex < this.quickBarSize) {
                this.selectQuickSlot(slotIndex);
            } else {
                // Swap item from main inventory with selected quickbar slot
                const quickBarItem = this.items[this.selectedQuickSlot];
                this.items[this.selectedQuickSlot] = item;
                this.items[slotIndex] = quickBarItem; // Can be null
                this.game.player.updateEquippedItem();
                this.game.ui.updateInventory(); // Updates both inventory and quickbar
            }
            this.game.ui.showNotification(`Equipped ${itemData.name}`);
        } else {
            this.game.ui.showNotification(`Cannot use ${itemData.name} this way.`);
        }
    }

    // Called when using the currently selected quickbar item (e.g., mouse click)
    useEquippedItem() {
        const item = this.getSelectedItem();
        if (!item) {
            // Bare hands action?
            this.game.player.performAction(null); // Player handles bare hands
            return;
        }

        const itemData = getItemData(item.id);

        if (itemData.type === 'food' || itemData.type === 'consumable') {
             if (itemData.hungerValue) this.game.player.eat(itemData);
             if (itemData.thirstValue && !itemData.hungerValue) this.game.player.drink(itemData);
             this.removeItem(item.id, 1);
             this.game.ui.showNotification(`Used ${itemData.name}`);
        } else if (itemData.type === 'placeable') {
            if (this.game.building.selectBuildable(itemData.buildableId)) {
                 this.game.ui.closeAllMenus();
                 this.game.ui.showNotification(`Selected ${itemData.name}. Left-click to place, R to rotate.`);
            } else {
                this.game.ui.showNotification(`Cannot select ${itemData.name} for building.`);
            }
        } else if (itemData.type === 'tool' || itemData.type === 'weapon') {
            // Action is handled by player.attack() or player.harvest() via raycast
            this.game.player.performAction(itemData);
        } else {
            this.game.ui.showNotification(`Cannot use ${itemData.name} with primary action.`);
        }
    }
}