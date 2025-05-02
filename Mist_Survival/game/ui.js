// game/ui.js
// Handles updating HTML DOM elements to reflect game state.

// --- Import Dependencies ---
import * as Player from './player.js'; // Moved import to top to prevent circular dependencies

// --- DOM Element References ---
// Get references early, maybe in an init function
let healthValue, staminaValue, fatigueValue, hungerValue, thirstValue;
let timeValue, mistStatus;
let messageLog;
let buildModeStatus;
let inventoryPanel, craftingPanel, buildPanel; // Containers for menus
let equippedItemUI;
let craftingProgressUI; // Progress bar element
let damageIndicatorUI; // Element for screen flash/vignette

// --- Initialization ---
export function init() {
    console.log("Initializing UI Manager...");
    // Get essential HUD elements
    healthValue = document.getElementById('health-value');
    staminaValue = document.getElementById('stamina-value');
    fatigueValue = document.getElementById('fatigue-value');
    hungerValue = document.getElementById('hunger-value');
    thirstValue = document.getElementById('thirst-value');
    timeValue = document.getElementById('time-value');
    mistStatus = document.getElementById('mist-status');
    messageLog = document.getElementById('message-log');
    buildModeStatus = document.getElementById('build-mode-status');

    // Get menu panels (assuming they exist in index.html, initially hidden)
    inventoryPanel = document.getElementById('inventory-panel'); // Example ID
    craftingPanel = document.getElementById('crafting-panel'); // Example ID
    buildPanel = document.getElementById('build-panel');       // Example ID
    equippedItemUI = document.getElementById('equipped-item'); // Example ID
    craftingProgressUI = document.getElementById('crafting-progress'); // Example ID
    damageIndicatorUI = document.getElementById('damage-indicator'); // Example ID

    // Ensure elements exist (basic check)
    if (!healthValue || !messageLog /* ... check others */) {
        console.error("UI Init Error: One or more essential UI elements not found in HTML!");
    }

    // Hide panels initially
    hideElement(inventoryPanel);
    hideElement(craftingPanel);
    hideElement(buildPanel);
}

// --- Update Functions ---

export function updateStatsUI(playerStats) {
    if (!healthValue) return; // Check if initialized
    healthValue.textContent = Math.round(playerStats.health);
    staminaValue.textContent = Math.round(playerStats.stamina);
    fatigueValue.textContent = Math.round(playerStats.fatigue);
    hungerValue.textContent = Math.round(playerStats.hunger);
    thirstValue.textContent = Math.round(playerStats.thirst);

    // TODO: Update progress bars/visual indicators based on stats
}

export function updateWorldUI(worldState) {
    if (!timeValue) return;
     // Time
    const hours = Math.floor(worldState.gameTime / 3600) % 24;
    const minutes = Math.floor((worldState.gameTime % 3600) / 60);
    timeValue.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
     // Mist
    if (mistStatus) {
        mistStatus.textContent = worldState.isMistActive ? "ACTIVE" : "Clear";
        mistStatus.style.color = worldState.isMistActive ? "red" : "lime";
    }
}

export function updateBuildModeUI(isActive, currentBuildableName = '') {
    if (!buildModeStatus) return;
    buildModeStatus.textContent = isActive ? `Placing: ${currentBuildableName}` : "Off";
    buildModeStatus.style.color = isActive ? "cyan" : "gray";
}

export function updateEquippedUI(item) {
    if (!equippedItemUI) return;
    equippedItemUI.textContent = item ? item.name : "Hands";
    // TODO: Show item icon?
}

export function updateCraftingProgress(progress) { // progress is 0.0 to 1.0
     if (!craftingProgressUI) return;
     if (progress > 0) {
         showElement(craftingProgressUI);
         const fillElement = document.getElementById('crafting-progress-fill');
         if (fillElement) {
             fillElement.style.width = `${progress * 100}%`; // Update the fill element, not the container
             fillElement.textContent = `${Math.round(progress*100)}%`;
         }
     } else {
         hideElement(craftingProgressUI);
     }
}


// --- Log Messages ---
const MAX_LOG_MESSAGES = 10;
export function addLogMessage(message) {
    if (!messageLog) {
        console.log("Log:", message); // Fallback to console if UI element not ready
        return;
    }
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newMessage = document.createElement('div');
    newMessage.textContent = `[${timestamp}] ${message}`;
    messageLog.appendChild(newMessage);
    // Limit number of messages
    while (messageLog.children.length > MAX_LOG_MESSAGES) {
        messageLog.removeChild(messageLog.firstChild);
    }
    // Scroll to bottom
    messageLog.scrollTop = messageLog.scrollHeight;
}

