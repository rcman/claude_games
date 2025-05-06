// Resource Management System
class Resources {
    constructor(game) {
        this.game = game;
        
        // Resource definition
        this.resourceTypes = {
            'tree': {
                name: 'Tree',
                model: 'tree',
                yields: [
                    { item: 'wood', amount: 3, chance: 1.0 },
                    { item: 'stick', amount: 2, chance: 0.5 },
                    { item: 'apple', amount: 1, chance: 0.2 }
                ],
                health: 5,
                respawnTime: 300, // seconds
                biomes: ['plains', 'forest'],
                minDistance: 5 // minimum distance between trees
            },
            'stone': {
                name: 'Stone',
                model: 'stone',
                yields: [
                    { item: 'stone', amount: 3, chance: 1.0 },
                    { item: 'flint', amount: 1, chance: 0.3 }
                ],
                health: 7,
                respawnTime: 400,
                biomes: ['plains', 'forest', 'mountain'],
                minDistance: 4
            },
            'bush': {
                name: 'Berry Bush',
                model: 'bush',
                yields: [
                    { item: 'berries', amount: 3, chance: 1.0 },
                    { item: 'stick', amount: 1, chance: 0.5 }
                ],
                health: 3,
                respawnTime: 200,
                biomes: ['plains', 'forest'],
                minDistance: 3
            },
            'ironOre': {
                name: 'Iron Ore',
                model: 'ironOre',
                yields: [
                    { item: 'ironOre', amount: 2, chance: 1.0 }
                ],
                health: 10,
                respawnTime: 500,
                biomes: ['mountain'],
                minDistance: 8
            }
        };
        
        // Active resources in the world
        this.resources = [];
        
        // Resources scheduled to respawn
        this.respawningResources = [];
    }

    spawnInitialResources() {
        // Number of resources to spawn
        const resourceCounts = {
            'tree': 100,
            'stone': 80,
            'bush': 60,
            'ironOre': 40
        };
        
        // Spawn resources
        for (const [type, count] of Object.entries(resourceCounts)) {
            for (let i = 0; i < count; i++) {
                this.spawnResource(type);
            }
        }
    }

    spawnResource(type) {
        // Get resource definition
        const resourceDef = this.resourceTypes[type];
        if (!resourceDef) return null;
        
        // Find suitable location
        const position = this.findResourcePosition(resourceDef);
        if (!position) return null; // Couldn't find suitable position
        
        // Create resource model
        const resource = this.createResourceModel(type, position);
        
        // Add to resources list
        this.resources.push(resource);
        
        return resource;
    }

    findResourcePosition(resourceDef) {
        // Try to find a suitable position for the resource
        const maxAttempts = 50;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Random position within world bounds
            const x = (Math.random() * this.game.world.size) - (this.game.world.size / 2);
            const z = (Math.random() * this.game.world.size) - (this.game.world.size / 2);
            
            // Get height at this position
            const height = this.game.world.getHeightAt(x, z);
            
            // Get biome at this position
            const biome = this.game.world.getBiomeAt(x, z);
            
            // Skip if underwater
            if (height < this.game.world.waterLevel) continue;
            
            // Skip if not in valid biome
            if (!resourceDef.biomes.includes(biome)) continue;
            
            // Check minimum distance from other resources of same type
            let tooClose = false;
            
            for (const existingResource of this.resources) {
                if (existingResource.userData.type === 'resource' && 
                    existingResource.userData.resourceType === resourceDef.name) {
                    
                    const distance = existingResource.position.distanceTo(new THREE.Vector3(x, height, z));
                    
                    if (distance < resourceDef.minDistance) {
                        tooClose = true;
                        break;
                    }
                }
            }
            
            if (tooClose) continue;
            
            // Found suitable position
            return new THREE.Vector3(x, height, z);
        }
        
