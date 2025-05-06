Okay, this is a substantial project! Let's focus on getting the core systems more functional and interconnected. I'll provide the missing `ui.js`, create a basic `items.js` for item definitions, and then fill in and refine the logic in the other files.

**1. Create `js/items.js` (New File)**

This file will define all usable items in the game.

```javascript
// js/items.js

const ItemData = {
    // Resources
    'wood': { name: 'Wood', icon: 'assets/items/wood.png', stack: 50, type: 'resource' },
    'stone': { name: 'Stone', icon: 'assets/items/stone.png', stack: 50, type: 'resource' },
    'stick': { name: 'Stick', icon: 'assets/items/stick.png', stack: 50, type: 'resource' },
    'fiber': { name: 'Fiber', icon: 'assets/items/fiber.png', stack: 50, type: 'resource' },
    'iron_ore': { name: 'Iron Ore', icon: 'assets/items/iron_ore.png', stack: 50, type: 'resource' },
    'flint': { name: 'Flint', icon: 'assets/items/flint.png', stack: 50, type: 'resource' },
    'leather': { name: 'Leather', icon: 'assets/items/leather.png', stack: 20, type: 'material' },
    'wolf_pelt': { name: 'Wolf Pelt', icon: 'assets/items/wolf_pelt.png', stack: 10, type: 'material' },
    'wolf_fang': { name: 'Wolf Fang', icon: 'assets/items/wolf_fang.png', stack: 10, type: 'material' },
    'rabbit_fur': { name: 'Rabbit Fur', icon: 'assets/items/rabbit_fur.png', stack: 20, type: 'material' },
    'bear_pelt': { name: 'Bear Pelt', icon: 'assets/items/bear_pelt.png', stack: 5, type: 'material' },
    'bear_claw': { name: 'Bear Claw', icon: 'assets/items/bear_claw.png', stack: 10, type: 'material' },
    'feather': { name: 'Feather', icon: 'assets/items/feather.png', stack: 50, type: 'material' }, // Assuming chickens drop feathers
    'iron_ingot': { name: 'Iron Ingot', icon: 'assets/items/iron_ingot.png', stack: 30, type: 'material' },
    'rope': { name: 'Rope', icon: 'assets/items/rope.png', stack: 20, type: 'material' },

    // Food
    'apple': { name: 'Apple', icon: 'assets/items/apple.png', stack: 10, type: 'food', hungerValue: 10, thirstValue: 2 },
    'berries': { name: 'Berries', icon: 'assets/items/berries.png', stack: 20, type: 'food', hungerValue: 5, thirstValue: 1 },
    'raw_meat': { name: 'Raw Meat', icon: 'assets/items/raw_meat.png', stack: 10, type: 'food', hungerValue: 5, healthValue: -5 }, // Eating raw meat is bad
    'raw_fish': { name: 'Raw Fish', icon: 'assets/items/raw_fish.png', stack: 10, type: 'food', hungerValue: 4, healthValue: -3 },
    'cooked_meat': { name: 'Cooked Meat', icon: 'assets/items/cooked_meat.png', stack: 10, type: 'food', hungerValue: 25, healthValue: 5 },
    'cooked_fish': { name: 'Cooked Fish', icon: 'assets/items/cooked_fish.png', stack: 10, type: 'food', hungerValue: 20, healthValue: 3 },
    'water_container': { name: 'Water Container', icon: 'assets/items/water_container.png', stack: 1, type: 'consumable', thirstValue: 30 }, // Assume it's filled
    'herb_tea': { name: 'Herb Tea', icon: 'assets/items/herb_tea.png', stack: 5, type: 'consumable', thirstValue: 20, healthValue: 10 },
    'herbs': { name: 'Herbs', icon: 'assets/items/herbs.png', stack: 20, type: 'material' }, // For tea

    // Tools
    'wooden_axe': { name: 'Wooden Axe', icon: 'assets/items/wooden_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 2, durability: 50 },
    'wooden_pickaxe': { name: 'Wooden Pickaxe', icon: 'assets/items/wooden_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 2, durability: 50 },
    'stone_axe': { name: 'Stone Axe', icon: 'assets/items/stone_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 4, durability: 100 },
    'stone_pickaxe': { name: 'Stone Pickaxe', icon: 'assets/items/stone_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 4, durability: 100 },
    'iron_axe': { name: 'Iron Axe', icon: 'assets/items/iron_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 8, durability: 200 },
    'iron_pickaxe': { name: 'Iron Pickaxe', icon: 'assets/items/iron_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 8, durability: 200 },
    'torch': { name: 'Torch', icon: 'assets/items/torch.png', stack: 10, type: 'tool', equippable: true, lightSource: { color: 0xffaa33, intensity: 0.8, distance: 10 } },

    // Weapons
    'wooden_sword': { name: 'Wooden Sword', icon: 'assets/items/wooden_sword.png', stack: 1, type: 'weapon', damage: 5, durability: 60 },
    'stone_sword': { name: 'Stone Sword', icon: 'assets/items/stone_sword.png', stack: 1, type: 'weapon', damage: 8, durability: 120 },
    'iron_sword': { name: 'Iron Sword', icon: 'assets/items/iron_sword.png', stack: 1, type: 'weapon', damage: 15, durability: 250 },
    'bow': { name: 'Bow', icon: 'assets/items/bow.png', stack: 1, type: 'weapon', damage: 10, range: 30, durability: 80, requiresAmmo: 'arrow' },
    'arrow': { name: 'Arrow', icon: 'assets/items/arrow.png', stack: 20, type: 'ammo' },

    // Armor
    'leather_armor': { name: 'Leather Armor', icon: 'assets/items/leather_armor.png', stack: 1, type: 'armor', defense: 5, slot: 'body', durability: 100 },
    'iron_armor': { name: 'Iron Armor', icon: 'assets/items/iron_armor.png', stack: 1, type: 'armor', defense: 10, slot: 'body', durability: 200 },

    // Placeables / Structures (these are crafted into inventory then placed)
    'campfire': { name: 'Campfire', icon: 'assets/structures/campfire.png', stack: 5, type: 'placeable', buildableId: 'campfire' },
    'crafting_table': { name: 'Crafting Table', icon: 'assets/structures/crafting_table.png', stack: 5, type: 'placeable', buildableId: 'crafting_table' },
    'forge': { name: 'Forge', icon: 'assets/structures/forge.png', stack: 5, type: 'placeable', buildableId: 'forge' },
    'wooden_wall': { name: 'Wooden Wall', icon: 'assets/structures/wooden_wall.png', stack: 20, type: 'placeable', buildableId: 'wooden_wall' },
    'wooden_floor': { name: 'Wooden Floor', icon: 'assets/structures/wooden_floor.png', stack: 20, type: 'placeable', buildableId: 'wooden_floor' },
    'wooden_door': { name: 'Wooden Door', icon: 'assets/structures/wooden_door.png', stack: 5, type: 'placeable', buildableId: 'wooden_door' },
    'storage_box': { name: 'Storage Box', icon: 'assets/structures/storage_box.png', stack: 5, type: 'placeable', buildableId: 'storage_box' },

    // Default/Error item
    'unknown': { name: 'Unknown Item', icon: 'assets/items/unknown.png', stack: 1, type: 'unknown' }
};

function getItemData(itemId) {
    return ItemData[itemId] || ItemData['unknown'];
}
```
**(Remember to add a `js/items.js` script tag in `index.html` BEFORE `js/inventory.js`)**

**2. Create `js/ui.js` (New File)**

```javascript
// js/ui.js

class UI {
    constructor(game) {
        this.game = game;
        this.inventoryMenu = document.getElementById('inventory');
        this.craftingMenu = document.getElementById('craftingMenu');
        this.buildingMenu = document.getElementById('buildingMenu');
        this.campfireMenu = document.getElementById('campfireMenu');
        this.craftingTableMenu = document.getElementById('craftingTableMenu'); // This seems to be the same as craftingMenu?
        this.forgeMenu = document.getElementById('forgeMenu');

        this.quickBar = document.getElementById('quickBar');
        this.inventoryGrid = document.getElementById('inventoryGrid');
        this.craftingGrid = document.getElementById('craftingGrid');
        this.buildingGrid = document.getElementById('buildingGrid');

        this.interactionPrompt = document.getElementById('interactionPrompt');
        this.notificationTimeout = null;

        this.menus = [
            this.inventoryMenu, this.craftingMenu, this.buildingMenu,
            this.campfireMenu, this.craftingTableMenu, this.forgeMenu
        ];
    }

    updateInventory() {
        this.inventoryGrid.innerHTML = '';
        const items = this.game.inventory.items;

        for (let i = 0; i < this.game.inventory.size; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;

            const item = items[i];
            if (item) {
                const itemData = getItemData(item.id);
                const img = document.createElement('img');
                img.src = itemData.icon;
                img.alt = itemData.name;
                slot.appendChild(img);

                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
                 // Add click listener for using/equipping from inventory
                slot.addEventListener('click', () => this.game.inventory.useItemFromSlot(i));
            }
            this.inventoryGrid.appendChild(slot);
        }
        this.updateQuickBar();
    }

    updateQuickBar() {
        this.quickBar.innerHTML = '';
        const quickBarItems = this.game.inventory.getQuickBarItems();

        for (let i = 0; i < this.game.inventory.quickBarSize; i++) {
            const slot = document.createElement('div');
            slot.className = 'quick-slot';
            if (i === this.game.inventory.selectedQuickSlot) {
                slot.classList.add('selected');
            }
            slot.dataset.index = i;

            const item = quickBarItems[i];
            if (item) {
                const itemData = getItemData(item.id);
                const img = document.createElement('img');
                img.src = itemData.icon;
                img.alt = itemData.name;
                slot.appendChild(img);

                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
            }
             // Add click listener for selecting quick slot
            slot.addEventListener('click', () => this.game.inventory.selectQuickSlot(i));
            this.quickBar.appendChild(slot);
        }
    }

    updateCraftingMenu(recipes, station = null) {
        this.craftingGrid.innerHTML = '';
        recipes.forEach(recipeData => {
            const canCraft = this.game.crafting.canCraft(recipeData, this.game.inventory.items);
            const recipeItem = getItemData(recipeData.result.item);

            const recipeElement = document.createElement('div');
            recipeElement.className = 'crafting-item';
            if (!canCraft) recipeElement.classList.add('unavailable');

            const img = document.createElement('img');
            img.src = recipeItem.icon;
            img.alt = recipeItem.name;
            recipeElement.appendChild(img);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = recipeItem.name;
            if (recipeData.result.count > 1) {
                nameSpan.textContent += ` (x${recipeData.result.count})`;
            }
            recipeElement.appendChild(nameSpan);
            
            // Tooltip for ingredients
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip-text'; // Style this class
            tooltip.style.display = 'none';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(0,0,0,0.9)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px';
            tooltip.style.border = '1px solid #555';
            tooltip.style.borderRadius = '3px';
            tooltip.style.zIndex = '1001'; // Above other UI elements

            let tooltipContent = `Needs:<br>`;
            recipeData.ingredients.forEach(ing => {
                const owned = this.game.inventory.getItemCount(ing.item);
                const ingData = getItemData(ing.item);
                tooltipContent += `${ingData.name}: ${owned}/${ing.count}<br>`;
            });
            tooltip.innerHTML = tooltipContent;
            recipeElement.appendChild(tooltip);

            recipeElement.onmouseenter = (e) => {
                tooltip.style.display = 'block';
                // Position tooltip near mouse
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            };
            recipeElement.onmouseleave = () => {
                tooltip.style.display = 'none';
            };
             recipeElement.onmousemove = (e) => { // Keep tooltip near mouse
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            };


            if (canCraft) {
                recipeElement.addEventListener('click', () => {
                    const result = this.game.crafting.craft(recipeData.id, this.game.inventory.items, station);
                    if (result.success) {
                        this.showNotification(result.message || `Crafted ${recipeItem.name}`);
                        this.updateInventory(); // Refresh inventory
                        // Refresh crafting menu
                        if (station === 'crafting_table') this.game.structures.openCraftingTable();
                        else if (station === 'forge') this.game.structures.openForge();
                        else this.toggleCraftingMenu(true); // Reopen basic crafting
                    } else {
                        this.showNotification(result.message || "Cannot craft item.");
                    }
                });
            }
            this.craftingGrid.appendChild(recipeElement);
        });
    }

    updateBuildingMenu() {
        this.buildingGrid.innerHTML = '';
        const buildables = this.game.building.buildables;

        for (const buildableId in buildables) {
            const buildableData = buildables[buildableId];
            const canAfford = this.game.inventory.hasItem(buildableId, 1); // Assuming buildableId is the item id needed

            const itemElement = document.createElement('div');
            itemElement.className = 'building-item';
            if (!canAfford) itemElement.classList.add('unavailable');


            const img = document.createElement('img');
            img.src = buildableData.icon;
            img.alt = buildableData.name;
            itemElement.appendChild(img);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = buildableData.name;
            itemElement.appendChild(nameSpan);
            
            // Tooltip for cost (if not affordable)
            if(!canAfford) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip-text';
                tooltip.style.display = 'none';
                // ... (style like crafting tooltip)
                const costItemData = getItemData(buildableId); // Assuming item ID is same as buildable ID
                tooltip.innerHTML = `Needs: ${costItemData.name} x1`;
                itemElement.appendChild(tooltip);
                itemElement.onmouseenter = (e) => { tooltip.style.display = 'block'; /* position */ };
                itemElement.onmouseleave = () => { tooltip.style.display = 'none'; };
            }


            if (canAfford) {
                itemElement.addEventListener('click', () => {
                    this.game.building.selectBuildable(buildableId);
                    this.closeAllMenus();
                    this.showNotification(`Selected ${buildableData.name}. Left-click to place, R to rotate.`);
                });
            }
            this.buildingGrid.appendChild(itemElement);
        }
    }

    toggleInventory() {
        const isOpen = this.inventoryMenu.style.display === 'block';
        if (isOpen) {
            this.inventoryMenu.style.display = 'none';
            this.game.player.controls.lock();
        } else {
            this.closeAllMenus(this.inventoryMenu);
            this.updateInventory();
            this.inventoryMenu.style.display = 'block';
            this.game.player.controls.unlock();
        }
    }

    toggleCraftingMenu(forceOpen = false) {
        const isOpen = this.craftingMenu.style.display === 'block';
        if (isOpen && !forceOpen) {
            this.craftingMenu.style.display = 'none';
            this.game.player.controls.lock();
        } else {
            this.closeAllMenus(this.craftingMenu);
            this.updateCraftingMenu(this.game.crafting.recipes); // Basic recipes
            this.craftingMenu.style.display = 'block';
            this.game.player.controls.unlock();
        }
    }

    toggleBuildingMenu() {
        const isOpen = this.buildingMenu.style.display === 'block';
        if (isOpen) {
            this.buildingMenu.style.display = 'none';
            this.game.player.controls.lock();
        } else {
            this.closeAllMenus(this.buildingMenu);
            this.updateBuildingMenu();
            this.buildingMenu.style.display = 'block';
            this.game.player.controls.unlock();
        }
    }


    showInteractionPrompt(text) {
        this.interactionPrompt.textContent = `[E] ${text}`;
        this.interactionPrompt.style.display = 'block';
    }

    hideInteractionPrompt() {
        this.interactionPrompt.style.display = 'none';
    }

    showNotification(message, duration = 3000) {
        const notificationArea = document.getElementById('interactionPrompt'); // Re-use for now
        if (!notificationArea) { // Fallback if prompt is hidden
            const tempNotif = document.createElement('div');
            tempNotif.id = 'tempNotification';
            // Style it like interactionPrompt
            tempNotif.style.position = 'absolute';
            tempNotif.style.bottom = '100px';
            tempNotif.style.left = '50%';
            tempNotif.style.transform = 'translateX(-50%)';
            tempNotif.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            tempNotif.style.color = 'white';
            tempNotif.style.padding = '10px';
            tempNotif.style.borderRadius = '5px';
            tempNotif.style.zIndex = '10';
            document.body.appendChild(tempNotif);
            this._displayNotification(tempNotif, message, duration, true);
            return;
        }
       this._displayNotification(notificationArea, message, duration, false);
    }
    
    _displayNotification(element, message, duration, removeAfter) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.opacity = '1';

        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        this.notificationTimeout = setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => {
                if(removeAfter) {
                    element.remove();
                } else {
                    element.style.display = 'none'; // Hide if it's a permanent element
                }
            }, 500); // Transition time
        }, duration);
    }


    closeAllMenus(excludeMenu = null) {
        this.menus.forEach(menu => {
            if (menu && menu !== excludeMenu) {
                menu.style.display = 'none';
            }
        });
        if (this.game.building.ghostObject) {
            this.game.building.cancelPlacement();
        }
        // If all menus are closed, lock controls (unless a menu is being opened)
        if (!excludeMenu && document.pointerLockElement !== this.game.renderer.domElement) {
             this.game.player.controls.lock();
        }
    }
}
```