// --- Menu Management ---
// These functions would populate the respective panels with data and show/hide them.
// They often require data from other modules (Player, Crafting, Building).

export function toggleInventoryUI(inventory) {
    if (!inventoryPanel) return;
    if (inventoryPanel.style.display === 'block') {
        hideElement(inventoryPanel);
        // TODO: Re-enable pointer lock if needed?
    } else {
        populateInventoryPanel(inventory);
        showElement(inventoryPanel);
        hideElement(craftingPanel); // Hide other panels
        hideElement(buildPanel);
         // TODO: Force pointer unlock? document.exitPointerLock();
    }
}

function populateInventoryPanel(inventory) {
    if (!inventoryPanel) return;
    // Clear previous content
    const title = document.createElement('h2');
    title.textContent = 'Inventory';
    inventoryPanel.innerHTML = '';
    inventoryPanel.appendChild(title);
    
    // Create list items/grid for inventory items
    const list = document.createElement('ul');
    if (!inventory || inventory.length === 0) {
        list.innerHTML = '<li>Empty</li>';
    } else {
        inventory.forEach(item => {
            const li = document.createElement('li');
             // TODO: Add buttons for 'Use', 'Equip', 'Drop'
            li.textContent = `${item.name} x${item.quantity}`;
            const useButton = document.createElement('button');
            useButton.textContent = 'Use';
            useButton.onclick = () => {
                 if (typeof Player.consumeItem === 'function') {
                     Player.consumeItem(item);
                     // Refresh panel with updated inventory
                     if (typeof Player.getInventory === 'function') {
                         populateInventoryPanel(Player.getInventory());
                     }
                 }
             };
             // Add equip button for tools/weapons
             if (item.type === 'tool' || item.type === 'weapon') {
                 const equipButton = document.createElement('button');
                 equipButton.textContent = 'Equip';
                 equipButton.onclick = () => { 
                     if (typeof Player.equipItem === 'function') {
                         Player.equipItem(item); 
                     }
                 };
                 li.appendChild(equipButton);
             }

            if(item.type === 'consumable') li.appendChild(useButton);
            list.appendChild(li);
        });
    }
    inventoryPanel.appendChild(list);
    addCloseButton(inventoryPanel, () => toggleInventoryUI([])); // Pass empty array to force close
}

export function toggleCraftingUI(availableRecipes, canCraftCheck) {
     if (!craftingPanel) return;
     if (craftingPanel.style.display === 'block') {
         hideElement(craftingPanel);
     } else {
         populateCraftingPanel(availableRecipes, canCraftCheck);
         showElement(craftingPanel);
         hideElement(inventoryPanel);
         hideElement(buildPanel);
         // TODO: Force pointer unlock?
     }
}

function populateCraftingPanel(recipes, canCraftCheck) {
     if (!craftingPanel) return;
     const title = document.createElement('h2');
     title.textContent = 'Crafting';
     craftingPanel.innerHTML = '';
     craftingPanel.appendChild(title);
     
     const list = document.createElement('ul');
     if (!recipes || recipes.length === 0) {
         list.innerHTML = '<li>No recipes available here.</li>';
     } else {
         recipes.forEach(recipe => {
             const li = document.createElement('li');
             const canAfford = typeof canCraftCheck === 'function' ? canCraftCheck(recipe.id) : false;
             li.innerHTML = `<b>${recipe.name}</b> (Output: ${recipe.output.quantity}x ${recipe.output.item})<br>Requires: ${recipe.requires.map(r => `${r.count}x ${r.item}`).join(', ')}`;
             li.style.color = canAfford ? 'white' : '#aaa'; // Dim if cannot craft

             const craftButton = document.createElement('button');
             craftButton.textContent = 'Craft';
             craftButton.disabled = !canAfford;
             craftButton.onclick = () => {
                  // Call crafting logic (potentially in Crafting module)
                 import('./crafting.js').then(Crafting => {
                     if (Crafting.startCraft(recipe.id)) {
                         // Optionally close UI after starting craft or update button state
                         // Refresh UI potentially after craft finishes? More complex.
                     }
                 }).catch(err => {
                     console.error("Failed to import Crafting module:", err);
                 });
             };
             li.appendChild(craftButton);
             list.appendChild(li);
         });
     }
     craftingPanel.appendChild(list);
     addCloseButton(craftingPanel, () => toggleCraftingUI([], () => false));
}


export function showBuildUI(categories) {
     if (!buildPanel) return;
     populateBuildPanel(categories);
     showElement(buildPanel);
     // Typically don't hide others here as build mode might coexist with game view
     // TODO: Force pointer unlock?
}

export function hideBuildUI() {
     hideElement(buildPanel);
}

