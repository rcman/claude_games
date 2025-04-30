// Day/night cycle and weather
function updateDayNightCycle(deltaTime) {
    // Update world time (0-1 represents a full day)
    gameState.world.time += deltaTime * 0.01; // Adjust for day length
    if (gameState.world.time > 1) gameState.world.time -= 1;
    
    // Update the direction of the directional light to simulate sun movement
    const sunAngle = gameState.world.time * Math.PI * 2;
    const sunRadius = 100;
    
    directionalLight.position.x = Math.cos(sunAngle) * sunRadius;
    directionalLight.position.y = Math.sin(sunAngle) * sunRadius;
    directionalLight.position.z = 0;
    
    // Adjust light intensity based on time
    let intensity;
    
    // Morning
    if (gameState.world.time < 0.25) {
        intensity = Math.sin((gameState.world.time / 0.25) * Math.PI/2);
    } 
    // Day
    else if (gameState.world.time < 0.5) {
        intensity = 1;
    } 
    // Evening
    else if (gameState.world.time < 0.75) {
        intensity = Math.sin(((0.75 - gameState.world.time) / 0.25) * Math.PI/2);
    } 
    // Night
    else {
        intensity = 0.1;
    }
    
    directionalLight.intensity = intensity;
    
    // Adjust ambient light for night time
    if (gameState.world.time > 0.5) {
        ambientLight.intensity = 0.3;
    } else {
        ambientLight.intensity = 0.7;
    }
    
    // Change sky color based on time
    let skyColor;
    
    // Dawn
    if (gameState.world.time < 0.25) {
        // Blend from dark blue to light blue
        const t = gameState.world.time / 0.25;
        skyColor = new THREE.Color().setRGB(
            0.1 + t * 0.5,
            0.1 + t * 0.7,
            0.3 + t * 0.5
        );
    } 
    // Day
    else if (gameState.world.time < 0.5) {
        skyColor = new THREE.Color(0x87CEEB); // Sky blue
    } 
    // Dusk
    else if (gameState.world.time < 0.75) {
        // Blend from light blue to dark blue with some red
        const t = (gameState.world.time - 0.5) / 0.25;
        skyColor = new THREE.Color().setRGB(
            0.6 - t * 0.5 + t * 0.3,
            0.8 - t * 0.7,
            0.8 - t * 0.5
        );
    } 
    // Night
    else {
        skyColor = new THREE.Color(0x0A0A2A); // Dark blue
    }
    
    scene.background = skyColor;
    
    // Update weather
    updateWeather(deltaTime);
}

function updateWeather(deltaTime) {
    // Chance to change weather every few seconds
    if (Math.random() < deltaTime * 0.01) {
        const weatherTypes = ['clear', 'cloudy', 'rain', 'fog'];
        const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        // Don't change if weather is already the same
        if (randomWeather !== gameState.world.weather) {
            console.log(`Weather changing from ${gameState.world.weather} to ${randomWeather}`);
            gameState.world.weather = randomWeather;
            
            // Clear any existing weather effects
            clearWeatherEffects();
            
            // Apply new weather effects
            applyWeatherEffects(randomWeather);
        }
    }
}

let weatherParticles;

function clearWeatherEffects() {
    if (weatherParticles) {
        scene.remove(weatherParticles);
        weatherParticles = null;
    }
    
    // Remove fog
    scene.fog = null;
}

function applyWeatherEffects(weatherType) {
    switch (weatherType) {
        case 'rain':
            createRainEffect();
            break;
        case 'fog':
            createFogEffect();
            break;
        case 'cloudy':
            // Darken the ambient light
            ambientLight.intensity *= 0.7;
            break;
        default:
            // Clear weather, no special effects
            break;
    }
}

function createRainEffect() {
    const rainCount = 1000;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    
    for (let i = 0; i < rainCount * 3; i += 3) {
        rainPositions[i] = (Math.random() - 0.5) * 100;
        rainPositions[i + 1] = Math.random() * 50;
        rainPositions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    
    const rainMaterial = new THREE.PointsMaterial({
        color: 0x9999AA,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });
    
    weatherParticles = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(weatherParticles);
}

function createFogEffect() {
    scene.fog = new THREE.FogExp2(0xCCCCCC, 0.01);
}

function updateWeatherParticles() {
    if (weatherParticles && gameState.world.weather === 'rain') {
        const positions = weatherParticles.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Move rain downward
            positions[i + 1] -= 0.2;
            
            // Reset particles that go below ground
            if (positions[i + 1] < 0) {
                positions[i] = (Math.random() - 0.5) * 100 + camera.position.x;
                positions[i + 1] = 50 + camera.position.y;
                positions[i + 2] = (Math.random() - 0.5) * 100 + camera.position.z;
            }
        }
        
        weatherParticles.geometry.attributes.position.needsUpdate = true;
    }
}