**3. Update `js/inventory.js`**

Replace the content of `js/inventory.js` (which is currently `Resources`) with the actual `Inventory` class.

```javascript
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
```

**4. Update `js/resources.js`** (This was the old inventory.js)
No major changes needed immediately if it was working, but ensure `addItem` refers to `this.game.inventory.addItem`.

```javascript
// js/resources.js

class Resources {
    constructor(game) {
        this.game = game;
        
        // Resource definition
        this.resourceTypes = {
            'tree': {
                name: 'Tree',
                modelPath: 'assets/models/tree.glb', // Example path
                icon: 'assets/items/wood.png', // For UI if needed
                tool: 'axe', // Required tool type
                yields: [
                    { item: 'wood', amountMin: 2, amountMax: 5, chance: 1.0 },
                    { item: 'stick', amountMin: 1, amountMax: 3, chance: 0.5 },
                    { item: 'apple', amountMin: 0, amountMax: 1, chance: 0.2 }
                ],
                health: 50, // More health for resources
                respawnTime: 300, 
                biomes: ['plains', 'forest'],
                minDistance: 5,
                scale: { x:1, y:1, z:1 }
            },
            'rock': { // Renamed from 'stone' to avoid confusion with 'stone' item
                name: 'Rock',
                modelPath: 'assets/models/rock.glb',
                icon: 'assets/items/stone.png',
                tool: 'pickaxe',
                yields: [
                    { item: 'stone', amountMin: 3, amountMax: 6, chance: 1.0 },
                    { item: 'flint', amountMin: 0, amountMax: 2, chance: 0.3 },
                    { item: 'iron_ore', amountMin: 0, amountMax: 1, chance: 0.1 } // Small chance from surface rocks
                ],
                health: 70,
                respawnTime: 400,
                biomes: ['plains', 'forest', 'mountains'],
                minDistance: 4,
                scale: { x:1, y:1, z:1 }
            },
            'bush': {
                name: 'Berry Bush',
                modelPath: 'assets/models/bush.glb',
                icon: 'assets/items/berries.png',
                tool: null, // Can be harvested by hand
                yields: [
                    { item: 'berries', amountMin: 2, amountMax: 4, chance: 1.0 },
                    { item: 'fiber', amountMin: 1, amountMax: 3, chance: 0.6 },
                    { item: 'stick', amountMin: 0, amountMax: 2, chance: 0.3 }
                ],
                health: 20,
                respawnTime: 200,
                biomes: ['plains', 'forest'],
                minDistance: 3,
                scale: { x:0.8, y:0.8, z:0.8 }
            },
            'iron_vein': { // More specific than ironOre
                name: 'Iron Vein',
                modelPath: 'assets/models/iron_vein.glb', // A rock model with iron veins
                icon: 'assets/items/iron_ore.png',
                tool: 'pickaxe',
                yields: [
                    { item: 'iron_ore', amountMin: 2, amountMax: 5, chance: 1.0 },
                    { item: 'stone', amountMin: 1, amountMax: 3, chance: 0.5 }
                ],
                health: 100,
                respawnTime: 600,
                biomes: ['mountains', 'caves'], // Caves would be a new biome
                minDistance: 8,
                scale: { x:1.2, y:1.2, z:1.2 }
            }
            // Add more like 'clay_deposit', 'coal_vein', 'tall_grass' (for fiber)
        };
        
        this.activeResources = []; // Renamed from 'resources'
        this.respawningResources = [];
        this.loader = new THREE.GLTFLoader(); // For loading models
    }

    spawnInitialResources() {
        const resourceCounts = {
            'tree': 50, // Reduced for testing
            'rock': 40,
            'bush': 30,
            'iron_vein': 20
        };
        
        for (const [typeKey, count] of Object.entries(resourceCounts)) {
            for (let i = 0; i < count; i++) {
                this.spawnResource(typeKey);
            }
        }
    }

    spawnResource(typeKey) {
        const resourceDef = this.resourceTypes[typeKey];
        if (!resourceDef) {
            console.warn("Unknown resource type:", typeKey);
            return null;
        }
        
        const position = this.findResourcePosition(resourceDef);
        if (!position) return null; 
        
        // Load model or use placeholder
        if (resourceDef.modelPath) {
            this.loader.load(resourceDef.modelPath, (gltf) => {
                const model = gltf.scene;
                model.position.copy(position);
                if(resourceDef.scale) model.scale.set(resourceDef.scale.x, resourceDef.scale.y, resourceDef.scale.z);
                
                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                model.userData = {
                    type: 'resource',
                    resourceId: typeKey, // Use the key for consistency
                    health: resourceDef.health,
                    maxHealth: resourceDef.health,
                    yields: resourceDef.yields,
                    respawnTime: resourceDef.respawnTime,
                    tool: resourceDef.tool,
                    originalPosition: position.clone() // For respawning
                };
                this.game.scene.add(model);
                this.activeResources.push(model);
            }, undefined, (error) => {
                console.error(`Failed to load resource model ${resourceDef.modelPath}:`, error);
                this.createPlaceholderResource(typeKey, position, resourceDef); // Fallback
            });
        } else {
           this.createPlaceholderResource(typeKey, position, resourceDef);
        }
    }
    
    createPlaceholderResource(typeKey, position, resourceDef) {
        let geometry, color;
        switch (typeKey) {
            case 'tree': geometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8); color = 0x8B4513; break;
            case 'rock': geometry = new THREE.DodecahedronGeometry(0.7); color = 0x808080; break;
            case 'bush': geometry = new THREE.SphereGeometry(0.5, 8, 8); color = 0x228B22; break;
            case 'iron_vein': geometry = new THREE.BoxGeometry(1, 1, 1); color = 0xA52A2A; break;
            default: geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); color = 0xFF00FF;
        }
        const material = new THREE.MeshLambertMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.copy(position);
        if (typeKey === 'tree') mesh.position.y += 1.5; // Adjust placeholder position
        else mesh.position.y += 0.5;


        mesh.userData = {
            type: 'resource',
            resourceId: typeKey,
            health: resourceDef.health,
            maxHealth: resourceDef.health,
            yields: resourceDef.yields,
            respawnTime: resourceDef.respawnTime,
            tool: resourceDef.tool,
            originalPosition: position.clone()
        };
        this.game.scene.add(mesh);
        this.activeResources.push(mesh);
         console.warn(`Using placeholder for ${typeKey}`);
    }


    findResourcePosition(resourceDef) {
        const maxAttempts = 50;
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = (Math.random() * worldSize) - (worldSize / 2);
            const z = (Math.random() * worldSize) - (worldSize / 2);
            const terrainHeight = this.game.world.getHeightAt(x, z);
            
            if (terrainHeight < waterLevel + 0.2) continue; // Avoid spawning in/too close to water
            
            const biome = this.game.world.getBiomeAt(new THREE.Vector3(x, terrainHeight, z));
            if (!resourceDef.biomes.includes(biome)) continue;
            
            const position = new THREE.Vector3(x, terrainHeight, z);
            let tooClose = false;
            for (const existing of this.activeResources) {
                if (existing.userData.resourceId === resourceDef.name) { // Check for same type
                    if (position.distanceTo(existing.position) < resourceDef.minDistance) {
                        tooClose = true;
                        break;
                    }
                }
            }
            if (tooClose) continue;
            
            return position;
        }
        console.warn(`Could not find position for resource ${resourceDef.name}`);
        return null;
    }


    harvestResource(resourceMesh, hitPoint, toolUsed) {
        const resData = resourceMesh.userData;
        if (resData.type !== 'resource' || resData.health <= 0) return;

        const requiredToolType = resData.tool;
        let damage = 1; // Base damage (e.g., hands)

        if (toolUsed) {
            const toolData = getItemData(toolUsed.id);
            if (requiredToolType && toolData.toolType === requiredToolType) {
                damage = toolData.toolStrength || 5; // Use tool strength if defined
            } else if (!requiredToolType) { // No specific tool needed (e.g. bush)
                damage = toolData.toolStrength || 2; // Tool still helps
            } else {
                this.game.ui.showNotification(`Wrong tool for ${getItemData(resData.resourceId).name}!`);
                damage = 0.5; // Penalty for wrong tool
            }
        } else if (requiredToolType) {
             this.game.ui.showNotification(`You need a ${requiredToolType} for ${getItemData(resData.resourceId).name}.`);
             return; // Can't harvest with hands if tool is required
        }


        resData.health -= damage;
        // Optional: Visual feedback (shake, particle)
        this.createHitEffect(hitPoint || resourceMesh.position, resourceMesh);


        if (resData.health <= 0) {
            this.addResourcesToInventory(resData);
            this.createHarvestEffect(hitPoint || resourceMesh.position, resData.resourceId);
            
            this.game.scene.remove(resourceMesh);
            const index = this.activeResources.indexOf(resourceMesh);
            if (index !== -1) this.activeResources.splice(index, 1);
            
            this.scheduleRespawn(resData.resourceId, resData.originalPosition, resData.respawnTime);
        } else {
             // Optional: Update visual state (e.g. cracks, less foliage)
        }
    }

    addResourcesToInventory(resourceData) {
        resourceData.yields.forEach(y => {
            if (Math.random() <= y.chance) {
                const amount = getRandomInt(y.amountMin, y.amountMax);
                if (amount > 0) {
                    this.game.inventory.addItem(y.item, amount);
                }
            }
        });
    }
    
    scheduleRespawn(resourceId, position, respawnTime) {
        this.respawningResources.push({
            id: resourceId,
            position: position.clone(),
            time: this.game.gameTime + respawnTime 
        });
    }

    update(deltaTime) {
        for (let i = this.respawningResources.length - 1; i >= 0; i--) {
            const respawn = this.respawningResources[i];
            if (this.game.gameTime >= respawn.time) {
                this.spawnResource(respawn.id, respawn.position); // Pass position to ensure it respawns at original spot
                this.respawningResources.splice(i, 1);
            }
        }
    }

    // Particle effects (simplified)
    createHitEffect(position, resourceMesh) {
        // Simple flash or small particles
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
        });
        const particleGeometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 5; i++) {
            vertices.push(
                position.x + (Math.random() - 0.5) * 0.2,
                position.y + (Math.random() - 0.5) * 0.2,
                position.z + (Math.random() - 0.5) * 0.2
            );
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.game.scene.add(particles);
        setTimeout(() => this.game.scene.remove(particles), 300);

        // Shake effect
        if (resourceMesh && resourceMesh.originalRotation === undefined) {
            resourceMesh.originalRotation = resourceMesh.rotation.clone();
        }
        if (resourceMesh) {
            const shakeIntensity = 0.05;
            resourceMesh.rotation.x += (Math.random() - 0.5) * shakeIntensity;
            resourceMesh.rotation.z += (Math.random() - 0.5) * shakeIntensity;
            setTimeout(() => {
                if (resourceMesh.originalRotation) {
                    resourceMesh.rotation.copy(resourceMesh.originalRotation);
                }
            }, 100);
        }
    }

    createHarvestEffect(position, resourceId) {
        const itemData = getItemData(resourceId);
        const particleMaterial = new THREE.PointsMaterial({
            map: AssetLoader.getTexture(itemData.icon) || new THREE.TextureLoader().load(itemData.icon), // Use item icon as particle
            size: 0.3,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
        });
        const particleGeometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 10; i++) {
             vertices.push(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + (Math.random()) * 0.5, // Tend to go up
                position.z + (Math.random() - 0.5) * 0.5
            );
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.game.scene.add(particles);
        setTimeout(() => this.game.scene.remove(particles), 1000);
    }
}
```

**5. Update `js/player.js`**

