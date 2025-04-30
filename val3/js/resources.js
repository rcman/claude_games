// Resource generation
function addNaturalResources(chunk, chunkX, chunkZ, biome) {
    // Add trees
    for (let i = 0; i < CHUNK_SIZE; i++) {
        for (let j = 0; j < CHUNK_SIZE; j++) {
            const x = i + chunkX * CHUNK_SIZE;
            const z = j + chunkZ * CHUNK_SIZE;
            
            // Use perlin value to determine tree placement
            const treeNoise = Math.abs(perlin.perlin2(x * 0.05, z * 0.05));
            
            if (treeNoise > 0.7 && Math.random() < TREE_DENSITY) {
                const treePosition = new THREE.Vector3(i - CHUNK_SIZE/2, getTerrainHeight(x, z), j - CHUNK_SIZE/2);
                
                // Choose tree type based on biome
                const treeType = biome.treeTypes[Math.floor(Math.random() * biome.treeTypes.length)];
                const tree = createTree(treeType, biome.treeColor);
                
                tree.position.copy(treePosition);
                chunk.add(tree);
            }
            
            // Add rocks with different noise pattern
            const rockNoise = Math.abs(perlin.perlin2(x * 0.1, z * 0.1));
            
            if (rockNoise > 0.8 && Math.random() < ROCK_DENSITY) {
                const rockPosition = new THREE.Vector3(i - CHUNK_SIZE/2, getTerrainHeight(x, z), j - CHUNK_SIZE/2);
                const rock = createRock();
                rock.position.copy(rockPosition);
                chunk.add(rock);
            }
            
            // Add biome-specific resources
            if (Math.random() < 0.005) {
                for (const resource of biome.resources) {
                    if (Math.random() < 0.3) {
                        const resourcePosition = new THREE.Vector3(i - CHUNK_SIZE/2, getTerrainHeight(x, z), j - CHUNK_SIZE/2);
                        const resourceNode = createResourceNode(resource);
                        resourceNode.position.copy(resourcePosition);
                        chunk.add(resourceNode);
                    }
                }
            }
        }
    }
}

function createTree(treeType = 'pine', treeColor = 0x2E7D32) {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.position.y = 1.5;
    tree.add(trunk);
    
    // Tree foliage based on type
    let foliageGeometry;
    
    switch (treeType) {
        case 'pine':
            foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
            break;
        case 'birch':
            foliageGeometry = new THREE.SphereGeometry(1.2, 8, 8);
            break;
        case 'oak':
            foliageGeometry = new THREE.SphereGeometry(1.5, 8, 8);
            break;
        case 'fir':
            // Create multiple cone layers for fir trees
            foliageGeometry = new THREE.ConeGeometry(1.2, 2, 8);
            const secondLayerGeo = new THREE.ConeGeometry(0.9, 1.5, 8);
            const secondLayer = new THREE.Mesh(
                secondLayerGeo,
                new THREE.MeshStandardMaterial({ color: treeColor })
            );
            secondLayer.position.y = 1;
            tree.add(secondLayer);
            break;
        case 'ancient':
            foliageGeometry = new THREE.SphereGeometry(1, 4, 4);
            foliageGeometry.scale(1.5, 0.7, 1.5);
            break;
        default:
            foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    }
    
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: treeColor });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.castShadow = true;
    foliage.position.y = 4;
    tree.add(foliage);
    
    // Add interactivity and harvestable component
    tree.userData.type = 'tree';
    tree.userData.treeType = treeType;
    tree.userData.health = 100;
    tree.userData.loot = ['wood', 'resin'];
    
    if (treeType === 'pine' || treeType === 'fir') {
        tree.userData.loot = ['core_wood', 'resin'];
    } else if (treeType === 'ancient') {
        tree.userData.loot = ['ancient_bark', 'resin'];
        tree.userData.health = 200;
    }
    
    return tree;
}

function createRock() {
    const rock = new THREE.Group();
    
    // Random rock shape
    const geometry = new THREE.DodecahedronGeometry(
        0.5 + Math.random() * 0.5, 
        0
    );
    
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x7F7F7F,
        roughness: 0.9
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.scale.y = 0.6 + Math.random() * 0.4;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    rock.add(mesh);
    
    // Add interactivity and harvestable component
    rock.userData.type = 'rock';
    rock.userData.health = 200;
    rock.userData.loot = ['stone', 'flint'];
    
    return rock;
}

function createResourceNode(resourceType) {
    const node = new THREE.Group();
    
    let geometry, material, size, color;
    
    switch (resourceType) {
        case 'copper':
            geometry = new THREE.DodecahedronGeometry(0.7, 0);
            color = 0xCD7F32;
            size = 1;
            break;
        case 'tin':
            geometry = new THREE.DodecahedronGeometry(0.5, 0);
            color = 0xAAAAAA;
            size = 0.8;
            break;
        case 'iron':
            geometry = new THREE.DodecahedronGeometry(0.6, 0);
            color = 0x777777;
            size = 0.9;
            break;
        case 'silver':
            geometry = new THREE.DodecahedronGeometry(0.5, 0);
            color = 0xDDDDDD;
            size = 0.8;
            break;
        case 'black_metal':
            geometry = new THREE.DodecahedronGeometry(0.5, 0);
            color = 0x222222;
            size = 0.7;
            break;
        default:
            // Default resource node
            geometry = new THREE.SphereGeometry(0.4, 8, 8);
            color = 0x995533;
            size = 0.6;
    }
    
    material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.8,
        metalness: resourceType !== 'wood' ? 0.5 : 0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.scale.set(size, size, size);
    node.add(mesh);
    
    // Add interactivity and harvestable component
    node.userData.type = 'resource';
    node.userData.resourceType = resourceType;
    node.userData.health = 150;
    node.userData.loot = [resourceType];
    
    return node;
}

function createHitEffect(position) {
    // Create particle system for hit effect
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 20;
    
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = position.x;
        posArray[i + 1] = position.y;
        posArray[i + 2] = position.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1,
        transparent: true
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    
    // Animate particles
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        ));
    }
    
    const particleAnimation = () => {
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Apply gravity
            velocities[i].y -= 0.01;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        particleMaterial.opacity -= 0.01;
        
        if (particleMaterial.opacity > 0) {
            requestAnimationFrame(particleAnimation);
        } else {
            scene.remove(particles);
        }
    };
    
    particleAnimation();
}