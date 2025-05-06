// structures.js - Handles interactive structures like campfires, crafting tables, forges, etc.

class StructuresSystem {
    constructor(game) {
        this.game = game;
        this.activeStructure = null;
        
        // Track crafting progress for forge and campfire
        this.activeCraftingProcesses = {
            campfire: [],
            forge: []
        };
        
        // Storage containers
        this.storageContainers = new Map(); // Maps unique IDs to storage contents
        
        // Cooking recipes for campfire
        this.cookingRecipes = this.setupCookingRecipes();
    }
    
    setupCookingRecipes() {
        return [
            {
                id: 'cooked_meat',
                name: 'Cooked Meat',
                icon: 'assets/items/cooked_meat.png',
                ingredients: [{ item: 'raw_meat', count: 1 }],
                fuel: { item: 'wood', count: 1 },
                result: { item: 'cooked_meat', count: 1 },
                time: 10 // Seconds to cook
            },
            {
                id: 'cooked_fish',
                name: 'Cooked Fish',
                icon: 'assets/items/cooked_fish.png',
                ingredients: [{ item: 'raw_fish', count: 1 }],
                fuel: { item: 'wood', count: 1 },
                result: { item: 'cooked_fish', count: 1 },
                time: 8
            },
            {
                id: 'herb_tea',
                name: 'Herb Tea',
                icon: 'assets/items/herb_tea.png',
                ingredients: [
                    { item: 'herbs', count: 3 },
                    { item: 'water_container', count: 1 }
                ],
                fuel: { item: 'wood', count: 1 },
                result: { item: 'herb_tea', count: 1 },
                time: 5
            }
        ];
    }
    
    openCampfire() {
        this.activeStructure = 'campfire';
        
        // Update and show the campfire UI menu
        this.updateCampfireMenu();
        document.getElementById('campfireMenu').style.display = 'block';
    }
    