```javascript
// js/player.js
import { PointerLockControls } from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js';

class Player {
    constructor(game) {
        this.game = game;
        
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.maxHunger = 100;
        this.thirst = 100;
        this.maxThirst = 100;
        
        this.moveSpeed = 4;
        this.runSpeed = 7;
        this.jumpHeight = 1.2; // Realistic jump height
        this.gravity = -30; // Negative for downward force
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isOnGround = false;
        this.isRunning = false;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.wantsToJump = false;
        
        this.height = 1.8;
        this.radius = 0.4; // For collision capsule
        
        // Player object (contains camera)
        this.playerObject = new THREE.Object3D();
        this.playerObject.position.set(0, this.height, 0); // Start at player height
        this.game.scene.add(this.playerObject);
        this.game.camera.position.set(0,0,0); // Camera is at the origin of playerObject
        this.playerObject.add(this.game.camera);

        this.controls = new PointerLockControls(this.game.camera, this.game.renderer.domElement);
        // Need to add playerObject to scene BEFORE adding camera to it for controls to work relative to world
        // this.game.scene.add(this.controls.getObject()); // This is playerObject
        
        this.position = this.playerObject.position; // Player's base position
        
        this.hungerDecreaseRate = 0.2; // Per second
        this.thirstDecreaseRate = 0.3; // Per second
        
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackCooldownTime = 0.5;
        
        this.equippedItem = null; // Will be an object from ItemData
        this.toolMesh = null; // Visual representation of the tool
        this.createToolModel();

        this.raycaster = new THREE.Raycaster();
        this.interactionDistance = 3; // Max distance for interacting/harvesting
        this.attackDistance = 2.5; // Max distance for melee attacking
    }

    createToolModel() {
        // Placeholder, will be updated by equipItem
        const toolGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0.2 });
        this.toolMesh = new THREE.Mesh(toolGeometry, toolMaterial);
        this.toolMesh.position.set(0.3, -0.25, -0.4); // Relative to camera
        this.toolMesh.visible = false;
        this.game.camera.add(this.toolMesh); // Attach to camera
    }

    spawn() {
        const spawnPos = this.findSpawnPosition();
        this.playerObject.position.copy(spawnPos);
        this.playerObject.position.y += this.height; // Ensure feet are on ground
        
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        this.velocity.set(0,0,0);
        
        this.updateStatsUI();
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
    }

    findSpawnPosition() {
        const worldSize = this.game.world.size;
        for (let i = 0; i < 20; i++) { // Try a few times
            const x = Math.random() * worldSize / 2 - worldSize / 4;
            const z = Math.random() * worldSize / 2 - worldSize / 4;
            const y = this.game.world.getHeightAt(x, z);
            if (y > this.game.world.waterLevel + 0.5) { // Spawn on land
                return new THREE.Vector3(x, y, z);
            }
        }
        return new THREE.Vector3(0, this.game.world.getHeightAt(0,0) + this.height, 0); // Fallback
    }

    onKeyDown(event) {
        if (!this.controls.isLocked && event.key !== 'Escape' && event.key.toLowerCase() !== 'e' && event.key.toLowerCase() !== 'c' && event.key.toLowerCase() !== 'b') return;

        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': if (this.isOnGround) this.wantsToJump = true; break;
            case 'ShiftLeft': this.isRunning = true; break;
            case 'KeyR': // Rotate building ghost
                if (this.game.building.ghostObject) {
                    this.game.building.rotateGhost();
                }
                break;
            case 'KeyF': // General interaction or use equipped item action
                 this.performPrimaryAction();
                 break;

        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'ShiftLeft': this.isRunning = false; break;
        }
    }
    
    performPrimaryAction() { // Corresponds to left mouse click or F key
        if (this.game.building.ghostObject && this.game.building.selectedBuildable) {
            if (this.game.building.placeBuildable()) {
                this.game.ui.showNotification("Placed " + this.game.building.selectedBuildable.name);
                // Keep selected buildable if player has more, otherwise cancel.
                if (!this.game.inventory.hasItem(this.game.building.selectedBuildable.id, 1)) {
                     this.game.building.cancelPlacement();
                }
            } else {
                this.game.ui.showNotification("Cannot place here.");
            }
            return;
        }
        
        // If not building, perform attack/harvest
        if (this.attackCooldown > 0) return;
        this.isAttacking = true;
        this.attackCooldown = this.attackCooldownTime;
        this.animateToolSwing();

        // Raycast for interaction
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.game.camera); // Center of screen
        const intersects = this.raycaster.intersectObjects(this.game.scene.children, true);

        let targetHit = false;
        if (intersects.length > 0) {
            for (const hit of intersects) {
                if (hit.object === this.playerObject || (this.toolMesh && hit.object === this.toolMesh)) continue; // Ignore self/tool
                if (hit.object.userData.isWater) continue;


                const distance = hit.distance;
                const object = hit.object.parent && hit.object.parent.userData.type ? hit.object.parent : hit.object; // Handle GLTF children

                if (object.userData.type === 'resource' && distance <= this.interactionDistance) {
                    this.game.resources.harvestResource(object, hit.point, this.equippedItem);
                    targetHit = true;
                    break;
                } else if (object.userData.type === 'animal' && distance <= this.attackDistance) {
                    this.game.animals.attackAnimal(object, this.equippedItem ? (getItemData(this.equippedItem.id).damage || 1) : 1);
                    targetHit = true;
                    break;
                }
                 // Prevent interacting through walls / very close objects by checking the first non-player hit
                if (object !== this.playerObject && (!this.toolMesh || object !== this.toolMesh)) break;

            }
        }
         if (!targetHit && this.equippedItem && getItemData(this.equippedItem.id).type === 'tool') {
             // Air swing sound or something
         }
    }
    
    performAction(itemData) { // Called by inventory.useEquippedItem for tools/weapons
        // This is now mostly handled by performPrimaryAction.
        // Could be used for special tool actions in the future.
        console.log("Player performing action with:", itemData ? itemData.name : "Bare hands");
    }


    animateToolSwing() {
        if (!this.toolMesh || !this.toolMesh.visible) return;

        const startRotation = this.toolMesh.rotation.clone();
        const swingAngle = -Math.PI / 2; // Swing down

        // Quick swing animation using GSAP or a simple tween
        let progress = 0;
        const duration = this.attackCooldownTime * 0.6; // Swing part of the cooldown
        const animate = () => {
            progress += this.game.clock.getDelta() / duration;
            if (progress >= 1) {
                this.toolMesh.rotation.copy(startRotation);
                this.isAttacking = false;
                return;
            }
            // Parabolic swing: out and back
            const currentAngle = Math.sin(progress * Math.PI) * swingAngle;
            this.toolMesh.rotation.x = startRotation.x + currentAngle;
            requestAnimationFrame(animate);
        };
        animate();
    }

    updateMovement(deltaTime) {
        const speed = (this.isRunning ? this.runSpeed : this.moveSpeed) * deltaTime;
        const previousY = this.playerObject.position.y;

        // Apply gravity
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // Movement
        this.direction.set(0, 0, 0);
        if (this.moveForward) this.direction.z = -1;
        if (this.moveBackward) this.direction.z = 1;
        if (this.moveLeft) this.direction.x = -1;
        if (this.moveRight) this.direction.x = 1;

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
            // Move relative to camera look direction
            this.playerObject.translateX(this.direction.x * speed);
            this.playerObject.translateZ(this.direction.z * speed);
        }
        
        // Jumping
        if (this.wantsToJump && this.isOnGround) {
            this.velocity.y = Math.sqrt(2 * this.jumpHeight * Math.abs(this.gravity)); // Kinematic equation: v^2 = u^2 + 2as => v = sqrt(2as)
            this.isOnGround = false;
            this.wantsToJump = false;
        }
        
        this.playerObject.position.y += this.velocity.y * deltaTime;

        // Ground collision
        const groundHeight = this.game.world.getHeightAt(this.playerObject.position.x, this.playerObject.position.z);
        const playerFeetY = this.playerObject.position.y - this.height / 2;

        if (playerFeetY <= groundHeight) {
            this.playerObject.position.y = groundHeight + this.height / 2;
            this.velocity.y = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // Simple world bounds collision
        const worldBoundary = this.game.world.size / 2 - 1;
        this.playerObject.position.x = Math.max(-worldBoundary, Math.min(worldBoundary, this.playerObject.position.x));
        this.playerObject.position.z = Math.max(-worldBoundary, Math.min(worldBoundary, this.playerObject.position.z));

        // Update camera to follow player object's y if not using PointerLockControls for Y.
        // this.game.camera.position.y = this.playerObject.position.y; // This might not be needed if camera is child

        if (this.isRunning && this.direction.lengthSq() > 0) {
            this.hunger -= this.hungerDecreaseRate * 1.5 * deltaTime; // Faster when running
            this.thirst -= this.thirstDecreaseRate * 1.5 * deltaTime;
        }
    }


    updateStats(deltaTime) {
        this.hunger = Math.max(0, this.hunger - this.hungerDecreaseRate * deltaTime);
        this.thirst = Math.max(0, this.thirst - this.thirstDecreaseRate * deltaTime);
        
        if (this.hunger <= 0) {
            this.takeDamage(0.5 * deltaTime, "starvation"); // Damage per second
        }
        if (this.thirst <= 0) {
            this.takeDamage(0.75 * deltaTime, "dehydration"); // Damage per second
        }
        
        if (this.health <= 0 && !this.game.paused) { // Ensure die is called once
            this.die();
        }
        this.updateStatsUI();
    }

    updateStatsUI() {
        document.getElementById('health-fill').style.width = `${(this.health / this.maxHealth) * 100}%`;
        document.getElementById('hunger-fill').style.width = `${(this.hunger / this.maxHunger) * 100}%`;
        document.getElementById('thirst-fill').style.width = `${(this.thirst / this.maxThirst) * 100}%`;
    }
    
    updateEquippedItem() {
        const inventoryItem = this.game.inventory.getSelectedItem();
        if (inventoryItem) {
            this.equippedItem = getItemData(inventoryItem.id);
            this.toolMesh.visible = true;
            // TODO: Change toolMesh geometry/material based on equippedItem.type or specific ID
            // For now, just change color slightly
            if (this.equippedItem.type === 'tool') this.toolMesh.material.color.setHex(0xCD853F); // Peru
            else if (this.equippedItem.type === 'weapon') this.toolMesh.material.color.setHex(0x708090); // SlateGray
            else if (this.equippedItem.type === 'placeable') this.toolMesh.material.color.setHex(0x8FBC8F); // DarkSeaGreen
            else this.toolMesh.material.color.setHex(0xD2B48C); // Tan

            if (this.equippedItem.lightSource) {
                if (!this.toolMesh.userData.light) {
                    const light = new THREE.PointLight(
                        this.equippedItem.lightSource.color,
                        this.equippedItem.lightSource.intensity,
                        this.equippedItem.lightSource.distance
                    );
                    this.toolMesh.add(light); // Add to toolmesh so it moves with it
                    this.toolMesh.userData.light = light;
                }
                this.toolMesh.userData.light.visible = true;
            } else if (this.toolMesh.userData.light) {
                this.toolMesh.userData.light.visible = false;
            }

        } else {
            this.equippedItem = null;
            this.toolMesh.visible = false;
            if (this.toolMesh.userData.light) {
                this.toolMesh.userData.light.visible = false;
            }
        }
    }


    eat(foodData) { // foodData is from ItemData
        this.hunger = Math.min(this.maxHunger, this.hunger + (foodData.hungerValue || 0));
        this.thirst = Math.min(this.maxThirst, this.thirst + (foodData.thirstValue || 0));
        this.health = Math.min(this.maxHealth, this.health + (foodData.healthValue || 0));
        this.updateStatsUI();
    }

    drink(beverageData) {
        this.thirst = Math.min(this.maxThirst, this.thirst + (beverageData.thirstValue || 0));
        this.hunger = Math.min(this.maxHunger, this.hunger + (beverageData.hungerValue || 0));
        this.health = Math.min(this.maxHealth, this.health + (beverageData.healthValue || 0));
        this.updateStatsUI();
    }

    takeDamage(amount, source = "unknown") {
        this.health = Math.max(0, this.health - amount);
        this.flashDamage();
        this.updateStatsUI();
        console.log(`Player took ${amount} damage from ${source}. Health: ${this.health}`);
        // if (this.health <= 0) this.die(); // Checked in updateStats to avoid multiple calls
    }

    flashDamage() {
        const overlay = document.createElement('div');
        // ... (keep existing flashDamage logic)
        overlay.style.position = 'fixed'; // Use fixed for full screen overlay
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999'; // Very high z-index
        overlay.style.opacity = '1';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                     overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }, 50); // Start fading out quickly
    }

    die() {
        console.log("Player died.");
        this.game.paused = true;
        this.controls.unlock();
        
        const gameOverDiv = document.createElement('div');
        // ... (keep existing die logic)
        gameOverDiv.id = "gameOverScreen";
        gameOverDiv.style.position = 'fixed';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.padding = '30px';
        gameOverDiv.style.border = '2px solid #555';
        gameOverDiv.style.borderRadius = '10px';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.zIndex = '10000';
        gameOverDiv.innerHTML = `
            <h2 style="color: #e74c3c; font-size: 2em;">You Died</h2>
            <p>You survived for ${Math.floor(this.game.gameTime)} seconds.</p>
            <button id="respawnButton" style="padding: 12px 25px; margin-top: 25px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 1em;">Respawn</button>
        `;
        document.body.appendChild(gameOverDiv);
        
        document.getElementById('respawnButton').addEventListener('click', () => {
            document.body.removeChild(gameOverDiv);
            this.respawn(); // This will re-lock controls
        }, { once: true }); // Ensure event listener is removed
    }

    respawn() {
        this.spawn(); // Resets stats and position
        this.game.paused = false;
        // Controls are locked in spawn() if not already
    }

    update(deltaTime) {
        if (this.game.paused) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        } else {
            this.isAttacking = false;
        }
        
        if (this.controls.isLocked) {
            this.updateMovement(deltaTime);
        }
        this.updateStats(deltaTime);
    }
}
```

**6. Update `js/animals.js`**

