// Inventory and item system
function updateInventoryDisplay() {
    const inventorySlots = document.getElementById('inventory-slots');
    inventorySlots.innerHTML = '';
    
    // Create inventory slots
    for (let i = 0; i < 30; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        const item = gameState.player.inventory[i];
        if (item) {
            slot.innerHTML = `
                <div class="item-icon">${item.name.charAt(0)}</div>
                <div class="item-count">${item.count}</div>
            `;
            
            // Add tooltip with item details
            slot.title = `${item.name}\n${item.type}`;
            if (item.damage) slot.title += `\nDamage: ${item.damage}`;
            if (item.durability) slot.title += `\nDurability: ${item.durability}`;
            
            // Add event listener to equip item
            slot.addEventListener('click', () => {
                equipItem(i);
            });
            
            // Highlight equipped item
            if (i === gameState.player.equipped) {
                slot.classList.add('equipped');
            }
        }
        
        inventorySlots.appendChild(slot);
    }
    
    // Update hotbar
    updateHotbar();
}

function updateHotbar() {
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    
    hotbarSlots.forEach((slot, index) => {
        slot.innerHTML = '';
        
        const item = gameState.player.inventory[index];
        if (item) {
            slot.innerHTML = `
                <div class="item-icon">${item.name.charAt(0)}</div>
                <div class="item-count">${item.count}</div>
            `;
            
            // Add tooltip
            slot.title = item.name;
        }
        
        // Highlight selected slot
        if (index === gameState.player.equipped) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    });
}

function equipItem(index) {
    const item = gameState.player.inventory[index];
    
    if (item && (item.type === 'weapon' || item.type === 'tool')) {
        gameState.player.equipped = index;
        
        // Update visual cue for equipped item
        document.querySelectorAll('.inventory-slot').forEach((slot, i) => {
            if (i === index) {
                slot.classList.add('equipped');
            } else {
                slot.classList.remove('equipped');
            }
        });
        
        // Update hotbar
        updateHotbar();
        
        console.log(`Equipped: ${item.name}`);
    }
}

function collectResource(resource) {
    // Add resource to inventory
    const existingResource = gameState.player.inventory.find(
        item => item.type === resource.type && item.name === resource.name
    );
    
    if (existingResource) {
        existingResource.count += resource.count;
    } else {
        gameState.player.inventory.push(resource);
    }
    
    // Update inventory display
    updateInventoryDisplay();
    
    // Show message
    showGameMessage(`Collected: ${resource.count} ${resource.name || resource.type}`);
    
    console.log(`Collected: ${resource.count} ${resource.type}`);
}