// Player Controller
class Player {
    constructor(game) {
        this.game = game;
        
        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.maxHunger = 100;
        this.thirst = 100;
        this.maxThirst = 100;
        
        // Movement properties
        this.moveSpeed = 5;
        this.runSpeed = 8;
        this.jumpForce = 10;
        this.gravity = 20;
        
        // Physics
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isOnGround = false;
        this.isRunning = false;
        
        // Controls state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        // Player model
        this.height = 1.8;
        this.radius = 0.4;
        
        // Create player mesh
        this.createPlayerModel();
        
        // Setup camera controls
        this.setupCameraControls();
        
        // Position
        this.position = this.mesh.position;
        
        // Stats decrease rates per second
        this.hungerDecreaseRate = 1;
        this.thirstDecreaseRate = 1.5;
        
        // Action states
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackCooldownTime = 0.5; // seconds
        
        // Tool and equipped item
        this.equippedItemIndex = 0;
        this.equippedItem = null;
    }

    createPlayerModel() {
        // Create a simple capsule for the player's body
        const geometry = new THREE.CapsuleGeometry(this.radius, this.height - this.radius * 2, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x0000ff, transparent: true, opacity: 0.0 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, this.height / 2, 0);
        this.mesh.userData.type = 'player';
        
        // Add player model to scene
        this.game.scene.add(this.mesh);
        
        // Create a simple tool/hand model
        this.createToolModel();
    }

    createToolModel() {
        // Create a simple box for the player's tool/hand
        const toolGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const toolMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.toolMesh = new THREE.Mesh(toolGeometry, toolMaterial);
        
        // Position tool in front of and to the right of the camera
        this.toolMesh.position.set(0.4, -0.3, -0.5);
        
        // Add tool to camera (so it moves with the camera)
        this.game.camera.add(this.toolMesh);
    }