```javascript
// animals.js

class AnimalSystem {
    constructor(game) {
        this.game = game;
        this.animals = [];
        this.animalTypes = this.setupAnimalTypes();
        this.maxAnimals = 10; // Reduced for testing
        this.spawnRadiusMin = 30; // Min distance from player to spawn
        this.spawnRadiusMax = 70; // Max distance from player to spawn
        this.despawnRadius = 100;
        this.spawnInterval = 15; // Seconds
        this.timeSinceLastSpawn = 0;
        this.loader = new THREE.GLTFLoader();
    }
    
    setupAnimalTypes() {
         // (Keep your existing animalTypes, ensure model paths are correct or add placeholder logic)
        return {
            'deer': {
                name: 'Deer',
                modelPath: 'assets/models/deer.glb', // Ensure these paths exist
                scale: new THREE.Vector3(0.8, 0.8, 0.8),
                speed: 2.5,
                health: 30,
                drops: [ /* ... */ ],
                behavior: 'passive_flee', fleeDistance: 10,
                spawnChance: 0.4, minGroup: 1, maxGroup: 3,
                biomes: ['forest', 'plains']
            },
            'wolf': {
                name: 'Wolf',
                modelPath: 'assets/models/wolf.glb',
                scale: new THREE.Vector3(0.7, 0.7, 0.7),
                speed: 3.5, health: 40, damage: 8, attackRange: 1.8, attackSpeed: 1.2, // attacks per sec
                drops: [ /* ... */ ],
                behavior: 'aggressive', detectionRange: 20,
                spawnChance: 0.2, minGroup: 2, maxGroup: 4,
                biomes: ['forest', 'mountains']
            },
            'rabbit': {
                name: 'Rabbit',
                modelPath: 'assets/models/rabbit.glb',
                scale: new THREE.Vector3(0.4, 0.4, 0.4),
                speed: 3, health: 10,
                drops: [ /* ... */ ],
                behavior: 'skittish_flee', fleeDistance: 8,
                spawnChance: 0.5, minGroup: 1, maxGroup: 3,
                biomes: ['plains', 'forest']
            },
             'bear': {
                name: 'Bear',
                modelPath: 'assets/models/bear.glb',
                scale: new THREE.Vector3(1.2, 1.2, 1.2),
                speed: 3, health: 120, damage: 25, attackRange: 2.5, attackSpeed: 0.8,
                drops: [ /* ... */ ],
                behavior: 'territorial_aggressive', territoryRange: 15, detectionRange: 25,
                spawnChance: 0.05, minGroup: 1, maxGroup: 1,
                biomes: ['forest', 'mountains']
            },
            // Fish would need underwater pathfinding - simpler for now
            // 'fish': { /* ... */ behavior: 'water_wander', ... } 
        };
    }

    spawnInitialAnimals() {
        for(let i=0; i < this.maxAnimals / 2; i++) { // Spawn a few initially
            this.trySpawnGroup();
        }
    }
    
    trySpawnGroup() {
        if (this.animals.length >= this.maxAnimals) return;
        
        const playerPos = this.game.player.position;
        const biome = this.game.world.getBiomeAt(playerPos);
        
        const eligible = Object.entries(this.animalTypes).filter(([key, data]) =>
            data.biomes.includes(biome) || (data.biomes.includes('any') && biome !== 'water')
        );
        if (eligible.length === 0) return;
        
        const totalChance = eligible.reduce((sum, [_, data]) => sum + data.spawnChance, 0);
        let rand = Math.random() * totalChance;
        let chosenTypeKey = null;
        for (const [key, data] of eligible) {
            rand -= data.spawnChance;
            if (rand <= 0) {
                chosenTypeKey = key;
                break;
            }
        }
        if (!chosenTypeKey) chosenTypeKey = eligible[0][0]; // Fallback

        const animalData = this.animalTypes[chosenTypeKey];
        const groupSize = getRandomInt(animalData.minGroup, animalData.maxGroup);
        
        let attempts = 0;
        let groupSpawned = 0;
        while(attempts < 10 && groupSpawned < groupSize) {
            attempts++;
            const angle = Math.random() * Math.PI * 2;
            const distance = this.spawnRadiusMin + Math.random() * (this.spawnRadiusMax - this.spawnRadiusMin);
            const spawnX = playerPos.x + Math.cos(angle) * distance;
            const spawnZ = playerPos.z + Math.sin(angle) * distance;
            const spawnY = this.game.world.getHeightAt(spawnX, spawnZ);

            if (spawnY < this.game.world.waterLevel + 0.2) continue; // Don't spawn in water

            const spawnPos = new THREE.Vector3(spawnX, spawnY, spawnZ);
            
            // Check distance from other animals (simple check)
            let tooCloseToOtherAnimal = false;
            for(const animal of this.animals) {
                if (animal.mesh.position.distanceTo(spawnPos) < 5) { // Min 5m between animals
                    tooCloseToOtherAnimal = true;
                    break;
                }
            }
            if(tooCloseToOtherAnimal) continue;


            if (this.createAnimal(chosenTypeKey, spawnPos)) {
                groupSpawned++;
            }
        }
    }
    
    createAnimal(typeKey, position) {
        const data = this.animalTypes[typeKey];
        if (!data) return false;

        const animal = {
            id: generateUUID(),
            type: typeKey,
            data: data,
            mesh: null,
            health: data.health,
            maxHealth: data.health,
            state: 'idle', // idle, wander, flee, attack, dead
            targetPosition: null,
            stateTime: 0,
            attackCooldown: 0,
        };

        if (data.modelPath) {
            this.loader.load(data.modelPath, (gltf) => {
                animal.mesh = gltf.scene;
                animal.mesh.position.copy(position);
                animal.mesh.scale.copy(data.scale || new THREE.Vector3(1,1,1));
                animal.mesh.rotation.y = Math.random() * Math.PI * 2; // Random initial rotation

                animal.mesh.userData = { type: 'animal', animalId: animal.id, parentInstance: animal };
                animal.mesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        // child.receiveShadow = true; // Animals usually don't receive shadows on themselves from environment
                    }
                });
                this.game.scene.add(animal.mesh);
                this.animals.push(animal);
            }, undefined, (error) => {
                console.error(`Failed to load animal model ${data.modelPath}:`, error);
                this.createPlaceholderAnimal(animal, position); // Fallback
            });
        } else {
            this.createPlaceholderAnimal(animal, position);
        }
        return true; // Assuming async load will eventually add it
    }

    createPlaceholderAnimal(animalInstance, position) {
        const data = animalInstance.data;
        let geometry, color;
        // Basic shapes for placeholders
        switch(animalInstance.type) {
            case 'deer': geometry = new THREE.BoxGeometry(0.6, 1.2, 1.5); color = 0x964B00; break; // Brown
            case 'wolf': geometry = new THREE.BoxGeometry(0.5, 0.8, 1.2); color = 0x808080; break; // Gray
            case 'rabbit': geometry = new THREE.BoxGeometry(0.3, 0.3, 0.5); color = 0xD2B48C; break; // Tan
            case 'bear': geometry = new THREE.BoxGeometry(0.8, 1.5, 2.0); color = 0x5C4033; break; // DarkBrown
            default: geometry = new THREE.SphereGeometry(0.5); color = 0xFF00FF; // Magenta
        }
        const material = new THREE.MeshLambertMaterial({color: color});
        animalInstance.mesh = new THREE.Mesh(geometry, material);
        animalInstance.mesh.position.copy(position);
        animalInstance.mesh.scale.copy(data.scale || new THREE.Vector3(1,1,1));
        animalInstance.mesh.userData = { type: 'animal', animalId: animalInstance.id, parentInstance: animalInstance };
        animalInstance.mesh.castShadow = true;
        this.game.scene.add(animalInstance.mesh);
        this.animals.push(animalInstance);
        console.warn(`Using placeholder for animal ${animalInstance.type}`);
    }


    update(deltaTime) {
        this.timeSinceLastSpawn += deltaTime;
        if (this.timeSinceLastSpawn >= this.spawnInterval) {
            this.trySpawnGroup();
            this.timeSinceLastSpawn = 0;
        }

        const playerPos = this.game.player.position;

        for (let i = this.animals.length - 1; i >= 0; i--) {
            const animal = this.animals[i];
            if (!animal.mesh) continue; // Model not loaded yet

            // Despawn if too far or dead for too long
            const distanceToPlayer = animal.mesh.position.distanceTo(playerPos);
            if (distanceToPlayer > this.despawnRadius || (animal.state === 'dead' && animal.stateTime > 60)) {
                this.game.scene.remove(animal.mesh);
                this.animals.splice(i, 1);
                continue;
            }

            animal.stateTime += deltaTime;
            if (animal.attackCooldown > 0) animal.attackCooldown -= deltaTime;

            if (animal.state === 'dead') continue;

            this.updateAnimalBehavior(animal, playerPos, distanceToPlayer, deltaTime);
            this.moveAnimal(animal, deltaTime);
        }
    }

    updateAnimalBehavior(animal, playerPos, distanceToPlayer, deltaTime) {
        const data = animal.data;

        // Fleeing takes priority
        if (animal.state === 'flee') {
            if (distanceToPlayer > (data.fleeDistance || 10) + 10) { // Fled far enough
                this.setAnimalState(animal, 'idle');
            } else {
                const fleeDirection = animal.mesh.position.clone().sub(playerPos).normalize();
                animal.targetPosition = animal.mesh.position.clone().add(fleeDirection.multiplyScalar(data.speed * 2));
            }
            return;
        }
        
        // Behavior-specific logic
        switch (data.behavior) {
            case 'passive_flee':
                if (distanceToPlayer < (data.fleeDistance || 10)) {
                    this.setAnimalState(animal, 'flee');
                } else if (animal.state === 'idle' && animal.stateTime > getRandomFloat(5, 15)) {
                    this.setAnimalState(animal, 'wander');
                } else if (animal.state === 'wander' && (animal.mesh.position.distanceTo(animal.targetPosition) < 1 || animal.stateTime > 20)) {
                     this.setAnimalState(animal, 'idle');
                }
                break;

            case 'skittish_flee': // Similar to passive, but maybe flees further or faster
                 if (distanceToPlayer < (data.fleeDistance || 8)) {
                    this.setAnimalState(animal, 'flee');
                } else if (animal.state === 'idle' && animal.stateTime > getRandomFloat(3, 10)) {
                    this.setAnimalState(animal, 'wander');
                } else if (animal.state === 'wander' && (animal.mesh.position.distanceTo(animal.targetPosition) < 1 || animal.stateTime > 15)) {
                     this.setAnimalState(animal, 'idle');
                }
                break;

            case 'aggressive':
                if (distanceToPlayer < data.attackRange && animal.attackCooldown <= 0) {
                    this.setAnimalState(animal, 'attack');
                    this.game.player.takeDamage(data.damage, data.name);
                    animal.attackCooldown = 1 / data.attackSpeed;
                } else if (distanceToPlayer < (data.detectionRange || 15) && distanceToPlayer > data.attackRange) {
                    this.setAnimalState(animal, 'chase');
                    animal.targetPosition = playerPos.clone();
                } else if (animal.state !== 'chase' && animal.state !== 'attack') {
                    if (animal.state === 'idle' && animal.stateTime > getRandomFloat(5,10)) this.setAnimalState(animal, 'wander');
                    else if (animal.state === 'wander' && (animal.mesh.position.distanceTo(animal.targetPosition) < 1 || animal.stateTime > 20)) this.setAnimalState(animal, 'idle');
                } else if (animal.state === 'chase' && distanceToPlayer > (data.detectionRange || 15) + 5) { // Lost player
                    this.setAnimalState(animal, 'idle');
                }
                break;
            
            case 'territorial_aggressive':
                if (distanceToPlayer < data.attackRange && animal.attackCooldown <=0) {
                    this.setAnimalState(animal, 'attack');
                    this.game.player.takeDamage(data.damage, data.name);
                    animal.attackCooldown = 1 / data.attackSpeed;
                } else if (distanceToPlayer < (data.territoryRange || 10)) { // Player in territory
                     this.setAnimalState(animal, 'chase');
                     animal.targetPosition = playerPos.clone();
                } else if (distanceToPlayer < (data.detectionRange || 20) && animal.state !== 'chase') { // Player nearby, but not in territory yet
                     // Stare or make a warning sound? For now, just wander.
                     if (animal.state === 'idle' && animal.stateTime > 3) this.setAnimalState(animal, 'wander');
                } else { // Player far away
                    if (animal.state === 'idle' && animal.stateTime > getRandomFloat(8,18)) this.setAnimalState(animal, 'wander');
                    else if (animal.state === 'wander' && (animal.mesh.position.distanceTo(animal.targetPosition) < 1 || animal.stateTime > 25)) this.setAnimalState(animal, 'idle');
                    else if (animal.state === 'chase' && distanceToPlayer > (data.territoryRange || 10) + 5) { // Player left territory
                        this.setAnimalState(animal, 'idle');
                    }
                }
                break;

            // Default: simple wander
            default: 
                if (animal.state === 'idle' && animal.stateTime > getRandomFloat(5, 15)) {
                    this.setAnimalState(animal, 'wander');
                } else if (animal.state === 'wander' && (animal.mesh.position.distanceTo(animal.targetPosition) < 1 || animal.stateTime > 20)) {
                     this.setAnimalState(animal, 'idle');
                }
        }
    }

    setAnimalState(animal, newState) {
        if (animal.state === newState) return;
        // console.log(`Animal ${animal.type} changing from ${animal.state} to ${newState}`);
        animal.state = newState;
        animal.stateTime = 0;

        if (newState === 'wander') {
            const wanderDistance = 10;
            const angle = Math.random() * Math.PI * 2;
            animal.targetPosition = new THREE.Vector3(
                animal.mesh.position.x + Math.cos(angle) * wanderDistance,
                animal.mesh.position.y, // Y will be set by ground
                animal.mesh.position.z + Math.sin(angle) * wanderDistance
            );
        } else if (newState === 'idle') {
            animal.targetPosition = null;
        }
    }

    moveAnimal(animal, deltaTime) {
        if (!animal.targetPosition || animal.state === 'idle' || animal.state === 'attack') return;

        const moveDirection = animal.targetPosition.clone().sub(animal.mesh.position);
        const groundY = this.game.world.getHeightAt(animal.mesh.position.x, animal.mesh.position.z);
        animal.mesh.position.y = groundY; // Stick to ground
        
        moveDirection.y = 0; // Animals move on XZ plane for now
        if (moveDirection.lengthSq() < 0.1) { // Reached target
            if(animal.state === 'wander' || animal.state === 'flee') this.setAnimalState(animal, 'idle');
            return;
        }
        moveDirection.normalize();

        animal.mesh.position.add(moveDirection.multiplyScalar(animal.data.speed * deltaTime));
        animal.mesh.lookAt(animal.mesh.position.x + moveDirection.x, animal.mesh.position.y, animal.mesh.position.z + moveDirection.z);
    }

    attackAnimal(animalObject, damage) { // animalObject is the mesh
        const animalInstance = this.animals.find(a => a.mesh === animalObject || (a.mesh && a.mesh.children.includes(animalObject)));
        if (!animalInstance || animalInstance.state === 'dead') return;
        
        animalInstance.health -= damage;
        // console.log(`${animalInstance.data.name} took ${damage} damage, health: ${animalInstance.health}`);

        if (animalInstance.health <= 0) {
            this.setAnimalState(animalInstance, 'dead');
            // TODO: Handle drops
            this.dropLoot(animalInstance);
            // Make animal fall or play death animation
            if (animalInstance.mesh) {
                // simple fall:
                // animalInstance.mesh.rotation.x = Math.PI / 2; 
            }
        } else {
            // Animal might become aggressive or flee
            if (animalInstance.data.behavior === 'passive_flee' || animalInstance.data.behavior === 'skittish_flee') {
                this.setAnimalState(animalInstance, 'flee');
            } else if (animalInstance.data.behavior !== 'aggressive' && animalInstance.data.behavior !== 'territorial_aggressive') {
                 // If not already aggressive, become aggressive (e.g. defensive boar)
                 this.setAnimalState(animalInstance, 'chase'); // Or a specific 'enraged' state
                 animalInstance.targetPosition = this.game.player.position.clone();
            }
        }
    }

    dropLoot(animal) {
        if (!animal.mesh) return;
        animal.data.drops.forEach(drop => {
            if (Math.random() <= drop.chance) {
                const count = getRandomInt(drop.count.min, drop.count.max);
                if (count > 0) {
                    // For now, directly add to player inventory.
                    // Ideally, spawn a small loot bag or items on the ground.
                    this.game.inventory.addItem(drop.item, count);
                    this.game.ui.showNotification(`Picked up ${count}x ${getItemData(drop.item).name}`);
                }
            }
        });
    }
}
```

