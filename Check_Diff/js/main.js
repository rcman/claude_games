// main.js - Entry point for the game

// Global settings object
window.gameSettings = {
    mapHeightFactor: 1.0,
    maxHunters: 5,
    maxAnimals: 600,
    maxTrees: 1000,
    maxRocks: 800,
    maxFiber: 1500,
    alwaysSunny: false,
    rainChance: 20 // Percentage
};

function startGame() {
    console.log("Starting game with settings:", window.gameSettings);
    const settingsMenu = document.getElementById('settings-menu'); // Get menu element here
    if (settingsMenu) {
        settingsMenu.style.display = 'none'; // Hide settings
    } else {
        console.warn("Could not find settings menu element to hide.");
    }


    try {
        // Check if Game class is available (using the target engine, Babylon.js)
        if (typeof Game === 'undefined' || typeof BABYLON === 'undefined') {
            console.error("FATAL: Game class or BABYLON is not defined. Check script loading order in index.html.");
            alert("Error: Game components not found. Check console (F12).");
            document.body.innerHTML = '<div style="color: red; font-size: 20px; padding: 40px;">Failed to load game components. Check console (F12).</div>';
            return;
        }

        // Instantiate the Game class (already uses window.gameSettings internally)
        window.game = new Game(); // Game constructor reads window.gameSettings
        console.log("Game instance created successfully.");

    } catch (error) {
        console.error("FATAL: Failed to initialize game:", error);
        alert("An error occurred while starting the game. Check console (F12).");
        document.body.innerHTML = `<div style="color: red; font-size: 20px; padding: 40px;">Error: ${error.message}. Check console (F12).</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Settings menu ready.");

    // --- Get Element References with Checks ---
    const settingsMenu = document.getElementById('settings-menu');
    const startButton = document.getElementById('start-game-button');
    const mapHeightInput = document.getElementById('setting-map-height');
    const huntersInput = document.getElementById('setting-hunters');
    const animalsInput = document.getElementById('setting-animals');
    const treesInput = document.getElementById('setting-trees');
    const rocksInput = document.getElementById('setting-rocks');
    const fiberInput = document.getElementById('setting-fiber');
    const sunnyInput = document.getElementById('setting-always-sunny');
    const rainInput = document.getElementById('setting-rain-chance');

    // Check if all essential elements were found
    if (!settingsMenu || !startButton || !mapHeightInput || !huntersInput || !animalsInput || !treesInput || !rocksInput || !fiberInput || !sunnyInput || !rainInput) {
        console.error("One or more settings menu elements could not be found in the HTML. Check IDs in index.html.");
        // Optionally display an error to the user
        if (settingsMenu) { // If menu exists, show error there
             settingsMenu.innerHTML = "<h2 style='color:red;'>Error: UI Elements Missing!</h2><p>Check console (F12) for details. Ensure IDs in index.html match those in main.js.</p>";
         } else { // Fallback if even menu is missing
             document.body.innerHTML = "<div style='color: red; font-size: 20px; padding: 40px;'>Error loading settings UI. Check console (F12).</div>";
         }
        return; // Stop execution if elements are missing
    }

    // --- Add Listener to Start Button (with check) ---
    startButton.addEventListener('click', () => {
        // Read settings from inputs and store them in the global object
        // Use || 1.0 etc. as fallbacks in case parsing fails
        window.gameSettings.mapHeightFactor = parseFloat(mapHeightInput.value) || 1.0;
        window.gameSettings.maxHunters = parseInt(huntersInput.value) || 5;
        window.gameSettings.maxAnimals = parseInt(animalsInput.value) || 600;
        window.gameSettings.maxTrees = parseInt(treesInput.value) || 1000;
        window.gameSettings.maxRocks = parseInt(rocksInput.value) || 800;
        window.gameSettings.maxFiber = parseInt(fiberInput.value) || 1500;
        window.gameSettings.alwaysSunny = sunnyInput.checked;
        window.gameSettings.rainChance = parseInt(rainInput.value) || 20;

        // Call the function to actually start the game
        startGame();
    });

    // --- Add Listener to Sunny Checkbox (with check) ---
    sunnyInput.addEventListener('change', () => {
        // Ensure rainInput exists before trying to disable it
        if (rainInput) {
             rainInput.disabled = sunnyInput.checked;
             if (sunnyInput.checked) {
                 // Optional: Visually grey out the rain chance label/value too
                 rainInput.parentNode.style.opacity = '0.5';
             } else {
                 rainInput.parentNode.style.opacity = '1';
             }
        }
    });

    // --- Initialize Rain Input Disabled State ---
    // Ensure both sunnyInput and rainInput were found before doing this
    if (sunnyInput && rainInput) {
        rainInput.disabled = sunnyInput.checked;
         if (sunnyInput.checked) {
             rainInput.parentNode.style.opacity = '0.5';
         } else {
             rainInput.parentNode.style.opacity = '1';
         }
    }

});