    updateCampfireMenu() {
        const slotsContainer = document.getElementById('campfireSlots');
        slotsContainer.innerHTML = '';
        
        // Create slots for cooking items
        for (let i = 0; i < 4; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            
            // Check if a crafting process is active in this slot
            const process = this.activeCraftingProcesses.campfire[i];
            if (process) {
                // Add item icon
                const icon = document.createElement('img');
                icon.src = process.recipe.icon;
                slot.appendChild(icon);
                
                // Add progress indicator
                const progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                progressSvg.classList.add('progress-circle');
                progressSvg.innerHTML = `
                    <circle class="progress-bg" cx="30" cy="30" r="25"/>
                    <circle class="progress-fill" cx="30" cy="30" r="25" style="stroke-dashoffset: ${157 * (1 - process.progress / process.totalTime)}"/>
                `;
                slot.appendChild(progressSvg);
            } else {
                // Add event listener for adding new item
                slot.addEventListener('click', () => {
                    this.showCookingOptions(i);
                });
            }
            
            slotsContainer.appendChild(slot);
        }
        
        // Add a button to close the menu
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => this.closeCampfire());
        slotsContainer.appendChild(closeButton);
    }
    
    showCookingOptions(slotIndex) {
        // Create a dropdown with available cooking recipes
        const availableRecipes = this.cookingRecipes.filter(recipe => 
            this.canCraft(recipe, this.game.inventory.items)
        );
        
        if (availableRecipes.length === 0) {
            this.game.ui.showNotification('No available cooking recipes');
            return;
        }
        
        // Clear any previous dropdown
        const existingDropdown = document.getElementById('cookingDropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.id = 'cookingDropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        dropdown.style.border = '1px solid #555';
        dropdown.style.padding = '10px';
        dropdown.style.maxHeight = '300px';
        dropdown.style.overflow = 'auto';
        dropdown.style.zIndex = '200';
        
        // Add recipes to dropdown
        availableRecipes.forEach(recipe => {
            const recipeOption = document.createElement('div');
            recipeOption.style.padding = '5px';
            recipeOption.style.cursor = 'pointer';
            recipeOption.style.display = 'flex';
            recipeOption.style.alignItems = 'center';
            recipeOption.style.borderBottom = '1px solid #555';
            
            const icon = document.createElement('img');
            icon.src = recipe.icon;
            icon.style.width = '40px';
            icon.style.height = '40px';
            icon.style.marginRight = '10px';
            
            const details = document.createElement('div');
            details.textContent = recipe.name;
            
            recipeOption.appendChild(icon);
            recipeOption.appendChild(details);
            
            recipeOption.addEventListener('click', () => {
                this.startCooking(recipe.id, slotIndex);
                dropdown.remove();
            });
            
            dropdown.appendChild(recipeOption);
        });
        
        // Position dropdown near the slot
        const slot = document.querySelector(`#campfireSlots .inventory-slot[data-index="${slotIndex}"]`);
        const rect = slot.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 10}px`;
        dropdown.style.left = `${rect.left}px`;
        
        document.body.appendChild(dropdown);
    }
    
    startCooking(recipeId, slotIndex) {
        const recipe = this.cookingRecipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        // Check ingredients
        if (!this.canCraft(recipe, this.game.inventory.items)) {
            this.game.ui.showNotification('Missing ingredients for cooking');
            return;
        }
        
        // Remove ingredients from inventory
        for (const ingredient of recipe.ingredients) {
            this.game.inventory.removeItem(ingredient.item, ingredient.count);
        }
        
        // Remove fuel
        if (recipe.fuel) {
            this.game.inventory.removeItem(recipe.fuel.item, recipe.fuel.count);
        }
        
        // Create cooking process
        const cookingProcess = {
            recipe: recipe,
            progress: 0,
            totalTime: recipe.time,
            slotIndex: slotIndex
        };
        
        // Store cooking process
        this.activeCraftingProcesses.campfire[slotIndex] = cookingProcess;
        
        // Update UI
        this.updateCampfireMenu();
    }
    
    closeCampfire() {
        document.getElementById('campfireMenu').style.display = 'none';
        this.activeStructure = null;
    }
    
    openCraftingTable() {
        this.activeStructure = 'crafting_table';
        
        // Display crafting menu with advanced recipes
        document.getElementById('craftingMenu').style.display = 'block';
        
        // Update crafting grid with crafting table recipes
        const craftingGrid = document.getElementById('craftingGrid');
        craftingGrid.innerHTML = '';
        
        // Get crafting table recipes from the crafting system
        const recipes = this.game.crafting.craftingTableRecipes;
        
        recipes.forEach(recipe => {
            const canCraft = this.canCraft(recipe, this.game.inventory.items);
            
            const recipeElement = document.createElement('div');
            recipeElement.className = `crafting-item ${canCraft ? 'available' : 'unavailable'}`;
            
            const icon = document.createElement('img');
            icon.src = recipe.icon;
            
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = recipe.name;
            
            recipeElement.appendChild(icon);
            recipeElement.appendChild(name);
            
            // Add click event for crafting
            if (canCraft) {
                recipeElement.addEventListener('click', () => {
                    const result = this.game.crafting.craft(recipe.id, this.game.inventory.items, 'crafting_table');
                    if (result.success) {
                        this.game.ui.showNotification(result.message);
                        this.updateCraftingTable(); // Refresh the UI
                    }
                });
            } else {
                recipeElement.style.opacity = '0.5';
                
                // Add tooltip showing missing ingredients
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.style.display = 'none';
                
                const missingItems = this.getMissingIngredients(recipe, this.game.inventory.items);
                missingItems.forEach(item => {
                    const itemText = document.createElement('div');
                    itemText.textContent = `${item.name}: ${item.have}/${item.need}`;
                    tooltip.appendChild(itemText);
                });
                
                recipeElement.appendChild(tooltip);
                
                recipeElement.addEventListener('mouseover', () => {
                    tooltip.style.display = 'block';
                });
                
                recipeElement.addEventListener('mouseout', () => {
                    tooltip.style.display = 'none';
                });
            }
            
            craftingGrid.appendChild(recipeElement);
        });
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => this.closeCraftingTable());
        craftingGrid.appendChild(closeButton);
    }
    
    updateCraftingTable() {
        // Re-open to refresh
        this.closeCraftingTable();
        this.openCraftingTable();
    }
    
    closeCraftingTable() {
        document.getElementById('craftingMenu').style.display = 'none';
        this.activeStructure = null;
    }
    
    openForge() {
        this.activeStructure = 'forge';
        
        // Update and show the forge UI menu
        this.updateForgeMenu();
        document.getElementById('forgeMenu').style.display = 'block';
    }
    
    updateForgeMenu() {
        const slotsContainer = document.getElementById('forgeSlots');
        slotsContainer.innerHTML = '';
        
        // Create slots for forging items
        for (let i = 0; i < 4; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            
            // Check if a crafting process is active in this slot
            const process = this.activeCraftingProcesses.forge[i];
            if (process) {
                // Add item icon
                const icon = document.createElement('img');
                icon.src = process.recipe.icon;
                slot.appendChild(icon);
                
                // Add progress indicator
                const progressSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                progressSvg.classList.add('progress-circle');
                progressSvg.innerHTML = `
                    <circle class="progress-bg" cx="30" cy="30" r="25"/>
                    <circle class="progress-fill" cx="30" cy="30" r="25" style="stroke-dashoffset: ${157 * (1 - process.progress / process.totalTime)}"/>
                `;
                slot.appendChild(progressSvg);
            } else {
                // Add event listener for adding new item
                slot.addEventListener('click', () => {
                    this.showForgingOptions(i);
                });
            }
            
            slotsContainer.appendChild(slot);
        }
        
        // Add a button to close the menu
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => this.closeForge());
        slotsContainer.appendChild(closeButton);
    }
    
    showForgingOptions(slotIndex) {
        // Create a dropdown with available forge recipes
        const availableRecipes = this.game.crafting.forgeRecipes.filter(recipe => 
            this.canCraft(recipe, this.game.inventory.items)
        );
        
        if (availableRecipes.length === 0) {
            this.game.ui.showNotification('No available forge recipes');
            return;
        }
        
        // Clear any previous dropdown
        const existingDropdown = document.getElementById('forgingDropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.id = 'forgingDropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        dropdown.style.border = '1px solid #555';
        dropdown.style.padding = '10px';
        dropdown.style.maxHeight = '300px';
        dropdown.style.overflow = 'auto';
        dropdown.style.zIndex = '200';
        
        // Add recipes to dropdown
        availableRecipes.forEach(recipe => {
            const recipeOption = document.createElement('div');
            recipeOption.style.padding = '5px';
            recipeOption.style.cursor = 'pointer';
            recipeOption.style.display = 'flex';
            recipeOption.style.alignItems = 'center';
            recipeOption.style.borderBottom = '1px solid #555';
            
            const icon = document.createElement('img');
            icon.src = recipe.icon;
            icon.style.width = '40px';
            icon.style.height = '40px';
            icon.style.marginRight = '10px';
            
            const details = document.createElement('div');
            details.textContent = recipe.name;
            
            recipeOption.appendChild(icon);
            recipeOption.appendChild(details);
            
            recipeOption.addEventListener('click', () => {
                this.startForging(recipe.id, slotIndex);
                dropdown.remove();
            });
            
            dropdown.appendChild(recipeOption);
        });
        
        // Position dropdown near the slot
        const slot = document.querySelector(`#forgeSlots .inventory-slot[data-index="${slotIndex}"]`);
        const rect = slot.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 10}px`;
        dropdown.style.left = `${rect.left}px`;
        
        document.body.appendChild(dropdown);
    }
    
    startForging(recipeId, slotIndex) {
        // Use the crafting system to start the forging process
        const result = this.game.crafting.startCrafting(recipeId, slotIndex);
        
        if (result.success) {
            // Store forging process
            this.activeCraftingProcesses.forge[slotIndex] = result.craftingProcess;
            
            // Update UI
            this.updateForgeMenu();
        } else {
            this.game.ui.showNotification(result.message);
        }
    }
    
    closeForge() {
        document.getElementById('forgeMenu').style.display = 'none';
        this.activeStructure = null;
    }
    
    openStorage(storageObject) {
        if (!storageObject) return;
        
        const storageId = storageObject.userData.storageId || this.generateStorageId(storageObject);
        storageObject.userData.storageId = storageId;
        
        // Initialize storage if it doesn't exist
        if (!this.storageContainers.has(storageId)) {
            this.storageContainers.set(storageId, []);
            
            // Create empty slots
            for (let i = 0; i < 15; i++) {
                this.storageContainers.get(storageId).push(null);
            }
        }
        
        // Show storage UI
        this.showStorageUI(storageId);
    }
    
    generateStorageId(object) {
        return `storage_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    showStorageUI(storageId) {
        // This would be implemented in the UI system
        // For this example, we'll just log to console
        console.log('Opening storage:', storageId);
        console.log('Contents:', this.storageContainers.get(storageId));
    }
    
    canCraft(recipe, inventory) {
        for (const ingredient of recipe.ingredients) {
            const inventoryItem = inventory.find(item => item && item.id === ingredient.item);
            if (!inventoryItem || inventoryItem.count < ingredient.count) {
                return false;
            }
        }
        
        // Check fuel if applicable
        if (recipe.fuel) {
            const fuelItem = inventory.find(item => item && item.id === recipe.fuel.item);
            if (!fuelItem || fuelItem.count < recipe.fuel.count) {
                return false;
            }
        }
        
        return true;
    }
    
    getMissingIngredients(recipe, inventory) {
        const missing = [];
        
        for (const ingredient of recipe.ingredients) {
            const inventoryItem = inventory.find(item => item && item.id === ingredient.item);
            const have = inventoryItem ? inventoryItem.count : 0;
            
            if (have < ingredient.count) {
                missing.push({
                    id: ingredient.item,
                    name: ingredient.item.replace('_', ' '),
                    have: have,
                    need: ingredient.count
                });
            }
        }
        
        // Check fuel if applicable
        if (recipe.fuel) {
            const fuelItem = inventory.find(item => item && item.id === recipe.fuel.item);
            const have = fuelItem ? fuelItem.count : 0;
            
            if (have < recipe.fuel.count) {
                missing.push({
                    id: recipe.fuel.item,
                    name: recipe.fuel.item.replace('_', ' '),
                    have: have,
                    need: recipe.fuel.count
                });
            }
        }
        
        return missing;
    }
    
    update(deltaTime) {
        // Update all active crafting processes
        this.updateCraftingProcesses('campfire', deltaTime);
        this.updateCraftingProcesses('forge', deltaTime);
    }
    
    updateCraftingProcesses(station, deltaTime) {
        const processes = this.activeCraftingProcesses[station];
        
        for (let i = 0; i < processes.length; i++) {
            if (!processes[i]) continue;
            
            // Update progress
            processes[i].progress += deltaTime;
            
            // Check if completed
            if (processes[i].progress >= processes[i].totalTime) {
                // Add crafted item to inventory
                this.game.inventory.addItem(
                    processes[i].recipe.result.item,
                    processes[i].recipe.result.count
                );
                
                // Show notification
                this.game.ui.showNotification(`Finished crafting ${processes[i].recipe.name}`);
                
                // Remove process
                processes[i] = null;
                
                // Update UI if the menu is open
                if (this.activeStructure === station) {
                    if (station === 'campfire') {
                        this.updateCampfireMenu();
                    } else if (station === 'forge') {
                        this.updateForgeMenu();
                    }
                }
            }
        }
    }
    
    // Save/load structure data for world persistence
    saveStructuresData() {
        return {
            activeCraftingProcesses: this.activeCraftingProcesses,
            storageContainers: Array.from(this.storageContainers.entries())
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