**7. Update `js/building.js`**

```javascript
// building.js

class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.selectedBuildable = null; // This will be the ItemData object for the buildable
        this.placementValid = false;
        this.buildables = this.setupBuildables(); // This is config for actual placed structures
        
        this.gridSize = 1.0; 
        this.ghostMaterial = new THREE.MeshLambertMaterial({ // Use Lambert for ghost for now
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6,
            emissive: 0x00ff00, // Make it glow a bit
            emissiveIntensity: 0.3
        });
        this.invalidMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.6,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        this.ghostObject = null;
        this.placedBuildings = []; // Array of { id, mesh, buildableId, position, rotation, data (e.g. for storage) }
        this.loader = new THREE.GLTFLoader();
    }
    
    // buildables defines the properties of placed structures
    setupBuildables() {
        return {
            'wooden_wall': {
                name: 'Wooden Wall',
                modelPath: 'assets/models/wooden_wall.glb', // Path to the actual model
                icon: 'assets/ui/icons/wooden_wall_icon.png', // UI Icon
                collisionSize: { width: 0.2, height: 3, depth: 2 }, // Size for collision and ghost
                offset: { x: 0, y: 1.5, z: 0 }, // Offset from grid point to center of model base
                rotatable: true,
                snapsToGrid: true,
                category: 'wall'
            },
            'wooden_floor': {
                name: 'Wooden Floor',
                modelPath: 'assets/models/wooden_floor.glb',
                icon: 'assets/ui/icons/wooden_floor_icon.png',
                collisionSize: { width: 2, height: 0.2, depth: 2 },
                offset: { x: 0, y: 0.1, z: 0 },
                rotatable: false,
                snapsToGrid: true,
                category: 'floor'
            },
            'wooden_door': {
                name: 'Wooden Door',
                modelPath: 'assets/models/wooden_door.glb',
                icon: 'assets/ui/icons/wooden_door_icon.png',
                collisionSize: { width: 0.2, height: 2.8, depth: 1.8 }, // slightly smaller than wall for frame
                offset: { x: 0, y: 1.4, z: 0 },
                rotatable: true,
                interactive: true, action: 'toggleDoor',
                snapsToGrid: true,
                category: 'door'
            },
            'campfire': {
                name: 'Campfire',
                modelPath: 'assets/models/campfire_lit.glb', // Or have a lit/unlit version
                icon: 'assets/ui/icons/campfire_icon.png',
                collisionSize: { radius: 0.6, height: 0.5 }, // Cylindrical
                offset: { x: 0, y: 0.25, z: 0 },
                rotatable: false,
                interactive: true, action: 'openCampfire',
                snapsToGrid: false, // Usually placed more freely
                lightSource: { color: 0xff8800, intensity: 1.5, distance: 10, height: 0.5 },
                category: 'utility'
            },
             'crafting_table': {
                name: 'Crafting Table',
                modelPath: 'assets/models/crafting_table.glb',
                icon: 'assets/ui/icons/crafting_table_icon.png',
                collisionSize: { width: 1.5, height: 1, depth: 0.8 },
                offset: { x: 0, y: 0.5, z: 0 },
                rotatable: true,
                interactive: true, action: 'openCraftingTable',
                snapsToGrid: false,
                category: 'utility'
            },
            'forge': {
                name: 'Forge',
                modelPath: 'assets/models/forge.glb',
                icon: 'assets/ui/icons/forge_icon.png',
                collisionSize: { width: 1.2, height: 1.5, depth: 1.2 }, // Approx
                offset: { x: 0, y: 0.75, z: 0 },
                rotatable: true,
                interactive: true, action: 'openForge',
                snapsToGrid: false,
                lightSource: { color: 0xff4500, intensity: 1.2, distance: 6, height: 0.8, activeOnlyWhenUsed: true },
                category: 'utility'
            },
            'storage_box': {
                name: 'Storage Box',
                modelPath: 'assets/models/storage_box.glb',
                icon: 'assets/ui/icons/storage_box_icon.png',
                collisionSize: { width: 1, height: 1, depth: 0.7 },
                offset: { x: 0, y: 0.5, z: 0 },
                rotatable: true,
                interactive: true, action: 'openStorage',
                snapsToGrid: false,
                category: 'utility',
                storageSlots: 15
            }
            // Add more: foundations, roofs, windows, stairs, defensive structures etc.
        };
    }
    
    selectBuildable(itemId) { // itemId is from ItemData, e.g., 'wooden_wall_item'
        this.cancelPlacement(); // Clear any previous ghost

        const itemData = getItemData(itemId); // Get data for the item used to build
        if (!itemData || !itemData.buildableId) {
            console.warn("Item is not a valid buildable:", itemId);
            return false;
        }

        const buildableConfig = this.buildables[itemData.buildableId]; // Get config for the structure itself
        if (!buildableConfig) {
            console.warn("No buildable config for:", itemData.buildableId);
            return false;
        }

        this.selectedBuildable = { item: itemData, config: buildableConfig }; // Store both
        this.createGhostObject(this.selectedBuildable);
        this.game.ui.showNotification(`Building: ${buildableConfig.name}. Left-Click: Place, R: Rotate, Esc: Cancel`);
        return true;
    }
    
    createGhostObject(selectedBuildableData) {
        const config = selectedBuildableData.config;
        const collision = config.collisionSize;
        let geometry;

        if (collision.radius) { // Cylindrical
            geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16);
        } else { // Box
            geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth);
        }
        
        this.ghostObject = new THREE.Mesh(geometry, this.ghostMaterial);
        this.ghostObject.userData.buildableId = selectedBuildableData.item.buildableId; // Store the ID of the structure config
        this.ghostObject.userData.rotationY = 0; // Store rotation separately
        
        this.game.scene.add(this.ghostObject);
        // Initial update to position it
        this.updateGhostPosition(); 
    }
    
    updateGhostPosition() {
        if (!this.ghostObject || !this.selectedBuildable) return;
        
        const config = this.selectedBuildable.config;
        const player = this.game.player;
        const raycaster = new THREE.Raycaster();
        
        // Raycast from camera center
        raycaster.setFromCamera({x: 0, y: 0}, this.game.camera);
        
        // Intersect with terrain and existing buildings
        const collidables = [...this.game.world.getCollisionObjects(), ...this.placedBuildings.map(b => b.mesh)];
        const intersects = raycaster.intersectObjects(collidables, true); // Recursive true for complex models
        
        let hitPoint = null;
        const maxPlacementDistance = 8; // How far player can build

        if (intersects.length > 0) {
            for (const hit of intersects) {
                // Ignore self or tool if they get in the ray
                if (hit.object === player.playerObject || (player.toolMesh && hit.object === player.toolMesh) || hit.object === this.ghostObject) continue;
                if (hit.distance > maxPlacementDistance) break; // Too far
                
                hitPoint = hit.point.clone();
                break; 
            }
        }

        if (hitPoint) {
            this.ghostObject.visible = true;
            let placementPos = hitPoint;
            if (config.snapsToGrid) {
                placementPos.x = Math.round(hitPoint.x / this.gridSize) * this.gridSize;
                placementPos.z = Math.round(hitPoint.z / this.gridSize) * this.gridSize;
                // Y position should be on terrain or snapped to other structures if applicable (more complex)
                placementPos.y = this.game.world.getHeightAt(placementPos.x, placementPos.z); 
            } else {
                 placementPos.y = this.game.world.getHeightAt(hitPoint.x, hitPoint.z);
            }
            
            // Apply offset from config
            this.ghostObject.position.set(
                placementPos.x + (config.offset ? config.offset.x : 0),
                placementPos.y + (config.offset ? config.offset.y : 0),
                placementPos.z + (config.offset ? config.offset.z : 0)
            );
            this.ghostObject.rotation.y = this.ghostObject.userData.rotationY;

            this.placementValid = this.checkPlacementValidity(this.ghostObject.position, config);
            this.ghostObject.material = this.placementValid ? this.ghostMaterial : this.invalidMaterial;

        } else {
            this.ghostObject.visible = false; // Can't find valid placement point
            this.placementValid = false;
        }
    }
    
    rotateGhost() {
        if (!this.ghostObject || !this.selectedBuildable || !this.selectedBuildable.config.rotatable) return;
        this.ghostObject.userData.rotationY = (this.ghostObject.userData.rotationY + Math.PI / 2) % (Math.PI * 2);
        // Update position will apply rotation
    }
    
    checkPlacementValidity(position, buildableConfig) {
        // Check terrain (not in water, not too steep)
        const terrainHeight = this.game.world.getHeightAt(position.x, position.z);
        if (terrainHeight < this.game.world.waterLevel) return false;
        // Add slope check if needed: this.game.world.getSlopeAt(position.x, position.z)

        // Check collision with other buildings
        const ghostBox = new THREE.Box3().setFromObject(this.ghostObject); // Use ghost's current AABB
        for (const building of this.placedBuildings) {
            const buildingBox = new THREE.Box3().setFromObject(building.mesh);
            if (ghostBox.intersectsBox(buildingBox)) {
                return false;
            }
        }
        // Check collision with resources (optional)
        // for (const resource of this.game.resources.activeResources) {
        //    const resourceBox = new THREE.Box3().setFromObject(resource);
        //    if (ghostBox.intersectsBox(resourceBox)) return false;
        // }
        return true;
    }
        
    placeBuildable() {
        if (!this.ghostObject || !this.placementValid || !this.selectedBuildable) return false;
        
        const itemToConsume = this.selectedBuildable.item.id; // The item ID from inventory
        const buildableId = this.ghostObject.userData.buildableId; // The ID for buildables config
        const config = this.buildables[buildableId];

        if (!this.game.inventory.hasItem(itemToConsume, 1)) {
            this.game.ui.showNotification(`You don't have ${getItemData(itemToConsume).name}.`);
            this.cancelPlacement();
            return false;
        }
        
        this.game.inventory.removeItem(itemToConsume, 1);
        
        const position = this.ghostObject.position.clone();
        const rotationY = this.ghostObject.userData.rotationY;
        
        this.createBuilding(buildableId, position, rotationY, config);
        
        // If player has more of the item, keep ghost active, otherwise cancel.
        if (!this.game.inventory.hasItem(itemToConsume, 1)) {
            this.cancelPlacement();
        } else {
            // Refresh ghost validity for next placement
            this.updateGhostPosition();
        }
        return true;
    }
    
    createBuilding(buildableId, position, rotationY, config) {
        // Load model or use placeholder
        if (config.modelPath) {
             this.loader.load(config.modelPath, (gltf) => {
                const model = gltf.scene;
                this._finalizeBuilding(model, buildableId, position, rotationY, config);
            }, undefined, (error) => {
                console.error(`Failed to load building model ${config.modelPath}:`, error);
                this._createPlaceholderBuilding(buildableId, position, rotationY, config);
            });
        } else {
            this._createPlaceholderBuilding(buildableId, position, rotationY, config);
        }
    }

    _createPlaceholderBuilding(buildableId, position, rotationY, config) {
        const collision = config.collisionSize;
        let geometry;
        if (collision.radius) { geometry = new THREE.CylinderGeometry(collision.radius, collision.radius, collision.height, 16); }
        else { geometry = new THREE.BoxGeometry(collision.width, collision.height, collision.depth); }
        
        const material = new THREE.MeshLambertMaterial({ 
            color: buildableId.includes('wooden') ? 0x966F33 : // Lighter wood
                   buildableId === 'campfire' ? 0x505050 : 
                   0xAAAAAA 
        });
        const mesh = new THREE.Mesh(geometry, material);
        this._finalizeBuilding(mesh, buildableId, position, rotationY, config);
        console.warn("Using placeholder for building:", buildableId);
    }

    _finalizeBuilding(mesh, buildableId, position, rotationY, config) {
        mesh.position.copy(position);
        mesh.rotation.y = rotationY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            type: 'structure', // Important for raycasting interactions
            buildableId: buildableId,
            interactive: config.interactive || false,
            action: config.action || null,
            state: 'closed', // For doors, etc.
            // Add specific data if needed, e.g., for storage
        };
        if (config.storageSlots) {
            mesh.userData.storageId = `storage_${generateUUID()}`;
            this.game.structures.initializeStorage(mesh.userData.storageId, config.storageSlots);
        }
        
        this.game.scene.add(mesh);
        const placedBuildingEntry = {
            id: generateUUID(), 
            mesh: mesh,
            buildableId: buildableId,
            position: position.clone(),
            rotation: rotationY,
            config: config // Store config for easy access
        };
        this.placedBuildings.push(placedBuildingEntry);
        
        if (config.lightSource) {
            const light = new THREE.PointLight(
                config.lightSource.color,
                config.lightSource.intensity,
                config.lightSource.distance
            );
            // Position light relative to the building mesh
            const lightOffset = new THREE.Vector3(0, config.lightSource.height || 0.5, 0);
            mesh.add(light); // Add light as a child of the mesh
            light.position.copy(lightOffset); // Position relative to parent
            
            mesh.userData.light = light;
            if (config.lightSource.activeOnlyWhenUsed) {
                light.visible = false; // e.g. forge light only when smelting
            }
        }
         // Add to world collision objects if it's substantial (e.g., walls, not small items)
        if (config.category === 'wall' || config.category === 'floor' || config.category === 'door') {
            //this.game.world.addCollisionObject(mesh); // Needs world method
        }
    }
    
    cancelPlacement() {
        if (this.ghostObject) {
            this.game.scene.remove(this.ghostObject);
            if (this.ghostObject.geometry) this.ghostObject.geometry.dispose();
            if (this.ghostObject.material) this.ghostObject.material.dispose();
            this.ghostObject = null;
        }
        this.selectedBuildable = null;
        this.placementValid = false;
        this.game.ui.hideInteractionPrompt(); // Or a specific build mode prompt
    }
    
    interactWithBuilding(buildingMesh) { // buildingMesh is the THREE.Mesh object
        if (!buildingMesh || !buildingMesh.userData || !buildingMesh.userData.interactive) return;
        
        const action = buildingMesh.userData.action;
        const buildableId = buildingMesh.userData.buildableId;
        const config = this.buildables[buildableId];

        switch(action) {
            case 'toggleDoor': this.toggleDoor(buildingMesh); break;
            case 'openCampfire': this.game.structures.openCampfire(buildingMesh); break;
            case 'openCraftingTable': this.game.structures.openCraftingTable(buildingMesh); break;
            case 'openForge': this.game.structures.openForge(buildingMesh); break;
            case 'openStorage': this.game.structures.openStorage(buildingMesh); break;
            // Default:
            //     console.log("Interacted with structure:", buildingMesh.userData.buildableId);
        }
    }
    
    toggleDoor(doorMesh) {
        const isOpen = doorMesh.userData.state === 'open';
        const pivotOffset = doorMesh.geometry.parameters.depth / 2; // Assuming door pivots at one edge

        if (isOpen) {
            doorMesh.rotation.y -= Math.PI / 2;
            // Adjust position if pivot is not centered
            // doorMesh.position.x += Math.cos(doorMesh.rotation.y + Math.PI/2) * pivotOffset;
            // doorMesh.position.z += Math.sin(doorMesh.rotation.y + Math.PI/2) * pivotOffset;
            doorMesh.userData.state = 'closed';
        } else {
            doorMesh.rotation.y += Math.PI / 2;
            // doorMesh.position.x -= Math.cos(doorMesh.rotation.y) * pivotOffset;
            // doorMesh.position.z -= Math.sin(doorMesh.rotation.y) * pivotOffset;
            doorMesh.userData.state = 'open';
        }
    }
    
    update(deltaTime) {
        if (this.ghostObject) {
            this.updateGhostPosition();
        }
        // Update lights on structures (e.g. flickering campfire)
        this.placedBuildings.forEach(building => {
            if (building.mesh.userData.light && building.config.lightSource && !building.config.lightSource.activeOnlyWhenUsed) {
                if (building.buildableId === 'campfire') { // Flickering effect
                    building.mesh.userData.light.intensity = building.config.lightSource.intensity * (1 + Math.sin(this.game.gameTime * 5) * 0.1);
                }
            }
        });
    }
    
    // (Keep save/load methods, adapt them to store mesh.userData.storageId if present)
    saveBuildings() {
        return this.placedBuildings.map(b => ({
            buildableId: b.buildableId,
            position: { x: b.position.x, y: b.position.y, z: b.position.z },
            rotation: b.rotation,
            state: b.mesh.userData.state || 'closed',
            storageId: b.mesh.userData.storageId // Save storage ID
        }));
    }
    
    loadBuildings(buildingsData) {
        this.placedBuildings.forEach(b => {
            this.game.scene.remove(b.mesh);
            if (b.mesh.userData.light) b.mesh.remove(b.mesh.userData.light); // Light is child
        });
        this.placedBuildings = [];
        
        buildingsData.forEach(data => {
            const config = this.buildables[data.buildableId];
            if (config) {
                const buildingMesh = this.createBuilding(data.buildableId, new THREE.Vector3(data.position.x, data.position.y, data.position.z), data.rotation, config);
                // The actual mesh creation is async if models are loaded.
                // We need a way to apply state AFTER the mesh is created. This is tricky.
                // For now, assume _finalizeBuilding applies basic state. More complex state needs callbacks or promises.
                // A temporary solution:
                setTimeout(() => {
                    const foundBuilding = this.placedBuildings.find(pb => pb.position.x === data.position.x && pb.position.z === data.position.z && pb.buildableId === data.buildableId);
                    if (foundBuilding && foundBuilding.mesh) {
                        if (data.state) foundBuilding.mesh.userData.state = data.state;
                        if (data.buildableId === 'wooden_door' && data.state === 'open') {
                             this.toggleDoor(foundBuilding.mesh); // Call toggle to correctly set rotation based on current state
                        }
                        if(data.storageId && foundBuilding.mesh.userData) { // Restore storageId
                            foundBuilding.mesh.userData.storageId = data.storageId;
                        }
                    }
                }, 1000); // Delay to allow model loading
            }
        });
    }
}
```

**8. Update `js/structures.js`**

```javascript
// js/structures.js

