// Event system
const gameEvents = {
    forestTrembles: {
        name: 'The Forest is Moving',
        duration: 180, // seconds
        enemySpawnRate: 0.01,
        enemyTypes: ['greyling'],
        message: 'The forest is moving...',
        conditions: () => gameState.world.time > 0.75 // Night time
    },
    eikthyrRage: {
        name: 'Eikthyr Rallies the Creatures',
        duration: 240,
        enemySpawnRate: 0.02,
        enemyTypes: ['boar', 'deer'],
        message: 'Eikthyr rallies the creatures of the meadows...',
        conditions: () => gameState.player.hasItem('eikthyr_trophy')
    },
    coldWind: {
        name: 'A Cold Wind Blows from the Mountains',
        duration: 300,
        enemySpawnRate: 0.008,
        enemyTypes: ['wolf'],
        message: 'A cold wind blows from the mountains...',
        conditions: () => gameState.player.hasItem('silver')
    }
};

function checkForRandomEvents(deltaTime) {
    // Chance to trigger random events
    if (activeEvent) {
        // Update active event
        eventTimeRemaining -= deltaTime;
        
        if (eventTimeRemaining <= 0) {
            // End event
            activeEvent = null;
            console.log("The event has ended.");
            
            // Show message
            showGameMessage("The skies are clear once more.");
        }
    } else if (Math.random() < 0.0005) { // Low chance per frame
        // Check which events can trigger
        const possibleEvents = Object.values(gameEvents).filter(
            event => event.conditions()
        );
        
        if (possibleEvents.length > 0) {
            // Select random event from possible events
            const event = possibleEvents[
                Math.floor(Math.random() * possibleEvents.length)
            ];
            
            // Start event
            activeEvent = event;
            eventTimeRemaining = event.duration;
            
            // Show message
            showGameMessage(event.message);
            
            console.log(`Event started: ${event.name}`);
        }
    }
}