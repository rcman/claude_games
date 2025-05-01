// Physics and car handling
class PhysicsEngine {
    constructor(game) {
        this.game = game;
        
        // Player car state
        this.car = {
            position: { x: 0, y: 0, z: 0.5 }, // Slightly above ground to start
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            speed: 0,
            onGround: true,
            steeringAngle: 0,
            maxSteeringAngle: Math.PI / 6, // 30 degrees
            enginePower: 0,
            maxEnginePower: 0.02,
            brakePower: 0.03,
            drag: 0.98,
            gravity: 0.01,
            damage: 0
        };
    }
    
    resetCar() {
        this.car.position = { x: 0, y: 0, z: 0.5 }; // Slightly above ground to start
        this.car.rotation = { x: 0, y: 0, z: 0 };
        this.car.velocity = { x: 0, y: 0, z: 0 };
        this.car.speed = 0;
        this.car.damage = 0;
        this.car.onGround = true;
    }
    
    handleInput(keys) {
        if (this.game.gameState !== 'race') return;
        
        // Accelerate
        if (keys['w'] || keys['arrowup']) {
            this.car.enginePower = this.car.maxEnginePower;
        } else {
            this.car.enginePower = 0;
        }
        
        // Brake
        if (keys['s'] || keys['arrowdown']) {
            this.car.enginePower = -this.car.brakePower;
        }
        
        // Steering
        if (keys['a'] || keys['arrowleft']) {
            this.car.steeringAngle = Math.min(this.car.steeringAngle + 0.02, this.car.maxSteeringAngle);
        } else if (keys['d'] || keys['arrowright']) {
            this.car.steeringAngle = Math.max(this.car.steeringAngle - 0.02, -this.car.maxSteeringAngle);
        } else {
            // Return to center
            if (this.car.steeringAngle > 0) {
                this.car.steeringAngle = Math.max(0, this.car.steeringAngle - 0.01);
            } else if (this.car.steeringAngle < 0) {
                this.car.steeringAngle = Math.min(0, this.car.steeringAngle + 0.01);
            }
        }
    }
    
    update() {
        if (this.game.gameState !== 'race') return;
        
        // Apply engine power
        const forwardVector = {
            x: Math.sin(this.car.rotation.y),
            y: Math.cos(this.car.rotation.y),
            z: 0
        };
        
        this.car.velocity.x += forwardVector.x * this.car.enginePower;
        this.car.velocity.y += forwardVector.y * this.car.enginePower;
        
        // Apply steering
        if (Math.abs(this.car.speed) > 0.01) {
            this.car.rotation.y += this.car.steeringAngle * (this.car.speed / 2);
        }
        
        // Apply gravity if not on ground
        if (!this.car.onGround) {
            this.car.velocity.z -= this.car.gravity;
        }
        
        // Calculate current speed
        this.car.speed = Math.sqrt(
            this.car.velocity.x * this.car.velocity.x + 
            this.car.velocity.y * this.car.velocity.y
        );
        
        // Apply drag
        this.car.velocity.x *= this.car.drag;
        this.car.velocity.y *= this.car.drag;
        this.car.velocity.z *= this.car.drag;
        
        // Update position
        this.car.position.x += this.car.velocity.x;
        this.car.position.y += this.car.velocity.y;
        this.car.position.z += this.car.velocity.z;
        
        // Check track collision
        this.checkTrackCollision();
        
        // Update speedometer
        const speedMph = Math.round(this.car.speed * 100);
        document.getElementById('speedometer').textContent = `${speedMph} MPH`;
        
        // Update checkpoints
        this.game.updateCheckpoints();
    }
    
    checkTrackCollision() {
        // Check if car is within track width
        if (!this.game.trackManager.isWithinTrackWidth(this.car.position)) {
            // Car is off the track horizontally
            this.car.damage += 0.01; // Slight damage
            this.game.ui.updateDamageDisplay(this.car.damage);
            
            // Bounce back
            this.car.velocity.x *= -0.5;
            this.car.position.x = Math.sign(this.car.position.x) * 3; // 3 is half track width
        }
        
        // Get track height at car position
        const trackHeight = this.game.trackManager.getTrackHeightAt(this.car.position);
        
        // Check if car is on the track
        const heightDifference = this.car.position.z - trackHeight;
        
        if (heightDifference <= 0.1 && this.car.velocity.z <= 0) {
            // Car is on the ground
            this.car.position.z = trackHeight + 0.1;
            this.car.velocity.z = 0;
            this.car.onGround = true;
            
            // Calculate impact force if landing hard
            if (this.car.velocity.z < -0.2) {
                const impactForce = Math.abs(this.car.velocity.z);
                this.car.damage += impactForce * 0.1;
                this.game.ui.updateDamageDisplay(this.car.damage);
            }
        } else {
            // Car is in the air
            this.car.onGround = false;
        }
    }
    
    getCameraInfo() {
        return {
            position: this.car.position,
            rotation: this.car.rotation,
            distance: 10,
            height: 3,
            fov: 90 * Math.PI / 180
        };
    }
}