class StructuresSystem {
    constructor(game) {
        this.game = game;
        this.activeStructureInstance = null; // Store the actual building mesh instance
        
        this.activeCraftingProcesses = { // Keyed by structure instance ID (mesh.uuid or custom ID)
            // e.g., 'campfire_uuid': [{ recipe, progress, totalTime, outputSlot }]
        };
        
        this.storageContainers = new Map(); // Maps storageId to array of items
        
        this.cookingRecipes = this.setupCookingRecipes();
        // Forge recipes are in CraftingSystem
    }

    initializeStorage(storageId, numSlots) {
        if (!this.storageContainers.has(storageId)) {
            this.storageContainers.set(storageId, new Array(numSlots).fill(null));
        }
    }
    
    setupCookingRecipes() {
        // (Keep your existing recipes)
        // Ensure icons are like 'assets/items/cooked_meat.png'
        return [
            {
                id: 'cooked_meat', name: 'Cooked Meat', icon: 'assets/items/cooked_meat.png',
                ingredients: [{ item: 'raw_meat', count: 1 }],
                fuel: { item: 'wood', count: 1 },
                result: { item: 'cooked_meat', count: 1 }, time: 10
            },
            {
                id: 'cooked_fish', name: 'Cooked Fish', icon: 'assets/items/cooked_fish.png',
                ingredients: [{ item: 'raw_fish', count: 1 }],
                fuel: { item: 'wood', count: 1 },
                result: { item: 'cooked_fish', count: 1 }, time: 8
            },
             {
                id: 'herb_tea', name: 'Herb Tea', icon: 'assets/items/herb_tea.png',
                ingredients: [ { item: 'herbs', count: 2 }, { item: 'water_container', count: 1, consumeContainer: false } ], // consumeContainer: false means water_container is returned empty
                fuel: { item: 'wood', count: 1 },
                result: { item: 'herb_tea', count: 1, byproducts: [{item: 'empty_water_container', count: 1}] }, // Example byproduct
                time: 5
            }
        ];
    }
    
    // Methods to open structure UIs (campfire, crafting table, forge, storage)
    // These will now take the structure's mesh as an argument
    openCampfire(campfireMesh) {
        this.activeStructureInstance = campfireMesh;
        this.game.ui.closeAllMenus(this.game.ui.campfireMenu); // Close others, keep this one target
        this.updateCampfireMenu();
        this.game.ui.campfireMenu.style.display = 'block';
        this.game.player.controls.unlock();
    }

    updateCampfireMenu() {
        if (!this.activeStructureInstance) return;
        const instanceId = this.activeStructureInstance.uuid;
        if (!this.activeCraftingProcesses[instanceId]) {
            this.activeCraftingProcesses[instanceId] = new Array(4).fill(null); // 4 cooking slots
        }
        const processes = this.activeCraftingProcesses[instanceId];

        const slotsContainer = document.getElementById('campfireSlots');
        slotsContainer.innerHTML = '<h3>Campfire</h3>'; // Title

        const grid = document.createElement('div');
        grid.className = 'structure-slots'; // Use the existing class from HTML

        for (let i = 0; i < 4; i++) { // 4 cooking slots
            const slotDiv = document.createElement('div');
            slotDiv.className = 'inventory-slot interactive-slot'; // Add a class for styling/selection
            slotDiv.dataset.slotIndex = i;

            const process = processes[i];
            if (process) {
                const itemIcon = getItemData(process.recipe.result.item).icon;
                slotDiv.innerHTML = `<img src="${itemIcon}" alt="${process.recipe.name}">`;
                // Add progress circle
                const progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                progressSvg.classList.add('progress-circle');
                const fillOffset = 157 * (1 - (process.progress / process.totalTime));
                progressSvg.innerHTML = `
                    <circle class="progress-bg" cx="30" cy="30" r="25"/>
                    <circle class="progress-fill" cx="30" cy="30" r="25" style="stroke-dashoffset: ${fillOffset}"/>`;
                slotDiv.appendChild(progressSvg);
            } else {
                slotDiv.innerHTML = `<span>Slot ${i+1}</span>`; // Placeholder
                slotDiv.onclick = () => this.showRecipeOptions(this.cookingRecipes, i, 'campfire');
            }
            grid.appendChild(slotDiv);
        }
        slotsContainer.appendChild(grid);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close Campfire';
        closeButton.onclick = () => this.closeStructureUI(this.game.ui.campfireMenu);
        slotsContainer.appendChild(closeButton);
    }
    
    openCraftingTable(tableMesh) {
        this.activeStructureInstance = tableMesh;
        this.game.ui.closeAllMenus(this.game.ui.craftingMenu);
        // Use the main crafting grid but populate with table recipes
        this.game.ui.updateCraftingMenu(this.game.crafting.craftingTableRecipes, 'crafting_table');
        document.getElementById('craftingMenu').querySelector('h2').textContent = "Crafting Table";
        this.game.ui.craftingMenu.style.display = 'block';
        this.game.player.controls.unlock();
    }

    openForge(forgeMesh) {
        this.activeStructureInstance = forgeMesh;
        this.game.ui.closeAllMenus(this.game.ui.forgeMenu);
        this.updateForgeMenu();
        this.game.ui.forgeMenu.style.display = 'block';
        this.game.player.controls.unlock();
    }

    updateForgeMenu() {
        // Similar to updateCampfireMenu, but uses forgeRecipes
        if (!this.activeStructureInstance) return;
        const instanceId = this.activeStructureInstance.uuid;
        if (!this.activeCraftingProcesses[instanceId]) {
            this.activeCraftingProcesses[instanceId] = new Array(4).fill(null); // 4 smelting slots
        }
        const processes = this.activeCraftingProcesses[instanceId];

        const slotsContainer = document.getElementById('forgeSlots');
        slotsContainer.innerHTML = '<h3>Forge</h3>';

        const grid = document.createElement('div');
        grid.className = 'structure-slots';

        for (let i = 0; i < 4; i++) { // 4 smelting slots
            const slotDiv = document.createElement('div');
            slotDiv.className = 'inventory-slot interactive-slot';
            slotDiv.dataset.slotIndex = i;

            const process = processes[i];
            if (process) {
                const itemIcon = getItemData(process.recipe.result.item).icon;
                slotDiv.innerHTML = `<img src="${itemIcon}" alt="${process.recipe.name}">`;
                // Add progress circle
                const progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                progressSvg.classList.add('progress-circle');
                const fillOffset = 157 * (1 - (process.progress / process.totalTime));
                progressSvg.innerHTML = `
                    <circle class="progress-bg" cx="30" cy="30" r="25"/>
                    <circle class="progress-fill" cx="30" cy="30" r="25" style="stroke-dashoffset: ${fillOffset}"/>`;
                slotDiv.appendChild(progressSvg);
            } else {
                slotDiv.innerHTML = `<span>Slot ${i+1}</span>`;
                slotDiv.onclick = () => this.showRecipeOptions(this.game.crafting.forgeRecipes, i, 'forge');
            }
            grid.appendChild(slotDiv);
        }
        slotsContainer.appendChild(grid);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close Forge';
        closeButton.onclick = () => this.closeStructureUI(this.game.ui.forgeMenu);
        slotsContainer.appendChild(closeButton);
    }

    showRecipeOptions(recipes, slotIndex, stationType) {
        // Generic recipe option popup
        const available = recipes.filter(r => this.game.crafting.canCraft(r, this.game.inventory.items, true)); // true to check fuel for cooking/forge

        if (available.length === 0) {
            this.game.ui.showNotification("No recipes available or missing ingredients/fuel.");
            return;
        }

        const popupId = `${stationType}RecipePopup`;
        let popup = document.getElementById(popupId);
        if (popup) popup.remove();

        popup = document.createElement('div');
        popup.id = popupId;
        // Style the popup (absolute position, scrollable, etc.)
        popup.style.position = 'fixed';
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = 'rgba(30,30,30,0.95)';
        popup.style.border = '1px solid #777';
        popup.style.padding = '15px';
        popup.style.zIndex = '1001';
        popup.style.maxHeight = '400px';
        popup.style.overflowY = 'auto';
        popup.innerHTML = `<h4>Select a Recipe for Slot ${slotIndex + 1}</h4>`;

        available.forEach(recipe => {
            const itemData = getItemData(recipe.result.item);
            const div = document.createElement('div');
            div.className = 'recipe-option'; // Style this
            div.innerHTML = `<img src="${itemData.icon}" style="width:32px; height:32px; margin-right:8px;" alt="${itemData.name}"> ${itemData.name}`;
            div.onclick = () => {
                this.startStationCrafting(recipe.id, slotIndex, stationType);
                popup.remove();
            };
            popup.appendChild(div);
        });
        const cancelButton = document.createElement('button');
        cancelButton.textContent = "Cancel";
        cancelButton.onclick = () => popup.remove();
        popup.appendChild(cancelButton);
        document.body.appendChild(popup);
    }

    startStationCrafting(recipeId, slotIndex, stationType) {
        if (!this.activeStructureInstance) return;
        const instanceId = this.activeStructureInstance.uuid;

        let recipe;
        if (stationType === 'campfire') recipe = this.cookingRecipes.find(r => r.id === recipeId);
        else if (stationType === 'forge') recipe = this.game.crafting.forgeRecipes.find(r => r.id === recipeId);
        else return;

        if (!recipe) return;

        // Consume ingredients & fuel
        if (!this.game.crafting.canCraft(recipe, this.game.inventory.items, true)) {
             this.game.ui.showNotification("Cannot start: Missing ingredients or fuel.");
             return;
        }
        recipe.ingredients.forEach(ing => this.game.inventory.removeItem(ing.item, ing.count));
        if (recipe.fuel) this.game.inventory.removeItem(recipe.fuel.item, recipe.fuel.count);
        
        this.activeCraftingProcesses[instanceId][slotIndex] = {
            recipe: recipe,
            progress: 0,
            totalTime: recipe.time,
        };

        if (stationType === 'campfire') this.updateCampfireMenu();
        else if (stationType === 'forge') this.updateForgeMenu();
    }


