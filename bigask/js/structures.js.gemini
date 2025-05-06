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