        // Couldn't find suitable position after max attempts
        return null;
    }

    createResourceModel(type, position) {
        const resourceDef = this.resourceTypes[type];
        let geometry, material, mesh;
        
        // Create different models based on resource type
        switch (type) {
            case 'tree':
                // Tree trunk
                geometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.position.copy(position);
                mesh.position.y += 2.5; // Half height of cylinder
                
                // Tree top (leaves)
                const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
                const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.castShadow = true;
                leaves.position.y = 3;
                
                // Combine trunk and leaves
                mesh.add(leaves);
                break;
                
            case 'stone':
                geometry = new THREE.SphereGeometry(1, 4, 4);
                material = new THREE.MeshLambertMaterial({ color: 0x808080 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.position.copy(position);
                mesh.position.y += 0.5; // Half height of sphere
                
                // Deform the sphere to look more like a rock
                const vertices = geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    vertices[i] *= 0.8 + Math.random() * 0.4;
                    vertices[i + 1] *= 0.8 + Math.random() * 0.4;
                    vertices[i + 2] *= 0.8 + Math.random() * 0.4;
                }
                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
                break;
                
            case 'bush':
                geometry = new THREE.SphereGeometry(1, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.position.copy(position);
                mesh.position.y += 0.5; // Half height of sphere
                
                // Add berries
                for (let i = 0; i < 5; i++) {
                    const berryGeometry = new THREE.SphereGeometry(0.1, 4, 4);
                    const berryMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
                    const berry = new THREE.Mesh(berryGeometry, berryMaterial);
                    
                    // Random position on bush
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    const radius = 0.8;
                    
                    berry.position.x = radius * Math.sin(phi) * Math.cos(theta);
                    berry.position.y = radius * Math.sin(phi) * Math.sin(theta);
                    berry.position.z = radius * Math.cos(phi);
                    
                    mesh.add(berry);
                }
                break;
                
            case 'ironOre':
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                material = new THREE.MeshLambertMaterial({ color: 0x708090 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.position.copy(position);
                mesh.position.y += 0.75; // Half height of box
                
                // Add iron deposit details
                const ironGeometry = new THREE.SphereGeometry(0.2, 4, 4);
                const ironMaterial = new THREE.MeshLambertMaterial({ color: 0xA52A2A });
                
                for (let i = 0; i < 8; i++) {
                    const ironDeposit = new THREE.Mesh(ironGeometry, ironMaterial);
                    
                    // Random position on rock
                    ironDeposit.position.x = (Math.random() - 0.5) * 1.2;
                    ironDeposit.position.y = (Math.random() - 0.5) * 1.2;
                    ironDeposit.position.z = (Math.random() - 0.5) * 1.2;
                    
                    mesh.add(ironDeposit);
                }
                break;
                
            default:
                // Generic resource
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshLambertMaterial({ color: 0xFF00FF });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.position.copy(position);
                mesh.position.y += 0.5; // Half height of box
        }
        
        // Add metadata to the mesh
        mesh.userData = {
            type: 'resource',
            resourceType: resourceDef.name,
            health: resourceDef.health,
            maxHealth: resourceDef.health,
            yields: resourceDef.yields,
            respawnTime: resourceDef.respawnTime
        };
        
        // Add to scene
        this.game.scene.add(mesh);
        
        return mesh;
    }

    harvestResource(resource, hitPoint) {
        // Check if resource is harvestable
        if (resource.userData.type !== 'resource' || resource.userData.health <= 0) return;
        
        // Check if player has the right tool equipped
        const equippedItem = this.game.player.equippedItem;
        let damage = 1; // Default damage
        
        // If player has a tool equipped, it might do more damage
        if (equippedItem && equippedItem.toolStrength) {
            damage = equippedItem.toolStrength;
        }
        
        // Apply damage to resource
        resource.userData.health -= damage;
        
        // Visual feedback - scale the resource slightly based on damage
        const healthPercent = resource.userData.health / resource.userData.maxHealth;
        resource.scale.set(
            0.9 + 0.1 * healthPercent,
            0.9 + 0.1 * healthPercent,
            0.9 + 0.1 * healthPercent
        );
        
        // If resource is depleted
        if (resource.userData.health <= 0) {
            // Add resource to inventory
            this.addResourceToInventory(resource);
            
            // Create particle effect at hit point
            this.createHarvestEffect(hitPoint, resource.userData.resourceType);
            
            // Remove resource from scene
            this.game.scene.remove(resource);
            
            // Remove from active resources
            const index = this.resources.indexOf(resource);
            if (index !== -1) {
                this.resources.splice(index, 1);
            }
            
            // Schedule resource to respawn
            this.scheduleRespawn(resource.userData.resourceType, resource.position);
        } else {
            // Just create a smaller hit effect
            this.createHitEffect(hitPoint);
        }
    }

    createHitEffect(position) {
        // Create a simple particle effect for hitting
        const particles = new THREE.Group();
        
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            particles.add(particle);
        }
        
        this.game.scene.add(particles);
        
        // Animate particles
        const startTime = Date.now();
        const duration = 500; // ms
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.game.scene.remove(particles);
                return;
            }
            
            // Move particles
            for (const particle of particles.children) {
                particle.position.x += particle.velocity.x * 0.05;
                particle.position.y += particle.velocity.y * 0.05;
                particle.position.z += particle.velocity.z * 0.05;
                
                // Apply gravity
                particle.velocity.y -= 0.1;
                
                // Fade out
                particle.material.opacity = 1 - progress;
            }
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }

    createHarvestEffect(position, resourceType) {
        // Create a more elaborate particle effect for harvesting
        const particles = new THREE.Group();
        const particleCount = 20;
        
        // Different particle colors based on resource type
        let color;
        switch (resourceType) {
            case 'Tree':
                color = 0x8B4513; // Brown for wood
                break;
            case 'Stone':
                color = 0x808080; // Gray for stone
                break;
            case 'Berry Bush':
                color = 0x228B22; // Green for bush
                break;
            case 'Iron Ore':
                color = 0xA52A2A; // Brown-red for iron
                break;
            default:
                color = 0xFFFFFF; // White by default
        }
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const material = new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            
            // Random velocity (more energetic than hit effect)
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 4,
                (Math.random() - 0.5) * 4
            );
            
            particles.add(particle);
        }
        
        this.game.scene.add(particles);
        
        // Animate particles
        const startTime = Date.now();
        const duration = 1000; // ms
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.game.scene.remove(particles);
                return;
            }
            
            // Move particles
            for (const particle of particles.children) {
                particle.position.x += particle.velocity.x * 0.05;
                particle.position.y += particle.velocity.y * 0.05;
                particle.position.z += particle.velocity.z * 0.05;
                
                // Apply gravity
                particle.velocity.y -= 0.1;
                
                // Fade out
                particle.material.opacity = 1 - progress;
                
                // Shrink
                const scale = 1 - progress * 0.5;
                particle.scale.set(scale, scale, scale);
            }
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }

    addResourceToInventory(resource) {
        // For each possible yield from this resource
        for (const yield of resource.userData.yields) {
            // Check if the yield should be added (based on chance)
            if (Math.random() <= yield.chance) {
                // Add the item to inventory
                const amount = yield.amount;
                this.game.inventory.addItem(yield.item, amount);
            }
        }
    }

    scheduleRespawn(resourceType, position) {
        // Add to respawning resources
        this.respawningResources.push({
            type: resourceType,
            position: position.clone(),
            respawnTime: this.game.gameTime + this.resourceTypes[resourceType.toLowerCase()].respawnTime
        });
    }

    update(deltaTime) {
        // Check for resources that need to respawn
        for (let i = this.respawningResources.length - 1; i >= 0; i--) {
            const respawningResource = this.respawningResources[i];
            
            if (this.game.gameTime >= respawningResource.respawnTime) {
                // Respawn the resource
                this.spawnResource(respawningResource.type.toLowerCase());
                
                // Remove from respawning list
                this.respawningResources.splice(i, 1);
            }
        }
    }
}