    closeStructureUI(menuElement) {
        if (menuElement) menuElement.style.display = 'none';
        this.activeStructureInstance = null;
        this.game.player.controls.lock();
        const popup = document.getElementById('campfireRecipePopup') || document.getElementById('forgeRecipePopup');
        if(popup) popup.remove();
    }

    // For storage boxes
    openStorage(storageMesh) {
        this.activeStructureInstance = storageMesh;
        const storageId = storageMesh.userData.storageId;
        if (!storageId || !this.storageContainers.has(storageId)) {
            console.error("Storage not initialized for this container.");
            this.game.ui.showNotification("Error: Storage container not found.");
            return;
        }

        this.game.ui.closeAllMenus(null); // Close all other menus
        // Need a dedicated storage UI - for now, let's make a simple one in this.game.ui
        this.game.ui.showStorageMenu(storageId, this.storageContainers.get(storageId));
        this.game.player.controls.unlock();
    }

    update(deltaTime) {
        for (const instanceId in this.activeCraftingProcesses) {
            const processes = this.activeCraftingProcesses[instanceId];
            let menuNeedsUpdate = false;
            for (let i = 0; i < processes.length; i++) {
                const process = processes[i];
                if (process) {
                    process.progress += deltaTime;
                    if (process.progress >= process.totalTime) {
                        this.game.inventory.addItem(process.recipe.result.item, process.recipe.result.count);
                        if (process.recipe.result.byproducts) {
                            process.recipe.result.byproducts.forEach(bp => {
                                this.game.inventory.addItem(bp.item, bp.count);
                            });
                        }
                        this.game.ui.showNotification(`Finished: ${process.recipe.name}`);
                        processes[i] = null;
                        menuNeedsUpdate = true;
                    }
                }
            }
            if (menuNeedsUpdate && this.activeStructureInstance && this.activeStructureInstance.uuid === instanceId) {
                const type = this.activeStructureInstance.userData.buildableId;
                if (type === 'campfire') this.updateCampfireMenu();
                else if (type === 'forge') this.updateForgeMenu();
            }
        }

        // Structure-specific updates (e.g., forge light only when active)
        if (this.game.building && this.game.building.placedBuildings) {
            this.game.building.placedBuildings.forEach(buildingEntry => {
                if (buildingEntry.config.lightSource && buildingEntry.config.lightSource.activeOnlyWhenUsed) {
                    const light = buildingEntry.mesh.userData.light;
                    if (light) {
                        const processes = this.activeCraftingProcesses[buildingEntry.mesh.uuid];
                        const isActive = processes && processes.some(p => p !== null);
                        light.visible = isActive;
                    }
                }
            });
        }
    }

    // Save/Load
    saveStructuresData() {
        // Convert Map to a serializable format (array of [key, value] pairs)
        const serializableStorage = Array.from(this.storageContainers.entries());
        return {
            activeCraftingProcesses: this.activeCraftingProcesses, // May need deep clone if recipes contain non-serializable data
            storageContainers: serializableStorage,
        };
    }

    loadStructuresData(data) {
        if (data.activeCraftingProcesses) {
            this.activeCraftingProcesses = data.activeCraftingProcesses;
        }
        if (data.storageContainers) {
            this.storageContainers = new Map(data.storageContainers);
        }
    }
}

// Add to UI class for storage:
/*
UI.prototype.showStorageMenu = function(storageId, items) {
    this.closeAllMenus(this.storageMenuElement); // Assuming you add a storageMenuElement
    if (!this.storageMenuElement) { // Create if not exists
        this.storageMenuElement = document.createElement('div');
        this.storageMenuElement.id = "storageMenu";
        // Style it like other menus
        this.storageMenuElement.style.position = 'absolute';
        this.storageMenuElement.style.top = '50%';
        this.storageMenuElement.style.left = '50%';
        this.storageMenuElement.style.transform = 'translate(-50%, -50%)';
        this.storageMenuElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
        this.storageMenuElement.style.color = 'white';
        this.storageMenuElement.style.padding = '20px';
        this.storageMenuElement.style.borderRadius = '5px';
        this.storageMenuElement.style.zIndex = '100';
        this.storageMenuElement.style.width = '60%';
        this.storageMenuElement.style.maxHeight = '70%';
        this.storageMenuElement.style.overflowY = 'auto';
        document.body.appendChild(this.storageMenuElement);
        this.menus.push(this.storageMenuElement); // Add to list of managed menus
    }

    this.storageMenuElement.innerHTML = '<h2>Storage Box</h2><div class="inventory-grid" id="storageGrid"></div><button id="closeStorageBtn">Close</button>';
    const storageGrid = this.storageMenuElement.querySelector('#storageGrid');
    
    items.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot'; // Use same styling
        slot.dataset.index = index;
        slot.dataset.storageId = storageId; // Keep track of which storage this is

        if (item) {
            const itemData = getItemData(item.id);
            const img = document.createElement('img');
            img.src = itemData.icon;
            img.alt = itemData.name;
            slot.appendChild(img);
            if (item.count > 1) {
                const countSpan = document.createElement('span');
                countSpan.className = 'item-count';
                countSpan.textContent = item.count;
                slot.appendChild(countSpan);
            }
        }
        // Add click handlers for moving items between player inventory and storage
        slot.onclick = () => this.game.inventory.transferItem(storageId, index); // Needs Inventory.transferItem
        storageGrid.appendChild(slot);
    });

    this.storageMenuElement.querySelector('#closeStorageBtn').onclick = () => {
        this.storageMenuElement.style.display = 'none';
        this.game.structures.activeStructureInstance = null; // Clear active structure
        this.game.player.controls.lock();
    };

    this.storageMenuElement.style.display = 'block';
};

// Add to Inventory class for storage interaction:
Inventory.prototype.transferItem = function(storageId, slotIndexInStorage) {
    const storageSystem = this.game.structures;
    const storageContainer = storageSystem.storageContainers.get(storageId);
    if (!storageContainer) return;

    const itemInStorage = storageContainer[slotIndexInStorage];
    
    // For simplicity, let's assume player clicks an empty player inventory slot to store,
    // or a storage slot to retrieve. This needs a more robust drag/drop or context menu.
    // This is a placeholder for a more complex transfer logic.

    if (itemInStorage) { // Try to take from storage
        if (this.addItem(itemInStorage.id, itemInStorage.count)) {
            storageContainer[slotIndexInStorage] = null;
            this.game.ui.showNotification(`Took ${itemInStorage.count}x ${getItemData(itemInStorage.id).name}`);
        } else {
            this.game.ui.showNotification("Player inventory full!");
        }
    } else { // Try to put currently selected player item into storage
        const playerSelectedItem = this.getSelectedItem();
        if (playerSelectedItem) {
            storageContainer[slotIndexInStorage] = { ...playerSelectedItem }; // shallow copy
            this.removeItem(playerSelectedItem.id, playerSelectedItem.count); // remove all of selected stack
            this.game.ui.showNotification(`Stored ${playerSelectedItem.count}x ${getItemData(playerSelectedItem.id).name}`);
        }
    }
    // Refresh UIs
    this.game.ui.showStorageMenu(storageId, storageContainer); // Refresh storage UI
    this.game.ui.updateInventory(); // Refresh player inventory UI
};
*/
```

**9. Update `js/world.js`**

```javascript
// js/world.js
// Assuming utils.js has SimplexNoise correctly defined as new Utils.SimplexNoise()
// If SimplexNoise is global, then just new SimplexNoise()

class World {
    constructor(game) {
        this.game = game;
        this.size = 200; // Overall world size
        this.segments = 100; // Segments for the main terrain plane
        
        this.maxHeight = 25;
        this.waterLevel = 1.5; // Lowered water level a bit
        
        this.heightMap = []; // Not strictly needed if using direct vertex manipulation with noise
        this.terrainMesh = null; // Single terrain mesh for simplicity, can be chunked later
        
        this.ambientLight = null;
        this.sunLight = null;
        this.skybox = null;

        this.noise = new Noise(Math.random()); // Use the Noise class from utils.js
    }

    generate() {
        this.createLighting();
        this.createTerrain();
        this.createSkybox();
        this.game.water.createWaterPlane(); // Tell water system to create its plane
    }

    createLighting() {
        this.ambientLight = new THREE.AmbientLight(0x607080, 0.8); // Softer ambient
        this.game.scene.add(this.ambientLight);
        
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(50, 80, 30); // Angled sun
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096; // Higher res shadow map
        this.sunLight.shadow.mapSize.height = 4096;
        const shadowCamSize = 100;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 250;
        this.sunLight.shadow.camera.left = -shadowCamSize;
        this.sunLight.shadow.camera.right = shadowCamSize;
        this.sunLight.shadow.camera.top = shadowCamSize;
        this.sunLight.shadow.camera.bottom = -shadowCamSize;
        this.sunLight.shadow.bias = -0.0005; // Helps reduce shadow acne
        
        this.game.scene.add(this.sunLight);
        this.game.scene.add(this.sunLight.target); // Target for directional light
        // Optional: visualize shadow camera
        // const shadowCamHelper = new THREE.CameraHelper(this.sunLight.shadow.camera);
        // this.game.scene.add(shadowCamHelper);
    }
    
    getTerrainHeight(x, z) {
        let height = 0;
        const scale = 0.02; // Overall scale of noise features
        const persistence = 0.5; // How much detail is added with each octave
        const lacunarity = 2.0;  // How much frequency increases with each octave
        const octaves = 5;

        let amplitude = 1.0;
        let frequency = 1.0;
        let noiseHeight = 0;

        for (let i = 0; i < octaves; i++) {
            const sampleX = x * scale * frequency;
            const sampleZ = z * scale * frequency;
            
            const perlinValue = this.noise.noise2D(sampleX, sampleZ); // Simplex noise output is -1 to 1
            noiseHeight += perlinValue * amplitude;

            amplitude *= persistence;
            frequency *= lacunarity;
        }
        // Remap noise from approx [-maxPossibleAmplitude, maxPossibleAmplitude] to [0, 1]
        // Max possible amplitude for 5 octaves with persistence 0.5: 1 + 0.5 + 0.25 + 0.125 + 0.0625 = ~1.9375
        height = (noiseHeight / 1.9375 + 1) / 2; // Normalize to 0-1
        height = height * this.maxHeight;

        // Make terrain flatter near water level for beaches
        if (height < this.waterLevel + 3 && height > this.waterLevel -1) {
             height = Math.pow(height / (this.waterLevel + 3), 2) * (this.waterLevel + 3); // Ease towards water
        }
         // Ensure minimum height if needed, or slightly vary underwater terrain
        if (height < this.waterLevel) {
            height = this.waterLevel - 0.5 + noiseHeight * 0.1; // Gentle underwater slope
        }

        return Math.max(0, height); // Ensure height is not negative
    }


    createTerrain() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2);
        
        const positions = geometry.attributes.position;
        const colors = [];

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const y = this.getTerrainHeight(x, z);
            positions.setY(i, y);

            // Assign colors based on height and biome
            let r, g, b;
            if (y < this.waterLevel) { // Underwater sand/dirt
                r = 0.8; g = 0.7; b = 0.5; // Sandy yellow
            } else if (y < this.waterLevel + 0.7) { // Beach sand
                r = 0.9; g = 0.8; b = 0.6; // Lighter sand
            } else if (y < this.maxHeight * 0.6) { // Grass
                const biomeFactor = (this.noise.noise2D(x*0.01, z*0.01) + 1)/2; // For grass color variation
                r = 0.2 + biomeFactor * 0.1; g = 0.4 + biomeFactor * 0.2; b = 0.1; // Shades of green
            } else if (y < this.maxHeight * 0.85) { // Rock/Dirt
                r = 0.5; g = 0.45; b = 0.4; // Brownish gray
            } else { // Snow capped
                r = 0.95; g = 0.95; b = 0.98; // White
            }
            colors.push(r,g,b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals(); // Essential for lighting
        
        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true, // Use the per-vertex colors
            // map: grassTexture, // Optional: add a base texture blended with vertex colors
            // flatShading: true, // For a low-poly look
        });
        
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        // this.terrainMesh.castShadow = true; // Terrain can cast shadows, but might be performance intensive
        this.game.scene.add(this.terrainMesh);
    }

    createSkybox() {
        const skyGeo = new THREE.SphereGeometry(this.size * 2, 32, 32); // Large enough sphere
        const loader = new THREE.TextureLoader();
        // Simple procedural sky or a texture
        // For now, a gradient sky
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x3070B0) }, // Light blue
                bottomColor: { value: new THREE.Color(0xB0D0E0) }, // Lighter horizon blue
                offset: { value: 0 },
                exponent: { value: 0.6 }
            },
            vertexShader: [
                "varying vec3 vWorldPosition;",
                "void main() {",
                "  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
                "  vWorldPosition = worldPosition.xyz;",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                "}"
            ].join("\n"),
            fragmentShader: [
                "uniform vec3 topColor;",
                "uniform vec3 bottomColor;",
                "uniform float offset;",
                "uniform float exponent;",
                "varying vec3 vWorldPosition;",
                "void main() {",
                "  float h = normalize( vWorldPosition + offset ).y;",
                "  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );",
                "}"
            ].join("\n"),
            side: THREE.BackSide
        });

        this.skybox = new THREE.Mesh(skyGeo, skyMat);
        this.game.scene.add(this.skybox);
    }

    getHeightAt(x, z) {
        // Raycast down to find terrain height for accuracy if single mesh, or interpolate from heightmap for chunks
        if (this.terrainMesh) {
            const raycaster = new THREE.Raycaster(
                new THREE.Vector3(x, this.maxHeight + 10, z), // Start ray from above max height
                new THREE.Vector3(0, -1, 0) // Cast downwards
            );
            const intersects = raycaster.intersectObject(this.terrainMesh);
            if (intersects.length > 0) {
                return intersects[0].point.y;
            }
        }
        // Fallback if raycast fails or no terrain mesh (e.g. during generation)
        return this.getTerrainHeight(x,z); // Use the noise function as fallback
    }

    getBiomeAt(position) { // takes a THREE.Vector3
        const y = position.y; // Use actual Y of the position, not necessarily terrain height
        
        if (y < this.waterLevel) return 'water';
        
        const terrainHeight = this.getHeightAt(position.x, position.z); // Get actual terrain height for biome def
        if (terrainHeight < this.waterLevel + 0.7) return 'beach';
        if (terrainHeight < this.maxHeight * 0.6) return 'plains';
        if (terrainHeight < this.maxHeight * 0.85) return 'forest'; // Forest higher up
        return 'mountains'; // Highest is mountains (possibly with snow)
    }
    
    getCollisionObjects() {
        return this.terrainMesh ? [this.terrainMesh] : [];
    }


    update(deltaTime) {
        // Update sun position for day/night cycle
        const cycleSpeed = 0.05; // Slower cycle
        const sunAngle = this.game.dayNightCycle * Math.PI * 2 - Math.PI / 2; // Full 2PI rotation, offset to start at sunrise

        this.sunLight.position.set(
            Math.cos(sunAngle) * 100, // Distance from origin
            Math.sin(sunAngle) * 100,
            50 // Keep some Z offset for better shadow angles
        );
        this.sunLight.target.position.set(0,0,0); // Sun always looks at origin

        // Sky color and light intensity based on sun height
        const sunY = this.sunLight.position.y;
        if (sunY > 0) { // Daytime
            this.sunLight.intensity = 1.2 * (sunY / 100); // Max intensity when sun is high
            this.ambientLight.intensity = 0.6 + 0.4 * (sunY / 100);
            const dayTop = new THREE.Color(0x3070B0);
            const dayBottom = new THREE.Color(0xB0D0E0);
            this.skybox.material.uniforms.topColor.value.lerpColors(this.skybox.material.uniforms.topColor.value, dayTop, 0.1);
            this.skybox.material.uniforms.bottomColor.value.lerpColors(this.skybox.material.uniforms.bottomColor.value, dayBottom, 0.1);
        } else { // Nighttime
            this.sunLight.intensity = 0; // No sun
            this.ambientLight.intensity = 0.1; // Moonlight
            const nightTop = new THREE.Color(0x050515);
            const nightBottom = new THREE.Color(0x101025);
             this.skybox.material.uniforms.topColor.value.lerpColors(this.skybox.material.uniforms.topColor.value, nightTop, 0.1);
            this.skybox.material.uniforms.bottomColor.value.lerpColors(this.skybox.material.uniforms.bottomColor.value, nightBottom, 0.1);
        }
        
        // Fog update based on time of day
        // this.game.scene.fog.color.copy(this.skybox.material.uniforms.bottomColor.value);
    }
}
```

**10. Update `js/water.js`**

```javascript
// js/water.js

