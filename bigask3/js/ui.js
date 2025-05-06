// Handles DOM manipulation for UI elements
export class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance; // Access to player, crafting systems etc.

        // Main Panels
        this.inventoryPanel = document.getElementById('inventory-ui');
        this.craftingMenuPanel = document.getElementById('crafting-menu-ui');
        this.buildingMenuPanel = document.getElementById('building-menu-ui');
        this.campfirePanel = document.getElementById('campfire-ui');

        // Panel Content Holders
        this.inventorySlotsDiv = document.getElementById('inventory-slots');
        this.quickBarSlotsInventoryViewDiv = document.getElementById('quick-bar-slots-inventory-view');
        this.craftableItemsList = document.getElementById('craftable-items-list');
        this.buildableItemsList = document.getElementById('buildable-items-list');
        this.campfireSlotsDiv = this.campfirePanel.querySelector('.campfire-slots');
        this.campfirePlayerInventoryDiv = document.getElementById('campfire-player-inventory');

        // Quick Bar
        this.quickBarUIDiv = document.getElementById('quick-bar-ui');

        // Prompts & Messages
        this.interactionPrompt = document.getElementById('interaction-prompt');
        this.messageTimeout = null;

        // Active states
        this.currentOpenCampfire = null; // Stores the mesh of the currently open campfire

        this.initListeners();
        this.createQuickBarSlots();
    }

    initListeners() {
        document.getElementById('close-inventory').addEventListener('click', () => {
            this.closeInventory();
            this.game.player.controls.lock();
            this.game.isPaused = false;
        });
        // Add listeners for close-crafting, close-building, close-campfire
        document.getElementById('close-crafting').addEventListener('click', () => this.closeCraftingMenu());
        document.getElementById('close-building').addEventListener('click', () => {
            this.game.buildingSystem.exitBuildMode(); // Also handles UI closing
            this.game.player.controls.lock();
            this.game.isPaused = false;
        });
        document.getElementById('close-campfire').addEventListener('click', () => {
            this.closeCampfireMenu();
            this.game.player.controls.lock();
            this.game.isPaused = false;
        });
    }

    isAnyPanelOpen() {
        return this.inventoryPanel.style.display === 'block' ||
               this.craftingMenuPanel.style.display === 'block' ||
               this.buildingMenuPanel.style.display === 'block' ||
               this.campfirePanel.style.display === 'block';
    }

    // --- Inventory UI ---
    isInventoryOpen() { return this.inventoryPanel.style.display === 'block'; }
    openInventory() {
        this.closeAllPanels();
        this.inventoryPanel.style.display = 'block';
        this.updateInventory();
    }
    closeInventory() { this.inventoryPanel.style.display = 'none'; }

    updateInventory() {
        if (!this.isInventoryOpen() && !this.isCampfireOpen()) return; // Only update if relevant panel is open

        const inv = this.game.player.inventory;
        
        // Main Inventory Slots
        this.inventorySlotsDiv.innerHTML = '';
        inv.mainInventory.forEach((item, index) => {
            const slot = this.createSlotElement(item, 'main', index);
            this.inventorySlotsDiv.appendChild(slot);
        });

        // Quick Bar Slots (in inventory view)
        this.quickBarSlotsInventoryViewDiv.innerHTML = '';
        inv.quickBar.forEach((item, index) => {
            const slot = this.createSlotElement(item, 'quickbar', index);
            this.quickBarSlotsInventoryViewDiv.appendChild(slot);
        });

        // If campfire is open, update its player inventory view too
        if (this.isCampfireOpen()) {
            this.updateCampfirePlayerInventoryView();
        }
    }
    
    createSlotElement(item, type, index, context = 'player') { // context: 'player' or 'campfire'
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('slot'); // General slot styling
        if (item) {
            slotDiv.textContent = `${item.name} (${item.quantity || 1})`;
            if (item.name === 'Canteen') {
                slotDiv.textContent += ` ${item.water}/${item.capacity} ${item.isBoiled ? '(B)' : '(D)'}`;
            }
            slotDiv.title = JSON.stringify(item); // For hover details
            slotDiv.dataset.itemName = item.name;
            slotDiv.dataset.itemQuantity = item.quantity || 1;
            slotDiv.dataset.itemType = type; // 'main' or 'quickbar'
            slotDiv.dataset.itemIndex = index;
            slotDiv.dataset.itemContext = context;

            // Right-click to move (Player Inventory <-> Quick Bar)
            if (context === 'player') {
                slotDiv.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.moveItemBetweenInventories(item, type, index);
                });
            } else if (context === 'campfire_player_inv_item') {
                // Click to move item from player inv to campfire slot
                slotDiv.addEventListener('click', () => {
                    if (this.currentOpenCampfire && this.game.player.inventory.mainInventory[index]) { // Check item still exists
                         // Try to add to first available campfire slot
                        for (let i = 0; i < 4; i++) {
                            if (!this.currentOpenCampfire.userData.inventory.slots[i] || 
                                (this.currentOpenCampfire.userData.inventory.slots[i].outputReady && !this.currentOpenCampfire.userData.inventory.slots[i].processing) ) { // Slot is empty or has finished item
                                
                                // If slot has finished item, try to take it first
                                if(this.currentOpenCampfire.userData.inventory.slots[i] && this.currentOpenCampfire.userData.inventory.slots[i].outputReady) {
                                    const output = this.currentOpenCampfire.userData.inventory.slots[i].outputReady;
                                    if (this.game.player.inventory.addItem(output)) {
                                        this.currentOpenCampfire.userData.inventory.slots[i] = null;
                                    } else {
                                        this.showTemporaryMessage("Player inventory full for output.");
                                        break; // Stop trying to add new item
                                    }
                                }

                                // Now try to add the new item if slot is clear
                                if (!this.currentOpenCampfire.userData.inventory.slots[i]) {
                                    const itemToProcess = { ...this.game.player.inventory.mainInventory[index] }; // copy
                                    if (itemToProcess.quantity > 1) itemToProcess.quantity = 1; // Process one at a time

                                    if(this.game.craftingSystem.startCampfireProcess(this.currentOpenCampfire, i, itemToProcess)) {
                                        // Item was successfully moved and started processing
                                        break; // Exit loop, one item moved
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        return slotDiv;
    }

    moveItemBetweenInventories(item, sourceType, sourceIndex) {
        const inv = this.game.player.inventory;
        let itemToMove = { ...item }; // Copy

        if (sourceType === 'main') { // Moving from Main to Quick Bar
            // Try to add to an empty quick bar slot or stack
            let addedToQuickBar = false;
            for (let i = 0; i < inv.quickBar.length; i++) {
                if (!inv.quickBar[i]) {
                    inv.quickBar[i] = itemToMove;
                    addedToQuickBar = true;
                    break;
                } else if (inv.quickBar[i].name === itemToMove.name && inv.quickBar[i].stackable !== false) {
                    inv.quickBar[i].quantity = (inv.quickBar[i].quantity || 1) + (itemToMove.quantity || 1);
                    addedToQuickBar = true;
                    break;
                }
            }
            if (addedToQuickBar) {
                inv.mainInventory[sourceIndex] = null; // Remove from original slot
            } else {
                this.showTemporaryMessage("Quick bar full or cannot stack.");
            }
        } else if (sourceType === 'quickbar') { // Moving from Quick Bar to Main
            // Try to add to an empty main inventory slot or stack
            let addedToMain = false;
             for (let i = 0; i < inv.mainInventory.length; i++) {
                if (!inv.mainInventory[i]) {
                    inv.mainInventory[i] = itemToMove;
                    addedToMain = true;
                    break;
                } else if (inv.mainInventory[i].name === itemToMove.name && inv.mainInventory[i].stackable !== false) {
                    inv.mainInventory[i].quantity = (inv.mainInventory[i].quantity || 1) + (itemToMove.quantity || 1);
                    addedToMain = true;
                    break;
                }
            }
            if (addedToMain) {
                inv.quickBar[sourceIndex] = null; // Remove from original slot
            } else {
                this.showTemporaryMessage("Main inventory full or cannot stack.");
            }
        }
        this.updateInventory();
        this.updateQuickBar();
    }


    // --- Quick Bar UI (Bottom of screen) ---
    createQuickBarSlots() {
        this.quickBarUIDiv.innerHTML = '';
        const numSlots = this.game.player.inventory.quickBar.length;
        for (let i = 0; i < numSlots; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('slot');
            slotDiv.id = `qb-slot-${i}`;
            this.quickBarUIDiv.appendChild(slotDiv);
        }
        this.updateQuickBar();
    }

    updateQuickBar(selectedIndex = -1) { // selectedIndex from player
        const inv = this.game.player.inventory;
        if (!inv) return; // Inventory not initialized yet
        
        inv.quickBar.forEach((item, index) => {
            const slotDiv = document.getElementById(`qb-slot-${index}`);
            if (slotDiv) {
                if (item) {
                    slotDiv.textContent = `${item.name.substring(0,3)} (${item.quantity || 1})`;
                     if (item.name === 'Canteen') {
                         slotDiv.textContent = `Can ${item.water}/${item.capacity} ${item.isBoiled ? '(B)' : '(D)'}`;
                     }
                } else {
                    slotDiv.textContent = `[${index + 1}]`;
                }
                if (index === (selectedIndex !== -1 ? selectedIndex : this.game.player.selectedQuickBarSlot) ) {
                    slotDiv.style.borderColor = 'yellow';
                } else {
                    slotDiv.style.borderColor = '#ccc';
                }
            }
        });
    }

    // --- Crafting Menu UI ---
    isCraftingMenuOpen() { return this.craftingMenuPanel.style.display === 'block'; }
    openCraftingMenu() {
        this.closeAllPanels();
        this.craftingMenuPanel.style.display = 'block';
        this.updateCraftingMenu();
    }
    closeCraftingMenu() { this.craftingMenuPanel.style.display = 'none'; }

    updateCraftingMenu() {
        if (!this.isCraftingMenuOpen()) return;
        this.craftableItemsList.innerHTML = '';
        const availableCrafts = this.game.craftingSystem.getAvailableCrafts();
        
        // Show all recipes, but grey out uncraftable ones
        for (const itemName in this.game.craftingSystem.recipes) {
            const recipe = this.game.craftingSystem.recipes[itemName];
            const listItem = document.createElement('li');
            let reqText = "";
            for (const res in recipe) {
                if (res === 'craftTime') continue;
                reqText += `${res}: ${recipe[res]}, `;
            }
            listItem.textContent = `${itemName} (Requires: ${reqText.slice(0,-2)})`;

            if (this.game.craftingSystem.canCraft(itemName)) {
                listItem.style.cursor = 'pointer';
                listItem.addEventListener('click', () => {
                    this.game.craftingSystem.craftItem(itemName);
                    // CraftingSystem will call updateCraftingMenu again if successful
                });
            } else {
                listItem.style.color = 'grey';
            }
            this.craftableItemsList.appendChild(listItem);
        }
    }

    // --- Building Menu UI ---
    isBuildingMenuOpen() { return this.buildingMenuPanel.style.display === 'block'; }
    openBuildingMenu() {
        this.closeAllPanels();
        this.buildingMenuPanel.style.display = 'block';
        // Populate is handled by buildingSystem calling populateBuildMenu
    }
    closeBuildingMenu() { this.buildingMenuPanel.style.display = 'none'; }

    populateBuildMenu(buildableItems) { // Called by BuildingSystem
        if (!this.isBuildingMenuOpen()) return;
        this.buildableItemsList.innerHTML = '';
        buildableItems.forEach(item => {
            const listItem = document.createElement('li');
            let costText = "";
            for (const resource in item.cost) {
                costText += `${resource}: ${item.cost[resource]}, `;
            }
            listItem.textContent = `${item.name} (Cost: ${costText.slice(0,-2)})`;
            
            // Check if player can afford
            let canAfford = true;
            for (const resource in item.cost) {
                 if (this.game.player.inventory.countItem(resource) < item.cost[resource]) {
                    canAfford = false;
                    break;
                 }
            }

            if (canAfford) {
                listItem.style.cursor = 'pointer';
                listItem.addEventListener('click', () => {
                    this.game.buildingSystem.selectBuildItem(item.name);
                    this.closeBuildingMenu(); // Close menu to allow world interaction for placement
                    this.game.player.controls.lock(); // Give back control to player for placing
                    this.game.isPaused = false;
                });
            } else {
                 listItem.style.color = 'grey';
            }
            this.buildableItemsList.appendChild(listItem);
        });
    }
    
    // --- Campfire UI ---
    isCampfireOpen() { return this.campfirePanel.style.display === 'block'; }
    openCampfireMenu(campfireObject) {
        this.closeAllPanels();
        this.currentOpenCampfire = campfireObject;
        if (!this.currentOpenCampfire.userData.inventory) { // Initialize if first time
            this.currentOpenCampfire.userData.inventory = {
                slots: [null, null, null, null], // { processing: item, output: item, timeRemaining: X } or { outputReady: item }
                fuel: 100 // Example starting fuel
            };
        }
        this.campfirePanel.style.display = 'block';
        this.updateCampfireMenu();
        this.updateCampfirePlayerInventoryView(); // Show player's items to add
        this.game.player.controls.unlock();
        this.game.isPaused = true;
    }
    closeCampfireMenu() {
        this.campfirePanel.style.display = 'none';
        this.currentOpenCampfire = null;
    }

    updateCampfireMenu() {
        if (!this.isCampfireOpen() || !this.currentOpenCampfire) return;

        const campfireData = this.currentOpenCampfire.userData.inventory;
        this.campfireSlotsDiv.innerHTML = ''; // Clear previous slots

        for (let i = 0; i < campfireData.slots.length; i++) {
            const slotData = campfireData.slots[i];
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('slot');
            slotDiv.dataset.slotIndex = i;

            if (slotData) {
                if (slotData.processing) {
                    const progress = 100 - (slotData.timeRemaining / (slotData.startTime ? (Date.now() - slotData.startTime + slotData.timeRemaining) / slotData.timeRemaining * 100 : 15000) * 100);
                    slotDiv.textContent = `Processing: ${slotData.processing.name} (${Math.max(0, slotData.timeRemaining).toFixed(1)}s left)`;
                    // Could add a progress bar visual
                } else if (slotData.outputReady) {
                    slotDiv.textContent = `Ready: ${slotData.outputReady.name}`;
                    slotDiv.style.cursor = 'pointer';
                    slotDiv.title = "Click to take";
                    // Click to take item
                    slotDiv.addEventListener('click', () => {
                        if (this.game.player.inventory.addItem(slotData.outputReady)) {
                            campfireData.slots[i] = null; // Clear slot
                            this.updateCampfireMenu();
                        } else {
                            this.showTemporaryMessage("Player inventory full.");
                        }
                    });
                }
            } else {
                slotDiv.textContent = "(Empty)";
                slotDiv.title = "Click item from your inventory to add";
            }
            this.campfireSlotsDiv.appendChild(slotDiv);
        }
        // Update fuel display if implemented
        // e.g., this.campfirePanel.querySelector('#fuel-display').textContent = `Fuel: ${campfireData.fuel}`;
    }
    
    updateCampfirePlayerInventoryView() {
        if (!this.isCampfireOpen()) return;
        this.campfirePlayerInventoryDiv.innerHTML = '<h4>Your Items (Click to Add):</h4>';
        const inv = this.game.player.inventory;
        
        [...inv.mainInventory, ...inv.quickBar].forEach((item, index) => {
            // For simplicity, using original index from a combined array.
            // A better way is to distinguish main/quickbar if removal logic is specific.
            // Here, we assume player.inventory.removeItem can handle finding the item.
            if (item && (item.name === 'Raw Meat' || (item.name === 'Canteen' && !item.isBoiled && item.water > 0))) {
                // Create a simplified representation for adding to campfire
                const slotDiv = document.createElement('div');
                slotDiv.classList.add('slot', 'clickable-inventory-item');
                slotDiv.textContent = `${item.name} (${item.quantity || 1})`;
                 if (item.name === 'Canteen') {
                    slotDiv.textContent += ` ${item.water}/${item.capacity}`;
                }
                slotDiv.addEventListener('click', () => {
                    if (this.currentOpenCampfire) {
                        const itemToProcess = { ...item }; // Important to copy
                        if (itemToProcess.quantity > 1) itemToProcess.quantity = 1; // Process one at a time

                        for (let i = 0; i < 4; i++) { // Find an empty campfire slot
                             const csSlot = this.currentOpenCampfire.userData.inventory.slots[i];
                             if (!csSlot || (csSlot.outputReady && !csSlot.processing)) {
                                if (csSlot && csSlot.outputReady) { // If slot has finished item, try to take it first
                                    if (this.game.player.inventory.addItem(csSlot.outputReady)) {
                                        this.currentOpenCampfire.userData.inventory.slots[i] = null;
                                    } else {
                                        this.showTemporaryMessage("Player inventory full for output.");
                                        break; 
                                    }
                                }
                                // Now try to add the new item if slot is clear
                                if (!this.currentOpenCampfire.userData.inventory.slots[i]) {
                                    if(this.game.craftingSystem.startCampfireProcess(this.currentOpenCampfire, i, itemToProcess)) {
                                        this.updateCampfirePlayerInventoryView(); // Refresh player items
                                        break; 
                                    }
                                }
                            }
                        }
                    }
                });
                this.campfirePlayerInventoryDiv.appendChild(slotDiv);
            }
        });
    }


    // --- General UI ---
    closeAllPanels() {
        this.inventoryPanel.style.display = 'none';
        this.craftingMenuPanel.style.display = 'none';
        this.buildingMenuPanel.style.display = 'none';
        this.campfirePanel.style.display = 'none';
        this.currentOpenCampfire = null;
    }

    setInteractionPrompt(text) {
        if (text && text.length > 0) {
            this.interactionPrompt.textContent = text;
            this.interactionPrompt.style.display = 'block';
        } else {
            this.interactionPrompt.style.display = 'none';
        }
    }

    showTemporaryMessage(message, duration = 3000) {
        // For now, use interaction prompt area for messages
        const el = this.interactionPrompt; // Or a dedicated message element
        el.textContent = message;
        el.style.display = 'block';
        el.style.backgroundColor = 'rgba(0,100,0,0.7)'; // Greenish for success
        
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            el.style.display = 'none';
            el.style.backgroundColor = 'rgba(0,0,0,0.7)'; // Reset color
            this.game.player.updateInteractionPrompt(); // Restore interaction prompt if any
        }, duration);
    }
}