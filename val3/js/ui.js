// UI interaction functions
function toggleInventory() {
    const inventory = document.getElementById('inventory');
    inventory.style.display = inventory.style.display === 'none' ? 'block' : 'none';
}

function toggleCrafting() {
    const crafting = document.getElementById('crafting');
    crafting.style.display = crafting.style.display === 'none' ? 'block' : 'none';
}

function toggleBuildingMode() {
    const buildingMode = document.getElementById('building-mode');
    buildingMode.style.display = buildingMode.style.display === 'none' ? 'block' : 'none';
}

function updatePlayerUI() {
    // Update health bar
    const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = `${healthPercent}%`;
    
    // Update stamina bar
    const staminaPercent = (gameState.player.stamina / gameState.player.maxStamina) * 100;
    document.getElementById('stamina-fill').style.width = `${staminaPercent}%`;
    
    // Update food status
    document.getElementById('food-status').textContent = `Food: ${Math.round(gameState.player.hunger)}%`;
    
    // Update debug info
    document.getElementById('debug-info').textContent = 
        `FPS: ${Math.round(1 / deltaTime)} | ` +
        `Position: X:${Math.round(camera.position.x)} Y:${Math.round(camera.position.y)} Z:${Math.round(camera.position.z)}`;
}

function showGameMessage(message) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'game-message';
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    // Remove after 5 seconds
    setTimeout(() => {
        document.body.removeChild(messageElement);
    }, 5000);
}

function showInteractionPrompt(text) {
    let prompt = document.getElementById('interaction-prompt');
    
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'interaction-prompt';
        document.body.appendChild(prompt);
    }
    
    prompt.textContent = text;
    prompt.style.display = 'block';
}

function hideInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
}

function toggleMap() {
    // Create simple map overlay
    let mapOverlay = document.getElementById('map-overlay');
    
    if (mapOverlay) {
        // Remove existing map
        document.body.removeChild(mapOverlay);
    } else {
        // Create new map
        mapOverlay = document.createElement('div');
        mapOverlay.id = 'map-overlay';
        
        // Map content
        mapOverlay.innerHTML = `
            <h2 style="color:#fff;text-align:center">World Map</h2>
            <div id="map-container" style="width:90%;height:80%;margin:0 auto;border:2px solid #555;position:relative;background-color:#115;overflow:hidden">
                <!-- Map markers would be added here -->
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:#f00;font-weight:bold">You are here</div>
            </div>
            <div style="text-align:center;margin-top:10px;color:#ddd">Press M to close</div>
        `;
        
        document.body.appendChild(mapOverlay);
    }
}