function populateBuildPanel(categories) {
     if (!buildPanel) return;
     const title = document.createElement('h2');
     title.textContent = 'Build Menu';
     buildPanel.innerHTML = '';
     buildPanel.appendChild(title);
     
     // Create UI elements based on categories and items
     for (const category in categories) {
         const catDiv = document.createElement('div');
         catDiv.innerHTML = `<h3>${category}</h3>`;
         const list = document.createElement('ul');
         categories[category].forEach(buildable => {
             const li = document.createElement('li');
             li.innerHTML = `${buildable.name} <small>(${buildable.requires.map(r => `${r.count}x ${r.item}`).join(', ')})</small>`;
             // Check if player can afford it (visual only, placement checks later)
             let canAfford = true;
             for (const req of buildable.requires) {
                 if (typeof Player.hasItem === 'function' && !Player.hasItem(req.item, req.count)) {
                     canAfford = false;
                     break;
                 }
             }
             li.style.color = canAfford ? 'white' : '#aaa';

             const selectButton = document.createElement('button');
             selectButton.textContent = 'Select';
             selectButton.onclick = () => {
                 // Tell Building module which item was selected
                 import('./building.js').then(Building => {
                     Building.selectBuildable(buildable.id);
                     // Maybe hide the build menu after selection? Optional.
                     // hideBuildUI();
                 }).catch(err => {
                     console.error("Failed to import Building module:", err);
                 });
             };
             li.appendChild(selectButton);
             list.appendChild(li);
         });
         catDiv.appendChild(list);
         buildPanel.appendChild(catDiv);
     }
     addCloseButton(buildPanel, hideBuildUI);
}

// --- Utility Functions ---
function showElement(element) {
    if (element) element.style.display = 'block'; // Or 'flex', 'grid' depending on layout
}

function hideElement(element) {
    if (element) element.style.display = 'none';
}

function addCloseButton(panel, closeAction) {
     if (!panel) return;
     const closeButton = document.createElement('button');
     closeButton.textContent = 'Close (Esc)';
     closeButton.className = 'close-button';
     closeButton.style.marginTop = '10px';
     closeButton.onclick = closeAction;
     panel.appendChild(closeButton);
}

// --- Effects ---
export function showDamageIndicator() {
     if (!damageIndicatorUI) return;
     damageIndicatorUI.classList.add('active');
     setTimeout(() => {
         if (damageIndicatorUI) {
             damageIndicatorUI.classList.remove('active');
         }
     }, 300); // Duration of the effect
}

/**
 * Shows the loading screen with custom message
 * @param {string} message Message to display
 * @param {boolean} isError Whether this is an error state
 */
export function showLoadingScreen(message, isError = false) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingStatus = document.getElementById('loading-status');
    
    if (!loadingScreen || !loadingStatus) return;
    
    loadingScreen.style.display = 'flex';
    loadingStatus.textContent = message;
    
    if (isError) {
        loadingStatus.style.color = '#ff5555';
    } else {
        loadingStatus.style.color = 'white';
    }
}

/**
 * Hides the loading screen
 */
export function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}

/**
 * Shows the pause menu
 */
export function showPauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.style.display = 'block';
}

/**
 * Hides the pause menu
 */
export function hidePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.style.display = 'none';
}

/**
 * Updates vehicle UI with current stats
 * @param {object} stats Vehicle stats
 * @param {number} speed Current speed
 */
export function updateVehicleUI(stats, speed) {
    const vehicleUI = document.getElementById('vehicle-ui');
    const speedElement = document.getElementById('vehicle-speed');
    const fuelElement = document.getElementById('vehicle-fuel');
    const maxFuelElement = document.getElementById('vehicle-max-fuel');
    
    if (!vehicleUI || !speedElement || !fuelElement || !maxFuelElement) return;
    
    vehicleUI.style.display = 'block';
    speedElement.textContent = Math.round(speed);
    fuelElement.textContent = Math.round(stats.fuel);
    maxFuelElement.textContent = Math.round(stats.maxFuel);
}

/**
 * Shows the vehicle UI
 */
export function showVehicleUI() {
    const vehicleUI = document.getElementById('vehicle-ui');
    if (vehicleUI) vehicleUI.style.display = 'block';
}

/**
 * Hides the vehicle UI
 */
export function hideVehicleUI() {
    const vehicleUI = document.getElementById('vehicle-ui');
    if (vehicleUI) vehicleUI.style.display = 'none';
}

/**
 * Updates the inventory UI with current items
 * @param {Array} inventory Array of inventory items
 */
export function updateInventoryUI(inventory) {
    // If inventory panel is visible, refresh its contents
    const panel = document.getElementById('inventory-panel');
    if (panel && panel.style.display === 'block') {
        populateInventoryPanel(inventory);
    }
}