class Water {
    constructor(game) { // Game instance is passed
        this.game = game;
        this.waterMesh = null;
        this.clock = new THREE.Clock(); // Keep its own clock if shader uses it a lot
    }

    createWaterPlane() {
        const worldSize = this.game.world.size;
        const waterLevel = this.game.world.waterLevel;

        const waterGeometry = new THREE.PlaneGeometry(worldSize, worldSize, 64, 64); // More segments for smoother waves
        
        // Simpler water material for better performance and compatibility
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x206080, // Deep blue
            transparent: true,
            opacity: 0.85,
            roughness: 0.1,
            metalness: 0.3,
            envMapIntensity: 0.5, // Reflect skybox a bit
            side: THREE.DoubleSide,
        });
        // To make it wavy, we can displace vertices in JS or use a vertex shader
        // For JS displacement:
        this.originalVertices = new Float32Array(waterGeometry.attributes.position.array);


        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = waterLevel;
        this.waterMesh.receiveShadow = true; // Water can receive shadows
        this.waterMesh.userData.isWater = true; // For identification
        
        this.game.scene.add(this.waterMesh);
    }
    
    update(deltaTime) {
        if (this.waterMesh) {
            const time = this.clock.getElapsedTime();
            const positions = this.waterMesh.geometry.attributes.position;
            const original = this.originalVertices;

            for (let i = 0; i < positions.count; i++) {
                const ox = original[i * 3];
                const oz = original[i * 3 + 2];

                // Simple sine waves
                const wave1 = Math.sin((ox + time * 0.5) * 0.1) * 0.1; // Smaller amplitude
                const wave2 = Math.sin((oz + time * 0.3) * 0.15) * 0.1;
                const wave3 = Math.cos((ox * 0.05 + oz * 0.03 + time * 0.2)) * 0.05; // More complex wave

                positions.setY(i, wave1 + wave2 + wave3);
            }
            positions.needsUpdate = true;
            // this.waterMesh.geometry.computeVertexNormals(); // Recalculate normals for lighting if waves are significant
        }
    }
    
    isPointInWater(point) { // point is THREE.Vector3
        return point.y < this.game.world.waterLevel;
    }
}
```

**11. Update `js/game.js` (Main Controller)**

```javascript
// js/game.js
// Ensure PointerLockControls is imported in player.js

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        // Add fog - its color will be updated by world.update
        this.scene.fog = new THREE.Fog(0xaaaaaa, 50, 150);


        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Camera is now controlled by Player class (PointerLockControls)

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        document.body.appendChild(this.renderer.domElement);

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.clock = new THREE.Clock();
        this.paused = true; // Start paused until loading finishes
        this.gameTime = 0;
        this.dayNightCycle = 0.25; // Start at morning (0 = midnight, 0.25 = sunrise, 0.5 = noon)
        this.dayDuration = 240; // 4 minutes for a full day-night cycle (testing)
        
        this.mouse = { x: 0, y: 0, buttons: 0 }; // Track mouse state for player attack

        this.initModules();
        this.setupEventListeners();
        this.loadAssetsAndStart();
    }

    initModules() {
        this.world = new World(this);
        this.water = new Water(this); // Pass game instance
        this.resources = new Resources(this);
        this.player = new Player(this); // Player now manages its own camera controls
        this.inventory = new Inventory(this);
        this.crafting = new CraftingSystem(this); // Renamed for clarity
        this.building = new BuildingSystem(this);
        this.animals = new AnimalSystem(this);
        this.structures = new StructuresSystem(this);
        this.ui = new UI(this);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        // Player class handles its own keydown/keyup for movement via PointerLockControls
        // Global key events for UI:
        document.addEventListener('keydown', this.onGlobalKeyDown.bind(this));
        document.addEventListener('keyup', this.onGlobalKeyUp.bind(this)); // For player specific non-movement keys

        this.renderer.domElement.addEventListener('click', () => {
            if (!this.paused && !this.player.controls.isLocked) {
                this.player.controls.lock();
            } else if (this.player.controls.isLocked && this.game.building.ghostObject) {
                 this.player.performPrimaryAction(); // Place building on click
            }
        });
        
        // Handle mouse down/up for continuous actions like attacking
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.player.controls.isLocked) { // Left mouse button
                this.player.performPrimaryAction();
            }
        });
    }

    async loadAssetsAndStart() {
        // Example asset loading (replace with actual asset paths from ItemData, AnimalData etc.)
        // AssetLoader.loadTexture('wood_icon', 'assets/items/wood.png');
        // AssetLoader.loadModel('tree_model', 'assets/models/tree.glb');
        // ... add all your assets
        
        // Simulate loading for now
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('progressFill');
        const loadingText = document.getElementById('loadingText');
        
        loadingText.textContent = "Loading assets...";
        await AssetLoader.loadAll().catch(err => console.error("Asset loading error:", err)); // Wait for all promises
        
        // Simulate world generation time
        loadingText.textContent = "Generating world...";
        progressBar.style.width = '33%';
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        this.world.generate();
        progressBar.style.width = '66%';
        await new Promise(resolve => setTimeout(resolve, 200));

        this.resources.spawnInitialResources();
        this.animals.spawnInitialAnimals();
        this.player.spawn();
        this.inventory.addItem('wooden_axe', 1); // Start with an axe
        this.inventory.addItem('wood', 10);
        this.inventory.addItem('stone', 5);
        this.inventory.addItem('apple', 3);
        this.ui.updateInventory();
        this.player.updateEquippedItem(); // Equip first item if any

        progressBar.style.width = '100%';
        loadingText.textContent = "Game ready!";
        await new Promise(resolve => setTimeout(resolve, 500));

        loadingScreen.style.display = 'none';
        this.paused = false;
        if (!this.player.controls.isLocked) {
            this.player.controls.lock(); // Lock controls when game starts
        }
        this.animate();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onGlobalKeyDown(event) {
        // Handle UI toggles first, only if game is not paused for death screen
        if (this.paused && !document.getElementById('gameOverScreen')) return; // Allow Esc for death screen if needed
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return; // Don't process game keys if typing in an input
        }


        // Player movement keys are handled by PointerLockControls and player class
        this.player.onKeyDown(event); // Pass for non-movement keys like R, F

        switch(event.key.toLowerCase()) {
            case 'e':
                if(this.player.controls.isLocked && this.getInteractableObject()) {
                    this.interactWithFocusedObject();
                } else {
                    this.ui.toggleInventory();
                }
                break;
            case 'c': this.ui.toggleCraftingMenu(); break;
            case 'b': this.ui.toggleBuildingMenu(); break;
            case 'escape':
                if (this.building.ghostObject) {
                    this.building.cancelPlacement();
                } else {
                    this.ui.closeAllMenus(); // This will also lock controls if no menu is open
                }
                break;
            // Quick slots 1-5
            case '1': case '2': case '3': case '4': case '5':
                this.inventory.selectQuickSlot(parseInt(event.key) - 1);
                break;
        }
    }
    onGlobalKeyUp(event) {
        // Pass to player for its key up logic (e.g., stop running)
        this.player.onKeyUp(event);
    }


    updateDayNightCycle(deltaTime) {
        this.gameTime += deltaTime;
        this.dayNightCycle = (this.gameTime % this.dayDuration) / this.dayDuration;
        // World update will handle lighting based on dayNightCycle
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        if (this.paused) { // Only update UI elements that should work when paused (e.g. death screen)
             this.stats.update(); // Update FPS counter
             return;
        }
        
        this.stats.begin();
        
        this.updateDayNightCycle(deltaTime);
        
        this.world.update(deltaTime); // Updates lighting, fog, etc.
        this.player.update(deltaTime);
        this.water.update(deltaTime);
        this.resources.update(deltaTime);
        this.animals.update(deltaTime);
        this.structures.update(deltaTime);
        this.building.update(deltaTime); // For ghost object updates
        
        this.checkInteractionFocus();
        
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
    }

    getInteractableObject() {
        if (!this.player.controls.isLocked) return null;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x: 0, y: 0 }, this.camera); // Center of screen
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        for (const hit of intersects) {
            // Ignore player, tool, ghost building object, water
            if (hit.object === this.player.playerObject || 
                (this.player.toolMesh && hit.object === this.player.toolMesh) ||
                (this.building.ghostObject && hit.object === this.building.ghostObject) ||
                hit.object.userData.isWater) continue;

            if (hit.distance <= this.player.interactionDistance) {
                 // Handle GLTF hierarchy: actual user data might be on parent
                let interactable = hit.object;
                if (interactable.parent && interactable.parent.userData && interactable.parent.userData.type) {
                    interactable = interactable.parent;
                }

                if (interactable.userData.type === 'resource' || 
                    interactable.userData.type === 'animal' || // For looting dead animals?
                    (interactable.userData.type === 'structure' && interactable.userData.interactive)) {
                    return interactable;
                }
            }
             // Important: if the first "real" object hit is not interactable or too far, stop.
            // This prevents interacting through walls.
            if (hit.distance > this.player.interactionDistance || 
                (hit.object !== this.player.playerObject && hit.object !== this.player.toolMesh)) {
                break;
            }
        }
        return null;
    }

    checkInteractionFocus() {
        const interactable = this.getInteractableObject();
        if (interactable) {
            let promptText = "Interact";
            if (interactable.userData.type === 'resource') promptText = `Harvest ${getItemData(interactable.userData.resourceId).name}`;
            else if (interactable.userData.type === 'structure') promptText = `Use ${this.building.buildables[interactable.userData.buildableId].name}`;
            else if (interactable.userData.type === 'animal' && interactable.userData.parentInstance.state === 'dead') promptText = `Loot ${interactable.userData.parentInstance.data.name}`;
            
            if (promptText !== "Interact" || (interactable.userData.type === 'structure' && interactable.userData.interactive)) {
                 this.ui.showInteractionPrompt(promptText);
            } else {
                this.ui.hideInteractionPrompt();
            }

        } else {
            this.ui.hideInteractionPrompt();
        }
    }

    interactWithFocusedObject() {
        const object = this.getInteractableObject();
        if (!object) return;

        if (object.userData.type === 'structure' && object.userData.interactive) {
            this.building.interactWithBuilding(object);
        } else if (object.userData.type === 'animal' && object.userData.parentInstance.state === 'dead') {
            // Looting already happens on kill, this could be for picking up a loot bag if implemented
            // this.animals.lootAnimal(object.userData.parentInstance);
            this.game.ui.showNotification(`Looted ${object.userData.parentInstance.data.name}.`); // Or specific items
        }
        // Harvesting is done via left-click/performPrimaryAction
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    window.gameInstance = game; // For debugging
});
```

**Final Steps and Notes:**

1.  **HTML File (`index.html`):**
    *   Make sure all new script tags (`items.js`, `ui.js`) are added in the correct order (e.g., `items.js` before `inventory.js`, `ui.js` before `game.js`).
    *   Add the `PointerLockControls.js` import in `player.js` or directly in `index.html` if you download it.
        ```html
        <!-- In head or before game.js -->
        <script type="importmap">
            {
                "imports": {
                    "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js",
                    "three/addons/": "https://unpkg.com/three@0.128.0/examples/jsm/"
                }
            }
        </script>
        <script type="module" src="js/player.js"></script> 
        <!-- Change other script tags to type="module" if they import from player.js or other modules -->
        <!-- OR download PointerLockControls.js and include it normally: -->
        <!-- <script src="js/lib/PointerLockControls.js"></script> -->
        <!-- Then in player.js: this.controls = new THREE.PointerLockControls(...) -->
        ```
        For simplicity with the current structure, it's often easier to download `PointerLockControls.js` into a `js/lib/` folder and include it as a regular script, then use `THREE.PointerLockControls`. If you go full module, all your JS files that depend on each other would need `import`/`export`.
        **Let's assume you download `PointerLockControls.js` to `js/lib/PointerLockControls.js` and add `<script src="js/lib/PointerLockControls.js"></script>` to `index.html` before `player.js`. Then, in `player.js`, remove the import and use `this.controls = new THREE.PointerLockControls(...)`.**

2.  **Asset Paths:** Double-check all `assets/...` paths. If models/icons are missing, the game will have errors or show placeholders.
3.  **Placeholders:** I've added placeholder geometry/logic for models. You'll want to replace these with actual `gltf` loads.
4.  **Debugging:** Use your browser's developer console extensively! There will likely be errors to fix.
5.  **Iteration:** This is a huge step. Test thoroughly. Focus on one system at a time if something is broken (e.g., "Is inventory working?", "Can I place buildings?").

This is a *lot* of code. It aims to make the systems more robust and interconnected. Good luck!
392.4s
