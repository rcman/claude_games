// Boss encounters and progression
const bosses = [
    {
        name: 'Eikthyr',
        health: 1000,
        damage: 20,
        model: 'deer', // Base model type
        abilities: ['charge', 'lightning'],
        drops: ['antler', 'trophy'],
        trophy: 'Eikthyr Trophy',
        spawnItems: ['elder_power']
    },
    {
        name: 'Elder',
        health: 2500,
        damage: 35,
        model: 'tree', // Base model type
        abilities: ['root_attack', 'stomp'],
        drops: ['ancient_seed', 'trophy'],
        trophy: 'Elder Trophy',
        spawnItems: ['bonemass_power']
    }
];

function spawnBoss(bossName) {
    const bossData = bosses.find(b => b.name === bossName);
    if (!bossData) return;
    
    console.log(`Summoning ${bossName}...`);
    
    // Create boss entity
    const boss = new THREE.Group();
    boss.position.copy(camera.position);
    boss.position.z += 10; // Spawn in front of player
    
    // Temporary boss visual (will be replaced with proper model)
    const bossGeometry = new THREE.SphereGeometry(2, 32, 32);
    const bossMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const bossMesh = new THREE.Mesh(bossGeometry, bossMaterial);
    boss.add(bossMesh);
    
    // Add boss properties
    boss.userData = {
        ...bossData,
        type: 'boss',
        currentHealth: bossData.health
    };
    
    // Add to scene and entities
    scene.add(boss);
    gameState.world.entities.push(boss);
    activeBoss = boss;
    
    // Create boss UI
    createBossUI(bossData);
    
    // Boss music and effects
    playBossMusic();
    
    return boss;
}

function createBossUI(bossData) {
    // Create boss health bar at top of screen
    const bossUI = document.createElement('div');
    bossUI.id = 'boss-ui';
    
    bossUI.innerHTML = `
        <h2 style="margin:0;color:#f00;text-align:center">${bossData.name}</h2>
        <div id="boss-health-bar">
            <div id="boss-health-fill" style="width:100%"></div>
        </div>
    `;
    
    document.body.appendChild(bossUI);
}

function updateBossUI() {
    if (!activeBoss) return;
    
    const healthPercent = (activeBoss.userData.currentHealth / activeBoss.userData.health) * 100;
    const healthFill = document.getElementById('boss-health-fill');
    if (healthFill) {
        healthFill.style.width = `${healthPercent}%`;
    }
}

function removeBossUI() {
    const bossUI = document.getElementById('boss-ui');
    if (bossUI) {
        document.body.removeChild(bossUI);
    }
}

function playBossMusic() {
    // Boss music would be implemented here
    console.log("Epic boss music starts playing");
}

function updateBoss(deltaTime) {
    if (!activeBoss) return;
    
    // Boss AI and behavior
    const distanceToPlayer = activeBoss.position.distanceTo(camera.position);
    
    if (distanceToPlayer < 30) {
        // Move towards player
        const direction = new THREE.Vector3()
            .subVectors(camera.position, activeBoss.position)
            .normalize();
        
        // Keep boss on ground
        direction.y = 0;
        
        // Move boss
        activeBoss.position.add(
            direction.multiplyScalar(2 * deltaTime)
        );
        
        // Make boss look at player
        activeBoss.lookAt(camera.position);
        
        // Boss attacks
        if (distanceToPlayer < 3) {
            // Attack player
            if (Math.random() < 0.01) {
                gameState.player.health -= activeBoss.userData.damage * deltaTime;
                
                // Visual effect for attack
                createHitEffect(camera.position);
            }
        }
        
        // Boss special abilities
        if (Math.random() < 0.005) {
            const ability = activeBoss.userData.abilities[
                Math.floor(Math.random() * activeBoss.userData.abilities.length)
            ];
            
            useBossAbility(ability);
        }
    }
    
    // Update boss position on terrain
    const groundY = getTerrainHeight(activeBoss.position.x, activeBoss.position.z);
    activeBoss.position.y = groundY;
    
    // Update boss UI
    updateBossUI();
}

function useBossAbility(ability) {
    console.log(`Boss uses ${ability}!`);
    
    // Special ability effects
    switch (ability) {
        case 'charge':
            // Charge at player
            break;
        case 'lightning':
            // Create lightning strike
            const lightning = new THREE.Group();
            lightning.position.copy(camera.position);
            
            const lightningGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 6);
            const lightningMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.7
            });
            
            const lightningMesh = new THREE.Mesh(lightningGeometry, lightningMaterial);
            lightning.add(lightningMesh);
            
            scene.add(lightning);
            
            // Damage player
            gameState.player.health -= 15;
            
            // Remove after effect completes
            setTimeout(() => {
                scene.remove(lightning);
            }, 1000);
            break;
        case 'root_attack':
            // Root attack
            break;
        case 'stomp':
            // Stomp attack
            break;
    }
}

function defeatBoss() {
    if (!activeBoss) return;
    
    // Drop boss items
    activeBoss.userData.drops.forEach(itemType => {
        collectResource({ 
            type: itemType, 
            name: itemType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            count: 1 
        });
    });
    
    // Add trophy to inventory
    collectResource({ 
        type: 'trophy', 
        name: activeBoss.userData.trophy,
        count: 1
    });
    
    // Remove boss UI
    removeBossUI();
    
    // Remove boss from scene
    const bossIndex = gameState.world.entities.indexOf(activeBoss);
    if (bossIndex !== -1) {
        gameState.world.entities.splice(bossIndex, 1);
    }
    
    scene.remove(activeBoss);
    activeBoss = null;
    
    // Award skill points
    Object.keys(gameState.player.skills).forEach(skill => {
        gameState.player.skills[skill] += 1;
    });
    
    showGameMessage("Boss defeated! You gained new powers and items.");
    console.log("Boss defeated! You gained new powers and items.");
}