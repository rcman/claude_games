// game/persistence.js
// Handles saving and loading game state using browser localStorage.

// Import necessary modules to get their state
import * as World from './world.js';
import * as Player from './player.js';
import * as InfectedManager from './infected.js';
import * as Crafting from './crafting.js';
import * as Building from './building.js';
// Import others as needed

const SAVE_SLOT_KEY = 'mistSurvival_saveGame';

// --- Saving ---
export function saveGame() {
    console.log("Saving game...");
    try {
        const gameState = {
            saveFormatVersion: 1, // To handle future changes
            saveTimestamp: Date.now(),
            world: World.getState(),
            player: Player.getState(),
            infected: InfectedManager.getState(),
            crafting: Crafting.getState(),
            building: Building.getState(),
            // Add state from other modules here...
             // vehicles: VehicleManager.getState(),
        };

        // Convert complex objects (like Vector3) to simpler structures if needed before stringifying
        // (Though the current getState implementations return simple objects)

        const jsonString = JSON.stringify(gameState);
        localStorage.setItem(SAVE_SLOT_KEY, jsonString);
        console.log("Game saved successfully!");
        // UIManager.addLogMessage("Game Saved."); // Use UI Manager

    } catch (error) {
        console.error("Error saving game:", error);
        // UIManager.addLogMessage("Error saving game!");
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
            // UIManager.addLogMessage("No save game found.");
            return null; // Indicate no save data exists
        }

        const gameState = JSON.parse(jsonString);

        // TODO: Check gameState.saveFormatVersion if handling multiple versions

        console.log("Save data found, loading state...");
        // UIManager.addLogMessage("Loading saved game...");

        // Return the loaded state object for main.js to distribute
        return gameState;

    } catch (error) {
        console.error("Error loading game:", error);
        // UIManager.addLogMessage("Error loading save game!");
        // Corrupted save? Delete it?
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
    // UIManager.addLogMessage("Save game deleted.");
}