// Set up input handlers
function setupInputHandlers() {
    // Movement controls
    document.addEventListener('keydown', (event) => {
        keyboard[event.code] = true;
        
        // UI toggles
        if (event.code === 'KeyE' && controls.isLocked) {
            toggleInventory();
        }
        
        if (event.code === 'KeyC' && controls.isLocked) {
            toggleCrafting();
        }
        
        if (event.code === 'KeyB' && controls.isLocked) {
            toggleBuildingMode();
        }
        
        // Toggle map
        if (event.code === 'KeyM' && controls.isLocked) {
            toggleMap();
        }
        
        // Interact with ship
        if (event.code === 'KeyF' && controls.isLocked) {
            // Check if near ship
            if (playerShip && camera.position.distanceTo(playerShip.position) < 3 && !isOnShip) {
                boardShip(playerShip);
            } else if (isOnShip) {
                leaveShip();
            }
        }
        
        // Use equipped item (for food)
        if (event.code === 'KeyR' && controls.isLocked) {
            const equippedIndex = gameState.player.equipped;
            if (equippedIndex !== null) {
                const item = gameState.player.inventory[equippedIndex];
                
                // Check if it's food
                const isFood = foods.some(food => food.name === item?.name);
                
                if (isFood) {
                    eatFood(equippedIndex);
                }
            }
        }
        
        // Toggle debug mode
        if (event.code === 'F3') {
            const debugInfo = document.getElementById('debug-info');
            debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
        }
        
        // Quick save (just a placeholder, no actual saving implemented)
        if (event.code === 'F5') {
            showGameMessage("Game state saved");
            console.log("Game saved (placeholder)");
        }
    });
    
    document.addEventListener('keyup', (event) => {
        keyboard[event.code] = false;
    });
    
    // Mouse click for interaction/attack
    document.addEventListener('mousedown', (event) => {
        if (!controls.isLocked) return;
        
        // Only process left/right mouse buttons
        if (event.button !== 0 && event.button !== 2) return;
        
        // Left click - primary action (attack/use)
        if (event.button === 0) {
            // If in building mode
            if (selectedBuildingPiece && buildingPreview) {
                placeBuildingPiece();
                return;
            }
            
            // Otherwise attack/interact
            const equippedItem = gameState.player.equipped !== null ? 
                gameState.player.inventory[gameState.player.equipped] : null;
            
            // Check for interaction with nearby object first
            const interactable = checkForInteractable();
            if (interactable) {
                interactWithObject(interactable);
                return;
            }
            
            // Otherwise do attack
            if (equippedItem && (equippedItem.type === 'weapon' || equippedItem.type === 'tool')) {
                attackWithWeapon(equippedItem);
            } else {
                // Unarmed attack
                attackUnarmed();
            }
        }
        
        // Right click - secondary action (block/alt use)
        if (event.button === 2) {
            // If in building mode, cancel
            if (selectedBuildingPiece) {
                cancelBuildingMode();
                return;
            }
            
            // Shield block or alt use
            const equippedItem = gameState.player.equipped !== null ? 
                gameState.player.inventory[gameState.player.equipped] : null;
            
            if (equippedItem && equippedItem.type === 'shield') {
                blockWithShield();
            } else if (equippedItem && equippedItem.type === 'tool') {
                // Alt use for tools
                useToolAlt(equippedItem);
            }
        }
    });
    
    // Prevent context menu on right click
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
    
    // Scroll wheel to change selected hotbar slot
    document.addEventListener('wheel', (event) => {
        if (!controls.isLocked) return;
        
        // Get current equipped slot
        let selectedSlot = gameState.player.equipped;
        
        // Handle case where nothing is selected yet
        if (selectedSlot === null) {
            selectedSlot = 0;
        } else {
            // Move selection based on scroll direction
            if (event.deltaY < 0) {
                // Scroll up - previous slot
                selectedSlot = (selectedSlot - 1 + 6) % 6; // 6 slots total
            } else {
                // Scroll down - next slot
                selectedSlot = (selectedSlot + 1) % 6;
            }
        }
        
        // Update equipped slot
        gameState.player.equipped = selectedSlot;
        updateHotbarSelection();
    });
}

// Update hotbar UI to show selected slot
function updateHotbarSelection() {
    // Remove 'selected' class from all slots
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add 'selected' class to current slot
    if (gameState.player.equipped !== null) {
        slots[gameState.player.equipped].classList.add('selected');
    }
}

// Update inventory display
function updateInventoryDisplay() {
    const inventorySlots = document.getElementById('inventory-slots');
    inventorySlots.innerHTML = '';
    
    gameState.player.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        // Create item representation
        slot.innerHTML = `
            <div class="item ${item.type}">
                <div class="item-name">${item.name}</div>
                ${item.count > 1 ? `<div class="item-count">${item.count}</div>` : ''}
            </div>
        `;
        
        // Add click handler to equip/use
        slot.addEventListener('click', () => {
            equipItem(index);
        });
        
        inventorySlots.appendChild(slot);
    });
    
    // Update hotbar slots too
    updateHotbarSlots();
}

// Update hotbar slots with first 6 inventory items
function updateHotbarSlots() {
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    
    // Clear all slots first
    hotbarSlots.forEach(slot => {
        slot.innerHTML = '';
    });
    
    // Fill slots with first 6 inventory items
    for (let i = 0; i < Math.min(6, gameState.player.inventory.length); i++) {
        const item = gameState.player.inventory[i];
        
        hotbarSlots[i].innerHTML = `
            <div class="item ${item.type}">
                <div class="item-name">${item.name}</div>
                ${item.count > 1 ? `<div class="item-count">${item.count}</div>` : ''}
            </div>
        `;
    }
    
    // Ensure selection is visible
    updateHotbarSelection();
}

// Equip an item
function equipItem(index) {
    gameState.player.equipped = index;
    updateHotbarSelection();
    
    const item = gameState.player.inventory[index];
    showGameMessage(`Equipped: ${item.name}`);
}