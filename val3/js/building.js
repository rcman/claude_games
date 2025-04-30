// Building system
const buildingPieces = [
    { name: 'Wood Wall', requirements: { wood: 5 }, type: 'wall' },
    { name: 'Wood Floor', requirements: { wood: 5 }, type: 'floor' },
    { name: 'Wood Roof', requirements: { wood: 5 }, type: 'roof' },
    { name: 'Wood Door', requirements: { wood: 3 }, type: 'door' },
    { name: 'Wood Stairs', requirements: { wood: 8 }, type: 'stairs' },
    { name: 'Stone Wall', requirements: { stone: 10 }, type: 'wall' },
    { name: 'Stone Floor', requirements: { stone: 10 }, type: 'floor' },
    { name: 'Core Wood Beam', requirements: { core_wood: 2 }, type: 'beam' },
    { name: 'Wood Fence', requirements: { wood: 2 }, type: 'fence' }
];

function populateBuildingMenu() {
    const buildingPiecesList = document.getElementById('building-pieces');
    buildingPiecesList.innerHTML = '';
    
    buildingPieces.forEach(piece => {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'building-piece';
        
        pieceElement.innerHTML = `
            <h3>${piece.name}</h3>
            <div class="requirements">
                ${Object.entries(piece.requirements)
                    .map(([item, count]) => `${item}: ${count}`)
                    .join(', ')}
            </div>
            <button class="select-piece-button">Select</button>
        `;
        
        const selectButton = pieceElement.querySelector('.select-piece-button');
        selectButton.addEventListener('click', () => {
            selectBuildingPiece(piece);
        });
        
        buildingPiecesList.appendChild(pieceElement);
    });
}

function selectBuildingPiece(piece) {
    selectedBuildingPiece = piece;
    
    // Remove previous building preview
    if (buildingPreview) {
        scene.remove(buildingPreview);
    }
    
    // Create new building preview
    buildingPreview = createBuildingPiece(piece.type);
    buildingPreview.material.opacity = 0.5;
    buildingPreview.material.transparent = true;
    scene.add(buildingPreview);
    
    console.log(`Selected: ${piece.name}`);
}

function createBuildingPiece(type) {
    let geometry, material;
    
    switch (type) {
        case 'wall':
            geometry = new THREE.BoxGeometry(2, 2, 0.1);
            break;
        case 'floor':
            geometry = new THREE.BoxGeometry(2, 0.1, 2);
            break;
        case 'roof':
            geometry = new THREE.ConeGeometry(2, 1, 4);
            break;
        case 'door':
            geometry = new THREE.BoxGeometry(1, 2, 0.1);
            break;
        case 'stairs':
            geometry = new THREE.BoxGeometry(1, 0.5, 2);
            break;
        case 'beam':
            geometry = new THREE.BoxGeometry(0.2, 2, 0.2);
            break;
        case 'fence':
            geometry = new THREE.BoxGeometry(2, 1, 0.1);
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    material = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = 'building';
    mesh.userData.buildingType = type;
    mesh.userData.health = 100;
    
    return mesh;
}

function updateBuildingPreview() {
    if (buildingPreview && selectedBuildingPiece) {
        // Cast a ray from camera to determine placement position
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.unproject(camera);
        raycaster.set(camera.position, direction.sub(camera.position).normalize());
        
        const intersects = raycaster.intersectObjects(
            Object.values(gameState.world.chunks).flatMap(chunk => chunk.children),
            true
        );
        
        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            buildingPreview.position.copy(intersectionPoint);
            
            // Snap to grid
            buildingPreview.position.x = Math.round(buildingPreview.position.x * 2) / 2;
            buildingPreview.position.z = Math.round(buildingPreview.position.z * 2) / 2;
            
            // Adjust based on piece type
            if (selectedBuildingPiece.type === 'wall' || selectedBuildingPiece.type === 'door') {
                buildingPreview.position.y += 1;
                buildingPreview.rotation.y = Math.round(camera.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            } else if (selectedBuildingPiece.type === 'floor') {
                buildingPreview.position.y += 0.05;
            } else if (selectedBuildingPiece.type === 'roof') {
                buildingPreview.position.y += 2;
            } else if (selectedBuildingPiece.type === 'stairs') {
                buildingPreview.position.y += 0.25;
                buildingPreview.rotation.y = Math.round(camera.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
                buildingPreview.rotation.x = Math.PI / 8;
            } else if (selectedBuildingPiece.type === 'beam') {
                buildingPreview.position.y += 1;
            } else if (selectedBuildingPiece.type === 'fence') {
                buildingPreview.position.y += 0.5;
                buildingPreview.rotation.y = Math.round(camera.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            }
            
            // Check if player has resources
            const canBuild = Object.entries(selectedBuildingPiece.requirements).every(([item, count]) => {
                const playerHas = gameState.player.inventory.filter(i => i.type === item)
                    .reduce((total, i) => total + i.count, 0);
                return playerHas >= count;
            });
            
            // Update preview color based on whether player can build
            buildingPreview.material.color.setHex(canBuild ? 0x00FF00 : 0xFF0000);
        }
    }
}

function placeBuildingPiece() {
    if (buildingPreview && selectedBuildingPiece) {
        // Check if player has required materials
        const canBuild = Object.entries(selectedBuildingPiece.requirements).every(([item, count]) => {
            const playerHas = gameState.player.inventory.filter(i => i.type === item)
                .reduce((total, i) => total + i.count, 0);
            return playerHas >= count;
        });
        
        if (canBuild) {
            // Create permanent building piece
            const piece = createBuildingPiece(selectedBuildingPiece.type);
            piece.position.copy(buildingPreview.position);
            piece.rotation.copy(buildingPreview.rotation);
            piece.material.opacity = 1;
            piece.material.transparent = false;
            
            // Add to scene
            scene.add(piece);
            gameState.world.entities.push(piece);
            
            // Remove materials from inventory
            Object.entries(selectedBuildingPiece.requirements).forEach(([item, count]) => {
                let remainingToRemove = count;
                
                for (let i = 0; i < gameState.player.inventory.length; i++) {
                    const inventoryItem = gameState.player.inventory[i];
                    
                    if (inventoryItem.type === item) {
                        const amountToRemove = Math.min(remainingToRemove, inventoryItem.count);
                        inventoryItem.count -= amountToRemove;
                        remainingToRemove -= amountToRemove;
                        
                        if (inventoryItem.count <= 0) {
                            gameState.player.inventory.splice(i, 1);
                            i--;
                        }
                        
                        if (remainingToRemove <= 0) break;
                    }
                }
            });
            
            // Update inventory display
            updateInventoryDisplay();
            
            showGameMessage(`Placed: ${selectedBuildingPiece.name}`);
            console.log(`Placed: ${selectedBuildingPiece.name}`);
            
            // Skill up building skill
            gameState.player.skills.building += 0.1;
        } else {
            showGameMessage("Not enough materials");
            console.log('Not enough materials');
        }
    }
}