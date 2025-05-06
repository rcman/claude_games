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