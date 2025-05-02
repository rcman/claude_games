// game/persistence.js
// Handles saving and loading game state using browser localStorage.

// Import necessary modules to get their state
import * as World from './world.js';
import * as Player from './player.js';
import * as InfectedManager from './infected.js';
import * as Crafting from './crafting.js';
import * as Building from './building.js';
import * as Vehicles from './vehicles.js';
import * as UIManager from './ui.js';

const SAVE_SLOT_KEY = 'mistSurvival_saveGame';

// --- Saving ---
export function saveGame() {
    console.log("Saving game...");
    try {
        // Collect state from each module
        const gameState = {
            saveFormatVersion: 1, // To handle future changes
            saveTimestamp: Date.now(),
            world: typeof World.getState === 'function' ? World.getState() : {},
            player: typeof Player.getState === 'function' ? Player.getState() : {},
            infected: typeof InfectedManager.getState === 'function' ? InfectedManager.getState() : [],
            crafting: typeof Crafting.getState === 'function' ? Crafting.getState() : {},
            building: typeof Building.getState === 'function' ? Building.getState() : {},
            vehicles: typeof Vehicles.getState === 'function' ? Vehicles.getState() : [],
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(gameState);
        localStorage.setItem(SAVE_SLOT_KEY, jsonString);
        console.log("Game saved successfully!");
        
        if (UIManager && typeof UIManager.addLogMessage === 'function') {
            UIManager.addLogMessage("Game Saved.");
        }

    } catch (error) {
        console.error("Error saving game:", error);
        if (UIManager && typeof UIManager.addLogMessage === 'function') {
            UIManager.addLogMessage("Error saving game!");
        }
        // Potentially alert the user
    }
}

// --- Loading ---
export function loadGame() {
    console.log("Attempting to load game...");
    try {
        const jsonString = localStorage.getItem(SAVE_SLOT_KEY);
        if (!jsonString) {
            console.log("No save data found.");
            if (UIManager && typeof UIManager.addLogMessage === 'function') {
                UIManager.addLogMessage("No save game found.");
            }
            return null; // Indicate no save data exists
        }

        const gameState = JSON.parse(jsonString);

        // Check for version compatibility
        const currentVersion = 1;
        const savedVersion = gameState.saveFormatVersion || 0;
        
        if (savedVersion > currentVersion) {
            console.warn(`Save data is from a newer version (${savedVersion} vs ${currentVersion}). Some features may not load correctly.`);
        }

        console.log("Save data found, loading state...");
        if (UIManager && typeof UIManager.addLogMessage === 'function') {
            UIManager.addLogMessage("Loading saved game...");
        }

        // Return the loaded state object for main.js to distribute
        return gameState;

    } catch (error) {
        console.error("Error loading game:", error);
        if (UIManager && typeof UIManager.addLogMessage === 'function') {
            UIManager.addLogMessage("Error loading save game!");
        }
        // If save data is corrupted, consider deleteing it
        // localStorage.removeItem(SAVE_SLOT_KEY);
        return null; // Indicate error during load
    }
}

export function hasSaveGame() {
    return localStorage.getItem(SAVE_SLOT_KEY) !== null;
}

export function deleteSaveGame() {
    console.log("Deleting save game...");
    localStorage.removeItem(SAVE_SLOT_KEY);
    if (UIManager && typeof UIManager.addLogMessage === 'function') {
        UIManager.addLogMessage("Save game deleted.");
    }
}