    setupCameraControls() {
        // First person camera setup
        this.pitchObject = new THREE.Object3D();
        this.pitchObject.position.y = this.height;
        this.mesh.add(this.pitchObject);
        
        this.yawObject = new THREE.Object3D();
        this.yawObject.add(this.game.camera);
        this.pitchObject.add(this.yawObject);
        
        // Mouse sensitivity
        this.mouseSensitivity = 0.002;
        
        // Set up pointer lock controls
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.game.renderer.domElement) {
                // Rotate around Y-axis (left/right)
                this.pitchObject.rotation.y -= event.movementX * this.mouseSensitivity;
                
                // Rotate around X-axis (up/down)
                this.yawObject.rotation.x -= event.movementY * this.mouseSensitivity;
                
                // Limit up/down rotation to prevent over-rotation
                this.yawObject.rotation.x = Math.max(
                    -Math.PI / 2,
                    Math.min(Math.PI / 2, this.yawObject.rotation.x)
                );
            }
        });
    }

    spawn() {
        // Find suitable spawn position (e.g., on land)
        const spawnPos = this.findSpawnPosition();
        this.mesh.position.copy(spawnPos);
        
        // Reset stats
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        
        // Update UI
        this.updateStatsUI();
    }

    findSpawnPosition() {
        // In a real implementation, find a suitable position on the terrain
        // For now, just return a fixed position above the ground
        return new THREE.Vector3(0, this.height / 2 + 0.5, 0);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.velocity.y = this.jumpForce;
                    this.canJump = false;
                }
                break;
            case 'ShiftLeft':
                this.isRunning = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
                this.isRunning = false;
                break;
        }
    }

    attack() {
        if (this.attackCooldown > 0) return;
        
        // Set attacking state
        this.isAttacking = true;
        this.attackCooldown = this.attackCooldownTime;
        
        // Animate tool swing
        this.animateToolSwing();
        
        // Handle attack logic
        this.game.onClick(new MouseEvent('click'));
    }

    animateToolSwing() {
        // Simple animation for tool swing
        const startRotation = { x: 0 };
        const endRotation = { x: -Math.PI / 2 };
        
        // Reset rotation
        this.toolMesh.rotation.x = startRotation.x;
        
        // Swing down
        const swingDown = () => {
            this.toolMesh.rotation.x = endRotation.x;
            
            // Swing back up after a short delay
            setTimeout(() => {
                this.toolMesh.rotation.x = startRotation.x;
                this.isAttacking = false;
            }, 200);
        };
        
        // Start animation after short delay
        setTimeout(swingDown, 50);
    }

    updateMovement(deltaTime) {
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Get current speed based on running state
        const currentSpeed = this.isRunning ? this.runSpeed : this.moveSpeed;
        
        // Reset horizontal velocity
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        // Set movement direction based on camera orientation
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Apply movement relative to camera direction
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * currentSpeed;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * currentSpeed;
        }
        
        // Rotate velocity to match camera orientation
        const rotation = new THREE.Euler(0, this.pitchObject.rotation.y, 0, 'YXZ');
        this.velocity.applyEuler(rotation);
        
        // Apply velocity to position
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
        
        // Simple ground collision detection
        if (this.mesh.position.y < this.height / 2) {
            this.mesh.position.y = this.height / 2;
            this.velocity.y = 0;
            this.canJump = true;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }
        
        // Check collisions with other objects
        this.checkCollisions();
        
        // Running decreases stats faster
        if (this.isRunning && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
            this.hunger -= this.hungerDecreaseRate * 2 * deltaTime;
            this.thirst -= this.thirstDecreaseRate * 2 * deltaTime;
        }
    }

    checkCollisions() {
        // Simple collision detection with world objects
        // In a real implementation, this would use proper collision detection with world objects
        
        // For now, just keep player within a boundary
        const worldBounds = 100;
        if (Math.abs(this.mesh.position.x) > worldBounds) {
            this.mesh.position.x = Math.sign(this.mesh.position.x) * worldBounds;
        }
        if (Math.abs(this.mesh.position.z) > worldBounds) {
            this.mesh.position.z = Math.sign(this.mesh.position.z) * worldBounds;
        }
    }

    updateStats(deltaTime) {
        // Decrease hunger and thirst over time
        this.hunger = Math.max(0, this.hunger - this.hungerDecreaseRate * deltaTime);
        this.thirst = Math.max(0, this.thirst - this.thirstDecreaseRate * deltaTime);
        
        // If hunger or thirst are critically low, decrease health
        if (this.hunger <= 0 || this.thirst <= 0) {
            this.health = Math.max(0, this.health - 2 * deltaTime);
        }
        
        // If health is 0, player dies
        if (this.health <= 0) {
            this.die();
        }
        
        // Update UI
        this.updateStatsUI();
    }

    updateStatsUI() {
        // Update health, hunger, and thirst bars
        document.getElementById('health-fill').style.width = `${(this.health / this.maxHealth) * 100}%`;
        document.getElementById('hunger-fill').style.width = `${(this.hunger / this.maxHunger) * 100}%`;
        document.getElementById('thirst-fill').style.width = `${(this.thirst / this.maxThirst) * 100}%`;
    }

    equipItem(item) {
        this.equippedItem = item;
        
        // Update tool mesh based on equipped item
        if (item) {
            // In a full implementation, you would change the tool mesh to match the item
            this.toolMesh.material.color.set(item.color || 0x8B4513);
            
            // Update tool size based on item type
            if (item.type === 'weapon') {
                this.toolMesh.scale.set(1, 1, 2);
            } else if (item.type === 'tool') {
                this.toolMesh.scale.set(1, 1, 1.5);
            } else {
                this.toolMesh.scale.set(1, 1, 1);
            }
        } else {
            // Reset to default hand
            this.toolMesh.material.color.set(0x8B4513);
            this.toolMesh.scale.set(1, 1, 1);
        }
    }

    eat(food) {
        // Increase hunger based on food value
        this.hunger = Math.min(this.maxHunger, this.hunger + food.hungerValue);
        
        // Some foods might also affect thirst
        if (food.thirstValue) {
            this.thirst = Math.min(this.maxThirst, this.thirst + food.thirstValue);
        }
        
        // Some foods might affect health
        if (food.healthValue) {
            this.health = Math.min(this.maxHealth, this.health + food.healthValue);
        }
        
        // Update UI
        this.updateStatsUI();
    }

    drink(beverage) {
        // Increase thirst based on beverage value
        this.thirst = Math.min(this.maxThirst, this.thirst + beverage.thirstValue);
        
        // Some beverages might also affect hunger
        if (beverage.hungerValue) {
            this.hunger = Math.min(this.maxHunger, this.hunger + beverage.hungerValue);
        }
        
        // Some beverages might affect health
        if (beverage.healthValue) {
            this.health = Math.min(this.maxHealth, this.health + beverage.healthValue);
        }
        
        // Update UI
        this.updateStatsUI();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Flash the screen red for feedback
        this.flashDamage();
        
        // Update UI
        this.updateStatsUI();
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }

    flashDamage() {
        // Create a red overlay and fade it out
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.5s';
        document.body.appendChild(overlay);
        
        // Fade out and remove
        setTimeout(() => {
            overlay.style.opacity = 0;
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 500);
        }, 100);
    }

    die() {
        // Game over logic
        this.game.paused = true;
        
        // Show game over screen
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverDiv.style.color = 'white';
        gameOverDiv.style.padding = '20px';
        gameOverDiv.style.borderRadius = '5px';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.innerHTML = `
            <h2>You Died</h2>
            <p>You survived for ${Math.floor(this.game.gameTime)} seconds.</p>
            <button id="respawnButton" style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">Respawn</button>
        `;
        document.body.appendChild(gameOverDiv);
        
        // Add respawn button event listener
        document.getElementById('respawnButton').addEventListener('click', () => {
            document.body.removeChild(gameOverDiv);
            this.respawn();
        });
    }

    respawn() {
        // Reset player
        this.spawn();
        
        // Unpause game
        this.game.paused = false;
    }

    update(deltaTime) {
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Handle movement
        this.updateMovement(deltaTime);
        
        // Update player stats
        this.updateStats(deltaTime);
        
        // Check for left mouse button press
        if (document.pointerLockElement === this.game.renderer.domElement) {
            if (this.game.mouse.buttons && !this.isAttacking) {
                this.attack();
            }
        }
    }
}