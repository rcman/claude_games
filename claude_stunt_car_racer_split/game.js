// Main game class that coordinates everything
class StuntCarRacer {
    constructor() {
        // Game state
        this.gameState = 'start'; // start, menu, countdown, race, gameOver
        
        // Input handling
        this.keys = {};
        this.setupInputHandlers();
        
        // Initialize systems
        this.ui = new UIManager(this);
        this.trackManager = new TrackManager(this);
        this.physics = new PhysicsEngine(this);
        this.renderer = new Renderer(this);
        
        // Race info
        this.lap = 1;
        this.totalLaps = 3;
        this.raceStartTime = 0;
        this.raceFinishTime = 0;
        this.currentCheckpoint = 0;
        
        // League info
        this.division = 4;
        this.playerPoints = 0;
        this.cpuPoints = [0, 0, 0];
        
        // Start the game loop
        this.lastTime = 0;
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setGameState(state) {
        this.gameState = state;
    }
    
    startRace() {
        // Begin countdown
        this.ui.startCountdown(() => {
            this.gameState = 'race';
            this.raceStartTime = Date.now();
            
            // Reset race data
            this.physics.resetCar();
            this.currentCheckpoint = 0;
            this.lap = 1;
            this.ui.updateLap(this.lap, this.totalLaps);
            this.ui.updateDamageDisplay(0);
        });
    }
    
    endRace(crashed = false) {
        this.gameState = 'gameOver';
        this.raceFinishTime = Date.now();
        
        const raceTime = this.raceFinishTime - this.raceStartTime;
        let result;
        let points = 0;
        
        if (crashed) {
            result = 'CAR CRASHED';
            points = 0;
        } else {
            result = 'RACE COMPLETE';
            // Award points based on finish time
            if (raceTime < 60000) { // Under 1 minute
                points = 10;
            } else if (raceTime < 90000) { // Under 1:30
                points = 8;
            } else if (raceTime < 120000) { // Under 2 minutes
                points = 6;
            } else {
                points = 4;
            }
        }
        
        // Update league points
        this.playerPoints += points;
        
        // Generate random points for CPU drivers
        for (let i = 0; i < this.cpuPoints.length; i++) {
            this.cpuPoints[i] += Math.floor(Math.random() * 6) + 1;
        }
        
        // Show end race screen
        this.ui.showGameOver(result, raceTime, this.physics.car.damage, points);
    }
    
    updateCheckpoints() {
        if (this.gameState !== 'race') return;
        
        // Get current segment
        const segmentIndex = Math.floor(this.physics.car.position.y / 5) % this.trackManager.currentTrack.segments.length;
        
        // Check if we've crossed the next checkpoint
        if (this.trackManager.checkpoints.includes(segmentIndex) && 
            this.trackManager.checkpoints.indexOf(segmentIndex) === this.currentCheckpoint) {
            this.currentCheckpoint = (this.currentCheckpoint + 1) % this.trackManager.checkpoints.length;
            
            // Check for lap completion
            if (this.currentCheckpoint === 0) {
                this.lap++;
                this.ui.updateLap(this.lap, this.totalLaps);
                
                // Check for race completion
                if (this.lap > this.totalLaps) {
                    this.endRace();
                }
            }
        }
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;
        
        // Handle input and update
        this.physics.handleInput(this.keys);
        this.physics.update();
        
        // Render scene
        this.renderer.render();
        
        // Continue game loop
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new StuntCarRacer();
});