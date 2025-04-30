// world/environment.js - Environment setup (sky, water, lighting)
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { scene, camera } from '../core/setup.js';
import { gameState } from '../main.js';

let sky, water;

export function setupLightingAndEnvironment() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Directional Light (Sun) - position will be updated by Sky logic
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500; // Adjust based on world size
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);
    scene.userData.directionalLight = directionalLight; // Store reference for easy access
    scene.userData.ambientLight = ambientLight; // Store reference

    // Sky (Uses imported Sky class)
    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    scene.userData.sky = sky;

    // Water (Uses imported Water class)
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    try {
        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load(
                    // *** IMPORTANT: Update this path if you saved the texture elsewhere ***
                    './textures/waternormals.jpg', // Assumes texture is in 'textures' subfolder
                    (texture) => {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    },
                    undefined, // onProgress callback (optional)
                    (err) => { // onError callback
                        console.error("Error loading water normals texture:", err);
                        // Fallback? Disable water? Use basic material?
                    }
                ),
                sunDirection: new THREE.Vector3(), // Will be updated
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: scene.fog !== undefined // Pass fog status
            }
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.1; // Slightly below typical ground level
        scene.add(water);
        scene.userData.water = water;
    } catch (e) {
        console.warn("Water class not found or failed to initialize. Skipping water.", e);
        // Add a simple blue plane as fallback?
        const waterFallbackMat = new THREE.MeshBasicMaterial({color: 0x001e0f, transparent: true, opacity: 0.7});
        const waterFallback = new THREE.Mesh(waterGeometry, waterFallbackMat);
        waterFallback.rotation.x = - Math.PI / 2;
        waterFallback.position.y = -0.1;
        scene.add(waterFallback);
    }

    updateSunPosition(); // Initial sun setup
}

export function updateSunPosition() {
    const sun = new THREE.Vector3();
    const skyData = scene.userData.sky;
    const waterData = scene.userData.water;
    const light = scene.userData.directionalLight;
    const ambient = scene.userData.ambientLight; // Get ambient light reference

    if (!skyData || !light || !ambient) return; // Need these elements

    // Calculate sun position based on game time (0 = midnight, 12000 = noon)
    const timeOfDay = gameState.world.time / 24000; // Normalize time to 0-1
    const sunAngle = timeOfDay * Math.PI * 2 - Math.PI / 2; // Angle from sunrise

    const elevation = Math.sin(timeOfDay * Math.PI) * 70 + 5; // Simulate sun rising and setting (degrees)
    const azimuth = 180; // Keep sun moving east to west (simple)

    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    // --- Update Sky ---
    const uniforms = skyData.material.uniforms;
    uniforms['sunPosition'].value.copy(sun);
    // Adjust sky params based on time for realism
    const turbidity = 10; // Can vary based on weather later
    const rayleigh = Math.max(0.5, 3 - Math.abs(timeOfDay - 0.5) * 4); // Less scattering midday
    const mieCoefficient = 0.005;
    const mieDirectionalG = 0.7; // More haze near sun
    uniforms['turbidity'].value = turbidity;
    uniforms['rayleigh'].value = rayleigh;
    uniforms['mieCoefficient'].value = mieCoefficient;
    uniforms['mieDirectionalG'].value = mieDirectionalG;

    // --- Update Water ---
    if (waterData && waterData.material?.uniforms?.['sunDirection']) {
        waterData.material.uniforms['sunDirection'].value.copy(sun).normalize();
    }

    // --- Update Lights ---
    light.position.copy(sun).multiplyScalar(200); // Place light source far away
    // Adjust light intensity based on sun elevation smoothly
    const sunIntensityFactor = Math.max(0, Math.sin(phi)); // 0 at horizon, 1 at zenith
    light.intensity = sunIntensityFactor * 1.1 + 0.1; // Base + scaled intensity
    light.castShadow = elevation > 5; // Don't cast shadows when sun is very low

    // Adjust Ambient Light based on time
    ambient.intensity = sunIntensityFactor * 0.4 + 0.15; // Higher base ambient, scales less extremely

    // --- Update Fog ---
    const dayColor = new THREE.Color(0x87CEEB);
    const nightColor = new THREE.Color(0x051020);
    const sunsetColor = new THREE.Color(0xdc6c1a); // More orange/red sunset

    let fogColor = dayColor.clone(); // Start with day color
    if (elevation < 20 && elevation > -5) { // Sunset/Sunrise/Twilight range
        const sunsetFactor = Math.max(0, Math.min(1, (20 - elevation) / 25)); // 0 at 20deg, 1 at -5deg
        fogColor.lerpColors(dayColor, sunsetColor, Math.min(sunsetFactor * 1.5, 1)); // Lerp towards sunset color
        fogColor.lerp(nightColor, Math.max(0, (10 - elevation)/15)); // Lerp towards night color as elevation drops below 10
    } else if (elevation <= -5) { // Deep Night
        fogColor = nightColor;
    }

    scene.fog.color.copy(fogColor);
    // scene.background = fogColor; // Optionally set background to fog color for consistency

    // --- Update UI Time Indicator ---
    const timeProgress = document.getElementById('time-progress');
    if (timeProgress) {
        timeProgress.style.width = (timeOfDay * 100) + '%';
    }
    const sunMoon = document.getElementById('sun-moon');
    if (sunMoon) {
        sunMoon.style.left = (timeOfDay * 100) + '%'; // Position based on %
        if (elevation < 5) { // Night time (moon)
            sunMoon.style.background = '#ccc';
            sunMoon.style.boxShadow = '0 0 5px #fff'; // Moon glow
        } else { // Day time (sun)
            sunMoon.style.background = '#ffcc00';
            sunMoon.style.boxShadow = '0 0 8px #ffcc00'; // Sun glow
        }
    }
}
