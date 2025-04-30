// Portal system
class Portal {
    constructor(position, name, linkedPortal = null) {
        this.object = new THREE.Group();
        this.object.position.copy(position);
        this.name = name;
        this.linkedPortal = linkedPortal;
        this.isActive = false;
        this.cooldown = 0;
        
        // Create portal visuals
        this.createVisuals();
        
        // Add to world
        scene.add(this.object);
        gameState.world.entities.push(this.object);
        
        // Set portal data
        this.object.userData = {
            type: 'portal',
            name: this.name,
            portalRef: this
        };
    }
    
    createVisuals() {
        // Portal base
        const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        this.object.add(base);
        
        // Portal arch
        const archGeometry = new THREE.TorusGeometry(1.2, 0.1, 8, 20, Math.PI);
        const archMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const arch = new THREE.Mesh(archGeometry, archMaterial);
        arch.rotation.x = Math.PI / 2;
        arch.position.y = 1.2;
        this.object.add(arch);
        
        // Portal effect (only visible when active)
        const portalGeometry = new THREE.CircleGeometry(1, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.portalEffect = new THREE.Mesh(portalGeometry, portalMaterial);
        this.portalEffect.rotation.y = Math.PI / 2;
        this.portalEffect.position.y = 1.2;
        this.portalEffect.visible = false;
        this.object.add(this.portalEffect);
        
        // Runes on base
        for (let i = 0; i < 5; i++) {
            const runeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const runeMaterial = new THREE.MeshStandardMaterial({ color: 0x00FFFF });
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            const angle = (i / 5) * Math.PI * 2;
            rune.position.x = Math.cos(angle) * 1.3;
            rune.position.z = Math.sin(angle) * 1.3;
            rune.position.y = 0.15;
            
            this.object.add(rune);
        }
    }
    
    activate() {
        if (!this.isActive) {
            this.isActive = true;
            this.portalEffect.visible = true;
            
            // Start portal animation
            this.animatePortal();
            
            console.log(`Portal ${this.name} activated`);
        }
    }
    
    deactivate() {
        if (this.isActive) {
            this.isActive = false;
            this.portalEffect.visible = false;
            console.log(`Portal ${this.name} deactivated`);
        }
    }
    
    animatePortal() {
        if (!this.isActive) return;
        
        // Rotate portal effect
        this.portalEffect.rotation.z += 0.01;
        
        // Pulse effect
        const pulseFactor = (Math.sin(Date.now() * 0.002) + 1) / 2;
        this.portalEffect.material.opacity = 0.3 + pulseFactor * 0.3;
        
        // Continue animation
        requestAnimationFrame(() => this.animatePortal());
    }
    
    linkTo(otherPortal) {
        this.linkedPortal = otherPortal;
        otherPortal.linkedPortal = this;
        
        // Activate both portals when linked
        this.activate();
        otherPortal.activate();
        
        console.log(`Linked portals ${this.name} and ${otherPortal.name}`);
    }
    
    teleport() {
        if (!this.isActive || !this.linkedPortal || this.cooldown > 0) {
            console.log("Portal cannot be used right now");
            return false;
        }
        
        // Teleport player to linked portal
        const targetPos = this.linkedPortal.object.position.clone();
        targetPos.y += 1.7; // Player height
        
        // Set player position
        camera.position.copy(targetPos);
        
        // Set cooldown
        this.cooldown = 5; // 5 seconds cooldown
        this.linkedPortal.cooldown = 5;
        
        // Create teleport effect
        this.createTeleportEffect();
        
        console.log(`Teleported to ${this.linkedPortal.name}`);
        return true;
    }
    
    createTeleportEffect() {
        // Flash screen effect
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = '#00FFFF';
        flashOverlay.style.opacity = '0.5';
        flashOverlay.style.zIndex = '1000';
        flashOverlay.style.pointerEvents = 'none';
        
        document.body.appendChild(flashOverlay);
        
        // Fade out effect
        let opacity = 0.5;
        const fadeOut = () => {
            opacity -= 0.05;
            flashOverlay.style.opacity = opacity.toString();
            
            if (opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                document.body.removeChild(flashOverlay);
            }
        };
        
        requestAnimationFrame(fadeOut);
    }
    
    update(deltaTime) {
        // Update cooldown
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }
}

// Function to check portals for interaction
function checkPortalInteraction() {
    // Get all portal entities
    const portals = gameState.world.entities.filter(
        entity => entity.userData && entity.userData.type === 'portal'
    );
    
    // Check player proximity
    for (const portal of portals) {
        const distance = camera.position.distanceTo(portal.position);
        
        // If player is close enough to use portal
        if (distance < 2) {
            // Show prompt
            showInteractionPrompt(`Press E to use portal to ${portal.userData.portalRef.linkedPortal?.name || "nowhere"}`);
            
            // Check for interaction key
            if (keyboard['KeyE']) {
                portal.userData.portalRef.teleport();
                
                // Prevent multiple teleports
                keyboard['KeyE'] = false;
            }
            
            return; // Only interact with closest portal
        }
    }
    
    // Hide prompt if no portal nearby
    hideInteractionPrompt();
}